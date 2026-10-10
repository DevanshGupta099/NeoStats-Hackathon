# FAST-TRACK OVERRIDE
Hard deadline: ~100 minutes total build time.
Phases 0–1 DONE.
AI Provider: Mistral (`Mistral_API_KEY` or `MISTRAL_API_KEY`, plain fetch, model `mistral-small-latest`).
Backend owns `apps/api` + `packages/shared`.
Frontend owns `apps/web`.
Core requirements: Server-side authorization matrix with tests, 409 optimistic concurrency with UI conflict flow, real-time sync, transactional activity log, notifications, seed with all 4 roles.
Tag milestones: v0.1 (Block A), v0.2 (Block B), v0.3 (Block D/E), v1.0 (Block F).
