# VadAllFate Google AI Studio Frontend — V2 Integration Instructions

> **Governing charter (28 October 2026):** [VadAllFate V2 Master Development Goals and Acceptance Charter](V2-MASTER-DEVELOPMENT-GOALS.md). Current milestone reports and this document are evidence registers, not proof that the complete product or known trust gates have passed.

**Status:** Architectural instructions; UI/transport implementation is not claimed.
**Active workflow (2026-10-29):** [Continuous MIT Harvest and M-Series Living-World Integration](V2-CONTINUOUS-HARVEST-AND-M-SERIES-SIMULATION-PLAN.md) governs feature reuse and early M-SIM work alongside frontend/CPP delivery. Legacy notes about future implementation must be reconciled against current commits before new work is started.  
**Canonical architecture:** https://github.com/Minilaz-code/VadAllFate/blob/v2/srd51-rules-browser/docs/V2-ARCHITECTURE-INSTRUCTIONS-HARNESS-KNOWLEDGE-GRAPH.md

These frontend instructions consume the master contract. They do **not** create a competing architecture or permit local AI Studio mock state to act as authoritative Python game state.

## AI inference boundary

- Frontend modules do not instantiate multiple autonomous AI agents, each with a memory, tool authority or dedicated model.
- All live AI interactions are routed to a single Python **AI Harness Gateway** with explicitly bounded task profiles, a context compiler, typed tools, a model adapter, job budgets and output validation.
- On the baseline 6 GB VRAM / 16 GB RAM target, schedule **one GPU-resident generative model job at a time** by default. Prioritize interactive play; queue/defer long analysis. No speculative concurrent NPC, Director or world-model sessions.
- 'Narrator', 'NPC interpreter', 'Director' and 'Planner' are harness task profiles, not independent frontend AI agents. Advanced director planning remains a later gate.
- The frontend must not treat a model's response as an approved mechanical result or a committed event. Only a validated Python CommitReceipt changes canonical UI projection state.

## Planning and Homebrew Knowledge Explorer

- Integrate an Obsidian-style graph, Markdown linked notes, backlinks and optional JSON Canvas-compatible boards natively into existing **DM Planning** and **Homebrew Workshop**. Player Journal may expose its own server-authorised subset.
- Use backend **read-only graph projections over canonical SQLite sources**. Nodes reference existing NPC/location/faction/quest/scene/knowledge IDs rather than carrying another set of mutable facts.
- Expose saved graph *layouts*, zoom and filter presets as **presentation-only** metadata. Do not create independent factual 'graph NPC', 'graph location' or 'graph faction' stores.
- Query filters may combine world, adventure, campaign, save snapshot, faction, quest, NPC network, location, actor/party knowledge, provenance, time/revision and established/proposed status.
- Do not embed a copy of the proprietary Obsidian application. Use independent UI implementations and appropriately licensed Markdown/JSON Canvas libraries; interoperability is optional.

## Frontend security rules

- Obtain graph nodes, edges, attributes, aggregate counts, text search and model-search results **from the authorised Python projection**. Never download DM-full graphs and hide items in React.
- Session hosting is not DM permission. A DM guest retains authorised DM views; a player host receives only player-safe views. DM player-preview queries must round-trip through backend player projection logic.
- Neither Canvas exports nor Markdown links may reveal hidden NPCs, locations, secrets, relationship edges or undiscovered knowledge to players.
- The UI must never issue direct SQLite SQL or arbitrary model-initiated SQL. Editing canonical facts submits an authorised request through the existing ActionEnvelope/SnapshotRef/CommitRequest/CommitReceipt runtime boundary.
- When Python endpoints are not verified or disconnected, disable authoritative editing and visibly label mock graph examples as demo-only.

## Acceptance checklist for future frontend implementation

- [ ] Graph scope switches preserve source ownership and save/branch isolation.
- [ ] Primara/Avernus secret relationship is absent from all player payloads, tooltips, counts, search, export and AI retrieval.
- [ ] Vale & Sons canonical edits propagate to every authorised graph view after committed receipt, with no duplicated factual graph store.
- [ ] DM guest, player host, observer and DM player-preview roles pass server-backed negative leak tests.
- [ ] Live narration continues when deep background tasks are queued; only one GPU model call runs by default on baseline hardware.
- [ ] AI malformatted tool calls and stale writes fail closed without changing frontend authoritative projections.
- [ ] Map/Canvas layout moves remain presentation-only and cannot rewrite world geometry or game state.

## Gate

Do not implement backend-facing DTOs or SQL schemas from guesses. First complete KGP-00 source schema/ACL audit and HAR-00 runtime adapter contract review from the canonical instructions. Existing QA checkpoints and active runtime holds remain in force.

## Authored Notes, Confirmed Plans and Implemented Homebrew

**Normative cross-reference:** [V2 authored notes/plans/homebrew architecture](https://github.com/Minilaz-code/VadAllFate/blob/v2/srd51-rules-browser/docs/V2-AUTHORED-NOTES-PLANS-HOMEBREW-LIFECYCLES.md). Do not independently invent frontend authority.

- **Player Journal:** create/edit versioned `.md` notes; private-by-default, explicitly party-shared or DM-shared. A player's suspicion or rumour remains authored text, never automatically game canon.
- **DM Planning:** Draft Markdown -> Submit Proposal (frozen source revision, durable SQLite `proposed`) -> Confirm (authorised SQLite `confirmed` future intention). A confirmed plan may guide scenes but is **not an occurred save-state event**. Present approved revisions, diffs, cancellation/supersession and campaign/session scope.
- **Homebrew Workshop:** Draft -> Validate -> Implement into the selected world/campaign/ruleset scope. Active content requires authoritative version activation, resolver integration and explicit revision control. Never edit read-only SRD source rows.
- **Knowledge graph:** independently selectable `Notes`, `DM proposed plans`, `DM confirmed plans`, and `Implemented homebrew` overlays, in addition to world/adventure/campaign/save/player/faction views; backend ACL filters nodes and edges before returning them.
- **UI boundary:** graph movement is display only; note writes go via authorised note service, plan confirmation and homebrew implementation via approved backend write/commit pathways. On absent backend, disable apparent activation/confirmation.
- **Harness:** single queued inference orchestration, no additional agents/models for separate workspaces. Models can propose drafts, not confirm or implement.

The details are implementation-gated pending existing SQLite schema and R1 gateway audit; do not claim frontend controls or tests exist solely due to this instruction.

## Portable Campaign Pack / Obsidian / CSV Frontend Instruction (CPP)

**Normative contract:** [V2 Portable Campaign Packs, External AI Authoring and Obsidian Interoperability](https://github.com/Minilaz-code/VadAllFate/blob/v2/srd51-rules-browser/docs/V2-PORTABLE-CAMPAIGN-PACKS-AND-OBSIDIAN-INTEROP.md).

Product goal: the same VadAllFate engine must support any properly licensed, compatible D&D campaign or original homebrew world, assembled by a player, creator or external AI. Do not hard-code Aethelgard or Waterdeep as required content and do not assume an Obsidian installation.

- Build a native **Pack Manager** inside DM Planning / Homebrew Workshop, consuming a validated Python import API rather than parsing/canonizing campaign data independently.
- Support selecting Markdown vaults, Obsidian-compatible JSON Canvas, typed nodes.csv and edges.csv, and approved versioned campaign/world/homebrew packs. Show author/source/licence, ruleset edition, dependency, visibility, scope, record counts and preview status.
- Show clear staging, conflict resolution, ambiguous-link review and explicit user approval of Draft / Proposed / Confirmed plans and Draft / Validated / Implemented homebrew. A Markdown wikilink is not a canonical relationship; moving a Canvas card is not an in-world action.
- Offer role-safe Markdown, CSV and Canvas export after the backend returns an authorised projection; never send full DM graphs to the browser for client-side filtering.
- On invalid schema, failed authentication, unsupported version, disconnected Python, missing licence or untrusted executable mod, fail closed and describe the blocker. No silently activated campaigns, rule overrides or modified Saves.
- External AI authoring: present a downloadable/versioned brief, canonical sample pack schemas and an import validation report. Do not embed dependence on Gemini or any other AI provider.
- **Export correctness:** the current HomebrewWorkshopView local JSON export uses a random placeholder value under sha256; it is NOT a verified SHA-256 checksum or installable campaign pack. Label it demo/legacy until a real SHA-256 content hash and Python validation/provenance pipeline exist. Never claim an export is securely validated just because it has a hash-shaped field.
- **Frontend implementation status (2026-10-27):** existing Knowledge Explorer, notes, plan and homebrew UI are foundations; no verified production Obsidian/CSV round-trip importer, Pack Manager, arbitrary campaign installer or executable extension host. Basic JSON export is not a validated portable pack.
- Coordinate with backend gates CPP-00 through CPP-06; until backend DTOs and validation APIs exist, use clearly labelled design previews only, not demo writes presented as canonical.

## Continuous Harvest & M-SIM in the frontend (effective 2026-10-29)

**Reuse-before-reinvent is mandatory:** Before implementing significant interface features (map importer/calibration, event timelines, calendar/weather forecasts, travel planning, news/rumour feeds, faction relations, visitor schedules, graph/Canvas/Pack Manager), inspect existing frontend source, consult backend `provenance/HARVEST_REGISTER.md`, and assess exact file-level MIT implementations/tests from pinned GitHub commits. Record COPY/ADAPT/PORT/TEST-HARVEST/REFERENCE/REJECT, licence/attribution and regression evidence; never copy entire apps or bypass Python authority. Shared discoveries belong to HARVEST-02-C and HARVEST-03-MSIM.

**M-series is a living-world input, not just lore UI:** M-SIM-00/01 inventories actual M03–M16/M16P sources and defines supported typed projections. The UI must be ready to expose current weather, in-world date/time, map region/route/ETA, visitor arrivals and appointments, faction standing, source-attributed rumours, newspaper issues and conditional world events from the **authorised Python projection**. Present DM-only confidence, sources, schedules and pending plans only to authorised roles; never fabricate world conditions in React or use unreleased campaign secrets to generate player news.

**Connected workflows:** In PLAY/HOST, show a unified time/weather/travel/news/visitors snapshot, notification provenance and actor-specific knowledge without crowding the story/VTT. In DM PLANNING, provide inspectable schedules, world event dependencies and future confirmed plans; in HOMEBREW WORKSHOP, configure allowed domain data and rules without activating them as occurred events. Pack Manager preview clearly distinguishes staged M-series source, installed baseline, pending triggers and committed Save consequences; importing content must not progress time.

**Priorities:** B1D security and working live UI fixes remain first for authoritative mutations; M-SIM source inventory/harvest research happens in parallel; build UI after each verified Python contract, not only after completion of all M modules. Design remains user-governed: dark charcoal/copper/teal, spacious map, all five DM modes, and **no unilateral selection** of Hybrid Cockpit D. Test real Windows UI and phone/tablet role projections rather than relying on headless fixtures.

**Acceptance:** weather affects a travel itinerary, a visitor arrives late, an NPC learns a rumour only from an allowed source, faction reaction follows a committed act, a newspaper subsequently publishes a permitted incomplete account, and all five elements persist after restart. User sees exactly what their character knows. M source mapping, backend events and UI presentation each receive separate evidence status; mock screens are never marked live.

## Player-reported live UX defects and frontend rebuild delivery

**Required acceptance brief:** [Player Experience, VTT and UI Rebuild Brief](V2-PLAYER-EXPERIENCE-VTT-AND-UI-REBUILD-BRIEF.md) (2026-10-27). Treat its real-user observations as open bugs even where narrower Milestone 10 backend or headless tests passed.

**Do not postpone play-blocking correctness issues:** launching in Demo Mode, failed live authentication, player input appearing only in the event ledger rather than in the dialogue pane, and unclear production error/status handling are P0. These should be repaired alongside backend Milestone 10B/CPP-03 contracts.

**Planned main frontend emphasis once core APIs are stable:** accessible character sheets and journals, real combat HP/spell-slot tracker, Blue Alley image-first map import and non-destructive grid calibration with larger resizable canvas, and cohesive charcoal/slate + copper/bronze + teal UI redesign. Full character/notes/code components are not proof of discoverable features; imported artwork MUST NOT be silently clipped when aligning to grid.

**Track UX-00 through UX-05** as independent user-acceptance gates. CPP-04 remains the campaign Pack Manager and depends on CPP-03 approved backend admission. Do not wait for every living-world simulator to be completed before delivering frontend usability, nor merge demo data into live authoritative UI.
