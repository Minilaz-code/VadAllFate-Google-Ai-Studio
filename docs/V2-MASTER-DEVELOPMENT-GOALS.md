# VadAllFate V2 — Master Development Goals and Acceptance Charter

**Updated:** 2026-10-28  
**Status:** APPROVED PRODUCT DIRECTION AND DELIVERY GOVERNANCE; **NOT** an implementation-complete claim.  
**Branch:** `v2/srd51-rules-browser`; do not merge `main` without explicit user approval.  
**Implementation baselines reviewed:** backend `20f40f8`, frontend `6cfc268` (Milestone 12B); consult the latest branch heads, not these as fixed edit bases.  
**Authority:** This charter expresses the agreed end goal; companion architectural and milestone documents define detailed contracts and holds. It must not override frozen R1 schemas, Step 51 coverage restrictions or existing security gates.

## 1. Primary Objective

Build **VadAllFate** into a complete, persistent, local-first, provider-agnostic tabletop RPG engine that can operate as **Full AI Dungeon Master, AI-primary Co-DM, human-primary Co-DM, human assist or human sovereign**. It must be capable of running full D&D 5e campaigns as a **coherent living world**, not a bundle of isolated demonstration screens.

An AI controls narrative decisions and proposes actions; the **deterministic Python runtime owns validation, rules, time, location, permissions and canonical outcomes**. Players and DMs can use **digital or real physical dice** with explicit session policy and honest roll provenance. The React VTT visualises the world and presents usable player/DM workflows, not a shadow gameplay engine.

**Primary real-play benchmark:** Waterdeep: Dragon Heist (Alexandrian Remix), including **Blue Alley** and the **Starlit Revels** event from **Devil of a Night**: Thor, Lyra and their companions, named NPCs, crowds, maps, movement, encounters, secrets, relationships, dialogue, scheduling, quests, time and durable consequences. **Portability benchmark:** an unrelated legally supplied adventure must load and run without editing the Python source.

## 2. Immutable Architecture and Product Contracts

- **Existing authority stays:** R1 `ActionEnvelope → SnapshotRef → Rules/StatePatch → Validation → CommitRequest → CommitReceipt`; Python/SQLite single Commit Authority, deterministic replay/recovery, explicit revision and idempotency. No replacement runtime and no second authoritative campaign database.
- **Rules and source:** SRD 5.1 read-only source database, provenance, licensing, precedence and approved homebrew; no unverified source content masquerading as resolved rules. Frozen schemas change only through explicit reviewed migrations.
- **Separate knowledge from state:** canonical established facts, NPC beliefs/suspicions, player knowledge, proposed DM plans, draft homebrew and committed gameplay effects must remain distinguishable. No unauthorised AI or Markdown direct canonical mutation.
- **Three native workspaces:** PLAY/HOST; DM PLANNING (native Markdown, links/backlinks, graph and visual Canvas); HOMEBREW WORKSHOP (draft/validate/publish versioned rules, items, factions, creatures, NPCs, relationships). Shared knowledge service but strict proposal/confirmation/publication boundaries.
- **Five modes:** Full AI DM; AI-primary Co-DM; human-primary Co-DM; human assist; human sovereign. Explicit DM veto and pending-adjudication policies, including reconnection/restart.
- **AI:** interchangeable local/cloud models, Qwen as current *test baseline only*; bounded tasks, tool/function calls and permission-scoped context. AI may request, suggest or narrate; Python makes authoritative changes.
- **Voice:** Chatterbox Nano TTS runs *natively inside VadAllFate*; VadAllVox is a separate voice-casting and fine-tuning **authoring** tool, not a runtime dependency or sidecar that must be launched for play.
- **Operating budget:** prioritise local-first, 4–6 GB VRAM / 16 GB RAM clients; do not require constant cloud calls or one LLM inference per ordinary NPC/world tick.
- **Multiplayer/security:** host/DM/player/observer identities, character ownership, private messages, player-specific knowledge, consent, replay-safe actions, secure map assets and role-scoped projections are enforced **server-side**.
- **Compatibility:** retain existing VTT, runtime, recovery contracts, legitimate source/licence holds, and working features. No unilateral redesign or `main` merge.

## 3. Evidence Grades: Avoid False Completion

## 2A. Standing Development Policy — Reuse Before Reinvention and M-Series Integration

**Continuous harvesting is mandatory for significant new features.** Before building weather, travel, NPC cognition, faction politics, rules tools, scheduling, news, rumours, maps, UI tools or any other substantial subsystem, compare the current VadAllFate implementation with properly licensed upstream code **and tests**. Search our pinned `HARVEST_REGISTER.md` first, then discover relevant GitHub MIT implementations beyond D&D-specific repositories where useful. Decide COPY / ADAPT / PORT / TEST-HARVEST / REFERENCE ONLY / REJECT, record exact upstream commit/file/licence, preserve notices, and integrate **small compatible units** into the existing R1 and React architecture. Do not copy unclear-licence code, third-party game assets or a rival runtime/database. Harvesting continues throughout V2 and future development, not just HARVEST-02.

**M03–M16/M16P and supplements are an active primary source for a living world, not merely optional notes or a late CPP-05 packaging job.** The Waterdeep programme's weather, calendars, locations, mapped routes, visitors, businesses, factions, rumours, news/press, law/guilds, NPC schedules, quests, conditional events and Save overlays are to be inventoried, preserved and mapped into **generic, deterministic Python simulation processors**. Treat actual original source artifacts and their provenance as the authority for what each M-number contains; do not invent module contents. Existing M-series source-stage PASS does not prove active V2 features.

**Parallel workstream M-SIM-00..04:** begin source inventory and code-harvest discovery while B1D security work continues; map domain contracts, implement only missing generic processors after authority gates, demonstrate connected real-world behaviour, then activate properly licensed campaign data through CPP-04/05. Campaign-specific data configures the reusable engine; only R1 commits events and consequences. Weather/visitors/travel/faction reputation/rumours/news must cause demonstrable, replay-safe changes, not just richer generated narration.

**Normative implementation and acceptance plan:** [V2 Continuous Harvest and M-Series Simulation Plan](V2-CONTINUOUS-HARVEST-AND-M-SERIES-SIMULATION-PLAN.md). This policy is *approved direction*, not a claim of M-series migration, source harvest or user acceptance.



**IMPLEMENTED / SOURCE REVIEWED:** files and executable paths exist; does not prove correct behaviour.  
**AUTOMATED VERIFIED:** tests meaningfully cover success, rejection, roles, crash/restart, race conditions, determinism, no secret leaks.  
**REAL APPLICATION VERIFIED:** authenticated Windows app and relevant phone/tablet/browser interactions tested, rather than fixture-only success.  
**HUMAN ACCEPTED:** actual user scenario meets all criteria on real maps/content and suitable hardware.  
**HOLD/PARTIAL:** required behaviour is missing or a known security/integrity issue remains.

Always separate *reported agent test counts* from independent examination and human acceptance. A successful UI screenshot or `COMMITTED` event alone is not a full game-loop acceptance test.

## 4. Development Priority and Goals

### Goal 1 — Backend correctness, rules and trustworthy dice (**P0 / immediate**)

Python must correctly adjudicate attacks, damage, criticals, defenses, spells, slots, conditions, death saves, rests and skills from validated character data and approved rules. SRD 5.1 monster mechanics are held where Step 51 coverage is unverified; unsupported effects must fail closed, not use invented generic damage or statistics.

**Dice is explicitly multi-source:** `SERVER_DIGITAL`, `PLAYER_PHYSICAL`, `DM_PHYSICAL` and separately authorised `DM_ADJUDICATED_OVERRIDE`. Mixed dice in one encounter is a core product requirement. For physical rolls, players report **raw faces only**; Python validates the authorised, pinned roll request and computes bonuses/AC/DC/damage/HP. Session policies: honour-system mixed, require DM confirmation, digital-only. An unverified physical claim is not proof of the physical die face but is legitimate when host policy allows. AI DM must pause for pending player rolls and resume from committed results.

**P0 security findings from Milestone 12B source review (2026-10-28):**
1. Digital HMAC RNG currently seeds `serverDiceSecret` with a **predictable hardcoded campaign-derived string** in seed state and fallback; that is *not* unmineable player-unpredictable entropy. Securely generate/store a per-campaign secret **outside publicly projected/replay-leaked campaign document**, implement safe migration/rotation and replay proof without revealing future rolls. Never regenerate secret silently during restart.
2. Existing physical-dice implementation mostly submits `diceMode/rawRolls/damageRolls` as part of an action; it **does not yet demonstrate a fully pinned, persistent `RollRequest` lifecycle** that prevents resubmission/mode-switch-after-unfavourable-roll, validates separate roll stages, handles interruptions or lets AI suspend/resume robustly. Build and test that contract rather than counting toggle UI as finished.
3. Verify attacker ownership, nonce/action ID selection, forged modifiers and consequences, anti-replay, multi-die formula accuracy (greatsword 2d6 / critical 4d6), advantage/disadvantage, DM physical and explicit overrides.
4. Enforce real single-active-model execution, versioned R1 recovery, pack import conflict approval, atomic/restart-safe reconciliation, and rollback/compensation safety.

**Acceptance:** adversarial clients cannot choose digital outcomes, spoof actor/roll authority, force unapproved state or double-spend dice/actions; honest physical dice work; state replays and recovers without changing results. Verify code + negative/interrupt/concurrency tests + real UI.

### Goal 2 — Persistent, authoritative 2D spatial world (**P1; alongside map UI**)

Treat every PC, named NPC and creature as an actor with stable campaign/save/scene identity, versioned canonical coordinates, footprint, permitted movement modes, world-time position and revisions, **not merely a draggable icon**. Python must validate boundaries, collisions, walls/doors, visibility/LOS, reach, targeting, cover, difficult terrain, routing, encounter movement budgets, scene transitions, actor occupancy and simultaneous moves. AI requests movement via restricted tools; Python resolves and commits it, then VTT animates the committed route.

Four independent coordinate spaces: natural **image pixels**, calibrated grid, canonical scene cells/feet, and client viewport pixels. Explicit typed transforms only. **Do not silently guess** `grid_cell` versus `percentage` based on values; existing Milestone 12B compatibility adapter is transitional, not the end-state spatial model. Save/restore geometry and actor placements after full app restart. Player knowledge, occlusion and DM map secrecy stay separate from ground-truth geometry.

**Blue Alley:** import genuine source artwork uncropped; map and grid remain independently editable; calibrate printed squares; save/reload original artwork, fog/walls/doors/actors; test with the user's actual image when provided, rather than treating generated fixture art as proof.

See [Authoritative Spatial Stress Test](V2-AUTHORITATIVE-2D-SPATIAL-SIMULATION-AND-STARLIT-REVELS-TEST.md) and [Blue Alley VTT Architecture](BLUE-ALLEY-VTT-ARCHITECTURE.md).

**Acceptance:** actors cannot walk through closed walls or each other; LOS/ranges are grounded and role-filtered; NPC can navigate across a real scene; save/restart and deterministic replay reproduce the same positions and trigger decisions.

### Goal 3 — Genuine NPC cognition and living-world simulation (**P1–P2**)

Build upon existing NPC identity/knowledge/graph structures: episodic memory, relationships, trust, attitudes, goals, routines, rumours, witnesses and distinct facts/beliefs/suspicions. NPCs only know observed, communicated or previously established information; avoid omniscience. Ground their decisions in locations, nearby actors, visible/heard events, permissions and real world time.

Python Master World Clock and deterministic scheduler own travel/rest, appointments, NPC routines, triggered quests/encounters, weather, settlements/regions/buildings, faction reputation, economy/inventory consequences, and offline progression policy. Lightweight scheduled NPC/crowd agents should run without constant model inference. AI inference is reserved for salient dialogue, plans and choices. Director controls pacing, spotlight and narrative policy without bypassing rules.

**Acceptance:** 14 named Starlit Revels participants and a configurable crowd can be scheduled, move, interact, witness or miss incidents, form restricted memories and respond appropriately to actions; restart leaves coherent world and NPC beliefs. Conditional future events remain inactive until approved triggers.

**M-series living-world acceptance:** use actual source-backed M03–M16/M16P configurations to drive weather and seasonal conditions, route/travel times, scheduled visitors and services, personal rumours, faction responses and delayed news, all linked to the one Master World Clock. Prove cause-and-effect across several systems with committed R1 events, role-specific observations, Save isolation and restart. Generic Python processors must run a second unrelated campaign without Waterdeep-specific code changes.

### Goal 4 — Playable and accessible integrated UI/UX (**P1 in parallel with backend**)

One authoritative state must drive narrative/dialogue, real player inputs, quest log, journal/notes, character sheets/progression, inventory, skills, spell slots, HP, combat tracker, dice provenance, initiative, VTT fog/maps/tokens, DM adjudications, rules lookup, and AI Director. Clear connecting/connected/auth required/disconnected/explicit demo truth; no hidden demo fallbacks or misleading save successes.

Player/DM must readily see and use their character sheet and notes, enter a **physical dice face** or choose secure digital dice, review a roll's provenance, play encounters and resume after restart. Authentic DM planning and homebrew share the knowledge graph; drafts do not become established world state accidentally.

**Layout governance:** proposals A/B/C/D remain open; **D Hybrid Cockpit is only a recommendation, not approved**. No wholesale redesign without user choice. Map-first/fullscreen and collapsible narrative/combat/Co-DM panels should be available in approved design; mobile/tablet use must remain workable. Visual identity: charcoal/slate, copper/bronze and restrained teal.

**Acceptance:** users can complete an encounter through the real UI without reading raw event database tables; dialogue, damage, rolls, spell slots, journal and map all show the same committed state.

### Goal 5 — Portable campaigns, native notes and safe homebrew (**P1–P2**)

Complete `.vadpack` lifecycle: safe read/dry run, DM review of pinned conflicts, R1-authoritative import with crash repair, Pack Manager, provenance/licence tracking, export with per-player secrecy, version management, save branching and install isolation. No campaign-specific Python edits to run a new adventure; source copyright permissions and asset licences must be respected.

DM PLANNING has native Markdown files, structured graph and Canvas, with proposed/confirmed campaign planning semantics. HOMEBREW WORKSHOP has draft/validated/implemented/deprecated versions with actual, testable rules effects where supported and explicit publication. Players can write personal/party notes without gaining DM truth. External Obsidian vault import/export is optional; SQLite remains state authority.

**Acceptance:** an independent imported adventure runs through real travel, scenes, dialogue, rules and Save; interrupted imports recover without falsely claiming completed or overwriting player consequences.

**M-series sequence:** M-SIM-00/01 inventory and executable-behaviour reconciliation start **before CPP-05**; CPP-03/04 pack approval and UI then enable M16/M16P source-backed conversion/activation at CPP-05. Preserve original M content, source IDs, migrations, maps, W-series identity/link proofs where available, original Save overlays and legal source provenance. Imported future plans must not auto-trigger gameplay.

### Goal 6 — Real gameplay and persistence acceptance (**continuous acceptance track**)

Completion must be demonstrated by *vertical gameplay*:

1. A controlled non-demo campaign with character sheets, live AI dialogue, physical and digital dice, saved outcomes, restart and replay.
2. Blue Alley on the actual licensed/user-supplied map: zero crop, correct grid, LOS, movement, supported encounters, permanent notes/HP/slots/geometry.
3. The Starlit Revels: named NPCs and crowds, knowledge, diplomacy, scheduled transitions, AI-guided spatial movement, role secrecy, encounter consequences and long-session soak.
4. An unrelated imported module with no VadAllFate source edits.
5. Full AI DM / Co-DM / human-controlled games across real multiplayer devices, with realistic resource limits and recovery.

**Score each as PASS / PARTIAL / HOLD with observable evidence.** A single passing toy encounter never signs off the entire D&D 5e rules engine.

### Goal 7 — Secure multiplayer and device continuity (**P2**)

Support 2–3 Windows laptops and mobiles/tablets as clients or optional controlled workers, with per-character ownership, DM/host/player/observer roles, join/invite, presence, private/public actions, fog/knowledge separation, reconnection, push/poll sync and coherent commit-order projections. Do not expose the V2 runtime to the LAN until threat review, auth/transport/asset ACL, origin/CSRF protections, secret projection and denial-of-service tests pass.

**P0 for map assets:** Milestone 12B `GET /api/v2/battlemap/assets/{id}` path currently has **no explicit session/role check at that route** and assets are selected from a shared directory by ID. Before remotely shared play, implement access-controlled per-campaign asset ownership and player-safe image variants; validate file type/content, size, and safe rendering. `POST` likewise needs correct DM upload authorisation, not merely any authenticated identity. Inspect rather than assume the enclosing HTTP layer covers it.

**Acceptance:** wrong user/role/campaign cannot read hidden assets or mutate objects; role-switch clears privileged caches, including image and renderer state; offline/reconnect maintains correct world position without leaking DM state.

### Goal 8 — Local AI, voice, performance and extensibility (**P2, continuously constrained**)

Keep provider-agnostic model adapters and task routing, small local Qwen baseline, token/context budget, effective retrieval, bounded latency and explicit fallback truth. Enforce single active GPU-heavy model job when on 4–6 GB VRAM hardware; allow future optional distributed approved workers without granting them canonical authority. Use deterministic world processing for routine operations. Measure CPU/VRAM/RAM, response time, action throughput and failure recovery on realistic hardware.

Native Chatterbox Nano renders narration/NPC speech within VadAllFate; VadAllVox remains a separate offline voice authoring/casting programme. Voice model availability must never block core authoritative gameplay or cause fabricated receipts.

**Acceptance:** actual long-session narrated play on local hardware, graceful degraded mode without network, model swap without state migration, no double model loading or unsafe parallel GPU contention.

## 5. Sequencing and Non-Displacement

**Immediate critical closure (next implementation gate):** resolve predictable RNG seed and proof handling; authenticate and authorise battlemap assets; make physical dice request/confirmation/replay safe; verify player/DM projection isolation; fix any R1/pack/recovery/Co-DM safety issues found by targeted tests. No new feature milestone may label these secure while still open.

**Then integrated spatial vertical slice:** SP-00 (typed scene coordinate contract), SP-01 (geometry/LOS/path queries), SP-02 (R1-authorised movement), SP-03 (React map and asset/role integration). Build real interactive VTT functionality alongside Python, not only backend modules.

**Living world:** SP-04 NPC scheduler + spatial tools + DM knowledge; SP-05 Starlit Revels campaign/soak with real content after lawful import. Integrate future controlled NPC tool loop and world clock rather than pretending a narrator prompt makes an autonomous DM.

**Front-end:** maintain usability and regression fixes continuously; implement full Hybrid or other structural redesign **only after layout approval**.

**Campaign pipeline:** continue CPP-04/05 and original Dragon Heist integration without bypassing import licences, step holds or abandoning other modules.

**Early living-world M-series track:** M-SIM-00 inventory and HARVEST-03-MSIM MIT discovery begin now, parallel to B1D corrections and frontend development. M-SIM-01 covers source-to-runtime gap mapping; M-SIM-02 builds reusable Python weather/calendar/travel/visitor/faction/rumour/press processors incrementally through R1; M-SIM-03 verifies cross-system gameplay and replay; M-SIM-04 runs M16/M16P through actual CPP-05 activation and an independent imported campaign. Do not wait until CPP-05 to learn what the M-series requires or defer usable UI while simulating whole cities.

**Future, not blockers now:** annotated VTT map import (`.uvtt`/`.dd2vtt`), CPU wall/room/door detection, optional AI vision, smart DM-approved geometry editing; distributed local-model workers; broader rules/source coverage beyond independently verified SRD; richer settlements/economy beyond the initial vertical slice. Keep these in tracked backlog. See [Automatic Map Ingestion](FUTURE-AUTOMATED-SPATIAL-MAP-INGESTION.md).

## 6. Development Discipline and Reporting

For every checkpoint:

1. Fetch and inspect current backend/frontend heads and contracts; preserve local uncommitted work. Do not duplicate or replace working subsystems.
1a. **Reuse-before-reinvent gate:** compare the requested feature against the current pinned MIT harvest queue and conduct bounded fresh upstream discovery; record selected source file/commit/licence, compatible tests and expected engineering benefit. No wholesale clone or new authority. For living-world work, check the original M-series module/ledger before reauthoring its content or behaviour.
2. Identify exact source files, relevant authority boundary, approved holds, current tests and cross-repo API contracts.
3. Specify expected user behaviour and *negative* acceptance cases before implementation.
4. Build complete backend–frontend vertical slices with role/source provenance. Python remains the state owner.
5. Test unit, integration, property/negative, adversarial, concurrency, crash/restart, secrecy and replay scenarios as appropriate.
6. Test the actual authenticated Windows launcher/browser, desktop/tablet/mobile when applicable; show real evidence distinct from mocked fixtures.
7. Update evidence-based implementation registers with PASS / PARTIAL / HOLD, known bugs, risk, coverage and test exact command/environment. Counts alone do not establish product readiness.
8. Commit and push to existing `v2/srd51-rules-browser` development branches as appropriate. **Never merge main without explicit approval.**
9. Prioritise the next *user-visible complete gameplay journey*, not the most easily countable number of handlers.
10. Never claim a user-selected layout, map asset, NPC intelligence, production security or full D&D coverage that has not actually been implemented and accepted.

## 7. Companion Documents

- `docs/V2-MILESTONE-12B-EXECUTION-BRIEF.md` — recent digital/physical dice, VTT trust and persistence milestone (implementation claims are reviewed separately).
- `docs/V2-DICE-ROLL-INPUT-MODES-AND-AUTHORITY.md` — approved roll-request, provenance, trust policy and UI rules.
- `docs/V2-AUTHORITATIVE-2D-SPATIAL-SIMULATION-AND-STARLIT-REVELS-TEST.md` — SP-00..05 actor navigation and stress criteria.
- `docs/BLUE-ALLEY-VTT-ARCHITECTURE.md` — image-first VTT and calibration.
- `docs/FUTURE-AUTOMATED-SPATIAL-MAP-INGESTION.md` — deferred annotated-map import and automatic geometry proposal.
- `docs/V2-PORTABLE-CAMPAIGN-PACKS-AND-OBSIDIAN-INTEROP.md` (backend) — import/notes/campaign pack lifecycle.
- `docs/V2-IMPLEMENTATION-REGISTER.md` — evidence-based milestone implementation status.
- `docs/V2-CONTINUOUS-HARVEST-AND-M-SERIES-SIMULATION-PLAN.md` — **standing** MIT reuse requirements, M-SIM-00..04 source/simulation workstream, HARVEST-03-MSIM, and acceptance.
- `provenance/HARVEST_REGISTER.md` and `THIRD_PARTY_NOTICES.md` (backend) — exact code origin, licence and incorporation accounting.

**Governing success condition:** A human can open VadAllFate, run a real D&D campaign with either physical or digital dice, see NPCs act and move in a persistent world under the correct rules and permissions, save and resume without continuity loss, and switch to a different campaign without changing the engine. *Passing tests is necessary but not a substitute for that outcome.*
