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

import type {
  WallSegment,
  DoorSegment,
  RectangularRoom,
  WindowSegment,
  RailingSegment,
  TerrainZone,
} from '../types/battlemap.ts';

export interface BlockingSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  blocksMovement: boolean;
  blocksVision: boolean;
  sourceType: 'wall' | 'door' | 'window' | 'railing' | 'terrain';
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
/**
 * Finds the closest wall segment for a candidate window point.
 */
export function findHostWallForWindow(
  windowX: number,
  windowY: number,
  walls: WallSegment[],
  maxSnapDistance = 1.0
): { wall: WallSegment; orientation: 'horizontal' | 'vertical'; snappedX: number; snappedY: number } | null {
  return findHostWallForDoor(windowX, windowY, walls, maxSnapDistance);
}

/**
 * Resolves effective blocking segments for rendering and line-of-sight calculations.
 * Supports:
 * - Walls, interrupted by doors and windows.
 * - Doors: open allows LOS & movement; closed/locked blocks both.
 * - Windows: clear allows LOS but blocks walking; obscured blocks LOS; broken allows LOS.
 * - Railings: low barriers that do NOT block vision by default.
 * - Vision-obstructing terrain zones.
 */
export function resolveEffectiveBlockingSegments(
  walls: WallSegment[],
  doors: DoorSegment[],
  windows: WindowSegment[] = [],
  railings: RailingSegment[] = [],
  terrain: TerrainZone[] = []
): BlockingSegment[] {
  const result: BlockingSegment[] = [];

  for (const wall of walls) {
    const isHorizontal = Math.abs(wall.y2 - wall.y1) < 0.001;
    const isVertical = Math.abs(wall.x2 - wall.x1) < 0.001;

    interface ApertureItem {
      id: string;
      sourceType: 'door' | 'window';
      sourceId: string;
      coord: number;
      span: number;
      blocksVision: boolean;
      blocksMovement: boolean;
    }

    const apertures: ApertureItem[] = [];

    // Find doors on this wall
    doors.forEach((door) => {
      if (isHorizontal && door.orientation === 'horizontal') {
        const minX = Math.min(wall.x1, wall.x2);
        const maxX = Math.max(wall.x1, wall.x2);
        if (Math.abs(door.y - wall.y1) < 0.5 && door.x >= minX - 0.5 && door.x <= maxX + 0.5) {
          apertures.push({
            id: `eff-door-${door.id}`,
            sourceType: 'door',
            sourceId: door.id,
            coord: door.x,
            span: 1,
            blocksVision: door.state !== 'open' && door.blocksVisionWhenClosed,
            blocksMovement: door.state !== 'open',
          });
        }
      } else if (isVertical && door.orientation === 'vertical') {
        const minY = Math.min(wall.y1, wall.y2);
        const maxY = Math.max(wall.y1, wall.y2);
        if (Math.abs(door.x - wall.x1) < 0.5 && door.y >= minY - 0.5 && door.y <= maxY + 0.5) {
          apertures.push({
            id: `eff-door-${door.id}`,
            sourceType: 'door',
            sourceId: door.id,
            coord: door.y,
            span: 1,
            blocksVision: door.state !== 'open' && door.blocksVisionWhenClosed,
            blocksMovement: door.state !== 'open',
          });
        }
      }
    });

    // Find windows on this wall
    windows.forEach((win) => {
      if (isHorizontal && win.orientation === 'horizontal') {
        const minX = Math.min(wall.x1, wall.x2);
        const maxX = Math.max(wall.x1, wall.x2);
        if (Math.abs(win.y - wall.y1) < 0.5 && win.x >= minX - 0.5 && win.x <= maxX + 0.5) {
          apertures.push({
            id: `eff-window-${win.id}`,
            sourceType: 'window',
            sourceId: win.id,
            coord: win.x,
            span: 1,
            blocksVision: win.state === 'obscured' ? (win.blocksVisionWhenObscured !== false) : false,
            blocksMovement: win.blocksMovement !== false,
          });
        }
      } else if (isVertical && win.orientation === 'vertical') {
        const minY = Math.min(wall.y1, wall.y2);
        const maxY = Math.max(wall.y1, wall.y2);
        if (Math.abs(win.x - wall.x1) < 0.5 && win.y >= minY - 0.5 && win.y <= maxY + 0.5) {
          apertures.push({
            id: `eff-window-${win.id}`,
            sourceType: 'window',
            sourceId: win.id,
            coord: win.y,
            span: 1,
            blocksVision: win.state === 'obscured' ? (win.blocksVisionWhenObscured !== false) : false,
            blocksMovement: win.blocksMovement !== false,
          });
        }
      }
    });

    if (apertures.length === 0) {
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

    // Sort apertures along wall
    apertures.sort((a, b) => a.coord - b.coord);

    if (isHorizontal) {
      const minX = Math.min(wall.x1, wall.x2);
      const maxX = Math.max(wall.x1, wall.x2);
      const y = wall.y1;

      let currentX = minX;
      apertures.forEach((ap, idx) => {
        const apStart = Math.max(currentX, ap.coord);
        const apEnd = Math.min(maxX, ap.coord + ap.span);

        if (apStart > currentX) {
          result.push({
            id: `eff-${wall.id}-part-${idx}`,
            x1: currentX,
            y1: y,
            x2: apStart,
            y2: y,
            blocksMovement: wall.blocksMovement,
            blocksVision: wall.blocksVision,
            sourceType: 'wall',
            sourceId: wall.id,
          });
        }

        result.push({
          id: ap.id,
          x1: apStart,
          y1: y,
          x2: apEnd,
          y2: y,
          blocksMovement: ap.blocksMovement,
          blocksVision: ap.blocksVision,
          sourceType: ap.sourceType,
          sourceId: ap.sourceId,
        });

        currentX = apEnd;
      });

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

      let currentY = minY;
      apertures.forEach((ap, idx) => {
        const apStart = Math.max(currentY, ap.coord);
        const apEnd = Math.min(maxY, ap.coord + ap.span);

        if (apStart > currentY) {
          result.push({
            id: `eff-${wall.id}-part-${idx}`,
            x1: x,
            y1: currentY,
            x2: x,
            y2: apStart,
            blocksMovement: wall.blocksMovement,
            blocksVision: wall.blocksVision,
            sourceType: 'wall',
            sourceId: wall.id,
          });
        }

        result.push({
          id: ap.id,
          x1: x,
          y1: apStart,
          x2: x,
          y2: apEnd,
          blocksMovement: ap.blocksMovement,
          blocksVision: ap.blocksVision,
          sourceType: ap.sourceType,
          sourceId: ap.sourceId,
        });

        currentY = apEnd;
      });

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

  // Add railings
  for (const r of railings) {
    result.push({
      id: `eff-railing-${r.id}`,
      x1: r.x1,
      y1: r.y1,
      x2: r.x2,
      y2: r.y2,
      blocksMovement: r.movementType === 'blocking' ? true : (r.blocksMovement ?? true),
      blocksVision: r.blocksVision ?? false,
      sourceType: 'railing',
      sourceId: r.id,
    });
  }

  // Add vision-blocking terrain boundaries if any
  for (const t of terrain) {
    if (t.blocksVision) {
      result.push(
        { id: `eff-terrain-${t.id}-t`, x1: t.x, y1: t.y, x2: t.x + t.width, y2: t.y, blocksMovement: false, blocksVision: true, sourceType: 'terrain', sourceId: t.id },
        { id: `eff-terrain-${t.id}-r`, x1: t.x + t.width, y1: t.y, x2: t.x + t.width, y2: t.y + t.height, blocksMovement: false, blocksVision: true, sourceType: 'terrain', sourceId: t.id },
        { id: `eff-terrain-${t.id}-b`, x1: t.x + t.width, y1: t.y + t.height, x2: t.x, y2: t.y + t.height, blocksMovement: false, blocksVision: true, sourceType: 'terrain', sourceId: t.id },
        { id: `eff-terrain-${t.id}-l`, x1: t.x, y1: t.y + t.height, x2: t.x, y2: t.y, blocksMovement: false, blocksVision: true, sourceType: 'terrain', sourceId: t.id }
      );
    }
  }

  return result;
}
