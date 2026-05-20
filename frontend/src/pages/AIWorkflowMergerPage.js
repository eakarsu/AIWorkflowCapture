import React from 'react';
import AIPage from '../components/AIPage';
import { aiWorkflowMerger } from '../services/api';

export default function AIWorkflowMergerPage() {
  return (
    <AIPage
      title="AI · Workflow Merger"
      feature="workflow-merger"
      subtitle="Workflow Merger"
      inputs={[
        { key: 'workflow_a', label: 'Workflow A', type: 'text', placeholder: '' },
        { key: 'workflow_b', label: 'Workflow B', type: 'text', placeholder: '' },
        { key: 'similarity_hint', label: 'Similarity Hint', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiWorkflowMerger(v)}
    />
  );
}
