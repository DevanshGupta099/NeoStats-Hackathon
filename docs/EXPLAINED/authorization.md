# Viva Study Guide: Server-Side Authorization & Policy Service
Last updated: 2026-10-10

---

## 1. How It Works (Architecture Overview)
Forgeline implements a strict dual-tier authorization architecture:
1. **Global Role:** `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER`, `VIEWER`.
2. **Project Role:** `MANAGER`, `MEMBER`, `VIEWER` (stored in `project_members`).

The core engine is a pure, deterministic function in `PolicyService.can(...)`:
```typescript
can(
  globalRole: GlobalRole,
  projectRole: ProjectRole | null,
  permission: Permission,
  context?: PolicyContext
): boolean
```

The system enforces the **Rule of Cap**:
A user's effective capability is capped by their Global Role. Even if a user with global `VIEWER` is added to a project as `MANAGER`, their mutation permissions evaluate to `false`.

Enforcement is server-authoritative via `@RequirePermission(Permissions.XYZ)` decorators and NestJS `PolicyGuard`. If the guard check fails, the API responds with HTTP 403 Forbidden.

---

## 2. 5 Likely Interview Questions & Answers

### Q1: Why did you separate Global Role from Project Role instead of just having one role column?
**Answer:** In realistic enterprise organizations, an engineer might be a Senior Member across the company but act as the Lead Project Manager on a specific initiative. Conversely, external contractors or executive viewers might be restricted globally to read-only access. Decoupling Global and Project roles allows granular, per-project scoping without granting dangerous tenant-wide privileges.

### Q2: What is the "Rule of Cap" and how does it prevent privilege escalation?
**Answer:** The Rule of Cap states that `Effective Capability = Math.min(GlobalRole, ProjectRole)`. If a malicious actor or buggy frontend UI manages to add a global `VIEWER` as a project `MANAGER`, the server-side `PolicyService` checks the global role cap first. Because a `VIEWER` can never execute write actions globally, the mutation is rejected. This prevents privilege escalation vulnerabilities.

### Q3: Why is PolicyService implemented as a pure function without database dependencies?
**Answer:** Decoupling policy evaluation from database queries guarantees two huge advantages:
1. **Zero I/O overhead & instantaneous execution:** Evaluating permissions takes sub-microsecond CPU cycles.
2. **Deterministic, exhaustive testability:** We can test all 50+ combinations of roles, ownership, and permissions in lightweight unit tests without mocking databases or executing slow database roundtrips. The guard handles fetching the entity context, and passes it cleanly to `PolicyService`.

### Q4: If the frontend hides the "Delete Task" button for Team Members, why do we still need server-side guards?
**Answer:** Frontend UI hiding is purely for user experience (clean UX), not security. Any user can open DevTools, inspect network traffic, copy the session cookie, and send a direct `curl` or Bruno request (`DELETE /tasks/:id`). Without server-side NestJS `PolicyGuard` enforcement returning HTTP 403, anyone could bypass client restrictions.

### Q5: How do you handle resource ownership (e.g. editing your own comment vs someone else's)?
**Answer:** The `PolicyContext` contains optional resource attributes such as `authorId` or `assigneeId`. When checking `COMMENT_UPDATE` or `TASK_UPDATE`, `PolicyService` inspects whether `user.id === context.resource.authorId`. Members can update their own comments, while Project Managers and Admins have permission to moderate any comment.
