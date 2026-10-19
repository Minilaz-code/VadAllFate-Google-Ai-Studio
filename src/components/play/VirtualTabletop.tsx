import React, { useState } from 'react';
import {
  Sword,
  Shield,
  Heart,
  Droplets,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole, PlayerSafeNpc } from '../../types/runtime.ts';
import { SAMPLE_BATTLEMAPS, type BattlemapDefinition } from '../../types/battlemap.ts';
import { BattlemapCanvas } from '../battlemap/BattlemapCanvas.tsx';

interface VirtualTabletopProps {
  characters: CharacterSheet[];
  npcs: (NonPlayerCharacter | PlayerSafeNpc)[];
  userRole: UserRole;
  selectedEntityId?: string;
  mapDefinition?: BattlemapDefinition;
  onSelectEntity: (id: string, type: 'character' | 'npc') => void;
  onMoveToken: (entityId: string, targetX: number, targetY: number, entityType: 'character' | 'npc') => void;
  onQuickAttack?: (attackerId: string, targetId: string) => void;
  onOpenDiceRoller?: () => void;
}

export const VirtualTabletop: React.FC<VirtualTabletopProps> = ({
  characters,
  npcs,
  userRole,
  selectedEntityId,
  mapDefinition,
  onSelectEntity,
  onMoveToken,
  onQuickAttack,
  onOpenDiceRoller,
}) => {
  // Use passed mapDefinition or default to Sunken Vault sample scene
  const activeMap = mapDefinition || SAMPLE_BATTLEMAPS[1];

  // Selected entity data
  const selectedChar = characters.find((c) => c.id === selectedEntityId);
  const selectedNpc = npcs.find((n) => n.id === selectedEntityId);
  const selectedEntity = selectedChar || selectedNpc;

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden border border-neutral-800 rounded-lg select-none">
      {/* Central Interactive Battlemap Canvas */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <BattlemapCanvas
          mapDefinition={activeMap}
          characters={characters}
          npcs={npcs}
          userRole={userRole}
          selectedEntityId={selectedEntityId}
          activeTool="token"
          onSelectEntity={onSelectEntity}
          onMoveToken={onMoveToken}
        />
      </div>

      {/* Selected Entity HUD Bar at Bottom of Canvas */}
      {selectedEntity && (
        <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white font-cinzel text-xs shadow"
              style={{ backgroundColor: selectedChar ? selectedChar.token.color : selectedNpc?.token.color }}
            >
              {selectedEntity.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-100">{selectedEntity.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {selectedChar
                    ? `Lvl ${selectedChar.level} ${selectedChar.characterClass}`
                    : `${selectedNpc?.occupation || 'NPC'}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Heart className="w-3 h-3" />
                  {selectedChar
                    ? `${selectedChar.currentHp} / ${selectedChar.maxHp} HP`
                    : (selectedNpc && 'statBlock' in selectedNpc && (selectedNpc as any).statBlock)
                    ? `${(selectedNpc as any).statBlock.hitPoints} / ${(selectedNpc as any).statBlock.maxHitPoints} HP`
                    : 'N/A'}
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-mono">
                  <Shield className="w-3 h-3" />
                  {selectedChar
                    ? `AC ${selectedChar.armorClass}`
                    : (selectedNpc && 'statBlock' in selectedNpc && (selectedNpc as any).statBlock)
                    ? `AC ${(selectedNpc as any).statBlock.armorClass}`
                    : 'AC 10'}
                </span>
                <span className="text-neutral-500 font-mono">
                  Pos: ({selectedEntity.token.x}%, {selectedEntity.token.y}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              Click anywhere on map to move token
            </span>
            {selectedChar && onOpenDiceRoller && (
              <button
                onClick={onOpenDiceRoller}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 transition-colors"
              >
                <Sword className="w-3 h-3" />
                <span>Roll Attack</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
