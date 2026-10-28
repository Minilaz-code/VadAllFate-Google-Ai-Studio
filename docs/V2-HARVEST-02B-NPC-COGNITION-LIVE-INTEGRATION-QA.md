# VadAllFate V2 — HARVEST-02-B independent QA: bridge cognition to the live world

**Review:** 2026-10-28. **Evidence grade:** SOURCE REVIEW ONLY; not a local test rerun or human gameplay acceptance.  
**Reviewed backend:** `b3afcf22e40a28fe1ba2bc82fdba1646683ab819`; **frontend:** `f39eeea047df4e7e06b2ecb11dec707cdca3684c`. Fetch latest heads first.  
**Reported Antigravity results:** A1B 21/21, cognition 7/7, **selected** `test_v2_*.py` 148/148, frontend 147/147, clean build. This report is **NOT the former full 430/430 backend-suite run**; verify all backend tests before broad sign-off.  
**Guidance:** `docs/V2-MASTER-DEVELOPMENT-GOALS.md`, `docs/V2-HARVEST-02-MIT-REUSE-EXECUTION-PLAN.md`, `docs/V2-HARVEST-02A1B-INDEPENDENT-QA-AND-NPC-HANDOFF.md`. Preserve R1 Commit Authority, SQLite database ownership, Step 51/CP017B holds and all five modes.

## Source-verified progress

- `src/vadallfate/runtime/v2_npc_cognition.py` implements real dataclass domain models: `NPCPersonality`, `NPCRelationship`, `NPCGoal`, `NPCEpisodicMemory`, `NPCCognitionState`, `WorldEscalationClock`, `WorldArcManager`, and `NPCCognitionEngine`.
- Seven automated tests exercise pure functions, role-agnostic witness booleans, clamping, serialized dict roundtrips, simple conditional arcs, and an in-memory 14-NPC constructor.
- A1B adds SQL BM25 best-first matched-only ranking; history filtering/compaction; recovery staged and dispatch-path state-delta validation; some role scoping.
- A pinned MIT Lorekeeper source SHA and attribution are included in source/provenance and THIRD_PARTY_NOTICES.

## Primary integration HOLD — B is not yet a live NPC world subsystem

1. **No live invocation found.** The inspected `v2_campaign_gateway.py` contains existing `_evolve_npc_cognition()`, `tick_world_scheduler()` and `update_npc_cognition()` but no import/use of the newly added `NPCCognitionEngine` or `WorldArcManager`. The new module's pure functions appear in its own tests, not in authoritative gameplay. Preserve and integrate with existing cognition; do not create a parallel state model.
2. **Witnessing manually stipulated.** The two-NPC test invokes `process_action_observation(..., can_witness=True)` for Jorren and `False` for Thalor. This demonstrates branching of an input flag, **not** line-of-sight or perception calculations from Python scene geometry, time, distance, closed doors, senses or obscuration.
3. **Memory not committed.** `process_action_observation` mutates in-memory `NPCCognitionState` and generates `mem-{uuid.uuid4().hex[:8]}`. There is no demonstrated R1 event/StatePatch/CommitReceipt for memory, trust, belief, goal or escalation changes. UUID4 IDs can differ on replay/retry; derive stable IDs from committed event IDs + NPC + semantic effect key and make projection idempotent.
4. **Routine and world clocks not wired.** Existing `tick_world_scheduler()` loads `npcRoutines` and submits `MOVE_TOKEN` but never calls `NPCCognitionEngine.evaluate_routine_tick` or `WorldArcManager.tick_world_events`. These new routines are not automatically progressed from committed authoritative Master World Clock advances. `WorldArcManager.tick_world_events` checks event tags, but no observed elapsed-minute advancement is implemented despite high-level report language.
5. **14-person roster is a fixture.** `build_starlit_revels_cast()` creates generic hardcoded identities/characteristics; the test loops through those objects and calls a pure routine function. **Not** imported/licensed source campaign content, live AI social interactions, movement, persisted NPC memories, 14-agent scheduling, dialogue, or multi-hour soak. Keep Starlit Revels acceptance PARTIAL/HOLD rather than source-backed.
6. **No universal fact promotion.** The claim that unobserved rumours/facts can never become universal truth is not established by a direct `can_witness` flag test. Enforce fact/belief/rumour/perception provenance per-NPC, including delayed witness reports, lies, suspicions and hearsay.

## A1B remaining hardening to verify alongside integration

7. **Search recall end-to-end:** `HarnessContextCompiler.compile()` still starts with `query_graph(..., limit=40)`, builds `raw_node_map` from those 40 nodes and includes FTS matches only if URI is already in that map. While `KnowledgeQueryService.search_fts5` can retrieve >500 indexed entities, the **actual LLM context** may still omit a valid far-off match never included in 40 graph nodes. Introduce safe ranked candidate admission via audience-filtered dossier hydration or an authorised graph query expansion before RRF. Test a requested NPC beyond the first 500 indexed entries appearing in `compiled.context_text`.
8. **Recovery privilege provenance:** staged and dispatch recovery read `authenticatedRole` but still fall back to treating actor ID `dm-1`/`dm_host` as DM if durable role is absent. Prove no untrusted or legacy admission can exploit fallback and preserve signed/verified role + actor binding across R1 crash/restart. Do not silently elevate invalid or missing evidence; safe review/migration on legacy records.
9. **Safe search metadata:** verify indexes/backfill are transactional and not a silent frozen-schema migration. Check `known_by_json LIKE` vs typed known-by membership and role transitions; escape any SQL LIKE wildcards from authenticated actor IDs. Non-DM index must not match private perception/DM lore or allow ranking/leak side-channels.
10. **Full suite and provenance:** perform all backend tests (not only 148 selected V2 tests), frontend suites, and real Windows gameplay evidence. Source module exists != integrated feature != human acceptance.

## Next implementation milestone — B1: R1-bound living-world cognition

### Step 1 — One canonical cognition shape and projection
Map new six-axis personality, directed trust/bonds, goals, pressure and episodic memory onto **existing** `npc.cognition`, world entity/relationship knowledge graphs and approved migration. Do not create separate database, independent truth stream or duplicate conflicting NPC record. Use versioned codec and tests for older Saves.

### Step 2 — Real event → perception → memory pipeline
For a real committed player `ActionEnvelope` (e.g. Lyra steals an object), have Python derive the authoritative event identity, location/world minute, physical source/target identities and relevant senses. Query spatial engine for each NPC with their own observer identity, LOS, doors/walls and range; determine witnessed/heard/learned-from-rumour separately. Only then invoke `NPCCognitionEngine.process_action_observation`. Keep source facts vs personal memories, beliefs, rumours and misinformation separate.

### Step 3 — R1 and replay safety
Produce state proposals for NPC memory, relationship, goal and pressure updates through R1 and record CommitReceipt. Use stable action/event IDs and replay-safe per-observer dedupe keys; proof against retry, crash-before-commit, committed-before-response, and process restart. Never make direct SQLite writes from a sidecar loop.

### Step 4 — World clock + scheduled decisions + conditional world arcs
On verified Master World Clock advancement, evaluate versioned routine records with `evaluate_routine_tick`, spatial pathing, initiative/occupancy and goal pressure. WorldArcManager advances *only on approved elapsed minute/condition semantics*, once per world minute/trigger; commits DM-only sparks and does not fabricate player encounters. Keep deterministic no-model routine actions separate from bounded AI decision requests.

### Step 5 — Genuine tabletop acceptance
Run actual Windows local-host game with Thor/Lyra (or lawful fixtures) and two NPCs: one genuinely sees a theft, one lacks LOS, one hears a truthful or false report later. Verify each memory, belief, trust, movement, NPC dialogue and DM-secret player projection. Close/restart and confirm same world minute, actor coordinates, memories and relationship state; simulate replay and network rejoin. Then load **approved canonical** Starlit Revels content (no fabricated canon) and scale to a 14-NPC meaningful encounter and soak.

### Step 6 — Acceptance evidence
Produce test matrix for successful/negative LOS, radius, secret perception, fabricated rumour, absent character, same-tick concurrent moves, reruns/restarts, R1 idempotence, conditional world events, and local 4–6GB hardware. Report PASS/PARTIAL/HOLD per vertical slice, not merely module coverage.

**Next action:** Implement the narrow B1 end-to-end integration before expanding to HARVEST-02-C. Preserve Blue Alley real-map acceptance separately and leave frontend wholesale layout unapproved. Commit/push existing V2 branches only; no main merge or force push.
