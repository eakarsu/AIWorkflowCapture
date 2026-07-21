const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { validateRuntime } = require('./governance/runtime');
validateRuntime();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { authenticateToken } = require('./middleware/auth');
const { createProviderGate } = require('./governance/providerGate');

const app = express();
const port = Number(process.env.BACKEND_PORT || 4053);
const origins = String(process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'http://localhost:4052')
  .split(',').map((value) => value.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin(origin, callback) {
  if (!origin || origins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS.'));
}, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AIWorkflowCapture', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governance', require('./governance/router'));

app.use('/api', authenticateToken);
const providerGate = createProviderGate(['/api/workflows','/api/captured-steps','/api/replay-runs','/api/selector-library','/api/healing-events','/api/exceptions','/api/ai','/api/recordings','/api/redaction','/api/marketplace','/api/improvement']);
app.use(providerGate);
if (process.env.ENABLE_LEGACY_PROVIDER_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  const routes = [
    ['/api/workflows','./routes/Workflows'],['/api/captured-steps','./routes/CapturedSteps'],
    ['/api/replay-runs','./routes/ReplayRuns'],['/api/selector-library','./routes/SelectorLibrary'],
    ['/api/healing-events','./routes/HealingEvents'],['/api/exceptions','./routes/Exceptions'],
    ['/api/ai','./routes/ai'],['/api/notifications','./routes/notifications'],
    ['/api/attachments','./routes/attachments'],['/api/webhooks','./routes/webhooks'],
    ['/api/dashboard','./routes/dashboard'],['/api/custom-views','./routes/customViews'],
    ['/api/recordings','./routes/recordings'],['/api/permissions','./routes/permissions'],
    ['/api/audit-log','./routes/auditLog'],['/api/redaction','./routes/redactionEngine'],
    ['/api/marketplace','./routes/marketplace'],['/api/improvement','./routes/improvement'],
    ['/api','./routes/workflowExtras']
  ];
  for (const [mount, modulePath] of routes) app.use(mount, require(modulePath));
}

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' }));

function start() {
  return app.listen(port, () => console.log(`Workflow Capture API listening on ${port}`));
}
if (require.main === module) start();
module.exports = { app, start };
