import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Ruler,
  Footprints,
  Sword,
  Target,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  Shield,
  Heart,
  Droplets,
  Layers,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole } from '../../types/runtime.ts';

interface VirtualTabletopProps {
  characters: CharacterSheet[];
  npcs: NonPlayerCharacter[];
  userRole: UserRole;
  selectedEntityId?: string;
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
  onSelectEntity,
  onMoveToken,
  onQuickAttack,
  onOpenDiceRoller,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number } | null>(null);
  const [draggedEntity, setDraggedEntity] = useState<{ id: string; type: 'character' | 'npc' } | null>(null);
  const [pingLocation, setPingLocation] = useState<{ x: number; y: number; id: number } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filter visible tokens according to role-based projection
  const visibleCharacters = characters;
  const visibleNpcs = npcs.filter((n) => userRole === 'dm_host' || n.token.isVisibleToPlayers);

  // Selected entity data
  const selectedChar = characters.find((c) => c.id === selectedEntityId);
  const selectedNpc = npcs.find((n) => n.id === selectedEntityId);
  const selectedEntity = selectedChar || selectedNpc;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Measurement ruler
    if (measurementMode) {
      if (!measureStart) {
        setMeasureStart({ x: clickX, y: clickY });
      } else {
        // Complete measurement
        setMeasureStart(null);
        setMeasureCurrent(null);
        setMeasurementMode(false);
      }
      return;
    }

    // Ping location with Alt key
    if (e.altKey) {
      setPingLocation({ x: clickX, y: clickY, id: Date.now() });
      setTimeout(() => setPingLocation(null), 3000);
      return;
    }

    // If an entity is selected and user clicks empty space, move token there!
    if (selectedEntityId && !draggedEntity) {
      // Snap to nearest 5% grid coordinate
      const snappedX = Math.round(clickX / 5) * 5;
      const snappedY = Math.round(clickY / 5) * 5;
      const type = selectedChar ? 'character' : 'npc';
      onMoveToken(selectedEntityId, snappedX, snappedY, type);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (measurementMode && measureStart && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const curX = ((e.clientX - rect.left) / rect.width) * 100;
      const curY = ((e.clientY - rect.top) / rect.height) * 100;
      setMeasureCurrent({ x: curX, y: curY });
    }
  };

  // Calculate distance in feet (each 5% is 5 feet)
  const calculateDistanceFt = () => {
    if (!measureStart || !measureCurrent) return 0;
    const dx = Math.abs(measureCurrent.x - measureStart.x);
    const dy = Math.abs(measureCurrent.y - measureStart.y);
    const squares = Math.hypot(dx / 5, dy / 5);
    return Math.round(squares * 5);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden border border-neutral-800 rounded-lg select-none">
      {/* Top VTT Toolbar */}
      <div className="px-3 py-2 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-300 z-10">
        <div className="flex items-center gap-2">
          <span className="font-cinzel font-semibold text-amber-200">Scene:</span>
          <span className="text-neutral-100 font-medium">Sunken Vault Antechamber</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400 font-mono text-[11px]">Grid: 5 ft / sq</span>
          <span className="text-neutral-600">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-teal-400">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>Flooded (Difficult Terrain)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle 5ft Grid"
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'bg-amber-950 text-amber-300 border border-amber-700/50' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setMeasurementMode(!measurementMode);
              setMeasureStart(null);
            }}
            title="Measurement Ruler"
            className={`p-1.5 rounded transition-colors ${
              measurementMode ? 'bg-amber-950 text-amber-300 border border-amber-700/50' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-neutral-800 mx-1" />
          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
            title="Zoom Out"
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-neutral-400 w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(1.8, zoom + 0.1))}
            title="Zoom In"
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            title="Reset Zoom"
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas Surface */}
      <div
        className="relative flex-1 overflow-auto flex items-center justify-center bg-neutral-950 p-4"
        style={{ cursor: measurementMode ? 'crosshair' : 'default' }}
      >
        <div
          ref={mapContainerRef}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="relative w-[750px] h-[520px] transition-transform duration-75 shadow-2xl rounded border border-neutral-800 bg-[#121417] overflow-hidden"
        >
          {/* Subtle stylized dungeon background: masonry stones, central pool, pillars */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Flooded Pool Area */}
          <div className="absolute top-[20%] left-[35%] w-[45%] h-[60%] rounded-2xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center">
            <span className="text-[10px] font-mono uppercase text-cyan-600/70 tracking-widest select-none">
              ~ Drowning Pool ~
            </span>
          </div>

          {/* Stone Pillars (Obstacles with Full Cover) */}
          <div
            className="absolute top-[25%] left-[20%] w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md flex items-center justify-center text-[9px] font-mono text-neutral-400"
            title="Stone Colonnade Pillar (Total Cover)"
          >
            P1
          </div>
          <div
            className="absolute top-[65%] left-[20%] w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md flex items-center justify-center text-[9px] font-mono text-neutral-400"
            title="Stone Colonnade Pillar (Total Cover)"
          >
            P2
          </div>
          <div
            className="absolute top-[25%] left-[82%] w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md flex items-center justify-center text-[9px] font-mono text-neutral-400"
            title="Stone Colonnade Pillar (Total Cover)"
          >
            P3
          </div>
          <div
            className="absolute top-[65%] left-[82%] w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-md flex items-center justify-center text-[9px] font-mono text-neutral-400"
            title="Stone Colonnade Pillar (Total Cover)"
          >
            P4
          </div>

          {/* Dais & Relic Altar */}
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-20 h-16 rounded bg-amber-950/40 border border-amber-600/40 flex flex-col items-center justify-center text-center p-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[8px] font-mono text-amber-300 font-bold uppercase">Star-Iron Altar</span>
          </div>

          {/* 5ft Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '5% 5%',
              }}
            />
          )}

          {/* Measurement Line */}
          {measurementMode && measureStart && measureCurrent && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
              <line
                x1={`${measureStart.x}%`}
                y1={`${measureStart.y}%`}
                x2={`${measureCurrent.x}%`}
                y2={`${measureCurrent.y}%`}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx={`${measureStart.x}%`} cy={`${measureStart.y}%`} r="4" fill="#f59e0b" />
              <circle cx={`${measureCurrent.x}%`} cy={`${measureCurrent.y}%`} r="4" fill="#f59e0b" />
              <text
                x={`${(measureStart.x + measureCurrent.x) / 2}%`}
                y={`${(measureStart.y + measureCurrent.y) / 2 - 2}%`}
                fill="#fbbf24"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                className="font-mono bg-neutral-900 px-1"
              >
                {calculateDistanceFt()} ft
              </text>
            </svg>
          )}

          {/* Alt-Click Ping Indicator */}
          {pingLocation && (
            <div
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
              style={{ left: `${pingLocation.x}%`, top: `${pingLocation.y}%` }}
            >
              <div className="w-full h-full rounded-full border-2 border-amber-400 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-amber-500/60" />
            </div>
          )}

          {/* Player Character Tokens */}
          {visibleCharacters.map((char) => {
            const isSelected = selectedEntityId === char.id;
            return (
              <div
                key={char.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity(char.id, 'character');
                }}
                className={`absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-20 ${
                  isSelected
                    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-110 shadow-lg'
                    : 'hover:scale-105'
                }`}
                style={{
                  left: `${char.token.x}%`,
                  top: `${char.token.y}%`,
                  backgroundColor: char.token.color,
                }}
                title={`${char.name} (HP: ${char.currentHp}/${char.maxHp}, AC: ${char.armorClass})`}
              >
                <span className="font-bold text-xs text-white drop-shadow font-cinzel">
                  {char.name.substring(0, 2).toUpperCase()}
                </span>
                {/* Mini HP bar */}
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-neutral-900 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.round((char.currentHp / char.maxHp) * 100)}%` }}
                  />
                </div>
                {/* Token Label */}
                <div className="absolute -top-4 text-[9px] font-semibold text-neutral-200 whitespace-nowrap bg-neutral-900/90 px-1 rounded shadow">
                  {char.token.tokenLabel}
                </div>
              </div>
            );
          })}

          {/* NPC Tokens */}
          {visibleNpcs.map((npc) => {
            const isSelected = selectedEntityId === npc.id;
            return (
              <div
                key={npc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity(npc.id, 'npc');
                }}
                className={`absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-20 ${
                  isSelected
                    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-110 shadow-lg'
                    : 'hover:scale-105'
                } ${!npc.token.isVisibleToPlayers ? 'opacity-80 border-2 border-dashed border-red-500' : ''}`}
                style={{
                  left: `${npc.token.x}%`,
                  top: `${npc.token.y}%`,
                  backgroundColor: npc.token.color,
                }}
                title={`${npc.name} (${npc.title})${!npc.token.isVisibleToPlayers ? ' [DM HIDDEN]' : ''}`}
              >
                <span className="font-bold text-xs text-white drop-shadow font-cinzel">
                  {npc.name.substring(0, 2).toUpperCase()}
                </span>
                {/* DM Hidden badge */}
                {!npc.token.isVisibleToPlayers && (
                  <div className="absolute -top-3.5 right-0 bg-red-950 text-red-300 text-[8px] font-mono px-1 rounded border border-red-700">
                    HIDDEN
                  </div>
                )}
                {/* Token Label */}
                <div className="absolute -top-4 text-[9px] font-semibold text-neutral-200 whitespace-nowrap bg-neutral-900/90 px-1 rounded shadow">
                  {npc.token.tokenLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Entity HUD Bar at Bottom of Canvas */}
      {selectedEntity && (
        <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white font-cinzel text-xs"
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
                    : `${(selectedNpc as NonPlayerCharacter).occupation}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Heart className="w-3 h-3" />
                  {selectedChar
                    ? `${selectedChar.currentHp} / ${selectedChar.maxHp} HP`
                    : selectedNpc?.statBlock
                    ? `${selectedNpc.statBlock.hitPoints} / ${selectedNpc.statBlock.maxHitPoints} HP`
                    : 'N/A'}
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-mono">
                  <Shield className="w-3 h-3" />
                  {selectedChar
                    ? `AC ${selectedChar.armorClass}`
                    : selectedNpc?.statBlock
                    ? `AC ${selectedNpc.statBlock.armorClass}`
                    : 'AC 10'}
                </span>
                <span className="text-neutral-500 font-mono">
                  Pos: ({selectedEntity.token.x}, {selectedEntity.token.y})
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
