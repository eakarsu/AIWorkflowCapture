import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

const TRIGGERS = ['on_capture', 'on_replay', 'on_capture_skip'];
const SCOPES = ['input_data', 'element_hint', 'semantic_label'];

function authHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...extra };
}

export default function RedactionRulesEditor() {
  const [rules, setRules] = useState([]);
  const [draft, setDraft] = useState({ name: '', pattern: '', mask_with: '****', trigger: 'on_capture', scope: 'input_data', active: true });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => fetch(`${API_BASE}/custom-views/redaction-rules`, { headers: authHeaders() })
    .then((r) => r.json()).then((d) => setRules(d.rules || [])).catch((e) => setErr(e.message));
  useEffect(load, []);

  const create = async () => {
    if (!draft.name || !draft.pattern) { setErr('Name and pattern required'); return; }
    setBusy(true); setErr(null);
    try {
      await fetch(`${API_BASE}/custom-views/redaction-rules`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(draft) });
      setDraft({ name: '', pattern: '', mask_with: '****', trigger: 'on_capture', scope: 'input_data', active: true });
      load();
    } finally { setBusy(false); }
  };
  const update = async (id, patch) => {
    await fetch(`${API_BASE}/custom-views/redaction-rules/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(patch) });
    load();
  };
  const remove = async (id) => {
    await fetch(`${API_BASE}/custom-views/redaction-rules/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  };

  return (
    <div className="card" data-testid="redaction-rules-editor">
      <h3 style={{ marginTop: 0 }}>Capture & Redaction Rules</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Apply masking to captured steps and decide when capture should skip a frame.
      </p>
      {err && <div className="ai-error" style={{ marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#94a3b8' }}>Name
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#94a3b8' }}>Pattern
          <input value={draft.pattern} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} placeholder="\\b\\d{16}\\b" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#94a3b8' }}>Mask With
          <input value={draft.mask_with} onChange={(e) => setDraft({ ...draft, mask_with: e.target.value })} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#94a3b8' }}>Trigger
          <select value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value })}>
            {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#94a3b8' }}>Scope
          <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })}>
            {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#94a3b8' }}>Active
          <input type="checkbox" checked={!!draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
        </label>
        <button className="btn" disabled={busy} onClick={create}>Add rule</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: 6 }}>Name</th>
              <th style={{ padding: 6 }}>Pattern</th>
              <th style={{ padding: 6 }}>Mask</th>
              <th style={{ padding: 6 }}>Trigger</th>
              <th style={{ padding: 6 }}>Scope</th>
              <th style={{ padding: 6 }}>Active</th>
              <th style={{ padding: 6 }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #1f2937' }}>
                <td style={{ padding: 6 }}>{r.name}</td>
                <td style={{ padding: 6, fontFamily: 'monospace' }}>{r.pattern}</td>
                <td style={{ padding: 6, fontFamily: 'monospace' }}>{r.mask_with}</td>
                <td style={{ padding: 6 }}>
                  <select value={r.trigger} onChange={(e) => update(r.id, { trigger: e.target.value })}>
                    {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ padding: 6 }}>
                  <select value={r.scope} onChange={(e) => update(r.id, { scope: e.target.value })}>
                    {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding: 6 }}>
                  <input type="checkbox" checked={!!r.active} onChange={(e) => update(r.id, { active: e.target.checked })} />
                </td>
                <td style={{ padding: 6 }}>
                  <button className="btn secondary" onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 12, color: '#94a3b8' }}>No rules defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
