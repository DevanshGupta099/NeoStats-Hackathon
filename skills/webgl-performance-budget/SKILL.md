---
name: webgl-performance-budget
description: GPU detection, tiered rendering, frame rate stabilization, and asset size budgets.
---

# WebGL Performance Budget Skill

## Performance Tiers
Use `detect-gpu` and `@react-three/drei`'s `PerformanceMonitor` to classify the client environment:
1. **LOW (Tier 1 - Low-end mobile / Integrated GPU):**
   - DPR fixed at 1.0.
   - Disable all post-processing passes (bloom, chromatic aberration, noise).
   - Cap particle systems at ≤ 1,000 count.
   - Simplified unlit shaders.
2. **MID (Tier 2 - Modern mobile / Laptops):**
   - DPR capped at 1.25.
   - Single-pass bloom and subtle vignette.
   - Medium particle densities.
3. **HIGH (Tier 3 - Dedicated desktop GPU):**
   - DPR up to 1.5.
   - Full post-processing suite (subtle chromatic aberration, grain, bloom).

## Target Metrics
- 60 FPS on desktop, ≥ 30 FPS on mid-range mobile.
- Initial bundle JS ≤ 350 KB gzipped (3D assets chunked and lazy-loaded).
- LCP ≤ 2.5s on simulated 4G mobile.
- No single asset file over 5 MB in git.
