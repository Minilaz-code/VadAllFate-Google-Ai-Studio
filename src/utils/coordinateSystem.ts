/**
 * VadAllFate — Coordinate System & Spatial Transformation Utilities (AIUI-CP002B)
 *
 * Implements a single, unified, bidirectional coordinate boundary between:
 * 1. Grid-Cell Coordinates: Integer or float discrete cell coordinates (x, y) where:
 *      0 <= x < gridWidth, 0 <= y < gridHeight. (Standard 5ft per cell in D&D 5e).
 * 2. Map-Space Pixel Coordinates: Continuous pixel positions within the map plane:
 *      mapX = (gridX * cellSizePx) + gridOriginX
 *      mapY = (gridY * cellSizePx) + gridOriginY
 * 3. Percentage Coordinates: Legacy/demo token positions (0 to 100%):
 *      pctX = (gridX / gridWidth) * 100
 *      pctY = (gridY / gridHeight) * 100
 * 4. Screen/Viewport Coordinates: Transformed by viewport bounding box, pan offsets, and zoom:
 *      screenX = containerLeft + panX + (mapX * zoom)
 *      screenY = containerTop + panY + (mapY * zoom)
 *
 * All transformations support non-square grids and configurable cell sizes.
 * Pan and zoom transformations do not alter underlying map-space or grid-cell geometry.
 */

export interface GridDimensions {
  width: number;       // Grid width in cells
  height: number;      // Grid height in cells
  cellSizePx: number;  // Pixels per cell side
  feetPerCell?: number;// Standard 5 feet
  originX?: number;    // Alignment offset in pixels
  originY?: number;    // Alignment offset in pixels
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ViewportTransform {
  panX: number;
  panY: number;
  zoom: number;
}

/**
 * Converts discrete or fractional grid-cell coordinates to map-space pixels.
 */
export function gridToMapPixels(
  gridX: number,
  gridY: number,
  grid: GridDimensions
): Point2D {
  const originX = grid.originX ?? 0;
  const originY = grid.originY ?? 0;
  return {
    x: gridX * grid.cellSizePx + originX,
    y: gridY * grid.cellSizePx + originY,
  };
}

/**
 * Converts map-space pixels to grid-cell coordinates.
 * If snap is true, rounds to nearest integer grid cell; otherwise returns fractional cells.
 */
export function mapPixelsToGrid(
  mapX: number,
  mapY: number,
  grid: GridDimensions,
  snap = false
): Point2D {
  const originX = grid.originX ?? 0;
  const originY = grid.originY ?? 0;
  const gx = (mapX - originX) / grid.cellSizePx;
  const gy = (mapY - originY) / grid.cellSizePx;

  if (snap) {
    return {
      x: Math.round(gx),
      y: Math.round(gy),
    };
  }

  return { x: gx, y: gy };
}

/**
 * Converts percentage-based coordinates (0-100%) to grid-cell coordinates.
 */
export function percentToGrid(
  pctX: number,
  pctY: number,
  gridWidth: number,
  gridHeight: number,
  snap = false
): Point2D {
  const gx = (pctX / 100) * gridWidth;
  const gy = (pctY / 100) * gridHeight;

  if (snap) {
    return {
      x: Math.round(gx),
      y: Math.round(gy),
    };
  }

  return { x: gx, y: gy };
}

/**
 * Converts grid-cell coordinates to percentage-based coordinates (0-100%).
 */
export function gridToPercent(
  gridX: number,
  gridY: number,
  gridWidth: number,
  gridHeight: number
): Point2D {
  if (gridWidth <= 0 || gridHeight <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (gridX / gridWidth) * 100,
    y: (gridY / gridHeight) * 100,
  };
}

/**
 * Converts percentage-based coordinates (0-100%) directly to map-space pixels.
 */
export function percentToMapPixels(
  pctX: number,
  pctY: number,
  grid: GridDimensions
): Point2D {
  const totalWidthPx = grid.width * grid.cellSizePx;
  const totalHeightPx = grid.height * grid.cellSizePx;
  const originX = grid.originX ?? 0;
  const originY = grid.originY ?? 0;

  return {
    x: (pctX / 100) * totalWidthPx + originX,
    y: (pctY / 100) * totalHeightPx + originY,
  };
}

/**
 * Converts map-space pixels to percentage-based coordinates (0-100%).
 */
export function mapPixelsToPercent(
  mapX: number,
  mapY: number,
  grid: GridDimensions
): Point2D {
  const totalWidthPx = grid.width * grid.cellSizePx;
  const totalHeightPx = grid.height * grid.cellSizePx;
  const originX = grid.originX ?? 0;
  const originY = grid.originY ?? 0;

  if (totalWidthPx <= 0 || totalHeightPx <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: ((mapX - originX) / totalWidthPx) * 100,
    y: ((mapY - originY) / totalHeightPx) * 100,
  };
}

/**
 * Transforms screen/viewport client coordinates to map-space coordinates.
 * Accounts for container bounding rect, current pan offset, and zoom factor.
 */
export function screenToMapSpace(
  screenX: number,
  screenY: number,
  containerRect: { left: number; top: number; width: number; height: number },
  viewport: ViewportTransform
): Point2D {
  const safeZoom = viewport.zoom <= 0 ? 1 : viewport.zoom;
  // Position relative to container
  const relX = screenX - containerRect.left;
  const relY = screenY - containerRect.top;

  // Invert viewport pan & zoom
  const mapX = (relX - viewport.panX) / safeZoom;
  const mapY = (relY - viewport.panY) / safeZoom;

  return { x: mapX, y: mapY };
}

/**
 * Transforms map-space coordinates to screen/viewport coordinates.
 */
export function mapSpaceToScreen(
  mapX: number,
  mapY: number,
  containerRect: { left: number; top: number },
  viewport: ViewportTransform
): Point2D {
  return {
    x: containerRect.left + viewport.panX + mapX * viewport.zoom,
    y: containerRect.top + viewport.panY + mapY * viewport.zoom,
  };
}

/**
 * Clamps grid coordinates within valid map bounds [0, gridWidth] and [0, gridHeight].
 */
export function clampToGrid(
  gridX: number,
  gridY: number,
  gridWidth: number,
  gridHeight: number
): Point2D {
  return {
    x: Math.max(0, Math.min(gridWidth, gridX)),
    y: Math.max(0, Math.min(gridHeight, gridY)),
  };
}

/**
 * Snaps a point to the nearest grid cell corner or center.
 * @param step 1 for whole grid cells, 0.5 for half-cells (centers)
 */
export function snapToStep(val: number, step = 1): number {
  return Math.round(val / step) * step;
}

/**
 * Calculates straight-line distance in feet between two points.
 * If isGridCoords is true, coordinates are in grid cells; otherwise in pixels.
 */
export function calculateDistanceInFeet(
  p1: Point2D,
  p2: Point2D,
  feetPerCell = 5,
  cellSizePx = 40,
  isGridCoords = true
): number {
  let dx: number;
  let dy: number;

  if (isGridCoords) {
    dx = p2.x - p1.x;
    dy = p2.y - p1.y;
  } else {
    dx = (p2.x - p1.x) / cellSizePx;
    dy = (p2.y - p1.y) / cellSizePx;
  }

  const cells = Math.hypot(dx, dy);
  return Math.round(cells * feetPerCell);
}

/**
 * Returns grid dimensions in total pixels.
 */
export function getMapPixelSize(grid: GridDimensions): { widthPx: number; heightPx: number } {
  return {
    widthPx: grid.width * grid.cellSizePx,
    heightPx: grid.height * grid.cellSizePx,
  };
}
