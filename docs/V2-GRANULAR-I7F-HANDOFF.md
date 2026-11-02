# I7F / FORK-1 disposable canonical fork

2026-11-01. **PREPARED fixtures only. No I8, production migration, normal granular gameplay or new integrity eligibility.** Approved baseline backend `cbd82b10c084d07dc25ae892b0c2e1f566bae89e`, frontend `feb6ffe0e0967f56bd47f8d20805611199ad05ab`. Paired branch `codex/v2-granular-i7f`; final immutable commit references are in the delivery response and can be verified with `git ls-remote origin refs/heads/codex/v2-granular-i7f`.

This implements a real child that independently commits and recovers through the existing R1 CommitAuthority. It does not call the I7R offline child-inspection demonstration a canonical fork.

## Versioned contract and ownership

`fork_v1.sql` is installed explicitly only by `fork_fixture.create`, after exclusive creation of a new original I5 fixture at revision zero. Earlier entity/authority SQL files, normative DTOs, hash domains, store migrations and normal startup are unchanged. New connection-bound operations are in `fork_runtime.py`; lifecycle/publication is in `fork_fixture.py`. The existing disabled `CommitAuthority.granular_fixture` gains an additional private identity-token guard. Normal stores cannot import/select this integration through a gateway or startup flag.

The approved change to `authority_storage.py` extracts its complete, unchanged source/cache/event/relationship reconstruction into `audit_world`. The original v1 audit still runs that phase followed by its original receipt-chain checks. The new segmented auditor runs the same complete world phase, all original receipt checks, the versioned fork boundary verifier, and all child receipt checks. Full audit every 100 revisions, before checkpoint and on reopen remains mandatory. No prefix result is used.

The child contains two receipt/admission namespaces: inherited v1 tables and new `g_f_admissions`, `g_f_approvals`, `g_f_receipts`. A fixed connection port routes existing I5 admission/staging/validation/commit/recovery functions to the active child namespace. The port never opens, commits or rolls back a connection. It is not another commit engine. Typed records, heads, events, ledger, proofs, patches and outbox still use the original canonical SQLite tables and SAME authority transaction.

Old table constraints are not edited. The new client fixture uses Save-scoped action, creation and globally unique request IDs; a user nonce can be reused independently in the child. A reservation trigger rejects already-used request IDs before admission can poison the queue. Each file has one active logical Save; its new namespace is bound to that Save by independent authentication and the exact frame lineage. Nested child-to-grandchild forks and multiple campaigns per fork are explicitly refused in this v1 fixture profile rather than approximated.

## Exact fork boundary

1. Authenticate the actual parent fixture DM and exact Save; require a full source rebuild/audit, exact expected snapshot, no PENDING inputs and one campaign. No parent audit marker or row is changed by export. An external host-only random key signs the versioned canonical export body, including parent snapshot, source pins, inherited-row digest index, child Save/realm and operation ID. The key is verified against its previously provisioned fixture verifier, never a worker's claimed PASS.
2. Durably create an exclusive `i7f-disposable-*` operation directory and fsync its local-only immutable manifest/child credential journal before copying. Source and target transactions are never described as cross-file atomic. Source is one read-only SQLite snapshot; backup writes through the existing target CommitAuthority's own connection during a guarded unpublished-target bootstrap operation.
3. Materialise only a newly allocated `fork-staging-*` file. It is not a usable child and the normal fixture reopen API refuses that name. The authority revalidates the full copied source, snapshot, signed manifest, pending-input refusal and credential/lineage anchor before the boundary transaction.
4. One existing R1 transaction retains every entity revision/content root and original history byte, appends a real `I7F_FORK_BOUNDARY` RuntimeEvent to the inherited I4 evidence root, advances child global revision to parent revision +1, installs its logical Save/realm/credential verifiers, records ledger/outbox/determinism evidence, and issues one versioned-boundary canonical CommitReceipt. The current head remains the original `g_campaign_heads`/binding pair. No historical receipt is rewritten or issued in the child's name.
5. Parent session verifier rows copied into the child are disabled, not treated as child credentials. Fresh child DM/player/NPC secrets and realm-scoped session IDs are generated independently. Historical references remain intact. This is the approved versioned **fixture** authentication adapter; real `SessionAuthRegistry`, frontend auth and production identities are unchanged.
6. Seal the lineage/receipt atomically, independently audit the child, close its authority, then publish using a same-directory non-replacing atomic rename with Windows write-through. POSIX uses exclusive link publication plus directory fsync. No preexisting destination can be overwritten. The normal child ticket binds its cookie, key and external lineage anchor; read-only checks precede writer open.

The lineage body includes parent Save/snapshot, operation ID, inherited content/evidence position, child Save/realm, authenticated export signature and child credential verifiers. Its external anchor is retained in the private ticket/creation journal. The boundary event hashes this body using the unchanged I4 event projection. Root dependencies do not cycle through resulting receipt/head hashes.

Inherited immutable rows have exact per-row digests anchored by that boundary, and SQL update/delete guards. Original admission/receipt namespaces are sealed against new insertions. Current relationship/cache/head rows remain normally mutable through R1; source definitions and inherited NPC identities/memories remain immutable. Independent full audit verifies the digest coverage, native prefix and child chain, not just a stored head string.

## Crash/retry and trust boundaries

Before boundary COMMIT, OS termination rolls back the target transaction; unpublished attempts remain local and cannot be reopened as children. After COMMIT before publication, retry audits and publishes the same sealed child. After publication before acknowledgement, retry returns the same boundary receipt and credentials, even if the valid parent has since advanced. Conflicting child/operation/snapshot parameters are refused. Old incomplete attempts are retained; no recursive cleanup or history regeneration is performed.

Tests use actual abrupt `os._exit` processes after backup, partial inherited-index insertion, event, head, receipt, before COMMIT, after COMMIT, before publication and after publication. They prove one published child, one boundary, independent subsequent commits and exact retry. No model or RNG gameplay result is regenerated.

Host filesystem access and private ticket/journal integrity are trusted, as in earlier disposable fixtures. Plaintext local test credentials are not production key storage. SQLite-only tampering, copied parent capabilities, wrong tickets/anchors and malformed lineage fail closed. This is not a sandbox against malicious Python running with host filesystem/writer access.

## Actual API and reproduction

From the configured backend environment (original scripted fixtures, not AI output):

```python
from vadallfate.runtime.granular import fork_fixture

ticket, store, authority, sessions = fork_fixture.create(
    "i5-disposable-parent.sqlite", npcs=3, memories=6)
snapshot = authority.granular_fixture("snapshot", campaign="campaign.original")
child, child_sessions, boundary = fork_fixture.fork(
    ticket, authority, sessions["DM"], expected_snapshot=snapshot,
    child_save="save.child", operation_id="fork.example",
    directory="i7f-disposable-child")
child_store, child_authority = fork_fixture.reopen(child)
# Existing I5 frame/validator/commit/recover operations apply to child_authority.
# tests/granular_i7f_worker.py supplies the Save-scoped original test client.
child_store.close()
store.close()
```

```powershell
python -m pytest -q -o addopts='' tests/test_granular_i7f.py
python tools/granular_i7f_proof.py --output <new-original-numerical-report.json>
```

The actual standalone proof is `docs/evidence/V2-GRANULAR-I7F-PROOF.json`: parent revision 5 -> child boundary 6 -> five legitimate child commits/restart at revision 11. Parent subsequently advances independently to revision 7. Original receipt bytes match, both cross-realm credential attempts are denied, both reopened states match and FKs remain valid. Raw databases, manifests, capabilities and recovery tickets stay local; the public report contains original numerical/hash evidence only.

Final targeted/broad results and publication checks are recorded in the verification update below. The 10,000-action I7R durability baseline is accepted and **not rerun**. I6 field ownership/unsupported-state gates, the ~205-second full-audit operational concern, source combat and private-secret reasoning holds remain. This first slice does not support production export/import, arbitrary old Save conversion or a full-world campaign migration.

## Verification update

Final fork cases: **16 passed in 76.80s**, including nine genuine process-death windows and the unchanged 100-revision full-audit gate. Targeted I2-I7R/R1/JCS suite: **408 passed in 353.28s**; the bounded-manifest/realm checks received the final 16-case follow-up. Standalone original proof: PASS_FIRST_SLICE_FORK. Privacy/content review passed; original matrix fields, frozen SQL assets and all accepted I7R numerical evidence are preserved. Broad consolidated regression follows I7Q and is not claimed in this increment. See `docs/evidence/V2-GRANULAR-I7F-VERIFICATION.json`.

Consolidated follow-up (2026-11-02): after I7Q, 435 targeted and 940 broad tests passed (two existing skips), including all F cases. See the separately published I7Q branch and V2-GRANULAR-I7-FQ-READINESS.md; this is the combined run, not an invented F-only broad count.
