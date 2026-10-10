---
name: ai-groq-integration
description: Free-tier Groq LLM integration, rate limiting, task drafting, standup summaries, and fallback handling.
---

# AI Groq Integration Skill

## Core Principles
1. **Implemented in Phase 8 ONLY:** The entire platform must function 100% reliably with `AI_ENABLED=false`. AI is an enhancement, not a core dependency.
2. **Server-Side Calling Only:** API keys (`GROQ_API_KEY`) stay on the backend. Never expose to client.
3. **Data Scoping:** Strip all sensitive user data or tasks the requesting user does not have permission to view before sending prompts to the LLM.

## Features
- **Project Standup Digest:** Summarize recent activity and lane velocity into a concise 3-bullet standup brief.
- **Smart Task Draft:** Convert unstructured meeting notes or brainstorm text into a structured task payload (title, description, priority, suggested assignee).

## Resilience & Fallbacks
- Set hard timeouts (8s) on LLM requests.
- Catch HTTP 429 quota errors gracefully and return user-friendly fallback notifications.
- Support Google AI Studio (Gemini free tier key) as an automatic secondary fallback if Groq is unavailable.
