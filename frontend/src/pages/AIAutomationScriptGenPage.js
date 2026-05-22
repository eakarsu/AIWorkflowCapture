import React from 'react';
import AIPage from '../components/AIPage';
import { aiAutomationScriptGen } from '../services/api';

export default function AIAutomationScriptGenPage() {
  return (
    <AIPage
      title="AI · Automation Script Generator"
      feature="automation-script-gen"
      subtitle="Emit Playwright / Selenium / Puppeteer skeleton code from a workflow."
      inputs={[
        { key: 'target', label: 'Target', type: 'select', options: ['playwright', 'selenium', 'puppeteer'] },
        { key: 'language', label: 'Language', type: 'select', options: ['javascript', 'python', 'typescript'] },
        { key: 'workflow_name', label: 'Workflow', type: 'text' },
        { key: 'base_url', label: 'Base URL', type: 'text' },
        { key: 'steps_text', label: 'Steps (free text)', type: 'textarea' },
      ]}
      run={(v) => aiAutomationScriptGen(v)}
    />
  );
}
