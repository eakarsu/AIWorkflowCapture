import React from 'react';
import AIPage from '../components/AIPage';
import { aiActionClassifier } from '../services/api';

export default function AIActionClassifierPage() {
  return (
    <AIPage
      title="AI · Action Classifier"
      feature="action-classifier"
      subtitle="Classify low-level events (click/type/scroll/file) into semantic actions: form-fill, navigation, file-upload, approval."
      inputs={[
        { key: 'events_text', label: 'Raw event stream', type: 'textarea' },
        { key: 'app_name', label: 'Target App', type: 'text' },
      ]}
      run={(v) => aiActionClassifier(v)}
    />
  );
}
