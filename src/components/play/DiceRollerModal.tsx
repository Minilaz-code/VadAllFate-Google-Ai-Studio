import React, { useState } from 'react';
import { X, Dna, Sparkles, RefreshCw, History, Flame, CheckCircle2 } from 'lucide-react';
import { rollDice, DiceRollResult } from '../../runtime/dice.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyRollToGame?: (result: DiceRollResult, label: string) => void;
}

export const DiceRollerModal: React.FC<Props> = ({ isOpen, onClose, onApplyRollToGame }) => {
  const [formula, setFormula] = useState('1d20+3');
  const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [rollLabel, setRollLabel] = useState('Attack / Check');
  const [currentResult, setCurrentResult] = useState<DiceRollResult | null>(null);
  const [history, setHistory] = useState<{ result: DiceRollResult; label: string; time: string }[]>([]);

  if (!isOpen) return null;

  const handleRoll = (customFormula?: string) => {
    const f = customFormula || formula;
    try {
      const res = rollDice(f, mode);
      setCurrentResult(res);
      setHistory((prev) => [
        { result: res, label: rollLabel, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      if (onApplyRollToGame) {
        onApplyRollToGame(res, rollLabel);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const quickDice = [
    { name: 'd4', formula: '1d4' },
    { name: 'd6', formula: '1d6' },
    { name: 'd8', formula: '1d8' },
    { name: 'd10', formula: '1d10' },
    { name: 'd12', formula: '1d12' },
    { name: 'd20', formula: '1d20' },
    { name: 'd100', formula: '1d100' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-amber-800/40 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold font-cinzel text-amber-100 text-sm tracking-wide">
              Virtual Tabletop Dice Tray
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Dice Roller Modal"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-200">
          {/* Roll Mode Selectors */}
          <div className="flex gap-2">
            {[
              { id: 'normal', label: 'Standard Roll' },
              { id: 'advantage', label: 'Advantage (2d20 High)' },
              { id: 'disadvantage', label: 'Disadvantage (2d20 Low)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex-1 py-1.5 px-2 rounded text-center font-medium transition-all ${
                  mode === m.id
                    ? 'bg-amber-950 text-amber-200 border border-amber-600/60 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Quick Dice Buttons */}
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500 mb-1.5 block">
              Quick Polyhedral Roll
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {quickDice.map((d) => (
                <button
                  key={d.name}
                  onClick={() => {
                    setFormula(d.formula);
                    handleRoll(d.formula);
                  }}
                  className="py-2 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-600/50 text-neutral-200 font-mono font-bold text-center transition-colors"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Formula Input */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 block">
              Custom Formula & Reason
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g. 1d20+5, 2d6+3"
                className="w-32 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-amber-200 focus:outline-none focus:border-amber-600"
              />
              <input
                type="text"
                value={rollLabel}
                onChange={(e) => setRollLabel(e.target.value)}
                placeholder="Reason (e.g. Longbow attack)"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-600"
              />
              <button
                onClick={() => handleRoll()}
                className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Roll</span>
              </button>
            </div>
          </div>

          {/* Active Roll Display */}
          {currentResult && (
            <div className="p-4 rounded-lg bg-neutral-950 border border-amber-800/40 text-center relative overflow-hidden">
              {currentResult.isCritical && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse">
                  <Flame className="w-3 h-3 text-emerald-400" /> Critical Hit! (Nat 20)
                </div>
              )}
              {currentResult.isFumble && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700">
                  Critical Fumble (Nat 1)
                </div>
              )}

              <div className="text-[11px] text-neutral-400 font-mono uppercase mb-1">
                {rollLabel} • {currentResult.formula}
              </div>
              <div className="text-4xl font-extrabold font-mono text-amber-200 tracking-tight my-1">
                {currentResult.total}
              </div>
              <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900/80 inline-block px-3 py-1 rounded border border-neutral-800">
                {currentResult.details}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500 mb-1 flex items-center gap-1">
                <History className="w-3 h-3" /> Recent Rolls in Tray
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1 rounded bg-neutral-950/70 border border-neutral-800/80 font-mono text-[11px]"
                  >
                    <span className="text-neutral-400 truncate max-w-[200px]">{h.label}</span>
                    <span className="text-amber-300 font-bold">{h.result.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
