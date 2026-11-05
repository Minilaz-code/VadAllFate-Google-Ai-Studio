# V2-INTEGRATE-01 CP2 — normal application consumer

Baseline `123738972ee9af5f518cc8e7be8f0b9529f416f9`; branch `codex/v2-integrate-01-ui`. Shared producer CP1 `ec037da6a36cee9cd9238fa4efd17dc5e0df75f5`. No Antigravity checkout edits.

Implemented read-only backend-profile discovery before normal root auth; existing Save/session header and fail-closed transport retained. Campaign Save selector clears credentials; no query required. Existing CombatTracker adds PC inclusion choice (old two-PC default retained) and durable native receipt view; actor/dice/HP remain backend owned. Existing PW regression Save selector label updated, encounter scenarios retained. No source activation or legacy conversion.

Verification: frontend 160 tests passed, TypeScript no errors, Vite build succeeds (existing large chunk warning). No connected PASS yet. NEXT: real normal Windows launcher + headed Edge, full restart, regressions/evidence, paired draft PRs; STOP for independent integration review. No merge/deploy or production Save edits.
