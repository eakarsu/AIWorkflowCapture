import React from 'react';
import AIPage from '../components/AIPage';
import { aiParameterSuggester } from '../services/api';

export default function AIParameterSuggesterPage() {
  return (
    <AIPage
      title="AI · Parameter Suggester"
      feature="parameter-suggester"
      subtitle="Parameter Suggester"
      inputs={[
        { key: 'workflow_name', label: 'Workflow', type: 'text', placeholder: '' },
        { key: 'partial_input', label: 'Partial Input', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiParameterSuggester(v)}
    />
  );
}
