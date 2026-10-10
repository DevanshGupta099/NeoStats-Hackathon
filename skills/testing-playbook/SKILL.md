---
name: testing-playbook
description: Unit, integration, e2e, and multi-client concurrency test suites across backend and frontend.
---

# Testing Playbook Skill

## Phase Gates
- **Phase 2 Gate:** Unit tests for `PolicyService` matrix (every role × action combination), version conflict tests (2 parallel requests -> exactly one 200, one 409), forbidden endpoint 403 checks.
- **Phase 3 Gate:** Two-client Socket.IO test (Client A emits -> Client B receives; unauthenticated socket rejected; removed member kicked).
- **Phase 7 Gate:** Playwright 2-browser context live sync & conflict resolution test.
- **Phase 9 Gate:** Lighthouse mobile test pass, a11y keyboard/contrast checks.

## Command Reference
- `pnpm test` -> Vitest unit tests for `@forgeline/shared` and web components.
- `pnpm test:e2e` -> Jest + Supertest against isolated Docker Postgres container (`postgres-test`).
- Fix flaky tests at the root cause; never loop retries blindly.
