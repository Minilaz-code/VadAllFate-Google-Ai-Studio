# VADALLFATE V2 — COMBAT-R1-01 Harvest & Authority Crosswalk

## 1. Executive Summary

`COMBAT-R1-01` reconciles the Step 51 Node/SQLite source-bound combat damage resolver (`feat/srd-51-combat-mechanics`, draft PR #47, commit `fcba77c504b4bc26eb3d38fcda83569e52328ca2`), the Step 51 `CMB` review evidence (`docs/evidence/CMB-*.json`), the legacy Python combat mechanics (`src/vadallfate/runtime/v2_combat_mechanics.py`), and the accepted `STORAGE-ALIGN-04` R1-authoritative six-layer encounter system (`src/vadallfate/runtime/storage_align/play_rules.py`).

Rather than rebuilding combat from scratch or activating all 334 SRD 5.1 monsters blindly, `COMBAT-R1-01`:
1. Closes the Step 51 SQL vs JS `matcher_kind` discrepancy by enforcing `matcher_kind == 'exact'` deterministically across pattern validation, candidate binding, damage-field parsing, and runtime damage resolution.
2. Uses the real `vadallfate_srd51.sqlite` (`919857e19f0cc6bf0255045e8cc3d56f5c9c9e24da3921e07940a1749caf77a2`) monster column names (`resistances`, `immunities`, `vulnerabilities`, `raw_json`, `raw_sha256`, `source_record_id`, `entity_id`, `entity_key`, `ruleset='SRD-5.1'`).
3. Publishes a reviewed, hash-verified SRD 5.1 monster subset into the `RULES` (`combat_review`) and `WORLD` (`definition`, `catalogue_binding`) layers while holding unreviewed and reactive/multi-stage monsters fail-closed.
4. Places all combat rules evaluation behind a versioned deterministic provider (`COMBAT-R1-01.PROVIDER.v1` in `src/vadallfate/runtime/storage_align/combat_provider.py`) that has **zero** SQLite write handle and **zero** direct mutation path: every turn, initiative order, attack roll, damage calculation, condition change, balm heal, and defeat consequence is committed solely through `CommitAuthority` into the active `SAVE` (`save-a.sqlite` or `save-b.sqlite`).

---

## 2. Four-Source Inspection & Authority Crosswalk

| Source / Asset | Inspected Files & Commits | Harvested / Reused Capabilities | Replaced / Rejected Patterns & Why |
| :--- | :--- | :--- | :--- |
| **1. Step 51 Node Combat Implementation (`feat/srd-51-combat-mechanics`, PR #47)** | Commit `fcba77c504b4bc26eb3d38fcda83569e52328ca2`:<br>- `src/combat/damage-Catalog.cjs`<br>- `src/combat/damage-field-parser.cjs`<br>- `src/combat/pattern-library.cjs`<br>- `src/combat/candidate-binder.cjs`<br>- `src/combat/trusted-damage-resolver.cjs`<br>- `src/combat/combat-damage-decision.cjs`<br>- `src/db/migrations/002_combat_damage_verification.sql` | - Canonical 13 SRD 5.1 damage types (`acid`, `bludgeoning`, `cold`, `fire`, `force`, `lightning`, `necrotic`, `piercing`, `poison`, `psychic`, `radiant`, `slashing`, `thunder`).<br>- Exact reviewed damage pattern library (`plain_single_damage_type_v1`, `plain_damage_type_list_v1`, `nonmagical_Each_bps_v1`, `nonmagical_non_adamantine_bps_v1`, `nonmagical_non_silvered_bps_v1`, `magical_or_silvered_exception_v1`).<br>- Deterministic qualifier evaluation (`magicalWeapon`, `silvered`, `adamantine`, `spellDamage`) and fail-closed `review-required` / `rejected` semantics.<br>- SRD 5.1 integer division rounding (`math.floor(raw / 2)` for resistance, `raw * 2` for vulnerability, `0` for immunity, cancellation when both resistance and vulnerability apply). | - **Closed Discrepancy**: `002_combat_damage_verification.sql` constrained `CHECK(matcher_kind = 'exact')`, whereas `pattern-library.cjs` / `trusted-damage-resolver.cjs` allowed `['exact', 'regex']`. `COMBAT-R1-01.PROVIDER.v1` enforces `matcher_kind == 'exact'` everywhere (`regex` is rejected fail-closed).<br>- **Closed Field Name Gap**: Uses real `vadallfate_srd51.sqlite` columns (`resistances`, `immunities`, `vulnerabilities`) rather than synthetic `damage_resistances` / `damage_immunities` / `damage_vulnerabilities` aliases. |
| **2. Step 51 `CMB` Review Evidence** | Commit `f6d247e182e24e637238a8c18b4739dc4ba2d8ac`:<br>- `docs/evidence/CMB-01-SCHEMA-PROVENANCE-2026-03-26.json`<br>- `docs/evidence/CMB-02-PARSER-COVERAGE-2026-03-26.json`<br>- `docs/evidence/CMB-03-RESOLVER-PARITY-2026-03-26.json`<br>- `docs/evidence/CMB-04-CANDIDATE-BINDING-2026-03-26.json`<br>- `docs/evidence/CMB-05-FINAL-REVIEW-GATE-2026-03-26.json` | - Provenance binding model: every reviewed monster record binds `entity_id`, `entity_key`, `source_record_id`, `raw_sha256`, `database_sha256`, `reviewer`, `review_category`, and `review_hash`.<br>- Explicit separation between complete/verified modifier coverage (`combat_ready=True`) and held/incomplete coverage (`combat_ready=False`). | - Synthetic/in-memory test fixtures in `CMB-01..05` are augmented with real row-level verification against `data/vadallfate_srd51.sqlite` (`verify_srd51_database_against_reviews`). |
| **3. Legacy Python Combat Mechanics** | `src/vadallfate/runtime/v2_combat_mechanics.py` | - Initiative roll + dexterity/initiative bonus ordering with deterministic tie-breaking.<br>- Attack roll d20 resolution: natural 1 automatic miss, natural 20 critical hit (doubling weapon/attack damage dice count before adding flat modifier), advantage/disadvantage (`max`/`min` of 2d20, or cancellation to 1d20 when both apply).<br>- Condition modifiers on attacks (`Prone`, `Poisoned`, `Restrained`, `Blinded`, `Unconscious`). | - **Rejected**: Direct mutation of monolithic campaign JSON state (`state["characters"]`, `state["npcs"]`, `state["combatState"]`) and unreviewed string-split substring matching on NPC stat blocks. All state changes now emit bounded `sa_values` records through `CommitAuthority`. |
| **4. Accepted `STORAGE-ALIGN-04` R1 Encounter System** | `src/vadallfate/runtime/storage_align/`:<br>- `play_rules.py`<br>- `population_publication.py`<br>- `population_application.py`<br>- `entity_application.py`<br>- `model.py`<br>- `runtime.py` | - Six-layer precedence (`SAVE > HOMEBREW > CAMPAIGN > ADVENTURE/REGION > WORLD > RULES`; existing `mounts.py` resolver preserved unchanged).<br>- R1 `CommitAuthority` pipeline (`prepare` -> `admit` -> `dispatch_head` -> `stage_worker_result` -> `commit`) and exact persisted idempotent retry recovery.<br>- Server-generated digital dice (`HMAC-SHA256` from host secret + `campaign_id` + `action_id` + `snapshot.state_hash`) and two-stage physical dice confirmation (`PENDING_CONFIRMATION` -> `PLAY_APPROVE_ROLL` / `PLAY_REJECT_ROLL`). | - Extended participant cap from `2..3` (`original.training.v1` only) to `3..8` (`original.training.v1` + reviewed `srd51.combat.v1`).<br>- Extended turn state to track per-turn `actionUsed` and `bonusActionUsed`.<br>- Added per-character R1-pinned equipment loadouts (`sa.loadout.v1` in `combat_loadout`), rejecting client-supplied qualifiers (`magicalWeapon`, `silvered`, `adamantine`, `spellDamage`, `damageType`) and client `advantage`/`disadvantage` flags (`dmAdjudicatedRollMode` + `dmAdjudicationReason` required for manual DM rulings).<br>- Added `PLAY_HEAL` (bonus-action balm consumption), `PLAY_MOVE` explicit fail-closed refusal (`SPATIAL_COMBAT_UNSUPPORTED`), and `COMBAT_NPC_DEFEATED` causal proposal (`facet='PROPOSED'`, `status_at_zero_hp='INCAPACITATED_AT_ZERO_HP'`, `death_certified=False`). |

---

## 3. Reviewed SRD 5.1 Monster Coverage & Hold Register

Database verified: `data/vadallfate_srd51.sqlite`
- **SHA-256**: `919857e19f0cc6bf0255045e8cc3d56f5c9c9e24da3921e07940a1749caf77a2`
- **Ruleset Edition**: `SRD-5.1` (D&D 5e 2014 SRD; zero 2024 ruleset mixing)
- **Total Monster Entities**: `334`
- **Approved for `COMBAT-R1-01` (`combat_ready=True`)**: `6`
- **Explicitly Reviewed & Held (`combat_ready=False`)**: `2`
- **Unreviewed & Held (`combat_ready=False`)**: `326` (Total Held: `328`)

### 3.1 Approved Monsters (`combat_ready=True`)

| Entity Key | Name | `entity_id` / `source_record_id` | `raw_sha256` | Category | HP / AC / Init | Damage Modifiers & Condition Immunities | Approved Attacks | Held / Unsupported Actions & Traits |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `srd51:monster:37` | **Bandit** | `58` / `58` | `1200a6fa...052e` | Simple humanoid, no damage modifiers | HP `11`, AC `12`, Init `+1` | None | `Scimitar` (`+3`, `1d6+1` slashing) | `Light Crossbow` (ranged distance/ammunition held) |
| `srd51:monster:210` | **Ogre** | `231` / `231` | `be5c6ab2...1517` | Multi-die melee brute (`2d8+4`), no modifiers | HP `59`, AC `11`, Init `-1` | None | `Greatclub` (`+6`, `2d8+4` bludgeoning) | `Javelin` (ranged distance held) |
| `srd51:monster:256` | **Skeleton** | `277` / `277` | `efc09608...39fc` | Unconditional vulnerability + immunity | HP `13`, AC `13`, Init `+2` | Vuln: `bludgeoning`<br>Imm: `poison`<br>Cond Imm: `Exhaustion`, `Poisoned` | `Shortsword` (`+4`, `1d6+2` piercing) | `Shortbow` (ranged distance held) |
| `srd51:monster:10` | **Adult Red Dragon** | `31` / `31` | `b2837228...fcb8` | Unconditional elemental immunity (`fire`) | HP `256`, AC `19`, Init `+0` | Imm: `fire` | `Claw` (`+14`, `2d6+8` slashing), `Tail` (`+14`, `2d8+8` bludgeoning) | `Multiattack`, `Bite` (multi-type rider), `Fire Breath` (AoE/recharge), `Frightful Presence`, `Legendary Resistance` |
| `srd51:monster:108` | **Gargoyle** | `129` / `129` | `78b75b02...6465` | Conditional `nonmagical_non_adamantine_bps_v1` + immunity | HP `52`, AC `15`, Init `+0` | Res: `bludgeoning, piercing, and slashing from nonmagical weapons that aren't adamantine`<br>Imm: `poison`<br>Cond Imm: `Exhaustion`, `Petrified`, `Poisoned` | `Bite` (`+4`, `1d6+2` piercing), `Claws` (`+4`, `1d6+2` slashing) | `Multiattack`, `False Appearance` |
| `srd51:monster:316` | **Wight** | `337` / `337` | `eda63f28...afaa` | Conditional `nonmagical_non_silvered_bps_v1` + unconditional resistance + immunity | HP `45`, AC `14`, Init `+2` | Res: `necrotic, bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered`<br>Imm: `poison`<br>Cond Imm: `Exhaustion`, `Poisoned` | `Longsword` (`+4`, `1d8+2` slashing) | `Multiattack`, `Life Drain` (max HP reduction rider), `Longbow`, `Sunlight Sensitivity` |

### 3.2 Explicitly Reviewed & Held Monsters (`combat_ready=False`)

| Entity Key | Name | `entity_id` / `source_record_id` | `raw_sha256` | Hold Reason |
| :--- | :--- | :--- | :--- | :--- |
| `srd51:monster:101` | **Fire Elemental** | `122` / `122` | `d69fdc1e...ec2a` | `HELD_MONSTER_TRAITS`: Reactive `Fire Form` (1d10 fire damage on melee hit within 5 ft / hostile space entry), `Touch` ongoing start-of-turn ignition damage, and `Water Susceptibility` require spatial/reactive triggers not approved in `COMBAT-R1-01`. |
| `srd51:monster:1` | **Aboleth** | `22` / `22` | `e050ae91...9e77` | `HELD_MONSTER_TRAITS`: `Mucous Cloud`, `Probing Telepathy`, `Tentacle` disease save rider, `Enslave`, and legendary actions require multi-stage save/charm/legendary automation not approved in `COMBAT-R1-01`. |

---

## 4. Provider Boundary & Six-Layer R1 Flow

```
Client / UI ActionEnvelope
   │
   ▼
Service._call (/api/v2/storage-align/action)
   │
   ├─► 1. CommitAuthority.storage_alignment('prepare')
   │      ├─► Read-only resolution across SAVE > HOMEBREW > CAMPAIGN > ADVENTURE/REGION > WORLD > RULES (mounts.py resolver preserved)
   │      ├─► Verify monster `definition` (WORLD) against `combat_review` (RULES) & SRD SHA-256
   │      ├─► Verify character `combat_loadout` (`sa.loadout.v1`) & reject client qualifier/advantage spoofing
   │      ├─► Invoke deterministic `COMBAT-R1-01.PROVIDER.v1` (pure function, zero DB handle)
   │      └─► Build bounded `ProofCommitRequest` (`StatePatch` <= 8 changed keys, < 64 KiB)
   │
   ├─► 2. CommitAuthority.storage_alignment('admit')      [persists `input_admissions` row]
   ├─► 3. CommitAuthority.dispatch_head()                 [assigns dispatch token]
   ├─► 4. CommitAuthority.stage_worker_result()           [persists staged `ProofCommitRequest`]
   └─► 5. CommitAuthority.storage_alignment('commit')     [single writer commits `sa_values`, `commit_receipts`, `runtime_events`]
```
