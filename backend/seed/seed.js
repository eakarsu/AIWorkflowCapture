const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');
const pool = require('../config/database');

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Demo seed is disabled; set ALLOW_DEMO_SEED=true only for an isolated non-production database.');
}
const demoPassword = String(process.env.DEMO_PASSWORD || '');
if (demoPassword.length < 12) throw new Error('DEMO_PASSWORD must contain at least 12 characters.');
const demoEmail = String(process.env.DEMO_EMAIL || process.env.ADMIN_EMAIL || '');
if (!demoEmail) throw new Error('DEMO_EMAIL is required.');
const demoSalt = crypto.randomBytes(16);
const demoPasswordHash = `scrypt$${demoSalt.toString('hex')}$${crypto.scryptSync(demoPassword, demoSalt, 64).toString('hex')}`;

async function main() {
  const migDir = path.join(__dirname, '..', 'migrations');
  for (const f of fs.readdirSync(migDir).filter((x) => x.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    try { await pool.query(sql); console.log(`[seed] applied ${f}`); }
    catch (e) { console.warn(`[seed] ${f} warn: ${e.message}`); }
  }
  await pool.query(
    'INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, name=EXCLUDED.name, role=EXCLUDED.role',
    [demoEmail.toLowerCase(), demoPasswordHash, process.env.BOOTSTRAP_ADMIN_NAME || 'Admin', 'commander']
  );
  console.log('[seed] demo user ready');

  // workflows
  for (const row of [{"name":"Submit Coupa Invoice","app_name":"Coupa","intent":"Submit a new invoice on Coupa portal","status":"active","step_count":7,"notes":null},{"name":"SAP Concur Expense","app_name":"SAP Concur","intent":"File an expense report","status":"active","step_count":11,"notes":null},{"name":"Port Booking","app_name":"CMA CGM","intent":"Book a container slot","status":"active","step_count":14,"notes":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO workflows (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // captured_steps
  for (const row of [{"workflow_name":"Submit Coupa Invoice","step_no":1,"semantic_label":"Click Submit Invoice button","element_hint":"button containing \"Submit\"","input_data":null},{"workflow_name":"Submit Coupa Invoice","step_no":2,"semantic_label":"Type invoice number","element_hint":"input labeled \"Invoice #\"","input_data":"INV-2026-0481"},{"workflow_name":"SAP Concur Expense","step_no":1,"semantic_label":"Click New Report","element_hint":"top-right blue button","input_data":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO captured_steps (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // replay_runs
  for (const row of [{"workflow_name":"Submit Coupa Invoice","started_at":null,"status":"success","duration_ms":8420,"error_summary":null},{"workflow_name":"SAP Concur Expense","started_at":null,"status":"failed","duration_ms":6210,"error_summary":"Step 4: selector broken"},{"workflow_name":"Port Booking","started_at":null,"status":"partial","duration_ms":18420,"error_summary":"CAPTCHA appeared"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO replay_runs (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // selector_library
  for (const row of [{"app_name":"Coupa","semantic_label":"Submit Invoice button","css_selector":"button[data-test=\"submit-invoice\"]","success_count":142},{"app_name":"SAP Concur","semantic_label":"New Report button","css_selector":"#ng-new-report-btn","success_count":88},{"app_name":"CMA CGM","semantic_label":"Book slot","css_selector":".booking-action-primary","success_count":42}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO selector_library (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // healing_events
  for (const row of [{"workflow_name":"Submit Coupa Invoice","step_no":4,"original_selector":"button#submit-7","patched_selector":"button[data-test=\"submit-invoice\"]","confidence":92},{"workflow_name":"SAP Concur Expense","step_no":2,"original_selector":".btn-primary","patched_selector":"#ng-new-report-btn","confidence":85}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO healing_events (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // exceptions
  for (const row of [{"workflow_name":"Submit Coupa Invoice","step_no":4,"kind":"selector_drift","status":"resolved","notes":null},{"workflow_name":"SAP Concur Expense","step_no":7,"kind":"validation","status":"open","notes":null},{"workflow_name":"Port Booking","step_no":6,"kind":"captcha","status":"triaged","notes":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO exceptions (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  console.log('[seed] domain rows seeded');
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
