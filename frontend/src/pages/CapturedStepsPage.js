import React from 'react';
import CrudPage from '../components/CrudPage';
import { captured_stepsApi } from '../services/api';

const FIELDS = [
  { key: 'workflow_name', label: 'Workflow', type: 'text' },
  { key: 'step_no', label: 'Step #', type: 'number' },
  { key: 'semantic_label', label: 'Semantic Label', type: 'text' },
  { key: 'element_hint', label: 'Element Hint', type: 'textarea' },
  { key: 'input_data', label: 'Input Data', type: 'textarea' }
];

export default function CapturedStepsPage() {
  return (
    <CrudPage
      title="Captured Steps"
      subtitle="Manage captured steps records"
      api={captured_stepsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
