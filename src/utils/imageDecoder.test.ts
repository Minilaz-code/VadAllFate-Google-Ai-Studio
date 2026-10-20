import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageFileMeta,
  calculateFitScale,
} from './imageDecoder.ts';

describe('Image Validation & Aspect Ratio Fitting (AIUI-CP002B1)', () => {
  it('accepts valid PNG, JPG, and WebP files within 15MB limit', () => {
    assert.deepEqual(validateImageFileMeta({ type: 'image/png', size: 2 * 1024 * 1024 }), { valid: true });
    assert.deepEqual(validateImageFileMeta({ type: 'image/jpeg', size: 5 * 1024 * 1024 }), { valid: true });
    assert.deepEqual(validateImageFileMeta({ type: 'image/webp', size: 10 * 1024 * 1024 }), { valid: true });
  });

  it('rejects unsupported image mime types', () => {
    const res = validateImageFileMeta({ type: 'image/gif', size: 1024 });
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('Unsupported image format'));
  });

  it('rejects files exceeding 15MB', () => {
    const res = validateImageFileMeta({ type: 'image/png', size: 16 * 1024 * 1024 });
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('15MB limit'));
  });

  it('calculates fit scale preserving aspect ratio without distortion', () => {
    // 1200x800 image into 800x640 canvas (contain mode)
    // scaleX = 800 / 1200 = 0.6667
    // scaleY = 640 / 800 = 0.8
    // Min scale is 0.667
    const fit = calculateFitScale(1200, 800, 800, 640, 'contain');
    assert.equal(fit.scale, 0.667);
    // Scaled width is 800, height is 533.6, offsetY centers it: (640 - 534) / 2 = 53
    assert.equal(fit.offsetX, 0);
    assert.ok(fit.offsetY > 0);
  });
});
