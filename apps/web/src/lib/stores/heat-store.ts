import { create } from 'zustand';

interface HeatState {
  intensity: number;
  inProgressCount: number;
  setInProgressCount: (count: number) => void;
  setDirectIntensity: (intensity: number) => void;
}

export const useHeatStore = create<HeatState>((set) => ({
  intensity: 1.0,
  inProgressCount: 0,
  setInProgressCount: (count: number) => {
    // Intensity scales smoothly between 0.8 (idle) and 2.5 (heavily loaded)
    const computed = Math.min(0.8 + Math.max(0, count) * 0.15, 2.5);
    set({ inProgressCount: count, intensity: computed });
  },
  setDirectIntensity: (intensity: number) => set({ intensity }),
}));
