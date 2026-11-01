# I7R fixture remediation: exact contracts and approval boundaries

2026-11-01. PREPARED, disabled, disposable original fixtures only. **I7 remains INCOMPLETE; I8 remains held.** Option C, one existing R1 SQLite authority, native legacy readers and bounded typed deltas remain the target. This document does not amend normative contracts.

## B: implemented diagnostic protocol

`runtime/granular/checkpoint_prototype.py` is connection-bound. It never opens, commits or rolls back a connection. Nothing imports/registers it in normal startup, gameplay, source packs, the gateway or the authority dispatcher. `tests/granular_i7r_fixture.py` temporarily instruments the existing fixture operation map in an isolated test process and restores it in `finally`. This is not a concurrent production extension API.

Only a newly created, exclusively owned I5 disposable file at revision zero can install `p7r_binding`, `p7r_transition`, `p7r_checkpoint`. These operational tables do not replace canonical records, existing audit rows or I4 trees. Every insert uses the existing injected authority transaction. The native commit runs first; a signed transition is inserted before that SAME transaction commits. Failure after insertion rolls back canonical state, native evidence and prototype metadata together. A retry verifies the existing transition instead of duplicating it.

| Object | Exact binding and construction |
| --- | --- |
| External `Trust` | Campaign, logical Save, fresh realm, fixture cookie, 32-byte host-only key and externally pinned checkpoint ID. Key is never stored in SQLite or passed to a model/client. |
| Version map | I5 codec, mount, I4 hash profile, verification profile, mount descriptor hash, exact content pins, SHA256 identities of checkpoint/authority contracts/validation/storage/delta/staging/hash/JCS implementations. Computed once per process; code cannot hot-reload while retaining trust. |
| Signature | HMAC-SHA256(key, `VAF-I7R-PREFIX-v1\0` + kind + `\0` + existing JCS(payload)). Kinds separate transition/checkpoint/review/fork-plan domains. Metadata is strict canonical JSON, at most 65,536 UTF-8 bytes when verified. |
| Transition | Profile `I7R.PREPARED.prefix.v1`, realm/campaign/Save/versions, exact before/after I4 snapshots, revision, idempotency key, resulting record hashes, observer/actor dependency hashes and immutable native evidence digest. Row campaign/revision must match signed body. |
| Evidence digest | SHA256(`VAF-I7R-EVIDENCE-v1\0` + JCS(exact receipt, admission including raw staged bytes/dispatch, retained approval, ledger, proof, ordered applied patches, event, event-chain row, immutable outbox columns and ordered relationship evidence)). Combined string values are bounded at 1 MiB. Delivery flags/counters and session revocation are operational, excluded as in I5. |
| Checkpoint | Exact native full-audit snapshot, record/event counts, FULL_AUDIT_COMPLETE, all scope/version fields. ID is SHA256(signature bytes); row ID/campaign/revision must match signed payload. Minted only by the closed fixture wrapper after the real full audit AND full metadata verification in the SAME transaction. No caller-supplied PASS route. |

`verify_prefix` requires an authenticated DM fixture session, the exact expected current snapshot and an externally pinned checkpoint ID. It rejects a stale anchor if a newer trusted checkpoint exists, incorrect key/realm/Save/version, substituted ID/revision, truncated or unordered transition sequence, corrupt suffix evidence, stale current snapshot, touched-record/dependency corruption and I4 path mismatch. Suffix budget is an exact integer 0..1,000, default 100. It reconstructs before/after lineage from anchor to current head and checks the final canonical hashes of touched records and dependencies against existing I4 paths. Native action validation still checks every intermediate action and resulting root before issuing its signed stamp.

Results distinguish:

- `FULL_AUDIT_COMPLETE`: independent native source/tree/event/receipt reconstruction; prototype `full_integrity` additionally scans every signed transition/checkpoint. Read-only reporting grants no write eligibility.
- `CHECKPOINT_PREFIX_VERIFIED`: trusted historical anchor plus verified bounded suffix; `full_world_audited_now=false`, `write_eligibility_granted=false`.
- Existing `BOUNDED_PATH_CHECKED`: limited authenticated record/path projection, not a full world audit.
- `NOT_FULLY_AUDITED`: caller must use this conceptual disposition when there is no applicable full result; no prefix failure is promoted to PASS.

### Trust and corruption boundary

An anchor attests what the trusted host fully audited at that historical point. It does **not** prove that old untouched SQLite rows are still intact now. Later corruption of canonical rows, historical receipts or old metadata below the anchor may evade a suffix-only check. Tests deliberately demonstrate this blind spot and show full native/metadata verification rejecting the damage. The prefix therefore **cannot replace the mandatory 100-revision, reopen or checkpoint audit under this approval**. No old `g_i5_audits` marker is refreshed by diagnostic verification. Existing native full-audit operations retain their original behavior.

The key and expected anchor must be trusted outside the database. A database-only attacker cannot mint signatures; a host attacker stealing the key can. A complete old file rollback is detectable only when the trusted caller retains a newer expected head/anchor; losing that external state loses this guarantee. This prototype is not protection against arbitrary host filesystem compromise. Key loss, implementation/version change or missing metadata requires stopping and a separately reviewed re-audit/re-enrollment policy, never silently accepting stored labels. The fixture's private credential/key files are local testing artifacts, not production key management.

Windows process tests cover abrupt exit after stamping before COMMIT and after COMMIT before acknowledgement. On reopen, the normal mandatory independent audit remains. A newer anchor may be pinned only after that successful trusted operation; exact-once retry cannot mint a second receipt/stamp. Controlled failures cover checkpoint creation rollback and bad native candidates cannot obtain a stamp.

### Performance recommendation

Keep the **existing production/full-audit eligibility policy**. Reject this prefix as a replacement for present-tense whole-database integrity. It is useful as a clearly labelled diagnostic and as evidence for a future separately reviewed design with explicit corruption window, trusted key/anchor persistence and periodic independent scans. Bounded suffix work is O(suffix evidence + distinct touched record paths), but stored stamps grow O(actions), full metadata verification is O(total history); native full audit is at least linear and includes source sorting/tree rebuild (O(N log N)) and indexed SQL/receipt checks. Full scans every 100 actions still create cumulative history cost. No new production throughput SLA or full capacity fix is claimed.

The only existing runtime-file change is an equivalent JCS validation fast path: native ASCII `str` cannot contain surrogates, so it avoids the Python character loop. Non-ASCII and every `str` subclass retain the previous surrogate check. Canonical bytes, hash domains and I4 meanings are unchanged. A standalone test checks every BMP code point against the existing encoder, supplementary Unicode and a deceptive subclass. Original I7 roots are compared at common measured revisions. This independent optimization does not rely on prefix trust.

## A: implemented read-only proposal; canonical fork is held

`offline_review.fork_plan` requires a DM fixture session, exact owned scope, independent native read-only full audit and no PENDING admissions. It streams a length-framed SHA256 manifest over exact canonical/native histories, bindings, pins, genesis, receipts and immutable outbox payloads. It signs the parent snapshot/manifest/version map and a **candidate** child I4 snapshot. Same content/evidence roots with a new logical Save produce a different snapshot identity under the existing pure I4 function. It changes no row and creates no canonical child Save.

The independent `ChildInspectionRealm` generates a fresh key/token scoped to child Save and parent snapshot. Its demo login rejects the actual parent fixture credential and wrong child identity. This authorizes only offline inspection; neither existing FixtureSession nor V2 authentication accepts it. It is not proof of real canonical branching or divergent child commits. Existing I7 physical-copy divergence evidence is retained with its copied-credential caveat.

### Exact proposed authority fork boundary (NOT IMPLEMENTED)

Review unit **FORK-1** must approve all of the following together:

1. A versioned authority-owned fork operation with authenticated parent DM, exact `SnapshotRef`, new child Save/realm, explicit idempotency key, exact content pins and parent full-audit/manifest references. Hold pending admissions first; never transfer unreviewed pending work.
2. An immutable lineage segment: `{version, parent_save, parent_snapshot, parent_manifest, inherited_content_root, inherited_evidence_root, inherited_revision, child_save, child_auth_realm, fork_operation_id}`. Native parent events/receipts retain their exact original Save-scoped bytes. They are inherited historical evidence, not child-issued receipts. The child begins a new segment with an authority-issued fork boundary receipt/event; revision mapping and event-chain linkage must be explicitly versioned.
3. Proposed revision rule: inherited world/entity revisions are retained; the fork boundary creates child global revision `parent_revision + 1` without incrementing unchanged entity revisions. Its new event extends the inherited evidence root; the child snapshot uses new Save identity and that evidence root. The offline candidate snapshot describes pre-boundary identity only and must never be installed as a claimed committed child head.
4. Subsequent child actions use only child snapshots, session realm, admissions and idempotency namespace. Parent tokens are rejected even at identical content. Parent requests fail against child Save and child requests fail against parent. Source definitions remain pack-owned; exact pins are inherited, not duplicated source bodies.
5. One authority-controlled target-file transaction installs the inherited immutable segment reference/verified copied bytes, boundary, child credential verifiers and head. Parent is read-only, locked to an exact audited snapshot. Cross-file atomicity is not assumed: a durable export manifest plus target transaction makes retry deterministic; failure before target commit leaves no usable child, failure after commit returns the same fork receipt. No writable parent/child authority overlap or UUID surgery.
6. New independent child credentials are provisioned through the approved real auth/session service and never copied from the parent's tables. Historical principal references remain historical; they confer no child session authority. Export must separately define secret revocation/redaction and dependency closure.

Existing physical keys are `idempotency_receipts PRIMARY KEY(campaign_id,idempotency_key)` and `input_admissions PRIMARY KEY(campaign_id,ordinal)` with campaign-scoped action/key uniqueness; none includes logical Save identity. A real fork must explicitly distinguish inherited parent-segment receipts/admissions from child-local lookup and collision rules. A versioned segment-aware namespace/index (or separately reviewed replacement schema) is required; old receipt bytes and keys cannot be rewritten. Do not treat the proposed child namespace as already supported. Exact SQL/codec drafts must be reviewed before implementing this extension.

Required normative review surfaces: I4 snapshot/revision and evidence-chain segment semantics; I5 genesis/audit invariants currently requiring one Save identity throughout a receipt chain; CommitRequest/Receipt representation of fork boundary; idempotency and input admission Save scoping; Save branching/export ownership and real authentication realm provisioning; additive versioned lineage schema and recovery discriminators. Existing `runtime/store.py`, authority live dispatch and schemas remain unchanged here. Exact SQL/codec modifications must be approved in that separate unit before implementation. Rollback is discard of a newly created disposable child, never rewriting parent history. Portable export and production conversion remain I8 gates.

## C: implemented authenticated offline HOLD; lifecycle is held

`offline_review.hold` authenticates DM ownership even if the required mount/codec is unavailable. It reads explicit admission fields and casts staged TEXT to BLOB to retain damaged invalid UTF-8 exactly. The signed review contains exact original bytes (base64), their SHA256, original fingerprint, admission/action/idempotency/dispatch identity and attempts, retained approval, current snapshot, reviewer and classification. Damaged bytes above 65,536 remain in place with a hard hold requiring future streamed quarantine; no trimming. Raw reviews and credentials remain local, never in public evidence.

Classification priority: stale expected snapshot -> `STALE_INPUT`; unavailable codec -> `MISSING_CODEC`; unavailable module -> `MISSING_MODULE`; malformed bytes under available dependencies -> `CORRUPT_PAYLOAD`; supplied bytes differing from observed retained approval -> `UNTRUSTED_REPLACEMENT`. Equality with a retained approval is **not** independently authenticated provenance; it still authorizes nothing. `verify_review` binds exact damaged digest/scope/signature. Public evidence reports classification/hashes/counts only. No SQL write, queue disposition, replay, new model call, APPLIED receipt or staged overwrite occurs.

### Exact proposed disposition boundary (NOT IMPLEMENTED)

Review unit **ADMISSION-REPAIR-1** must approve:

1. Append-only versioned operator-review records keyed by campaign/Save/admission ordinal and original action/idempotency identity. Store damaged raw bytes, original stored hash/codec/module/dispatch, reviewer, reason, independent provenance reference and before-state fingerprint. The authenticated reviewer cannot authorize a different gameplay result merely by replacing a hash.
2. Compare-and-swap the exact pending identity/status/current snapshot/raw bytes/dispatch before disposition. A changed head or admission invalidates approval. Never mutate the original evidence. All repair generations have immutable bytes and provenance; dispatch/recovery must select an explicitly approved generation and retain the damaged predecessor.
3. Missing codec/module may resume only with the exact pinned implementation and originally authenticated staged result after complete normal validation. Corrupt/replacement bytes require an independently authenticated original result, or explicit terminal quarantine; no regenerated AI result may masquerade as the old one. A different intentional action is a new admission with its own authority validation.
4. Proposed terminal `REVIEWED_QUARANTINED` disposition is **not** APPLIED, has no canonical material receipt, and must have a new signed/authority-recorded disposition event. Review its queue advancement and exactly-once/recovery rules. Current PENDING/APPLIED/STALE lifecycle does not authorize this status. Stale input retains current semantics; corruption at the current snapshot must not be mislabeled stale.
5. Crash tests at review creation, CAS, generation selection and queue advancement; replay of the exact disposition returns its own evidence without issuing a material commit. Failures before atomic disposition leave PENDING and evidence intact. Security tests deny players, stale reviewer capabilities, cross-Save review, substituted dispatch, copied approvals and forged provenance.

Existing legacy `CommitAuthority.discard_invalid_admission` maps invalid legacy worker results to STALE. Its fixture guard refuses prepared granular use. I7R neither changes that legacy behavior nor calls it to clear a corrupt granular head; doing so would defeat the required classification distinction.

Required normative review surfaces: input admission status constraints and queue selection, staged codec/version/generation discriminator, authority-only disposition transaction/receipt types, recovery dispatch and operator authentication. None is modified by I7R. A second authority, direct SQLite repair script or automatic queue skipping is explicitly excluded.

## Remaining owner coverage and next decision

The I6 field inventory and original G01-G29 dispositions remain authoritative. Clock progression, dynamic NPC creation, quests/objectives, inventory/combat, routines/goals, complete campaign configuration/notes/homebrew and full live pack/session adapters are not covered by the narrow immutable-NPC/memory/relationship fixture slice. Continue owner/schema/validator/adapter design separately; do not treat original fixture memories as a full cognition system. Source-combat and private-secret reasoning holds persist.

Request separate explicit approval for FORK-1 and/or ADMISSION-REPAIR-1 before implementing either boundary. Any production prefix eligibility change requires a third explicit integrity-policy approval and stronger present-tense corruption guarantees. **No I8, production Save opening/conversion, normal granular gameplay or frozen-contract edit is authorized by this handoff.**


## Exact protected review surfaces

Paths below are relative to `src/vadallfate/runtime/`; they identify review targets, not implemented edits.

| Approval unit | Concrete files/functions and required review |
| --- | --- |
| FORK-1 lineage | `granular/authority_storage.py::audit,verify_receipt` currently require revision-zero genesis and one Save throughout the chain. `granular/hash_profile.py` snapshot/evidence/revision rules need an explicitly versioned fork-segment extension, preserving existing I4 domains. `granular/authority_contracts.py` and `granular/authority_integration.py` require a closed, authenticated authority-owned fork boundary. New versioned SQL must be separately reviewed; do not retrofit existing `authority_core_v1.sql` or entity-core constraints. |
| FORK-1 real identity | `v2_campaign_gateway.py::SessionAuthRegistry` currently signs campaign-scoped sessions; `game_campaigns.py` owns Save branching. Review child realm provisioning, parent credential rejection, lineage-aware receipt lookup and independent restart. No child-inspection demo token is usable here. |
| ADMISSION-REPAIR-1 | `store.py` input_admissions status CHECK currently permits only PENDING/APPLIED/STALE; `_ensure_input_dispatch_columns` is existing migration dispatch. `commit_authority.py::dispatch_head,stage_worker_result,recovery_head,recover_staged_request,discard_invalid_admission,discard_stale_admission` and granular `authority_integration.py::admission,recover,discard_stale` require reviewed disposition/generation/CAS semantics. Existing `input_admission.py` arrival ordering and material receipt meanings must remain. |
| ADMISSION-REPAIR-1 codec/auth | `staged_request_codec.py`, granular `staging_codec.py` and `authority_contracts.py` need exact versioned generation dispatch only if approved; preserve old exact bytes and codec readers. Operator authorization must bind real session/Save scope in `v2_campaign_gateway.py`, not accept caller labels. New disposition evidence cannot masquerade as an existing material CommitReceipt. |
| Production audit policy | `granular/authority_storage.py::audit` and `granular/authority_validation.py` audit-age gate, existing `g_i5_audits`, reopen/checkpoint policy and production key/anchor ownership require separate approval. The I7R diagnostic tables are not an approved new eligibility source. |
| Production conversion / I8 | Any `store.py` migration/startup dispatch, production registrations, full owner adapters and existing Save conversion remain outside I7R and require explicit I8/schema/authority review. |
