const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  matchedPair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchedPair',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);