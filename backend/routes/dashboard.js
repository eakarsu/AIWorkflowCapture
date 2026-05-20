const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [workflows_q, captured_steps_q, replay_runs_q, selector_library_q, healing_events_q, exceptions_q] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM workflows"),
      pool.query("SELECT COUNT(*) AS total FROM captured_steps"),
      pool.query("SELECT COUNT(*) AS total FROM replay_runs"),
      pool.query("SELECT COUNT(*) AS total FROM selector_library"),
      pool.query("SELECT COUNT(*) AS total FROM healing_events"),
      pool.query("SELECT COUNT(*) AS total FROM exceptions")
    ]);
    res.json({
      workflows: workflows_q.rows[0],
      captured_steps: captured_steps_q.rows[0],
      replay_runs: replay_runs_q.rows[0],
      selector_library: selector_library_q.rows[0],
      healing_events: healing_events_q.rows[0],
      exceptions: exceptions_q.rows[0]
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
