import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import WorkflowsPage from './pages/WorkflowsPage';
import CapturedStepsPage from './pages/CapturedStepsPage';
import ReplayRunsPage from './pages/ReplayRunsPage';
import SelectorLibraryPage from './pages/SelectorLibraryPage';
import HealingEventsPage from './pages/HealingEventsPage';
import ExceptionsPage from './pages/ExceptionsPage';
import AICaptureAnalyzePage from './pages/AICaptureAnalyzePage';
import AIReplayPlanPage from './pages/AIReplayPlanPage';
import AISelfHealPage from './pages/AISelfHealPage';
import AIIntentClassifierPage from './pages/AIIntentClassifierPage';
import AIParameterSuggesterPage from './pages/AIParameterSuggesterPage';
import AIBranchDetectorPage from './pages/AIBranchDetectorPage';
import AIExceptionResolverPage from './pages/AIExceptionResolverPage';
import AIWorkflowMergerPage from './pages/AIWorkflowMergerPage';
import WorkflowLibraryWorkbench from './pages/WorkflowLibraryWorkbench';
import CustomViewsPage from './pages/CustomViewsPage';
import { getToken } from './services/api';
import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Pass 7 — new AI features
import AIDemoToSopPage from './pages/AIDemoToSopPage';
import AIActionClassifierPage from './pages/AIActionClassifierPage';
import AIAutomationScriptGenPage from './pages/AIAutomationScriptGenPage';
import AIGapFillerPage from './pages/AIGapFillerPage';
import AINarrateStepPage from './pages/AINarrateStepPage';
import AIDedupWorkflowsPage from './pages/AIDedupWorkflowsPage';
import AIContinuousImprovementPage from './pages/AIContinuousImprovementPage';

// Pass 7 — new non-AI features
import RecordingSessionsPage from './pages/RecordingSessionsPage';
import PermissionScopesPage from './pages/PermissionScopesPage';
import AuditLogPage from './pages/AuditLogPage';
import RedactionEnginePage from './pages/RedactionEnginePage';
import MarketplacePage from './pages/MarketplacePage';
import RoleDashboardPage from './pages/RoleDashboardPage';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function Shell() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/captured-steps" element={<CapturedStepsPage />} />
            <Route path="/replay-runs" element={<ReplayRunsPage />} />
            <Route path="/selector-library" element={<SelectorLibraryPage />} />
            <Route path="/healing-events" element={<HealingEventsPage />} />
            <Route path="/exceptions" element={<ExceptionsPage />} />
            <Route path="/ai/capture-analyze" element={<AICaptureAnalyzePage />} />
            <Route path="/ai/replay-plan" element={<AIReplayPlanPage />} />
            <Route path="/ai/self-heal" element={<AISelfHealPage />} />
            <Route path="/ai/intent-classifier" element={<AIIntentClassifierPage />} />
            <Route path="/ai/parameter-suggester" element={<AIParameterSuggesterPage />} />
            <Route path="/ai/branch-detector" element={<AIBranchDetectorPage />} />
            <Route path="/ai/exception-resolver" element={<AIExceptionResolverPage />} />
            <Route path="/ai/workflow-merger" element={<AIWorkflowMergerPage />} />
            <Route path="/wb/workflow-library" element={<WorkflowLibraryWorkbench />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />
            {/* Pass 7 routes */}
            <Route path="/ai/demo-to-sop" element={<AIDemoToSopPage />} />
            <Route path="/ai/action-classifier" element={<AIActionClassifierPage />} />
            <Route path="/ai/automation-script-gen" element={<AIAutomationScriptGenPage />} />
            <Route path="/ai/gap-filler" element={<AIGapFillerPage />} />
            <Route path="/ai/narrate-step" element={<AINarrateStepPage />} />
            <Route path="/ai/dedup-workflows" element={<AIDedupWorkflowsPage />} />
            <Route path="/ai/continuous-improvement" element={<AIContinuousImprovementPage />} />
            <Route path="/recordings" element={<RecordingSessionsPage />} />
            <Route path="/permissions" element={<PermissionScopesPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/redaction" element={<RedactionEnginePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/role-dashboard" element={<RoleDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </Router>
  );
}
