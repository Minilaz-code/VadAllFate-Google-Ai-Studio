# VadAllFate V2 — Next Gate: Real Windows Gameplay and Autonomous NPC Acceptance

**Source review:** 2026-10-28  
**Status:** QA FINDINGS / NEXT EXECUTION BRIEF — NOT A RUNTIME CHANGE OR HUMAN ACCEPTANCE  
**Reviewed heads:** backend `02434e901196307edbd3568ce9be1910197fb594` and frontend `c6657f5d52637fdea2d8e312d99271947fa61db4`.  
**Governing charter:** [V2 Master Goals](V2-MASTER-DEVELOPMENT-GOALS.md). Respect all existing contracts, holds and exact branch discipline; never merge main without approval.

## Confirmed code improvements

1. The previously reported commits `ffd6338` and `72dd984` and follow-up register revisions are present remotely on the named V2 branches.
2. The Python `MOVE_TOKEN` override now derives DM status from authenticated role; `DM_PHYSICAL` in checked roll paths has server-side role gating. The independent review's four exploit regression tests are present in `tests/test_v2_trust_and_persistence_gates.py`. **Antigravity reports they pass**; the reviewer has not rerun tests on a Windows checkout.
3. Map assets now use an authenticated per-campaign registry and fail closed for missing registry records. The frontend no longer places bearer tokens into image URLs.
4. Two-NPC clock-based scheduler and R1 movement paths exist; the model inference call is now protected by a `_model_execution_lock`.
5. These represent **source-verified implementation**, with agent-reported 415 backend / 144 frontend tests; not yet full Windows campaign or human acceptance.

## Immediate playable-UI blocker: protected artwork render

- `src/components/battlemap/BattlemapCanvas.tsx` still renders `<img src={mapDefinition.backgroundArtwork.url}>`.
- Backend `GET /api/v2/battlemap/assets/{id}` now requires an authenticated session header.
- Frontend `v2BackendClient.fetchAuthenticatedAssetBlobUrl(url, role)` exists but **no use in the inspected canvas/view/app/source paths was found**. A plain browser image request cannot attach the session header.
- **Fix:** on map load/role switch, fetch protected artwork with the appropriate session token in a request header; turn the returned Blob into a revocable object URL, show loading/error states, clear/revoke cached URLs when identity/campaign/role changes, prevent DM-only artwork reuse in a player session, and use user-authorised `playerArtworkUrl` variants. Fail closed, never silently replace durable uploads with local `data:` or `blob:` URLs while reporting persistence.
- Regression: DM and player roles, uploaded asset vs real map, full process restart, role switch, revoked session, forbidden asset, cache purge, image overlay alignment. **Do not classify Blue Alley REAL APPLICATION VERIFIED until the original image is used.**

## Source review residual safety/persistence checks

1. In `srd51_http_api.py`, an authenticated DM can select a previously registered same-owner `assetId` and the route rewrites `{id}.{ext}` plus `INSERT OR REPLACE` metadata. Decide immutable IDs vs explicitly versioned DM-approved replace and verify collision/race, secrecy flag transitions, cache invalidation and rollback.
2. The asset upload frontend `v2BackendClient.uploadBattlemapAsset` still has an offline `data:` fallback. In connected authoritative mode, explicitly return a failed upload state, not a pretend durable URL. Distinguish deliberate explicit demo functionality.
3. `tick_world_scheduler` currently hardcodes `npc-jorren-vale` and `npc-duessa-starflower` waypoint schedules in the gateway and issues DM-host authority using the host bootstrap key. It is a *working two-NPC proof*, not generic, content-driven living-world scheduling. No production clock-advance or timer invocation of `tick_world_scheduler` was found in the inspected gateway and HTTP server sources (definition and test invocation alone are insufficient). Plan migration to stored approved NPC routine records and trusted server-owned scheduler identity, driven by authoritative world-clock ticks, idempotent per world minute and restart.
4. `get_projection` and `query_scene_spatial_context` should be reviewed for actor-/scene-specific knowledge in Co-DM, NPC and player contexts. A `spatial_query` allowlist is not proof of an autonomous AI movement/decision tool loop.
5. Verify the frontend `App.tsx` `onMoveToken` actual receipt/error feedback, including rejected path, stale revision, non-own token move and privileged NPC move; the callback currently dispatches the action without awaiting the visible result.
6. Verify character sheet, narrative, physical/digital two-stage `RollRequest`, combat state, HP/slots, role secrets, voice and map all agree after stop/restart. The new two-NPC fixture is not an actual Starlit Revels content import or live AI roleplay.

## Next acceptance: real desktop vertical slice

**Stage W0:** Fix authenticated artwork loading and residual token/asset cache secrecy. Do not expose port to LAN.

**Stage W1:** Launch the real Windows frontend + Python runtime as DM, import a representative map, calibrate, save, reload, test closed door collision, legal path and persisted actor position. Repeat with a player login to verify fog and secrets; capture real browser/desktop screenshots and logs. Original Blue Alley user-provided artwork is still a pending content gate.

**Stage W2:** Run two players/roles, one physical dice and one digital dice, including an actual DM-confirmed roll, spell/HP resource updates, pending action resumption, no duplicate effects, restart/reconnect. Ensure real localhost model/TTS is correctly labelled live vs fallback.

**Stage W3:** Exercise two NPCs whose routines come from stored campaign data, triggered by **authoritative** clock advancement, routed through R1, with private perception and persistent cognition/events. Then scale to real source-backed Starlit Revels participants and realistic duration/crowd metrics. Label two-NPC scripted/synthetic tests PARTIAL until proven.

**Stage W4:** Test another legally importable module with no Python source modification, multiplayer auth/secrecy and sustained hardware throughput before any release acceptance.

## Development reporting

For each stage report exact local commit SHA, test command/results, actual screenshots and logs (paths inside the user's Windows computer are not evidence this reviewer can see until attached), PASS/PARTIAL/HOLD, reasons, permission/secret checks and known limitations. Preserve `v2/srd51-rules-browser`, Step 51 monster combat and CP017B holds, R1 single SQLite Commit Authority, all five modes and native Chatterbox Nano. Never merge main without explicit approval.
