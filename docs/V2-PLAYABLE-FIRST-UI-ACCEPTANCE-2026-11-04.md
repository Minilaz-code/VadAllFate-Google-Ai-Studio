# V2-INTEGRATE-01 — React Playable-First UI Acceptance Contract
**Date:** 2026-11-04. **Status:** PROPOSED FUTURE INTEGRATION GATE; not permission to integrate held combat code.
**Cross-repository authority:** Python R1 only; see backend playable-first roadmap.

## Existing UI to reuse
- App.tsx already attempts the Python gateway and distinguishes live/disconnected/auth/explicit demo.
- CharacterSheetModal, PlayerCharacterView, CombatTracker, LiveRollPanel, NarrativePlayView, VirtualTabletop and AdventurePlayPanel exist; do not duplicate these just to satisfy the first milestone.
- Source ContentPlayPanel/CampaignManager already has exact world/adventure pack discovery, native campaign/Save selection and source NPC interactions in its V2 path. Layered R1 has narrower feature profiles and developer flags.
- Player-facing rules must query the live read-only SRD 5.1 reference endpoint; no demo or AI substitution for a successful production lookup.

## P1 required human journey
1. Start the verified Windows launcher with backend and React; do not use -Demo or ?demo=1 or depend on developer-only ?storageAlign=2.
2. Show clear backend connection and host-auth status. Authenticate and select or create an authorised campaign and existing persistent Save.
3. Display at least one real character sheet, opponent, valid initiative order, turn and supported attack options from an actual server projection.
4. Query a real SRD 5.1 rule and show grounded source/version. Capture valid digital or physical rolls under server policy.
5. Submit an attack; display the canonical receipt, dice and rules evidence, hit/damage, current HP, initiative advance and stable event/attack log.
6. Attempt at least one negative action (wrong actor/role, stale snapshot, untrusted worker outcome or unsupported mechanics); show genuine refusal without changing HP or secrets.
7. Stop both processes completely and restart. Recover identical Save revision, HP, turn and log; no silent demo switching. Prove distinct Save A/B and player/DM projections.
8. Capture authenticated headed Microsoft Edge evidence and have the human host verify the experience on the intended hardware.

## Explicit non-goals for P1
Full city simulation, imported M16, general PDF/PPTX/Obsidian conversion, NPC voice, AI Director autonomy, internet multiplayer, full D&D spell coverage, full spatial movement and UI redesign. These remain tracked and may progress independently, but cannot be mislabeled as implemented.

## Following player UI gates
- Connected NPC source-backed dialogue with role-filtered canonical memory retrieval; honest Qwen live/fallback and no secret leakage.
- R1 player-owned inventory, spell slots/conditions/rest/progression with consistent character sheet on phone and PC.
- Source Manager with world/adventure/campaign/homebrew choice and preview/approval/version-pinned Save binding.
- Secure host invite/assigned character, phone/tablet responsive UX, reconnection and remote transport only after network/asset ACL review.
- DM Planning/Homebrew notebook/graph/Canvas and source-assisted PDF/CSV/MD/PPTX/JSON adapters only after independent publication boundaries.

## Evidence and stop
Do not infer the full milestone from a Playwright mock, screenshot, demo receipt or backend unit suite. Require actual accepted backend head, live REST snapshots and native receipts. Report author-tested vs CI-tested vs independently accepted vs human accepted separately. STOP if a frozen contract change or unaccepted combat/source branch is required.
