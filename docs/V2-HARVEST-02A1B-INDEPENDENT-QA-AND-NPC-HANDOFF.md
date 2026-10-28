# VadAllFate — HARVEST-02-A1B independent QA and NPC harvesting handoff

**Source-review date:** 2026-10-28. **Status:** SOURCE REVIEW + TARGETED CORRECTIVE BRIEF; no gameplay code was modified in this review.  
**Reviewed backend:** `c1051312a6a2094704554c06126f15e91aaf3be0`. **Reviewed frontend:** `e67f7e7c350fb3027f1fc68eb29e22c538cfe05c`. Fetch latest branch heads before editing.  
**Agent-reported test results:** 430/430 backend; 147/147 frontend; clean Vite build. NOT independently rerun by this reviewer.  
**Governing documents:** `V2-MASTER-DEVELOPMENT-GOALS.md`, `V2-HARVEST-02-MIT-REUSE-EXECUTION-PLAN.md`, `V2-HARVEST-02A-INDEPENDENT-QA-AND-GATE.md`, backend `provenance/HARVEST_REGISTER.md`, `THIRD_PARTY_NOTICES.md`.

## Verified improvements

- Ordinary zero HP is preserved, `tempHp` separated from `maxHp`, fake role-based single-damage/healing caps removed, and integer-state validation tightened in `v2_state_delta_validator.py`.
- DISPATCH_REQUIRED recovery now invokes `StateDeltaValidator.validate_patches` before staging its reconstructed result. A new INVALID-admission discard handler exists. Both require broader recovery-path evidence below.
- A SQLite FTS5 virtual table, query and permission-scoped graph lookup exist; the live harness calls them together with reciprocal rank fusion and local character/word n-gram similarity.
- Recent turn-history text is placed into context, and branch/save/revision labels are included. The model ranker needs accurate language: character n-gram similarity is **lexical/fuzzy similarity, not embedding-based semantic understanding**.
- MIT upstream provenance from Lorekeeper and Parth is recorded; no second rules database or new authority needs to be created.

## Corrective QA gates before labelling A1 fully closed

### A1B-01 — Close all recovery admission states (high)

`v2_campaign_gateway.py` branch `STAGED_NEEDS_VALIDATION` reads a staged `CommitRequest` and calls `authority.commit(staged_req,...)` directly; the new `StateDeltaValidator` is only called on the `DISPATCH_REQUIRED` branch. If the staged request was provably fully validated under an accepted immutable rule/version before staging, document and test that invariant; otherwise validate the staged writes before commit or rehydrate the validated proof securely. **Do not blindly re-synthesise a staged gameplay action**, and preserve R1 exactly-once semantics.

`DISPATCH_REQUIRED` reconstructs `actor_role` from `action_envelope.payload.get("actorRole")` with actor-ID fallbacks. Verify that durable admissions preserve authenticated role/owner evidence from the *original verified session*, and an attacker cannot influence privilege after restart by spoofing a payload role. Test authenticated player role vs forged `dm_host` on recovery, adverse override and cross-campaign receipts.

Test distinct crash boundaries: pending before dispatch; staged before commit; committed before response; invalid state-delta; restart in a *new* process; repeated replay. Use actual R1 commit receipts and original authoritative state, not just monkeypatching the validator to always reject.

### A1B-02 — Correct FTS5 ranking sign and search evaluation (high)

In `V2AuthoringStore.search_entities_fts5`, SQLite `bm25` score is sorted **ascending** (lower numerical value is a better BM25 match, often negative). `HarnessContextCompiler.compile` currently builds `fts_ranked` via `-fts_matches.get(node_id,0.0)`; this ranks many **unmatched zero-score nodes before matching negative-score entities**, and reverses relative match relevance.

Produce a matched-only list ordered by FTS result rank or `score` ascending. Ensure only matched authorised candidates contribute to this RRF ranking and that no-match/missing index entries do not gain fake ranked relevance. Add tests where two eligible candidates differ in BM25 score, plus one unmatched candidate, asserting the correct final retrieval.

### A1B-03 — Protect the indexed text and candidate counts (high)

`upsert_world_entity` indexes `public_summary + perceived_summary` into one full-text table; `KnowledgeQueryService.search_fts5` only filters result **URIs** against a visible graph. A player may see a permitted entity hit or changed ranking based on facts in a summary not actually visible to them. This is a possible existence/rank side-channel, even when the secret text is not returned.

Index genuinely shared, authorised content separately from DM/per-character projected private content. Before ranking or returning results, apply the same audience epistemic policy to the **indexed text and scoring source**, not just the entity ID. Verify a public NPC whose DM-only/per-character perception contains a secret keyword is not returned to other players for that secret keyword unless that knowledge was authorised. Never put `dm_secret_summary` in player-facing FTS. Do not replace R1 or create a second authoritative DB.

Current `search_fts5` projects a hard limit of 100 graph nodes and checks hits against that capped set. Prove safe recall for 500+/1000+ entities and avoid silently dropping legitimate matching results beyond the first 100. Add initial index backfill/rebuild for existing installations (creation currently indexes new `upsert_world_entity` events, not pre-existing rows), deletion and Save isolation tests. Migration must be approved and versioned, not silent schema replacement.

### A1B-04 — Fully integrate historical compaction and safe provenance (medium)

`StructuredHistoryBuffer` is imported but not actually called in the inspected `v2_ai_harness.py`; the harness instead builds flat `history_lines` and budget-truncates. Decide whether to adopt the harvested buffer for real rolling/historical compaction; do not mark it live until it is called and tested. Preserve event timestamps, Save/branch boundaries, revision cut-offs, per-player visibility and DM-secret history. A boolean `isDmOnly` alone may be insufficient for `known_by`, private player events, future actions or NPC-specific memory.

Test historical event A visible only to player X does not appear in player Y's narrator context or NPC Z's cognition. Never use unfiltered `state["events"]` as player context without authoritative event-scoped policies; validate branch/save provenance from stored event records rather than merely putting current branch labels in context headers. Ensure context trace/hash doesn't disclose secret node IDs.

### A1B-05 — Test semantics and quality claims (medium)

The no-cloud `SemanticSimilarityRanker` currently implements character and token n-gram cosine similarity. It is *not* a learned sentence-embedding semantic ranker; use labels like `offline fuzzy lexical similarity`. Optional local embeddings may be added behind a separate adapter with explicit benchmarks, but are not required for the immediate A1 closure.

Check actual mixed-mode/context retrieval against long session proper names, distinct similar NPCs, false allies, rumours vs facts, and character-specific knowledge. Ensure Context Compiler budget fits actual local Qwen model token limits rather than assuming character counts are tokens.

### A1B-06 — Validate full commit diff scope and accurate evidence (low)

The HARVEST-02-A1 commit shows very large changed-line counts in existing runtime files. Inspect `git diff --ignore-space-at-eol` (and/or `--ignore-all-space`) to distinguish formatting/line-ending churn from real logic. Keep future harvests small and reviewable; do not revert actual accepted code without need. Correct any statement that passing the validator tests proves named high-level spells were run under authentic SRD 5.1 mechanics; positive high-damage validation and full spell-resolution coverage are distinct.

## HARVEST-02-B — approved preparation concurrently, implementation after critical corrections

Pin Lorekeeper MIT source `7076adbdd97c6327dd2091f4cd711df2e5a32d7f` and inspect exact file-level dependency/test chains:
- `src/lib/dm/npc-logic.ts` / `scripts/test-npc-agency.mjs` — personality axes, bonds, relations, pressure counters, goals.
- `src/lib/dm/npc-agency.ts` — deterministic agency and role-safe world facts.
- `src/lib/dm/world-tick-logic.ts`, `world-arc-logic.ts` / `scripts/test-world-tick.mjs`, `scripts/test-world-arcs.mjs` — quiet off-screen world events and director notes.

**Adopt pure functions and tests, not an upstream DB/model runtime.** Map data to existing versioned Python NPC records, Master World Clock, R1 action and snapshot contracts, AI Director profile, player/DM perception and stored confirmed campaign plans. A player's lies, rumours, guesses and secret notes must never become universal NPC truth. Simple routine ticks must work without model inference; bounded AI is reserved for meaningful choices. No scheduler may write SQLite outside R1, advance multiple world minutes inadvertently, or fire an event before its verified conditions.

**Milestone demonstrator:** two NPCs with different knowledge/goals occupy the same real calibrated scene; a witnessed vs unwitnessed player action changes only permitted memories and a conditional world-arc event fires or remains pending appropriately. Reconnect, restart and verify facts, beliefs and positions survive. Then scale to 14 named Starlit Revels guests, but do not claim real campaign or long-session acceptance from synthetic fixtures.

### Execution discipline

1. Fix A1B-01 through A1B-03 and prove the truth/secrecy/recovery boundaries in tests. Other A1B refinements can be scoped by evidence and risk, without demanding a wholesale rewrite.
2. Run real backend suite plus targeted recovery/FTS/player-knowledge regression tests and local AI/Windows smoke checks where affected. Keep 430/147 as *prior reported* baselines, not guaranteed after additions.
3. Update `provenance/HARVEST_REGISTER.md` and `docs/V2-IMPLEMENTATION-REGISTER.md`. Add MIT notices **only if new upstream source is incorporated**; do not repeat unrelated notices.
4. Commit/push on `v2/srd51-rules-browser` only; no forced push or main merge.
5. Proceed with HARVEST-02-B as a narrow independent batch after critical A1B closure, without abandoning actual Blue Alley map, multiplayer, Step 51 or CP017B holds.

**Outcome:** fewer false completion claims, a genuinely accurate and secret-safe context engine, and faster safe reuse for real NPC cognition.
