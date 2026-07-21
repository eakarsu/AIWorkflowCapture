# Completeness Review: AIWorkflowCapture

- **Review date:** 2026-07-20
- **Assessment basis:** Static inspection plus isolated PostgreSQL startup, login/session/API acceptance, governed workflow tests, server syntax validation, and a production frontend build.

## Classification

**Prototype-demo**

## Verdict

This is a developer/AI platform prototype/demo. Its 78 source files and visible routes/pages demonstrate concepts, but they do not establish durable, integrated, tested execution of the AIWorkflow Capture workflow.

## Why it is not complete

- 1 project-owned files contain direct provider/chat-completion markers; generic model calls are not a substitute for typed domain tools, grounded evidence, deterministic rules, or evaluations.
- 15 files contain mock, sample, placeholder, simulated, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- Governed workflow tests and CI now exist, but native OS/browser capture, encrypted storage, and target automation workers remain unverified external components.
- Real replay success across changing third-party interfaces and provider failure/recovery still require representative staging exercises.

## Needed features

1. Implement consent-aware desktop/browser event capture with application allowlists, pause controls, and immediate secret/PII redaction.
2. Convert captured events into a versioned deterministic workflow graph with selectors, inputs, preconditions, branching, and recovery steps.
3. Add replay adapters for supported automation targets with dry-run, approval, idempotency, timeout, retry, and rollback behavior.
4. Measure replay success across UI changes and provide repair tooling rather than silently falling back to generated instructions.
5. Add encrypted storage, retention/deletion controls, tenant isolation, capture/replay tests, and CI.

## Risks or launch blockers

- Executing generated code or tools can damage systems or expose secrets without sandboxing and approval.
- Provider fallback and nondeterminism can hide regressions unless runs and evaluations are versioned.
- Native capture and replay can expose secrets or damage external systems until sandboxing, consent, approval, and target-specific validation are proven.
- Provider nondeterminism and interface drift remain production risks despite the governed internal state machine.

## Evidence inspected

- `backend/package.json` — inspected project-owned structure or implementation evidence.
- `backend/server.js` — inspected project-owned structure or implementation evidence.
- `start.sh` — inspected project-owned structure or implementation evidence.
- `backend/migrations/001_schema.sql` — inspected project-owned structure or implementation evidence.
- `backend/config/database.js` — inspected project-owned structure or implementation evidence.
- `backend/middleware/auth.js` — inspected project-owned structure or implementation evidence.

## Recommended next action

Treat this as a prototype: prove one narrow developer/AI platform outcome end to end with real data, durable state, domain validation, and tests before expanding its feature catalog.

## Implementation progress (2026-07-18)

1. Added the tenant-scoped `approved_workflow_replay` state machine for explicit consent, application allowlists, pause/redaction evidence, capture manifests, versioned graph compilation, dry runs, repair, independent replay approval, rollback, retention, and deletion; raw desktop/browser control remains quarantined.
2. Added deterministic graph evidence kinds for selectors, inputs, preconditions, branching, versions, UI-change reports, and repair patches, with digests, provenance, optimistic concurrency, and tests that reject raw secret/PII content.
3. Added typed desktop/browser capture, encrypted object storage, automation runtime, identity, secrets-vault, ticketing, and notification directives through a payload-bound idempotent outbox with timeout/retry/dead-letter/failure/receipt semantics; target-specific workers remain external.
4. Added versioned acceptance criteria for dry-run success, selector resolution, secret/PII leakage, timeouts, rollback, and repair state plus explicit `repair_required` cycles; real OS/browser agents and replay across changing third-party UIs were not executed.
5. Added encrypted-storage references, tenant/subject scope, privacy/reviewer roles, dual control, retention/deletion evidence, append-only audit, tests, CI, sanitized configuration, guarded demo seed, `scrypt` migration, nondestructive startup, and a runbook; native capture, encryption-service, and target replay validation remain external blockers.

## Runtime verification (2026-07-20)

- Final acceptance passed on PostgreSQL `55599`, API `6012`, and UI assignment `6013`; the explicit test branch launched only the API and did not touch a default frontend port.
- The environment-provisioned scrypt administrator logged in, `/api/auth/me` reloaded the persisted PostgreSQL identity, and authenticated API access succeeded (`API_VERIFIED: startup_login_session_api`).
- An additive migration expands the credential column to fit the reviewed scrypt format; the prior width mismatch was reproduced on `55598/6010/6011` and then corrected without destructive schema reset.
- The launcher now preserves caller configuration, uses distinct assigned ports and CORS origin, refuses occupied ports, and keeps dependency installation, migrations, and seed execution outside startup. The client no longer displays a hard-coded demo credential or hard-codes its API endpoint.
- Governed workflow tests passed 17/17, every project-owned backend JavaScript file passed `node --check`, and the optimized React build passed. All assigned ports were released.
- Native capture/replay workers and third-party target validation remain external to this acceptance result.
