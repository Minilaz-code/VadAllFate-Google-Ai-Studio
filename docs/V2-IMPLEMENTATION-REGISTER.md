# VadAllFate V2 — Evidence-Based Implementation Register & Specification Audit

> **CURRENT PROGRAMME PRIORITIES — 2026-10-29 (supersedes old roadmap sequencing, not historical test results):** [V2 Continuous Harvest & M-Series Simulation Plan](V2-CONTINUOUS-HARVEST-AND-M-SERIES-SIMULATION-PLAN.md) is an active instruction in both repos. **B1D P0 action-role/trusted-roll/recovery/receipt repairs completed and verified** from [independent B1D QA](V2-HARVEST-02B1D-AUTHORITY-INPUT-AND-REPLAY-QA.md). **M-SIM-00/01** original M03–M16/M16P source inventory/crosswalk and **HARVEST-03-MSIM** MIT module discovery are APPROVED / NOT STARTED IN V2; **M-SIM-02/03** generic weather, travel, visitor, faction, rumour and news runtime integration is PLANNED / NOT ACCEPTED; **M-SIM-04 + CPP-05** lawful M16 convergence activation and portable campaign acceptance are PENDING. HARVEST-02-C map imports remain queued, with frontend UX and pack manager developed in parallel. Do not describe this programme as completed code or source inventory.

> **Standing engineering gate:** Before implementing major new functionality, compare current code with suitable MIT-licensed GitHub implementations and tests, pin exact file/SHA/licence, choose COPY/ADAPT/PORT/TEST-HARVEST/REFERENCE/REJECT, preserve third-party notices, integrate only within existing Python R1/SQLite + React contracts, and run security/replay/Windows tests. Harvest work is continuous, not one-off. Historical rows below may reflect earlier snapshots; the current B1D hold and M-SIM not-started grades control forward reporting.


> **Reuse programme (2026-10-28):** [HARVEST-02 MIT Source Reuse Execution Plan](V2-HARVEST-02-MIT-REUSE-EXECUTION-PLAN.md) & [HARVEST-02A Independent QA & Gate Closure](V2-HARVEST-02A-INDEPENDENT-QA-AND-GATE.md). HARVEST-02-A1 correctness and integration closure completed: Blockers A through D and Reviews E through G repaired, verified with 14 dedicated tests in `test_v2_harvest_02a_context_and_validation.py`, 430 total backend tests, and 147 frontend tests. All R1 Single Commit Authority, Step 51, and spatial holds strictly preserved.

> **Governing charter (28 October 2026):** [VadAllFate V2 Master Development Goals and Acceptance Charter](V2-MASTER-DEVELOPMENT-GOALS.md). Current milestone reports and this document are evidence registers, not proof that the complete product or known trust gates have passed.

**Audit & Execution Date:** 2026-10-27 (Milestone 10A Critical Authority Recovery, Co-DM Forward Compensation, and Pack Staging Security QA)  
**Active Backend Worktree / Branch:** `<backend-checkout>` (`v2/srd51-rules-browser`)
**Active Frontend Worktree / Branch:** `<frontend-checkout>` (`v2/srd51-rules-browser`)
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

- **File Path:** `<existing-SRD-database>` (reused directly; never rebuilt or replaced)
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

### HARVEST-02-A: MIT Source Code Integration (Completed 28 October 2026)

1. **H02-01: Reciprocal Rank Fusion & Diversification (MMR):**
   - Implemented standard RRF scoring $w_m / (k + \text{rank}_m(d))$ with $k=60$ smoothing and deterministic tie-breaking.
   - Implemented Maximal Marginal Relevance (MMR) with token-set Jaccard distance balancing prompt relevance ($\lambda=0.75$) with novelty against previously selected candidates.
   - Tested in `test_v2_harvest_02a_context_and_validation.py` (`test_rrf_scoring_and_determinism`, `test_mmr_diversification_and_novelty`).

2. **H02-02: Hierarchical Context Budgeting & Tracing:**
   - Multi-section priority-tiered budgeting (`system`, `prompt`, `triggered_cards`, `knowledge`, `relationships`, `srd_rules`) with reservation minimums and truncation guards.
   - Exposes explainable `ContextBudgetTrace` telemetry (`allocated_chars`, `used_chars`, `item_count`, `omitted_count`, `truncated`, `omission_reasons`) on every compiled context.
   - Tested in `test_v2_harvest_02a_context_and_validation.py` (`test_context_budget_manager_priorities_and_caps`, `test_context_budget_truncation_guard`).

3. **H02-03: Mention-Triggered Cards & History Assembly:**
   - Word-boundary regex term extraction mapping user prompt to candidate entity dossiers (names, titles, aliases) with substring false positive guards.
   - Rolling turn history buffer with milestone compression for older turns.
   - Tested in `test_v2_harvest_02a_context_and_validation.py` (`test_entity_mention_trigger_aliases_and_titles`, `test_structured_history_buffer_formatting_and_rolling_summary`).

4. **H02-06: State-Delta Validation & Single Commit Authority Firewall:**
   - Pre-commit invariant guard enforcing non-negative HP, max HP (+ temp HP) bounds, D&D ability scores in $[1, 30]$, non-negative spell slots, world clock minute monotonicity, non-DM per-action damage/healing caps, and monotonic level regression rejection.
   - Intercepts invalid or forged state mutations fail-closed (`REJECTED_VALIDATION_FAILURE`) before they touch the R1 commit pipeline or SQLite.
   - Tested in `test_v2_harvest_02a_context_and_validation.py` (`test_state_delta_validator_hp_invariants`, `test_state_delta_validator_ability_score_bounds`, `test_state_delta_validator_time_and_level_monotonicity`, `test_gateway_rejects_violating_patches_fail_closed`).

5. **Epistemic Secrecy Boundary:**
   - Proved that DM secrets (`dm_secret_summary`, secret locations/traps) never enter candidate lists, RRF rankings, or budget traces for player-facing audience profiles (`narrator`, `npc_interpreter`).
   - Tested in `test_v2_harvest_02a_context_and_validation.py` (`test_harness_compiler_rrf_mmr_budget_trace_and_epistemic_safety`).

6. **Test Metrics:**
   - Backend: `427/427` pytest tests passing across all test modules (100%).
   - Frontend: `147/147` Node.js tests passing across all 21 test suites (100%).
   - Clean Vite production build.

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
- **Completed in Milestone 11B (Integrity Closure, Playable Combat & Character Sheets):**
  - **Phase 1: Installation & Ingestion Integrity Closure (CPP-03):**
    - Durable transaction ledger (`v2_pack_installation_transactions`) tracking stages `STAGED` -> `COMMITTED` -> `COMPLETED` / `FAILED`.
    - Pinned proposal enforcement (`archive_sha256`, `pack_id`, `target_campaign_id`).
    - Exact approved conflict verification (`expected_conflicts` required for `MODIFIED_PROPERTIES`, `CONFLICT_NOTE_MODIFIED`, `CONFLICT_EDGE_MODIFIED`; unapproved conflicts raise `UNAPPROVED_CONFLICT_DETECTED`).
    - Post-crash reconciliation protocol (`CampaignPackInstaller.reconcile_installations`): pre-commit `STAGED` crashes rolled back cleanly; post-commit `COMMITTED` crashes completed idempotently to `INSTALLED` via `_apply_pack_content_to_store` without duplicate R1 admission.
    - Fail-closed player export: notes unindexed or with non-matching actor ownership are strictly excluded; unverified licenses default to `NOASSERTION`.
    - 6 new fault-injection and crash-recovery tests in `tests/test_v2_pack_installation.py` (17/17 passed); 380/380 total backend tests passing.
  - **Phase 2: Frontend Usability, Character Sheet & Interactive Combat Tracker (UX-02):**
    - Full combat action handling in client runtime adapter (`ATTACK_ACTION`, `CAST_SPELL`, `USE_ITEM`, `REST_ACTION`, `DM_OVERRIDE_STATE`, `START_ENCOUNTER`, `ROLL_INITIATIVE`, `NEXT_TURN`, `END_ENCOUNTER`).
    - `CombatTracker.tsx` component with round counter, turn indicator, initiative-ordered combatant cards, interactive HP bars (-5, -1, +1, +5), Temp HP badges, AC shields, condition badges and dropdown adder, spell slot counters, and action modals (Attack, Cast Spell, Use Item).
    - `CharacterSheetModal.tsx` integrated with Temp HP badge and active condition pills; accessible with one click directly from scene banner, party list, and combat tracker.
    - Notes workspace under left sidebar "Notes" tab: lists notes via `v2BackendClient.listNotes`, supports title, visibility selector (`private_player`, `party_shared`, `shared_with_dm`, `dm_private`), and Markdown editing with wikilinks.
  - **Phase 3: Live Mode Indicators & Dynamic Scene Context (UX-00 / UX-01):**
    - Global Header connection indicator with 5 unambiguous states (`CONNECTING`, `CONNECTED`, `AUTH REQUIRED`, `DISCONNECTED`, `EXPLICIT DEMO`).
    - Dynamic scene context derived from active campaign and `locations` projection (`dynamicSceneTitle`, `dynamicDistrict`, `dynamicSummary`), eliminating hardcoded Aethelgard/Highgate strings.
    - Action submission feedback with pending spinner, success checkmarks, and error banners.
    - Verified live end-to-end browser loop with Chrome CDP: main view, character sheet modal, notes workspace, combat tracker, and live dialogue feed captured in artifacts directory.
    - All 133 frontend unit tests passing; clean production build with 0 errors.
  - **Phase 4: Milestone 12 Blue Alley VTT Overhaul Architectural Specification:**
    - Root cause analysis and mathematical two-point calibration specification documented in `docs/BLUE-ALLEY-VTT-ARCHITECTURE.md`.
    - Separates Natural Image Plane, Grid Overlay Plane, World Spatial Plane, and Viewport Plane for zero-crop rendering.
- **Next Development Milestone (Milestone 12):**
  - **UX-03 Zero-Crop VTT Overhaul & Two-Point Grid Calibration:** Blue Alley high-resolution tactical map, sub-pixel grid calibration, and multi-room spatial discovery.

- **Completed in Milestone 11B-QA & Milestone 12 (Authoritative Combat Alignment & Blue Alley Zero-Crop VTT):**
  - **Phase 1: Milestone 11B-QA Authoritative Combat Authority Closure:**
    - Python Single Commit Authority alone determines authoritative dice rolls, bonuses, hit/miss, damage calculation, spell-slot expenditure, and HP effects.
    - React frontend sends action intent only (`attackerId`, `targetId`, `weaponName`, `spellName`, `slotLevel`); removed all client-side `Math.random()`, hardcoded attack bonuses, and local damage calculation from `CombatTracker.tsx`.
    - Eliminated critical double-multiplication bug: 5e rules roll damage dice twice on critical hit, adding flat ability modifier once.
    - Strict server-side RBAC validation: `DM_OVERRIDE_STATE`, `APPLY_CONDITION`, `REMOVE_CONDITION`, `ADVANCE_TIME`, and `UPDATE_BATTLEMAP_STATE` restricted strictly to DM roles (`dm_host`, `human_primary_codm`, `ai_primary_codm`, `human_dm_assist`, `human_sovereign`). Unauthorised player requests fail-closed with `REJECTED_UNAUTHORIZED_ROLE`.
    - Validated dual spell slot schema synchronization (`spellcasting.slots` and `spellSlots[lvl]`).
    - Exhaustive regression test suite `tests/test_v2_combat_and_admission_qa.py` (10/10 passed); all 370 backend tests pass (`370/370`).
  - **Phase 2: Milestone 12 Blue Alley VTT & Map Calibration Overhaul:**
    - Zero-Crop Full Image Architecture: Canvas surface dimensions decoupled from grid bounds (`surfaceWidthPx = Math.max(mapWidthPx, naturalWidth)`). Removed `overflow-hidden` constraints to ensure 100% of battlemap artwork borders are visible on initial load.
    - Uncompressed Crisp Blue Alley Battlemap: Added 1920x1920 PNG asset (`public/assets/maps/blue_alley_uncompressed.png`) with preprinted 48px grid corridors, traps, and rooms.
    - Two-Point Interactive Grid Calibration: Implemented Anchor Point 1 and Reference Point 2 interactive crosshairs, dynamic modal calculating cell pitch (Δx / Nx) and origin offset, and mathematical drift elimination over 100 cells.
    - Floating Fine-Tuning Calibration HUD: Micro-pitch stepper (±0.1 px/cell), origin nudging (±1 px), Zoom to Fit Image, Zoom to Fit Grid, and Save Calibration button.
    - Authoritative State Persistence: Wired `handleSaveCalibration` to dispatch `UPDATE_BATTLEMAP_STATE` action envelope; committed via R1 Commit Authority into SQLite campaign state.
    - Headless Chrome CDP Acceptance Testing: Verified Desktop (1600x1100) zero-crop view (`vtt_desktop_view.png`), Tablet (1024x768) responsive scaling (`vtt_tablet_view.png`), and aligned calibration HUD (`vtt_calibration_aligned.png`).
    - Formulated 3 UI layout proposals in `docs/V2-UI-LAYOUT-PROPOSALS.md` (Proposal A: Split Cockpit, Proposal B: Glass Overlay HUD, Proposal C: Dual-Surface Director Console).
    - All 137 frontend tests pass (`137/137`); clean production build in 4.95s.
- **Completed in Milestone 12A (Correctness Closure & Concealed Geometry Protection):**
  - **Priority 1: Authoritative Combat Hardening & Forged Input Rejection:**
    - Player `ATTACK_ACTION` requests strictly ignore and strip client-supplied `d20`, `attackBonus`, `totalToHit`, and `damage`.
    - Server calculates all attack rolls deterministically from commit digest (`roll_digest`), resolves attack bonuses from actor ability/proficiency scores, and resolves damage dice according to 5e weapon definitions (1d4, 1d6, 1d8, 1d12) + ability modifier.
    - Double weapon damage dice applied on critical hits (natural 20), preserving flat modifier once.
    - Explicit authorized DM overrides (`actor_role in {"dm", "dm_host"}` with `isDmOverride: true` or `DM_OVERRIDE_STATE`) preserved separately for manual table adjustments.
    - Negative regression tests prove valid-looking forged player values (`d20=20, attackBonus=30, totalToHit=50, damage=50`) are rejected/ignored by the authoritative pipeline.
  - **Priority 2: VTT Calibration Projection Hydration & Durable Persistence:**
    - `BattlemapSessionManager.hydrateFromBackendProjection`: Hydrates saved map configurations from `projection.battlemapState.mapConfigs` into the active frontend session on projection updates, updating `gridDimensions`, `backgroundArtwork`, `calibration`, and `geometry`, while instantiating unrecognised maps into local state.
    - `BattlemapCanvas.handleSaveCalibration`: Dispatches `UPDATE_BATTLEMAP_STATE` with active snapshot (`currentSnapshot`), requires verified `COMMITTED` receipt before displaying success, displays actionable errors on `REJECTED_STALE_SNAPSHOT`, `REJECTED_UNAUTHORIZED_ROLE`, or gateway disconnect, and displays explicit warning when local `blob:` URLs are used.
    - Real Blue Alley cartography acceptance test marked `PENDING USER ARTWORK ASSET` (procedural fixture verified; pending official production art file).
  - **Priority 3: Concealed Spatial Geometry & Epistemic Leak Protection:**
    - Server-side spatial projection audit in `get_projection(role="player")`: filters `mapConfigs` to exclude secret/undiscovered rooms, concealed walls, secret doors (unless open), concealed/hidden tokens (`isConcealed`, `isHidden`, `visibility: "dm_only"`, `entityType: "trap"`), hazard zones, and strips all privileged DM metadata (`dmNotes`, `secretDc`, `lockpickDc`, `gmGuidance`).
    - Negative tests check serialized JSON string response (`json.dumps(player_proj)`) to prove zero leakage to player clients.
  - **Priority 4: Test Suite & Test Count Discrepancy Closure:**
    - Backend: 383 collected tests across 46 test modules (`uv run pytest`), 100% passing.
    - Discrepancy reconciliation: Milestone 11B had 370 tests (text typo had referenced 380). Milestone 11B-QA added 10 tests in `test_v2_combat_and_admission_qa.py` (total 380). Milestone 12A added 3 tests (total 383).
    - Frontend: 139 unit & regression tests across 20 suites (`node --test`), 100% passing.
    - Frontend build: Vite production build succeeded in 3.73s with 0 errors.
  - **Priority 5: UI Layout Architecture Proposals & Generative UI Mockups:**
    - Expanded `docs/V2-UI-LAYOUT-PROPOSALS.md` with **Proposal D: Hybrid Cockpit** (B-style full-bleed VTT + A-style collapsible narrative/combat drawers + C-style Co-DM staging tray) and complete responsive breakpoints (desktop 1600x1100, laptop 1366x768, tablet 1024x768, phone 390x844).
    - Palette specifications: deep obsidian charcoal (`#090b0e`), slate elevations (`#12161c`, `#1c222b`), burnished copper/bronze (`#b45309`, `#f59e0b`), and restrained teal highlights (`#0d9488`, `#2dd4bf`).
    - Interactive Generative UI mockups artifact (`v2_ui_layout_mockups.html`) created for human review and visual validation.
    - Layout implementation explicitly deferred pending human review and selection.

- **Next Development Milestone (Milestone 13):**
  - **UX-04 Tabletop Cockpit & Modern Charcoal/Bronze Design System Integration:** Implement user-selected layout proposal (Proposal A, B, C, or D) unifying Narrative Feed, Calibrated Battlemap, and Interactive Combat Tracker.

---

## 18. Milestone 12B — Final Trust, Physical Dice and Gameplay Persistence Gates

**Audit & Execution Date:** 2026-10-28  
**Backend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Frontend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Core Deliverables & Architectural Conformance:**

- **1. Deterministic Dice Security, Physical Dice and Rules Correctness (1A–1E):**
  - **Server Digital Entropy (1A):** Replaced client-nonce derived digital dice with unmineable HMAC-SHA256 server entropy `hmac_sha256(server_secret, f"{campaign_id}:{seq}:{action_id}:{salt}")`. Client-forged `d20`, `attackBonus`, `totalToHit`, and `damage` values are stripped and ignored in digital mode. Actions generate deterministic `SERVER_GENERATED` receipts carrying cryptographic `entropyProof`.
  - **First-Class Physical Dice Support (1B):** Implemented `PLAYER_PHYSICAL` and `DM_PHYSICAL` modes across `ATTACK_ACTION`, `SKILL_CHECK`, `SAVING_THROW`, and `CAST_SPELL`. Accepts raw rolled face arrays (`rawRolls: [14]`, `damageRolls: [5, 4]`), strictly bounds-checks each die (1..20 for d20, 1..die_sides for damage), and tags results as `PLAYER_REPORTED_UNVERIFIED` (or `DM_REPORTED`). Out-of-bounds faces (e.g. 25 on d20, 7 on d6) and forged totals are rejected with `REJECTED_VALIDATION_FAILURE`.
  - **Session Trust Policies (1C):**
    - `ALLOW_MIXED_HONOUR_SYSTEM` (default): Physical dice claims commit immediately to authoritative state with `PLAYER_REPORTED_UNVERIFIED`.
    - `REQUIRE_DM_CONFIRMATION`: Player physical rolls are staged into `pendingAdjudications` with status `PENDING_HUMAN_DM_APPROVAL` and `adjudicationType: "PHYSICAL_DICE_CONFIRMATION"`. No HP or resources are deducted until an authenticated DM reviews and dispatches `APPROVE_ADJUDICATION`.
    - `SERVER_DIGITAL_ONLY`: Physical dice submissions by players are rejected fail-closed with `REJECTED_POLICY_VIOLATION`.
    - Implemented `SET_DICE_POLICY` (DM-only) and `SET_CHARACTER_DICE_PREFERENCE` actions.
  - **Authoritative Weapon Damage Resolution (1D):** Resolution against SRD 5.1 equipment definitions via `SRD51RulesReader` query with deterministic fallback table. Correctly resolves Greatsword 2d6 (requires exactly 2 dice, or 4 dice on critical hit; flat modifier added once), Shortsword 1d6, Dagger 1d4, Greataxe 1d12, Quarterstaff 1d8. Advantage/disadvantage resolves max/min on reported raw faces. Standard 5e critical hit rule enforced: dice count doubled, flat bonus never multiplied twice.
  - **Human Review Safeguard (1E):** Staged physical dice adjudications present raw rolled faces, formula, and pending outcome to the DM with full Approve/Reject actions.

- **2. Spatial Secrecy and Projection Isolation (2):**
  - Player/observer projection strictly strips secret doors (unless open), secret windows (unless broken), hidden tokens, and hazard/secret terrain zones (`isHazard`, `isSecret`, `isDmOnly`).
  - Strips all confidential DM fields: `dmNotes`, `secretDc`, `lockpickDc`, `keyId`.
  - In `backgroundArtwork`: strips `dmOverlayUrl`, `secretMapUrl`, `dmNotes`; substitutes `playerArtworkUrl` as `url` if present.
  - Role-switch cache clearance: `BattlemapSessionManager.clearPrivilegedCache()` flushes undo/redo stacks and purges privileged geometry when switching to Player or Observer roles or entering Player Preview mode.

- **3. Genuine VTT Restart Persistence (3):**
  - Implemented server asset storage HTTP endpoints: `POST /api/v2/battlemap/assets` and `GET /api/v2/battlemap/assets/{asset_id}`.
  - Decodes base64 map artwork and stores persistent binary files to `data/battlemap_assets/{asset_id}.*` on disk.
  - Battlemap imports in `BattlemapView.tsx` upload local artwork to the server, assigning durable URLs `/api/v2/battlemap/assets/{assetId}` rather than transient `blob:` URLs. Imported maps survive application reload and backend process restart without data loss.

- **4. Spatial Integration Readiness (4):**
  - Versioned coordinate adapter for `MOVE_TOKEN` supporting both `coordinateSystem: "grid_cell"` (clamped to active map grid boundaries) and `coordinateSystem: "percentage"` (0..100 floating-point precision).
  - Updates both character/NPC entity tokens and active battlemap geometry tokens.

- **5. Layout Governance & Non-Disruptive UI Integration (5):**
  - Preserved Proposals A, B, C, D in `docs/V2-UI-LAYOUT-PROPOSALS.md` without disruptive visual redesign before explicit user approval.
  - Embedded non-intrusive physical dice controls directly into `CombatTracker.tsx` and `ActionSubmissionModal.tsx`: Virtual Digital Dice vs Real Physical Dice toggle, raw d20 and weapon damage dice inputs, table dice policy badge/dropdown, and pending adjudications review queue.

- **6. Verification Evidence:**
  - **Backend Tests:** 390 collected tests across 47 test modules (`uv run pytest`), 100% passing.
  - **Frontend Tests:** 141 unit, integration & spatial secrecy tests across 21 test suites (`node --test`), 100% passing.
  - **Frontend Build:** Vite production build cleanly verified in 650ms.

---

## 19. Milestone 12B Final Closure & SP-00..SP-05 Authoritative 2D Spatial Simulation

**Audit & Execution Date:** 2026-10-28  
**Backend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Frontend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Core Deliverables & Architectural Conformance:**

- **1. Cryptographic Server Entropy Vault Isolation (Gate 1 — AUTOMATED VERIFIED):**
  - High-entropy 256-bit server secrets generated via `secrets.token_hex(32)` on campaign creation.
  - Stored in dedicated SQLite table `campaign_server_secrets` outside `v2_state_mounts` and excluded from all public/player state projections.
  - Generates HMAC-SHA256 non-mineable roll digests `hmac_sha256(server_secret, f"{campaign_id}:{seq}:{action_id}:{salt}")`.
  - Concurrency-safe `INSERT OR IGNORE` initialization prevents race conditions on multi-threaded admissions.
  - Non-reversible proof format `prf-<action_id[:8]>-<sha256(secret:salt)[:16]>` guarantees replay integrity without revealing future roll entropy.
  - Regression verified in `tests/test_v2_trust_and_persistence_gates.py`.

- **2. Persistent Authorised RollRequest Lifecycle (Gate 2 — AUTOMATED VERIFIED):**
  - Fully pinned, persistent `RollRequest` lifecycle (`ACTIVE_AWAITING_INPUT`, `SUBMITTED_VALIDATED`, `SUPERSEDED_BY_REROLL`, `DM_CORRECTED`, `COMMITTED_TERMINAL`).
  - Strict re-roll tracking (`maxRerolls`, `rerollsUsed`, `rerollReason`) and explicit authorized DM corrections (`DM_CORRECTED_PHYSICAL` / `DM_CORRECTED_DIGITAL`).
  - Prevents mode-switching or resubmissions after unfavorable rolls.
  - Verified across crash/restart and concurrent requests in `tests/test_v2_trust_and_persistence_gates.py`.

- **3. Battlemap Asset Security & Role-Based Access Controls (Gate 3 — AUTOMATED VERIFIED):**
  - Persistent SQLite asset registry `battlemap_asset_registry` with campaign ownership, SHA-256 deduplication, and magic-byte inspection (PNG, JPEG, WebP).
  - Strict DM-only upload restriction (`aud.role in {"dm", "dm_host"}`); unauthorized player uploads fail-closed with HTTP 403.
  - Enforces cross-campaign isolation and role-scoped download secrecy (DM-only assets return HTTP 403 to player clients).
  - Safe connection cleanup prevents file locking across process restarts and Windows filesystem boundaries.
  - Regression verified in `tests/test_v2_trust_and_persistence_gates.py`.

- **4. Spatial Simulation Models & Coordinate Contract (SP-00 — AUTOMATED VERIFIED):**
  - Implemented `v2_spatial_models.py` defining typed, unambiguous coordinate spaces:
    - `ImagePixelPoint`: Natural battlemap image pixel coordinates `(x_px, y_px)`.
    - `GridCalibration`: Sub-pixel origin offset, pitch in pixels/cell, feet per cell.
    - `SceneCellPoint`: Discrete integer grid cell coordinate `(x, y)`.
    - `SceneFeetPoint`: Continuous world feet coordinates `(x_feet, y_feet)`.
  - Defined standard creature footprints (`Tiny`: 1x1, `Small`: 1x1, `Medium`: 1x1, `Large`: 2x2, `Huge`: 3x3, `Gargantuan`: 4x4) and topological scene entities (`WallSegment`, `DoorEntity`, `TerrainZone`, `SceneActorPlacement`).

- **5. Deterministic 2D Raycast LOS & Spatial Simulation Engine (SP-01 — AUTOMATED VERIFIED):**
  - Implemented `v2_spatial_engine.py`:
    - 2D raycasting line of sight with strict segment intersection and corner occlusion.
    - Closed and secret doors block vision and movement; open doors allow line of sight and passage.
    - Distance rules supported: Standard 5e alternating diagonal (`5-10-5`), Euclidean, Manhattan, and standard grid (`5-5-5`).
    - Grounded spatial perception query `query_spatial_context()` resolving visible actors and actors in reach.
  - Verified in `tests/test_v2_spatial_simulation.py` (14/14 passed).

- **6. R1-Validated Token Movement & A* Obstacle Pathfinding (SP-02 — AUTOMATED VERIFIED):**
  - Gateway `MOVE_TOKEN` action commits strictly through R1 Single Commit Authority.
  - Role permissions enforced: players can only move assigned characters; observers cannot move; DM/host can move any actor or use `dmOverride: True` / `teleport: True`.
  - Dynamic grid dimension resolution from active scene configuration (`mapConfigs[sceneId]["gridDimensions"]`).
  - Authoritative A* pathfinding evaluates multi-cell footprint occupancy, wall collisions, closed-door collisions, and difficult terrain multipliers (2x cost).
  - Illegal movements crossing walls or closed doors are rejected fail-closed with `REJECTED_VALIDATION_FAILURE`.
  - Commits `committedPath`, `lastMoveCostFeet`, and discrete cell coordinates to SQLite via `StatePatch`.

- **7. Frontend Zero-Crop Battlemap & Path Rendering (SP-03 — AUTOMATED VERIFIED):**
  - Decoupled canvas dimensions from grid bounds; 100% of preprinted battlemap artwork borders (e.g. Blue Alley) remain visible without cropping.
  - Fixed coordinate mismatch in `BattlemapCanvas.tsx`: clicks and drag callbacks emit discrete integer cell coordinates (`gridX`, `gridY`) instead of percentage floats.
  - `resolveTokenPosition()` safely interprets tokens regardless of legacy format.
  - Layer 5.5 SVG movement path renderer visualizes server-projected cyan/amber dashed polylines and waypoints along `tok.committedPath`.
  - Added `v2BackendClient.querySpatialContext()` calling `GET /api/v2/battlemap/spatial-query`.
  - 144 frontend tests in 21 test suites passing (`npm test`).

- **8. Living World AI Spatial Tool & Starlit Revels Soak Simulation (SP-04 / SP-05 — PARTIAL):**
  - Added `"spatial_query"` tool to `TASK_PROFILES` for `narrator`, `npc_interpreter`, `director`, and `planner` in `v2_ai_harness.py`.
  - Implemented `GET /api/v2/battlemap/spatial-query` route with authenticated session scoping and role-based secrecy.
  - Automated movement fixture (`test_starlit_revels_14_guest_stress_and_soak_simulation`): 14 named guests (including Davion, Mylon, Duessa) executing scripted waypoint movements through a 2-cell doorway around dividing walls, followed by simulated restart and persistence verification against SQLite.
  - Honest audit: Kept marked as **PARTIAL** per Independent QA findings. The synthetic 14-guest fixture proves waypoint persistence and path navigation, not autonomous scheduler decisions, live dialogue, or realistic soak duration.

- **9. Complete Verification Evidence:**
  - **Backend Tests:** 408 collected tests across 49 test modules, 100% passing.
  - **Frontend Tests:** 144 unit, integration & spatial secrecy tests across 21 test suites (`node --test`), 100% passing.
  - **Frontend Build:** Clean Vite production build in 620ms.

---

## 20. Post-Spatial QA Closure, P0 Security Hardening & Gate S0–S2 Implementation

**Audit & Execution Date:** 2026-10-28  
**Backend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Frontend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Governing QA Brief:** `docs/V2-POST-SPATIAL-CHECKPOINT-INDEPENDENT-QA.md`  

### 1. Safety Gate S0: P0 Security & Role Authority Fixes (AUTOMATED VERIFIED)
> **Acceptance Classification:** **AUTOMATED VERIFIED** (All 4 adversarial exploit regression tests pass against server HTTP and gateway contracts; remote LAN/multiplayer access remains gated until manual penetration review).
- **P0-1 (`MOVE_TOKEN` DM Override Bypass):**
  - Restricted `dmOverride`, `forceMove`, `teleport`, and `isDmOverride` flags strictly to authenticated DM roles (`dm`, `dm_host`).
  - Player attempts to submit privileged override flags are ignored and rejected fail-closed (`REJECTED_VALIDATION_FAILURE`).
  - Verified by exploit regression test `test_exploit_player_move_token_dm_override_rejected`.
- **P0-2 (`DM_PHYSICAL` Role Spoofing & Confirmation Bypass):**
  - Gated `DM_PHYSICAL` to authenticated DM roles across all roll entrypoints: `ATTACK_ACTION`, `SKILL_CHECK`, `SAVING_THROW`, `REQUEST_ROLL`, and `SUBMIT_ROLL`.
  - Non-DM submissions claiming `DM_PHYSICAL` under `REQUIRE_DM_CONFIRMATION` or `SERVER_DIGITAL_ONLY` are rejected with `REJECTED_UNAUTHORIZED_ROLE` with zero side effects.
  - Verified by exploit regression test `test_exploit_player_dm_physical_spoofing_rejected`.
- **P0-3 (Battlemap Asset Ownership & Fail-Closed Registry):**
  - `POST /api/v2/battlemap/assets` pins `campaignId` and `ownerActorId` to verified session; blocks cross-campaign overwrites (`FORBIDDEN_ASSET_OVERWRITE`) and validates magic bytes.
  - `GET /api/v2/battlemap/assets/{assetId}` fails closed on unregistered files (HTTP 404 `ASSET_NOT_FOUND`, never checks disk) and enforces DM-only secrecy (HTTP 403 `FORBIDDEN_ASSET_ACCESS`).
  - Frontend `v2BackendClient` eliminates bearer tokens from URL query strings (`getAuthenticatedAssetUrl` returns clean URLs; `fetchAuthenticatedAssetBlobUrl` uses headers).
  - Verified by exploit regression test `test_exploit_asset_cross_campaign_overwrite_and_unregistered_fail_closed`.
- **P0-4 (Spatial Query Observer Impersonation & Radius Limits):**
  - `GET /api/v2/battlemap/spatial-query` strictly verifies `observer_id` matches assigned player character; rejects player impersonation with HTTP 403 `FORBIDDEN_IMPERSONATION`.
  - Rejects observer role viewpoint queries with HTTP 403 `OBSERVER_VIEWPOINT_RESTRICTED`.
  - Caps sight radius to 120.0 ft for players (300.0 ft for DM).
  - SingleBoundedAIHarness pins actor identity and campaign ID.
  - Verified by exploit regression test `test_exploit_spatial_query_player_impersonation_rejected`.

### 2. Gameplay Gate S1: Movement Mechanics & RollRequest Lifecycle (AUTOMATED VERIFIED)
> **Acceptance Classification:** **AUTOMATED VERIFIED** for automated server rules, budgets, topology, and staged RollRequest confirmation; **REAL GAMEPLAY ACCEPTANCE REMAINS SEPARATE** (Windows desktop player journey + tablet companion play pending).
- **Authoritative Actor Footprint & Multi-Cell Occupancy:**
  - Creature footprints (`Tiny`, `Small`, `Medium`, `Large`, `Huge`, `Gargantuan`) derived from server entity definition; non-DM callers cannot forge smaller footprints.
  - Living actors' multi-cell footprints (`fp.occupied_cells()`) expand into the `occupied_cells` collision set.
- **Combat Movement Budget & Action Economy:**
  - In combat (`combatState.isActive == True`), verifies the moving entity is the active turn combatant (rejects out-of-turn moves with `REJECTED_VALIDATION_FAILURE`).
  - Enforces `remainingMovementFeet` budget (initial 30 ft per turn, decremented by path cost); rejects moves exceeding budget.
  - Exploration pacing caps single moves to 120.0 ft.
  - `START_COMBAT` / `START_ENCOUNTER` and `NEXT_TURN` initialize and reset `remainingMovementFeet`.
  - Verified by `test_spatial_movement_combat_turn_budget_and_multicell_occupancy`.
- **Scene Geometry Topology:**
  - `MOVE_TOKEN` and `query_scene_spatial_context` merge doors, walls, and terrain from `battlemapState` and active `mapConfigs[sceneId].geometry` (`doors`, `walls`, `terrainZones`).
  - Handles `isOpen` / `state: "open"` and `isLocked` / `state: "locked"` seamlessly.
- **Strict Coordinate System Versioning:**
  - Eliminates ambiguous `raw_tx > 30` heuristic guessing.
  - Preserves integer grid cell migration when within grid bounds; rejects ambiguous floating-point or out-of-bounds coordinates without explicit `coordinateSystem`.
- **Two-Stage RollRequest Lifecycle & HP Resolution:**
  - Server validates and pins formula/dice schema in `REQUEST_ROLL` (e.g. Rapier 1d8, Greatsword 2d6, d20 checks).
  - `SUBMIT_ROLL` computes damage and applies HP mutations to target characters and NPCs.
  - Under `REQUIRE_DM_CONFIRMATION`, HP patches are staged in `pendingAdjudications`; committed only when DM approves via `APPROVE_ADJUDICATION`.
  - Verified by `test_two_stage_attack_damage_roll_request_lifecycle` across gateway restart and recovery.

### 3. AI Living World Gate S2: Autonomous Scheduler & AI Concurrency (PARTIAL)
> **Acceptance Classification:** **PARTIAL**. Deterministic multi-actor routines, limited perception, and R1 movement submissions pass unit tests; live autonomous world simulation and multi-actor dialogue soak remain unproven.
- **Deterministic Multi-Actor Scheduler (`tick_world_scheduler`):**
  - Independent NPCs (`npc-jorren-vale`, `npc-duessa-starflower`) follow time-of-day waypoint routines using the Master World Clock (`worldClock.totalWorldMinutes`).
  - Each NPC queries bounded spatial awareness (`query_scene_spatial_context` with 60 ft radius), detects cell occupancy/bottlenecks, resolves conflicts via polite rerouting, and submits legal `MOVE_TOKEN` through R1 Single Commit Authority (`dmOverride: False`).
  - Moves and token positions survive process crash and restart.
  - Logs episodic perception updates without requiring LLM calls on every world tick.
  - Verified by `test_autonomous_living_world_scheduler_routines_and_conflict_resolution`.
- **Single Model Concurrency Semaphore:**
  - `_model_execution_lock` mutex in `SingleBoundedAIHarness` serializes heavy model inferences to protect 4–6 GB VRAM budget.

### 4. Milestone SP-05 & Blue Alley Acceptance Status (PARTIAL)
- **SP-05 (Starlit Revels):** **PARTIAL** — Synthetic multi-actor spatial simulation and routine execution verified; full multi-hour dialogue soak remains **PARTIAL**.
- **Blue Alley VTT:** **PARTIAL** — Representative tactical slice asset, zero-crop canvas, two-point calibration math, and authenticated asset endpoints verified in live Windows gameplay and automated integration tests; final user-supplied official module artwork import remains **PARTIAL**.

### 5. Verification Evidence
- **Backend Tests:** 416 collected tests across 49 test modules (`pytest`), 100% passing.
- **Frontend Tests:** 147 unit, integration & spatial secrecy tests across 21 test suites (`npm test`), 100% passing.
- **Frontend Build:** Clean Vite production build (`dist/assets/index-A8nmcSLX.js`, 0 errors).

---

## 21. Real Windows Gameplay Acceptance, Artwork Secrecy & NPC Routine Integration (Gate W0 - W3)

**Audit & Execution Date:** 2026-10-28  
**Backend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Frontend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Governing QA Charter:** `docs/V2-NEXT-GATE-WINDOWS-GAMEPLAY-AND-AI-SCHEDULER-QA.md`  

### 1. Stage W0: Authenticated Map Artwork Integration & Secrecy (REAL APPLICATION VERIFIED)
> **Acceptance Classification:** **REAL APPLICATION VERIFIED**
- **Authenticated Asset Retrieval:** Connected VTT renderer to `fetchAuthenticatedAssetBlobUrl(rawUrl, userRole)` using `X-VadAllFate-Session-Token` headers.
- **Role & Campaign Cache Partitioning:** Prefixed object URL blob cache by `${role}:${url}`. On role transition (e.g. DM host previewing as player or logging out), `clearAssetBlobCache()` explicitly calls `URL.revokeObjectURL()` on every active blob URL, guaranteeing zero DM-only tactical secret leaks to players.
- **Explicit Fail-Closed Uploads:** Replaced silent `data:` or local `blob:` fallbacks in `uploadBattlemapAsset()` and `BattlemapView.tsx` with explicit rejection and error banners upon upload failure.
- **Unit & Integration Evidence:** 3 new frontend unit tests in `src/state/milestone12b.test.ts` (147/147 passing).

### 2. Stage W1: Real Windows Gameplay Acceptance (REAL APPLICATION VERIFIED)
> **Acceptance Classification:** **REAL APPLICATION VERIFIED** (Gate S1 elevated from Automated to Real Application Verified)
- **Live Local Loopback Journey:** Executed complete gameplay acceptance on native Windows environment via `scripts/verify_real_windows_gameplay.py`.
- **Session Authentication & Asset Registration:** Cryptographic DM token (`dm_host`) and Player token (`char-lyra-01`) issued via session authority; representative 30x25 PNG battlemap asset uploaded and registered under campaign ownership.
- **Authoritative Calibration & Placement:** Two-point calibration (42.0 px/cell pitch, offsets 10,10) committed into SQLite state via `UPDATE_BATTLEMAP_STATE`. Tokens placed via R1 commit authority.
- **Spatial Collision Authority:** A* pathfinding verified for legal path moves. Attempted movements through closed doors and impassable stone walls rejected fail-closed with `REJECTED_VALIDATION_FAILURE` (`BLOCKED_BY_CLOSED_DOOR`).
- **Complete Process Crash/Restart Persistence:** Complete Python HTTP server and SQLite database shutdown and reboot; full battlemap config, active scene ID, calibration pitch, and token coordinates restored identically.
- **Captured Artifact:** High-resolution VTT battlemap screenshot captured: `w1_tactical_vtt_calibrated.png`.

### 3. Stage W2: Mixed Physical and Digital Dice Combat Journey (REAL APPLICATION VERIFIED)
> **Acceptance Classification:** **REAL APPLICATION VERIFIED**
- **Encounter Initiation:** Combat started under `START_COMBAT` with initiative sequence pinned.
- **Table Policy Enforcement:** Table set to `REQUIRE_DM_CONFIRMATION`.
- **Two-Stage RollRequest Lifecycle:** Player issued `REQUEST_ROLL` for attack damage (`req-lyra-phys-dmg-01`). Server pinned Rapier formula (1d8+3) and permitted modes (`PLAYER_PHYSICAL`).
- **Pending Adjudication Staging:** Player submitted physical die face `rawRolls: [6]`. Server staged adjudication into `pendingAdjudications` with status `PENDING_HUMAN_DM_APPROVAL`. Target HP remained unmutated during staging.
- **Authoritative DM Confirmation:** DM confirmed adjudication via `APPROVE_ADJUDICATION`. Target NPC (Jorren Vale) HP decremented by authoritative damage (-9 HP) in single-owner SQLite database.
- **Captured Artifact:** Live combat and DM adjudication screenshot captured: `w2_combat_dm_adjudication.png`.

### 4. Stage W3: Living-World Multi-Actor Scheduler & Routine Storage (AUTOMATED VERIFIED)
> **Acceptance Classification:** **AUTOMATED VERIFIED** (Multi-hour live dialogue soak remains PARTIAL)
- **Configurable Routine Schema:** Seed state updated with versioned `npcRoutines` schema (`v1.0.0`) for active scene NPCs (`npc-jorren-vale`, `npc-duessa-starflower`). Hardcoded gateway schedule removed.
- **Master World Clock Advancement:** Scheduler seamlessly integrated into authoritative time actions (`ADVANCE_TIME`, `REST_SHORT`, `REST_LONG`). Advancing clock evaluates waypoint routines and submits autonomous moves through R1 authority without requiring per-tick LLM calls.
- **Authenticated Endpoint:** Added `POST /api/v2/campaign/scheduler/tick` requiring DM role authentication (403 for unauthorized roles).
- **Episodic Perception Updates:** NPC spatial awareness queries logged to memory without unconstrained token consumption.

### 5. Final Summary of Gate Classifications
| Gate / Feature | Previous Status | Current Status | Notes |
| :--- | :--- | :--- | :--- |
| **Gate S0 (P0 Security & Authority)** | AUTOMATED VERIFIED | **AUTOMATED VERIFIED** | Verified against adversarial exploit regression suite. |
| **Gate S1 (Movement Mechanics & Dice Lifecycle)** | AUTOMATED VERIFIED | **REAL APPLICATION VERIFIED** | Verified end-to-end on live Windows host, SQLite restart & Chrome UI. |
| **Gate S2 (Living World & Multi-Actor Scheduler)** | PARTIAL | **AUTOMATED VERIFIED** | Stored routines & clock integration verified; live 2-hour soak PARTIAL. |
| **Blue Alley VTT Integration** | PARTIAL | **PARTIAL** | Representative calibrated slice verified; official uncropped module map pending. |
| **Monster Combat Hold** | ACTIVE HOLD | **ACTIVE HOLD** | Step 51 monster combat hold preserved (`DISABLED_NO_APPROVED_MONSTER_COVERAGE`). |
| **CP017B Master Mount Hold** | ACTIVE HOLD | **ACTIVE HOLD** | SQLite single-state ownership maintained; shadow DBs prohibited. |



## HARVEST-02-B1: Living World NPC Cognition Live Integration & Acceptance Gates (2026-10-28)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **B1-01 Canonical Cognition Projection:** Bidirectional sync between `NPCCognitionState` and canonical `npc["cognition"]` records within the single authoritative SQLite store (`state["npcs"]`). Zero competing or parallel state representations.
- **B1-02 Grounded Authoritative Perception:** Replaced arbitrary manual booleans with authoritative Python spatial queries (`has_line_of_sight`, `calculate_distance_feet`, `WallSegment.blocks_vision`, `DoorEntity.blocks_vision`). Witness modes: clear LOS produces `"SAW"` episodic memory; closed doors within hearing distance produce `"HEARD"` auditory memory with 0.5x valence; blocked/out-of-range observers produce ZERO memory.
- **B1-03 R1 Replay Idempotence & Determinism:** Deterministic memory IDs `mem:{action_id}:{npc_id}` prevent non-deterministic UUID generation during replays, retries, and recoveries. Replays skip re-application without mutating state or double-applying deltas.
- **B1-04 Autonomous Routine Execution & Escalation Clocks:** Routine waypoints executed on Master World Clock ticks; high pressure (>= 70) triggers emergency goal escalations (`CALL_CITY_WATCH`, `FLEE_TO_SAFEHOUSE`). `WorldArcManager` conditional escalation clocks and elapsed-minute escalation (`minutes_per_segment` + tag triggers) generate DM-only rumour sparks without unconsented player encounters.
- **B1-05 Epistemic Secrecy Hardening (Findings 7, 8, 9):**
  - Finding 7: FTS5 candidate hydration beyond initial 40 graph nodes via `get_entity_dossier()` into `raw_nodes`/`raw_node_map` before RRF ranking, ensuring verified inclusion in `compiled.context_text`.
  - Finding 8: Recovery role provenance anti-spoofing failing closed to `"player"` unless the admitted payload carries an authentic `authenticatedRole`.
  - Finding 9: SQL LIKE wildcard escaping in `search_entities_fts5`.
- **Regression Suite:** 7/7 tests passing in `tests/test_v2_harvest_02b1_live_npc_integration.py`. Full harvest suite: 35/35 tests passing. Total V2 suite: 162/162 tests passing. Total backend tests: 451/451 tests passing. Frontend suite: 147/147 tests passing.




## HARVEST-02-A1B & HARVEST-02-B Implementation Gate (2026-10-28)



### 1. HARVEST-02-A1B: Correctness Closure & Epistemic Secrecy Verification

> **Acceptance Classification:** **AUTOMATED VERIFIED**

- **A1B-01 R1 Crash Recovery Parity & Anti-Spoofing:** Durable binding of `payload["authenticatedRole"]` and `payload["authenticatedActorId"]` in admitted action envelopes prevents identity or role spoofing across process restarts. In `STAGED_NEEDS_VALIDATION` recovery, staged proposals are re-validated through `StateDeltaValidator.validate_patches`; invalid proposals are cleanly discarded via `CommitAuthority.discard_invalid_admission` without state corruption or sequence advance.

- **A1B-02 SQLite FTS5 BM25 Ordering:** Query ordering corrected to `ORDER BY score ASC` matching SQLite BM25 semantics (more negative = stronger match). Only genuinely matched entities contribute to RRF; unmatched nodes receive zero fake relevance boost.

- **A1B-03 Epistemic Partitioning & Zero Side-Channels:** FTS5 table schema cleanly partitions unindexed metadata (`canonical_uri`, `campaign_id UNINDEXED`, `save_id UNINDEXED`, `visibility UNINDEXED`, `known_by_json UNINDEXED`) from indexed text (`label`, `aliases`, `public_text`, `perceived_text`, `dm_secret_text`, `tags`). Player queries strictly target `{label aliases public_text tags}` with SQL visibility filtering, eliminating side-channels from secret notes. Recall verified at scale across 500+ entities without graph projection caps; automatic backfill on schema initialization and deletion synchronization verified.

- **A1B-04 Structured Turn History:** Role-safe epistemic filtering and rolling milestone compaction (`PRIOR HISTORY`) integrated into `HarnessContextCompiler.compile()`.

- **A1B-05 Lexical vs Neural Terminology:** Accurately classified `OfflineFuzzySimilarityRanker` as zero-cloud character/term n-gram cosine similarity, preventing misleading claims of neural embeddings.

- **Regression Suite:** 21/21 tests passing in `tests/test_v2_harvest_02a_context_and_validation.py`.



### 2. HARVEST-02-B: Living World NPC Cognition, Episodic Memory & Escalation Clocks

> **Acceptance Classification:** **AUTOMATED VERIFIED**

- **H02-07 Bounded Six-Axis Personality & Relations:** Six personality axes (`openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`, `risk_tolerance`) strictly bounded to $[-1.0, 1.0]$. Directed relationships (`affinity`, `trust`, `fear`, `debt`, `familiarity`) adjust with bounded clamping and historical ledger notes.

- **H02-08 Deterministic 0-LLM Routine Ticks & Goal Escalation:** Scheduled waypoint navigation evaluated on `world_minute % 1440` without continuous LLM inference. Emergency pressure thresholds (>= 70.0) trigger priority goal escalations without model polling.

- **H02-09 Multi-Segment Escalation Clocks & DM Sparks:** Faction clocks (4, 6, 8 segments) advance deterministically on matched condition tags or world clock ticks, generating DM-only rumour sparks without unconsented player encounters.

- **Milestone Demonstrator:** Verified two NPCs in the same calibrated scene: NPC A (Harbor Master) witnesses player theft and records private episodic memory, decreases trust, and increases pressure; NPC B (Cult Sleeper in undercroft) records ZERO memory, retains neutral trust, and remains at zero pressure.

- **Starlit Revels Scale:** 14 named guests configured with distinct personalities, goals, and routines; batch routine evaluation verified across all 14 NPCs in < 5ms CPU time.

- **Regression Suite:** 7/7 tests passing in `tests/test_v2_harvest_02b_npc_cognition.py`. Full harvest suite: 28/28 tests passing.

---

## 23. HARVEST-02-B1C: Living-World Authority, Truthful Perception, and Clock Idempotence (2026-10-28)

**Audit & Execution Date:** 2026-10-28  
**Governing Charters:** `docs/V2-HARVEST-02B1C-LIVING-WORLD-AUTHORITY-AND-PERCEPTION-QA.md` & `docs/V2-MASTER-DEVELOPMENT-GOALS.md`  
**Backend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Frontend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  

### 1. P0 Blocker Elimination: Single Commit Authority Enforcement (B1C-00)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Elimination of Direct SQLite Bypass:** Completely removed all production invocations of direct SQLite `UPDATE campaign_state` execution (`_write_campaign_authority_state`), restricting it to an explicitly labelled `_test_seed_campaign_authority_state` exclusively for offline test harness setup.
- **Authoritative R1 Mutations:**
  - `update_npc_cognition()` now submits versioned `UPDATE_NPC_COGNITION` action envelopes through `submit_action(...)` with host scheduler session authority.
  - `tick_world_scheduler()` clock advancements and DM sparks now commit through versioned `ADVANCE_WORLD_ARC` action envelopes via R1.
- **Audit & Idempotence Ledgers:** Produces genuine `CommitReceipt` with `status="COMMITTED"`, monotonic `commitSequence` advance, state hash pinning, and durable event logs.

### 2. Truthful Perception: Hearing != Seeing & Intent != Guilt (B1C-01)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Ground Truth Integrity:** Unverified player intent flags (`isTheft: True`, `valence: -0.7`, `targetItem: "Ancient Gem"`) are never adopted as canonical ground truth or leaked to observers.
- **Sensory Truth Modalities:**
  - **`SAW` (Clear Line of Sight):** Direct visual confirmation within sight radius records neutral physical manipulation (e.g. "Witnessed Lyra manipulating items suspiciously at (5, 5)"), never disclosing secret target item names. Degrades actor trust and spikes situational pressure.
  - **`HEARD` (Obstructed Line of Sight):** Raycast through closed doors or muffled acoustic zones (up to 35 ft, 60 ft for loud combat) records unidentified sound descriptions ("Heard suspicious rustling and footsteps nearby", `actor_id="unknown"`). Raises local alertness and pressure without corrupting specific character relationships.
  - **`UNNOTICED` (Solid Walls / Stealth Beat):** Solid stone walls (> 15 ft) or contested Stealth/Sleight of Hand rolls $\ge$ passive perception produce zero memory, zero pressure, and complete epistemic isolation.
  - **`HEARSAY` (Third-Party Reports):** Memory is stamped with `source_actor`, `witness_mode="HEARSAY"`, and `is_unverified=True`. Relationship impact is proportionally scaled by the observer's trust in the reporting source (`(trust + 1.0) / 2.0`).

### 3. Replay-Safe World Scheduler & Clock Idempotence (B1C-02)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Trigger Consumption & Idempotence:** Escalation clocks consume trigger keys (`consumed_triggers`) and remove processed tags from `state["occurredTags"]` upon R1 commit. Repeated evaluations at the same world minute or re-runs with persistent tags advance zero extra segments and generate zero duplicate sparks.
- **Deterministic Action IDs:** Scheduler token movements use deterministic action IDs (`act-sched-{npc_id}-{world_minute}`) and nonces, preventing duplicate actions on retries.
- **Synchronous Pacing Safety:** Actions advancing time (`REST_SHORT`, `REST_LONG`, `ADVANCE_TIME`) synchronously tick the scheduler and automatically update the returned receipt's `commitSequence` to reflect subsequent scheduler commits, preventing `REJECTED_STALE_SNAPSHOT` failures on subsequent client turns.

### 4. Verification Evidence
- **B1C Dedicated Acceptance Suite:** 5/5 passing in `tests/test_v2_harvest_02b1c_living_world_authority.py`.
- **Harvest Test Suite:** 40/40 passing across all 4 harvest test suites (`test_v2_harvest_*.py`).
- **All V2 Test Suites:** 167/167 passing across all 18 V2 test modules.
- **Full Backend Suite:** 456/456 passing across all 53 test files (`pytest`).
- **Frontend Test Suite:** 147/147 passing across 21 suites (`npm test -- --run`).
- **Frontend Production Build:** Clean Vite build (`npm run build`, 0 errors).

---

## 24. HARVEST-02-B1D: Authority, Trusted Outcomes, and Replay Closure (2026-10-28)

**Audit & Execution Date:** 2026-10-28  
**Governing Charters:** `docs/V2-HARVEST-02B1D-AUTHORITY-INPUT-AND-REPLAY-QA.md` & `docs/V2-MASTER-DEVELOPMENT-GOALS.md`  
**Backend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  
**Frontend Commit / Checkpoint:** Verified on branch `v2/srd51-rules-browser`  

### 1. Action Authority & Role Gating (P0-01)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **DM Privileged Actions Whitelist:** Added `UPDATE_NPC_COGNITION` and `ADVANCE_WORLD_ARC` to `DM_PRIVILEGED_ACTIONS = frozenset({...})` in `v2_campaign_gateway.py`.
- **Defense-in-Depth Validation:** Added role checking in `StateDeltaValidator.validate_patches` rejecting `UPDATE_NPC_COGNITION` and `ADVANCE_WORLD_ARC` when `actor_role not in {"dm", "dm_host"}`.
- **Identity Anti-Spoofing:** Caller-supplied `authenticatedRole` and `authenticatedActorId` are cleanly stripped (`pop`) from incoming payloads in `submit_action`, preventing players and observers from forging DM authority. Non-DM callers attempting these mutations receive `REJECTED_VALIDATION_FAILURE` (`ACTION_TYPE_ROLE_UNAUTHORIZED`).

### 2. Trusted Sensory Outcomes for Perception (P0-02)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Independent Sensory Truth:** Grounded perception logic in `_process_spatial_perceptions_and_cognition` decouples observation from unverified client claims (`rollTotal`, `isTheft`, fake `sceneCoordinates`).
- **Scene Token Anchor:** Observation coordinates anchor strictly to the creature's verified scene token position (`(actor_token.x, actor_token.y)`).
- **Authoritative Dice Integration:** Stealth and Sleight of Hand skill checks rely strictly on verified `dice_roll_data["total"]` from authoritative server/DM resolution.
- **Unconfirmed Roll Containment:** Under `REQUIRE_DM_CONFIRMATION`, player unconfirmed physical rolls (`PLAYER_REPORTED_UNVERIFIED` / `override_receipt_status == "PENDING_HUMAN_DM_APPROVAL"`) cannot suppress perception; unverified stealth is treated as failed against observer passive perception.
- **Objective Grounded Descriptions:** Observers record physical observations ("manipulating items suspiciously", "moving stealthily") without fabricating moral/legal guilt or leaking secret item names.

### 3. Hardened Recovery Identity Provenance (P0-03)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Authentic Recovery Provenance:** In `_recover_pending_admissions_internal`, both `STAGED_NEEDS_VALIDATION` and `DISPATCH_REQUIRED` recovery paths strictly inspect durably admitted payload provenance `payload.get("authenticatedRole")`.
- **Zero Raw Privilege Replay:** Never trusts raw `envelope.actor_role` or client claims on recovery replays.
- **Fail-Closed Discard:** If a DM-privileged action lacks authentic DM provenance (`dm` / `dm_host`), it is immediately discarded via `authority.discard_invalid_admission` with status `STALE`, preserving R1 single-state authority.

### 4. Stable Event Identities & Clock Idempotence (P1-04)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Event-Scoped Triggers:** In `v2_npc_cognition.py`, `WorldArcManager.tick_world_events` supports event-scoped tags (e.g. `alarm_raised@evt-1`, `gate_breached@evt-2`), permitting multiple distinct events occurring in the same world minute to trigger separate escalation clocks.
- **Deterministic Action Nonces:** Generates deterministic, content-anchored IDs for world arc updates (`act-world-arc-{clock_id}-{current_min}-{uuid5(tag)}`) and scheduler token moves, ensuring strict idempotent replay.

### 5. Immutable Commit Receipts (P1-05)
> **Acceptance Classification:** **AUTOMATED VERIFIED**
- **Original Receipt Preservation:** In `submit_action`, after synchronous scheduler ticks triggered by time-advancing actions (`ADVANCE_TIME`, `REST_SHORT`, `REST_LONG`), the original receipt `commitSequence` is never overwritten.
- **Client Turn Sync:** Returns original `receipt` intact with its authentic `commitSequence`, alongside `latestSnapshotRef` and `schedulerCommittedActions` to inform the client of subsequent commits and eliminate `REJECTED_STALE_SNAPSHOT` failures on subsequent client turns.

### 6. Verification Evidence
- **B1D Dedicated Acceptance Suite:** 7/7 passing in `tests/test_v2_harvest_02b1d_authority_and_replay.py`.
- **Harvest Test Suites:** 47/47 passing across all 5 harvest test suites (`test_v2_harvest_*.py`).
- **All V2 Test Suites:** 174/174 passing across all 19 V2 test modules.
- **Full Backend Suite:** 463/463 passing across all 54 test files (`pytest`).
- **Frontend Test Suite:** 147/147 passing across 21 suites (`npm test -- --run`).
- **Frontend Production Build:** Clean Vite build (`npm run build`, 0 errors).



## 25. Continuous MIT Harvest & M-Series World Simulation (2026-10-29)

**Status: APPROVED DELIVERY TRACK, no runtime implementation yet.** Product goal: M03–M15, M16/M16P and approved supplements must power the generic world engine—time/calendar, weather, travel/routes/maps, visitors/appointments, businesses and services, faction reputation and goals, rumour transmission, newspapers, quest/trigger conditions and NPC knowledge—rather than remain lore or a late source-pack attachment. The precise M-number inventory/mappings must be verified from original artifacts, not inferred.

| Gate | Current evidence grade | Required next deliverable |
|---|---|---|
| HARVEST-02-A/B | Adapted source in Python; agent-reported automated tests | Preserve provenance, correct B1D actor/clock/recovery boundary |
| B1D critical repairs | **AUTOMATED VERIFIED** | 7/7 dedicated B1D tests, role-gating, trusted sensory outcomes, recovery provenance, immutable receipts |
| HARVEST-02-C map/UVTT | QUEUED | Pin tested MIT parser, adapt to current spatial engine and no-crop map calibration |
| HARVEST-03-MSIM | **NOT STARTED** | MIT simulation source discovery/pinned file/test matrix, not wholesale applications |
| M-SIM-00 / 01 | **NOT STARTED** | Inventory real original M03–M16/M16P and supplements/Save overlays, source-to-Python domain matrix |
| M-SIM-02 / 03 | **PLANNED / NOT ACCEPTED** | Generic Python world processors + R1 cross-system live Windows scenario and replay |
| CPP-04/05 + M-SIM-04 | **PARTIAL FOUNDATIONS / MIGRATION NOT ACCEPTED** | User-facing Pack Manager; actual lawful M-series activation and unrelated adventure portability |
| Step 51 monsters / CP017B | **HOLD unchanged** | Explicit separate source/rules review and authorised future gates |

**Mandatory demonstration:** one source-backed region and active Save in which weather affects travel, time delays a scheduled visitor, an NPC learns a rumour only when told, a faction reacts to a committed event, and a scheduled newspaper publishes only information the publisher could know. Verify Windows Play/Host, DM/player views, genuine CommitReceipts, restart/replay, source provenance, licensing, no hidden future plot activation, and ability to move the engine to an unrelated campaign without code edits. Then expand to named original Dragon Heist content and Starlit Revels once content rights and imports are verified.

**Important scope distinction:** Integrating original M-series content, even with working weather/factions/travel/news, closes much of the **living-world and campaign-data gap**, not the entire product: complex 5e mechanics/Step 51, polished UI and character workflows, full portable pack lifecycle, secure LAN/mobile multiplayer, and model/voice performance remain separate acceptance gates. Historical PASS reports and automated test counts are not human play approval.


## 2026-10-31 — Codex application integration evidence

PASS: authenticated source-pack selection, protected artwork, explicit party release, committed Lyra/Durnan dialogue, human DM replies, Windows restart persistence, separate campaign selection and SQLite Save branching. Backend 532 passed/2 skipped; final security regressions 25 passed; frontend 150 passed, TypeScript and production build passed. PARTIAL/HOLD: AI replies, source NPC combat/spatial materialization, arbitrary pack upload/export and full combat acceptance. See [application handoff](V2-APP-INTEGRATION-HANDOFF.md) for commands, scope and limits. Historical evidence above remains unchanged.


## 2026-10-31 — Persistent source NPC world milestone

PASS: exact-pinned Durnan instance/location, witnessed unverified interaction memory, real local Qwen reply through shared Harness and R1, complete process restart, checkpoint inspection/branching and independent timeline play. Full backend 542 passed/2 skipped; targeted API/Harness/auth tests 38 passed; frontend 150 passed with TypeScript/build PASS. PARTIAL: configured-grid token contract covered, but private browser scene currently has no configured grid. HOLD: source combat mechanics, unrestricted private-belief ingestion and portable single-campaign export. See [persistent world handoff](V2-PERSISTENT-WORLD-HANDOFF.md) for exact evidence, launch instructions and limits. Earlier evidence remains historical.


## 2026-10-31 — Living world increment

PASS: role-safe pinned source/NPC knowledge admission, unverified witness provenance, private/party/character disclosure, relationship adjudication, committed report quests and calibrated source-map/VTT placement. Real local Qwen two-NPC Waterdeep Edge journey passed without HTTP 429. Backend broad regression 550 passed/2 skipped; final targeted 47 passed; cognition/personality regressions 14 passed; frontend 152 passed with TypeScript/build PASS. Final spatial regressions 30 passed. Standalone creator-world model/quest/routine browser acceptance, both-world full restart and independent child-timeline divergence/restart PASS. Daily routine configuration uses the existing R1 scheduler. Source combat, implicit private-secret model reasoning and portable single-campaign export remain HOLD/PARTIAL. See [living world handoff](V2-LIVING-WORLD-HANDOFF.md) for exact evidence and remaining acceptance. Historical evidence above is preserved.
