---
name: webgl-typography
description: Kinetic 3D typography, Troika-three-text, local font preloading, and accessible DOM fallbacks.
---

# WebGL Typography Skill

## Font Requirements
- Troika-three-text requires TTF, OTF, or WOFF format (WOFF2 is NOT supported by Troika).
- Host font files locally in `public/fonts/`.
- Preload glyph sets during app initialization using `preloadFont()` to eliminate FOIT/layout shift.

## Typographic Stack
- **Display Headlines:** Big Shoulders Display (Black/ExtraBold) rendered via WebGL SDF shaders.
- **HUD / Numerals:** Chakra Petch & Oxanium.
- **Mono Data & IDs:** JetBrains Mono for task keys (`FRG-102`), timestamps, versions.
- **Body & Reading:** Barlow Semi Condensed or Chakra Petch light on the standard DOM layer.

## Accessibility & SEO Mandate
- Any text rendered into WebGL must be mirrored in the DOM for screen readers and search engines:
```tsx
<div className="sr-only" aria-label={text}>{text}</div>
```
- Wrap WebGL text in a custom `<ForgeText>` component that handles shader displacement, letter-staggering, and hidden DOM accessibility anchors.
