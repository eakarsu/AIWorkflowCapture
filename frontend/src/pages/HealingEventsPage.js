import React from 'react';
import CrudPage from '../components/CrudPage';
import { healing_eventsApi } from '../services/api';

const FIELDS = [
  { key: 'workflow_name', label: 'Workflow', type: 'text' },
  { key: 'step_no', label: 'Step #', type: 'number' },
  { key: 'original_selector', label: 'Original', type: 'text' },
  { key: 'patched_selector', label: 'Patched', type: 'text' },
  { key: 'confidence', label: 'Confidence', type: 'number' }
];

export default function HealingEventsPage() {
  return (
    <CrudPage
      title="Healing Events"
      subtitle="Manage healing events records"
      api={healing_eventsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
