# Audit Note — AIWorkflowCapture

Stack: Node + Express + React + Postgres + OpenRouter.
Domain: workflow capture — record user/screen actions, generate SOPs, auto-build automation/agent scripts from human demonstration.

## Inventory (current state)

- **Backend routes mounted** (`backend/server.js`): `auth`, `workflows`, `captured-steps`, `replay-runs`, `selector-library`, `healing-events`, `exceptions`, `ai`, `notifications`, `attachments`, `webhooks`, `dashboard`, `workflowExtras`, `custom-views`.
- **AI endpoints** (`backend/routes/ai.js`, 8 features): `capture-analyze`, `replay-plan`, `self-heal`, `intent-classifier`, `parameter-suggester`, `branch-detector`, `exception-resolver`, `workflow-merger`. All persist via `ai_results` and expose `/samples` + `/history`.
- **Tables** (`migrations/001_schema.sql`): `users`, `ai_results`, `notifications`, `attachments`, `webhooks`, `webhook_deliveries`, `workflows`, `captured_steps`, `replay_runs`, `selector_library`, `healing_events`, `exceptions`.
- **Frontend pages** (21): one per AI feature + CRUD pages + Dashboard + TimelineView + WorkflowLibraryWorkbench + Codex feature pages.

## Gap Analysis

### Missing AI Counterparts (6)
1. **demo-to-SOP generator** — capture-analyze produces step list but no human-readable SOP document (markdown/PDF-shaped) with screenshots, decision points, exception handling.
2. **action classifier** — no endpoint that classifies low-level events (click/type/scroll/keypress) into semantic action types (form-fill, navigation, file-upload, approval). Intent-classifier operates on utterances, not action streams.
3. **automation-script generator (Playwright/Selenium)** — replay-plan produces a plan, not executable code. No endpoint emits Playwright/Selenium/Puppeteer/RPA script from steps.
4. **gap-filler when steps missing** — no endpoint that detects discontinuities in a capture (e.g., page state jumped without recorded click) and proposes the missing step.
5. **narrate-step copilot** — no streaming/coaching endpoint that explains "what is happening at step N" or guides an operator live through a workflow.
6. **dedup similar workflows** — workflow-merger handles a single pair; no corpus-wide clustering/dedup across the workflow library.

### Missing Non-AI Features (4)
1. **recording CRUD (sessions, frames, events)** — there is no `recording_sessions`, `frames` (screenshots), or low-level `events` (DOM/input event stream) table. `captured_steps` is the only artifact; raw recording substrate is absent.
2. **permission scopes** — `users.role` exists ('commander') but no scope/permission system on which workflows or apps a user can view/replay; auth middleware is binary.
3. **audit trail** — no `audit_log` table or middleware capturing who edited workflows, ran replays, modified selectors. `ai_results` covers AI calls only.
4. **secrets redaction** — `input_data` on `captured_steps` stores raw text (e.g., invoice numbers). No PII/secret detection or redaction pipeline; no field-level masking.

### Custom Feature Suggestions (3)
1. **workflow marketplace** — share/publish/install workflows across tenants with ratings, versioning, reviews; currently each workflow is private to one DB.
2. **role-based view (manager vs operator)** — manager dashboards (success rate, ROI, exception trends) vs operator views (next-step, narration). Single `Dashboard.js` exists but no role split.
3. **continuous-improvement detector** — detect workflows whose success rate is declining over `replay_runs.created_at` windows and auto-flag for review (closes loop between healing-events / exceptions / replay outcomes).

## Counts
- Missing AI counterparts: 6
- Missing non-AI features: 4
- Custom suggestions: 3
- **Total backlog items: 13**

## Implemented (this round)
None — audit-only.

## Status
Audit-only complete. No code changes. Backlog ready for prioritized passes; suggested first cuts are MECHANICAL endpoints `automation-script-generator`, `action-classifier`, `demo-to-sop-generator` (pattern matches existing `ai.runFeature` + `ai_results` recording).

## Apply pass 7 (full backlog implementation)

All 13 backlog items shipped — 7 new AI features, 3 new schema-backed substrates, 3 product-decision features. Pattern follows existing code: AI features piggyback on `ai.runFeature` + `ai_results`; new tables are added in `002_pass7.sql`; routes are mounted before the 404 in `server.js`.

### New AI endpoints (7) — `backend/routes/ai.js`
1. `POST /api/ai/demo-to-sop` — MECHANICAL: markdown SOP doc with screenshots/decisions/exceptions.
2. `POST /api/ai/action-classifier` — MECHANICAL: classify raw events into semantic actions.
3. `POST /api/ai/automation-script-gen` — MECHANICAL: emits Playwright/Selenium/Puppeteer skeleton. Backend deterministically synthesises a Playwright JS skeleton when the LLM omits `code`, so the endpoint always returns runnable scaffold text.
4. `POST /api/ai/gap-filler` — MECHANICAL: detect step discontinuities, propose inserts.
5. `POST /api/ai/narrate-step` — MECHANICAL: live operator copilot for step N.
6. `POST /api/ai/dedup-workflows` — MECHANICAL: corpus-wide clustering. Auto-loads workflow names from DB when caller passes no `workflow_names`.
7. `POST /api/ai/continuous-improvement` — PRODUCT-DECISION: detects declining workflows. Auto-loads `replay_runs` aggregates when no `runs_text` supplied.

All 7 have `/samples` rows + `/history` rows (free via the existing record() pipeline).

### New schema tables (`backend/migrations/002_pass7.sql`)
- **`recording_sessions`** + **`frames`** + **`events`** — the missing raw recording substrate (top-priority per audit). `events.meta` is JSONB for arbitrary DOM payloads.
- `permission_scopes` (per-user/workflow scope + can_view/can_replay/can_edit)
- `audit_log` (actor, action, resource_type, resource_id, details JSONB)
- `marketplace_listings` + `marketplace_reviews` (with auto rating recompute on review insert)

### New route files (mounted in `server.js` before 404)
- `routes/recordings.js` — sessions CRUD + nested `/sessions/:id/frames` + `/events` + `/events/bulk` + `/stop`
- `routes/permissions.js` — scopes CRUD + `/me` + `/check?user_email&workflow_name`
- `routes/auditLog.js` — list (filters: actor, resource_type) + create + `/summary`
- `routes/redactionEngine.js` — `/apply`, `/preview-step/:id`, `/scan-corpus` (in-process regex engine; rules from `customViews` are the canonical source, accepts override via body)
- `routes/marketplace.js` — listings CRUD + `/install` (auto-inserts into local `workflows`) + `/reviews`
- `routes/improvement.js` — `/role-dashboard?role=manager|operator` + `/declining` (compares last-14d vs older success rate; threshold 5%).

### New frontend pages (13) — `frontend/src/pages/`
AI: `AIDemoToSopPage`, `AIActionClassifierPage`, `AIAutomationScriptGenPage`, `AIGapFillerPage`, `AINarrateStepPage`, `AIDedupWorkflowsPage`, `AIContinuousImprovementPage` — all use existing `AIPage` component.
Non-AI: `RecordingSessionsPage` (sessions list + frames/events drill-in + append event), `PermissionScopesPage`, `AuditLogPage`, `RedactionEnginePage` (apply + corpus scan), `MarketplacePage` (browse + publish + install + review), `RoleDashboardPage` (manager vs operator views + declining detector).

All wired into `App.js` Routes and added to `Sidebar.js` under AI Features / Workbenches.

### Constraints honoured
- No new npm deps (pure `pg`, `express`, `https`, JS RegExp).
- No breaking changes to existing routes/tables.
- All modified backend `.js` pass `node --check`.
- All new routes mounted before the 404 fallback.
- End-to-end verified: backend boots, `/api/auth/login` issues token, then `GET /api/ai/samples?feature=demo-to-sop`, `GET /api/recordings/sessions`, `GET /api/improvement/role-dashboard?role=manager`, `GET /api/improvement/declining`, `GET /api/audit-log/summary`, `GET /api/marketplace/listings`, and `POST /api/redaction/apply` all return expected payloads (verified live against local Postgres after running `002_pass7.sql`).

### Backlog status
- Missing AI counterparts: 6 → **0**
- Missing non-AI features: 4 → **0**
- Custom suggestions: 3 → **0**
- **Total backlog items: 13 → 0. Done.**
