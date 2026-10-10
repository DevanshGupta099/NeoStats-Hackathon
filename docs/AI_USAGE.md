# AI Usage & Attribution Log
Last updated: 2026-10-10

This document transparently logs AI involvement in the design and implementation of Forgeline, distinguishing human architectural decisions from AI-assisted code generation.

---

## 1. Governance & Policy
In accordance with the NeoStats Hackathon evaluation criteria, every architecture decision, data model choice, authorization rule, and concurrency design was deliberately chosen and specified by the owner (Devansh Gupta). The AI assistant (Gemini running in Antigravity) acts as a high-velocity pair programmer and execution agent.

## 2. Decision Log

| Area | Human Decision / Specification | AI Execution / Code Generation |
|---|---|---|
| **System Architecture** | pnpm monorepo, NestJS separate from Next.js, PostgreSQL 16 via Docker, Socket.IO over raw WS | Monorepo scaffolding, configuration files, package.json wiring |
| **Data Model & Concurrency** | Version integer on tasks and projects; atomic SQL predicates; 409 conflict envelope shape | Prisma schema definition, SQL migration scripts, conflict handler pipe |
| **Auth & Security (Phase 1)** | Argon2id hashing, httpOnly SameSite=Lax dual cookies, token family rotation with reuse revocation, token_version session severing, lockout-safe messages | AuthService implementation, JwtAuthGuard, CsrfOriginGuard, supertest e2e suite |
| **Domain APIs & Concurrency (Phase 2)** | Pure PolicyService matrix, atomic update predicate with 409 conflict envelope, transactional activity/notifications, race-safe counter | NestJS controllers/services for 7 domain modules, extractVersion helper, Jest supertest e2e suite with 25 tests |
| **Design System & WebGL (Block C)** | Persistent single canvas, drei View portals, local font pipeline (5 families), HeroForge ember scene, quality tier store | Three.js shader code (HeatField, HeroForge), ForgeText kinetic typography, responsive HUD layout shell |
| **Authorization Model** | Dual-tier role model (Global & Project); Rule of Cap; server-side PolicyService | PolicyService implementation, test matrix generation, NestJS guard creation |
| **Real-Time Model** | Socket.IO room scoping (`user:{id}`, `project:{id}`), post-commit domain event bus | Gateway implementation, event typings, client-side cache patch listeners |
| **Visual Direction** | "Operations Forge" brutalist HUD aesthetic, WebGL persistent canvas, design token palette | Three.js shader code, troika font preloading, Tailwind token mapping |

## 3. Interview Readiness
The owner has complete familiarity with all architectural patterns, database schemas, and guard logic in this codebase. Comprehensive module explanations are detailed in `docs/EXPLAINED/*.md` for in-depth review.

## 4. Block B: Realtime & Socket.IO (Phase 3)
- **Human Specification**: Strict cookie handshake auth, room isolation (`project:{id}`, `user:{id}`), policy-checked join, in-memory TTL presence, forced disconnect on deactivation.
- **AI Generation**: `RealtimeGateway`, `PresenceService`, `@forgeline/shared` realtime event map, and Jest E2E multi-client realtime test suite.

## 5. Block D: Core Pages & Data Hooks (Phase 6)
- **Human Specification**: Mobile-first TanStack Query architecture, 3D WebGL StatTotems & ProjectTile3D slabs, touch-safe snap-scroll Kanban board, and @mention autocomplete comment threads.
- **AI Generation**: Query key factory, typed data hooks, responsive UI components, dnd-kit sensors, and Vaul filter drawer.

## 6. Block E: Realtime Frontend & Concurrency Resolution (Phase 7)
- **Human Specification**: Realtime query cache patching, version checking, ice-colour remote highlights, presence avatars, 409 conflict resolution sheet, alerts/notifications, team roster, users table, and profile settings.
- **AI Generation**: SocketProvider context, conflict modal store, TanStack Table users page, activity timeline with entity filters, and ambient presence badges.

