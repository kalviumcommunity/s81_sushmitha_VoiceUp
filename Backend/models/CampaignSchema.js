const mongoose = require('mongoose');

const campaignGoalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['petition_signatures', 'event_attendance', 'fundraising', 'awareness', 'policy_change'],
    required: true
  },
  target: {
    type: Number,
    required: true,
    min: 1
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: Date,
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const timelinePhaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  startDate: Date,
  endDate: Date,
  duration: Number, // in days
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  milestones: [{
    name: String,
    description: String,
    targetDate: Date,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date
  }]
});

const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['document', 'image', 'video', 'link', 'template'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: String,
  url: String,
  fileSize: Number,
  mimeType: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const campaignMetricsSchema = new mongoose.Schema({
  views: { type: Number, default: 0 },
  supporters: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  impactScore: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  reachMetrics: {
    totalReach: { type: Number, default: 0 },
    organicReach: { type: Number, default: 0 },
    socialReach: { type: Number, default: 0 }
  },
  demographicData: {
    ageGroups: {
      '18-24': { type: Number, default: 0 },
      '25-34': { type: Number, default: 0 },
      '35-44': { type: Number, default: 0 },
      '45-54': { type: Number, default: 0 },
      '55+': { type: Number, default: 0 }
    },
    locations: [{
      country: String,
      region: String,
      count: Number
    }]
  }
});

const collaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor', 'viewer'],
    default: 'editor'
  },
  permissions: [{
    type: String,
    enum: ['edit_content', 'manage_collaborators', 'view_analytics', 'delete_campaign', 'manage_resources']
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 5000
  },
  category: {
    type: String,
    required: true,
    enum: ['climate', 'education', 'health', 'equality', 'governance', 'environment', 'social-justice', 'human-rights', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [collaboratorSchema],
  targetAudience: {
    type: String,
    required: true,
    maxlength: 500
  },
  goals: [campaignGoalSchema],
  timeline: {
    startDate: Date,
    endDate: Date,
    phases: [timelinePhaseSchema]
  },
  resources: [resourceSchema],
  metrics: campaignMetricsSchema,
  tags: [{
    type: String,
    maxlength: 50
  }],
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  socialLinks: [{
    platform: {
      type: String,
      enum: ['twitter', 'facebook', 'instagram', 'linkedin', 'website']
    },
    url: String
  }],
  featuredImage: {
    url: String,
    alt: String,
    caption: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotedUntil: Date,
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNotes: String,
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ visibility: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ 'location.country': 1 });
campaignSchema.index({ 'metrics.impactScore': -1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ lastActivityAt: -1 });
campaignSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for completion percentage
campaignSchema.virtual('completionPercentage').get(function() {
  if (!this.goals || this.goals.length === 0) return 0;
  
  const completedGoals = this.goals.filter(goal => goal.isCompleted).length;
  return Math.round((completedGoals / this.goals.length) * 100);
});

// Virtual for supporter count
campaignSchema.virtual('supporterCount').get(function() {
  return this.metrics ? this.metrics.supporters : 0;
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  if (!this.timeline || !this.timeline.endDate) return null;
  
  const now = new Date();
  const endDate = new Date(this.timeline.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

// Method to add collaborator
campaignSchema.methods.addCollaborator = function(userId, role = 'editor', permissions = [], invitedBy) {
  const existingCollaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    return false; // Already a collaborator
  }
  
  this.collaborators.push({
    user: userId,
    role,
    permissions,
    invitedBy
  });
  
  return true;
};

// Method to remove collaborator
campaignSchema.methods.removeCollaborator = function(userId) {
  const initialLength = this.collaborators.length;
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );
  
  return this.collaborators.length < initialLength;
};

// Method to update metrics
campaignSchema.methods.updateMetrics = function(metricType, value) {
  if (!this.metrics) {
    this.metrics = {};
  }
  
  switch (metricType) {
    case 'view':
      this.metrics.views = (this.metrics.views || 0) + 1;
      break;
    case 'support':
      this.metrics.supporters = (this.metrics.supporters || 0) + value;
      break;
    case 'share':
      this.metrics.shares = (this.metrics.shares || 0) + 1;
      break;
    case 'engagement':
      this.metrics.engagement = (this.metrics.engagement || 0) + value;
      break;
  }
  
  // Update last activity
  this.lastActivityAt = new Date();
  
  // Recalculate impact score
  this.calculateImpactScore();
};

// Method to calculate impact score
campaignSchema.methods.calculateImpactScore = function() {
  const metrics = this.metrics || {};
  
  const viewsScore = (metrics.views || 0) * 0.1;
  const supportersScore = (metrics.supporters || 0) * 2;
  const sharesScore = (metrics.shares || 0) * 1.5;
  const engagementScore = (metrics.engagement || 0) * 0.5;
  
  // Bonus for goal completion
  const completionBonus = this.completionPercentage * 10;
  
  this.metrics.impactScore = Math.round(
    viewsScore + supportersScore + sharesScore + engagementScore + completionBonus
  );
};

// Method to check if user can edit
campaignSchema.methods.canUserEdit = function(userId) {
  // Owner can always edit
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // Check collaborator permissions
  const collaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (!collaborator) return false;
  
  return ['owner', 'admin', 'editor'].includes(collaborator.role) ||
         collaborator.permissions.includes('edit_content');
};

// Pre-save middleware
campaignSchema.pre('save', function(next) {
  // Update last activity timestamp
  this.lastActivityAt = new Date();
  
  // Calculate impact score if metrics changed
  if (this.isModified('metrics')) {
    this.calculateImpactScore();
  }
  
  next();
});

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;