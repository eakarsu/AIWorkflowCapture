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
  'workflow-merger': `{"merge_viable":boolean,"shared_steps":[string],"divergent_steps":[{"step":string,"choose_from":string}],"merged_outline":[string],"summary":string}`
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

module.exports = router;
