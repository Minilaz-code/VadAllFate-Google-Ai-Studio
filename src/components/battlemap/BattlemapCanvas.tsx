import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  AlertCircle,
  AppWindow,
  Fence,
  Mountain,
  Hand,
  CheckCircle,
  HelpCircle,
  Edit2,
  Trash2,
  Move,
  Info,
  X,
  Square,
  Minus,
  MousePointer,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import type { MapGridConfig, MapBackgroundArtwork } from '../../types/battlemap.ts';
import type { CharacterSheet } from '../../types/dnd5e.ts';
import type { NonPlayerCharacter } from '../../types/npc.ts';
import type { UserRole, PlayerSafeNpc, UserIdentityContext, SnapshotRef } from '../../types/runtime.ts';
import { canAccessDmWorkspaces } from '../../runtime/roleAuthority.ts';
import type {
  BattlemapDefinition,
  BattlemapEditorTool,
  SelectedGeometryRef,
  BattlemapLayerVisibility,
  RectangularRoom,
  CorridorSegment,
  WallSegment,
  DoorSegment,
  WindowSegment,
  RailingSegment,
  TerrainZone,
  TokenOwnership,
  MapTokenPlacement,
} from '../../types/battlemap.ts';
import {
  gridToMapPixels,
  mapPixelsToGrid,
  clampToGrid,
  calculateDistanceInFeet,
  getMapPixelSize,
  type GridDimensions,
  type ViewportTransform,
} from '../../utils/coordinateSystem.ts';
import {
  computeCorridorSegments,
  isValidCorridor,
} from '../../utils/corridorGeometry.ts';
import {
  findHostWallForDoor,
  findHostWallForWindow,
  resolveEffectiveBlockingSegments,
} from '../../utils/wallTopology.ts';
import {
  computeVisibleGridCells,
  resolveCellVisibility,
  isEntityVisibleOnBattlemap,
  manualRevealCells,
  manualHideCells,
  type VisionSource,
} from '../../utils/lineOfSight.ts';
import type { FogOfWarState } from '../../types/battlemap.ts';
import { v2BackendClient } from '../../services/v2BackendClient.ts';

interface BattlemapCanvasProps {
  mapDefinition: BattlemapDefinition;
  characters: CharacterSheet[];
  npcs: (NonPlayerCharacter | PlayerSafeNpc)[];
  userRole: UserRole;
  identity?: UserIdentityContext;
  selectedEntityId?: string;
  activeTool?: BattlemapEditorTool;
  selectedGeometry?: SelectedGeometryRef | null;
  layerVisibility?: BattlemapLayerVisibility;
  corridorWidthCells?: number;
  brushRadiusCells?: number;
  onSelectEntity?: (id: string, type: 'character' | 'npc') => void;
  onSelectGeometry?: (geom: SelectedGeometryRef | null) => void;
  onMoveToken?: (entityId: string, targetX: number, targetY: number, entityType: 'character' | 'npc') => Promise<any> | void;
  onAddRoom?: (room: RectangularRoom) => void;
  onAddCorridor?: (corridor: CorridorSegment) => void;
  onAddWall?: (wall: WallSegment) => void;
  onAddDoor?: (door: DoorSegment) => void;
  onAddWindow?: (win: WindowSegment) => void;
  onAddRailing?: (railing: RailingSegment) => void;
  onAddTerrain?: (terrain: TerrainZone) => void;
  onUpdateDoorState?: (doorId: string, newState: 'open' | 'closed' | 'locked') => void;
  onUpdateWindowState?: (windowId: string, newState: 'clear' | 'obscured' | 'broken') => void;
  onDeleteGeometry?: (geom: SelectedGeometryRef) => void;
  onUpdateFog?: (patchOrFn: Partial<FogOfWarState> | ((prev: FogOfWarState) => FogOfWarState)) => void;
  onUpdateTokenOwnership?: (tokenId: string, ownership: TokenOwnership) => void;
  onUpdateTokenVisibility?: (tokenId: string, isVisible: boolean) => void;
  onDeleteToken?: (tokenId: string) => void;
  onSetActiveTool?: (tool: BattlemapEditorTool) => void;
  onUpdateGridConfig?: (grid: Partial<MapGridConfig>) => void;
  onUpdateArtwork?: (artwork: Partial<MapBackgroundArtwork>) => void;
  currentSnapshot?: SnapshotRef;
  onSubmitAction?: (envelope: any) => Promise<any>;
}

export const BattlemapCanvas: React.FC<BattlemapCanvasProps> = ({
  mapDefinition,
  characters,
  npcs,
  userRole,
  identity,
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
  corridorWidthCells = 2,
  brushRadiusCells = 1,
  onSelectEntity,
  onSelectGeometry,
  onMoveToken,
  onAddRoom,
  onAddCorridor,
  onAddWall,
  onAddDoor,
  onAddWindow,
  onAddRailing,
  onAddTerrain,
  onUpdateDoorState,
  onUpdateWindowState,
  onDeleteGeometry,
  onUpdateFog,
  onUpdateTokenOwnership,
  onUpdateTokenVisibility,
  onDeleteToken,
  onSetActiveTool,
  onUpdateGridConfig,
  onUpdateArtwork,
  currentSnapshot,
  onSubmitAction,
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

  // Manual fog brush state
  const [isBrushingFog, setIsBrushingFog] = useState(false);
  const [hoverGridCoords, setHoverGridCoords] = useState<{ gridX: number; gridY: number } | null>(null);

  // Dragging token state with movement threshold to prevent accidental moves on selection
  const [tokenDrag, setTokenDrag] = useState<{
    entityId: string;
    entityType: 'character' | 'npc';
    startX: number;
    startY: number;
    currentGridX: number;
    currentGridY: number;
    isDragging: boolean;
  } | null>(null);

  // Status message for geometry warnings (e.g. floating door)
  const [canvasNotice, setCanvasNotice] = useState<string | null>(null);

  // Milestone 12: Two-Point Interactive Calibration State
  const [calibrationPoint1, setCalibrationPoint1] = useState<{ x: number; y: number } | null>(null);
  const [calibrationPoint2, setCalibrationPoint2] = useState<{ x: number; y: number } | null>(null);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationUnits, setCalibrationUnits] = useState(10);
  const [calibrationAxis, setCalibrationAxis] = useState<'horizontal' | 'vertical' | 'diagonal'>('horizontal');
  const [showFineTuneHud, setShowFineTuneHud] = useState(false);
  const [isSavingCalibration, setIsSavingCalibration] = useState(false);

  // Authenticated Protected Asset Blob URL Resolution (Stage W0)
  const [resolvedArtworkUrl, setResolvedArtworkUrl] = useState<string>('');
  const [isArtworkLoading, setIsArtworkLoading] = useState<boolean>(false);
  const [artworkError, setArtworkError] = useState<string | null>(null);

  useEffect(() => {
    const rawUrl = mapDefinition.backgroundArtwork?.url;
    if (!rawUrl) {
      setResolvedArtworkUrl('');
      setArtworkError(null);
      setIsArtworkLoading(false);
      return;
    }

    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
      setResolvedArtworkUrl(rawUrl);
      setArtworkError(null);
      setIsArtworkLoading(false);
      return;
    }

    let isMounted = true;
    setResolvedArtworkUrl('');
    setIsArtworkLoading(true);
    setArtworkError(null);

    v2BackendClient.fetchAuthenticatedAssetBlobUrl(rawUrl, userRole)
      .then((blobUrl) => {
        if (!isMounted) return;
        setResolvedArtworkUrl(blobUrl);
        setIsArtworkLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setArtworkError(err?.message || 'Failed to load protected battlemap artwork');
        setResolvedArtworkUrl('');
        setIsArtworkLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapDefinition.backgroundArtwork?.url, userRole]);

  // Zero-Crop Natural Dimension Detection
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(() => {
    if (mapDefinition.backgroundArtwork?.naturalWidth && mapDefinition.backgroundArtwork?.naturalHeight) {
      return {
        width: mapDefinition.backgroundArtwork.naturalWidth,
        height: mapDefinition.backgroundArtwork.naturalHeight,
      };
    }
    return null;
  });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

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
  const naturalWidth = naturalDimensions?.width || mapDefinition.backgroundArtwork?.naturalWidth || 0;
  const naturalHeight = naturalDimensions?.height || mapDefinition.backgroundArtwork?.naturalHeight || 0;
  const surfaceWidthPx = Math.max(mapWidthPx, naturalWidth);
  const surfaceHeightPx = Math.max(mapHeightPx, naturalHeight);

  // Zoom-to-Fit-Image & Zoom-to-Fit-Grid
  const handleZoomToFitImage = useCallback(() => {
    if (!containerRef.current) return;
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;
    if (cWidth <= 0 || cHeight <= 0) return;
    const padding = 32;
    const fitZoom = Math.min((cWidth - padding * 2) / surfaceWidthPx, (cHeight - padding * 2) / surfaceHeightPx, 1.0);
    const clampedZoom = Math.max(0.1, Math.min(3.0, Math.round(fitZoom * 100) / 100));
    setViewport({ panX: 0, panY: 0, zoom: clampedZoom });
  }, [surfaceWidthPx, surfaceHeightPx]);

  const handleZoomToFitGrid = useCallback(() => {
    if (!containerRef.current) return;
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;
    if (cWidth <= 0 || cHeight <= 0) return;
    const padding = 32;
    const fitZoom = Math.min((cWidth - padding * 2) / mapWidthPx, (cHeight - padding * 2) / mapHeightPx, 1.0);
    const clampedZoom = Math.max(0.1, Math.min(3.0, Math.round(fitZoom * 100) / 100));
    setViewport({ panX: 0, panY: 0, zoom: clampedZoom });
  }, [mapWidthPx, mapHeightPx]);

  // SP-00 / SP-03 Authoritative Typed Coordinate Resolver
  const resolveTokenPosition = useCallback(
    (tok?: { x?: number; y?: number; cellX?: number; cellY?: number; coordinateSystem?: string }) => {
      if (!tok) return { cellX: 0, cellY: 0, pctX: 0, pctY: 0 };
      const rawX = tok.cellX !== undefined ? tok.cellX : (tok.x ?? 0);
      const rawY = tok.cellY !== undefined ? tok.cellY : (tok.y ?? 0);
      const coordSys = tok.coordinateSystem || (rawX > 30 || rawY > 30 ? 'percentage' : 'grid_cell');

      let cellX: number;
      let cellY: number;
      let pctX: number;
      let pctY: number;

      if (coordSys === 'percentage') {
        pctX = rawX;
        pctY = rawY;
        cellX = grid.width > 0 ? Math.round((rawX / 100) * grid.width) : 0;
        cellY = grid.height > 0 ? Math.round((rawY / 100) * grid.height) : 0;
      } else {
        cellX = Math.round(rawX);
        cellY = Math.round(rawY);
        pctX = grid.width > 0 ? (cellX / grid.width) * 100 : 0;
        pctY = grid.height > 0 ? (cellY / grid.height) * 100 : 0;
      }
      return { cellX, cellY, pctX, pctY };
    },
    [grid.width, grid.height]
  );

  // Reset & Zero-Crop initial fit when map changes
  useEffect(() => {
    setMeasureStart(null);
    setMeasureCurrent(null);
    setDrawStart(null);
    setDrawCurrent(null);
    setTokenDrag(null);
    setCanvasNotice(null);
    setCalibrationPoint1(null);
    setCalibrationPoint2(null);
    setShowCalibrationModal(false);
    setShowFineTuneHud(false);

    const timer = setTimeout(() => {
      handleZoomToFitImage();
    }, 60);
    return () => clearTimeout(timer);
  }, [mapDefinition.id, handleZoomToFitImage]);

  // Convert client coordinate into map space
  const getMapCoords = useCallback(
    (clientX: number, clientY: number): { mapX: number; mapY: number; gridX: number; gridY: number } | null => {
      if (!surfaceRef.current) return null;
      const rect = surfaceRef.current.getBoundingClientRect();
      const mapX = (clientX - rect.left) / viewport.zoom;
      const mapY = (clientY - rect.top) / viewport.zoom;
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

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    clientX: number;
    clientY: number;
    targetType: 'blank' | 'room' | 'corridor' | 'wall' | 'door' | 'window' | 'railing' | 'terrain' | 'token';
    targetId?: string;
    gridX: number;
    gridY: number;
    data?: any;
  }>({
    isOpen: false,
    clientX: 0,
    clientY: 0,
    targetType: 'blank',
    gridX: 0,
    gridY: 0,
  });

  // Pending Player Door Request Modal State
  const [pendingDoorRequest, setPendingDoorRequest] = useState<{
    doorId: string;
    door: DoorSegment;
    action: 'open' | 'close' | 'unlock';
  } | null>(null);

  // Player Movement Intent Flow (Canonical Python R1 intent preview)
  const [movementIntent, setMovementIntent] = useState<{
    charId: string;
    charName: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    distanceFeet: number;
    speedFeet: number;
    inDifficultTerrain: boolean;
    costFeet: number;
  } | null>(null);

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
        setPendingDoorRequest(null);
      }
    };
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Scoped Non-Passive Wheel Event Listener (AIUI-CP002C1)
  // Ordinary scrolling must NOT zoom the map. Ctrl + wheel zooms centered around pointer.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Ordinary scroll without Ctrl does NOT zoom!
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

      setViewport((prev) => {
        const newZoom = Math.max(0.4, Math.min(2.5, Math.round(prev.zoom * zoomFactor * 100) / 100));
        if (newZoom === prev.zoom) return prev;

        // Pointer-anchored zoom math to keep coordinate under cursor stable
        const mapX = (mouseX - prev.panX) / prev.zoom;
        const mapY = (mouseY - prev.panY) / prev.zoom;

        const newPanX = mouseX - mapX * newZoom;
        const newPanY = mouseY - mapY * newZoom;

        return {
          zoom: newZoom,
          panX: Math.round(newPanX),
          panY: Math.round(newPanY),
        };
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Get cells under the brush radius
  const getBrushCells = useCallback(
    (centerGridX: number, centerGridY: number, radius: number): string[] => {
      const cells: string[] = [];
      const r = Math.max(0, radius - 1);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.hypot(dx, dy) <= r + 0.5) {
            const gx = Math.round(centerGridX + dx);
            const gy = Math.round(centerGridY + dy);
            if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
              cells.push(`${gx},${gy}`);
            }
          }
        }
      }
      return cells;
    },
    [grid.width, grid.height]
  );

  // Center viewport on specific grid cell coordinates
  const handleCenterView = useCallback((gx: number, gy: number) => {
    const targetPxX = gx * grid.cellSizePx + grid.cellSizePx / 2;
    const targetPxY = gy * grid.cellSizePx + grid.cellSizePx / 2;
    const offsetX = (mapWidthPx / 2 - targetPxX) * viewport.zoom;
    const offsetY = (mapHeightPx / 2 - targetPxY) * viewport.zoom;
    setViewport((prev) => ({ ...prev, panX: Math.round(offsetX), panY: Math.round(offsetY) }));
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [grid.cellSizePx, mapWidthPx, mapHeightPx, viewport.zoom]);


  // Two-Point Calibration Actions
  const applyTwoPointCalibration = () => {
    if (!calibrationPoint1 || !calibrationPoint2) return;
    const dx = Math.abs(calibrationPoint2.x - calibrationPoint1.x);
    const dy = Math.abs(calibrationPoint2.y - calibrationPoint1.y);
    const count = Math.max(1, calibrationUnits);
    let pitch = 40;
    if (calibrationAxis === 'horizontal') {
      pitch = dx / count;
    } else if (calibrationAxis === 'vertical') {
      pitch = dy / count;
    } else {
      pitch = Math.sqrt(dx * dx + dy * dy) / (count * Math.SQRT2);
    }
    const cellPitch = Math.max(10, Math.min(200, Math.round(pitch * 10) / 10));
    const origX = Math.round((calibrationPoint1.x % cellPitch) * 10) / 10;
    const origY = Math.round((calibrationPoint1.y % cellPitch) * 10) / 10;

    onUpdateGridConfig?.({
      cellSizePx: cellPitch,
      originX: origX,
      originY: origY,
    });

    onUpdateArtwork?.({
      calibration: {
        isCalibrated: true,
        calibratedAtUtc: new Date().toISOString(),
        pitchPxPerCell: cellPitch,
        originOffsetX: origX,
        originOffsetY: origY,
        anchorPoint: calibrationPoint1,
        referencePoint: calibrationPoint2,
        measuredUnitCount: count,
        measuredAxis: calibrationAxis,
      },
    });

    setShowCalibrationModal(false);
    setShowFineTuneHud(true);
    setCanvasNotice(`Grid calibrated: ${cellPitch}px/cell (Origin: ${origX}, ${origY}). Fine-tune or Save in HUD.`);
  };

  const handleNudgeOrigin = (dx: number, dy: number) => {
    const curX = grid.originX || 0;
    const curY = grid.originY || 0;
    const nextX = Math.round((curX + dx) * 10) / 10;
    const nextY = Math.round((curY + dy) * 10) / 10;
    onUpdateGridConfig?.({ originX: nextX, originY: nextY });
  };

  const handleNudgePitch = (delta: number) => {
    const curPitch = grid.cellSizePx;
    const nextPitch = Math.max(10, Math.min(200, Math.round((curPitch + delta) * 10) / 10));
    onUpdateGridConfig?.({ cellSizePx: nextPitch });
  };

  const handleSaveCalibration = async () => {
    setIsSavingCalibration(true);
    try {
      const isBlob = !!mapDefinition.backgroundArtwork?.url?.startsWith('blob:');

      if (!onSubmitAction) {
        setCanvasNotice('Action submission unavailable: Tabletop disconnected.');
        return;
      }

      const snap = currentSnapshot || (window as any).__LAST_SNAPSHOT_REF__ || {
        campaignId: 'aethelgard-vault-001',
        commitSequence: 1,
      };

      const result = await onSubmitAction({
        actionId: `act-calib-${Date.now()}`,
        clientNonce: `nonce-calib-${Date.now()}`,
        actorId: isEffectiveDm ? 'dm-1' : (identity?.assignedCharacterId || 'dm-1'),
        actorRole: userRole,
        actionType: 'UPDATE_BATTLEMAP_STATE',
        snapshotRef: snap,
        payload: {
          mapId: mapDefinition.id,
          gridDimensions: {
            width: grid.width,
            height: grid.height,
            cellSizePx: grid.cellSizePx,
            originX: grid.originX || 0,
            originY: grid.originY || 0,
          },
          backgroundArtwork: {
            ...mapDefinition.backgroundArtwork,
            calibration: {
              isCalibrated: true,
              calibratedAtUtc: new Date().toISOString(),
              pitchPxPerCell: grid.cellSizePx,
              originOffsetX: grid.originX || 0,
              originOffsetY: grid.originY || 0,
              anchorPoint: calibrationPoint1 || undefined,
              referencePoint: calibrationPoint2 || undefined,
              measuredUnitCount: calibrationUnits,
              measuredAxis: calibrationAxis,
            },
          },
        },
        timestampUtc: new Date().toISOString(),
      });

      const receipt = result?.receipt;
      if (!receipt || receipt.status !== 'COMMITTED') {
        const status = receipt?.status || 'SUBMISSION_FAILED';
        const err = receipt?.error || 'Failed to commit calibration to authoritative game state.';
        let actionable = `Calibration rejected (${status}): ${err}`;
        if (status === 'REJECTED_STALE_SNAPSHOT') {
          actionable = 'Calibration rejected: Stale campaign snapshot. Please reload or refresh current game state.';
        } else if (status === 'REJECTED_UNAUTHORIZED_ROLE') {
          actionable = 'Calibration rejected: Dungeon Master authority required to save map calibration.';
        }
        setCanvasNotice(actionable);
        return;
      }

      // Success
      if (isBlob) {
        setCanvasNotice('Calibration saved to authoritative state. Warning: Local blob URL used. Persistent restart requires server asset.');
      } else {
        setCanvasNotice('Calibration durably saved to authoritative state.');
      }
      setTimeout(() => setCanvasNotice(null), 4000);
      setShowFineTuneHud(false);
      setCalibrationPoint1(null);
      setCalibrationPoint2(null);
      onSetActiveTool?.('token');
    } catch (err: any) {
      setCanvasNotice(`Calibration save failed: ${err?.message || 'Disconnected or network failure.'}`);
    } finally {
      setIsSavingCalibration(false);
    }
  };

  // Canvas Mouse Down
    const handleDispatchMove = async (
    entityId: string,
    targetX: number,
    targetY: number,
    entityType: 'character' | 'npc'
  ) => {
    if (!onMoveToken) return;
    try {
      const res: any = await onMoveToken(entityId, targetX, targetY, entityType);
      if (res && res.receipt) {
        if (
          res.receipt.status === 'REJECTED_VALIDATION_FAILURE' ||
          res.receipt.status === 'REJECTED_UNAUTHORIZED_ROLE' ||
          res.receipt.status === 'REJECTED_STALE_SNAPSHOT'
        ) {
          const reason =
            res.receipt.error ||
            res.receipt.rejectionReason ||
            'Movement rejected by Python authoritative rules.';
          setCanvasNotice(`Movement Rejected: ${reason}`);
          setTimeout(() => setCanvasNotice(null), 4500);
        }
      }
    } catch (err: any) {
      setCanvasNotice(`Movement Failed: ${err?.message || 'Server error'}`);
      setTimeout(() => setCanvasNotice(null), 4500);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click, Space+click, Shift+click, or 'pan' tool triggers viewport pan
    if (e.button === 1 || e.shiftKey || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
      return;
    }

    if (e.button !== 0) return; // Only primary button

    const coords = getMapCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (activeTool === 'fog_reveal') {
      const cells = getBrushCells(coords.gridX, coords.gridY, brushRadiusCells);
      onUpdateFog?.((prev) => manualRevealCells(prev, cells));
      setIsBrushingFog(true);
      return;
    }

    if (activeTool === 'fog_hide') {
      const cells = getBrushCells(coords.gridX, coords.gridY, brushRadiusCells);
      onUpdateFog?.((prev) => manualHideCells(prev, cells));
      setIsBrushingFog(true);
      return;
    }

    if (activeTool === 'fog_box_reveal' || activeTool === 'fog_box_hide') {
      setDrawStart({ gridX: coords.gridX, gridY: coords.gridY });
      setDrawCurrent({ gridX: coords.gridX, gridY: coords.gridY });
      return;
    }

    if (activeTool === 'calibrate') {
      if (!calibrationPoint1) {
        setCalibrationPoint1({ x: Math.round(coords.mapX), y: Math.round(coords.mapY) });
        setCanvasNotice('Point 1 set. Click Point 2 on another grid square along same axis (e.g. 10 squares away).');
      } else if (!calibrationPoint2) {
        setCalibrationPoint2({ x: Math.round(coords.mapX), y: Math.round(coords.mapY) });
        setShowCalibrationModal(true);
        setCanvasNotice('Point 2 set. Confirm grid distance in calibration modal.');
      }
      return;
    }

    if (activeTool === 'measure') {
      if (!measureStart) {
        setMeasureStart({ x: coords.gridX, y: coords.gridY });
        setMeasureCurrent({ x: coords.gridX, y: coords.gridY });
      } else {
        setMeasureStart(null);
        setMeasureCurrent(null);
      }
      return;
    }

    if (
      activeTool === 'room' ||
      activeTool === 'corridor' ||
      activeTool === 'wall' ||
      activeTool === 'railing' ||
      activeTool === 'terrain'
    ) {
      setDrawStart({ gridX: coords.gridX, gridY: coords.gridY });
      setDrawCurrent({ gridX: coords.gridX, gridY: coords.gridY });
      return;
    }

    if (activeTool === 'window') {
      const host = findHostWallForWindow(coords.gridX, coords.gridY, mapDefinition.geometry.walls, 1.2);
      if (!host) {
        setCanvasNotice('Windows must be placed on a valid wall segment. Snap near an existing wall.');
        setTimeout(() => setCanvasNotice(null), 3000);
        return;
      }
      const existingWin = (mapDefinition.geometry.windows || []).find(
        (w) => w.x === host.snappedX && w.y === host.snappedY
      );
      if (existingWin) {
        setCanvasNotice('A window already exists at this wall location.');
        setTimeout(() => setCanvasNotice(null), 3000);
        return;
      }
      const newWin: WindowSegment = {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: host.snappedX,
        y: host.snappedY,
        orientation: host.orientation,
        state: 'clear',
        blocksVisionWhenObscured: true,
        blocksMovement: true,
      };
      onAddWindow?.(newWin);
      setCanvasNotice('Clear Window placed. Sight passes; walking blocked.');
      setTimeout(() => setCanvasNotice(null), 2500);
      return;
    }

    if (activeTool === 'door') {
      // Find nearest wall to snap to
      const host = findHostWallForDoor(coords.gridX, coords.gridY, mapDefinition.geometry.walls, 1.2);
      if (!host) {
        setCanvasNotice('Doors must be placed on a valid wall segment. Snap near an existing wall.');
        setTimeout(() => setCanvasNotice(null), 3000);
        return;
      }

      // Check for duplicate door at this exact coordinate
      const existingDoor = mapDefinition.geometry.doors.find(
        (d) => d.x === host.snappedX && d.y === host.snappedY
      );
      if (existingDoor) {
        setCanvasNotice('A door already exists at this wall location.');
        setTimeout(() => setCanvasNotice(null), 3000);
        return;
      }

      const newDoor: DoorSegment = {
        id: `door-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: host.snappedX,
        y: host.snappedY,
        orientation: host.orientation,
        state: 'closed',
        blocksVisionWhenClosed: true,
      };
      onAddDoor?.(newDoor);
      setCanvasNotice(null);
      return;
    }


  if (activeTool === 'token') {
    // If user clicks on empty cell while an entity is selected, move it there
    if (selectedEntityId && !tokenDrag) {
      const char = characters.find((c) => c.id === selectedEntityId);
      const entityType = char ? 'character' : 'npc';
      handleDispatchMove(selectedEntityId, coords.gridX, coords.gridY, entityType);
    }
  }
  };



  // Global window-level mouse movement and mouse up listeners
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setViewport((prev) => ({
          ...prev,
          panX: e.clientX - panStart.x,
          panY: e.clientY - panStart.y,
        }));
        return;
      }

      const coords = getMapCoords(e.clientX, e.clientY);
      if (!coords) return;

      // Track hover coordinates for brush cursor preview and movement route preview
      setHoverGridCoords({ gridX: coords.gridX, gridY: coords.gridY });

      // Handle continuous fog brushing
      if (isBrushingFog) {
        const cells = getBrushCells(coords.gridX, coords.gridY, brushRadiusCells);
        if (activeTool === 'fog_reveal') {
          onUpdateFog?.((prev) => manualRevealCells(prev, cells));
        } else if (activeTool === 'fog_hide') {
          onUpdateFog?.((prev) => manualHideCells(prev, cells));
        }
        return;
      }

      // Handle token dragging
      if (tokenDrag) {
        const dist = Math.hypot(e.clientX - tokenDrag.startX, e.clientY - tokenDrag.startY);
        if (dist > 5) {
          setTokenDrag((prev) =>
            prev
              ? {
                  ...prev,
                  currentGridX: coords.gridX,
                  currentGridY: coords.gridY,
                  isDragging: true,
                }
              : null
          );
        }
        return;
      }

      if (activeTool === 'measure' && measureStart) {
        setMeasureCurrent({ x: coords.gridX, y: coords.gridY });
      }

      if (
        drawStart &&
        (activeTool === 'room' ||
          activeTool === 'corridor' ||
          activeTool === 'wall' ||
          activeTool === 'railing' ||
          activeTool === 'terrain' ||
          activeTool === 'fog_box_reveal' ||
          activeTool === 'fog_box_hide')
      ) {
        setDrawCurrent({ gridX: coords.gridX, gridY: coords.gridY });
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      // Finish fog brushing
      if (isBrushingFog) {
        setIsBrushingFog(false);
        return;
      }

      // Handle token drag release
      if (tokenDrag) {
        if (tokenDrag.isDragging) {
          const coords = getMapCoords(e.clientX, e.clientY);
          if (coords) {
            handleDispatchMove(tokenDrag.entityId, coords.gridX, coords.gridY, tokenDrag.entityType);
          }
        }
        setTokenDrag(null);
        return;
      }

      // Handle box fog reveal / hide completion
      if (drawStart && drawCurrent && (activeTool === 'fog_box_reveal' || activeTool === 'fog_box_hide')) {
        const minX = Math.min(drawStart.gridX, drawCurrent.gridX);
        const maxX = Math.max(drawStart.gridX, drawCurrent.gridX);
        const minY = Math.min(drawStart.gridY, drawCurrent.gridY);
        const maxY = Math.max(drawStart.gridY, drawCurrent.gridY);
        const boxCells: string[] = [];
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            boxCells.push(`${x},${y}`);
          }
        }

        if (activeTool === 'fog_box_reveal') {
          onUpdateFog?.((prev) => manualRevealCells(prev, boxCells));
        } else {
          onUpdateFog?.((prev) => manualHideCells(prev, boxCells));
        }

        setDrawStart(null);
        setDrawCurrent(null);
        return;
      }

      // Handle geometry completion
      if (drawStart && drawCurrent) {
        const coords = getMapCoords(e.clientX, e.clientY) || {
          gridX: drawCurrent.gridX,
          gridY: drawCurrent.gridY,
        };

        if (activeTool === 'room') {
          const x1 = Math.min(drawStart.gridX, coords.gridX);
          const y1 = Math.min(drawStart.gridY, coords.gridY);
          const x2 = Math.max(drawStart.gridX, coords.gridX);
          const y2 = Math.max(drawStart.gridY, coords.gridY);
          const width = x2 - x1;
          const height = y2 - y1;

          if (width >= 1 && height >= 1) {
            const roomNum = (mapDefinition.geometry.rooms.length || 0) + 1;
            const newRoom: RectangularRoom = {
              id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: `Chamber ${roomNum}`,
              x: x1,
              y: y1,
              width,
              height,
              floorType: 'stone',
            };
            onAddRoom?.(newRoom);
          }
        } else if (activeTool === 'corridor') {
          if (isValidCorridor(drawStart.gridX, drawStart.gridY, coords.gridX, coords.gridY)) {
            const newCorridor: CorridorSegment = {
              id: `corridor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              startX: drawStart.gridX,
              startY: drawStart.gridY,
              endX: coords.gridX,
              endY: coords.gridY,
              widthCells: corridorWidthCells,
              floorType: 'stone',
            };
            onAddCorridor?.(newCorridor);
          }
        } else if (activeTool === 'wall') {
          if (drawStart.gridX !== coords.gridX || drawStart.gridY !== coords.gridY) {
            const newWall: WallSegment = {
              id: `wall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              x1: drawStart.gridX,
              y1: drawStart.gridY,
              x2: coords.gridX,
              y2: coords.gridY,
              blocksMovement: true,
              blocksVision: true,
              thickness: 4,
            };
            onAddWall?.(newWall);
          }
        } else if (activeTool === 'railing') {
          if (drawStart.gridX !== coords.gridX || drawStart.gridY !== coords.gridY) {
            const newRailing: RailingSegment = {
              id: `rail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              x1: drawStart.gridX,
              y1: drawStart.gridY,
              x2: coords.gridX,
              y2: coords.gridY,
              movementType: 'blocking',
              blocksVision: false,
              blocksMovement: true,
              name: 'Balustrade / Railing',
            };
            onAddRailing?.(newRailing);
          }
        } else if (activeTool === 'terrain') {
          const x1 = Math.min(drawStart.gridX, coords.gridX);
          const y1 = Math.min(drawStart.gridY, coords.gridY);
          const x2 = Math.max(drawStart.gridX, coords.gridX);
          const y2 = Math.max(drawStart.gridY, coords.gridY);
          const width = x2 - x1;
          const height = y2 - y1;
          if (width >= 1 && height >= 1) {
            const newTerrain: TerrainZone = {
              id: `terrain-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: 'Difficult Terrain',
              x: x1,
              y: y1,
              width,
              height,
              terrainType: 'rubble',
              movementCostMultiplier: 2.0,
              blocksVision: false,
              isVisibleToPlayers: true,
            };
            onAddTerrain?.(newTerrain);
          }
        }
      }

      setDrawStart(null);
      setDrawCurrent(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    isPanning,
    panStart,
    drawStart,
    drawCurrent,
    tokenDrag,
    isBrushingFog,
    activeTool,
    brushRadiusCells,
    corridorWidthCells,
    grid,
    getMapCoords,
    getBrushCells,
    mapDefinition,
    onAddRoom,
    onAddCorridor,
    onAddWall,
    onMoveToken,
    onUpdateFog,
  ]);

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
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        onDeleteGeometry?.(selectedGeometry);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGeometry, onDeleteGeometry]);

  // Resolve effective blocking line segments factoring in door, window, railing, and terrain states
  const effectiveSegments = useMemo(
    () =>
      resolveEffectiveBlockingSegments(
        mapDefinition.geometry.walls,
        mapDefinition.geometry.doors,
        mapDefinition.geometry.windows || [],
        mapDefinition.geometry.railings || [],
        mapDefinition.geometry.terrain || []
      ),
    [
      mapDefinition.geometry.walls,
      mapDefinition.geometry.doors,
      mapDefinition.geometry.windows,
      mapDefinition.geometry.railings,
      mapDefinition.geometry.terrain,
    ]
  );

  // Effective DM perspective (false if Player role OR if DM enabled Player Fog Preview)
  const isEffectiveDm = identity
    ? canAccessDmWorkspaces(identity) && !mapDefinition.fog.previewPlayerFog
    : (userRole === 'dm_host' || (userRole as string) === 'dm') && !mapDefinition.fog.previewPlayerFog;

  // Compute vision sources for player characters
  const visionSources: VisionSource[] = useMemo(() => {
    const defaultRadiusCells = Math.round(
      (mapDefinition.lineOfSight.defaultSightRadiusFeet || 60) / (grid.feetPerCell || 5)
    );
    const sources: VisionSource[] = [];

    // Party Shared Vision: all characters provide vision
    // If partySharedVision is false, only selectedCharacterId provides vision
    const activeChars =
      mapDefinition.fog.partySharedVision === false && selectedEntityId
        ? characters.filter((c) => c.id === selectedEntityId)
        : characters;

    for (const char of activeChars) {
      // Find position in grid cells
      const charPos = resolveTokenPosition(char.token);
      const charX = charPos.cellX;
      const charY = charPos.cellY;
      sources.push({
        id: char.id,
        name: char.name,
        x: charX,
        y: charY,
        sightRadiusCells: defaultRadiusCells,
        entityType: 'character',
        isVisibleToPlayers: true,
      });
    }

    return sources;
  }, [
    characters,
    mapDefinition.fog.partySharedVision,
    selectedEntityId,
    grid.width,
    grid.height,
    grid.feetPerCell,
    mapDefinition.lineOfSight.defaultSightRadiusFeet,
  ]);

  // Compute currently visible grid cells based on vision sources and vision-blocking segments
  const currentlyVisibleCells = useMemo<Set<string>>(() => {
    if (!mapDefinition.fog.enabled) {
      return new Set<string>();
    }
    if (mapDefinition.fog.autoComputeTokenLos === false) {
      return new Set<string>();
    }
    return computeVisibleGridCells(visionSources, effectiveSegments, grid.width, grid.height);
  }, [
    mapDefinition.fog.enabled,
    mapDefinition.fog.autoComputeTokenLos,
    visionSources,
    effectiveSegments,
    grid.width,
    grid.height,
  ]);

  // Helpers to determine whether cells and geometry are revealed/explored under active Fog of War
  const isCellExploredOrVisible = useCallback(
    (cx: number, cy: number): boolean => {
      if (isEffectiveDm || !mapDefinition.fog.enabled) return true;
      const state = resolveCellVisibility(cx, cy, mapDefinition.fog, currentlyVisibleCells);
      return state === 'explored' || state === 'visible';
    },
    [isEffectiveDm, mapDefinition.fog, currentlyVisibleCells]
  );

  const isRoomDiscovered = useCallback(
    (r: RectangularRoom): boolean => {
      if (isEffectiveDm || !mapDefinition.fog.enabled) return true;
      for (let cy = r.y; cy < r.y + r.height; cy++) {
        for (let cx = r.x; cx < r.x + r.width; cx++) {
          if (isCellExploredOrVisible(cx, cy)) return true;
        }
      }
      return false;
    },
    [isEffectiveDm, mapDefinition.fog.enabled, isCellExploredOrVisible]
  );

  const isCorridorDiscovered = useCallback(
    (c: CorridorSegment): boolean => {
      if (isEffectiveDm || !mapDefinition.fog.enabled) return true;
      const segments = computeCorridorSegments(
        c.startX,
        c.startY,
        c.endX,
        c.endY,
        c.widthCells || corridorWidthCells
      );
      return segments.some((seg) => {
        for (let cy = seg.y; cy < seg.y + seg.height; cy++) {
          for (let cx = seg.x; cx < seg.x + seg.width; cx++) {
            if (isCellExploredOrVisible(cx, cy)) return true;
          }
        }
        return false;
      });
    },
    [isEffectiveDm, mapDefinition.fog.enabled, isCellExploredOrVisible, corridorWidthCells]
  );

  const isTerrainDiscovered = useCallback(
    (tz: TerrainZone): boolean => {
      if (isEffectiveDm) return true;
      if (tz.isVisibleToPlayers === false) return false;
      if (!mapDefinition.fog.enabled) return true;
      for (let cy = tz.y; cy < tz.y + tz.height; cy++) {
        for (let cx = tz.x; cx < tz.x + tz.width; cx++) {
          if (isCellExploredOrVisible(cx, cy)) return true;
        }
      }
      return false;
    },
    [isEffectiveDm, mapDefinition.fog.enabled, isCellExploredOrVisible]
  );

  // Automatically accumulate newly visible cells into exploredCells
  useEffect(() => {
    if (!mapDefinition.fog.enabled || mapDefinition.fog.autoComputeTokenLos === false) return;
    if (currentlyVisibleCells.size === 0) return;

    const exploredSet = new Set(mapDefinition.fog.exploredCells || []);
    let newlyDiscovered = false;
    for (const cellKey of currentlyVisibleCells) {
      if (!exploredSet.has(cellKey)) {
        exploredSet.add(cellKey);
        newlyDiscovered = true;
      }
    }
    if (newlyDiscovered) {
      onUpdateFog?.((prev) => ({
        ...prev,
        exploredCells: Array.from(exploredSet),
      }));
    }
  }, [
    currentlyVisibleCells,
    mapDefinition.fog.enabled,
    mapDefinition.fog.autoComputeTokenLos,
    mapDefinition.fog.exploredCells,
    onUpdateFog,
  ]);

  // Filter NPCs specific to this active map scene
  const sceneNpcs = npcs.filter((npc) => {
    if ((npc.token as any).placed === false) return false;
    // Check if explicitly placed on this map
    const onMap = mapDefinition.tokens.some((t) => t.entityId === npc.id);
    // Or belongs to this location
    const atLocation = npc.currentLocationId === mapDefinition.locationId;
    return onMap || atLocation || ((npc.token as any).placed === true && (npc.token as any).sceneId === mapDefinition.id);
  });

  // Observable DEMO-ONLY Intent Queue (AIUI-CP002C1-R2)
  const [demoIntentQueue, setDemoIntentQueue] = useState<
    Array<{ id: string; type: 'door' | 'movement'; description: string; timestamp: string }>
  >([]);
  const [showDemoQueueModal, setShowDemoQueueModal] = useState(false);

  // Security Hardened Context Menu Handler (AIUI-CP002C1-R2)
  // Evaluates actual player visibility across all geometry & token targets.
  // Suppresses all target identification, metadata, and hit testing for concealed objects.
  const handleContextMenu = (
    e: React.MouseEvent,
    targetType: 'blank' | 'room' | 'corridor' | 'wall' | 'door' | 'window' | 'railing' | 'terrain' | 'token' = 'blank',
    targetId?: string,
    extraData?: any
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const coords = getMapCoords(e.clientX, e.clientY);
    const gridX = coords ? coords.gridX : 0;
    const gridY = coords ? coords.gridY : 0;

    let resolvedType = targetType;
    let resolvedId = targetId;
    let resolvedData = extraData;

    // Security boundary: Players / Player-Preview must NEVER discover or inspect hidden entities/geometry
    if (!isEffectiveDm) {
      const cellIsExplored = isCellExploredOrVisible(gridX, gridY);

      if (!cellIsExplored) {
        // Complete pitch-black unexplored area: completely suppress all geometry, token, and target data
        resolvedType = 'blank';
        resolvedId = undefined;
        resolvedData = { isUnexplored: true };
      } else {
        // Cell is explored or visible; check target-specific permissions
        if (targetType === 'token') {
          const isNpc = extraData?.entityType === 'npc';
          if (isNpc) {
            const npc = extraData?.npc as (NonPlayerCharacter | PlayerSafeNpc) | undefined;
            const npcPos = resolveTokenPosition(npc?.token);
            const isVis = npc
              ? isEntityVisibleOnBattlemap(
                  npcPos.cellX,
                  npcPos.cellY,
                  npc.token.isVisibleToPlayers,
                  false,
                  mapDefinition.fog,
                  currentlyVisibleCells
                )
              : false;
            if (!isVis) {
              resolvedType = 'blank';
              resolvedId = undefined;
              resolvedData = undefined;
            }
          }
        } else if (targetType === 'door') {
          const d = extraData?.door as DoorSegment | undefined;
          if (d && !isCellExploredOrVisible(d.x, d.y)) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        } else if (targetType === 'window') {
          const w = extraData?.window as WindowSegment | undefined;
          if (w && !isCellExploredOrVisible(w.x, w.y)) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        } else if (targetType === 'room') {
          const r = extraData?.room as RectangularRoom | undefined;
          if (r && !isRoomDiscovered(r)) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        } else if (targetType === 'corridor') {
          const c = extraData?.corridor as CorridorSegment | undefined;
          if (c && !isCorridorDiscovered(c)) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        } else if (targetType === 'railing') {
          const rail = extraData?.railing as RailingSegment | undefined;
          if (rail && !isCellExploredOrVisible(rail.x1, rail.y1) && !isCellExploredOrVisible(rail.x2, rail.y2)) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        } else if (targetType === 'terrain') {
          const tz = extraData?.terrain as TerrainZone | undefined;
          if (tz && (tz.isVisibleToPlayers === false || !isTerrainDiscovered(tz))) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        } else if (targetType === 'wall') {
          const seg = extraData?.segment as WallSegment | undefined;
          if (seg && !isCellExploredOrVisible(seg.x1, seg.y1) && !isCellExploredOrVisible(seg.x2, seg.y2)) {
            resolvedType = 'blank';
            resolvedId = undefined;
            resolvedData = undefined;
          }
        }
      }
    }

    const menuWidth = 240;
    const menuHeight = 360;
    const clientX = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const clientY = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenu({
      isOpen: true,
      clientX,
      clientY,
      targetType: resolvedType,
      targetId: resolvedId,
      gridX,
      gridY,
      data: resolvedData,
    });
  };

  return (
    <div
      ref={containerRef}
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
          {mapDefinition.fog.previewPlayerFog && (
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-600 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3 text-amber-400" />
              <span>Player View Preview</span>
            </span>
          )}
          {activeTool !== 'token' && (
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono text-[10px] uppercase font-bold tracking-wider">
              Tool: {activeTool.replace('_', ' ')}
            </span>
          )}
          {mapDefinition.fog.enabled && (
            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[10px] hidden md:inline">
              Fog: Active ({mapDefinition.fog.autoComputeTokenLos !== false ? 'Dynamic LOS' : 'Manual'})
            </span>
          )}
          {demoIntentQueue.length > 0 && (
            <button
              onClick={() => setShowDemoQueueModal(true)}
              className="px-2 py-0.5 rounded bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-600/70 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow"
              title="View in-memory DEMO-ONLY request queue"
            >
              <Info className="w-3 h-3 text-amber-400" />
              <span>[DEMO-ONLY Queue: {demoIntentQueue.length}]</span>
            </button>
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

      {/* Ephemeral Notice Toast */}
      {canvasNotice && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 bg-amber-950/95 border border-amber-600 px-3 py-1.5 rounded shadow-2xl text-amber-200 text-xs flex items-center gap-2 font-mono animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{canvasNotice}</span>
        </div>
      )}

      {/* Main Canvas Scrollable / Pan Container */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          cursor:
            isPanning || activeTool === 'pan'
              ? 'grab'
              : activeTool === 'measure'
              ? 'crosshair'
              : activeTool === 'room' || activeTool === 'corridor' || activeTool === 'wall'
              ? 'crosshair'
              : activeTool === 'door'
              ? 'cell'
              : 'default',
        }}
        className="relative flex-1 overflow-hidden flex items-center justify-center bg-[#090b0e] p-6"
      >
        {/* Transform Surface Wrapper (Zero-Crop natural dimension plane) */}
        <div
          ref={surfaceRef}
          style={{
            width: `${surfaceWidthPx}px`,
            height: `${surfaceHeightPx}px`,
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center center',
          }}
          className="relative transition-transform duration-75 shadow-2xl rounded border border-neutral-800 bg-[#101317]"
          onContextMenu={(e) => handleContextMenu(e, 'blank')}
        >
          {/* ============================================================ */}
          {/* LAYER 1: Background Artwork (100% Unclipped Natural Plane)   */}
          {/* ============================================================ */}
          {layerVisibility.artwork && (resolvedArtworkUrl || mapDefinition.backgroundArtwork?.url) && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{
                opacity: mapDefinition.backgroundArtwork?.opacity ?? 0.7,
              }}
            >
              {resolvedArtworkUrl ? (
                <img
                  src={resolvedArtworkUrl}
                  alt={mapDefinition.backgroundArtwork?.name || 'Map Artwork'}
                  onLoad={handleImageLoad}
                  style={{
                    width: naturalWidth > 0 ? `${naturalWidth}px` : '100%',
                    height: naturalHeight > 0 ? `${naturalHeight}px` : '100%',
                    transform: `scale(${mapDefinition.backgroundArtwork?.scale ?? 1.0}) translate(${
                      mapDefinition.backgroundArtwork?.offsetX ?? 0
                    }px, ${mapDefinition.backgroundArtwork?.offsetY ?? 0}px)`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'contain',
                  }}
                  className="select-none pointer-events-none"
                  draggable={false}
                />
              ) : null}
            </div>
          )}

          {/* Loading Indicator for Authenticated Map Asset */}
          {layerVisibility.artwork && isArtworkLoading && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 text-amber-300 text-xs gap-2 z-10">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading secure battlemap artwork...</span>
            </div>
          )}

          {/* Access Restricted / Asset Error Overlay */}
          {layerVisibility.artwork && artworkError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-neutral-950/70 text-neutral-300 p-6 text-center z-10">
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700 max-w-sm flex flex-col items-center gap-2 shadow-2xl">
                <Shield className="w-8 h-8 text-amber-500" />
                <span className="font-semibold text-amber-200">
                  {artworkError.includes('403') || artworkError.includes('restricted')
                    ? 'DM-Only Battlemap Layer'
                    : 'Map Artwork Unavailable'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {artworkError.includes('403') || artworkError.includes('restricted')
                    ? 'This map artwork contains Dungeon Master secrets and is restricted to the DM role.'
                    : artworkError}
                </span>
              </div>
            </div>
          )}

          {/* Fallback pattern if no background artwork or hidden */}
          {(!resolvedArtworkUrl || !layerVisibility.artwork) && !isArtworkLoading && (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          )}

          {/* ============================================================ */}
          {/* LAYER 2: Room, Corridor Floors & Difficult Terrain Zones     */}
          {/* ============================================================ */}
          {layerVisibility.geometry && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Properly Bounded Corridors (Section 3: No diagonal bounding boxes) */}
              {mapDefinition.geometry.corridors.map((c) => {
                if (!isEffectiveDm && !isCorridorDiscovered(c)) {
                  return null;
                }
                const isSelected = selectedGeometry?.type === 'corridor' && selectedGeometry?.id === c.id;
                const segments = computeCorridorSegments(
                  c.startX,
                  c.startY,
                  c.endX,
                  c.endY,
                  c.widthCells || corridorWidthCells
                );
                const style = getFloorStyle(c.floorType || 'stone');

                return (
                  <React.Fragment key={c.id}>
                    {segments.map((seg, idx) => (
                      <div
                        key={`${c.id}-seg-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeTool === 'select') {
                            onSelectGeometry?.({ type: 'corridor', id: c.id });
                          }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, 'corridor', c.id, { corridor: c })}
                        style={{
                          left: `${seg.x * grid.cellSizePx}px`,
                          top: `${seg.y * grid.cellSizePx}px`,
                          width: `${seg.width * grid.cellSizePx}px`,
                          height: `${seg.height * grid.cellSizePx}px`,
                          ...style,
                        }}
                        className={`absolute rounded border pointer-events-auto cursor-pointer transition-shadow ${
                          isSelected ? 'ring-2 ring-amber-400 shadow-lg z-10' : 'opacity-90'
                        }`}
                        title={isEffectiveDm ? `Corridor (${(c.widthCells || 2) * 5}ft width)` : undefined}
                      />
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Rectangular Rooms */}
              {mapDefinition.geometry.rooms.map((r) => {
                if (!isEffectiveDm && !isRoomDiscovered(r)) {
                  return null;
                }
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
                    onContextMenu={(e) => handleContextMenu(e, 'room', r.id, { room: r })}
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
                    <div className="flex items-center justify-between pointer-events-none">
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

              {/* Difficult Terrain Zones */}
              {(mapDefinition.geometry.terrain || []).map((tz) => {
                if (!isEffectiveDm && (tz.isVisibleToPlayers === false || !isTerrainDiscovered(tz))) {
                  return null;
                }
                const isSelected = selectedGeometry?.type === 'terrain' && selectedGeometry?.id === tz.id;
                const leftPx = tz.x * grid.cellSizePx;
                const topPx = tz.y * grid.cellSizePx;
                const widthPx = tz.width * grid.cellSizePx;
                const heightPx = tz.height * grid.cellSizePx;

                let colorClasses = 'bg-stone-900/60 border-stone-600/60 text-stone-300';
                if (tz.terrainType === 'mud') colorClasses = 'bg-yellow-950/40 border-yellow-700/60 text-yellow-200';
                if (
                  tz.terrainType === 'shallow_water' ||
                  tz.terrainType === 'deep_water' ||
                  (tz.terrainType as string) === 'water'
                ) {
                  colorClasses = 'bg-cyan-950/40 border-cyan-600/60 text-cyan-200';
                }
                if (tz.terrainType === 'undergrowth') colorClasses = 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200';
                if (tz.terrainType === 'ice') colorClasses = 'bg-sky-950/40 border-sky-400/60 text-sky-100';
                if (tz.terrainType === 'rubble') colorClasses = 'bg-amber-950/30 border-amber-600/60 text-amber-200';

                return (
                  <div
                    key={tz.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSelectGeometry?.({ type: 'terrain', id: tz.id });
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, 'terrain', tz.id, { terrain: tz })}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                    }}
                    className={`absolute rounded border border-dashed pointer-events-auto cursor-pointer transition-all flex flex-col justify-between p-1 select-none ${colorClasses} ${
                      isSelected ? 'ring-2 ring-amber-400 z-10' : 'opacity-85 hover:opacity-100'
                    }`}
                    title={`${tz.name} (${tz.terrainType}, Cost: ${tz.movementCostMultiplier}x, LOS Block: ${tz.blocksVision ? 'Yes' : 'No'})`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <span className="text-[9px] font-mono font-bold bg-neutral-950/80 px-1 py-0.5 rounded truncate max-w-[120px]">
                        {tz.name}
                      </span>
                      <span className="text-[9px] font-mono bg-neutral-950/80 px-1 py-0.5 rounded font-bold text-amber-300">
                        {tz.movementCostMultiplier}x
                      </span>
                    </div>
                    {tz.blocksVision && (
                      <span className="text-[8px] font-mono text-rose-300 bg-neutral-950/80 px-1 rounded self-start pointer-events-none">
                        LOS Block
                      </span>
                    )}
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
          {/* LAYER 4: Walls and Doors (Section 4: Topology Split)         */}
          {/* ============================================================ */}
          {layerVisibility.walls && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 15 }}
            >
              {/* Effective Wall Segments (Doorway openings are not blocked when open) */}
              {effectiveSegments.map((seg) => {
                if (!isEffectiveDm && !isCellExploredOrVisible(seg.x1, seg.y1) && !isCellExploredOrVisible(seg.x2, seg.y2)) {
                  return null;
                }
                const isSelected =
                  (selectedGeometry?.type === 'wall' && selectedGeometry?.id === seg.sourceId) ||
                  (selectedGeometry?.type === 'door' && selectedGeometry?.id === seg.sourceId);

                const x1 = seg.x1 * grid.cellSizePx + (grid.originX || 0);
                const y1 = seg.y1 * grid.cellSizePx + (grid.originY || 0);
                const x2 = seg.x2 * grid.cellSizePx + (grid.originX || 0);
                const y2 = seg.y2 * grid.cellSizePx + (grid.originY || 0);

                if (seg.sourceType === 'door') {
                  // Doorway segment: if open, do not render solid wall line
                  if (!seg.blocksVision) return null;
                }

                return (
                  <g
                    key={seg.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSelectGeometry?.({ type: seg.sourceType, id: seg.sourceId });
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, seg.sourceType as any, seg.sourceId, { segment: seg })}
                  >
                    {/* Transparent hover/hit zone */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={14}
                      strokeLinecap="round"
                    />
                    {/* Rendered wall line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSelected ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth={isSelected ? 6 : 4}
                      strokeLinecap="round"
                      strokeDasharray={seg.blocksVision ? undefined : '6 4'}
                    />
                    <circle cx={x1} cy={y1} r={3} fill={isSelected ? '#f59e0b' : '#94a3b8'} />
                    <circle cx={x2} cy={y2} r={3} fill={isSelected ? '#f59e0b' : '#94a3b8'} />
                  </g>
                );
              })}

              {/* Railings & Low Barriers */}
              {(mapDefinition.geometry.railings || []).map((rail) => {
                if (!isEffectiveDm && !isCellExploredOrVisible(rail.x1, rail.y1) && !isCellExploredOrVisible(rail.x2, rail.y2)) {
                  return null;
                }
                const isSelected = selectedGeometry?.type === 'railing' && selectedGeometry?.id === rail.id;
                const x1 = rail.x1 * grid.cellSizePx + (grid.originX || 0);
                const y1 = rail.y1 * grid.cellSizePx + (grid.originY || 0);
                const x2 = rail.x2 * grid.cellSizePx + (grid.originX || 0);
                const y2 = rail.y2 * grid.cellSizePx + (grid.originY || 0);

                return (
                  <g
                    key={rail.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        onSelectGeometry?.({ type: 'railing', id: rail.id });
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, 'railing', rail.id, { railing: rail })}
                  >
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} strokeLinecap="round" />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                      strokeWidth={isSelected ? 5 : 3}
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                    />
                    <circle cx={x1} cy={y1} r={3.5} fill={isSelected ? '#f59e0b' : '#38bdf8'} stroke="#0f172a" strokeWidth="1" />
                    <circle cx={x2} cy={y2} r={3.5} fill={isSelected ? '#f59e0b' : '#38bdf8'} stroke="#0f172a" strokeWidth="1" />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Interactive Doors Overlay */}
          {layerVisibility.walls && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 16 }}>
              {mapDefinition.geometry.doors.map((d) => {
                if (!isEffectiveDm && !isCellExploredOrVisible(d.x, d.y)) {
                  return null;
                }
                const isSelected = selectedGeometry?.type === 'door' && selectedGeometry?.id === d.id;
                const leftPx = d.x * grid.cellSizePx + (grid.originX || 0);
                const topPx = d.y * grid.cellSizePx + (grid.originY || 0);
                const isHorizontal = d.orientation === 'horizontal';

                const handleDoorClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (activeTool === 'select') {
                    onSelectGeometry?.({ type: 'door', id: d.id });
                  } else if (isEffectiveDm) {
                    const nextState =
                      d.state === 'closed' ? 'open' : d.state === 'open' ? 'locked' : 'closed';
                    onUpdateDoorState?.(d.id, nextState);
                  } else {
                    // Player interaction intent: cannot directly mutate world state
                    setPendingDoorRequest({
                      doorId: d.id,
                      door: d,
                      action: d.state === 'closed' ? 'open' : 'close',
                    });
                  }
                };

                return (
                  <div
                    key={d.id}
                    onClick={handleDoorClick}
                    onContextMenu={(e) => handleContextMenu(e, 'door', d.id, { door: d })}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: isHorizontal ? `${grid.cellSizePx}px` : '12px',
                      height: isHorizontal ? '12px' : `${grid.cellSizePx}px`,
                      transform: isHorizontal ? 'translate(0, -6px)' : 'translate(-6px, 0)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer rounded flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-amber-400 z-10' : ''
                    } ${
                      d.state === 'locked'
                        ? 'bg-rose-900 border border-rose-500 shadow-md shadow-rose-950'
                        : d.state === 'closed'
                        ? 'bg-amber-800 border border-amber-500 shadow-md shadow-amber-950'
                        : 'bg-emerald-950/40 border border-dashed border-emerald-400 opacity-90'
                    }`}
                    title={`Door: ${d.state} (${isEffectiveDm ? 'Click to toggle' : 'Click to request interaction'})`}
                  >
                    {d.state === 'locked' && <Lock className="w-2.5 h-2.5 text-rose-200" />}
                    {d.state === 'closed' && <DoorClosed className="w-2.5 h-2.5 text-amber-200" />}
                    {d.state === 'open' && <DoorOpen className="w-2.5 h-2.5 text-emerald-300" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive Windows Overlay */}
          {layerVisibility.walls && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 16 }}>
              {(mapDefinition.geometry.windows || []).map((w) => {
                if (!isEffectiveDm && !isCellExploredOrVisible(w.x, w.y)) {
                  return null;
                }
                const isSelected = selectedGeometry?.type === 'window' && selectedGeometry?.id === w.id;
                const leftPx = w.x * grid.cellSizePx + (grid.originX || 0);
                const topPx = w.y * grid.cellSizePx + (grid.originY || 0);
                const isHorizontal = w.orientation === 'horizontal';

                const handleWindowClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (activeTool === 'select') {
                    onSelectGeometry?.({ type: 'window', id: w.id });
                  } else if (isEffectiveDm) {
                    const nextState =
                      w.state === 'clear' ? 'obscured' : w.state === 'obscured' ? 'broken' : 'clear';
                    onUpdateWindowState?.(w.id, nextState);
                  }
                };

                return (
                  <div
                    key={w.id}
                    onClick={handleWindowClick}
                    onContextMenu={(e) => handleContextMenu(e, 'window', w.id, { window: w })}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: isHorizontal ? `${grid.cellSizePx}px` : '12px',
                      height: isHorizontal ? '12px' : `${grid.cellSizePx}px`,
                      transform: isHorizontal ? 'translate(0, -6px)' : 'translate(-6px, 0)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer rounded flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-amber-400 z-10' : ''
                    } ${
                      w.state === 'obscured'
                        ? 'bg-amber-950/90 border border-amber-600 shadow-md text-amber-300'
                        : w.state === 'broken'
                        ? 'bg-neutral-800/80 border border-dashed border-sky-400/80 shadow text-sky-300'
                        : 'bg-sky-500/25 border border-sky-400 shadow-sm text-sky-200'
                    }`}
                    title={`Window: ${w.state} (${w.state === 'clear' ? 'Allows LOS, blocks walking' : w.state === 'obscured' ? 'Blocks LOS & walking' : 'Broken aperture, allows LOS'})`}
                  >
                    <AppWindow className="w-2.5 h-2.5" />
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* LAYER 5: 3-State Fog of War & Line of Sight Layer            */}
          {/* ============================================================ */}
          {layerVisibility.fog && mapDefinition.fog.enabled && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={surfaceWidthPx}
              height={surfaceHeightPx}
              style={{ zIndex: 18 }}
            >
              <defs>
                {/* DM Pattern: Diagonal purple hatch for unexplored cells */}
                <pattern
                  id="dm-unexplored-hatch"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.5" />
                </pattern>
                {/* DM Pattern: Faint blue hatch for explored cells */}
                <pattern
                  id="dm-explored-hatch"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-45)"
                >
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Render each grid cell based on its 3-state visibility */}
              {Array.from({ length: grid.height }).map((_, cy) =>
                Array.from({ length: grid.width }).map((_, cx) => {
                  const state = resolveCellVisibility(cx, cy, mapDefinition.fog, currentlyVisibleCells);
                  const cellLeft = cx * grid.cellSizePx + (grid.originX || 0);
                  const cellTop = cy * grid.cellSizePx + (grid.originY || 0);

                  // 1. CURRENTLY VISIBLE
                  if (state === 'visible') {
                    if (isEffectiveDm) {
                      // Faint amber boundary so DM sees what players currently see
                      return (
                        <rect
                          key={`fog-${cx}-${cy}`}
                          x={cellLeft}
                          y={cellTop}
                          width={grid.cellSizePx}
                          height={grid.cellSizePx}
                          fill="none"
                          stroke="rgba(245, 158, 11, 0.12)"
                          strokeWidth="0.5"
                        />
                      );
                    }
                    return null; // Crystal clear for players
                  }

                  // 2. EXPLORED BUT NOT CURRENTLY VISIBLE (Darkened Memory)
                  if (state === 'explored') {
                    if (isEffectiveDm) {
                      return (
                        <g key={`fog-${cx}-${cy}`}>
                          <rect
                            x={cellLeft}
                            y={cellTop}
                            width={grid.cellSizePx}
                            height={grid.cellSizePx}
                            fill="rgba(15, 23, 42, 0.35)"
                          />
                          <rect
                            x={cellLeft}
                            y={cellTop}
                            width={grid.cellSizePx}
                            height={grid.cellSizePx}
                            fill="url(#dm-explored-hatch)"
                          />
                        </g>
                      );
                    }
                    // Player view: darkened terrain shroud
                    return (
                      <rect
                        key={`fog-${cx}-${cy}`}
                        x={cellLeft}
                        y={cellTop}
                        width={grid.cellSizePx}
                        height={grid.cellSizePx}
                        fill="rgba(8, 10, 16, 0.78)"
                      />
                    );
                  }

                  // 3. UNEXPLORED (Concealed from players)
                  if (isEffectiveDm) {
                    return (
                      <g key={`fog-${cx}-${cy}`}>
                        <rect
                          x={cellLeft}
                          y={cellTop}
                          width={grid.cellSizePx}
                          height={grid.cellSizePx}
                          fill="rgba(10, 10, 15, 0.65)"
                        />
                        <rect
                          x={cellLeft}
                          y={cellTop}
                          width={grid.cellSizePx}
                          height={grid.cellSizePx}
                          fill="url(#dm-unexplored-hatch)"
                        />
                        <rect
                          x={cellLeft}
                          y={cellTop}
                          width={grid.cellSizePx}
                          height={grid.cellSizePx}
                          fill="none"
                          stroke="rgba(168, 85, 247, 0.15)"
                          strokeWidth="0.5"
                        />
                      </g>
                    );
                  }

                  // Player view: complete pitch black concealment
                  return (
                    <rect
                      key={`fog-${cx}-${cy}`}
                      x={cellLeft}
                      y={cellTop}
                      width={grid.cellSizePx}
                      height={grid.cellSizePx}
                      fill="#08080a"
                    />
                  );
                })
              )}
            </svg>
          )}

          {/* ============================================================ */}
          {/* LAYER 5.5: Server-Projected Movement Paths (SP-03)           */}
          {/* ============================================================ */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 19 }}>
            {characters.map((c) => {
              const path = (c.token as any)?.committedPath as Array<{ x: number; y: number }> | undefined;
              if (!path || path.length < 2) return null;
              const pointsStr = path
                .map((pt) => {
                  const px = (pt.x + 0.5) * grid.cellSizePx + (grid.originX || 0);
                  const py = (pt.y + 0.5) * grid.cellSizePx + (grid.originY || 0);
                  return `${px},${py}`;
                })
                .join(' ');
              return (
                <g key={`path-${c.id}`}>
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                  {path.map((pt, idx) => {
                    const cx = (pt.x + 0.5) * grid.cellSizePx + (grid.originX || 0);
                    const cy = (pt.y + 0.5) * grid.cellSizePx + (grid.originY || 0);
                    return (
                      <circle
                        key={`pt-${c.id}-${idx}`}
                        cx={cx}
                        cy={cy}
                        r={idx === 0 || idx === path.length - 1 ? 4 : 2}
                        fill={idx === path.length - 1 ? '#22c55e' : '#06b6d4'}
                      />
                    );
                  })}
                </g>
              );
            })}
            {npcs.map((n) => {
              const path = (n.token as any)?.committedPath as Array<{ x: number; y: number }> | undefined;
              if (!path || path.length < 2) return null;
              const pointsStr = path
                .map((pt) => {
                  const px = (pt.x + 0.5) * grid.cellSizePx + (grid.originX || 0);
                  const py = (pt.y + 0.5) * grid.cellSizePx + (grid.originY || 0);
                  return `${px},${py}`;
                })
                .join(' ');
              return (
                <g key={`path-${n.id}`}>
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.75"
                  />
                </g>
              );
            })}
          </svg>

          {/* ============================================================ */}
          {/* LAYER 6: Tokens & Labels (Section 2: Live Position Binding)  */}
          {/* ============================================================ */}
          {layerVisibility.tokens && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
              {/* Characters: Visual position derives strictly from live projection */}
              {characters.map((char) => {
                const isSelected = selectedEntityId === char.id;
                const isBeingDragged = tokenDrag?.entityId === char.id && tokenDrag.isDragging;

                // Visual position: use live char.token.x / y (never overridden by static definitions)
                const charPos = resolveTokenPosition(char.token);
                const xPct = isBeingDragged
                  ? (tokenDrag.currentGridX / grid.width) * 100
                  : charPos.pctX;
                const yPct = isBeingDragged
                  ? (tokenDrag.currentGridY / grid.height) * 100
                  : charPos.pctY;

                return (
                  <div
                    key={char.id}
                    onMouseDown={(e) => {
                      if (activeTool === 'token') {
                        e.stopPropagation();
                        setTokenDrag({
                          entityId: char.id,
                          entityType: 'character',
                          startX: e.clientX,
                          startY: e.clientY,
                          currentGridX: charPos.cellX,
                          currentGridY: charPos.cellY,
                          isDragging: false,
                        });
                        onSelectEntity?.(char.id, 'character');
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const tok = mapDefinition.tokens.find((t) => t.entityId === char.id || t.id === char.id);
                      handleContextMenu(e, 'token', char.id, {
                        entityType: 'character',
                        character: char,
                        token: tok || {
                          id: `tok-${char.id}`,
                          entityId: char.id,
                          entityType: 'character',
                          name: char.name,
                          x: char.token.x,
                          y: char.token.y,
                          sizeCells: 1,
                          isVisibleToPlayers: true,
                          elevationFt: 0,
                        },
                      });
                    }}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer flex flex-col items-center group transition-transform ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                    } ${isBeingDragged ? 'opacity-80 scale-125 z-40' : ''}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-900 text-amber-100 ring-4 ring-amber-400/30'
                          : 'border-emerald-500 bg-neutral-900 text-emerald-200'
                      }`}
                    >
                      {char.name.charAt(0)}
                    </div>
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-[9px] font-mono text-neutral-200 whitespace-nowrap flex items-center gap-1 shadow-md">
                      <span>{char.name.split(' ')[0]}</span>
                      <span className="text-emerald-400 font-bold">
                        {char.currentHp}/{char.maxHp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* NPCs: Scene-specific filtering and live projection */}
              {sceneNpcs.map((npc) => {
                const npcGridX = (npc.token.x / 100) * grid.width;
                const npcGridY = (npc.token.y / 100) * grid.height;
                const isCellVisibleToPlayers = isEntityVisibleOnBattlemap(
                  npcGridX,
                  npcGridY,
                  npc.token.isVisibleToPlayers,
                  userRole === 'dm_host',
                  mapDefinition.fog,
                  currentlyVisibleCells
                );

                // If not visible to players and current view is not effective DM (i.e. Player or DM Preview):
                if (!isEffectiveDm && !isCellVisibleToPlayers) {
                  return null;
                }

                const isSelected = selectedEntityId === npc.id;
                const isBeingDragged = tokenDrag?.entityId === npc.id && tokenDrag.isDragging;

                const npcPos = resolveTokenPosition(npc.token);
                const xPct = isBeingDragged
                  ? (tokenDrag.currentGridX / grid.width) * 100
                  : npcPos.pctX;
                const yPct = isBeingDragged
                  ? (tokenDrag.currentGridY / grid.height) * 100
                  : npcPos.pctY;

                const isHiddenFromParty = !npc.token.isVisibleToPlayers || !isCellVisibleToPlayers;

                return (
                  <div
                    key={npc.id}
                    role="button" tabIndex={0} aria-label={`NPC token ${npc.name}`}
                    onKeyDown={e=>{if(e.key==='Enter')onSelectEntity?.(npc.id,'npc');}}
                    onMouseDown={(e) => {
                      if (activeTool === 'token') {
                        e.stopPropagation();
                        setTokenDrag({
                          entityId: npc.id,
                          entityType: 'npc',
                          startX: e.clientX,
                          startY: e.clientY,
                          currentGridX: npcPos.cellX,
                          currentGridY: npcPos.cellY,
                          isDragging: false,
                        });
                        onSelectEntity?.(npc.id, 'npc');
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const tok = mapDefinition.tokens.find((t) => t.entityId === npc.id || t.id === npc.id);
                      handleContextMenu(e, 'token', npc.id, {
                        entityType: 'npc',
                        npc: npc,
                        token: tok || {
                          id: `tok-${npc.id}`,
                          entityId: npc.id,
                          entityType: 'npc',
                          name: npc.name,
                          x: npc.token.x,
                          y: npc.token.y,
                          sizeCells: 1,
                          isVisibleToPlayers: npc.token.isVisibleToPlayers,
                          elevationFt: 0,
                        },
                      });
                    }}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute pointer-events-auto cursor-pointer flex flex-col items-center group transition-transform ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                    } ${isHiddenFromParty ? 'opacity-70' : ''} ${
                      isBeingDragged ? 'opacity-80 scale-125 z-40' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-rose-950 text-amber-100 ring-4 ring-amber-400/30'
                          : isHiddenFromParty
                          ? 'border-dashed border-rose-400 bg-neutral-900/90 text-rose-300'
                          : npc.token.isVisibleToPlayers
                          ? 'border-rose-600 bg-neutral-900 text-rose-300'
                          : 'border-neutral-500 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {npc.name.charAt(0)}
                    </div>
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-[9px] font-mono text-neutral-200 whitespace-nowrap flex items-center gap-1 shadow-md">
                      {isHiddenFromParty && isEffectiveDm && (
                        <span className="text-[8px] px-1 rounded bg-rose-950 border border-rose-800 text-rose-300 flex items-center gap-0.5">
                          <EyeOff className="w-2 h-2 text-rose-400" />
                          <span>Hidden</span>
                        </span>
                      )}
                      <span>{npc.name.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* LAYER 7: Drawing Previews & Measurement Overlays             */}
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

              {/* Drawing Corridor Preview (Orthogonal, Section 3) */}
              {activeTool === 'corridor' && drawStart && drawCurrent && (
                <>
                  {computeCorridorSegments(
                    drawStart.gridX,
                    drawStart.gridY,
                    drawCurrent.gridX,
                    drawCurrent.gridY,
                    corridorWidthCells
                  ).map((seg, i) => (
                    <div
                      key={`preview-corridor-${i}`}
                      style={{
                        left: `${seg.x * grid.cellSizePx}px`,
                        top: `${seg.y * grid.cellSizePx}px`,
                        width: `${seg.width * grid.cellSizePx}px`,
                        height: `${seg.height * grid.cellSizePx}px`,
                      }}
                      className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/20 rounded flex items-center justify-center text-cyan-200 font-mono text-xs font-bold"
                    >
                      Corridor ({corridorWidthCells * 5}ft width)
                    </div>
                  ))}
                </>
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

              {/* Fog Box Reveal Preview */}
              {activeTool === 'fog_box_reveal' && drawStart && drawCurrent && (
                <div
                  style={{
                    left: `${Math.min(drawStart.gridX, drawCurrent.gridX) * grid.cellSizePx}px`,
                    top: `${Math.min(drawStart.gridY, drawCurrent.gridY) * grid.cellSizePx}px`,
                    width: `${Math.max(1, Math.abs(drawCurrent.gridX - drawStart.gridX) + 1) * grid.cellSizePx}px`,
                    height: `${Math.max(1, Math.abs(drawCurrent.gridY - drawStart.gridY) + 1) * grid.cellSizePx}px`,
                  }}
                  className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/25 rounded flex items-center justify-center text-emerald-200 font-mono text-xs font-bold shadow-lg"
                >
                  Reveal Fog Area
                </div>
              )}

              {/* Fog Box Hide Preview */}
              {activeTool === 'fog_box_hide' && drawStart && drawCurrent && (
                <div
                  style={{
                    left: `${Math.min(drawStart.gridX, drawCurrent.gridX) * grid.cellSizePx}px`,
                    top: `${Math.min(drawStart.gridY, drawCurrent.gridY) * grid.cellSizePx}px`,
                    width: `${Math.max(1, Math.abs(drawCurrent.gridX - drawStart.gridX) + 1) * grid.cellSizePx}px`,
                    height: `${Math.max(1, Math.abs(drawCurrent.gridY - drawStart.gridY) + 1) * grid.cellSizePx}px`,
                  }}
                  className="absolute border-2 border-dashed border-purple-400 bg-purple-500/25 rounded flex items-center justify-center text-purple-200 font-mono text-xs font-bold shadow-lg"
                >
                  Conceal Fog Area
                </div>
              )}

              {/* Brush Cursor Indicator */}
              {(activeTool === 'fog_reveal' || activeTool === 'fog_hide') && hoverGridCoords && (
                <div
                  style={{
                    left: `${(hoverGridCoords.gridX + 0.5) * grid.cellSizePx}px`,
                    top: `${(hoverGridCoords.gridY + 0.5) * grid.cellSizePx}px`,
                    width: `${brushRadiusCells * 2 * grid.cellSizePx}px`,
                    height: `${brushRadiusCells * 2 * grid.cellSizePx}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute rounded-full border-2 border-dashed pointer-events-none transition-all ${
                    activeTool === 'fog_reveal'
                      ? 'border-emerald-400 bg-emerald-500/15'
                      : 'border-purple-400 bg-purple-500/15'
                  }`}
                />
              )}
            </div>
          )}

          {/* LAYER 8: Two-Point Grid Calibration Crosshairs */}
          {activeTool === 'calibrate' && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
              {calibrationPoint1 && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                  style={{ left: `${calibrationPoint1.x}px`, top: `${calibrationPoint1.y}px` }}
                >
                  <div className="w-9 h-9 rounded-full border-2 border-cyan-400 bg-cyan-500/25 flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow" />
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-neutral-950/90 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-600 shadow">
                    Anchor P1 ({calibrationPoint1.x}, {calibrationPoint1.y})
                  </span>
                </div>
              )}

              {calibrationPoint2 && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                  style={{ left: `${calibrationPoint2.x}px`, top: `${calibrationPoint2.y}px` }}
                >
                  <div className="w-9 h-9 rounded-full border-2 border-amber-400 bg-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/50 animate-pulse">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow" />
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-neutral-950/90 text-amber-300 font-mono text-[10px] font-bold border border-amber-600 shadow">
                    Ref P2 ({calibrationPoint2.x}, {calibrationPoint2.y})
                  </span>
                </div>
              )}

              {calibrationPoint1 && calibrationPoint2 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={calibrationPoint1.x}
                    y1={calibrationPoint1.y}
                    x2={calibrationPoint2.x}
                    y2={calibrationPoint2.y}
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Two-Point Grid Calibration Modal */}
      {showCalibrationModal && calibrationPoint1 && calibrationPoint2 && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <GridIcon className="w-5 h-5" />
                <h3 className="font-cinzel font-bold text-base text-neutral-100">Two-Point Grid Calibration</h3>
              </div>
              <button
                onClick={() => {
                  setShowCalibrationModal(false);
                  setCalibrationPoint1(null);
                  setCalibrationPoint2(null);
                }}
                className="text-neutral-400 hover:text-neutral-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-mono leading-relaxed">
              Calculate cell pitch and origin offset by measuring the preprinted squares between Anchor Point 1 and Reference Point 2.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-3 rounded border border-neutral-800 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Point 1 (Anchor):</span>
                <span className="text-cyan-300 font-bold">({calibrationPoint1.x}, {calibrationPoint1.y})</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Point 2 (Reference):</span>
                <span className="text-amber-300 font-bold">({calibrationPoint2.x}, {calibrationPoint2.y})</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Delta X:</span>
                <span className="text-neutral-200">{Math.abs(calibrationPoint2.x - calibrationPoint1.x)} px</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Delta Y:</span>
                <span className="text-neutral-200">{Math.abs(calibrationPoint2.y - calibrationPoint1.y)} px</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Grid Squares Count between points:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={calibrationUnits}
                    onChange={(e) => setCalibrationUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 font-mono text-sm focus:border-cyan-500 outline-none"
                  />
                  <span className="text-xs font-mono text-neutral-400 whitespace-nowrap">
                    ({calibrationUnits * 5} ft)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Measurement Axis:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['horizontal', 'vertical', 'diagonal'] as const).map((ax) => (
                    <button
                      key={ax}
                      type="button"
                      onClick={() => setCalibrationAxis(ax)}
                      className={`px-3 py-1.5 rounded text-xs font-mono capitalize border transition-colors ${
                        calibrationAxis === ax
                          ? 'bg-cyan-600 text-neutral-950 font-bold border-cyan-400'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {ax}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const dx = Math.abs(calibrationPoint2.x - calibrationPoint1.x);
                const dy = Math.abs(calibrationPoint2.y - calibrationPoint1.y);
                const count = Math.max(1, calibrationUnits);
                let pitch = calibrationAxis === 'horizontal' ? dx / count : (calibrationAxis === 'vertical' ? dy / count : Math.sqrt(dx * dx + dy * dy) / (count * Math.SQRT2));
                pitch = Math.round(pitch * 10) / 10;
                const ox = Math.round((calibrationPoint1.x % pitch) * 10) / 10;
                const oy = Math.round((calibrationPoint1.y % pitch) * 10) / 10;
                return (
                  <div className="bg-cyan-950/40 border border-cyan-800/60 rounded p-2.5 text-xs font-mono text-cyan-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-cyan-400">Calculated Cell Pitch:</span>
                      <span className="font-bold">{pitch} px/cell</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400">Calculated Origin Offset:</span>
                      <span className="font-bold">({ox}px, {oy}px)</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setShowCalibrationModal(false);
                  setCalibrationPoint1(null);
                  setCalibrationPoint2(null);
                }}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyTwoPointCalibration}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold font-mono text-xs transition-colors shadow"
              >
                Apply & Open Fine-Tuning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Fine-Tuning Calibration HUD */}
      {showFineTuneHud && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border border-cyan-500/80 rounded-lg shadow-2xl p-3 backdrop-blur-md flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-200">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Sliders className="w-4 h-4" />
            <span>Calibration HUD:</span>
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Pitch Steppers */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[10px] uppercase">Pitch:</span>
            <span className="font-bold text-amber-300 w-16 text-center">{grid.cellSizePx.toFixed(1)} px</span>
            <button
              onClick={() => handleNudgePitch(-0.1)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
              title="Decrease cell pitch by 0.1px"
            >
              -0.1
            </button>
            <button
              onClick={() => handleNudgePitch(0.1)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
              title="Increase cell pitch by 0.1px"
            >
              +0.1
            </button>
          </div>

          {/* Origin X Steppers */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[10px] uppercase">Origin X:</span>
            <span className="font-bold text-cyan-300 w-12 text-center">{grid.originX || 0} px</span>
            <button
              onClick={() => handleNudgeOrigin(-1, 0)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
              title="Nudge grid left 1px"
            >
              -1
            </button>
            <button
              onClick={() => handleNudgeOrigin(1, 0)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
              title="Nudge grid right 1px"
            >
              +1
            </button>
          </div>

          {/* Origin Y Steppers */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[10px] uppercase">Origin Y:</span>
            <span className="font-bold text-cyan-300 w-12 text-center">{grid.originY || 0} px</span>
            <button
              onClick={() => handleNudgeOrigin(0, -1)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
              title="Nudge grid up 1px"
            >
              -1
            </button>
            <button
              onClick={() => handleNudgeOrigin(0, 1)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
              title="Nudge grid down 1px"
            >
              +1
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomToFitImage}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px]"
              title="Fit 100% of Map Artwork in Viewport"
            >
              Fit Image
            </button>
            <button
              onClick={handleZoomToFitGrid}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px]"
              title="Fit Grid in Viewport"
            >
              Fit Grid
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Action Buttons */}
          <button
            onClick={handleSaveCalibration}
            disabled={isSavingCalibration}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold font-mono shadow transition-colors disabled:opacity-50"
            title="Persist grid calibration to authoritative SQLite state"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSavingCalibration ? 'Saving...' : 'Save Calibration'}</span>
          </button>

          <button
            onClick={() => {
              setShowFineTuneHud(false);
              setCalibrationPoint1(null);
              setCalibrationPoint2(null);
              onSetActiveTool?.('token');
            }}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100"
            title="Close Calibration HUD"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Viewport Help Pill (AIUI-CP002C1) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-[11px] font-mono text-neutral-300 shadow-xl flex items-center gap-2 backdrop-blur-sm">
        <span className="font-semibold text-amber-400">Ctrl + Scroll:</span> <span>Zoom</span>
        <span className="text-neutral-600">|</span>
        <span className="font-semibold text-cyan-400">Middle Drag:</span> <span>Pan</span>
        {activeTool === 'pan' && <span className="text-amber-300 ml-1 font-semibold">(Pan Tool Active)</span>}
      </div>

      {/* Context-Sensitive Right-Click Menu */}
      {contextMenu.isOpen && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.clientX}px`,
            top: `${contextMenu.clientY}px`,
            zIndex: 100,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-56 bg-neutral-900 border border-neutral-700/90 rounded-lg shadow-2xl py-1 text-xs text-neutral-200 font-sans backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-neutral-800 text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span className="font-bold text-amber-300 truncate">
              {contextMenu.targetType === 'blank' &&
                (contextMenu.data?.isUnexplored
                  ? 'Unexplored Area'
                  : `Canvas (${contextMenu.gridX}, ${contextMenu.gridY})`)}
              {contextMenu.targetType === 'room' && `Room (${contextMenu.data?.room?.name || 'Chamber'})`}
              {contextMenu.targetType === 'corridor' && 'Corridor Segment'}
              {contextMenu.targetType === 'wall' && 'Wall Segment'}
              {contextMenu.targetType === 'door' && `Door (${contextMenu.data?.door?.state || 'closed'})`}
              {contextMenu.targetType === 'window' && `Window (${contextMenu.data?.window?.state || 'clear'})`}
              {contextMenu.targetType === 'railing' && 'Railing / Balustrade'}
              {contextMenu.targetType === 'terrain' && `Terrain: ${contextMenu.data?.terrain?.name || 'Difficult Zone'}`}
              {contextMenu.targetType === 'token' &&
                `Token: ${contextMenu.data?.token?.name || contextMenu.data?.character?.name || contextMenu.data?.npc?.name || 'Entity'}`}
            </span>
            <button
              onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
              className="text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="py-1">
            {/* Blank Canvas Actions */}
            {contextMenu.targetType === 'blank' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('room');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Square className="w-3.5 h-3.5 text-amber-400" />
                      <span>Draw Room</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('corridor');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Move className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Draw Corridor</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('wall');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Minus className="w-3.5 h-3.5 text-sky-400" />
                      <span>Draw Wall</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('window');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <AppWindow className="w-3.5 h-3.5 text-sky-300" />
                      <span>Place Window</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('railing');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Fence className="w-3.5 h-3.5 text-teal-400" />
                      <span>Place Railing</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('terrain');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Mountain className="w-3.5 h-3.5 text-amber-500" />
                      <span>Place Difficult Terrain</span>
                    </button>
                    <div className="h-px bg-neutral-800 my-1" />
                    <button
                      onClick={() => {
                        onUpdateFog?.((prev) => manualRevealCells(prev, [`${contextMenu.gridX},${contextMenu.gridY}`]));
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Cell ({contextMenu.gridX}, {contextMenu.gridY})</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateFog?.((prev) => manualHideCells(prev, [`${contextMenu.gridX},${contextMenu.gridY}`]));
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-purple-300"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Cell in Fog</span>
                    </button>
                    <button
                      onClick={() => handleCenterView(contextMenu.gridX, contextMenu.gridY)}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Center View Here</span>
                    </button>
                  </>
                ) : contextMenu.data?.isUnexplored ? (
                  <div className="px-3 py-2 text-[11px] text-neutral-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                      <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Unexplored Territory</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      This area is shrouded in fog of war. Tokens cannot target or interact with unrevealed locations.
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const inDiff = (mapDefinition.geometry.terrain || []).some(
                          (tz) =>
                            contextMenu.gridX >= tz.x &&
                            contextMenu.gridX < tz.x + tz.width &&
                            contextMenu.gridY >= tz.y &&
                            contextMenu.gridY < tz.y + tz.height
                        );
                        setCanvasNotice(
                          `Cell (${contextMenu.gridX}, ${contextMenu.gridY}): ${inDiff ? 'Difficult Terrain (2x move cost)' : 'Standard unobstructed terrain'}.`
                        );
                        setTimeout(() => setCanvasNotice(null), 3500);
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Inspect Visible Area</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetActiveTool?.('measure');
                        setMeasureStart({ x: contextMenu.gridX, y: contextMenu.gridY });
                        setMeasureCurrent({ x: contextMenu.gridX, y: contextMenu.gridY });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Measure Distance From Here</span>
                    </button>
                    <button
                      onClick={() => {
                        const activeChar = characters.find((c) => c.id === selectedEntityId) || characters[0];
                        if (!activeChar) {
                          setCanvasNotice('No active character selected for movement request.');
                          setTimeout(() => setCanvasNotice(null), 3000);
                          setContextMenu((prev) => ({ ...prev, isOpen: false }));
                          return;
                        }
                        const actPos = resolveTokenPosition(activeChar.token);
                        const fromX = actPos.cellX;
                        const fromY = actPos.cellY;
                        const toX = contextMenu.gridX;
                        const toY = contextMenu.gridY;
                        const distFeet = Math.round(Math.hypot(toX - fromX, toY - fromY) * (grid.feetPerCell || 5));
                        const inDiff = (mapDefinition.geometry.terrain || []).some(
                          (tz) => toX >= tz.x && toX < tz.x + tz.width && toY >= tz.y && toY < tz.y + tz.height
                        );
                        const mult = inDiff ? 2 : 1;
                        setMovementIntent({
                          charId: activeChar.id,
                          charName: activeChar.name,
                          fromX,
                          fromY,
                          toX,
                          toY,
                          distanceFeet: distFeet,
                          speedFeet: activeChar.speedFt || 30,
                          inDifficultTerrain: inDiff,
                          costFeet: distFeet * mult,
                        });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                    >
                      <Footprints className="w-3.5 h-3.5" />
                      <span>Request Movement to Here</span>
                    </button>
                  </>
                )}
              </>
            )}

            {/* Room / Corridor Actions */}
            {(contextMenu.targetType === 'room' || contextMenu.targetType === 'corridor') && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onSelectGeometry?.({ type: contextMenu.targetType as any, id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select / Inspect</span>
                    </button>
                    {contextMenu.targetType === 'room' && contextMenu.data?.room && (
                      <>
                        <button
                          onClick={() => {
                            const r = contextMenu.data.room as RectangularRoom;
                            const cells: string[] = [];
                            for (let y = r.y; y < r.y + r.height; y++) {
                              for (let x = r.x; x < r.x + r.width; x++) {
                                cells.push(`${x},${y}`);
                              }
                            }
                            onUpdateFog?.((prev) => manualRevealCells(prev, cells));
                            setContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Reveal Room</span>
                        </button>
                        <button
                          onClick={() => {
                            const r = contextMenu.data.room as RectangularRoom;
                            const cells: string[] = [];
                            for (let y = r.y; y < r.y + r.height; y++) {
                              for (let x = r.x; x < r.x + r.width; x++) {
                                cells.push(`${x},${y}`);
                              }
                            }
                            onUpdateFog?.((prev) => manualHideCells(prev, cells));
                            setContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-purple-300"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Conceal Room in Fog</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        onDeleteGeometry?.({ type: contextMenu.targetType as any, id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete {contextMenu.targetType === 'room' ? 'Room' : 'Corridor'}</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 text-neutral-400 italic text-[11px]">
                    Inspect Area (DM controls restricted)
                  </div>
                )}
              </>
            )}

            {/* Wall Actions */}
            {contextMenu.targetType === 'wall' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onSelectGeometry?.({ type: 'wall', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Info className="w-3.5 h-3.5 text-sky-400" />
                      <span>Inspect Wall</span>
                    </button>
                    <button
                      onClick={() => {
                        const host = findHostWallForDoor(
                          contextMenu.gridX,
                          contextMenu.gridY,
                          mapDefinition.geometry.walls,
                          1.5
                        );
                        if (host) {
                          onAddDoor?.({
                            id: `door-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            x: host.snappedX,
                            y: host.snappedY,
                            orientation: host.orientation,
                            state: 'closed',
                            blocksVisionWhenClosed: true,
                          });
                        }
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                    >
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>Add Door Here</span>
                    </button>
                    <button
                      onClick={() => {
                        const host = findHostWallForWindow(
                          contextMenu.gridX,
                          contextMenu.gridY,
                          mapDefinition.geometry.walls,
                          1.5
                        );
                        if (host) {
                          onAddWindow?.({
                            id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            x: host.snappedX,
                            y: host.snappedY,
                            orientation: host.orientation,
                            state: 'clear',
                            blocksVisionWhenObscured: true,
                            blocksMovement: true,
                          });
                        }
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-sky-300"
                    >
                      <AppWindow className="w-3.5 h-3.5" />
                      <span>Add Window Here</span>
                    </button>
                    <button
                      onClick={() => {
                        const wall = mapDefinition.geometry.walls.find((w) => w.id === contextMenu.targetId);
                        if (wall) {
                          onDeleteGeometry?.({ type: 'wall', id: wall.id });
                          onAddRailing?.({
                            id: `rail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            x1: wall.x1,
                            y1: wall.y1,
                            x2: wall.x2,
                            y2: wall.y2,
                            movementType: 'blocking',
                            blocksVision: false,
                            blocksMovement: true,
                            name: 'Converted Railing',
                          });
                        }
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-teal-300"
                    >
                      <Fence className="w-3.5 h-3.5" />
                      <span>Convert to Railing</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteGeometry?.({ type: 'wall', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Wall</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 text-neutral-400 italic text-[11px]">Solid masonry barrier.</div>
                )}
              </>
            )}

            {/* Door Actions */}
            {contextMenu.targetType === 'door' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onUpdateDoorState?.(contextMenu.targetId!, 'open');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Open Door</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateDoorState?.(contextMenu.targetId!, 'closed');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                    >
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>Close Door</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateDoorState?.(contextMenu.targetId!, 'locked');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-rose-300"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Door</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteGeometry?.({ type: 'door', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Door</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-1 text-neutral-400 text-[10px] font-mono">
                      State: {contextMenu.data?.door?.state || 'closed'}
                    </div>
                    <button
                      onClick={() => {
                        const d = contextMenu.data?.door as DoorSegment;
                        setPendingDoorRequest({
                          doorId: contextMenu.targetId!,
                          door: d,
                          action: 'open',
                        });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Request Open</span>
                    </button>
                    <button
                      onClick={() => {
                        const d = contextMenu.data?.door as DoorSegment;
                        setPendingDoorRequest({
                          doorId: contextMenu.targetId!,
                          door: d,
                          action: 'close',
                        });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                    >
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>Request Close</span>
                    </button>
                    <button
                      onClick={() => {
                        const d = contextMenu.data?.door as DoorSegment;
                        setPendingDoorRequest({
                          doorId: contextMenu.targetId!,
                          door: d,
                          action: 'unlock',
                        });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-rose-300"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Request Force / Unlock</span>
                    </button>
                  </>
                )}
              </>
            )}

            {/* Window Actions */}
            {contextMenu.targetType === 'window' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onUpdateWindowState?.(contextMenu.targetId!, 'clear');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-sky-300"
                    >
                      <AppWindow className="w-3.5 h-3.5" />
                      <span>Set Clear (Sight Passes)</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateWindowState?.(contextMenu.targetId!, 'obscured');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Set Obscured (Blocks Sight)</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateWindowState?.(contextMenu.targetId!, 'broken');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                    >
                      <AppWindow className="w-3.5 h-3.5" />
                      <span>Set Broken (Clear LOS)</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteGeometry?.({ type: 'window', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Window</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 text-neutral-400 italic text-[11px]">
                    Window: {contextMenu.data?.window?.state || 'clear'} (Sight passes, walking blocked)
                  </div>
                )}
              </>
            )}

            {/* Railing Actions */}
            {contextMenu.targetType === 'railing' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onSelectGeometry?.({ type: 'railing', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-teal-300"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Inspect Railing</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteGeometry?.({ type: 'railing', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Railing</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 text-neutral-400 italic text-[11px]">
                    Low barrier: vision passes through, movement blocked or vaulted.
                  </div>
                )}
              </>
            )}

            {/* Terrain Zone Actions */}
            {contextMenu.targetType === 'terrain' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onSelectGeometry?.({ type: 'terrain', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Inspect Terrain Zone</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteGeometry?.({ type: 'terrain', id: contextMenu.targetId! });
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Terrain Zone</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 text-neutral-300 text-[11px] space-y-1">
                    <p className="font-bold text-amber-300">{contextMenu.data?.terrain?.name || 'Difficult Terrain'}</p>
                    <p className="text-neutral-400">Movement Cost: {contextMenu.data?.terrain?.movementCostMultiplier || 2}x</p>
                  </div>
                )}
              </>
            )}

            {/* Token Actions */}
            {contextMenu.targetType === 'token' && (
              <>
                {isEffectiveDm ? (
                  <>
                    <button
                      onClick={() => {
                        onSelectEntity?.(contextMenu.targetId!, contextMenu.data?.entityType || 'character');
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspect Combatant</span>
                    </button>
                    {contextMenu.data?.entityType === 'npc' && (
                      <button
                        onClick={() => {
                          const currentVis = contextMenu.data?.token?.isVisibleToPlayers ?? true;
                          onUpdateTokenVisibility?.(contextMenu.targetId!, !currentVis);
                          setContextMenu((prev) => ({ ...prev, isOpen: false }));
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-amber-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Toggle Player Visibility</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDeleteToken?.(contextMenu.targetId!);
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950/50 flex items-center gap-2 text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from Map</span>
                    </button>

                    {/* DM Token Ownership Assignment (Session Metadata) */}
                    <div className="h-px bg-neutral-800 my-1" />
                    <div className="px-3 py-1 text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Ownership</span>
                      <span className="text-[9px] text-amber-400 font-normal">Session-Only</span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateTokenOwnership?.(contextMenu.targetId!, {
                          controller: 'dm_only',
                          isDmControlled: true,
                          notes: 'Controlled exclusively by DM (Session Demo)',
                        });
                        setCanvasNotice('Token ownership set to: DM Only (Session Demo).');
                        setTimeout(() => setCanvasNotice(null), 3000);
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-rose-300"
                    >
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>Assign: DM Only</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateTokenOwnership?.(contextMenu.targetId!, {
                          controller: 'party_shared',
                          isDmControlled: false,
                          notes: 'Shared control by party (Session Demo)',
                        });
                        setCanvasNotice('Token ownership set to: Party Shared (Session Demo).');
                        setTimeout(() => setCanvasNotice(null), 3000);
                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assign: Party Shared</span>
                    </button>
                    {characters.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => {
                          onUpdateTokenOwnership?.(contextMenu.targetId!, {
                            controller: char.id,
                            isDmControlled: false,
                            notes: `Assigned to ${char.name} (Session Demo)`,
                          });
                          setCanvasNotice(`Token ownership assigned to: ${char.name} (Session Demo).`);
                          setTimeout(() => setCanvasNotice(null), 3000);
                          setContextMenu((prev) => ({ ...prev, isOpen: false }));
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-cyan-300 truncate"
                      >
                        <MousePointer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Assign: {char.name}</span>
                      </button>
                    ))}
                    <div className="px-3 py-0.5 text-[9px] text-neutral-500 italic">
                      Session metadata — not production auth.
                    </div>
                  </>
                ) : (
                  <>
                    {contextMenu.data?.entityType === 'npc' ? (
                      <div className="px-3 py-2 text-neutral-300 text-xs space-y-1">
                        <div className="font-bold text-amber-300">{contextMenu.data?.npc?.name || 'Creature'}</div>
                        <p className="text-[10px] text-neutral-400">
                          Target identified. Authoritative combat actions & rules reserved for Python runtime.
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onSelectEntity?.(contextMenu.targetId!, 'character');
                            setContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-emerald-300"
                        >
                          <MousePointer className="w-3.5 h-3.5" />
                          <span>Select Token</span>
                        </button>
                        <button
                          onClick={() => {
                            const char = characters.find((c) => c.id === contextMenu.targetId);
                            setCanvasNotice(
                              char
                                ? `${char.name}: Speed ${char.speedFt}ft, HP ${char.currentHp}/${char.maxHp}, AC ${char.armorClass}`
                                : 'Character information'
                            );
                            setTimeout(() => setCanvasNotice(null), 3500);
                            setContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center gap-2 text-neutral-200"
                        >
                          <Info className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Inspect Character Info</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending Player Door Request Modal */}
      {pendingDoorRequest && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPendingDoorRequest(null)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-5 shadow-2xl text-neutral-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel font-bold text-amber-100 text-base">Door Interaction Intent</h3>
              </div>
              <button
                onClick={() => setPendingDoorRequest(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2 bg-rose-950/80 border border-rose-700/80 rounded flex items-center gap-2 text-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Preview Only — Not Sent to DM or Python Runtime.</span>
            </div>

            <div className="space-y-2 text-xs font-mono bg-neutral-950 p-3 rounded border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">Door Position:</span>
                <span className="text-amber-300">({pendingDoorRequest.door.x}, {pendingDoorRequest.door.y})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Current Door State:</span>
                <span className="capitalize font-bold text-neutral-200">{pendingDoorRequest.door.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Requested Action:</span>
                <span className="uppercase font-bold text-emerald-400">{pendingDoorRequest.action}</span>
              </div>
            </div>

            <div className="text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 p-3 rounded space-y-1">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Runtime Authority Boundary</span>
              </p>
              <p>
                Authoritative rules, trap triggers, locking DC checks and world state updates are governed exclusively by canonical Python R1.
              </p>
              <p className="text-[11px] text-neutral-500 pt-1">
                The gateway is currently in local session mode. This intent does not mutate world state without DM approval.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setPendingDoorRequest(null)}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  const newIntent = {
                    id: `door-${Date.now()}`,
                    type: 'door' as const,
                    description: `Door at (${pendingDoorRequest.door.x}, ${pendingDoorRequest.door.y}): ${pendingDoorRequest.action.toUpperCase()} intent queued.`,
                    timestamp: new Date().toLocaleTimeString(),
                  };
                  setDemoIntentQueue((prev) => [newIntent, ...prev]);
                  setCanvasNotice(
                    `[DEMO-ONLY] Door ${pendingDoorRequest.action} intent queued. Preview Only — Not Sent to DM or Python Runtime.`
                  );
                  setTimeout(() => setCanvasNotice(null), 3500);
                  setPendingDoorRequest(null);
                }}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold transition-colors shadow"
              >
                Queue Demo Request (Non-Authoritative)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Movement Intent Modal */}
      {movementIntent && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMovementIntent(null)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-5 shadow-2xl text-neutral-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cinzel font-bold text-amber-100 text-base">Movement Route Intent</h3>
              </div>
              <button
                onClick={() => setMovementIntent(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2 bg-rose-950/80 border border-rose-700/80 rounded flex items-center gap-2 text-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Preview Only — Not Sent to DM or Python Runtime.</span>
            </div>

            <div className="space-y-2 text-xs font-mono bg-neutral-950 p-3 rounded border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">Character:</span>
                <span className="font-bold text-amber-300">{movementIntent.charName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">From / To Cells:</span>
                <span className="text-neutral-300">
                  ({movementIntent.fromX}, {movementIntent.fromY}) → ({movementIntent.toX}, {movementIntent.toY})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Direct Distance:</span>
                <span className="text-cyan-300">{movementIntent.distanceFeet} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Terrain Cost Multiplier:</span>
                <span className={movementIntent.inDifficultTerrain ? 'text-amber-400 font-bold' : 'text-neutral-400'}>
                  {movementIntent.inDifficultTerrain ? '2.0x (Difficult Terrain)' : '1.0x (Normal)'}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-800 pt-1.5">
                <span className="text-neutral-400 font-bold">Total Movement Required:</span>
                <span
                  className={`font-bold ${
                    movementIntent.costFeet > movementIntent.speedFeet ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {movementIntent.costFeet} ft / {movementIntent.speedFeet} ft speed
                </span>
              </div>
            </div>

            {movementIntent.costFeet > movementIntent.speedFeet && (
              <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Movement exceeds available speed limit ({movementIntent.speedFeet}ft). Requires Dash action or DM grant.</span>
              </div>
            )}

            <div className="text-xs text-neutral-400 bg-neutral-950 p-3 rounded border border-neutral-800 space-y-1">
              <p className="text-amber-300/90 font-semibold">Rules Authority Notice</p>
              <p>
                Combat turn order, opportunity attacks, traps and Dash action resolution belong strictly to canonical Python R1.
              </p>
              <p className="text-[11px] text-neutral-500 pt-0.5">
                Token position remains unchanged until approved by the DM or game engine.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setMovementIntent(null)}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  const newIntent = {
                    id: `move-${Date.now()}`,
                    type: 'movement' as const,
                    description: `${movementIntent.charName}: Move (${movementIntent.fromX}, ${movementIntent.fromY}) → (${movementIntent.toX}, ${movementIntent.toY}) [${movementIntent.distanceFeet}ft]`,
                    timestamp: new Date().toLocaleTimeString(),
                  };
                  setDemoIntentQueue((prev) => [newIntent, ...prev]);
                  setCanvasNotice(
                    `[DEMO-ONLY] Movement intent queued (${movementIntent.charName} -> ${movementIntent.distanceFeet}ft). Preview Only — Not Sent to DM or Python Runtime.`
                  );
                  setTimeout(() => setCanvasNotice(null), 3500);
                  setMovementIntent(null);
                }}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold transition-colors shadow"
              >
                Queue Demo Movement (Non-Authoritative)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Observable DEMO-ONLY Intent Queue Modal */}
      {showDemoQueueModal && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDemoQueueModal(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-5 shadow-2xl text-neutral-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel font-bold text-amber-100 text-base">In-Memory DEMO-ONLY Queue</h3>
              </div>
              <button
                onClick={() => setShowDemoQueueModal(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2 bg-rose-950/80 border border-rose-700/80 rounded flex items-center gap-2 text-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Preview Only — Not Sent to DM or Python Runtime.</span>
            </div>

            <p className="text-xs text-neutral-400">
              This client queue tracks local demonstration intents. Neither map state nor token coordinates have been modified.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {demoIntentQueue.length === 0 ? (
                <div className="text-neutral-500 italic text-center py-4">Queue is empty.</div>
              ) : (
                demoIntentQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span className="uppercase font-bold text-amber-400">{item.type} intent</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <div className="text-neutral-200">{item.description}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                onClick={() => setDemoIntentQueue([])}
                disabled={demoIntentQueue.length === 0}
                className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium disabled:opacity-40 transition-colors"
              >
                Clear Queue
              </button>
              <button
                onClick={() => setShowDemoQueueModal(false)}
                className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


