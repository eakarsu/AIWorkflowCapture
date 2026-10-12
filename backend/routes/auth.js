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

async function signIn(email, password) {
    if (!email || !password) return { status: 400, error: 'email and password are required' };
    const result = await pool.query(
      'SELECT id, email, password, name, role FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (!result.rows.length) return { status: 401, error: 'Invalid email or password' };
    const account = result.rows[0];
    if (!SCRYPT_FORMAT.test(String(account.password || ''))) {
      return { status: 503, error: 'PASSWORD_MIGRATION_REQUIRED' };
    }
    if (!await verifyPassword(password, account.password)) {
      return { status: 401, error: 'Invalid email or password' };
    }
    const user = { id: account.id, email: account.email, name: account.name, role: account.role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return { token, user };
}

async function respondWithLogin(res, email, password) {
  try {
    const result = await signIn(email, password);
    return result.status ? res.status(result.status).json({ error: result.error }) : res.json(result);
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  return respondWithLogin(res, email, password);
});

// Development-only sign-in with the already provisioned demo account.
// Credentials stay on the server and are checked against the existing user.
router.post('/demo-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Route not found' });
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return res.status(503).json({ error: 'Demo account is not configured' });
  return respondWithLogin(res, email, password);
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
