import React, { useEffect, useState } from 'react';
import { improvementApi, getRole } from '../services/api';

export default function RoleDashboardPage() {
  const [role, setRole] = useState(getRole() === 'commander' ? 'manager' : 'operator');
  const [data, setData] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [err, setErr] = useState(null);

  async function refresh() {
    setErr(null);
    try {
      const [d, dec] = await Promise.all([improvementApi.roleDashboard(role), improvementApi.declining()]);
      setData(d); setDeclining(dec);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [role]);

  return (
    <div>
      <div className="page-header"><div><h2>Role Dashboard</h2><p>Manager (ROI, exception trends) vs Operator (next-step, open exceptions). Continuous-improvement detector below.</p></div></div>
      {err && <div className="ai-error">{err}</div>}
      <div className="card">
        <div className="form-grid">
          <div className="form-group"><label>View as</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="manager">manager</option>
              <option value="operator">operator</option>
            </select>
          </div>
        </div>
      </div>
      {data && data.view === 'manager' && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Manager view</h3>
          <ul>
            <li>Workflows: <b>{data.workflows}</b></li>
            <li>Total runs: <b>{data.total_runs}</b></li>
            <li>Success rate: <b>{data.success_rate}%</b></li>
            <li>Failed: <b>{data.failed}</b></li>
            <li>Healing events: <b>{data.healing_events}</b></li>
            <li>Hours saved (est.): <b>{data.estimated_hours_saved}</b></li>
          </ul>
          <h4>Exception trends</h4>
          {(data.exception_trends || []).length === 0 ? <div className="empty-state">None.</div> : (
            <table className="data-table"><thead><tr><th>Kind</th><th>Count</th></tr></thead>
              <tbody>{data.exception_trends.map((r, i) => <tr key={i}><td>{r.kind}</td><td>{r.n}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}
      {data && data.view === 'operator' && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Operator view</h3>
          <h4>Queued workflows</h4>
          {(data.queued_workflows || []).length === 0 ? <div className="empty-state">Nothing queued.</div> : (
            <ul>{data.queued_workflows.map((w) => <li key={w.id}>{w.name} ({w.status}) — last run: {w.last_run || 'never'}</li>)}</ul>
          )}
          <h4>Open exceptions</h4>
          {(data.open_exceptions || []).length === 0 ? <div className="empty-state">No open exceptions.</div> : (
            <ul>{data.open_exceptions.map((x) => <li key={x.id}>{x.workflow_name} · step {x.step_no} · {x.kind} — {x.notes}</li>)}</ul>
          )}
        </div>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Continuous-improvement detector</h3>
        {!declining ? <div className="empty-state">Loading...</div> : (
          declining.declining.length === 0 ? <div className="empty-state">No declining workflows (≥5% drop in 14d window).</div> :
          <table className="data-table"><thead><tr><th>Workflow</th><th>Recent</th><th>Baseline</th><th>Δ</th><th>Recent runs</th></tr></thead>
            <tbody>{declining.declining.map((r, i) => (
              <tr key={i}><td>{r.workflow_name}</td><td>{Math.round(r.recent_success_rate * 100)}%</td><td>{Math.round(r.baseline_success_rate * 100)}%</td><td>{Math.round(r.delta * 100)}%</td><td>{r.recent_runs}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
