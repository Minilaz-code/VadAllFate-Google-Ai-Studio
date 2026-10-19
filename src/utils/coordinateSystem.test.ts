import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  gridToMapPixels,
  mapPixelsToGrid,
  percentToGrid,
  gridToPercent,
  percentToMapPixels,
  mapPixelsToPercent,
  screenToMapSpace,
  mapSpaceToScreen,
  clampToGrid,
  snapToStep,
  calculateDistanceInFeet,
  getMapPixelSize,
  type GridDimensions,
  type ViewportTransform,
} from './coordinateSystem.ts';

describe('Coordinate System & Conversions (AIUI-CP002B)', () => {
  const standardGrid: GridDimensions = {
    width: 20,
    height: 16,
    cellSizePx: 40,
    feetPerCell: 5,
    originX: 0,
    originY: 0,
  };

  const offsetGrid: GridDimensions = {
    width: 24,
    height: 18,
    cellSizePx: 50,
    feetPerCell: 5,
    originX: 10,
    originY: 20,
  };

  it('correctly converts grid coordinates to map-space pixels', () => {
    const p1 = gridToMapPixels(3, 4, standardGrid);
    assert.equal(p1.x, 120);
    assert.equal(p1.y, 160);

    const p2 = gridToMapPixels(2, 5, offsetGrid);
    assert.equal(p2.x, 110); // 2 * 50 + 10
    assert.equal(p2.y, 270); // 5 * 50 + 20
  });

  it('correctly converts map-space pixels to grid coordinates and handles snapping', () => {
    const raw = mapPixelsToGrid(125, 158, standardGrid, false);
    assert.equal(raw.x, 3.125);
    assert.equal(raw.y, 3.95);

    const snapped = mapPixelsToGrid(125, 158, standardGrid, true);
    assert.equal(snapped.x, 3);
    assert.equal(snapped.y, 4);

    const offsetSnapped = mapPixelsToGrid(112, 268, offsetGrid, true);
    assert.equal(offsetSnapped.x, 2);
    assert.equal(offsetSnapped.y, 5);
  });

  it('performs accurate round-trip conversions between grid and map pixels', () => {
    const testPoints = [
      { x: 0, y: 0 },
      { x: 10, y: 8 },
      { x: 19, y: 15 },
      { x: 5.5, y: 7.25 },
    ];

    for (const pt of testPoints) {
      const px = gridToMapPixels(pt.x, pt.y, standardGrid);
      const back = mapPixelsToGrid(px.x, px.y, standardGrid, false);
      assert.ok(Math.abs(back.x - pt.x) < 1e-6, `X round-trip failed for ${pt.x}`);
      assert.ok(Math.abs(back.y - pt.y) < 1e-6, `Y round-trip failed for ${pt.y}`);
    }
  });

  it('correctly converts percentage-based coordinates to and from grid cells', () => {
    // Standard grid is 20 x 16
    // 50% X = 10 cells, 50% Y = 8 cells
    const gridPt = percentToGrid(50, 50, 20, 16, true);
    assert.equal(gridPt.x, 10);
    assert.equal(gridPt.y, 8);

    const pctPt = gridToPercent(10, 8, 20, 16);
    assert.equal(pctPt.x, 50);
    assert.equal(pctPt.y, 50);

    // Non-square grid: 24 x 18
    const nonSquareGrid = percentToGrid(25, 75, 24, 18, true);
    assert.equal(nonSquareGrid.x, 6); // 24 * 0.25
    assert.equal(nonSquareGrid.y, 14); // round(18 * 0.75) = round(13.5) = 14

    const nonSquarePct = gridToPercent(6, 9, 24, 18);
    assert.equal(nonSquarePct.x, 25);
    assert.equal(nonSquarePct.y, 50);
  });

  it('converts percentages to and from map-space pixels accurately', () => {
    // 20 cells * 40px = 800px width; 16 cells * 40px = 640px height
    const px = percentToMapPixels(50, 50, standardGrid);
    assert.equal(px.x, 400);
    assert.equal(px.y, 320);

    const pct = mapPixelsToPercent(400, 320, standardGrid);
    assert.equal(pct.x, 50);
    assert.equal(pct.y, 50);
  });

  it('transforms screen coordinates through pan and zoom without altering geometry', () => {
    const container = { left: 100, top: 50, width: 800, height: 600 };
    const viewport: ViewportTransform = { panX: 40, panY: -20, zoom: 1.5 };

    // Point in map space: (200, 150)
    // Screen X = container.left (100) + panX (40) + mapX * zoom (200 * 1.5 = 300) = 440
    // Screen Y = container.top (50) + panY (-20) + mapY * zoom (150 * 1.5 = 225) = 255
    const screenPt = mapSpaceToScreen(200, 150, container, viewport);
    assert.equal(screenPt.x, 440);
    assert.equal(screenPt.y, 255);

    // Inverse: screen to map space
    const mapped = screenToMapSpace(screenPt.x, screenPt.y, container, viewport);
    assert.ok(Math.abs(mapped.x - 200) < 1e-6);
    assert.ok(Math.abs(mapped.y - 150) < 1e-6);
  });

  it('clamps coordinates to grid boundaries', () => {
    const clamped1 = clampToGrid(-5, 25, 20, 16);
    assert.equal(clamped1.x, 0);
    assert.equal(clamped1.y, 16);

    const clamped2 = clampToGrid(10, 10, 20, 16);
    assert.equal(clamped2.x, 10);
    assert.equal(clamped2.y, 10);
  });

  it('snaps values to custom step increments', () => {
    assert.equal(snapToStep(2.3, 1), 2);
    assert.equal(snapToStep(2.7, 1), 3);
    assert.equal(snapToStep(2.26, 0.5), 2.5);
    assert.equal(snapToStep(2.1, 0.5), 2.0);
  });

  it('calculates distance in standard D&D feet for grid and pixel coordinates', () => {
    // 3 squares east, 4 squares north = 5 squares = 25 feet
    const distGrid = calculateDistanceInFeet({ x: 1, y: 1 }, { x: 4, y: 5 }, 5, 40, true);
    assert.equal(distGrid, 25);

    // Pixel distance: 120px dx, 160px dy with 40px/cell = 3 cells dx, 4 cells dy = 25 feet
    const distPixels = calculateDistanceInFeet({ x: 40, y: 40 }, { x: 160, y: 200 }, 5, 40, false);
    assert.equal(distPixels, 25);
  });

  it('computes total pixel dimensions for non-square maps', () => {
    const size = getMapPixelSize(standardGrid);
    assert.equal(size.widthPx, 800);
    assert.equal(size.heightPx, 640);

    const offsetSize = getMapPixelSize(offsetGrid);
    assert.equal(offsetSize.widthPx, 1200); // 24 * 50
    assert.equal(offsetSize.heightPx, 900);  // 18 * 50
  });
});
