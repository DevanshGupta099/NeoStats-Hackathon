---
name: prisma-migrations-seed
description: Prisma migration standards, relational constraints, and idempotent database seeding.
---

# Prisma Migrations & Seed Skill

## Schema Rules
- Use PostgreSQL-native types: `citext` for email, `uuid` or `cuid` for IDs, `jsonb` for activity metadata and notification payloads.
- Always include `createdAt` and `updatedAt`.
- Maintain composite indexes for critical queries:
  - `tasks(projectId, status, position)`
  - `tasks(assigneeId)`
  - `comments(taskId, createdAt)`
  - `notifications(userId, readAt, createdAt desc)`
  - `activity_logs(projectId, createdAt desc)`

## Migration Commands
- `pnpm db:migrate` -> runs Prisma migrations.
- Never edit existing applied migration files. Every schema alteration produces a new migration file.

## Seed Requirements
- `pnpm db:seed` must be completely idempotent.
- Must create users for all 4 roles:
  - `admin@forgeline.dev` (ADMIN)
  - `pm@forgeline.dev` (PROJECT_MANAGER)
  - `member@forgeline.dev` (TEAM_MEMBER)
  - `viewer@forgeline.dev` (VIEWER)
  - Secondary members and managers for multi-user real-time tests.
  - Password for all dev seed users: `Forge@12345`.
- Creates 3 realistic projects and ~40 tasks across statuses with initial comments and activity logs.
