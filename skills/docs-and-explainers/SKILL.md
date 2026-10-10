---
name: docs-and-explainers
description: Documentation standards, viva prep guides in docs/EXPLAINED/, and Mermaid diagramming.
---

# Docs & Explainers Skill

## Documentation Catalog
All markdown documents live under `/docs/`:
- `ARCHITECTURE.md`: High-level system topology, data flow, real-time approach.
- `DATA_MODEL.md`: Entity relationships with Mermaid ER diagrams.
- `AUTHORIZATION.md`: Permission matrix, role inheritance, and enforcement guards.
- `CONCURRENCY.md`: Versioning mechanics, atomic SQL queries, and conflict handling.
- `REALTIME.md`: Socket.IO architecture, room topology, event definitions.
- `AI_USAGE.md`: Honest breakdown of human architecture decisions vs AI-assisted code.

## Viva & Interview Study Guides (`docs/EXPLAINED/`)
Create a dedicated guide for each backend module and frontend system:
- `docs/EXPLAINED/auth.md`
- `docs/EXPLAINED/policy-service.md`
- `docs/EXPLAINED/optimistic-concurrency.md`
- `docs/EXPLAINED/realtime-socket.md`
- `docs/EXPLAINED/webgl-engine.md`
Each file must include:
1. High-level purpose in plain English.
2. Step-by-step execution flow.
3. Why this design was chosen over alternatives.
4. Top 5 interview questions a judge will ask and exact answers.
