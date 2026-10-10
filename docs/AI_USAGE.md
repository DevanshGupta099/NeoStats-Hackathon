# AI Usage & Attribution Log
Last updated: 2026-10-10

This document transparently logs AI involvement in the design and implementation of Forgeline, distinguishing human architectural decisions from AI-assisted code generation.

---

## 1. Governance & Policy
In accordance with the NeoStats Hackathon evaluation criteria, every architecture decision, data model choice, authorization rule, and concurrency design was deliberately chosen and specified by the owner (Devansh Gupta). The AI assistant (Gemini running in Antigravity) acts as a high-velocity pair programmer and execution agent.

## 2. Decision Log

| Area | Human Decision / Specification | AI Execution / Code Generation |
|---|---|---|
| **System Architecture** | pnpm monorepo, NestJS separate from Next.js, PostgreSQL 16 via Docker, Socket.IO over raw WS | Monorepo scaffolding, configuration files, package.json wiring |
| **Data Model & Concurrency** | Version integer on tasks and projects; atomic SQL predicates; 409 conflict envelope shape | Prisma schema definition, SQL migration scripts, conflict handler pipe |
| **Authorization Model** | Dual-tier role model (Global & Project); Rule of Cap; server-side PolicyService | PolicyService implementation, test matrix generation, NestJS guard creation |
| **Real-Time Model** | Socket.IO room scoping (`user:{id}`, `project:{id}`), post-commit domain event bus | Gateway implementation, event typings, client-side cache patch listeners |
| **Visual Direction** | "Operations Forge" brutalist HUD aesthetic, WebGL persistent canvas, design token palette | Three.js shader code, troika font preloading, Tailwind token mapping |

## 3. Interview Readiness
The owner has complete familiarity with all architectural patterns, database schemas, and guard logic in this codebase. Comprehensive module explanations are detailed in `docs/EXPLAINED/*.md` for in-depth review.
