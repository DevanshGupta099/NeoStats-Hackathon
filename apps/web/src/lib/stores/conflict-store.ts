import { create } from 'zustand';
import { TaskItem } from '../queries/use-tasks';

export interface ConflictData {
  taskId: string;
  serverTask: TaskItem;
  pendingChanges: Partial<TaskItem>;
  onResolve: (resolvedData: Partial<TaskItem>, newVersion: number) => Promise<void>;
}

interface ConflictState {
  conflict: ConflictData | null;
  openConflict: (conflict: ConflictData) => void;
  closeConflict: () => void;
}

export const useConflictStore = create<ConflictState>((set) => ({
  conflict: null,
  openConflict: (conflict) => set({ conflict }),
  closeConflict: () => set({ conflict: null }),
}));
