import React from 'react';
import AIPage from '../components/AIPage';
import { aiDemoToSop } from '../services/api';

export default function AIDemoToSopPage() {
  return (
    <AIPage
      title="AI · Demo-to-SOP Generator"
      feature="demo-to-sop"
      subtitle="Turn a captured demo into a human-readable SOP (markdown) with screenshots, decisions, exception handling."
      inputs={[
        { key: 'workflow_name', label: 'Workflow', type: 'text' },
        { key: 'steps_text', label: 'Steps (free text)', type: 'textarea' },
        { key: 'screenshots', label: 'Screenshot refs (comma)', type: 'text' },
      ]}
      run={(v) => aiDemoToSop(v)}
    />
  );
}
