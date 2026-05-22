import React, { useState } from 'react';
import { redactionApi } from '../services/api';

export default function RedactionEnginePage() {
  const [text, setText] = useState('Card 4111 1111 1111 1111, email jane@example.com, SSN 123-45-6789');
  const [scope, setScope] = useState('');
  const [result, setResult] = useState(null);
  const [scan, setScan] = useState(null);
  const [err, setErr] = useState(null);

  async function apply() {
    setErr(null);
    try { setResult(await redactionApi.apply(text, scope || null)); }
    catch (e) { setErr(e.message); }
  }
  async function scanCorpus() {
    setErr(null);
    try { setScan(await redactionApi.scanCorpus()); }
    catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <div className="page-header"><div><h2>Secrets / Redaction Engine</h2><p>Apply rules from <code>/custom-views/redaction-rules</code> to text or scan the captured-steps corpus.</p></div></div>
      {err && <div className="ai-error">{err}</div>}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Apply rules to text</h3>
        <div className="form-grid">
          <div className="form-group full-width"><label>Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="form-group"><label>Scope (optional)</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="">any</option>
              <option value="input_data">input_data</option>
              <option value="element_hint">element_hint</option>
              <option value="semantic_label">semantic_label</option>
            </select>
          </div>
        </div>
        <button className="btn" onClick={apply}>Apply</button>
        {result && (
          <div style={{ marginTop: 12 }}>
            <div><b>Redacted:</b> <code>{result.redacted}</code></div>
            <div><b>Matched rules:</b> {result.matched.map((m) => m.name).join(', ') || '—'}</div>
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Scan corpus</h3>
        <p>Counts how many times each rule fires against current captured_steps.</p>
        <button className="btn" onClick={scanCorpus}>Run scan</button>
        {scan && (
          <div style={{ marginTop: 12 }}>
            <div><b>Scanned rows:</b> {scan.scanned_rows}</div>
            <table className="data-table"><thead><tr><th>Rule</th><th>Hits</th></tr></thead>
              <tbody>{Object.entries(scan.hits).map(([name, n]) => <tr key={name}><td>{name}</td><td>{n}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
