# COMBAT-R1-01 review handoff

Paired review branch `agy/v2-combat-r1-01`. Bases: backend `e0e5b988d78358f60ce0ebc55c8a7e90eee3e0cb`, frontend `5fe326eeb4d4a0e04256dc2efbdd96a2191dd911` (`codex/v2-storage-align-04`). Exact published heads are delivered separately, avoiding self-referential commit identifiers. No main merge, `STORAGE-ALIGN-05` merge, or production activation.

## Delivered scope

`COMBAT-R1-01` reconciles the Step 51 Node/SQLite source-bound combat damage resolver (`feat/srd-51-combat-mechanics`, draft PR #47, commit `fcba77c504b4bc26eb3d38fcda83569e52328ca2`), the Step 51 `CMB` review evidence (`docs/evidence/CMB-*.json`, commit `f6d247e182e24e637238a8c18b4739dc4ba2d8ac`), the legacy Python combat mechanics (`src/vadallfate/runtime/v2_combat_mechanics.py`), and the accepted `STORAGE-ALIGN-04` R1-authoritative six-layer encounter system (`src/vadallfate/runtime/storage_align/play_rules.py`).

Instead of rebuilding combat from scratch or blanket-activating all 334 SRD 5.1 monsters:

1. **Step 51 Matcher Discrepancy Closed**: Enforces `matcher_kind == 'exact'` deterministically across schema, pattern validation, candidate binding, damage-field parsing, and runtime damage resolution (`COMBAT-R1-01.PROVIDER.v1`). Any `'regex'` or unknown matcher is refused fail-closed (`unsupported-matcher`).
2. **Real Source Column & Provenance Binding**: Verifies `data/vadallfate_srd51.sqlite` (`919857e19f0cc6bf0255045e8cc3d56f5c9c9e24da3921e07940a1749caf77a2`) read-only (`mode=ro`, `PRAGMA query_only=ON`) using actual monster JSON fields (`resistances`, `immunities`, `vulnerabilities`, `ac`, `hp`) and exact `entity_id`, `entity_key`, `source_record_id`, `raw_sha256`, and `ruleset='SRD-5.1'` pins. Zero 2024 ruleset mixing occurs.
3. **Individually Reviewed SRD 5.1 Monster Subset (`6/334` Approved, `328/334` Held)**:
   - **Approved (`combat_ready=True`)**: `srd51:monster:37` (Bandit), `srd51:monster:210` (Ogre), `srd51:monster:256` (Skeleton), `srd51:monster:10` (Adult Red Dragon), `srd51:monster:108` (Gargoyle), and `srd51:monster:316` (Wight).
   - **Explicitly Reviewed & Held (`combat_ready=False`)**: `srd51:monster:101` (Fire Elemental — reactive `Fire Form` + `Water Susceptibility`) and `srd51:monster:1` (Aboleth — `Mucous Cloud` + `Probing Telepathy` + `Enslave` + legendary actions).
   - **Unreviewed & Held (`combat_ready=False`)**: Remaining `326/334` SRD 5.1 monsters fail closed with `REJECTED_MONSTER_COMBAT_HOLD`.
4. **Pure Rules Provider Inside Single Commit Authority**: `COMBAT-R1-01.PROVIDER.v1` (`src/vadallfate/runtime/storage_align/combat_provider.py`) has zero SQLite write connection and cannot mutate state directly. All encounter starts, turn advances, attacks, damage calculations, condition toggles, balm heals, physical roll confirmations, and defeat records are admitted, staged, and committed solely through `CommitAuthority` into the active `SAVE` (`save-a.sqlite` or `save-b.sqlite`).
5. **Expanded >3 Combatants & Shared-Source Instance Isolation**: Supports 3 to 8 participants mixing PCs (`instance.v1.ada`, `instance.v1.ben`), original CC0 training NPCs, and multiple runtime instances spawned from the same SRD 5.1 monster definition (e.g., two `srd51:monster:256` Skeletons) with independent HP, conditions, trust, and memory histories.
6. **Deterministic Mechanics, Qualifiers & Defeat Continuity**:
   - Deterministic initiative (`1d20 + initiative_bonus` sorted descending by `(initiative, initiativeBonus, entityId)`), round counter increment after a full cycle, and per-turn `actionUsed` / `bonusActionUsed` economy.
   - Attack rolls (`1d20` or `2d20` for advantage/disadvantage with cancellation when both apply), natural 1 automatic miss, natural 20 automatic hit + critical damage dice doubling (flat modifier added once).
   - Unconditional and conditional damage modifiers (`magicalWeapon`, `silvered`, `adamantine`, `spellDamage`) with SRD 5.1 floor division (`math.floor(raw / 2)` for resistance, `raw * 2` for vulnerability, `0` for immunity, and resistance+vulnerability cancellation) and structured `ruleExplanation` audit output.
   - Defeated NPCs (`0 HP`, `Unconscious`) retain their UUID identity, relationship edges, and memory history (`sa_npc_memories`), and emit a bounded `COMBAT_NPC_DEFEATED` causal proposal (`facet='PROPOSED'`) without writing to `STORAGE-ALIGN-05` scheduler internals.

See [harvest and crosswalk](COMBAT-R1-01-HARVEST-AND-CROSSWALK.md) for the four-source inspection table, monster coverage matrix, and provider architecture.

## Real Windows / Edge journey

Actual headed Edge against the owned Python/React launcher passed the complete SRD 5.1 encounter journey and full Python/React shutdown/restart recovery:

- DM browsed the catalogue (`228` definitions: `220` original CC0 + `8` reviewed SRD 5.1 entries), inspected `srd51:monster:256` (Skeleton), spawned two distinct Skeleton instances, and recorded a pre-combat dialogue memory on Skeleton #1 while Skeleton #2 retained zero memories.
- DM spawned `srd51:monster:108` (Gargoyle) and `srd51:monster:101` (Fire Elemental, explicitly HELD). Attempting to start an encounter with the held Fire Elemental was refused fail-closed (`HTTP 400`), leaving `combatState.isActive === false`.
- Invited player (`actor.ada`) logged in via a separate browser context, verified DM secret/memory isolation (`403` on `/content/history`), requested a d20 check, and reported a physical roll (`18`) that remained `PENDING_CONFIRMATION` until DM approval.
- DM started a 5-combatant encounter (`Ada`, `Ben`, `Skeleton #1`, `Skeleton #2`, `Gargoyle`).
- During turn-by-turn resolution:
  1. Nonmagical `steel_longsword` slashing attack against `Gargoyle` rolled raw damage `7`, which `COMBAT-R1-01.PROVIDER.v1` halved via conditional resistance (`RESISTANCE_HALF_FLOOR`) to `3` damage (`HP 52 -> 49`).
  2. `adamantine_warhammer` bludgeoning attack against `Gargoyle` rolled raw damage `7`, bypassing conditional nonmagical/non-adamantine resistance (`UNMODIFIED`) for full `7` damage (`HP 49 -> 42`).
  3. `iron_mace` bludgeoning attack against `Skeleton #1` rolled raw damage `7`, which doubled via unconditional bludgeoning vulnerability (`VULNERABILITY_DOUBLE`) to `14` damage, defeating `Skeleton #1` (`HP 13 -> 0`, `Unconscious`) while `Skeleton #2` (sharing `srd51:monster:256`) remained untouched at `13/13 HP`.
- Encounter ended cleanly; defeated `Skeleton #1` retained its pre-combat memory and relationship history.
- Save B (`save-b.sqlite`) against identical baselines retained zero spawned NPCs, original character HP (`12/9`), and zero encounter history.
- All five baseline SQLite files (`world.sqlite`, `rules.sqlite`, `adventure.sqlite`, `campaign.sqlite`, `homebrew.sqlite`) and `data/vadallfate_srd51.sqlite` retained byte-identical SHA-256 hashes before and after the journey and restart.

## Acceptance matrix (Gates 1–14)

| Gate | Requirement | Result / Evidence |
| :--- | :--- | :--- |
| **Gate 1** | Step 51 matcher parity (`exact` only; `regex` refused) | **PASS**: `test_gate1_step51_matcher_parity_exact_only_and_regex_refused` |
| **Gate 2** | Negative modifier & parser refusals | **PASS**: `test_gate2_negative_modifier_and_parser_refusals` |
| **Gate 3** | Unverified / held monster refusal (`Fire Elemental`, `Aboleth`, 326 unreviewed) | **PASS**: `test_gate3_srd51_source_verification_and_held_monster_refusal` + UI E2E refusal |
| **Gate 4** | Expanded encounter (>3 participants, up to 8) | **PASS**: `test_gate4_5_6_expanded_encounter_shared_source_instances_and_turn_economy` + 5-combatant UI E2E + 6-combatant proof |
| **Gate 5** | Shared source instances (`srd51:monster:256` x2 independent state) | **PASS**: `test_gate4_5_6...`, `test_gate10_11_12...`, and UI E2E (`skel1` 0 HP / 1 memory vs `skel2` 13 HP / 0 memories) |
| **Gate 6** | Initiative, turn order, round counter, action/bonus economy, move refusal | **PASS**: `test_gate4_5_6_expanded_encounter_shared_source_instances_and_turn_economy` |
| **Gate 7** | Natural 1 miss, Natural 20 hit & critical dice doubling | **PASS**: `test_gate7_8_9_mechanics_modifiers_qualifiers_and_conditions` |
| **Gate 8** | Advantage, disadvantage & condition cancellation | **PASS**: `test_gate7_8_9_mechanics_modifiers_qualifiers_and_conditions` |
| **Gate 9** | Resistance, immunity, vulnerability & conditional weapon qualifiers | **PASS**: `test_gate7_8_9_mechanics_modifiers_qualifiers_and_conditions` + UI E2E |
| **Gate 10** | Digital HMAC sampler & two-stage physical roll confirmation | **PASS**: `test_gate10_11_12_physical_combat_confirmation_defeat_memory_and_save_isolation` + UI E2E |
| **Gate 11** | Defeated NPC memory retention & `COMBAT_NPC_DEFEATED` proposal | **PASS**: `test_gate10_11_12_physical_combat_confirmation_defeat_memory_and_save_isolation` + UI E2E |
| **Gate 12** | Save A vs Save B isolation & immutable baseline SQLite hashes | **PASS**: `test_gate10_11_12...`, `tools/combat_r1_01_proof.py`, and UI E2E |
| **Gate 13** | Connected Windows/Edge journey & full process restart recovery | **PASS**: `e2e/combat-r1-01.spec.ts` (journey + restart phases) & `e2e/storage-align-04.spec.ts` |
| **Gate 14** | Process-death crash recovery (`after_admission`, `after_stage`, `after_state_write`, `after_commit`) & pre-admission provider fault | **PASS**: `test_gate14_combat_process_death_and_exact_retry_recovery` (4 `os._exit(99)` boundaries) + `test_gate14_provider_fault_before_admission_leaves_save_clean` |

## Reproduce

In the backend checkout, generate a disposable population with the reviewed SRD 5.1 subset mounted:

```powershell
.venv/Scripts/python.exe scripts/storage_align_population.py --count 220 --srd --control "$env:COMBAT_CONTROL"
$c = Get-Content $env:COMBAT_CONTROL -Raw | ConvertFrom-Json
./scripts/start-vadallfate-v2.ps1 -StorageAlignRoot $c.root -ApiPort 8896 -UiPort 3196 -SkipOllama
```

Validation commands:

```powershell
.venv/Scripts/python.exe -m pytest tests/test_combat_r1_01.py tests/test_storage_align.py tests/test_storage_align_sources.py tests/test_storage_align_entities.py tests/test_storage_align_population.py -q
.venv/Scripts/python.exe tools/combat_r1_01_proof.py
```

Frontend validation:

```powershell
npm test -- --run
npx tsc --noEmit
npm run build
```

## Remaining holds

- **Step 51 Unreviewed / Complex SRD 5.1 Monsters (`328/334` Held)**: Only the 6 independently reviewed SRD 5.1 monsters (`srd51:monster:37`, `210`, `256`, `10`, `108`, `316`) are combat-enabled. The 2 explicitly held monsters (`srd51:monster:101` Fire Elemental, `srd51:monster:1` Aboleth) and 326 unreviewed monsters remain fail-closed (`REJECTED_MONSTER_COMBAT_HOLD`).
- **Held Combat Mechanics**: Multiattack sequences, saving-throw AoE/breath weapons (`Fire Breath`), multi-type compound damage riders (`Bite` piercing + fire, `Life Drain` max-HP reduction), reactive start-of-turn/melee-contact damage auras (`Fire Form`, `Mucous Cloud`), spatial grid movement/range/cover/line-of-sight (`PLAY_MOVE`), opportunity attacks, concentration checks, death saving throws, and legendary/lair actions remain explicitly held and fail closed.
- **Preserved Programme Holds**: `I8` legacy Save conversion, `CP009B` R1 schema pack hold, `CP017B` 5e.tools master mount, and `STORAGE-ALIGN-05` living-world scheduler internals remain untouched.

STOP after `COMBAT-R1-01` for independent acceptance.
