import React from 'react';
import { X, ShieldCheck, AlertCircle, Wrench, Ban, Database, Cpu, CheckCircle2 } from 'lucide-react';
import { ARCHITECTURAL_STATUS_REGISTER } from '../../runtime/demoData.ts';
import type { FeatureStatusLevel } from '../../types/runtime.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureStatusModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: FeatureStatusLevel) => {
    switch (status) {
      case 'IMPLEMENTED AND TESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            IMPLEMENTED AND TESTED
          </span>
        );
      case 'IMPLEMENTED — NOT YET VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            IMPLEMENTED — NOT YET VERIFIED
          </span>
        );
      case 'DEMONSTRATION / MOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            DEMONSTRATION / MOCK
          </span>
        );
      case 'NOT IMPLEMENTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-neutral-900 text-neutral-400 border border-neutral-700">
            <Ban className="w-3.5 h-3.5 text-neutral-500" />
            NOT IMPLEMENTED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[88vh] flex flex-col bg-neutral-900 border border-amber-800/40 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-950/60 border border-amber-700/40 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-cinzel text-amber-100 tracking-wide">
                VadAllFate Architectural Feature Register
              </h2>
              <p className="text-xs text-neutral-400">
                Official R1-W00 verification audit: strict separation of tested code, demonstration spines, and unbuilt systems.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Feature Register Modal"
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-neutral-950/40 border-b border-neutral-800/80 flex flex-wrap gap-4 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <span>Canonical Commit Authority: Single source of mutation</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Spine Adapter: Deterministic schema-compliant runtime</span>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid gap-3">
            {ARCHITECTURAL_STATUS_REGISTER.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-500 uppercase">{item.module}</span>
                    <span className="text-neutral-600">•</span>
                    <h3 className="font-semibold text-neutral-100 text-sm">{item.featureName}</h3>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>
                <div className="text-xs font-mono text-amber-300/80 bg-neutral-900/90 px-3 py-1.5 rounded border border-neutral-800 mb-2 overflow-x-auto">
                  <span className="text-neutral-500 select-none">Contract: </span>
                  {item.contract}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>Target Repository: Minilaz-code/VadAllFate (Private)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
