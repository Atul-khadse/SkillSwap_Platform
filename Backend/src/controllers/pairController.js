// controllers/pairController.js
const MatchedPair = require('../models/MatchedPair');

// @desc    Get matched pair by ID
// @route   GET /api/pairs/:id
// @access  Private
const getPair = async (req, res) => {
  try {
    const pair = await MatchedPair.findById(req.params.id)
      .populate('user1', 'name email avatar skillsOffered skillsNeeded')
      .populate('user2', 'name email avatar skillsOffered skillsNeeded');

    if (!pair) {
      return res.status(404).json({ message: 'Pair not found' });
    }

    // Check if user is part of the pair
    if (pair.user1._id.toString() !== req.user._id.toString() && 
        pair.user2._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(pair);
  } catch (error) {
    console.error('Error fetching pair:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPair };