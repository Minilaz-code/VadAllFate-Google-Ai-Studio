import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLineSegmentIntersection,
  hasLineOfSight,
  isCellVisibleFromSource,
  computeVisibleGridCells,
  resolveCellVisibility,
  updateExploredCells,
  manualRevealCells,
  manualHideCells,
  resetExploredFog,
  isEntityVisibleOnBattlemap,
  type VisionSource,
} from './lineOfSight.ts';
import type { BlockingSegment } from './wallTopology.ts';
import type { FogOfWarState } from '../types/battlemap.ts';

describe('Deterministic Line of Sight & Tactical Visibility (AIUI-CP002C)', () => {
  it('detects ray-segment intersection correctly without endpoint self-shadowing', () => {
    const rayStart = { x: 0, y: 0 };
    const rayEnd = { x: 10, y: 10 };
    const wallStart = { x: 0, y: 10 };
    const wallEnd = { x: 10, y: 0 };

    const hit = getLineSegmentIntersection(rayStart, rayEnd, wallStart, wallEnd);
    assert.ok(hit);
    assert.ok(Math.abs(hit.point.x - 5) < 0.01);
    assert.ok(Math.abs(hit.point.y - 5) < 0.01);

    // Parallel segments do not intersect
    const hitParallel = getLineSegmentIntersection(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 5 },
      { x: 10, y: 5 }
    );
    assert.equal(hitParallel, null);
  });

  it('unobstructed space allows clear line of sight up to maximum sight radius', () => {
    const source = { x: 5, y: 5 };
    const targetInside = { x: 8, y: 5 };
    const targetOutside = { x: 25, y: 5 };

    assert.equal(hasLineOfSight(source, targetInside, [], 10), true);
    assert.equal(hasLineOfSight(source, targetOutside, [], 10), false, 'Exceeds max distance');
  });

  it('wall segments with blocksVision: true obstruct LOS; blocksVision: false allow LOS', () => {
    const source = { x: 2, y: 5 };
    const target = { x: 10, y: 5 };

    const solidWall: BlockingSegment = {
      id: 'w-solid',
      x1: 6,
      y1: 0,
      x2: 6,
      y2: 10,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'w1',
    };

    assert.equal(hasLineOfSight(source, target, [solidWall]), false, 'Solid wall blocks vision');

    const lowBarrowWall: BlockingSegment = {
      id: 'w-low',
      x1: 6,
      y1: 0,
      x2: 6,
      y2: 10,
      blocksMovement: true,
      blocksVision: false, // Low wall or half-cover railing
      sourceType: 'wall',
      sourceId: 'w2',
    };

    assert.equal(hasLineOfSight(source, target, [lowBarrowWall]), true, 'Low wall allows vision');
  });

  it('closed doors obstruct vision; open doors expose a genuine opening allowing sight into connected room', () => {
    const sourceInRoom1 = { x: 2, y: 5 };
    const targetInRoom2 = { x: 8, y: 5 };

    // Closed door segment at x = 5
    const closedDoorSegment: BlockingSegment = {
      id: 'door-1',
      x1: 5,
      y1: 4,
      x2: 5,
      y2: 6,
      blocksMovement: true,
      blocksVision: true, // Closed
      sourceType: 'door',
      sourceId: 'd1',
    };

    assert.equal(
      hasLineOfSight(sourceInRoom1, targetInRoom2, [closedDoorSegment]),
      false,
      'Closed door blocks line of sight'
    );

    // Open door: blocksVision is false
    const openDoorSegment: BlockingSegment = {
      ...closedDoorSegment,
      blocksVision: false, // Open
      blocksMovement: false,
    };

    assert.equal(
      hasLineOfSight(sourceInRoom1, targetInRoom2, [openDoorSegment]),
      true,
      'Open door allows line of sight through doorway'
    );
  });

  it('vision does not leak through wall corners', () => {
    // Corner at (5, 5) formed by (0,5)-(5,5) and (5,5)-(5,10)
    const wall1: BlockingSegment = {
      id: 'w-h',
      x1: 0,
      y1: 5,
      x2: 5,
      y2: 5,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'w1',
    };
    const wall2: BlockingSegment = {
      id: 'w-v',
      x1: 5,
      y1: 5,
      x2: 5,
      y2: 10,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'w2',
    };

    const source = { x: 2, y: 8 }; // In top-left zone
    const target = { x: 8, y: 2 }; // In bottom-right zone behind corner

    assert.equal(hasLineOfSight(source, target, [wall1, wall2]), false, 'Corner blocks diagonal view');
  });

  it('vision travels cleanly through narrow straight corridors', () => {
    // Horizontal corridor between y=3 and y=5 from x=0 to x=20
    const northCorridorWall: BlockingSegment = {
      id: 'w-c-north',
      x1: 0,
      y1: 3,
      x2: 20,
      y2: 3,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'w-cn',
    };
    const southCorridorWall: BlockingSegment = {
      id: 'w-c-south',
      x1: 0,
      y1: 5,
      x2: 20,
      y2: 5,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'w-cs',
    };

    const sourceAtCorridorStart = { x: 1, y: 4 };
    const targetAtCorridorEnd = { x: 15, y: 4 };
    const targetOutsideCorridor = { x: 15, y: 8 };

    assert.equal(
      hasLineOfSight(sourceAtCorridorStart, targetAtCorridorEnd, [northCorridorWall, southCorridorWall], 20),
      true,
      'Vision travels cleanly along corridor'
    );
    assert.equal(
      hasLineOfSight(sourceAtCorridorStart, targetOutsideCorridor, [northCorridorWall, southCorridorWall], 20),
      false,
      'Corridor wall blocks vision outside'
    );
  });

  it('computes discrete visible grid cells accurately for a vision source', () => {
    const source: VisionSource = {
      id: 'tok-kaelen',
      name: 'Kaelen',
      x: 5,
      y: 5,
      sightRadiusCells: 4,
    };

    const wall: BlockingSegment = {
      id: 'w-div',
      x1: 7,
      y1: 0,
      x2: 7,
      y2: 10,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'w1',
    };

    const visibleCells = computeVisibleGridCells([source], [wall], 10, 10);

    // Cells on Kaelen's side (x=5, y=5) must be visible
    assert.ok(visibleCells.has('5,5'));
    assert.ok(visibleCells.has('6,5'));

    // Cells beyond the wall (x=8, y=5) must NOT be visible
    assert.equal(visibleCells.has('8,5'), false, 'Cell behind wall is obscured');
  });

  it('resolves three-state fog of war: unexplored, explored, and currently visible', () => {
    const fog: FogOfWarState = {
      enabled: true,
      defaultState: 'hidden',
      revealedCells: ['10,10'], // Manually revealed cell
      exploredCells: ['3,3', '4,4'], // Historically explored
      hiddenCells: [],
      previousExploredCells: [],
    };

    const currentlyVisible = new Set<string>(['5,5', '5,6']);

    // 1. Currently visible
    assert.equal(resolveCellVisibility(5, 5, fog, currentlyVisible), 'visible');
    assert.equal(resolveCellVisibility(10, 10, fog, currentlyVisible), 'visible', 'Manually revealed is visible');

    // 2. Explored (darkened terrain)
    assert.equal(resolveCellVisibility(3, 3, fog, currentlyVisible), 'explored');

    // 3. Unexplored
    assert.equal(resolveCellVisibility(0, 0, fog, currentlyVisible), 'unexplored');
  });

  it('never reveals undiscovered/hidden NPCs to players even in currently visible cells', () => {
    const fog: FogOfWarState = {
      enabled: true,
      defaultState: 'hidden',
      revealedCells: [],
      exploredCells: [],
      hiddenCells: [],
      previousExploredCells: [],
    };

    const currentlyVisible = new Set<string>(['5,5']);

    // 1. Hidden NPC (isVisibleToPlayers: false) standing in cell (5,5)
    const hiddenGhoulVisibleToPlayer = isEntityVisibleOnBattlemap(
      5,
      5,
      false, // Hidden from players
      false, // Player perspective
      fog,
      currentlyVisible
    );
    assert.equal(hiddenGhoulVisibleToPlayer, false, 'Hidden NPC must never be visible to player');

    // DM perspective CAN see hidden NPC
    const hiddenGhoulVisibleToDm = isEntityVisibleOnBattlemap(
      5,
      5,
      false,
      true, // DM perspective
      fog,
      currentlyVisible
    );
    assert.equal(hiddenGhoulVisibleToDm, true, 'DM must see hidden NPC');

    // 2. Explored cell alone does NOT reveal live token positions to players
    const tokenInExploredCell = isEntityVisibleOnBattlemap(
      3,
      3,
      true, // Visible to players flag
      false, // Player perspective
      { ...fog, exploredCells: ['3,3'] },
      currentlyVisible // Currently visible does NOT include (3,3)
    );
    assert.equal(tokenInExploredCell, false, 'Tokens in previously explored cells are NOT visible');
  });

  it('manual reveal and hide operations update fog state cleanly', () => {
    const initialFog: FogOfWarState = {
      enabled: true,
      defaultState: 'hidden',
      revealedCells: [],
      exploredCells: [],
      hiddenCells: [],
      previousExploredCells: [],
    };

    // Reveal room cells
    const revealed = manualRevealCells(initialFog, ['1,1', '1,2', '2,1', '2,2']);
    assert.ok(revealed.revealedCells.includes('1,1'));
    assert.ok(revealed.exploredCells.includes('1,1'));

    // Conceal one cell back into fog
    const hidden = manualHideCells(revealed, ['1,1']);
    assert.equal(hidden.revealedCells.includes('1,1'), false);
    assert.ok(hidden.hiddenCells?.includes('1,1'));

    // Reset explored fog
    const reset = resetExploredFog(hidden, 'hidden');
    assert.equal(reset.revealedCells.length, 0);
    assert.equal(reset.exploredCells.length, 0);
  });
});
