import React from 'react';
import AIPage from '../components/AIPage';
import { aiGapFiller } from '../services/api';

export default function AIGapFillerPage() {
  return (
    <AIPage
      title="AI · Gap Filler"
      feature="gap-filler"
      subtitle="Detect discontinuities in a capture and propose the missing step(s)."
      inputs={[
        { key: 'workflow_name', label: 'Workflow', type: 'text' },
        { key: 'steps_text', label: 'Captured steps with gaps', type: 'textarea' },
      ]}
      run={(v) => aiGapFiller(v)}
    />
  );
}
