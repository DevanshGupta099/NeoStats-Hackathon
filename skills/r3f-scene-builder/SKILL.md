---
name: r3f-scene-builder
description: Three.js and React Three Fiber architecture, single canvas model, View portals, and scene management.
---

# R3F Scene Builder Skill

## Single Persistent Canvas Rule
- Never instantiate multiple `<Canvas>` elements. Multiple WebGL contexts exhaust GPU memory, cause mobile crashes, and prevent smooth route transitions.
- Maintain ONE persistent `<Canvas>` fixed in the root layout behind DOM content.
- Use `@react-three/drei`'s `<View>` components to project 3D viewports directly into designated DOM bounding boxes (cards, stat totems, hero wordmarks).

## Lazy Scene Loading
- All heavy 3D scenes (`HeroForge`, `HeatField`, `StatTotems`, `TimelineTunnel`) must be dynamically imported via `next/dynamic` or `React.lazy` with `ssr: false`.
- Provide immediate DOM/CSS fallback representations during load so First Contentful Paint is instantaneous.

## Scene Cleanup
- Always dispose of geometries, materials, and textures when scenes unmount to prevent GPU memory leaks.
- Pause rendering loop when document is not visible (`document.hidden`).
