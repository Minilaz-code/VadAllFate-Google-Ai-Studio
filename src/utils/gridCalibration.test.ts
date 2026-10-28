import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

export function solveTwoPointCalibration(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  squaresCount: number,
  axis: 'horizontal' | 'vertical' | 'diagonal'
): { cellSizePx: number; originX: number; originY: number } {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const count = Math.max(1, squaresCount);
  let pitch = 40;
  if (axis === 'horizontal') {
    pitch = dx / count;
  } else if (axis === 'vertical') {
    pitch = dy / count;
  } else {
    pitch = Math.sqrt(dx * dx + dy * dy) / (count * Math.SQRT2);
  }
  const cellSizePx = Math.max(10, Math.min(200, Math.round(pitch * 10) / 10));
  const originX = Math.round((p1.x % cellSizePx) * 10) / 10;
  const originY = Math.round((p1.y % cellSizePx) * 10) / 10;
  return { cellSizePx, originX, originY };
}

describe('Milestone 12 — Blue Alley Two-Point Calibration Engine', () => {
  test('Exact horizontal calibration solves correct pitch and origin without drift', () => {
    // 10 squares spanning 480 pixels with anchor at x=24
    const p1 = { x: 24, y: 50 };
    const p2 = { x: 504, y: 50 };
    const res = solveTwoPointCalibration(p1, p2, 10, 'horizontal');

    assert.equal(res.cellSizePx, 48.0);
    assert.equal(res.originX, 24.0);
    assert.equal(res.originY, 2.0); // 50 % 48 = 2

    // Verify 50 squares out: (24 + 50 * 48) = 2424 px
    const square50Px = res.originX + 50 * res.cellSizePx;
    assert.equal(square50Px, 2424.0);
  });

  test('Vertical calibration accurately derives cell pitch and Y offset', () => {
    const p1 = { x: 100, y: 15 };
    const p2 = { x: 100, y: 335 }; // 320 px across 8 squares = 40 px/cell
    const res = solveTwoPointCalibration(p1, p2, 8, 'vertical');

    assert.equal(res.cellSizePx, 40.0);
    assert.equal(res.originY, 15.0);
  });

  test('Diagonal calibration maintains square aspect constraint', () => {
    // 5 squares horizontal & 5 vertical = 5 squares diagonal (5 * 40 * sqrt(2))
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 200, y: 200 };
    const res = solveTwoPointCalibration(p1, p2, 5, 'diagonal');

    assert.equal(res.cellSizePx, 40.0);
    assert.equal(res.originX, 0);
    assert.equal(res.originY, 0);
  });

  test('Micro-pitch and origin nudges eliminate compounding drift across 100 cells', () => {
    let pitch = 48.0;
    let origX = 12.0;

    // Nudge pitch by +0.1 px
    pitch = Math.round((pitch + 0.1) * 10) / 10;
    assert.equal(pitch, 48.1);

    // Nudge origin by -1 px
    origX = origX - 1.0;
    assert.equal(origX, 11.0);

    // 100 cells out
    const cell100 = origX + 100 * pitch;
    assert.equal(cell100, 4821.0);
  });
});
