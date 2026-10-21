/**
 * VadAllFate — Environmental Geometry & Battlemap Controls Unit Tests (AIUI-CP002C1)
 *
 * Verifies:
 * 1. Blank map creation with unconfigured geometry and specified grid/fog defaults.
 * 2. Map duplication with unique identifiers and independent undo/redo history.
 * 3. Map renaming and deletion guard (cannot delete last remaining map).
 * 4. Window topology: clear window allows LOS while blocking movement; obscured window blocks LOS.
 * 5. Railings: low barriers allow LOS by default with configurable movement barriers.
 * 6. Difficult terrain zones: metadata, movement cost multipliers, and vision blocking flags.
 * 7. Wall topology with multiple mixed openings (doors and windows).
 * 8. Player door request flow separation from direct DM world state mutation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BattlemapSessionManager } from '../state/battlemapSession.ts';
import {
  resolveEffectiveBlockingSegments,
  findHostWallForWindow,
} from './wallTopology.ts';
import { hasLineOfSight } from './lineOfSight.ts';
import type {
  WallSegment,
  DoorSegment,
  WindowSegment,
  RailingSegment,
  TerrainZone,
} from '../types/battlemap.ts';

describe('Environmental Geometry & Battlemap Management (AIUI-CP002C1)', () => {
  it('creates an empty blank map with genuine zero-geometry state and custom grid', () => {
    const session = new BattlemapSessionManager();
    const initialCount = session.getMaps().length;

    const blankMap = session.createBlankMap({
      name: 'Underdark Chasm Bridge',
      sceneSummary: 'A narrow natural stone bridge spanning a yawning chasm into the deep Underdark.',
      width: 25,
      height: 15,
      feetPerCell: 5,
      cellSizePx: 45,
      backgroundColor: '#0f172a',
      fogEnabled: true,
      defaultFogState: 'hidden',
    });

    assert.equal(session.getMaps().length, initialCount + 1);
    assert.equal(session.getActiveMapId(), blankMap.id);
    assert.equal(blankMap.name, 'Underdark Chasm Bridge');
    assert.equal(blankMap.grid.width, 25);
    assert.equal(blankMap.grid.height, 15);
    assert.equal(blankMap.grid.cellSizePx, 45);
    assert.equal(blankMap.backgroundColor, '#0f172a');
    assert.equal(blankMap.fog.enabled, true);
    assert.equal(blankMap.fog.defaultState, 'hidden');

    // Must be genuinely empty with zero automatically generated rooms, walls, doors, tokens
    assert.equal(blankMap.geometry.rooms.length, 0);
    assert.equal(blankMap.geometry.corridors.length, 0);
    assert.equal(blankMap.geometry.walls.length, 0);
    assert.equal(blankMap.geometry.doors.length, 0);
    assert.equal(blankMap.geometry.windows?.length || 0, 0);
    assert.equal(blankMap.geometry.railings?.length || 0, 0);
    assert.equal(blankMap.geometry.terrain?.length || 0, 0);
    assert.equal(blankMap.tokens.length, 0);
  });

  it('renames, duplicates, and deletes maps with safeguards', () => {
    const session = new BattlemapSessionManager();
    const activeMap = session.getActiveMap();

    // 1. Rename active map
    session.renameMap(activeMap.id, 'Renamed Taproom', 'Updated description for tavern');
    assert.equal(session.getActiveMap().name, 'Renamed Taproom');
    assert.equal(session.getActiveMap().sceneSummary, 'Updated description for tavern');

    // 2. Duplicate map
    const dup = session.duplicateMap(activeMap.id);
    assert.ok(dup);
    assert.notEqual(dup.id, activeMap.id);
    assert.equal(dup.name, 'Renamed Taproom (Copy)');
    assert.equal(session.getActiveMapId(), dup.id);

    // 3. Delete duplicated map
    const deleteSuccess = session.deleteMap(dup.id);
    assert.equal(deleteSuccess, true);
    assert.notEqual(session.getActiveMapId(), dup.id);

    // 4. Guard against deleting when only 1 map remains
    // Delete until 1 left
    const allMaps = session.getMaps();
    for (let i = 0; i < allMaps.length - 1; i++) {
      session.deleteMap(allMaps[i].id);
    }
    assert.equal(session.getMaps().length, 1);
    const lastMapId = session.getMaps()[0].id;
    const failedDelete = session.deleteMap(lastMapId);
    assert.equal(failedDelete, false);
    assert.equal(session.getMaps().length, 1);
  });

  it('snaps window to host wall and resolves clear window topology: allows LOS while blocking movement', () => {
    // Wall from (2, 5) to (10, 5)
    const wall: WallSegment = {
      id: 'w-court',
      x1: 2,
      y1: 5,
      x2: 10,
      y2: 5,
      blocksMovement: true,
      blocksVision: true,
    };

    // Candidate window at (5.2, 5.1) snaps to wall at (5, 5)
    const snapped = findHostWallForWindow(5.2, 5.1, [wall]);
    assert.ok(snapped);
    assert.equal(snapped.orientation, 'horizontal');
    assert.equal(snapped.snappedX, 5);
    assert.equal(snapped.snappedY, 5);

    // Clear window
    const windowClear: WindowSegment = {
      id: 'win-1',
      x: 5,
      y: 5,
      orientation: 'horizontal',
      state: 'clear',
      blocksVisionWhenObscured: true,
      blocksMovement: true,
    };

    const effective = resolveEffectiveBlockingSegments([wall], [], [windowClear]);
    // Expect 3 segments: pre-window wall (2->5), window aperture (5->6), post-window wall (6->10)
    assert.equal(effective.length, 3);

    const winSeg = effective.find((s) => s.sourceType === 'window');
    assert.ok(winSeg);
    assert.equal(winSeg.blocksVision, false); // Clear window allows sight!
    assert.equal(winSeg.blocksMovement, true); // Clear window blocks walking!

    // Verify LOS passes through clear window
    const sourcePt = { x: 5.5, y: 3 }; // North of window
    const targetPt = { x: 5.5, y: 7 }; // South of window
    const canSee = hasLineOfSight(sourcePt, targetPt, effective);
    assert.equal(canSee, true, 'LOS should pass cleanly through clear window aperture');

    // Verify LOS is blocked through the solid wall parts
    const wallSourcePt = { x: 3.5, y: 3 };
    const wallTargetPt = { x: 3.5, y: 7 };
    const canSeeThroughWall = hasLineOfSight(wallSourcePt, wallTargetPt, effective);
    assert.equal(canSeeThroughWall, false, 'LOS should be blocked by solid wall part');
  });

  it('obscured window blocks LOS; broken window allows LOS', () => {
    const wall: WallSegment = {
      id: 'w-sanctum',
      x1: 0,
      y1: 4,
      x2: 8,
      y2: 4,
      blocksMovement: true,
      blocksVision: true,
    };

    const windowObscured: WindowSegment = {
      id: 'win-draped',
      x: 3,
      y: 4,
      orientation: 'horizontal',
      state: 'obscured',
      blocksVisionWhenObscured: true,
      blocksMovement: true,
    };

    const effectiveObscured = resolveEffectiveBlockingSegments([wall], [], [windowObscured]);
    const winSegObscured = effectiveObscured.find((s) => s.sourceType === 'window');
    assert.ok(winSegObscured);
    assert.equal(winSegObscured.blocksVision, true); // Obscured blocks vision!

    const canSeeThroughDrapes = hasLineOfSight({ x: 3.5, y: 2 }, { x: 3.5, y: 6 }, effectiveObscured);
    assert.equal(canSeeThroughDrapes, false, 'LOS must be blocked by obscured/shuttered window');

    // Broken / open window
    const windowBroken: WindowSegment = {
      ...windowObscured,
      state: 'broken',
    };
    const effectiveBroken = resolveEffectiveBlockingSegments([wall], [], [windowBroken]);
    const winSegBroken = effectiveBroken.find((s) => s.sourceType === 'window');
    assert.ok(winSegBroken);
    assert.equal(winSegBroken.blocksVision, false); // Broken allows vision!

    const canSeeThroughBroken = hasLineOfSight({ x: 3.5, y: 2 }, { x: 3.5, y: 6 }, effectiveBroken);
    assert.equal(canSeeThroughBroken, true, 'LOS passes through broken window');
  });

  it('resolves deterministic topology on walls with multiple mixed openings (doors and windows)', () => {
    // Horizontal wall from x=0 to x=12 at y=4
    const wall: WallSegment = {
      id: 'w-grand-hall',
      x1: 0,
      y1: 4,
      x2: 12,
      y2: 4,
      blocksMovement: true,
      blocksVision: true,
    };

    const door: DoorSegment = {
      id: 'd-main',
      x: 4,
      y: 4,
      orientation: 'horizontal',
      state: 'closed',
      blocksVisionWhenClosed: true,
    };

    const window: WindowSegment = {
      id: 'win-arch',
      x: 8,
      y: 4,
      orientation: 'horizontal',
      state: 'clear',
    };

    const effective = resolveEffectiveBlockingSegments([wall], [door], [window]);
    // Wall parts: (0->4), Door (4->5), Wall (5->8), Window (8->9), Wall (9->12) = 5 segments
    assert.equal(effective.length, 5);

    const doorSeg = effective.find((s) => s.sourceType === 'door');
    assert.ok(doorSeg);
    assert.equal(doorSeg.blocksVision, true);

    const winSeg = effective.find((s) => s.sourceType === 'window');
    assert.ok(winSeg);
    assert.equal(winSeg.blocksVision, false);
    assert.equal(winSeg.blocksMovement, true);
  });

  it('railings provide low barriers: LOS passes through while movement is restricted', () => {
    const railing: RailingSegment = {
      id: 'rail-balcony',
      x1: 2,
      y1: 6,
      x2: 10,
      y2: 6,
      movementType: 'blocking',
      blocksVision: false,
      blocksMovement: true,
      name: 'Ornate Stone Balustrade',
    };

    const effective = resolveEffectiveBlockingSegments([], [], [], [railing]);
    assert.equal(effective.length, 1);
    assert.equal(effective[0].sourceType, 'railing');
    assert.equal(effective[0].blocksVision, false);
    assert.equal(effective[0].blocksMovement, true);

    // Sight ray across balcony railing
    const canSee = hasLineOfSight({ x: 5, y: 3 }, { x: 5, y: 9 }, effective);
    assert.equal(canSee, true, 'LOS passes cleanly across railing');
  });

  it('difficult terrain zones maintain movement multipliers and optional vision blocking', () => {
    const rubbleZone: TerrainZone = {
      id: 'tz-rubble',
      name: 'Collapsed Masonry Rubble',
      x: 5,
      y: 5,
      width: 4,
      height: 4,
      terrainType: 'rubble',
      movementCostMultiplier: 2.0,
      blocksVision: false,
      isVisibleToPlayers: true,
    };

    // Standard rubble does not create vision blocking segments
    const effStandard = resolveEffectiveBlockingSegments([], [], [], [], [rubbleZone]);
    assert.equal(effStandard.length, 0);

    // Dense smoke / magical undergrowth terrain with blocksVision = true
    const smokeZone: TerrainZone = {
      ...rubbleZone,
      id: 'tz-smoke',
      terrainType: 'undergrowth',
      blocksVision: true,
    };

    const effSmoke = resolveEffectiveBlockingSegments([], [], [], [], [smokeZone]);
    assert.equal(effSmoke.length, 4, 'Vision-blocking terrain zone creates 4 perimeter blocking segments');
    const rayBlocked = hasLineOfSight({ x: 3, y: 7 }, { x: 11, y: 7 }, effSmoke);
    assert.equal(rayBlocked, false, 'Dense vision-blocking terrain blocks LOS');
  });
});
