# I3 bounded typed staging and recovery handoff

2026-11-01. **I3 only: PREPARED fixture protocol and recovery. Granular gameplay remains disabled.** Option C remains direct granular typed persistence with native legacy compatibility; no mandatory paged Save intermediate.

## Branches and exact approved ancestry

Backend review branch: `codex/v2-granular-i3`, based on approved I2 `a2ce5f3fb92cfc0d6cec3c76391116634bc6d52c`.

Frontend review branch: `codex/v2-granular-i3`, based on approved I2 `7d437fb3876e93221b0507a43f9c5433cbd5e967`. Frontend changes are documentation only.

Final remote SHAs are provided in the delivery response. Verify them with `git ls-remote origin refs/heads/codex/v2-granular-i3` in each repository.

- Backend: https://github.com/Minilaz-code/VadAllFate/tree/codex/v2-granular-i3
- Frontend: https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/tree/codex/v2-granular-i3

Backend implementation commit: `8263578d60162e2e1aab486fb7474124e3274e8f`.

## Files and authority boundary

New runtime components only:

- `src/vadallfate/runtime/granular/delta_contracts.py`: closed I3 PREPARED request profile and deterministic evidence-coherence checks. Reuses the existing locked frozen-schema verifier, jsonschema/referencing and JCS utility. No dependency added.
- `src/vadallfate/runtime/granular/staging_codec.py`: canonical bytes, bounded encode/decode, framed request fingerprint, explicit discriminator selection and independent recovery-context checks. No SQL, model calls, connection creation, transaction management, writer capability or production dispatch import.

New tests/fixtures:

- `tests/granular_i3_fixture.py`: original CC0 request recipe and disposable SQL admission/delivery harness. Fixture owner alone creates connections and commits/rolls back. Exclusive new-file creation rejects an existing path before opening it. Reopen/crash tests reopen only files created by their own test.
- `tests/test_granular_i3.py`: protocol/negative/boundary/legacy/growth/dispatch/replay/fault/process tests.
- `tests/fixtures/granular-i3/README.md` and `expected-summary.json`: rights and deterministic original fixture vectors; no complete world or database dump.

No adapter edit was necessary. Existing `contracts.py`, `staged_request_codec.py`, `commit_authority.py`, `store.py`, gateway, legacy codec fingerprints/bytes, migration dispatch and frozen normative schemas remain byte-identical to I2. There is no new registration or live import. I2 PreparedEntityDriver and its schema remain unchanged and disconnected. No existing Save is opened for conversion or modified. Antigravity's original checkouts, protected branches and CP149/CP150 are untouched.

## Exact request profile

The closed outer object has exactly `codec_ref`, `activation_state`, `module_binding`, `action`, `commit_request`, `result_evidence`. `codec_ref=I3.PREPARED.typed.v1`; activation is PREPARED only. Objects are checked against the locked normative shapes AND the narrower closed profile; the normative TypedPayload/PatchOperation extensibility is never treated as permission for arbitrary arguments.

Module binding is exact: `I3.PREPARED.npc.v1`, version 1.0.0, owner `I3.PREPARED.npc.owner.v1`, slices `I3.PREPARED.memory.v1` and `I3.PREPARED.relationship.v1`, validator `I3.PREPARED.validator.v1` version 1.0.0. These are fixture references, not production registrations. Target slice is determined unambiguously by the registered operation's target entity type. Header and SnapshotRef schemas are pinned to 0.1.0, patch/policy to 1.0.0; operation-schema refs have the exact I3.PREPARED operation name and v1 suffix. The ruleset is the exact I3.PREPARED/NO_MECHANICS fixture identity and version.

ActionEnvelope retains lineage, authenticated fixture principal reference, one character actor, source/mode, complete expected snapshot, timestamp, trace, header/ruleset and input HashRef. Its closed arguments are `intent_refs`, bounded `input_statement` and `source_event_ref`. CommitRequest retains the normative header, proposal refs, full validated_write_intents, required_validation_results, expected revision/ruleset/lineage/policy and commit_request_hash. Unknown fields/versions/owners/modules/operations are rejected. No arbitrary SQL, paths, opcodes, extra JSON blob or whole campaign fallback is accepted.

Each request contains 1-32 intents, one bounded operation per intent. Each full StatePatch is retained inside its WriteIntent; metadata/evidence duplication counts toward the cap. Targets and intent IDs must be unique; snapshot/revision/hash, target identity, owner, validators, causal action and result refs agree. Creation uses exact absent-target precondition plus creation_identity. Updates bind target_ref and expected target revision/hash. Target hashes use the I2 fixture row domain only; actual target-row/dependency validation remains I5.

| Allowed operation | Exact argument keys and bounds |
| --- | --- |
| npc.memory.record | owner_npc_id, actor_id, world_minute, causal_event_ref, origin_kind, witness_mode, is_secret, is_unverified, summary, source_ref. IDs <=160 UTF-8 bytes; minute integer 0..2^53-1; flags booleans; summary 1..2048 UTF-8 bytes. TOLD/TOLD requires unverified; WITNESSED allows SAW/HEARD. |
| relationship.adjust | owner_npc_id, target_actor_id, memory_ref, causal_event_ref, delta_trust, delta_affinity, note. IDs <=160 bytes; finite nonboolean deltas within +/-0.2; note 1..2048 bytes. |

Each argument object is also <=8,192 encoded bytes. Actor and causal event arguments must match the action. Cross-entity ownership, source authenticity, record existence/collisions and actual NPC observation semantics are not conferred by serialization: a real I5 validator must independently check them against authoritative state.

Result evidence is a closed array of at most four items, each with result_ref/task_ref/model_ref/input_hash/output_text/output_hash. Output is 1..4096 UTF-8 bytes, tied to the action input hash, validation binding and explicit result refs. This initial profile supports only an original scripted dialogue fixture labelled `ORIGINAL_SCRIPT_NOT_AI`; no AI provider or production model provenance is claimed. Recovery retains its exact output, does not call a model, and cannot fabricate evidence. RNG and unsupported result/task kinds are closed, not guessed.

Fixture input, patch, validation, commit and result evidence use distinct `vadallfate.i3.fixture.*.v1` domains. Checksums authenticate equality/coherence, not the trust of an untrusted worker. Validation PASS objects are fixture evidence, never self-authorising production ValidationResults. No I4 production state-root/snapshot profile or CommitReceipt is introduced.

## Byte protocol, discriminator and durable meaning

`encode(request) -> bytes` produces existing RFC8785/JCS canonical UTF-8 bytes. `decode(raw: bytes) -> dict` rejects malformed UTF-8, duplicate keys, nonfinite values, truncation, noncanonical bytes, wrong hashes or unsupported schema/profile. It returns a fresh object without aliases to the pinned byte value. The unchanged 65,536-byte limit applies to the ENTIRE frame, all metadata included, before admission insertion. No compression or evidence omission.

Staging fingerprint is SHA-256 of `b"VAF-I3-STAGED-v1\0" + raw`. Its frame/domain is distinct from legacy `_request_hash` and production snapshot hashes. Exact stored bytes and this digest must both agree during recovery. Deterministic golden ordinary request: 9,968 bytes; fingerprint `81383175b52ff16ca449adb6cb7c7a2f17277532429b30a19ea4fbe5d8c6c81a`.

`decode_staged(raw, result_codec_ref=None)` delegates historical NULL-discriminator bytes to the unchanged legacy decoder. `result_codec_ref=I3.PREPARED.typed.v1` selects typed decoding. Unknown non-NULL refs fail; NULL on typed bytes fails legacy shape checks. No sniffing or silent conversion. This dispatcher is new and isolated; the live legacy dispatcher is not modified.

The SQL harness uses a fresh fixture-only input_admissions representation with explicit `result_codec_ref` and logical Save identity. It stores the exact typed UTF-8 frame as a BLOB. The BLOB affinity and fixture Save column are test choices, not authorised production table changes: actual live TEXT/byte adaptation, Save binding and discriminator migration remain reviewed integration gates. No automatic schema installation or existing runtime DB migration is implemented.

`RecoveryContext` is an independent trusted fixture input containing campaign/Save/world, authenticated principal and actor, admitted action bytes, current snapshot/ruleset bytes, module availability, ordinal/head and dispatch token. `recover(...)` checks all of these plus explicit codec and saved fingerprint. A real implementation must obtain them from trusted records/session/profile, never derive them from worker bytes. The test harness additionally checks actual stored admission action, status, Save and dispatch/head; stage UPDATE uses checked dispatch/status/hash CAS. Exact duplicates return original bytes without rewriting. Conflicts under the same idempotency key fail.

The fixture's i3_recovery_deliveries table records delivery of exact recovered bytes once. It is NOT a campaign-state record, R1 CommitReceipt, competing canonical authority, or evidence that a typed gameplay action committed. The fixture admission remains PENDING: no fake canonical APPLIED transition. Closing/reopening and process-death tests demonstrate durable staging and exactly-once recovery delivery; real typed material commit and atomic world-state/ledger/receipt integration remain I5.

## Actual API demonstration

Run from the backend repository with its development Python environment (fixture helpers require pytest installed):

```python
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
sys.path.insert(0, 'tests')
import granular_i3_fixture as fixture
from vadallfate.runtime.granular import staging_codec as codec

wire = fixture.request()
context = fixture.context(wire)  # Test bootstrap, NOT live authentication.
raw = codec.encode(wire)
assert len(raw) == 9968
with TemporaryDirectory() as directory:
    db = fixture.fresh(Path(directory) / 'new-i3.sqlite')
    try:
        fixture.admit(db, wire, context)
        db.commit()  # Disposable fixture owner only.
        fixture.stage(db, wire, context)
        db.commit()
        assert fixture.deliver(db, context) == wire
        db.commit()
        assert fixture.deliver(db, context) == wire  # Same delivery, no second effect.
        assert db.execute('SELECT count(*) FROM i3_recovery_deliveries').fetchone() == (1,)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
```

## Measurements and acceptance

- PASS: final combined I3/I2/preparation/R1/recovery/JCS suite **204 passed in 51.47s**, including **79 I3 cases** and all **38 I2 cases**.
- PASS: full final-tree backend suite **709 passed, 2 skipped in 772.44s (12m52s)**. No existing test was altered.
- PASS: privacy/content audit of ten backend and three frontend changed files. Only original code/tests/fixture metadata/docs; no restricted content, credentials, private paths, binaries, SQLite files or generated packs.
- PASS: original review and 29-case map byte-identical; I2 driver/schema, all existing runtime/legacy adapters and frozen schemas unchanged; Antigravity checkouts clean; whitespace checks clean.
- Frontend source/dependencies unchanged; no frontend/gameplay or real AI PASS claimed.

Measured fresh disposable SQLite logical page sizes (not total WAL bytes, production Save growth or normalized runtime performance):

| Original fixture growth | SQLite page bytes | Complete request bytes |
| --- | ---: | ---: |
| Small admission | 49,152 | 9,968 |
| +100 unrelated NPC rows | 57,344 | 9,968 |
| 1,000 unrelated NPCs +10,000 unrelated memory rows | 5,218,304 | 9,968 |

These unrelated original rows are inert test data, not active granular NPCs. Request preparation has no campaign/document input or hydration path; they cannot enter the frame. Recovery after growth returns the same bytes and fingerprint. This is a capacity/isolation proof for encoding only, not an operational long-campaign throughput result.

| I3 acceptance requirement | Actual fixture evidence |
| --- | --- |
| Closed normative typed request | Locked shapes, exact field/operation/module/owner/version checks, malformed/unknown-value negatives. |
| Exact byte ceiling | Seventeen valid memory intents construct 65,536-byte acceptance and 65,537-byte rejection. Required hashes/result/validation evidence retained. Rejection inserts no admission; later valid action succeeds. |
| Durable staging | Real SQLite WAL file, staged bytes/fingerprint/codec, full close/reopen and separate clean Python-process recovery. |
| Staging interruption | Injected rollback and abrupt os._exit before/after commit; uncommitted staging disappears, committed staging survives. Retry recovers identical meaning. |
| Dispatch and identity fence | Principal/actor/campaign/Save/world, action, valid-but-stale snapshot, ruleset/module availability, actual admission status/token/head and changed token rejected. |
| Corruption | Invalid UTF-8, truncation, duplicate keys, noncanonical frames, nonfinite values, modified output/hash and corrupt persisted codec/payload/fingerprint fail without a delivery. |
| Duplicate/conflicting replay | One durable delivery record for repeats; staged conflict or conflicting replay under same idempotency key rejected; duplicates do not rewrite staged bytes. |
| Legacy compatibility | Original proof bytes round-trip unchanged, legacy `_request_hash` remains equal; existing real CommitAuthority recovery/idempotency tests retain their canonical commit proof. |
| Physical isolation | I2 driver unchanged/disconnected; no runtime schema installation, active format, new registration, migration, live writer or canonical typed transaction. |
| Existing matrix | G01-G29 and review/map byte-identical. I3 maps to G06/G07/G10/G11/G14/G15 portions; full canonical acceptance remains held. |

Reproduction (Windows PowerShell, backend root):

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_granular_i3.py tests/test_granular_i2.py tests/test_granular_readiness.py tests/test_v2_commit_recovery.py tests/test_typed_fixture_commit_authority.py tests/test_jcs_hash.py
.venv/Scripts/python.exe -m pytest -q -o addopts=''
git diff --check
```

Frontend executable source/dependencies remain unchanged. No Edge/gameplay or real AI PASS is claimed for this disabled protocol. Source-combat and private-secret model inference holds remain. Existing Saves, production data, CP149/CP150 and original Antigravity checkouts are preserved.

## Review, integration and exact next gate

Antigravity can fetch the two I3 review branches or cherry-pick reviewed commits into a development branch. Nothing should be activated, installed into an existing Save or wired to live CommitAuthority. Legacy V2 operation remains native and unchanged. Typed gameplay persistence is **NOT IMPLEMENTED/NOT AUTHORISED**. The existing live monolithic campaign-request growth limit is not fixed by this disabled codec; actual granular gameplay writes require I4/I5 integration approvals.

Stop after I3. Next separate approval is **I4 production hash/revision/snapshot specification and disabled fixture implementation**, with exact canonical field coverage, numeric/Unicode rules, authenticated-root node framing, touched-path/full-rebuild agreement, world/evidence/head ownership, Save-bound snapshot identity and legacy profile distinction. Do not activate it or edit frozen SnapshotRef semantics implicitly. The planned isolated unit is runtime/granular/hash_profile.py plus versioned vectors and disposable hash/head fixtures; production dispatch/schema/head/receipt modifications require separately named approval.

**I5 is also independently gated**: complete state/dependency validation and one real CommitAuthority atomic transaction covering typed rows, roots, head, admission, ledger/events/outbox/idempotency/receipt. It must review trusted session/module mounts, real RuntimeEvent observation semantics, exact relationship-memory provenance links and live typed discriminator/TEXT storage mapping. I3 checksums/fixture PASS do not grant those capabilities. I6 live format negotiation and I8 Save conversion remain separately unapproved.
