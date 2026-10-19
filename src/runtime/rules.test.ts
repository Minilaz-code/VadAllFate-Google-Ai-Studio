import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAbilityModifier,
  calculateProficiencyBonus,
  resolveAttack,
  checkActionAdmission,
  validateStatePatch,
} from './rules.ts';
import type { ActionEnvelope, SnapshotRef } from '../types/runtime.ts';

test('calculateAbilityModifier follows standard 5e SRD table', () => {
  assert.equal(calculateAbilityModifier(10), 0);
  assert.equal(calculateAbilityModifier(11), 0);
  assert.equal(calculateAbilityModifier(12), 1);
  assert.equal(calculateAbilityModifier(14), 2);
  assert.equal(calculateAbilityModifier(16), 3);
  assert.equal(calculateAbilityModifier(18), 4);
  assert.equal(calculateAbilityModifier(20), 5);
  assert.equal(calculateAbilityModifier(8), -1);
  assert.equal(calculateAbilityModifier(7), -2);
});

test('calculateProficiencyBonus scales with character level', () => {
  assert.equal(calculateProficiencyBonus(1), 2);
  assert.equal(calculateProficiencyBonus(4), 2);
  assert.equal(calculateProficiencyBonus(5), 3);
  assert.equal(calculateProficiencyBonus(8), 3);
  assert.equal(calculateProficiencyBonus(9), 4);
  assert.equal(calculateProficiencyBonus(13), 5);
  assert.equal(calculateProficiencyBonus(17), 6);
  assert.equal(calculateProficiencyBonus(20), 6);
});

test('resolveAttack properly handles hits, misses, and crits', () => {
  // AC 15, natural 20 -> Critical Hit
  const crit = resolveAttack(3, 15, 20);
  assert.equal(crit.isHit, true);
  assert.equal(crit.isCritical, true);

  // AC 15, natural 1 -> Fumble / Miss
  const fumble = resolveAttack(9, 15, 1);
  assert.equal(fumble.isHit, false);
  assert.equal(fumble.isFumble, true);

  // AC 15, natural 12 + 3 = 15 -> Meets AC (Hit)
  const meetsAc = resolveAttack(3, 15, 12);
  assert.equal(meetsAc.isHit, true);
  assert.equal(meetsAc.totalToHit, 15);

  // AC 15, natural 10 + 3 = 13 -> Below AC (Miss)
  const miss = resolveAttack(3, 15, 10);
  assert.equal(miss.isHit, false);
  assert.equal(miss.totalToHit, 13);
});

test('checkActionAdmission enforces snapshot concurrency', () => {
  const currentSnap: SnapshotRef = {
    campaignId: 'camp-1',
    commitSequence: 42,
    stateHash: 'abc',
    worldMinute: 600,
  };

  const validAction: ActionEnvelope = {
    actionId: 'act-1',
    actorId: 'player-kaelen',
    actorRole: 'player',
    actionType: 'MOVE_TOKEN',
    payload: { x: 10, y: 15 },
    snapshotRef: { ...currentSnap },
    timestampUtc: new Date().toISOString(),
    clientNonce: 'nonce-1',
  };

  const adm1 = checkActionAdmission(validAction, currentSnap);
  assert.equal(adm1.admitted, true);

  // Stale sequence (client was at 41, authoritative is 42)
  const staleAction: ActionEnvelope = {
    ...validAction,
    snapshotRef: { ...currentSnap, commitSequence: 41 },
  };
  const adm2 = checkActionAdmission(staleAction, currentSnap);
  assert.equal(adm2.admitted, false);
  assert.match(adm2.error || '', /Stale snapshot rejected/);
});

test('validateStatePatch enforces HP and token bounds', () => {
  const character = { maxHp: 30, currentHp: 20 };

  const validHp = validateStatePatch(
    { entityType: 'character', entityId: 'c1', path: 'currentHp', op: 'replace', value: 25 },
    character
  );
  assert.equal(validHp.isValid, true);

  const overflowHp = validateStatePatch(
    { entityType: 'character', entityId: 'c1', path: 'currentHp', op: 'replace', value: 35 },
    character
  );
  assert.equal(overflowHp.isValid, false);

  const outOfBoundsToken = validateStatePatch(
    { entityType: 'character', entityId: 'c1', path: 'token.x', op: 'replace', value: 150 },
    character
  );
  assert.equal(outOfBoundsToken.isValid, false);
});
