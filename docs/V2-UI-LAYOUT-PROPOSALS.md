# VadAllFate V2 — UI Layout Architecture Proposals

**Document ID:** `DOC-V2-UI-LAYOUT-20261028`  
**Status:** PROPOSED FOR HUMAN REVIEW & SELECTION  
**Target Architecture:** VadAllFate V2 Tabletop RPG Cockpit & Blue Alley VTT  
**Palette Foundation:** Charcoal/Deep Slate (`#090b0e`, `#12161c`, `#1c222b`) with Warm Bronze / Burnished Copper accents (`#78350f`, `#b45309`, `#d97706`, `#f59e0b`).

---

## 1. Executive Summary & Design Goals

The VadAllFate V2 frontend is evolving from separate, tabbed workspaces (Play, Battlemap, DM Planning, Workshop) toward a unified, immersive tabletop interface. Milestone 12 introduced the calibrated, zero-crop Blue Alley VTT with persistent natural artwork dimensions, SVG grid overlays, and real-time fine-tuning HUDs.

To prepare for subsequent milestones without disrupting existing workflows, this document outlines **three distinct visual and structural layout proposals** for pair-programming review:

1. **Proposal A: Split Cockpit (VTT Center, Narrative & Tactical Side Panes)**
2. **Proposal B: Glass Overlay HUD (Maximized Map Canvas with Floating Docking Trays)**
3. **Proposal C: Dual-Surface Director Console (Master DM Screen + Player Projection)**

---

## 2. Proposal A: Classic Split Cockpit

### Concept
The Split Cockpit maintains a three-column layout where the tactical battlemap commands the central viewport, flanked by the persistent narrative feed on the left and the combat tracker / quick-action console on the right.

```
+----------------------------------------------------------------------------------------------------+
|  [VADALLFATE V2]  [Mode: AI-Primary Co-DM]  [Clock: 14:30]  [Host DM]  [SRD: 1,207]  [Commit #24]  |
+-------------------+----------------------------------------------------+---------------------------+
| NARRATIVE & LOG   |              TACTICAL BATTLEMAP                    |  COMBAT & ACTORS          |
|                   |                                                    |                           |
| - Scene narrative |  +----------------------------------------------+  |  Round 1 (Turn 2)         |
| - Dialogue feed   |  | [Map: Blue Alley (40x40)] [Fit] [Calibrate] |  |  - Lyra Vance (HP: 27/27) |
| - DM whispers     |  |                                              |  |  - Skeleton 1 (HP: 13/13) |
| - Roll receipts   |  |   [Zero-Crop Calibrated Canvas Surface]      |  |                           |
|                   |  |                                              |  |  -----------------------  |
|                   |  |   Corridor -> Gold Room -> Trap Hallway      |  |  QUICK ACTIONS            |
|                   |  |                                              |  |  [Melee Attack] [Spell]   |
|                   |  |                                              |  |  [Disengage]    [Dodge]   |
|                   |  +----------------------------------------------+  |                           |
| ----------------- |                                                    |  -----------------------  |
| ACTION INPUT      |  FLOATING MINI-CONTROLS                            |  DM QUICK OVERRIDES       |
| [What do you do?] |  [Pan] [Ruler] [Fog Reveal] [Grid Snap] [Zoom]     |  [Adjust HP] [Condition]  |
+-------------------+----------------------------------------------------+---------------------------+
```

### Key Characteristics
- **Center Canvas Ratio:** 50%–60% of total viewport width; narrative column 22%; combat/tools column 22%.
- **Zero-Crop Guarantee:** Canvas maintains aspect-ratio preservation with letterbox margins, dynamically recalculating zoom on sidebar expand/collapse.
- **Responsive Behavior:** On tablet (1024x768), side panels collapse into slide-out drawer tabs (`[Narrative]`, `[Tactics]`) anchored to screen edges.
- **Visual Aesthetic:** Slate charcoal borders (`#1c222b`) with subtle copper highlight lines (`#b45309`) indicating active turns and authoritative state commits.

### Pros & Cons
- **Pros:** Zero context switching; DM and player can simultaneously see map movements, dice receipts, and narrative prose. Familiar to players accustomed to modern VTTs.
- **Cons:** On smaller screens (e.g., 1366x768 laptops), map viewport can feel constrained unless sidebars are actively toggled.

---

## 3. Proposal B: Glass Overlay HUD (Maximized Map Canvas)

### Concept
The battlemap fills 100% of the screen area behind a frosted, semi-transparent dark glass HUD. Narrative, combat, and quick actions float in modular, movable, and collapsible docking tiles.

```
+----------------------------------------------------------------------------------------------------+
|  [V2 Cockpit] [AI-Primary]                     [Active Map: Blue Alley]             [Commit #24]    |
|                                                                                                    |
|  +---------------------+                                                +-----------------------+  |
|  | NARRATIVE TRAY [x]  |                                                | COMBAT DOCK [x]       |  |
|  | (Backdrop Blur 16px)|                                                | (Backdrop Blur 16px)  |  |
|  | - Narration...      |               [BATTLEMAP CANVAS]               | - Lyra: 27/27         |  |
|  | - Dialogue...       |                                                | - Skeleton: 13/13     |  |
|  | [Action Input ...]  |            100% UNCLIPPED ARTWORK              | [Attack] [Cast Spell] |  |
|  +---------------------+                                                +-----------------------+  |
|                                                                                                    |
|                                                                                                    |
|                                  +------------------------------------+                            |
|                                  | FLOATING TACTICAL TOOLBAR          |                            |
|                                  | [Select] [Move] [Ruler] [Calibrate]|                            |
|                                  +------------------------------------+                            |
+----------------------------------------------------------------------------------------------------+
```

### Key Characteristics
- **Canvas Area:** 100% viewport width and height; tokens and artwork have maximum visual impact.
- **Surface Layering:** 
  - `Layer 0`: Natural uncompressed battlemap image + dynamic grid lines.
  - `Layer 1`: Walls, lighting barriers, dynamic line-of-sight fog.
  - `Layer 2`: Interactive tokens and spell template shapes.
  - `Layer 3`: Floating HUD elements with `backdrop-filter: blur(12px)` and charcoal tint (`rgba(13, 16, 22, 0.88)`).
- **Docking System:** Panels can be snapped to edges, minimized to small pill badges (`[3 Unread Events]`, `[Round 1]`), or dragged to preferred positions.

### Pros & Cons
- **Pros:** Cinematic tabletop immersion; optimal for large monitors (1440p / 4K) and map-heavy tactical combat.
- **Cons:** Glass overlays can occasionally obscure tokens near screen margins; requires robust drag-and-drop or pin/unpin logic.

---

## 4. Proposal C: Dual-Surface Director Console

### Concept
Specifically engineered for Co-DM and Human DM operation: divides the screen into a top-level **Tactical Director Bar** and two synchronized sub-surfaces:
1. **Primary Tactical Surface (Left 65%):** Map canvas with complete geometry and fog editing tools.
2. **DM Operations Matrix (Right 35%):** Structured tables for live NPC statblocks, rules lookup from the 1,207 SRD entities, AI Co-DM suggestion cards, and R1 event staging.

```
+----------------------------------------------------------------------------------------------------+
| [DM DIRECTOR]  [Mode: Human-Primary Co-DM]  [Clock 14:30]  [SRD Lookup: [ Fireball    ]]  [Status: OK]|
+------------------------------------------------------+---------------------------------------------+
| TACTICAL BATTLEMAP SURFACE                           | DM OPERATIONS & CO-DM ASSIST                |
|                                                      |                                             |
| +--------------------------------------------------+ | +-- AI CO-DM STAGED SUGGESTIONS -----------+|
| | Active: Blue Alley | Grid: 48.0px | Snap: ON     | | | "Skeleton 2 moves 20ft to flank Lyra.   ||
| +--------------------------------------------------+ | |  Proposes: ATTACK_ACTION (Shortsword)"  ||
| |                                                  | | | [Approve Proposal]  [Veto / Rewrite]     ||
| |             [100% ZERO-CROP MAP]                 | | +-----------------------------------------+|
| |                                                  | |                                             |
| |                                                  | | +-- ACTIVE ACTOR / SRD REFERENCE --------+  |
| |             Lyra Vance [HP 27/27]                | | | Skeleton (CR 1/4, AC 13, HP 13)         |  |
| |                    vs                            | | | Vulnerable: Bludgeoning                 |  |
| |             Skeleton 1 & Skeleton 2              | | | Immunities: Poison                      |  |
| |                                                  | | +-----------------------------------------+  |
| |                                                  | |                                             |
| |                                                  | | +-- COMMIT AUTHORITY & EVENT LEDGER -----+  |
| +--------------------------------------------------+ | | Seq #24: ATTACK_ACTION (Hit: 21, Dmg: 6) ||
| [Calibrate Grid] [Fog Brush] [Measure] [Center View]| | | Seq #23: CAST_SPELL (Cure Wounds L1)   ||
+------------------------------------------------------+---------------------------------------------+
```

### Key Characteristics
- **DM Authority First:** Explicit Co-DM proposal staging section (`Approve Proposal`, `Veto / Rewrite`) directly executing R1 single-commit authority contracts.
- **SRD Integration:** Integrated rules and monster statblock drawer without navigating away from the active tactical encounter.
- **Player Projection Mode:** Provides a clean "Open Player Window" button that pops out a clean, fog-filtered, DM-hidden view onto a second screen or TV.

### Pros & Cons
- **Pros:** Perfect operational model for DM play and co-DM oversight; integrates R1 commit authority directly into the tactical workflow.
- **Cons:** More complex information density; requires clear visual hierarchy to avoid cognitive overload during fast-paced encounters.

---

## 5. Comparative Evaluation

| Feature / Criterion | Proposal A: Split Cockpit | Proposal B: Glass HUD | Proposal C: Director Console |
| :--- | :---: | :---: | :---: |
| **Map Visibility** | High (50–60% dedicated) | Maximum (100% fullscreen) | High (65% dedicated) |
| **Narrative Focus** | Excellent (Dedicated Feed) | Moderate (Collapsible Tray) | Moderate (Event Ledger) |
| **Co-DM Adjudication** | Good | Moderate | Superior (Dedicated Staging) |
| **Tablet Usability (1024x768)** | Very Good (Drawer layout) | Excellent (Floating pills) | Moderate (Dense matrix) |
| **SRD 5.1 Rules Accessibility** | Quick Modal | Floating Card | Integrated Split View |
| **Visual Atmosphere** | Structured Tabletop | Modern Immersive Glass | Command Cockpit |

---

## 6. Recommendation

- **Primary Recommendation:** **Proposal A (Split Cockpit)** with elements of **Proposal B's** collapsible tray transitions. It delivers optimal ergonomics for single-screen desktop and tablet users while cleanly preserving the zero-crop canvas view and narrative dialogue thread.
- **Secondary Evolution:** Implement the Co-DM Staging Card from **Proposal C** inside the right-hand combat drawer of Proposal A, ensuring human DMs retain instant veto power over AI actions while battlemap tokens move in real time.
