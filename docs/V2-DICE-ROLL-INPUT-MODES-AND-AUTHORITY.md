# VadAllFate V2 — Digital, Physical and DM Dice Input Modes

**Decision:** 2026-10-28  
**Status:** APPROVED PRODUCT REQUIREMENT / FUTURE IMPLEMENTATION — NOT YET IMPLEMENTED OR TESTED  
**Scope:** Python R1 campaign/rules runtime, bounded AI DM, React Play/Host and Combat Tracker, role-aware multiplayer, journals/events.  
**Companion:** V2 architecture, player-experience rebuild, spatial stress test, and Milestone 12B dice-security gate.

## Governing principle

**Python is authoritative over rules, permissions, consequences, and canonical Save — not over the physical origin of every die roll.** Users must be able to roll their own physical dice, report **raw die faces**, and have Python authoritatively compute hit/miss, modifiers, criticals, damage, saving throws, recovery and state changes. Physical reports are explicitly user-reported, not cryptographically verified random rolls. They are supported gameplay actions, not unscoped DM state overrides.

Support **mixed rolls in one encounter**:

1. **SERVER_DIGITAL:** Python generates verifiable-replayable but player-unpredictable die faces from server-controlled randomness; no public state-hash plus user-selected nonce exploits.
2. **PLAYER_PHYSICAL:** player reports raw die faces for an authorised, pending roll request; Python validates the range/quantity/type and computes consequences.
3. **DM_PHYSICAL / DM_ENTERED:** authorised DM records physical rolls for NPCs, secret checks or another player; record who physically rolled and who entered.
4. **DM_ADJUDICATED_OVERRIDE:** explicit, separately labelled DM override of an outcome if rules or an agreed table decision require it; not disguised as a physical dice submission.

Dice source must be a choice at the **roll-request** level (with host policy and character preferences), not a security bypass embedded in `ATTACK_ACTION`, `CAST_SPELL`, `SKILL_CHECK` or other action payloads.

## Session trust policy

- `ALLOW_MIXED_HONOUR_SYSTEM`: home/tabletop default. The host allows player-reported physical dice, clearly marked `PLAYER_REPORTED_UNVERIFIED`, with normal rules validation but no pretence of verifying the physical face.
- `REQUIRE_DM_CONFIRMATION`: a physical roll remains pending until the verified DM confirms the faces/intent. No damage, HP or spell slot mutation is applied before approval if the action is configured as staged.
- `SERVER_DIGITAL_ONLY`: physical rolls not accepted in that session or roll category.
- The Host/DM can configure per-character preferred mode, permitted roll kinds, visibility and overrides; role enforcement is server-side.
- A player may choose or change the dice method **before** a roll is resolved. Do not permit switching or resubmitting solely after observing an unfavourable digital result.
- Hidden/DM-secret rolls and PvP may use an explicit stricter confirmation policy. Never expose secret results or trigger metadata to players.

## Workflow

1. Python creates a versioned, idempotent, state-pinned `RollRequest` defining campaign/save, action ID and intent, roller/actor identity, origin/role, dice formula and allowed faces, advantage/disadvantage, modifiers from rules, targets or hidden-context references, visibility, chosen source, host policy and expiry/revision guards.
2. UI displays a clear **Roll Digital / Use Physical Dice** choice only if authorised. For physical: show required dice (e.g., 2d20 advantage, 2d6 weapon damage), fields to enter the individual faces, and `Submit Roll`.
3. Player enters only the observed faces, not arbitrary bonus, target AC, final damage, crit flag or chosen outcome. Python validates each face against the dice expression (1..sides), number of dice, allowed rerolls/advantage, request ID, session identity, pending state, idempotency and current commit/revision. The report is explicitly logged as `PLAYER_REPORTED_UNVERIFIED`.
4. If the policy requires DM confirmation, show it in the DM queue with `Approve / Correct-with-reason / Reject / Request Re-roll` actions. No effect is prematurely committed.
5. Python combines the accepted raw faces with approved actor modifiers, proficiencies, target AC/DC, critical rules, damage and resources to produce the canonical rules outcome and CommitReceipt. Report the same result in narrative, combat tracker, character sheet and event/roll ledger. Use proper Co-DM staging/veto semantics.
6. Digital rolls use server-controlled randomness with committed RNG seed/counter or equivalent secret-bound proof that supports deterministic replay and recovery **without exposing future predictable outcomes to a player**. No external input or model-generated JSON can overwrite digital dice.
7. AI DM/NPC Interpreter tools can **request** a roll, pause their scene until a confirmed roll result arrives, then narrate from the committed outcome. They cannot invent a player roll or directly mutate state. Paused requests persist across disconnect/restart if appropriate.

## Dice coverage and 5e semantics

Include d4/d6/d8/d10/d12/d20/d100, dice pools, advantage/disadvantage, critical weapon dice, saving throws, ability/skill checks, initiative, attacks, damage, healing, death saves, hit dice, percentile/table rolls and mixed-source multi-stage actions. For example: player physical d20 + Python-calculated hit; if hit, physical damage dice + Python modifier and resistance applied; each stage independently tracked.

Dice notation and rules must derive from verified SRD/character/approved homebrew definitions. Greatsword 2d6 critical is 4d6 plus modifier once. Multiple dice entered individually; no user-supplied totals taken as verified faces. If a roll is unknowable or held (Step 51 monsters), do not pretend mechanics were resolved.

## Security, replay and provenance

- Record roll source, face array, dice expression, request/receipt refs, roller identity, submitter identity, optional DM confirmer, visibility, world minute, timestamp, RNG proof/seed reference (digital only), and origin `PLAYER_REPORTED_UNVERIFIED` vs `SERVER_GENERATED` vs `DM_CONFIRMED`.
- A die face in range is a syntactically valid **claim**, not proof the physical die actually landed there. For honest home games, trust is a table policy; stricter tables can require confirmation or a digital roll.
- Protect against nonce gaming, replay, double submission, roll-request forgery, invalid count/sides, prefilled future hidden checks, caller switching actor, conflicting concurrent actions and role privilege escalation.
- Keep all authoritative mutations in `ActionEnvelope → SnapshotRef → Rules/StatePatch → Validation → CommitRequest → CommitReceipt`, compatible with R1 recovery and the single writable campaign SQLite. Migrate schemas only through approved versioned migration paths. No direct client SQL or second authoritative DB.
- Do not conflate `roll accepted` with `action succeeded`; an accepted miss or failed saving throw is valid and canonical.

## Required UI/acceptance

- Every character can select default rolling preference if host allows; each pending roll has a clear physical vs digital path before roll.
- Thor example: physical d20=14; Python applies attack bonus (e.g., +7) vs target AC; on hit, player enters a physical d8 result=5; Python applies modifier (e.g., +4) and commits 9 damage. Example numeric modifiers are illustrative, not canonical campaign facts.
- Two players in one battle use different roll sources, DM rolls NPC attacks digitally or physically, and all results appear with honest provenance. Character sheets/HP/slots agree, including after restart.
- Human-primary Co-DM DM-confirmation flow and Full-AI DM paused tool-request flow are tested end to end.
- Player attempts to submit forged final totals or out-of-range faces are rejected; legitimate physical faces are accepted when permitted. Tests include duplicate/replay, stale request, switching after a digital result, secret knowledge and role leakage.
- **Do not mark built** until backend code, frontend UI, unit/integration tests and real Windows multiplayer/tabletop acceptance exist.

## Milestone 12B impact

Update Milestone 12B's RNG security section to explicitly implement this first-class physical dice contract as part of combat/playability requirements. **Do not simply strip all client rolls**: distinguish a trusted rules-resolution pipeline from permitted user-reported dice faces. Keep other Milestone 12B priorities (spatial secrecy, restart persistence, coordinate contracts, layout governance) unchanged.
