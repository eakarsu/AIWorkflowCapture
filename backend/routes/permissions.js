// routes/permissions.js — per-user/workflow scope rules
const express = require('express');
const pool = require('../config/database');
const { requireCommander } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM permission_scopes ORDER BY id DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', async (req, res) => {
  try {
    const email = req.user?.email || '';
    const r = await pool.query('SELECT * FROM permission_scopes WHERE user_email=$1', [email]);
    res.json({ user: email, role: req.user?.role || 'viewer', scopes: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireCommander, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO permission_scopes
       (user_email, scope_type, scope_value, can_view, can_replay, can_edit)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [b.user_email, b.scope_type || 'workflow', b.scope_value,
       b.can_view !== false, !!b.can_replay, !!b.can_edit]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireCommander, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE permission_scopes SET user_email=$1, scope_type=$2, scope_value=$3,
              can_view=$4, can_replay=$5, can_edit=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [b.user_email, b.scope_type, b.scope_value,
       b.can_view !== false, !!b.can_replay, !!b.can_edit, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireCommander, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM permission_scopes WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// helper: can a user act on a given workflow?
router.get('/check', async (req, res) => {
  try {
    const user_email = (req.query.user_email || req.user?.email || '').toString();
    const workflow_name = (req.query.workflow_name || '').toString();
    const r = await pool.query(
      `SELECT * FROM permission_scopes
       WHERE user_email=$1 AND (
         (scope_type='workflow' AND scope_value=$2) OR
         (scope_type='app') OR
         (scope_type='all')
       )`,
      [user_email, workflow_name]
    );
    const can = r.rows.reduce((acc, row) => ({
      can_view: acc.can_view || !!row.can_view,
      can_replay: acc.can_replay || !!row.can_replay,
      can_edit: acc.can_edit || !!row.can_edit,
    }), { can_view: false, can_replay: false, can_edit: false });
    res.json({ user_email, workflow_name, ...can, matched_rules: r.rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
