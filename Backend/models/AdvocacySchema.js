const mongoose = require('mongoose');

const AdvocacySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  causeCategory: {
    type: String,
    enum: ['climate', 'education', 'health', 'equality', 'governance', 'other'],
    default: 'other'
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['open', 'in progress', 'resolved'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Advocacy', AdvocacySchema);
