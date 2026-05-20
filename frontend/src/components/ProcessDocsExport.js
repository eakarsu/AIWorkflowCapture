import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

// Lightweight client-side "PDF" export using window.print + a printable iframe.
// No external dependency required; produces a printable HTML page that the
// browser can save as PDF via the system Print dialog.
function buildPrintableHtml(bundle) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const sections = (bundle.docs || []).map((d) => `
    <section style="margin-bottom:24px; page-break-inside:avoid;">
      <h2 style="margin:0 0 4px 0">${esc(d.workflow.name)}</h2>
      <div style="color:#475569; font-size:12px">App: ${esc(d.workflow.app_name)} · Status: ${esc(d.workflow.status)} · ${esc(d.workflow.step_count)} steps</div>
      <p style="margin:6px 0 8px 0">${esc(d.workflow.intent || '')}</p>
      <table style="width:100%; border-collapse:collapse; font-size:12px">
        <thead><tr style="background:#f1f5f9"><th style="text-align:left;padding:4px;border:1px solid #e2e8f0">#</th><th style="text-align:left;padding:4px;border:1px solid #e2e8f0">Label</th><th style="text-align:left;padding:4px;border:1px solid #e2e8f0">Element hint</th><th style="text-align:left;padding:4px;border:1px solid #e2e8f0">Input</th></tr></thead>
        <tbody>
          ${(d.steps || []).map((s) => `<tr><td style="padding:4px;border:1px solid #e2e8f0">${esc(s.step_no)}</td><td style="padding:4px;border:1px solid #e2e8f0">${esc(s.semantic_label)}</td><td style="padding:4px;border:1px solid #e2e8f0">${esc(s.element_hint)}</td><td style="padding:4px;border:1px solid #e2e8f0">${esc(s.input_data)}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(bundle.title || 'Process Docs')}</title>
    <style>body{font-family:-apple-system,Segoe UI,sans-serif;color:#0f172a;padding:24px} h1{margin-top:0}</style>
    </head><body><h1>${esc(bundle.title || 'Process Docs')}</h1>
    <div style="color:#475569; font-size:12px">Generated ${esc(bundle.generated_at)}</div>
    ${sections}
    </body></html>`;
}

export default function ProcessDocsExport() {
  const [bundle, setBundle] = useState(null);
  const [err, setErr] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => {
    fetch(`${API_BASE}/custom-views/process-docs`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || r.status)))))
      .then(setBundle)
      .catch((e) => setErr(e.message));
  }, []);
  const exportPdf = () => {
    if (!bundle) return;
    setStatus('Opening print dialog...');
    const html = buildPrintableHtml(bundle);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { setStatus('Pop-up blocked. Allow pop-ups to export.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (_e) {} }, 250);
    setStatus('Print dialog opened — choose "Save as PDF".');
  };
  if (err) return <div className="ai-error">Process docs error: {err}</div>;
  return (
    <div className="card" data-testid="process-docs-export">
      <h3 style={{ marginTop: 0 }}>Process Documentation PDF</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Bundles every workflow plus its captured steps into a single printable document.
      </p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" disabled={!bundle} onClick={exportPdf}>Export PDF</button>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          {bundle ? `${(bundle.docs || []).length} workflows ready` : 'Loading...'}
        </span>
        {status && <span style={{ color: '#10b981', fontSize: 12 }}>{status}</span>}
      </div>
      {bundle && (
        <ul style={{ marginTop: 12, paddingLeft: 18, color: '#cbd5e1', fontSize: 12 }}>
          {(bundle.docs || []).slice(0, 6).map((d) => (
            <li key={d.workflow.id}>{d.workflow.name} — {(d.steps || []).length} steps captured</li>
          ))}
        </ul>
      )}
    </div>
  );
}
