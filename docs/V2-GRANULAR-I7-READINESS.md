# I7 readiness decision and exact next gates

2026-11-01. **NOT READY for production granular activation or a partial-campaign migration.** Option C is retained. This is evidence/design, not I8 execution or normative approval.

## Confirmed implementation boundary

I5/I6 implement immutable original-fixture NPC identities, private unverified TOLD memory append and bounded evidenced relationship changes through one existing R1 transaction. I7 changes only redundant decoding inside the full audit, preserving canonical bytes, domains, schema checks and audit eligibility. New tests/tools operate on newly created disposable SQLite files. No normal V2 typed write gateway, production module registration, Save migration, new authority or paged JSON is introduced.

The original I6 field inventory is preserved byte-for-byte: 23 seed roots, 282 seed paths and 37 literal runtime roots. Its proposed owner names are not registrations. Every unsupported field remains a blocker; no campaign may be migrated by dropping, approximating or silently retaining those fields in a permanent monolithic JSON row.

## Coverage reconciliation

| I6 ownership area | Actual I7 evidence | Missing implementation before a complete playable migration |
| --- | --- | --- |
| NPC identity/characterisation | Immutable fixture identities hash/audit/restart correctly | Dynamic source-backed spawn/update/tombstones, actual actor and ContentResolver adapters, exact mechanical/template rights and personality lifecycle. |
| Memories | Real TOLD append, retained immutable rows, event/ledger/receipt/recovery evidence | General WITNESSED/SAW/HEARD acquisition, legacy provenance mapping, party disclosure and actual campaign action integration. |
| Knowledge/beliefs/secrets | DM/player/observer/preview projection denial persists across restart/copies | Versioned established/learned/rumour/incorrect-belief/suspicion/secret owners, admission/revocation/source-pointer validation and exact knowledge experiences. |
| Relationships/goals/personality | Evidence-linked trust/affinity/familiarity first slice only | All existing axes/history mirrors, relationship creation, goals, pressure/personality and their validators; no inferred legacy evidence. |
| Character/resources/inventory/combat | No additional canonical support | Exact typed identities, inventory ownership/quantities, resource/HP/spell aliases, rules and spatial dependencies. Combat/source holds remain. |
| Quests/objectives/routines/schedules | No additional canonical support | Typed progress/deadline/prerequisite/occurrence/consumption records; committed event linkage, multi-entity atomic validators and scheduler ownership. |
| Clock/locations/spatial/assets | Fixed fixture minute retained; no live clock/placement update | Clock/calendar reconciliation, location pins/discovery, calibrated grid/token/footprint/geometry/visibility ownership and asset provenance. |
| Configuration/content pins | Immutable original fixture registry only | Actual installed pack version/hash/rights closure, production module profiles and DM-mode/rules configuration. Source definitions stay outside live state. |
| Events/dialogue/narrative/director/factions/simulation | Exact first-slice RuntimeEvent/evidence chain retained | All native action/result fields, human/AI provenance, character-specific disclosures, proposed versus committed plans, faction/publication/visitor/trigger owners. |
| Notes/plans/approved homebrew/graph | Unchanged legacy authoring/native readers | Revision/scope/ACL/file-hash owners, atomic activation versus draft/occurrence distinction, a single canonical owner for overlapping graph/document identities. |
| R1 staging/events/ledger/outbox/idempotency/receipts | Real first-slice material commits and abrupt-exit recovery tested | Full supported-action coverage, source/session adapters, reviewed legacy evidence bridge and actionable corrupt-pending disposition; never rewrite old bytes/hashes. |
| Saves/authentication/operational integrity | Physical backups diverge; wrong labels fail; exact copied-identity limitation exposed | Independent logical Save/session realms, authorised fork boundary, origin/history semantics, operator review/repair and reviewed integrity cost policy. |

## Gate A: logical Save fork contract (proposal only)

Whole-SQLite backup correctly retains all data and historical evidence. It also copies g_campaign_bindings.logical_save_id, the fixture provenance cookie, fixture session secrets and V2 authentication realm. The same pinned frame is accepted in both physical files before they diverge. After divergence, snapshot/root checks reject crossing frames. Those are different guarantees: physical isolation does not establish independent logical Save/session identity.

No supported rebinding operation exists. Changing logical_save_id alone invalidates snapshot/genesis/receipt lineage. Rewriting old receipts or event IDs is forbidden. Exact review units before any implementation:

1. Define an authority-owned fork action/administrative boundary, authenticated creator and allowed source/target file ownership. Reuse existing ActionEnvelope/SnapshotRef/validation/CommitRequest/CommitReceipt semantics or name the precise amendment. No ad-hoc SQL UUID edit.
2. Specify origin_logical_save_id/origin_snapshot_hash semantics in g_campaign_bindings (currently unused optional fields), a new Save-bound base snapshot, and retained parent evidence versus child-local receipt-chain ownership. authority_storage.audit currently requires genesis Save == current Save and receipts reach that same chain; this rule cannot be silently relaxed.
3. Preserve original typed rows/content root, native historical events/IDs, receipts, request bytes and immutable evidence. New branch-local event/action/request identities must bind the new Save; no historical rehash or reset of revisions.
4. Define a versioned authentication/session realm bound to Save identity, with copied token/cookie handling, host reauthentication/revocation and no client-label authority. Existing V2 session HMAC binds campaign, not an independent logical Save UUID. FixtureSession rows are also copied by backup.
5. Implement only after approval, then test identical content/different snapshot identity, pre/post-divergence cross-branch rejection, parent immutability, lossless history, crash at fork steps, exact receipts, no simultaneous physical-file writers and restart. Existing/production conversion and portable export remain separate I8 gates.

Affected review files: granular/authority_contracts.py, authority_validation.py, authority_storage.py, disposable_fixture.py, versioned fixture/production binding SQL, v2_campaign_gateway.py session contracts and game_campaigns.py Save management. No edits to these contracts are implemented by this proposal.

## Gate B: integrity work budget (proposal only)

The mandatory write gate remains full verification every 100 revisions, full audit at reopen and before checkpoint. All retained canonical rows, cache nodes, events and receipt chains are reconstructed/checked. I7 removes one duplicate decode of already validated bytes within a receipt check; it does not cache acceptance between audits or omit any phase.

Repeated full history validation grows with retained history; summing a growing full audit every 100 revisions has quadratic aggregate work in the number of actions. Profiling separates source assembly, independent record/tree reconstruction, node verification, event/receipt validation and SQLite self time. Observed timings and the bounded 10,000-action attempt are in the handoff. Extrapolations are not a completed 10,000-action test.

A different policy needs explicit approval: exact new audit modes, trusted versioned checkpoint/prefix evidence, code/schema/profile identity, Save/file identity, corruption detection window, eligibility transitions, full independent reopen/export audits, crash/tamper/fault proofs and CPU/RAM/disk budgets. Any incremental prefix audit must have a distinct result type; it cannot be called a full audit. Existing g_i5_audits fields/gate and canonical hash domains stay unchanged until that review. No background verification may declare an unaudited current head authoritative.

## Gate C: corrupt pending input disposition (proposal only)

Unknown codecs, unavailable validator/module versions and corrupt staged bytes fail closed, retain the original pending head and produce no material receipt. This avoids silent loss or re-generation, but is not an operationally complete repair workflow. Snapshot-stale disposition exists; corruption at the current snapshot cannot be marked stale just to drain the queue.

Review must define an authenticated operator hold/disposition/repair record, exact old/new byte fingerprints, retained damaged evidence and approved input, current dispatch fencing, reason/actor/time and allowed resumption. No fake APPLIED receipt, automatic skip, model re-generation, unlogged staged overwrite or frozen admission-status change is authorised here.

## Future disposable playable migration prerequisites

Approve complete typed owner/validator/source/role mappings first; resolve Gates A-C and practical endurance budgets; then separately approve an I8 versioned migration on copied disposable fixtures with full before/after field/evidence comparison, power-loss rollback, explicit format negotiation and old-runtime launcher refusal. Existing production Saves, Antigravity checkouts, frozen schemas and protected branches remain untouched. I7 is not approval to migrate an incomplete campaign.
