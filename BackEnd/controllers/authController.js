import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { generateOTP, sendOTPVerification, sendPasswordResetEmail } from '../utils/emailService.js';

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, location } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email and password',
    });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Generate OTP for verification
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'buyer',
    location,
    otp: {
      code: otp,
      expiresAt: otpExpires,
    },
  });

  // Send OTP email (non-blocking)
  try {
    await sendOTPVerification(email, otp, name);
  } catch (error) {
    console.error('[AuthController] Failed to send OTP email:', error.message);
    // OTP is already logged to console by emailService
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email with OTP. Check console for OTP if email not configured.',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and OTP',
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified',
    });
  }

  // Check OTP
  if (!user.otp?.code || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }

  // Update user as verified
  user.isVerified = true;
  user.otp = { code: null, expiresAt: null };
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email',
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified',
    });
  }

  // Generate new OTP
  const otp = generateOTP();
  user.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  await user.save();

  // Send email (non-blocking)
  try {
    await sendOTPVerification(email, otp, user.name);
  } catch (error) {
    console.error('[AuthController] Failed to resend OTP email:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully. Check console for OTP if email not configured.',
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      token,
    },
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('farmDetails.crops');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email',
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Generate reset token
  const token = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });

  // Send email (non-blocking)
  try {
    await sendPasswordResetEmail(email, token, user.name);
  } catch (error) {
    console.error('[AuthController] Failed to send password reset email:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset email sent. If email is not configured, contact admin.',
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide token and new password',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  if (decoded.purpose !== 'reset') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reset token',
    });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password',
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token,
  });
});

