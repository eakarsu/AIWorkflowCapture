import React from 'react';
import AIPage from '../components/AIPage';
import { aiIntentClassifier } from '../services/api';

export default function AIIntentClassifierPage() {
  return (
    <AIPage
      title="AI · Intent Classifier"
      feature="intent-classifier"
      subtitle="Intent Classifier"
      inputs={[
        { key: 'utterance', label: 'User Utterance', type: 'textarea', placeholder: '' },
        { key: 'allowed_intents', label: 'Allowed Intents (comma)', type: 'text', placeholder: 'submit_invoice, file_expense, book_port' }
      ]}
      run={(v) => aiIntentClassifier(v)}
    />
  );
}
