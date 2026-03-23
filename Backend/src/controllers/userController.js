const User = require('../models/User');
const MatchedPair = require('../models/MatchedPair');
const Session = require('../models/Session');

// @desc    Get all users for matching
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const { skill, level, location, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Base query: exclude current user
    let query = { _id: { $ne: req.user._id } };

    // Build $and conditions for combined filters
    let andConditions = [];

    if (skill) {
      andConditions.push({
        $or: [
          { 'skillsOffered.name': new RegExp(skill, 'i') },
          { 'skillsNeeded.name': new RegExp(skill, 'i') }
        ]
      });
    }

    if (location) {
      andConditions.push({
        location: new RegExp(location, 'i')
      });
    }

    if (level) {
      andConditions.push({
        $or: [
          { 'skillsOffered.level': level },
          { 'skillsNeeded.level': level }
        ]
      });
    }

    if (andConditions.length) {
      query.$and = andConditions;
    }

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select('-password') // exclude password
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(limitInt);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users by skills
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { skill, offer, need } = req.query;
    const query = { _id: { $ne: req.user._id } };

    if (skill) {
      if (offer === 'true') {
        query['skillsOffered.name'] = new RegExp(skill, 'i');
      } else if (need === 'true') {
        query['skillsNeeded.name'] = new RegExp(skill, 'i');
      } else {
        query.$or = [
          { 'skillsOffered.name': new RegExp(skill, 'i') },
          { 'skillsNeeded.name': new RegExp(skill, 'i') }
        ];
      }
    }

    const users = await User.find(query)
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get potential matches for user
// @route   GET /api/users/matches
// @access  Private
const getPotentialMatches = async (req, res) => {
  try {
    console.log('Finding potential matches for user:', req.user._id);
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current user skills:', {
      offered: user.skillsOffered.map(s => s.name),
      needed: user.skillsNeeded.map(s => s.name)
    });

    // Build query without isAvailable
    const query = {
      _id: { $ne: user._id },
      $or: [
        {
          'skillsNeeded.name': { 
            $in: user.skillsOffered.map(s => s.name) 
          }
        },
        {
          'skillsOffered.name': { 
            $in: user.skillsNeeded.map(s => s.name) 
          }
        }
      ]
    };

    console.log('Query for potential matches:', JSON.stringify(query, null, 2));

    const potentialMatches = await User.find(query)
      .select('-password')
      .limit(20);

    console.log(`Found ${potentialMatches.length} potential matches`);

    if (potentialMatches.length === 0) {
      // If no skill matches, try to get any users (except current)
      console.log('No skill matches found, getting all other users');
      const allUsers = await User.find({ _id: { $ne: user._id } })
        .select('-password')
        .limit(20);
      
      console.log(`Found ${allUsers.length} other users`);
      
      const matchesWithScore = allUsers.map(match => ({
        ...match.toObject(),
        matchScore: 0 // No match score since no skill overlap
      }));
      
      return res.json(matchesWithScore);
    }

    // Calculate match score for each potential match
    const matchesWithScore = potentialMatches.map(match => {
      let score = 0;
      
      // Check skill compatibility
      user.skillsOffered.forEach(offeredSkill => {
        match.skillsNeeded.forEach(neededSkill => {
          if (offeredSkill.name.toLowerCase() === neededSkill.name.toLowerCase()) {
            score += 10;
          }
        });
      });

      user.skillsNeeded.forEach(neededSkill => {
        match.skillsOffered.forEach(offeredSkill => {
          if (neededSkill.name.toLowerCase() === offeredSkill.name.toLowerCase()) {
            score += 10;
          }
        });
      });

      // Location bonus
      if (user.location && match.location && 
          user.location.toLowerCase() === match.location.toLowerCase()) {
        score += 5;
      }

      return {
        ...match.toObject(),
        matchScore: score
      };
    });

    // Sort by match score
    matchesWithScore.sort((a, b) => b.matchScore - a.matchScore);

    console.log('Returning matches with scores');
    res.json(matchesWithScore);
  } catch (error) {
    console.error('Error in getPotentialMatches:', error);
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get user's matched pairs
// @route   GET /api/users/me/pairs
// @access  Private
const getUserPairs = async (req, res) => {
  try {
    const matchedPairs = await MatchedPair.find({
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ],
      status: 'active'
    })
    .populate('user1', 'name email avatar skillsOffered skillsNeeded')
    .populate('user2', 'name email avatar skillsOffered skillsNeeded');

    res.json(matchedPairs);
  } catch (error) {
    console.error('Error fetching user pairs:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's upcoming sessions
// @route   GET /api/users/me/sessions/upcoming
// @access  Private
const getUpcomingSessions = async (req, res) => {
  try {
    // Find matched pairs for the user
    const matchedPairs = await MatchedPair.find({
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ],
      status: 'active'
    }).select('_id');

    const pairIds = matchedPairs.map(pair => pair._id);

    // Get upcoming sessions for these pairs
    const upcomingSessions = await Session.find({
      matchedPair: { $in: pairIds },
      status: 'scheduled',
      scheduledTime: { $gte: new Date() }
    })
    .populate('teacher', 'name avatar')
    .populate('student', 'name avatar')
    .populate('matchedPair')
    .sort({ scheduledTime: 1 })
    .limit(5);

    res.json(upcomingSessions);
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  searchUsers,
  getPotentialMatches,
  getUserPairs,
  getUpcomingSessions
};