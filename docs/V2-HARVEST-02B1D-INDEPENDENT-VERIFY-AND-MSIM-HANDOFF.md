# VadAllFate V2 — HARVEST-02-B1D Independent Verification & M-SIM Handoff

**Independent source audit:** 2026-10-29. **Status:** substantive B1D SOURCE VERIFIED; remaining **focused security/replay/epistemic checks**, not full Windows game acceptance. **Do not relabel unexecuted tests as independently verified.**
**Reviewed backend:** `af13252307a74a4dec7f24aa4b996441a7d9ae38`; actual source changes `c9b28d95abfb087e68de2d1e07758e6a0b740e8f`. **Reviewed frontend:** `ce7a9b8fff3b23fa42f4b1758dc142b55285212d`; frontend test update `dc4bb030be29d5bebf1641f87f8855fad2544539`. Both development branches `v2/srd51-rules-browser`.
**Antigravity-reported verification:** 7/7 dedicated B1D, 47/47 harvest tests, 3/3 gateway/TTS tests, 147/147 frontend, clean Vite build. **B1D report does not include a newly executed full 456+ backend suite**; all counts remain agent-reported. No new independently verified end-to-end Windows AI/voice/NPC/VTT run in this audit.

## What the code really fixes — preserve it

1. `DM_PRIVILEGED_ACTIONS` now includes `UPDATE_NPC_COGNITION` and `ADVANCE_WORLD_ARC`; `v2_state_delta_validator.py` adds role defense in depth.
2. `submit_action` removes client-supplied `authenticatedRole`/`authenticatedActorId` and, on a successfully verified session token, replaces them with session-derived fields before durable admission. Positive and negative player/observer/DM gateway and HTTP tests exist.
3. `_process_spatial_perceptions_and_cognition` uses `dice_roll_data['total']` rather than `payload['rollTotal']`; unconfirmed `PLAYER_PHYSICAL` under REQUIRE_DM_CONFIRMATION cannot suppress NPC observation. Actor token cells are preferred over user supplied scene coordinates.
4. WorldArcManager recognises `tag@eventId` forms, allowing two different event identifiers in the same world minute; scheduler action IDs are derived from relevant state.
5. Time advance no longer overwrites an original CommitReceipt's commitSequence and instead exposes a separate `latestSnapshotRef`, with `schedulerCommittedActions` describing committed movement actions.

## Still-open targeted gaps (do not create another broad rewrite)

### R-01 — Legacy recovery role fallback is still present (HIGH)

In `_recover_pending_admissions_internal`, both `STAGED_NEEDS_VALIDATION` and `DISPATCH_REQUIRED` still contain:
```python
if auth_role in {"dm", "dm_host"}: ...
elif auth_role is not None: actor_role = "player"
else:
    legacy_role = action_env.payload.get("actorRole")
    if legacy_role in {"dm", "dm_host"} and action_env.actor_id in {"dm-1", "dm-sovereign", "dm_host"}:
        actor_role = str(legacy_role)
```
This grants a privileged role to a **legacy admission with no authenticatedRole** solely from role/actor strings—exactly the case the previous independent QA sought to eliminate. This does **not** by itself establish an exploitable HTTP path, but violates fail-closed stored-admission policy.

The dedicated recovery negative test uses `actor_id="attacker-01"`, which **does not test** the legacy accepted-ID branch. The positive test directly injects `"authenticatedRole":"dm_host"` in a manually constructed admission without proving an immutable server-authenticated admission record. That is a useful flow test but not cryptographic provenance proof.

**Required:** eliminate privileged legacy fallback and quarantine or explicitly migrate verifiably authenticated prior admissions. Validate saved role/actor binding against trusted admission metadata or other server-owned evidence; don't equate any free-form payload `authenticatedRole` text with authentication proof. Add both staged and dispatch recovery negatives using `actor_id="dm-1"`, `actorRole="dm_host"`, absent or forged server provenance; positive genuine session-admitted DM action with process restart. Preserve R1 exactly-once admission and no frozen schema edits without reviewed migration.

### R-02 — Same trigger ID can be consumed again at a later minute (HIGH replay integrity)

`WorldArcManager.tick_world_events` sets `trigger_key=f"{clock_id}:{base_tag}@{event_ref}:{world_minute}"` for event-scoped tags. The same source event and clock, replayed/reintroduced after minute advances, gets a *different* consumption key. Event-specific idempotency should be **clock + committed source event ID**, independent of the minute the scheduler observes the tag, with separate elapsed-minute clock progress tracking. Current tests prove same-minute dedup, not later-minute reinsertion. Add two distinct `alarm_raised@evt-A` and `@evt-B` same minute => 2 increments; reinsert `@evt-A` next minute and after process restart => 0 incremental event segments/sparks.

### R-03 — Untrusted payload claims still shape some NPC memories (MEDIUM/HIGH)

Despite the B1D report's broad wording, `_process_spatial_perceptions_and_cognition` still:
- activates MOVE_TOKEN perception if client `isTheft`, `isSuspicious` or `valence` is present;
- derives `base_valence=float(payload["valence"])` and a witnessed description from `payload["summary"]` for some actions;
- selects `active_map_id` from `payload["sceneId"]`, and can fall back to `payload["targetX"/"targetY"]` if no authoritative actor token is found.
Even when the message no longer calls the action `confirmed theft`, unvalidated client prose/value can degrade trust or alter factual observations. For roleplay, a submitted utterance is a *claim* not a verified event or a witnessed harmful act.

**Required:** derive a typed, server-resolved perceptible action fact/effect and authoritative scene/cell with no client summary/valence guilt promotion; if no verified source position exists, safely decline spatial witness attribution. Positive cases: genuine seen attack, real confirmed spell, audible event; negative cases: forged `summary`, `valence:-1`, `isTheft:true` on ordinary movement; scene/cell spoof; DM/player projection after restart.

### R-04 — World arc mutation and response accounting (MEDIUM)

`tick_world_scheduler` submits `ADVANCE_WORLD_ARC` via R1 but does not inspect or append the returned world-arc receipt to `actionsCommitted`. Thus `schedulerCommittedActions` currently tracks movement, not necessarily **all** scheduler commits. Check rejected arc commits, stale snapshots, synchronous latestSnapshotRef consistency, duplicate sparks and event audit readback; report exact committed receipts separately. Do not change the original time-action receipt.

### R-05 — Full acceptance scope (OPEN)

A user-facing acceptance scenario still needs *real* Windows gameplay and role-safe NPC dialogue/movement/rumour/spatial sound, save/reopen/replay, then approved real Blue Alley/Starlit Revels content. Current demonstration fixtures and test logs are not such acceptance. Run **the complete Python pytest suite**, not just B1D/harvest/gateway tests, with exact command/exit code, frontend suite and build. Report every failed/held case honestly.

## Next programme instruction: parallel M-series/harvest work starts now

**Do NOT postpone M-SIM-00/01 or HARVEST-03-MSIM source research until further tiny B1D fixes.** They are no-write inventory/reuse tasks, independent of correction deployment, and governed by [Continuous Harvest & M-Series Simulation Plan](V2-CONTINUOUS-HARVEST-AND-M-SERIES-SIMULATION-PLAN.md).

- **Track A, focused B1D-FIX:** address R-01 and R-02 before allowing new privileged world mutations; test R-03/R-04 as a narrow expansion. Avoid a prolonged refactor or another unrelated QA framework.
- **Track B, M-SIM-00/01:** locate *actual original* M03–M15, M16/M16P, supplements, weather/faction/travel/visitor/news/rumour/time sources, map assets, event ledgers and Save overlays; preserve hashes/provenance; map exact record/contract/engine reuse/gaps. Never guess which M number corresponds to a subsystem, never invent canon.
- **Track C, HARVEST-03-MSIM:** inspect pinned file-level MIT algorithms and tests for weather, time/event queues, route/travel graph, visitor scheduling, reputation/factions, directed rumour propagation, press/news cadence and settlement logic. Choose COPY/ADAPT/PORT/TEST-HARVEST/REFERENCE/REJECT, record all rights and dependencies; no competitor's state/database authority.
- **Track D, HARVEST-02-C/UX:** VTT UVTT import research and playable UI work can continue independently. No unapproved UI theme/layout selection. Model/voice remains optional, deterministic scheduler is CPU-first.

**Cross-system acceptance after authority closure:** a real source-backed Waterdeep day with weather modifying travel, a visitor delayed, faction response to a committed event, rumour delivered to specific NPCs, scheduled newspaper with limited knowledge, a quest condition that remains held until genuinely met, and consistent save/restart/player/DM projections. Confirm independent campaign portability and no M-series hardcoding in the reusable Python runtime.

## Response requirements for Antigravity

Report which R findings were closed/held with actual source/test evidence, show the exact original M-series file inventory or explicitly list missing artifacts, a ranked **file-level** MIT Harvest-03 shortlist, and first minimal cross-system simulation batch. Keep R1, Step 51 SRD monster combat, CP017B master-mount, licensing and all five operating modes unchanged. Do not merge main.
