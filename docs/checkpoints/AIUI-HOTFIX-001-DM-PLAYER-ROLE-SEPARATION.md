# VadAllFate — AIUI-HOTFIX-001
## Dedicated DM / Player Interfaces, Independent Hosting & Role-Switch Crash Repair

**Checkpoint Date:** October 20, 2026  
**Branch:** `aiui/hotfix-001-dm-player-role-separation`  
**Status:** Complete & Verified  

---

### 1. Executive Summary & Incident Root Cause

A critical application blank-screen crash was identified during perspective switching:
1. When viewing the **DM Planning** workspace in the Dungeon Master perspective (`dm_host`).
2. The user switches to the Player perspective.
3. The user selects **NPC Cognition Dossiers**, **Factions**, or **Storyteller Director**.
4. The entire application blanked and crashed, requiring a full browser page reload.

#### Root Cause Analysis
- **Unsafe Type Casting**: `App.tsx` conditionally rendered `DmPlanningView` using the active client projection. When the perspective was set to `'player'`, the client returned a `PlayerSafeCampaignProjection`. However, `App.tsx` blindly cast `(projection as DmFullCampaignProjection)`, passing `undefined` for `factions`, `directorProfiles`, and `activeDirectorProfileId`, and passing sanitized `PlayerSafeNpc[]` instances.
- **Unchecked Property Dereferencing**: In `DmPlanningView.tsx`, code dereferenced `activeNpc.knowledgeBoundary.verifiedFacts`, `activeFaction.name`, and `activeProfile.name`. Because `knowledgeBoundary` is stripped from `PlayerSafeNpc`, and `activeFaction` was `undefined`, JavaScript threw unhandled `TypeError` exceptions (`Cannot read properties of undefined`).
- **Absence of React Error Boundaries**: The application lacked a component-level or workspace-level Error Boundary, causing any rendering exception to unmount the entire React root.
- **Conflation of Session Hosting with DM Authority**: The frontend conflated technical session hosting (`isHost`) with gameplay narrative authority (`UserRole = 'dm_host'`). Players who hosted sessions were improperly exposed to DM controls, while non-hosting DMs risked losing DM capabilities.

---

### 2. Updated Game-Role and Hosting-Permission Model

VadAllFate now establishes a strict decoupling between **Game Role** and **Session Hosting Status**:

1. **Game Role (`GameRole`)**:
   - `dm`: Full narrative and gameplay authority (secret dossiers, faction schemes, world clock, storyteller director, geometry creation).
   - `player`: Participant authority (own character sheet, player dialogue, actions, dice roller, player-safe battlemap, journal).
   - `observer`: Read-only spectator perspective.

2. **Session Host Status (`isHost: boolean`)**:
   - `host`: The technical creator/maintainer of the room/connection.
   - `non_host`: A guest participant.

#### Key Architectural Rules
- A user may be a **Dungeon Master without hosting** (`gameRole: 'dm', isHost: false`). They retain 100% of DM capabilities and secrets.
- A user may **host without being the Dungeon Master** (`gameRole: 'player', isHost: true`). Hosting alone **never** grants access to DM secrets, dossiers, or DM actions.
- **Compatibility**: Legacy demonstration role identifiers (`'dm_host' | 'player' | 'observer'`) remain supported across the action envelope and projection pipeline (`getEffectiveProjectionRole`).

---

### 3. Role / Capability Matrix

| Capability / Resource | DM (Host) | DM (Guest) | Player (Host) | Player (Guest) | DM (Player Preview) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Play Workspace** | Yes | Yes | Yes | Yes | Yes |
| **Battlemap Workspace** | Yes (DM Tools) | Yes (DM Tools) | Yes (Player Safe) | Yes (Player Safe) | Yes (Player Safe) |
| **DM Planning Workspace** | Yes | Yes | No | No | No (Auto-Redirected) |
| **Homebrew Workshop** | Yes | Yes | No | No | No (Auto-Redirected) |
| **Dedicated Character View** | No (Uses DM view) | No (Uses DM view) | Yes | Yes | Yes |
| **Dedicated Journal View** | No (Uses DM planning) | No (Uses DM planning) | Yes | Yes | Yes |
| **Confidential NPC Secrets** | Yes | Yes | No | No | No |
| **Faction Schemes** | Yes | Yes | No | No | No |
| **Storyteller Director Config** | Yes | Yes | No | No | No |
| **Advance World Clock** | Yes | Yes | No | No | No |
| **Technical Room Hosting** | Yes | No | Yes | No | Yes (Preserved) |
| **Elevate to DM Authority** | Native | Native | Disallowed | Disallowed | Exit Preview Action |

---

### 4. Navigation Architecture

The global header navigation (`Header.tsx`) renders distinct workspaces based on the active role:

#### Dungeon Master Navigation
1. **Play / Host** (or **Play** if guest): Context-sensitive narrative workspace, AI DM interaction, party actions, dialogue history.
2. **Battlemap**: Interactive tactical canvas with geometry tools (rooms, corridors, walls, doors, tokens, fog).
3. **DM Planning**: NPC Cognition Dossiers, Factions, World Travel Nodes, Master World Clock, Storyteller Director.
4. **Homebrew Workshop**: 5e SRD items, spells, monsters, and homebrew pack creation.

#### Player Navigation
1. **Play**: Narrative exploration, NPC dialogue, player intent submission, dice rolling.
2. **Battlemap**: Player-safe tactical view (hidden DM entities excluded, player-allowed token movement).
3. **Character**: Dedicated character sheet view (HP, AC, Ability Scores, Attacks, Spells, Inventory, Bio).
4. **Journal / Quests**: Discovered travel nodes, party quests with objective tracking, known NPC public lore.

#### "Preview as Player" Mode (DM Only)
- A Dungeon Master can engage **"Preview as Player"** to verify what an authorized player sees (e.g. Kaelen or Lyra).
- While active, an amber status banner appears across the viewport:
  - Discloses masked DM secrets and target character.
  - Switches active workspaces to the Player suite (`Play`, `Battlemap`, `Character`, `Journal`).
  - Auto-sanitizes the active tab so navigating away from DM Planning does not throw exceptions.
  - Provides a single-click **"Exit Preview & Return to DM"** button without reloading the page.
  - Players cannot see or invoke this elevation banner.

---

### 5. Changed Files

1. `src/types/runtime.ts`:
   - Defined `GameRole`, `SessionHostStatus`, and `UserIdentityContext`.
   - Added runtime type guards `isDmFullProjection` and `isPlayerSafeProjection`.
2. `src/runtime/roleAuthority.ts` *(new)*:
   - Pure authority functions: `canAccessDmWorkspaces`, `canAccessWorkshop`, `canHostSession`, `canExecuteDmActions`, `getEffectiveProjectionRole`, `sanitizeTabForIdentity`, `getAuthorisedTabs`.
   - Presets for demonstration personas: DM Host, DM Guest, Player Host, Player Guest, Observer.
3. `src/runtime/roleAuthority.test.ts` *(new)*:
   - Unit tests covering independent hosting, non-host DM capabilities, player host restrictions, and preview lifecycle.
4. `src/components/common/ErrorBoundary.tsx` *(new)*:
   - Controlled React Error Boundary rendering clean recovery UI with "Recover to Play Workspace" button.
5. `src/components/planning/DmPlanningView.tsx`:
   - Added complete null safety and fallback empty states for locations, NPCs, factions, and director profiles.
6. `src/components/player/PlayerCharacterView.tsx` *(new)*:
   - Dedicated player character sheet view with abilities, attacks, spells, equipment, and bio.
7. `src/components/player/PlayerJournalView.tsx` *(new)*:
   - Dedicated player journal displaying player-safe quests, discovered locations, and known NPCs.
8. `src/components/layout/Header.tsx`:
   - Updated to render role-specific navigation tabs, independent hosting labels, and the persistent DM Player Preview banner.
9. `src/App.tsx`:
   - Wired `UserIdentityContext`, `ErrorBoundary`, projection narrowing guards (`isDmFullProjection`), and auto-sanitizing navigation.
10. `src/runtime/rules.ts` & `src/runtime/adapter.ts`:
    - Enforced role checks rejecting player attempts to execute `DM_OVERRIDE_STATE` or `ADVANCE_TIME`.
11. `src/runtime/roleSeparationRegression.test.ts` *(new)*:
    - 13 comprehensive regression tests validating all scenarios specified in Section 10 of AIUI-HOTFIX-001.

---

### 6. Regression Testing Results

All 81 tests across 8 test suites pass with zero failures:
```
✔ Role Authority & Independent Hosting (6 tests)
✔ AIUI-HOTFIX-001 Role Separation & Crash Resilience Regression Suite (13 tests)
✔ Coordinate System & Conversions (10 tests)
✔ Corridor Geometry & Bounded Passages (5 tests)
✔ Image Validation & Aspect Ratio Fitting (4 tests)
✔ Wall & Door Topology (5 tests)
✔ Battlemap Session Lifecycle & Workspace Persistence (4 tests)
✔ Runtime Rules, Dice, Clock, & Adapter Suites (34 tests)

Total: 81 tests passed, 0 failed.
Build: tsc --noEmit && vite build succeeded with 0 errors.
```

#### Specific Scenarios Verified
1. **DM host accessing all DM workspaces**: Passed.
2. **Non-host DM accessing all DM workspaces**: Passed.
3. **Player host unable to access DM workspaces**: Passed.
4. **Non-host player unable to access DM workspaces**: Passed.
5. **DM switching to player preview from NPC Cognition**: Passed (tab sanitized to `'play'`, player-safe projection returned).
6. **DM switching to player preview from Factions**: Passed.
7. **DM switching to player preview from Storyteller**: Passed.
8. **DM returning from player preview**: Passed (DM authority restored without reload).
9. **Empty NPC/faction/Director datasets**: Passed (graceful empty states rendered without exceptions).
10. **Repeated perspective changes**: Passed (no memory leaks or state pollution).
11. **Player battlemap rendering with hidden objects excluded**: Passed (`isVisibleToPlayers: false` excluded).
12. **Attempted navigation to restricted DM workspaces**: Passed (safely redirected to `'play'`).
13. **No unauthorised DM actions via frontend callbacks**: Passed (fail-closed rejections for `DM_OVERRIDE_STATE` and hidden targets).

---

### 7. Explicit Security Limitations

- **Frontend Isolation vs. Backend Cryptographic RBAC**: Client-side projection filtering and conditional rendering protect the user experience and prevent accidental disclosure. However, in a production multiplayer deployment, true information security must be enforced by the canonical Python backend before transmitting data over the network.
- **Demo Mode Transparency**: In the local in-memory adapter, all records exist within the browser process. Production security relies on the authenticated Python runtime daemon and SQLite persistence.

---

### 8. Verification & Commit

- **Branch**: `aiui/hotfix-001-dm-player-role-separation`
- **Git HEAD Verified**: Clean working tree committed.
- **Verification Commands Executed**:
  - `npm test` -> 81/81 passed
  - `npm run lint` -> 0 errors
  - `npm run build` -> 0 errors
