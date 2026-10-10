# EXPLAINED: Data Model & Concurrency Design (Study Guide & Viva Prep)

---

## 1. What is this module in plain English?
The data model defines the structural backbone of Forgeline in PostgreSQL via Prisma. It stores users, projects, memberships, Kanban tasks, discussion comments, notification feeds, and immutable activity logs. Crucially, it embeds the concurrency controls required to ensure multiple team members cannot accidentally overwrite each other's work.

---

## 2. Key Lifecycle & Mechanics

### Race-Safe Per-Project Task Numbering
* In tools like Jira or Linear, tasks have human-readable identifiers like `HLX-1`, `HLX-2`.
* Generating this with `SELECT MAX(number) + 1` is prone to race conditions if two managers create a task at the exact same millisecond.
* **Our Solution:** The `projects` table maintains an atomic `task_counter` column. During task creation within a transaction, we execute:
  ```sql
  UPDATE projects SET task_counter = task_counter + 1 WHERE id = $1 RETURNING task_counter;
  ```
  The returned number is assigned to the task. Combined with the DB constraint `UNIQUE(project_id, number)`, duplicate numbers are mathematically impossible.

### Optimistic Concurrency Control via `version`
* Every task has an integer `version` initialized to `1`.
* Every mutation executes an atomic predicate:
  ```sql
  UPDATE tasks SET title = $1, status = $2, ..., version = version + 1
  WHERE id = $3 AND version = $4
  RETURNING *;
  ```
* If another user modified the task between read and write, the database affects `0` rows.
* The API detects `0` affected rows, fetches the current state, and throws an HTTP 409 conflict envelope rather than corrupting data.

---

## 3. Why this design? (Design Justifications)

| Decision | Alternative Considered | Why we chose our approach |
|---|---|---|
| **PostgreSQL `CITEXT` for Email** | Normal `VARCHAR` + `.toLowerCase()` in app | If a developer ever writes a raw SQL query or bypasses the application layer, two rows differing only in case (`alex@forgeline.dev` vs `Alex@forgeline.dev`) could be inserted. `CITEXT` enforces case-insensitivity at the database engine level. |
| **Integer `version`** | `updated_at` timestamps for concurrency | High-throughput concurrent requests can execute within the same millisecond timestamp precision. An integer counter increments deterministically and is unambiguous. |
| **Denormalized `project_id` on Comments** | Join `comments -> tasks -> projects` | Scoping authorization and Socket.IO events to projects is very frequent. Denormalizing `project_id` on comments eliminates a join on every comment query and index lookup. |
| **Composite Indexes** | Single-column indexes on every FK | A query filtering by `project_id`, `status`, and ordering by `position` would require multiple index scans with single indexes. The composite index `(project_id, status, position)` serves the query in a single B-tree traversal. |

---

## 4. Top 5 Interview Questions & Exact Answers

### Q1: Why did you use PostgreSQL CITEXT instead of standard VARCHAR for emails?
**Answer:** "In standard PostgreSQL, `VARCHAR` is case-sensitive, meaning `alex@forgeline.dev` and `Alex@forgeline.dev` can coexist as distinct unique rows unless explicitly normalized by every single write path. `CITEXT` handles case-insensitivity internally at the database engine level, guaranteeing database-level data integrity."

### Q2: How does optimistic concurrency work in your Task model?
**Answer:** "Every task contains a `version: Int` field. When a client mutates a task, they submit their known version. We execute an atomic update statement: `UPDATE tasks SET ..., version = version + 1 WHERE id = $1 AND version = $knownVersion`. If another user changed the task first, zero rows are updated. The server immediately returns an HTTP 409 with the conflicting versions and current data, allowing the user to resolve the difference."

### Q3: Why not use pessimistic locking (`SELECT ... FOR UPDATE`) instead?
**Answer:** "Pessimistic locking holds database row locks across network roundtrips or user interaction time, which bottlenecks throughput and introduces deadlocks in high-traffic collaborative applications. Optimistic concurrency allows non-blocking reads and ensures only true write collisions trigger conflict resolution."

### Q4: How do you prevent duplicate task numbers like HLX-1 under concurrent creations?
**Answer:** "We use an atomic counter column on the `projects` table (`task_counter`). When a task is created, `task_counter` is incremented and returned in the transaction. Coupled with the composite unique constraint `@@unique([projectId, number])`, collisions are prevented by the database engine."

### Q5: Why is the activity log written in the same transaction as the task update?
**Answer:** "If activity logging was handled in a secondary asynchronous call or outside the transaction, a network failure or server crash could result in a modified task without an activity log entry, or an activity log without the task mutation. Writing them in the same transaction guarantees atomicity (ACID properties)."
