// routes/recordings.js — recording substrate CRUD + nested frames/events.
// Mounted at /api/recordings.  TOP PRIORITY per audit note.
const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');
const router = express.Router();

// ── sessions ────────────────────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM recording_sessions ORDER BY id DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM recording_sessions WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sessions', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO recording_sessions (workflow_name, operator, app_name, notes, status)
       VALUES ($1,$2,$3,$4,COALESCE($5,'recording')) RETURNING *`,
      [b.workflow_name || null, b.operator || (req.user?.email || null), b.app_name || null, b.notes || null, b.status || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/sessions/:id', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE recording_sessions SET workflow_name=$1, operator=$2, app_name=$3, notes=$4, status=$5,
              ended_at=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [b.workflow_name ?? null, b.operator ?? null, b.app_name ?? null, b.notes ?? null,
       b.status ?? null, b.ended_at ?? null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sessions/:id/stop', requireWriter, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE recording_sessions SET status='stopped', ended_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/sessions/:id', requireWriter, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE session_id=$1', [req.params.id]);
    await pool.query('DELETE FROM frames WHERE session_id=$1', [req.params.id]);
    const r = await pool.query('DELETE FROM recording_sessions WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── frames ──────────────────────────────────────────────────────────────
router.get('/sessions/:id/frames', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM frames WHERE session_id=$1 ORDER BY seq ASC, id ASC', [req.params.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sessions/:id/frames', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO frames (session_id, seq, image_ref, ocr_text, width, height)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, b.seq || 0, b.image_ref || null, b.ocr_text || null, b.width || null, b.height || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── events ──────────────────────────────────────────────────────────────
router.get('/sessions/:id/events', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM events WHERE session_id=$1 ORDER BY seq ASC, id ASC', [req.params.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sessions/:id/events', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO events (session_id, seq, kind, target_selector, value, meta)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, b.seq || 0, b.kind || null, b.target_selector || null, b.value || null, b.meta || {}]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// bulk event ingest — common during a live recording
router.post('/sessions/:id/events/bulk', requireWriter, async (req, res) => {
  try {
    const arr = Array.isArray(req.body?.events) ? req.body.events : [];
    let inserted = 0;
    for (const ev of arr) {
      try {
        await pool.query(
          `INSERT INTO events (session_id, seq, kind, target_selector, value, meta)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [req.params.id, ev.seq || 0, ev.kind || null, ev.target_selector || null, ev.value || null, ev.meta || {}]
        );
        inserted++;
      } catch (_) {}
    }
    res.json({ inserted });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
