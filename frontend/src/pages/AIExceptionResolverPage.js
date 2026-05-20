import React from 'react';
import AIPage from '../components/AIPage';
import { aiExceptionResolver } from '../services/api';

export default function AIExceptionResolverPage() {
  return (
    <AIPage
      title="AI · Exception Resolver"
      feature="exception-resolver"
      subtitle="Exception Resolver"
      inputs={[
        { key: 'workflow_name', label: 'Workflow', type: 'text', placeholder: '' },
        { key: 'exception_kind', label: 'Kind', type: 'text', placeholder: '' },
        { key: 'context', label: 'Context', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiExceptionResolver(v)}
    />
  );
}
