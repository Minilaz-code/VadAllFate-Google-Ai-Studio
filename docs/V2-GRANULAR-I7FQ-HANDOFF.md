# I7FQ — combined fork and queue recovery

2026-11-02. **Disabled original disposable fixtures only.** This is first-slice composition evidence, not overall I7 or production readiness. I8, production writes and existing Save conversion remain held. Review branch in both repositories: `codex/v2-granular-i7fq`.

Approved backend base: `77f4897551fb8958a6f4d2663bbb9ca54e27ad96`; frontend base: `b2979965a2262d36d21a2d170df99deeaad77ae3`. Both are the published I7Q branches and include I7F through normal ancestry. Independent F/Q handoffs, all prior numerical artifacts and original G01–G29 definitions are preserved. Exact published heads are recorded in the delivery and verified remote refs.

## Contract and ownership

`I7FQ.PREPARED.composition.v1` has one identity-token capability, separate from the standalone F and Q flags. Ambiguous combinations fail before acquiring the writer. A signed singleton `g_fq_profile` binds the exact adapter versions, Save identity, realm, segment kind and child lineage anchor. It is explicit fixture bootstrap metadata; it is not another campaign head or authority.

The parent uses the existing native R1 queue. The existing FORK-1 snapshot copy, signed export, independent credentials, inherited-row guards, boundary event/receipt and atomic non-replacing publication remain. Inside that same R1 boundary transaction, the combined adapter installs the existing new Q tables for the child realm and seals its combined binding. No child can be published with only half of this installation committed. The child uses `g_q_admissions`, Q approvals, original-result authentication, immutable generations/dispositions and its own receipts. Unused F child queue tables remain empty compatibility schema; they do not form another active queue or head. Parent Q administration is explicitly refused in this version.

One existing `CommitAuthority.granular_fixture` guard selects the combined adapter. Existing I5 admission, validation, staging, material commit, recovery and receipt verification are reused; there is no competing commit engine, connection opener or transaction lifecycle in the connection-bound adapter. All gameplay changes, hashes, revisions, events, ledger, outbox and receipts still occur in R1's single atomic transaction. Only fresh factory-created files accept bootstrap. `q.install` is absent from the combined callable operations.

Repair retains the physical damaged staged bytes and selects a separately authenticated immutable generation. Quarantine records a terminal administrative disposition, advances the queue once, and creates no gameplay receipt/event/revision/ledger entry. Neither operation grants full-audit eligibility. Recovery-only handles deny gameplay until the real independent full audit transaction succeeds. Standalone F/Q lifecycle helpers refuse a combined database, preventing profile downgrade through those APIs.

## Full independent audit

The composed audit reconstructs original source entities and derived caches, checks the complete event chain, verifies inherited native receipts, the explicit fork boundary/lineage/inherited-row index and child-local receipts through the effective Q generation view. It also verifies signed original results, operator reviews, administrative dispositions, generation continuity and quarantine coverage. Terminal repaired/quarantined physical damage and admission metadata must still match the exact authenticated review capture; later unreviewed alteration is rejected. The existing audit marker is durable only when all phases succeed in the same transaction. Mandatory reopen/checkpoint and 100-revision full-audit eligibility remain unchanged. The I7R prefix is never substituted.

## Files and surgical reuse

- New `src/vadallfate/runtime/granular/fork_queue_runtime.py`: versioned binding, boundary composition, segment/queue routing and full-audit composition on the injected connection.
- New `fork_queue_fixture.py`: explicit fresh fixture create/fork/reopen and recovery-only operator lifecycle; private tickets remain local.
- `commit_authority.py`: only the existing fixture dispatch method gains the explicit combined guard and post-audit recovery-mode reset. Legacy authority methods are unchanged.
- `fork_fixture.py`: injectable internal lifecycle for the same existing fork protocol, including acknowledgement-loss publication retry; standalone downgrade fence.
- `fork_runtime.py`: existing segmented full audit accepts the explicit child receipt table/connection-bound port; standalone defaults are unchanged.
- `queue_runtime.py`: explicit internal fresh-boundary revision parameter and full-audit callback, with unchanged standalone defaults. Existing SQL files, status constraints, frozen codecs/DTOs and hash meanings are unchanged.
- `queue_fixture.py`: standalone downgrade fence only.
- `tests/test_granular_i7fq.py`, `tools/granular_i7fq_proof.py`: original CC0 workloads and genuine Windows process-death/restart checks; no private source content or assets.
- Frontend executable source is unchanged. Paired handoff/register/matrix updates only.

## Reproduction

Use the repository's supported Python environment with development dependencies installed; the default system Python need not have pytest.

```powershell
python -m pytest -o addopts='' tests/test_granular_i7fq.py
python tools/granular_i7fq_proof.py --output <new-numerical-report.json>
python -m pytest -o addopts='' tests
```

The proof creates new original files under the operating system temporary directory and retains private tickets, result evidence and databases locally. Only path-free numerical/snapshot summaries belong in Git. It uses 10 original NPCs, 50 initial memories, five parent actions, one child-only action, reviewed repair/quarantine and three following child actions, then independently advances/reopens the parent. It asserts byte-identical parent database during fork and inherited receipt preservation. Test durations are regression observations, not isolated performance benchmarks.

Fixture usage (not a production installation API):

```python
from pathlib import Path
from tempfile import TemporaryDirectory
from vadallfate.runtime.granular import fork_queue_fixture as fq

with TemporaryDirectory() as root:
    parent, store, authority, sessions = fq.create(
        Path(root) / 'i5-disposable-parent.sqlite', npcs=2, memories=4)
    snapshot = authority.granular_fixture('snapshot', campaign='campaign.original')
    child, child_sessions, boundary = fq.fork(
        parent, authority, sessions['DM'], expected_snapshot=snapshot,
        child_save='save.child', operation_id='example.fork',
        directory=Path(root) / 'i7f-disposable-child')
    child_store, child_authority = fq.reopen(child)  # full audit before gameplay
    child_store.close()
    store.close()
```

Use `q.review`, `q.evidence`, `q.repair` or `q.quarantine` through that same child authority and independently authenticated child DM. `Review` digest, admission identity, exact snapshot, dispatch and damaged bytes are compared atomically; copied sibling/parent evidence and altered reviews fail closed. Tests/proof show exact arguments and typed administrative responses without publishing private runtime response bodies.

## Verification and acceptance

Actual final counts and path-free proof: `docs/evidence/V2-GRANULAR-I7FQ-VERIFICATION.json` and `V2-GRANULAR-I7FQ-PROOF.json`. All final runs completed successfully. Scenarios A/B/C, abrupt process boundaries, negative authentication/profile cases, the full-audit write gate and baseline regressions passed before publication. Prior acceptance definitions are never promoted to complete by this milestone.

## Remaining limits and next gate

STOP after I7FQ. Only one campaign and a parent/child two-segment original fixture are supported. No nested fork, queue-repaired parent export, legacy import/conversion, normal launcher/authentication integration, portable single-campaign export, production key custody or complete typed world model is implemented. Inherited source mounts remain immutable; fixture administration cannot edit them to manufacture a missing-module recovery. Unavailable exact code versions remain a deployment hold. Existing fixture evidence pins exact implementation hashes: use its recorded published revision to inspect historical F/Q fixtures. This revision preserves standalone factory/protocol behavior on fresh fixtures; it does not rebind or migrate older private fixture files. Oversized operator archives and committed-history/anchor corruption remain hard holds.

The accepted 10,000-action evidence is not rerun or reinterpreted. Its approximately 205-second full-audit cost remains an operational limitation. Combined queue audits also scan retained administrative history; these representative proofs make no scalable audit-latency claim. Complete I6 owner/validator coverage, production authentication/format fences, audit-cost disposition and separately approved I8 copied-Save migration/rollback remain required before live granular gameplay. No UI, real model or production security PASS follows from these fixture tests.

Antigravity: fetch both `codex/v2-granular-i7fq` branches and review against their approved I7Q bases. Run the fixture commands in an isolated development checkout. Preserve the existing app/gateway/legacy readers and keep this capability unregistered and PREPARED. Do not merge protected branches or point any fixture helper at an existing campaign Save. A new approval is required for work beyond this composition milestone; this handoff does not authorize I8.


## Final results — 2026-11-02

| Requirement | Result and evidence |
| --- | --- |
| Scenario A: repair after independent fork | PASS — child-only commits, authenticated generation, retained original damage, native R1 receipt/replay and independent parent/child reopen; test and actual numerical proof. |
| Scenario B: quarantine after independent fork | PASS — terminal administrative record, no material revision/event/ledger/receipt from disposition, exact replay, following legitimate commit and restart. |
| Scenario C: isolation/replay | PASS within one-campaign/two-segment slice — independent credentials/nonce namespaces, inherited receipts, pending-source hold, divergent histories, forged/mismatched/sibling evidence denied. |
| Combined Windows tests | **32 passed in 303.43s**; 22 genuine process-termination cases across fork publication, child admission/staging, review, generation/disposition, material commit and acknowledgement loss. Includes retained-damage tampering and the 100-revision full-audit gate. |
| Existing I2–I7Q, R1, JCS and security regressions | **449 passed in 559.80s**, separate targeted command selecting those test files. |
| Final broad backend | **972 passed, 2 skipped in 1294.11s (21m34s)**; existing opt-in private-source and unavailable Windows symlink privilege skips. Existing live Ollama/CUDA regression passed; no new combined-profile AI/UI activation is claimed. |
| Frontend | **157 passed**, TypeScript and Vite production build passed; executable source unchanged. Existing native-config/large-chunk warnings remain. |
| Actual proof | Repair child revision 11, quarantine child revision 10; independently advanced parents revision 6. Five inherited receipts retained; one administrative disposition per child; zero added material ledger/revision at disposition; exact full-audit reopen. |
| Preservation/privacy | PASS prepublication tree audit — protected hashes/SQL/legacy authority methods unchanged, all original matrix fields and prior numerical evidence retained, original public fixtures/code only. Final commit-message/file-version audit and published refs accompany delivery. |

No 10,000-action rerun, existing Save conversion, production granular activation, Antigravity checkout change, protected merge or I8 execution occurred. I7FQ first-slice composition PASS does not promote full I7 to PASS. Stop at this boundary.


## Verified publication

Both branches were published normally and verified through remote refs and GitHub file retrieval on 2026-11-02. All new commit file versions/messages passed the privacy/content audit. No force push or protected merge was used.

| Repository | Immutable implementation / paired handoff commit |
| --- | --- |
| Backend | [`8dc1c548d6cdd5cdb93941808bbbce58457ccc6f`](https://github.com/Minilaz-code/VadAllFate/commit/8dc1c548d6cdd5cdb93941808bbbce58457ccc6f) |
| Frontend documentation | [`8f6f06753f1a3f157369ffd3d16a87ea85f73c32`](https://github.com/Minilaz-code/VadAllFate-Google-Ai-Studio/commit/8f6f06753f1a3f157369ffd3d16a87ea85f73c32) |

The subsequent paired publication-record commit changes this handoff only; tested implementation bytes and numerical evidence are unchanged. Final branch heads are in the delivery and can be checked with `git ls-remote origin refs/heads/codex/v2-granular-i7fq`. Fetch/review these development branches without activating the profile or merging protected branches. STOP after I7FQ; I8 and live migration remain unapproved.
