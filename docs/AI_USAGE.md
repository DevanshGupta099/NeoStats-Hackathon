# AI Usage & Attribution Log
Last updated: 2026-10-10 (v1.0 Release)

This document transparently logs AI involvement in the design and implementation of Forgeline, distinguishing human architectural decisions from AI-assisted code generation.

---

## 1. Architectural Ownership: Decisions Devansh Gupta Claims as His
In accordance with the hackathon rules and interview requirements, the architectural vision and core constraints were deliberately chosen and dictated by **Devansh Gupta**:

1. **Monorepo Tech Stack Choice:** Decided on `pnpm` workspaces separating NestJS (`apps/api`) and Next.js App Router (`apps/web`) with a shared contracts package (`packages/shared`), rejecting monolithic full-stack frameworks to preserve strict enterprise boundaries.
2. **Dual-Tier Authorization & "Rule of Cap":** Formulated the mathematical cap model `Math.min(GlobalRole, ProjectRole)`, preventing privilege escalation where a global Viewer could never write even if assigned a Manager role in a project. Dictated that authorization logic must reside in a pure, testable `PolicyService` with server-side Guard enforcement.
3. **Atomic 409 Concurrency Architecture:** Designed the zero-silent-overwrite pattern using integer `version` columns, atomic SQL predicates (`UPDATE ... WHERE id = $1 AND version = $2`), structured 409 error envelopes, and interactive side-by-side field-level merge resolution in the UI.
4. **Socket.IO Over Raw WebSockets:** Chose Socket.IO specifically for its built-in fallback to HTTP long-polling, room scoping primitives (`user:{id}` and `project:{id}`), and cookie-authenticated handshakes. Dictated the post-commit domain event bus pattern so Socket.IO never leaks uncommitted state.
5. **Mistral AI Architecture:** Selected Mistral (`mistral-small-latest`) via direct REST fetch with streaming SSE, 429 exponential backoffs, strict server-side scoping, and deterministic offline fallbacks so the app works 100% when AI is disabled.

---

## 2. Decision & Attribution Matrix

| Area | Human Specification (Devansh Gupta) | AI Execution (Gemini / Antigravity) |
|---|---|---|
| **System Architecture** | pnpm monorepo, NestJS separate from Next.js, PostgreSQL 16 via Docker, Socket.IO over raw WS | Monorepo scaffolding, configuration files, package.json wiring |
| **Data Model & Concurrency** | Version integer on tasks and projects; atomic SQL predicates; 409 conflict envelope shape | Prisma schema definition, SQL migration scripts, conflict handler pipe |
| **Auth & Security** | Argon2id hashing, httpOnly SameSite=Lax dual cookies, token family rotation with reuse revocation, token_version session severing, lockout-safe messages | AuthService implementation, JwtAuthGuard, CsrfOriginGuard, supertest e2e suite |
| **Domain APIs & Concurrency** | Pure PolicyService matrix, atomic update predicate with 409 conflict envelope, transactional activity/notifications, race-safe counter | NestJS controllers/services for 7 domain modules, extractVersion helper, Jest supertest e2e suite with 25 tests |
| **Design System & WebGL** | Persistent single canvas, drei View portals, local font pipeline (5 families), HeroForge ember scene, quality tier store | Three.js shader code (HeatField, HeroForge), ForgeText kinetic typography, responsive HUD layout shell |
| **Authorization Model** | Dual-tier role model (Global & Project); Rule of Cap; server-side PolicyService | PolicyService implementation, test matrix generation, NestJS guard creation |
| **Real-Time Model** | Socket.IO room scoping (`user:{id}`, `project:{id}`), post-commit domain event bus | Gateway implementation, event typings, client-side cache patch listeners |
| **Mistral AI Integration** | Server-side proxy isolation, SSE standup digest, task drafting, offline fallback, token caps | AiService, AiController, ProjectDigestSheet, smart-add form integration |

---

## 3. Block-by-Block Execution Summary

### Block A & B: Core APIs & Realtime Backend
- **Human Specification**: Strict cookie handshake auth, room isolation (`project:{id}`, `user:{id}`), policy-checked join, in-memory TTL presence, forced disconnect on deactivation.
- **AI Generation**: `RealtimeGateway`, `PresenceService`, `@forgeline/shared` realtime event map, and Jest E2E multi-client realtime test suite.

### Block C & D: WebGL Design System & Core Pages
- **Human Specification**: Mobile-first TanStack Query architecture, 3D WebGL StatTotems & ProjectTile3D slabs, touch-safe snap-scroll Kanban board, and @mention autocomplete comment threads.
- **AI Generation**: Query key factory, typed data hooks, responsive UI components, dnd-kit sensors, and Vaul filter drawer.

### Block E: Realtime Frontend & Concurrency Resolution
- **Human Specification**: Realtime query cache patching, version checking, ice-colour remote highlights, presence avatars, 409 conflict resolution sheet, alerts/notifications, team roster, users table, and profile settings.
- **AI Generation**: SocketProvider context, conflict modal store, TanStack Table users page, activity timeline with entity filters, and ambient presence badges.

### Block F: Mistral AI Integration & Polish
- **Human Specification**: Free-tier Mistral chat completions with plain fetch, 429 retry backoff, SSE streaming standup digest, task drafting, vivid seed data refresh, and 100% offline fallback.
- **AI Generation**: `AiService`, `AiController`, `ProjectDigestSheet`, unit tests with mocked HTTP calls, and architectural documentation.
