import React from 'react';
import AIPage from '../components/AIPage';
import { aiReplayPlan } from '../services/api';

export default function AIReplayPlanPage() {
  return (
    <AIPage
      title="AI · Generate Replay Plan"
      feature="replay-plan"
      subtitle="Generate Replay Plan"
      inputs={[
        { key: 'workflow_id', label: 'Workflow record ID', type: 'text', placeholder: 'Enter an existing workflow ID', requiresExistingRecord: true },
        { key: 'parameters_json', label: 'Run Params (JSON)', type: 'textarea', placeholder: '' }
      ]}
      run={(v, requestOptions) => aiReplayPlan(v, requestOptions)}
    />
  );
}
