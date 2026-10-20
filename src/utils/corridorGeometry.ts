/**
 * VadAllFate — Corridor Geometry Utilities (AIUI-CP002B1)
 *
 * Replaces naive bounding-box rendering with properly bounded straight
 * or orthogonal corridor passages with explicit cell widths.
 */

export interface CorridorRect {
  x: number;      // Grid cell X
  y: number;      // Grid cell Y
  width: number;  // Grid cells width
  height: number; // Grid cells height
}

export interface CorridorEndpoint {
  x: number;
  y: number;
}

/**
 * Validates whether a corridor definition has valid non-zero length.
 */
export function isValidCorridor(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean {
  return !(startX === endX && startY === endY);
}

/**
 * Computes rectangular corridor segments for straight or orthogonal corridors.
 * Diagonal endpoints are broken into clean orthogonal passages (L-shaped)
 * instead of filling the entire bounding box.
 *
 * @param startX Starting grid X
 * @param startY Starting grid Y
 * @param endX Ending grid X
 * @param endY Ending grid Y
 * @param widthCells Passage width in grid cells (default: 2 cells = 10ft)
 */
export function computeCorridorSegments(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  widthCells = 2
): CorridorRect[] {
  const safeWidth = Math.max(1, Math.round(widthCells));

  if (!isValidCorridor(startX, startY, endX, endY)) {
    return [];
  }

  const dx = endX - startX;
  const dy = endY - startY;

  // Case 1: Purely horizontal corridor
  if (dy === 0) {
    const minX = Math.min(startX, endX);
    const length = Math.abs(dx);
    return [
      {
        x: minX,
        y: startY - Math.floor(safeWidth / 2),
        width: Math.max(1, length),
        height: safeWidth,
      },
    ];
  }

  // Case 2: Purely vertical corridor
  if (dx === 0) {
    const minY = Math.min(startY, endY);
    const length = Math.abs(dy);
    return [
      {
        x: startX - Math.floor(safeWidth / 2),
        y: minY,
        width: safeWidth,
        height: Math.max(1, length),
      },
    ];
  }

  // Case 3: Diagonal / L-shaped orthogonal corridor
  // Break into a horizontal segment followed by a vertical segment
  const minX = Math.min(startX, endX);
  const horizontalLength = Math.abs(dx);
  const halfW = Math.floor(safeWidth / 2);

  const horizontalSegment: CorridorRect = {
    x: minX,
    y: startY - halfW,
    width: Math.max(1, horizontalLength),
    height: safeWidth,
  };

  const minY = Math.min(startY, endY);
  const verticalLength = Math.abs(dy);

  const verticalSegment: CorridorRect = {
    x: endX - halfW,
    y: minY,
    width: safeWidth,
    height: Math.max(1, verticalLength),
  };

  return [horizontalSegment, verticalSegment];
}

/**
 * Checks if a grid coordinate lies inside any of the corridor segments.
 */
export function isPointInCorridor(
  px: number,
  py: number,
  segments: CorridorRect[]
): boolean {
  return segments.some(
    (seg) =>
      px >= seg.x &&
      px < seg.x + seg.width &&
      py >= seg.y &&
      py < seg.y + seg.height
  );
}

/**
 * Calculates total floor area in cells for a corridor.
 */
export function calculateCorridorAreaCells(segments: CorridorRect[]): number {
  if (segments.length === 0) return 0;
  if (segments.length === 1) return segments[0].width * segments[0].height;

  // For 2 orthogonal segments, subtract the overlapping corner area
  const [s1, s2] = segments;
  const overlapX = Math.max(0, Math.min(s1.x + s1.width, s2.x + s2.width) - Math.max(s1.x, s2.x));
  const overlapY = Math.max(0, Math.min(s1.y + s1.height, s2.y + s2.height) - Math.max(s1.y, s2.y));
  const overlapArea = overlapX * overlapY;

  return s1.width * s1.height + s2.width * s2.height - overlapArea;
}
