# Persistent world integration handoff — 2026-10-31

Both repositories use `codex/v2-persistent-world`, based on the published `codex/v2-app-integration` branches. Exact paired implementation SHAs are recorded in the publication document added after implementation commits. The initial independently working actor milestones are backend `9c6fea7` and frontend `2041d78`.

## Acceptance and implementation

PASS — Durnan resolves through the generic ContentResolver from exact installed pins. A DM creates a persistent NPC using POST `/api/v2/content/place`: `npcRef`, `locationRef`, optional `targetCell:{x,y}`, and a player-safe `dialogueBrief` (maximum 1200 characters). Standard action wrapper requires `snapshotRef` and unique `actionId`. Only DM authority can create/place; drafts require explicit `approveDraft:true`. Existing instances reject changed source hashes. Source definitions and templates remain immutable.

The instance uses the existing campaign `npcs` shape and canonical location identity. `sourceBinding` retains prose and linked template references, manifest pins and definition hashes. Template mechanics are resolved but not activated: no invented AC/HP/attack values, `combatEligible=false`, excluded from initiative and rejected for supported combat actions. Step 51 and other combat holds remain. Association-only instances carry `token.placed=false` and do not appear as physical placements. Optional Medium-token placement requires an explicitly configured active battlemap grid and uses existing SceneCellPoint/CreatureFootprint occupancy and closed-door checks. No automatic map geometry or artwork calibration is inferred. The current private demo has no explicit battlemap grid configuration; its accepted browser journey uses location association, while token coordinate/validation behavior has automated contract coverage.

PASS — Lyra's directed statement to introduced Durnan is an actual R1 action with a real receipt. It records an unverified HEARD NPCEpisodicMemory through the existing NPCCognitionState model. The NPC remembers that Lyra made a promise; it does not establish that the promise was fulfilled. This is an interaction-memory consequence, not a complete cognition system or automatic attitude inference. Dialogue co-location is based on the DM's active released scene/location; no physical hearing-distance simulation is claimed for location-only associations.

PASS — Configured local Qwen generated a reply for the persistent Durnan instance in actual Microsoft Edge/Python/React play. The source actor, witnessed promise, AI reply, origin, provider and bounded-context provenance survived a complete Python/React shutdown/restart. A separate child timeline loaded that reply and committed its own later statement; primary runtime campaign revisions/state hashes remained unchanged.

## AI boundaries and modes

The provider-agnostic NPC task uses existing `SingleBoundedAIHarness`, `npc_interpreter`, shared priority queue and model execution lock. No second model scheduler or AI-owned database. A concrete queue defect was fixed: synchronous requests now retrieve their own sequence result rather than another queued task's output. The NPC context stays within the existing 5000-character budget; installed Ollama retains its 2048-token context/512-token output and single-model/TTS resource handling.

Context contains source-bound identity, explicit DM-approved player-safe characterization, bounded released facts and at most three of that character's witnessed statements, marked unverified. It does not automatically copy source prose, guarded secrets, global graph dossiers, private plans, or unrestricted beliefs. Additional private NPC knowledge requires a future explicit knowledge-release policy; it is not silently imported. Player-safe characterization can be paraphrased by the DM from the displayed pinned source. Prompt-injection instructions in prose confer no authority. Generated language can still be mistaken; it is never automatically promoted to a world fact.

`full_ai_dm` / `ai_primary_codm`: verified model reply commits through R1. `human_primary_codm` / `human_dm_assist`: only DM can request; result is a private draft, hidden from players until a separate DM approval action. `human_sovereign`: model invocation denied. UI labels human DM, AI model and DM-approved AI origins separately. A real provider failure, deterministic fallback, malformed output, mismatched NPC/citation or nonempty canonical mutations fails without committing a reply. Existing human replies remain available.

Client-supplied `_sourceNpcInference` is stripped. Only server-generated validated inference enters the admitted action; recovery replays that exact inference rather than calling a model again. Consequences still pass existing state validation/admission/dispatch/staging/R1 CommitAuthority; model output has no SQL or canonical write capability. Raw model mutation attempts are preserved for rejection rather than silently erased by the Ollama adapter.

## Checkpoints and timelines

PASS — The existing whole-runtime SQLite backup workflow remains. Host DM can inspect a checkpoint, validate SQLite integrity/foreign keys, canonical campaign state hash and installed exact pack dependencies, then branch from that checkpoint into a fresh UUID Save. Parent Save ID and origin/current snapshots are reported. The original checkpoint/runtime is not overwritten. React exposes checkpoint selection, inspection and branch creation plus exact `-SaveId` restart arguments.

PARTIAL — Independent timelines are selectable through the existing safe process-restart workflow, not a live database swap. Checkpoints still contain the whole runtime (including other campaigns and local auth/authoring data); they are not shareable single-campaign exports. Sidecar metadata is a catalog/lineage record, not a second authority. Portable campaign export/import still requires an approved baseline/Save identity and migration contract, ledger/admission/replay closure, scoped notes/plans/ACL handling, asset/content dependency closure, credential exclusion and import collision rules. No frozen schemas or R1 authority code changed.

## Validation

Windows Python 3.14.7; Node 24.22.1; headless installed Microsoft Edge; actual locally installed `qwen3.5:4b` via Ollama, no cloud provider or model download. Private artifacts/proofs are ignored locally.

- Actor milestone: 10 content API tests passed; TypeScript passed; browser creation and full restart journeys passed.
- Final targeted API/Harness/authentication regressions: 38 passed in 100.75s. Covers permissions, ownership, preview, source pins, invalid grid cells, source combat denial, context secrecy, DM drafts/approval, sovereign mode, provider fallback/write attempts, forged inference, checkpoint lineage/isolation and queue result identity.
- Post-refinement regressions: 6 passed in 29.58s; separate real local-adapter network failure: 1 passed in 15.05s, no reply/revision committed. Final complete-process restart browser checks: 2 passed in 10.1s.
- Frontend: 150 passed; TypeScript and production build passed. Existing >500 kB bundle warning remains.
- Actual browser: world actor creation, real model inference (36.3s including browser), full process restart (both AI/actor checks passed), checkpoint inspection/branching and child-timeline play passed separately. Primary runtime hash comparison PASS.
- Full backend suite: 542 passed, 2 skipped in 607.40s. This broad run preceded the final prompt wording and additional queue-identity regression; the targeted checks cover those changes. No production security or full combat certification is claimed.
- Final real-model grounding exchange passed in 15.0s; semantic review found no unsupported booking/reward and measured 1068/5000 context characters. This is one reviewed exchange, not a guarantee of semantic correctness for arbitrary model output.

```powershell
.venv/Scripts/python.exe -m pytest -q -o addopts='' --tb=short
.venv/Scripts/python.exe -m pytest -q -o addopts='' tests/test_game_content_api.py tests/test_v2_ai_harness.py tests/test_v2_auth_security.py
npm test
npm run lint
npm run build
```

Browser tests are opt-in and deliberately sequential against a dedicated private runtime: `e2e/world.spec.ts` creates an actor/promise; restart and set `VADALLFATE_E2E_PHASE=resume` to verify; `e2e/ai-world.spec.ts` requests a real reply, then verifies it after restart with the same resume flag; `e2e/timelines.spec.ts` creates/branches checkpoints; launch that child before `e2e/timeline-play.spec.ts`. Set `VADALLFATE_E2E_HOST_RECORD` to the private launcher PID record and `VADALLFATE_E2E_OUTPUT` to an ignored private directory. Never run mutating browser scenarios on a production Save or publish screenshots/source responses.

## Launch and integration

Use the same separate checkouts, virtual environment, npm installation and private library layout described in [the previous application handoff](V2-APP-INTEGRATION-HANDOFF.md). From backend root:

```powershell
$env:VADALLFATE_FRONTEND_DIR = '<absolute frontend checkout>'
$env:VADALLFATE_CONTENT_LIBRARY = '<private installed pack library>'
$env:VADALLFATE_CONTENT_ASSETS = '<private external-assets directory>'
./scripts/start-vadallfate-v2.ps1 -NoBrowser -ApiPort 8876 -UiPort 3187
```

Open `http://127.0.0.1:3187`, authenticate with the private local host key. PLAY → Campaign content → select pinned world/adventure → open scene → select NPC/location → supply player-safe characterization → Create or place source NPC → Introduce NPC → Lyra → Speak and record → Request AI NPC reply. In human-led modes the DM must approve the private draft. Source/library failures remain visible; no fallback reply is called an AI success. Stop with `./scripts/start-vadallfate-v2.ps1 -Stop`; append `-SaveId <checkpoint UUID>` to open a selected independent timeline. Do not use `-SkipOllama` for the real-model journey; it intentionally selects deterministic operation. Backend provider model and chat endpoint can be configured with trusted host environment variables `VADALLFATE_NPC_MODEL` and `VADALLFATE_OLLAMA_CHAT_URL`; other adapters implement the existing Harness provider protocol and live-inference reporting. The existing OpenAI-compatible adapter now reports successful live inference correctly.

Antigravity: fetch both origin remotes; review and merge the corresponding `origin/codex/v2-persistent-world` into each active V2 integration branch, not main. These branches include the previous application integration, not replacements. Original Antigravity checkouts remain untouched. Verify exact SHAs in the paired publication document before integrating. Rerun the commands above and use a dedicated runtime/Save for private acceptance.

Next unfinished task: an explicit, per-NPC knowledge-release/belief policy and source-to-battlemap calibration/placement acceptance, followed by supported quest/attitude consequences under existing validators. Combat holds, portable single-campaign export/import and production security acceptance remain open. No CP149/CP150 work, new ingestion database or protected-branch merge.
