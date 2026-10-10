# Forgeline Real-Time Architecture & Event Protocol

## Architectural Justification: Socket.IO vs Raw WebSocket vs Server-Sent Events (SSE)
1. **Server-Sent Events (SSE)** are strictly unidirectional (server-to-client) and bottleneck multi-user presence, interactive cursor broadcast, and bidirectional heartbeat telemetry over HTTP/1.1 connections.
2. **Raw WebSockets** lack native multiplexing/room abstractions, automatic reconnection backoff, buffering during transport transitions, and cross-browser fallback handling, requiring hundreds of lines of fragile boilerplate.
3. **Socket.IO** provides native room scoping (`project:{id}`, `user:{id}`), heartbeat-managed connection lifecycles, cross-origin credential passing from `httpOnly` cookies, and battle-tested reconnection buffering out-of-the-box.
4. **Conclusion**: Socket.IO guarantees zero phantom events, transaction-bound state propagation, and sub-50ms synchronization across concurrent collaborators with minimal operational overhead.

---

## Room Scoping Topology
- **`user:{userId}`**: Dedicated personal stream. Receives inbox notifications (`notification.created`, `notification.read`), membership evictions, and account deactivation signals.
- **`project:{projectId}`**: Collaborative workspace stream. Receives live task mutations, kanban movements, comment threads, member roster updates, and live presence rosters.

---

## Event Catalog & Payload Matrix

| Event Name | Scope / Room | Direction | Payload Contract (`RealtimeEnvelope.data`) |
|---|---|---|---|
| `project.join` | Server | Client -> Svr | `{ projectId: string }` |
| `project.leave` | Server | Client -> Svr | `{ projectId: string }` |
| `presence.heartbeat` | Server | Client -> Svr | `{ projectId: string }` |
| `presence.update` | `project:{id}` | Svr -> Client | `{ projectId, activeUsers: [{ userId, name, handle, role, lastSeen }] }` |
| `task.created` | `project:{id}` | Svr -> Client | Full Task object with `version: 1`, `number`, `assignee` |
| `task.updated` | `project:{id}` | Svr -> Client | Updated Task object with incremented `version` |
| `task.status_changed` | `project:{id}` | Svr -> Client | Task object with new `status` and incremented `version` |
| `task.assigned` | `project:{id}` | Svr -> Client | Task object with new `assigneeId` and incremented `version` |
| `task.moved` | `project:{id}` | Svr -> Client | Task object with new `status`, `position`, and incremented `version` |
| `task.deleted` | `project:{id}` | Svr -> Client | `{ id: string, projectId: string }` |
| `comment.created` | `project:{id}` | Svr -> Client | Comment entity with `author`, `taskId`, and `mentions` |
| `comment.deleted` | `project:{id}` | Svr -> Client | `{ id: string, taskId: string, projectId: string }` |
| `member.added` | `project:{id}` | Svr -> Client | ProjectMember record with populated `user` details |
| `member.removed` | `project:{id}` & `user:{target}` | Svr -> Client | `{ projectId: string, userId: string }` (Triggers room eviction) |
| `member.role_changed` | `project:{id}` | Svr -> Client | Updated ProjectMember with new `projectRole` |
| `project.updated` | `project:{id}` | Svr -> Client | Updated Project record with new `version` |
| `project.archived` | `project:{id}` | Svr -> Client | Archived Project record |
| `notification.created` | `user:{recipientId}` | Svr -> Client | Notification record with type, payload, and actor info |
| `notification.read` | `user:{recipientId}` | Svr -> Client | `{ id: string, readAt: string }` |
| `user.deactivated` | Global / `user:{id}` | Svr -> Client | `{ userId: string }` (Disconnects socket immediately) |
