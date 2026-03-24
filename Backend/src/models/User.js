// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  location: {
    type: String,
    default: ''
  },
  timezone: {
    type: String,
    default: ''
  },
  skillsOffered: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    description: {
      type: String,
      default: ''
    }
  }],
  skillsNeeded: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
   ratingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  completedPairsCount: {
  type: Number,
  default: 0
}
}, {
  timestamps: true,
});

// Remove the pre-save hook for now and handle password hashing manually
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method to hash password
userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Method to update user without triggering password hash
userSchema.methods.updateProfile = async function(updateData) {
  // Don't update password through this method
  if (updateData.password) {
    delete updateData.password;
  }
  
  Object.keys(updateData).forEach(key => {
    if (key !== 'password' && updateData[key] !== undefined) {
      this[key] = updateData[key];
    }
  });
  
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);