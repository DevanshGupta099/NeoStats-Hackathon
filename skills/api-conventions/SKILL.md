---
name: api-conventions
description: REST conventions, cursor pagination, filtering, and standard error envelopes for Forgeline.
---

# API Conventions Skill

## Routing & Semantics
- Base path: `/api/v1`
- Use plural nouns (`/projects`, `/tasks`, `/users`, `/notifications`).
- Use HTTP verbs for CRUD, reserving sub-paths only for non-CRUD domain actions (e.g., `POST /projects/:id/archive`, `POST /tasks/:id/assign`, `POST /notifications/read-all`).

## Standard Error Envelope
All errors must return the standard envelope:
```json
{
  "error": {
    "code": "VALIDATION_FAILED | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | VERSION_CONFLICT | RATE_LIMITED",
    "message": "Human readable explanation",
    "details": {},
    "requestId": "req_abc123"
  }
}
```

## Standard Pagination Envelope
Cursor-based pagination for high-volume entities (tasks, activity, notifications):
```json
{
  "data": [ ... ],
  "page": {
    "nextCursor": "uuid_or_cursor_string",
    "limit": 25,
    "total": 140
  }
}
```
Default limit is 25, maximum limit is 100.
