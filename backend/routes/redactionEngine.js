// routes/redactionEngine.js — applies the in-memory rules (from /custom-views/redaction-rules)
// to provided text or to captured_steps rows.  No new dep; uses JS RegExp.
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// We re-fetch rules through HTTP-less import: requiring customViews would create cycles,
// so we keep the canonical rule list duplicated here in a default constant which clients
// can override by passing `rules` in the body.  For shared mutation, /custom-views is canonical;
// this endpoint accepts an explicit rules payload OR loads from /custom-views via injection.
const DEFAULT_RULES = [
  { id: 1, name: 'Mask credit cards', pattern: '\\b(?:\\d[ -]*?){13,16}\\b', mask_with: '****-****-****-####', active: true, scope: 'input_data' },
  { id: 2, name: 'Mask emails', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+', mask_with: '[email]', active: true, scope: 'input_data' },
  { id: 3, name: 'Mask SSN', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', mask_with: '***-**-####', active: true, scope: 'element_hint' },
];

function applyRules(text, rules, scope) {
  let out = String(text == null ? '' : text);
  const matched = [];
  for (const r of rules) {
    if (r.active === false) continue;
    if (scope && r.scope && r.scope !== scope) continue;
    try {
      const re = new RegExp(r.pattern, 'g');
      const before = out;
      out = out.replace(re, () => { matched.push({ rule_id: r.id, name: r.name }); return r.mask_with || '***'; });
      if (before === out) { /* no hit */ }
    } catch (_) { /* invalid regex */ }
  }
  return { redacted: out, matched };
}

// POST /api/redaction/apply   { text, scope?, rules? }
router.post('/apply', (req, res) => {
  try {
    const b = req.body || {};
    const rules = Array.isArray(b.rules) && b.rules.length ? b.rules : DEFAULT_RULES;
    const out = applyRules(b.text || '', rules, b.scope || null);
    res.json({ scope: b.scope || null, applied_rules: rules.length, ...out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/redaction/preview-step/:id — show what redaction does to a captured_step
router.post('/preview-step/:id', async (req, res) => {
  try {
    const b = req.body || {};
    const rules = Array.isArray(b.rules) && b.rules.length ? b.rules : DEFAULT_RULES;
    const r = await pool.query('SELECT * FROM captured_steps WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const row = r.rows[0];
    res.json({
      original: row,
      redacted: {
        input_data: applyRules(row.input_data || '', rules, 'input_data'),
        element_hint: applyRules(row.element_hint || '', rules, 'element_hint'),
        semantic_label: applyRules(row.semantic_label || '', rules, 'semantic_label'),
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/redaction/scan-corpus — count rule hits across captured_steps
router.post('/scan-corpus', async (req, res) => {
  try {
    const b = req.body || {};
    const rules = Array.isArray(b.rules) && b.rules.length ? b.rules : DEFAULT_RULES;
    const r = await pool.query('SELECT id, input_data, element_hint, semantic_label FROM captured_steps');
    const counters = Object.fromEntries(rules.map((rl) => [rl.name, 0]));
    let scanned = 0;
    for (const row of r.rows) {
      scanned++;
      for (const field of ['input_data', 'element_hint', 'semantic_label']) {
        const out = applyRules(row[field] || '', rules, field);
        for (const m of out.matched) counters[m.name] = (counters[m.name] || 0) + 1;
      }
    }
    res.json({ scanned_rows: scanned, hits: counters });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
