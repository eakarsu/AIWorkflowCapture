import React from 'react';
import AIPage from '../components/AIPage';
import { aiContinuousImprovement } from '../services/api';

export default function AIContinuousImprovementPage() {
  return (
    <AIPage
      title="AI · Continuous Improvement Detector"
      feature="continuous-improvement"
      subtitle="Surface workflows whose success rate is declining and propose remediation. Leave runs blank to auto-load DB."
      inputs={[
        { key: 'window', label: 'Window (e.g. 7d, 30d, 90d)', type: 'text' },
        { key: 'runs_text', label: 'Run outcomes (free text)', type: 'textarea' },
      ]}
      run={(v) => aiContinuousImprovement(v)}
    />
  );
}
