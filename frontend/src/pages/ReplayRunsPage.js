import React from 'react';
import CrudPage from '../components/CrudPage';
import { replay_runsApi } from '../services/api';

const FIELDS = [
  { key: 'workflow_name', label: 'Workflow', type: 'text' },
  { key: 'started_at', label: 'Started', type: 'datetime-local' },
  { key: 'status', label: 'Status', type: 'select', options: ["success","failed","running","partial"] },
  { key: 'duration_ms', label: 'Duration (ms)', type: 'number' },
  { key: 'error_summary', label: 'Error', type: 'textarea' }
];

export default function ReplayRunsPage() {
  return (
    <CrudPage
      title="Replay Runs"
      subtitle="Manage replay runs records"
      api={replay_runsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
