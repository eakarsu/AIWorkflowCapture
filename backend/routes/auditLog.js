// routes/auditLog.js — write/read audit trail
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const actor = (req.query.actor || '').toString();
    const resource_type = (req.query.resource_type || '').toString();
    const args = [];
    const where = [];
    if (actor) { args.push(actor); where.push(`actor=$${args.length}`); }
    if (resource_type) { args.push(resource_type); where.push(`resource_type=$${args.length}`); }
    args.push(limit);
    const sql = `SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT $${args.length}`;
    const r = await pool.query(sql, args);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO audit_log (actor, action, resource_type, resource_id, details)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [b.actor || req.user?.email || 'system', b.action || 'unknown',
       b.resource_type || null, b.resource_id ? String(b.resource_id) : null, b.details || {}]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Summary buckets — useful for compliance dashboards
router.get('/summary', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT resource_type, action, COUNT(*)::int AS n
       FROM audit_log GROUP BY resource_type, action ORDER BY n DESC LIMIT 50`
    );
    res.json({ generated_at: new Date().toISOString(), rows: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
