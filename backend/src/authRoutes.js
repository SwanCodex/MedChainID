/**
 * authRoutes.js
 * Authentication Routes for Google OAuth
 */

const express = require('express');
const { passport, generateToken, verifyToken } = require('./auth');

const router = express.Router();

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user);

      // Send token to frontend
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${frontendURL}/login?error=auth_failed`);
    }
  }
);

/**
 * @route   GET /api/auth/user
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/user', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', verifyToken, (req, res) => {
  // Clear cookie if using cookies
  res.clearCookie('token');
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route   POST /api/auth/google/verify
 * @desc    Verify Google token and create JWT
 * @access  Public
 */
router.post('/google/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    // Verify Google token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userData = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    // Generate JWT
    const jwtToken = generateToken(userData);

    res.json({
      success: true,
      token: jwtToken,
      user: userData,
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    
    res.json({
      authenticated: true,
      user: decoded,
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

module.exports = router;
