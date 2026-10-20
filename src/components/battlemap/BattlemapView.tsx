import React, { useState, useEffect } from 'react';
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
  MousePointer,
  Square,
  Minus,
  Lock,
  Trash2,
  Undo2,
  Redo2,
  FileImage,
  Move,
  CheckCircle,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole, PlayerSafeNpc, SnapshotRef } from '../../types/runtime.ts';
import type {
  BattlemapDefinition,
  BattlemapEditorTool,
  SelectedGeometryRef,
  BattlemapLayerVisibility,
  RectangularRoom,
  CorridorSegment,
  WallSegment,
  DoorSegment,
} from '../../types/battlemap.ts';
import { battlemapSessionManager } from '../../state/battlemapSession.ts';
import { BattlemapCanvas } from './BattlemapCanvas.tsx';
import { DiceRollerModal } from '../play/DiceRollerModal.tsx';
import { ActionSubmissionModal } from '../play/ActionSubmissionModal.tsx';
import { decodeImageInBrowser, calculateFitScale } from '../../utils/imageDecoder.ts';

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
  // Subscribe to persistent session manager for map data
  const [, setSessionTick] = useState(0);

  useEffect(() => {
    const unsub = battlemapSessionManager.subscribe(() => {
      setSessionTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const mapList = battlemapSessionManager.getMaps();
  const activeMap = battlemapSessionManager.getActiveMap();
  const activeMapId = battlemapSessionManager.getActiveMapId();

  // Active Tool selection (restricted by role)
  const isDm = userRole === 'dm_host';
  const [activeTool, setActiveTool] = useState<BattlemapEditorTool>('token');

  // Selected Geometry pointer
  const [selectedGeometry, setSelectedGeometry] = useState<SelectedGeometryRef | null>(null);

  // Selected Token / Entity
  const [selectedEntityId, setSelectedEntityId] = useState<string>(selectedCharacterId || 'char-kaelen');
  const [selectedEntityType, setSelectedEntityType] = useState<'character' | 'npc'>('character');

  // Corridor width setting (cells)
  const [corridorWidth, setCorridorWidth] = useState<number>(2);

  // Layer Visibility
  const [layers, setLayers] = useState<BattlemapLayerVisibility>({
    artwork: true,
    geometry: true,
    grid: true,
    walls: true,
    fog: true,
    tokens: true,
    overlays: true,
  });

  // Collapsible Sidebars
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'geometry' | 'artwork'>('geometry');

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showOwlbearModal, setShowOwlbearModal] = useState(false);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Import Dialog State
  const [importTab, setImportTab] = useState<'local' | 'url'>('local');
  const [importName, setImportName] = useState('');
  const [importWidth, setImportWidth] = useState(20);
  const [importHeight, setImportHeight] = useState(16);
  const [importUrl, setImportUrl] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Undo / Redo capabilities from session manager
  const canUndo = battlemapSessionManager.canUndo(activeMap.id);
  const canRedo = battlemapSessionManager.canRedo(activeMap.id);

  // Keyboard shortcut listener for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form controls
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          battlemapSessionManager.redo(activeMap.id);
        } else {
          battlemapSessionManager.undo(activeMap.id);
        }
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        battlemapSessionManager.redo(activeMap.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMap.id]);

  // Geometry manipulation handlers
  const handleAddRoom = (newRoom: RectangularRoom) => {
    if (!isDm) return;
    battlemapSessionManager.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      rooms: [...activeMap.geometry.rooms, newRoom],
    });
    setSelectedGeometry({ type: 'room', id: newRoom.id });
  };

  const handleAddCorridor = (newCorridor: CorridorSegment) => {
    if (!isDm) return;
    battlemapSessionManager.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      corridors: [...activeMap.geometry.corridors, newCorridor],
    });
    setSelectedGeometry({ type: 'corridor', id: newCorridor.id });
  };

  const handleAddWall = (newWall: WallSegment) => {
    if (!isDm) return;
    battlemapSessionManager.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      walls: [...activeMap.geometry.walls, newWall],
    });
    setSelectedGeometry({ type: 'wall', id: newWall.id });
  };

  const handleAddDoor = (newDoor: DoorSegment) => {
    if (!isDm) return;
    battlemapSessionManager.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      doors: [...activeMap.geometry.doors, newDoor],
    });
    setSelectedGeometry({ type: 'door', id: newDoor.id });
  };

  const handleUpdateDoorState = (doorId: string, newState: 'open' | 'closed' | 'locked') => {
    const updatedDoors = activeMap.geometry.doors.map((d) =>
      d.id === doorId ? { ...d, state: newState } : d
    );
    battlemapSessionManager.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      doors: updatedDoors,
    });
  };

  const handleDeleteGeometry = (geom: SelectedGeometryRef) => {
    if (!isDm) return;
    if (geom.type === 'room') {
      battlemapSessionManager.updateGeometry(activeMap.id, {
        ...activeMap.geometry,
        rooms: activeMap.geometry.rooms.filter((r) => r.id !== geom.id),
      });
    } else if (geom.type === 'corridor') {
      battlemapSessionManager.updateGeometry(activeMap.id, {
        ...activeMap.geometry,
        corridors: activeMap.geometry.corridors.filter((c) => c.id !== geom.id),
      });
    } else if (geom.type === 'wall') {
      battlemapSessionManager.updateGeometry(activeMap.id, {
        ...activeMap.geometry,
        walls: activeMap.geometry.walls.filter((w) => w.id !== geom.id),
      });
    } else if (geom.type === 'door') {
      battlemapSessionManager.updateGeometry(activeMap.id, {
        ...activeMap.geometry,
        doors: activeMap.geometry.doors.filter((d) => d.id !== geom.id),
      });
    }
    setSelectedGeometry(null);
  };

  // Calibration handlers
  const handleFitArtworkToGrid = () => {
    if (!activeMap.backgroundArtwork) return;
    const targetW = activeMap.grid.width * activeMap.grid.cellSizePx;
    const targetH = activeMap.grid.height * activeMap.grid.cellSizePx;
    const natW = activeMap.backgroundArtwork.naturalWidth || 1200;
    const natH = activeMap.backgroundArtwork.naturalHeight || 800;

    const fit = calculateFitScale(natW, natH, targetW, targetH, 'contain');
    battlemapSessionManager.updateArtwork(activeMap.id, {
      scale: fit.scale,
      offsetX: fit.offsetX,
      offsetY: fit.offsetY,
    });
  };

  // Local file change handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecoding(true);
    try {
      const decoded = await decodeImageInBrowser(file);
      setLocalFile(file);
      if (!importName) {
        setImportName(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to decode image file.');
      setLocalFile(null);
    } finally {
      setIsDecoding(false);
    }
  };

  // Handle Map Import submission
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim()) {
      setImportError('Please enter a name for the battlemap scene.');
      return;
    }

    setIsDecoding(true);
    setImportError(null);

    try {
      let decoded;
      if (importTab === 'local') {
        if (!localFile) {
          setImportError('Please select a local PNG, JPG, or WebP image file.');
          setIsDecoding(false);
          return;
        }
        decoded = await decodeImageInBrowser(localFile);
      } else {
        if (!importUrl.trim()) {
          setImportError('Please provide a valid image URL.');
          setIsDecoding(false);
          return;
        }
        decoded = await decodeImageInBrowser(importUrl.trim());
      }

      const newMap: BattlemapDefinition = {
        id: `custom-map-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: importName.trim(),
        locationId: 'loc-custom',
        sceneSummary: `User-imported tactical battlemap (${importWidth}x${importHeight} grid).`,
        grid: {
          width: importWidth,
          height: importHeight,
          cellSizePx: 42,
          feetPerCell: 5,
          showGrid: true,
          gridColor: 'rgba(217, 119, 6, 0.35)',
          originX: 0,
          originY: 0,
        },
        backgroundArtwork: {
          url: decoded.url,
          name: importName.trim(),
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          opacity: 0.85,
          aspectRatio: decoded.aspectRatio,
          isLocalBlob: decoded.isLocalBlob,
          naturalWidth: decoded.naturalWidth,
          naturalHeight: decoded.naturalHeight,
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

      battlemapSessionManager.addCustomMap(newMap);
      setShowImportModal(false);
      setImportName('');
      setImportUrl('');
      setLocalFile(null);
      setImportError(null);
    } catch (err: any) {
      setImportError(err.message || 'Image import failed.');
    } finally {
      setIsDecoding(false);
    }
  };

  // Inspect selected room, corridor, wall, door
  const selectedRoom =
    selectedGeometry?.type === 'room'
      ? activeMap.geometry.rooms.find((r) => r.id === selectedGeometry.id)
      : null;
  const selectedCorridor =
    selectedGeometry?.type === 'corridor'
      ? activeMap.geometry.corridors.find((c) => c.id === selectedGeometry.id)
      : null;
  const selectedWall =
    selectedGeometry?.type === 'wall'
      ? activeMap.geometry.walls.find((w) => w.id === selectedGeometry.id)
      : null;
  const selectedDoor =
    selectedGeometry?.type === 'door'
      ? activeMap.geometry.doors.find((d) => d.id === selectedGeometry.id)
      : null;

  const selectedChar = characters.find((c) => c.id === selectedEntityId);
  const selectedNpc = npcs.find((n) => n.id === selectedEntityId);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-950 overflow-hidden select-none">
      {/* Top Workspace Bar */}
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
              Active Map:
            </span>
            <select
              value={activeMapId}
              onChange={(e) => {
                battlemapSessionManager.setActiveMapId(e.target.value);
                setSelectedGeometry(null);
              }}
              className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              <optgroup label="Sample Scenes">
                {mapList
                  .filter((m) => !m.id.startsWith('custom-map-'))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.grid.width}×{m.grid.height})
                    </option>
                  ))}
              </optgroup>
              {mapList.some((m) => m.id.startsWith('custom-map-')) && (
                <optgroup label="Custom Imported Maps">
                  {mapList
                    .filter((m) => m.id.startsWith('custom-map-'))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.grid.width}×{m.grid.height})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Quick Action: Import Map Artwork (DM Host only) */}
          {isDm && (
            <button
              onClick={() => {
                setImportError(null);
                setShowImportModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors border border-neutral-700/60"
              title="Import custom PNG, JPG, or WebP local file or URL"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Import Map Image</span>
            </button>
          )}

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

      {/* Editor Toolbar: Tools, Layer Toggles, Undo/Redo */}
      <div className="bg-neutral-900/90 border-b border-neutral-800 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0 text-xs">
        {/* Tool Palette */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] uppercase font-mono text-neutral-400 mr-1 hidden sm:inline">
            Tool:
          </span>

          <button
            onClick={() => setActiveTool('token')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTool === 'token'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
            title="Move and select tokens (Play mode)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Token Mode</span>
          </button>

          {isDm && (
            <>
              <button
                onClick={() => setActiveTool('select')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTool === 'select'
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Select and inspect rooms, corridors, walls, and doors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Select Geom</span>
              </button>

              <div className="h-4 w-px bg-neutral-700 mx-0.5" />

              <button
                onClick={() => setActiveTool('room')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTool === 'room'
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Click and drag to draw rectangular rooms snapped to grid"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Draw Room</span>
              </button>

              <button
                onClick={() => setActiveTool('corridor')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTool === 'corridor'
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Click and drag to connect rooms with straight or orthogonal corridors"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Corridor</span>
              </button>

              {activeTool === 'corridor' && (
                <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">
                  <span className="text-[10px] text-neutral-400 font-mono">Width:</span>
                  <select
                    value={corridorWidth}
                    onChange={(e) => setCorridorWidth(Number(e.target.value))}
                    className="bg-transparent text-amber-300 font-mono text-[11px] focus:outline-none"
                  >
                    <option value="1">1 cell (5ft)</option>
                    <option value="2">2 cells (10ft)</option>
                    <option value="3">3 cells (15ft)</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => setActiveTool('wall')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTool === 'wall'
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Draw wall segments between two map points"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Draw Wall</span>
              </button>

              <button
                onClick={() => setActiveTool('door')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  activeTool === 'door'
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Click on an existing wall to place a door"
              >
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Place Door</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTool('measure')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTool === 'measure'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
            title="Measure distance in standard 5e feet"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Ruler</span>
          </button>

          {isDm && (
            <>
              <div className="h-4 w-px bg-neutral-700 mx-0.5" />
              <button
                onClick={() => battlemapSessionManager.undo(activeMap.id)}
                disabled={!canUndo}
                className={`p-1.5 rounded transition-colors ${
                  canUndo
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
                title="Undo recent geometry edit (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => battlemapSessionManager.redo(activeMap.id)}
                disabled={!canRedo}
                className={`p-1.5 rounded transition-colors ${
                  canRedo
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
                title="Redo recent geometry edit (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono text-neutral-400 hidden lg:inline">
            Layers:
          </span>
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-neutral-800">
            <button
              onClick={() => setLayers((prev) => ({ ...prev, artwork: !prev.artwork }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                layers.artwork ? 'bg-neutral-800 text-neutral-200 font-bold' : 'text-neutral-500'
              }`}
              title="Toggle Background Artwork"
            >
              Art
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, geometry: !prev.geometry }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                layers.geometry ? 'bg-neutral-800 text-neutral-200 font-bold' : 'text-neutral-500'
              }`}
              title="Toggle Room & Corridor Floors"
            >
              Rooms
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, walls: !prev.walls }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                layers.walls ? 'bg-neutral-800 text-neutral-200 font-bold' : 'text-neutral-500'
              }`}
              title="Toggle Walls & Doors"
            >
              Walls
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, grid: !prev.grid }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                layers.grid ? 'bg-neutral-800 text-neutral-200 font-bold' : 'text-neutral-500'
              }`}
              title="Toggle Tactical Grid"
            >
              Grid
            </button>
            <button
              onClick={() => setLayers((prev) => ({ ...prev, tokens: !prev.tokens }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                layers.tokens ? 'bg-neutral-800 text-neutral-200 font-bold' : 'text-neutral-500'
              }`}
              title="Toggle Tokens & Badges"
            >
              Tokens
            </button>
          </div>
        </div>
      </div>

      {/* Non-Authoritative Status Disclaimer Banner */}
      <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-1 text-[11px] text-amber-200/90 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {isDm ? (
              <>
                <strong>DM Host Battlemap Workspace</strong> — Geometry edits persist in frontend session memory.
                Canonical rules and persistence remain with the Python runtime.
              </>
            ) : (
              <>
                <strong>Player Mode</strong> — Token movement is demonstration preview. Geometry editing is reserved for DM Host.
              </>
            )}
          </span>
        </div>
        <span className="text-[10px] text-neutral-400 hidden md:inline">
          Grid: {activeMap.grid.width}×{activeMap.grid.height} ({activeMap.grid.cellSizePx}px/cell)
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

        {/* LEFT PANEL: Geometry Inspector, Calibration & Layers */}
        {leftPanelOpen && (
          <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 shrink-0 overflow-y-auto text-xs text-neutral-200">
            {/* Left Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-950/80">
              <button
                onClick={() => setLeftTab('geometry')}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                  leftTab === 'geometry'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Geometry ({activeMap.geometry.rooms.length + activeMap.geometry.walls.length})
              </button>
              <button
                onClick={() => setLeftTab('artwork')}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                  leftTab === 'artwork'
                    ? 'border-amber-500 text-amber-200 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Calibration
              </button>
            </div>

            <div className="p-3 space-y-4">
              {leftTab === 'geometry' && (
                <div className="space-y-4">
                  {/* Selected Geometry Inspector */}
                  {selectedGeometry ? (
                    <div className="p-3 bg-neutral-950 rounded border border-amber-600/60 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                        <span className="font-bold text-amber-300 uppercase font-mono text-[10px]">
                          Selected {selectedGeometry.type}
                        </span>
                        {isDm && (
                          <button
                            onClick={() => handleDeleteGeometry(selectedGeometry)}
                            className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                            title="Delete selected geometry"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {/* Room Inspector */}
                      {selectedRoom && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-neutral-400 font-mono block">Room Name</label>
                            <input
                              type="text"
                              disabled={!isDm}
                              value={selectedRoom.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                battlemapSessionManager.updateGeometry(activeMap.id, {
                                  ...activeMap.geometry,
                                  rooms: activeMap.geometry.rooms.map((r) =>
                                    r.id === selectedRoom.id ? { ...r, name: newName } : r
                                  ),
                                });
                              }}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 disabled:opacity-60"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                            <div>
                              <span className="text-neutral-400 block text-[10px]">Dimensions:</span>
                              <span className="text-neutral-200">
                                {selectedRoom.width} × {selectedRoom.height} cells
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[10px]">Feet:</span>
                              <span className="text-neutral-200">
                                {selectedRoom.width * 5}ft × {selectedRoom.height * 5}ft
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-neutral-400 font-mono block mb-1">
                              Floor Material
                            </label>
                            <select
                              disabled={!isDm}
                              value={selectedRoom.floorType}
                              onChange={(e) => {
                                const newFloor = e.target.value as RectangularRoom['floorType'];
                                battlemapSessionManager.updateGeometry(activeMap.id, {
                                  ...activeMap.geometry,
                                  rooms: activeMap.geometry.rooms.map((r) =>
                                    r.id === selectedRoom.id ? { ...r, floorType: newFloor } : r
                                  ),
                                });
                              }}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 disabled:opacity-60"
                            >
                              <option value="stone">Stone Masonry</option>
                              <option value="wood">Wood Planks</option>
                              <option value="tiles">Polished Tiles</option>
                              <option value="water">Flooded Pool</option>
                              <option value="dirt">Damp Dirt</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Wall Inspector */}
                      {selectedWall && (
                        <div className="space-y-2">
                          <div className="font-mono text-[11px] text-neutral-300">
                            Endpoints: ({selectedWall.x1}, {selectedWall.y1}) to ({selectedWall.x2},{' '}
                            {selectedWall.y2})
                          </div>
                          <div className="space-y-1 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!isDm}
                                checked={selectedWall.blocksVision}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  battlemapSessionManager.updateGeometry(activeMap.id, {
                                    ...activeMap.geometry,
                                    walls: activeMap.geometry.walls.map((w) =>
                                      w.id === selectedWall.id ? { ...w, blocksVision: val } : w
                                    ),
                                  });
                                }}
                                className="rounded bg-neutral-900 border-neutral-700 text-amber-500"
                              />
                              <span className="text-neutral-300">Blocks Line of Sight</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!isDm}
                                checked={selectedWall.blocksMovement}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  battlemapSessionManager.updateGeometry(activeMap.id, {
                                    ...activeMap.geometry,
                                    walls: activeMap.geometry.walls.map((w) =>
                                      w.id === selectedWall.id ? { ...w, blocksMovement: val } : w
                                    ),
                                  });
                                }}
                                className="rounded bg-neutral-900 border-neutral-700 text-amber-500"
                              />
                              <span className="text-neutral-300">Blocks Movement</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Door Inspector */}
                      {selectedDoor && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center font-mono text-[11px]">
                            <span className="text-neutral-400">Orientation:</span>
                            <span className="capitalize text-neutral-200">{selectedDoor.orientation}</span>
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 font-mono block mb-1">
                              Door State
                            </label>
                            <div className="flex gap-1">
                              {(['closed', 'open', 'locked'] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateDoorState(selectedDoor.id, st)}
                                  className={`flex-1 py-1 rounded text-[11px] font-mono capitalize transition-colors ${
                                    selectedDoor.state === st
                                      ? 'bg-amber-600 text-neutral-950 font-bold'
                                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Corridor Inspector */}
                      {selectedCorridor && (
                        <div className="space-y-2 font-mono text-[11px]">
                          <div className="flex justify-between text-neutral-300">
                            <span>From:</span>
                            <span>({selectedCorridor.startX}, {selectedCorridor.startY})</span>
                          </div>
                          <div className="flex justify-between text-neutral-300">
                            <span>To:</span>
                            <span>({selectedCorridor.endX}, {selectedCorridor.endY})</span>
                          </div>
                          <div className="flex justify-between text-neutral-300">
                            <span>Width:</span>
                            <span>{(selectedCorridor.widthCells || 2) * 5} ft</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-950/60 rounded border border-neutral-800 text-center text-neutral-500 text-[11px]">
                      No geometry selected. Click on a room, wall, or door with the{' '}
                      <strong className="text-neutral-300">Select Geom</strong> tool to inspect or edit.
                    </div>
                  )}

                  {/* Rooms list */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                      Rooms in Scene ({activeMap.geometry.rooms.length})
                    </span>
                    <div className="space-y-1">
                      {activeMap.geometry.rooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => setSelectedGeometry({ type: 'room', id: room.id })}
                          className={`p-2 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                            selectedGeometry?.type === 'room' && selectedGeometry?.id === room.id
                              ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                              : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <div>
                            <span className="font-medium text-[11px] block">{room.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {room.width}×{room.height} cells · {room.floorType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doors list with quick toggle */}
                  {activeMap.geometry.doors.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                        Doors ({activeMap.geometry.doors.length})
                      </span>
                      <div className="space-y-1">
                        {activeMap.geometry.doors.map((door) => {
                          const isOpen = door.state === 'open';
                          return (
                            <div
                              key={door.id}
                              onClick={() => setSelectedGeometry({ type: 'door', id: door.id })}
                              className={`p-2 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                                selectedGeometry?.type === 'door' && selectedGeometry?.id === door.id
                                  ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                                  : 'bg-neutral-950 border-neutral-850 text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                {door.state === 'locked' ? (
                                  <Lock className="w-3 h-3 text-rose-400" />
                                ) : isOpen ? (
                                  <DoorOpen className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <DoorClosed className="w-3 h-3 text-amber-400" />
                                )}
                                <span>
                                  ({door.x}, {door.y})
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextState =
                                    door.state === 'closed' ? 'open' : door.state === 'open' ? 'locked' : 'closed';
                                  handleUpdateDoorState(door.id, nextState);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                              >
                                {door.state}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom map delete button */}
                  {activeMap.id.startsWith('custom-map-') && isDm && (
                    <div className="pt-3 border-t border-neutral-800">
                      <button
                        onClick={() => battlemapSessionManager.deleteMap(activeMap.id)}
                        className="w-full py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-medium flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Custom Map</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Artwork Calibration Tab */}
              {leftTab === 'artwork' && (
                <div className="space-y-4">
                  {activeMap.backgroundArtwork ? (
                    <div className="space-y-3 p-3 bg-neutral-950 rounded border border-neutral-800">
                      <div>
                        <span className="font-bold text-amber-300 font-cinzel text-xs block mb-1">
                          Artwork Calibration
                        </span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Adjust image scale, offsets, and cell size to align grid lines with map artwork.
                        </p>
                      </div>

                      {/* Fit to Grid Button */}
                      <button
                        onClick={handleFitArtworkToGrid}
                        className="w-full py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Fit Image to Grid (Preserve Ratio)</span>
                      </button>

                      {/* Scale Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Artwork Scale:</span>
                          <span className="text-amber-400">
                            {Math.round((activeMap.backgroundArtwork.scale ?? 1.0) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="3.0"
                          step="0.05"
                          value={activeMap.backgroundArtwork.scale ?? 1.0}
                          onChange={(e) =>
                            battlemapSessionManager.updateArtwork(activeMap.id, {
                              scale: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Horizontal Offset X */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Offset X:</span>
                          <span className="text-amber-400">{activeMap.backgroundArtwork.offsetX ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-300"
                          max="300"
                          step="2"
                          value={activeMap.backgroundArtwork.offsetX ?? 0}
                          onChange={(e) =>
                            battlemapSessionManager.updateArtwork(activeMap.id, {
                              offsetX: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Vertical Offset Y */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Offset Y:</span>
                          <span className="text-amber-400">{activeMap.backgroundArtwork.offsetY ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-300"
                          max="300"
                          step="2"
                          value={activeMap.backgroundArtwork.offsetY ?? 0}
                          onChange={(e) =>
                            battlemapSessionManager.updateArtwork(activeMap.id, {
                              offsetY: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Opacity Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Artwork Opacity:</span>
                          <span className="text-amber-400">
                            {Math.round((activeMap.backgroundArtwork.opacity ?? 0.85) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={activeMap.backgroundArtwork.opacity ?? 0.85}
                          onChange={(e) =>
                            battlemapSessionManager.updateArtwork(activeMap.id, {
                              opacity: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Grid Cell Size */}
                      <div className="pt-2 border-t border-neutral-800">
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Grid Cell Size:</span>
                          <span className="text-amber-400">{activeMap.grid.cellSizePx}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="70"
                          step="2"
                          value={activeMap.grid.cellSizePx}
                          onChange={(e) =>
                            battlemapSessionManager.updateGrid(activeMap.id, {
                              cellSizePx: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Reset Calibration */}
                      <button
                        onClick={() => {
                          battlemapSessionManager.updateArtwork(activeMap.id, {
                            scale: 1.0,
                            offsetX: 0,
                            offsetY: 0,
                            opacity: 0.85,
                          });
                          battlemapSessionManager.updateGrid(activeMap.id, {
                            originX: 0,
                            originY: 0,
                          });
                        }}
                        className="w-full py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                      >
                        Reset Alignment
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-950 rounded border border-neutral-800 text-center space-y-2">
                      <FileImage className="w-8 h-8 text-neutral-600 mx-auto" />
                      <p className="text-[11px] text-neutral-400">No background artwork attached to this scene.</p>
                      {isDm && (
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs"
                        >
                          Import Artwork
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col min-w-0 relative bg-neutral-950">
          <BattlemapCanvas
            mapDefinition={activeMap}
            characters={characters}
            npcs={npcs}
            userRole={userRole}
            selectedEntityId={selectedEntityId}
            activeTool={activeTool}
            selectedGeometry={selectedGeometry}
            layerVisibility={layers}
            corridorWidthCells={corridorWidth}
            onSelectEntity={(id, type) => {
              setSelectedEntityId(id);
              setSelectedEntityType(type);
              setRightPanelOpen(true);
            }}
            onSelectGeometry={(geom) => {
              setSelectedGeometry(geom);
              setLeftPanelOpen(true);
              setLeftTab('geometry');
            }}
            onMoveToken={onMoveToken}
            onAddRoom={handleAddRoom}
            onAddCorridor={handleAddCorridor}
            onAddWall={handleAddWall}
            onAddDoor={handleAddDoor}
            onUpdateDoorState={handleUpdateDoorState}
            onDeleteGeometry={handleDeleteGeometry}
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

        {/* RIGHT PANEL: Token & Character Action Inspector */}
        {rightPanelOpen && (
          <aside className="w-72 bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 shrink-0 p-3 space-y-4 overflow-y-auto text-xs text-neutral-200">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                Token & Combatant Inspector
              </span>
              {selectedChar ? (
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
                      <span>Position:</span>
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
              ) : selectedNpc ? (
                <div className="space-y-3">
                  <div className="pb-2 border-b border-neutral-800">
                    <h3 className="font-bold text-neutral-100 font-cinzel text-sm">{selectedNpc.name}</h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {selectedNpc.race} · {selectedNpc.occupation}
                    </span>
                  </div>

                  <div className="p-2 bg-neutral-950 rounded border border-neutral-800 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Visibility:</span>
                      <span className={selectedNpc.token.isVisibleToPlayers ? 'text-emerald-400' : 'text-rose-400'}>
                        {selectedNpc.token.isVisibleToPlayers ? 'Visible to Players' : 'DM Only (Hidden)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Position:</span>
                      <span className="text-amber-400">
                        ({selectedNpc.token.x}%, {selectedNpc.token.y}%)
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                    "{selectedNpc.appearanceDescription}"
                  </p>
                </div>
              ) : (
                <div className="text-neutral-500 italic p-3 text-center">
                  Select a token on the battlemap or from the list below.
                </div>
              )}
            </div>

            {/* Entity roster selector */}
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">
                Combatants & NPCs in Scene
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
                        ? 'bg-amber-900/40 text-amber-200 border border-amber-600/60'
                        : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-850'
                    }`}
                  >
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {c.currentHp}/{c.maxHp} HP
                    </span>
                  </button>
                ))}

                {npcs
                  .filter((n) => {
                    // Check if NPC belongs to current map scene
                    const onMap = activeMap.tokens.some((t) => t.entityId === n.id);
                    const atLocation = n.currentLocationId === activeMap.locationId;
                    return onMap || atLocation;
                  })
                  .map((n) => {
                    if (!isDm && !n.token.isVisibleToPlayers) return null;
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          setSelectedEntityId(n.id);
                          setSelectedEntityType('npc');
                        }}
                        className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                          selectedEntityId === n.id
                            ? 'bg-amber-900/40 text-amber-200 border border-amber-600/60'
                            : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-850'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {!n.token.isVisibleToPlayers && <EyeOff className="w-3 h-3 text-rose-400 shrink-0" />}
                          <span className="font-medium truncate">{n.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400">{n.occupation}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Real Local Image & URL Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-6 text-xs text-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold font-cinzel text-amber-100 text-sm">
                  Import Tactical Battlemap Image
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Import Mode Tabs */}
            <div className="flex border-b border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setImportTab('local');
                  setImportError(null);
                }}
                className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
                  importTab === 'local'
                    ? 'border-amber-500 text-amber-200 bg-neutral-950/40'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Local Image File (PNG, JPG, WebP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportTab('url');
                  setImportError(null);
                }}
                className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
                  importTab === 'url'
                    ? 'border-amber-500 text-amber-200 bg-neutral-950/40'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                External Artwork URL
              </button>
            </div>

            {importError && (
              <div className="p-2.5 rounded bg-rose-950/70 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Battlemap Scene Title *
                </label>
                <input
                  type="text"
                  required
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="e.g. Goblin Ambush Roadway"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {importTab === 'local' ? (
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Select Local File (PNG, JPG, WebP, max 15MB) *
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="w-full text-xs text-neutral-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-neutral-950 hover:file:bg-amber-600 cursor-pointer bg-neutral-950 border border-neutral-700 rounded p-1.5"
                  />
                  {localFile && (
                    <div className="mt-2 p-2 bg-neutral-950 rounded border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center justify-between">
                      <span className="truncate">{localFile.name}</span>
                      <span className="text-amber-400">
                        {(localFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Direct Image URL (PNG/JPG/WebP) *
                  </label>
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Grid Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Grid Columns (Width in cells)
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="60"
                    value={importWidth}
                    onChange={(e) => setImportWidth(Math.max(6, parseInt(e.target.value, 10) || 6))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Grid Rows (Height in cells)
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="60"
                    value={importHeight}
                    onChange={(e) => setImportHeight(Math.max(6, parseInt(e.target.value, 10) || 6))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200"
                  />
                </div>
              </div>

              {/* Session Notice */}
              <div className="p-3 bg-neutral-950 rounded border border-amber-800/50 text-[11px] text-neutral-300 space-y-1">
                <span className="font-bold text-amber-400 font-mono block">
                  AIUI-CP002B1 Session Memory Notice:
                </span>
                <p>
                  Local files are validated, decoded, and kept in browser session memory.
                  They are not persisted to the canonical Python database.
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
                  disabled={isDecoding}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold transition-colors disabled:opacity-60"
                >
                  {isDecoding ? 'Decoding Image...' : 'Create Battlemap'}
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
        onApplyRollToGame={() => {}}
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
