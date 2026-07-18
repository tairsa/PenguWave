const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'penguwave.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        TEXT PRIMARY KEY,
    email     TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL DEFAULT 'analyst',
    status    TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Seed default users if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (count.count === 0) {
  const insert = db.prepare(
    'INSERT INTO users (id, email, password, role, status) VALUES (?, ?, ?, ?, ?)'
  );
  const seed = db.transaction(() => {
    insert.run('usr-001', 'admin@penguwave.io',   bcrypt.hashSync('admin123',  10), 'admin',   'active');
    insert.run('usr-002', 'analyst@penguwave.io', bcrypt.hashSync('analyst123', 10), 'analyst', 'active');
  });
  seed();
  console.log('Database seeded with default users.');
}

module.exports = db;
