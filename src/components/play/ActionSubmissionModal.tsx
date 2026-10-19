import React, { useState } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { ActionEnvelope, SnapshotRef, CommitReceipt, UserRole } from '../../types/runtime.ts';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import { clientManager } from '../../runtime/adapter.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSnapshot: SnapshotRef;
  characters: CharacterSheet[];
  npcs: NonPlayerCharacter[];
  userRole: UserRole;
  selectedCharacterId?: string;
}

export const ActionSubmissionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSnapshot,
  characters,
  npcs,
  userRole,
  selectedCharacterId,
}) => {
  const [actionType, setActionType] = useState<ActionEnvelope['actionType']>('ATTACK_ACTION');
  const [actorId, setActorId] = useState<string>(selectedCharacterId || characters[0]?.id || 'char-kaelen');
  const [targetId, setTargetId] = useState<string>(npcs[0]?.id || 'npc-brother-vaelin');
  const [freeformText, setFreeformText] = useState('');
  const [skillName, setSkillName] = useState('Perception');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<CommitReceipt | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLastReceipt(null);

    const actionEnvelope: ActionEnvelope = {
      actionId: `act-${Date.now()}`,
      actorId,
      actorRole: userRole,
      actionType,
      payload: {},
      snapshotRef: { ...currentSnapshot },
      timestampUtc: new Date().toISOString(),
      clientNonce: `nonce-${Math.random().toString(36).substring(2, 9)}`,
    };

    if (actionType === 'ATTACK_ACTION') {
      const rollD20 = Math.floor(Math.random() * 20) + 1;
      const bonus = 3;
      actionEnvelope.payload = {
        attackerId: actorId,
        targetId,
        attackName: 'Longbow Snipe',
        roll: rollD20,
        isCritical: rollD20 === 20,
        isFumble: rollD20 === 1,
        totalToHit: rollD20 + bonus,
        damage: Math.floor(Math.random() * 8) + 1 + 3,
      };
    } else if (actionType === 'SKILL_CHECK') {
      const rollD20 = Math.floor(Math.random() * 20) + 1;
      actionEnvelope.payload = {
        skillName,
        roll: rollD20,
        modifier: 2,
        total: rollD20 + 2,
        reason: 'Searching for hidden door grooves',
      };
    } else if (actionType === 'REST_SHORT') {
      actionEnvelope.payload = { minutes: 60 };
    } else if (actionType === 'REST_LONG') {
      actionEnvelope.payload = { minutes: 480 };
    } else if (actionType === 'FREEFORM_ROLEPLAY') {
      actionEnvelope.payload = {
        message: freeformText || 'I hold my lantern forward and inspect the water runes.',
      };
    }

    try {
      const client = clientManager.getClient();
      const { receipt } = await client.submitAction(actionEnvelope);
      setLastReceipt(receipt);
    } catch (err: any) {
      alert(`Runtime Gateway Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-amber-800/40 rounded-lg shadow-2xl overflow-hidden flex flex-col text-xs text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-950/60 border border-amber-700/40 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-cinzel text-amber-100 text-sm tracking-wide">
                Submit ActionEnvelope (Demonstration Client)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Processed via in-memory demonstration client. Python R1 Commit Authority is not connected.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Action Submission Modal"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* SnapshotRef Info banner */}
          <div className="p-3 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] flex items-center justify-between">
            <div>
              <span className="text-neutral-500">Target Snapshot: </span>
              <span className="text-amber-300 font-semibold">Commit Seq #{currentSnapshot.commitSequence}</span>
            </div>
            <div>
              <span className="text-neutral-500">Demo State Hash: </span>
              <span className="text-neutral-300 font-mono">{currentSnapshot.stateHash.substring(0, 10)}...</span>
            </div>
          </div>

          {/* Action Type Selection */}
          <div>
            <label className="text-[11px] uppercase font-mono text-neutral-400 block mb-1">
              Action Type
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
            >
              <option value="ATTACK_ACTION">ATTACK_ACTION — Resolve weapon strike vs target AC</option>
              <option value="SKILL_CHECK">SKILL_CHECK — Execute SRD 5.1 ability check</option>
              <option value="FREEFORM_ROLEPLAY">FREEFORM_ROLEPLAY — Speak to NPC or declare intent</option>
              <option value="REST_SHORT">REST_SHORT — Advance world clock 60m & spend hit dice</option>
              <option value="REST_LONG">REST_LONG — Advance world clock 480m & restore hit points</option>
            </select>
          </div>

          {/* Actor Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-mono text-neutral-400 block mb-1">
                Acting Character
              </label>
              <select
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.characterClass})
                  </option>
                ))}
              </select>
            </div>

            {actionType === 'ATTACK_ACTION' && (
              <div>
                <label className="text-[11px] uppercase font-mono text-neutral-400 block mb-1">
                  Target Entity
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                >
                  {npcs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.title})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {actionType === 'SKILL_CHECK' && (
              <div>
                <label className="text-[11px] uppercase font-mono text-neutral-400 block mb-1">
                  SRD Skill
                </label>
                <select
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-600"
                >
                  <option value="Perception">Perception (Wis)</option>
                  <option value="Stealth">Stealth (Dex)</option>
                  <option value="Athletics">Athletics (Str)</option>
                  <option value="Investigation">Investigation (Int)</option>
                  <option value="Arcana">Arcana (Int)</option>
                  <option value="Insight">Insight (Wis)</option>
                </select>
              </div>
            )}
          </div>

          {actionType === 'FREEFORM_ROLEPLAY' && (
            <div>
              <label className="text-[11px] uppercase font-mono text-neutral-400 block mb-1">
                Dialogue or Action Statement
              </label>
              <textarea
                value={freeformText}
                onChange={(e) => setFreeformText(e.target.value)}
                placeholder="Declare what your character says or attempts..."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-100 focus:outline-none focus:border-amber-600"
              />
            </div>
          )}

          {/* Pipeline Trace Diagram */}
          <div className="p-3 bg-neutral-950/60 rounded border border-neutral-800/80 font-mono text-[10px] text-neutral-400 flex items-center justify-between">
            <span className="text-amber-400">DemoActionEnvelope</span>
            <ArrowRight className="w-3 h-3 text-neutral-600" />
            <span>DemoStatePatch</span>
            <ArrowRight className="w-3 h-3 text-neutral-600" />
            <span>Demo Adapter</span>
            <ArrowRight className="w-3 h-3 text-neutral-600" />
            <span className="text-amber-300">DemoCommitReceipt</span>
          </div>

          {/* Last Returned Receipt with Honest Labeling */}
          {lastReceipt && (
            <div
              className={`p-3.5 rounded border text-xs font-mono space-y-1.5 ${
                lastReceipt.status === 'COMMITTED'
                  ? 'bg-amber-950/30 border-amber-700/60 text-amber-200'
                  : 'bg-red-950/30 border-red-700/60 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {lastReceipt.status === 'COMMITTED' ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span>DEMONSTRATION RECEIPT: {lastReceipt.status}</span>
                <span className="text-[10px] bg-neutral-900 px-1 rounded text-neutral-400 font-normal">
                  [Simulated / Non-Authoritative]
                </span>
              </div>
              <div className="text-[11px] text-neutral-300">
                Demo Sequence: <span className="font-bold text-amber-300">#{lastReceipt.commitSequence}</span> | Synthetic Hash: {lastReceipt.commitHash.substring(0, 10)}...
              </div>
              <div className="text-[10px] text-neutral-400">
                Applied Patches: {lastReceipt.appliedPatchesCount} • Resulting World Minute: {lastReceipt.resultingWorldMinute}m
              </div>
              <div className="text-[9px] text-neutral-500 italic">
                * Note: Synthetic client hash for visual preview only; does not represent cryptographic commit from Python SQLite runtime.
              </div>
              {lastReceipt.error && (
                <div className="text-red-400 font-semibold">{lastReceipt.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 font-mono">
            VadAllFate In-Memory Demo Adapter (Ephemeral Client)
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded transition-colors shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Simulating...' : 'Dispatch Action'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
