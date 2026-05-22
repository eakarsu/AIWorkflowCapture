import React from 'react';
import AIPage from '../components/AIPage';
import { aiNarrateStep } from '../services/api';

export default function AINarrateStepPage() {
  return (
    <AIPage
      title="AI · Narrate Step (Copilot)"
      feature="narrate-step"
      subtitle="Coach an operator through step N — what's happening, watch-outs, what comes next."
      inputs={[
        { key: 'workflow_name', label: 'Workflow', type: 'text' },
        { key: 'step_no', label: 'Step #', type: 'number' },
        { key: 'step_label', label: 'Step label', type: 'text' },
        { key: 'upcoming', label: 'Upcoming step', type: 'text' },
      ]}
      run={(v) => aiNarrateStep(v)}
    />
  );
}
