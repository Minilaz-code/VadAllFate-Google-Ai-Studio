# VadAllFate V2 — Independent QA After Gates 1–5 / SP-00..SP-05 Commit

**Review date:** 2026-10-28  
**Status:** SOURCE-REVIEWED CORRECTIVE ACCEPTANCE BRIEF — NOT AN AUTOMATED OR HUMAN ACCEPTANCE SIGN-OFF  
**Commit baselines:** Python backend `61a5740`; React frontend `97993ff`; branch `v2/srd51-rules-browser`. Fetch latest heads before making changes.  
**Governing direction:** [Master Goals](V2-MASTER-DEVELOPMENT-GOALS.md), [Spatial SP-00..SP-05](V2-AUTHORITATIVE-2D-SPATIAL-SIMULATION-AND-STARLIT-REVELS-TEST.md), [Physical Dice](V2-DICE-ROLL-INPUT-MODES-AND-AUTHORITY.md), [Blue Alley VTT](BLUE-ALLEY-VTT-ARCHITECTURE.md).

## Verified implementation progress

- Real typed 2D spatial models, A* pathfinding, LOS and occupancy, canonical committed token scene coordinates, calculated paths and VTT path overlays exist.
- Per-campaign 256-bit secrets are generated with `secrets.token_hex(32)`, stored in `campaign_server_secrets` in the existing writable SQLite DB, not the public `campaign_doc_json`. This corrects the predictable seed.
- A persistent `REQUEST_ROLL`/`SUBMIT_ROLL` data model and DM correction/reroll actions have been added; the earlier direct physical dice paths also exist.
- Session-checked map asset routes and an asset metadata registry exist; the frontend uploads image binaries instead of only persisting transient `blob:` URLs.
- Antigravity reports backend 408/408 and frontend 144/144 tests; these counts are **agent-reported, not independently rerun in this review**. Vite build success is not equivalent to launching/playing the Windows app.
- The Starlit Revels test is a **synthetic 14-guest movement fixture**: it uses scripted DM `MOVE_TOKEN` actions in a loop and checks persistence. It is **not proof of autonomous scheduler decisions, actual 14 source NPC personalities, live AI conversation, event triggers, realistic soak duration or simultaneous multiplayer actions**.

## P0 — Security and authority corrections required before LAN/multiplayer acceptance

### P0-1: MOVE_TOKEN DM override bypass

In `src/vadallfate/runtime/v2_campaign_gateway.py` in the `MOVE_TOKEN` branch, `dm_override = bool(payload.get("dmOverride") or payload.get("forceMove") or (is_dm_role and payload.get("teleport")))`. This lets a **player moving their own actor** submit `dmOverride: true` or `forceMove: true` and bypass collision/pathfinding without holding DM permission.

**Repair:** Every privileged override must be conditional on server-verified DM role and an explicit authorised policy. Do not accept client flags as authority. Add regression: verified player cannot teleport their own actor through a closed wall/door using any override flag, while DM can use explicit logged override.

### P0-2: DM_PHYSICAL role spoofing and confirmation bypass

`ATTACK_ACTION`, `SKILL_CHECK`, `SAVING_THROW` accept `DM_PHYSICAL` from `diceMode` and tag the outcome `DM_REPORTED` without a clear role-gate. The attack's `REQUIRE_DM_CONFIRMATION` logic specifically stages `PLAYER_PHYSICAL`, not `DM_PHYSICAL`. A player may be able to claim `DM_PHYSICAL` and get immediate outcome despite table policy.

**Repair:** reject `DM_PHYSICAL` for non-DM sessions throughout all roll entrypoints (including `REQUEST_ROLL`/`SUBMIT_ROLL`); never rely on UI mode restrictions. Test a player forging `diceMode=DM_PHYSICAL` with valid-looking faces under `REQUIRE_DM_CONFIRMATION` and `SERVER_DIGITAL_ONLY` and prove zero effects.

### P0-3: Battlemap asset ownership / registry fail-closed

In `src/vadallfate/runtime/srd51_http_api.py`:
- `POST /api/v2/battlemap/assets` accepts `body.campaignId` instead of pinning ownership to the authenticated session's campaign; it accepts caller-selected `assetId`, writes `{assetId}.{ext}` to a shared directory, then `INSERT OR REPLACE` overwrites the registry row. This risks cross-campaign replacement or ownership reassignment.
- `GET /api/v2/battlemap/assets/{assetId}` checks ACL **only if a registry row exists** and then allows file lookup even when no registry record exists; this is a fail-open path for unregistered files.
- Frontend `getAuthenticatedAssetUrl` appends the session token as `?token=...` to image URLs. Replace this with a safer authenticated asset-fetch pattern that does not leave bearer tokens in URLs, browser history, referrer or logs. Ensure actual browser image rendering is tested.

**Repair:** derive campaign and owner solely from verified session; allocate immutable collision-resistant asset IDs; verify file type/size; use durable temp->atomic storage; deny missing registry rows; enforce ownership and DM/player asset variants; reject cross-campaign, unauthorised and overwrite attempts. Test session separation through actual HTTP requests and browser loading.

### P0-4: Spatial query observer impersonation / knowledge

HTTP `GET /api/v2/battlemap/spatial-query` currently accepts `observer_id` from query params without checking it against the session's assigned player character. The harness `spatial_query` also accepts arbitrary `observer_actor_id` and campaign IDs from tool arguments. That can change the viewpoint and reveal map actor coordinates inconsistent with the player's legitimate knowledge.

**Repair:** bind player spatial observer and campaign to server-verified identity, and grant DM-specific scoped inspection only; role/scene/visibility filtering must be server-side. Reject forged `observer_id`, other-campaign queries, inaccessible scene IDs and unbounded radius. AI NPC queries must use actual NPC identity, beliefs and permissions, not omniscient DM context by default.

## P1 — Correctness and end-to-end acceptance gaps

1. **Movement mechanics:** pathfinding returns a path and cost but `MOVE_TOKEN` does not yet visibly enforce combat movement speed/remaining movement/action economy; players could request multi-room travel in a single turn. Non-DM clients supply `footprint` and the occupancy set only includes anchor cells for other actors, not their full large footprints. Use server-known creature size and movement resources. Include multi-cell actor/terrain tests, diagonal walls/corners and doors imported in `mapConfigs[scene].geometry.doors` (the movement code currently parses only top-level `battlemapState.doors`).
2. **No implicit coordinate guessing:** preserve explicit legacy migration and reject ambiguous values; the gateway's `targetX/targetY > 30 or float` fallback is ambiguous.
3. **RollRequest integration:** `REQUEST_ROLL` currently accepts arbitrary caller-supplied `formula/dieSides/dieCount`, and `SUBMIT_ROLL` mostly calculates a sum and records a result. It is **not yet proven** to be a server-issued rules-pinned request that feeds a pending `ATTACK_ACTION`/`CAST_SPELL`/saving throw, advances HP/slots and reliably resumes AI narration. Test a whole two-stage attack with physical damage dice, DM confirmation, restart before approval and no duplicate effects. Ensure request permission and dice schema validation are server-derived.
4. **NPC autonomy:** adding `spatial_query` to the AI tool list is only a query capability; no evidence that a scheduler chooses and commits independent NPC action cycles. The 14-guest test loops sequential scripted DM movements; don't call it a full SP-04/SP-05 acceptance soak. Implement world-clock-driven routines, player/NPC limited perception, interactions, conflicts, conditional triggers and genuine measured soak tests.
5. **AI execution limits:** `SingleBoundedAIHarness.process_next()` releases its lock before provider inference; concurrent callers can still run multiple heavy model requests. Enforce a single active model-job semaphore/worker (or explicitly budgeted concurrency) on 4–6 GB VRAM machines.
6. **Front-end proof:** perform actual Windows launcher + mobile/tablet browser acceptance of real map assets, authenticated map render, movement commands and CommitReceipt errors, full restart/rejoin. Blue Alley user-supplied image and real Starlit Revels source content remain pending.

## Acceptance order / reporting

1. **Safety Gate S0:** fix P0-1 through P0-4; negative HTTP/client tests for each exploit; no LAN exposure until accepted.
2. **Gameplay Gate S1:** pin authoritative actor footprints, movement budgets, scene geometry doors, proper coordinate versioning, RollRequest-to-action resolution and model worker concurrency.
3. **AI Living World Gate S2:** NPC routine scheduler chooses movements in world time and submits them via R1; limited-perception spatial query; test at least two independent NPCs with mutually constrained goals before the 14-person expansion.
4. **Real Gameplay Gate S3:** full Windows Blue Alley play, persistent map/coordinates/physical dice, then Starlit Revels and multiplayer with source-backed NPCs.

**Keep existing R1, same SQLite, SRD 5.1 monster Step 51 hold, Five DM modes, native Chatterbox Nano, all existing docs and branches. Do not merge `main`.**

Report every claim as IMPLEMENTED, AUTOMATED VERIFIED, REAL APPLICATION VERIFIED, HUMAN ACCEPTED, PARTIAL or HOLD. Never describe this synthetic fixture as a completed living-world stress test.
