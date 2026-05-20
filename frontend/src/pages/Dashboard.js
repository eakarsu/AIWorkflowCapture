import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/workflows', title: 'Workflows', icon: 'W', color: '#3b82f6', desc: 'Manage workflows.' },
  { path: '/captured-steps', title: 'Captured Steps', icon: 'S', color: '#3b82f6', desc: 'Manage captured steps.' },
  { path: '/replay-runs', title: 'Replay Runs', icon: 'R', color: '#3b82f6', desc: 'Manage replay runs.' },
  { path: '/selector-library', title: 'Selector Library', icon: 'L', color: '#3b82f6', desc: 'Manage selector library.' },
  { path: '/healing-events', title: 'Healing Events', icon: 'H', color: '#3b82f6', desc: 'Manage healing events.' },
  { path: '/exceptions', title: 'Exceptions', icon: 'E', color: '#3b82f6', desc: 'Manage exceptions.' },
  { path: '/ai/capture-analyze', title: 'AI · Analyze Capture', icon: '*', color: '#8b5cf6', desc: 'Analyze Capture' },
  { path: '/ai/replay-plan', title: 'AI · Generate Replay Plan', icon: '*', color: '#8b5cf6', desc: 'Generate Replay Plan' },
  { path: '/ai/self-heal', title: 'AI · Self-Heal Failed Step', icon: '*', color: '#8b5cf6', desc: 'Self-Heal Failed Step' },
  { path: '/ai/intent-classifier', title: 'AI · Intent Classifier', icon: '*', color: '#8b5cf6', desc: 'Intent Classifier' },
  { path: '/ai/parameter-suggester', title: 'AI · Parameter Suggester', icon: '*', color: '#8b5cf6', desc: 'Parameter Suggester' },
  { path: '/ai/branch-detector', title: 'AI · Branch Detector', icon: '*', color: '#8b5cf6', desc: 'Branch Detector' },
  { path: '/ai/exception-resolver', title: 'AI · Exception Resolver', icon: '*', color: '#8b5cf6', desc: 'Exception Resolver' },
  { path: '/ai/workflow-merger', title: 'AI · Workflow Merger', icon: '*', color: '#8b5cf6', desc: 'Workflow Merger' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { getDashboardStats().then(setStats).catch((e) => setErr(e.message)); }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Workflow Capture & Replay</h2>
        <p>Watch a task once. Replay it forever — self-heal on UI drift.</p>
      </div>
      {err && <div className="ai-error">Stats unavailable: {err}</div>}
      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Workflows</div><div className="stat-value">{stats.workflows?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Captured Steps</div><div className="stat-value">{stats.captured_steps?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Replay Runs</div><div className="stat-value">{stats.replay_runs?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Selector Library</div><div className="stat-value">{stats.selector_library?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Healing Events</div><div className="stat-value">{stats.healing_events?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Exceptions</div><div className="stat-value">{stats.exceptions?.total ?? '—'}</div></div>
        </div>
      )}
      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.path} className="feature-card" style={{ ['--card-color']: f.color }} onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
