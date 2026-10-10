---
name: git-workflow
description: Standard git branching, conventional commits, and PR merging workflow for Forgeline.
---

# Git Workflow Skill

## Branching Conventions
- Features: `feat/<slug>`
- Phases: `phase/<n>-<slug>`
- Fixes: `fix/<slug>`
- Never commit broken state to `main`. `main` must always be runnable.

## Commit Message Standard
Follow Conventional Commits:
- `feat(scope): add feature`
- `fix(scope): fix bug`
- `test(scope): add tests`
- `docs(scope): update documentation`
- `chore(scope): configuration / tooling updates`

## Merge and Tag Ritual
1. Verify all tests, lint, and typecheck pass locally.
2. Squash-merge branch into `main` with detailed explanation of what, why, and how tested.
3. Update `docs/PROGRESS.md` with status and commit hash.
4. Tag release milestones: `v0.1-backend-core`, `v0.2-realtime`, `v0.3-ui-alpha`, `v1.0-submission`.
5. Push `main` and tags to remote.
