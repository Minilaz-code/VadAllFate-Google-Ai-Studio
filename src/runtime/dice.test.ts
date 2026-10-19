import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDiceFormula, rollDice } from './dice.ts';

test('parseDiceFormula handles standard forms correctly', () => {
  assert.deepEqual(parseDiceFormula('1d20'), { count: 1, sides: 20, modifier: 0 });
  assert.deepEqual(parseDiceFormula('d20'), { count: 1, sides: 20, modifier: 0 });
  assert.deepEqual(parseDiceFormula('2d6+3'), { count: 2, sides: 6, modifier: 3 });
  assert.deepEqual(parseDiceFormula('1d8-2'), { count: 1, sides: 8, modifier: -2 });
  assert.deepEqual(parseDiceFormula('4d10+10'), { count: 4, sides: 10, modifier: 10 });
});

test('parseDiceFormula throws on invalid inputs', () => {
  assert.throws(() => parseDiceFormula('invalid'));
  assert.throws(() => parseDiceFormula('d'));
});

test('rollDice computes totals with deterministic rng', () => {
  // Mock RNG that returns 0.5 (yields ceil/floor math: Math.floor(0.5 * 6) + 1 = 4)
  const fixedRng = () => 0.5;
  const res = rollDice('2d6+3', 'normal', fixedRng);
  assert.equal(res.rolls.length, 2);
  assert.equal(res.rolls[0], 4);
  assert.equal(res.rolls[1], 4);
  assert.equal(res.baseTotal, 8);
  assert.equal(res.total, 11);
  assert.equal(res.isCritical, false);
});

test('rollDice detects critical hits on natural 20', () => {
  // 0.99 gives Math.floor(0.99 * 20) + 1 = 20
  const nat20Rng = () => 0.99;
  const res = rollDice('1d20+4', 'normal', nat20Rng);
  assert.equal(res.isCritical, true);
  assert.equal(res.isFumble, false);
  assert.equal(res.total, 24);
});

test('rollDice detects fumbles on natural 1', () => {
  const nat1Rng = () => 0.01;
  const res = rollDice('1d20+2', 'normal', nat1Rng);
  assert.equal(res.isCritical, false);
  assert.equal(res.isFumble, true);
  assert.equal(res.total, 3);
});

test('rollDice handles advantage and disadvantage correctly', () => {
  let callCount = 0;
  // First call returns 0.2 (rolls 5), second call returns 0.8 (rolls 17)
  const alternatingRng = () => {
    callCount++;
    return callCount % 2 === 1 ? 0.2 : 0.8;
  };

  const advRes = rollDice('1d20+2', 'advantage', alternatingRng);
  assert.equal(advRes.total, 17 + 2);

  callCount = 0;
  const disRes = rollDice('1d20+2', 'disadvantage', alternatingRng);
  assert.equal(disRes.total, 5 + 2);
});
