'use strict';
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

router.post('/workflow-advice', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || !Object.keys(req.body).length) return res.status(400).json({ error: 'workflow_context_required' });
    const { OPENROUTER_API_KEY: key, OPENROUTER_MODEL: model, OPENROUTER_BASE_URL: base } = process.env;
    if (base !== 'https://openrouter.ai/api/v1' || !key || !model) throw new Error('OpenRouter runtime configuration is incomplete');
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [
        { role: 'system', content: 'Give concise, practical workflow replay and selector-resilience advice.' },
        { role: 'user', content: JSON.stringify(req.body) },
      ] }),
    });
    if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`);
    const body = await response.json();
    const result = body.choices?.[0]?.message?.content;
    if (!result) throw new Error('OpenRouter returned no usable content');
    const saved = await pool.query(
      `INSERT INTO ai_results(feature,input,output) VALUES('runtime_workflow_advice',$1::jsonb,$2::jsonb) RETURNING id,created_at`,
      [JSON.stringify(req.body), JSON.stringify({ result, model: body.model || model })],
    );
    return res.json({ success: true, result, model: body.model || model, persisted: saved.rows[0] });
  } catch (error) {
    console.error('Runtime AI error:', error.message);
    return res.status(502).json({ error: 'provider_request_failed' });
  }
});

module.exports = router;
