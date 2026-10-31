# Granular canonical state architecture review

2026-10-31. **DESIGN ONLY. Implementation and migration are not authorised.**

Backend baseline: 233a4cabe86d6d869c8dc29174b52110bb1a411c. Frontend baseline: ba6935bb3a359cb42e28f6f51b317a153680ab7b. Both are codex/v2-campaign-reliability. This review changes documentation only.

## Recommendation

Choose **C: a staged hybrid, with B's granular typed SQLite storage as the destination**. Keep a versioned legacy reader and logical compatibility facade; do not deploy A's paged strings as a mandatory intermediate Save format.

Hybrid means normalized canonical records, bounded schema-validated JSON for genuinely variable per-record fields, and rebuildable read projections. It does not mean two writable copies of truth or smaller strings inside an expanding authoritative campaign row.

A is defensible only as an explicitly time-limited emergency compatibility release if typed-authority work cannot be authorised. It fixes staged-request growth, not current full-row serialization, hashing or writes. It needs its own migration and then another migration to B. Most page catalogue/encoding code would be throwaway; a tested logical facade and differential fixtures are useful in either route.

## 1. Current contracts and gaps

Reviewed backend sources: contracts.py, commit_authority.py, store.py, staged_request_codec.py, typed_fixture_commit.py, state_mount_fixture_readback.py, jcs_hash.py, v2_campaign_gateway.py, v2_state_delta_validator.py, v2_npc_cognition.py, game_campaigns.py, v2_authoring_services.py, content/knowledge/adventure services, the prior migration proposal and reliability handoff.

Reviewed normative schemas: the 0.1.0 actions/primitives/validate/commit schemas and 0.3.0 ada-r1-state-modules.schema.json.

Important findings:

- Current CommitAuthority reads and verifies the entire campaign_state.state_json, applies scalar patches, hashes the complete state, then replaces that entire serialized row. Paged strings would still follow this path. Staged results and applied patches also retain payloads on disk.
- The deployed scalar patch adapter permits one-level set/increment only. The legacy staged codec caps requests at 65,536 bytes and returns None for machine_wire or typed_fixture_write_intent. This is not a general durable typed codec.
- Normative StatePatch.operations and WriteIntent already express target identity, owner, preconditions, validators, causal evidence and expected revisions/hashes. StateFragment is typed and bounded; it is not an unlimited custom-data bag.
- StateSliceDefinition requires COMMIT_AUTHORITY_ONLY. A module manifest requires direct_canonical_write=false and explicit mechanics authority. Access profiles pin mounted modules, schemas, drivers and provider capabilities. Registration may be blocked or MIGRATION_REQUIRED.
- Current executable typed ownership/commit support is one tightly pinned INTERNAL_TEST_ONLY ENERGY/PUNCH fixture. It does not authorise NPC/quest operations, arbitrary tables, production source mechanics or general module registration.
- Existing domain-separated RFC 8785 utilities explicitly do not migrate legacy proof-local state/idempotency hashes. A new hash profile needs approved field coverage and versioning.
- Plan/homebrew transitions commit through authoring-store connections before the gateway's R1 activation commit. Their status changes and canonical activation must not be assumed atomic today. Draft editorial work must be separated from canonical activation.

Reuse the normative vocabulary and authority architecture. Do not invent a generic SQL opcode, stretch the synthetic fixture field into a production channel, or equate a schema-valid manifest with approved registration. CP149/CP150 and all frozen holds remain unchanged.

## 2. Exact comparison

| Engineering concern | A: paged strings in current state row | B destination / C compatibility rollout |
| --- | --- | --- |
| Schema/ownership | Authority-owned scalar slots, page/catalogue schema | Typed entity/relationship tables in the same Save; registered authority drivers |
| Delta/size | Changed pages and catalogue edits; string escaping still counts | Changed operations/records and bounded evidence; no campaign document in a request |
| Hash/snapshot | Current complete serialization/hash remains O(N) | Approved versioned authenticated root; changed leaves/paths plus full audits |
| Validation | Full logical reconstruction for legacy validator | Indexed dependency closure and SQL invariants, differential full validation during rollout |
| Recovery | Scalar codec can persist pages; reconstruction validation still new | Approved typed codec/discriminator, pinned handler/profile and authority recovery route required |
| Legacy migration | Page conversion plus later normalization if B follows | One explicit legacy-to-granular conversion; native legacy reader remains |
| SQLite/WAL | Entire expanding state_json row still updated | Affected typed rows, head and hash paths only, plus ordinary durable evidence |
| Campaigns/branches | Existing full-file backup remains; format-aware inspection needed | Same backup unit initially; explicit Save binding, indexed scoped records and later closure export |
| Role projections | Reconstruct then filter; no automatic security improvement | Filter indexed canonical records before serialization; ACL/provenance remain canonical |
| CPU/RAM/disk | Large Python copies, whole hashing and row rewrites persist | Scoped reads/writes; row/index/hash overhead; full audit/export still O(N), not free |

### Measured evidence, not predictions

Source: docs/evidence/V2-CAMPAIGN-CAPACITY.json at the reviewed backend baseline.

| Existing measurement | Result | Interpretation |
| --- | --- | --- |
| 10 added original fixture NPCs | 54,199 document bytes; 62,936 request bytes; committed | Full document determines request growth |
| 11 added NPCs | 58,176 document bytes; 67,384 request bytes; rejected | Fixture-specific threshold, not a universal NPC cap |
| Codec boundary | 65,536 accepted; 65,537 rejected | Current hard boundary |
| Sequential configuration actions | 109 succeeded; action 110 rejected at 65,543 bytes; zero pending; hash unchanged | Safe rejection with retained history, not unlimited gameplay |
| Synthetic scalar proof | 1,294,954 canonical bytes, 2,000 memory records; maximum request 1,700 bytes | Targeted requests can be small |
| Same synthetic proof | 20 ordinary updates plus one recovered update; replay, branch and reopen passed; mean ordinary commit 134.99 ms | Existing authority durability; NOT normalized SQL or an implemented A catalogue |

There are no measured normalized-store results, A catalogue implementation, incremental-hash benchmarks or 100/1,000-NPC granular acceptance results. Existing gateway-reopen timings are in-process recreation, not complete Windows startup. Existing Save-size columns include multiple fixture campaigns.

Illustrative page arithmetic, not measurement: assume 3 KiB non-memory state per NPC, 600 bytes per memory and at most twelve memories per 8 KiB page with reserved overhead. Per-NPC append pages give:

| Fixture | NPC pages | Memory pages | Catalogue pages at 32 refs/page | Payload before encoding/metadata |
| --- | ---: | ---: | ---: | --- |
| 100 NPCs, 10,000 memories, 100 per NPC | 100 | 900 | about 32 plus upper levels | about 6.3 MB |
| 1,000 NPCs, 10,000 memories, 10 per NPC | 1,000 | 1,000 | about 63 plus upper levels | about 9.1 MB |

A would still replace the multi-MB outer row after a one-page edit. Eight KiB content is not eight KiB staged wire: escaping, intent envelopes and catalogue changes count. Positional byte chunks are unsuitable because insertion may change every later chunk. B instead has individual memory rows and identity rows. Its actual row/index/hash overhead must be measured.

## 3. Proposed canonical schema and ownership

All tables below are proposed additions/migrations in the existing SQLite file, not executed DDL. Composite keys and foreign keys start with campaign_id. Records have stable identity, owning module/slice, schema version, row revision, visibility-policy reference and a derived row hash where applicable. Each field has exactly one canonical owner. Bounded JSON may encode variable fields of ONE typed record; it must not contain an NPC's entire memory history or the campaign.

| Proposed table/key | Canonical responsibility |
| --- | --- |
| campaign_heads(campaign_id PK) | Global revision, active storage/hash profile, content root, evidence head and profile digest; authority only |
| campaign_bindings(campaign_id PK) | Logical Save/timeline ID and container/fork lineage; approved administrative operations |
| state_module_mounts(campaign_id,module_id) | Exact approved manifest/access/config/provider hashes; no client self-registration |
| entity_catalog(campaign_id,entity_id) | Entity kind, owner/slice and tombstone identity; typed-table membership checked |
| npc_instances(campaign_id,npc_id) | Exact source ref/pin/definition hash, supported instance overrides, lifecycle and spatial association |
| npc_knowledge(campaign_id,knowledge_id) | NPC ownership, epistemic category, bounded statement, acquisition/provenance and supersession/retraction chain |
| npc_memories(campaign_id,memory_id) | Owner, world minute, actor/event reference, witness mode, secrecy/unverified status and bounded summary; append-only evidence |
| knowledge_disclosures(campaign_id,knowledge_id,principal_ref) | Explicit NPC/character/party/DM disclosure and causal provenance |
| relationships(campaign_id,subject_id,target_id) | Supported current values; adjustment history references immutable events rather than a rewritten array |
| goals; routine_intervals(campaign_id,npc_id,interval_id) | Goals, priorities, approved activities, intervals and dependencies |
| quests; objectives; objective_edges; objective_progress | Definitions, order/DAG, typed conditions and event-backed completion/failure state |
| locations; actor_locations; map_configs; token_placements | Campaign overrides and supported spatial state; source definitions/artwork referenced |
| world_clock(campaign_id PK); scheduled_events | Monotonic time, due/status/condition and deterministic event ordering |
| characters; character_resources; inventory_items; inventory_ownership | Supported actor fields, quantities, containment and single ownership; mechanical operations provider-gated |
| combats; combatants; effects | Existing supported mechanics only; no source-combat hold is relaxed |
| campaign_config; campaign_content_pins | Mode/config and exact dependencies; no copied source-pack definitions |
| note_revisions; note_acl_grants | Authorised body versions and ACLs admitted to the Save; external Markdown is editorial input |
| plan_revisions/activations; homebrew_versions/activations | Immutable authored versions and atomic R1 activation references; future intent is not an occurred fact |
| canonical_hash_nodes | Derived, reproducible authenticated index, not another editable truth store |

Reuse existing runtime_events, applied_patches, causal_ledger, idempotency_receipts, outbox, determinism proofs and input_admissions. Do not rewrite historical evidence. New discriminators/columns require approval. Existing v2_world_entities/edges must be assigned a single canonical owner or become rebuildable projections; do not leave a parallel writable graph of the same NPC/fact.

Required campaign-prefixed indexes: memory owner/minute/ID; knowledge owner/status; disclosure principal; actor location; quest status; objective dependencies; scheduler status/due-minute/ID; inventory owner/container; existing event revision indexes. Hashes do not replace ownership foreign keys.

Source packs stay immutable outside live records. Store exact references, version/manifest/definition hashes, supported instance deltas and admitted bounded knowledge. Missing versions block dependent operations; never silently substitute or duplicate a source book/statblock into live state. Mechanics authority NONE cannot grant mechanical resolution merely because a storage table exists.

### First-slice physical contract to review

Use TEXT stable IDs, INTEGER revisions/minutes/booleans with CHECK constraints, and explicit nullable references rather than magic empty IDs. Common record metadata: campaign_id, record_id, owner_entity_id, module_id, schema_version, row_revision INTEGER NOT NULL CHECK(row_revision>=0), visibility_policy_ref and row_hash TEXT NOT NULL. Primary key is (campaign_id,record_id); owner foreign key is (campaign_id,owner_entity_id) to entity_catalog. A column is canonical or derived, never independently editable in both a JSON body and typed column.

- npc_memories adds world_minute INTEGER NOT NULL, actor_id, causal_event_id, witness_mode enum, is_secret/is_unverified CHECK IN(0,1), summary TEXT with a registered UTF-8 byte limit, and immutable provenance. Ordinary new observation creation requires an owned causal event. Legacy import may retain unresolved evidence explicitly as legacy provenance, never manufacture a witness/event.
- npc_knowledge adds category enum, statement with registered byte limit, acquisition enum, status enum, evidence_ref, supersedes_id and admitted/revised action references. Supersession creates a new record and updates the prior status/link in one transaction; the original statement/evidence is retained.
- objective_progress uses primary key (campaign_id,quest_id,objective_id), status enum, completed/failed world minute and causing_event_id. Foreign keys reference its objective and the canonical event. The objective definition and progress do not both own the completion flag.
- relationships uses primary key (campaign_id,subject_id,target_id), supported numeric fields and last_change_event_id; the immutable adjustment event preserves history. Numeric representation/ranges are registered with the hash profile, not inferred from SQLite affinity.

Where a cross-campaign event foreign key needs (campaign_id,event_id), approve an additional unique index on existing runtime_events for that pair; its globally unique event_id alone is not a matching composite parent key. Deferrable event references are checked at commit when memory/progress and their event are inserted together. All indexes/constraints are migrations requiring review, even when they do not alter historical payloads.

Map every existing logical field to a typed owner, bounded schema-defined variant field or explicit migration rejection. Unknown legacy fields cannot be dropped or hidden in a new unlimited extension blob. Preserve ordered collections through stable IDs/order columns. Canonical JSON for a bounded variant payload is included in its row hash once; do not maintain a second mutable JSON image of the same typed values.

## 4. Bounded changes and the atomic authority transaction

Reuse normative StatePatch, WriteIntent and StateTransitionCandidate shapes. Proposed registered operation schemas include npc.memory.record, npc.belief.supersede, relationship.adjust, objective.complete and actor.move. Each binds owner, target/creation identity, expected target revision/hash, typed arguments, causal/epistemic evidence and validators. These names are proposed registrations, not enabled opcodes. Models cannot specify SQL, arbitrary field paths, registration or ACL bypasses.

Proposed initial application profile: at most 32 semantic operations/changed canonical fragments per action; bounded arguments and read dependencies. Aim for ordinary requests below 16 KiB and compound requests below 60 KiB, while the HARD cap remains 65,536 bytes. These are review budgets, not observed performance. Schema maxima such as 256 operations do not promise byte fit. WriteIntent embeds StatePatch: incorrectly repeating full shared patches can cause quadratic envelope growth. Measure the complete encoded request, including every repeated header/evidence object.

Preserve preflight before durable admission. Authorised read-only preparation may construct the exact candidate first; bind IDs, versions and model/RNG results before sizing. Then retain admission ordinal, dispatch fence, validation, staging and material commit. Do not append mutable context after preflight or call an LLM during recovery.

CommitAuthority alone gets the private writer capability and performs:

1. BEGIN IMMEDIATE; check active Save binding/profile, head/fence, request integrity, idempotency and expected global revision/root.
2. Read affected rows and a deterministic dependency closure. Verify actual typed values against row hashes, source pins and read-set revisions.
3. Independently validate registered operations and complete candidate invariants; no provider valid=true shortcut or external/model call under the writer lock.
4. INSERT/UPDATE/tombstone only affected canonical records, with checked compare-and-swap counts and SQL constraints.
5. Update changed hash leaves/paths, global revision/root/evidence head, immutable patches/events/outbox/ledger/determinism/receipt and admission APPLIED state in the SAME transaction.
6. COMMIT; dispatch external effects afterward via the outbox. A lost response is resolved using the durable receipt, not another mutation.

Connection-bound drivers may not open another writer or call commit. The existing full state_json UPDATE must not remain in this path. A logical compatibility projection is assembled on read, not persisted as a second canonical document after every change.

Reject invalid/oversized work before admission. For already-admitted invalid work, use reviewed authority disposition, preserving input evidence. Current discard_invalid_admission marks STALE; do not invent a terminal status or improve its audit semantics without separate lifecycle/schema review. Corrupt staging or unavailable handlers fails closed into operator recovery, not a skipped queue head.

## 5. Hashing and snapshot identity

B requires an approved versioned field-coverage/hash profile. Existing sha256_json(state) cannot silently become a metadata or Merkle digest. Existing JCS utilities are reusable implementation components, not permission to migrate historical hashes.

Proposed profile:

- Canonical record bytes use the existing RFC 8785 utility with approved numeric/Unicode constraints. Domain-separated leaves cover campaign, module/slice/schema version, record ID, row revision, canonical values, provenance and visibility. Hash columns and noncanonical timestamps exclude themselves. Unsupported legacy numbers require review, not coercion.
- A deterministic authenticated trie keyed by a digest of campaign/module/slice/record ID commits to all records and tombstones. Approve exact bit ordering, empty hashes, leaf/internal framing and collision/deletion rules with golden vectors. A compressed binary trie avoids a growing list of every leaf digest.
- The bounded head binds content/config/pin/module roots and a separately framed immutable event-chain head. Operational outbox claims/retry counts are excluded. Define event field coverage to avoid a cycle through state_hash_after or receipt hashes.
- Snapshot identity binds logical Save ID, campaign, global revision, world time, profile/version and roots. An event-only commit advances revision/evidence identity. New snapshots never claim byte-identical legacy hashes.
- A copied database initially has identical content roots. A branch-binding operation deliberately changes Save/snapshot identity; logical world content may remain equal. Parent receipts/hashes are untouched.

Hash-index rows are derived but atomically maintained; independently verify touched leaves/paths. Full rebuild must agree after migration/restart. Incremental caches do NOT detect arbitrary corruption in every untouched row: measure and require full integrity scrubs at open/checkpoint under an approved policy. Report that startup cost separately. No claim of constant-time full integrity is valid.

## 6. Validation and authoring boundaries

Each operation declares a read/write/dependency set; deterministic validators can expand it. Indexed queries/constraints or full checks must enforce global invariants. Do not assume every D&D rule is local.

Required invariants: campaign/entity ownership; exact source/module versions; monotonic time; witnessed-memory owner and causal event; belief history and disclosure; evidence-backed bounded relationship adjustments; quest DAG/terminal states; scheduler ordering; legal actor/map/grid association; supported HP/resources; nonnegative inventory, one owner and acyclic containment; covered combat turn/effect rules. Unknown mechanics coverage fails closed.

Initially compare scoped validation against full logical reconstruction after randomized operation sequences. Full shadow validation is a correctness stage, not the final performance result. Release scoped checks only with an explicit invariant dependency inventory; retain full migration/checkpoint audits.

Editorial drafts do not create world facts. Canonical note admission/ACL changes and plan/homebrew activation must enter the same authority transaction as their events/receipts. Current independently committing transition methods cannot be used unchanged. Confirmation is future intent; occurrence remains a separate validated event. Authoritative note bodies must be versioned in the Save or included as verified immutable packaged blobs in the approved design; copying SQLite alone cannot assume external Markdown files survived.

## 7. Recovery, SQL migration and WAL

Typed staging is a mandatory gate: approve a codec version/discriminator and typed recovery route under the SAME 64 KiB cap. Preserve the legacy decoder and exact historical bytes. encode_proof_request returning None is not a production workaround. Pin authenticated input, exact intents, validator/handler/profile versions and server-bound model/RNG results; verify staged fingerprints before recovery. Missing versions or corrupt bytes fail closed. Do not repurpose typed_fixture_write_intent or silently change idempotency hash coverage.

Keep one SQLite writer owner, WAL, synchronous=FULL and foreign_keys=ON. All typed changes and evidence share BEGIN IMMEDIATE/COMMIT. Approved deferred cross-row constraints must be checked before commit. Small record changes still rewrite physical B-tree pages: measure actual WAL frames/page changes rather than claiming zero amplification. Bound reader lifetimes and transactions, test busy timeouts, and checkpoint outside material commits under a monitored policy. Long readers can retain WAL. Do not weaken durability for benchmarks or copy only the live main database file.

Migration permission is separate from permission to implement a disabled driver:

1. Develop versioned readers, scoped/full validators, codec and driver behind a disabled format flag. Legacy Saves remain native; no A conversion first.
2. Approve additive SQL migration, hash/snapshot profile, module registrations, codec selection and activation semantics. Old binaries must refuse the new format before initialization/writes, not merely after a failed JSON read.
3. Convert only a deliberately selected NEW backup branch in maintenance mode. Verify integrity, source snapshot, pins and all authoring/note dependencies. Resolve pending admissions by reviewed policy; never delete an old oversized head.
4. Write bounded idempotent migration batches through an approved authority migration capability. Destination rows remain inactive; legacy state is the only visible world authority until activation. Bind every batch to the source logical digest and migration manifest.
5. Verify complete logical equality, ordering, ACL/provenance/source hashes and invariants. Activate through one bounded authority transaction recording the bridge from old snapshot hash to new roots/profile. Preserve past events, admissions, patches and receipts.
6. Interrupted batches resume from durable evidence or restore the untouched branch. After granular gameplay, rollback means a divergent pre-migration branch. Do not promise an automatic downgrade into an oversized monolithic request or drop post-migration actions.

One active format owns each campaign. No synchronous dual canonical writes. Temporary inactive migration rows and rebuildable compatibility views are not independent truth. Previously trimmed legacy memories cannot be declared restored; any reconstruction from historical evidence requires separate provenance review.

Old-binary protection needs more than a format flag: the old runtime does not check that flag before its initialization. Require a format-aware launcher before opening a writable Save and database-level fences against legacy canonical writes after activation. A proposed activation leaves a non-world sentinel at the old campaign_state key, with approved triggers rejecting legacy INSERT/UPDATE/DELETE for that migrated campaign; the typed driver uses the new canonical head/rows. The sentinel prevents legacy seed recreation and contains no second campaign state. Set the sentinel and format binding atomically, only after verified destination completeness. Fence any old authoring activation paths that would otherwise mutate canonical-looking status independently.

These fences are proposed SQL migrations, not implemented safeguards. An unmodified old executable with arbitrary writable-file access cannot be promised to make zero operational/initialization writes. The required guarantee is refusal before any canonical world mutation, with normal launch blocked before opening the file. Test both paths using the actual baseline executable. Preserve the original legacy image as an immutable migration archive/backup for auditing, not a writable alternate authority.

## 8. Campaigns, timelines and portable export

Retain multiple campaigns per database and whole-runtime SQLite backup branches initially. Do not add multiple simultaneously active timelines per campaign in one file or a copy-on-write timeline system in this milestone.

Define identity explicitly: campaign_id names the campaign; a logical Save/timeline ID names its active lineage; the SQLite container has separate backup identity. With one active timeline per campaign/file, records can remain campaign-prefixed. A whole-runtime fork copies all campaigns/evidence, then an approved branch-binding action assigns child logical Save identities without rewriting every entity key. Snapshot identity changes intentionally; content equality and snapshot identity are different checks.

Sessions, caches and mutations must bind logical Save ID plus campaign/character. Map this to normative SnapshotRef.save_id and the pinned runtime profile; the legacy dataclass/API mapping requires explicit compatibility approval. Reject another branch's mutation request. Reissue sessions for new bindings while preserving historical verification evidence. Copied idempotency receipts continue to prevent repeating already committed actions; new actions use fresh nonces. Each branch file is independent, not another writer to the same Save.

Later portable single-campaign export is an authority-controlled snapshot/dependency-closure operation, not SELECT * or a renamed whole-runtime backup. Include authorised records, required historical admissions/receipts/evidence, pins, module versions and note bodies at one revision. Exclude unrelated campaigns/auth secrets and private source-pack bodies; inventory assets by rights/reference. Import into an isolated container and verify hashes/closure. Export of only the current head cannot claim complete deterministic replay. Save identity/session rebinding and shared homebrew dependencies require explicit handling. This export work is a later approval gate.

## 9. Knowledge projections and Windows resource costs

Query authorised records before serialization. DM, character, party, NPC-private and note ACL boundaries are server rules, not React concealment. Retain epistemic provenance and superseded/retracted history. Do not label an NPC's belief objectively false to a player. Dialogue ownership comes from the linked interaction, not an extra characterId. Party broadcast needs an authorised action. Graph/search/UI indexes are rebuildable projections, not new state owners.

AI receives only bounded authorised context from these projections through the single shared Harness. No writer connection, raw SQL capability, direct persistence, private-secret generative reasoning or newly enabled source combat follows from normalization. Opaque roots do not grant permission to disclose private rows or inclusion proofs.

Measure Python working set, cache size, total app/model working set, main/WAL bytes, page writes, fsync latency and startup audit time on the existing modest Windows hardware. A retains large Python copies and global writes/hashes. B can scope ordinary reads/updates, but adds row/index/hash-node storage and still has O(N) full audit/export/checkpoint work. New small delta evidence reduces history amplification; retained evidence still grows with actions. Bounded per-record JSON is acceptable; a large NPC-memory or quest-history JSON column would recreate the original problem. No normalized CPU/RAM/disk/latency results exist yet.

## 10. Implementation acceptance matrix

These are REQUIRED FUTURE TESTS, not passes for an unimplemented design. Use dedicated original CC0 campaigns. Record generator/version, pins, request bytes, p50/p95/max commit/reopen latency, working set, main/WAL bytes, row/page write counts, roots and retained counts. Publish numerical summaries, not private source/model payloads.

| ID | Scenario | Required result |
| --- | --- | --- |
| G01 | 100 NPCs, 10,000 memories, 1,000 quest chains, 10,000 events | All records/pins/provenance retained; ordinary actions continue; no whole campaign payload write |
| G02 | 1,000 NPCs, 10,000+ memories, 10,000 relationship edges, 100,000 events | Indexed bounded reads, retained histories and no per-NPC unbounded history row |
| G03 | Same one-memory append at 100 and 1,000 NPCs | Wire size independent of unrelated population; ordinary target below 16 KiB |
| G04 | 10,000 authorised small actions | Exactly-once receipts/events; no trimming or pending-head poisoning |
| G05 | Compound memory/relationship/objective/schedule consequence | One revision/receipt: all canonical records/evidence commit or none |
| G06 | Oversized or excessive-operation/read-set compound action | Pre-admission refusal, unchanged root/rows and no silent splitting |
| G07 | Exact 65,536 and 65,537 encoded bytes | Boundary enforced for both supported codecs; no None-payload bypass |
| G08 | Wrong owner, pin, capability, schema or target hash | Refused; a provider valid=true flag cannot grant a write |
| G09 | Concurrent candidates from the same snapshot | Existing admission/fencing preserved; stale result cannot overwrite another commit |
| G10 | Crash after admission/dispatch before staging | Pinned deterministic inputs/results recover; no new AI generation |
| G11 | Crash after staging before material commit | Exact typed bytes decoded and revalidated; one commit |
| G12 | Fault after each row/hash/event/outbox/ledger/idempotency write before COMMIT | Full rollback across old and new driver fault points |
| G13 | Crash after COMMIT before HTTP response | Durable receipt resolves retry; no extra consequence/event/RNG draw |
| G14 | Corrupt staging or unavailable codec/handler version | Fail closed with durable operator disposition, not a skipped head |
| G15 | Exact retry and changed bytes under one nonce | No second mutation; conflicting replay refused; identical client IDs across campaigns safe |
| G16 | Altered private row, deleted leaf, corrupt hash node or reordered collection | Full rebuild detects mismatch; touched-path verification tested without false whole-file claims |
| G17 | Hash golden vectors and randomized differential mutations | Incremental root equals full rebuild across processes/order/restarts |
| G18 | Legacy native read/write; old ASCII/UTF-8 staged request | Exact historical request/receipt bytes preserved; no implicit conversion |
| G19 | Migration interrupted at every batch and activation | Resumable or restorable, no duplicate visible entities/partial activation |
| G20 | Actual old baseline executable opens new format | Launcher refuses before writable open; direct legacy canonical writes are fenced; operational-write limitations explicit, not a mocked predicate |
| G21 | Windows/Edge full restart, original and installed private-content journeys | Identity, pins, knowledge, clock, quest and placement recover; real provider PASS only if available |
| G22 | Divergent full-file branches and cross-branch replay | Parent unchanged; child diverges; correct Save-bound sessions and historic receipts |
| G23 | Campaigns reuse entity/action/nonce IDs | No cross-campaign links, disclosure, receipt collision or mutation |
| G24 | DM/player/observer/preview and forged interaction owner | Knowledge/notes/dialogue filtered server-side; no secret summaries or false-belief labels |
| G25 | Plan/homebrew activation faults | Authored status, canonical activation, event and receipt atomic; draft is not occurrence |
| G26 | WAL long reader, busy writer, timeout and process kill | Bounded failure, correct recovery and monitored WAL growth; durability unchanged |
| G27 | Supported inventory/resource/spatial operations | Single ownership, no cycles/negative quantities, legal grid/time, only covered mechanics |
| G28 | Held combat/private-secret inference | New storage cannot activate unsupported rules or secret-text inference |
| G29 | Export/import closure, when separately approved | Exact authorised campaign/evidence closure, no unrelated secrets; missing packs reported by pin |

Proposed performance budgets for review, NOT measured promises: no-AI ordinary commit p95 below 250 ms at 100 NPCs and 500 ms at 1,000; ordinary request below 16 KiB; accepted compound request never above 64 KiB; non-model Python working-set target below 512 MiB. Report p99/max and storage latency as well. Measure with real durability and concurrent UI reads. A missed target causes profiling/review, never history deletion or weaker hashing/durability. Separate full integrity-audit startup from lazy gateway creation and frontend readiness.

## 11. Gates, sequence and rework

| Gate | Required concrete approval/deliverable |
| --- | --- |
| D0 | Accept C/B destination, legacy compatibility and no mandatory A migration |
| D1 | Reviewed owner/slice/operation schemas, module/access/provider pins and normative-to-runtime mapping; no assumed CP149 registration |
| D2 | Typed durable codec/discriminator, request-hash coverage, Save-bound snapshot semantics and incremental hash profile/golden vectors |
| D3 | Approved additive SQL migration and connection-bound authority driver, activation and old-reader refusal; no automatic initialization side effects |
| D4 | Disabled isolated implementation with failure/differential suites, not production conversion |
| D5 | Separate opt-in branch conversion permission, interruption/rollback and measured large-world acceptance |
| D6 | Paired backend/frontend capability negotiation, complete gameplay/security/recovery evidence and explicit remaining holds |

Develop by slice: identity/config/clock and immutable history reads; NPC knowledge/observations/relationships and quests; routines/spatial; supported actor/inventory/combat records; canonical authoring activation. Activate a migrated campaign only when its complete dependency closure is supported. Software may be developed incrementally without splitting one campaign between two writable authorities.

Retain R1 ownership, ordered admission, dispatch fencing, evidence, source pins, handler intent semantics and compatible UI commands. Refactor full-document action builders, scoped validation, hash/snapshot/codec binding, typed storage reads, projection queries and authoring activation transactions. A's temporary page format would add migration/recovery testing and mostly discardable catalogue code before this same work.

Approval for design/disabled implementation scope D0-D3 is distinct from D5 permission to convert even a disposable Save branch. No Save migration, normalized driver, new hash profile, registry activation, frozen schema edit, protected merge or production conversion is authorised by this document.
