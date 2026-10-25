# VadAllFate Google AI Studio Frontend — V2 Integration Instructions

**Status:** Architectural instructions; UI/transport implementation is not claimed.  
**Canonical architecture:** https://github.com/Minilaz-code/VadAllFate/blob/main/docs/V2-ARCHITECTURE-INSTRUCTIONS-HARNESS-KNOWLEDGE-GRAPH.md

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
