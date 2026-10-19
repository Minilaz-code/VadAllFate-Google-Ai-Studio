/**
 * D&D 5e SRD 5.1 Rules Mechanics & State Validation
 */

import type { StatePatch, ActionEnvelope, SnapshotRef } from '../types/runtime.ts';

export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calculateProficiencyBonus(level: number): number {
  if (level < 1) return 2;
  return Math.floor((level - 1) / 4) + 2;
}

export function resolveAttack(
  attackBonus: number,
  targetAc: number,
  naturalD20: number
): { isHit: boolean; isCritical: boolean; isFumble: boolean; margin: number; totalToHit: number } {
  if (naturalD20 === 20) {
    return { isHit: true, isCritical: true, isFumble: false, margin: (naturalD20 + attackBonus) - targetAc, totalToHit: naturalD20 + attackBonus };
  }
  if (naturalD20 === 1) {
    return { isHit: false, isCritical: false, isFumble: true, margin: (naturalD20 + attackBonus) - targetAc, totalToHit: naturalD20 + attackBonus };
  }
  const totalToHit = naturalD20 + attackBonus;
  const isHit = totalToHit >= targetAc;
  return {
    isHit,
    isCritical: false,
    isFumble: false,
    margin: totalToHit - targetAc,
    totalToHit,
  };
}

/**
 * Validates inbound ActionEnvelope against current state snapshot.
 * Rejects stale snapshots (stale concurrency detection).
 */
export function checkActionAdmission(
  envelope: ActionEnvelope,
  currentSnapshot: SnapshotRef
): { admitted: boolean; error?: string } {
  if (envelope.snapshotRef.campaignId !== currentSnapshot.campaignId) {
    return { admitted: false, error: 'Snapshot campaign ID mismatch' };
  }
  if (envelope.snapshotRef.commitSequence !== currentSnapshot.commitSequence) {
    return {
      admitted: false,
      error: `Stale snapshot rejected: client is at sequence ${envelope.snapshotRef.commitSequence}, authoritative state is at ${currentSnapshot.commitSequence}`,
    };
  }
  if (!envelope.actorId) {
    return { admitted: false, error: 'ActionEnvelope missing actorId' };
  }
  return { admitted: true };
}

/**
 * Validates a proposed StatePatch before submitting CommitRequest.
 */
export function validateStatePatch(
  patch: StatePatch,
  currentEntityState?: any
): { isValid: boolean; reason?: string } {
  if (patch.op === 'replace' && patch.path === 'currentHp') {
    const maxHp = currentEntityState?.maxHp;
    if (typeof maxHp === 'number' && patch.value > maxHp) {
      return { isValid: false, reason: `currentHp (${patch.value}) cannot exceed maxHp (${maxHp})` };
    }
    if (patch.value < 0) {
      return { isValid: false, reason: `currentHp (${patch.value}) cannot be negative` };
    }
  }

  if (patch.op === 'replace' && patch.path === 'token.x') {
    if (typeof patch.value !== 'number' || patch.value < 0 || patch.value > 100) {
      return { isValid: false, reason: `token.x (${patch.value}) out of bounds [0, 100]` };
    }
  }

  if (patch.op === 'replace' && patch.path === 'token.y') {
    if (typeof patch.value !== 'number' || patch.value < 0 || patch.value > 100) {
      return { isValid: false, reason: `token.y (${patch.value}) out of bounds [0, 100]` };
    }
  }

  return { isValid: true };
}
