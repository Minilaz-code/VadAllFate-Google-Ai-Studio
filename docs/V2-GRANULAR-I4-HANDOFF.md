# I4 isolated hashing, revision and Save snapshot handoff

2026-11-01. **I4 PREPARED fixture-only PASS scope. No granular gameplay activation.** Option C remains direct granular typed persistence and native legacy compatibility, with no compulsory paged JSON format.

## Review branches

Both use `codex/v2-granular-i4`. Approved ancestry is backend `875f4d65f361ddd863457e5a74b60ff2a88cbc6a` and frontend `a6f65e604ca259942f9a5fed617504660b2aad4a`. Final verified remote heads are in the delivery response; verify with `git ls-remote origin refs/heads/codex/v2-granular-i4` in each repository.

- Backend: https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i4
- Frontend: https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i4
- Exact implemented specification: [V2-GRANULAR-I4-HASH-SPEC.md](V2-GRANULAR-I4-HASH-SPEC.md)

Backend implementation commit: `bc831350ea99030541a0c072c450d0645452665f`; exact depth-budget correction: `3f46aecc5dca1c352ead20076e5f7b3083cbd815`.

## Actual implementation

`runtime/granular/hash_profile.py` provides the versioned closed record profile, independently framed SHA256/JCS hashes, persistent deterministic authenticated Cartesian tree, separate sorted-stack rebuild/audit, dependency/content root, evidence chain and standalone Save-bound snapshot/advance/current-snapshot checks. No SQL, lifecycle methods, live imports, registration or writer capability.

`tests/granular_i4_fixture.py` and `tests/test_granular_i4.py` supply original CC0 fixtures, full-field read-only I2-row coverage, negative/differential tests and new-file-only SQLite WAL transactions. `tests/fixtures/granular-i4/` contains rights, exact preimages and versioned golden vectors. `tools/granular_hash_benchmark.py` runs only generated original worlds and temporary SQLite files; it accepts no Save path. Numerical benchmark artifacts are in `docs/evidence/V2-GRANULAR-I4-100-MEASUREMENTS.json` and `V2-GRANULAR-I4-1000-MEASUREMENTS.json` (backend).

Golden empty entity root: `8bd718ee6f3a344c61b72707ef7c5306a4389227f817de2b7736a839f68ab35a`.

Golden two-entity root: `80f6923ed5652f226798e0ca4d0ad986b0bc15741ac30c860b8e13938869cd79`.

Golden Save-bound snapshot: `11f0e0ab70b0b480051fd34d8ebe8efadca276208c7a3b83b2c1c2d79a4edcf2`.

Normal updates hash affected records and root paths, not the whole campaign. Copying a world to another logical Save preserves content/evidence roots and intentionally changes snapshot identity. Node caches are derived, never a second authoritative world store. Logical deletion retains state as an evidenced tombstone; physical deletion/purge and resurrection are explicitly rejected under v1.

## Measured original-world fixtures

Both cases use the existing original-readiness-fixtures.1 generator, retaining 10,000 event entries, 1,000 quest/objective pairs, beliefs, routines and relationships. The larger case has 20,000 memories. Fixture event entries are inert original data, not copied runtime_events. Each measured compound update adjusts one relationship and appends one memory. Independent full rebuild AND actual SQLite close/reopen audit returned the same root in both cases.

| Actual measurement | 100 NPC /10,000 memories | 1,000 NPC /20,000 memories |
| --- | ---: | ---: |
| Original records before update | 22,402 | 36,002 |
| Generator wall /CPU seconds | 30.751 /30.703 | 48.654 /48.531 |
| Full initial rebuild wall /CPU seconds | 52.612 /52.359 | 91.032 /90.609 |
| Incremental compound wall /CPU seconds | 0.0703 /0.0625 | 0.0631 /0.0781 |
| Records hashed | 2 | 2 |
| Nodes rehashed /checked | 49 /90 | 45 /82 |
| Distinct cache rows changed | 45 | 41 |
| Independent full rebuild wall /CPU seconds | 49.722 /49.656 | 89.398 /89.047 |
| Python peak traced bytes | 69,096,161 | 108,889,445 |
| Windows process peak working-set bytes | 172,490,752 | 246,226,944 |
| Fixture SQL initial persist wall /CPU seconds | 9.963 /9.063 | 21.120 /16.563 |
| Fixture SQL incremental persist wall seconds | 0.0133 | 0.0172 |
| Fixture SQL changed rows (records+cache+head) | 48 | 44 |
| SQLite page bytes /main after close | 38,662,144 | 62,976,000 |
| WAL bytes before close/checkpoint | 38,938,152 | 63,394,472 |
| Reopen/full audit wall /CPU seconds | 26.272 /26.125 | 46.047 /45.703 |

Measurements were taken before the final empty-child depth-guard correction; that correction does not change these shallow-tree hashes/topology/affected-row counts. Timing is an observed preparation baseline, not a final production benchmark. Timing context: Windows Python on the development machine, tracemalloc enabled for generation/hash phases, existing services and some regression work present. Measurements are observations, not a gameplay latency SLA or controlled machine comparison. Python peak covers generation, two full trees and an incremental tree; process peak is cumulative for that process and includes allocator overhead. Short Windows process CPU intervals are coarse: a recorded 0.0 seconds on the 13-17ms SQL increment does not mean zero CPU. SQL/reopen timings are outside tracemalloc. WAL totals include fixture setup/initial persistence, not solely the tiny incremental update; physical per-action WAL-frame amplification was not isolated. JSON-per-entity/node fixture tables are not the proposed normalized production schema. No real R1 commit, recovery-through-live-authority, full application startup, LLM memory budget or UI performance is claimed.

These results establish bounded affected-record/path work for normal changes and expose substantial full rebuild/audit cost. Full verification is not constant-time. I5 must review startup/checkpoint integrity policy and worst-case budgets before activation. Treap balance is expected under SHA priorities, not a worst-case guarantee; paths beyond 256 reject safely.

## Verification

- PASS: final targeted I4/I3/I2/preparation/R1/recovery/JCS suite **248 passed in 73.69s**, including **44 I4 cases**. The earlier isolated I4 run passed 43 in 9.57s. The final added case fixes and proves the exact depth-256/257 boundary.
- PASS: broad backend regression run **752 passed, 2 skipped in 813.70s (13m33s)**. It collected 43 I4 cases before the final depth-budget correction/test was added; the final 248-test run covers the corrected implementation and all 44 I4 cases. Existing R1 tests were unchanged.
- PASS: both actual large-world benchmark/reopen executions, with equal incremental and independent source/cache roots.
- PASS: privacy/content audit of 15 backend and five frontend changed files; original code/CC0 fixtures/docs/numerical evidence only. No private content, credentials, personal paths, restricted artwork, generated database or source pack.
- PASS: unchanged frozen review and original 29-case fields; extra I4 evidence is partial only. Existing R1/legacy/I2/I3/production source/frontend behavior unchanged; original Antigravity checkouts clean.

| Required scenario | Actual result within I4 scope |
| --- | --- |
| Empty/deterministic vectors | PASS: pinned roots/preimages, record/dependency/evidence/snapshot vectors. |
| Order-independent construction | PASS: shuffled incremental insertion equals independent sorted-stack rebuild. |
| Memory append and relationship adjustment | PASS: compound two-record change and two events advance one global revision. |
| Inserts, updates, logical deletions/tombstones | PASS: revision/CAS rules, retained-state tombstones; physical deletion/resurrection rejected. |
| Unrelated entities | PASS: unchanged subtrees share identity; 300-record test touches <40 nodes for one update. Large cases touch 45/41 cache rows only. |
| Duplicate/collision/owner/module/schema failures | PASS: duplicate IDs, forced identity-hash collision, wrong refs/versions and stale hashes fail. |
| Corruption | PASS: changed records, node hashes, stored cache and event evidence detected by independent audits. Local paths do not claim to detect every untouched corruption. |
| Save/campaign/revision isolation | PASS: equal world content across Save IDs has distinct snapshots; stale/cross-Save/campaign assertions fail; divergent branches retain independent roots. |
| Interrupted paths and reopen | PASS: persistent pure updates leave prior root unchanged on exception; caller-owned SQLite transaction rollback after partial paths OR head update restores prior state. Real close/reopen reconstructs source/cache/evidence roots. |
| Random differential | PASS: 100 seeded sequential insert/update choices, with interrupted retry at every step, match independent rebuild. |
| Evidence/cycle/outbox separation | PASS: ordered prefix hashing, duplicate/reordered evidence rejected; resulting snapshot/receipt fields not admitted in event core; outbox retry bookkeeping excluded. |
| Legacy/I2/I3 compatibility | PASS: unchanged proof bytes/fingerprints and regression paths, exact old legacy hash distinction, I2 full-field read-only fixtures. No profile activation or existing Save conversion. |

Commands from backend root (PowerShell):

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_granular_i4.py tests/test_granular_i3.py tests/test_granular_i2.py tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
.venv/Scripts/python.exe -m pytest -q -o addopts=''
.venv/Scripts/python.exe tools/granular_hash_benchmark.py --npcs 100 --memories 10000
.venv/Scripts/python.exe tools/granular_hash_benchmark.py --npcs 1000 --memories 20000
git diff --check
```

Frontend executable source/dependencies unchanged; frontend branch is specification/handoff/register/mapping only. No frontend/gameplay or AI PASS claimed. Existing R1/store/gateway/codecs, I2 driver/schema, I3 request/fingerprints, receipts and frozen schemas remain unchanged. Existing Saves, CP149/CP150 and original Antigravity checkouts are preserved. Source-combat and private-secret AI inference holds remain in force.

## G01-G29 mapping and review instructions

The architectural review remains byte-identical at SHA256 `01183daeb7f6d35d6da51d8a14a54b17f2dc681df057712878e4cd754051a4d6`. All original 29 cases, increment lists and full canonical acceptance statuses are preserved. Updated `V2-GRANULAR-ACCEPTANCE-MAP.json` adds explicit I4 fixture-only evidence on G09, G16, G17 and G22; other cases remain outside I4. G09 covers only CAS/stale-snapshot prerequisites, not concurrent material commits. G22 covers only isolated Save identities/divergent roots, not live full-file branch sessions or replay. This is not a blanket PASS for future storage/branching/migration acceptance.

Antigravity may fetch/review or cherry-pick the I4 commits into a development branch. Nothing should be activated, registered, installed into an existing Save or wired to live CommitAuthority. Normal V2 legacy gameplay remains unchanged, including its existing monolithic-request growth limitation. The isolated codec/hash work is preparation for solving that limit, not an activated fix.

## Stop and next approval

**Stop after I4. Request explicit I5 approval before canonical integration.** Exact required units and unresolved contract choices are in the hash specification: complete typed/knowledge/source validation; real module and event-core ownership; versioned I3/I4 protocol/hash-domain adapter; canonical clock identity/tick mapping; legacy previous-hash bridge; reviewed derived-cache/head/profile SQL; trusted sole-writer capability; one atomic authority transaction covering records/cache/head/events/ledger/receipts/outbox/idempotency/admission; and full fault/recovery/integrity policy. No frozen schema edit, live route, startup migration or ACTIVE format follows from I4. I6 negotiation and I8 Save conversion remain separate.
