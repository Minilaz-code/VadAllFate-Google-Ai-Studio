# Option C implementation readiness

2026-10-31. Option C is selected: direct granular typed SQLite persistence with native legacy readers. Paged Save v2 is not an intermediate implementation. Architecture selection is NOT schema, authority or conversion approval.

## Published review baseline

| Repository | Published review branch | Verified SHA |
| --- | --- | --- |
| Minilaz-code/VadAllFate | codex/v2-granular-state-review | ec08ffc718644872a6cfda068d0afd7714bd87f6 |
| Minilaz-code/VadAllFate-Google-Ai-Studio | codex/v2-granular-state-review | c18634f736436e49de69ab0df47a42bf9b519800 |

Published specification: https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-granular-state-review/docs/V2-GRANULAR-CANONICAL-STATE-REVIEW.md

Frontend copy: https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/blob/codex/v2-granular-state-review/docs/V2-GRANULAR-CANONICAL-STATE-REVIEW.md

Both are the original documentation-only commits, verified through Git remote refs and GitHub file retrieval. The review SHA-256 remains 01183daeb7f6d35d6da51d8a14a54b17f2dc681df057712878e4cd754051a4d6 and all 29 cases are unchanged. Neither review branch is advanced by the preparation work, which lives on codex/v2-granular-preparation.

## Safe work implemented in this preparation increment

Backend files actually added:

- tools/granular_readiness.py: offline deterministic world generator; locked normative EntityRef/StateFragment/StatePatch/WriteIntent shape checks; selected fixture identity/revision/hash/evidence invariants; read-only logical comparison and legacy Save summary; fault-result oracles.
- tests/test_granular_readiness.py: deterministic golden, input immutability, valid compound candidate, whole-candidate rejection, cross-campaign/identity/owner/hash/evidence/held-operation failures, limits, private-provenance comparison and read-only SQLite checks.
- tests/fixtures/granular-readiness/: original CC0 recipe documentation and expected summaries. No full world dump, source book or model response is committed.
- docs/proposals/GRANULAR-001-ENTITY-CORE.sql: non-executable I2 DDL proposal only, not a migration asset or runner input. It has not been executed; syntax/constraint execution tests belong to the approved I2 fixture scope.
- docs/V2-GRANULAR-ACCEPTANCE-MAP.json: all G01-G29 mapped to increments and explicitly NOT_IMPLEMENTED_OR_AUTHORISED for granular acceptance.

Only tools/tests/docs are changed. No application module imports the readiness tool. It has no SQL writer, migration, table creation, Gateway construction, mounted module, commit entrypoint or typed staging route. It does not change frozen schemas or live validation. Shape validation is not authority. Every successful readiness report says permits_canonical_write=false and typed_staging_codec_implemented=false.

The offline candidate format is PREPARATION_ONLY, not a proposed replacement for normative CommitRequest. It currently checks only memory creation and a bounded relationship adjustment with owned witness evidence. It does not prove complete actor/session permissions, real module registration, global SnapshotRef identity, all D&D invariants, SQL atomicity or incremental hashing. Its fixture-bundle byte count is not the size of a future fully framed typed CommitRequest. Full typed staging remains I3.

## Small engineering increments

Paths in this table are backend-relative unless marked frontend. Planned files do not exist yet unless listed above. Each protected unit is a separate review, not blanket migration permission.

| Unit | Scope / exact files to review | Contract boundary and deliverable |
| --- | --- | --- |
| I0: selected design | Existing V2-GRANULAR-CANONICAL-STATE-REVIEW.md; this handoff; acceptance map | COMPLETE design selection/publication only. Preserve exact review and 29-case matrix. |
| I1: identity/delta preparation | tools/granular_readiness.py; tests/test_granular_readiness.py; tests/fixtures/granular-readiness/ | SAFE offline work implemented. Reuses locked schema shapes and existing JCS; no registration/write permission. Proposed real slice IDs: VAF.APP.NPC.IDENTITY.SLICE.1, VAF.APP.NPC.MEMORY.SLICE.1, VAF.APP.NPC.RELATIONSHIP.SLICE.1; all UNREGISTERED. |
| I2: physical schema and disabled driver | Planned migrations/granular/001-entity-core.sql; runtime/granular/storage_driver.py; runtime/granular/record_models.py; reviewed changes to runtime/store.py only where migration dispatch is needed | APPROVAL REQUIRED. First scope: campaign head/binding, entity catalog, NPC identity/memory and relationship tables with composite campaign FKs, row versions/hashes and evidence references. One connection-bound driver supplied by CommitAuthority; no connect/commit methods, no default route or active-format switch. No production or existing Save conversion. |
| I3: exact typed staging/recovery | Planned runtime/granular/typed_contracts.py and staging_codec.py; approved changes to runtime/contracts.py adapters, staged_request_codec.py dispatch, commit_authority.py stage/recover/request fingerprint and input_admissions discriminator | APPROVAL REQUIRED. Encode the actual normative typed request at <=65,536 bytes before admission. Preserve legacy bytes/codec. Proposed nullable result_codec_ref discriminates old rows; adding it is a reviewed SQLite migration. Never use None as a durable typed payload or repurpose typed_fixture_write_intent. |
| I4: hashes/revisions | Planned runtime/granular/hash_profile.py; tests/fixtures/granular/hash-v1-vectors.json; campaign head/hash-node migration; approved commit_authority.py verification/receipt binding | APPROVAL REQUIRED. Versioned canonical field coverage, JCS domains, incremental root/full rebuild, Save-bound snapshot identity and explicit legacy bridge. Fixture digests in I1 are not this hash profile. Global revision and target-row CAS semantics remain authoritative. |
| I5: complete candidate validation and atomic integration | Planned runtime/granular/validators.py; reviewed v2_state_delta_validator.py, v2_campaign_gateway.py and commit_authority.py; later connection-bound authoring activation adapters in v2_authoring_services.py | APPROVAL REQUIRED. Deterministic dependency closure, real mounted capability checks and all invariants before one material transaction. Typed rows, roots, event/outbox/ledger/idempotency/admission/receipt atomic. No model/network call in writer transaction. Draft transitions must not independently commit canonical activation first. |
| I6: native legacy readers and negotiation | Planned runtime/granular/read_facade.py; reviewed game_campaigns.py, srd51_http_api.py and gateway projections; frontend src/types/runtime.ts, services/v2BackendClient.ts, services/v2Session.ts, components/content/CampaignManager.tsx | Offline comparisons SAFE and implemented in I1; live format/session negotiation APPROVAL REQUIRED. Legacy Saves stay native. New format requires explicit capability/Save identity; old clients fail closed. No second writable logical document. Frontend preparation branch changes documentation only. |
| I7: failure/replay/branch harness | Existing COMMIT_FAULT_STAGES, POST_COMMIT_FAULT_STAGE and recovery tests; planned tests/test_granular_authority_faults.py, test_granular_recovery.py, test_granular_branching.py | SAFE fixture/oracle preparation; installing typed hooks or routing real writes requires I2-I5 approval. Existing legacy fault points are distinct from proposed after_typed_rows/after_hash_paths/before_typed_head_update. Exactly-once and post-COMMIT retry must use existing durable evidence semantics. |
| I8: opt-in converter and rollback | Planned scripts/migrate_disposable_granular_save.py; reviewed migration_manifest and legacy-write-fence SQL; game_campaigns.py inspection/export adapters | SEPARATE CONVERSION APPROVAL. Only a named copied/disposable Save, with maintenance gate, backup, pending-input disposition, idempotent batches, full comparison and atomic activation. No automatic _migrate conversion, production Save, legacy-row paging workaround or protected merge. |

Dependency order: I0/I1 -> reviewed schema/ownership spec -> I2/I3/I4 -> I5 -> I6/I7 live acceptance -> separate I8 conversion. Pieces may be developed disabled in parallel only after their own authorisation; no partially migrated active campaign or competing writer.

## Exact normative and runtime approval inventory

No edit to an existing frozen normative JSON schema is currently proposed or authorised. Existing shapes appear sufficient, but approval must confirm the mapping rather than assume it:

| Existing contract | Required reviewed work; no implicit extension |
| --- | --- |
| 0.1.0 primitives: EntityRef, StateFragment, HashRef | New application record/slice schemas and approved field coverage. Preserve namespace/identity; <=128 fragment state properties is not permission for unbounded history arrays. |
| 0.1.0 actions: StatePatch, PatchOperation, WriteIntent | New CLOSED operation-argument schemas and owner/target/precondition/validator bindings. Keep all current required fields and limits. Count repeated embedded patch/intent metadata in wire size. No arbitrary SQL/path opcode. |
| 0.1.0 validate: CommitRequest/ValidationResult | Exact normative-to-runtime DTO/codec and independent authority validation. Do not turn I1 reports into trusted ValidationResult or change required validation/lineage policy. |
| 0.1.0 primitives SnapshotRef and runtime profile/determinism contracts | Explicit logical Save ID/campaign mapping, snapshot hash profile/version and pinned execution dependencies. Do not silently replace legacy sha256_json(state). |
| 0.1.0 commit: CommitReceipt/RuntimeEvent | Preserve atomic revision/hash/patch/event/evidence references. New storage does not rewrite old receipts or fabricate a different historical determinism proof. |
| 0.3.0 StateModuleManifest/StateSliceDefinition/AccessProfile/Registration | Proposed new application manifests, config and capability registrations. Keep COMMIT_AUTHORITY_ONLY and direct_canonical_write=false. Fixture shape checks never imply REGISTERED; source-combat provider authority stays held. |
| Deployed scalar dataclasses, staged codec and CampaignStore | Runtime implementation changes are protected even if normative JSON fields need no change. New typed dispatcher, discriminator, driver and hash binding require explicit authority/schema approval. Legacy path remains intact. |

If integration actually requires an additional field, changed enum, raised bound, new normative SnapshotRef/CommitRequest version or new admission lifecycle, stop with the precise proposed versioned delta. Do not edit 0.1.0/0.3.0 schemas or source locks. Current admission statuses/discard semantics must not be silently reinterpreted. CP149/CP150 and production state-module registration remain untouched.

## Verification and fixtures

Original data actually generated:

| Dataset | Counts | Result |
| --- | --- | --- |
| Small golden | 2 NPCs; 4 memories/events; 2 quest/objective pairs | 22 records; deterministic fixture digest and insertion-order independence tested |
| Growing world A | 100 NPCs; 10,000 memories/events; 1,000 quest/objective pairs; per-NPC relationships/routines/private beliefs | 22,402 generated records; expected summary recorded |
| Growing world B | 1,000 NPCs; 10,000 memories; 100,000 events; 5,000 quest/objective pairs; per-NPC relationships/routines/private beliefs | 124,002 generated records; expected summary recorded |

These are deterministic in-memory datasets, NOT successful granular persistence or performance benchmarks. Source references identify original preparation fixtures, not fake installed pack pins. All generated prose is CC0. Existing installed source definitions are not copied into live state or published. Numerical digests are O(N) comparison digests, not an implemented incremental SnapshotRef root.

Read-only comparison was executed against the dedicated prior acceptance Save. The utility uses SQLite mode=ro plus query_only and verifies the existing canonical hash before computing a separate logical comparison digest; it never initializes CampaignStore/Gateway. Unit fixtures verify no missing Save is created and existing file bytes remain unchanged. Comparison includes private provenance and array order; it cannot quietly ignore lost fields.

Commands (backend):

    .venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
    .venv/Scripts/python.exe tools/granular_readiness.py --npcs 100 --memories 10000 --events 10000 --quests 1000 --output private-content/granular-preparation/world-100.json
    .venv/Scripts/python.exe tools/granular_readiness.py --npcs 1000 --memories 10000 --events 100000 --quests 5000 --output private-content/granular-preparation/world-1000.json

An initial generator keyword collision was fixed before the golden/large outputs were recorded. Final verification: **87 passed in 16.03s** (23 new offline preparation checks and 64 existing R1/recovery/JCS checks). No granular driver or future acceptance case is claimed to pass. Publication tips are recorded in the delivery message. No React/gameplay changes require a new gameplay PASS here; earlier real-game results remain baseline evidence, not granular acceptance.

## All 29 acceptance cases

Machine-readable mapping: V2-GRANULAR-ACCEPTANCE-MAP.json, bound to the unchanged review SHA-256. Every case is still granular NOT_IMPLEMENTED_OR_AUTHORISED. Preparation is not a PASS for a future storage driver.

| Cases | Main increments | Prepared evidence / remaining gate |
| --- | --- | --- |
| G01-G03 | I1/I2, I4/I5 | Large recipes/counts/digests prepared; SQL request/write scaling unimplemented |
| G04-G05 | I5/I7 | Immutable input/compound candidate tests; real long-sequence and atomic driver commits gated |
| G06-G08 | I1/I3/I5 | Fixture size/count/negative checks and existing legacy boundary evidence; actual typed framing/registration gated |
| G09 | I4/I5/I7 | Target-version fixture rejection; actual concurrent authority path gated |
| G10-G15 | I3/I7 | Existing recovery/fault baseline and expected-result oracles; typed interruption/replay path gated |
| G16-G17 | I4/I8 | Complete logical comparison and deterministic fixture digests; incremental hash/corruption acceptance gated |
| G18-G20 | I6/I8 | Read-only legacy utility; actual format negotiation, converter and real old-binary fences gated |
| G21-G22 | I6/I7/I8 | No new runtime format enabled; full Windows granular restart/timeline tests still required |
| G23-G25 | I1/I2/I5/I6 | Fixture namespace/evidence cases; real Save isolation/ACL/activation transactions gated |
| G26 | I7 | Existing hook inventory; normalized WAL/process-kill experiment not implemented |
| G27-G28 | I1/I2/I5 | Fixture refusal of held operation; no new inventory/combat permission |
| G29 | I8 | Dependency-closure export is separately gated; no export/conversion utility enabled |

## Compatibility and precise next approval

Existing Saves and Antigravity's active V2 code run unchanged: production source, contracts, schema files, frontend services and gateway imports are untouched. No competing authority, new active table, monolithic paging layer, migration or registry activation exists in this increment. Legacy source pins, authentication, single-model Harness, R1 receipts and frozen holds stay intact.

Concrete SQL review unit: [GRANULAR-001-ENTITY-CORE.sql](proposals/GRANULAR-001-ENTITY-CORE.sql), covering bindings/heads, typed identity/catalog, NPC memories, relationships and ordered relationship evidence. It preserves the existing NPCRelationship ranges and does not store source definitions or growing history arrays. The SQL was not executed or installed.

Next requested protected unit: **I2 only** -- approve implementation of the additive typed entity-core schema and disabled connection-bound storage driver for NPC identities, memories and relationships, limited to newly created disposable test fixtures. Keep the default gateway/legacy driver unchanged; no existing Save conversion, production registration, frozen R1 schema edit or runnable alternate commit entrypoint. Typed staging/authority integration (I3-I5) and any copied-Save conversion (I8) require their own explicit review/approval. The Option C target selection alone does not grant these permissions.


## I2 limited approval follow-up

The subsequent I2-only approval is implemented on codex/v2-granular-i2; see [I2 handoff](V2-GRANULAR-I2-HANDOFF.md). Earlier approval-status wording above records the preparation baseline. Only disposable physical schema and a disabled PREPARED fixture driver are now implemented. I3 typed staging/recovery, I4 production hashing, I5 authority integration and I8 conversion remain separately gated. The review and 29-case mapping are unchanged.


## I3 limited approval follow-up

The subsequent I3-only approval is implemented on codex/v2-granular-i3; see [I3 handoff](V2-GRANULAR-I3-HANDOFF.md). I3 adds a PREPARED isolated typed protocol and disposable staging/recovery evidence. No live typed dispatch, existing Save discriminator migration, production hash profile, I2 activation or canonical typed commit is enabled. Earlier status wording records prior baselines. I4/I5/I6/I8 remain explicit gates and the 29-case review/map remain unchanged.


## I4 limited approval follow-up

The subsequent I4-only approval is implemented on codex/v2-granular-i4; see [I4 hash specification](V2-GRANULAR-I4-HASH-SPEC.md) and [handoff](V2-GRANULAR-I4-HANDOFF.md). Only disabled fixture hashing, derived roots, revision/snapshot identity and evidence-chain proofs are implemented. No production profile, deployed SnapshotRef, active format, driver/authority integration or Save migration is enabled. I5/I6/I8 remain explicit gates. The review/29 cases are preserved; the mapping adds isolated I4 evidence.


## I5 controlled authority integration — 2026-11-01

Review branch: `codex/v2-granular-i5`. [Handoff](V2-GRANULAR-I5-HANDOFF.md), [exact adapter/schema specification](V2-GRANULAR-I5-ATOMIC-SPEC.md), and [unchanged original G01–G29 with separate I5 evidence](V2-GRANULAR-ACCEPTANCE-MAP.json).

Actual R1-owned atomic memory/relationship commits, incremental authenticated paths, native event/ledger/outbox/receipt/admission effects, real process-death recovery and exactly-once retries are implemented ONLY in new disposable PREPARED fixtures. Normal gameplay/startup/gateway, legacy CampaignStore, frozen schemas and existing Saves are unchanged. Source identities and session/module registrations are original fixture implementations, not real pack/game activation. Frontend executable code is unchanged.

Final targeted verification: 307 passed, including 59 I5 cases. Broad final backend verification: 812 passed, 2 skipped in 882.06s after final code corrections. Frontend 152 tests, TypeScript check and production build passed. Fresh 100/1,000-NPC fixtures with 10,000/20,000 memories retain history and stage ~11.4KiB requests; measured material medians ~0.32s, full reopen audit ~20/40s. Performance and coverage limits are explicit in the handoff. No full application storage acceptance or legacy capacity fix claimed.

STOP after I5. I6 live negotiation/real content-session adapters and I8 migration/rollback/export require separate explicit approval. Combat/private-secret model holds remain. No production Saves, Antigravity checkout, CP149/CP150, protected branches or main merge.
