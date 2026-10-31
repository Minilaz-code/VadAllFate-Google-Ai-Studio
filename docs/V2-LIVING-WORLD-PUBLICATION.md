# Living world publication — 2026-10-31

Both branches: `codex/v2-living-world`.

| Repository | Tested implementation commit |
| --- | --- |
| Backend | `bdaeedbee74e181e11b818bb2e57f0e0dab5906a` |
| Frontend | `abe672f81ab912399d717d2714564445919a4e22` |

[Backend implementation](https://github.com/Minilaz-code/VadAllFate/commit/bdaeedbee74e181e11b818bb2e57f0e0dab5906a) · [Frontend implementation](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/commit/abe672f81ab912399d717d2714564445919a4e22) · [Two-repository handoff](V2-LIVING-WORLD-HANDOFF.md)

The final branch tips include this subsequent documentation-only publication record. Bases were backend `930a11584e33b6089452f44b40fe267b42c90740` and frontend `b87fad67780625055bd77073b9baad554ed826a8`.

PASS: source-pinned per-NPC knowledge admission and provenance; witnessed rumours versus DM-established facts, suspicions/incorrect beliefs/secrets; private/party/character disclosure; two-NPC real Qwen knowledge boundary; evidence-approved relationships and report quests; configured source grid and actual VTT token; whole-process persistence and independent timeline outcomes; unrelated original creator world with source admission, model reply, quest completion and an R1 scheduler move.

Validation: full backend 550 passed/2 skipped before final refinements; final API/Harness/auth 47 passed; final source/spatial regressions 30 passed; cognition/personality regressions 14 passed. Frontend 152 passed, TypeScript/build PASS. Real Windows/Edge Waterdeep journey passed without HTTP 429; original-world journey passed; final both-world process-restart checks 2 passed. Child Save divergence and its full restart passed; primary revision/hash rows remained unchanged by child play. No security/request-limit or source-combat hold was removed. Detailed timings, scopes and limitations are in the handoff.

Privacy/content audit: complete changed file blobs, file paths, test fixtures, staged files and new commit messages were reviewed. No personal absolute paths, credentials, private packs, restricted adventure prose/artwork, generated Saves, model responses or browser proofs are published. Public fixture content is original CC0. Existing inherited upstream history is not rewritten or certified by this review. Both original Antigravity checkouts remained clean at their original SHAs. No main merge, force push, CP149/CP150 work, frozen R1/schema modification or production Save change.

Antigravity integration (in each repository, after reviewing the paired diff and verifying the intended V2 branch):

```powershell
git fetch origin
git switch <active-v2-integration-branch>
git merge --no-ff origin/codex/v2-living-world
```

Do not run that merge in main or use an unreviewed automated merge. These branches include the prior published foundations. Use the private library and a dedicated runtime from the handoff, rerun its checks, and keep restricted data local. Source NPCs remain noncombat; source illustrations are not verified tactical floorplans. Portable single-campaign export/import, richer knowledge revisions and general calendar/quest authoring remain unfinished.
