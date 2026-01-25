const User = require('../models/User');
const { generateToken } = require('../middleware/auth');



// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    console.log('\n=== REGISTRATION REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { name, email, password, skillsOffered, skillsNeeded } = req.body;

    // Log what we're getting
    console.log('Parsed fields:', {
      name: !!name,
      email: !!email,
      password: !!password ? '***' : 'missing',
      skillsOffered: skillsOffered ? `Array(${skillsOffered.length})` : 'none',
      skillsNeeded: skillsNeeded ? `Array(${skillsNeeded.length})` : 'none'
    });

    // Validation
    if (!name || !email || !password) {
      console.log('Validation failed - missing fields:', { name, email, password: !!password });
      return res.status(400).json({ 
        message: 'Please provide all required fields (name, email, password)',
        received: { name: !!name, email: !!email, password: !!password }
      });
    }

    console.log('Checking if user exists...');
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists for email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Hashing password...');
    // Hash password manually
    const hashedPassword = await User.hashPassword(password);
    console.log('Password hashed successfully');

    console.log('Creating user...');
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      skillsOffered: skillsOffered || [],
      skillsNeeded: skillsNeeded || [],
    });

    console.log('User created successfully:', {
      id: user._id,
      name: user.name,
      email: user.email
    });

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error',
        hint: 'Check JWT_SECRET environment variable'
      });
    }

    const token = generateToken(user._id);
    console.log('JWT token generated');

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
      skillsOffered: user.skillsOffered,
      skillsNeeded: user.skillsNeeded
    });

  } catch (error) {
    console.error('\n=== REGISTRATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Handle specific mongoose errors
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: messages 
      });
    }
    
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({ 
        message: 'Email already exists',
        field: Object.keys(error.keyValue)[0]
      });
    }
    
    // Handle database connection errors
    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      console.error('Database error:', error);
      return res.status(500).json({ 
        message: 'Database connection error',
        hint: 'Check MongoDB connection string'
      });
    }
    
    console.error('Unknown error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
};



// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        timezone: user.timezone,
        skillsOffered: user.skillsOffered,
        skillsNeeded: user.skillsNeeded,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use the updateProfile method which doesn't trigger password hashing
    await user.updateProfile(req.body);

    // Get updated user without password
    const updatedUser = await User.findById(req.user._id).select('-password');
    
    res.json(updatedUser);
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};