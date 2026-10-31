# Proposed application Save storage v2 - approval required

Status: DESIGN ONLY. No application Save is converted by this branch. This is a structural application Save-format migration requiring review under the user's Phase 2 instructions and the standing no-migration-without-approval rule. The R1 65,536-byte request limit, CommitAuthority, StatePatch wire shape, frozen schemas and SQLite authority remain unchanged.

## Why a migration is necessary

The application stores all NPCs, memory, knowledge, quests, relationships, schedules and recent story in one string, campaign_doc_json. Each ordinary action replaces that string. The staged codec serializes the full CommitRequest, including action/snapshot/validation metadata, proposed writes and event payload. The document is JSON inside another JSON string, adding escaped quotes/backslashes. The staged request and applied patch also remain as durable recovery/ledger evidence; Save disk growth is larger than just the current document.

Existing _apply_patch accepts only one-level scalar set/increment paths. /campaign_doc_json/npcs/... is rejected. The decoder accepts scalar values, not nested objects/arrays or a JSON-patch operation. Increasing the frozen size limit or bypassing its codec is excluded. Merely splitting a long string into positional chunks is inadequate: insertion near its beginning can change every later chunk and still require an oversized atomic request.

The existing application validator recognizes campaign_doc_json and reconstructs logical D&D state from it. It does not validate a proposed collection of new storage fragments as an equivalent application document. Simply writing fragments with today's validator would therefore bypass important logical checks. Recovery, projections, content reads and Save inspection also currently load that one string directly.

The frozen normative schemas are broader than the deployed legacy dataclasses: ada-r1-actions.schema.json defines StatePatch.operations and ada-r1-validate.schema.json defines validated_write_intents; the 0.3.0 state-module schema defines registered module capabilities. Those shapes are not the current application's scalar proof codec. A broader schema does not authorise an unregistered production binding. This branch does not activate typed state fragments, change machine profiles, advance CP149 or claim production source trust. The proposal concerns a reviewed application format within the currently deployed path; any required normative binding change remains a separate gate.

## Proposed representation (not installed)

Use the existing canonical campaign_state row and existing scalar StatePatch operations. No new authority database/table is needed. Preserve world_minute, commit_sequence and receipt/revision/hash mechanisms.

1. Versioned root descriptor in campaign_doc_json: a small JSON object containing format=app-storage-v2, encoding version, logical-root reference and logical-document hash. It is never interpreted as a legacy campaign document.
2. Stable top-level slot names under a reserved app2_ prefix. A slot name is a base64url encoding of its logical path, with no slash, bound and checked by the adapter. Values remain legal scalar strings containing canonical JSON. Reserve storage metadata keys separately; never derive arbitrary protected root writes from model output.
3. Object/key catalogues and arrays use bounded pages (initial proposal: maximum 8 KiB UTF-8 per page, maximum 32 child references per catalogue page). Arrays retain stable ordering/index metadata; NPCs, memories, knowledge admissions, quest objectives, events and source pins remain individually addressable. Very long strings use explicit ordered UTF-8 chunks without splitting code points. There is no unbounded root manifest or per-NPC memory blob.
4. A normal action reconstructs the logical before-state, applies existing deterministic handlers, then diffs before/after logical state into changed storage pages. Unchanged pages are absent from the request. Candidate writes, descriptor/hash changes, monotonic world time and event are one R1 CommitRequest.
5. Reconstruct the entire candidate logical document in memory for validation. Validate slot names, page/hash/index integrity, unique entity ownership, exact source pins, role permissions, time and all existing state-delta rules before admission. Independent recovery repeats that validation against the authoritative base snapshot. The large in-memory logical validation document is never embedded in the staged request.
6. Keep the existing codec and preflight. If one genuinely atomic action changes more than fits in 64 KiB, reject before admission with no partial gameplay effect. Background work may use separately defined bounded scheduler events, but must not silently split a player's atomic action or bypass R1.

Precise storage schemas, reserved prefixes, maximum depth/page counts and feature negotiation must be reviewed and versioned before implementation. This proposal is not permission to change frozen machine-state contracts or register production source mechanics.

## Migration transaction plan

- Host-only maintenance operation on an explicitly selected NEW Save branch; never silently convert an existing or production Save. Stop other writers; verify SQLite integrity, foreign keys, canonical state hash and installed content pins. Keep the original backup and record its snapshot/hash.
- Drain valid pending admissions first. Preserve/recover old staged requests using their exact stored bytes. A previously blocked unstaged oversized admission requires explicit operator review; do not delete or silently reinterpret it.
- Write deterministic migration pages through ordinary R1 staged/validated commits in bounded batches. The legacy root remains readable until activation. Each batch binds the source snapshot, operation ID, page hash and verified maintenance state; it is not an LLM proposal. Migration remains resumable and idempotent. New ordinary writers refuse a Save under maintenance.
- Before activation, reconstruct all pages and compare canonical logical-document hash, every collection's ordering/counts, source pins, visibility/provenance and world clock against the frozen source document. Reject any mismatch.
- Atomically activate the small versioned root through R1 after validation. The large old root can be replaced only after all its information exists in verified pages; all historical R1 events, admissions, applied patches, receipts and backup remain. Activation must fit the unchanged codec.
- A failed or interrupted pre-activation batch leaves the legacy document intact and resumes from verified page receipts. Interrupted activation follows standard staged-result recovery and exactly-once commit.

## Compatibility and rollback

| Case | Required behavior |
| --- | --- |
| Legacy Save/new runtime | Read natively; no implicit conversion. Future legacy writes preserve its format. |
| Legacy staged request/new runtime | Validate and commit the exact stored request/patch bytes. UTF-8 optimization must not rewrite it. |
| Legacy unstaged admission | Preserve authenticated provenance and explicit recovery disposition; no invented inference or silent discard. |
| V2 Save/new runtime | Materialize and validate the logical document through the versioned adapter. |
| V2 Save/old runtime | Fail closed with an unsupported-format message before any mutation. No fake legacy fallback. |
| New browser/old backend | Capability negotiation; disable unsupported authoring/storage controls. |
| Interrupted migration | Original branch and backup remain intact; migration receipts identify completed batches. |
| Rollback after V2 gameplay | Restore the explicit pre-migration branch, creating a divergent timeline. Do not claim old code can read a grown V2 Save or silently lose post-migration actions. |

Previously trimmed legacy NPC-memory/interaction windows cannot be declared restored by migration. Existing canonical event and applied-patch evidence must remain intact; any reconstruction of older cognition requires a separate provenance-reviewed action.

## Evidence already supplied

scripts/measure_campaign_capacity.py creates only disposable original-content Saves. It measures real application requests and an exact 65,536/65,537-byte boundary. Its separate SYNTHETIC_NOT_APPLICATION_STORAGE proof puts over 1.29 MB in existing legal scalar slots, performs small staged commits, reopens the store, recovers a staged interruption, verifies exact duplicate replay and isolates a copied timeline. No application reader or validator is switched to that proof format. It demonstrates authority feasibility, not production approval or working large-campaign gameplay.

Current safe changes retain history, use equivalent compact UTF-8 JSON, preserve preflight, expose host-only capacity estimates, report incomplete background scheduling and namespace new commit-request IDs by campaign. Old staged IDs remain unchanged.

## Approval and acceptance gates

Approval requested for implementing and testing this versioned application storage adapter and explicit branch-only migration, without changing frozen R1 schemas or the 64 KiB limit. A separate approval is required if implementation discovers any frozen-contract change is actually necessary.

Before publication as working storage: test legacy and V2 reads, staged/unstaged/post-commit failure matrices, exactly-once duplicate/conflicting input, stale snapshots, source/role boundaries, missing/corrupt/reordered pages, multi-campaign isolation, full Windows restart and SQLite branching. Use original stress worlds at 100/1,000 NPCs and 10,000+ memories, retaining all knowledge/events, and record actual request-size and latency distributions. Include a deliberately oversized multi-page action and verify no queue poisoning or partial canonical mutation. Measure O(N) reconstruction/hash CPU and memory; targeted request size alone does not make hashing or disk retention constant-time.

Source combat, private-secret generative reasoning, frozen R1 production registration, CP149/CP150, production Saves and original Antigravity checkouts remain held/protected.
