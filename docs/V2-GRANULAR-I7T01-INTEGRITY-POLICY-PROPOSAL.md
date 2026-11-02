# I7T-01 production integrity-policy amendment — PROPOSAL ONLY

2026-11-02. **NOT APPROVED OR ACTIVATED.** Existing mandatory complete audits on reopen/checkpoint and the 100-revision write-age gate remain. This document requests a separately reviewed integrity policy; it does not enable one. The I7R diagnostic prefix never certifies untouched source/history.

## Measurements and what they establish

Actual Windows Python fixtures, original data, same sole R1 writer, WAL + foreign_keys=1 + synchronous=FULL. Each population performs a joined typed world action, five intervening sessions, three ordinary resource actions, complete source/cache/receipt/event replay, checkpoint and full-audit reopen. Some measurements overlapped regression load. Three ordinary mutation samples and one recall/full audit per population are representative observations, not p95/SLA or endurance evidence.

| NPCs / initial memories | Ordinary request bytes | Median admit/stage/commit s | Recall wall s / SQL statements | Complete audit wall / CPU s | Full-audit reopen s | Checkpointed DB bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 / 20 | 8,204 | 0.3718 | 0.0093 / 55 | 1.2389 / 1.2344 | 1.3256 | 1,138,688 |
| 100 / 1,000 | 8,205 | 0.3900 | 0.0117 / 91 | 3.3845 / 3.3750 | 3.3506 | 4,599,808 |
| 1,000 / 3,000 | 8,206 | 0.4062 | 0.0134 / 100 | 9.8016 / 9.7812 | 10.4427 | 16,412,672 |

The 2-byte request increase is the decimal width of evidence-count metadata, not embedded campaign history. Joined eleven-target requests are 24,319–24,321 bytes. Indexed recall executes approximately 1,500 / 2,400 / 2,600 VM instructions (100-opcode progress quanta, coarse); plans use `g_t_recall`, and due-event plans use `g_t_due`. No full-history scan or all-NPC hydration occurs in that handler. SQL statement count grows with authenticated path depth. A bounded query is not proof that an untrusted secondary index omitted nothing.

The accepted I7R approximately 205-second audit at 10,000 committed actions remains valid and unchanged. These smaller, differently populated histories do **not** demonstrate that cost is fixed or improved at equivalent load. No 10,000-action rerun occurred. Raw path-free results: `docs/evidence/V2-GRANULAR-I7T01-PROOF.json`.

A real disposable corruption probe changed an untouched NPC source row. A different resource's authenticated path read still succeeded (0.0052s); full audit rejected corruption (0.0146s, early failure) and its failed transaction did not refresh eligibility. This directly demonstrates why touched-path/prefix verification alone cannot attest every stored byte. Initial fixtures, physical index integrity and complete replay are audited; no new production guarantee follows.

## Threat model

Assume trusted released code, rules/source pins, sole R1 writer capability, session authentication, OS process/keystore access controls, collision-resistant hashes and SQLite/Windows FULL durability honoring flushes. Defend against accidental torn/uncommitted writes, stale/duplicate requests, cached-root/index corruption, arbitrary mutation/deletion/reordering of local SQLite source/evidence bytes, and DB rollback to an old valid file **relative to a retained external anchor**.

Do not claim protection against an administrator who can replace code, all external anchors and signing keys, malicious storage firmware, unavailable or suppressed background verification, lost anchors, or coherent rewrites predating any trusted checkpoint. Offline corruption has no finite wall-time detection promise; on the next trusted open an expired/unverifiable checkpoint requires complete audit before writes. FULL/WAL gives transaction recovery, not a certificate that dormant pages, indexes or historical payloads are intact. Genuine process-kill tests do not prove physical power-cut behavior on every device.

The current I7T fixture has no trusted external anchor. Its full audit establishes source/cache/evidence consistency and deterministic replay under trusted fixture admission/code; it does not rule out a coherent rewrite of the entire database and all unsigned fixture evidence by a hostile file owner. Existing Q/FQ result authentication is retained in those separate profiles; new-world Q/FQ composition remains held. No external-anchor guarantee is claimed for current I7T.

Current granular eligibility bounds revision age, not elapsed idle time: an untouched corruption has no finite wall-time detection promise while a process stays open and no full audit/read touches it. Reopen/checkpoint or the revision limit forces complete verification. This proposal states its new wall-time assumptions separately and must not be read as an existing production guarantee.

## Proposed policy and exact lost guarantee

A future independently versioned policy could replace per-100-revision complete-history eligibility with:

1. A **complete verified baseline**, not a prefix: exact campaign/Save/lineage, format, source/rules/module/hash versions, state root, all canonical owner inventories, evidence root/count and revision, receipts/ledger/outbox closure, and authenticated query-index roots. A full independent verifier certifies this cut.
2. Every new action retains ActionEnvelope → SnapshotRef → StatePatch → independent rules/validation → bounded staged CommitRequest → existing atomic CommitReceipt. Validate every affected source row and complete dependency/read set against the anchored root; verify exact revisions and deterministic delta roots. Preserve the 65,536-byte codec ceiling and pre-admission refusal.
3. Incremental immutable evidence **page/Merkle checkpoints** cover actual event, patch, ledger, receipt and result bytes. A returned historical range must verify against the trusted checkpoint, including range completeness/order. Hashing a prefix head or cached roots without source coverage is insufficient.
4. A trusted external, append-only anchor stores only bounded identity/version/root/lineage metadata and the prior-anchor hash; sign with a service-owned Windows-keystore key unavailable in SQLite. It is verification evidence, never another source of gameplay state or a writable campaign store. An anchor may reject/hold a Save; it must never independently commit, choose or roll back canonical campaign state. Key recovery/rotation/revocation and local ACLs need explicit design review. Existing fixture plaintext tickets are not production key custody.
5. A read-only rotating verifier re-reads all canonical records, registered indexes and immutable evidence pages. Proposed first review budget: every byte covered within **W=30 minutes**, with read-snapshot age capped at **S=5 minutes**. Under a functioning verifier, trusted monotonic host deadlines and retained anchors, untouched corruption must be detected within **W+S=35 minutes**; accessed records/ranges fail immediately when their proofs fail. This deliberately provides **no immediate whole-file attestation from an ordinary incremental commit**. The existing granular gate already permits up to 100 revisions between complete audits; it also does not attest every byte on each commit. The proposed change would replace that revision-age/reopen policy with explicitly anchored, time-bounded coverage, not preserve its current eligibility rules. Do not advertise the current file as fully audited merely because a bounded read succeeds.
6. The authority enters a verification HOLD before the coverage deadline is exceeded, a sweep cannot complete, an anchor mismatches, or WAL/snapshot budget is exceeded. Foreground material writes remain held until complete verification resolves it. Idle/offline Saves require audit on next use; world-clock advancement cannot extend host verification deadlines. Background verifier absence cannot silently extend the window.

The proposed budgets are review values, not measured feasible production defaults. Large-history sweep cost, duty cycle, Windows RAM/IO contention, deadline enforcement, adversarial mutation timing and actual 8–16GB hardware must be measured before approval. The current approximately 205-second sweep makes this engineering work material. If complete owner/dependency coverage or authenticated range indexes is missing, retain the existing policy and hold activation.

## Index and knowledge completeness

SQLite `SEARCH ... USING INDEX` bounds ordinary access but does not cryptographically prove that a due event, relationship or authorised memory was not omitted. The new fixture full audit also runs SQLite integrity_check; bounded queries do not. A proposed production policy needs authenticated ordered secondary roots such as `(campaign,status,due,event-id)` and `(campaign,NPC,actor,topic,status,session,id)`, with inclusive/exclusive range proofs, ACL filtering and stable snapshot keyset cursors. An omitted eligible record must invalidate a purported complete range. Rankings and Qwen must receive only deterministic eligible records; neither can widen visibility or manufacture completeness.

These are derived, rebuildable indexes updated inside the same R1 transaction and included in a new hash-profile binding. They do not replace scalar canonical owners, become a new authority, or silently modify the frozen I4 profile. Source pack definitions remain immutable outside the Save. Cross-entity eligibility, actor/NPC scope and DM/private disclosure must be checked before any optional semantic ranking.

## Crash, WAL and anchor protocol

Canonical SQLite COMMIT stays first and sole. R1 atomically commits changed typed rows, source/root revisions, immutable events, patches, ledger, outbox, deterministic proof and idempotency receipt under existing FULL/WAL semantics. Only after durable COMMIT may the owner publish an external anchor using fsync and atomic non-replacing publication. An anchor failure never fabricates a rollback of an already committed action.

- Death before SQLite COMMIT: existing atomic rollback; retained admission/result permits normal exact recovery.
- Death after COMMIT before acknowledgement/anchor publication: return the durable prior receipt on retry. Verify the unanchored tail against the last trusted cut using exact registered codecs, causal rows and recomputed roots before sealing a new anchor. Missing versions/evidence or non-unique lineage cause HOLD/full audit; never rerun a model or guess a result.
- Death after anchor publication: retry the same anchor identity; conflicting roots/revisions are a hold. Detect DB rollback behind the external last-known cut. Legitimate Save branching needs an explicitly authenticated new Save/lineage domain and separate anchors; no aliasing parent sessions/receipts.
- Background snapshot: use a bounded consistent read snapshot at a stated cut; verify R1's append-only tail and changed-row revisions to advance certification. Hot-row/snapshot churn cannot indefinitely postpone coverage. Cap snapshot lifetime/WAL bytes and restart or apply backpressure through the same authority. WAL truncation remains maintenance after complete eligibility checks; never a hidden material commit.

Checkpoint manifests contain no private narrative text. Loss of the last trusted anchor forces full audit/re-anchoring under an approved operator workflow; restoring an old SQLite file alone is not evidence that the latest campaign was recovered.

## Isolated review units and approval gates

| Proposed unit | Exact affected boundary | Required evidence before separate approval |
| --- | --- | --- |
| P1 coverage and hash format | New registered owner/dependency descriptors and new versioned snapshot/index-root hash profile; existing I4/SnapshotRef meanings untouched | Field-complete I6 map, all owner schemas, no unknown fields, differential root/range goldens |
| P2 checkpoint/anchor schema | New append-only metadata in the same authority-owned SQLite plus external signed root manifest; no second writer | Windows key custody, immutable range proof, lineage/rollback/rotation failures |
| P3 R1 eligibility amendment | Explicit replacement policy for `authority_validation.validate` / typed profile validation age gate, audit markers, reopen/checkpoint and `CommitAuthority.granular_fixture` gating | Exact policy text, certified coverage window, source corruption/omission tests; this approval does NOT authorise implementation |
| P4 recovery amendment | Existing staged codec selection, admission/recovery, CommitAuthority transaction and receipt verification + anchor acknowledgement | Crashes at every SQLite/anchor step, no lost commits/false receipts/model regeneration |
| P5 operations/performance | Read snapshot/WAL budgets, background verifier scheduling, portable branch/anchor/export closure | Modest Windows CPU/RAM/disk measurements, source/index/history faults, expired/offline cut, isolated divergent Saves |

Frozen schemas, live `runtime/store.py`, current codec meanings and normal gameplay registration remain unchanged in I7T-01. Any new canonical metadata installation in an existing Save, production format activation, old-reader migration, integrity eligibility change or I8 conversion requires its own explicit approval. **Recommendation:** review P1/P2 first; do not approve P3 until complete authenticated coverage and measured deadline enforcement exist. Current I7T-01 demonstrates the first additional gameplay owners; it does not supply those production guarantees.
