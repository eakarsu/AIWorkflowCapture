import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

function colorFor(v, max) {
  const t = Math.max(0, Math.min(1, v / (max || 1)));
  // teal → amber → red ramp
  const r = Math.round(34 + (239 - 34) * t);
  const g = Math.round(197 - (197 - 68) * t);
  const b = Math.round(94 - (94 - 68) * Math.min(1, t * 1.2));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ToolUsageHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/custom-views/tool-usage-heatmap`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || r.status)))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="ai-error">Tool usage error: {err}</div>;
  if (!data) return <div className="card">Loading tool heatmap...</div>;
  const { users = [], tools = [], matrix = [], max = 1 } = data;
  return (
    <div className="card" data-testid="tool-heatmap">
      <h3 style={{ marginTop: 0 }}>Tool Usage Heatmap (User x Tool)</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>Replay-run intensity per operator and tool, deeper red = heavier use.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ color: '#94a3b8', textAlign: 'left' }}>user \\ tool</th>
              {tools.map((t) => (
                <th key={t} style={{ color: '#cbd5e1', padding: '4px 8px', whiteSpace: 'nowrap' }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, ui) => (
              <tr key={u}>
                <td style={{ color: '#cbd5e1', paddingRight: 8 }}>{u}</td>
                {tools.map((t, ti) => {
                  const v = matrix[ui]?.[ti] || 0;
                  return (
                    <td key={t}
                        title={`${u} x ${t}: ${v}`}
                        style={{
                          width: 70, height: 32, textAlign: 'center', borderRadius: 4,
                          background: colorFor(v, max), color: '#0f172a', fontWeight: 600,
                        }}>
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
