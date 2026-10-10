---
name: nest-module-scaffold
description: Standard structure and conventions for scaffolding NestJS modules in Forgeline.
---

# Nest Module Scaffold Skill

## Architecture per Module
Each module resides under `apps/api/src/modules/<name>/` and must contain:
1. `<name>.module.ts`: Module declaration with controllers, providers, and exports.
2. `<name>.controller.ts`: Thin controller delegating immediately to service. Uses decorators for auth & policy guards.
3. `<name>.service.ts`: Core business logic, transaction boundaries, domain event triggers.
4. `dto/`: Input/Output DTOs using `@forgeline/shared` Zod schemas via `ZodValidationPipe`.
5. `<name>.service.spec.ts` or `<name>.controller.spec.ts`: Unit/Integration tests.

## Rules
- Controllers must NEVER implement business logic or manual authorization checks.
- Service methods must perform operations in database transactions when creating activity logs or mutating multiple tables.
- All mutating endpoints must log activity in the same transaction.
- All endpoints must declare a policy check via `@RequirePermission()`.
