import React from 'react';
import StepFrequencyChart from '../components/StepFrequencyChart';
import ToolUsageHeatmap from '../components/ToolUsageHeatmap';
import ProcessDocsExport from '../components/ProcessDocsExport';
import RedactionRulesEditor from '../components/RedactionRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h2>Capture Views</h2>
          <p>Cross-cutting analytics and governance views over captured workflows.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16 }}>
        <StepFrequencyChart />
        <ToolUsageHeatmap />
        <ProcessDocsExport />
        <RedactionRulesEditor />
      </div>
    </div>
  );
}
