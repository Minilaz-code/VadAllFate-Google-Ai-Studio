import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid as GridIcon,
  Ruler,
  Footprints,
  Eye,
  EyeOff,
  Shield,
  Heart,
  DoorClosed,
  DoorOpen,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole, PlayerSafeNpc } from '../../types/runtime.ts';
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
import {
  gridToMapPixels,
  mapPixelsToGrid,
  screenToMapSpace,
  clampToGrid,
  calculateDistanceInFeet,
  getMapPixelSize,
  type GridDimensions,
  type ViewportTransform,
} from '../../utils/coordinateSystem.ts';

interface BattlemapCanvasProps {
  mapDefinition: BattlemapDefinition;
  characters: CharacterSheet[];
  npcs: (NonPlayerCharacter | PlayerSafeNpc)[];
  userRole: UserRole;
  selectedEntityId?: string;
  activeTool?: BattlemapEditorTool;
  selectedGeometry?: SelectedGeometryRef | null;
  layerVisibility?: BattlemapLayerVisibility;
  onSelectEntity?: (id: string, type: 'character' | 'npc') => void;
  onSelectGeometry?: (geom: SelectedGeometryRef | null) => void;
  onMoveToken?: (entityId: string, targetX: number, targetY: number, entityType: 'character' | 'npc') => void;
  onAddRoom?: (room: RectangularRoom) => void;
  onAddCorridor?: (corridor: CorridorSegment) => void;
  onAddWall?: (wall: WallSegment) => void;
  onAddDoor?: (door: DoorSegment) => void;
  onUpdateDoorState?: (doorId: string, newState: 'open' | 'closed' | 'locked') => void;
  onDeleteGeometry?: (geom: SelectedGeometryRef) => void;
  onQuickAttack?: (attackerId: string, targetId: string) => void;
  onOpenDiceRoller?: () => void;
}

export const BattlemapCanvas: React.FC<BattlemapCanvasProps> = ({
  mapDefinition,
  characters,
  npcs,
  userRole,
  selectedEntityId,
  activeTool = 'token',
  selectedGeometry = null,
  layerVisibility = {
    artwork: true,
    geometry: true,
    grid: true,
    walls: true,
    fog: true,
    tokens: true,
    overlays: true,
  },
  onSelectEntity,
  onSelectGeometry,
  onMoveToken,
  onAddRoom,
  onAddCorridor,
  onAddWall,
  onAddDoor,
  onUpdateDoorState,
  onDeleteGeometry,
}) => {
  // Viewport navigation (pan & zoom)
  const [viewport, setViewport] = useState<ViewportTransform>({
    panX: 0,
    panY: 0,
    zoom: 1.0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Measurement tool state
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number } | null>(null);

  // Geometry drawing preview state
  const [drawStart, setDrawStart] = useState<{ gridX: number; gridY: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ gridX: number; gridY: number } | null>(null);

  // Dragging token state
  const [draggedToken, setDraggedToken] = useState<{
    id: string;
    entityId: string;
    type: 'character' | 'npc';
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const grid: GridDimensions = {
    width: mapDefinition.grid.width,
    height: mapDefinition.grid.height,
    cellSizePx: mapDefinition.grid.cellSizePx,
    feetPerCell: mapDefinition.grid.feetPerCell,
    originX: mapDefinition.grid.originX || 0,
    originY: mapDefinition.grid.originY || 0,
  };

  const { widthPx: mapWidthPx, heightPx: mapHeightPx } = getMapPixelSize(grid);

  // Reset zoom & pan when map changes to keep map centered
  useEffect(() => {
    setViewport({ panX: 0, panY: 0, zoom: 1.0 });
    setMeasureStart(null);
    setMeasureCurrent(null);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [mapDefinition.id]);

  // Convert client coordinate into map space
  const getMapCoords = useCallback(
    (e: React.MouseEvent): { mapX: number; mapY: number; gridX: number; gridY: number } | null => {
      if (!surfaceRef.current) return null;
      const rect = surfaceRef.current.getBoundingClientRect();
      const mapX = (e.clientX - rect.left) / viewport.zoom;
      const mapY = (e.clientY - rect.top) / viewport.zoom;
      const gridPos = mapPixelsToGrid(mapX, mapY, grid, true);
      const clampedGrid = clampToGrid(gridPos.x, gridPos.y, grid.width, grid.height);

      return {
        mapX,
        mapY,
        gridX: clampedGrid.x,
        gridY: clampedGrid.y,
      };
    },
    [viewport.zoom, grid]
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.4, Math.min(2.5, Math.round((prev.zoom + zoomDelta) * 10) / 10)),
    }));
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Space+click or 'pan' tool triggers panning
    if (e.button === 1 || e.shiftKey || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
      return;
    }

    if (e.button !== 0) return; // Only primary button for drawing/selecting

    const coords = getMapCoords(e);
    if (!coords) return;

    if (activeTool === 'measure') {
      if (!measureStart) {
        setMeasureStart({ x: coords.gridX, y: coords.gridY });
        setMeasureCurrent({ x: coords.gridX, y: coords.gridY });
      } else {
        // Clear measurement
        setMeasureStart(null);
        setMeasureCurrent(null);
      }
      return;
    }

    if (activeTool === 'room' || activeTool === 'corridor' || activeTool === 'wall') {
      setDrawStart({ gridX: coords.gridX, gridY: coords.gridY });
      setDrawCurrent({ gridX: coords.gridX, gridY: coords.gridY });
      return;
    }

    if (activeTool === 'door') {
      // Place door at grid cell edge
      const isHorizontal = Math.abs(coords.mapX % grid.cellSizePx - grid.cellSizePx / 2) < Math.abs(coords.mapY % grid.cellSizePx - grid.cellSizePx / 2);
      const newDoor: DoorSegment = {
        id: `door-${Date.now()}`,
        x: coords.gridX,
        y: coords.gridY,
        orientation: isHorizontal ? 'horizontal' : 'vertical',
        state: 'closed',
        blocksVisionWhenClosed: true,
      };
      onAddDoor?.(newDoor);
      return;
    }

    if (activeTool === 'token') {
      // If user clicks on empty cell with a selected entity, move it there
      if (selectedEntityId && !draggedToken) {
        const char = characters.find((c) => c.id === selectedEntityId);
        const npc = npcs.find((n) => n.id === selectedEntityId);
        const entityType = char ? 'character' : 'npc';
        // Convert to percentage coordinate for backward compatibility with CP001/CP002A state
        const pctX = Math.round((coords.gridX / grid.width) * 100);
        const pctY = Math.round((coords.gridY / grid.height) * 100);
        onMoveToken?.(selectedEntityId, pctX, pctY, entityType);
      }
    }
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y,
      }));
      return;
    }

    const coords = getMapCoords(e);
    if (!coords) return;

    if (activeTool === 'measure' && measureStart) {
      setMeasureCurrent({ x: coords.gridX, y: coords.gridY });
    }

    if (drawStart && (activeTool === 'room' || activeTool === 'corridor' || activeTool === 'wall')) {
      setDrawCurrent({ gridX: coords.gridX, gridY: coords.gridY });
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (drawStart && drawCurrent) {
      const coords = getMapCoords(e) || { gridX: drawCurrent.gridX, gridY: drawCurrent.gridY };

      if (activeTool === 'room') {
        const x1 = Math.min(drawStart.gridX, coords.gridX);
        const y1 = Math.min(drawStart.gridY, coords.gridY);
        const x2 = Math.max(drawStart.gridX, coords.gridX);
        const y2 = Math.max(drawStart.gridY, coords.gridY);
        const width = x2 - x1;
        const height = y2 - y1;

        // Minimum 1x1 room
        if (width >= 1 && height >= 1) {
          const roomNumber = (mapDefinition.geometry.rooms.length || 0) + 1;
          const newRoom: RectangularRoom = {
            id: `room-${Date.now()}`,
            name: `Chamber ${roomNumber}`,
            x: x1,
            y: y1,
            width,
            height,
            floorType: 'stone',
          };
          onAddRoom?.(newRoom);
        }
      } else if (activeTool === 'corridor') {
        const dx = Math.abs(coords.gridX - drawStart.gridX);
        const dy = Math.abs(coords.gridY - drawStart.gridY);
        if (dx > 0 || dy > 0) {
          const newCorridor: CorridorSegment = {
            id: `corridor-${Date.now()}`,
            startX: drawStart.gridX,
            startY: drawStart.gridY,
            endX: coords.gridX,
            endY: coords.gridY,
            widthCells: 2,
            floorType: 'stone',
          };
          onAddCorridor?.(newCorridor);
        }
      } else if (activeTool === 'wall') {
        if (drawStart.gridX !== coords.gridX || drawStart.gridY !== coords.gridY) {
          const newWall: WallSegment = {
            id: `wall-${Date.now()}`,
            x1: drawStart.gridX,
            y1: drawStart.gridY,
            x2: coords.gridX,
            y2: coords.gridY,
            blocksMovement: true,
            blocksVision: true,
            thickness: 3,
          };
          onAddWall?.(newWall);
        }
      }
    }

    setDrawStart(null);
    setDrawCurrent(null);
    setDraggedToken(null);
  };

  // Distance calculation for active measurement
  const measuredDistanceFt =
    measureStart && measureCurrent
      ? calculateDistanceInFeet(measureStart, measureCurrent, grid.feetPerCell || 5, grid.cellSizePx, true)
      : 0;

  // Floor style texture mapper
  const getFloorStyle = (floorType: string) => {
    switch (floorType) {
      case 'wood':
        return {
          backgroundColor: '#3b2f20',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 8px, rgba(0,0,0,0.1) 9px, rgba(0,0,0,0.1) 16px)',
          borderColor: '#78532c',
        };
      case 'stone':
        return {
          backgroundColor: '#1e242b',
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)',
          borderColor: '#475569',
        };
      case 'water':
        return {
          backgroundColor: 'rgba(12, 74, 96, 0.65)',
          backgroundImage:
            'radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, transparent 70%)',
          borderColor: '#0284c7',
        };
      case 'tiles':
        return {
          backgroundColor: '#181b22',
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          borderColor: '#94a3b8',
        };
      case 'dirt':
      default:
        return {
          backgroundColor: '#29221b',
          backgroundImage: 'radial-gradient(#1c1611 15%, transparent 16%)',
          backgroundSize: '12px 12px',
          borderColor: '#574233',
        };
    }
  };

  // Keyboard shortcut listener for deleting selected geometry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGeometry) {
        // Ensure user is not typing in an input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        onDeleteGeometry?.(selectedGeometry);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGeometry, onDeleteGeometry]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden select-none"
    >
      {/* Canvas Viewport Toolbar Header */}
      <div className="px-3 py-1.5 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-300 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-cinzel font-semibold text-amber-200">Scene Map:</span>
          <span className="text-neutral-100 font-medium truncate max-w-[200px] sm:max-w-xs">
            {mapDefinition.name}
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-neutral-400 font-mono text-[11px] hidden sm:inline">
            {grid.width}x{grid.height} ({grid.width * (grid.feetPerCell || 5)}ft × {grid.height * (grid.feetPerCell || 5)}ft)
          </span>
          {activeTool !== 'token' && (
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono text-[10px] uppercase font-bold tracking-wider">
              Tool: {activeTool}
            </span>
          )}
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewport((prev) => ({ ...prev, zoom: Math.max(0.4, prev.zoom - 0.1) }))}
            title="Zoom Out"
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-neutral-400 w-10 text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={() => setViewport((prev) => ({ ...prev, zoom: Math.min(2.5, prev.zoom + 0.1) }))}
            title="Zoom In"
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport({ panX: 0, panY: 0, zoom: 1.0 })}
            title="Reset View"
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Scrollable / Pan Container */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor:
            isPanning || activeTool === 'pan'
              ? 'grab'
              : activeTool === 'measure'
              ? 'crosshair'
              : activeTool === 'room' || activeTool === 'corridor' || activeTool === 'wall'
              ? 'crosshair'
              : activeTool === 'door'
              ? 'copy'
              : 'default',
        }}
        className="relative flex-1 overflow-hidden flex items-center justify-center bg-[#090b0e] p-6"
      >
        {/* Transform Surface Wrapper */}
        <div
          ref={surfaceRef}
          style={{
            width: `${mapWidthPx}px`,
            height: `${mapHeightPx}px`,
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center center',
          }}
          className="relative transition-transform duration-75 shadow-2xl rounded border border-neutral-800 bg-[#101317] overflow-hidden"
        >
          {/* ============================================================ */}
          {/* LAYER 1: Background Artwork (Preserves Natural Aspect Ratio) */}
          {/* ============================================================ */}
          {layerVisibility.artwork && mapDefinition.backgroundArtwork?.url && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
              style={{
                opacity: mapDefinition.backgroundArtwork.opacity ?? 0.7,
              }}
            >
              <img
                src={mapDefinition.backgroundArtwork.url}
                alt={mapDefinition.backgroundArtwork.name || 'Map Artwork'}
                style={{
                  transform: `scale(${mapDefinition.backgroundArtwork.scale ?? 1.0}) translate(${
                    mapDefinition.backgroundArtwork.offsetX ?? 0
                  }px, ${mapDefinition.backgroundArtwork.offsetY ?? 0}px)`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  objectFit: 'contain',
                }}
                className="select-none pointer-events-none"
                draggable={false}
              />
            </div>
          )}

          {/* Fallback pattern if no background artwork */}
          {(!mapDefinition.backgroundArtwork?.url || !layerVisibility.artwork) && (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          )}

          {/* ============================================================ */}
          {/* LAYER 2: Room and Corridor Floors                            */}
          {/* ============================================================ */}
          {layerVisibility.geometry && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corridors */}
              {mapDefinition.geometry.corridors.map((c) => {
                const isSelected = selectedGeometry?.type === 'corridor' && selectedGeometry?.id === c.id;
                const minX = Math.min(c.startX, c.endX);
                const minY = Math.min(c.startY, c.endY);
                const widthCells = Math.max(Math.abs(c.endX - c.startX), c.widthCells || 2);
                const heightCells = Math.max(Math.abs(c.endY - c.startY), c.widthCells || 2);
                const leftPx = minX * grid.cellSizePx;
                const topPx = minY * grid.cellSizePx;
                const widthPx = widthCells * grid.cellSizePx;
                const heightPx = heightCells * grid.cellSizePx;
                const style = getFloorStyle(c.floorType || 'stone');

                return (
                  <div
                    key={c.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSelectGeometry?.({ type: 'corridor', id: c.id });
                      }
                    }}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                      ...style,
                    }}
                    className={`absolute rounded border pointer-events-auto cursor-pointer transition-shadow ${
                      isSelected ? 'ring-2 ring-amber-400 shadow-lg z-10' : 'opacity-90'
                    }`}
                    title={`Corridor (${c.widthCells * 5}ft width)`}
                  />
                );
              })}

              {/* Rectangular Rooms */}
              {mapDefinition.geometry.rooms.map((r) => {
                const isSelected = selectedGeometry?.type === 'room' && selectedGeometry?.id === r.id;
                const leftPx = r.x * grid.cellSizePx;
                const topPx = r.y * grid.cellSizePx;
                const widthPx = r.width * grid.cellSizePx;
                const heightPx = r.height * grid.cellSizePx;
                const style = getFloorStyle(r.floorType);

                return (
                  <div
                    key={r.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSelectGeometry?.({ type: 'room', id: r.id });
                      }
                    }}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                      ...style,
                    }}
                    className={`absolute rounded border pointer-events-auto cursor-pointer transition-all flex flex-col justify-between p-1.5 ${
                      isSelected ? 'ring-2 ring-amber-400 shadow-xl z-10' : 'opacity-95 hover:brightness-110'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-cinzel font-bold text-neutral-200 bg-neutral-950/70 px-1.5 py-0.5 rounded border border-neutral-700/50 truncate">
                        {r.name}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950/60 px-1 rounded">
                        {r.width * 5}x{r.height * 5}ft
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* LAYER 3: Grid Lines                                          */}
          {/* ============================================================ */}
          {layerVisibility.grid && mapDefinition.grid.showGrid && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 12 }}
            >
              <defs>
                <pattern
                  id={`grid-pattern-${mapDefinition.id}`}
                  width={grid.cellSizePx}
                  height={grid.cellSizePx}
                  patternUnits="userSpaceOnUse"
                  x={grid.originX || 0}
                  y={grid.originY || 0}
                >
                  <path
                    d={`M ${grid.cellSizePx} 0 L 0 0 0 ${grid.cellSizePx}`}
                    fill="none"
                    stroke={mapDefinition.grid.gridColor || 'rgba(255,255,255,0.08)'}
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#grid-pattern-${mapDefinition.id})`}
              />
            </svg>
          )}

          {/* ============================================================ */}
          {/* LAYER 4: Walls and Doors                                     */}
          {/* ============================================================ */}
          {layerVisibility.walls && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 15 }}
            >
              {/* Walls */}
              {mapDefinition.geometry.walls.map((w) => {
                const isSelected = selectedGeometry?.type === 'wall' && selectedGeometry?.id === w.id;
                const x1 = w.x1 * grid.cellSizePx + (grid.originX || 0);
                const y1 = w.y1 * grid.cellSizePx + (grid.originY || 0);
                const x2 = w.x2 * grid.cellSizePx + (grid.originX || 0);
                const y2 = w.y2 * grid.cellSizePx + (grid.originY || 0);

                return (
                  <g
                    key={w.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSelectGeometry?.({ type: 'wall', id: w.id });
                      }
                    }}
                  >
                    {/* Wider transparent hit zone */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={14}
                      strokeLinecap="round"
                    />
                    {/* Rendered wall stroke */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSelected ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth={isSelected ? 6 : (w.thickness || 4)}
                      strokeLinecap="round"
                      strokeDasharray={w.blocksVision ? undefined : '6 4'}
                    />
                    {/* Endpoint markers */}
                    <circle cx={x1} cy={y1} r={3} fill={isSelected ? '#f59e0b' : '#94a3b8'} />
                    <circle cx={x2} cy={y2} r={3} fill={isSelected ? '#f59e0b' : '#94a3b8'} />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Doors (HTML overlay elements for rich interactions) */}
          {layerVisibility.walls && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 16 }}>
              {mapDefinition.geometry.doors.map((d) => {
                const isSelected = selectedGeometry?.type === 'door' && selectedGeometry?.id === d.id;
                const leftPx = d.x * grid.cellSizePx + (grid.originX || 0);
                const topPx = d.y * grid.cellSizePx + (grid.originY || 0);
                const isHorizontal = d.orientation === 'horizontal';

                const handleDoorClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (activeTool === 'select') {
                    onSelectGeometry?.({ type: 'door', id: d.id });
                  } else {
                    // Click door to cycle state: closed -> open -> locked -> closed
                    const nextState = d.state === 'closed' ? 'open' : d.state === 'open' ? 'locked' : 'closed';
                    onUpdateDoorState?.(d.id, nextState);
                  }
                };

                return (
                  <div
                    key={d.id}
                    onClick={handleDoorClick}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: isHorizontal ? `${grid.cellSizePx}px` : '12px',
                      height: isHorizontal ? '12px' : `${grid.cellSizePx}px`,
                      transform: isHorizontal ? 'translate(0, -6px)' : 'translate(-6px, 0)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer rounded flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-amber-400' : ''
                    } ${
                      d.state === 'locked'
                        ? 'bg-rose-900 border border-rose-500 shadow-md shadow-rose-950'
                        : d.state === 'closed'
                        ? 'bg-amber-800 border border-amber-500 shadow-md shadow-amber-950'
                        : 'bg-emerald-950/60 border border-dashed border-emerald-400 opacity-80'
                    }`}
                    title={`Door: ${d.state} (Click to toggle)`}
                  >
                    {d.state === 'locked' && <Lock className="w-2.5 h-2.5 text-rose-200" />}
                    {d.state === 'closed' && <DoorClosed className="w-2.5 h-2.5 text-amber-200" />}
                    {d.state === 'open' && <DoorOpen className="w-2.5 h-2.5 text-emerald-300" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* LAYER 5: Fog Overlay Placeholder                             */}
          {/* ============================================================ */}
          {layerVisibility.fog && mapDefinition.fog.enabled && (
            <div
              className="absolute inset-0 pointer-events-none bg-neutral-950/60 backdrop-blur-[1px]"
              style={{ zIndex: 18 }}
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-neutral-900/80 border border-neutral-700 text-[10px] font-mono text-neutral-400">
                Fog of War Active (CP002C Preview)
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* LAYER 6: Tokens & Labels                                     */}
          {/* ============================================================ */}
          {layerVisibility.tokens && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
              {/* Characters */}
              {characters.map((char) => {
                const isSelected = selectedEntityId === char.id;
                // Tokens stored as 0-100% in legacy state, or grid coordinate in battlemap definitions
                const tokenDef = mapDefinition.tokens.find((t) => t.entityId === char.id);
                const xPct = tokenDef ? tokenDef.x : char.token.x;
                const yPct = tokenDef ? tokenDef.y : char.token.y;

                return (
                  <div
                    key={char.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity?.(char.id, 'character');
                    }}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer flex flex-col items-center group transition-transform ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                    }`}
                  >
                    {/* Token Circle */}
                    <div
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-900 text-amber-100 ring-4 ring-amber-400/30'
                          : 'border-emerald-500 bg-neutral-900 text-emerald-200'
                      }`}
                    >
                      {char.name.charAt(0)}
                    </div>

                    {/* Name & HP Badge */}
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-[9px] font-mono text-neutral-200 whitespace-nowrap flex items-center gap-1 shadow-md">
                      <span>{char.name.split(' ')[0]}</span>
                      <span className="text-emerald-400 font-bold">
                        {char.currentHp}/{char.maxHp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* NPCs */}
              {npcs.map((npc) => {
                // Role projection filter: hidden tokens only visible to DM
                if (userRole !== 'dm_host' && !npc.token.isVisibleToPlayers) {
                  return null;
                }

                const isSelected = selectedEntityId === npc.id;
                const tokenDef = mapDefinition.tokens.find((t) => t.entityId === npc.id);
                const xPct = tokenDef ? tokenDef.x : npc.token.x;
                const yPct = tokenDef ? tokenDef.y : npc.token.y;

                return (
                  <div
                    key={npc.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity?.(npc.id, 'npc');
                    }}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer flex flex-col items-center group transition-transform ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                    } ${!npc.token.isVisibleToPlayers ? 'opacity-50 border-dashed' : ''}`}
                  >
                    {/* Token Circle */}
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-rose-950 text-amber-100 ring-4 ring-amber-400/30'
                          : npc.token.isVisibleToPlayers
                          ? 'border-rose-600 bg-neutral-900 text-rose-300'
                          : 'border-neutral-500 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {npc.name.charAt(0)}
                    </div>

                    {/* Name Badge */}
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-[9px] font-mono text-neutral-200 whitespace-nowrap flex items-center gap-1 shadow-md">
                      {!npc.token.isVisibleToPlayers && <EyeOff className="w-2.5 h-2.5 text-neutral-400" />}
                      <span>{npc.name.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* LAYER 7: Drawing Previews, Measurement, and Selection Overlay */}
          {/* ============================================================ */}
          {layerVisibility.overlays && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
              {/* Measurement Line & Distance Pill */}
              {activeTool === 'measure' && measureStart && measureCurrent && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={measureStart.x * grid.cellSizePx}
                    y1={measureStart.y * grid.cellSizePx}
                    x2={measureCurrent.x * grid.cellSizePx}
                    y2={measureCurrent.y * grid.cellSizePx}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                  />
                  <circle
                    cx={measureStart.x * grid.cellSizePx}
                    cy={measureStart.y * grid.cellSizePx}
                    r={5}
                    fill="#f59e0b"
                  />
                  <circle
                    cx={measureCurrent.x * grid.cellSizePx}
                    cy={measureCurrent.y * grid.cellSizePx}
                    r={5}
                    fill="#f59e0b"
                  />
                </svg>
              )}

              {/* Floating Distance Pill */}
              {activeTool === 'measure' && measureStart && measureCurrent && (
                <div
                  style={{
                    left: `${((measureStart.x + measureCurrent.x) / 2) * grid.cellSizePx}px`,
                    top: `${((measureStart.y + measureCurrent.y) / 2) * grid.cellSizePx - 18}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-200 font-mono text-xs font-bold shadow-xl flex items-center gap-1"
                >
                  <Footprints className="w-3 h-3 text-amber-400" />
                  <span>{measuredDistanceFt} ft</span>
                </div>
              )}

              {/* Drawing Room Preview Box */}
              {activeTool === 'room' && drawStart && drawCurrent && (
                <div
                  style={{
                    left: `${Math.min(drawStart.gridX, drawCurrent.gridX) * grid.cellSizePx}px`,
                    top: `${Math.min(drawStart.gridY, drawCurrent.gridY) * grid.cellSizePx}px`,
                    width: `${Math.abs(drawCurrent.gridX - drawStart.gridX) * grid.cellSizePx}px`,
                    height: `${Math.abs(drawCurrent.gridY - drawStart.gridY) * grid.cellSizePx}px`,
                  }}
                  className="absolute border-2 border-dashed border-amber-400 bg-amber-500/20 rounded flex items-center justify-center text-amber-200 font-mono text-xs font-bold"
                >
                  {Math.abs(drawCurrent.gridX - drawStart.gridX)} ×{' '}
                  {Math.abs(drawCurrent.gridY - drawStart.gridY)} (
                  {Math.abs(drawCurrent.gridX - drawStart.gridX) * 5}ft ×{' '}
                  {Math.abs(drawCurrent.gridY - drawStart.gridY) * 5}ft)
                </div>
              )}

              {/* Drawing Corridor Preview Box */}
              {activeTool === 'corridor' && drawStart && drawCurrent && (
                <div
                  style={{
                    left: `${Math.min(drawStart.gridX, drawCurrent.gridX) * grid.cellSizePx}px`,
                    top: `${Math.min(drawStart.gridY, drawCurrent.gridY) * grid.cellSizePx}px`,
                    width: `${Math.max(Math.abs(drawCurrent.gridX - drawStart.gridX), 2) * grid.cellSizePx}px`,
                    height: `${Math.max(Math.abs(drawCurrent.gridY - drawStart.gridY), 2) * grid.cellSizePx}px`,
                  }}
                  className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/20 rounded flex items-center justify-center text-cyan-200 font-mono text-xs font-bold"
                >
                  Corridor Preview (10ft width)
                </div>
              )}

              {/* Drawing Wall Preview Line */}
              {activeTool === 'wall' && drawStart && drawCurrent && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={drawStart.gridX * grid.cellSizePx}
                    y1={drawStart.gridY * grid.cellSizePx}
                    x2={drawCurrent.gridX * grid.cellSizePx}
                    y2={drawCurrent.gridY * grid.cellSizePx}
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                  />
                  <circle cx={drawStart.gridX * grid.cellSizePx} cy={drawStart.gridY * grid.cellSizePx} r={4} fill="#38bdf8" />
                  <circle cx={drawCurrent.gridX * grid.cellSizePx} cy={drawCurrent.gridY * grid.cellSizePx} r={4} fill="#38bdf8" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
