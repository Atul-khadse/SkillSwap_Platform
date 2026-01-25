const Session = require('../models/Session');
const MatchedPair = require('../models/MatchedPair');



// @desc    Create a session
// @route   POST /api/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    console.log('Creating session with data:', req.body);
    
    const { matchedPairId, title, description, scheduledTime, duration, teacher, student, status } = req.body;

    const matchedPair = await MatchedPair.findById(matchedPairId);
    if (!matchedPair) {
      return res.status(404).json({ message: 'Matched pair not found' });
    }

    // Check if user is part of the matched pair
    if (matchedPair.user1.toString() !== req.user._id.toString() && 
        matchedPair.user2.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create session with provided data or defaults
    const sessionData = {
      matchedPair: matchedPairId,
      title: title || `${req.user.name}'s Session`,
      description: description || 'Real-time skill exchange session',
      scheduledTime: scheduledTime || new Date(),
      duration: duration || 60,
      teacher: teacher || req.user._id,
      student: student || (req.user._id.toString() === matchedPair.user1.toString() ? matchedPair.user2 : matchedPair.user1),
      status: status || 'scheduled'
    };

    // Add skills if they exist in the matched pair
    if (matchedPair.skill1To2 && matchedPair.skill2To1) {
      if (sessionData.teacher.toString() === matchedPair.user1.toString()) {
        sessionData.skillTaught = matchedPair.skill1To2 || { name: 'General Skills', level: 'intermediate' };
        sessionData.skillLearned = matchedPair.skill2To1 || { name: 'General Skills', level: 'beginner' };
      } else {
        sessionData.skillTaught = matchedPair.skill2To1 || { name: 'General Skills', level: 'intermediate' };
        sessionData.skillLearned = matchedPair.skill1To2 || { name: 'General Skills', level: 'beginner' };
      }
    } else {
      // Default skills if not specified
      sessionData.skillTaught = { name: 'General Skills', level: 'intermediate' };
      sessionData.skillLearned = { name: 'General Skills', level: 'beginner' };
    }

    const session = await Session.create(sessionData);

    console.log('Session created successfully:', session._id);

     // Update matched pair's next session
    matchedPair.nextSession = {
      date: scheduledTime,
      duration,
      topic: title
    };
    await matchedPair.save();



    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error creating session',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};







// @desc    Get sessions for matched pair
// @route   GET /api/sessions/pair/:pairId
// @access  Private
const getSessionsByPair = async (req, res) => {
  try {
    const { pairId } = req.params;
    const { status } = req.query;

    const matchedPair = await MatchedPair.findById(pairId);
    if (!matchedPair) {
      return res.status(404).json({ message: 'Matched pair not found' });
    }

    // Check if user is part of the matched pair
    if (matchedPair.user1.toString() !== req.user._id.toString() && 
        matchedPair.user2.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = { matchedPair: pairId };
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('teacher', 'name avatar')
      .populate('student', 'name avatar')
      .sort({ scheduledTime: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session status
// @route   PUT /api/sessions/:id/status
// @access  Private
const updateSessionStatus = async (req, res) => {
  try {
    const { status, meetingLink } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is part of the session
    if (session.teacher.toString() !== req.user._id.toString() && 
        session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.status = status;
    if (meetingLink) {
      session.meetingLink = meetingLink;
    }

    if (status === 'in-progress') {
      session.actualStartTime = new Date();
    } else if (status === 'completed') {
      session.actualEndTime = new Date();
      
      // Update matched pair's completed sessions count
      await MatchedPair.findByIdAndUpdate(session.matchedPair, {
        $inc: { totalSessionsCompleted: 1 }
      });
    }

    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add note to session
// @route   POST /api/sessions/:id/notes
// @access  Private
const addSessionNote = async (req, res) => {
  try {
    const { content } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is part of the session
    if (session.teacher.toString() !== req.user._id.toString() && 
        session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.notes.push({
      content,
      addedBy: req.user._id,
      addedAt: new Date()
    });

    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  getSessionsByPair,
  updateSessionStatus,
  addSessionNote,
};