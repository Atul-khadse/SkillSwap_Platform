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

const completePair = async (req, res) => {
  try {
    const pair = await MatchedPair.findById(req.params.id);
    if (!pair) {
      return res.status(404).json({ message: 'Pair not found' });
    }
    if (pair.status !== 'active') {
      return res.status(400).json({ message: 'Pair is not active' });
    }
    // Check authorization
    if (pair.user1.toString() !== req.user._id.toString() && 
        pair.user2.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    pair.status = 'completed';
    await pair.save();

    // Increment completed pairs count for both users
    await User.findByIdAndUpdate(pair.user1, { $inc: { completedPairsCount: 1 } });
    await User.findByIdAndUpdate(pair.user2, { $inc: { completedPairsCount: 1 } });

    res.json({ message: 'Pair marked as completed' });
  } catch (error) {
    console.error('Error completing pair:', error);
    res.status(500).json({ message: error.message });
  }
};

// controllers/pairController.js
const completeUserTeaching = async (req, res) => {
  try {
    const pair = await MatchedPair.findById(req.params.id);
    if (!pair) return res.status(404).json({ message: 'Pair not found' });

    const userId = req.user._id.toString();

    // Determine which user this is and set their completion flag
    if (pair.user1.toString() === userId) {
      pair.user1Completed = true;
    } else if (pair.user2.toString() === userId) {
      pair.user2Completed = true;
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pair.save();

    // If both are now completed, finalize the pair
    if (pair.user1Completed && pair.user2Completed && pair.status === 'active') {
      pair.status = 'completed';
      await pair.save();

      // Increment completedPairsCount for both users
      await User.findByIdAndUpdate(pair.user1, { $inc: { completedPairsCount: 1 } });
      await User.findByIdAndUpdate(pair.user2, { $inc: { completedPairsCount: 1 } });
    }

    res.json({
      message: 'Teaching marked as complete',
      pairStatus: pair.status,
      user1Completed: pair.user1Completed,
      user2Completed: pair.user2Completed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPair, completePair, completeUserTeaching };

