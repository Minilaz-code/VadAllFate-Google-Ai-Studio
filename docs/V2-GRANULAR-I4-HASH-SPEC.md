# I4 PREPARED hash, revision and snapshot profile v1

2026-11-01. **Disabled/fixture-only.** Profile `I4.PREPARED.hash.v1`, hash-profile version `1.0.0`, module `I4.PREPARED.world.v1` version `1.0.0`. Not registered or ACTIVE. No change to frozen normative R1 fields, deployed SnapshotRef, receipt hashes, authority, legacy hashing, I2/I3 protocols, or Save readers. Option C remains direct granular typed persistence, without a compulsory paged JSON intermediate.

## Ownership and implemented boundary

`src/vadallfate/runtime/granular/hash_profile.py` is pure Python hashing/derived-index code. It owns no connection, canonical records, commits, migration or registration. The fixture owner supplies bounded admitted records; future CommitAuthority must own every canonical write and derived-cache transaction. A checksum is never permission to write or disclose a private record.

Canonical record bodies and immutable event cores are distinct from derived tree nodes. Configuration/content pins have one dependency frame. Snapshots reference their roots. Cached nodes contain no second mutable copy of typed state. Derived identity/revision/hash metadata may be reconstructed and must not become another canonical owner.

`tests/granular_i4_fixture.py` creates only exclusive new temporary files. It exercises record/node/evidence/head writes with caller-owned BEGIN/COMMIT/ROLLBACK. Its i4_* tables are fixture tables, not a proposed production Save schema or an independent storage service. I2 PreparedEntityDriver remains disabled; a read-only test hashes every field of freshly created I2 identity/memory/relationship responses without updating I2 rows or hash columns.

## Canonical bytes and domains

For kind K and JSON value V:

`H(K,V) = SHA256(ASCII("VAF-JCS-SHA256-v1") || 0x00 || ASCII("vadallfate.i4.prepared." + K + ".v1") || 0x00 || RFC8785_UTF8(V))`

Digests are lowercase 64-character hex. Domains are exactly: `empty`, `key`, `priority`, `record`, `node`, `dependencies`, `content`, `empty-evidence`, `evidence`, `snapshot`. Fixture source/result helper domains are explicitly labelled original fixture evidence and are not active roots. Existing JCS framing/implementation is reused unchanged.

Objects use JCS UTF-16 key order; arrays retain semantic order. No implicit list sorting, Unicode normalization, case folding, ID trimming or Python-object coercion. Lone surrogates and unsupported Python types fail. NFC/NFD strings are distinct. Identifiers are nonempty, control-free, <=160 UTF-8 bytes. Strings are <=4,096 bytes, arrays <=32, objects <=64 properties, nesting <=8 except the separately bounded content-pin list. Records/events are each <=8,192 canonical UTF-8 bytes.

Numbers are native JSON integers within +/-(2^53-1), or finite binary64 within that magnitude. Negative zero is rejected. Booleans are separate from numeric fields. Integers and equal integral binary64 values deliberately share their RFC8785 mathematical JSON value (for example SQLite REAL 0.0 and JSON integer 0). This is declared JCS numeric equivalence, not coercion of strings/Decimal/Fraction/unsafe integers. Inputs are not mutated. Decimal precision beyond binary64 is unsupported and must be rejected by the admitting schema/parser; arbitrary external decimal text is not a lossless numeric interchange path. SQLite REAL field semantics and JSON canonical serialization must use this same approved numeric profile before live integration.

## Exact record coverage

A record has exactly these fields, all hashed once in the record frame; no hash column is embedded in itself:

| Fields | Meaning |
| --- | --- |
| profile_ref, campaign_id, entity_id, entity_kind | Exact hash version, canonical campaign and stable identity/kind. Save ID intentionally excluded here. |
| module_ref, module_version, slice_ref | Owning fixture module/version and typed slice. |
| state_schema_ref, state_schema_version, owner_ref | Exact state schema and owning authority namespace. Unknown refs/versions rejected. |
| record_revision, previous_record_hash | Nonnegative safe revision; creation is revision 0 with NULL predecessor. Every update increments once and names the previous I4 record hash. |
| visibility_policy_ref | DM_ONLY, NPC_PRIVATE or PARTY_PUBLIC; this is hashed policy identity, not an implementation of disclosure permissions. |
| is_tombstone, tombstone_evidence_ref | Boolean and explicit evidence ID for logical deletion; tombstone requires a predecessor. |
| provenance | Exact source_ref, license, authoring_revision, source_hash. All IDs/hashes bounded and included. |
| typed_state | Exact fields for the pinned variant; no extensions or history arrays. |

Original-world variants use `I4.PREPARED.state.<kind>.v1`, version 1.0.0, slice `I4.PREPARED.<kind>.v1`, owner `I4.PREPARED.world.owner.v1`:

| Kind | Exact typed fields |
| --- | --- |
| character/location | name |
| npc | name, location_id, source_ref |
| relationship | owner_npc_id, target_character_id, trust, evidence_ref |
| routine | owner_npc_id, location_id, from_minute, to_minute, present |
| belief | owner_npc_id, category, status, text, disclosure |
| memory | owner_npc_id, actor_id, world_minute, event_ref, is_unverified, text |
| event | world_minute, event_kind, actor_id |
| quest | owner_npc_id, status, prior_quest |
| objective | quest_id, status, condition |

Numeric relationship values are bounded to current supported ranges; minutes are safe nonnegative integers, flags booleans, references bounded IDs, and remaining fields bounded strings. These are fixture schemas, not production NPC mechanics/quest validators. The original generator's event entries are inert content entries for size/differential tests, not copied runtime_events or a second event authority. Real immutable event ownership must be assigned explicitly in I5.

I2-row variants use `I4.PREPARED.state.i2.<kind>.v1` for npc/memory/relationship. Their typed_state includes EVERY field from I2 prepared.FIELDS plus the exact native source header owner/schema/version/visibility refs, with no silent field omission. Original I2 campaign, entity/kind and row revision map into the envelope; legacy I2 row_hash is deliberately not reused as the new hash. NPC source kind/ref, pack ID/version, manifest/definition hashes, authoring/legacy refs and provenance_json are all included. Memory witness/secrecy/provenance and every relationship value are included. SQLite 0/1 flags stay integers in this exact source variant. Stored provenance_json is a string and is hashed byte-for-byte as a string: whitespace changes it. The schema and known native I2 header refs are closed; this fixture-only adapter is not a live module mount, Save conversion or global hash activation. Tests exercise newly created revision-0 I2 rows only. Mapping already revised legacy/I2 rows to a previous I4 hash requires a separately approved import/bridge; do not invent history or reset revisions.

## Authenticated state tree

Identity preimage is JCS `{campaign_id,entity_id}`. `key=H(key,identity)`. Stable identity is campaign + entity ID, matching the I2 composite catalog key; kind/owner/schema changes cannot evade uniqueness by getting a new key. Key collisions with different identity bytes are rejected, not overwritten. Kind changes for an existing key are rejected. Duplicate input identities/keys fail.

Tree is a deterministic Cartesian/treap index: BST order is lexicographic lowercase key hex (equivalent to unsigned SHA256 byte order). Heap order is `(H(priority,{key}),key)` ascending. Priority ties are deterministically broken by key; key collisions are rejected. Given a unique key set, the minimum-priority element is the root and the rule repeats in each sorted subrange, uniquely determining shape independently of insertion order.

Empty child/root is `H(empty,{profile_ref})`. Each node hash is `H(node,body)` with EXACT body keys: `key`, `identity_utf8`, `kind`, `revision`, `tombstone`, `record_hash`, `priority`, `left`, `right`. identity_utf8 is the decoded canonical identity JSON stored as a JSON STRING, not an unframed object; child values are child hashes or empty hash. No memory address, Python iteration order, physical row position, wallclock or cached node hash is in its own preimage.

Persistent path copying updates one changed leaf/value and necessary ancestors. Inserts rotate according to fixed priorities; updates preserve shape. Existing unchanged subtrees retain object identity. Batches are 1..32 changed records with exact expected-hash CAS sets; duplicate targets, stale revisions/hashes, unknown owners/modules/schema versions and cross-campaign records fail. PreparedTree.apply publishes a new derived root only after all changes succeed. An interruption leaves the previous tree untouched. Returned changed_nodes is the final changed cache rows, including rotated ancestors; no whole tree rewrite is needed for fixture persistence.

Normal random-hash tree paths are expected logarithmic, NOT a worst-case promise. Paths deeper than 256 fail closed in update/rebuild; a future authority must enforce execution/ID-admission budgets. A pathological/adversarial identity distribution is not permission to run unbounded recursion. Physical canonical deletion is explicitly unsupported/rejected. Logical deletion is an evidenced retained tombstone; fixture tests preserve prior typed state. Tombstones cannot be updated/resurrected under v1. This prevents hash maintenance being used to erase knowledge/history for capacity. Any future physical purge/resurrection needs its own policy/version/approval.

Independent rebuild does NOT call incremental apply/put. It validates/hashes every source record, sorts keys, constructs a Cartesian tree with a monotonic stack, then hashes it bottom-up. All incremental roots in order/random/compound/tombstone/large-world tests match this independent reconstruction. Full audit additionally walks and verifies all cache nodes/order/heap, comparing with source-derived root. Local path checks only detect corruption on touched paths/direct hash dependencies; untouched record corruption requires a complete audit. No constant-time full integrity claim is made. Sorting rebuild is O(N log N) plus record hashing and O(N) node construction; full audit/export remains O(N) or worse including sorting.

## Dependencies and complete content root

Dependency preimage has profile_ref, module_ref, module_version, configuration and content_pins. Configuration has exactly dm_mode, ruleset_ref, ruleset_version, configuration_revision. Pins are at most 128 exact pack_id/pack_version/manifest_hash/rights_ref objects, supplied in unique pack-ID order; unsorted/duplicate pins are rejected, never silently reordered. Changed pins/configuration change the root. Source definitions are not copied into state.

`state_content_root = H(content,{profile_ref,campaign_id,entity_root,dependency_hash})`.

This commits ALL entity records/tombstones and configuration/content/module dependencies, not just changed records. Individual Save identity is excluded from content: copying one logical world into two timelines must not rewrite every entity. Unknown production config/source fields are not silently dropped; before activation, I5 must either map all canonical fields to pinned typed variants or reject that format.

## Global revision, Save identity and snapshot

Standalone I4 fixture snapshot fields are EXACTLY profile_ref, activation_state=PREPARED, campaign_id, logical_save_id, global_revision, world_minute, state_content_root, evidence_root, evidence_count, module_ref/version, hash_profile_version and snapshot_hash. snapshot_hash is `H(snapshot, all other snapshot fields)`. This is NOT a replacement deployed SnapshotRef DTO or an addition to its frozen schema.

The fixture clock unit is whole canonical elapsed world minutes from campaign minute zero, not wallclock time or a calendar projection. Campaign identity + profile fixes this clock domain. Production world-clock identity/tick/epoch mapping remains a specifically required I5 contract decision, not an inferred conversion.

A fixture transition advances global revision exactly once regardless of 1 or 32 row changes and any event count. Row revisions advance independently once per changed row. Time/evidence counts must not move backwards; a canonical no-op is rejected. Event-only and time-only changes advance global revision without changing entity content. Evidence-root/count changes must agree. Whole candidate/head/current-state validation is future I5 responsibility; the pure advance function neither owns nor commits a head.

Two Save IDs can have identical content/evidence roots and revision but distinct snapshot hashes. assert_current validates both snapshot profiles/hashes and exact identities, rejecting stale or cross-Save/campaign snapshots. Branch divergence changes only that branch's roots/revision; the old persistent index remains unchanged. These are identity/differential proofs, not a live branching format migration.

## Evidence chain and cycle avoidance

Empty evidence root is H(empty-evidence,{profile_ref}). Event preimage is EXACT campaign_id, event_id, sequence, global_revision, world_minute, action_id, causal_event_refs, actor_refs, kind and payload. Payload is exactly summary, affected_entity_ids and result_hash, all bounded; supported fixture kinds are original_action, memory_recorded and relationship_adjusted. Unknown payload fields fail. Sequence is contiguous zero-based. Full reconstruction rejects duplicate event IDs, reversed sequence/revision/time. Fixture SQL also uniquely constrains campaign/event ID and sequence. Incremental append takes the already trusted previous chain root and exact expected sequence; I5 must independently check prior head metadata, new event uniqueness and global revision/time before append, not trust supplied values.

`chain_next = H(evidence,{profile_ref,previous:chain_prior,event:event_core})`.

This commits the complete immutable prefix. No state_hash_after, snapshot_hash, receipt_hash, ledger hash or delivery/retry fields are permitted inside this fixture event core. Dependency order is: admitted input/results -> typed record changes + immutable event core -> content/evidence roots -> Save snapshot -> receipts/ledger/outbox records referencing that result. Operational retry counts/claims are outside canonical world/evidence coverage. Immutable canonical result hashes must still bind retained source/result evidence; exclusions are not permission to discard history. Actual R1 event/ledger/receipt projections and retention rules require I5 approval; legacy evidence is not rewritten.

## Legacy and I5 gates

All existing hash functions, proof/staged bytes/fingerprints, receipt hashes, deployed snapshots and Save readers remain unchanged. I4 domains/profile refs cannot be mistaken for sha256_json(state) merely because both emit 64 hex chars. A format-aware caller must select the profile explicitly; bare digest equality never establishes cross-profile equivalence. I3 still accepts only its PREPARED/I2 fixture target hash domain; wiring I4 into typed requests requires an explicitly reviewed versioned adapter/profile, not changing I3 meanings in place.

Required separate I5 units before any real typed commit:

1. Exact complete field/owner mapping for physical I2 and real V2 state modules; immutable source pins, knowledge permissions and evidence ownership. Native module/schema refs and unsupported/legacy imports require approved registrations/bridge, not fixture aliases.
2. Reviewed typed request/DTO and codec discriminator mapping, including I4 row-hash domains and Save-bound snapshot projection into existing normative SnapshotRef fields. Pin clock_id/tick units/epoch, runtime integration profile, revisions and profile refs. No frozen field extension or legacy byte/fingerprint change is implied.
3. Additive, separately reviewed SQL for derived g_hash_nodes, hash/profile metadata and exact existing g_campaign_heads/bindings mapping; no automatic startup installation or ACTIVE binding change. The fixture JSON tables are not the production schema. Existing R1/store constraints and schema dispatch remain protected.
4. Connection-bound authority driver and complete candidate validator; exactly one CommitAuthority transaction must atomically update affected typed rows/cache paths/head plus immutable events/ledger/receipts/outbox/idempotency/admission. No external/model call or independent driver commit. Existing runtime/store.py and commit_authority.py dispatch/staging/recovery/hash/receipt changes must be named and approved.
5. Crash/recovery/determinism tests at each material stage, full integrity/open/checkpoint audit policy and bounded worst-case work, trusted profile selection, source/header/evidence linkage and retained tombstone/history rules. Full audits shown below are materially expensive and must not be hidden as constant-time startup.

I6 live negotiation and I8 copied-Save conversion/rollback remain separate. Production schema, legacy-import previous-hash bridging, event-core coverage, source module maps and clock binding are unresolved approval gates, not implemented capabilities. No activation, real canonical mutation or migration is authorised by this I4 profile.
