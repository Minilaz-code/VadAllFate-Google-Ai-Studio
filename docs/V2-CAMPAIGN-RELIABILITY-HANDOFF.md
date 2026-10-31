# V2 campaign reliability handoff - 2026-10-31

**Long-campaign acceptance: BLOCKED pending an approved application Save-format migration.** This branch delivers tested safe improvements and a concrete migration proposal; it does not claim that the current monolithic Save can grow indefinitely.

Both repositories use `codex/v2-campaign-reliability`, based on the published event-adventure branches. No merge into main or Save conversion was performed.

| Repository | Tested implementation commit | Base |
| --- | --- | --- |
| Minilaz-code/VadAllFate | `04ef3be3884e02bb0252db35aa5c1c0f1540b29a` | `7496eccbbb8e4f47640b9529be040e3fd4dfe474` |
| Minilaz-code/VadAllFate-Google-Ai-Studio | `1b6e02db7d35b9f65253315e988ae31782e5cec4` | `5825fe477142f08499dcfd8ed6a936f32e18d13c` |

Branch tips include this documentation after the tested code commits. Verify publication tips with `git rev-parse HEAD` and `git ls-remote origin refs/heads/codex/v2-campaign-reliability`.

## Requirement disposition

| Requirement | Result | Evidence |
| --- | --- | --- |
| Measure actual limitation | PASS | Exact codec boundary, original growing NPC/quest/memory datasets, repeated commits, Save sizes, commit latency and gateway reopen measurements. |
| Safe capacity improvements | PASS, bounded | Equivalent compact UTF-8 JSON; preserved codec preflight; no truncation to hide size pressure; explicit capacity and incomplete-scheduler notices. No limit increase, codec bypass, new authority database or frozen schema change. |
| Targeted application storage | BLOCKED | Requires the reviewed [Save storage migration proposal](V2-CAMPAIGN-STORAGE-MIGRATION-PROPOSAL.md). Existing scalar proof feasibility is not a deployed application format. |
| Large application can continue beyond 64 KiB requests | FAIL in legacy format | A normal request with 11 added fixture NPCs exceeds the limit. Repeated configuration commits eventually fail. No claim that the main acceptance target is met. |
| Safe rejection/recovery/branches | PASS | Rejection preserves state/hash and leaves zero pending admissions; old staged bytes recover unchanged; cross-campaign IDs no longer collide; real restart and independent timeline checks pass. |
| Retained history and boundaries | PASS for new commits | Removed canonical memory/interaction/story trimming. Bounded views/pages are separate from retention. Character-owned dialogue enforced in content, recent adventure, ledger history and standard player projections. Incorrect beliefs are not labelled objectively false to players. Earlier legacy trimming cannot be silently restored. |
| Play experience | PASS | Primary quest journal, earlier-story reading, location/time/present NPCs, structured generic DM quest chains and multiple activity intervals, host capacity display. |
| Protected work | PASS | R1 CommitAuthority, staged codec, contracts, store, frozen schemas, CP149/CP150, production Saves and original Antigravity checkouts unchanged. Source-combat/private-secret reasoning holds retained. |

## Actual measured limits

[Full redistributable numerical evidence](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-campaign-reliability/docs/evidence/V2-CAMPAIGN-CAPACITY.json) contains no source text, credentials, model responses or local paths. Fixtures and UTC event timestamps are deterministic; timings are observations on this Windows environment, not performance guarantees.

| Added original NPCs | Logical document bytes | Actual staged request bytes | Result |
| --- | ---: | ---: | --- |
| 0 | 14,529 | 18,556 | COMMITTED |
| 5 | 34,364 | 40,746 | COMMITTED |
| 10 | 54,199 | 62,936 | COMMITTED |
| 11 | 58,176 | 67,384 | Rejected before admission |
| 20 | 93,969 | 107,416 | Rejected before admission |
| 100 | 412,129 | 463,256 | Rejected before admission |

Each added NPC has four original memories, a provenance-labelled belief, relationship state, a two-objective quest and an activity schedule. Counts are fixture-specific, not a universal NPC cap. The document is reserialized as a scalar StatePatch and escaped inside the CommitRequest; action, snapshots, validation and event metadata add further bytes. Recovery results and applied patches retain additional copies on disk.

The exact codec accepts **65,536 bytes** and rejects **65,537 bytes**. Repeated real CONFIGURE_CAMPAIGN actions committed **109** times without trimming any newly added story event. Action **110** was rejected at **65,543 bytes**; the largest successful request was **65,110 bytes**. The rejected action preserved the canonical hash and left no pending admission. A near-capacity checkpoint passed integrity checks and gateway reopen recovered the same snapshot. These are administrative action stress measurements, not 109 AI adventure turns. Mean successful sequential commit time was 487.832 ms in this run.

Per-level commit and reopen latencies and cumulative SQLite file sizes are in the evidence JSON. Gateway reopen timings measure in-process gateway recreation; full Windows launcher/browser restart checks below are separate. The benchmark runtime contains multiple independent fixture campaigns, so its Save-size column is cumulative. UTF-8 JSON reduced the selected multilingual fixture from **26,560 to 19,560 bytes** without changing its parsed data. ASCII-heavy Saves do not receive that gain.

A separate explicitly synthetic R1 scalar proof started with **1,294,954 canonical bytes** and 2,000 original memory records. It performed 20 ordinary staged updates plus one recovered staged update, with requests at most **1,700 bytes**. Exact duplicate replay, reopening, hashes and an independent copied timeline passed. Mean ordinary commit time was 134.99 ms. This proves existing scalar authority feasibility only: it is not an application adapter, approved migration, production state-module registration or large-gameplay PASS. Full-state reconstruction, hashing and current SQLite-row writes remain O(N).

## Safe changes delivered

- Normal, plan-confirmation and homebrew state patches use equivalent compact UTF-8 JSON. Existing Saves still parse normally; a stored old ASCII-escaped staged request is replayed byte-for-byte instead of being rewritten.
- Canonical NPC memories, source interactions and story events no longer discard records at the old 50/50/100 windows. Existing views remain bounded and earlier story is read from the existing R1 event ledger. Retention can expose the size ceiling earlier; data is not deleted to postpone failure.
- Oversized requests still fail before admission under the unchanged codec. HTTP clients receive a safe actionable capacity error; host-only diagnostics show a representative size estimate, not a reservation or guarantee for another action.
- A committed player action with later scheduler failure reports incomplete scheduled updates. Some separate scheduler commits may already have succeeded; no rollback or complete-success claim is fabricated.
- New commit-request IDs include unambiguous campaign namespacing, avoiding globally unique causal-ledger collisions when two campaigns use the same client action ID. Existing staged IDs remain intact.
- Read-only history/checkpoint SQLite handles close explicitly. Capacity footprint includes the current database/WAL observation without exposing paths.
- Dialogue ownership comes from durable applied admissions and the actual referenced interaction, including legacy replies. A spoofed extra characterId on an AI request cannot redirect disclosure. DM history remains privileged; unknown legacy audience fails closed. Public non-dialogue narration remains shared. Explicit party broadcast of a private conversation is not added.
- Players receive a neutral belief/report label rather than learning that an NPC's belief is objectively incorrect. Source provenance and original epistemic classifications remain in the Save and DM inspection.

## Verification

Environment: Windows Python 3.14.7, Node 24.22.1, installed Microsoft Edge, actual local Ollama qwen3.5:4b. No cloud model or model download. Provider failures remain failures, never synthetic AI success.

- Broad Python: **566 passed, 2 skipped in 765.47s**. This broad run preceded final projection hardening; subsequent targeted checks cover it.
- API/content/living-world/auth/Harness/recovery regression: **73 passed in 236.20s**.
- Final projection/content/auth/reliability regression after the standard player-projection change: **45 passed in 150.92s**.
- Focused reliability suite: **10 passed in 35.90s**, including exact size boundary, safe queue failure, legacy staged replay, retention, ownership and branching.
- Frontend: **152 passed**; TypeScript and production build PASS. An unreachable role comparison caught by TypeScript was corrected. Existing bundle-size warning remains.
- Original-world Edge journey: **1 passed in 42.8s**, with two actual local Qwen replies, travel, quest progression, history reading, capacity display, generic quest creation/event completion and two-interval DM schedule creation.
- Full original primary restart and authored quest/schedule recovery: **1 passed in 5.1s**; final restored-primary verification after projection hardening: **1 passed in 8.1s**.
- Missed-appointment child outcome: **1 passed in 5.0s**; child full restart: **1 passed in 5.1s**. Primary canonical revisions/hashes remained unchanged.
- Existing private Waterdeep journey: **1 passed in 42.5s**, with actual Qwen replies and existing starter content. Private sources, Saves, screenshots and model proof responses remain local/ignored.

The restart test caught an initial recent-event/action-ID mapping error in the new filter; it was corrected using canonical ledger event IDs and positive/negative ownership regression coverage before publication. A Windows benchmark cleanup handle leak was also fixed; the final disposable benchmark exits successfully. No production data was involved in those repairs.

## Reproduction

Backend:

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts=''
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_campaign_reliability.py tests/test_event_adventure.py tests/test_game_content_api.py tests/test_living_world_content.py tests/test_v2_auth_security.py tests/test_v2_ai_harness.py tests/test_v2_commit_recovery.py
.venv/Scripts/python.exe scripts/measure_campaign_capacity.py --output '<local numerical report.json>'
```

The measurement command creates only new disposable original-content Saves. It does not accept or modify a production Save. It uses the existing read-only SRD input. The synthetic scalar feasibility case is separately labelled and is never enabled in the application.

Frontend:

```powershell
npm ci
npm test
npm run lint
npm run build
```

For original-content Edge acceptance, use the backend helper with a fresh destination:

```powershell
.venv/Scripts/python.exe scripts/build_original_reliability_fixture.py --destination '<new original-addon directory>' --library '<local installed pack library>'
```

This builds an immutable CC0 observer/location addon through existing authoring/installation contracts. Launch using the [event-adventure handoff](V2-EVENT-ADVENTURE-HANDOFF.md) and a dedicated new runtime. Set VADALLFATE_E2E_HOST_RECORD to the launcher record and VADALLFATE_E2E_OUTPUT to a separate disposable browser-artifacts subdirectory, never the Save directory. Optional state/checkpoint/screenshot output files stay local. Run `node node_modules/@playwright/test/cli.js test campaign-reliability.spec.ts`; its resume/branch/branch-resume phases verify the separately opened runtime. Do not use -SkipOllama for real-model acceptance.

## APIs and integration

New host-DM-only `GET /api/v2/campaigns/capacity` uses the authenticated campaign, refuses preview management and returns a read-only representative estimate. New `GET /api/v2/content/history?limit=30&before_revision=...` uses the existing signed session and campaign binding. Page limit is 1-50; cursor is a positive canonical revision. Filtering may yield a short page with another cursor. No SQL or filesystem-path endpoint is exposed.

The new DM authoring form invokes the existing event-quest/world-event/activities R1 commands. No new authority store is introduced. Activity intervals replace the selected NPC's approved routine explicitly and never infer physical grid movement. Generic prior-objective/time/visit/information/event conditions remain deterministic. Knowledge and source-combat holds remain as before.

Antigravity: fetch both repositories and integrate the corresponding branch into your own active V2 review/integration branches:

```powershell
git fetch origin
git switch <your-active-v2-integration-branch>
git merge --no-ff origin/codex/v2-campaign-reliability
```

Do not merge into main, overwrite another checkout or convert existing Saves. No migration command is enabled in this delivery. Keep both repositories paired and retain existing source pins, authentication, single-model scheduling and R1 validation in conflict resolution.

## Approval needed and next work

Approve or revise the [exact migration proposal](V2-CAMPAIGN-STORAGE-MIGRATION-PROPOSAL.md) before implementing the versioned application storage adapter and explicit branch-only conversion. The proposal specifies bounded stable pages, full logical validation before staging and during recovery, resumable migration, legacy compatibility, fail-closed older readers, rollback and large-world acceptance gates. Broader normative R1 schemas do not authorise an unregistered production binding; CP149 and typed state-module registration are not advanced here.

Until then, the main long-campaign target remains BLOCKED. A Save can be backed up/reopened but ordinary actions can become impossible once its document no longer fits. Existing already-blocked admissions are not silently deleted or repaired. Application knowledge/quest count limits remain explicit; there is no complete NPC cognition, repeating calendar, portable single-campaign export/import or production security certification claim. Legacy audience lookup may scan that campaign's ledger; the approved storage design must use indexed native event identities. Earlier trimmed legacy windows are not magically restored.

Production Saves, restricted content, protected branches and original Antigravity checkouts remain untouched. All new publication files are original code, CC0 fixtures, numerical evidence or documentation; no personal machine paths, credentials, commercial adventure prose, generated private packs, restricted artwork or raw proof responses are committed.
