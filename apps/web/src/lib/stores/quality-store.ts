import { create } from 'zustand';
import { getGPUTier } from 'detect-gpu';

export type QualityTier = 'LOW' | 'HIGH';

interface QualityState {
  tier: QualityTier;
  fps: number;
  dpr: number;
  postprocessing: boolean;
  initialized: boolean;
  setTier: (tier: QualityTier) => void;
  initializeQuality: () => Promise<void>;
}

export const useQualityStore = create<QualityState>((set) => ({
  tier: 'LOW',
  fps: 60,
  dpr: 1,
  postprocessing: false,
  initialized: false,

  setTier: (tier: QualityTier) =>
    set({
      tier,
      dpr: tier === 'HIGH' ? Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) : 1,
      postprocessing: tier === 'HIGH',
    }),

  initializeQuality: async () => {
    if (typeof window === 'undefined') return;

    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (prefersReducedMotion || isMobile) {
        set({
          tier: 'LOW',
          dpr: 1,
          postprocessing: false,
          initialized: true,
        });
        return;
      }

      const gpuTier = await getGPUTier();
      const isHighTier = (gpuTier.tier ?? 1) >= 2 && !gpuTier.isMobile;

      set({
        tier: isHighTier ? 'HIGH' : 'LOW',
        dpr: isHighTier ? Math.min(window.devicePixelRatio, 2) : 1,
        postprocessing: isHighTier,
        initialized: true,
      });
    } catch {
      // Fallback safely to LOW on any error
      set({
        tier: 'LOW',
        dpr: 1,
        postprocessing: false,
        initialized: true,
      });
    }
  },
}));
