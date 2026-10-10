---
name: realtime-events
description: Socket.IO gateway, post-commit domain event bus, room scoping, and presence management.
---

# Real-Time Events Skill

## Authentication & Handshake
- Socket.IO connects with `withCredentials: true`.
- Handshake middleware verifies the access JWT from the `httpOnly` cookie.
- Reject unauthenticated socket connections with HTTP 401 equivalent.

## Room Scoping
- `user:{userId}`: User-specific events (notifications, role changes, membership revivals/evictions).
- `project:{projectId}`: Project-scoped events (tasks, status changes, comments, lane movements).
- Client requests to join `project:{id}` are validated server-side against project membership.

## Post-Commit Event Dispatch
Never emit events from inside an active database transaction.
Use the Domain Event Bus:
1. Transaction commits successfully.
2. Service publishes domain event: `eventBus.publish(new TaskUpdatedEvent(...))`.
3. Event handler broadcasts to the appropriate room via Socket.IO.

## Client Cache Patching
- Payload contains `{ entity, version, actor, action }`.
- Frontend TanStack Query listener compares `event.version > cached.version`.
- Optimistically updates cache directly via `queryClient.setQueryData()` rather than refetching the entire list.
