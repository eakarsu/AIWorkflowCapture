// routes/marketplace.js — workflow listings + reviews + install
const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');
const router = express.Router();

router.get('/listings', async (req, res) => {
  try {
    const category = (req.query.category || '').toString();
    const sql = category
      ? 'SELECT * FROM marketplace_listings WHERE category=$1 ORDER BY rating DESC, install_count DESC'
      : 'SELECT * FROM marketplace_listings ORDER BY rating DESC, install_count DESC';
    const r = await pool.query(sql, category ? [category] : []);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/listings/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM marketplace_listings WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const reviews = await pool.query('SELECT * FROM marketplace_reviews WHERE listing_id=$1 ORDER BY id DESC', [req.params.id]);
    res.json({ ...r.rows[0], reviews: reviews.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/listings', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO marketplace_listings
       (workflow_name, publisher, title, description, category, version, status)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,'1.0.0'),COALESCE($7,'published')) RETURNING *`,
      [b.workflow_name, b.publisher || req.user?.email || 'unknown',
       b.title || b.workflow_name, b.description || null,
       b.category || 'general', b.version, b.status]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/listings/:id', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE marketplace_listings SET workflow_name=$1, publisher=$2, title=$3,
              description=$4, category=$5, version=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [b.workflow_name, b.publisher, b.title, b.description, b.category, b.version, b.status, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/listings/:id', requireWriter, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM marketplace_listings WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/listings/:id/install', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE marketplace_listings SET install_count = install_count + 1, updated_at=NOW()
       WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    // Replicate the listing into local workflows table if absent
    try {
      const exists = await pool.query('SELECT id FROM workflows WHERE name=$1', [r.rows[0].workflow_name]);
      if (!exists.rows.length) {
        await pool.query(
          `INSERT INTO workflows (name, app_name, intent, status, step_count, notes)
           VALUES ($1, NULL, $2, 'draft', 0, $3)`,
          [r.rows[0].workflow_name, r.rows[0].description || null, `Installed from marketplace #${r.rows[0].id}`]
        );
      }
    } catch (_) {}
    res.json({ installed: true, listing: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/listings/:id/reviews', async (req, res) => {
  try {
    const b = req.body || {};
    const rating = Math.max(1, Math.min(5, parseInt(b.rating, 10) || 5));
    const r = await pool.query(
      `INSERT INTO marketplace_reviews (listing_id, reviewer, rating, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, b.reviewer || req.user?.email || 'anon', rating, b.comment || null]
    );
    // recompute rating average
    const avg = await pool.query('SELECT AVG(rating)::numeric(3,2) AS avg FROM marketplace_reviews WHERE listing_id=$1', [req.params.id]);
    await pool.query('UPDATE marketplace_listings SET rating=COALESCE($1,0), updated_at=NOW() WHERE id=$2', [avg.rows[0].avg, req.params.id]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
