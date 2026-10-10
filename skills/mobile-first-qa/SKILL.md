---
name: mobile-first-qa
description: Mobile-first styling rules, viewport testing matrix, touch targets, and responsive validation.
---

# Mobile-First QA Skill

## Viewport Testing Matrix
Always write CSS mobile-first (base styles at 360px, then `sm:`, `md:`, `lg:`, `xl:` breakpoints). Test across all 5 widths:
1. **360px:** Small Android viewport (baseline).
2. **390px:** Standard iPhone viewport.
3. **768px:** Tablet viewport (iPad portrait).
4. **1280px:** Small laptop / desktop.
5. **1920px:** Full HD desktop monitor.

## Touch & Usability Checkpoints
- Minimum touch target: 44px × 44px for all interactive buttons and chips.
- Navigation: Bottom sheet drawers (`vaul`) and thumb-zone bottom navigation bar on mobile; expandable rail on desktop.
- Drag-and-drop (`dnd-kit`): Touch-friendly sensor with delay/activation distance to prevent accidental scrolls.
- Haptics: Trigger subtle `navigator.vibrate([15])` on lane drops, status updates, and conflict notices where supported.
