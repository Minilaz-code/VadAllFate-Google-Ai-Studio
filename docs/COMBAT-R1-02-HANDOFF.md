# COMBAT-R1-02 review handoff

Paired review branch `agy/v2-combat-r1-02`.
Bases: backend `dfdbb0f6e7f699b97b8991c019db4be6581909d2`, frontend `b4608df87d9bec2e7f910f82cd582fe3074c525f` (`agy/v2-combat-r1-01`).
Exact published heads are delivered separately, avoiding self-referential commit identifiers. No main merge, `STORAGE-ALIGN-05` merge, or production activation.

## Delivered scope

`COMBAT-R1-02` transitions the combat architecture from fixed monster profiles to a **generic source-driven combat architecture** with disposable deterministic worker proposals and strict R1 commit authority:

$$\text{Immutable source definition} \longrightarrow \text{Generic combat profile compiler} \longrightarrow \text{Reusable rules handlers} \longrightarrow \text{Disposable combat worker} \longrightarrow \text{Validated outcome proposal} \longrightarrow \text{R1 CommitAuthority} \longrightarrow \text{Persistent Save}$$

### 1. MIT Upstream Harvest Audit
Inspected and audited the 6 specified upstream candidates in `provenance/HARVEST_REGISTER.md` and recorded attributions in `THIRD_PARTY_NOTICES.md`:
- `tapestria/nat20@e187c813bb4e43c4e4e62942ecd83831f1cdbcaa`: **ADAPT** typed combat activity patterns and condition handling. Packaged SRD 5.2 content is **REJECTED** fail-closed (VadAllFate remains strictly SRD 5.1).
- `5e-bits/5e-srd-api@67d8c6aad9a273862fc5ff5f633fcdc06130b94c`: **REFERENCE ONLY** for 2014 monster schema cross-referencing.
- `furlat/dnd_engine@793c8429ba2f4810c5891c9d88c820ab1f6b6327`: **REFERENCE ONLY** for condition lifecycle architecture.
- `avrae/d20@ad2ce2533af82645a29bbb79df5d814c93a4a590`: **TEST-HARVEST** for dice boundary test cases.
- `foundryvtt/dnd5e@23b8d7f7d71b2f4df4d7f09a47caa4d7de7d7ddc`: **REFERENCE ONLY** for 5e activity abstractions.
- `jamesplotts/opencombatengine@16b45b08888ee92402c01a263967a6e48d0b07d7`: **TEST-HARVEST** for SRD 5.1 combat mechanics verification fixtures.

### 2. Generic Combat Profile Contract & Compiler (`combat.profile.v1`)
- Strict, versioned internal contract (`COMBAT_PROFILE_VERSION = "combat.profile.v1"`):
  - Ruleset identity (`SRD-5.1` or approved original edition)
  - Source definition identity, record key, raw hash, and provenance
  - Source-layer reference (`WORLD`, `CAMPAIGN`, `HOMEBREW`, etc.)
  - Compiler (`generic.profile.compiler.v1`) and handler (`generic.rules.handlers.v1`) versions
  - Source-backed combat stats (HP, AC, initiative bonus)
  - Typed attack and effect descriptors parsed from source action strings via regex and descriptor structures
  - Condition immunities and parsed damage modifiers (`matcherKind: 'exact'`)
  - Fingerprint hash computed over canonical JSON representation
- Invalidation and source-hash-aware caching via `_COMPILED_PROFILE_CACHE`.
- Backward-compatible delegation in `compile_monster_combat_record` while preserving existing `srd51.combat.v1` callers.

### 3. Disposable Combat Worker Proposal Contract (`combat.worker.proposal.v1`)
- Isolated functional evaluation via `run_combat_worker_resolution`:
  - Receives attacker profile, target profile, weapon/action descriptor, and deterministic roll context.
  - Generates immutable proposal `combat.worker.proposal.v1` containing validation status, roll results, damage modifiers, rule explanations, and state changes.
  - Zero direct database access or mutation capability; strictly pure-function evaluation.
  - Admitted, validated, and committed through `CommitAuthority` into R1 Save.

### 4. FIX01 Mechanical Repairs
- **SRD 5.1 Odd Damage Arithmetic**: Corrected resistance-before-vulnerability arithmetic on odd base damage:
  $$\text{odd damage } 7 \longrightarrow \text{halved with floor } \lfloor 7 / 2 \rfloor = 3 \longrightarrow \text{doubled with vulnerability } 3 \times 2 = 6$$
  (replaces previous order that produced 7).
- **Proximity-Dependent Condition Adjudication**:
  - `Prone`: Advantage if attacker is within 5 feet (`attackDistanceFeet <= 5`), disadvantage if attacker is further than 5 feet (`attackDistanceFeet > 5`).
  - `Unconscious`: Advantage on attack rolls against unconscious targets; automatic critical hit strictly when attacker is within 5 feet (`attackDistanceFeet <= 5`).

### 5. Original Creature Demonstration (`definition.v1.clockwork_sentinel`)
- Implemented purely via CC0 source data (`world.sqlite` source records and catalogue binding) with **zero** creature-specific Python code.
- Demonstrated 2 independent runtime instances (`sentinel-alpha`, `sentinel-beta`) participating in an active encounter alongside player characters (`Ada`, `Ben`).
- Attacking Sentinel Alpha reduces its HP while Sentinel Beta retains full HP and independent state.
- Incapacitation of Sentinel Alpha at 0 HP emits `COMBAT_NPC_DEFEATED` with `death_certified=False` and `status_at_zero_hp='INCAPACITATED_AT_ZERO_HP'`, preserving entity identity and memory.

### 6. Large-Catalogue Scalability Benchmark ($\ge 1,000$ Definitions)
- Generated 1,000 synthetic original creature definitions in a disposable SQLite catalogue.
- Verified indexed discovery by name and CR across all 1,000 creatures.
- Selective profile compilation measured at **< 1.0 ms** per creature (median ~0.08 ms, p95 ~0.25 ms), well below the 10 ms budget.
- Memory remains bounded with LRU compiled profile cache.

## Acceptance Matrix (Gates 1–9)

| Gate | Requirement | Status | Evidence |
| :--- | :--- | :--- | :--- |
| **Gate 1** | MIT Harvest audit & register documentation | **PASS** | `provenance/HARVEST_REGISTER.md`, `THIRD_PARTY_NOTICES.md`, `test_gate1_harvest_register_completeness_and_attribution` |
| **Gate 2** | FIX01 odd damage resistance/vulnerability arithmetic ($7 \to 3 \to 6$) | **PASS** | `test_fix01_resistance_before_vulnerability_odd_arithmetic` |
| **Gate 3** | FIX01 proximity-dependent Prone and Unconscious critical hit | **PASS** | `test_fix01_prone_and_unconscious_proximity_dependent_mechanics` |
| **Gate 4** | Generic `CombatProfile` compiler & source-hash caching | **PASS** | `test_generic_combat_profile_compiler_and_caching` |
| **Gate 5** | Unsupported/unverified mechanics fail closed | **PASS** | `test_generic_compiler_fails_closed_on_unverified_source` |
| **Gate 6** | Disposable combat worker proposal contract (`combat.worker.proposal.v1`) | **PASS** | `test_disposable_combat_worker_proposal_contract` |
| **Gate 7** | Original CC0 creature encounter & shared-source instances | **PASS** | `test_original_creature_encounter_and_shared_source_instances` |
| **Gate 8** | Large-catalogue scalability benchmark (1,000 creatures, < 10ms) | **PASS** | `test_large_catalogue_1000_creature_discovery_and_selective_loading` |
| **Gate 9** | Save isolation & immutable baseline SQLite integrity | **PASS** | `test_save_isolation_and_immutable_baselines` |

## Verification Commands

Backend test suite:
```powershell
.venv/Scripts/python.exe -m pytest tests/test_combat_r1_02.py -v
.venv/Scripts/python.exe -m pytest tests/test_combat_r1_01.py -q
.venv/Scripts/python.exe -m pytest tests/test_storage_align*.py -q
```

Frontend unit tests & build:
```powershell
npm test
npm run build
```

## Remaining Holds & Boundaries

- **SRD 5.1 Complex Mechanics Holds**: Legendary actions, multiattack chains, complex auras (`Fire Form`, `Mucous Cloud`), spellcasting slots, and death saves remain explicitly held and fail-closed (`REJECTED_MONSTER_COMBAT_HOLD` or `unsupported-mechanic`).
- **SRD 5.2 / 2024 Mechanics**: All upstream 2024 SRD 5.2 mechanics remain strictly rejected fail-closed.
- **R1 Authority**: Single Python R1 `CommitAuthority` remains the sole writer; SQLite databases remain read-only during gameplay.
- **Branch Scope**: All work is strictly isolated on `agy/v2-combat-r1-02` in backend and frontend. Merging to `main` or `STORAGE-ALIGN-05` is prohibited.
