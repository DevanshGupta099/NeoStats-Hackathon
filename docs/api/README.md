# Forgeline API & Curl Reference

All endpoints are mounted under `/api/v1`. Authentication uses `access_token` httpOnly cookie or `Authorization: Bearer <token>`.

## Optimistic Concurrency Control (HTTP 409)
Mutating tasks or projects requires passing the current `version` in the JSON body or via `If-Match: "<version>"` header.
```bash
# Update task with body version
curl -X PATCH http://localhost:4000/api/v1/tasks/{id} \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=..." \
  -d '{"title": "Updated Task Title", "version": 1}'

# Update task with If-Match header
curl -X PATCH http://localhost:4000/api/v1/tasks/{id} \
  -H "Content-Type: application/json" \
  -H "If-Match: \"1\"" \
  -H "Cookie: access_token=..." \
  -d '{"title": "Updated Task Title"}'
```
If modified concurrently: HTTP 409:
```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The task has been modified by another user",
    "details": {
      "current": { "id": "...", "version": 2 },
      "yourVersion": 1,
      "currentVersion": 2
    }
  }
}
```

## Key Domain Endpoints
- `GET /api/v1/projects` — Filtered project list (Admin sees all; users see member projects).
- `POST /api/v1/projects` — Create project (Admin only).
- `GET /api/v1/projects/:id/tasks?status=IN_PROGRESS&limit=25` — Cursor-paginated task list.
- `POST /api/v1/projects/:id/tasks` — Create task with race-safe contiguous number (`taskCounter`).
- `POST /api/v1/tasks/:id/comments` — Comment with `@handle` parsing and automatic notification dispatch.
- `GET /api/v1/notifications` — Real-time notification inbox with unread counts.
- `GET /api/v1/activity` — Project or admin-wide audit trail with before/after diff metadata.
