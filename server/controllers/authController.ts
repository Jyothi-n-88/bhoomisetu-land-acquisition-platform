import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middleware/authMiddleware';

// Generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, secretKey } = req.body;

    // Validate official secret key
    const expectedSecretKey = process.env.REGISTRATION_SECRET_KEY || 'BHOOMISETU_OFFICIAL_2026';
    if (!secretKey || secretKey.trim() !== expectedSecretKey.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid official secret key. Registration is invite-only for authorized officials.',
      });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, role',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user (unverified by default)
    const user = await User.create({
      name,
      email,
      password,
      role,
      authProvider: 'local',
      isVerified: false,
    });

    if (user) {
      // Generate OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      await OTP.create({ email, otp: otpCode });

      // Send Email
      await sendEmail({
        email,
        subject: 'BhoomiSetu Official Registration OTP',
        message: `Your OTP for completing the BhoomiSetu official registration is: ${otpCode}. This code will expire in 5 minutes.`,
      });

      res.status(201).json({
        success: true,
        message: 'Registration initiated. OTP sent to email.',
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP for email registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    SSO Login (Google / Microsoft)
// @route   POST /api/auth/sso-login
// @access  Public
export const ssoLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for SSO login',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please register as a new official.',
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    SSO Register with Official Secret Key
// @route   POST /api/auth/sso-register
// @access  Public
export const ssoRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, role, secretKey, provider } = req.body;

    // Validate official secret key
    const expectedSecretKey = process.env.REGISTRATION_SECRET_KEY || 'BHOOMISETU_OFFICIAL_2026';
    if (!secretKey || secretKey.trim() !== expectedSecretKey.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid official secret key. Registration is invite-only for authorized officials.',
      });
    }

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, role',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create SSO user without traditional password (automatically verified)
    const user = await User.create({
      name,
      email,
      role,
      authProvider: 'google',
      isVerified: true,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user: any = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email using the OTP sent during registration.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (optional - clientside handles token mostly)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
