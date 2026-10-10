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

## ADR-005: Strict Dependency Declarations and Monorepo Zod Resolution
- **Status:** Accepted
- **Context:** pnpm enforces strict non-hoisted symlinks. When `@forgeline/shared` exports Zod schemas/types, consumer packages (`apps/api`, `apps/web`) and root TypeScript Language Server require explicit dependencies and topological builds.
- **Decision:** Pin `zod: "3.24.2"` across all packages, declare `zod` in `apps/api`, `apps/web`, and `packages/shared`, define root `tsconfig.json` with path mapping, and build `@forgeline/shared` in `postinstall`.
- **Consequences:** Eliminates editor and runtime module resolution issues; ensures deterministic clean builds.
## ADR-006: Mistral AI Provider via Direct REST Fetch
- **Status:** Accepted
- **Decision:** Use Mistral free tier via raw `fetch` (`https://api.mistral.ai/v1/chat/completions`) using `Mistral_API_KEY` (fallback `MISTRAL_API_KEY`), removing external SDK overhead.

## ADR-007: Atomic Concurrency and Transactional Activity/Notification Writes
- **Status:** Accepted
- **Decision:** Every entity mutation executes atomic `version = version + 1 WHERE id AND version`, activity logging, and notification generation in one Prisma transaction, publishing post-commit domain events via `DomainEventBus`.
