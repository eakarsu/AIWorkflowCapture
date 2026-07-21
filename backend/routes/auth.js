const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken, requireCommander } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
const SCRYPT_FORMAT = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

function verifyPassword(password, stored) {
  const match = SCRYPT_FORMAT.exec(String(stored || ''));
  if (!match) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), Buffer.from(match[1], 'hex'), 64, (error, derived) => {
      if (error) return reject(error);
      resolve(crypto.timingSafeEqual(derived, Buffer.from(match[2], 'hex')));
    });
  });
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const result = await pool.query(
      'SELECT id, email, password, name, role FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid email or password' });
    const account = result.rows[0];
    if (!SCRYPT_FORMAT.test(String(account.password || ''))) {
      return res.status(503).json({ error: 'PASSWORD_MIGRATION_REQUIRED' });
    }
    if (!await verifyPassword(password, account.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = { id: account.id, email: account.email, name: account.name, role: account.role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load user' });
  }
});

router.get('/users', authenticateToken, requireCommander, async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to list users' });
  }
});

module.exports = router;
