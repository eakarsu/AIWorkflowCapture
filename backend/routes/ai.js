const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

const SCHEMAS = {
  'capture-analyze': `{"workflow_name":string,"intent":string,"steps":[{"step":number,"semantic_label":string,"element_hint":string,"input_data":string,"preconditions":[string]}],"branches_detected":[string],"fragility_notes":[string],"summary":string}`,
  'replay-plan': `{"workflow":string,"preflight_checks":[string],"steps":[{"step":number,"selector_strategy":string,"fallback":string,"expected_state_after":string}],"rollback_plan":[string],"estimated_duration_seconds":number,"summary":string}`,
  'self-heal': `{"diagnosis":string,"candidates":[{"candidate_element":string,"confidence":number,"rationale":string}],"recommended_action":string,"auto_patch_selector":string,"follow_up_review":boolean,"summary":string}`,
  'intent-classifier': `{"intent":string,"confidence":number,"slots":[{"name":string,"value":string,"confidence":number}],"alternative_intents":[{"intent":string,"confidence":number}],"summary":string}`,
  'parameter-suggester': `{"workflow":string,"suggested_params":[{"name":string,"value":string,"source":string,"confidence":number}],"missing_required":[string],"summary":string}`,
  'branch-detector': `{"branch_detected":boolean,"branch_type":string,"trigger_condition":string,"recommended_split":[string],"summary":string}`,
  'exception-resolver': `{"diagnosis":string,"options":[{"option":string,"effort":"low"|"medium"|"high","success_probability":number}],"recommended":string,"summary":string}`,
  'workflow-merger': `{"merge_viable":boolean,"shared_steps":[string],"divergent_steps":[{"step":string,"choose_from":string}],"merged_outline":[string],"summary":string}`,
  'demo-to-sop': `{"title":string,"intent":string,"sop_markdown":string,"sections":[{"heading":string,"body":string,"screenshots":[string]}],"decision_points":[{"step":number,"condition":string,"branches":[string]}],"exception_handling":[{"trigger":string,"action":string}],"summary":string}`,
  'action-classifier': `{"events_classified":[{"seq":number,"raw_kind":string,"semantic_action":string,"confidence":number,"rationale":string}],"action_distribution":[{"semantic_action":string,"count":number}],"summary":string}`,
  'automation-script-gen': `{"target":"playwright"|"selenium"|"puppeteer","language":string,"code":string,"setup_notes":[string],"assumptions":[string],"summary":string}`,
  'gap-filler': `{"gaps_detected":[{"after_step":number,"before_step":number,"missing_action_hypothesis":string,"confidence":number}],"proposed_inserts":[{"position":number,"semantic_label":string,"element_hint":string,"rationale":string}],"summary":string}`,
  'narrate-step': `{"step_no":number,"narration":string,"why_this_matters":string,"watch_outs":[string],"next_step_preview":string,"summary":string}`,
  'dedup-workflows': `{"clusters":[{"cluster_id":string,"workflow_names":[string],"shared_intent":string,"similarity":number,"recommended_canonical":string}],"singletons":[string],"summary":string}`,
  'continuous-improvement': `{"declining_workflows":[{"workflow_name":string,"recent_success_rate":number,"baseline_success_rate":number,"delta":number,"window":string}],"recommended_actions":[{"workflow_name":string,"action":string,"rationale":string}],"summary":string}`
};

const SAMPLES = {
  'capture-analyze': [
    { label: 'Coupa invoice submission', values: {"trace_text":"STEP 1 click button Submit Invoice; STEP 2 type INV-2026-0481; STEP 3 select vendor Acme","app_name":"Coupa"} },
    { label: 'SAP Concur expense', values: {"trace_text":"STEP 1 click New Report; STEP 2 type \"Q3 conference\"; STEP 3 upload receipt.pdf","app_name":"SAP Concur"} },
    { label: 'CMA CGM port booking', values: {"trace_text":"STEP 1 search port LAX; STEP 2 click slot 2026-06-12; STEP 3 confirm","app_name":"CMA CGM"} }
  ],
  'replay-plan': [
    { label: 'Submit invoice INV-0482', values: {"workflow_id":"submit-coupa-invoice","parameters_json":"{\"invoice_no\":\"INV-2026-0482\",\"amount\":\"4500.00\"}"} },
    { label: 'Expense for conf trip', values: {"workflow_id":"sap-concur-expense","parameters_json":"{\"title\":\"Q3 conference\",\"amount\":\"1842.00\",\"date\":\"2026-09-12\"}"} },
    { label: 'Book LAX slot', values: {"workflow_id":"cma-cgm-port-booking","parameters_json":"{\"port\":\"LAX\",\"date\":\"2026-06-12\",\"container_count\":\"3\"}"} }
  ],
  'self-heal': [
    { label: 'Submit button moved', values: {"failed_step":"Click Submit Invoice","screenshot_text":"Header: Submit Invoice. Page contains button \"Save Draft\" and a green pill \"Submit\"","last_known_selector":"button#submit-7"} },
    { label: 'New Report renamed', values: {"failed_step":"Click New Report","screenshot_text":"Top bar: Reports v2. Big blue \"Create New Report\" button.","last_known_selector":".btn-primary"} },
    { label: 'Captcha interrupting', values: {"failed_step":"Confirm booking","screenshot_text":"Modal: Verify you are human. reCAPTCHA visible.","last_known_selector":".booking-action-primary"} }
  ],
  'intent-classifier': [
    { label: 'Submit invoice phrase', values: {"utterance":"I need to submit invoice 0482 for Acme for $4500","allowed_intents":"submit_invoice, file_expense, book_port"} },
    { label: 'Expense for conference', values: {"utterance":"File expense for last week conference, $1842","allowed_intents":"submit_invoice, file_expense, book_port"} },
    { label: 'Book port slot', values: {"utterance":"Book 3 containers at LAX for June 12","allowed_intents":"submit_invoice, file_expense, book_port"} }
  ],
  'parameter-suggester': [
    { label: 'Coupa partial fill', values: {"workflow_name":"Submit Coupa Invoice","partial_input":"invoice for Acme, last month"} },
    { label: 'Concur with attachment', values: {"workflow_name":"SAP Concur Expense","partial_input":"Q3 customer trip"} },
    { label: 'Port partial', values: {"workflow_name":"Port Booking","partial_input":"3 boxes outbound to LAX"} }
  ],
  'branch-detector': [
    { label: 'Captcha branch', values: {"workflow_name":"Port Booking","observation":"In 4% of runs, a captcha modal appears between step 5 and 6."} },
    { label: 'Approval branch', values: {"workflow_name":"Submit Coupa Invoice","observation":"When amount > $5000, a second approval step is added."} },
    { label: 'Receipt branch', values: {"workflow_name":"SAP Concur Expense","observation":"Some expense categories require an itemization step."} }
  ],
  'exception-resolver': [
    { label: 'Captcha', values: {"workflow_name":"Port Booking","exception_kind":"captcha","context":"reCAPTCHA every 3-4 runs."} },
    { label: 'Selector drift', values: {"workflow_name":"Submit Coupa Invoice","exception_kind":"selector_drift","context":"Coupa shipped UI v6."} },
    { label: 'Auth expired', values: {"workflow_name":"SAP Concur Expense","exception_kind":"auth","context":"Session expired mid-run."} }
  ],
  'workflow-merger': [
    { label: 'Invoice variants', values: {"workflow_a":"Submit Coupa Invoice","workflow_b":"Submit Coupa Credit Memo","similarity_hint":"Both vendor lookup."} },
    { label: 'Expense vs reimb', values: {"workflow_a":"SAP Concur Expense","workflow_b":"SAP Concur Reimbursement","similarity_hint":"Reimbursement is subset."} },
    { label: 'Port variants', values: {"workflow_a":"CMA CGM Port Booking","workflow_b":"Maersk Port Booking","similarity_hint":"Same intent."} }
  ],
  'demo-to-sop': [
    { label: 'Coupa invoice SOP', values: {"workflow_name":"Submit Coupa Invoice","steps_text":"1 click Submit Invoice; 2 type INV-2026-0481; 3 select Acme; 4 attach receipt.pdf; 5 click Confirm","screenshots":"intro.png,form.png,confirm.png"} },
    { label: 'Concur SOP', values: {"workflow_name":"SAP Concur Expense","steps_text":"1 New Report; 2 type Q3 trip; 3 upload receipt; 4 submit","screenshots":"new.png,form.png"} },
    { label: 'Port SOP', values: {"workflow_name":"CMA CGM Port Booking","steps_text":"1 search LAX; 2 pick 2026-06-12; 3 confirm 3 containers","screenshots":"search.png,confirm.png"} }
  ],
  'action-classifier': [
    { label: 'Coupa events', values: {"events_text":"seq=1 click button text='Submit Invoice'; seq=2 keypress input#invno 'INV-2026-0481'; seq=3 select #vendor 'Acme'; seq=4 file-drop receipt.pdf; seq=5 click 'Confirm'","app_name":"Coupa"} },
    { label: 'Concur events', values: {"events_text":"seq=1 click 'New Report'; seq=2 type input#title 'Q3 conference'; seq=3 click 'Upload Receipt'; seq=4 file receipt.pdf","app_name":"SAP Concur"} },
    { label: 'Port events', values: {"events_text":"seq=1 type search 'LAX'; seq=2 click date 2026-06-12; seq=3 click slot; seq=4 click confirm","app_name":"CMA CGM"} }
  ],
  'automation-script-gen': [
    { label: 'Playwright Coupa', values: {"target":"playwright","language":"javascript","workflow_name":"Submit Coupa Invoice","steps_text":"1 click Submit Invoice; 2 type INV-2026-0481; 3 select Acme; 4 confirm","base_url":"https://coupa.example.com"} },
    { label: 'Selenium Concur', values: {"target":"selenium","language":"python","workflow_name":"SAP Concur Expense","steps_text":"1 New Report; 2 type Q3 trip; 3 submit","base_url":"https://concur.example.com"} },
    { label: 'Puppeteer Port', values: {"target":"puppeteer","language":"javascript","workflow_name":"Port Booking","steps_text":"1 search LAX; 2 pick date; 3 confirm","base_url":"https://cmacgm.example.com"} }
  ],
  'gap-filler': [
    { label: 'Coupa gap', values: {"workflow_name":"Submit Coupa Invoice","steps_text":"1 click Submit; 2 [page jumped to confirmation without recorded click]; 3 confirmation screen"} },
    { label: 'Concur gap', values: {"workflow_name":"SAP Concur Expense","steps_text":"1 New Report; 2 [state: form open with title prefilled]; 3 submit"} },
    { label: 'Port gap', values: {"workflow_name":"Port Booking","steps_text":"1 search LAX; 2 [no click recorded but date detail open]; 3 confirm"} }
  ],
  'narrate-step': [
    { label: 'Coupa step 2', values: {"workflow_name":"Submit Coupa Invoice","step_no":2,"step_label":"Type invoice number INV-2026-0481","upcoming":"Select vendor Acme"} },
    { label: 'Concur step 1', values: {"workflow_name":"SAP Concur Expense","step_no":1,"step_label":"Click New Report","upcoming":"Type Q3 conference title"} },
    { label: 'Port step 3', values: {"workflow_name":"CMA CGM Port Booking","step_no":3,"step_label":"Confirm 3 containers","upcoming":"Receive booking ref"} }
  ],
  'dedup-workflows': [
    { label: 'Corpus dedup', values: {"workflow_names":"Submit Coupa Invoice, Submit Coupa Credit Memo, SAP Concur Expense, SAP Concur Reimbursement, CMA CGM Port Booking, Maersk Port Booking","app_names":"Coupa, Coupa, SAP Concur, SAP Concur, CMA CGM, Maersk"} },
    { label: 'Just invoices', values: {"workflow_names":"Coupa Invoice, Coupa Credit Memo, Coupa Refund","app_names":"Coupa, Coupa, Coupa"} },
    { label: 'Mixed', values: {"workflow_names":"Port Booking LAX, Port Booking SHA, Expense Q3, Expense Q4","app_names":"CMA CGM, CMA CGM, Concur, Concur"} }
  ],
  'continuous-improvement': [
    { label: 'Last 30 days', values: {"window":"30d","runs_text":"Submit Coupa Invoice: 18/20 success last 30d, 39/40 baseline; SAP Concur Expense: 12/20 success last 30d, 18/20 baseline; Port Booking: 9/10 last 30d, 14/15 baseline"} },
    { label: 'Last 7 days', values: {"window":"7d","runs_text":"Submit Coupa Invoice 4/5; baseline 19/20; Port Booking 2/5; baseline 9/10"} },
    { label: 'Quarter', values: {"window":"90d","runs_text":"Concur Expense 50/100; baseline 80/100; Coupa Invoice 92/100; baseline 90/100"} }
  ]
};

async function record(feature, input, output) {
  try {
    await pool.query('INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]);
  } catch (e) { console.warn('[ai] record failed:', e.message); }
}

router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    const r = feature
      ? await pool.query('SELECT id, feature, input, output, created_at FROM ai_results WHERE feature=$1 ORDER BY created_at DESC LIMIT $2', [feature, limit])
      : await pool.query('SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/capture-analyze', async (req, res) => {
  try {
    const result = await ai.runFeature('capture-analyze', SCHEMAS['capture-analyze'], req.body || {});
    await record('capture-analyze', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/replay-plan', async (req, res) => {
  try {
    const result = await ai.runFeature('replay-plan', SCHEMAS['replay-plan'], req.body || {});
    await record('replay-plan', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/self-heal', async (req, res) => {
  try {
    const result = await ai.runFeature('self-heal', SCHEMAS['self-heal'], req.body || {});
    await record('self-heal', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/intent-classifier', async (req, res) => {
  try {
    const result = await ai.runFeature('intent-classifier', SCHEMAS['intent-classifier'], req.body || {});
    await record('intent-classifier', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/parameter-suggester', async (req, res) => {
  try {
    const result = await ai.runFeature('parameter-suggester', SCHEMAS['parameter-suggester'], req.body || {});
    await record('parameter-suggester', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/branch-detector', async (req, res) => {
  try {
    const result = await ai.runFeature('branch-detector', SCHEMAS['branch-detector'], req.body || {});
    await record('branch-detector', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/exception-resolver', async (req, res) => {
  try {
    const result = await ai.runFeature('exception-resolver', SCHEMAS['exception-resolver'], req.body || {});
    await record('exception-resolver', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workflow-merger', async (req, res) => {
  try {
    const result = await ai.runFeature('workflow-merger', SCHEMAS['workflow-merger'], req.body || {});
    await record('workflow-merger', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/demo-to-sop', async (req, res) => {
  try {
    const result = await ai.runFeature('demo-to-sop', SCHEMAS['demo-to-sop'], req.body || {});
    await record('demo-to-sop', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/action-classifier', async (req, res) => {
  try {
    const result = await ai.runFeature('action-classifier', SCHEMAS['action-classifier'], req.body || {});
    await record('action-classifier', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/automation-script-gen', async (req, res) => {
  try {
    const result = await ai.runFeature('automation-script-gen', SCHEMAS['automation-script-gen'], req.body || {});
    // Always provide a deterministic Playwright skeleton text fallback for parity with the AI text.
    if (result && !result.code) {
      const target = (req.body && req.body.target) || 'playwright';
      const url = (req.body && req.body.base_url) || 'https://example.com';
      const wf = (req.body && req.body.workflow_name) || 'workflow';
      const stepsText = (req.body && req.body.steps_text) || '';
      const stepLines = String(stepsText).split(/;|\n/).map((s) => s.trim()).filter(Boolean);
      const stepCode = stepLines.map((s, i) => `  // step ${i + 1}: ${s}\n  await page.click('text=${s.replace(/'/g, "\\'")}');`).join('\n');
      result.code = `// Auto-generated ${target} skeleton for ${wf}\nconst { chromium } = require('playwright');\n(async () => {\n  const browser = await chromium.launch();\n  const page = await browser.newPage();\n  await page.goto('${url}');\n${stepCode}\n  await browser.close();\n})();`;
      result.target = target;
      result.language = result.language || 'javascript';
    }
    await record('automation-script-gen', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/gap-filler', async (req, res) => {
  try {
    const result = await ai.runFeature('gap-filler', SCHEMAS['gap-filler'], req.body || {});
    await record('gap-filler', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/narrate-step', async (req, res) => {
  try {
    const result = await ai.runFeature('narrate-step', SCHEMAS['narrate-step'], req.body || {});
    await record('narrate-step', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/dedup-workflows', async (req, res) => {
  try {
    // If no body params, auto-build from current workflow library
    let payload = req.body || {};
    if (!payload.workflow_names) {
      try {
        const r = await pool.query('SELECT name, app_name FROM workflows ORDER BY id');
        payload = {
          ...payload,
          workflow_names: r.rows.map((x) => x.name).filter(Boolean).join(', '),
          app_names: r.rows.map((x) => x.app_name || '').join(', '),
        };
      } catch (_) { /* fall through with empty payload */ }
    }
    const result = await ai.runFeature('dedup-workflows', SCHEMAS['dedup-workflows'], payload);
    await record('dedup-workflows', payload, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/continuous-improvement', async (req, res) => {
  try {
    let payload = req.body || {};
    if (!payload.runs_text) {
      try {
        const q = await pool.query(`
          SELECT workflow_name,
                 SUM(CASE WHEN status='success' THEN 1 ELSE 0 END)::int AS succ,
                 COUNT(*)::int AS total
          FROM replay_runs
          GROUP BY workflow_name
        `);
        payload = { window: payload.window || '30d', runs_text: q.rows.map((r) => `${r.workflow_name}: ${r.succ}/${r.total}`).join('; ') };
      } catch (_) {}
    }
    const result = await ai.runFeature('continuous-improvement', SCHEMAS['continuous-improvement'], payload);
    await record('continuous-improvement', payload, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
