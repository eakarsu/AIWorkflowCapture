import React from 'react';
import AIPage from '../components/AIPage';
import { aiCaptureAnalyze } from '../services/api';

export default function AICaptureAnalyzePage() {
  return (
    <AIPage
      title="AI · Analyze Capture"
      feature="capture-analyze"
      subtitle="Analyze Capture"
      inputs={[
        { key: 'trace_text', label: 'Captured Trace', type: 'textarea', placeholder: '' },
        { key: 'app_name', label: 'Target App', type: 'text', placeholder: '' }
      ]}
      run={(v) => aiCaptureAnalyze(v)}
    />
  );
}
