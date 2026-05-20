import React from 'react';
import AIPage from '../components/AIPage';
import { aiSelfHeal } from '../services/api';

export default function AISelfHealPage() {
  return (
    <AIPage
      title="AI · Self-Heal Failed Step"
      feature="self-heal"
      subtitle="Self-Heal Failed Step"
      inputs={[
        { key: 'failed_step', label: 'Failing Step', type: 'textarea', placeholder: '' },
        { key: 'screenshot_text', label: 'Screenshot Text Extract', type: 'textarea', placeholder: '' },
        { key: 'last_known_selector', label: 'Last Known Selector', type: 'text', placeholder: '' }
      ]}
      run={(v) => aiSelfHeal(v)}
    />
  );
}
