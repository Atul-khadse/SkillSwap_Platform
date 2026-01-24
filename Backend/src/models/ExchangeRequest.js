const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillOffered: {
    name: String,
    level: String
  },
  skillRequested: {
    name: String,
    level: String
  },
  message: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  proposedTimes: [{
    date: Date,
    time: String,
    duration: Number // in minutes
  }],
  matchedPairId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchedPair'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);