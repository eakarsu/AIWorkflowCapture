import React, { useEffect, useState } from 'react';
import { permissionsApi, isCommander } from '../services/api';

export default function PermissionScopesPage() {
  const admin = isCommander();
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState({ user_email: '', scope_type: 'workflow', scope_value: '', can_view: true, can_replay: false, can_edit: false });

  async function refresh() {
    try {
      const [list, mine] = await Promise.all([permissionsApi.list().catch(() => []), permissionsApi.me()]);
      setRows(Array.isArray(list) ? list : []);
      setMe(mine);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { refresh(); }, []);

  async function create() {
    try { await permissionsApi.create(draft); setDraft({ user_email: '', scope_type: 'workflow', scope_value: '', can_view: true, can_replay: false, can_edit: false }); await refresh(); }
    catch (e) { setErr(e.message); }
  }
  async function remove(id) {
    if (!window.confirm('Delete scope?')) return;
    try { await permissionsApi.remove(id); await refresh(); } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <div className="page-header"><div><h2>Permission Scopes</h2><p>Per-user, per-workflow/app view/replay/edit rules. Layered on top of role.</p></div></div>
      {err && <div className="ai-error">{err}</div>}
      {me && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>My scopes</h3>
          <div>{me.user} · role <b>{me.role}</b> · {me.scopes.length} scope rule(s)</div>
          {me.scopes.length > 0 && (
            <ul>{me.scopes.map((s) => <li key={s.id}>{s.scope_type}:{s.scope_value} — {[s.can_view && 'view', s.can_replay && 'replay', s.can_edit && 'edit'].filter(Boolean).join(', ')}</li>)}</ul>
          )}
        </div>
      )}
      {admin && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Add scope (commander only)</h3>
          <div className="form-grid">
            <div className="form-group"><label>User email</label><input value={draft.user_email} onChange={(e) => setDraft({ ...draft, user_email: e.target.value })} /></div>
            <div className="form-group"><label>Scope type</label>
              <select value={draft.scope_type} onChange={(e) => setDraft({ ...draft, scope_type: e.target.value })}>
                <option value="workflow">workflow</option><option value="app">app</option><option value="all">all</option>
              </select>
            </div>
            <div className="form-group"><label>Scope value</label><input value={draft.scope_value} onChange={(e) => setDraft({ ...draft, scope_value: e.target.value })} /></div>
            <div className="form-group"><label><input type="checkbox" checked={draft.can_view} onChange={(e) => setDraft({ ...draft, can_view: e.target.checked })} /> can_view</label></div>
            <div className="form-group"><label><input type="checkbox" checked={draft.can_replay} onChange={(e) => setDraft({ ...draft, can_replay: e.target.checked })} /> can_replay</label></div>
            <div className="form-group"><label><input type="checkbox" checked={draft.can_edit} onChange={(e) => setDraft({ ...draft, can_edit: e.target.checked })} /> can_edit</label></div>
          </div>
          <button className="btn" onClick={create}>Add scope</button>
        </div>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>All scope rules ({rows.length})</h3>
        {rows.length === 0 ? <div className="empty-state">No scopes defined.</div> : (
          <table className="data-table">
            <thead><tr><th>#</th><th>User</th><th>Type</th><th>Value</th><th>view</th><th>replay</th><th>edit</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td><td>{r.user_email}</td><td>{r.scope_type}</td><td>{r.scope_value}</td>
                <td>{r.can_view ? 'Y' : 'N'}</td><td>{r.can_replay ? 'Y' : 'N'}</td><td>{r.can_edit ? 'Y' : 'N'}</td>
                <td>{admin && <button className="btn secondary" onClick={() => remove(r.id)}>Delete</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
