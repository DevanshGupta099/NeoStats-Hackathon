# Viva Study Guide: Optimistic Concurrency & Version Conflicts (HTTP 409)
Last updated: 2026-10-10

---

## 1. How It Works (Architecture Overview)
Forgeline rejects the naive "Last-Write-Wins" pattern in favor of **Optimistic Concurrency Control (OCC)**:

1. Every mutable entity (`tasks`, `projects`) carries an integer `version` initialized at `1`.
2. Every update operation includes the expected version in the SQL query:
   ```sql
   UPDATE tasks
   SET title = $1, status = $2, version = version + 1, updated_at = NOW()
   WHERE id = $3 AND version = $4
   RETURNING *;
   ```
3. If two users simultaneously submit updates based on version 3:
   - User A's transaction commits first -> row updated, version becomes 4.
   - User B's transaction runs -> `WHERE id = $3 AND version = 3` matches 0 rows!
4. The service detects 0 affected rows and returns HTTP 409 `VERSION_CONFLICT`:
   ```json
   {
     "statusCode": 409,
     "error": {
       "code": "VERSION_CONFLICT",
       "message": "Task was modified by another user. Refresh and reapply.",
       "currentVersion": 4,
       "attemptedVersion": 3
     }
   }
   ```
5. In the UI, the global 409 interceptor opens the **ConflictResolutionSheet**, displaying a side-by-side field diff ("Keep Theirs" vs "Apply Mine") and re-submits with the incremented version.

---

## 2. 5 Likely Interview Questions & Answers

### Q1: Why choose Optimistic Concurrency over Pessimistic Row Locking (`SELECT ... FOR UPDATE`)?
**Answer:** Pessimistic locking holds database lock handles while a user has a modal or form open. If a user walks away from their laptop or has high network latency, other team members are blocked from editing or reading the row, leading to connection pool exhaustion and deadlocks. Optimistic locking has zero lock contention during user thinking time and only enforces consistency at the exact millisecond of the write transaction.

### Q2: Why is the update query executed atomically in SQL rather than reading first and checking in Node.js?
**Answer:** Reading first (`const task = await prisma.task.findUnique()`) and then checking `task.version === input.version` in Node.js introduces a classic **Time-of-Check to Time-of-Use (TOCTOU)** race condition. Between the read and the subsequent write, another thread could commit an update. Enforcing `WHERE id = $1 AND version = $2` inside the single atomic `UPDATE` statement delegates serializability directly to PostgreSQL's engine.

### Q3: What happens on the client side when HTTP 409 is received?
**Answer:** The frontend TanStack Query mutation hook catches the 409 response. Instead of blowing away the user's uncommitted form changes or crashing, it opens a `ConflictResolutionSheet`. This sheet fetches the fresh server state (version 4) and presents a column-by-column diff comparison against the user's pending form values (version 3). The user can selectively choose which fields to keep or override, and click "Resolve & Save", sending the update with version 4.

### Q4: How does optimistic concurrency interact with Socket.IO real-time events?
**Answer:** When a remote user updates a task, the Socket.IO gateway emits `task.updated` with the new version. The receiving client's event handler compares `event.version` against its cached version. If the user currently has the task open in an editing sheet, an ambient warning banner ("Updated remotely by Sarah PM") appears, notifying them that a newer version exists before they even hit save.

### Q5: How do you handle race-safe task numbering per project without race conditions?
**Answer:** Rather than doing a non-atomic `SELECT MAX(number) FROM tasks WHERE projectId = $1`, each project table has a `task_counter` integer column. When creating a task, the transaction executes:
```sql
UPDATE projects SET task_counter = task_counter + 1 WHERE id = $1 RETURNING task_counter;
```
This guarantees contiguous, strictly sequential task numbering (e.g. `HLX-1`, `HLX-2`) even under heavy concurrent task creation.
