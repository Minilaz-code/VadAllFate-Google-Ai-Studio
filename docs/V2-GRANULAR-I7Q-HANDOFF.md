# I7Q / ADMISSION-REPAIR-1 durable operator recovery

2026-11-02. **Original disposable PREPARED fixtures only. Production activation, I8, installed legacy constraints/startup, full-audit eligibility and hash domains remain held.** Branch `codex/v2-granular-i7q` follows the separately reviewable FORK-1 increment. Backend FORK-1 `afbeb614b676e83335e766e6bcaf5dbc06131468`, frontend `abb873ff3cd756e246ca61e3a8f046240456011d`; their approved I7R baselines are recorded in the F handoff. Final Q SHAs are in the delivery response; verify `git ls-remote origin refs/heads/codex/v2-granular-i7q`.

## Implemented contract

This disposes of a real blocked granular admission through the **existing R1 CommitAuthority**, restarts and continues the queue. `AdministrativeDisposition` is a distinct immutable result type: `gameplay_receipt_issued=false`, `write_eligibility_granted=false`. Quarantine does not create a material CommitReceipt, world RuntimeEvent, ledger transaction, world revision or invented gameplay consequence.

`queue_v1.sql` installs only on a newly created original fixture, at revision zero, under an explicit private installation capability. It creates versioned `g_q_admissions`, approvals, receipts, independently authenticated original results, append-only reviews/dispositions/repair generations and an active-generation pointer/view. **The installed v1 input_admissions CHECK and earlier SQL files are unchanged.** Legacy `discard_invalid_admission` retains its original behavior; prepared fixture calls to that legacy route remain fenced.

The connection-bound queue port routes existing I5 admission/validation/staging/commit/recover/verifier functions to these new tables. The view selects the explicitly approved generation; native status/dispatch writes go to the physical versioned admission. It does not overwrite the original damaged result bytes/hash/codec. Typed entities/events/ledger/proofs/outbox/head remain the original sole-authority tables. There is no second database, writer capability, alternate material commit engine or normal gateway endpoint.

## Authentication and provenance

At actual DM-authorised admission, after the existing independent validator has accepted the complete original fixture candidate, the authority signs a closed original-result body. HMAC-SHA256 uses a separately provisioned 32-byte host key held in the private fixture ticket, not SQLite/model input. SQLite contains its verifier and signed evidence. The body binds protocol, exact Save/realm/campaign/ordinal/action/key/snapshot, codec/mount/pins, implementation SHA256 identities and exact canonical raw bytes/fingerprint.

This is the original fully DM-approved scripted fixture mode, **not AI generation or regeneration**. A stored approval row, matching plausible hash, schema-valid object or model valid=true is never enough to repair: the operator must present `ResultEvidence` with its valid original host signature and exact independently authenticated identity. Stage/commit/recover also check this evidence, and active repair generations require a valid administrative approval. Native independent complete action/source/pin/dependency/target validation still runs before material writes.

This trust boundary protects against forged database evidence without the external host key. It does not protect against host filesystem compromise or complete rollback of the database AND externally trusted state. Plaintext test tickets are not production key management. Missing/changed implementation hashes fail closed; there is no automatic re-signing or version promotion.

## Review and exact CAS

`q.review` authenticates the actual Save-bound fixture DM and captures current snapshot, reviewer principal/session, admission/action/key, original stored fingerprint, codec, dispatch token/attempts, original damaged BLOB bytes and selected generation. Invalid UTF-8 is retained exactly by BLOB reads; NULL and empty are distinguished. It signs a deterministic review identity and digest. Read-only archive bodies are bounded; oversized damage remains held for a future streamed archive design rather than trimmed/discarded.

Classifications are explicit:

| Classification | Meaning / allowed resolution |
| --- | --- |
| STALE_INPUT | Original action snapshot differs; never reinterpret/rebase it as current. Operator can explicitly quarantine it. |
| MISSING_CODEC | Original required staged codec is unavailable; only the original signed bytes and exact pinned decoder may resume. |
| MISSING_MODULE | Trusted original module is unavailable; restore only the exact descriptor/pins/implementation, then perform full revalidation. |
| CORRUPT_PAYLOAD | Retain damage; require independently authenticated original replacement or explicit terminal quarantine. |
| UNTRUSTED_REPLACEMENT | Plausible schema/hash/observed approval is insufficient; signed original provenance is required. |

An additional VALID_RETAINED_INPUT classification supports explicit review of healthy pending work; it does not auto-discard anything.

`q.quarantine` /`q.repair` require the exact signed review digest and SAME authenticated operator session. In one existing authority BEGIN IMMEDIATE transaction, recheck pending head, all captured identity/dispatch/status/bytes/generation fields and exact current snapshot. Quarantine additionally compares original BLOB/hash/dispatch in its actual UPDATE. A changed snapshot, token, attempts, action/key or bytes invalidates approval. No queue splitting, status=STALE disguise or silent replacement occurs.

Successful quarantine sets only the new versioned `REVIEWED_QUARANTINED` status and appends its own signed administrative disposition. Next PENDING input becomes head atomically. The quarantined identity/reservation cannot be readmitted. Repeated requests return the exact same disposition; a changed operation/evidence under that review conflicts.

Successful repair creates an independently identified immutable generation with exact authenticated original bytes/fingerprint/codec, links it to the review/disposition and advances only the active pointer. It leaves the original damaged row intact and PENDING until a normal fully validated R1 gameplay commit. Multiple repairs retain prior damaged generations and signed forensic captures. Retired corruption is accepted as retained damage only when a later authenticated disposition covers those exact bytes/metadata; active corrupt or unapproved generations cannot authorize a commit.

SQL guards prohibit normal update/delete of result/review/disposition/generation history. Full audit verifies signatures, original-result coverage, row identities, active approval, generation continuity and quarantine evidence in addition to the unchanged complete native world/receipt audit. Deliberate corruption injections in tests are exclusively on newly created test files and explicitly remove a guard when simulating damage to an immutable row.

## Restart and missing implementation handling

Normal `queue_fixture.reopen` still requires the complete independent full audit before returning a gameplay-capable authority. It fails if the module is unavailable or integrity is bad. No prefix or cached PASS substitutes for this.

The separately named `open_operator` is a **recovery-only administrative handle**, not a successful gameplay reopen. Read-only ticket/key/profile checks precede opening its authority. It denies context/dispatch/stage/commit/project and checkpoint gameplay access; only signed review/disposition/evidence, bounded metadata and full-audit/restore operations are permitted. Administrative receipts grant no gameplay eligibility.

`q.restore_module` can enable only the original exact descriptor/pins; it cannot install arbitrary code or change versions. It performs the complete native plus queue metadata audit in the same authority transaction. Only after that transaction commits does the existing authority clear recovery-only mode. An unavailable Python implementation must be restored outside this test protocol at its exact pinned version; the helper does not download code or invent a decoder.

## Atomicity and actual tests

Actual abrupt `os._exit` tests cover review insertion before COMMIT, repair-generation insertion, status/pointer CAS, disposition insertion, before COMMIT and durable acknowledgement loss for both repair/quarantine. Before COMMIT, pending bytes/status and queue position survive and no disposition/generation leaks. After COMMIT, retry returns the same administrative record. Restored gameplay commits still use native receipt idempotency; there is never a duplicated memory/relationship consequence.

Tests additionally cover malformed UTF-8, NULL/empty evidence handling inherited from I7R, all five classifications, stale review/root, changed dispatch/hash/attempts/action/key/bytes, different valid DM ownership, players/NPCs, cross-Save credentials/evidence, forged review signatures and repair generations, bad module pins, legacy namespace preservation and quarantined nonce reuse denial.

The actual standalone proof is backend `docs/evidence/V2-GRANULAR-I7Q-PROOF.json`. Three fresh workflows (invalid-byte quarantine, unavailable-codec repair, unavailable-module operator restart) each produce one legitimate subsequent gameplay receipt at revision 1 and exact restart/replay, with administrative records distinct and original damage retained. Local private artifacts contain actual tickets, signed original result and review data; public evidence is numerical/hash metadata only.

## Actual API

```python
from vadallfate.runtime.granular import queue_fixture

ticket, store, authority, sessions = queue_fixture.create("i5-disposable-queue.sqlite")
# Native I5 admit/dispatch/stage creates a pending original fixture action.
review = authority.granular_fixture("q.review", campaign="campaign.original",
    ordinal=0, session=sessions["DM"])
disposition = authority.granular_fixture("q.quarantine", campaign="campaign.original",
    review_id=review.review_id, review_digest=review.digest, session=sessions["DM"])
assert not disposition.gameplay_receipt_issued
store.close()
store, authority = queue_fixture.reopen(ticket)  # mandatory FULL audit
store.close()
```

For repair, obtain the original `q.evidence` through the authenticated DM and pass its `ResultEvidence` as `evidence=` to `q.repair` with the same review/digest. A normal `recover` /`commit` then uses the selected bytes. See actual tests for executable full workflows; no manual SQL repair is part of the API.

```powershell
python -m pytest -q -o addopts='' tests/test_granular_i7q.py tests/test_granular_i7f.py
python tools/granular_i7q_proof.py --output <new-original-numerical-report.json>
```

## Compatibility and remaining limits

Q is a separate fresh-fixture profile and is not currently composed with the two-segment F profile. Ambiguous simultaneous mode flags are refused. A profile supporting repair inside a forked child and nested forks requires an explicit combined segment/queue adapter and new tests; neither standalone PASS implies that composition. No old Save is converted or opened for repair. Corruption of already committed history/authentication anchors and oversized archives remains a hard hold, not a licence to edit receipts.

I6 typed owner coverage remains binding; full-world/game auth/export/migration and the ~205-second native audit cost remain unresolved. Source combat/private-secret generative reasoning remain held. Original I7R 10,000-action evidence and goldens are preserved; that endurance workload is not rerun. Final suites, hashes, privacy and publication checks are in the consolidated readiness/verification update.


## Final verification — 2026-11-02

- Targeted I2–I7R, FORK-1, queue recovery, R1 and JCS: **435 passed in 521.53s (8m41s)**.
- Final broad backend after all implementation changes: **940 passed, 2 skipped in 1163.86s (19m23s)**. The original environment skips remain private-source opt-in and unavailable Windows symlink privilege.
- Frontend: **157 passed**, TypeScript check and Vite production build passed. Existing native-config/large-chunk warnings remain; executable frontend/production authentication code is unchanged.
- Both standalone original-content resolver-free runtime proofs passed: actual independent child commits/reopen and actual blocked queue quarantine/repair/continuation/reopen. F tests include nine genuine process-death windows; Q tests include ten. No new real-AI, normal Edge gameplay or production-security PASS is claimed.
- Accepted I7R numerical evidence, earlier SQL/goldens, all original G01–G29 fields, production startup/legacy semantics and unsupported I6 owners are preserved. The 10,000-action workload was **not rerun**.

Backend proof/verification artifacts: `docs/evidence/V2-GRANULAR-I7F-PROOF.json`, `V2-GRANULAR-I7Q-PROOF.json`, `V2-GRANULAR-I7-FQ-VERIFICATION.json`. Final branch SHAs are in the delivery response and verified remote refs. The Q branch follows the published F increment; review F separately, then the F-to-Q diff. F/Q composition and nested/multi-campaign forks are not claimed; production integrity cost, full typed-owner coverage and I8/live activation remain held.

Exact verified implementation and paired documentation SHAs: [publication record](V2-GRANULAR-I7-FQ-PUBLICATION.md).
