import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidCorridor,
  computeCorridorSegments,
  isPointInCorridor,
  calculateCorridorAreaCells,
} from './corridorGeometry.ts';

describe('Corridor Geometry & Bounded Passages (AIUI-CP002B1)', () => {
  it('rejects invalid zero-length corridors', () => {
    assert.equal(isValidCorridor(5, 5, 5, 5), false);
    assert.equal(isValidCorridor(0, 0, 0, 0), false);
    assert.deepEqual(computeCorridorSegments(5, 5, 5, 5, 2), []);
  });

  it('computes properly bounded straight horizontal corridors', () => {
    // Horizontal corridor from (2, 8) to (10, 8) with 2-cell width
    const segs = computeCorridorSegments(2, 8, 10, 8, 2);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].x, 2);
    assert.equal(segs[0].y, 7); // 8 - floor(2/2) = 7
    assert.equal(segs[0].width, 8);
    assert.equal(segs[0].height, 2);

    // Verify point testing
    assert.ok(isPointInCorridor(4, 7, segs));
    assert.ok(isPointInCorridor(4, 8, segs));
    assert.ok(!isPointInCorridor(4, 9, segs));
    assert.ok(!isPointInCorridor(1, 8, segs));
  });

  it('computes properly bounded straight vertical corridors', () => {
    // Vertical corridor from (6, 3) to (6, 12) with 1-cell width
    const segs = computeCorridorSegments(6, 3, 6, 12, 1);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].x, 6);
    assert.equal(segs[0].y, 3);
    assert.equal(segs[0].width, 1);
    assert.equal(segs[0].height, 9);
  });

  it('computes orthogonal L-shaped passages without filling entire diagonal bounding box', () => {
    // Diagonal request from (4, 4) to (12, 10) with 2-cell width
    const segs = computeCorridorSegments(4, 4, 12, 10, 2);
    assert.equal(segs.length, 2);

    const [horizontal, vertical] = segs;
    // Horizontal segment from (4, 3) with width 8 and height 2
    assert.equal(horizontal.x, 4);
    assert.equal(horizontal.y, 3);
    assert.equal(horizontal.width, 8);
    assert.equal(horizontal.height, 2);

    // Vertical segment from (11, 4) with width 2 and height 6
    assert.equal(vertical.x, 11);
    assert.equal(vertical.y, 4);
    assert.equal(vertical.width, 2);
    assert.equal(vertical.height, 6);

    // Crucial check: A point in the empty diagonal corner (4, 10) MUST NOT be in the corridor!
    // In naive bounding-box, (4, 10) would be covered!
    assert.equal(isPointInCorridor(4, 10, segs), false);
    assert.equal(isPointInCorridor(5, 9, segs), false);

    // Points inside the arms MUST be in the corridor
    assert.ok(isPointInCorridor(6, 3, segs));
    assert.ok(isPointInCorridor(11, 7, segs));
  });

  it('calculates accurate floor area without double-counting corner overlap', () => {
    const segs = computeCorridorSegments(2, 4, 8, 10, 2);
    const area = calculateCorridorAreaCells(segs);
    // Horizontal covers x:[2,8) y:[3,5) (12 cells)
    // Vertical covers x:[7,9) y:[4,10) (12 cells)
    // Overlap is x:[7,8) y:[4,5) (1 cell), giving 12 + 12 - 1 = 23 cells
    assert.equal(area, 23);
  });
});
