const express = require('express');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Load mock events once at startup
const events = require(path.join(__dirname, '../../data/mock_events.json'));

// GET /api/events — all events (auth required)
router.get('/', requireAuth, (req, res) => {
  res.json(events);
});

// GET /api/events/:id — single event (auth required)
router.get('/:id', requireAuth, (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

module.exports = router;
