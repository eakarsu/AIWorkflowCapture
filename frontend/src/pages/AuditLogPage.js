import React, { useEffect, useState } from 'react';
import { auditApi } from '../services/api';

export default function AuditLogPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState(null);
  const [actor, setActor] = useState('');
  const [resourceType, setResourceType] = useState('');

  async function refresh() {
    try {
      const filters = {};
      if (actor) filters.actor = actor;
      if (resourceType) filters.resource_type = resourceType;
      const [list, sum] = await Promise.all([auditApi.list(filters), auditApi.summary()]);
      setRows(Array.isArray(list) ? list : []);
      setSummary(sum);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="page-header"><div><h2>Audit Trail</h2><p>Who did what, when. Workflow edits, replay runs, scope/marketplace changes.</p></div></div>
      {err && <div className="ai-error">{err}</div>}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div className="form-grid">
          <div className="form-group"><label>Actor</label><input value={actor} onChange={(e) => setActor(e.target.value)} /></div>
          <div className="form-group"><label>Resource type</label><input value={resourceType} onChange={(e) => setResourceType(e.target.value)} /></div>
        </div>
        <button className="btn" onClick={refresh}>Apply</button>
      </div>
      {summary && summary.rows && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Action mix</h3>
          <table className="data-table"><thead><tr><th>Resource</th><th>Action</th><th>Count</th></tr></thead>
            <tbody>{summary.rows.map((r, i) => <tr key={i}><td>{r.resource_type || '—'}</td><td>{r.action}</td><td>{r.n}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Recent events ({rows.length})</h3>
        {rows.length === 0 ? <div className="empty-state">No audit events yet. (Pass-7 routes auto-record into this table.)</div> : (
          <table className="data-table">
            <thead><tr><th>#</th><th>When</th><th>Actor</th><th>Action</th><th>Resource</th><th>ID</th><th>Details</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
                <td>{r.actor}</td><td>{r.action}</td>
                <td>{r.resource_type}</td><td>{r.resource_id}</td>
                <td><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(r.details || {}, null, 0)}</pre></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
