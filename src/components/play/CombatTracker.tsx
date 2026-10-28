import React, { useState } from 'react';
import {
  Sword,
  Shield,
  Heart,
  Zap,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Scroll,
  Award,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  Coffee,
  Crosshair,
  Sliders,
  X,
  Dice5,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type {
  CombatTurnState,
  UserRole,
  DemoActionEnvelope,
  PlayerSafeNpc,
  SnapshotRef,
  DicePolicy,
  PendingAdjudication,
} from '../../types/runtime.ts';

interface CombatTrackerProps {
  combatState: CombatTurnState;
  characters: CharacterSheet[];
  npcs: (NonPlayerCharacter | PlayerSafeNpc)[];
  userRole: UserRole;
  activeCharacterId?: string;
  currentSnapshot: SnapshotRef;
  dicePolicy?: DicePolicy;
  pendingAdjudications?: PendingAdjudication[];
  onOpenCharacterSheet: (char: CharacterSheet) => void;
  onSubmitAction: (envelope: DemoActionEnvelope) => Promise<any>;
}

const COMMON_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
];

export const CombatTracker: React.FC<CombatTrackerProps> = ({
  combatState,
  characters,
  npcs,
  userRole,
  activeCharacterId = 'char-lyra-01',
  currentSnapshot,
  dicePolicy,
  pendingAdjudications,
  onOpenCharacterSheet,
  onSubmitAction,
}) => {
  const isDm = userRole === 'dm' || userRole === 'dm_host';

  // Modal / Action states
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [actionModalKind, setActionModalKind] = useState<'attack' | 'cast_spell' | 'use_item' | 'dm_override' | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [selectedWeapon, setSelectedWeapon] = useState<string>('');
  const [selectedSpell, setSelectedSpell] = useState<string>('');
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(1);
  const [customValue, setCustomValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Milestone 12B: Physical vs Server Digital Dice states
  const [diceMode, setDiceMode] = useState<'SERVER_DIGITAL' | 'PLAYER_PHYSICAL'>('SERVER_DIGITAL');
  const [rollAdvState, setRollAdvState] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [physicalD20, setPhysicalD20] = useState<number>(14);
  const [physicalD20Adv, setPhysicalD20Adv] = useState<number>(16);
  const [physicalDamageDice, setPhysicalDamageDice] = useState<number[]>([4]);

  const activeTurnCombatant = combatState.combatants[combatState.activeTurnIndex];

  // Helper to resolve entity data
  const getCombatantEntity = (entityId: string) => {
    const char = characters.find((c) => c.id === entityId);
    if (char) return { type: 'character' as const, data: char };
    const npc = npcs.find((n) => n.id === entityId);
    if (npc) return { type: 'npc' as const, data: npc };
    return null;
  };

  const handleNextTurn = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitAction({
        actionId: `act-next-turn-${Date.now()}`,
        clientNonce: `nonce-next-${Date.now()}`,
        actorId: isDm ? 'dm-1' : activeCharacterId,
        actorRole: userRole,
        actionType: 'NEXT_TURN',
        snapshotRef: { ...currentSnapshot },
        payload: {},
        timestampUtc: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndEncounter = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitAction({
        actionId: `act-end-enc-${Date.now()}`,
        clientNonce: `nonce-end-${Date.now()}`,
        actorId: isDm ? 'dm-1' : activeCharacterId,
        actorRole: userRole,
        actionType: 'END_ENCOUNTER',
        snapshotRef: { ...currentSnapshot },
        payload: {},
        timestampUtc: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRest = async (isLong: boolean) => {
    setIsSubmitting(true);
    try {
      await onSubmitAction({
        actionId: `act-rest-${Date.now()}`,
        clientNonce: `nonce-rest-${Date.now()}`,
        actorId: isDm ? 'dm-1' : activeCharacterId,
        actorRole: userRole,
        actionType: isLong ? 'REST_LONG' : 'REST_SHORT',
        snapshotRef: { ...currentSnapshot },
        payload: { restType: isLong ? 'long' : 'short' },
        timestampUtc: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickHpAdjust = async (entityId: string, delta: number) => {
    if (!isDm) return;
    const entity = getCombatantEntity(entityId);
    if (!entity) return;

    let curHp = 0;
    let maxHp = 0;
    let entityType: 'character' | 'npc' = 'character';

    if (entity.type === 'character') {
      curHp = entity.data.currentHp;
      maxHp = entity.data.maxHp;
      entityType = 'character';
    } else {
      entityType = 'npc';
      const sb = (entity.data as any).statBlock;
      curHp = sb ? sb.hitPoints : 20;
      maxHp = sb ? (sb.maxHitPoints || sb.hitPoints) : 20;
    }

    const nextHp = Math.max(0, Math.min(maxHp, curHp + delta));

    await onSubmitAction({
      actionId: `act-hp-${Date.now()}`,
      clientNonce: `nonce-hp-${Date.now()}`,
      actorId: isDm ? 'dm-1' : activeCharacterId,
      actorRole: userRole,
      actionType: 'DM_OVERRIDE_STATE',
      snapshotRef: { ...currentSnapshot },
      payload: {
        entityId,
        entityType,
        path: entityType === 'character' ? 'currentHp' : 'statBlock.hitPoints',
        value: nextHp,
        summary: `${entity.data.name} HP adjusted by ${delta > 0 ? `+${delta}` : delta} (Now ${nextHp}/${maxHp})`,
      },
      timestampUtc: new Date().toISOString(),
    });
  };

  const handleToggleCondition = async (entityId: string, cond: string) => {
    if (!isDm) return;
    const entity = getCombatantEntity(entityId);
    if (!entity) return;

    const currentConditions: string[] = (entity.data as any).conditions || [];
    const exists = currentConditions.includes(cond);
    const updated = exists
      ? currentConditions.filter((c) => c !== cond)
      : [...currentConditions, cond];

    await onSubmitAction({
      actionId: `act-cond-${Date.now()}`,
      clientNonce: `nonce-cond-${Date.now()}`,
      actorId: isDm ? 'dm-1' : activeCharacterId,
      actorRole: userRole,
      actionType: 'DM_OVERRIDE_STATE',
      snapshotRef: { ...currentSnapshot },
      payload: {
        entityId,
        entityType: entity.type,
        path: 'conditions',
        value: updated,
        summary: `${exists ? 'Removed' : 'Applied'} condition "${cond}" ${exists ? 'from' : 'to'} ${entity.data.name}.`,
      },
      timestampUtc: new Date().toISOString(),
    });
  };

  const handleExecuteAttack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCombatantId || !targetId) return;

    const attacker = getCombatantEntity(selectedCombatantId);
    const target = getCombatantEntity(targetId);
    if (!attacker || !target) return;

    // Milestone 12B: Python is authoritative over calculations and outcome validation.
    // In physical mode, raw rolled numbers are accepted and bounds-checked.
    // In digital mode, server entropy generates unmineable dice rolls.
    const effectiveDiceMode = isDm ? (diceMode === 'PLAYER_PHYSICAL' ? 'DM_PHYSICAL' : 'SERVER_DIGITAL') : diceMode;
    const rawRolls = rollAdvState === 'normal' ? [physicalD20] : [physicalD20, physicalD20Adv];

    await onSubmitAction({
      actionId: `act-atk-${Date.now()}`,
      clientNonce: `nonce-atk-${Date.now()}`,
      actorId: attacker.data.id,
      actorRole: userRole,
      actionType: 'ATTACK_ACTION',
      snapshotRef: { ...currentSnapshot },
      payload: {
        attackerId: attacker.data.id,
        targetId: target.data.id,
        attackName: selectedWeapon || 'Longsword',
        weaponName: selectedWeapon || 'Longsword',
        diceMode: effectiveDiceMode,
        advantage: rollAdvState === 'advantage',
        disadvantage: rollAdvState === 'disadvantage',
        ...(effectiveDiceMode !== 'SERVER_DIGITAL'
          ? {
              rawRolls,
              damageRolls: physicalDamageDice,
            }
          : {}),
      },
      timestampUtc: new Date().toISOString(),
    });

    setActionModalKind(null);
    setTargetId('');
  };

  const handleExecuteCastSpell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCombatantId) return;

    const caster = getCombatantEntity(selectedCombatantId);
    if (!caster) return;

    const spellName = selectedSpell || 'Firebolt';

    // Milestone 11B-QA: Spell slot expenditure, validation, and healing/damage outcomes are authoritative in Python.
    await onSubmitAction({
      actionId: `act-spell-${Date.now()}`,
      clientNonce: `nonce-spell-${Date.now()}`,
      actorId: caster.data.id,
      actorRole: userRole,
      actionType: 'CAST_SPELL',
      snapshotRef: { ...currentSnapshot },
      payload: {
        casterId: caster.data.id,
        targetId: targetId || undefined,
        spellName,
        slotLevel: selectedSpellLevel,
      },
      timestampUtc: new Date().toISOString(),
    });

    setActionModalKind(null);
    setTargetId('');
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4 space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-950/80 border border-red-700/60 rounded px-2.5 py-1 text-red-200">
            <Sword className="w-4 h-4 text-red-400" />
            <span className="font-mono font-bold tracking-wide">Round {combatState.round}</span>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded px-3 py-1">
            <span className="text-neutral-400 font-mono uppercase text-[10px]">Active Turn:</span>
            <span className="font-bold text-amber-300 font-cinzel">
              {activeTurnCombatant?.name || 'Awaiting initiative'}
            </span>
          </div>

          {/* Table Dice Policy Indicator */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1">
            <Dice5 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 font-mono text-[10px] uppercase">Policy:</span>
            {isDm ? (
              <select
                value={dicePolicy || 'ALLOW_MIXED_HONOUR_SYSTEM'}
                onChange={(e) => {
                  onSubmitAction({
                    actionId: `act-set-policy-${Date.now()}`,
                    clientNonce: `nonce-policy-${Date.now()}`,
                    actorId: isDm ? 'dm-1' : activeCharacterId,
                    actorRole: userRole,
                    actionType: 'SET_DICE_POLICY',
                    snapshotRef: { ...currentSnapshot },
                    payload: { dicePolicy: e.target.value },
                    timestampUtc: new Date().toISOString(),
                  });
                }}
                className="bg-transparent text-amber-300 font-bold font-mono text-[11px] outline-none cursor-pointer border-b border-amber-600/40"
              >
                <option value="ALLOW_MIXED_HONOUR_SYSTEM" className="bg-neutral-900 text-neutral-200">
                  Mixed Honour System
                </option>
                <option value="REQUIRE_DM_CONFIRMATION" className="bg-neutral-900 text-neutral-200">
                  Require DM Confirmation
                </option>
                <option value="SERVER_DIGITAL_ONLY" className="bg-neutral-900 text-neutral-200">
                  Server Digital Only
                </option>
              </select>
            ) : (
              <span className="font-bold text-amber-300 font-mono text-[11px]">
                {dicePolicy === 'REQUIRE_DM_CONFIRMATION'
                  ? 'Require DM Approval'
                  : dicePolicy === 'SERVER_DIGITAL_ONLY'
                  ? 'Server Digital Only'
                  : 'Mixed Honour System'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNextTurn}
            disabled={isSubmitting || !combatState.isActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold font-mono transition-colors shadow-sm disabled:opacity-50"
            title="Advance initiative to next combatant"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Next Turn</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          {/* Rest recovery */}
          <button
            onClick={() => handleRest(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-cyan-300 text-[11px] font-mono transition-colors"
            title="Short Rest (1 Hour Recovery)"
          >
            <Coffee className="w-3.5 h-3.5 text-cyan-400" />
            <span>Short Rest</span>
          </button>
          <button
            onClick={() => handleRest(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-cyan-300 text-[11px] font-mono transition-colors"
            title="Long Rest (8 Hours Full Recovery)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Long Rest</span>
          </button>

          {isDm && (
            <button
              onClick={handleEndEncounter}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 rounded bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-300 border border-neutral-800 hover:border-red-800/60 font-mono transition-colors"
              title="End combat and return to narrative roleplay"
            >
              End Encounter
            </button>
          )}
        </div>
      </div>

      {/* 1b. Pending Physical Dice & Co-DM Adjudications Queue */}
      {pendingAdjudications && pendingAdjudications.length > 0 && (
        <div className="p-3 bg-amber-950/30 border border-amber-700/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Pending Adjudications ({pendingAdjudications.length})
            </span>
            <span className="text-[10px] text-amber-500 uppercase">
              {isDm ? 'Awaiting DM Confirmation' : 'Awaiting DM Review'}
            </span>
          </div>

          <div className="space-y-2">
            {pendingAdjudications.map((adj) => (
              <div
                key={adj.adjudicationId}
                className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-950/80 border border-amber-800/40 rounded text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 text-[10px] font-bold">
                      {adj.adjudicationType === 'PHYSICAL_DICE_CONFIRMATION'
                        ? 'PHYSICAL DICE CLAIM'
                        : adj.actionType}
                    </span>
                    <span className="text-neutral-300 font-bold">{adj.actorId}</span>
                    {adj.payload?.weaponName && (
                      <span className="text-neutral-400">using {adj.payload.weaponName}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {adj.summary ||
                      (adj.payload?.rawRolls
                        ? `Reported d20: [${adj.payload.rawRolls.join(', ')}], Damage: [${adj.payload?.damageRolls?.join(', ') || 'N/A'}]`
                        : 'Action awaiting resolution')}
                  </p>
                </div>

                {isDm && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onSubmitAction({
                          actionId: `act-dm-appr-${Date.now()}`,
                          clientNonce: `nonce-appr-${Date.now()}`,
                          actorId: 'dm-1',
                          actorRole: userRole,
                          actionType: 'APPROVE_ADJUDICATION',
                          snapshotRef: { ...currentSnapshot },
                          payload: { adjudicationId: adj.adjudicationId },
                          timestampUtc: new Date().toISOString(),
                        })
                      }
                      className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        onSubmitAction({
                          actionId: `act-dm-rej-${Date.now()}`,
                          clientNonce: `nonce-rej-${Date.now()}`,
                          actorId: 'dm-1',
                          actorRole: userRole,
                          actionType: 'REJECT_ADJUDICATION',
                          snapshotRef: { ...currentSnapshot },
                          payload: { adjudicationId: adj.adjudicationId },
                          timestampUtc: new Date().toISOString(),
                        })
                      }
                      className="px-2.5 py-1 rounded bg-red-900/80 hover:bg-red-800 text-red-200 font-bold text-[11px] transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Combatant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {combatState.combatants.map((entry, idx) => {
          const isCurrent = idx === combatState.activeTurnIndex;
          const entity = getCombatantEntity(entry.entityId);
          if (!entity) return null;

          const isChar = entity.type === 'character';
          const char = isChar ? (entity.data as CharacterSheet) : null;
          const npc = !isChar ? (entity.data as any) : null;

          const curHp = isChar ? char!.currentHp : (npc?.statBlock?.hitPoints ?? 20);
          const maxHp = isChar ? char!.maxHp : (npc?.statBlock?.maxHitPoints ?? npc?.statBlock?.hitPoints ?? 20);
          const tempHp = isChar ? (char!.tempHp || 0) : 0;
          const ac = isChar ? char!.armorClass : (npc?.statBlock?.armorClass ?? 13);
          const conditions: string[] = (entity.data as any).conditions || [];
          const isDown = curHp === 0;

          const hpPercent = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
          const hpBarColor =
            hpPercent > 50
              ? 'bg-emerald-500'
              : hpPercent > 20
              ? 'bg-amber-500'
              : 'bg-red-500';

          return (
            <div
              key={entry.entityId}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'bg-neutral-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Top Row: Name, Initiative Badge, Sheet Link */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-800/80">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />}
                      <h4 className="font-bold text-neutral-100 font-cinzel text-xs truncate">
                        {entry.name}
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono block truncate">
                      {isChar
                        ? `Lvl ${char!.level} ${char!.race} ${char!.characterClass}`
                        : (npc?.occupation || 'NPC Combatant')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-neutral-900 border border-neutral-700 text-amber-300"
                      title={`Initiative: ${entry.initiative} (Roll ${entry.roll} + ${entry.initiativeBonus})`}
                    >
                      Init {entry.initiative}
                    </span>
                    {isChar && (
                      <button
                        onClick={() => onOpenCharacterSheet(char!)}
                        className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-200 text-[10px] font-mono transition-colors"
                        title="Open full character sheet"
                      >
                        Sheet
                      </button>
                    )}
                  </div>
                </div>

                {/* HP & AC Bar */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      <span className={`font-bold ${isDown ? 'text-red-400' : 'text-neutral-100'}`}>
                        {curHp} / {maxHp}
                      </span>
                      {tempHp > 0 && (
                        <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          +{tempHp} Temp
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-200 font-bold">{ac}</span>
                    </div>
                  </div>

                  {/* HP Progress Bar */}
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${hpBarColor}`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>

                  {/* Quick HP Adjustment Steppers (DM Only) */}
                  {isDm && (
                    <div className="flex items-center justify-between pt-1 gap-1 text-[10px] font-mono">
                      <button
                        onClick={() => handleQuickHpAdjust(entry.entityId, -5)}
                        className="flex-1 py-0.5 rounded bg-neutral-900 hover:bg-red-950 text-red-400 hover:text-red-200 border border-neutral-800 hover:border-red-800 transition-colors"
                        title="Deal 5 Damage"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleQuickHpAdjust(entry.entityId, -1)}
                        className="flex-1 py-0.5 rounded bg-neutral-900 hover:bg-red-950 text-red-400 hover:text-red-200 border border-neutral-800 hover:border-red-800 transition-colors"
                        title="Deal 1 Damage"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleQuickHpAdjust(entry.entityId, 1)}
                        className="flex-1 py-0.5 rounded bg-neutral-900 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-200 border border-neutral-800 hover:border-emerald-800 transition-colors"
                        title="Heal 1 HP"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleQuickHpAdjust(entry.entityId, 5)}
                        className="flex-1 py-0.5 rounded bg-neutral-900 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-200 border border-neutral-800 hover:border-emerald-800 transition-colors"
                        title="Heal 5 HP"
                      >
                        +5
                      </button>
                    </div>
                  )}
                </div>

                {/* Spell Slots Summary (If Spellcaster) */}
                {isChar && char?.spellSlots && Object.keys(char.spellSlots).length > 0 && (
                  <div className="py-1 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto text-[10px] font-mono">
                    <span className="text-neutral-500 uppercase text-[9px]">Slots:</span>
                    {Object.entries(char.spellSlots).map(([lvl, slot]) => (
                      <span key={lvl} className="text-cyan-300 bg-cyan-950/60 px-1 rounded border border-cyan-800/50">
                        L{lvl}: {slot.max - slot.used}/{slot.max}
                      </span>
                    ))}
                  </div>
                )}

                {/* Conditions Tags */}
                <div className="py-1.5 flex flex-wrap gap-1 items-center">
                  {conditions.map((cond) => (
                    <span
                      key={cond}
                      onClick={() => isDm && handleToggleCondition(entry.entityId, cond)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-950/80 text-red-300 border border-red-800 ${
                        isDm ? 'cursor-pointer hover:bg-red-900 transition-colors' : 'cursor-default'
                      }`}
                      title={isDm ? 'Click to remove condition' : cond}
                    >
                      {cond}{isDm ? ' ×' : ''}
                    </span>
                  ))}

                  {/* Add condition quick popover (DM Only) */}
                  {isDm && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleToggleCondition(entry.entityId, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-neutral-900 text-neutral-400 border border-neutral-800 rounded px-1 py-0.5 text-[9px] font-mono cursor-pointer hover:border-neutral-700"
                      aria-label={`Add condition to ${entry.name}`}
                    >
                      <option value="" disabled>+ Cond</option>
                      {COMMON_CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Bottom Quick Actions: Attack, Spell, Item */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedCombatantId(entry.entityId);
                    setActionModalKind('attack');
                  }}
                  className="flex-1 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-neutral-800 hover:border-amber-700/50 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
                  title="Make an attack"
                >
                  <Sword className="w-3 h-3 text-amber-400" />
                  <span>Attack</span>
                </button>

                {isChar && char?.spells && char.spells.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedCombatantId(entry.entityId);
                      setActionModalKind('cast_spell');
                    }}
                    className="flex-1 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-cyan-200 border border-neutral-800 hover:border-cyan-700/50 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
                    title="Cast a spell"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Cast</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedCombatantId(entry.entityId);
                    setActionModalKind('use_item');
                  }}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[10px] font-mono transition-colors"
                  title="Use Item / Potion"
                >
                  Item
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Action Dialog Modal (Attack / Spell / Item) */}
      {actionModalKind && selectedCombatantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-amber-800/60 rounded-lg p-5 shadow-2xl space-y-4 text-xs font-mono text-neutral-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-bold text-amber-200 font-cinzel text-sm uppercase">
                {actionModalKind === 'attack' && 'Execute Attack Action'}
                {actionModalKind === 'cast_spell' && 'Cast Spell'}
                {actionModalKind === 'use_item' && 'Use Item / Consumable'}
              </span>
              <button
                onClick={() => setActionModalKind(null)}
                className="text-neutral-500 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={actionModalKind === 'attack' ? handleExecuteAttack : handleExecuteCastSpell}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">
                  Target Combatant:
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:border-amber-600 outline-none"
                >
                  <option value="">Select target...</option>
                  {combatState.combatants
                    .filter((c) => c.entityId !== selectedCombatantId)
                    .map((c) => (
                      <option key={c.entityId} value={c.entityId}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {actionModalKind === 'attack' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase text-neutral-400 block mb-1">
                      Weapon / Attack Name:
                    </label>
                    <input
                      type="text"
                      value={selectedWeapon}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedWeapon(val);
                        if (val.toLowerCase().includes('greatsword') || val.toLowerCase().includes('maul')) {
                          setPhysicalDamageDice([3, 3]);
                        } else {
                          setPhysicalDamageDice([4]);
                        }
                      }}
                      placeholder="Longsword / Shortbow / Dagger / Greatsword"
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:border-amber-600 outline-none"
                    />
                  </div>

                  {/* Dice Source Mode Toggle */}
                  <div>
                    <label className="text-[10px] uppercase text-neutral-400 block mb-1">
                      Dice Roll Source:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDiceMode('SERVER_DIGITAL')}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                          diceMode === 'SERVER_DIGITAL'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Virtual Server Dice
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiceMode('PLAYER_PHYSICAL')}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                          diceMode === 'PLAYER_PHYSICAL'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        Real Physical Dice
                      </button>
                    </div>
                  </div>

                  {/* Advantage / Disadvantage toggle */}
                  <div>
                    <label className="text-[10px] uppercase text-neutral-400 block mb-1">
                      Roll Modifier:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['normal', 'advantage', 'disadvantage'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setRollAdvState(mode)}
                          className={`px-2 py-1 rounded text-[11px] font-mono capitalize border transition-colors ${
                            rollAdvState === mode
                              ? 'bg-amber-600/20 border-amber-500 text-amber-200 font-bold'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Physical Dice Inputs */}
                  {diceMode === 'PLAYER_PHYSICAL' && (
                    <div className="p-3 bg-neutral-950/70 border border-amber-900/40 rounded space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                        <span>Reported Physical Faces (1..Sides):</span>
                        <span className="text-[10px] text-neutral-400">Honour System</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-0.5">
                            d20 Attack Face:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={physicalD20}
                            onChange={(e) => setPhysicalD20(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-amber-200 font-bold text-center"
                          />
                        </div>
                        {rollAdvState !== 'normal' && (
                          <div>
                            <label className="text-[10px] text-neutral-400 block mb-0.5">
                              d20 Second Face ({rollAdvState}):
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={physicalD20Adv}
                              onChange={(e) => setPhysicalD20Adv(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                              className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-amber-200 font-bold text-center"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-neutral-400">
                            Damage Dice Faces ({physicalDamageDice.length} die/dice):
                          </label>
                          <button
                            type="button"
                            onClick={() => setPhysicalDamageDice([...physicalDamageDice, 4])}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                          >
                            + Add Die
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {physicalDamageDice.map((val, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-1">
                              <span className="text-[10px] text-neutral-500">#{dIdx + 1}:</span>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={val}
                                onChange={(e) => {
                                  const updated = [...physicalDamageDice];
                                  updated[dIdx] = Math.max(1, parseInt(e.target.value) || 1);
                                  setPhysicalDamageDice(updated);
                                }}
                                className="w-14 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-amber-200 font-bold text-center"
                              />
                              {physicalDamageDice.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setPhysicalDamageDice(physicalDamageDice.filter((_, i) => i !== dIdx))}
                                  className="text-neutral-500 hover:text-red-400 text-xs px-1"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {actionModalKind === 'cast_spell' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase text-neutral-400 block mb-1">
                      Spell Name:
                    </label>
                    <input
                      type="text"
                      value={selectedSpell}
                      onChange={(e) => setSelectedSpell(e.target.value)}
                      placeholder="Firebolt / Cure Wounds / Magic Missile"
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:border-amber-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-neutral-400 block mb-1">
                      Spell Slot Level:
                    </label>
                    <select
                      value={selectedSpellLevel}
                      onChange={(e) => setSelectedSpellLevel(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:border-amber-600 outline-none"
                    >
                      <option value={0}>Cantrip (Level 0)</option>
                      <option value={1}>Level 1 Slot</option>
                      <option value={2}>Level 2 Slot</option>
                      <option value={3}>Level 3 Slot</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActionModalKind(null)}
                  className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
