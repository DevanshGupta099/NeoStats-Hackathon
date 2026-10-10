---
name: session-report
description: Token-saving session reporting format for seamless relaying to companion assistants.
---

# Session Report Skill

## Format Rules
- End EVERY completed prompt with the exact header `### SESSION REPORT`.
- Strict length limit: MAXIMUM 25 LINES.
- Do NOT output long code dumps or repeat the master plan.
- Update `docs/PROGRESS.md` alongside the report.

## Required Skeleton
```markdown
### SESSION REPORT
Phase/task: <phase number / title>
Branch / last commit / PR: <git branch and commit>
Done: <concise summary of completed work>
Tests (pass/fail counts): <counts>
Running now (ports/URLs): <active processes>
Deviations from plan (and why): <any adjustments>
Open issues / blockers: <blockers>
Needs from owner (keys, decisions): <pending human input>
Recommended next prompt: <exact suggestion for next command>
```
