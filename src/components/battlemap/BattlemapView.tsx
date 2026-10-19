import React, { useState } from 'react';
import {
  Map as MapIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  Grid,
  Ruler,
  Eye,
  EyeOff,
  Shield,
  Heart,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Upload,
  ExternalLink,
  BookOpen,
  DoorClosed,
  DoorOpen,
  Compass,
  AlertTriangle,
  Info,
  Maximize2,
  X,
  Target,
  Sparkles,
  Footprints,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole, PlayerSafeNpc, SnapshotRef } from '../../types/runtime.ts';
import { SAMPLE_BATTLEMAPS, type BattlemapDefinition } from '../../types/battlemap.ts';
import { VirtualTabletop } from '../play/VirtualTabletop.tsx';
import { DiceRollerModal } from '../play/DiceRollerModal.tsx';
import { ActionSubmissionModal } from '../play/ActionSubmissionModal.tsx';

interface BattlemapViewProps {
  characters: CharacterSheet[];
  npcs: (NonPlayerCharacter | PlayerSafeNpc)[];
  userRole: UserRole;
  currentSnapshot: SnapshotRef;
  selectedCharacterId?: string;
  onNavigateToPlay?: () => void;
  onMoveToken: (entityId: string, targetX: number, targetY: number, entityType: 'character' | 'npc') => void;
}

export const BattlemapView: React.FC<BattlemapViewProps> = ({
  characters,
  npcs,
  userRole,
  currentSnapshot,
  selectedCharacterId,
  onNavigateToPlay,
  onMoveToken,
}) => {
  // Map selection
  const [activeMapId, setActiveMapId] = useState<string>('map-yawning-portal');
  const [customMaps, setCustomMaps] = useState<BattlemapDefinition[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(selectedCharacterId || 'char-kaelen');
  const [selectedEntityType, setSelectedEntityType] = useState<'character' | 'npc'>('character');

  // Panels
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showOwlbearModal, setShowOwlbearModal] = useState(false);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Custom Map Form state
  const [importName, setImportName] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importWidth, setImportWidth] = useState(20);
  const [importHeight, setImportHeight] = useState(15);
  const [importScale, setImportScale] = useState(1.0);

  // Combine built-in sample maps and imported maps
  const allMaps = [...SAMPLE_BATTLEMAPS, ...customMaps];
  const activeMap = allMaps.find((m) => m.id === activeMapId) || SAMPLE_BATTLEMAPS[0];

  // Door states for active map
  const [doorStates, setDoorStates] = useState<Record<string, 'open' | 'closed' | 'locked'>>({
    d1: 'closed',
  });

  const toggleDoorState = (doorId: string) => {
    setDoorStates((prev) => {
      const current = prev[doorId] || 'closed';
      const next = current === 'closed' ? 'open' : 'closed';
      return { ...prev, [doorId]: next };
    });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim() || !importUrl.trim()) return;

    const newMap: BattlemapDefinition = {
      id: `custom-map-${Date.now()}`,
      name: importName.trim(),
      locationId: 'loc-custom',
      sceneSummary: `User-imported tactical map image (${importWidth}x${importHeight} grid).`,
      grid: {
        width: importWidth,
        height: importHeight,
        cellSizePx: 40,
        feetPerCell: 5,
        showGrid: true,
        gridColor: 'rgba(217, 119, 6, 0.3)',
      },
      backgroundArtwork: {
        url: importUrl.trim(),
        name: importName.trim(),
        scale: importScale,
        offsetX: 0,
        offsetY: 0,
        opacity: 0.85,
        aspectRatio: `${importWidth}:${importHeight}`,
      },
      geometry: {
        rooms: [],
        corridors: [],
        walls: [],
        doors: [],
      },
      fog: {
        enabled: false,
        defaultState: 'revealed',
        revealedCells: [],
        previousExploredCells: [],
      },
      lineOfSight: {
        enabled: false,
        blocksOnWalls: true,
        blocksOnClosedDoors: true,
        maxSightRadiusFeet: 60,
      },
      tokens: [],
    };

    setCustomMaps((prev) => [...prev, newMap]);
    setActiveMapId(newMap.id);
    setShowImportModal(false);
    setImportName('');
    setImportUrl('');
  };

  const selectedChar = characters.find((c) => c.id === selectedEntityId);
  const selectedNpc = npcs.find((n) => n.id === selectedEntityId);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 overflow-hidden select-none">
      {/* Top Battlemap Workspace Bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-amber-400" />
            <h2 className="font-cinzel font-bold text-amber-100 text-sm tracking-wide">
              Tactical Battlemap
            </h2>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          {/* Map Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono text-neutral-400 hidden md:inline">
              Active Scene Map:
            </span>
            <select
              value={activeMapId}
              onChange={(e) => setActiveMapId(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <optgroup label="Sample Scenes">
                {SAMPLE_BATTLEMAPS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.grid.width}x{m.grid.height})
                  </option>
                ))}
              </optgroup>
              {customMaps.length > 0 && (
                <optgroup label="Imported Maps">
                  {customMaps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Custom)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Quick Action: Import Map Artwork */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors border border-neutral-700/60"
            title="Import custom PNG/JPG/WebP background map"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Import Map</span>
          </button>

          {/* Optional Owlbear Rodeo Integration */}
          <button
            onClick={() => setShowOwlbearModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs transition-colors border border-neutral-800"
            title="Owlbear Rodeo (Optional External Alternative)"
          >
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            <span className="hidden xl:inline">Owlbear Rodeo (Optional)</span>
          </button>
        </div>

        {/* Right action: Jump back to Narrative Play */}
        <div className="flex items-center gap-2">
          {onNavigateToPlay && (
            <button
              onClick={onNavigateToPlay}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-600/50 text-xs font-medium transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Return to Narrative Play</span>
            </button>
          )}
        </div>
      </div>

      {/* Non-Authoritative Status Disclaimer Banner */}
      <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-1 text-[11px] text-amber-200/90 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Integrated Battlemap View</strong> — Token positions and movement are demonstration previews.
            Canonical rules, initiative, HP, and damage are owned solely by the Python R1 runtime.
          </span>
        </div>
        <span className="text-[10px] text-neutral-400 hidden md:inline">
          Scale: {activeMap.grid.feetPerCell}ft / cell · Grid: {activeMap.grid.width}x{activeMap.grid.height}
        </span>
      </div>

      {/* Main 3-Column Battlemap Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel Toggle Button */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="w-4 bg-neutral-950 hover:bg-neutral-900 border-r border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 z-10 transition-colors"
          title={leftPanelOpen ? 'Collapse Left Panel' : 'Expand Left Panel'}
        >
          {leftPanelOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* LEFT PANEL: Map Inspector & Layer Geometry */}
        {leftPanelOpen && (
          <aside className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 shrink-0 overflow-y-auto p-3 space-y-4 text-xs text-neutral-200">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Map Details
              </span>
              <h3 className="font-bold text-neutral-100 font-cinzel text-sm">{activeMap.name}</h3>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                {activeMap.sceneSummary}
              </p>
            </div>

            {/* Grid & Dimensions */}
            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1.5 font-mono text-[11px]">
              <span className="text-amber-400 uppercase text-[10px] font-bold block">Grid Configuration</span>
              <div className="flex justify-between text-neutral-300">
                <span>Dimensions:</span>
                <span>{activeMap.grid.width} cols × {activeMap.grid.height} rows</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Scale:</span>
                <span>{activeMap.grid.feetPerCell} ft / square</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Cell Render:</span>
                <span>{activeMap.grid.cellSizePx} px</span>
              </div>
            </div>

            {/* Geometry Inspector (Rooms, Walls, Doors) */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">
                Geometry & Structures ({activeMap.geometry.rooms.length} Rooms, {activeMap.geometry.walls.length} Walls)
              </span>

              {activeMap.geometry.rooms.length > 0 && (
                <div className="space-y-1">
                  {activeMap.geometry.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-2 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-neutral-200 block">{room.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {room.width}x{room.height} cells · Floor: {room.floorType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Doors List with Interactive State */}
              {activeMap.geometry.doors.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 block">Doors:</span>
                  {activeMap.geometry.doors.map((door) => {
                    const state = doorStates[door.id] || door.state;
                    const isOpen = state === 'open';
                    return (
                      <div
                        key={door.id}
                        className="p-2 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <DoorClosed className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span className="font-mono text-[11px] text-neutral-300">
                            Door #{door.id} ({door.orientation})
                          </span>
                        </div>
                        <button
                          onClick={() => toggleDoorState(door.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                            isOpen
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
                          }`}
                        >
                          {state} (Toggle)
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fog of War & Line of Sight status */}
            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-2">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block font-bold">
                Visibility & LOS Status
              </span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Fog of War:</span>
                <span className={`font-mono ${activeMap.fog.enabled ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {activeMap.fog.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Line of Sight:</span>
                <span className={`font-mono ${activeMap.lineOfSight.enabled ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {activeMap.lineOfSight.enabled ? 'Enabled (Wall Block)' : 'Disabled'}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-900 leading-tight">
                * Full raycast dynamic line of sight engine is scheduled for AIUI-CP002C.
              </div>
            </div>

            {/* Quick Token Roster */}
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Tokens on Map ({characters.length + npcs.length})
              </span>
              <div className="space-y-1">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedEntityId(c.id);
                      setSelectedEntityType('character');
                    }}
                    className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                      selectedEntityId === c.id
                        ? 'bg-amber-900/30 text-amber-200 border border-amber-600/50'
                        : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-850'
                    }`}
                  >
                    <span className="font-medium text-[11px] truncate">{c.name}</span>
                    <span className="text-[9px] font-mono text-emerald-400">
                      {c.currentHp}/{c.maxHp} HP
                    </span>
                  </button>
                ))}
                {npcs.map((n) => {
                  const isVisible = userRole === 'dm_host' || n.token.isVisibleToPlayers;
                  if (!isVisible) return null;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setSelectedEntityId(n.id);
                        setSelectedEntityType('npc');
                      }}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        selectedEntityId === n.id
                          ? 'bg-amber-900/30 text-amber-200 border border-amber-600/50'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-850'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {!n.token.isVisibleToPlayers && (
                          <span title="Hidden from players">
                            <EyeOff className="w-3 h-3 text-red-400 shrink-0" />
                          </span>
                        )}
                        <span className="font-medium text-[11px] truncate">{n.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400">{n.occupation}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Center Canvas: Embedded VirtualTabletop */}
        <main className="flex-1 flex flex-col min-w-0 relative bg-neutral-950">
          <VirtualTabletop
            characters={characters}
            npcs={npcs}
            userRole={userRole}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(id, type) => {
              setSelectedEntityId(id);
              setSelectedEntityType(type);
              setRightPanelOpen(true);
            }}
            onMoveToken={onMoveToken}
            onQuickAttack={() => setShowActionModal(true)}
            onOpenDiceRoller={() => setShowDiceModal(true)}
          />
        </main>

        {/* Right Panel Toggle Button */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="w-4 bg-neutral-950 hover:bg-neutral-900 border-l border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 z-10 transition-colors"
          title={rightPanelOpen ? 'Collapse Right Panel' : 'Expand Right Panel'}
        >
          {rightPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* RIGHT PANEL: Token & Action Inspector */}
        {rightPanelOpen && (
          <aside className="w-72 bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 shrink-0 p-3 space-y-4 overflow-y-auto text-xs text-neutral-200">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Token Inspector
              </span>
              {selectedChar && (
                <div className="space-y-3">
                  <div className="pb-2 border-b border-neutral-800">
                    <h3 className="font-bold text-neutral-100 font-cinzel text-sm">{selectedChar.name}</h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Level {selectedChar.level} {selectedChar.race} {selectedChar.characterClass}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                      <span className="text-[9px] text-neutral-500 uppercase font-mono block">Hit Points</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {selectedChar.currentHp}/{selectedChar.maxHp}
                      </span>
                    </div>
                    <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                      <span className="text-[9px] text-neutral-500 uppercase font-mono block">Armor Class</span>
                      <span className="text-sm font-bold text-amber-300 font-mono">{selectedChar.armorClass}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Speed:</span>
                      <span className="text-neutral-200">{selectedChar.speedFt} ft</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Token Coordinates:</span>
                      <span className="text-amber-400">
                        ({selectedChar.token.x}%, {selectedChar.token.y}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Visibility:</span>
                      <span className="text-emerald-400">Visible to All</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowActionModal(true)}
                      className="flex-1 py-1.5 px-2 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Take Action</span>
                    </button>
                    <button
                      onClick={() => setShowDiceModal(true)}
                      className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors border border-neutral-700"
                    >
                      Roll
                    </button>
                  </div>
                </div>
              )}

              {selectedNpc && (
                <div className="space-y-3">
                  <div className="pb-2 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-neutral-100 font-cinzel text-sm">{selectedNpc.name}</h3>
                      {!selectedNpc.token.isVisibleToPlayers && (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 text-[9px] font-mono">
                          DM Hidden
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {selectedNpc.race} · {selectedNpc.occupation}
                    </span>
                  </div>

                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Token Coordinates:</span>
                      <span className="text-amber-400">
                        ({selectedNpc.token.x}%, {selectedNpc.token.y}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Player Visibility:</span>
                      <span className={selectedNpc.token.isVisibleToPlayers ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedNpc.token.isVisibleToPlayers ? 'Visible' : 'Hidden from Players'}
                      </span>
                    </div>
                    {userRole === 'dm_host' && 'statBlock' in selectedNpc && (selectedNpc as NonPlayerCharacter).statBlock && (
                      <div className="flex justify-between text-neutral-400">
                        <span>Combat Stats (DM):</span>
                        <span className="text-neutral-200">
                          HP {(selectedNpc as NonPlayerCharacter).statBlock?.hitPoints} · AC {(selectedNpc as NonPlayerCharacter).statBlock?.armorClass}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Public Facts or Appearance */}
                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800">
                    <span className="text-[9px] text-neutral-500 uppercase font-mono block">Appearance</span>
                    <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                      {selectedNpc.appearanceDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Import Custom Map Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-6 text-xs text-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold font-cinzel text-amber-100 text-sm">
                  Import Custom Battlemap Artwork
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Map Name / Scene Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Castle Ravenloft Ballroom"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Image Artwork URL (PNG, JPG, WebP)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/map-image.webp"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Columns (Grid Width)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={importWidth}
                    onChange={(e) => setImportWidth(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Rows (Grid Height)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={importHeight}
                    onChange={(e) => setImportHeight(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Scale Factor
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={importScale}
                    onChange={(e) => setImportScale(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <span className="font-bold text-amber-400 font-mono block">AIUI-CP002A Boundary Notice:</span>
                <p>
                  This import workflow adds a background artwork canvas for your session.
                  Geometry alignment and manual wall drawing will be expanded in AIUI-CP002B.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold"
                >
                  Load Custom Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owlbear Rodeo Integration Modal */}
      {showOwlbearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-6 text-xs text-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold font-cinzel text-cyan-100 text-sm">
                  Owlbear Rodeo (Optional External VTT)
                </h3>
              </div>
              <button
                onClick={() => setShowOwlbearModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed text-neutral-300">
              <p>
                <strong>Architecture Decision:</strong> VadAllFate now includes our own native lightweight tactical
                battlemap workspace right here in the application.
              </p>
              <p>
                However, for groups that prefer using Owlbear Rodeo for complex community extension packs, Owlbear
                remains fully supported as an optional external alternative.
              </p>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
                <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase block">
                  External Session Room Link
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://www.owlbear.rodeo"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-neutral-300 font-mono text-[11px]"
                  />
                  <a
                    href="https://www.owlbear.rodeo"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-neutral-950 font-bold rounded flex items-center gap-1 text-xs"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowOwlbearModal(false)}
                className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={showDiceModal}
        onClose={() => setShowDiceModal(false)}
        onApplyRollToGame={(res: any, label: string) => {
          // Non-authoritative demonstration roll
        }}
      />

      {/* Action Submission Modal */}
      <ActionSubmissionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        currentSnapshot={currentSnapshot}
        characters={characters}
        npcs={npcs}
        userRole={userRole}
        selectedCharacterId={selectedCharacterId}
      />
    </div>
  );
};
