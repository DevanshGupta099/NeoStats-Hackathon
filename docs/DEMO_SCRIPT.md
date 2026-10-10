# FORGELINE — 5-Minute Judge Demonstration Script
Last updated: 2026-10-10 (v1.0 Release)

Follow this step-by-step walkthrough during the hackathon evaluation. Every item directly maps to core scoring criteria.

---

## Pre-Flight Checklist
1. PostgreSQL container running: `docker compose up -d postgres` (Port 5434).
2. Clean seed data: `pnpm db:seed`.
3. Servers running: `pnpm dev` (Web on `localhost:3000`, API on `localhost:4000`).
4. Two browser windows side-by-side:
   - **Window A (Left):** Chrome / Edge for Admin / PM (`pm@forgeline.dev` / `Forge@12345`).
   - **Window B (Right):** Incognito / Firefox for Team Member (`member@forgeline.dev` / `Forge@12345`).

---

## 1. Login & Visual Identity (0:00 – 0:30)
- **Action:** Open `http://localhost:3000/login`.
- **Highlight:**
  - Full-bleed procedural **HeroForge** ember shader and kinetic typography.
  - One-click role autofill chips (`Admin`, `Lead PM`, `Member`, `Viewer`) for instant switching without re-typing credentials.
  - Click **Admin** chip and submit. Transition to `/dashboard` renders the persistent 3D canvas and dynamic stat totems.

---

## 2. Real-Time Multi-User Collaboration (0:30 – 1:30)
- **Setup:**
  - Window A: Log in as `pm@forgeline.dev`, navigate to **Project Helios** (`/projects/<id>/tasks`).
  - Window B: Log in as `member@forgeline.dev`, navigate to the same project.
- **Action 1 (Presence Avatars):**
  - Point out the active user presence avatars on the top right of the board header updating live via ~20s heartbeats.
- **Action 2 (Task Creation & Instant Sync):**
  - Window A (PM): Click **NEW TASK** -> Create task `"Implement Sharded Session Storage"`.
  - Window B (Member): Watch the card appear on the Backlog lane immediately without page refresh, accompanied by an ice-neon trace glow and mobile haptic pulse.
- **Action 3 (Drag-and-Drop Lane Movement):**
  - Window B (Member): Drag card from `BACKLOG` to `IN_PROGRESS`.
  - Window A (PM): Card glides across lanes with visual feedback. Activity tab immediately logs the transition.

---

## 3. Server-Side Authorization Enforcement (1:30 – 2:30)
- **Premise:** The hackathon explicitly evaluates whether authorization is enforced on the server, not just in UI CSS.
- **Action 1 (UI Hiding):**
  - Window B (Member): Click **Team** tab. Roster management buttons (**ADD MEMBER**, **REMOVE**, **CHANGE ROLE**) are absent.
- **Action 2 (Bypass Attempt via Terminal):**
  - Run direct curl command pretending to be Member attempting to delete a project or change a member's role:
    ```bash
    curl -X POST http://localhost:4000/api/v1/projects/<id>/members \
      -H "Content-Type: application/json" \
      --cookie "access_token=<member_cookie>" \
      -d '{"userId":"<target_id>","role":"MANAGER"}'
    ```
  - **Result:** Server rejects with HTTP `403 Forbidden` (`code: "FORBIDDEN"`).
- **Action 3 (Executive Viewer):**
  - Log in as `viewer@forgeline.dev`. Notice all mutation buttons are disabled; direct API write attempts return 403 due to the **Rule of Cap**.

---

## 4. Concurrency Conflict Flow (HTTP 409) (2:30 – 3:30)
- **Premise:** Demonstrating zero silent overwrites through optimistic version locking.
- **Setup:**
  - Window A (PM) and Window B (Member) both open the same task modal (e.g. `HLX-3`, version = 1).
- **Execution:**
  - Window A (PM): Changes title to `"Locking Strategy: Row-Level Exclusive"` and clicks **Save Changes**. Version bumps to 2.
  - Window B (Member): (Still holding version 1 in form) Changes title to `"Locking Strategy: Optimistic Version Column"` and clicks **Save Changes**.
- **Result:**
  - Window B does *not* overwrite Window A. Instead, HTTP 409 triggers the **Conflict Resolution Sheet**.
  - Displays side-by-side diff:
    - *Their Current Server Value:* `"Locking Strategy: Row-Level Exclusive"` (v2)
    - *Your Pending Form Value:* `"Locking Strategy: Optimistic Version Column"`
  - Select **"Keep Theirs"** or **"Apply Mine"** per field and resubmit with the incremented version.

---

## 5. Mistral AI Operations: Streaming Standup & Smart Add (3:30 – 4:15)
- **Action 1 (Streaming Standup Digest):**
  - On the Project page, click **AI DIGEST**.
  - A terminal-style panel opens, establishing a Server-Sent Events stream from `POST /projects/:id/ai/digest`.
  - Mistral AI summarizes recent tasks, in-flight bottlenecks, and velocity in punchy brutalist markdown.
  - Note: App works seamlessly if AI is disabled (deterministic rule engine fallback).
- **Action 2 (Smart Add Task Draft):**
  - Click **NEW TASK** -> In the **SMART ADD** box, type `"Implement rate limiting on auth endpoints with sliding window"`. Click **DRAFT**.
  - Mistral extracts title, technical acceptance criteria, priority, and status into the form. User reviews and confirms before submission.

---

## 6. Mobile Responsiveness & WebGL Performance (4:15 – 4:45)
- **Action:** Open Chrome DevTools, switch to Mobile Viewport (`360px` / iPhone SE).
- **Highlight:**
  - Responsive HUD layout shell: Desktop rail collapses into bottom thumb navigation bar.
  - Horizontal snap-scrolling Kanban lanes with 44px minimum touch targets.
  - Vaul bottom sheets for task creation, filters, and task detail inspection.
  - WebGL quality tiers automatically throttled via `detect-gpu` to preserve high frame rates on low-power devices.

---

## 7. Engineering Rigor & Verification (4:45 – 5:00)
- **Show Verification Artifacts:**
  - Unit & E2E tests: `pnpm test` and `pnpm test:e2e` (30/30 green passing tests).
  - TypeScript compilation: `pnpm -r typecheck` (0 errors across all 3 monorepo packages).
  - Next.js production bundle: `next build` (12/12 routes static/dynamic).
  - Documentation index: `README.md`, `docs/ARCHITECTURE.md`, `docs/EXPLAINED/*.md`.
