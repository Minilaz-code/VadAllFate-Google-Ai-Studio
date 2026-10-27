# VadAllFate V2 — Evidence-Based Implementation Register & Specification Audit

**Audit & Execution Date:** 2026-10-27 (Milestone 10A Critical Authority Recovery, Co-DM Forward Compensation, and Pack Staging Security QA)  
**Active Backend Worktree / Branch:** `d:\Development\VadAllFate-v2-srd` (`v2/srd51-rules-browser`)  
**Active Frontend Worktree / Branch:** `d:\Development\VadAllFate-Google-Ai-Studio` (`v2/srd51-rules-browser`)  
**Canonical Instructions:**
- `docs/V2-PORTABLE-CAMPAIGN-PACKS-AND-OBSIDIAN-INTEROP.md`
- `docs/CPP-00-INVENTORY-MAPPING-AND-THREAT-MODEL.md`
- `docs/V2-ARCHITECTURE-INSTRUCTIONS-HARNESS-KNOWLEDGE-GRAPH.md`
- `docs/V2-AUTHORED-NOTES-PLANS-HOMEBREW-LIFECYCLES.md`
- `docs/KGP-00-SCHEMA-AND-ACL-AUDIT.md`
- `docs/SRD51-AISTUDIO-REFERENCE-QUERY-PLAN.md`
- `VadAllFate-Google-Ai-Studio:docs/V2-INTEGRATION-INSTRUCTIONS.md`
- `analysis/R1-W00-STATUS.md` & `analysis/PARALLEL-SRD-COMBAT-BOUNDARY.md`

---

## 1. Existing SRD 5.1 SQLite Verification Record

- **File Path:** `D:\Development\VadAllFate\vadallfate_srd51.sqlite` (reused directly; never rebuilt or replaced)
- **File Size:** `2,670,592` bytes
- **SHA-256 Digest:** `919857e19f0cc6bf0255045e8cc3d56f5c9c9e24da3921e07940a1749caf77a2` (matches `reference-manifests/srd51-0.1.0.json` before and after all test suites)
- **Integrity Checks (Read-Only URI `mode=ro` + `PRAGMA query_only=ON`):**
  - `PRAGMA quick_check`: `ok`
  - `PRAGMA foreign_key_check`: `[]` (0 violations)
- **Schema Metadata:** `schema_version = 0.1.0`
- **Source Provenance (`sources` table):**
  - `source_key`: `oracle-0.2.3`
  - `title`: `dnd-oracle SQLite source database`
  - `license_id`: `SRD-5.1-CC-BY-4.0-AND-ORACLE-MIT`
  - `attribution`: `SRD 5.1: CC BY 4.0; Oracle MIT notices retained separately.`
  - `source_url`: `https://github.com/5e-bits/5e-database`
  - `sha256`: `48aa189639224edea9698fb00e62e1d671ec21d8e6306cee96a5174e3fc8afec`
- **Record Counts:**
  - `source_records`: `1,207`
  - `srd_entities`: `1,207` (`class`: 12, `condition`: 15, `equipment`: 237, `magic_item`: 239, `monster`: 334, `race`: 9, `rollable_table`: 9, `rule`: 33, `spell`: 319)
  - Review/Combat Coverage Tables (`damage_modifiers`, `monster_damage_coverage`, `damage_modifier_reviews`, `rule_patterns`, `pattern_reviews`, `pattern_candidate_links`): `0` rows (`DISABLED_NO_APPROVED_MONSTER_COVERAGE`).

---

## 2. Specification Audit & Granular Feature Classification Matrix

Every requirement (`REQ-01` through `REQ-17`) is audited below across five explicit tiers:
1. **Implemented Foundation / Contract:** Schemas, SQLite tables, RBAC rules, or API boundaries.
2. **Functional Subsystem:** Server-side runtime execution verified with tests.
3. **Complete User-Facing Feature:** End-to-end UI + backend + persistence verified in a live user journey.
4. **Mocked / Fallback Functionality:** Client-side demo spine (`DemoCampaignClient`), deterministic test providers (`DeterministicLocalRuleProvider`), or synthetic audio tone fallback.
5. **Incomplete / Blocked / Deferred:** Capabilities not yet built, gated by architectural holds (`Step 51`, `CP009B`, `CP017B`), or deferred post-V2.

| ID | Capability | Overall Status | Implemented Foundation & Functional Subsystem | Complete User-Facing Feature | Mocked / Fallback Functionality | Incomplete, Blocked, or Deferred vs. Full Specification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | **Five DM Operating Modes** (`full_ai_dm`, `ai_primary_codm`, `human_primary_codm`, `human_dm_assist`, `human_sovereign`) | **Verified working** *(Functional runtime mode switching + vertical slice narration + distinct Co-DM adjudication approval & compensating patch veto workflows)* | `SET_OPERATING_MODE` commits via `CommitAuthority`; `human_primary_codm` stages player attacks/spells as `PENDING_HUMAN_DM_APPROVAL` until Human DM invokes `APPROVE_ADJUDICATION` or `VETO_ADJUDICATION`; `ai_primary_codm` executes immediately with `APPLIED_PENDING_DM_VETO`, and DM veto commits a forward-correcting `COMPENSATING_CORRECTION` via `CommitAuthority`. `human_sovereign` keeps AI harness dormant; `human_dm_assist` appends passive SRD citations; `full_ai_dm` invokes `SingleBoundedAIHarness`. | Header mode selector (`Header.tsx`) + `PythonRuntimeGateway.setOperatingMode` persist mode changes; `pendingAdjudications` array surfaced in projection for DM review. | `DemoCampaignClient` updates mode in browser memory only. | None (Milestone 10 complete). |
| **REQ-02** | **Deterministic Python Runtime & Single Commit Authority** | **Verified working** *(Core R1/V2 commit pipeline complete; pipeline hardened against orphaned/stale admissions; R1 v0.3 schema pack hold preserved)* | `CampaignStore` + `CommitAuthority` (`admit_input` -> `dispatch_head` -> `stage_worker_result` -> `commit`), JCS canonical hashing, `idempotency_receipts`, `causal_ledger`, `applied_patches`, `runtime_events`, `outbox`, and SQLite write firewall (`AUTHORITY_VIOLATION` with `_COMMIT_AUTHORITY_CAPABILITY`). Gateway automatically drains stale head admissions (`discard_stale_admission`) and cleans up aborted pending admissions on exception. | Every live V2 gameplay action, DM plan confirmation, Homebrew implementation, and Co-DM adjudication commits through `CommitAuthority` and survives server restart. | `DemoCampaignClient` produces non-authoritative receipts explicitly labeled `isSimulatedDemoReceipt: true`. | **Hold (`CP009B-02B-03C-02C`):** Frozen `schemas/r1/**` manifest 13-vs-12 CR discrepancy remains under user hold. |
| **REQ-03** | **SQLite Data Domains** (SRD 5.1, Save Store, V2 Authoring Store, 5e.tools Master Mount) | **Partially implemented** *(SRD 5.1, Save Store, and V2 Authoring Store working; 5e.tools Master Mount gated)* | Read-only `SRD51RulesReader`, R1 `CampaignStore`, and `V2AuthoringStore` (`v2_world_entities`, `v2_world_edges`, `v2_notes_index`, `v2_plans`, `v2_homebrew`, `v2_auth_sessions`). | Rules lookup, campaign save state, notes, DM plans, and homebrew persist across restarts in SQLite. | None. | **Blocked (`CP017B`):** External 5e.tools Master SQLite live entity queries remain locked until `SCR-SQL CP125/CP126` schema approval. Separate multi-file World/Adventure SQLite mounts are currently consolidated in `V2AuthoringStore`. |
| **REQ-04** | **Rules Browser & Search** (SRD 5.1 Read-Only Query API + React Browser) | **Verified working** *(Complete user-facing feature)* | `SRD51RulesReader` (`mode=ro`, `PRAGMA query_only=ON`) + `/api/srd51/status`, `/api/srd51/search`, `/api/srd51/entities/{key}`, `/api/srd51/types/{type}` (`405` on mutations). | React Rules Browser in `NarrativePlayView.tsx` and `TabletopView.tsx` searches all 1,207 SRD entities with category filters and full stat/spell/rule detail cards. | House Rules overlay in `DemoCampaignClient` is kept visually and structurally separate from SRD 5.1 SQLite results. | None (Milestone 1 complete). |
| **REQ-05** | **D&D 5e Mechanics & Combat Engine** | **Partially implemented** *(Playable vertical slice for PCs & authored NPCs working; SRD monster combat blocked by Step 51; full 5e class/spell automation incomplete)* | Deterministic d20 rolls (`sha256(state_hash:client_nonce)`), `SKILL_CHECK`, `START_ENCOUNTER`, `NEXT_TURN`, `END_ENCOUNTER`, `ATTACK_ACTION` (AC check, crit doubling, HP deduction, `Unconscious` at 0 HP), `CAST_SPELL` (slot deduction), `APPLY_CONDITION`, `REMOVE_CONDITION`, `DEATH_SAVE`, `USE_ITEM`, `REST_SHORT`, `REST_LONG`. | Playable vertical slice supports loading `Lyra Vance` / `Kaelen Thorne`, rolling skill checks, starting initiative, advancing turns, attacking authored NPCs, applying conditions, death saves, using potions, and resting. | None in connected mode. | **Blocked (`Step 51`):** All 334 SRD monsters (`srd51:monster:*`) are blocked from combat (`REJECTED_MONSTER_COMBAT_HOLD` / `DISABLED_NO_APPROVED_MONSTER_COVERAGE`). Full automated saving-throw damage AoE resolution, concentration checks on damage, opportunity attacks, and full level 1–20 class feature automation are not yet implemented. |
| **REQ-06** | **Living World & Master Clock** | **Partially implemented** *(Master clock & paused offline policy working; autonomous off-screen world simulation deferred)* | `worldClock` (`totalWorldMinutes`, `calendar`, `isPaused`), `ADVANCE_TIME`, automatic `+1 min` roleplay advance, `+60 min` short rest, `+480 min` long rest, and `CP014` `PAUSED` offline policy. | World clock display and DM time advancement in `Header.tsx` and `DmPlanningView.tsx` persist across restarts. | None. | Autonomous off-screen `WorldPropagationEngine` (background faction/weather/NPC schedules ticking while party rests or travels) is deferred per `R1-W00`. |
| **REQ-07** | **Living NPC Cognition & Epistemic Boundaries** | **Partially implemented** *(Epistemic split-truth & live LLM dialogue with interaction memory working; autonomous goal-planning loop incomplete)* | Split-truth storage (`public_summary`, `perceived_summary`, `dm_secret_summary`), epistemic filtering in `KnowledgeQueryService` & `HarnessContextCompiler`, live `npc_interpreter` inference via `OllamaLocalProvider("qwen3.5:4b")`, and persistent `interactionHistory` per NPC. | Players can converse in-character with `Jorren Vale` (`NPC_DIALOGUE` / `FREEFORM_ROLEPLAY`), receive live `qwen3.5:4b` responses grounded in public/perceived facts (zero `dm_secret` leaks), and persist conversation memory across restarts. | `DeterministicLocalRuleProvider` remains available for offline/fast unit tests (`VADALLFATE_HARNESS_PROVIDER=deterministic`). | Autonomous multi-turn NPC goal re-evaluation, dynamic attitude/disposition mutation from dialogue outcomes, and rumor propagation between NPCs are not yet automated. |
| **REQ-08** | **AI Director & Task Profiles** (`Narrator`, `NPC Interpreter`, `Director`, `Planner`) | **Partially implemented** *(All 4 bounded task profiles, live `qwen3.5:4b` inference, and live action-driven `spotlightMetrics` & `SPOTLIGHT` recommendation generation working; autonomous real-time timer-based pacing intervention incomplete)* | `SingleBoundedAIHarness` with `OllamaLocalProvider("qwen3.5:4b")`, strict JSON output validation, zero-mutation enforcement, `SET_DIRECTOR_PROFILE` / `REVIEW_RECOMMENDATION` persistence, and dynamic recomputation of `spotlightMetrics` (`sharePercentage`, `engagementStatus`, `combatActionsCount`, `dialogueTurnsCount`, `skillChecksCount`) on every player action. | Live `narrator` and `npc_interpreter` turns run against `qwen3.5:4b` during gameplay; player actions dynamically update spotlight balance and auto-generate `SPOTLIGHT` recommendations when a party member drops below 35% share. | `DeterministicLocalRuleProvider` is used only when `VADALLFATE_HARNESS_PROVIDER=deterministic` or if Ollama is unreachable. | Autonomous real-time wall-clock silence detection and unprompted background `director` LLM interventions during idle table time are not yet automated. |
| **REQ-09** | **DM Planning Lifecycle** (`Draft -> Proposed -> Confirmed -> Superseded`) | **Verified working** *(Complete user-facing lifecycle)* | `PlanLifecycleService` in `v2_authoring_services.py` + `transition_plan_authoritative` in `v2_campaign_gateway.py` (commits to `CommitAuthority` on `confirmed` with pinned `source_markdown_hash`). | DM Planning workspace (`DmPlanningView.tsx`) creates, proposes, confirms, and supersedes plans with live SQLite persistence. | None. | Automatic compilation of confirmed DM plans into multi-room battlemap geometry or complex encounter triggers remains manual. |
| **REQ-10** | **Homebrew Workshop Lifecycle** (`Draft -> Validated -> Implemented -> Deprecated`) | **Verified working** *(Complete user-facing lifecycle for spell/item/creature authoring & scope activation)* | `HomebrewLifecycleService` (D&D 5e structural validation, version immutability, `OVERRIDES_RULE` graph edges) + `transition_homebrew_authoritative` via `CommitAuthority`. | Homebrew Workshop (`HomebrewWorkshopView.tsx`) drafts, validates, and implements custom spells/items/creatures into campaign scope without mutating `vadallfate_srd51.sqlite`. | None. | Automated execution of arbitrary custom Homebrew mechanic scripts inside combat resolution is limited to standard stat/damage fields. |
| **REQ-11** | **SQLite-Backed Knowledge Graph & Authored Markdown Notes** | **Verified working** *(Complete user-facing feature + CPP-02 Markdown vault/wikilink/canvas/CSV import converters)* | `V2AuthoringStore`, `NoteService` (`.md` files + SQLite index + torn-sync recovery + wikilinks `[[...]]`), `GraphProjectionService`, and `KnowledgeQueryService` with strict `AudienceContext` ACLs. `v2_pack_converters.py` provides `MarkdownVaultParser`, `JsonCanvasConverter`, `CsvEntityRelationConverter`, and `DryRunPackImporter` (`/api/v2/campaign-packs/preview`). | `PlayerJournalView.tsx` and `DmPlanningView.tsx` create/edit notes, transition visibility (`private_player` -> `shared_with_dm` / `party_shared`), and query the epistemic knowledge graph with zero secret leakage. | None. | None (Milestones 2, 3 & 10 complete). |
| **REQ-12** | **React Frontend Application Shell & Live Gateway Integration** | **Verified working** *(Connected vertical slice & fail-closed production client hardening)* | `PythonRuntimeGateway` (`/api/v2/*`) with `SessionAuthRegistry` token headers (`X-VadAllFate-Session-Token`), plus hardened fail-closed boundary (`allowOfflineFallback: false` default; rejects 401/403/500 without demo fallback). | Live toggle in `Header.tsx` connects the React frontend to the authoritative Python V2 server on `:8765`. | `DemoCampaignClient` remains the default offline demonstration client until connected to Python runtime. | None. |
| **REQ-13** | **Battlemap / VTT** | **Partially implemented** *(Client-side geometry/LOS/Fog engine + authoritative `MOVE_TOKEN`, `TOGGLE_DOOR`, `REVEAL_FOG`, `UPDATE_BATTLEMAP_STATE` & initiative sync working; arbitrary freeform custom wall polygon persistence in backend SQLite incomplete)* | Client-side raycast LOS (`lineOfSight.ts`), 3-state Fog of War, wall/door/window/railing/terrain topology (`wallTopology.ts`), and backend `MOVE_TOKEN`, `TOGGLE_DOOR` (with lock & secret-door enforcement), `REVEAL_FOG`, `UPDATE_BATTLEMAP_STATE`, and `combatState` persistence in `CommitAuthority`. | Token movement (`MOVE_TOKEN`), door state transitions (`TOGGLE_DOOR`), fog-of-war cell reveals (`REVEAL_FOG`), and encounter turn state (`START_ENCOUNTER`, `NEXT_TURN`, `END_ENCOUNTER`) persist in backend SQLite with secret doors hidden from player projections until opened. | Custom blank/imported map freeform wall segment arrays remain managed in client-side `battlemapSessionManager` (`localStorage` / memory). | Full server-side SQLite persistence of arbitrary multi-hundred-segment custom freeform wall arrays and WebSocket broadcast deltas remain to be wired. |
| **REQ-14** | **Multiplayer & Session Security** | **Verified working** *(CSPRNG Host bootstrap key, Windows `icacls` user-only permissions, single-use invite redemption, HMAC token rotation, cross-restart revocation persistence, concurrency-safe auth, loopback CORS lockdown & anti-spoofing; remote LAN/WAN transport gated)* | `SessionAuthRegistry` (`POST /api/v2/auth/session`, `POST /api/v2/auth/provision`, `POST /api/v2/auth/assign-role`, `POST /api/v2/auth/revoke`, `GET /api/v2/auth/sessions`, `GET /api/v2/multiplayer/sync`) issues HMAC-SHA256 tokens (`v2sess.<id>.<hmac>`); `enforce_identity` blocks unauthenticated role claims, spoofed identities, expired/revoked tokens, and untrusted CORS origins (`CORS_ORIGIN_FORBIDDEN`). Persistent revocation survives restarts and role changes; concurrent auth requests are thread-safe. | Windows launcher provisions CSPRNG 192-bit Host bootstrap key; frontend stores tokens in `sessionStorage` (cleared on tab close) and attaches headers via `v2SessionHeaders`. Negative test suite (`test_v2_auth_security.py`) proves unauthorized users cannot obtain DM authority or read DM secrets. | Local development persona switcher in `Header.tsx` operates within authenticated session boundaries. | Wide-area internet multiplayer / peer discovery remains gated post-V2; local LAN multi-device access is disabled by loopback-only CORS and host firewalling. |
| **REQ-15** | **AI Harness & Model Routing** | **Verified working** *(Bounded single-worker priority queue + live local Ollama `qwen3.5:4b` inference verified)* | `SingleBoundedAIHarness` with priority queue (`REALTIME_TURN > INTERACTIVE_PROPOSAL > BACKGROUND_PREP`), `OllamaLocalProvider("qwen3.5:4b", think=False, format="json")`, and `DeterministicLocalRuleProvider` fallback. | Live gameplay narrations and NPC dialogues execute real LLM inference against local `qwen3.5:4b` on Ollama (`is_live_model_inference=True`, `provider_id="ollama-live:qwen3.5:4b"`). | `DeterministicLocalRuleProvider` is used only when `VADALLFATE_HARNESS_PROVIDER=deterministic` or if Ollama is unreachable. | Multi-model dynamic VRAM swapping between different LLM checkpoints is not needed on the single `qwen3.5:4b` + Chatterbox Nano baseline. |
| **REQ-16** | **Native Voice / TTS (Chatterbox Nano)** | **Verified working on CUDA hardware & host audio device** | `NativeTTSAdapter` + persistent `v2_chatterbox_nano_worker.py` running `ChatterboxTurboTTS.from_pretrained(device="cuda", nano=True)` with `C:\ADA\voices\voice_registry.json` and `sounddevice.RawOutputStream`. | `POST /api/v2/tts/synthesize`, `VadAllVoxBar.tsx`, and `NPC_DIALOGUE` (`synthesizeVoice=True`) generate real 24kHz neural WAV speech on CUDA and play on host audio output. | `synthetic_test_tone_fallback` exists strictly as a labeled fallback if CUDA worker is disabled. | Streaming chunked WebRTC audio to remote multiplayer browsers is not yet implemented. |
| **REQ-17** | **Explicitly Deferred Post-V2 Capabilities** | **Deferred** | N/A | N/A | N/A | Distributed peer inference, autonomous published-adventure compiler, automated AI image-to-wall map interpretation, simultaneous multi-voice concurrency, and proprietary Obsidian binary dependency remain explicitly deferred. |

---

## 3. Milestone 10 & 10A Verification Evidence

### Milestone 10A: Critical Authority and Import-Security QA (Completed)
1. **R1 Recovery and Commit Authority (Priority 1):**
   - **Zero Deletion Guarantee:** Replaced all automatic `DELETE FROM input_admissions` in `_ensure_seed_campaign` and `_execute_commit_authority_pipeline` with durable R1 recovery protocol (`_recover_pending_admissions_internal`).
   - **Recovery Protocol:** Inspects `authority.recovery_head`. If head is `STAGED_NEEDS_VALIDATION`, recovers and commits staged worker proposal via `authority.recover_staged_request`; if head is `STALE_NEEDS_REVIEW`, marks status as `'STALE'` via `authority.discard_stale_admission`; if `DISPATCH_REQUIRED`, reconstructs action envelope and dispatches recovery token.
   - **Preflight & Concurrency Hardening:** Validates snapshot freshness pre-flight against `store.read_state(campaign_id)` before calling `admit_input`. Added exception mapping in `submit_action` for `STALE_SNAPSHOT` and `DUPLICATE_CONFLICT` to return authoritative rejected receipts without connection termination.
   - **Test Suite:** Built comprehensive suite in `tests/test_v2_commit_recovery.py` (6 tests: staged uncommitted startup recovery, durable stale discard without deletion, idempotent replay receipts, stale preflight rejection, monotonic sequential execution, and authority-locked concurrent actions).

2. **Co-DM Adjudication Correctness (Priority 2):**
   - **Human-Primary Staging (`human_primary_codm`):** Player `ATTACK_ACTION` and `CAST_SPELL` actions are staged in `pendingAdjudications` with status `PENDING_HUMAN_DM_APPROVAL`. Live HP and spell slots are not consumed prematurely until Human DM approves.
   - **Supervisory Forward Compensation (`ai_primary_codm`):** AI actions apply immediately with `APPLIED_PENDING_DM_VETO`. Human DM `VETO_ADJUDICATION` applies a forward-correcting delta patch (`min(max_hp, cur_hp + dmg)`), preserving intermediate damage from subsequent legitimate attacks rather than blindly reverting historical state.
   - **Unsafe Compensation Review:** If subsequent mutations defeated the target or placed a character in an incompatible condition, automatic compensation is rejected and marked `UNSAFE_COMPENSATION_NEEDS_REVIEW` for manual DM resolution.
   - **Edge & Rejection Verification:** Duplicate approvals and duplicate vetoes return `REJECTED_VALIDATION_FAILURE`. Pending adjudications persist across SQLite restarts and can be approved in subsequent sessions. Verified in `tests/test_v2_codm_modes.py` (7 tests).

3. **Campaign Pack Security & Ingestion QA (Priority 3):**
   - **Audience & Staging Boundaries:** `POST /api/v2/campaign-packs/preview` enforces `aud.role in {"dm", "dm_host"}`. Player hosts (`role="player"`, `is_host=True`) are strictly denied DM campaign pack authoring authority with HTTP 403.
   - **Path Traversal Defense:** Packs must reside within `(runtime_db_path.parent / "campaign_packs" / "staging")`. Traversal attempts (`../../secret.zip`) or external absolute paths raise `PermissionError("STAGING_PATH_TRAVERSAL_REJECTED")` with HTTP 403.
   - **Authoritative Rules Lookup:** Wikilink spell resolution in `DryRunPackImporter` queries `SRD51RulesReader` via `get_by_key`, `get_by_name`, and `search_entities` (e.g. resolving `[[Fireball]]` to `srd51:spell:119`) rather than substring heuristics.
   - **Edge & Entity Integrity:** Candidate edges referencing unknown nodes trigger `UNRESOLVED_EDGE_REFERENCE` and mark `is_importable = False`.
   - **Audience-Aware Filtering:** Previews requested by non-DM audience roles (`audience_role="player"`) strictly filter out `dm_secret` and `dm_private` nodes, edges, and notes. Verified in `tests/test_v2_pack_converters.py` (8 tests) and `tests/test_v2_auth_security.py` (16 tests).

4. **Real Desktop Gameplay Acceptance (Priority 4):**
   - Automated end-to-end acceptance suite (`scratch/gameplay_acceptance.mjs`) executed successfully against live Windows launcher, local Ollama `qwen3.5:4b`, and native Chatterbox Nano TTS:
     - Step 1-4: Services healthy, CSPRNG host key provisioned, DM and player session tokens authenticated.
     - Step 5: Live Qwen-driven in-character dialogue with Jorren Vale committed (`COMMITTED`).
     - Step 6: Investigation skill check rolled deterministically (`SUCCESS`).
     - Step 7: Combat encounter started, Quarterstaff attack resolved against AC 14 (`HIT for 7 damage`, `COMMITTED`).
     - Step 8: Long rest committed (`+480 min`, world minute 1820).
     - Step 9: Native Chatterbox Nano TTS synthesized audio (`chatterbox_nano_cuda`, duration 3.84s).
     - Step 10: Complete shutdown and restart; verified pre-restart sequence `15` and stateHash `3540e441b3b9190b` persisted deterministically across application restart.
     - Step 11: All services cleanly terminated, zero orphaned processes on ports 8765, 3000, 9222.

5. **Test Metrics:**
   - Backend: `351/351` pytest tests passing across all test modules.
   - Frontend: `133/133` Node.js tests passing across all 19 suites.

---

### Milestone 10 Final Hardening (Earlier)

Executed and verified across unit, integration, and real headless Chrome CDP end-to-end acceptance:

1. **Milestone 9 Final Hardening (Priority 1):**
   - **CSPRNG Bootstrap Key Generation:** In `scripts/start-vadallfate-v2.ps1`, replaced `Get-Random` with `[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)` to generate 192-bit cryptographic keys.
   - **Bootstrap Credential Windows Permissions:** In `v2_campaign_gateway.py`, added Windows `icacls` user-only grant (`/inheritance:r /grant:r "%USERNAME%:(R,W)"`) and POSIX `0o600`.
   - **Cross-Restart Expiration & Revocation Persistence:** Negative tests in `test_v2_auth_security.py` confirm tokens and invites remain revoked across simulated server restarts; multi-threaded concurrent requests cleanly serialize under `_lock`.
   - **Frontend Fail-Closed Production Client:** In `v2BackendClient.ts`, added `allowOfflineFallback: false` by default, throwing on 401/403/500 errors and network catches across notes, plans, homebrew, knowledge graph, and TTS synthesis. Added 4 negative test suites in `v2BackendClient.test.ts`.
   - **Bidirectional SHA-256 Campaign Pack Verification:** In `v2_campaign_pack.py`, added strict checks rejecting `EXTRA_UNHASHED_FILE`, `MISSING_HASHED_FILE`, `CONFLICTING_HASH_ENTRY`, `INVALID_HASH_PATH`, and `INVALID_HASH_FORMAT`. Verified in `test_v2_campaign_packs.py`.
2. **CPP-02: Import Converters (Priority 3):**
   - Implemented `v2_pack_converters.py` containing:
     - `MarkdownVaultParser`: parses YAML frontmatter, wikilinks (`[[Target]]`, `[[Target|Alias]]`, `[[Target#Heading]]`), resolves aliases, and extracts forward/backlinks and unresolved targets.
     - `JsonCanvasConverter`: converts `.canvas` JSON node coordinates (`text`, `file`, `link`, `group`) and directed edges into visual node layout structures.
     - `CsvEntityRelationConverter`: safe parsing/export of `world/nodes.csv` and `world/edges.csv` with formula injection sanitization.
     - `DryRunPackImporter`: deterministic ID generation, preview generation, and strictly zero Save mutations (`canonical_mutations_count == 0`).
   - Exposed `POST /api/v2/campaign-packs/preview` endpoint in `srd51_http_api.py`.
   - Verified 5/5 test cases passing in `tests/test_v2_pack_converters.py`.
3. **Co-DM Operating Modes (Priority 4):**
   - Implemented in `v2_campaign_gateway.py`:
     - `human_primary_codm`: Player attack/spell actions are held in `/campaign_doc_json` as `PENDING_HUMAN_DM_APPROVAL` and surfaced via `pendingAdjudications`. Human DM resolves via `APPROVE_ADJUDICATION` or `VETO_ADJUDICATION`.
     - `ai_primary_codm`: Immediate execution with `APPLIED_PENDING_DM_VETO`. Human DM `VETO_ADJUDICATION` commits a forward-correcting `COMPENSATING_CORRECTION` via `CommitAuthority`.
     - Pipeline Resilience: Gateway automatically drains stale head admissions (`recovery_head` + `discard_stale_admission`), cleans up aborted pending admissions on pipeline exceptions, and validates `_COMMIT_AUTHORITY_CAPABILITY`.
   - Verified in `tests/test_v2_codm_modes.py`.
4. **Complete Real Gameplay Acceptance (Priority 2):**
   - Executed via Windows launcher (`scripts/start-vadallfate-v2.ps1 -NoBrowser`) and headless Chrome CDP (`scratch/gameplay_acceptance.mjs`):
     - **Host Auth:** CSPRNG host key provisioned, browser connected to `http://127.0.0.1:3000/#vf_host_key=...`, verified DM host token and Lyra Vance player token issued. Screenshot: `scratch/ui-01-start.png`.
     - **Live Dialogue:** Lyra Vance conversed with Jorren Vale regarding cold iron shipments. Local Ollama `qwen3.5:4b` generated in-character grounded response with zero secret leakage. Committed: `COMMITTED`. Screenshot: `scratch/ui-02-dialogue.png`.
     - **Skill Check:** Evaluated Investigation DC 14 check (`1d20+7 = 13 vs 14 -> FAILURE`).
     - **Combat Encounter & Attack:** Started encounter; Lyra Vance attacked Jorren Vale with Quarterstaff (`18 vs AC 14: HIT for 7 damage`). Committed: `COMMITTED`. Screenshot: `scratch/ui-03-combat.png`.
     - **Rest & Clock:** DM executed Long Rest (`+480 min`), advancing world minute to `1339`. Committed: `COMMITTED`. Screenshot: `scratch/ui-04-rest.png`.
     - **Native TTS:** Synthesized speech via `chatterbox_nano_cuda` (neural: `true`, duration: `3.92s`).
     - **Restart Persistence:** Stopped launcher via `-Stop`, restarted with `-NoBrowser`; verified pre-restart commit sequence `10` and stateHash `921860bf3a1505c6` persisted deterministically. Stopped cleanly.
5. **Test Metrics:**
   - Backend: `334/334` pytest tests passing (`uv run pytest tests -q`).
   - Frontend: `133/133` Node.js tests passing (`npm test`).

---

## 4. Preserved Architectural Holds & Next Development Milestone

- **Preserved Architectural Holds:**
  1. **Step 51 SRD Monster-Combat Hold (`DISABLED_NO_APPROVED_MONSTER_COVERAGE`):** `0/334` SRD monsters approved; `srd51:monster:*` combat initiation remains fail-closed (`REJECTED_MONSTER_COMBAT_HOLD`).
  2. **R1-STATE v0.3 Manifest 13-vs-12 CR Hold (`CP009B-02B-03C-02C`):** Frozen `schemas/r1/**` files remain untouched.
  3. **5e.tools Master Mount Hold (`CP017B`):** External 5e.tools master DB live queries remain gated until SCR-SQL CP125/CP126 approval.
- **Completed in Milestone 10:**
  - Milestone 9 final hardening (CSPRNG host key, Windows `icacls` user ACLs, cross-restart revocation persistence, frontend fail-closed production client, bidirectional pack SHA-256 validation).
  - CPP-02 import converters (Markdown/wikilink vault parser, JSON canvas converter, CSV node/edge converter, dry-run importer).
  - Co-DM operating modes (`human_primary_codm` approval staging and `ai_primary_codm` compensating patch vetoes).
  - Commit authority pipeline hardening (`recovery_head` stale discard, exception cleanup of uncommitted pending admissions, `_COMMIT_AUTHORITY_CAPABILITY` verification).
  - Complete real gameplay acceptance test suite through Windows launcher, headless Chrome CDP, local Ollama `qwen3.5:4b`, and native Chatterbox Nano TTS.
- **Completed in Milestone 10A:**
  - Priority 1: R1 durable recovery head without deletion (`input_admissions`), snapshot freshness preflight check, and 6-case crash/restart/concurrency test suite (`test_v2_commit_recovery.py`).
  - Priority 2: Co-DM adjudication correctness, human-primary spell/attack staging, forward-correcting supervisory veto preserving intervening mutations, and unsafe compensation detection (`test_v2_codm_modes.py`).
  - Priority 3: Campaign pack preview security, player-host DM authoring exclusion, staging directory containment (`campaign_packs/staging`), authoritative SRD51 rules spell lookup, unresolved edge rejection, and audience-aware projection filtering (`test_v2_pack_converters.py`, `test_v2_auth_security.py`).
  - Priority 4: Full regression verification across 351 backend tests, 133 frontend tests, and 11-step real desktop gameplay acceptance suite with zero port leaks.
- **Completed in Milestone 10B:**
  - Priority 1: Admission recovery correctness closure (`DISPATCH_REQUIRED`). Safely reconstructed and deterministically executed admitted actions (`ATTACK_ACTION`, `CAST_SPELL`, `ADVANCE_TIME`) with real state patches through `_synthesize_action_outcome` and Single Commit Authority. Zero empty `writes=()` proposals. Crash/restart recovery tests verified in `test_v2_commit_recovery.py`.
  - Priority 2: Co-DM supervisory veto safety invariant. Proved that unsafe vetoes flagged with `UNSAFE_COMPENSATION_NEEDS_REVIEW` strictly do not mutate HP or partially refund spell slots (`test_v2_codm_modes.py`).
  - Priority 3: Roadmap reconciliation per `docs/V2-PORTABLE-CAMPAIGN-PACKS-AND-OBSIDIAN-INTEROP.md`. Milestone 11 is designated strictly as CPP-03 (Authorized Campaign-Pack Admission, Idempotent Installation, Provenance & Safe Exports). Battlemap multi-room persistence is decoupled to Milestone 12.
- **Completed in Milestone 11 (CPP-03):**
  - Priority 1: Campaign Pack Proposal Generation & Conflict Reporting (`POST /api/v2/campaign-packs/proposal`). Safely validates archives from staging, generates human-reviewable proposals classifying entities as `IDENTICAL`, `MODIFIED_PROPERTIES`, or `NEW` without mutating canonical state.
  - Priority 2: DM-Authorized Transactional Installation (`POST /api/v2/campaign-packs/install`). Idempotent installation of nodes (`v2_world_entities`), edges (`v2_world_edges`), and notes (`v2_note_index`) recorded in `v2_installed_campaign_packs` with SHA-256 verification and atomic Single Commit Authority execution under `IMPORT_CAMPAIGN_PACK`. World clock and time are strictly preserved.
  - Priority 3: Safe Audience-Filtered Campaign Pack Export (`POST /api/v2/campaign-packs/export`). Exports campaign state into standard `.vadpack` archives with full audience filtering: DM exports include secret notes and nodes, while player exports strictly sanitize and redact all `dm_secret` / `dm_private` entities and edges.
  - Priority 4: Provenance tracking (`pack_id`, `pack_version`, `license`, `author`) across all imported entities, and restart persistence across SQLite database reloads. Verified across 7 dedicated test scenarios in `tests/test_v2_pack_installation.py`, full backend test suite (360/360 passing), frontend suite (133/133 passing), and end-to-end acceptance automation.
- **Completed in Milestone 11A (Integrity Closure & Frontend Playability):**
  - Priority 1: Campaign Pack Installation Authority Repair (CPP-03).
    - Inverted installer flow: validates proposal against pinned campaign revision (`snapshotRef`), requires explicit DM authorization, and admits state changes transactionally through Single Commit Authority *before* committing SQLite authoring store mutations.
    - Active Save Decision Preservation: existing save entities (`loc-primara-cathedral`, `loc-avernus-rift`, `npc-jorren-vale`) retain their custom canonical names, player-modified descriptions, and attributes. The installer merges pack tags and attaches `source_provenance` under attributes without clobbering active save state.
    - Durable Staging & Rollback: sidecar Markdown notes are staged to `.staging/pack-*` and promoted only on committed action receipt; clean rollback removes staged files on rejection or stale revision failure.
    - Safe Player Export Privacy: strictly redacts `dm_secret` / `dm_private` entities and dossiers, and enforces player note isolation (`private_player` / `player_specific` notes belonging to other players are excluded from export archives).
    - Source Provenance Licensing: export manifests dynamically derive verified licensing from installed packs (`source_provenance_licenses`) rather than defaulting to hardcoded CC-BY-4.0.
    - Added 4 dedicated tests in `tests/test_v2_pack_installation.py` (total 11/11 passing). All 368 backend tests pass (`368/368`).
  - Priority 2: Frontend Playability & User-Reported Blocker Resolution (P0).
    - Header Connection Truth: `Header.tsx` renders live runtime status badge (`PYTHON V2 AUTHORITATIVE RUNTIME CONNECTED (R1 Single Commit Authority)` in pulsing green, or `DEMO MODE` in amber) with a one-click actionable toggle (`USE LIVE V2` / `USE DEMO`).
    - Authoritative Narrative Dialogue Feed: `NarrativePlayView.tsx` now derives the central narrative feed dynamically from `events: CausalEvent[]` in chronological order. Completely removed hardcoded `n1-n4` Yawning Portal taproom demo items. Renders distinct player speech balloons, AI Co-DM NPC responses, DM narration, and dice roll results with auto-scroll.
    - Campaign Context Alignment: Replaced hardcoded Waterdeep/Yawning Portal headers with active campaign context (`Highgate Harbor & Primara Cathedral`, `Scholar Jorren Vale`).
    - Fixed URL fragment handling in `v2Session.ts` to recognize `#vf_host_key=...`, `#key=...`, and `#host_key=...`.
    - Verified full end-to-end browser loop via Chrome CDP: page loads in attempted live mode, connects to Python runtime, player dialogue submits through UI, commits via Single Commit Authority in SQLite, and displays dynamically in central story window.
    - All 133 frontend tests pass (`133/133`).
  - Priority 3: Frontend Delivery Programme.
    - Established comprehensive specification and delivery backlog in `docs/V2-FRONTEND-DELIVERY-PROGRAMME.md` covering UX-02 (Character Sheet & Combat Tracker), UX-03 (Zero-Crop VTT & Blue Alley Calibration), UX-04 (Design System Redesign), and UX-05 (CPP-04 Pack Manager).
- **Next Development Milestone (Milestone 11B):**
  - **UX-02 Usable Character Sheet & Interactive Combat Tracker:** Live HP, spell slots, and condition adjustments under Single Commit Authority.
