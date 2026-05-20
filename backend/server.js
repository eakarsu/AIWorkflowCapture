const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 4053;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4052').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIWorkflowCapture', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);

// CRUD entities
app.use('/api/workflows', require('./routes/Workflows'));
app.use('/api/captured-steps', require('./routes/CapturedSteps'));
app.use('/api/replay-runs', require('./routes/ReplayRuns'));
app.use('/api/selector-library', require('./routes/SelectorLibrary'));
app.use('/api/healing-events', require('./routes/HealingEvents'));
app.use('/api/exceptions', require('./routes/Exceptions'));

// AI + cross-cutting
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/api', require('./routes/workflowExtras'));

// Custom Views — mounted BEFORE the 404 fallback below
app.use('/api/custom-views', require('./routes/customViews'));

// 404 fallback for unknown API paths
app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));

app.listen(PORT, () => console.log(`\nWorkflow Capture & Replay API on http://localhost:${PORT}\n`));
