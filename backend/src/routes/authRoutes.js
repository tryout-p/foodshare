import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Notification } from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendOTPEmail } from '../utils/mailer.js';

const router = express.Router();

// Short-term store for pending password changes mapping userId to { hashedNewPassword, otp, expiresAt }
const passwordOtpStore = new Map();

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'foodshare_secret_key_2026', {
    expiresIn: '30d',
  });
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, contactNumber, address } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (contactNumber && !validatePhone(contactNumber)) {
      return res.status(400).json({ message: 'Please provide a valid contact number (10-13 digits)' });
    }

    // Check if role is valid
    if (!['Admin', 'Donor', 'NGO'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be Admin, Donor, or NGO' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      contactNumber: contactNumber || '',
      address: address || '',
    });

    if (user) {
      // Create system notification for registration
      await Notification.create({
        recipient: user._id.toString(),
        title: 'Welcome to FoodShare!',
        message: `Hello ${user.name}, your account as a ${user.role} has been successfully registered.`,
        type: 'Registration',
        read: false
      });

      // Notify admins
      await Notification.create({
        recipient: 'All',
        title: 'New User Registered',
        message: `A new user ${user.name} (${user.role}) has registered on the platform.`,
        type: 'Registration',
        read: false
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        address: user.address,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      address: user.address,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        address: user.address,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.contactNumber !== undefined && !validatePhone(req.body.contactNumber)) {
        return res.status(400).json({ message: 'Please provide a valid contact number (10-13 digits)' });
      }

      const updateData = {
        name: req.body.name || user.name,
        contactNumber: req.body.contactNumber !== undefined ? req.body.contactNumber : user.contactNumber,
        address: req.body.address !== undefined ? req.body.address : user.address,
      };

      const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        contactNumber: updatedUser.contactNumber,
        address: updatedUser.address,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Request Password Change OTP
// @route   POST /api/auth/password/send-otp
// @access  Private
router.post('/password/send-otp', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current password and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password matches DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password early so we don't store plain text passwords in memory
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Valid for 5 minutes

    // Store in-memory
    passwordOtpStore.set(req.user._id.toString(), {
      hashedNewPassword,
      otp,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.name);

    res.json({ message: 'Verification OTP sent to your registered email' });
  } catch (error) {
    console.error('OTP request error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify OTP and change user password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, async (req, res) => {
  const { otp } = req.body;

  try {
    if (!otp) {
      return res.status(400).json({ message: 'Please provide the OTP code' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve pending password update record
    const pendingRequest = passwordOtpStore.get(user._id.toString());
    if (!pendingRequest) {
      return res.status(400).json({ message: 'No pending password change request found or session has expired' });
    }

    // Check expiration
    if (Date.now() > pendingRequest.expiresAt) {
      passwordOtpStore.delete(user._id.toString());
      return res.status(400).json({ message: 'Verification OTP has expired. Please try again.' });
    }

    // Verify OTP code matching
    if (pendingRequest.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification OTP' });
    }

    // Save pre-hashed password to database
    await User.findByIdAndUpdate(user._id, { password: pendingRequest.hashedNewPassword });

    // Clear verification cache
    passwordOtpStore.delete(user._id.toString());

    // Notify user in system notifications
    await Notification.create({
      recipient: user._id.toString(),
      title: 'Password Changed Successfully',
      message: 'Your account password has been updated successfully.',
      type: 'Info',
      read: false
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change verification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
