# VadAllFate — HARVEST-02-B1C: R1 authority, truthful perception, and clock idempotence

**Independent source review:** 2026-10-28. **Status:** SOURCE-VERIFIED CORRECTIVE ACCEPTANCE BRIEF; no runtime patch or independently executed suite in this review.  
**Reviewed backend:** `fa4c8cc09fd24ca413e474d22a309ce7b8fa653a`. **Frontend:** `fce466a1b8197f55554cc6af82afc5d09aa54c49`. Both confirmed on `v2/srd51-rules-browser`; fetch latest heads before editing.  
**Agent reports:** 35/35 harvest tests, 162/162 V2 tests, 451/451 backend tests, 147/147 frontend tests, clean Vite build. This independent reviewer examined pushed source but **did not run these tests on the Windows machine**; supplied task transcript includes multiple stopped/retried runs, so keep final test logs for audit.  
**Governance:** `docs/V2-MASTER-DEVELOPMENT-GOALS.md`, `docs/V2-HARVEST-02B-NPC-COGNITION-LIVE-INTEGRATION-QA.md`. R1 One Commit Authority, single canonical writable campaign SQLite, no frozen schema changes without reviewed migration, no main merge, Step 51 and CP017B holds, role secrecy and five modes.

## Source-reviewed real progress

- `NPCCognitionState.from_npc_dict`/`sync_to_npc_dict` maps the harvested personality, memory, relationship, pressure and goal domain model onto existing `npc.cognition` state.
- `_process_spatial_perceptions_and_cognition` is now called inside `_synthesize_action_outcome`, and its in-memory changes to `state["npcs"]` are part of the **ordinary** `/campaign_doc_json` state patch. That path can commit via R1.
- Python LOS/distance is used to choose `SAW` versus `HEARD`, and stable `mem:{action_id}:{npc_id}` identifiers suppress replay duplicates while retained in the NPC memory list.
- `tick_world_scheduler()` now calls `NPCCognitionEngine.evaluate_routine_tick()` and `WorldArcManager.tick_world_events()`, with no per-NPC local LLM loop.
- Context compiler hydrates authorised FTS5 hits not already in a limited initial graph set; the report includes a distant-entity fixture. Recovery identity now defaults to player when `authenticatedRole` is missing rather than elevating based on actor ID. Both changes deserve long-session/legacy-replay tests.
- Seven new B1 integration tests exist; tests exercise a true Python gateway and SQLite file rather than pure function only. They do **not** constitute a real Windows VTT/AI dialogue acceptance of the cognition feature.

## P0 BLOCKER — Unlogged direct canonical SQLite writes bypass R1

`v2_campaign_gateway.py` `_write_campaign_authority_state()` (~2088–2104) obtains `store._connection`, issues a direct `UPDATE campaign_state SET revision=?, state_json=?, state_hash=?`, and calls `commit()` **without** ActionEnvelope -> admission -> StatePatch validation -> CommitRequest -> CommitReceipt, immutable audit or idempotency ledger.

It is used by:
- `update_npc_cognition()` (~2828–2878) to save NPC goal, relationship and routine memory changes. That method also creates `mem:update:{npc_id}:{world_minute}:{uuid4}`, which changes on retry.
- `tick_world_scheduler()` (~3283–3289) to save arc clocks and DM sparks after separately committed `MOVE_TOKEN` actions.
- Test fixtures use it to seed state. Retain a separate **explicitly test-only fixture helper** if needed; never expose it as a production world mutation path.

**Required fix:** migrate all production NPC/clock/spark mutations to approved versioned R1 commands and state patches, ideally with a scheduler/system actor authority distinct from an unbounded host bootstrap impersonation. Ensure all validation/receipts, durable event IDs, actor roles, per-save scope and snapshots are preserved. Concurrent actor movement and arc updates must be revision-safe; no stale `fresh_state` full-document overwrite. Audit all other direct `campaign_state` writes on feature branches; do not remove low-level R1 store functions or alter frozen schemas. Test audit ledger + idempotency receipts + restart + recovery at every interruption boundary.

## P1 — Observation truth: hearing != seeing and client intent != confirmed theft

`_process_spatial_perceptions_and_cognition()` (~2890–3065) derives the label `Witnessed {actor_id} committing theft of {targetItem}` from `SKILL_CHECK`, `isTheft`, `targetItem`, `valence` and coordinates supplied in an action payload. For LOS-blocked NPCs within a fixed radius, it then records the **same detailed summary** with `witness_mode="HEARD"`. Thus an NPC who merely hears a noise through a closed door may learn the thief identity, target item, and crime status despite not perceiving them.

Additional issues:
- `SKILL_CHECK` with Sleight of Hand/Stealth is classified as theft regardless of whether an actual theft and its rules outcome occurred. `ATTACK` is checked, although actual player attack action appears to be `ATTACK_ACTION`; confirm effect coverage.
- `payload["sceneId"]`, coordinates, `isTheft` and `valence` need to come from validated state/committed outcome, not free player assertions. Silent/failed actions should not trigger fabricated memories.
- `HEARD` fallback checks distance, but no distinct sound source volume, silence effects, barriers/attenuation, identities or stealth success. It should not say "blocked by solid walls = no memory" until this is actually modelled.
- Real-world senses can produce beliefs/suspicions, but NPC certainty and identity must reflect actual evidence. `HEARD` should normally store something like "heard a chest opening / raised voices nearby, source not identified", not "witnessed Lyra stealing manifest" unless identification was separately established.

**Required fix:** derive an explicit server-authored `ObservedEvent` from a committed, validated action with scene, source, visible effects, audibility, world minute, roles, certainty and provenance. Run the Python sight/hearing policies to produce audience-specific `NPCObservation` with only verifiable witnessed details, then update private episodic memory/belief/suspicion through R1. Support failed/contested stealth, noisy/silent events, doors and walls, darkness, later false rumours and direct communication. Do not have the local LLM grant hidden details.

**Regression:** one NPC SAW a real theft; second only HEARD an unidentified sound; third out of range knows nothing; later one receives unverified hearsay and does not convert it to ground truth. A failed Sleight of Hand attempt that never stole an item must not propagate as completed theft. Verify player projections, NPC dialogue and event logs after restart.

## P1 — World-event clocks must advance once, on authoritative triggers

`tick_world_scheduler()` (~3125–3152) passes persistent `state["occurredTags"]` to `WorldArcManager.tick_world_events` each tick. The world-arc implementation (~485–530) increments segments whenever a matching tag exists, with **no per-clock event-ID consumption/processed-trigger key**. Re-running at the same world minute or carrying a past tag into later ticks can advance the clock again, duplicate DM sparks and trigger a world event prematurely. Example: `alarm_raised` remains in occurredTags while a one-hour clock advances on an unrelated time tick.

`MOVE_TOKEN` scheduler action IDs use `uuid.uuid4().hex[:6]`, and `update_npc_cognition` uses a new UUID for routine memories; same-minute retries can produce distinct action IDs, commits and duplicate memories. Enforce per-campaign/save, actor, world tick and planned-step idempotency, with conflict-safe revision handling.

**Required fix:** consume immutable committed event IDs exactly once per clock and bounded time interval; store last-processed event/clock or dedupe keys through R1; stable event/spark IDs; no repeat when the same minute/condition is evaluated twice or process restarts. Include backdated/replayed events, multiple condition tags, clock defusal and paused/offline time policy tests.

## P1 — Content portability and real Starlit Revels evidence

`build_starlit_revels_cast()` is a hardcoded **synthetic** cast of 14 illustrative NPC profiles. Preserve it as a labelled test fixture, **not approved module canon**. Real names, relationships, secrets, schedules and event conditions must come from an authorised campaign import/DM confirmation rather than source-code edits. Continue full Blue Alley authentic-art and Starlit Revels integrated tests as independent acceptance gates.

The B1 frontend commit updated only an implementation register. There is no new frontend cognition UI or demonstrated actual Windows scene with player/NPC dialogue using the freshly integrated effects. Test a real DM/Player session and display verifiable per-character memories/relations safely in DM inspection; do not leak to players.

## P2 — Other quality and provenance checks

- `search_entities_fts5` strips `%` and `_` from `actor_id` before a `known_by_json LIKE` predicate. Prefer equality via JSON membership (`json_each` or a permitted indexed ACL projection) rather than transforming actor IDs or allowing substring wildcard assumptions. Verify player-specific secrecy and identity collision cases.
- The FTS5 virtual table rebuild/backfill occurs in `_init_schema`; check migration ownership/version gate and ensure crash-safe recovery for an existing index. The read-only SRD DB must remain untouched.
- The logged source says `451/451` full backend suite; preserve exact command, timed output and exit status separately from a selected `162/162` V2 run. Automated passing != human acceptance.
- Review whether trimming `memories[-50:]` causes accidental relabeling or duplicate old event memories on replay: canonical old memory can be archived to a durable event ledger with permission-scoped retrieval rather than silently forgetting action IDs.

## Corrective execution order

**B1C-00:** remove production direct writes and preserve R1 audit before building further autonomous mutations.  
**B1C-01:** server-grounded, distinct SEEN/HEARD/LEARNED_FROM_OTHER perceptual memories and no freeform player guilt.  
**B1C-02:** clock/event/scheduler idempotency and world-minute replay/recovery.  
**B1C-03:** authenticated real Windows gameplay with two NPCs, DM secret/projection tests, restart, then modular Starlit Revels import and soak.  
**B1C-04:** only then start HARVEST-02-C optional annotated-map import and editor reuse, without replacing zero-crop VTT or Python spatial authority.

**Evidence:** full 451+ backend regressions, 147+ frontend tests, negative/recovery/concurrency tests, real Windows app/AI scene and source-vs-fixture content declarations. Update implementation and harvest registers. Commit/push only development branches; no main merge or forced push.
