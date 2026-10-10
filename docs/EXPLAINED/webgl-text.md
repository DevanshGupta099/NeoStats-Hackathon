# Viva Study Guide: WebGL, Three.js & Kinetic 3D Typography
Last updated: 2026-10-10

---

## 1. How It Works (Architecture Overview)
Forgeline features a brutalist, industrial 3D HUD visual identity without sacrificing mobile battery life or performance budgets:

1. **Persistent Single Canvas:** Rather than mounting separate `<Canvas>` components on different pages (which creates multiple WebGL contexts and crashes mobile browser memory limits), Forgeline mounts a single persistent Canvas at the root layout with fixed positioning (`pointer-events-none`).
2. **View Portals (`@react-three/drei` `View`):** Individual pages (such as `/login` HeroForge or `/dashboard` StatTotems) declare virtual HTML DOM containers. Drei's `View` scissors the single WebGL canvas into the bounding rect of that DOM element.
3. **Local Kinetic Typography (`troika-three-text`):** 3D typography is rendered via signed distance fields (SDF) generated at runtime from local TTF/WOFF fonts bundled in `public/fonts` (no external Google Fonts network dependencies).
4. **Hardware-Tiered Rendering (`detect-gpu`):** Automatically throttles Device Pixel Ratio (DPR), disables post-processing passes, and caps particle counts on mobile devices or low-power integrated GPUs.

---

## 2. 5 Likely Interview Questions & Answers

### Q1: Why use a single persistent Canvas instead of placing a `<Canvas>` on each page?
**Answer:** Browsers enforce a strict limit on simultaneous WebGL contexts (often as few as 8 to 16 on mobile Safari/Chrome). Creating multiple `<Canvas>` elements causes WebGL context loss errors, massive VRAM leaks, and hitching during page transitions. A persistent single canvas stays in GPU memory continuously; page components simply render into their designated `View` portals with zero context re-initialization cost.

### Q2: How does `troika-three-text` achieve sharp text rendering in 3D WebGL?
**Answer:** Traditional 3D text either generates heavy polygonal geometry (millions of vertices) or renders pixelated bitmap textures. `troika-three-text` parses raw TrueType font vectors into **Signed Distance Fields (SDF)**. SDF textures allow shaders to compute razor-sharp vector glyph contours at any camera zoom level and oblique angle with minimal memory and draw calls.

### Q3: Why are font files stored locally in `public/fonts` instead of fetched from Google Fonts CDN?
**Answer:** External font CDN requests introduce render-blocking network latency, layout shifts (FOUT), and privacy leaks. In offline development environments or enterprise firewalls, external CDNs fail completely. Bundling local `.ttf` font files inside `public/fonts` guarantees zero network roundtrips, deterministic caching, and instant availability during WebGL scene hydration.

### Q4: How do you prevent WebGL from draining mobile battery or lagging?
**Answer:** We enforce a four-tiered optimization strategy:
1. **GPU Detection:** `detect-gpu` detects mobile or low-end GPUs and caps DPR to `1.0` (avoiding high-DPI retina overhead).
2. **PerformanceMonitor:** Drei's `PerformanceMonitor` automatically steps down visual tiers if FPS drops below 40.
3. **Tab Visibility:** The render loop pauses when the document is hidden (`document.hidden`).
4. **Accessible Fallbacks:** If WebGL fails to initialize or the user toggles "Reduced FX", the 3D canvas is disabled and crisp CSS fallbacks render seamlessly.

### Q5: How do you maintain accessibility (a11y) and screen reader support when text is rendered in WebGL?
**Answer:** WebGL canvas pixels cannot be read by screen readers or inspected by accessibility tools. Forgeline ensures full accessibility by pairing every 3D text element with an invisible, screen-reader-accessible HTML DOM element (`<span className="sr-only">`). Sighted users see the kinetic 3D typography, while assistive technology reads standard semantic markup.
