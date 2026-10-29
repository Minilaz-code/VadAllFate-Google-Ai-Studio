# VadAllFate — HARVEST-02-B1D: Action authority, trusted sensory outcomes, recovery and receipts

**Independent source review:** 2026-10-29, reviewing B1C backend `7d9cb8e696a5708bc6dbf43804b85bbab3c79a1d` and frontend `cd32d49698ba534eb3ae27b3e17208b2f168bda2`. **Status: B1C source-verified implementation with corrective holds; not a runtime patch, exploit execution, or user gameplay acceptance.**  
**Antigravity-reported tests:** 456/456 Python, 147/147 React, Vite clean. These suites were not independently run in this review.  
**Read first:** `docs/V2-MASTER-DEVELOPMENT-GOALS.md`, `docs/V2-HARVEST-02B1C-LIVING-WORLD-AUTHORITY-AND-PERCEPTION-QA.md`, `docs/V2-HARVEST-02-MIT-REUSE-EXECUTION-PLAN.md`. Maintain V2 branches, R1, frozen schema holds, approved D&D rules, no main merge or force-push.

## Verified B1C improvements

- Production `update_npc_cognition()` and `tick_world_scheduler()` now submit `UPDATE_NPC_COGNITION`, `MOVE_TOKEN`, `ADVANCE_WORLD_ARC` via `submit_action` and R1, rather than their previous direct SQLite helper. A named `_test_seed_campaign_authority_state` still performs raw SQL for offline fixtures; keep it inaccessible from production operations.
- Sense labels are separated into SAW/HEARD/HEARSAY. The HEARD memory is anonymous, rather than directly naming a player or unverified item. Per-NPC mem IDs are derived from `action_id` and NPC ID.
- The escalation manager retains consumed trigger markers and time progress, and scheduler move IDs no longer use random UUIDs.
- FTS5 `known_by` membership is exact via `json_each`, not wildcard `LIKE`.
- This is source-verified progress, not complete simulation acceptance; the frontend B1C commit modified implementation documentation only.

## P0-01 — DM/system-only world mutation actions omitted from role gate

In `v2_campaign_gateway.py` the DM-only permission set in `_synthesize_action_outcome` (around line 3612) includes `ADVANCE_TIME`, `DM_OVERRIDE_STATE`, etc., but **does not include** new `UPDATE_NPC_COGNITION` or `ADVANCE_WORLD_ARC`.

The new branches (~6417 and 6459) accept `payload.npcId`, `activeGoal`, `newMemory`, `deltaTrust`, `deltaDisposition`, `deltaPressure`, and even caller-supplied entire `escalationClocks` / `triggeredSparks` collections. Nothing in their local branches checks the authenticated role. The generic StateDeltaValidator should not be treated as role/capability authority. An authenticated player may therefore be able to submit these actions to mutate NPC minds, advance or rewrite clocks, and insert DM-only sparks under an R1 receipt.

**Remediate:** add explicit server-validated action policy for both, preferably distinguishing (a) human DM approved edits with explicit audit reasons from (b) internal scheduler-generated changes with narrowly scoped internal capability. Do not let HTTP clients select `system-world-scheduler` or forge `authenticatedRole`. For world arcs, derive proposed changes from trusted stored clocks and event IDs and validate legal transitions instead of blindly replacing arbitrary client payload state. Test unauthorised player/observer requests through the real gateway and HTTP routes, including falsely claimed `dm_host`, and assert zero state changes/receipts. Add a legitimate authorised DM/system positive test.

## P0-02 — Perception can be suppressed by untrusted `payload.rollTotal`

`_process_spatial_perceptions_and_cognition` (~3053) reads `int(payload["rollTotal"])` and skips memory if this equals/exceeds `npc.passivePerception`. The normal `SKILL_CHECK` resolves `total = check_d20 + mod` separately inside Python (~skill branch), but the perception function does not use that trusted result. This allows an input-level stealth claim to affect authoritative NPC memory, even when the committed skill outcome is different. Also check that `skillName` is the canonical source, while observation uses `skill` OR `skillName`, and that plain Sleight of Hand is not automatically a crime.

**Remediate:** construct a server-authored `ResolvedActionEvent` with verified rolled totals, action effects, actual position/scene, source actor and whether target interaction succeeded. Only authoritative outcomes can suppress or generate sensory effects. A failed roll may produce different observations than a successful attempt; don't universally apply 5e automatic success/failure on natural 1/20 to ability checks. Ignore client-supplied `rollTotal`, `valence`, `isTheft`, summary, and arbitrary scene coordinates as established facts. Keep actor intent separately as an unverified claim when relevant.

**Exploit regression:** player sends `SKILL_CHECK` with server-resolved low Stealth roll but `rollTotal:999`, `isTheft:true`, made-up target item and location. Must not erase otherwise observable evidence, assert invented guilt, or reveal item/identity to a listener behind a door. Test physical-dice requests from their verified committed receipt, not only digital mode.

## P0-03 — Recovery still has unverified role fallback

`_recover_pending_admissions_internal` in both `STAGED_NEEDS_VALIDATION` and `DISPATCH_REQUIRED` takes:
```python
raw_role = action.payload.get("authenticatedRole") or action.payload.get("actorRole")
actor_role = str(raw_role) if raw_role in {"dm", "dm_host"} else "player"
```
This contradicts the stated guarantee that DM authority only comes from an original **verified authenticated role**. A forged/legacy admitted action with a DM role claim but no verified role could be elevated on recovery. Merely changing fallback from actor *ID* to actor *role* does not establish provenance. An `authenticatedRole` string by itself is not cryptographic evidence unless bound and validated by R1 admission.

**Remediate:** verify immutable admission-associated server-authenticated identity and provenance, and explicitly reject/quarantine legacy entries lacking proof; never elevate from payload `actorRole`. Preserve recovery contracts and don't break legitimately admitted legacy actions without a reviewed migration/quarantine policy. Test crash at pre-staging and staged-not-committed boundaries with forged roles and real verified DM sessions, using a second process and actual R1 receipts.

## P1-04 — World arc and scheduler IDs too coarse to represent distinct events

Current scheduler action ID `act-sched-{npc_id}-{current_min}` supports same-minute retries but prevents a legitimate second different decision by the same NPC in that minute. World arc ID `act-world-arc-{current_min}` similarly conflates multiple distinct, valid event triggers in one minute. `WorldArcManager` consumed keys like `tag:world_minute`; a second distinct `alarm_raised` event at that minute cannot be processed independently, while the same old tag reintroduced at a later minute may be counted again without a unique event ID.

**Remediate:** use stable event/decision IDs anchored to R1 committed source event plus campaign/save/clock/NPC/decision index; dedupe by *unique committed trigger*, not just tag and minute. Preserve exact-once processing across restart, concurrent different events in the same minute, world-clock advancement and retried failed scheduler movement. Never use fresh UUIDs on replay.

## P1-05 — Do not rewrite original CommitReceipt metadata

The `ADVANCE_TIME`/`REST_SHORT`/`REST_LONG` return path replaces `result_payload["receipt"]["commitSequence"]` with the latest sequence after scheduler actions. But that receipt's `commitHash`, `fullStateHash`, `revision`, `commitId` and event IDs still refer to the *original time-advance commit*. This yields an internally inconsistent receipt that cannot prove a single world revision.

**Remediate:** preserve original R1 CommitReceipt unchanged. Add `latestSnapshotRef` and separately listed committed scheduler receipts/commit IDs for client catch-up. Document client sync semantics and test multiple world changes following one advance-time operation.

## P1-06 — Precise auditory truth and event projection

Current simplified sound attenuation uses rough sight-wall/door geometry with thresholds and can be a useful approximation, but tests must not imply real D&D sensory rules are fully resolved. NPCs who only HEARD should not receive witness certainty from the source action or hidden character identity. Hearing and hearsay need actor-specific epistemic source data persisted in R1, and dialogue retrieval should obey that boundary. Avoid manufacturing criminal suspicion solely from a skill selected by the player. Test direct visual clue vs muffled noise vs false rumour and witness confidence after save/restart and across different player projections.

## P1-07 — R1 permission/recovery/clock event test depth and status

B1C dedicated test suite has **five** tests. It covers basic role-free NPC/arc state changes, a SAW/HEARD case, a stealth example, hearsay pure function, and a one-tag one-minute clock idempotency example. It does not prove hostile HTTP role gating, cross-save spoofing, two different same-minute event instances, crash recovery of new world-arc actions, or actual Windows NPC dialogue and VTT perception.

Keep classifications:
- B1C direct-write elimination: **source verified**, agent-reported automated PASS.
- B1C new action permission enclosure: **HOLD** pending exploit tests.
- True sensory authority and authenticated recovery: **PARTIAL/HOLD**.
- Synthetic NPC scenario: automated source/test evidence, **not real Windows NPC gameplay accepted**.
- Authentic Blue Alley map and approved Starlit Revels cast, real full AI DM and long soak: **PARTIAL**.

## Next checkpoint — B1D closure before map-harvest work

1. Fix and test P0-01..03 first, without broad refactor, and run exact negative action/recovery tests.
2. Fix P1-04..05 with distinct R1 event IDs, clock resumption and immutable receipt reporting.
3. Run actual Windows gameplay through authenticated UI: character acts, two NPCs observe differently, a later report changes beliefs, NPC routine reacts, player and DM views differ, restart and replay are stable; no silent mocked paths.
4. Run full backend regression (Antigravity B1C baseline **456 reported**), frontend suite (**147 reported**), Vite production build, explicit positive/negative/security/recovery tests, and at least one realistic long-game/perception scenario.
5. Update `docs/V2-IMPLEMENTATION-REGISTER.md` with evidence-based PASS/PARTIAL/HOLD and `provenance/HARVEST_REGISTER.md` only if source harvest status changed. Do not copy extra MIT code until authority boundaries are safe.
6. Commit/push `v2/srd51-rules-browser` only; do not merge main or force push.

**Governing objective:** a living-world RPG, not a successful adversarial client mutating NPC memories through an authoritative-looking R1 receipt.
