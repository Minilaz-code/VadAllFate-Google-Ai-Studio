# VadAllFate — HARVEST-02: MIT Source Reuse Acceleration Plan

**Reviewed:** 2026-10-28. **Status:** FILE-LEVEL RESEARCH AND APPROVED INSPECTION QUEUE; NO THIRD-PARTY SOURCE HAS BEEN COPIED OR PORTED BY THIS DOCUMENT.  
**Current VadAllFate bases:** backend `64a2d949f9d38a6cd576d756670c6e0e58fa462f`, frontend `036db443951f22b69aa4760152b32ba6277b6586` on `v2/srd51-rules-browser`. Fetch latest heads before editing.  
**Governing requirements:** `docs/V2-MASTER-DEVELOPMENT-GOALS.md`, `docs/V2-NEXT-GATE-WINDOWS-GAMEPLAY-AND-AI-SCHEDULER-QA.md`, `provenance/HARVEST_REGISTER.md` (backend), `THIRD_PARTY_NOTICES.md` (backend).  
**Source baseline:** Antigravity's W0–W3 report claims secure artwork and frontend rendering, 416/416 backend and 147/147 frontend tests, real localhost play, clock-driven versioned NPC routines, but real Blue Alley source art, extended autonomous gameplay soak and complete SRD 5.1 monster coverage remain unaccepted. These numbers are Antigravity-reported; this harvest audit did not independently rerun local tests.

## Why harvest — and what NOT to replace

The best way to accelerate is to selectively transplant **small, tested algorithms, parsers, UI helpers, and validation fixtures** into existing VadAllFate-owned interfaces. Do not clone whole applications into our process. Keep Python R1 Single Commit Authority, one canonical writable SQLite campaign DB, unchanged verified SRD 5.1 read-only rules data, approved migrations, Five DM modes, provider-agnostic harness, native Chatterbox Nano and DM/player ACL. **Use upstream state handlers as behavioural references, never as a second authority.** In particular:
- No new SQLite DB from upstream code; no SQLAlchemy/Next.js DB service replacing ours.
- No client-side authority for movement, combat or fog. UI can preview only Python-approved outcomes.
- No implied licensing of D&D rules, SRD 5.2, proprietary modules, app art, music, sample adventures or upstream dependencies from the host repository's MIT code license.
- Apache-2.0 SagaSmith is already researched in HARVEST-01; it is *not MIT* and is therefore out of this MIT-only acceleration queue.

## Verified MIT source snapshots

Repository MIT LICENSE text was inspected for the following exact current main-branch commits. Re-pin at implementation, record author/copyright and diff each individual file.

| Ref | Repository | Pinned source SHA | Copyright in MIT LICENSE | Scope caution |
|---|---|---|---|---|
| LK | mfarme/lorekeeper | `7076adbdd97c6327dd2091f4cd711df2e5a32d7f` | Jacob Ferrari; Kaleb Lutterman (2026) | Fork of Open Dungeon; `docs/LICENSES.md` calls out separate SRD and other media/content permissions |
| PT | parththakkar106/AI-DnD | `7132d3442664eff6144fde68698a7c5a55eb35d8` | Parth Thakkar (2026) | Python, SQLAlchemy, FastAPI and hosted-platform parts may be tightly coupled |
| FV | Txpple/fvtt-mcp-dnd5e | `2a270481f394658bd2922398406802a0966a0cae` | Adam Dooley (2025); Txpple (2026) | Foundry V14 page API is not VadAllFate's native game-state authority; Foundry software/assets are separate |
| CP | cpuchip/dnd-tools | `d44300c3f5c66450dfb131602c76ba5603a559e9` | Michael Stufflebeam (2026) | Go code; rules default to SRD 5.2.1, not VadAllFate's verified SRD 5.1 |
| CT | ctavolazzi/AI-DnD | `b4abed0478c092437ef4ed075e7cabe1170555a0` | Christopher Tavolazzi (2025) | In-memory/SQLAlchemy state architecture incompatible with R1 |
| CH | chungs10/dnd-ai | `b4724a1cf2271d475766274dff3973fc68c46e5c` | chungs10 (2025) | Vendored `thirdparty/mem0/` has independent Apache and other dependency terms; exclude wholesale |

**Not MIT-verified / inspection only:** `Flo0806/dm-hero` and `heffrey78/dnd-mcp` have no LICENSE file in the current inspected tree and no GitHub licence field; **DO NOT COPY THEIR CODE** on current evidence even if older register says "MIT reported". Proprietary `dndai.app`, Owlbear/Smoke assets and non-licensed campaign content remain reference-only.

## Harvest queue — exact source modules and target seams

Decision statuses mean **candidate implementation strategy, not completed incorporation**: ADAPT = transplant isolated tested logic with notices and interfaces; PORT = language/contract translation while retaining source-derived attribution; TEST-HARVEST = adapt behavioural tests to existing owned implementation, no wholesale code copy; REFERENCE = learn but no code copied.

| ID | Priority | Source (at above SHA) | Reuse target & decision | Required boundary |
|---|---|---|---|---|
| H02-01 | **Now** | LK `src/lib/dm/fusion-logic.ts` | **PORT** ranked lexical + semantic retrieval, reciprocal rank fusion and MMR to Python context/knowledge retrieval | SQLite FTS5 authoritative source and audience-filter **before** ranking; no disclosure of undiscovered NPCs |
| H02-02 | **Now** | LK `src/lib/dm/context-budget.ts` | **PORT** per-section token budget and explainable context trace | True model-specific budget when available; bounded local Qwen fallback; preserve Context Compiler |
| H02-03 | **Now** | PT `backend/app/context/builder.py` and `context/history.py` | **ADAPT** fixed/dynamic prompt sections, triggered cards, history truncation and prompt-inspector evidence | Map to VadAllFate Python harness; no new SQLAlchemy or provider stack |
| H02-04 | **Now** | PT `backend/app/memorybank.py` and `summaries.py` | **ADAPT/TEST-HARVEST** time/version-scoped memory compaction, memory settling after rerolls, summary rewind | Existing R1 revision/branch/save and actor knowledge determine validity; no async sidecar canonical writes |
| H02-05 | **Now** | PT `backend/app/context/lineage.py` | **TEST-HARVEST** inherited-branch reads and non-overlapping narrative ancestry | Adapt to VadAllFate Save branching/contracts; do not import its SQLAlchemy query model |
| H02-06 | **Now** | PT `backend/app/worldstate/apply.py` + `backend/tests/test_worldstate.py` | **PORT selective** stat clamping, per-turn caps, milestone monotonicity, reject-reason telemetry | Apply as validation library to existing R1 StatePatch and typed domains; never use loose prose as authority |
| H02-07 | **Now** | LK `src/lib/dm/npc-logic.ts` + `scripts/test-npc-agency.mjs` | **PORT** bounded six-axis personality, bonds, relations, goals and pressure counter mechanics | Python NPC cognition, knowledge/beliefs vs facts, single SQLite R1 events, no passive world-state mutations |
| H02-08 | **Now** | LK `src/lib/dm/npc-agency.ts` | **ADAPT design/tests** deterministic chapter/timeskip NPC decision loop with injected rolls | Extend stored `npcRoutines` and world clock, not a second JS NPC authority |
| H02-09 | **Now** | LK `src/lib/dm/world-tick-logic.ts` and `world-arc-logic.ts` | **PORT** quiet escalation clocks, accumulated pressure, DM-only event sparks/rumours | Existing Master World Clock and authorised scheduler; seeded/replayable mechanical RNG, avoid unconsented random encounters |
| H02-10 | **Now** | LK `src/lib/dm/fusion-logic.ts` + `src/lib/dm/context-retrieval.ts` | **TEST-HARVEST** proper-noun retrieval and mixed embedding/keyword ranking tests | No hidden-source document ranking leaks |
| H02-11 | **Soon** | LK `src/lib/dm/narration-guard.ts` + `src/lib/dm/engine-boundary.ts` | **ADAPT design** flag narration contradicting committed HP/dice/slots, request bounded repair | No automatic rewriting of the committed fact ledger |
| H02-12 | **Soon** | LK `src/lib/dm/world-lore-logic.ts`, `lore-backlinks.ts` | **TEST-HARVEST** bounded knowledge links and role-specific backlinks | Existing native Obsidian-like graph/Markdown; check edges/names/counts against player secrecy |
| H02-13 | **Map batch** | LK `src/lib/battlemap/uvtt.ts` + `scripts/test-map-uvtt.mjs` | **ADAPT** UVTT/DD2VTT JSON validation, grid origin/ratio, wall-edge/door/light parsing, malformed-source tests | Convert into VadAllFate *vector wall segments*, not Lorekeeper's tile-based authoritative map; high-res Blue Alley no crop; DO NOT import its fixed 64-tile ceiling |
| H02-14 | **Map batch** | LK `src/lib/battlemap/paint.ts`, `scene.ts`, `backdrop.ts` | **ADAPT selective** smart editing, corridor connectivity and safe transform validation | Proposed geometry stays DM-approved; Python owns accepted geometry, not browser painting |
| H02-15 | **Map batch** | LK `src/lib/battlemap/los.ts`, `movement.ts`, `footprint.ts` | **TEST-HARVEST** LOS/cover, visibility, 2D multi-cell collision regression | Python spatial_engine remains one authority; frontend may preview but can't choose outcomes |
| H02-16 | **Map batch** | LK `src/lib/battlemap/serialize.ts` | **ADAPT** compact actor/map summary for local AI prompt budgeting | Server-authored observer-specific visible region only; no omniscient grid or DM geometry leakage |
| H02-17 | **Optional Foundry** | FV `src/page/scenes.ts`, `src/page/_placeables.ts` | **ADAPT for external adapter only** Foundry scene, wall, token and CRUD validation | Do not import Foundry's state authority into VadAllFate; Foundry V14 compatibility tests |
| H02-18 | **Soon** | FV `src/page/_ops.ts` + `src/page/_ops.test.ts` | **ADAPT** exhaustive read/write/delete tool capability table and dry-run guard | Python tool RBAC / Commit Authority must independently enforce each op |
| H02-19 | **Rules validation** | CP `internal/rules/rules.go` + `internal/rules/rules_test.go` | **TEST-HARVEST** ability/proficiency/skill modifiers, XP edge cases and sheet-check behaviour | Different SRD 5.2.1 defaults cannot replace SRD 5.1; adapt **tests only** where consistent |
| H02-20 | **Rules validation** | CP `internal/sheet/sheet.go` | **REFERENCE** attack/check explanation text and physical-dice-friendly roll requests | No Go runtime bridge and no new rules DB; user may enter physical raw faces |
| H02-21 | **Cloud safety** | PT `backend/app/netguard.py` + `backend/tests/test_netguard.py` | **ADAPT** SSRF public-vs-local provider endpoint restrictions | Local Ollama on localhost must continue to work; DNS rebinding/redirect checks added |
| H02-22 | **Low** | CT `backend/app/models/event.py` and `backend/app/services/game_state_manager.py` | **REFERENCE only** event chronology and integrity tests | In-memory second state + SQLAlchemy schema clash with R1; no direct copy |
| H02-23 | **Low** | CH `src/simpleMemory/memoryQueue.py` | **REJECT copy** — trivial 20-line bounded list, already achievable in current Context Compiler | No performance/quality win; do not vendor `thirdparty/mem0` tree |
| H02-24 | **Low** | CT `backend/app/services/game_service.py` | **REJECT copy** — independent state/service manager | Collides with R1 and actor ownership |

## Fast, isolated implementation batches (commit and test one batch before another)

### Batch A — Context and retrieval (**highest immediate leverage**)
Inspect H02-01..06, H02-10, H02-11, H02-21. Prototype **one** permission-safe retrieval service that uses our SQLite FTS5/knowledge graph plus optional embeddings with reciprocal rank fusion and an explainable bounded Context Compiler trace. Build tests from source examples: rare NPC names, contradictory lore, old memories, pending vs confirmed plans, restricted facts. Never inject a proposed or private note as confirmed public state.

### Batch B — World cognition and Director
Inspect H02-07..09 and H02-12. Add approved NPC routine goals, relationships and episodic memory to current Python scheduler; deterministic world-pressure/arc clocks feed DM-only events and later bounded AI context. Run two NPCs with distinct beliefs and schedules, then expand to lawful imported Starlit Revels cast. Preserve conditional trigger holds and per-NPC knowledge.

### Batch C — Map importer and precision editor
Inspect H02-13..16 and LK tests, prepare an optional UVTT/DD2VTT importer and geometry-proposal overlay, subject to the previously deferred MAP-A..E approval and current Blue Alley acceptance. **Do not replace the existing zero-crop VTT or Python A* engine.** Prioritise high-res preserved artwork, grid calibration and imported wall/door coordinates; geometry only becomes authoritative after DM approval via R1.

### Batch D — Rules test harvest and tool security
Use CP modifier/check tests for SRD-5.1-consistent cases and FV operation-classification tests for explicit AI/DM tool capability tables. Never port SRD 5.2 rules wholesale or Foundry-specific runtime code into our Python core.

### Batch E — Optional Foundry export adapter (future)
Only after native Blue Alley and role-filtered play work: implement external Foundry scene/token/wall adapter using FV's tested formats and permission principles. It is an adapter, never a required dependency or a second world owner.

## Mandatory source extraction workflow

1. Open the current VadAllFate target and test baseline; identify exact missing behaviour, not just a matching class name.
2. Pin upstream **full Git commit SHA**, source file, dependency chain, licence/copyright and applicable notices **before copying**; verify any upstream file headers and generated/bundled assets separately.
3. Choose `COPY`, `ADAPT`, `PORT`, `TEST-HARVEST`, `REFERENCE ONLY`, or `REJECT` with concrete reason, code path and expected benefit.
4. Pull the **smallest viable source function/module** and compatible test fixture, not an entire framework or service. MIT source copying is allowed with required notice retention; do not assume unrelated dependencies/assets share MIT.
5. Add a **source-provenance header** to adapted files and a full entry in `provenance/HARVEST_REGISTER.md`, including module path, pinned SHA, target implementation and licence. Update `THIRD_PARTY_NOTICES.md` **only after actual source code has been incorporated**, including the full required MIT notice/copyright.
6. Keep Python writes passing `ActionEnvelope → SnapshotRef → Rules/StatePatch → Validation → CommitRequest → CommitReceipt`; imported modules must never write SQLite directly, override ACLs, alter frozen schemas without migration or launch parallel GPU model jobs.
7. Run module tests plus end-to-end negative, secrecy, replay, rollback, restart, 4–6 GB VRAM budgeting, and actual Windows UI tests relevant to integration. Make test outcomes and provenance auditable.
8. Update the implementation register: inspected ≠ copied ≠ tested ≠ human accepted. Commit changes on V2 development branches only; no force pushes or `main` merges.

## First Antigravity action (without waiting for another huge architecture milestone)

Produce a **HARVEST-02-A PR/checkpoint** covering H02-01, H02-02, H02-03 and a narrow H02-06 validation seam:
- Map every current Python Context Compiler/retriever function and existing tests before edits.
- Identify the smallest reusable MIT-licensed algorithms and their actual input/output contracts.
- Implement hybrid FTS5/lexical + semantic rank fusion, explainable context budgets, and decision traces, but only through existing authorised knowledge queries.
- Demonstrate improvement on long-memory and NPC knowledge fixtures, with no source-ACL leaks.
- Source-pin and preserve notices for any adapted code.
- Do not let this delay or reclassify Blue Alley real-map acceptance, Step 51 combat, native TTS, or existing W0–W3 holds.

**Success measure:** demonstrably faster implementation of an existing master goal with correctly scoped, tested reused algorithms, rather than a large cloned codebase or a larger test count.
