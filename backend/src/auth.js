/**
 * auth.js
 * Google OAuth 2.0 Authentication Configuration
 * Handles user authentication via Google Sign-In
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

// User storage (in production, use a database)
const users = new Map();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const userData = {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          provider: 'google',
          createdAt: new Date().toISOString(),
        };

        // Store or update user (in production, save to database)
        if (!users.has(userData.id)) {
          users.set(userData.id, userData);
        }

        return done(null, userData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user || null);
});

/**
 * Generate JWT token for authenticated user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
}

/**
 * Middleware to verify JWT token
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware (allows unauthenticated requests)
 */
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
      req.user = decoded;
    } catch (error) {
      // Token invalid but continue anyway
      req.user = null;
    }
  }

  next();
}

module.exports = {
  passport,
  generateToken,
  verifyToken,
  optionalAuth,
  users,
};
