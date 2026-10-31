# I2 entity-core and disabled driver handoff

2026-10-31. **I2 only. PREPARED, disposable fixtures only.** Option C remains selected; no mandatory paged Save intermediate. This is physical schema/driver viability, not operational granular gameplay persistence.

## Review branches and immutable baselines

Both repositories use `codex/v2-granular-i2`, based respectively on approved backend `92764907e423e9bf0937bb5bb0498d0041f346e2` and frontend `6b7994f52f0d987acf3a3fd0f7bec18b8d83eeb3`. Implementation commit: `932d71a14975b3d7d63b578ca92e3db94259e5f9` (backend). Frontend changes are documentation only. Final published SHAs are in the delivery response; obtain exact paired heads with:

```sh
git ls-remote origin refs/heads/codex/v2-granular-i2
```

Backend: https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i2

Frontend: https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i2

## Implemented files and scope

- `src/vadallfate/runtime/granular/entity_core_v1.sql`: versioned additive schema asset, packaged as data. No installer, startup discovery or migration dispatcher. Existing proposal remains unchanged. Executable DDL matches the reviewed proposal, except the activation CHECK is deliberately narrowed to PREPARED only as required by this approval.
- `src/vadallfate/runtime/granular/prepared.py`: FixtureTransactionPort and PreparedEntityDriver; intentionally no imports from live dispatch. Injected connection must already have a transaction, foreign keys ON and the exact disposable fixture marker. Binding must be PREPARED. No connection creation, commit, rollback, savepoint, canonical writer capability or production registration.
- `tests/test_granular_i2.py`: exclusive new-file creation, schema installation and event/character/head fixture bootstrap. Uses original CC0 NPC/memory prose. Existing files are rejected before SQLite opens them. Reopen tests reopen only their own newly created temporary database. Fixture parent event columns/constraints mirror current runtime tables; the proposed runtime_events composite index is installed only here.
- `pyproject.toml`: include SQL asset in package data. No runtime dependency added.

The planned migration-directory/record-model split is deliberately deferred: this slice uses one standalone data asset and one disabled module, so no migration dispatcher is introduced or edited. There are no changes to runtime/store.py, existing canonical table definitions, frozen schemas, CommitAuthority, gateway, staging/recovery or normal frontend code.

## Actual fixture API

Create identities with `create('npc', id, exact_fields)`, observations with `create('memory', ...)`, and initial relationships with `create('relationship', ..., evidence_note=...)`. These are fixture storage operations, not R1 actions or commits. `read(kind,id)` returns `{'header': ..., 'record': ...}` with DM_ONLY fixture metadata, row revision/hash and typed fields. Memories are append-only; there is no general entity mutation/delete or source-body storage API.

Example runnable from the backend repository using its development environment:

```python
# Fixture demonstration only; never pass a live authority connection.
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
spec = importlib.util.spec_from_file_location('i2_fixture', 'tests/test_granular_i2.py')
f = importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)
with TemporaryDirectory() as directory:
    connection = f.fresh(Path(directory) / 'new-i2.sqlite')
    try:
        driver, original = f.populated(connection)
        changed = driver.adjust_relationship(
            'r', expected_revision=original['header']['row_revision'],
            expected_hash=original['header']['row_hash'], memory_id='m',
            delta_trust=0.1, delta_affinity=0.1,
            note="Acknowledged the traveller's warning.")
        assert changed['record']['trust'] == 0.1
        assert changed['header']['row_revision'] == 1
        connection.commit()  # Fixture owner only, NOT the driver.
    except Exception:
        connection.rollback()  # REQUIRED: discard whole transaction on failure.
        raise
    finally:
        connection.close()
```

The driver must never receive a real CommitAuthority writer handle under this approval. A fixture marker/port is an accidental-use guard, not a Python security sandbox. Tests can always access their own raw disposable connection. It does not grant authority or replace permissions.

## Supported invariants and hashing

Composite campaign keys/FKs bind catalog, NPCs, memories, actors, events, relationships and ordered evidence. NPC identities retain original authoring or exact pinned source metadata, never source definitions. Pin syntax/hex and SQL-required metadata are checked; installed-pack authenticity/resolution is not asserted by this fixture driver. LEGACY_IMPORT is representable in the reviewed DDL for a future approved migration but rejected by driver APIs; I8 is not approved.

Fixture event payloads explicitly establish actor, observers and world minute. A memory requires same-campaign NPC, identity actor and event, matching observer/minute, coherent acquisition mode and an unverified flag for TOLD. This is an explicit fixture evidence protocol, not an approved mapping of every real RuntimeEvent type. A relationship adjustment additionally requires a hash-verified owned memory for that NPC/actor. Initial relationships have an owned event and ordered evidence note; they do not require prior memory. The SQL evidence row records the causal event and note, not an exact memory ID; a future full evidence/hash profile must decide that linkage before activation.

Relationship updates follow current supported trust/affinity bounds and clamping, plus familiarity +0.05. Each input delta is finite and <=0.2 in magnitude. Other relationship fields are retained; generic relationship/goal/routine mutation is not implemented. Zero trust/affinity deltas can still increase familiarity and append evidence, matching the existing model. SQL enforces value/text/JSON bounds and deferred FKs; exact typed field sets and an 8,192-byte fixture record bound precede insertion. SQLite affinity alone is not full logical validation; the reviewed tables are not STRICT, and nullable legacy/preparation fields must not be treated as a production candidate validator. I5 must close the complete real-action validation boundary before activation.

JCS utility is reused with **fixture-only** domain `vadallfate.i2.fixture.record.v1`. Coverage includes campaign/entity/kind, row revision, module/schema, DM_ONLY visibility, tombstone flag and every typed field. Provenance JSON is hashed as its stored string, so whitespace changes are significant. Head placeholders are not roots. No global head/revision, SnapshotRef, hash tree, event ledger or receipt behavior is implemented/changed. No independent hash-profile activation is claimed.

Adjustments use expected row revision/hash and affected-row CAS. Only three records change: one catalog header, one relationship, one appended evidence row. NPC identities, memories, other relationships, campaign heads and legacy state_json are untouched. Failed SQL latches the port; caller must discard it and roll back the ENTIRE transaction, including any successful earlier operation. Driver owns no rollback and cannot make a partially failed transaction safe for a caller that incorrectly commits it.

## Verification and acceptance

- PASS: final I2 suite **38 passed in 9.72s**.
- PASS: final combined I2/preparation/R1/recovery/JCS suite **125 passed in 28.02s**.
- PASS: full backend regression run **624 passed, 2 skipped in 737.40s (12m17s)**. This run began before the final six I2-only constraint cases were added; the final 125-test run covers all 38 I2 cases and the final driver code. Existing R1 tests were unchanged.
- PASS: privacy/content review of all nine backend and three frontend changed files; only code, SQL, package metadata, original CC0 fixture prose and documentation. No database, private pack, artwork, proof response, personal path or credential is included. New commit messages also audited.
- PASS: original review, proposal and 29-case map byte-identical to approved baselines; protected runtime/frozen schema files unchanged; diff whitespace checks clean.
- Frontend executable source/dependencies unchanged; no frontend gameplay claim or redundant frontend suite run for this documentation-only increment.

Reproduction (Windows PowerShell, repository root):

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_granular_i2.py
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
.venv/Scripts/python.exe -m pytest -q -o addopts=''
git diff --check
```

| I2 acceptance | Evidence / disposition |
| --- | --- |
| Fresh schema/FKs/integrity | Fixture exclusive creation, PRAGMA foreign_keys=1, integrity_check=ok, empty foreign_key_check; ACTIVE rejected. |
| Deterministic entity creation and hashes | Two independent files reproduce fixed relationship digest 27f2bbf560a1eba5fbf6fccc53c3aaa1a3aa59b8a8bb7faa89e7c673ff1cee04. Envelope/payload tampering rejected. |
| Owned memory and evidence | Valid TOLD observation, missing/wrong actor/NPC/event/campaign/minute/acquisition rejections; owned memory required for adjustment. |
| Revisions and identity conflicts | Stale expected revision/hash, duplicate entity IDs, conflicting requested kinds rejected. |
| Bounded values and pins | UTF-8 byte bounds, JSON validity/size, truth flag, numeric range/nonfinite/delta checks and pinned metadata checks. |
| Atomic rollback | Failures injected before header, relationship and evidence SQL; fixture owner rollback restores all previous rows. Closing without commit discards changes. |
| Reopen persistence | Full close/reopen recovers identical headers, relationship values, revision/hash and both evidence entries. |
| Campaign isolation | Same entity IDs can exist independently in a/b; foreign events and private memories cannot cross campaigns. |
| Driver lifecycle restriction | connect monkeypatch and SQLite transaction authorizer; AST forbids lifecycle methods; port rejects transaction SQL, arbitrary lifecycle/legacy updates. |
| No unnecessary rewrites | Exactly three changes per adjustment; traces and full NPC/memory row comparison show no unchanged-record rewrite. |
| No existing Save / production route | Fresh test paths only; exclusive helper rejects existing file without byte change; no live imports, registration, installer, writer capability or protected-code edits. |
| Existing R1 regression | See actual suite results above; no normative schema/authority change. |

The original review SHA-256 stays `01183daeb7f6d35d6da51d8a14a54b17f2dc681df057712878e4cd754051a4d6`, preserving all 29 G01-G29 cases and their increment map. The preserved map links I2 to G01, G02, G03, G23 and G27. I2 supplies fixture evidence for mapped physical-storage portions only; full granular acceptance remains unimplemented. The earlier readiness document records the pre-approval state; this document supersedes its I2-only approval/status wording, without weakening its I3-I8 gates.

Existing source-combat, security and private-secret model reasoning holds remain unchanged. No UI/Edge gameplay PASS is claimed: granular gameplay remains disabled. No production Save, CP149/CP150 or Antigravity checkout was opened for conversion or modified by this work. No private pack, sourcebook, proof response, image, credential, database or machine path is included in the increment.

## Integration and exact next approval gate

Antigravity may fetch/review the paired I2 branches or cherry-pick their reviewed commits into a development integration branch; do not merge protected branches automatically. Existing V2/legacy operation is unchanged. There is nothing to enable or convert. Do not wire FixtureTransactionPort into the live authority or install this schema into an existing Save.

**STOP AFTER I2. Request explicit I3 approval:** implement the reviewed bounded typed staging/recovery representation, isolated first in disposable tests, preserving legacy codec bytes and the 65,536-byte admission limit. Approval must name the exact typed request/intent schemas and runtime/granular/delta_contracts.py and staging_codec.py files, plus any changes to runtime/contracts.py adapters, staged_request_codec.py dispatch, commit_authority.py staging/recovery/fingerprints and the input_admissions discriminator migration. No frozen normative extension, discriminator/schema migration or live route is implicit. I4 production hash/revision profile, I5 validation/atomic authority integration, live negotiation and I8 conversion still require their own approvals. I3 does not automatically authorise them.
