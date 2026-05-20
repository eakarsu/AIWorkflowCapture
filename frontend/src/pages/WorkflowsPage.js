import React from 'react';
import CrudPage from '../components/CrudPage';
import { workflowsApi } from '../services/api';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'app_name', label: 'Target App', type: 'text' },
  { key: 'intent', label: 'Intent', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ["active","draft","archived"] },
  { key: 'step_count', label: 'Steps', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

export default function WorkflowsPage() {
  return (
    <CrudPage
      title="Workflows"
      subtitle="Manage workflows records"
      api={workflowsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
