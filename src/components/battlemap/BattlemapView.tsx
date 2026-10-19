import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole, PlayerSafeNpc, SnapshotRef } from '../../types/runtime.ts';
import {
  SAMPLE_BATTLEMAPS,
  type BattlemapDefinition,
  type BattlemapEditorTool,
  type SelectedGeometryRef,
  type BattlemapLayerVisibility,
  type RectangularRoom,
  type CorridorSegment,
  type WallSegment,
  type DoorSegment,
  type MapGeometry,
} from '../../types/battlemap.ts';
import { BattlemapCanvas } from './BattlemapCanvas.tsx';
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
  // Map collection state (built-in sample maps initialized with deep copy so edits persist per map)
  const [mapList, setMapList] = useState<BattlemapDefinition[]>(() =>
    JSON.parse(JSON.stringify(SAMPLE_BATTLEMAPS))
  );
  const [activeMapId, setActiveMapId] = useState<string>('map-yawning-portal');

  // Currently active map definition
  const activeMap = mapList.find((m) => m.id === activeMapId) || mapList[0];

  // Active Tool selection
  const [activeTool, setActiveTool] = useState<BattlemapEditorTool>('token');

  // Selected Geometry ref (e.g. { type: 'room', id: 'r1' })
  const [selectedGeometry, setSelectedGeometry] = useState<SelectedGeometryRef | null>(null);

  // Selected Token / Entity
  const [selectedEntityId, setSelectedEntityId] = useState<string>(selectedCharacterId || 'char-kaelen');
  const [selectedEntityType, setSelectedEntityType] = useState<'character' | 'npc'>('character');

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

  // Undo / Redo history stacks for geometry edits (keyed by map ID)
  const [undoHistory, setUndoHistory] = useState<Record<string, MapGeometry[]>>({});
  const [redoHistory, setRedoHistory] = useState<Record<string, MapGeometry[]>>({});

  // Collapsible Sidebars
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'geometry' | 'artwork' | 'layers'>('geometry');

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
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Track created blob URLs to revoke when replaced or unmounted
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      // Cleanup all session blob URLs
      blobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Update active map helper with undo snapshot
  const updateActiveMapGeometry = (newGeometry: MapGeometry) => {
    // Save current geometry to undo history
    setUndoHistory((prev) => {
      const currentStack = prev[activeMap.id] || [];
      return {
        ...prev,
        [activeMap.id]: [...currentStack, JSON.parse(JSON.stringify(activeMap.geometry))],
      };
    });
    // Clear redo history on new action
    setRedoHistory((prev) => ({
      ...prev,
      [activeMap.id]: [],
    }));

    // Update map list
    setMapList((prev) =>
      prev.map((m) => (m.id === activeMap.id ? { ...m, geometry: newGeometry } : m))
    );
  };

  // Undo recent edit
  const handleUndo = () => {
    const currentStack = undoHistory[activeMap.id] || [];
    if (currentStack.length === 0) return;

    const previousGeometry = currentStack[currentStack.length - 1];
    const newUndoStack = currentStack.slice(0, currentStack.length - 1);

    // Save to redo stack
    setRedoHistory((prev) => ({
      ...prev,
      [activeMap.id]: [...(prev[activeMap.id] || []), JSON.parse(JSON.stringify(activeMap.geometry))],
    }));

    setUndoHistory((prev) => ({
      ...prev,
      [activeMap.id]: newUndoStack,
    }));

    setMapList((prev) =>
      prev.map((m) => (m.id === activeMap.id ? { ...m, geometry: previousGeometry } : m))
    );
  };

  // Redo recent edit
  const handleRedo = () => {
    const currentRedoStack = redoHistory[activeMap.id] || [];
    if (currentRedoStack.length === 0) return;

    const nextGeometry = currentRedoStack[currentRedoStack.length - 1];
    const newRedoStack = currentRedoStack.slice(0, currentRedoStack.length - 1);

    // Save to undo stack
    setUndoHistory((prev) => ({
      ...prev,
      [activeMap.id]: [...(prev[activeMap.id] || []), JSON.parse(JSON.stringify(activeMap.geometry))],
    }));

    setRedoHistory((prev) => ({
      ...prev,
      [activeMap.id]: newRedoStack,
    }));

    setMapList((prev) =>
      prev.map((m) => (m.id === activeMap.id ? { ...m, geometry: nextGeometry } : m))
    );
  };

  // Geometry manipulation callbacks
  const handleAddRoom = (newRoom: RectangularRoom) => {
    updateActiveMapGeometry({
      ...activeMap.geometry,
      rooms: [...activeMap.geometry.rooms, newRoom],
    });
    setSelectedGeometry({ type: 'room', id: newRoom.id });
  };

  const handleAddCorridor = (newCorridor: CorridorSegment) => {
    updateActiveMapGeometry({
      ...activeMap.geometry,
      corridors: [...activeMap.geometry.corridors, newCorridor],
    });
    setSelectedGeometry({ type: 'corridor', id: newCorridor.id });
  };

  const handleAddWall = (newWall: WallSegment) => {
    updateActiveMapGeometry({
      ...activeMap.geometry,
      walls: [...activeMap.geometry.walls, newWall],
    });
    setSelectedGeometry({ type: 'wall', id: newWall.id });
  };

  const handleAddDoor = (newDoor: DoorSegment) => {
    updateActiveMapGeometry({
      ...activeMap.geometry,
      doors: [...activeMap.geometry.doors, newDoor],
    });
    setSelectedGeometry({ type: 'door', id: newDoor.id });
  };

  const handleUpdateDoorState = (doorId: string, newState: 'open' | 'closed' | 'locked') => {
    const updatedDoors = activeMap.geometry.doors.map((d) =>
      d.id === doorId ? { ...d, state: newState } : d
    );
    updateActiveMapGeometry({
      ...activeMap.geometry,
      doors: updatedDoors,
    });
  };

  const handleDeleteGeometry = (geom: SelectedGeometryRef) => {
    if (geom.type === 'room') {
      updateActiveMapGeometry({
        ...activeMap.geometry,
        rooms: activeMap.geometry.rooms.filter((r) => r.id !== geom.id),
      });
    } else if (geom.type === 'corridor') {
      updateActiveMapGeometry({
        ...activeMap.geometry,
        corridors: activeMap.geometry.corridors.filter((c) => c.id !== geom.id),
      });
    } else if (geom.type === 'wall') {
      updateActiveMapGeometry({
        ...activeMap.geometry,
        walls: activeMap.geometry.walls.filter((w) => w.id !== geom.id),
      });
    } else if (geom.type === 'door') {
      updateActiveMapGeometry({
        ...activeMap.geometry,
        doors: activeMap.geometry.doors.filter((d) => d.id !== geom.id),
      });
    }
    setSelectedGeometry(null);
  };

  // Artwork calibration updater
  const updateActiveMapArtwork = (
    patch: Partial<NonNullable<BattlemapDefinition['backgroundArtwork']>>
  ) => {
    if (!activeMap.backgroundArtwork) return;
    setMapList((prev) =>
      prev.map((m) =>
        m.id === activeMap.id
          ? {
              ...m,
              backgroundArtwork: {
                ...m.backgroundArtwork!,
                ...patch,
              },
            }
          : m
      )
    );
  };

  // Grid calibration updater
  const updateActiveMapGrid = (patch: Partial<BattlemapDefinition['grid']>) => {
    setMapList((prev) =>
      prev.map((m) =>
        m.id === activeMap.id
          ? {
              ...m,
              grid: {
                ...m.grid,
                ...patch,
              },
            }
          : m
      )
    );
  };

  // Local file selection handler with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: PNG, JPEG/JPG, WebP
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImportError('Invalid image format. Supported formats: PNG, JPG/JPEG, WebP.');
      return;
    }

    // Validate size: 15MB limit
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setImportError('File size exceeds 15MB limit.');
      return;
    }

    // Create session object URL
    const objectUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(objectUrl);
    setLocalFile(file);
    setLocalPreviewUrl(objectUrl);
    if (!importName) {
      // Set default name from file name without extension
      setImportName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Form submission for importing a new map
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim()) {
      setImportError('Please enter a name for the battlemap.');
      return;
    }

    let finalArtworkUrl = '';
    let isLocal = false;

    if (importTab === 'local') {
      if (!localPreviewUrl) {
        setImportError('Please select a local PNG, JPG, or WebP image file.');
        return;
      }
      finalArtworkUrl = localPreviewUrl;
      isLocal = true;
    } else {
      if (!importUrl.trim()) {
        setImportError('Please provide a valid image URL.');
        return;
      }
      finalArtworkUrl = importUrl.trim();
    }

    const newMap: BattlemapDefinition = {
      id: `custom-map-${Date.now()}`,
      name: importName.trim(),
      locationId: 'loc-custom',
      sceneSummary: `User-imported tactical battlemap artwork (${importWidth}x${importHeight} grid).`,
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
        url: finalArtworkUrl,
        name: importName.trim(),
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        opacity: 0.85,
        isLocalBlob: isLocal,
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
      tokens: [
        {
          id: `tok-${Date.now()}`,
          entityId: 'char-kaelen',
          entityType: 'character',
          name: 'Kaelen Shadowstrider',
          x: 20,
          y: 20,
          sizeCells: 1,
          isVisibleToPlayers: true,
          elevationFt: 0,
        },
      ],
    };

    setMapList((prev) => [...prev, newMap]);
    setActiveMapId(newMap.id);
    setShowImportModal(false);
    setImportName('');
    setImportUrl('');
    setLocalFile(null);
    setLocalPreviewUrl(null);
    setImportError(null);
  };

  // Find selected room, corridor, wall, door for property editing
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

  const canUndo = (undoHistory[activeMap.id] || []).length > 0;
  const canRedo = (redoHistory[activeMap.id] || []).length > 0;

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
              Active Map:
            </span>
            <select
              value={activeMapId}
              onChange={(e) => {
                setActiveMapId(e.target.value);
                setSelectedGeometry(null);
              }}
              className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              <optgroup label="Sample Scenes">
                {mapList
                  .filter((m) => !m.id.startsWith('custom-map-'))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.grid.width}x{m.grid.height})
                    </option>
                  ))}
              </optgroup>
              {mapList.some((m) => m.id.startsWith('custom-map-')) && (
                <optgroup label="Custom Imported Maps">
                  {mapList
                    .filter((m) => m.id.startsWith('custom-map-'))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.grid.width}x{m.grid.height})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Quick Action: Import Map Artwork */}
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
            title="Click and drag to connect rooms with corridors"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Draw Corridor</span>
          </button>

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
            title="Click on cell edges to place a door"
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>Place Door</span>
          </button>

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

          <div className="h-4 w-px bg-neutral-700 mx-0.5" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
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
            onClick={handleRedo}
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
        </div>

        {/* Layer Visibility Toggles (Section 6) */}
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
            <strong>Interactive Battlemap Canvas</strong> — Edits to geometry and token positions are presentation previews.
            Canonical combat, initiative, and persistence are owned solely by the Python runtime.
          </span>
        </div>
        <span className="text-[10px] text-neutral-400 hidden md:inline">
          Grid: {activeMap.grid.width}×{activeMap.grid.height} ({activeMap.grid.cellSizePx}px / cell)
        </span>
      </div>

      {/* Main 3-Column Battlemap Workspace Layout */}
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
                        <button
                          onClick={() => handleDeleteGeometry(selectedGeometry)}
                          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                          title="Delete selected geometry"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>

                      {/* Room Inspector */}
                      {selectedRoom && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-neutral-400 font-mono block">Room Name</label>
                            <input
                              type="text"
                              value={selectedRoom.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setMapList((prev) =>
                                  prev.map((m) =>
                                    m.id === activeMap.id
                                      ? {
                                          ...m,
                                          geometry: {
                                            ...m.geometry,
                                            rooms: m.geometry.rooms.map((r) =>
                                              r.id === selectedRoom.id ? { ...r, name: newName } : r
                                            ),
                                          },
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100"
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
                              value={selectedRoom.floorType}
                              onChange={(e) => {
                                const newFloor = e.target.value as RectangularRoom['floorType'];
                                setMapList((prev) =>
                                  prev.map((m) =>
                                    m.id === activeMap.id
                                      ? {
                                          ...m,
                                          geometry: {
                                            ...m.geometry,
                                            rooms: m.geometry.rooms.map((r) =>
                                              r.id === selectedRoom.id ? { ...r, floorType: newFloor } : r
                                            ),
                                          },
                                        }
                                      : m
                                  )
                                );
                              }}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200"
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
                                checked={selectedWall.blocksVision}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setMapList((prev) =>
                                    prev.map((m) =>
                                      m.id === activeMap.id
                                        ? {
                                            ...m,
                                            geometry: {
                                              ...m.geometry,
                                              walls: m.geometry.walls.map((w) =>
                                                w.id === selectedWall.id ? { ...w, blocksVision: val } : w
                                              ),
                                            },
                                          }
                                        : m
                                    )
                                  );
                                }}
                                className="rounded bg-neutral-900 border-neutral-700 text-amber-500"
                              />
                              <span className="text-neutral-300">Blocks Line of Sight</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedWall.blocksMovement}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setMapList((prev) =>
                                    prev.map((m) =>
                                      m.id === activeMap.id
                                        ? {
                                            ...m,
                                            geometry: {
                                              ...m.geometry,
                                              walls: m.geometry.walls.map((w) =>
                                                w.id === selectedWall.id ? { ...w, blocksMovement: val } : w
                                              ),
                                            },
                                          }
                                        : m
                                    )
                                  );
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
                            <span>{selectedCorridor.widthCells * 5} ft</span>
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
                </div>
              )}

              {/* Artwork Calibration Tab (Section 4) */}
              {leftTab === 'artwork' && (
                <div className="space-y-4">
                  {activeMap.backgroundArtwork ? (
                    <div className="space-y-3 p-3 bg-neutral-950 rounded border border-neutral-800">
                      <div>
                        <span className="font-bold text-amber-300 font-cinzel text-xs block mb-1">
                          Artwork Alignment & Grid
                        </span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Calibrate image scale, alignment offsets, and cell size to align the grid overlay with the artwork.
                        </p>
                      </div>

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
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={activeMap.backgroundArtwork.scale ?? 1.0}
                          onChange={(e) => updateActiveMapArtwork({ scale: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Horizontal Offset X */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Horizontal Offset (X):</span>
                          <span className="text-amber-400">{activeMap.backgroundArtwork.offsetX ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-200"
                          max="200"
                          step="2"
                          value={activeMap.backgroundArtwork.offsetX ?? 0}
                          onChange={(e) => updateActiveMapArtwork({ offsetX: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Vertical Offset Y */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Vertical Offset (Y):</span>
                          <span className="text-amber-400">{activeMap.backgroundArtwork.offsetY ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-200"
                          max="200"
                          step="2"
                          value={activeMap.backgroundArtwork.offsetY ?? 0}
                          onChange={(e) => updateActiveMapArtwork({ offsetY: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Opacity Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
                          <span>Artwork Opacity:</span>
                          <span className="text-amber-400">
                            {Math.round((activeMap.backgroundArtwork.opacity ?? 0.8) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={activeMap.backgroundArtwork.opacity ?? 0.8}
                          onChange={(e) => updateActiveMapArtwork({ opacity: parseFloat(e.target.value) })}
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
                          onChange={(e) => updateActiveMapGrid({ cellSizePx: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Reset Calibration Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            updateActiveMapArtwork({ scale: 1.0, offsetX: 0, offsetY: 0, opacity: 0.85 });
                            updateActiveMapGrid({ originX: 0, originY: 0 });
                          }}
                          className="w-full py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                        >
                          Reset Artwork Calibration
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-950 rounded border border-neutral-800 text-center space-y-2">
                      <FileImage className="w-8 h-8 text-neutral-600 mx-auto" />
                      <p className="text-[11px] text-neutral-400">No background artwork attached to this scene.</p>
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs"
                      >
                        Import Artwork
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Canvas: Dedicated Layered Battlemap Renderer */}
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
                      <span>Coordinates:</span>
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

                {npcs.map((n) => {
                  if (userRole !== 'dm_host' && !n.token.isVisibleToPlayers) return null;
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

      {/* Real Local Image & URL Import Modal (Section 4) */}
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
                  AIUI-CP002B Session Memory Notice:
                </span>
                <p>
                  Local files are loaded directly into browser memory for the current session.
                  They are not uploaded to permanent server storage or written to the Python database.
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
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold transition-colors"
                >
                  Create Battlemap
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
