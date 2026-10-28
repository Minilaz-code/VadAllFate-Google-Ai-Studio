# VadAllFate V2 — Authoritative 2D Spatial World, AI Movement and Starlit Revels Stress Test

**Decision date:** 2026-10-28  
**Status:** APPROVED REQUIREMENT / DESIGN AND TEST CONTRACT — NOT IMPLEMENTED OR VERIFIED  
**Applies to:** Python runtime and React VTT on `v2/srd51-rules-browser`; alongside `docs/BLUE-ALLEY-VTT-ARCHITECTURE.md` and the existing V2 integration, knowledge graph, portable pack and player experience instructions.

## User goal

Play the **Starlit Revels** event associated with **Devil of a Night** as a real-world stress test. VadAllFate must behave like a persistent 2D videogame simulation: actors (PCs, named NPCs and creatures) have durable coordinates on a specific scene; Python knows and validates where they are; the AI can request contextual movement; all movement, collision, interactions, perception and targeting use shared canonical geometry. Token images are projections of canonical actors, not their authority.

**Do not confuse Starlit Revels with other works called The Revel.** Recover source actor/scene/event data from the existing approved event preparation and any available CV12–19C materials before migration. Planned identifiers include `CV_EVENT_STARLIT_REVELS` and 14 named Revel participants, with existing Davion/Mylon/Duessa to be adopted by stable identity where applicable. Do not claim these actors are already integrated in this branch. Keep any massacre victims and conditional encounters inactive until their actual scenario triggers fire.

## Current implementation gaps observed by source audit

1. Python `MOVE_TOKEN` in `v2_campaign_gateway.py` presently takes `targetX/targetY`, bounds-checks against hardcoded `0..30`, then sets token coordinates. It does not enforce scene occupancy, walls, door crossings, path validity, path length, movement budget or scene identity.
2. React `BattlemapCanvas.tsx` click/drag callbacks presently emit 0–100 **percentage** positions calculated from grid cells, while Python expects nominal integer cells (0–30): a real, unsafe coordinate mismatch.
3. `battlemapSessionManager` is frontend, explicitly **non-authoritative in-memory** map state. Persisted image, calibrated grid, walls, fog and actor positions must be projected from the approved backend; tab persistence is not restart persistence.
4. Existing LOS, fog and wall utilities in React are valuable previews, not sufficient server-side rules authority.
5. Existing sample 30×30 bounds and `save-main` are NOT general production scene/world contracts; migration needs versioned adapters and backwards-compatible tests.

## Architecture and authoritative data model

- **Scene authority:** each active actor placement has stable `campaign_id`, `save_id`, `actor_id`, `scene_id/map_id`, canonical `x_cell`, `y_cell` (discrete or fixed-point grid coordinates) and a sized **2D footprint**. Optional `facing`, `movement_mode`, `posture`, `last_moved_world_minute`, `revision`, `source`, and occupancy/visibility metadata. Use existing SQLite and validated migrations; no second authoritative DB.
- **Scene versus region:** a room/battlemap has local coordinates, while off-map entities can be located by building/region/route and a scheduled activity; no impossible single universal x/y for Waterdeep. Map transitions explicitly atomically change scene association and position.
- **Coordinate spaces:** natural image pixels, grid overlay (aligned to source), canonical scene grid/feet and per-client viewport pixels are separate. Only grid/world coordinates cross the runtime action boundary. Pan/zoom and artwork grid calibration must not alter actor positions. Keep original image uncropped.
- **Footprints:** small/medium default 1 cell; larger creatures occupy multiple cells or equivalent footprint shapes. Occupancy/bounds and walls/doors are deterministic 2D checks. Use simple tiles, line segments, AABB/circle/footprint intersection as needed; no heavy 3D physics. Grid-based A* / Dijkstra pathfinding and Bresenham/raycast LOS are enough for initial version if validated against existing wall, cover and terrain semantics.
- **Knowledge:** maintain separate ground truth vs individual NPC/player observed/remembered positions. Hidden NPCs and DM secrets must not leak through player projection, spatial query, event text, fog or token rendering. NPCs can act on their own beliefs rather than omniscient map access.
- **Persistence:** committed occupancy updates and scene IDs survive app restart, reconnection and save reload; no optimistic frontend move can impersonate a committed move. Log spatial events with before/after positions, source, action/receipt, world minute and visibility.
- **Time:** Python's Master World Clock and scheduler drive travel/routines/encounter turns. No LLM or frontend decides time advancement or event activation independently. Moving an actor off camera is supported via scheduler spatial actions at the correct granularity.

## Player, AI and scheduler movement contract

1. **Intent:** player drag/click, human DM order, AI Director/NPC tool request, or runtime routine schedules `MOVE_TOKEN` / versioned movement intent with actor, scene, destination or goal and allowed mode. Do not allow AI to write coordinates into SQLite directly.
2. **Authorise:** check verified actor identity, ownership, DM override authority, knowledge and scene scope; reject forgery or cross-scene displacement.
3. **Plan:** Python reads immutable scene geometry and occupancy snapshot; validates map boundaries, wall/door/terrain crossing, footprint clearance, movement speed and resource budget, range/diagonal rules (explicit rules-pack choice), and pathfinding. Clear reasons for blocked paths or inaccessible destinations.
4. **Resolve:** deterministic position, route length, reach/cover/LOS and triggered zones computed by Python; reactions/opportunity attacks and AoE only when mechanics/source coverage approved. Do not invent held monster mechanics or fabricate rolls.
5. **Commit:** preserve `ActionEnvelope → SnapshotRef → Rules/StatePatch → Validation → CommitRequest → CommitReceipt`. Atomic authoritative updates to positions, encounter resources, world events and spatial state using existing R1 contracts; idempotent submission, concurrency/revision tests. If scene/geometry or position changed since proposal, replan or reject stale request.
6. **Project:** React receives role-filtered updated actor positions and animates along the **committed route**; no frontend percentage-coordinate writes as authority. AI receives a compact, permission-scoped `SpatialContext`/tool result with visible occupants, distances, obstructions, reachable positions and local exits rather than screenshot/pixel reading.
7. **Narrate:** AI is free to describe intent/outcome using actual returned facts, but cannot claim travel, attacks, hearing or sightings that Python rejected.

Example intent (illustrative, not yet a frozen schema):
```json
{
  "actionType": "MOVE_TOKEN",
  "payload": {
    "entityId": "npc-revel-attendee-01",
    "sceneId": "scene-starlit-revels-hall",
    "targetCell": {"x": 12, "y": 7},
    "movementMode": "walk"
  }
}
```
The gateway must validate actor permissions and map/scene before committing. Do not silently reinterpret legacy `targetX/targetY` percentages as cells; add explicit typed conversion/adapters.

## Starlit Revels staged stress test (real campaign data only after approved import)

**Spatial set-up:** a multi-room Revel venue with scale-calibrated map, walls, doors/windows, exterior paths and exits. Thor and Lyra, 14 named Revel actors, and configurable generic crowd actors. Bind to original approved event identities/relationship and schedule data, not invented replacements. Generic crowd can be lightweight aggregate/waypoint agents until narrative promotion; one LLM inference per person per tick is unnecessary.

**Scenarios:**

1. Host imports map and actor data; all source pixels remain visible and grid aligns with the printed image.
2. Assign/move PCs via mouse, AI proposes moving a named guest and Python computes a legal route and commits it; reload positions exactly.
3. 14 named guests follow scheduled social routines. Generic guests circulate deterministically (no constant inference); no overlap through occupied cells, closed doors or blocked walls. Track where each actor is, not merely on-screen token coordinates.
4. AI character asks “Who can see Thor at the bar?”, “Who is within 30 feet of Lyra?”, “Can guest X reach the door this turn?”, “Is there cover?” and receives grounded, secrecy-filtered answers.
5. Switch scenes or close/reopen Windows launcher. Actor location, world minute, event statuses and discovered information persist. Actors outside active viewport retain scene/region location and scheduler state.
6. Allow venue crowding; queue/wait or alternate path if blocked. Test one-cell vs multi-cell creature footprints, two agents targeting the same cell, and stale simultaneous actions.
7. Trigger an approved dramatic event **only** through its world scheduler/quest conditions. Conditional mobs/victims are not spawned or marked dead before triggers. Validate that sight, sound, witnesses and knowledge propagation use distance, walls/doors and explicit acoustic rules (no omniscient rumours).
8. Combat simulation, subject to current Step 51 monster combat hold. Reject unsupported monster statistics without pretending the encounter was mechanically simulated.
9. Run repeated deterministic replay, save/restart recovery, role secrecy, and many-action stress cycles; measure actor count, action count, pathfinding budget, collision rejections, memory/CPU, latency and SQLite event/receipt consistency. Report real metrics and PASS/PARTIAL/HOLD, without inventing performance thresholds or claiming human acceptance.

## Delivery sequence / gates

**SP-00** map/coordinate audit and explicit canonical scene position contract with migration/adapter. **SP-01** Python read-only spatial query and deterministic occupancy/LOS/path library, with negative tests. **SP-02** authority-validated movement through R1, persistence, stale/concurrent tests, DM/player/AI permission checks. **SP-03** VTT front end uses canonical scene positions and server-projected paths; integrated with zero-crop image-first Blue Alley map calibration. **SP-04** lightweight event NPC scheduler and AI spatial tool adapter, hiding DM knowledge. **SP-05** Starlit Revels scenario end-to-end soak test and actual human gameplay. Keep these as subgates of Milestone 12 and future living-world programmes; do not postpone Blue Alley calibration.

**Strict acceptance:** A token moving on screen is insufficient. Python must determine and persist its map, coordinates, footprint and path outcome; AI movement requires the same validation; wall/occupancy/LOS/range and secrecy are tested; save/restart restores positions; conditional narrative events are not prematurely activated.

**Non-negotiable:** preserve Python single SQLite/R1 Commit Authority, no model-specific logic, no rewrite of existing React VTT/LOS, no duplicate DB, no arbitrary imported code, no LAN exposure before security QA, and no unapproved frozen schema changes.
