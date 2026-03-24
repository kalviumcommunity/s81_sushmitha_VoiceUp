const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['twitter', 'facebook', 'instagram', 'linkedin', 'website'],
    required: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  }
});

const userProfileSchema = new mongoose.Schema({
  avatar: String,
  bio: {
    type: String,
    maxlength: 500
  },
  interests: [{
    type: String,
    enum: ['climate', 'education', 'health', 'equality', 'governance', 'environment', 'social-justice', 'human-rights']
  }],
  skills: [String],
  socialLinks: [socialLinkSchema]
});

const notificationSettingsSchema = new mongoose.Schema({
  email: {
    campaigns: { type: Boolean, default: true },
    petitions: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true }
  },
  sms: {
    campaigns: { type: Boolean, default: false },
    petitions: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    achievements: { type: Boolean, default: false },
    reminders: { type: Boolean, default: true }
  },
  inApp: {
    campaigns: { type: Boolean, default: true },
    petitions: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true }
  }
});

const privacySettingsSchema = new mongoose.Schema({
  profileVisibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  showInLeaderboard: { type: Boolean, default: true },
  allowDirectMessages: { type: Boolean, default: true },
  shareActivityFeed: { type: Boolean, default: true }
});

const userPreferencesSchema = new mongoose.Schema({
  notifications: notificationSettingsSchema,
  privacy: privacySettingsSchema,
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de']
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
});

const achievementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'FIRST_CAMPAIGN', 'CAMPAIGN_CREATOR', 'PETITION_SIGNER', 'EVENT_ORGANIZER',
      'COMMUNITY_BUILDER', 'IMPACT_MAKER', 'MILESTONE_ACHIEVER', 'SOCIAL_ADVOCATE'
    ],
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  description: String
});

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{9,14}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['User', 'Advocate', 'Organizer', 'Admin'],
    default: 'User'
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  location: {
    type: String,
    maxlength: 200
  },
  profile: userProfileSchema,
  preferences: userPreferencesSchema,
  impactPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  achievements: [achievementSchema],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ impactPoints: -1 });
userSchema.index({ 'achievements.type': 1 });
userSchema.index({ lastActive: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to add achievement
userSchema.methods.addAchievement = function(type, description, level = 1) {
  const existingAchievement = this.achievements.find(a => a.type === type);
  
  if (!existingAchievement) {
    this.achievements.push({
      type,
      description,
      level,
      earnedAt: new Date()
    });
    return true;
  }
  
  return false; // Achievement already exists
};

// Method to calculate total impact points
userSchema.methods.calculateImpactPoints = function() {
  // This will be implemented with actual activity data
  return this.impactPoints;
};

// Method to clean expired refresh tokens
userSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    tokenObj => tokenObj.expiresAt > new Date()
  );
  return this.save();
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;