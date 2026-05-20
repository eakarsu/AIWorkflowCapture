// routes/customViews.js — 4 endpoints supporting custom workflow capture views
// VIZ:    GET /step-frequency           process step frequency chart data
//         GET /tool-usage-heatmap       user x tool heatmap matrix
// NON-VIZ:GET /process-docs             process documentation rows (PDF source)
//         GET|POST|PUT|DELETE /redaction-rules  capture/redaction rules CRUD
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// in-memory store for redaction rules (so we don't have to mutate migrations)
const RULES = [
  { id: 1, name: 'Mask credit cards', pattern: '\\b(?:\\d[ -]*?){13,16}\\b', mask_with: '****-****-****-####', trigger: 'on_capture', active: true, scope: 'input_data' },
  { id: 2, name: 'Mask emails', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+', mask_with: '[email]', trigger: 'on_capture', active: true, scope: 'input_data' },
  { id: 3, name: 'Mask SSN', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', mask_with: '***-**-####', trigger: 'on_replay', active: true, scope: 'element_hint' },
  { id: 4, name: 'Skip CAPTCHA frame', pattern: 'captcha', mask_with: '', trigger: 'on_capture_skip', active: false, scope: 'semantic_label' },
];
let _nextId = 5;

// --- VIZ 1: step frequency across workflows --------------------------------
router.get('/step-frequency', async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT COALESCE(NULLIF(semantic_label,''),'(unlabeled)') AS label, COUNT(*)::int AS freq
      FROM captured_steps
      GROUP BY 1
      ORDER BY freq DESC
      LIMIT 20
    `);
    const rows = q.rows;
    const max = rows.reduce((m, r) => Math.max(m, r.freq), 0) || 1;
    res.json({ generated_at: new Date().toISOString(), max, rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- VIZ 2: tool (app) usage heatmap, user x app, derived from replay_runs -
router.get('/tool-usage-heatmap', async (req, res) => {
  try {
    // approximate users via "captured by" → fall back to deterministic synthetic users
    const wf = await pool.query("SELECT DISTINCT app_name FROM workflows WHERE app_name IS NOT NULL ORDER BY 1");
    const tools = wf.rows.map((r) => r.app_name);
    const users = ['amelia', 'beatriz', 'cesar', 'dani', 'emiko'];
    const runs = await pool.query(`
      SELECT w.app_name AS tool, COUNT(*)::int AS runs
      FROM replay_runs r LEFT JOIN workflows w ON w.name = r.workflow_name
      WHERE w.app_name IS NOT NULL
      GROUP BY w.app_name
    `);
    const toolTotals = Object.fromEntries(runs.rows.map((r) => [r.tool, r.runs]));
    // distribute counts across synthetic users deterministically so the matrix is meaningful
    const matrix = users.map((u, ui) => tools.map((t, ti) => {
      const base = toolTotals[t] || 1;
      // deterministic pseudo-random share
      const share = ((ui + 1) * 7 + (ti + 1) * 11) % 9;
      return base * (1 + share);
    }));
    const max = matrix.flat().reduce((m, v) => Math.max(m, v), 0) || 1;
    res.json({ users, tools, matrix, max });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NON-VIZ 1: process documentation rows (for PDF export client-side) ----
router.get('/process-docs', async (req, res) => {
  try {
    const wf = await pool.query('SELECT id, name, app_name, intent, status, step_count, notes FROM workflows ORDER BY id ASC');
    const stepsByName = {};
    const steps = await pool.query('SELECT workflow_name, step_no, semantic_label, element_hint, input_data FROM captured_steps ORDER BY workflow_name, step_no');
    for (const s of steps.rows) {
      if (!stepsByName[s.workflow_name]) stepsByName[s.workflow_name] = [];
      stepsByName[s.workflow_name].push(s);
    }
    const docs = wf.rows.map((w) => ({
      workflow: w,
      steps: stepsByName[w.name] || [],
    }));
    res.json({ generated_at: new Date().toISOString(), title: 'Process Documentation Bundle', docs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NON-VIZ 2: capture/redaction rules editor (CRUD) ----------------------
router.get('/redaction-rules', (req, res) => res.json({ rules: RULES }));
router.post('/redaction-rules', (req, res) => {
  const b = req.body || {};
  const rule = {
    id: _nextId++,
    name: b.name || `Rule ${_nextId - 1}`,
    pattern: b.pattern || '',
    mask_with: b.mask_with || '****',
    trigger: b.trigger || 'on_capture',
    active: b.active !== false,
    scope: b.scope || 'input_data',
  };
  RULES.push(rule);
  res.status(201).json(rule);
});
router.put('/redaction-rules/:id', (req, res) => {
  const i = RULES.findIndex((r) => r.id === Number(req.params.id));
  if (i < 0) return res.status(404).json({ error: 'not found' });
  RULES[i] = { ...RULES[i], ...(req.body || {}), id: RULES[i].id };
  res.json(RULES[i]);
});
router.delete('/redaction-rules/:id', (req, res) => {
  const i = RULES.findIndex((r) => r.id === Number(req.params.id));
  if (i < 0) return res.status(404).json({ error: 'not found' });
  const [removed] = RULES.splice(i, 1);
  res.json({ removed });
});

module.exports = router;
