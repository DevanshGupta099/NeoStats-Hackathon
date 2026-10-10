import { create } from 'zustand';

interface RecentEvent {
  entityId: string;
  eventType: string;
  actorId: string;
  timestamp: number;
}

interface RecentEventsState {
  events: Record<string, RecentEvent>; // entityId -> event
  addEvent: (entityId: string, eventType: string, actorId: string) => void;
  isRecentlyModified: (entityId: string) => boolean;
}

export const useRecentEventsStore = create<RecentEventsState>((set, get) => ({
  events: {},
  addEvent: (entityId: string, eventType: string, actorId: string) => {
    const now = Date.now();
    set((state) => ({
      events: {
        ...state.events,
        [entityId]: { entityId, eventType, actorId, timestamp: now },
      },
    }));

    // Expire highlight after 4 seconds
    setTimeout(() => {
      set((state) => {
        const copy = { ...state.events };
        if (copy[entityId] && copy[entityId].timestamp === now) {
          delete copy[entityId];
        }
        return { events: copy };
      });
    }, 4000);
  },
  isRecentlyModified: (entityId: string) => {
    const ev = get().events[entityId];
    if (!ev) return false;
    return Date.now() - ev.timestamp < 4000;
  },
}));
