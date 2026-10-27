# VadAllFate V2 — Frontend Delivery Programme & Architecture Specification

**Document Version:** 1.0.0 (Milestone 11A)  
**Date:** 2026-10-27  
**Status:** ACTIVE DELIVERY SPECIFICATION  
**Target Repository:** `Minilaz-code/VadAllFate-Google-Ai-Studio` (branch `v2/srd51-rules-browser`)  
**Backend Runtime Repository:** `Minilaz-code/VadAllFate` (branch `v2/srd51-rules-browser`)  

---

## 1. Executive Summary & Audit of User Experience Feedback

Following actual human-interactive testing on Windows, several critical player experience blockers were identified in `docs/V2-PLAYER-EXPERIENCE-VTT-AND-UI-REBUILD-BRIEF.md`. This Delivery Programme establishes the engineering plan, architectural boundaries, backend contracts, and verification gates to deliver a genuinely playable, ergonomic, and aesthetic tabletop RPG client.

### Immediate P0 Blockers Resolved in Milestone 11A:
1. **Connection Status Ambiguity:** The interface previously displayed demo controls even when the authoritative Python runtime was running. `Header.tsx` now explicitly displays the live connection status badge (`PYTHON V2 AUTHORITATIVE RUNTIME CONNECTED (R1 Single Commit Authority)` in pulsing green, or `DEMO MODE — IN-MEMORY STATE` in amber), accompanied by a one-click actionable toggle (`USE LIVE V2` / `USE DEMO`).
2. **Disconnected Narrative Feed:** Player-submitted text was previously recorded in the machine event log but failed to appear in the central story stream due to static `n1-n4` demo fixtures. `NarrativePlayView.tsx` now dynamically renders all chronological events with dedicated player utterance balloons, NPC replies from the authoritative AI Co-DM harness, DM narration, and dice roll summaries.
3. **Hardcoded Demo Labels:** Static Yawning Portal and Brother Vaelin headers were replaced with authoritative campaign context (`Highgate Harbor & Primara Cathedral`, `Scholar Jorren Vale`).

---

## 2. Workstream Breakdown & Implementation Specifications

### UX-02: Usable Character Sheets, Journal, and Combat Tracker

#### Objectives & Requirements:
- **Instant Discoverability:** Provide one-click access to the selected character's full sheet and personal/party notes from the active play view without navigating away.
- **Authoritative Combat Tracker:** Replace the static initiative strip with an interactive tracker displaying:
  - Initiative order and active turn indicator.
  - Per-combatant HP (Current / Max / Temporary).
  - Armor Class (AC), Conditions (e.g. *Poisoned*, *Concentration*), and Death Saves.
  - Spell slots by level (Used / Available).
  - Short/Long Rest resource recovery tracking.
- **Single Commit Authority Alignment:** All HP modifications, slot expenditures, and status changes submit typed `ActionEnvelope` records (`ATTACK_ACTION`, `CAST_SPELL`, `USE_ITEM`, `REST_ACTION`, `DM_OVERRIDE_STATE`). No local optimistic mutations may masquerade as authoritative.
- **Step 51 Monster Hold Respect:** Monster combat remains gated (`DISABLED_NO_APPROVED_MONSTER_COVERAGE`) until 334/334 SRD monster statblocks pass verification.

#### Required Backend Contracts:
- `POST /api/v2/actions` with `actionType: "UPDATE_COMBAT_STATE"`:
  ```json
  {
    "actionId": "act-combat-turn-...",
    "actionType": "ADVANCE_COMBAT_TURN",
    "payload": {
      "round": 2,
      "activeCombatantId": "char-kaelen",
      "damageApplications": [{ "targetId": "npc-jorren-vale", "damage": 5, "damageType": "slashing" }]
    }
  }
  ```
- `GET /api/v2/projection?role=player&character_id=...`:
  Includes full `combatState: { active: boolean, round: number, turn: number, combatants: CombatantSummary[] }`.

---

### UX-03: Spacious Professional VTT, Image & Grid Calibration

#### Objectives & Requirements:
- **Zero-Crop Image Import:** Solve the critical issue where imported high-resolution battlemaps (specifically *Blue Alley*) had ~80% of their canvas clipped.
- **Independent Coordinate Spaces:** Decouple:
  1. *Source Image Space:* Natural image dimensions (pixels), maintaining 100% native aspect ratio.
  2. *Overlay Grid Space:* Origin X/Y, cell pitch (px per 5ft square), rotation, and scale.
  3. *World Simulation Space:* Tactical feet, line-of-sight segments, doors, fog-of-war polygons.
  4. *Viewport Display Space:* Pan offset, smooth zoom, fullscreen mode, and DPI scaling.
- **Two-Point Calibration Wizard:** Allow the DM to click two points on preprinted grid squares to compute exact pixel pitch and origin offset without altering or resizing the underlying image file.
- **Durable Persistence:** Map geometry, grid transforms, door states, and revealed fog are persisted in `v2_battlemap_scenes` within the authoritative SQLite store and portable `.vadpack` archives.

#### Required Backend Contracts:
- `POST /api/v2/battlemaps/calibrate`:
  ```json
  {
    "mapId": "map-blue-alley",
    "gridConfig": {
      "originX": 34.5,
      "originY": 12.0,
      "cellSizePx": 64.0,
      "feetPerCell": 5,
      "rotationDeg": 0.0
    }
  }
  ```

---

### UX-04: Full Frontend Composition & Visual Design Redesign

#### Objectives & Requirements:
- **Palette & Visual Hierarchy:** Modern dark slate/charcoal foundations (`#0a0b0d`, `#12151a`), warm copper/bronze borders and interactive highlights (`#c87d55`, `#e09f67`), selective teal status accents (`#2dd4bf`), and high-legibility typography.
- **Workspace Layouts:**
  - *Play/Host:* Collapsible left contextual pane (party/NPCs/locations), dominant center (tabbed Story Feed / Fullscreen VTT), collapsible right pane (AI Co-DM Director, live SRD 5.1 rules lookup, causal event ledger), bottom quick-roll and voice bar.
  - *DM Planning:* Campaign Pack Manager (CPP-04), knowledge graph visualizer, and confidential DM dossier editor.
  - *Homebrew Workshop:* Sandboxed homebrew validator and rules expansion authoring.

---

### UX-05: Campaign Pack Manager Integration (CPP-04)

#### Objectives & Requirements:
- **Visual Staging & Inspection:** Browse `.vadpack` archives in staging, displaying manifest metadata, author, licence, and target ruleset.
- **Conflict Diffing & Review:** Render human-reviewable node/edge conflict reports generated by `POST /api/v2/campaign-packs/proposal` before applying mutations.
- **Transactional Installation:** Trigger `POST /api/v2/campaign-packs/install` through Single Commit Authority, verifying that active Save modifications are never overwritten.
- **Safe Export Interface:** Trigger `POST /api/v2/campaign-packs/export`, ensuring player exports redact all DM secret entities, confidential dossiers, and other players' private notes.

---

## 3. Implementation Phasing & Milestones

| Milestone | Scope & Deliverables | Verification Gate |
| :--- | :--- | :--- |
| **Milestone 11A (Current)** | CPP-03 Commit Authority repair, Save preservation, live narrative stream, header connection badge. | 368/368 backend tests pass; 133/133 frontend tests pass; CDP browser test verifies live dialogue. |
| **Milestone 11B** | UX-02 Character Sheet modal & interactive combat tracker with HP, spell slot, and condition updates. | Combat turn actions commit through Single Commit Authority; HP persists across restart. |
| **Milestone 12** | UX-03 Spacious VTT redesign, zero-crop Blue Alley import, two-point overlay grid calibration. | 100% of Blue Alley image retained on import; grid aligns accurately without artwork loss. |
| **Milestone 13** | UX-05 CPP-04 Visual Campaign Pack Manager in DM Planning (inspect, diff, install, export). | DM installs pack via UI; conflicts previewed; player export redacts secrets. |
| **Milestone 14** | UX-04 Dark copper/slate theme styling, tablet responsiveness, distraction-free reading mode. | Visual regression inspection; responsive layouts at 1920x1080, 1440x900, 1024x768. |

---

## 4. Preserved Holds & Invariants

1. **R1 Single Commit Authority:** No state mutation may occur directly in the frontend or through non-authoritative worker threads. All mutations pass through `submit_action()`.
2. **Step 51 SRD Monster Combat Hold:** Monster combat remains strictly disabled (`DISABLED_NO_APPROVED_MONSTER_COVERAGE`) until full statblock verification is completed.
3. **CP017B Master Database Hold:** `vadallfate_srd51.sqlite` is opened read-only.
4. **Source Licensing & Provenance:** Provenance licenses are preserved in all exported packs and never assumed to be CC-BY-4.0 without verification.
