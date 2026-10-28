# VadAllFate — HARVEST-02-A Independent Code QA and Acceptance Gate

**Review date:** 2026-10-28. **Status:** independent SOURCE REVIEW / remediation brief, not a runtime patch or local test sign-off.  
**Reviewed backend commit:** `48ae3ef4505be9fe7c0a641338166f4cfdf82ffb`. **Frontend:** `2f1b081bd1d78567473323ccc42852848a313cfc` (unchanged this batch).  
**Reported evidence, not rerun here:** 427/427 Python, 147/147 frontend tests, Vite build. New HARVEST-02-A tests exist (11), but passing them does not establish all 5e mechanics or recovery behaviour.  
**Related:** [Master Goals](V2-MASTER-DEVELOPMENT-GOALS.md), [Harvest-02 plan](V2-HARVEST-02-MIT-REUSE-EXECUTION-PLAN.md); backend `provenance/HARVEST_REGISTER.md` and `THIRD_PARTY_NOTICES.md`.

## Findings verified from committed source

**PASS — implementation and provenance:** New `v2_context_fusion.py` and `v2_state_delta_validator.py` exist, compiler invokes RRF/MMR and ContextBudgetManager, gateway invokes the delta validator before normal new-action R1 pipeline, and the extract register and full MIT notices for Lorekeeper and Parth are present. Six external MIT repos were vetted in the earlier plan; this first batch incorporated adaptations from **two** (Lorekeeper + Parth), not six full projects.

### BLOCKER A — normal action vs recovered action validation is not symmetric

`v2_campaign_gateway.py` normal `submit_action` invokes `self.state_delta_validator.validate_patches(...)` before `_execute_commit_authority_pipeline` (~line 6151). But `_recover_pending_admissions_internal` (~1790–1852) re-synthesizes `outcome.patches`, constructs `ValidationResult(valid=True)`, then stages/commits without invoking the new validator. This risks state or rules validity differing after a process interruption.

**Repair:** centralise a deterministic and auditable validation operation reused by live/recovery/other privileged commit paths, preserving R1 replay, frozen contracts, expected revision and admission lifecycle. Test the same invalid and valid patch under normal processing and crash/restart recovery with identical rules outcomes. Do not mutate frozen R1 schemas without a reviewed migration.

### BLOCKER B — current HP at zero treated as max HP

`v2_state_delta_validator.py` (~149) sets `cur_hp = int(target_char.get("currentHp") or max_hp)`. The value **0** is falsy, so a character at zero HP is treated as if they had max HP. This can falsely reject a legitimate heal or mis-classify a change as damage.

**Repair:** preserve explicit 0 vs missing/None; prefer typed authoritative HP source and test 0→1 healing, 0→max healing, 1→0 damage, unconscious/death-save flows and multi-patch order. Do not use `or max_hp` when zero is valid.

### BLOCKER C — temporary HP incorrectly increases ordinary HP cap

`v2_state_delta_validator.py` (~151 and ~251) allows `currentHp <= maxHp + tempHp`. Standard 5e **temporary HP is a separate pool** and doesn't increase maximum actual HP. For example ordinary HP 35 with maxHp30/tempHp5 must not be accepted as normal health.

**Repair:** validate `0 <= currentHp <= maxHp`; validate `tempHp` separately under verified rules, without converting it into extra real HP. Add both direct HP patch and campaign document tests. Only explicitly approved homebrew exceptions through versioned rules, not a blanket `dmOverride` bypass.

### BLOCKER D — arbitrary role-based HP change limits will reject legitimate mechanics

Validator defaults `max_single_damage_cap=120`, `max_single_healing_cap=100` for non-DM callers, irrespective of the verified dice expression, target max HP, spell/item effect or rules-approved high-level mechanic. A numerical cap is a poor substitute for action-specific rules authority and could reject valid damage/healing.

**Repair:** validate computed effects against trusted rules/characters and approved source/roll receipts; use sane technical anti-abuse limits for untrusted payload sizes, not universal D&D damage/healing ceilings. Preserve Step 51 monster coverage hold. Add high-level valid-effects cases and forged/outcome-manipulation cases to show both directions.

### REVIEW E — role/payload bypass scope

`is_explicit_dm_override` in the validator includes `forceMove`, `teleport`, `CONFIRM_DM_PLAN`, `IMPLEMENT_HOMEBREW`. Do not allow a movement flag or unrelated document action to waive HP/level/rules validation. Confirm overrides are tied to a specific approved mutation type, audited DM identity and recorded reason. Also inspect `int()` conversion of fractional HP/ability values and reject noninteger values rather than silently truncating.

### REVIEW F — incomplete AI harness claims

`v2_ai_harness.py` currently ranks up to 40 already-projected graph nodes using **simple keyword substring overlap** and **node-ID/focus/mention order**, then RRF and token-set MMR. It **does not invoke SQLite FTS5 search or an embedding similarity index** in the inspected compiler. Label current functionality `lexical + graph-order fusion`, not FTS5+semantic retrieval. Avoid substring false positives; evaluate rare NPC names, synonyms, ranking quality and truncation vs pre-harvest baseline.

`StructuredHistoryBuffer` exists in `v2_context_fusion.py` and is tested, but is not called from `v2_ai_harness.py` (no occurrence in that file). Do not mark H02-03 *live history integration* complete until it is wired into an authorised, revision/visibility-bounded turn history with persistent provenance. Keep the bounded context and role prefilter already integrated.

### REVIEW G — regression tests need game-realism

The new HP tests explicitly expect `maxHp + tempHp`, reflecting the erroneous rule. Revise tests to SRD 5.1 semantics, include actual 0 HP, real multi-stage healing/damage and prior/current state mismatches, normal vs R1 recovery parity, player vs DM authorization and full application restart. Ensure internal safety/validation tests do not construct the correct answer by mocking the validator into a rejection.

## Recommended next sequence

1. **HARVEST-02-A1 corrective checkpoint:** Fix BLOCKERS A–D, scope overrides, update misleading tests and reporting; run all tests and exact recovery-replay cases. Do not start new NPC cognition code until this passes.
2. **HARVEST-02-A2 context quality integration:** Wire versioned role-safe history where needed; add genuine FTS5 candidate retrieval and optional local-embedding ranking (with graceful no-embedding fallback); benchmark long-campaign NPC specificity/latency on small Qwen. Adapt only the existing knowledge layer, not a new DB.
3. **HARVEST-02-B:** Harvest Lorekeeper NPC agency, deterministic world ticks and event sparks selectively into Python scheduler **after A1 stability**. Extend real stored NPC routines, belief/knowledge ACL and Master World Clock; ensure all effects go through R1.
4. Preserve real Blue Alley source-map test, Starlit Revels long soak, five DM modes, Chatterbox Nano native, Step 51 monster combat and CP017B holds. No wholesale frontend redesign or merge to main.

**Acceptance levels:** source present ≠ automated correct ≠ local real application tested ≠ human-approved. Report partial results honestly. **No existing source code was changed by this document.**
