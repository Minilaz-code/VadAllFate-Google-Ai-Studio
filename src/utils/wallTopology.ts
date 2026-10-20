/**
 * VadAllFate — Wall & Door Topology Utilities (AIUI-CP002B1)
 *
 * Implements deterministic relationships between wall segments and door openings:
 * - A door interrupts the host wall segment so an open door exposes a genuine opening.
 * - Closed and locked doors block movement and vision.
 * - Doors snap to valid wall or room perimeter boundaries.
 * - Deleting a host wall handles associated doors cleanly.
 * - Prepares topologically sound blocking segments for CP002C Line of Sight calculations.
 */

import type { WallSegment, DoorSegment, RectangularRoom } from '../types/battlemap.ts';

export interface BlockingSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  blocksMovement: boolean;
  blocksVision: boolean;
  sourceType: 'wall' | 'door';
  sourceId: string;
}

/**
 * Checks if a point lies approximately along a straight line segment.
 */
export function isPointOnLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tolerance = 0.5
): boolean {
  const minX = Math.min(x1, x2) - tolerance;
  const maxX = Math.max(x1, x2) + tolerance;
  const minY = Math.min(y1, y2) - tolerance;
  const maxY = Math.max(y1, y2) + tolerance;

  if (px < minX || px > maxX || py < minY || py > maxY) {
    return false;
  }

  // Cross product distance
  const lineLength = Math.hypot(x2 - x1, y2 - y1);
  if (lineLength === 0) return Math.hypot(px - x1, py - y1) <= tolerance;

  const distance = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / lineLength;
  return distance <= tolerance;
}

/**
 * Finds the closest wall segment for a candidate door point.
 */
export function findHostWallForDoor(
  doorX: number,
  doorY: number,
  walls: WallSegment[],
  maxSnapDistance = 1.0
): { wall: WallSegment; orientation: 'horizontal' | 'vertical'; snappedX: number; snappedY: number } | null {
  let closest: {
    wall: WallSegment;
    orientation: 'horizontal' | 'vertical';
    snappedX: number;
    snappedY: number;
    dist: number;
  } | null = null;

  for (const wall of walls) {
    const isHorizontal = Math.abs(wall.y2 - wall.y1) < 0.001;
    const isVertical = Math.abs(wall.x2 - wall.x1) < 0.001;

    if (isHorizontal) {
      const minX = Math.min(wall.x1, wall.x2);
      const maxX = Math.max(wall.x1, wall.x2);
      if (doorX >= minX - maxSnapDistance && doorX <= maxX + maxSnapDistance) {
        const dist = Math.abs(doorY - wall.y1);
        if (dist <= maxSnapDistance && (!closest || dist < closest.dist)) {
          closest = {
            wall,
            orientation: 'horizontal',
            snappedX: Math.max(minX, Math.min(maxX - 1, Math.round(doorX))),
            snappedY: wall.y1,
            dist,
          };
        }
      }
    } else if (isVertical) {
      const minY = Math.min(wall.y1, wall.y2);
      const maxY = Math.max(wall.y1, wall.y2);
      if (doorY >= minY - maxSnapDistance && doorY <= maxY + maxSnapDistance) {
        const dist = Math.abs(doorX - wall.x1);
        if (dist <= maxSnapDistance && (!closest || dist < closest.dist)) {
          closest = {
            wall,
            orientation: 'vertical',
            snappedX: wall.x1,
            snappedY: Math.max(minY, Math.min(maxY - 1, Math.round(doorY))),
            dist,
          };
        }
      }
    }
  }

  if (closest) {
    return {
      wall: closest.wall,
      orientation: closest.orientation,
      snappedX: closest.snappedX,
      snappedY: closest.snappedY,
    };
  }

  return null;
}

/**
 * Derives the perimeter wall segments of rectangular rooms if no explicit wall exists.
 */
export function deriveRoomPerimeterWalls(room: RectangularRoom): WallSegment[] {
  return [
    {
      id: `${room.id}-north`,
      x1: room.x,
      y1: room.y,
      x2: room.x + room.width,
      y2: room.y,
      blocksMovement: true,
      blocksVision: true,
    },
    {
      id: `${room.id}-east`,
      x1: room.x + room.width,
      y1: room.y,
      x2: room.x + room.width,
      y2: room.y + room.height,
      blocksMovement: true,
      blocksVision: true,
    },
    {
      id: `${room.id}-south`,
      x1: room.x + room.width,
      y1: room.y + room.height,
      x2: room.x,
      y2: room.y + room.height,
      blocksMovement: true,
      blocksVision: true,
    },
    {
      id: `${room.id}-west`,
      x1: room.x,
      y1: room.y + room.height,
      x2: room.x,
      y2: room.y,
      blocksMovement: true,
      blocksVision: true,
    },
  ];
}

/**
 * Resolves effective blocking segments for rendering and line-of-sight calculations.
 * When a door is on a wall:
 * - If door is 'closed' or 'locked', it blocks vision and movement.
 * - If door is 'open', it creates a genuine pass-through gap where neither vision nor movement is blocked.
 * - The original wall segment is cleanly split so the doorway itself reflects the door state.
 */
export function resolveEffectiveBlockingSegments(
  walls: WallSegment[],
  doors: DoorSegment[]
): BlockingSegment[] {
  const result: BlockingSegment[] = [];

  for (const wall of walls) {
    const isHorizontal = Math.abs(wall.y2 - wall.y1) < 0.001;
    const isVertical = Math.abs(wall.x2 - wall.x1) < 0.001;

    // Find doors located on this wall segment
    const doorsOnWall = doors.filter((door) => {
      if (isHorizontal && door.orientation === 'horizontal') {
        const minX = Math.min(wall.x1, wall.x2);
        const maxX = Math.max(wall.x1, wall.x2);
        return Math.abs(door.y - wall.y1) < 0.5 && door.x >= minX - 0.5 && door.x <= maxX + 0.5;
      }
      if (isVertical && door.orientation === 'vertical') {
        const minY = Math.min(wall.y1, wall.y2);
        const maxY = Math.max(wall.y1, wall.y2);
        return Math.abs(door.x - wall.x1) < 0.5 && door.y >= minY - 0.5 && door.y <= maxY + 0.5;
      }
      return false;
    });

    if (doorsOnWall.length === 0) {
      // Wall has no doors; preserve as is
      result.push({
        id: `eff-${wall.id}`,
        x1: wall.x1,
        y1: wall.y1,
        x2: wall.x2,
        y2: wall.y2,
        blocksMovement: wall.blocksMovement,
        blocksVision: wall.blocksVision,
        sourceType: 'wall',
        sourceId: wall.id,
      });
      continue;
    }

    if (isHorizontal) {
      const minX = Math.min(wall.x1, wall.x2);
      const maxX = Math.max(wall.x1, wall.x2);
      const y = wall.y1;

      // Sort doors from west to east
      const sortedDoors = [...doorsOnWall].sort((a, b) => a.x - b.x);

      let currentX = minX;
      sortedDoors.forEach((door, idx) => {
        const doorStart = Math.max(currentX, door.x);
        const doorEnd = Math.min(maxX, door.x + 1);

        // Pre-door wall segment
        if (doorStart > currentX) {
          result.push({
            id: `eff-${wall.id}-part-${idx}`,
            x1: currentX,
            y1: y,
            x2: doorStart,
            y2: y,
            blocksMovement: wall.blocksMovement,
            blocksVision: wall.blocksVision,
            sourceType: 'wall',
            sourceId: wall.id,
          });
        }

        // Doorway segment: depends strictly on door state
        const blocksVision = door.state !== 'open' && door.blocksVisionWhenClosed;
        const blocksMovement = door.state !== 'open';
        result.push({
          id: `eff-door-${door.id}`,
          x1: doorStart,
          y1: y,
          x2: doorEnd,
          y2: y,
          blocksMovement,
          blocksVision,
          sourceType: 'door',
          sourceId: door.id,
        });

        currentX = doorEnd;
      });

      // Post-door remaining wall segment
      if (currentX < maxX) {
        result.push({
          id: `eff-${wall.id}-tail`,
          x1: currentX,
          y1: y,
          x2: maxX,
          y2: y,
          blocksMovement: wall.blocksMovement,
          blocksVision: wall.blocksVision,
          sourceType: 'wall',
          sourceId: wall.id,
        });
      }
    } else if (isVertical) {
      const minY = Math.min(wall.y1, wall.y2);
      const maxY = Math.max(wall.y1, wall.y2);
      const x = wall.x1;

      // Sort doors from north to south
      const sortedDoors = [...doorsOnWall].sort((a, b) => a.y - b.y);

      let currentY = minY;
      sortedDoors.forEach((door, idx) => {
        const doorStart = Math.max(currentY, door.y);
        const doorEnd = Math.min(maxY, door.y + 1);

        // Pre-door wall segment
        if (doorStart > currentY) {
          result.push({
            id: `eff-${wall.id}-part-${idx}`,
            x1: x,
            y1: currentY,
            x2: x,
            y2: doorStart,
            blocksMovement: wall.blocksMovement,
            blocksVision: wall.blocksVision,
            sourceType: 'wall',
            sourceId: wall.id,
          });
        }

        // Doorway segment
        const blocksVision = door.state !== 'open' && door.blocksVisionWhenClosed;
        const blocksMovement = door.state !== 'open';
        result.push({
          id: `eff-door-${door.id}`,
          x1: x,
          y1: doorStart,
          x2: x,
          y2: doorEnd,
          blocksMovement,
          blocksVision,
          sourceType: 'door',
          sourceId: door.id,
        });

        currentY = doorEnd;
      });

      // Post-door remaining wall segment
      if (currentY < maxY) {
        result.push({
          id: `eff-${wall.id}-tail`,
          x1: x,
          y1: currentY,
          x2: x,
          y2: maxY,
          blocksMovement: wall.blocksMovement,
          blocksVision: wall.blocksVision,
          sourceType: 'wall',
          sourceId: wall.id,
        });
      }
    }
  }

  return result;
}
