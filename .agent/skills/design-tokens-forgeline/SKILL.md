---
name: design-tokens-forgeline
description: Forgeline color palette, CSS variables, shader token bridge, and brutalist HUD design tokens.
---

# Design Tokens Forgeline Skill

## Color Bible
| Token Name | Hex Code | Purpose |
|---|---|---|
| `--color-void` | `#060709` | Deep canvas / page background |
| `--color-basalt` | `#0E1013` | Primary surface background |
| `--color-graphite` | `#171A1F` | Raised cards, panels, popovers |
| `--color-steel` | `#2A2F37` | Borders, dividers, subtle outlines |
| `--color-bone` | `#ECE8DF` | Primary high-contrast text |
| `--color-ash` | `#9AA0A8` | Secondary labels, metadata, viewer role |
| `--color-plasma` | `#B8FF2C` | Primary energetic accent, Project Manager role |
| `--color-ember` | `#FF5A1F` | Forge heat, Admin role, destructive actions |
| `--color-ice` | `#5CE1E6` | Realtime sync indicators, Team Member role |
| `--color-amber` | `#FFB020` | In-review status, warnings |
| `--color-crimson` | `#FF2E4D` | Version conflict, errors, critical alerts |

## Rules
- NEVER hardcode hex values inside components. Always reference CSS variables or Tailwind token classes (`text-bone`, `bg-basalt`, `border-steel`).
- Share color definitions with Three.js shaders via a centralized `tokens.ts` exporting Three.js `Color` instances.
- Ensure all DOM text passes WCAG AA contrast against its respective background.
