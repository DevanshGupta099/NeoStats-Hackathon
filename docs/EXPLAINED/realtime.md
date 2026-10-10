# Viva Study Guide: Real-Time Engine, Socket.IO & Presence
Last updated: 2026-10-10

---

## 1. How It Works (Architecture Overview)
Forgeline's real-time engine connects client state with backend database truth using a 4-tier model:

1. **Authentication in Handshake:** When the client establishes a Socket.IO connection (`withCredentials: true`), the gateway extracts the `access_token` cookie from the HTTP handshake headers, verifies the JWT, checks that the user is not deactivated, and assigns `socket.data.user`.
2. **Room Scoping:**
   - Every socket immediately joins `user:{userId}` for private notifications and account termination signals.
   - When entering a project route, the client emits `project.join { projectId }`. The server validates project membership via `PolicyService` before allowing the socket into `project:{projectId}`.
   - On route exit, the client emits `project.leave { projectId }`.
3. **Post-Commit Domain Event Bus:**
   Backend controllers/services mutate data inside `prisma.$transaction`. Real-time events are staged in a domain event queue and emitted to Socket.IO rooms *exclusively after* the database transaction commits successfully.
4. **Presence Heartbeat:**
   Clients emit `presence.heartbeat { projectId }` every ~20s. An in-memory `PresenceService` tracks active viewers per project and evicts stale entries with a 30s TTL.

---

## 2. 5 Likely Interview Questions & Answers

### Q1: Why did you use an in-process DomainEventBus before emitting to Socket.IO?
**Answer:** Emitting WebSocket events directly inside a business service method risks leaking **phantom events**. If a service updates a task and immediately emits `task.updated`, but the subsequent activity log insert fails and rolls back the database transaction, the clients have already received an event that does not exist in the database. Staging events and dispatching them only after the Prisma transaction successfully commits guarantees that client state always mirrors committed database truth.

### Q2: Why did you choose Socket.IO over raw browser WebSockets?
**Answer:** 
1. **Fallback Transports:** Socket.IO seamlessly falls back to HTTP Long-Polling if WebSockets are blocked by corporate firewalls or VPNs.
2. **Built-in Room Scoping:** Managing dynamic subscriptions, room broadcast boundaries, and automatic disconnection cleanup is built-in and battle-tested.
3. **Heartbeat & Reconnection Protocol:** It handles heartbeat pings, automatic reconnects, and packet buffering during transient drops out of the box.

### Q3: How do you prevent unauthorized users from eavesdropping on project events?
**Answer:** In `RealtimeGateway.handleProjectJoin`, when a client emits `project.join { projectId }`, the server evaluates `PolicyService.can(...)` checking whether the authenticated user has `PROJECT_VIEW` permission on that project. If they are not a project member (and not a global Admin), the gateway rejects the join request. Sockets cannot receive events from rooms they were not authorized to join.

### Q4: What happens if a user is deactivated by an Admin while connected?
**Answer:** When an Admin deactivates a user, the backend emits `user.deactivated` to `user:{targetUserId}`. The gateway forces an immediate socket disconnect: `socket.disconnect(true)`. On the frontend, receiving `user.deactivated` severs all active subscriptions, clears query caches, and immediately redirects the user to `/login` with an account deactivation alert.

### Q5: Why does the frontend patch TanStack Query caches directly instead of invalidating queries?
**Answer:** Triggering `queryClient.invalidateQueries()` on every real-time event causes an HTTP network request flood, high server database load, and noticeable UI flickering. By applying in-place cache updates (`queryClient.setQueryData`), cards move instantaneously on the board with zero network latency. Query invalidation is reserved only for when the client reconnects after being offline.
