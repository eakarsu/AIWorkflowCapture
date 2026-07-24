'use strict';
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../config/database');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) reject(error); else resolve(`scrypt$${salt.toString('hex')}$${key.toString('hex')}`);
  }));
}

async function main() {
  if (process.env.ALLOW_SCHEMA_MIGRATION !== 'true') throw new Error('ALLOW_SCHEMA_MIGRATION=true is required');
  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory = path.resolve(__dirname, '../migrations');
    for (const name of fs.readdirSync(directory).filter((value) => value.endsWith('.sql')).sort()) {
      if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])).rowCount) continue;
      const sql = fs.readFileSync(path.join(directory, name), 'utf8').trim().replace(/^BEGIN;\s*/, '').replace(/\s*COMMIT;$/, '');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
    const email = (process.env.DEFAULT_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.DEFAULT_PASSWORD || process.env.ADMIN_PASSWORD || '';
    if (!email || password.length < 12) throw new Error('Runtime administrator credentials are required');
    await client.query(
      `INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,'commander')
       ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='commander'`,
      [email, await hashPassword(password), 'Runtime Administrator'],
    );
  } finally { client.release(); await pool.end(); }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
