# VadAllFate V2 — Continuous Open-Source Harvest & M-Series Living-World Integration Programme

**Decision date:** 2026-10-29. **Authority:** active product/development instruction beneath `V2-MASTER-DEVELOPMENT-GOALS.md`. **Status:** APPROVED DIRECTION AND WORK QUEUE, **not implemented M-series functionality, migrated content, or real-play acceptance**.
**Scope:** both `Minilaz-code/VadAllFate` (Python R1) and `Minilaz-code/VadAllFate-Google-Ai-Studio` (React); development branch `v2/srd51-rules-browser`, no `main` merge without explicit user approval.

## 1. Product outcome and why this is an active track

VadAllFate must be able to run a *living* D&D world: weather; calendared world time; travel and route delays; residents, visitors and appointments; businesses and settlements; faction goals, reputation and consequences; individual NPC facts/beliefs/suspicions; rumour transmission and source credibility; news and newspapers; mapped regions and scenes; quests, clocks and conditional events; and consistent save/replay. Systems must influence one another as authorised, source-aware world events rather than merely appearing in lore or narrator prose.

**The original M03–M15, M16/M16P, supplements, source ledgers, Save overlays and any W-series identity/source artifacts are valuable existing inputs.** Preserve and audit before recreation. M16 is the intended campaign convergence/acceptance reference, not a second world engine. No unverified M-number-to-feature mapping may be treated as fact; resolve exact package contents from actual source manifests, SQLite schemas and retained artifacts.

**Architecture:** campaign/source pack defines scoped facts, actor/route/location records, calendars, weather profiles, services, schedules, event conditions and provenance; **generic deterministic Python simulation modules** compute what happens; bounded AI plans or narrates; **R1** validates and commits changes; UI shows relevant authorised results. Do not hardcode Waterdeep as a requirement of generic Python gameplay.

## 2. Permanent harvesting rule for *every* significant new subsystem

Before implementing a materially new feature or replacing a weak subsystem, Antigravity **MUST**:

1. **Inspect current local/remote VadAllFate implementation** and acceptance gap. Keep working code.
2. **Search existing `provenance/HARVEST_REGISTER.md` and relevant upstream repositories**, then perform targeted new GitHub discovery beyond D&D projects where beneficial (MIT-licensed simulation, travel, calendars, scheduler, weather, knowledge graphs, economy, reputation, VTT parsers, test fixtures).
3. Pin upstream repository, **full commit SHA, exact file/module and tests**, inspect actual code/dependencies, distinguish architectural ideas from source copying, compare performance/correctness and select **COPY / ADAPT / PORT / TEST-HARVEST / REFERENCE ONLY / REJECT**.
4. Prefer confirmed **MIT** sources and retain full licence/copyright in the appropriate files and `THIRD_PARTY_NOTICES.md`. Other licences (including Apache-2.0) require their own verified obligations/approval. A GitHub top-level MIT badge does **not** licence separately sourced D&D text, maps, voices, artwork, data, vendored dependencies or proprietary rulebooks; unclear/no licence means **do not copy**.
5. Harvest **small proven algorithms, parsers, models, test cases, validators, visual components** rather than importing whole alternate runtimes, unneeded dependencies, second databases, or full applications.
6. Adapt into existing Python/React contracts and **R1 ActionEnvelope → SnapshotRef → Rules/StatePatch → Validation → CommitRequest → CommitReceipt**. Never permit model, worker, source importer or browser to mutate canonical world data directly.
7. Run upstream-adapted tests **and** VadAllFate's authority, negative-role/secrecy, rules, replay, restart, world-time, performance and Windows UI regression gates. Compare measured benefit to baseline rather than counting copied lines.
8. Append exact provenance/commit/destination, compatibility rationale and evidence to Harvest Register; correctly mark **inspection vs incorporation vs automated verified vs real-app verified vs human accepted**.
9. Report **what was actually borrowed**, rejected, and still queued; harvest is ongoing as needs arise, not automatically running background work.
10. Maintain security P0 and held schema/rules gates. Harvest research can run in parallel; unreviewed code cannot bypass B1D, frozen schema or Step 51 holds.

Existing queue: HARVEST-02-A/A1/B (Lorekeeper + Parth) source adaptations implemented with repairs still tracked; 02-C UVTT/map geometry queued; 02-D rules/tool tests queued; 02-E external Foundry adapter optional. **New HARVEST-03-MSIM** is dedicated MIT discovery for the M-series world domains and must reuse findings rather than re-researching blindly.

## 3. M-series-specific reconciliation, *early*, in parallel with B1D/UX/CPP

**M-SIM-00 — Inventory and preserve source (start immediately, alongside B1D security repair).**
- Locate each available M03–M15, M16 and M16P module, supplements and any Trollskull/Waterdeep world runtimes, logs, maps, event/schedule ledgers, original M03–M16 dependencies, W-series identities/links, source manifests, approval snapshots and Save overlays. Search designated user-supplied sources, Libraries and actual accessible workspaces; **never infer missing files exist or invent contents**.
- Register original path/hash/version, source/provenance/licence, authoritative scope, intended subsystem, implementation status, unresolved gaps, migration dependency, and **what existing V2 code already covers**. Historical PASS/LOCKED labels mean source-programme acceptance only, not active V2 simulation.
- Preserve canonical IDs, distinct campaign baseline vs Save mutations, future planned vs occurred events, DM secrets and named NPC continuity.

**M-SIM-01 — Domain contract and dependency matrix.**
Create an evidence-based crosswalk from each actual M source/record type to generic Python engines and UI views: world clock/calendar; locations and links/maps; journey graph/movement; weather/season; daily/weekly routines; visitors/appointments; business hours/services/inventory; factions/reputation/resources; rumour delivery and hearsay; news/press/publication; quest/event conditions; laws/guilds/economy; DM secrets. Do not invent mappings by M-number. For each define data inputs, triggers, authority, secret audience, frequency, cost, R1 patch, state ownership, tests and acceptance.
- Reuse existing `v2_npc_cognition.py`, world scheduler, spatial engine, graph/FTS5, authoring store, approved R1 clocks and Director where applicable; **do not add duplicate subsystem owners**.

**M-SIM-02 — Generic deterministic processors (vertical incremental implementation).**
Implement missing processors by need and source-backed priority; start with **clock/calendar + travel/visitor routines + weather + rumour delivery**, then factions/reputation, scheduled news/press, settlements/economy, and additional conditional quests. This is a sequencing recommendation, not a fabricated mapping to specific M files. Event sources are committed and scoped; consumers subscribe/derive through validated R1 proposals, idempotent per event and world-minute; clocks don't advance offline except under approved policy; users must be able to inspect causal provenance.
- Rumour propagation must be **person-to-person/location-to-location**, allow delays, misleading reports and uncertainty; never a faction hive mind or universal truth.
- Newspapers must have publisher, publication schedule, permissible sources, editorial reliability, issue identifier and audience, not omniscient prose. Weather and travel alter relevant journeys/encounters/visits without scripting every decision into an LLM prompt.
- Realtime gameplay and low-resource 4–6 GB GPU machines: deterministic idle processing without ongoing LLM inference; batch bounded progress, queue only meaningful narrative/planning with provider-agnostic models.

**M-SIM-03 — Cross-system, real-play interoperability.**
Test a genuine imported source-backed day: weather changes a permitted route/travel duration; a visitor's arrival shifts; a faction reacts to an authorised player event; information travels through witnesses and time; a newspaper publishes only facts/reports the publisher learned; an event/quest clock fires only when its predicates hold. Ensure role-specific narrator/DM/player projections, isolated alternate Saves, pause/restart/replay, no duplicate visits/articles/rumours, and deterministic receipts. Real Windows app and 4–6 GB RAM/VRAM performance evidence required.

**M-SIM-04 — M16 / CPP-05 content activation & portability.**
CPP-00..03 inspect/validate/admit, CPP-04 exposes native Pack Manager, CPP-05 converts/imports approved actual M data into a genuine licensed/provenance-pinned **Waterdeep** `.vadpack`, *without source modifications*. M16/M16P convergence and W02D identity links become explicit regression records when available. Import **must not** advance time, grant knowledge, activate future Fireball/Blue Alley beats, or overwrite an active Save. Confirmed future plans remain future until event triggers commit. Also import a second unrelated lawful campaign to prove genericity.

**PARALLEL, NOT REPLACEMENT:** B1D critical authority corrections first for code writes; HARVEST-02-C source research/map import and UX-02..05 improvements may proceed in parallel; M-SIM-00/01 inventory and harvest discovery start NOW; M-SIM-02 production world processors depend on relevant authority/pack DTO gates. Monster Step 51 and CP017B remain held independently.

## 4. Specific HARVEST-03-MSIM research targets

| Domain | Search/select MIT code worth evaluating | What must remain ours |
|---|---|---|
| Time/calendar | recurring schedules, event queues, calendar windows, cron-like predicates | one minute Master World Clock and Save-owned event truth |
| Weather | Markov/seasonal climate, seeded regional transitions, weather impacts | approved setting profiles, world event and source provenance |
| Travel/maps | route graphs, graph search, transport schedule/delays, topology/UVTT parsers | Python authoritative scene movement, no-crop artwork, approved travel rules |
| Visitors/businesses | appointments, timetables, inventory stock/resource accounting | canonical NPC identities, knowledge, R1 commits |
| Factions | graph influence, reputation, weighted utility/goals | distinguish faction public stance and individual NPC knowledge |
| Rumours | bounded graph diffusion, evidence provenance, delayed message delivery | facts vs beliefs vs unverified hearsay, strict ACL |
| News/press | publication cadence, templates, issue IDs, source reconciliation | editorial knowledge limits, no DM-secret leakage |
| Quest/events | DAG prerequisites, conditions, discrete-event simulation, idempotency tests | source-approved pending events, no auto-activation on pack import |

Reuse permissions are verified per file. Keep the working engines, consider existing Lorekeeper/Parth components before fetching alternatives, and add external APIs/dependencies only with explicit suitability/security justification.

## 5. Evidence-based progress and future payoff

**As of 2026-10-29:** M-series source inventory/activation and end-to-end weather/factions/press/travel simulation are **NOT independently verified in V2**. B1C claimed 456 passing Python and 147 frontend tests; independent B1D source review still flags world-action role, trusted stealth, recovery privilege and receipt consistency issues. Never describe M-SIM as completed based on this instruction.

**If M-SIM-00..04 passes with actual sources, generic processors, validated pack admission and real game acceptance**, VadAllFate would close a **major fraction of the Goal 3 living-world and Goal 5 portability gaps**, and materially advance Goal 6 campaign gameplay. It would *not* automatically close Goal 1's SRD 5.1 monster/combat Step 51 hold; all class/spell complexity; Goal 4 UI usability/design acceptance; Goal 7 secure multi-device LAN; or Goal 8 hardware/model/voice soak and scalability. **No overall completion percentage is validated by this programme.**

## 6. Immediate Antigravity sequence and deliverables

1. Continue **B1D P0** role/action trust repairs; do not turn on unreviewed world mutators.
2. Open **M-SIM-00 source inventory** and **HARVEST-03-MSIM MIT discovery** in parallel. Deliver concrete source inventory, module-to-runtime matrix, copy/adapt decisions, licence SHA evidence and first safe implementation batch. Missing M sources must be reported clearly and requested by exact artifact name/owner, not invented.
3. Select one **small cross-system vertical slice** after trust gates: a weather/scheduled visitor/travel/rumour progression ending in player-safe news or an approved event. Implement and play it through Windows UI with R1 receipts, restart, replay and role projections.
4. Preserve current frontend UI layout governance (D Hybrid Cockpit only a recommendation), authentic Blue Alley asset hold, Starlit Revels actual named content acceptance, no extra DB and no speculative source licensing.
5. Update the master goal scorecard, source/harvest register and V2 implementation registers with **INSPECTED / ADAPTED / AUTOMATED / REAL APP / HUMAN ACCEPTED** and verified tests. Commit/push development branches only.

**Product acceptance:** a human can load and run the preserved Waterdeep campaign, see weather/time/travel/visitors/factions/news/rumours respond coherently to committed actions, restart, and load a different lawful campaign with the same underlying Python systems—without manually editing source code.
