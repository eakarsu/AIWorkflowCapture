import React from 'react';
import AIPage from '../components/AIPage';
import { aiDedupWorkflows } from '../services/api';

export default function AIDedupWorkflowsPage() {
  return (
    <AIPage
      title="AI · Corpus-wide Workflow Dedup"
      feature="dedup-workflows"
      subtitle="Cluster the whole workflow library; recommend canonical dedups. Leave blank to auto-load DB names."
      inputs={[
        { key: 'workflow_names', label: 'Workflow names (comma)', type: 'textarea' },
        { key: 'app_names', label: 'App names (comma, parallel)', type: 'textarea' },
      ]}
      run={(v) => aiDedupWorkflows(v)}
    />
  );
}
