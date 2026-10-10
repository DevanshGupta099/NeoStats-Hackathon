---
name: authz-policy
description: Pure PolicyService rules and server-side Guard enforcement for Forgeline.
---

# Authz Policy Skill

## Core Principles
1. **Server-Side Enforcement is Authoritative:** Client-side UI hiding is cosmetic only. Any direct API call violating policy must return HTTP 403 (or 404 for inaccessible projects).
2. **Two-Tier Role Model:**
   - **Global Role:** ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER.
   - **Project Role:** MANAGER, MEMBER, VIEWER.
3. **The Rule of Cap:**
   A user's global role caps their effective capability on a project. For instance, a global `TEAM_MEMBER` assigned project role `MANAGER` cannot perform admin/manager actions outside member scope.
4. **Member Restrictions:**
   - Members can ONLY update task status and fields for tasks assigned to them.
   - Members CANNOT create tasks, delete tasks, or assign tasks to others.
5. **Deactivated Users:**
   `is_active = false` immediately terminates login, revokes all refresh tokens, and drops active WebSockets.

## Implementation Pattern
```typescript
@UseGuards(JwtAuthGuard, ProjectScopeGuard, PolicyGuard)
@RequirePermission('task:update')
@Patch(':id')
async updateTask(...) {}
```
All permission matrices must reside in `@forgeline/shared` and be tested with unit tests covering every role × action combination.
