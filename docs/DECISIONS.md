# Architecture Decision Records (ADRs)
Last updated: 2026-10-10

This document tracks key architectural decisions, rationale, and consequences for Forgeline.

---

## ADR-001: Monorepo Structure with pnpm Workspaces
- **Status:** Accepted
- **Context:** Need seamless sharing of Zod validation schemas, TypeScript interfaces, permission constants, and event names between the NestJS backend and Next.js frontend.
- **Decision:** Use `pnpm` workspaces with `apps/api`, `apps/web`, and `packages/shared`.
- **Consequences:** Enables zero-drift contract enforcement. Single `pnpm install` manages all workspace dependencies efficiently.

## ADR-002: Optimistic Concurrency with Atomic Version Predicates
- **Status:** Accepted
- **Context:** Multiple users editing tasks simultaneously must not silently overwrite state (judge scoring non-negotiable).
- **Decision:** Every task has an integer `version`. Updates execute `UPDATE tasks SET ..., version = version + 1 WHERE id = $1 AND version = $2 RETURNING *`. If 0 rows affected, respond HTTP 409 with current and conflicting versions.
- **Consequences:** Guarantees absolute database-level concurrency protection. UI provides side-by-side conflict resolution.

## ADR-003: Pure PolicyService with Server-Side Guard Enforcement
- **Status:** Accepted
- **Context:** Hackathon brief explicitly highlights server-side authorization as the primary test. Bypassing authorization via direct API calls must fail.
- **Decision:** Implement a centralized `PolicyService` with pure, deterministic permission evaluation combining global role and project role, enforced via NestJS `@RequirePermission` guards.
- **Consequences:** Controller logic stays completely clean; authorization cannot be inadvertently bypassed.

## ADR-004: Post-Commit Real-Time Event Emission
- **Status:** Accepted
- **Context:** Emitting WebSocket events before a transaction commits can leak uncommitted state if rollback occurs.
- **Decision:** Use an in-process domain event bus that only broadcasts Socket.IO events after the database transaction successfully commits.
- **Consequences:** Zero phantom events; client caches remain consistent with database truth.
