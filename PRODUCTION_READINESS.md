# Production readiness

The governed API at `/api/governance` is the supported consent-aware workflow capture and replay path. It records tenant-scoped consent and allowlist evidence, pause/redaction receipts, versioned deterministic graphs, dry runs, repair cycles, independent replay approval, rollback, retention, deletion, and immutable connector history. It never controls a desktop or browser.

## Deployment sequence

1. Review and back up the database, then apply `backend/migrations/001_governed_workflow_replay.sql` separately using a least-privilege migration identity.
2. Copy `.env.example` to `.env`, replace every placeholder, and configure a unique 32-plus-character JWT secret and explicit CORS allowlist.
3. Install locked dependencies explicitly. `start.sh` only supervises the already-installed backend and frontend.
4. Provision tenant memberships and deploy separately reviewed connector workers. Workers exchange opaque references, versions, digests, and receipts; raw secrets and sensitive content do not enter workflow payloads.
5. Exercise retry, dead-letter, reconciliation, retention/deletion, audit export, backup, restore, and incident-response procedures before production.

Production rejects wildcard CORS, weak secrets, provider/demo flags, generated routes, and startup schema mutation. The additive migration never drops or truncates tables. Legacy plaintext accounts require migration to `scrypt$<32 hex salt>$<128 hex digest>`. Demo seed execution requires `ALLOW_DEMO_SEED=true`, a 12-plus-character `DEMO_PASSWORD`, and a non-production database.

## Required external validation

Implement and validate native desktop/browser capture agents, visible consent/pause UX, immediate redaction, encrypted artifact storage, target-specific dry-run/replay workers, timeout and rollback behavior, and selector repair across real UI changes. No OS-level capture, keystroke collection, browser control, or replay was performed.
