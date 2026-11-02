# I7T-01 typed playable-world foundation — review handoff

2026-11-02. **Controlled original disposable fixtures only; STOP after I7T-01.** Backend approved base `88cf4e5ed3b2d7d8c3a0e7a6870d64e205851c47`, frontend `2f4d2dd99153b6238a54a4530042d366bd17456a`. Paired review branch: `codex/v2-granular-i7t-01`. Final published SHAs accompany delivery and the publication record below. No protected merge/force push, I8, existing Save conversion, normal gameplay activation or production audit-policy change.

## What now works

The explicit disabled `I7T01.PREPARED.world.v1` profile supports a real joined R1 action: advance the Master World Clock; fire an indexed due NOTICE; adjust a character's HP, temporary HP, slot use and condition; record a private unverified NPC tell; update the supported relationship; open an unresolved conversation; progress dependent objectives and complete the quest. It produces **one** material revision/event/receipt for eleven typed targets. Independent source reconstruction, deterministic replay, exact retry and full reopen recover the result.

After five intervening fixture sessions, a scene NPC recalls only its own unresolved earlier conversation with the selected actor/topic. An unrelated NPC returns no memory; player/other-character/private-quest boundaries are enforced. This is indexed retrieval of authorised stored experience, not a complete cognition system or a new AI integration. No continuous model calls occur.

Mutable source data uses separately addressable scalar SQLite owners, not another campaign JSON row. Original fixture identity, memories and sparse relationships reuse I2. New owners use `g_t_clock`, `g_t_resources`, `g_t_slot`, `g_t_condition`, `g_t_quest`, `g_t_objective`, `g_t_schedule`, and `g_t_conversation`, with composite campaign ownership, row revisions/hashes and explicit visibility. Immutable per-record genesis and normal event deltas provide replay evidence; they are not a second mutable source store. Unchanged owner rows are not rewritten.

## Ownership and coverage

- [Exact field ownership](V2-GRANULAR-I7T01-FIELD-OWNERSHIP.json) accounts for **23 roots, all 282 exact seed paths, 330 total mapping rows** after expanding the recorded runtime selectors and including additional roots/scalars. The actual original seed recipe is checked against the frozen inventory. All 18 optional selector expressions, ten additional runtime roots and nine recorded authority scalars are retained. Ninety-five syntactic legacy StatePatch sites are listed with source function/line; two opaque dynamic expressions are explicitly unresolved.
- Every row identifies its proposed typed owner/target, current representation and sole persisted writer, static mutator evidence, validation, visibility, required R1 action, transformation/inverse design and implementation status. Root-module mutator evidence is honestly static, not a claim to exhaust every dynamic assignment. **307 mapping rows remain proposed/unimplemented**, rather than being silently declared covered. Mapping ownership is not migration implementation.
- Incompatible ability/speed/weight aliases, spell-slot `used` versus `current`, NPC belief/memory mirrors, calendar formatting/weather and binary-objective semantics are conversion holds. Raw field recognition rejects unknown leaves/roots and duplicate JSON keys; opaque recorded objects still need exact schemas. It never converts data or grants migration readiness. Byte-restoration journals/alias reconciliation are future review work.
- [Domain-by-domain coverage and gaps](V2-GRANULAR-I7T01-DOMAIN-COVERAGE.json) gives exact implemented operations, tables, invariants and missing behavior. Clock epoch is an original minute-3 fixture, not a calendar converter. Resources are manual approved accounting, not attacks/spell resolution/rest/death saves. The original slot fixture has level 1/capacity 2; other capacities/labels/character creation are not inferred. Quests support up to 32 objectives, one immutable same-quest prerequisite per objective, and real memory/fired-NOTICE signals. Progress is an explicit DM-adjudicated quantity gated by an existing signal, not an automatic count of unique signal occurrences; a per-objective consumed-signal ledger is not implemented. Other legacy predicates, rewards, deadlines and failure branches remain held.

## Existing authority and hash boundaries

The existing `CommitAuthority.granular_fixture` selects this profile only with a distinct identity-token capability; mixed F/Q/FQ/T flags fail before acquiring a writer. A fresh-only installation capability installs the additional SQL only after exclusive new-file creation. Existing SQL assets, `runtime/store.py`, frozen schemas/DTOs and normal gateway/launcher/authentication remain unchanged. New manifest/access/registration objects validate against frozen state-module schemas but exist only in the fixture descriptor; nothing is registered in production.

All actions still use frozen ActionEnvelope, SnapshotRef, StatePatch, validation and CommitRequest shapes. The new explicitly discriminated codec is at most **65,536 bytes**, at most sixteen write targets and 128 dependency reads; source records are at most 8KiB and the immutable event payload at most 32KiB. Invalid/oversized actions fail before durable admission. Worker PASS claims never grant authority: independent validators construct and verify the exact candidate, source pins, ownership and target revisions/hashes.

I4 deliberately rejects these additional kinds, so `I7T01.PREPARED.hash.v1` is a separate profile with pinned implementation/schema hashes. It reuses I4's generic authenticated-node algorithms and source hashes without changing I4 meanings. New normalized owners and original I2 rows share the **same existing `g_campaign_heads`** root/revision and native event chain. The Master Clock's source minute must match the head. Independent audit reconstructs the complete source/cache tree, checks SQLite/index integrity and foreign keys, verifies all receipt/ledger/outbox/patch/proof evidence, and replays actual registered actions from immutable genesis; it checks every intermediate content root and final authoritative state.

`material_publish.py` extracts the original I5 evidence/receipt tail into one shared connection-bound publisher, retaining old identifiers and receipt semantics. Old I5 calls it with its original profile; new owners use it under this explicit profile. Q's implementation-version inventory now includes that shared dependency. No helper opens, commits or rolls back the authority connection. Only the existing R1 transaction commits. The only CommitAuthority method changed is the existing fixture dispatch guard. Accepted I2–I7FQ numerical artifacts and acceptance fields remain unchanged; historic private fixture evidence must be inspected with its exact recorded published code revision, never silently rebound.

Mandatory complete audit on reopen/checkpoint and the 100-revision age gate are unchanged. A failed audit rolls back its marker update. The current production format resolver intentionally does not register this profile; normal gameplay must continue to refuse it. Legacy gameplay remains available and separately regression-tested.

## Lazy retrieval architecture

The fixture's scene descriptor selects one original NPC; `scene` hydrates that bounded approved membership, not the whole population. This is immutable fixture membership, **not** dynamic spatial placement. Production membership must come from the existing authorised location/spatial owner once fully mapped.

`due` uses `(campaign,status,due,id)` and a cursor carrying its exact snapshot hash. A changed head rejects the next page with STALE_SNAPSHOT; callers restart from the new head. Processing can re-query from the beginning after each bounded FIRED commit. Firing remains an explicit bounded validated action; production cryptographic range-completeness proofs are still held. Dormant NPCs stay stored and do no cognition/model work. `relationship` reads a sparse indexed endpoint pair and returns numerical axes plus evidence. `recall` first filters exact campaign/NPC/actor/topic/OPEN status, then uses indexed session recency and a limit of at most ten. Selected source records and their paths are verified; each memory retains acquisition, unverified status and event/provenance. The handler reads no entire conversation transcript or source book. Human DM inspection is not model-context admission: a future dialogue worker must use a derived NPC/task scope and receive no DM credential or database handle.

For future production dialogue, establish role-safe scene/speaker identity, approved personality and exact source pins, eligible knowledge/commitments and permitted recent interactions **before** optional Laya-style ranking. Ranking cannot widen that set. Invoke Qwen through the existing single-model Harness only for an actual reply, difficult decision or nontrivial plan; no continuous LLM loop or all-NPC hydration. All proposed consequences still return to ordinary R1 validation/commit. No new provider or model scheduling path was implemented here.

## Reproduction and actual measurement

All Python commands/source paths in this paired handoff refer to the backend checkout. From its Python development environment:

```powershell
python -m pytest -o addopts='' tests/test_granular_i7t.py
python tools/granular_i7t_ownership.py --output <new-field-only-report.json>
python tools/granular_i7t_proof.py --output <new-numerical-report.json>
python -m pytest -o addopts='' tests
```

The proof tool accepts no existing Save path. It creates original 10/100/1,000-NPC fixtures with 20/1,000/3,000 initial memories, retains private tickets/databases under the OS temporary directory and publishes only path-free counters/hashes/timings. Actual [numerical evidence](https://github.com/Minilaz-code/VadAllFate/blob/codex/v2-granular-i7t-01/docs/evidence/V2-GRANULAR-I7T01-PROOF.json): ordinary resource requests **8,204–8,206 bytes**; eleven-target joined requests **24,319–24,321 bytes**; indexed recall **0.0093–0.0134s**; complete audits **1.2389 / 3.3845 / 9.8016s**. Different metadata digit widths explain the two-byte increase. Samples overlap regression load and are not production SLAs. These smaller histories do not supersede the accepted approximately 205-second I7R audit or its 10,000-action evidence; that workload was not rerun.

Working fixture-only Python example:

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
sys.path.insert(0, 'tests')
import granular_i7t_fixture as client
from vadallfate.runtime.granular import typed_world_fixture

with TemporaryDirectory() as root:
    ticket, store, authority, sessions = typed_world_fixture.create(
        Path(root) / 'i5-disposable-world.sqlite')
    receipt = client.commit(authority, sessions['DM'], [
        ('clock.advance', 'clock.master', {'minutes': 5}),
        ('character.resources', 'resources.actor.original',
         {'hp_delta': -2, 'temp_delta': 0}),
    ], nonce='example.once')
    authority.granular_fixture('audit', campaign='campaign.original')
    store.close()
    store, authority = typed_world_fixture.reopen(ticket)  # mandatory full audit
    store.close()
```

The executable unresolved-conversation example uses the same factory/client:

```python
from test_granular_i7t import setup_quest, joined
# Reuse the imports from the preceding example; create a new fixture:
with TemporaryDirectory() as root:
    ticket, store, authority, sessions = typed_world_fixture.create(
        Path(root) / 'i5-disposable-conversation.sqlite')
    try:
        setup_quest(authority, sessions['DM'])
        client.commit(authority, sessions['DM'], joined(), nonce='joined')
        for session_number in range(2, 7):
            client.commit(authority, sessions['DM'], [
                ('clock.advance', 'clock.master', {'minutes': 60})
            ], nonce=f'session.{session_number}')
        context = authority.granular_fixture(
            'recall', campaign='campaign.original', npc_id='npc.0000',
            actor_id='actor.original', topic='bridge', session=sessions['NPC'])
        assert context['memories'][0]['session_number'] == 1
        assert context['memories'][0]['verified'] is False
        assert context['model_calls'] == 0
    finally:
        store.close()
```

The proof/tests additionally close/reopen and compare the same eligible memory and original receipt. This context is not a model-generated reply or a claim that the rumour is true.

The joined scenario and exact read/recall/quest calls are in `tests/test_granular_i7t.py` and `tools/granular_i7t_proof.py`. Test results and final publication audit are recorded in `docs/evidence/V2-GRANULAR-I7T01-VERIFICATION.json` and the final results below, only after the runs complete. Frontend executable source is unchanged; paired documentation/register updates only.

## Production readiness and requested review

[Separate measured integrity-policy proposal](V2-GRANULAR-I7T01-INTEGRITY-POLICY-PROPOSAL.md) specifies threat model, trusted external anchors, authenticated source/history/range coverage, WAL/crash protocol, proposed 35-minute detection window and exact lost guarantees. It is **proposal only**. The controlled untouched-source corruption probe proves that a different touched path can still read successfully while full audit fails, without refreshing eligibility. Existing diagnostic prefix/touched-path checks are never whole-history certificates.

Still held: I8, any existing/copy Save conversion, ACTIVE/normal gameplay registration, production audit-policy changes, source-combat/private-secret inference, full I6 owner schemas and legacy transforms. New world-domain fork/repair composition with I7FQ is not yet implemented; standalone accepted FQ remains separately tested. Further review must scope that composition rather than silently exporting an incomplete new typed Save. NPC witnessed/general knowledge management, full character rules/inventory, source calendars, broader quest conditions/routines, portable export and real UI integration remain future work.

Antigravity should fetch both review branches, inspect the ownership/coverage/policy boundaries, run the fixture commands in a development checkout and keep all new bindings PREPARED. Do not point them at existing campaigns or merge protected branches. **Please review I7T-01 before authorising any expansion.**


## Final acceptance and readiness

| Requirement | Actual result |
| --- | --- |
| W1 exact ownership accounting | PASS for 23 roots / 282 exact seed paths, 330 accounted rows and recorded runtime fields/sites. 307 rows remain proposed/unimplemented; incompatible aliases, opaque dynamic fields and all conversion work remain held. |
| W2 clock, character resources, quest/objective owners | PASS for the documented original first slice: real sole-R1 commits, bounded deltas, direct canonical HashRefs, row revisions, complete audit/replay, roles and full restart. |
| W3 lazy world contract and unresolved recall | PASS for the executable indexed fixture and contract; five intervening sessions, one hydrated scene NPC, sparse edges, eligible old memory, zero model calls. Full knowledge/routine/placement integration remains held. |
| W4 measured integrity proposal | DELIVERED FOR REVIEW ONLY. Actual untouched-source probe demonstrates limits; current complete-audit/revision gate unchanged. Proposed eligibility/anchor/range policies are not implemented or approved. |
| Final domain suite | **53 passed in 148.76s**, including 24 genuine Windows process-termination cases, stale cursor/private-reference regressions, multi-tell queue continuation, schema/role failures and the unchanged 100-revision gate. |
| Final broad backend | **1,025 passed, 2 skipped in 1320.22s (22m00s)**. Existing private-source opt-in and unavailable Windows symlink privilege skips; existing live Ollama/CUDA regression passed. |
| Frontend | **157 passed**, TypeScript and production build passed; existing warnings only, executable frontend unchanged. |
| Actual runtime proof | PASS at 10/100/1,000 NPCs with 20/1,000/3,000 initial memories. Each performs ten real commits, complete source/replay audit, checkpoint/reopen and exact original receipt replay. |
| Preservation/privacy | PASS prepublication tree audit: accepted I2-I7FQ evidence, frozen schemas/constraints, protected authority sources and all prior acceptance fields preserved. No private sources, generated databases/tickets/raw responses or credentials in the increment. Final committed-version/message audit accompanies verified publication. |

All final implementation tests completed before publication. Earlier interrupted/pre-hardening runs are not substituted for these final results. No 10,000-action rerun, existing/copy Save conversion, normal granular activation, production policy change, protected merge or Antigravity checkout edit occurred. **I7T-01 first-slice foundation is ready for review; full playable-world/I7 production readiness is incomplete. Please review before any expansion.**
