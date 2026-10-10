---
name: ai-mistral-integration
description: Free-tier Mistral LLM integration, rate limiting, task drafting, standup summaries, and fallback handling.
---

# AI Mistral Integration Skill

## Core Principles
1. **Implemented in Phase 8 / Block F ONLY:** The platform works 100% with AI disabled.
2. **Server-Side Calling Only:** API key (`Mistral_API_KEY` or `MISTRAL_API_KEY`) stays on the backend. Never expose to client. Model: `mistral-small-latest`. Direct `fetch` to `https://api.mistral.ai/v1/chat/completions`.
3. **Data Scoping:** Strip sensitive user data or tasks the user cannot access.

## Features
- **Project Standup Digest:** Summarize recent activity into a concise standup brief.
- **Smart Task Draft:** Convert rough notes into structured task payloads.
