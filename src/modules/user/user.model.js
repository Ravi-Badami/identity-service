const mongoose = require("mongoose");
const crypto = require('crypto');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,  // Keeps automatic unique index
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: '{VALUE} is not a valid role'
    },
    default: 'user'
  },
  refreshToken: {
    type: String,
    select: false // standard practice to hide tokens
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
})

// Follows ESR: Equality (role) → Sort (createdAt)
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ name: 1 });


// Generate and hash password token
userSchema.methods.getVerificationToken = function() {
  // 1. Generate token (random bytes)
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // 2. Hash token and set to schema field
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // 3. Set expire (10 mins)
  this.verificationTokenExpire = Date.now() + 10 * 60 * 1000;

  // 4. Return original token (to send in email)
  return verificationToken;
};


module.exports = mongoose.model('User', userSchema);
