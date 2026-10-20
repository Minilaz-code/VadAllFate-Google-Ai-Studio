/**
 * VadAllFate — Deterministic Line of Sight & Tactical Visibility Engine (AIUI-CP002C)
 *
 * Implements pure TypeScript algorithms for:
 * 1. Ray-Segment Intersections with vision-blocking walls and closed doors
 * 2. Grid-cell visibility determination with configurable sight radius
 * 3. 2D Visibility Polygon raycasting for smooth canvas / SVG rendering
 * 4. Three-state Tactical Fog of War (Unexplored, Explored, Currently Visible)
 * 5. Manual DM Fog Reveal / Hide operations and exploration accumulation
 *
 * ARCHITECTURAL INVARIANTS:
 * - Pure calculations independent of React lifecycle and DOM state.
 * - Non-authoritative demonstration calculations; canonical Python backend remains authoritative.
 * - Deterministic, floating-point safe, and performant up to 100x100 grid maps.
 */

import type { BlockingSegment } from './wallTopology.ts';
import type { FogOfWarState, CellVisibilityState } from '../types/battlemap.ts';

export interface Point2D {
  x: number;
  y: number;
}

export interface VisionSource {
  id: string;
  name: string;
  x: number; // Grid-cell coordinates
  y: number;
  sightRadiusCells: number; // e.g. 60ft / 5ft = 12 cells
  entityType?: 'character' | 'npc';
  isVisibleToPlayers?: boolean;
}

export interface RayIntersection {
  point: Point2D;
  param: number; // Distance along ray (0 to 1 or t)
  segment?: BlockingSegment;
}

/**
 * Checks if two 2D line segments (p1->p2 and p3->p4) intersect.
 * Returns intersection point and t parameter along p1->p2 if they intersect.
 */
export function getLineSegmentIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): RayIntersection | null {
  const dX1 = p2.x - p1.x;
  const dY1 = p2.y - p1.y;
  const dX2 = p4.x - p3.x;
  const dY2 = p4.y - p3.y;

  const denominator = dX1 * dY2 - dY1 * dX2;

  // Parallel or collinear lines
  if (Math.abs(denominator) < 1e-9) {
    return null;
  }

  const t = ((p3.x - p1.x) * dY2 - (p3.y - p1.y) * dX2) / denominator;
  const u = ((p3.x - p1.x) * dY1 - (p3.y - p1.y) * dX1) / denominator;

  // Check if intersection lies strictly within both segments
  // We use small epsilon margins to prevent self-shadowing at segment endpoints
  const eps = 1e-5;
  if (t >= eps && t <= 1 - eps && u >= 0 && u <= 1) {
    return {
      point: {
        x: p1.x + t * dX1,
        y: p1.y + t * dY1,
      },
      param: t,
    };
  }

  return null;
}

/**
 * Casts a line segment from source to target and checks if ANY vision-blocking segment obstructs it.
 * Ignores segments that do not block vision.
 */
export function hasLineOfSight(
  source: Point2D,
  target: Point2D,
  blockingSegments: BlockingSegment[],
  maxDistanceCells?: number
): boolean {
  const dist = Math.hypot(target.x - source.x, target.y - source.y);

  if (maxDistanceCells !== undefined && dist > maxDistanceCells) {
    return false;
  }

  // Trivial zero-distance check
  if (dist < 1e-4) {
    return true;
  }

  for (const seg of blockingSegments) {
    if (!seg.blocksVision) continue;

    const p3 = { x: seg.x1, y: seg.y1 };
    const p4 = { x: seg.x2, y: seg.y2 };

    const hit = getLineSegmentIntersection(source, target, p3, p4);
    if (hit) {
      return false; // Obstructed by wall or closed door
    }
  }

  return true;
}

/**
 * Checks whether a discrete grid cell is visible from a vision source.
 * Evaluates the cell center and multi-sample offset points to prevent corner artifacts.
 */
export function isCellVisibleFromSource(
  cellX: number,
  cellY: number,
  source: VisionSource,
  blockingSegments: BlockingSegment[]
): boolean {
  const center: Point2D = { x: cellX + 0.5, y: cellY + 0.5 };
  const sourcePt: Point2D = { x: source.x, y: source.y };

  // Check distance to cell center
  const dist = Math.hypot(center.x - sourcePt.x, center.y - sourcePt.y);
  if (dist > source.sightRadiusCells) {
    return false;
  }

  // Primary check: Direct ray to center
  if (hasLineOfSight(sourcePt, center, blockingSegments, source.sightRadiusCells)) {
    return true;
  }

  // Secondary multi-sample check (insets at 0.25 and 0.75) for partial cell visibility around corners
  const sampleOffsets = [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ];

  for (const offset of sampleOffsets) {
    const pt = { x: cellX + offset.x, y: cellY + offset.y };
    if (hasLineOfSight(sourcePt, pt, blockingSegments, source.sightRadiusCells)) {
      return true;
    }
  }

  return false;
}

/**
 * Computes all currently visible grid cells for a set of vision sources.
 * Returns a Set of "x,y" coordinate keys for $O(1)$ lookups.
 */
export function computeVisibleGridCells(
  sources: VisionSource[],
  blockingSegments: BlockingSegment[],
  gridWidth: number,
  gridHeight: number
): Set<string> {
  const visible = new Set<string>();

  if (sources.length === 0) {
    return visible;
  }

  // Filter only vision-blocking segments
  const visionBlockers = blockingSegments.filter((s) => s.blocksVision);

  for (const source of sources) {
    const minX = Math.max(0, Math.floor(source.x - source.sightRadiusCells));
    const maxX = Math.min(gridWidth - 1, Math.ceil(source.x + source.sightRadiusCells));
    const minY = Math.max(0, Math.floor(source.y - source.sightRadiusCells));
    const maxY = Math.min(gridHeight - 1, Math.ceil(source.y + source.sightRadiusCells));

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = `${cx},${cy}`;
        if (visible.has(key)) continue;

        if (isCellVisibleFromSource(cx, cy, source, visionBlockers)) {
          visible.add(key);
        }
      }
    }
  }

  return visible;
}

/**
 * Computes a smooth 2D Visibility Polygon radiating outward from an origin point.
 * Sweeps rays around all blocking segment endpoints and boundary bounds.
 */
export function computeVisibilityPolygon(
  origin: Point2D,
  blockingSegments: BlockingSegment[],
  maxRadiusCells: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Point2D[] {
  const visionBlockers = blockingSegments.filter((s) => s.blocksVision);
  const angles: number[] = [];
  const delta = 1e-4;

  // Add boundary segments as virtual walls to constrain infinite rays
  const effectiveSegments: BlockingSegment[] = [
    ...visionBlockers,
    {
      id: 'bound-top',
      x1: bounds.minX,
      y1: bounds.minY,
      x2: bounds.maxX,
      y2: bounds.minY,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'bound-top',
    },
    {
      id: 'bound-right',
      x1: bounds.maxX,
      y1: bounds.minY,
      x2: bounds.maxX,
      y2: bounds.maxY,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'bound-right',
    },
    {
      id: 'bound-bottom',
      x1: bounds.maxX,
      y1: bounds.maxY,
      x2: bounds.minX,
      y2: bounds.maxY,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'bound-bottom',
    },
    {
      id: 'bound-left',
      x1: bounds.minX,
      y1: bounds.maxY,
      x2: bounds.minX,
      y2: bounds.minY,
      blocksMovement: true,
      blocksVision: true,
      sourceType: 'wall',
      sourceId: 'bound-left',
    },
  ];

  // Collect endpoints and generate ray angles (angle - delta, angle, angle + delta)
  for (const seg of effectiveSegments) {
    for (const pt of [{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]) {
      const angle = Math.atan2(pt.y - origin.y, pt.x - origin.x);
      angles.push(angle - delta, angle, angle + delta);
    }
  }

  // Add 16 circular cardinal angles for smooth circle boundary clipping
  for (let i = 0; i < 16; i++) {
    angles.push((i * Math.PI) / 8);
  }

  // Sort angles and remove duplicates
  angles.sort((a, b) => a - b);

  const polygonPoints: Point2D[] = [];

  for (const angle of angles) {
    const rayTarget: Point2D = {
      x: origin.x + Math.cos(angle) * maxRadiusCells,
      y: origin.y + Math.sin(angle) * maxRadiusCells,
    };

    let closestHit: Point2D = rayTarget;
    let closestT = 1.0;

    for (const seg of effectiveSegments) {
      const p3 = { x: seg.x1, y: seg.y1 };
      const p4 = { x: seg.x2, y: seg.y2 };

      const hit = getLineSegmentIntersection(origin, rayTarget, p3, p4);
      if (hit && hit.param < closestT) {
        closestT = hit.param;
        closestHit = hit.point;
      }
    }

    polygonPoints.push(closestHit);
  }

  return polygonPoints;
}

/**
 * Resolves the three-state visibility status for a specific cell:
 * - 'visible': In active sight / manual reveal
 * - 'explored': Discovered previously, darkened terrain, tokens hidden
 * - 'unexplored': Fully blacked out, unknown to players
 */
export function resolveCellVisibility(
  cellX: number,
  cellY: number,
  fog: FogOfWarState,
  currentlyVisibleCells: Set<string>
): CellVisibilityState {
  if (!fog.enabled) {
    return 'visible';
  }

  const key = `${cellX},${cellY}`;

  // Check manual DM hide override
  if (fog.hiddenCells && fog.hiddenCells.includes(key)) {
    return 'unexplored';
  }

  // 1. Currently Visible (via live LOS or manual reveal)
  if (currentlyVisibleCells.has(key) || fog.revealedCells.includes(key)) {
    return 'visible';
  }

  // 2. Explored (historical memory)
  if (
    fog.exploredCells.includes(key) ||
    fog.previousExploredCells?.includes(key) ||
    fog.defaultState === 'revealed'
  ) {
    return 'explored';
  }

  // 3. Unexplored (shrouded in fog)
  return 'unexplored';
}

/**
 * Merges newly visible cells into the exploredCells collection without duplicates.
 */
export function updateExploredCells(
  currentExplored: string[],
  newlyVisible: Set<string>
): string[] {
  const merged = new Set<string>(currentExplored);
  for (const cellKey of newlyVisible) {
    merged.add(cellKey);
  }
  return Array.from(merged);
}

/**
 * Manually reveals an area of cells (e.g. via brush or room reveal).
 */
export function manualRevealCells(
  fog: FogOfWarState,
  cellsToReveal: string[]
): FogOfWarState {
  const revealedSet = new Set<string>(fog.revealedCells);
  const exploredSet = new Set<string>(fog.exploredCells);
  const hiddenSet = new Set<string>(fog.hiddenCells || []);

  for (const cell of cellsToReveal) {
    revealedSet.add(cell);
    exploredSet.add(cell);
    hiddenSet.delete(cell);
  }

  return {
    ...fog,
    revealedCells: Array.from(revealedSet),
    exploredCells: Array.from(exploredSet),
    hiddenCells: Array.from(hiddenSet),
  };
}

/**
 * Manually conceals an area of cells back into unexplored fog.
 */
export function manualHideCells(
  fog: FogOfWarState,
  cellsToHide: string[]
): FogOfWarState {
  const revealedSet = new Set<string>(fog.revealedCells);
  const exploredSet = new Set<string>(fog.exploredCells);
  const hiddenSet = new Set<string>(fog.hiddenCells || []);

  for (const cell of cellsToHide) {
    revealedSet.delete(cell);
    exploredSet.delete(cell);
    hiddenSet.add(cell);
  }

  return {
    ...fog,
    revealedCells: Array.from(revealedSet),
    exploredCells: Array.from(exploredSet),
    hiddenCells: Array.from(hiddenSet),
  };
}

/**
 * Resets explored visibility back to the initial default state.
 */
export function resetExploredFog(
  fog: FogOfWarState,
  defaultState: 'hidden' | 'revealed' = 'hidden'
): FogOfWarState {
  return {
    ...fog,
    defaultState,
    revealedCells: [],
    exploredCells: [],
    hiddenCells: [],
    previousExploredCells: [],
  };
}

/**
 * Determines whether an entity/token is visible on the battlemap.
 * Respects:
 * 1. Cell visibility state ('visible' vs 'explored' vs 'unexplored')
 * 2. DM vs Player perspective
 * 3. Token's `isVisibleToPlayers` attribute
 * 4. Fog enabled/disabled state
 */
export function isEntityVisibleOnBattlemap(
  tokenGridX: number,
  tokenGridY: number,
  tokenIsVisibleToPlayers: boolean,
  isDmPerspective: boolean,
  fog: FogOfWarState,
  currentlyVisibleCells: Set<string>
): boolean {
  // DM perspective sees all entities (hidden entities rendered with DM-specific transparency/border)
  if (isDmPerspective && !fog.previewPlayerFog) {
    return true;
  }

  // If token is hidden from players by DM (e.g. lurking ghoul, secret trap), NEVER show to players
  if (!tokenIsVisibleToPlayers) {
    return false;
  }

  // If fog is disabled, all non-hidden entities are visible
  if (!fog.enabled) {
    return true;
  }

  // In player view, tokens are visible ONLY IF the cell is currently visible!
  // Explored cells alone do NOT reveal live token positions!
  const cellX = Math.floor(tokenGridX);
  const cellY = Math.floor(tokenGridY);
  const cellState = resolveCellVisibility(cellX, cellY, fog, currentlyVisibleCells);

  return cellState === 'visible';
}
