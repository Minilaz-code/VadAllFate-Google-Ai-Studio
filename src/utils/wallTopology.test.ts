import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPointOnLineSegment,
  findHostWallForDoor,
  resolveEffectiveBlockingSegments,
} from './wallTopology.ts';
import type { WallSegment, DoorSegment } from '../types/battlemap.ts';

describe('Wall & Door Topology (AIUI-CP002B1)', () => {
  const horizontalWall: WallSegment = {
    id: 'w-north',
    x1: 2,
    y1: 10,
    x2: 18,
    y2: 10,
    blocksMovement: true,
    blocksVision: true,
  };

  const verticalWall: WallSegment = {
    id: 'w-east',
    x1: 18,
    y1: 2,
    x2: 18,
    y2: 14,
    blocksMovement: true,
    blocksVision: true,
  };

  it('snaps candidate doors to the host wall and assigns orientation', () => {
    // Door dropped near horizontal wall at (10, 10.3)
    const hostH = findHostWallForDoor(10, 10.3, [horizontalWall, verticalWall], 1.0);
    assert.ok(hostH);
    assert.equal(hostH.wall.id, 'w-north');
    assert.equal(hostH.orientation, 'horizontal');
    assert.equal(hostH.snappedY, 10);
    assert.equal(hostH.snappedX, 10);

    // Door dropped near vertical wall at (18.2, 6)
    const hostV = findHostWallForDoor(18.2, 6, [horizontalWall, verticalWall], 1.0);
    assert.ok(hostV);
    assert.equal(hostV.wall.id, 'w-east');
    assert.equal(hostV.orientation, 'vertical');
    assert.equal(hostV.snappedX, 18);
    assert.equal(hostV.snappedY, 6);
  });

  it('rejects candidate doors that float arbitrarily away from valid walls', () => {
    // Far point (5, 5) with snap radius 1.0
    const floating = findHostWallForDoor(5, 5, [horizontalWall, verticalWall], 1.0);
    assert.equal(floating, null);
  });

  it('splits wall at closed door: door segment blocks movement and vision', () => {
    const closedDoor: DoorSegment = {
      id: 'd1',
      x: 10,
      y: 10,
      orientation: 'horizontal',
      state: 'closed',
      blocksVisionWhenClosed: true,
    };

    const eff = resolveEffectiveBlockingSegments([horizontalWall], [closedDoor]);
    // Should be split into 3 segments:
    // 1. Wall from 2 to 10
    // 2. Doorway from 10 to 11 (closed => blocksMovement: true, blocksVision: true)
    // 3. Wall from 11 to 18
    assert.equal(eff.length, 3);

    const [part1, doorSeg, part2] = eff;
    assert.equal(part1.x1, 2);
    assert.equal(part1.x2, 10);
    assert.equal(part1.blocksVision, true);

    assert.equal(doorSeg.sourceType, 'door');
    assert.equal(doorSeg.x1, 10);
    assert.equal(doorSeg.x2, 11);
    assert.equal(doorSeg.blocksMovement, true);
    assert.equal(doorSeg.blocksVision, true);

    assert.equal(part2.x1, 11);
    assert.equal(part2.x2, 18);
    assert.equal(part2.blocksVision, true);
  });

  it('splits wall at open door: doorway does NOT block movement or vision', () => {
    const openDoor: DoorSegment = {
      id: 'd1',
      x: 10,
      y: 10,
      orientation: 'horizontal',
      state: 'open',
      blocksVisionWhenClosed: true,
    };

    const eff = resolveEffectiveBlockingSegments([horizontalWall], [openDoor]);
    assert.equal(eff.length, 3);

    const doorSeg = eff[1];
    assert.equal(doorSeg.sourceType, 'door');
    assert.equal(doorSeg.blocksMovement, false);
    assert.equal(doorSeg.blocksVision, false);
  });

  it('handles multiple doors on a single wall segment correctly', () => {
    const door1: DoorSegment = {
      id: 'd1',
      x: 5,
      y: 10,
      orientation: 'horizontal',
      state: 'closed',
      blocksVisionWhenClosed: true,
    };
    const door2: DoorSegment = {
      id: 'd2',
      x: 14,
      y: 10,
      orientation: 'horizontal',
      state: 'open',
      blocksVisionWhenClosed: true,
    };

    const eff = resolveEffectiveBlockingSegments([horizontalWall], [door1, door2]);
    // 5 parts: 2-5 (wall), 5-6 (d1 closed), 6-14 (wall), 14-15 (d2 open), 15-18 (wall)
    assert.equal(eff.length, 5);
    assert.equal(eff[0].x1, 2);
    assert.equal(eff[0].x2, 5);

    assert.equal(eff[1].sourceId, 'd1');
    assert.equal(eff[1].blocksVision, true);

    assert.equal(eff[2].x1, 6);
    assert.equal(eff[2].x2, 14);

    assert.equal(eff[3].sourceId, 'd2');
    assert.equal(eff[3].blocksVision, false);

    assert.equal(eff[4].x1, 15);
    assert.equal(eff[4].x2, 18);
  });
});
