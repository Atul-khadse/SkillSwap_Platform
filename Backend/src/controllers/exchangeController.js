const ExchangeRequest = require('../models/ExchangeRequest');
const MatchedPair = require('../models/MatchedPair');
const User = require('../models/User');

// @desc    Send exchange request
// @route   POST /api/exchange/request
// @access  Private
const sendExchangeRequest = async (req, res) => {
  try {
    const { recipientId, skillOffered, skillRequested, message, proposedTimes } = req.body;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if request already exists
    const existingRequest = await ExchangeRequest.findOne({
      requester: req.user._id,
      recipient: recipientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    // Create new request
    const exchangeRequest = await ExchangeRequest.create({
      requester: req.user._id,
      recipient: recipientId,
      skillOffered,
      skillRequested,
      message,
      proposedTimes,
      status: 'pending'
    });

    res.status(201).json(exchangeRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's exchange requests
// @route   GET /api/exchange/requests
// @access  Private
const getExchangeRequests = async (req, res) => {
  try {
    const { type = 'received' } = req.query;
    
    let query;
    if (type === 'sent') {
      query = { requester: req.user._id };
    } else {
      query = { recipient: req.user._id };
    }

    const requests = await ExchangeRequest.find(query)
      .populate('requester', 'name email avatar skillsOffered skillsNeeded')
      .populate('recipient', 'name email avatar skillsOffered skillsNeeded')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept exchange request
// @route   PUT /api/exchange/requests/:id/accept
// @access  Private
const acceptExchangeRequest = async (req, res) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id)
      .populate('requester')
      .populate('recipient');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the recipient
    if (request.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if a matched pair already exists between these users
    const existingPair = await MatchedPair.findOne({
      $or: [
        { user1: request.requester._id, user2: request.recipient._id },
        { user1: request.recipient._id, user2: request.requester._id }
      ],
      status: 'active'
    });

    if (existingPair) {
      return res.status(400).json({ message: 'Already matched with this user' });
    }

    // Create matched pair - IMPORTANT: Set user1 as requester and user2 as recipient
    const matchedPair = await MatchedPair.create({
      user1: request.requester._id,
      user2: request.recipient._id,
      skill1To2: request.skillOffered,
      skill2To1: request.skillRequested,
      status: 'active'
    });

    // Update request status
    request.status = 'accepted';
    request.matchedPairId = matchedPair._id;
    await request.save();

    // Update users' session counts
    await User.findByIdAndUpdate(request.requester._id, {
      $inc: { totalSessions: 1 }
    });

    await User.findByIdAndUpdate(request.recipient._id, {
      $inc: { totalSessions: 1 }
    });

    // Populate the response with user details
    const populatedPair = await MatchedPair.findById(matchedPair._id)
      .populate('user1', 'name email avatar')
      .populate('user2', 'name email avatar');

    res.json({
      message: 'Request accepted',
      matchedPair: populatedPair,
      request
    });
  } catch (error) {
    console.error('Error accepting exchange request:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject exchange request
// @route   PUT /api/exchange/requests/:id/reject
// @access  Private
const rejectExchangeRequest = async (req, res) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendExchangeRequest,
  getExchangeRequests,
  acceptExchangeRequest,
  rejectExchangeRequest,
};