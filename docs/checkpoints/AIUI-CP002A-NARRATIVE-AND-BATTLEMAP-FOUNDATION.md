# VadAllFate — AIUI-CP002A Engineering Checkpoint Evidence
## Narrative-First Play Workspace & Integrated Battlemap Foundation

**Target Repository:** `Minilaz-code/VadAllFate-Google-Ai-Studio`  
**Working Branch:** `aiui/cp002a-narrative-battlemap`  
**Base Commit:** `a406d3f` (`chore: ignore bun.lock in .gitignore` on top of `c066b33`)  
**Verified Remote Baseline (`origin/main`):** `b55f34f32d51c4ad168ab34ce0e6228e8d93ab43`  
**Checkpoint Status:** COMPLETED & VERIFIED

---

### 1. Architectural Summary & Workspace Separation

In accordance with AIUI-CP002A, the top-level application navigation has been partitioned into four independent, dedicated workspaces:

1. **Play / Host (`play`):**
   - Context-sensitive, narrative-first Scene Workspace.
   - The tactical battlemap is no longer permanently mounted in the center.
   - Prioritizes active scene setting, current location hazard and atmospheric conditions, dialogue history stream, player intentions, known NPC topics, active quests, and character health status.
   - Features demonstration modes for **Roleplay**, **Exploration**, **Combat** (display-only turn order & initiative tracker clearly labeled as non-authoritative), and **Downtime** (tavern rest and Harptos calendar time advance).
   - Features direct navigation action: "Open Tactical Battlemap".

2. **Battlemap (`battlemap`):**
   - Native, integrated lightweight tactical battlemap workspace reusing `VirtualTabletop.tsx`.
   - Occupies the main workspace with collapsible toolbars and inspectors.
   - Includes scene map switcher (`SAMPLE_BATTLEMAPS`: The Yawning Portal Taproom, The Sunken Vault Lower Crypts, High Road Wilderness Outpost).
   - Includes custom artwork map import dialog (PNG, JPG, WebP) with grid sizing, scale factor, and aspect ratio controls.
   - Includes optional external Owlbear Rodeo integration modal/drawer with launcher.
   - Includes Non-Authoritative Status Disclaimer Banner explicitly noting that token positions are non-authoritative previews and all combat rules belong to the Python R1 runtime.

3. **DM Planning (`planning`):**
   - Authoritative campaign management, world clock controls, NPC knowledge boundary dossiers, faction intrigue, location travel routes, and director AI configuration.

4. **Homebrew Workshop (`workshop`):**
   - 5e SRD 5.1 and custom homebrew pack inspector with provenance hashing and content registries.

---

### 2. NPC & Player Knowledge Safety Hardening (CP001B Review Item)

Following audit review of player projections:
- `PlayerSafeNpc` (`src/types/runtime.ts` and `src/runtime/adapter.ts`) has been strictly updated:
  - Internal cognition (`falseBeliefs`, `suspicions`, `guardedSecrets`, `motivationsAndGoals`, `routinesAndCommitments`, `statBlock`) is strictly removed from the player projection data model.
  - Replaced with allowlisted `publicKnowledge: { publicFacts: string[] }`.
  - Negative tests in `demoAdapter.test.ts` verify the absence of `knowledgeBoundary`, `falseBeliefs`, `suspicions`, `guardedSecrets`, and `statBlock` in serialized player and observer projections.

---

### 3. Battlemap Data & View-Model Specification (`src/types/battlemap.ts`)

Provisional view model defined for the lightweight tactical battlemap:

```typescript
export interface BattlemapDefinition {
  id: string;
  name: string;
  locationId: string;
  sceneSummary: string;
  grid: {
    width: number;           // Grid columns (cells)
    height: number;          // Grid rows (cells)
    cellSizePx: number;      // e.g. 40px
    feetPerCell: number;     // 5ft per cell standard
    showGrid: boolean;
    gridColor: string;
  };
  backgroundArtwork?: {
    url: string;
    name: string;
    scale: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    aspectRatio: string;
  };
  geometry: {
    rooms: RectangularRoom[];     // id, name, x, y, width, height, floorType
    corridors: CorridorSegment[]; // id, startX, startY, endX, endY, widthCells
    walls: WallSegment[];         // id, x1, y1, x2, y2, blocksMovement, blocksVision
    doors: DoorSegment[];         // id, x, y, orientation, state ('open' | 'closed' | 'locked')
  };
  fog: {
    enabled: boolean;
    defaultState: 'hidden' | 'revealed';
    revealedCells: string[];      // "x,y" coordinates
    previousExploredCells: string[];
  };
  lineOfSight: {
    enabled: boolean;
    blocksOnWalls: boolean;
    blocksOnClosedDoors: boolean;
    maxSightRadiusFeet: number;
  };
  tokens: MapTokenPlacement[];    // id, entityId, entityType, x, y, isVisibleToPlayers
}
```

---

### 4. Canonical Python R1 Runtime Contract Intake Checklist

The canonical Python runtime (`https://github.com/Minilaz-code/VadAllFate.git`) remains the single source of truth. The frontend transport gateway remains disconnected until the following intake artifacts are approved:

| Category | Required Intake Contract | Current Frontend Status | Transport Responsibility |
|---|---|---|---|
| **Action Ingestion** | Canonical `ActionEnvelope` JSON schema with cryptographic actor signature | Unverified stub in `runtime.ts` | HTTP POST `/api/v1/actions` or WebSocket `action_submit` |
| **Commit Authority** | Canonical `CommitReceipt` with commit hash and state patch array | Simulated demo receipt | WebSocket `commit_receipt` event broadcast |
| **State Projections** | Versioned `CampaignProjection` (Player-safe & DM-full) | Demo allowlist view models | WebSocket initial snapshot & differential delta patches |
| **Combat Mechanics** | Initiative roll order, HP changes, AC, spell slots, saving throws | Display-only in React UI | Python rules engine execution (`VadAllFate.combat`) |
| **World Clock** | Calendar of Harptos 365-day year, holiday festivals, daylight calculation | Client-side demo Harptos math | Authoritative daemon tick (`VadAllFate.clock`) |
| **Persistence** | SQLite WAL authoritative journal & snapshot restore | Ephemeral in-memory demo | Python runtime local SQLite engine |

---

### 5. Changed & Added Files

1. `src/types/battlemap.ts` (NEW): Provisional battlemap geometry, grid, fog, and sample scene definitions.
2. `src/components/battlemap/BattlemapView.tsx` (NEW): Independent Battlemap workspace with map switcher, custom map import, and token inspector.
3. `src/components/play/NarrativePlayView.tsx` (NEW): Context-sensitive Scene Workspace prioritizing narrative, dialogue, party status, and action console.
4. `src/components/layout/Header.tsx` (MODIFIED): Added `Battlemap` navigation tab; 4-workspace layout.
5. `src/App.tsx` (MODIFIED): Routed `play` to `NarrativePlayView` and `battlemap` to `BattlemapView` with cross-workspace navigation links.
6. `src/types/runtime.ts` (MODIFIED): Hardened `PlayerSafeNpc` to strip all internal cognition and expose only `publicKnowledge.publicFacts`.
7. `src/runtime/adapter.ts` (MODIFIED): Updated `DemoCampaignClient.getProjection()` to serialize `publicKnowledge` without leaking `knowledgeBoundary`.
8. `src/runtime/demoAdapter.test.ts` (MODIFIED): Strengthened regression tests asserting the absence of `knowledgeBoundary`, `falseBeliefs`, `suspicions`, and `statBlock` in player projections.
9. `.gitignore` (MODIFIED): Added `bun.lock` to prevent untracked file noise.

---

### 6. Verification & Automated Test Outcomes

- **Unit & Integration Suite (`npm test`):**
  ```
  TAP version 13
  # Subtest: calculateTimeOfDay partitions 24 hour day accurately
  ok 1 - calculateTimeOfDay partitions 24 hour day accurately
  # Subtest: advanceWorldClock advances time and rolls into next day
  ok 2 - advanceWorldClock advances time and rolls into next day
  # Subtest: advanceWorldClock respects isPaused flag
  ok 3 - advanceWorldClock respects isPaused flag
  # Subtest: Negative Case: Movement targeting nonexistent entity is rejected
  ok 4 - Negative Case: Movement targeting nonexistent entity is rejected
  # Subtest: Negative Case: Out-of-bounds token coordinates are rejected
  ok 5 - Negative Case: Out-of-bounds token coordinates are rejected
  # Subtest: Negative Case: Attack against nonexistent target is rejected
  ok 6 - Negative Case: Attack against nonexistent target is rejected
  # Subtest: Negative Case: Natural-1 attack fumbles dealing damage are rejected
  ok 7 - Negative Case: Natural-1 attack fumbles dealing damage are rejected
  # Subtest: Negative Case: Duplicate action nonce replay is rejected
  ok 8 - Negative Case: Duplicate action nonce replay is rejected
  # Subtest: Negative Case: Stale snapshot rejection
  ok 9 - Negative Case: Stale snapshot rejection
  # Subtest: Negative Case: Advancing time while world clock is paused is rejected
  ok 10 - Negative Case: Advancing time while world clock is paused is rejected
  # Subtest: Gateway Isolation: Disconnected PythonRuntimeGateway safely rejects writes
  ok 11 - Gateway Isolation: Disconnected PythonRuntimeGateway safely rejects writes
  # Subtest: Projection Isolation: PlayerSafe and ObserverSafe projections exclude quest secrets, dmNotes, guardedSecrets, and undiscovered locations
  ok 12 - Projection Isolation: PlayerSafe and ObserverSafe projections exclude quest secrets, dmNotes, guardedSecrets, and undiscovered locations
  # Subtest: Negative Case: Player action targeting hidden NPC in demo is rejected
  ok 13 - Negative Case: Player action targeting hidden NPC in demo is rejected
  # Subtest: Client-Switch Isolation: Active client routing and fail-closed submission
  ok 14 - Client-Switch Isolation: Active client routing and fail-closed submission
  # Subtest: Gateway Status Reporting: Disconnected gateway separates intended authority from action readiness
  ok 15 - Gateway Status Reporting: Disconnected gateway separates intended authority from action readiness
  # Subtest: Canonical Contract Placeholders: Stubs are explicitly unverified without speculative schemas
  ok 16 - Canonical Contract Placeholders: Stubs are explicitly unverified without speculative schemas
  # Subtest: parseDiceFormula handles standard forms correctly
  ok 17 - parseDiceFormula handles standard forms correctly
  # Subtest: parseDiceFormula throws on invalid inputs
  ok 18 - parseDiceFormula throws on invalid inputs
  # Subtest: rollDice computes totals with deterministic rng
  ok 19 - rollDice computes totals with deterministic rng
  # Subtest: rollDice detects critical hits on natural 20
  ok 20 - rollDice detects critical hits on natural 20
  # Subtest: rollDice detects fumbles on natural 1
  ok 21 - rollDice detects fumbles on natural 1
  # Subtest: rollDice handles advantage and disadvantage correctly
  ok 22 - rollDice handles advantage and disadvantage correctly
  # Subtest: calculateAbilityModifier follows standard 5e SRD table
  ok 23 - calculateAbilityModifier follows standard 5e SRD table
  # Subtest: calculateProficiencyBonus scales with character level
  ok 24 - calculateProficiencyBonus scales with character level
  # Subtest: resolveAttack properly handles hits, misses, and crits
  ok 25 - resolveAttack properly handles hits, misses, and crits
  # Subtest: checkActionAdmission enforces snapshot concurrency
  ok 26 - checkActionAdmission enforces snapshot concurrency
  # Subtest: validateStatePatch enforces HP and token bounds
  ok 27 - validateStatePatch enforces HP and token bounds
  1..27
  # tests 27
  # suites 0
  # pass 27
  # fail 0
  # cancelled 0
  # skipped 0
  # todo 0
  # duration_ms 624.914394
  ```

- **Typecheck & Linter (`npm run lint` / `tsc --noEmit`):** Clean exit code `0` (0 errors).
- **Production Build (`npm run build` / `vite build`):** Clean compilation into `dist/`.

---

### 7. Remaining Limitations

- **Map Editing & Geometry Drawing:** Drawing custom walls, doors, and rooms directly on the canvas is deferred to **AIUI-CP002B**.
- **Dynamic Line of Sight & Raycasting:** Raycast visibility polygons and fog-of-war cell uncovering are deferred to **AIUI-CP002C**.
- **Python Runtime Daemon:** The transport gateway remains disconnected in fail-closed state until real canonical endpoints and network schemas are provided.

---

### 8. Proposed AIUI-CP002B Scope

- **AIUI-CP002B: Room/Corridor Builder, Wall and Door Geometry, Imported Map Workflow**:
  - Interactive rectangular room drawing tool with click-drag handles.
  - Interactive corridor connecting tool.
  - Wall segment placement and deletion.
  - Door placement with interactive open/closed/locked toggles.
  - Background image alignment calibration tools (scale, pan offset, grid alignment).
