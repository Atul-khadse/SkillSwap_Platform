const mongoose = require('mongoose');

const matchedPairSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill1To2: {
    name: String,
    level: String
  },
  skill2To1: {
    name: String,
    level: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'terminated'],
    default: 'active'
  },
  totalSessionsCompleted: {
    type: Number,
    default: 0
  },
  nextSession: {
    date: Date,
    duration: Number,
    topic: String
  },
  sharedResources: [{
    name: String,
    type: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  goals: [{
    description: String,
    completed: Boolean,
    deadline: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('MatchedPair', matchedPairSchema);