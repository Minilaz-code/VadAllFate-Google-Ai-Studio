# VadAllFate — Milestone 12B: Secure Digital + Physical Dice, VTT Trust and Persistence Gates

**Decision:** 2026-10-28. **Status:** APPROVED EXECUTION BRIEF — not an implementation sign-off.

Continue from backend implementation baseline `d083dac` and frontend implementation baseline `dc97082` on `v2/srd51-rules-browser`. **Fetch latest development branches before modifying files**: physical-dice requirement was subsequently documented in backend `f50b684` and frontend `cfed173`. Preserve concurrent/uncommitted work and docs. Do not overwrite other changes, force-push or merge main.

**Mandatory companion spec in both repositories:** [V2 Dice Roll Input Modes and Authority](V2-DICE-ROLL-INPUT-MODES-AND-AUTHORITY.md). Preserve R1 single Commit Authority, versioned contracts, existing holds and all working features. Milestone 12A improvements should be built upon, not rewritten.

## 1. Dice authority: support both digital and physical dice

**Principle: Python owns rules and canonical consequences, NOT necessarily the generation of every die face.** Preserve the existing hardening against forged digital dice outcomes while allowing players to deliberately roll real physical dice and enter raw faces.

Implement first-class roll requests, with server-side policy, explicit source and persistent auditable receipts.

- `SERVER_DIGITAL`: server-controlled random dice that are unpredictable to the player and deterministic/replayable under protected R1 proof/recovery. The current public state-hash + user-controlled nonce design permits outcome shopping; replace with appropriate server-secret/seed/counter authority.
- `PLAYER_PHYSICAL`: a verified player submits **individual raw die faces** for an authorised pending roll request. Python validates die count/range, actor/ownership, expected action, rules formula, request freshness, idempotency and permissions; Python calculates bonus, success/failure, damage, HP, spell slots and conditions. Do not ask the player to supply arbitrary attack modifiers, AC, final hit totals, damage modifiers or desired outcome.
- `DM_PHYSICAL`: an authorised DM enters their own NPC/hidden dice faces or explicitly enters on behalf of a player. Record roller and submitter separately; preserve hidden result visibility.
- `DM_ADJUDICATED_OVERRIDE`: keep explicit, separately logged DM outcome override, not a disguised physical-dice entry.

**Trust modes:** `ALLOW_MIXED_HONOUR_SYSTEM` (physical player reports allowed, labelled `PLAYER_REPORTED_UNVERIFIED`), `REQUIRE_DM_CONFIRMATION` (player report staged until DM approves) and `SERVER_DIGITAL_ONLY` (host disables physical reports). Per-character preference may default mode, but host policy wins. Offer choice **before** any roll is resolved, with no selecting/replacing digital dice after seeing an unfavourable result.

**Two-stage flow:** Python issues pinned `RollRequest` for an attack/check/save/etc.; UI offers Roll Digital or Use Physical Dice if permitted; physical mode asks only for faces (e.g. one d20, 2d20 advantage, 2d6 greatsword, critical additional dice), with natural number inputs and clear formula; pending DM confirmation where policy requires it; Python resolves exact SRD/character/homebrew rules and commits outcome by R1. Ability checks, saves, initiative, attack, damage, healing, death saves, hit dice, percentile and spell dice must be designed into the contract even if rollout is incremental. No unsupported Step 51 monster resolution.

**AI DM:** can request a dice roll and suspend its pending action or narration until user/DM provides a valid result; then resumes based on committed outcome. No fake AI-generated physical faces, no direct model DB writes.

**Full audit:** source (server-generated / player-reported / DM-reported / DM-confirmed), raw faces, dice formula, actor, submitter, optional confirmer, time, campaign/save, action & RollRequest IDs, visibility, result and CommitReceipt; physical-die values are claims, not cryptographically provable. Reject invalid sides/count, stale/mismatched requests, forged identity, unsolicited results, double submission, mode-switch exploitation, and client-supplied final outcomes. Support mixed dice modes in one encounter.

**Critical correctness:** obtain weapon dice and modifiers from authoritative rules/character state; greatsword = 2d6 before critical (4d6 on critical, flat bonus once); correct advantage/disadvantage, rerolls and resistance as approved. Test Thor's example as illustrative only: physical d20 14, server bonus +7, AC17 => hit; physical d8=5 plus +4 => 9 damage. No example modifiers are canonical without actual character data.

## 2. Spatial secrecy and projection isolation (preserve original 12B requirement)

Audit Python `get_projection` and React `BattlemapSessionManager.hydrateFromBackendProjection`. No player may receive hidden walls/rooms/tokens/traps/windows, metadata, confidential image assets or spoilers from full source background art. A player session must not keep DM geometry cached from a previous identity/role; explicit role-switch isolation and fresh-player serialization/browser tests. Authoritative secrecy is enforced server-side, not by React hiding. Avoid filtering geometry without considering original map image content. Preserve DM complete view.

## 3. Genuine VTT restart persistence (preserve original 12B requirement)

Prove from real Windows application: import arbitrary image file; persist protected image asset server-side (not `blob:` only); independently calibrate grid without crop; save wall/door/fog/token/map geometry and state through R1; stop processes; restart/reconnect; confirm exact artwork, grid, actor positions, geometry, visibility and Save isolation. Treat original Blue Alley map acceptance as pending until provided; generated fixture is representative only. False `COMMITTED` UI feedback forbidden.

## 4. Spatial integration readiness (preserve original 12B requirement)

Audit consistent canonical grid/world coordinates across React and Python. Existing Python `MOVE_TOKEN` 30x30 restrictions and React percentage coordinates need explicitly versioned SP-00..SP-03 migration, not silent re-interpretation. Do not claim collision/pathfinding/AI spatial movement completed yet.

## 5. Layout governance (preserve original 12B requirement)

Proposal D Hybrid Cockpit is recommended but **not yet user approved**; preserve proposals A/B/C/D. No wholesale visual redesign without user approval. Essential gameplay fixes and physical dice UI may be implemented without changing the whole layout.

## Verification and delivery

Run backend and frontend unit/integration/security tests, adversarial nonce and physical-report input tests, restart tests, and a genuine browser flow showing both digital and physical dice in one encounter, DM confirmation if enabled, and state synced across character sheet/combat/narrative after restart. Report what is implemented vs not, and test evidence honestly; do not mark user acceptance passed from unit tests. Respect all holds and don't introduce a second authoritative DB.

Update implementation registers and this milestone brief, commit and push verified changes to the existing V2 branches, no merge to main. Surface blockers and partial outcomes rather than hiding them.
