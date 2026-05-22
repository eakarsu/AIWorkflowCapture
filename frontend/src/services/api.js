const API_BASE = 'http://localhost:4053/api';
const TOKEN_KEY = 'workflow_capture_token';
const USER_KEY = 'workflow_capture_user';

export { API_BASE };
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };
export const getStoredUser = () => { try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const setStoredUser = (u) => { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch {} };
export function logout() { setToken(null); setStoredUser(null); if (typeof window !== 'undefined') window.location.assign('/login'); }
export function getRole() { return (getStoredUser()?.role || 'viewer').toLowerCase(); }
export function canWrite() { return ['commander', 'analyst'].includes(getRole()); }
export function isCommander() { return getRole() === 'commander'; }

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401 && !url.startsWith('/auth/login')) { logout(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function crud(base) {
  return {
    list: () => request(`/${base}`),
    get: (id) => request(`/${base}/${id}`),
    create: (data) => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d) => request(`/${base}/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id) => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData(); form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

export const login = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

export const workflowsApi = crud('workflows');
export const captured_stepsApi = crud('captured-steps');
export const replay_runsApi = crud('replay-runs');
export const selector_libraryApi = crud('selector-library');
export const healing_eventsApi = crud('healing-events');
export const exceptionsApi = crud('exceptions');

export const aiCaptureAnalyze = (body) => request('/ai/capture-analyze', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiReplayPlan = (body) => request('/ai/replay-plan', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSelfHeal = (body) => request('/ai/self-heal', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiIntentClassifier = (body) => request('/ai/intent-classifier', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiParameterSuggester = (body) => request('/ai/parameter-suggester', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiBranchDetector = (body) => request('/ai/branch-detector', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiExceptionResolver = (body) => request('/ai/exception-resolver', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiWorkflowMerger = (body) => request('/ai/workflow-merger', { method: 'POST', body: JSON.stringify(body || {}) });

export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({ ...(feature ? { feature } : {}), limit: String(limit) }).toString();
  return request(`/ai/history?${qs}`);
};
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

export const getDashboardStats = () => request('/dashboard');

export const getNotifications = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

// Pass 7 AI features
export const aiDemoToSop = (body) => request('/ai/demo-to-sop', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiActionClassifier = (body) => request('/ai/action-classifier', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiAutomationScriptGen = (body) => request('/ai/automation-script-gen', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiGapFiller = (body) => request('/ai/gap-filler', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiNarrateStep = (body) => request('/ai/narrate-step', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiDedupWorkflows = (body) => request('/ai/dedup-workflows', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiContinuousImprovement = (body) => request('/ai/continuous-improvement', { method: 'POST', body: JSON.stringify(body || {}) });

// Pass 7 — recording substrate
export const recordingsApi = {
  listSessions: () => request('/recordings/sessions'),
  getSession: (id) => request(`/recordings/sessions/${id}`),
  createSession: (d) => request('/recordings/sessions', { method: 'POST', body: JSON.stringify(d) }),
  updateSession: (id, d) => request(`/recordings/sessions/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  stopSession: (id) => request(`/recordings/sessions/${id}/stop`, { method: 'POST' }),
  removeSession: (id) => request(`/recordings/sessions/${id}`, { method: 'DELETE' }),
  listFrames: (id) => request(`/recordings/sessions/${id}/frames`),
  addFrame: (id, d) => request(`/recordings/sessions/${id}/frames`, { method: 'POST', body: JSON.stringify(d) }),
  listEvents: (id) => request(`/recordings/sessions/${id}/events`),
  addEvent: (id, d) => request(`/recordings/sessions/${id}/events`, { method: 'POST', body: JSON.stringify(d) }),
  bulkEvents: (id, events) => request(`/recordings/sessions/${id}/events/bulk`, { method: 'POST', body: JSON.stringify({ events }) }),
};

// Pass 7 — scopes
export const permissionsApi = {
  list: () => request('/permissions'),
  me: () => request('/permissions/me'),
  create: (d) => request('/permissions', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/permissions/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/permissions/${id}`, { method: 'DELETE' }),
  check: (user_email, workflow_name) => request(`/permissions/check?user_email=${encodeURIComponent(user_email)}&workflow_name=${encodeURIComponent(workflow_name)}`),
};

// Pass 7 — audit log
export const auditApi = {
  list: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return request(`/audit-log${qs ? `?${qs}` : ''}`);
  },
  create: (d) => request('/audit-log', { method: 'POST', body: JSON.stringify(d) }),
  summary: () => request('/audit-log/summary'),
};

// Pass 7 — redaction engine
export const redactionApi = {
  apply: (text, scope, rules) => request('/redaction/apply', { method: 'POST', body: JSON.stringify({ text, scope, rules }) }),
  previewStep: (id, rules) => request(`/redaction/preview-step/${id}`, { method: 'POST', body: JSON.stringify({ rules }) }),
  scanCorpus: (rules) => request('/redaction/scan-corpus', { method: 'POST', body: JSON.stringify({ rules }) }),
};

// Pass 7 — marketplace
export const marketplaceApi = {
  listListings: (category) => request(`/marketplace/listings${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getListing: (id) => request(`/marketplace/listings/${id}`),
  create: (d) => request('/marketplace/listings', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/marketplace/listings/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/marketplace/listings/${id}`, { method: 'DELETE' }),
  install: (id) => request(`/marketplace/listings/${id}/install`, { method: 'POST' }),
  addReview: (id, d) => request(`/marketplace/listings/${id}/reviews`, { method: 'POST', body: JSON.stringify(d) }),
};

// Pass 7 — improvement / role view
export const improvementApi = {
  roleDashboard: (role) => request(`/improvement/role-dashboard${role ? `?role=${encodeURIComponent(role)}` : ''}`),
  declining: () => request('/improvement/declining'),
};

export const webhooksApi = {
  list: () => request('/webhooks'),
  create: (d) => request('/webhooks', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test: (event, payload) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ event, payload }) }),
  deliveries: (id) => request(`/webhooks/${id}/deliveries`),
};
