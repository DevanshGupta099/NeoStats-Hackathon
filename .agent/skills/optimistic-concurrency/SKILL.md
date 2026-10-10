---
name: optimistic-concurrency
description: Versioning pattern, atomic update queries, and HTTP 409 conflict handling in Forgeline.
---

# Optimistic Concurrency Skill

## Database Contract
- Every `Task` and `Project` has an integer `version` initialized at `1`.
- Every mutating request must submit `version: number` in the payload (or `If-Match` header).

## Atomic SQL Update
Never do: fetch -> check version in JS -> update.
Always execute an atomic conditional update:
```sql
UPDATE tasks
SET title = $1, status = $2, ..., version = version + 1
WHERE id = $3 AND version = $4
RETURNING *;
```

## Conflict Flow
1. If the update statement returns 0 rows, a concurrent update occurred.
2. Fetch the current state of the entity from the database.
3. Throw an `HttpException` with HTTP 409 status:
```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Resource was modified by another user",
    "details": {
      "current": { ...latestEntityState },
      "yourVersion": 3,
      "currentVersion": 4
    },
    "requestId": "req_xyz"
  }
}
```
4. On the frontend, catch 409 and launch the Conflict Resolution Sheet allowing per-field diff resolution ("Keep theirs", "Apply mine", "Merge").
