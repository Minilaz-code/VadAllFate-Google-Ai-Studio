# Living world integration handoff — 2026-10-31

Both repositories: `codex/v2-living-world`, based on the published `codex/v2-persistent-world` branches. Exact paired implementation commits are recorded in the publication document. Historical evidence in earlier handoffs remains historical.

## Implemented contracts

The generic installed-pack ContentResolver and existing campaign `npcs`, `quests`, `npcRoutines`, `battlemapState`, NPCGoal, NPCRelationship, NPCEpisodicMemory and NPCCognitionState structures are reused. No second authority, knowledge database, model scheduler, frozen schema migration or direct canonical SQL mutation was added. Every new mutation follows the existing action/state-validation/admission/dispatch/staging/R1 CommitAuthority route.

Knowledge admission is explicit DM authority. Categories distinguish DM-established facts, learned knowledge, rumours, incorrect beliefs, suspicions and guarded secrets. Acquisition is approved source, witnessed, told or DM adjudication. Witness/told evidence must be a memory owned by that NPC; an unverified statement cannot automatically become an established fact. A DM-established fact records a human adjudication in the campaign NPC record; it does not import book truth into a separate global fact authority.

Source admission previews exactly one bounded string leaf through a body-relative JSON pointer. The approval checks the excerpt hash and exact manifest pin; the Save retains source reference, pointer, excerpt, definition hash, pack version/hash and approval action. The DM supplies a bounded interpretation, explicitly approving its classification. No automatic book/graph/plan ingestion or omniscient NPC access. Existing source files remain immutable.

Knowledge stays NPC-private unless the DM explicitly permits party disclosure or a specific character recipient. Guarded secrets cannot be disclosed through this workflow. Player/observer responses omit private cognition, provenance and draft AI responses. Per-character disclosure is filtered using the authenticated assigned character. Knowledge publication is projected from admitted NPC records, not stored in a parallel party truth database. It persists independently of the currently opened scene.

The AI task uses only the target NPC's approved, appropriately disclosed records and its own permitted witnessed statements. Party-visible narration is not automatically NPC knowledge. Bounded context compilation drops older admitted/observed items when necessary to stay within the existing 5000-character budget. Another NPC cannot obtain those records merely because the party or another NPC knows them. Incorrect beliefs are supplied as beliefs/rumours, without omniscient knowledge that they are objectively incorrect. Guarded secrets and unpublished records are excluded entirely; this deliberately does not implement private-secret reasoning inside a model. All model output remains generated speech, not proof of world truth. Existing DM modes, real-provider checks, context/resource limits and model write rejection remain.

A concrete persistence defect was fixed: NPCCognitionState now synchronizes its beliefs field back into the campaign NPC record. Legacy list-form beliefs remain readable through the existing normalization path. Completed goals clear stale active-goal labels.

## Consequences and routines

A DM can configure a report quest using the existing quest/objective shape, NPC giver and NPCGoal. Its condition matches a bounded phrase in a future committed CONTENT_INTERACTION addressed to that NPC. Completion records the actual event ID and completes the corresponding NPC goal. It proves a report was heard, not that the report was true or a physical item was delivered. No inventory, reward, combat or unsupported rule is inferred from text.

A separate DM action approves a bounded trust/affinity adjustment through the existing NPCRelationship model. It requires this NPC's witnessed memory and a human rationale. Each memory can be adjudicated once, preventing repeated trust inflation by replay. Player/model callers cannot approve consequences. This is a supported relationship consequence, not a complete NPC cognition simulation.

After placement, a DM can approve a daily waypoint through existing npcRoutines. The existing world clock/scheduler then evaluates it and submits legal MOVE_TOKEN/cognition actions through R1. The scheduler now respects absent time windows and scene bindings instead of falling back to an inactive waypoint. Movement still uses existing spatial occupancy/path/door rules. No background NPC model swarm or automatic monster combat activation.

## Persistent VTT workflow

DM selects an installed location, declares grid width/height, pixel pitch and origin, and optionally selects a declared resolver-verified raster asset. No geometry is inferred from artwork. Explicit source maps own their geometry; legacy doors/walls from another active scene are not silently inherited. Unmodified legacy maps retain their previous root-geometry behavior. Calibration is explicit and stored in existing mapConfigs using GridCalibration-compatible values; source identity, location and definition hash are retained. The existing VTT session manager hydrates the authoritative map and its location ID, and now selects the canonical active map. DM map-selector changes commit through the existing UPDATE_BATTLEMAP_STATE action; player map browsing remains a local view choice.

Placement uses existing SceneCellPoint/CreatureFootprint occupancy and door checks. Resizing cannot exclude an already placed token. Tokens retain canonical cells, scene ID and display coordinates through Save/restart. Source NPCs remain noncombat; mechanical templates are pinned but not activated. Source artwork is DM-only and removed from player projection. A DM may reveal an introduced, placed token separately; fog/line-of-sight rules still apply.

The actual accepted source-map scenario uses an explicit blank grid for the Yawning Portal. The installed location images are illustrations, not verified calibrated floorplans; no claim of authentic mapped walls or inferred geometry. Existing two-point artwork calibration remains available in the VTT. A declared source illustration may be used as an artwork layer without implying its perspective is a tactical floorplan.

Repositioning an existing NPC preserves its approved characterization. Changing it now requires `updateDialogueBrief:true` / the explicit UI checkbox; creation still accepts the initial brief. Existing approved draft instances do not require repeated draft approval simply to reposition; source hash changes still fail closed.

## API and UI

PLAY → Campaign content → Living world exposes per-NPC knowledge inspection, bounded source preview/admission, private/party/character disclosure, observed evidence, report quest configuration, relationship approval, grid configuration and daily routines. Source NPC selection and speaking target are separate controls.

Existing authenticated `/api/v2/content/` routes gain:

- GET `knowledge-candidate?ref=<pinned ref>&pointer=<body JSON pointer>` — DM-only preview.
- POST `knowledge` — npcId, category, acquisition, text, optional memoryId; source approval additionally supplies sourceRef/bodyPointer/excerptHash/sourcePin; disclosure is shareWithParty or shareWithCharacterId.
- POST `report-quest` — npcId, title, phrase.
- POST `relationship` — npcId, memoryId, rationale reason, bounded deltaTrust/deltaAffinity.
- POST `map` — locationRef, width, height, cellSizePx, originX/Y, optional declared assetId.
- POST `routine` — npcId, startMinute/endMinute (within daily 0–1440), cellX/Y and goal.

POST requests retain the standard `{actionId,snapshotRef,payload}` wrapper and real session binding. GET play now includes the matching authoritative snapshot. Invalid references, source pins, unauthenticated/player/observer/preview mutation, unobserved evidence, private disclosure, illegal cells and duplicate consequence admission fail predictably.

Integration defects repaired during the Windows journey: shared source/speaking selectors; overlapping content mutations; demo sequence contamination of live snapshot tracking; stale read responses; anonymous status requests on non-default campaigns; redundant per-action catalog/record fetches and excessive full projection reloads. Catalog/record lists refresh on identity/pin changes or explicit refresh. Source state/receipt updates immediately after commit; non-spatial whole-app projection refreshes are coalesced after 1.5 seconds idle, while map/placement refresh immediately. No request-limit, authentication or R1 stale-snapshot safeguard was removed or raised. Rejections are not silently retried.

## Validation and acceptance

Environment: Windows, Python 3.14.7 virtual environment, Node 24.22.1, installed headless Microsoft Edge and actual local Ollama qwen3.5:4b. No cloud provider/model download. Public tests use original CC0 creator fixtures and an original generated observer NPC. Private Waterdeep sources, generated Saves, model/context proofs and browser output stay ignored locally.

Backend full suite: 550 passed, 2 skipped in 686.27s. Final targeted API/Harness/auth suite: 47 passed in 152.92s. The earlier 45-test run also passed. Later cognition/personality safety regression set: 14 passed in 43.82s; final source/spatial/door isolation regressions: 30 passed in 89.08s. The broad run preceded final snapshot-response, characterization, context and geometry-ownership refinements; targeted checks cover those changes. Frontend 152 passed; TypeScript and production build passed, with the existing large-bundle warning. Waterdeep Windows/Edge acceptance PASS (1.1m): two source NPCs, real Qwen replies, no disclosure of the other NPC marker/guarded secret, admitted rumour, approved relationship, report quest completion, calibrated grid and visible persistent Durnan VTT token. No HTTP 429 responses in that journey. Full process restart checks for Waterdeep and the original world: 2 passed in 12.8s. Standalone Lantern Marsh/Nera browser acceptance: PASS in 1.2m, including exact-source knowledge admission, real Qwen reply, quest completion and a legal move through the actual world-clock scheduler. Checkpoint creation/branching: PASS in 9.4s. Child divergence: PASS in 8.9s; after a full child restart: PASS in 8.9s. The child completed the follow-up quest and changed trust from 0.1 to 0.0 with an admitted suspicion; primary trust stayed 0.1 and its follow-up quest remained active. Primary campaign revision/hash rows matched the saved pre-branch snapshot before further primary-world testing.

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts='' --tb=short
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_living_world_content.py tests/test_game_content_api.py tests/test_v2_auth_security.py tests/test_v2_ai_harness.py
npm test
npm run lint
npm run build
```

Private opt-in browser scenarios: `e2e/living-world.spec.ts` creates an independent acceptance campaign, two source NPCs, knowledge boundaries, relationship/quest consequences and calibrated VTT placement; `e2e/original-living-world.spec.ts` proves the same workflow in the unrelated creator world and exercises the real scheduler. Resume modes read private campaign IDs from local proof files and load them via the existing campaign manager. Use the dedicated acceptance runtime, not an existing production Save. The existing 120-request/minute guard is retained; separate acceptance phases by full restart/normal pacing, not a test-only security bypass.

## Integration and launch

Antigravity: fetch both repositories and review `origin/codex/v2-living-world`; integrate each branch into its corresponding active V2 development branch, never main. These branches include the published persistent-world foundation. Read paired implementation SHAs in the publication document. Original Antigravity checkouts were left untouched.

Use the existing launcher and dependencies from [the previous handoff](V2-PERSISTENT-WORLD-HANDOFF.md):

```powershell
$env:VADALLFATE_FRONTEND_DIR = '<absolute frontend checkout>'
$env:VADALLFATE_CONTENT_LIBRARY = '<private installed pack library>'
$env:VADALLFATE_CONTENT_ASSETS = '<private external-assets directory>'
./scripts/start-vadallfate-v2.ps1 -NoBrowser -ApiPort 8876 -UiPort 3187 -RuntimeDb '<dedicated acceptance runtime.sqlite>'
```

Do not use -SkipOllama for real-model acceptance. Stop with the existing -Stop switch. Save branching uses the existing SQLite backup/inspection workflow and -SaveId restart selection; use the same primary RuntimeDb parameter when opening its managed SaveId. No live DB swap or portable single-campaign export is claimed. Knowledge, observations, source pins, relationships, quests, routine data and positions live in the authoritative campaign Save and are copied by SQLite backup.

Limits: directed conversations establish explicit witness ownership; passive room-wide hearing inference is not added. The model can still produce mistaken language, and no automatic consequence is accepted from it. Knowledge retraction/revision UX, arbitrary quest predicates, authored source-floorplan calibration acceptance, portable campaign export/import, production security certification and source monster combat remain open. CP149/CP150 and frozen authority/schema code remain untouched.
