import React from 'react';
import AIPage from '../components/AIPage';
import { aiBranchDetector } from '../services/api';

export default function AIBranchDetectorPage() {
  return (
    <AIPage
      title="AI · Branch Detector"
      feature="branch-detector"
      subtitle="Branch Detector"
      inputs={[
        { key: 'workflow_name', label: 'Workflow', type: 'text', placeholder: '' },
        { key: 'observation', label: 'Observation', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiBranchDetector(v)}
    />
  );
}
