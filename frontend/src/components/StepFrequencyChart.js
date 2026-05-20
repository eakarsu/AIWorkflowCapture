import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

export default function StepFrequencyChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/custom-views/step-frequency`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || r.status)))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="ai-error">Step frequency error: {err}</div>;
  if (!data) return <div className="card">Loading step frequency...</div>;
  const rows = data.rows || [];
  return (
    <div className="card" data-testid="step-freq-chart">
      <h3 style={{ marginTop: 0 }}>Process Step Frequency</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Top {rows.length} semantic step labels by capture count.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r) => {
          const pct = Math.max(2, Math.round((r.freq / data.max) * 100));
          return (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 60px', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.label}>{r.label}</div>
              <div style={{ background: '#1f2937', borderRadius: 4, height: 14, position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#06b6d4)', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{r.freq}</div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ color: '#94a3b8' }}>No captured steps yet.</div>}
      </div>
    </div>
  );
}
