const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All user routes require auth + admin role
router.use(requireAuth, requireAdmin);

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, email, role, status FROM users').all();
  res.json(users);
});

// POST /api/users
router.post('/', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password, and role are required' });
  }

  const validRoles = ['admin', 'analyst', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'A user with that email already exists' });
  }

  const id = 'usr-' + uuidv4().slice(0, 8);
  const hashed = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, email, password, role, status) VALUES (?, ?, ?, ?, ?)').run(
    id, email, hashed, role, 'active'
  );

  const created = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PATCH /api/users/:id
router.patch('/:id', (req, res) => {
  const { role, status } = req.body;
  const { id } = req.params;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const validRoles  = ['admin', 'analyst', 'viewer'];
  const validStatus = ['active', 'disabled'];

  if (role   && !validRoles.includes(role))    return res.status(400).json({ error: 'Invalid role' });
  if (status && !validStatus.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  if (role)   db.prepare('UPDATE users SET role   = ? WHERE id = ?').run(role, id);
  if (status) db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);

  const updated = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
