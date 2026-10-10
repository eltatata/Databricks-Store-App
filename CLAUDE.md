# CLAUDE.md

`IMPLEMENTATION_PLAN.md` is the contract for this project. Read the sections relevant to the current phase before acting. Locked decisions are in §0 (D1–D17). Do not reopen them without the user's approval, and record any new decision there.

## Status
- Current block: **F — Phases 8–9**, done:
  - Agent deployed and verified with real approvals.
  - E2E acceptance 9/9.
  - Runbooks (`docs/DEPLOYMENT.md`, `docs/TROUBLESHOOTING.md`) and `docs/FINAL_REPORT.md` written.
  - Pending, needs user approval: one redeploy to ship the agent routing fix for inactive products (commit `0247911`), then verify it on the deployed app with a test product.
  - Profile: `local-dev` (confirmed by the user).
- Execution blocks: A = Phase 0 · B = 1–3 · C = 4–5 · D = 6 · E = 7 · F = 8–9.
- Stop at the end of each block and report against the exit gates (§10) and the final report (§11). Wait for the user before starting the next block.
- Update this Status section when a block starts or ends.

## Working rules
- Reply to the user in Spanish. Code, docs and commits are in English.
- Databricks CLI: never auto-select a profile; the user must confirm it (`local-dev` is the only known one). Pass `--profile` on every command.
- Load the matching `.claude/skills/databricks-*` skill before working on a phase. Verify commands with `-h` and the current docs, never from memory.
- The session may run with permissions bypassed. The approval gates in §2.2 are still mandatory: ask before deploys, destructive actions, and creating resources with unclear cost.
- Never report something as done unless it was verified (§2.4).
- A finding that contradicts the plan, or a Free Edition limit that is hit, stops the work. Record it in `docs/ENVIRONMENT_AUDIT.md` and propose a change to the plan instead of working around it silently.
- Commit each coherent step with Conventional Commits.
