const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { USERS_FILE, JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');
const { readJsonFile, writeJsonFile } = require('../services/fileStorage');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const recipeEvents = require('../services/eventService');

/**
 * Authentication Routes
 * Handles user registration, login, JWT token issuance, and current user profile.
 */

// Helper: Generate JWT token for user
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register - Register a new user
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password, bio } = req.body;
    const users = await readJsonFile(USERS_FILE, []);

    // Check if user email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Password hashing using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      bio: bio ? bio.trim() : 'Home cook and student on SavorSpace.',
      savedRecipeIds: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);

    // Emit user registered event
    recipeEvents.emit('userRegistered', newUser);

    // Issue JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to SavorSpace.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        bio: newUser.bio,
        savedRecipeIds: newUser.savedRecipeIds
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - Authenticate existing user
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const users = await readJsonFile(USERS_FILE, []);

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        savedRecipeIds: user.savedRecipeIds || []
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Get current logged-in user profile
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        savedRecipeIds: user.savedRecipeIds || [],
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/demo-users - Helper for testing student accounts
router.get('/demo-users', async (req, res, next) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const demoAccounts = users.map(u => ({
      name: u.name,
      email: u.email,
      samplePassword: 'password123',
      bio: u.bio
    }));
    res.json({
      success: true,
      message: 'Available student demo accounts for evaluation',
      demoAccounts
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
