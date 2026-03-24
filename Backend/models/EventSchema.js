const mongoose = require('mongoose');

const eventLocationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['physical', 'virtual', 'hybrid'],
    required: true
  },
  address: String,
  city: String,
  country: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  virtualLink: String,
  accessInstructions: String
});

const attendeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'attended', 'no_show', 'cancelled'],
    default: 'registered'
  },
  checkedInAt: Date,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }
});

const waitlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  position: Number,
  notified: {
    type: Boolean,
    default: false
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  type: {
    type: String,
    enum: ['rally', 'workshop', 'meeting', 'protest', 'fundraiser', 'awareness', 'training', 'other'],
    required: true
  },
  location: eventLocationSchema,
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [attendeeSchema],
  waitlist: [waitlistSchema],
  maxCapacity: {
    type: Number,
    min: 1
  },
  currentAttendees: {
    type: Number,
    default: 0
  },
  requirements: [String],
  resources: [{
    type: String,
    title: String,
    description: String,
    url: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  tags: [String],
  featuredImage: {
    url: String,
    alt: String
  },
  remindersSent: {
    day: { type: Boolean, default: false },
    hour: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ organizer: 1 });
eventSchema.index({ campaignId: 1 });
eventSchema.index({ startTime: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'location.type': 1 });

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  if (!this.maxCapacity) return null;
  return Math.max(0, this.maxCapacity - this.currentAttendees);
});

// Virtual for is full
eventSchema.virtual('isFull').get(function() {
  if (!this.maxCapacity) return false;
  return this.currentAttendees >= this.maxCapacity;
});

// Method to register attendee
eventSchema.methods.registerAttendee = function(userId) {
  // Check if already registered
  const existingAttendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (existingAttendee) {
    throw new Error('User is already registered for this event');
  }
  
  // Check capacity
  if (this.maxCapacity && this.currentAttendees >= this.maxCapacity) {
    // Add to waitlist
    this.addToWaitlist(userId);
    return { status: 'waitlisted' };
  }
  
  // Register attendee
  this.attendees.push({ user: userId });
  this.currentAttendees = this.attendees.length;
  
  return { status: 'registered' };
};

// Method to add to waitlist
eventSchema.methods.addToWaitlist = function(userId) {
  const existingWaitlist = this.waitlist.find(
    item => item.user.toString() === userId.toString()
  );
  
  if (existingWaitlist) {
    throw new Error('User is already on the waitlist');
  }
  
  this.waitlist.push({
    user: userId,
    position: this.waitlist.length + 1
  });
};

// Method to cancel registration
eventSchema.methods.cancelRegistration = function(userId) {
  const attendeeIndex = this.attendees.findIndex(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (attendeeIndex === -1) {
    throw new Error('User is not registered for this event');
  }
  
  // Remove attendee
  this.attendees.splice(attendeeIndex, 1);
  this.currentAttendees = this.attendees.length;
  
  // Promote from waitlist if available
  if (this.waitlist.length > 0) {
    const nextInLine = this.waitlist.shift();
    this.attendees.push({ user: nextInLine.user });
    this.currentAttendees = this.attendees.length;
    
    // Update waitlist positions
    this.waitlist.forEach((item, index) => {
      item.position = index + 1;
    });
    
    return { promoted: nextInLine.user };
  }
  
  return { promoted: null };
};

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
module.exports = Event;