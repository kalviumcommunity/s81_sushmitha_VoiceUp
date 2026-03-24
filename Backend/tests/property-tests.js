const fc = require('fast-check');
const mongoose = require('mongoose');
const User = require('../models/UserSchema');
const Campaign = require('../models/CampaignSchema');
const Petition = require('../models/PetitionSchema');

describe('Property-Based Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/voiceup_test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Petition.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Petition Signature Uniqueness Property', () => {
    it('should ensure each user can sign a petition at most once', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 10, maxLength: 15 }), { minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 100, max: 10000 }),
          async (userPhones, petitionTitle, petitionDescription, signatureGoal) => {
            // Create users
            const users = [];
            for (const phone of userPhones) {
              try {
                const user = new User({
                  phoneNumber: `+${phone}`,
                  password: 'testpassword123',
                  fullName: `User ${phone}`
                });
                const savedUser = await user.save();
                users.push(savedUser);
              } catch (error) {
                // Skip duplicate phone numbers
                continue;
              }
            }

            if (users.length === 0) return true;

            // Create petition
            const petition = new Petition({
              title: petitionTitle,
              description: petitionDescription,
              targetOfficial: 'Test Official',
              targetInstitution: 'Test Institution',
              signatureGoal,
              createdBy: users[0]._id,
              status: 'active'
            });
            await petition.save();

            // Try to sign petition multiple times with same users
            const signaturePromises = [];
            for (const user of users) {
              // Try to sign twice
              signaturePromises.push(
                petition.addSignature({
                  user: user._id,
                  fullName: user.fullName,
                  verified: true
                }).catch(() => null) // Ignore errors for duplicate signatures
              );
              signaturePromises.push(
                petition.addSignature({
                  user: user._id,
                  fullName: user.fullName,
                  verified: true
                }).catch(() => null) // This should fail
              );
            }

            await Promise.all(signaturePromises);

            // Verify uniqueness: each user should appear at most once
            const userSignatureCounts = new Map();
            petition.signatures.forEach(signature => {
              const userId = signature.user.toString();
              userSignatureCounts.set(userId, (userSignatureCounts.get(userId) || 0) + 1);
            });

            // Property: No user should have more than 1 signature
            for (const count of userSignatureCounts.values()) {
              if (count > 1) {
                return false;
              }
            }

            // Property: Signature count should equal unique users
            return petition.currentSignatures === userSignatureCounts.size;
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    });
  });

  describe('Impact Score Monotonicity Property', () => {
    it('should ensure impact scores are non-decreasing over time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              type: fc.constantFrom('view', 'support', 'share', 'engagement'),
              value: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (activities) => {
            // Create user and campaign
            const user = new User({
              phoneNumber: '+1234567890',
              password: 'testpassword123',
              fullName: 'Test User'
            });
            await user.save();

            const campaign = new Campaign({
              title: 'Test Campaign',
              description: 'Test description',
              category: 'climate',
              targetAudience: 'Government',
              createdBy: user._id
            });
            await campaign.save();

            let previousScore = campaign.metrics.impactScore || 0;
            
            // Apply activities sequentially
            for (const activity of activities) {
              campaign.updateMetrics(activity.type, activity.value);
              await campaign.save();
              
              const currentScore = campaign.metrics.impactScore;
              
              // Property: Impact score should be non-decreasing
              if (currentScore < previousScore) {
                return false;
              }
              
              previousScore = currentScore;
            }

            return true;
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  describe('Campaign Goal Consistency Property', () => {
    it('should ensure campaign goal progress is always within valid bounds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              type: fc.constantFrom('petition_signatures', 'event_attendance', 'fundraising'),
              target: fc.integer({ min: 100, max: 10000 }),
              progress: fc.integer({ min: 0, max: 15000 }) // Can exceed target
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (goals) => {
            // Create user and campaign
            const user = new User({
              phoneNumber: '+1234567890',
              password: 'testpassword123',
              fullName: 'Test User'
            });
            await user.save();

            const campaignGoals = goals.map(goal => ({
              type: goal.type,
              target: goal.target,
              current: Math.min(goal.progress, goal.target), // Ensure current <= target initially
              description: `Goal for ${goal.type}`
            }));

            const campaign = new Campaign({
              title: 'Test Campaign',
              description: 'Test description',
              category: 'climate',
              targetAudience: 'Government',
              createdBy: user._id,
              goals: campaignGoals
            });
            await campaign.save();

            // Verify properties for all goals
            for (const goal of campaign.goals) {
              // Property 1: Current progress should be non-negative
              if (goal.current < 0) {
                return false;
              }
              
              // Property 2: Target should be positive
              if (goal.target <= 0) {
                return false;
              }
              
              // Property 3: If goal is marked as completed, current should equal or exceed target
              if (goal.isCompleted && goal.current < goal.target) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  describe('User Achievement Uniqueness Property', () => {
    it('should ensure users cannot earn the same achievement multiple times', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              'FIRST_CAMPAIGN', 'CAMPAIGN_CREATOR', 'PETITION_SIGNER', 
              'EVENT_ORGANIZER', 'COMMUNITY_BUILDER'
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (achievementTypes) => {
            // Create user
            const user = new User({
              phoneNumber: '+1234567890',
              password: 'testpassword123',
              fullName: 'Test User'
            });
            await user.save();

            // Try to add achievements (including duplicates)
            for (const achievementType of achievementTypes) {
              user.addAchievement(achievementType, `Description for ${achievementType}`);
            }
            await user.save();

            // Property: Each achievement type should appear at most once
            const achievementCounts = new Map();
            user.achievements.forEach(achievement => {
              const type = achievement.type;
              achievementCounts.set(type, (achievementCounts.get(type) || 0) + 1);
            });

            for (const count of achievementCounts.values()) {
              if (count > 1) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  describe('Event Capacity Constraints Property', () => {
    it('should ensure event attendance never exceeds maximum capacity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 100 }), // maxCapacity
          fc.array(fc.string({ minLength: 10, maxLength: 15 }), { minLength: 1, maxLength: 200 }), // user phones
          async (maxCapacity, userPhones) => {
            // Create users
            const users = [];
            for (const phone of userPhones) {
              try {
                const user = new User({
                  phoneNumber: `+${phone}`,
                  password: 'testpassword123',
                  fullName: `User ${phone}`
                });
                const savedUser = await user.save();
                users.push(savedUser);
              } catch (error) {
                // Skip duplicate phone numbers
                continue;
              }
            }

            if (users.length === 0) return true;

            // Create organizer
            const organizer = new User({
              phoneNumber: '+0000000000',
              password: 'testpassword123',
              fullName: 'Organizer',
              role: 'Organizer'
            });
            await organizer.save();

            // Create event with capacity
            const Event = require('../models/EventSchema');
            const event = new Event({
              title: 'Test Event',
              description: 'Test event description',
              type: 'workshop',
              location: {
                type: 'physical',
                address: 'Test Address'
              },
              startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
              organizer: organizer._id,
              maxCapacity,
              status: 'published'
            });
            await event.save();

            // Try to register all users
            for (const user of users) {
              try {
                event.registerAttendee(user._id);
                await event.save();
              } catch (error) {
                // Registration might fail due to capacity or duplicate registration
                continue;
              }
            }

            // Property: Attendee count should never exceed max capacity
            return event.currentAttendees <= maxCapacity;
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  describe('Password Hashing Consistency Property', () => {
    it('should ensure password hashing is consistent and secure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 15 }),
          async (password, phoneNumber) => {
            // Create user with password
            const user = new User({
              phoneNumber: `+${phoneNumber}`,
              password,
              fullName: 'Test User'
            });
            await user.save();

            // Property 1: Password should be hashed (not stored in plain text)
            if (user.password === password) {
              return false;
            }

            // Property 2: comparePassword should work correctly
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
              return false;
            }

            // Property 3: Wrong password should not match
            const isInvalidPassword = await user.comparePassword(password + 'wrong');
            if (isInvalidPassword) {
              return false;
            }

            return true;
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    });
  });
});