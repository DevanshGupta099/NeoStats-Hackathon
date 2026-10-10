# FORGELINE — The Operations Forge
**Multi-User Collaborative Project Management Platform**
Built for the **NeoStats Full Stack Engineering Hackathon**

---

## 1. Overview
**Forgeline** is an enterprise-grade collaborative project management platform built to model the lifecycle of operational initiatives as materials moving through a high-precision forge. 

Forgeline strictly adheres to all hackathon scoring criteria:
- **Server-Authoritative Authorization:** Dual-tier role policy (Global Role + Project Role) enforced strictly on the server via `PolicyService` and NestJS Guards. Direct API attempts to bypass permissions return HTTP `403`.
- **Optimistic Concurrency Control:** Integer `version` locking on every task and project with atomic SQL predicates (`UPDATE ... WHERE id = $1 AND version = $2`). Conflicting stale edits return HTTP `409` with interactive side-by-side resolution.
- **Post-Commit Real-Time Collaboration:** Socket.IO engine with cookie-authenticated handshakes, project-scoped rooms, and event dispatches emitted exclusively *after* database transactions commit.
- **Transactional Audit Logging & Notifications:** Synchronous activity logging with state diffs and automated real-time notification dispatches (actor-excluded).
- **Explainable Engineering:** Every module is accompanied by an architectural deep dive and interview study guide in `docs/EXPLAINED/`.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | `pnpm` Workspaces (`apps/web`, `apps/api`, `packages/shared`) |
| **Frontend** | Next.js (App Router), React 19, Tailwind CSS v4, Lucide Icons, TanStack Query |
| **3D / WebGL** | Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`, `troika-three-text` |
| **Backend** | NestJS, TypeScript, Cookie-Parser, Config, Pino |
| **Database & ORM** | PostgreSQL 16 (via Docker Compose), Prisma ORM with raw SQL concurrency queries |
| **Real-Time** | Socket.IO with room scoping and domain event bus |
| **Validation** | Zod schemas shared across client and server via `@forgeline/shared` |

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Node.js:** 22+ (verified on Node v24)
- **pnpm:** 10+ (verified on pnpm 12.6.0)
- **Docker & Docker Compose:** running locally

### Installation & Initialization
```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Spin up PostgreSQL 16 containers (Dev on 5434, Test on 5433)
pnpm db:up

# 4. Apply database migrations and seed default data
pnpm db:migrate
pnpm db:seed

# 5. Build shared packages and run both dev servers
pnpm dev
```

* **Web Application:** [http://localhost:3000](http://localhost:3000)
* **REST API:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
* **Swagger OpenAPI Docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **Health Check & DB Probe:** [http://localhost:4000/api/v1/health/db](http://localhost:4000/api/v1/health/db)

---

## 4. Default Seed Credentials (Post-Migration)

All accounts use the shared development password: `Forge@12345`

| Email | Global Role | Purpose / Scope |
|---|---|---|
| `admin@forgeline.dev` | `ADMIN` | System administrator with global user, project, and audit access |
| `pm@forgeline.dev` | `PROJECT_MANAGER` | Lead Project Manager on Project Helios & Aegis |
| `pm2@forgeline.dev` | `PROJECT_MANAGER` | Associate Project Manager on Project Aegis & Chronos |
| `member@forgeline.dev` | `TEAM_MEMBER` | Senior Engineer (assigned to Helios & Aegis) |
| `member2@forgeline.dev` | `TEAM_MEMBER` | Frontend Engineer (assigned to Helios & Chronos) |
| `viewer@forgeline.dev` | `VIEWER` | Executive read-only observer |
| `deactivated@forgeline.dev` | `TEAM_MEMBER` | Deactivated test account (login blocked) |

---

## 5. Available Scripts

```bash
pnpm dev            # Runs API (:4000) and Web (:3000) concurrently
pnpm dev:web        # Runs Next.js frontend only
pnpm dev:api        # Runs NestJS API only
pnpm db:up          # Starts PostgreSQL 16 via Docker Compose
pnpm db:down        # Stops database containers
pnpm db:migrate     # Applies Prisma migrations
pnpm db:seed        # Seeds the database with sample data
pnpm db:reset       # Resets database cleanly
pnpm lint           # Runs linting across all workspaces
pnpm typecheck      # Runs TypeScript typecheck across all workspaces
pnpm test           # Runs unit tests
pnpm test:e2e       # Runs API e2e tests
pnpm build          # Builds shared package, API, and Web for production
```

---

## 6. Project Documentation Index

- [docs/00-PLAYBOOK.md](file:///docs/00-PLAYBOOK.md) — Operating manual for the build agent.
- [docs/01-IMPLEMENTATION_PLAN.md](file:///docs/01-IMPLEMENTATION_PLAN.md) — Master implementation specification.
- [docs/PROGRESS.md](file:///docs/PROGRESS.md) — Living progress tracker and phase log.
- [docs/DECISIONS.md](file:///docs/DECISIONS.md) — Architecture Decision Records (ADRs).
- [docs/AI_USAGE.md](file:///docs/AI_USAGE.md) — AI attribution and human design decisions breakdown.
- `docs/EXPLAINED/` — Comprehensive module walkthroughs and viva study notes.
