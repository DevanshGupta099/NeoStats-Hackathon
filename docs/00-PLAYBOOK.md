# FORGELINE PLAYBOOK — Operating Manual for the Build Agent

Place at `docs/00-PLAYBOOK.md`. Re-read at the start of every session and after any long pause. The master spec is `IMPLEMENTATION_PLAN.md` (keep a copy at `docs/01-IMPLEMENTATION_PLAN.md`). When they disagree, the Implementation Plan wins on *what*, this Playbook wins on *how*.

---

## 1. Who/what

- Product: **Forgeline**, a multi-user collaborative project management platform for the NeoStats Full Stack Engineering Hackathon.
- Repo: https://github.com/DevanshGupta099/NeoStats-Hackathon
- Owner: Devansh Gupta (MCA student). He will be quizzed on every line. Prefer readable, conventional code over clever code, and document the "why".
- Agent: you. Full permissions. Branch, commit, push, install, run Docker, edit env. Ask only when blocked on something that needs the owner (an API key, an account login).

## 2. Session start ritual (every prompt)

1. `git status`, `git log -5 --oneline`, current branch.
2. Read `docs/PROGRESS.md` (what's done / in progress / next).
3. Read the relevant `skills/*/SKILL.md` for the task.
4. Confirm services: `docker compose ps`, API health, web builds.
5. Do the task. Commit often.
6. Run lint + typecheck + tests for what you touched.
7. Update `docs/PROGRESS.md`, relevant docs, `docs/EXPLAINED/*`, `docs/AI_USAGE.md`.
8. Push; PR/merge if the phase is complete.
9. Finish with the `### SESSION REPORT` (max 25 lines).

## 3. Non-negotiables (judge-critical)

1. **Authorization on the server.** Every endpoint declares a permission. No controller logic that bypasses `PolicyService`. UI hiding is cosmetic only.
2. **Optimistic concurrency.** `version` on tasks (and projects). Atomic `UPDATE ... WHERE id AND version`. 409 with latest state. UI conflict flow.
3. **Real-time after commit.** Never emit before the transaction commits. Rooms authorised server-side.
4. **Activity in the same transaction** as the change.
5. **Notifications** never to the actor about their own action; unread/read; real-time badge.
6. **Validation** with shared Zod schemas on every input.
7. **No secrets in git.** `.env.example` is complete.
8. **Reproducible:** fresh clone + README = working app.
9. **Explainability:** every module gets an `EXPLAINED` doc and an `AI_USAGE` entry.

## 4. Conventions

**Code:** TypeScript strict, no `any` without a comment. ESLint + Prettier + lint-staged + husky. Imports via path aliases. One module = controller + service + dto/schemas + tests. Controllers thin, services hold business logic, `PolicyService` holds permissions.

**API:** `/api/v1`, plural nouns, verbs only for non-CRUD actions (`/archive`, `/assign`, `/status`). Status codes: 200/201/204, 400/422 validation, 401, 403, 404, 409, 429. Error envelope `{error:{code,message,details,requestId}}`. Cursor pagination `limit` (default 25, max 100). Filters via query params, validated.

**Git:** branches `phase/<n>-<slug>` / `feat/<slug>` / `fix/<slug>`; conventional commits; squash-merge PRs with a descriptive body (what, why, how tested); tags at milestones. Never force-push `main`.

**DB:** every schema change = a migration; never edit applied migrations; seed is idempotent (`pnpm db:seed` safe to re-run, `pnpm db:reset` for a clean slate).

**Naming:** DB snake_case, TS camelCase, events `entity.action` (e.g. `task.status_changed`), env vars SCREAMING_SNAKE.

**Docs:** markdown only, in `/docs`; diagrams in Mermaid; each doc starts with purpose and last-updated date.

## 5. Commands to standardise (define these scripts in root `package.json`)

```
pnpm dev            # web + api in parallel
pnpm dev:web | dev:api
pnpm db:up          # docker compose up -d postgres
pnpm db:migrate     # prisma migrate dev / deploy
pnpm db:seed
pnpm db:reset
pnpm lint | typecheck | test | test:e2e | build
pnpm assets:optimize   # gltf-transform + image/video compression
```

## 6. Frontend rules

- Mobile-first: write base styles for 360px, then `sm/md/lg/xl`. Test 360, 390, 768, 1280, 1920.
- One persistent Canvas; use `View` portals; lazy-load every scene; never create more than one WebGL context.
- All big type = WebGL `ForgeText` with DOM fallback. Body text DOM. Fonts local, preloaded.
- Colour only via tokens (`design-tokens-forgeline` skill). No hard-coded hex in components.
- Every realtime event path: socket -> typed handler -> `queryClient.setQueryData` patch (respect `version`) -> visual flourish (ripple/haptic) -> toast only if relevant.
- Perf tiers LOW/MID/HIGH; FPS overlay in dev (`?fps`); Reduced FX toggle in profile.
- Accessibility: keyboard reachability, visible focus, `prefers-reduced-motion`, aria labels for WebGL text, colour contrast AA on DOM text.
- No generic AI look (see Plan §11.2). If in doubt, push the design further, then check usability.

## 7. Design bible (quick reference)

| Token | Value | Use |
|---|---|---|
| void | #060709 | page |
| basalt | #0E1013 | surfaces |
| graphite | #171A1F | raised |
| steel | #2A2F37 | borders |
| bone | #ECE8DF | text |
| ash | #9AA0A8 | secondary text |
| plasma | #B8FF2C | primary accent / PM |
| ember | #FF5A1F | heat / admin |
| ice | #5CE1E6 | realtime / member |
| amber | #FFB020 | review / warning |
| crimson | #FF2E4D | conflict / danger |

Type: Big Shoulders Display (display), Chakra Petch + Oxanium (HUD), JetBrains Mono (data), Barlow Semi Condensed (reading). Motion: fast in, slow out (`cubic-bezier(.2,.9,.1,1)`), 120–240 ms for UI, 600–1400 ms for scene moments. Feedback is physical: ripples, heat, sparks, haptics.

## 8. Asset rules

- Prefer procedural/shader visuals and CC0 assets. Log every asset in `docs/ASSETS.md` (source, licence, path).
- Compress: GLB via gltf-transform (Draco/meshopt + KTX2), images to WebP/AVIF, video to WebM+MP4 under 3 MB with poster frame.
- No asset over 5 MB in git. Large source files stay out of the repo.
- Videos autoplay muted, `playsinline`, pause when offscreen.

## 9. Testing gates per phase

| Gate | Must pass |
|---|---|
| Any commit | lint + typecheck of touched packages |
| Phase 2 | PolicyService matrix tests, 409 test, forbidden-endpoint tests |
| Phase 3 | two-client socket tests, room auth tests |
| Phase 7 | Playwright two-browser sync + conflict flow |
| Phase 9 | Lighthouse mobile, a11y checks, 5-width visual pass |
| Phase 10 | fresh clone run-through in a clean directory |

If a test is flaky, fix the cause; don't retry-loop.

## 10. AI feature protocol (Groq, free)

Only after the core passes. Server-side calls, key from env, timeouts, retry with backoff on 429, hard token limits, strip data the requester can't access, feature flag, UI fallback. Confirm the current Groq model IDs from their docs at build time; if Groq fails, fall back to a free Google AI Studio key. Ask the owner for `GROQ_API_KEY` only at that point.

## 11. Reporting protocol (token-saving)

The owner pastes your output to another assistant with limited budget. So:
- Keep chat output short. Put detail in docs.
- End every completed prompt with:

```
### SESSION REPORT
Phase/task:
Branch / last commit / PR:
Done:
Tests (pass/fail counts):
Running now (ports/URLs):
Deviations from plan (and why):
Open issues / blockers:
Needs from owner (keys, decisions):
Recommended next prompt:
```
Max 25 lines. No code dumps. No repetition of the plan.

## 12. Troubleshooting defaults

- Cookies not sent cross-port: both on `localhost`, `SameSite=Lax`, `credentials: 'include'`, CORS `origin` = exact `WEB_ORIGIN`, `Access-Control-Allow-Credentials: true`.
- Socket not authenticating: ensure `withCredentials: true` and server reads the cookie header in `handshake`.
- Troika text blank: font file must be TTF/OTF/WOFF (not WOFF2); check path under `public/fonts`.
- Canvas jank on phone: lower DPR, disable postprocessing, cut particles, check `PerformanceMonitor` tier.
- Prisma conflict updates: use `updateMany`/raw SQL with version predicate and check affected count.
- Docker port clash: change host port in compose and `.env`.
- Cannot find module 'zod' or workspace packages: pnpm does not hoist dependencies. Ensure every package importing zod declares it in its own `package.json` dependencies (pinned version). Ensure `@forgeline/shared` exports map points to `dist/index.d.ts` and root `postinstall` runs `pnpm --filter @forgeline/shared build`.

## 13. Demo script skeleton (finalise in `docs/DEMO_SCRIPT.md`)

1. Login as Admin: create project, assign PM (activity entry appears live).
2. Two browsers: PM adds member + creates task; Member sees it instantly, gets a notification.
3. Member changes status; PM board animates; activity logs it.
4. Member tries a forbidden API call (Bruno/curl): 403.
5. Two users edit same task: second gets 409 conflict sheet, resolves.
6. Viewer sees read-only UI; direct write call is rejected.
7. Mobile view walkthrough (360px) with 3D scene tiers.
8. (If done) AI digest.
9. Show tests, CI, README, ARCHITECTURE.

## 14. Progress tracker template (`docs/PROGRESS.md`)

```
# Progress (update after every session)
Last updated: <date/time>
Current phase: <n> — <name>
| Phase | Status (todo/doing/done) | Branch/Tag | Notes |
Recent decisions: ...
Known issues: ...
Next 3 actions: ...
```
