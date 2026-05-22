// routes/improvement.js — role-based dashboards + non-AI continuous-improvement detector.
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// GET /api/improvement/role-dashboard?role=manager|operator
router.get('/role-dashboard', async (req, res) => {
  try {
    const role = (req.query.role || req.user?.role || 'operator').toString();
    if (role === 'manager' || role === 'commander') {
      const wf = await pool.query('SELECT COUNT(*)::int AS n FROM workflows');
      const runs = await pool.query(
        `SELECT
           COUNT(*)::int AS total_runs,
           SUM(CASE WHEN status='success' THEN 1 ELSE 0 END)::int AS success,
           SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END)::int AS failed
         FROM replay_runs`
      );
      const exceptions = await pool.query('SELECT kind, COUNT(*)::int AS n FROM exceptions GROUP BY kind ORDER BY n DESC LIMIT 10');
      const healing = await pool.query('SELECT COUNT(*)::int AS n FROM healing_events');
      const total = runs.rows[0].total_runs || 0;
      const success = runs.rows[0].success || 0;
      const roi = success * 4.2; // synthetic hours saved coefficient
      res.json({
        view: 'manager',
        workflows: wf.rows[0].n,
        total_runs: total,
        success_rate: total ? Math.round((success / total) * 100) : 0,
        failed: runs.rows[0].failed || 0,
        healing_events: healing.rows[0].n,
        exception_trends: exceptions.rows,
        estimated_hours_saved: Math.round(roi * 10) / 10,
      });
    } else {
      // operator view: focus on the next thing to do
      const pending = await pool.query(
        `SELECT w.id, w.name, w.status, COALESCE(MAX(r.created_at)::text,'') AS last_run
         FROM workflows w
         LEFT JOIN replay_runs r ON r.workflow_name=w.name
         GROUP BY w.id ORDER BY last_run ASC NULLS FIRST LIMIT 10`
      );
      const myExceptions = await pool.query(
        "SELECT * FROM exceptions WHERE status NOT IN ('resolved','closed') ORDER BY id DESC LIMIT 10"
      );
      res.json({
        view: 'operator',
        queued_workflows: pending.rows,
        open_exceptions: myExceptions.rows,
      });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/improvement/declining — workflows whose success rate is dropping
router.get('/declining', async (req, res) => {
  try {
    // baseline vs recent — recent = last 14d, baseline = older window
    const recent = await pool.query(`
      SELECT workflow_name,
             SUM(CASE WHEN status='success' THEN 1 ELSE 0 END)::int AS succ,
             COUNT(*)::int AS total
      FROM replay_runs
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY workflow_name
    `);
    const baseline = await pool.query(`
      SELECT workflow_name,
             SUM(CASE WHEN status='success' THEN 1 ELSE 0 END)::int AS succ,
             COUNT(*)::int AS total
      FROM replay_runs
      WHERE created_at < NOW() - INTERVAL '14 days'
      GROUP BY workflow_name
    `);
    const baseMap = {};
    for (const r of baseline.rows) {
      baseMap[r.workflow_name] = r.total ? r.succ / r.total : null;
    }
    const declining = [];
    for (const r of recent.rows) {
      const recentRate = r.total ? r.succ / r.total : null;
      const baselineRate = baseMap[r.workflow_name];
      if (recentRate != null && baselineRate != null && recentRate < baselineRate - 0.05) {
        declining.push({
          workflow_name: r.workflow_name,
          recent_success_rate: Math.round(recentRate * 1000) / 1000,
          baseline_success_rate: Math.round(baselineRate * 1000) / 1000,
          delta: Math.round((recentRate - baselineRate) * 1000) / 1000,
          recent_runs: r.total,
        });
      }
    }
    res.json({
      generated_at: new Date().toISOString(),
      window: '14d vs older',
      declining,
      threshold: 0.05,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
