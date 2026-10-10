# FORGELINE — The Operations Forge
**Multi-User Collaborative Project Management Platform**
Built for the **NeoStats Full Stack Engineering Hackathon**

---

## 1. Overview
**Forgeline** is an enterprise-grade collaborative project management platform built to model the lifecycle of operational initiatives as materials moving through a high-precision forge. 

The platform strictly fulfills all hackathon scoring criteria:
- **Server-Authoritative Authorization:** Dual-tier role policy (Global Role + Project Role) enforced strictly on the server via a pure `PolicyService` and NestJS Guards. Direct API attempts to bypass permissions return HTTP `403`.
- **Optimistic Concurrency Control:** Integer `version` locking on every task and project with atomic SQL predicates (`UPDATE ... WHERE id = $1 AND version = $2`). Conflicting stale edits return HTTP `409` with interactive side-by-side resolution.
- **Post-Commit Real-Time Collaboration:** Socket.IO engine with cookie-authenticated handshakes, project-scoped rooms, and event dispatches emitted exclusively *after* database transactions commit.
- **Transactional Audit Logging & Notifications:** Synchronous activity logging with state diffs and automated real-time notification dispatches (actor-excluded).
- **Mistral AI Operations:** Server-side proxy isolation for streaming executive standups (SSE) and structured task drafting with 429 exponential backoffs and 100% offline fallback.
- **Explainable Engineering:** Every module is accompanied by an architectural deep dive and interview study guide in `docs/EXPLAINED/`.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | `pnpm` Workspaces (`apps/web`, `apps/api`, `packages/shared`) |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide Icons, TanStack Query v5 |
| **3D / WebGL** | Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`, `troika-three-text` |
| **Backend** | NestJS 11, TypeScript, Cookie-Parser, Config, Pino Logger |
| **Database & ORM** | PostgreSQL 16 (via Docker Compose), Prisma ORM with atomic SQL concurrency predicates |
| **Real-Time** | Socket.IO with room scoping and post-commit domain event bus |
| **AI Engine** | Mistral AI (`mistral-small-latest`) via server-side plain fetch |
| **Validation** | Zod schemas shared across client and server via `@forgeline/shared` |

---

## 3. Prerequisites
- **Node.js:** `v20+` or `v22+` (verified on Node v24)
- **pnpm:** `v10+` (verified on pnpm 12.6.0)
- **Docker & Docker Compose:** running locally

---

## 4. Environment Variables Table

Configure `.env` at the root of the repository (or copy `.env.example`):

| Variable | Description | Default / Example Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string for development (Port 5434) | `postgresql://forgeline:forgeline_secret@localhost:5434/forgeline_dev?schema=public` |
| `TEST_DATABASE_URL` | PostgreSQL connection string for automated E2E tests (Port 5433) | `postgresql://forgeline:forgeline_secret@localhost:5433/forgeline_test?schema=public` |
| `JWT_ACCESS_SECRET` | Secret key for signing short-lived access tokens (min 32 chars) | `forgeline_dev_jwt_access_secret_min_32_chars_long_key_sample_1234` |
| `JWT_REFRESH_SECRET` | Secret key for signing long-lived refresh tokens (min 32 chars) | `forgeline_dev_jwt_refresh_secret_min_32_chars_long_key_sample_5678` |
| `ACCESS_TOKEN_TTL` | Access token lifespan | `15m` |
| `REFRESH_TOKEN_TTL` | Refresh token lifespan | `7d` |
| `COOKIE_DOMAIN` | Cookie domain scoping | `localhost` |
| `COOKIE_SECURE` | Secure cookie flag (`false` for local dev, `true` for HTTPS prod) | `false` |
| `API_PORT` | Port for the NestJS API server | `4000` |
| `WEB_ORIGIN` | Allowed CORS origin for frontend | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Public API endpoint for frontend client fetch requests | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | Public Socket.IO endpoint for frontend WebSocket connections | `http://localhost:4000` |
| `AI_ENABLED` | Feature flag for Mistral AI integration (`true` / `false`) | `false` (defaults to graceful rule fallback if false) |
| `Mistral_API_KEY` | Mistral API key (or `MISTRAL_API_KEY`) | `mstrl_...` (Never committed to git) |
| `MISTRAL_MODEL` | Mistral model override | `mistral-small-latest` |

---

## 5. Ports Matrix

| Service | Port | Description |
|---|---|---|
| **Frontend Web App** | `3000` | Next.js 15 App Router interface |
| **Backend API** | `4000` | NestJS REST API (`/api/v1`) & Socket.IO |
| **Swagger Docs** | `4000` | Interactive OpenAPI documentation (`/api/docs`) |
| **PostgreSQL (Dev)** | `5434` | Main development database container (`forgeline_dev`) |
| **PostgreSQL (Test)** | `5433` | Isolated automated E2E test database (`forgeline_test`) |

---

## 6. Quickstart: Run the Full Project

Follow these exact steps from a fresh clone:

```bash
# 1. Install all monorepo dependencies (auto-builds @forgeline/shared via postinstall)
pnpm install

# 2. Copy environment file (if not already present)
cp .env.example .env

# 3. Start PostgreSQL containers via Docker Compose
pnpm db:up

# 4. Run Prisma database migrations and seed default data
pnpm db:migrate
pnpm db:seed

# 5. Start both Backend API and Frontend Web concurrently
pnpm dev
```

* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **API Server:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
* **Swagger OpenAPI UI:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **Health Check Probe:** [http://localhost:4000/api/v1/health/db](http://localhost:4000/api/v1/health/db)

---

## 7. Default Seed Credentials (4 Sample Roles)

All accounts share the development password: `Forge@12345`

| Email | Global Role | Purpose & Privileges |
|---|---|---|
| `admin@forgeline.dev` | `ADMIN` | System administrator with full project, user management (`/users`), and audit privileges |
| `pm@forgeline.dev` | `PROJECT_MANAGER` | Lead Project Manager on Project Helios (assign members, edit tasks, manage roster) |
| `member@forgeline.dev` | `TEAM_MEMBER` | Senior Engineer on Project Helios (update tasks, move lanes, post comments, presence) |
| `viewer@forgeline.dev` | `VIEWER` | Executive read-only observer (strictly view only; mutations blocked by Rule of Cap) |

---

## 8. Verification & Test Commands

Run the full testing and quality assurance suite:

```bash
# TypeScript typechecking across all 3 packages
pnpm -r typecheck

# Unit tests (including PolicyService and AiService mocked HTTP tests)
pnpm test

# Automated E2E integration test suite against test database
pnpm test:e2e

# Production builds
pnpm build
```

---

## 9. Key Documentation Links
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Comprehensive system architecture (Real-time, OCC, Policy, Data model, AI).
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) — 5-minute judge walkthrough hitting every requirement.
- [docs/AI_USAGE.md](docs/AI_USAGE.md) — Architectural attribution: what Devansh decided vs what AI built.
- [docs/DECISIONS.md](docs/DECISIONS.md) — Architectural Decision Records (ADRs 001 through 008).
- `docs/EXPLAINED/`:
  - [authorization.md](docs/EXPLAINED/authorization.md) — Dual-tier roles and Rule of Cap study guide.
  - [concurrency.md](docs/EXPLAINED/concurrency.md) — Optimistic locking and HTTP 409 conflict guide.
  - [realtime.md](docs/EXPLAINED/realtime.md) — Socket.IO rooms, post-commit bus, and presence guide.
  - [webgl-text.md](docs/EXPLAINED/webgl-text.md) — Three.js persistent canvas, SDF fonts, and tiers guide.
