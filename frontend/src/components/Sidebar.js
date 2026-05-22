import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const CRUD_LINKS = [
  { to: '/workflows', label: 'Workflows' },
  { to: '/captured-steps', label: 'Captured Steps' },
  { to: '/replay-runs', label: 'Replay Runs' },
  { to: '/selector-library', label: 'Selector Library' },
  { to: '/healing-events', label: 'Healing Events' },
  { to: '/exceptions', label: 'Exceptions' },
];

const AI_LINKS = [
  { to: '/ai/capture-analyze', label: 'AI · Analyze Capture' },
  { to: '/ai/replay-plan', label: 'AI · Generate Replay Plan' },
  { to: '/ai/self-heal', label: 'AI · Self-Heal Failed Step' },
  { to: '/ai/intent-classifier', label: 'AI · Intent Classifier' },
  { to: '/ai/parameter-suggester', label: 'AI · Parameter Suggester' },
  { to: '/ai/branch-detector', label: 'AI · Branch Detector' },
  { to: '/ai/exception-resolver', label: 'AI · Exception Resolver' },
  { to: '/ai/workflow-merger', label: 'AI · Workflow Merger' },
  { to: '/ai/demo-to-sop', label: 'AI · Demo-to-SOP' },
  { to: '/ai/action-classifier', label: 'AI · Action Classifier' },
  { to: '/ai/automation-script-gen', label: 'AI · Script Generator' },
  { to: '/ai/gap-filler', label: 'AI · Gap Filler' },
  { to: '/ai/narrate-step', label: 'AI · Narrate Step' },
  { to: '/ai/dedup-workflows', label: 'AI · Dedup Workflows' },
  { to: '/ai/continuous-improvement', label: 'AI · Continuous Improvement' },
];

const CUSTOM_LINKS = [
  { to: '/wb/workflow-library', label: 'Workflow Library' },
  { to: '/custom-views', label: 'Capture Views' },
  { to: '/recordings', label: 'Recording Sessions' },
  { to: '/permissions', label: 'Permission Scopes' },
  { to: '/audit-log', label: 'Audit Trail' },
  { to: '/redaction', label: 'Redaction Engine' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/role-dashboard', label: 'Role Dashboard' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>WORKFLOW CAPTURE & REPLAY</h1>
        <p>Watch a task once. Replay it forever — self-heal on UI drift.</p>
      </div>
      <NavLink to="/" end>Dashboard</NavLink>
      <div className="sidebar-group-label">Data</div>
      {CRUD_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-group-label">AI Features</div>
      {AI_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      {CUSTOM_LINKS.length > 0 && <div className="sidebar-group-label">Workbenches</div>}
      {CUSTOM_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
