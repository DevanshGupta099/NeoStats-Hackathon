# FORGELINE — Master Implementation Plan
**NeoStats Full Stack Engineering Hackathon · Collaborative Project Management Platform**
Repo: https://github.com/DevanshGupta099/NeoStats-Hackathon

> You (Gemini, running in Antigravity) are the sole engineer on this build. You have full system access: files, terminal, env, git, Docker, browser. Do everything yourself, including branching, committing, pushing and opening/merging PRs with `gh` if available. This document is the source of truth. The companion operating manual is `docs/00-PLAYBOOK.md`. Read both fully before touching code, then execute Phase 0.

---

## 1. Mission and judging lens

The organiser's brief (two PDFs: Challenge Brief + Guidelines) says the key scoring areas are:

1. **Server-side authorization is THE key requirement.** A Team Member calling a forbidden endpoint directly must be rejected.
2. **Concurrent updates:** stale update must not silently overwrite a newer one. Version 7 vs 8 -> HTTP 409, UI guides user to the latest state.
3. **Real-time collaboration** without refresh: task create/update, status change, assignment, comments, notifications.
4. **Activity log** + **Notifications** (read/unread, real-time).
5. Clean data model, API design (naming, HTTP semantics, validation, pagination, filtering, errors).
6. Submission: Git repo, README (setup, env vars, migrations, seed, run both apps, sample logins), architecture note (real-time approach, data model, authorization, concurrency), runnable locally.
7. **AI usage policy:** the owner must be able to explain every line and say which parts AI built vs. which decisions were human. So you must produce `docs/AI_USAGE.md` and `docs/EXPLAINED/*.md` (see section 14).

On top of the brief, the frontend must be **visually extraordinary**: heavy WebGL/Three.js, kinetic 3D typography, mobile-first. A brutally solid backend + a genuinely original frontend is the win condition.

## 2. Non-negotiable constraints

- Mobile-first design; then tablet and desktop scale up.
- Stack from the PDFs: Next.js (App Router) + TypeScript + Tailwind CSS; separate API server (NestJS); PostgreSQL + SQL migrations; Node 22+.
- Next.js app and API run as **separate processes** (web :3000, api :4000). Plan CORS, cookies, API base URL, socket origin.
- Never commit secrets. `.env` gitignored, `.env.example` committed.
- Seed script with a user for each role + several projects + tasks.
- Migrations reproduce the schema from scratch.
- All permissions and validation enforced on the server.
- Only free services. Any AI feature uses free tier models (Groq primary).
- No default fonts. No generic "AI SaaS" look (see section 11.2 anti-patterns).

## 3. Stack decisions (final; verify latest stable versions at install time)

| Layer | Choice | Why (be ready to explain) |
|---|---|---|
| Monorepo | pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`) | One repo, shared Zod schemas/types between client and server |
| Frontend | Next.js latest stable, App Router, React 19, TypeScript strict | Per brief |
| Styling | Tailwind CSS v4 with design tokens as CSS variables | Per brief |
| 3D / WebGL | three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing, troika-three-text (via drei `<Text>`), maath, leva (dev only), detect-gpu | WebGL text and heavy scenes |
| Motion | GSAP (+ScrollTrigger), Lenis smooth scroll, motion (Framer Motion) for UI micro-interactions | Scroll-driven 3D + UI motion |
| UI libs | shadcn/ui + Radix primitives (restyled heavily to the Forgeline system), Magic UI / Aceternity / React Bits as *inspiration or selectively adapted components*, lucide-react, sonner for toasts, vaul for mobile drawers, cmdk for command palette | Libraries allowed and encouraged by the brief |
| Data/state | TanStack Query (server state, patched by socket events), Zustand (UI + realtime status), React Hook Form + Zod | Per brief list |
| Drag and drop | dnd-kit | Kanban, touch-friendly |
| Tables | TanStack Table (admin users) | Per brief list |
| Backend | NestJS (guards, interceptors, modules) | Authorization via Guards is the cleanest way to show server-side enforcement |
| Validation | Zod schemas in `packages/shared`, applied by a Nest pipe | Single source of truth |
| ORM | Prisma (migrations, typed client) with raw SQL where needed (conditional update for versioning, activity queries) | Reproducible migrations |
| DB | PostgreSQL 16 via Docker Compose | Relational |
| Auth | Argon2id password hashing; short-lived access JWT + rotating refresh token (hash stored in DB), both in httpOnly SameSite=Lax cookies | Same-site on localhost across ports; no tokens in localStorage |
| Real-time | **Socket.IO** with rooms (`user:{id}`, `project:{id}`), auth in handshake via cookie | Rooms + auto-reconnect + fallbacks; justification doc required (compare vs raw WS and SSE) |
| Security | helmet, CORS allow-list with credentials, rate limiting (@nestjs/throttler), Origin/CSRF check for state-changing requests | |
| Logging | pino (nestjs-pino), request IDs | |
| Tests | Vitest (shared/web), Jest + supertest (api e2e on a dockerised test DB), Playwright (one 2-browser realtime e2e) | Brief: test permissions + conflict detection |
| AI (optional feature) | Groq API (free tier, e.g. a Llama 3.x 70B/versatile model; confirm current model IDs from Groq docs), fallback Google AI Studio free Gemini key | Free, high limits |

## 4. Repository layout

```
NeoStats-Hackathon/
├─ AGENTS.md                # short pointer: read docs/00-PLAYBOOK.md + skills first (also create GEMINI.md copy)
├─ README.md                # judge-facing; setup, env, migrate, seed, run, creds
├─ docker-compose.yml       # postgres (+ test db)
├─ .env.example
├─ docs/                    # all markdown docs (section 14)
├─ skills/                  # canonical skills (section 15); mirror into .agent/skills/ if Antigravity requires it
├─ apps/
│  ├─ api/  (NestJS: src/modules/{auth,users,projects,members,tasks,comments,notifications,activity,realtime,ai,health}, src/common/{policy,guards,filters,pipes,events}, prisma/{schema.prisma,migrations,seed.ts}, test/)
│  └─ web/  (Next.js: src/app, src/components/{ui,hud,scenes,forms}, src/lib/{api,socket,queries,three,fonts}, src/stores, public/{fonts,models,textures,video,hdr})
└─ packages/shared/         # zod schemas, enums, permission matrix constants, event names, error codes
```

## 5. Git workflow (you own this)

- `main` is always runnable. Work on `phase/<n>-<slug>` or `feat/<slug>` branches; open a PR (`gh pr create`) and squash-merge after the phase checks pass. If `gh` is unavailable, merge locally and push.
- Conventional commits (`feat(api): ...`, `fix(web): ...`, `docs: ...`, `test: ...`, `chore: ...`). Small, frequent commits: commit history is part of the evaluation ("shows how you worked").
- Tag milestones: `v0.1-backend-core`, `v0.2-realtime`, `v0.3-ui-alpha`, `v1.0-submission`.
- After every merged phase update `docs/PROGRESS.md` (see playbook) and push.
- Never commit `.env`, large raw assets (>5 MB; compress first), or node_modules.

## 6. Data model (PostgreSQL via Prisma; design is yours to refine but keep these guarantees)

Enums: `GlobalRole` (ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER), `ProjectRole` (MANAGER, MEMBER, VIEWER), `TaskStatus` (BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE), `TaskPriority` (LOW, MEDIUM, HIGH, URGENT), `ProjectStatus` (ACTIVE, ARCHIVED).

Tables (all `id` UUID v7 or cuid, `created_at`, `updated_at`):
- **users**: email (unique, citext), name, handle (unique, for @mentions), password_hash, global_role, is_active (deactivate, never hard-delete), avatar_seed, last_login_at, token_version.
- **refresh_tokens**: user_id, token_hash, family_id, expires_at, revoked_at, user_agent, ip (rotation + reuse detection).
- **projects**: name, key (unique short code e.g. FRG), description, status, archived_at, created_by, **version**.
- **project_members**: project_id, user_id, project_role, added_by; UNIQUE(project_id, user_id). A project manager is a member with project_role MANAGER (Admin assigns).
- **tasks**: project_id, number (per-project sequence), title, description, status, priority, assignee_id (nullable), reporter_id, due_date, position (fractional/lexorank for ordering in lane), **version INT NOT NULL DEFAULT 1**, deleted_at (soft delete optional but hard delete is acceptable if activity keeps a snapshot).
- **comments**: task_id, project_id (denormalised for scoping), author_id, body, mentions (uuid[]), deleted_at.
- **notifications**: user_id (recipient), type, project_id, entity_type, entity_id, actor_id, payload jsonb, read_at (null = unread).
- **activity_logs**: id, user_id, project_id (nullable for system-level), action, entity_type, entity_id, metadata jsonb, created_at.
- Indexes: tasks(project_id, status, position), tasks(assignee_id), comments(task_id, created_at), notifications(user_id, read_at, created_at desc), activity_logs(project_id, created_at desc), project_members(user_id).
- Constraints at DB level: FKs with sensible ON DELETE, CHECK on enums, UNIQUE on membership.

## 7. Authorization (the core)

Two layers: **global role** and **project-level role**. Implement a single `PolicyService` (pure functions, unit-tested) plus Nest guards/decorators (`@RequirePermission('task:update')`, `@ProjectScoped()`). No authorization logic in controllers beyond declaring the permission; no frontend-only checks.

Effective permission matrix (the web app must consume the same matrix from `packages/shared` to show/hide UI, but the server is authoritative):

| Action | Admin | Project Manager (on assigned projects) | Team Member (on member projects) | Viewer |
|---|---|---|---|---|
| Manage users (create/update/deactivate) | ✅ | ❌ | ❌ | ❌ |
| Create / archive-delete project | ✅ | ❌ | ❌ | ❌ |
| Assign project managers | ✅ | ❌ | ❌ | ❌ |
| View all projects & system activity | ✅ | only own | only own | only own (read-only) |
| Update project details | ✅ | ✅ | ❌ | ❌ |
| Add/remove members, change project role | ✅ | ✅ | ❌ | ❌ |
| Create/delete tasks, assign tasks | ✅ | ✅ | ❌ | ❌ |
| Update task fields | ✅ | ✅ | only tasks assigned to them | ❌ |
| Change task status | ✅ | ✅ | only tasks assigned to them | ❌ |
| Add comment | ✅ | ✅ | ✅ | ❌ |
| Delete comment | ✅ | ✅ | own comments | ❌ |
| View project, tasks, activity | ✅ | ✅ | ✅ | ✅ (read-only) |

Rules: membership is required to read a project (except Admin). A user whose global role is TEAM_MEMBER can never exceed member capabilities even if given project_role MANAGER; define precisely and document the resolution rule (global role caps project role). Deactivated users: login blocked, tokens revoked, sockets disconnected immediately. Return **401** unauthenticated, **403** forbidden, **404** for resources the user must not know exist (document the choice), **409** conflicts, **422/400** validation.
When membership or roles change, force-update socket room membership in real time.

## 8. API contract (`/api/v1`, JSON, consistent envelope)

Error format (always): `{ "error": { "code": "VERSION_CONFLICT", "message": "...", "details": {...}, "requestId": "..." } }`.
List format: `{ "data": [...], "page": { "nextCursor": "...", "limit": 25, "total"?: n } }` (cursor pagination for tasks/activity/notifications; offset OK for admin users table).

- Auth: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me` (profile), `POST /auth/change-password`
- Users (Admin): `GET /users` (search, role, active, pagination), `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `POST /users/:id/deactivate`, `POST /users/:id/reactivate`
- Projects: `GET /projects` (filters: status, q, mine), `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id` (version), `POST /projects/:id/archive`, `POST /projects/:id/restore`, `GET /projects/:id/stats`
- Members: `GET /projects/:id/members`, `POST /projects/:id/members`, `PATCH /projects/:id/members/:userId`, `DELETE /projects/:id/members/:userId`
- Tasks: `GET /projects/:id/tasks` (status, assignee, priority, q, due range, sort, cursor), `POST /projects/:id/tasks`, `GET /tasks/:id`, `PATCH /tasks/:id` (**requires `version`**), `POST /tasks/:id/assign` (version), `POST /tasks/:id/status` (version), `POST /tasks/:id/move` (status + position, version), `DELETE /tasks/:id`, `GET /tasks/mine`
- Comments: `GET /tasks/:id/comments`, `POST /tasks/:id/comments`, `DELETE /comments/:id`
- Activity: `GET /projects/:id/activity`, `GET /activity` (Admin, system-wide), filters: action, entityType, actor, date range
- Notifications: `GET /notifications` (unread filter), `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`
- AI (optional, section 10): `POST /projects/:id/ai/digest`, `POST /ai/task-draft`
- Ops: `GET /health`, `GET /health/db`, OpenAPI/Swagger at `/api/docs` (document auth + error shapes)

Idempotency: creation endpoints accept an optional `Idempotency-Key` header (nice-to-have).

## 9. Concurrency and real-time

### 9.1 Optimistic concurrency (mandatory, explain it)
- Every task has `version`. Every mutating task call includes the client's `version` (body field; also support `If-Match`).
- Update with a single atomic statement: `UPDATE tasks SET ..., version = version + 1 WHERE id = $1 AND version = $2 RETURNING *`. Zero rows -> fetch current row -> respond **409** with `{code:"VERSION_CONFLICT", details:{ current: <latest task>, yourVersion, currentVersion }}`.
- Apply the same to projects. Concurrent comment creation needs no version.
- UI: on 409, open a conflict sheet showing "their version vs your changes", per-field choices (Keep theirs / Apply mine / Merge), re-submit with the new version. Also a live "someone else is editing / just changed this" banner from socket events.
- Test: two parallel requests with the same version -> exactly one 200, one 409. Include a DB-level concurrency test.

### 9.2 Real-time design
- Socket.IO gateway in the API; handshake authenticates via the same httpOnly cookie; validate again on room join.
- Rooms: `user:{id}` (notifications, membership changes), `project:{id}` (task/comment/activity events). Join only after server-side membership check; leave on removal/deactivation.
- Events are emitted **after DB commit** through an in-process domain event bus (never inside an open transaction). Names in `packages/shared`: `task.created|updated|status_changed|assigned|deleted|moved`, `comment.created|deleted`, `member.added|removed|role_changed`, `project.updated|archived`, `activity.created`, `notification.created`, `notification.read`, `presence.update`, `user.deactivated`.
- Payloads are minimal but sufficient to patch the TanStack Query cache directly (include entity + new version + actor). On reconnect, the client invalidates active queries to heal missed events.
- Presence: who is viewing a project/task, and a soft "editing" indicator. Heartbeat + TTL, in memory (single node is fine; document the Redis-adapter path for scaling).
- Delivery ordering for a task relies on `version`; the client ignores events with an older version than cached.

### 9.3 Activity log and notifications
- Activity written **in the same DB transaction** as the change. Actions at minimum: project.created/updated/archived, member.added/removed/role_changed, task.created/updated/assigned/status_changed/deleted, comment.added/deleted, user.created/deactivated. `metadata` holds before/after diffs.
- Notifications for: task assigned, status changed (to assignee/reporter), mentioned (`@handle` in comments), membership changes, new comment on a task you're assigned to/reported/participate in. Never notify the actor about their own action. Unread/read with real-time badge updates.

## 10. Optional AI features (free models only)

Do these **after** the core is complete and tested (Phase 8). Server-side only, key in `.env` (`GROQ_API_KEY`), behind `AI_ENABLED` flag, rate-limited, never sends data the user can't access.
1. **Project Digest:** summarise recent activity + task states into a short standup brief (streams to the UI with a terminal-style typing effect).
2. **Smart Task Draft:** paste messy text -> structured task (title, description, priority, suggested assignee from members) the user confirms before saving.
3. (stretch) "Ask the board": natural-language filter -> validated filter params (never raw SQL).
Handle quota/429 gracefully; app works fully with `AI_ENABLED=false`.

## 11. Frontend vision (this is where it must be unforgettable)

### 11.1 Concept: "FORGELINE — the operations forge"
Tasks are raw material moving through a forge: BACKLOG (cold iron) -> TODO -> IN PROGRESS (heated) -> IN REVIEW (glowing) -> DONE (quenched). A persistent full-viewport WebGL layer behind the app reacts to the data: heat intensity follows active work, a shockwave ripples from the exact card position when a real-time event arrives, ember particles drift with scroll velocity. Interface language is **HUD / operations-deck**: crisp, dense, tactile, game-like feedback, but fully legible and accessible. Not a toy: it must be fast to use for real project management.

### 11.2 Anti-patterns (forbidden)
No purple/blue gradient blobs, no Inter/Roboto/system fonts, no centered hero with "Build faster with AI", no uniform grid of rounded-2xl glass cards, no emoji as icons, no generic stock illustrations, no default shadcn look left unstyled, no flat white dashboards. If a screen could belong to any random SaaS, redo it.

### 11.3 Design reference research (do this first in Phase 5)
Open with the Antigravity browser and study: https://www.neostats.ai/ , https://www.awwwards.com/sites/why-zero , https://www.zero.university/ . Write `docs/DESIGN_REFERENCE.md`: typographic scale and scale ratios, how huge display type is used, grid/margins, cursor and scroll behaviour, transitions, colour usage, section rhythm, motion timings/easings, what to borrow in spirit (never copy assets or layouts verbatim). Take screenshots into `docs/design-ref/`. Align accent colour family with NeoStats' green identity (observed on neostats.ai) so the product feels made for them, but with a darker, more cinematic treatment.

### 11.4 Typography (not default fonts; rendered through WebGL)
- **Display (WebGL, 3D/SDF):** *Big Shoulders Display* (Black/ExtraBold) as primary, with *Anton* or *Saira Extra Condensed* as an alternate for tall narrow headlines. Ultra-condensed, industrial, poster scale.
- **HUD / labels / numerals (WebGL where possible):** *Chakra Petch* and *Oxanium* (sci-fi game UI feel). Optionally *Teko* / *Rajdhani* for stat readouts. Avoid Orbitron (overused).
- **Mono data:** *JetBrains Mono* or *Space Mono* for IDs (FRG-142), timestamps, versions.
- **Long reading text (DOM, for accessibility and selection):** *Barlow Semi Condensed* or *Chakra Petch* light weights. Body text may be DOM; all headings, HUD, stats, nav labels and big moments are WebGL text.
- Implementation: troika-three-text through drei `<Text>` using **local font files** in `public/fonts` (troika needs TTF/OTF/WOFF, not WOFF2: use `@fontsource/*` .woff files or download TTFs). Preload glyph sets (`preloadFont`). Build a `<ForgeText>` component supporting: per-letter stagger, shader displacement/glitch/heat-haze, outline + fill, depth extrude variant (TextGeometry for hero only), scroll-linked tracking changes, and a DOM fallback (`aria-label` + visually hidden real text, SSR-safe) so screen readers and SEO still work.
- Fluid scale with `clamp()`; display text can be 20–40vw on mobile hero. Tight negative tracking on huge type, wide tracking on tiny HUD caps.

### 11.5 Colour system (tokens in CSS variables, shared with shaders via a `tokens.ts`)
- `void #060709` (page), `basalt #0E1013`, `graphite #171A1F`, `steel #2A2F37` (borders), `bone #ECE8DF` (primary text), `ash #9AA0A8` (secondary)
- `plasma #B8FF2C` (primary accent, NeoStats-green family), `ember #FF5A1F` (heat / admin / destructive-adjacent), `ice #5CE1E6` (real-time / info), `amber #FFB020` (review/warn), `crimson #FF2E4D` (conflict/danger)
- Role colours: Admin=ember, Project Manager=plasma, Team Member=ice, Viewer=ash. Status colours map to the forge heat ramp.
- Grain/noise overlay, scanline hints and subtle vignette applied in post-processing, not CSS images. Validate contrast (WCAG AA) for all text on the DOM layer.
- Provide a "Reduced FX" mode and a light "Daylight" theme is NOT required; dark-first only.

### 11.6 WebGL architecture
- **One persistent `<Canvas>` in the root layout** (fixed, behind content) + drei `<View>` portals so DOM elements (cards, avatars, stat totems) can host their own 3D viewports without multiple contexts. Route changes must not remount the context.
- Scenes (lazy-loaded modules): `HeroForge` (login/landing), `HeatField` (global ambient shader), `StatTotems` (dashboard), `ProjectTile3D` (tilting 3D tiles with env reflections), `LaneRipples` (board events), `TimelineTunnel` (activity), `RosterPlates` (team), `ConflictBeams` (conflict resolution), `NotificationPulse`.
- Post-processing: bloom, chromatic aberration (subtle), noise/grain, vignette, optional depth-of-field on hero only.
- Assets: HDRI from Poly Haven (CC0), textures from ambientCG (CC0), GLB models from CC0 sources or built procedurally; compress with gltf-transform (Draco/meshopt + KTX2). Hero loop and ambient videos (WebM + MP4, <3 MB each, poster images) from free sources (Pexels, Mixkit, Coverr) or recorded from your own WebGL scene with Playwright; use image generation if Antigravity offers it for key art. Track every asset and licence in `docs/ASSETS.md`.
- **Performance tiers** via `detect-gpu` + drei `PerformanceMonitor`: LOW (DPR 1, no postprocessing, ≤1k particles, static textures), MID, HIGH. Cap DPR (mobile ≤1.5). Respect `prefers-reduced-motion`. Pause rendering when tab hidden or when canvas offscreen. Target 60fps desktop, ≥30fps mid-range phone. Budget: first load JS ≤ 350 KB gz excluding lazy 3D chunks; LCP ≤ 2.5 s on 4G emulation for the login screen (show a fast CSS/poster state, then hydrate 3D).
- Mobile interactions: gyroscope parallax (with permission prompt), touch-drag orbit on hero, haptics (`navigator.vibrate`) on status change/real-time events, bottom tab navigation in thumb zone, bottom-sheet (vaul) for task details, 44px minimum targets.
- Sound is optional (off by default, subtle UI ticks via Howler/Tone, user-toggled).

### 11.7 Screens (suggested routes from the brief)
`/login`, `/dashboard`, `/projects`, `/projects/[id]` (overview), `/projects/[id]/tasks` (board + list + filters), `/projects/[id]/team`, `/projects/[id]/activity`, `/tasks/[id]`, `/users` (Admin), `/notifications`, `/profile`. Plus a command palette (cmdk) and a global realtime connection indicator.
- **Login:** full-bleed hero forge scene, giant WebGL wordmark, sample-credential quick-fill chips for each role (demo-friendly, clearly labelled).
- **Dashboard:** WebGL stat totems (my open tasks, due soon, in review, unread), heat-field background, live activity ticker, "My tasks" list.
- **Projects:** 3D tilt tiles, archive state visually "cooled".
- **Board:** lanes with WebGL headers, drag-and-drop (touch-safe), card moves from other users animate in with a ripple + ice-coloured trace; avatars of people currently viewing; filters in a mobile drawer.
- **Task detail:** sheet on mobile / split pane on desktop; comments with @mention autocomplete; version badge; conflict UX.
- **Activity:** scroll-driven 3D tunnel/timeline with filters.
- **Team:** roster plates, role chips, add/remove/change role (PM/Admin only, controls absent for others but server-enforced).
- **Users (Admin):** dense TanStack Table, create/edit/deactivate.
- **Notifications:** list + real-time pulse + mark read/all.
- Empty/loading/error states are designed, not default. Skeletons use the heat-shimmer.

## 12. Testing plan

- Unit: PolicyService matrix (every role × action × ownership case), version-conflict logic, mention parser.
- API e2e (supertest, dockerised test DB): auth flows, refresh rotation + reuse detection, each forbidden action returns 403 for the wrong role, 404 for inaccessible project, 409 on stale version, pagination/filter correctness, activity + notification rows created, deactivated user blocked.
- Realtime e2e: two socket clients, A updates task, B receives event; unauthorised client cannot join a room; removed member is kicked from the room.
- Playwright: two browser contexts (different roles) -> change status in one, appears in the other without refresh; conflict dialog flow.
- CI: GitHub Actions workflow (lint, typecheck, test, build) green on every PR.

## 13. Phased execution (each phase = branch + PR + docs update + tag where noted)

| Phase | Name | Exit criteria |
|---|---|---|
| 0 | Bootstrap | Monorepo, pnpm, lint/format/husky, docker-compose Postgres, `.env.example`, AGENTS.md/GEMINI.md, `docs/` skeleton, `skills/` created, `docs/PROGRESS.md`, CI workflow, hello-world web↔api call over CORS with cookies |
| 1 | Backend foundation | Prisma schema + migrations + seed (4 role users, 3 projects, ~40 tasks, comments, activity), auth (login/refresh/logout/me), error filter, validation pipe, logging, swagger, health |
| 2 | Authorization + domain APIs | PolicyService + guards, Users/Projects/Members/Tasks/Comments full CRUD per section 8, versioned updates -> 409, activity written in transactions, notifications generated, pagination/filtering. Policy + conflict tests green. **Tag v0.1** |
| 3 | Real-time | Socket gateway, rooms, events after commit, presence, membership-change room sync, deactivation disconnect, realtime tests green. **Tag v0.2** |
| 4 | Backend hardening | Rate limits, helmet, CORS, security review, indexes verified with EXPLAIN, e2e coverage report, Postman/Bruno collection exported to `docs/api/` |
| 5 | Design system + 3D engine | `DESIGN_REFERENCE.md`, tokens, fonts, `ForgeText`, persistent Canvas + Views, perf tiers, shadcn restyle, layout shell (bottom nav mobile, rail desktop), HeroForge on `/login` |
| 6 | Auth + core pages | Login, dashboard, projects, project overview, team, users, profile with real API (TanStack Query) |
| 7 | Board + tasks + live | Board/list/task detail, comments, DnD, conflict UX, notifications, activity, socket-driven cache patching, presence, command palette, all scenes wired to real data. **Tag v0.3** |
| 8 | AI (optional) | Groq digest + task draft, flagged, with graceful fallback |
| 9 | Polish + performance | Lighthouse mobile pass, a11y pass (keyboard, focus, reduced motion, contrast, aria for WebGL text), device matrix test, asset compression, empty/error states, demo seed refresh |
| 10 | Submission | README final, `docs/ARCHITECTURE.md` (real-time approach, data model, authorization, concurrency), `docs/AI_USAGE.md`, `docs/EXPLAINED/*`, fresh-clone run-through verified, demo script, screenshots/GIFs, **Tag v1.0** |

Rules: never start a phase while the previous phase's checks fail. If a decision is ambiguous, pick the option that best serves server-side authorization, concurrency correctness and judge explainability, document it in `docs/DECISIONS.md` (ADR style), and continue. Don't stop to ask unless blocked by something only the user can supply (an API key).

## 14. Documentation to maintain (all markdown, in `/docs`)

`00-PLAYBOOK.md` (provided; keep updated), `PROGRESS.md` (living status board), `ARCHITECTURE.md`, `DATA_MODEL.md` (ER diagram in Mermaid), `AUTHORIZATION.md` (matrix + resolution rules), `REALTIME.md` (events, rooms, flow diagrams, why Socket.IO), `CONCURRENCY.md`, `API.md` (+ `docs/api/` collection), `DESIGN_SYSTEM.md`, `DESIGN_REFERENCE.md`, `WEBGL.md` (scenes, tiers, budgets), `ASSETS.md` (sources/licences), `DECISIONS.md`, `TESTING.md`, `SECURITY.md`, `AI_USAGE.md` (what AI built vs what the owner decided; honest and specific), `DEMO_SCRIPT.md` (5-minute judge walkthrough hitting every brief requirement), and `EXPLAINED/<module>.md` for each backend module and each major frontend system: plain-language "how it works, why this way, how to modify it, likely interview questions and answers". The owner will be quizzed on this code; write these as a study guide.

## 15. Skills to create in `/skills` (mirror to `.agent/skills/` if needed; each is `<name>/SKILL.md` with frontmatter `name`, `description` and concise steps/checklists)

`git-workflow`, `nest-module-scaffold`, `authz-policy`, `optimistic-concurrency`, `realtime-events`, `prisma-migrations-seed`, `api-conventions` (errors, pagination, filters), `r3f-scene-builder`, `webgl-typography`, `design-tokens-forgeline`, `webgl-performance-budget`, `mobile-first-qa`, `testing-playbook`, `ai-groq-integration`, `docs-and-explainers`, `session-report`. Create them in Phase 0 from the specs in this plan, then keep refining; consult the relevant skill before each task and update it when you learn something.

## 16. Environment variables (document all in `.env.example` and README)

`DATABASE_URL`, `TEST_DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `API_PORT=4000`, `WEB_ORIGIN=http://localhost:3000`, `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, `NEXT_PUBLIC_WS_URL=http://localhost:4000`, `AI_ENABLED`, `GROQ_API_KEY`, `GROQ_MODEL`, `GOOGLE_AI_API_KEY` (optional fallback). If a needed secret is missing, generate local dev secrets yourself; only ask the user for `GROQ_API_KEY` when you reach Phase 8.

Seed logins (README must list): `admin@forgeline.dev`, `pm@forgeline.dev`, `member@forgeline.dev`, `viewer@forgeline.dev`, plus a second member and second PM for multi-user tests; shared dev password `Forge@12345`.

## 17. Definition of done (v1.0)

- [ ] Fresh clone -> README steps -> app runs with `docker compose up -d`, migrate, seed, two dev servers
- [ ] Every brief requirement demonstrably works (use `DEMO_SCRIPT.md`)
- [ ] Direct API calls with wrong-role tokens are rejected (tested)
- [ ] Stale update returns 409 and UI resolves it
- [ ] Two browsers stay in sync in real time for tasks, status, assignment, comments, notifications, membership
- [ ] Activity + notifications correct and real-time
- [ ] Mobile-first verified at 360, 390, 768, 1280, 1920 widths; 3D tiers verified
- [ ] CI green, tests meaningful, no secrets in history
- [ ] All docs + EXPLAINED guides written; AI_USAGE honest

## 18. Reporting protocol (important: the owner relays your output to another assistant with a small token budget)

At the end of **every** response that completes a prompt, append a block titled `### SESSION REPORT` of **at most 25 lines**: what was done, branch/commit/PR, tests status (counts), what's running, deviations from plan, open issues/blockers, and exactly what you recommend as the next prompt. Also update `docs/PROGRESS.md` with the same facts. No long code dumps in the report.

Begin now: read `docs/00-PLAYBOOK.md` (if present, otherwise create it from section 13–18 of this plan), then execute **Phase 0** and report.
