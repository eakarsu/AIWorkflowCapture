import React from 'react';
import CrudPage from '../components/CrudPage';
import { exceptionsApi } from '../services/api';

const FIELDS = [
  { key: 'workflow_name', label: 'Workflow', type: 'text' },
  { key: 'step_no', label: 'Step #', type: 'number' },
  { key: 'kind', label: 'Kind', type: 'select', options: ["selector_drift","captcha","rate_limit","auth","timeout","validation"] },
  { key: 'status', label: 'Status', type: 'select', options: ["open","triaged","resolved"] },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

export default function ExceptionsPage() {
  return (
    <CrudPage
      title="Exceptions"
      subtitle="Manage exceptions records"
      api={exceptionsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
