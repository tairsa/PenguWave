const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rate-limit login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Always compare (even if user not found) to prevent timing attacks
  const hash = user ? user.password : '$2a$10$invalidhashtopreventtimingattack00000000000000000000000';
  const valid = bcrypt.compareSync(password, hash);

  if (!user || !valid) {
    // Generic message — don't reveal whether email exists
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, status: user.status },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // JWT is stateless — client drops the token. In production, use a token blocklist.
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  res.json(user);
});

module.exports = router;
