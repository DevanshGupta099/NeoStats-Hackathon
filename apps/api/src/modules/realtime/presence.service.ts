import { Injectable, Logger } from '@nestjs/common';
import { PresenceUser } from '@forgeline/shared';

interface TrackedUser {
  user: PresenceUser;
  lastHeartbeat: number;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly projectPresence = new Map<string, Map<string, TrackedUser>>();
  private readonly TTL_MS = 30000; // 30 seconds TTL

  addUser(projectId: string, user: PresenceUser): PresenceUser[] {
    if (!this.projectPresence.has(projectId)) {
      this.projectPresence.set(projectId, new Map());
    }

    const room = this.projectPresence.get(projectId)!;
    room.set(user.userId, {
      user,
      lastHeartbeat: Date.now(),
    });

    return this.getUsers(projectId);
  }

  removeUser(projectId: string, userId: string): PresenceUser[] {
    const room = this.projectPresence.get(projectId);
    if (!room) return [];

    room.delete(userId);
    if (room.size === 0) {
      this.projectPresence.delete(projectId);
      return [];
    }

    return this.getUsers(projectId);
  }

  removeUserFromAll(userId: string): Map<string, PresenceUser[]> {
    const affectedProjects = new Map<string, PresenceUser[]>();

    for (const [projectId, room] of this.projectPresence.entries()) {
      if (room.has(userId)) {
        room.delete(userId);
        affectedProjects.set(projectId, this.getUsers(projectId));
      }
    }

    return affectedProjects;
  }

  heartbeat(projectId: string, userId: string): boolean {
    const room = this.projectPresence.get(projectId);
    if (!room) return false;

    const entry = room.get(userId);
    if (!entry) return false;

    entry.lastHeartbeat = Date.now();
    return true;
  }

  getUsers(projectId: string): PresenceUser[] {
    const room = this.projectPresence.get(projectId);
    if (!room) return [];

    const now = Date.now();
    const active: PresenceUser[] = [];

    for (const [userId, entry] of room.entries()) {
      if (now - entry.lastHeartbeat < this.TTL_MS) {
        active.push(entry.user);
      } else {
        // Stale entry cleanup
        room.delete(userId);
      }
    }

    return active;
  }
}
