/**
 * VadAllFate — Battlemap Session State Manager (AIUI-CP002B1)
 *
 * Provides a frontend session owner for battlemap definitions, geometry edits,
 * calibration settings, and undo/redo histories.
 *
 * Architectural Boundaries:
 * - Lives at the application session tier above workspace view mounting/unmounting.
 * - Guarantees maps, geometry edits, and imported artwork survive tab navigation
 *   between Play/Host, Battlemap, DM Planning, and Homebrew Workshop.
 * - Manages object URLs so they are revoked only when a map is deleted or replaced.
 * - STRICTLY NON-AUTHORITATIVE: This is in-memory frontend session state only.
 *   It does NOT claim database persistence or alter canonical Python R1 state.
 */

import {
  SAMPLE_BATTLEMAPS,
  type BattlemapDefinition,
  type MapGeometry,
  type MapBackgroundArtwork,
  type MapGridConfig,
  type MapTokenPlacement,
} from '../types/battlemap.ts';

export class BattlemapSessionManager {
  private maps: BattlemapDefinition[];
  private activeMapId: string;
  private undoStacks: Record<string, MapGeometry[]> = {};
  private redoStacks: Record<string, MapGeometry[]> = {};
  private blobUrlRefCounts: Map<string, number> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.maps = JSON.parse(JSON.stringify(SAMPLE_BATTLEMAPS));
    this.activeMapId = this.maps[0]?.id || 'map-yawning-portal';
  }

  public retainBlobUrl(url: string): void {
    if (!url || !url.startsWith('blob:')) return;
    const count = this.blobUrlRefCounts.get(url) || 0;
    this.blobUrlRefCounts.set(url, count + 1);
  }

  public releaseBlobUrl(url: string): void {
    if (!url || !url.startsWith('blob:')) return;
    const count = this.blobUrlRefCounts.get(url) || 0;
    if (count <= 1) {
      this.blobUrlRefCounts.delete(url);
      try {
        if (typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
          window.URL.revokeObjectURL(url);
        }
      } catch {
        // ignore
      }
    } else {
      this.blobUrlRefCounts.set(url, count - 1);
    }
  }

  public getBlobRefCount(url: string): number {
    return this.blobUrlRefCounts.get(url) || 0;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public getMaps(): BattlemapDefinition[] {
    return this.maps;
  }

  public getActiveMapId(): string {
    return this.activeMapId;
  }

  public getActiveMap(): BattlemapDefinition {
    const found = this.maps.find((m) => m.id === this.activeMapId);
    return found || this.maps[0];
  }

  public setActiveMapId(id: string): void {
    if (this.maps.some((m) => m.id === id)) {
      this.activeMapId = id;
      this.notify();
    }
  }

  public updateGeometry(mapId: string, newGeometry: MapGeometry): void {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return;

    // Record undo state
    const currentUndo = this.undoStacks[mapId] || [];
    this.undoStacks[mapId] = [...currentUndo, JSON.parse(JSON.stringify(map.geometry))];
    // Clear redo state on fresh modification
    this.redoStacks[mapId] = [];

    // Apply update
    this.maps = this.maps.map((m) =>
      m.id === mapId ? { ...m, geometry: newGeometry } : m
    );

    this.notify();
  }

  public canUndo(mapId: string): boolean {
    return (this.undoStacks[mapId] || []).length > 0;
  }

  public canRedo(mapId: string): boolean {
    return (this.redoStacks[mapId] || []).length > 0;
  }

  public undo(mapId: string): boolean {
    const stack = this.undoStacks[mapId] || [];
    if (stack.length === 0) return false;

    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return false;

    const previousGeometry = stack[stack.length - 1];
    this.undoStacks[mapId] = stack.slice(0, stack.length - 1);

    // Push current to redo
    const currentRedo = this.redoStacks[mapId] || [];
    this.redoStacks[mapId] = [...currentRedo, JSON.parse(JSON.stringify(map.geometry))];

    // Restore previous
    this.maps = this.maps.map((m) =>
      m.id === mapId ? { ...m, geometry: previousGeometry } : m
    );

    this.notify();
    return true;
  }

  public redo(mapId: string): boolean {
    const stack = this.redoStacks[mapId] || [];
    if (stack.length === 0) return false;

    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return false;

    const nextGeometry = stack[stack.length - 1];
    this.redoStacks[mapId] = stack.slice(0, stack.length - 1);

    // Push current to undo
    const currentUndo = this.undoStacks[mapId] || [];
    this.undoStacks[mapId] = [...currentUndo, JSON.parse(JSON.stringify(map.geometry))];

    // Apply next
    this.maps = this.maps.map((m) =>
      m.id === mapId ? { ...m, geometry: nextGeometry } : m
    );

    this.notify();
    return true;
  }

  public addCustomMap(newMap: BattlemapDefinition): void {
    if (newMap.backgroundArtwork?.isLocalBlob && newMap.backgroundArtwork.url) {
      this.retainBlobUrl(newMap.backgroundArtwork.url);
    }
    this.maps = [...this.maps, newMap];
    this.activeMapId = newMap.id;
    this.notify();
  }

  public createBlankMap(config: {
    name: string;
    sceneSummary?: string;
    width?: number;
    height?: number;
    feetPerCell?: number;
    cellSizePx?: number;
    backgroundColor?: string;
    fogEnabled?: boolean;
    defaultFogState?: 'hidden' | 'revealed';
  }): BattlemapDefinition {
    const id = `map-blank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const width = Math.max(5, Math.min(60, config.width || 20));
    const height = Math.max(5, Math.min(60, config.height || 16));
    const feetPerCell = config.feetPerCell || 5;
    const cellSizePx = config.cellSizePx || 40;
    const fogEnabled = config.fogEnabled ?? false;
    const defaultFogState = config.defaultFogState ?? 'revealed';

    const newMap: BattlemapDefinition = {
      id,
      name: config.name.trim() || 'Untitled Blank Map',
      locationId: `loc-${id}`,
      sceneSummary: config.sceneSummary?.trim() || 'A blank, unconfigured tactical battlemap.',
      backgroundColor: config.backgroundColor || '#18181b',
      grid: {
        width,
        height,
        cellSizePx,
        feetPerCell,
        showGrid: true,
        gridColor: 'rgba(255, 255, 255, 0.15)',
      },
      geometry: {
        rooms: [],
        corridors: [],
        walls: [],
        doors: [],
        windows: [],
        railings: [],
        terrain: [],
      },
      fog: {
        enabled: fogEnabled,
        defaultState: defaultFogState,
        revealedCells: [],
        hiddenCells: [],
        exploredCells: [],
        previousExploredCells: [],
        partySharedVision: true,
        autoComputeTokenLos: true,
      },
      lineOfSight: {
        enabled: true,
        blocksOnWalls: true,
        blocksOnClosedDoors: true,
        maxSightRadiusFeet: 60,
        defaultSightRadiusFeet: 60,
      },
      tokens: [],
    };

    this.maps = [...this.maps, newMap];
    this.activeMapId = id;
    this.undoStacks[id] = [];
    this.redoStacks[id] = [];
    this.notify();
    return newMap;
  }

  public renameMap(mapId: string, newName: string, newSummary?: string): void {
    const trimmed = newName.trim();
    if (!trimmed) return;
    this.maps = this.maps.map((m) => {
      if (m.id !== mapId) return m;
      return {
        ...m,
        name: trimmed,
        sceneSummary: newSummary !== undefined ? newSummary.trim() : m.sceneSummary,
      };
    });
    this.notify();
  }

  public duplicateMap(mapId: string): BattlemapDefinition | null {
    const sourceMap = this.maps.find((m) => m.id === mapId);
    if (!sourceMap) return null;

    const newId = `${sourceMap.id}-copy-${Date.now().toString(36)}`;
    const cloned: BattlemapDefinition = JSON.parse(JSON.stringify(sourceMap));
    cloned.id = newId;
    cloned.name = `${sourceMap.name} (Copy)`;
    cloned.locationId = `loc-${newId}`;

    if (cloned.backgroundArtwork?.isLocalBlob && cloned.backgroundArtwork.url) {
      this.retainBlobUrl(cloned.backgroundArtwork.url);
    }

    this.maps = [...this.maps, cloned];
    this.activeMapId = newId;
    this.undoStacks[newId] = [];
    this.redoStacks[newId] = [];
    this.notify();
    return cloned;
  }

  public deleteMap(mapId: string): boolean {
    if (this.maps.length <= 1) {
      return false; // Guard against deleting the last remaining map
    }

    const targetMap = this.maps.find((m) => m.id === mapId);
    if (targetMap?.backgroundArtwork?.isLocalBlob && targetMap.backgroundArtwork.url) {
      this.releaseBlobUrl(targetMap.backgroundArtwork.url);
    }

    this.maps = this.maps.filter((m) => m.id !== mapId);
    delete this.undoStacks[mapId];
    delete this.redoStacks[mapId];

    if (this.activeMapId === mapId) {
      this.activeMapId = this.maps[0]?.id || '';
    }

    this.notify();
    return true;
  }

  public updateToken(mapId: string, tokenId: string, patch: Partial<MapTokenPlacement>): void {
    this.maps = this.maps.map((m) => {
      if (m.id !== mapId) return m;
      return {
        ...m,
        tokens: m.tokens.map((tok) => (tok.id === tokenId ? { ...tok, ...patch } : tok)),
      };
    });
    this.notify();
  }

  public updateTokens(mapId: string, tokens: MapTokenPlacement[]): void {
    this.maps = this.maps.map((m) => {
      if (m.id !== mapId) return m;
      return {
        ...m,
        tokens,
      };
    });
    this.notify();
  }

  public updateArtwork(mapId: string, patch: Partial<MapBackgroundArtwork>): void {
    const existing = this.maps.find((m) => m.id === mapId);
    if (existing?.backgroundArtwork) {
      const oldUrl = existing.backgroundArtwork.url;
      const oldIsBlob = existing.backgroundArtwork.isLocalBlob;
      const newUrl = patch.url !== undefined ? patch.url : oldUrl;
      const newIsBlob = patch.isLocalBlob !== undefined ? patch.isLocalBlob : oldIsBlob;

      if (oldIsBlob && oldUrl && newUrl !== oldUrl) {
        this.releaseBlobUrl(oldUrl);
      }
      if (newIsBlob && newUrl && newUrl !== oldUrl) {
        this.retainBlobUrl(newUrl);
      }
    }

    this.maps = this.maps.map((m) => {
      if (m.id !== mapId || !m.backgroundArtwork) return m;
      return {
        ...m,
        backgroundArtwork: {
          ...m.backgroundArtwork,
          ...patch,
        },
      };
    });
    this.notify();
  }

  public updateGrid(mapId: string, patch: Partial<MapGridConfig>): void {
    this.maps = this.maps.map((m) => {
      if (m.id !== mapId) return m;
      return {
        ...m,
        grid: {
          ...m.grid,
          ...patch,
        },
      };
    });
    this.notify();
  }

  public updateFog(
    mapId: string,
    patchOrFn: Partial<import('../types/battlemap.ts').FogOfWarState> | ((prev: import('../types/battlemap.ts').FogOfWarState) => import('../types/battlemap.ts').FogOfWarState)
  ): void {
    this.maps = this.maps.map((m) => {
      if (m.id !== mapId) return m;
      const newFog = typeof patchOrFn === 'function' ? patchOrFn(m.fog) : { ...m.fog, ...patchOrFn };
      return {
        ...m,
        fog: newFog,
      };
    });
    this.notify();
  }

  public updateLineOfSight(
    mapId: string,
    patch: Partial<import('../types/battlemap.ts').LineOfSightConfig>
  ): void {
    this.maps = this.maps.map((m) => {
      if (m.id !== mapId) return m;
      return {
        ...m,
        lineOfSight: {
          ...m.lineOfSight,
          ...patch,
        },
      };
    });
    this.notify();
  }

  public hydrateFromBackendProjection(battlemapState: any): void {
    if (!battlemapState || typeof battlemapState !== 'object') return;

    let hasChanged = false;
    const mapConfigs = battlemapState.mapConfigs || {};

    // 1. Update existing maps or append new maps declared in authoritative projection
    for (const [mapId, cfg] of Object.entries<any>(mapConfigs)) {
      if (!cfg || typeof cfg !== 'object') continue;

      const existingMap = this.maps.find((m) => m.id === mapId);
      if (existingMap) {
        let mapModified = false;

        // Hydrate Grid dimensions and calibration offsets
        if (cfg.gridDimensions) {
          const prevGrid = existingMap.grid;
          existingMap.grid = {
            ...prevGrid,
            ...(cfg.gridDimensions.width !== undefined ? { width: cfg.gridDimensions.width } : {}),
            ...(cfg.gridDimensions.height !== undefined ? { height: cfg.gridDimensions.height } : {}),
            ...(cfg.gridDimensions.cellSizePx !== undefined ? { cellSizePx: cfg.gridDimensions.cellSizePx } : {}),
            ...(cfg.gridDimensions.originX !== undefined ? { originX: cfg.gridDimensions.originX } : {}),
            ...(cfg.gridDimensions.originY !== undefined ? { originY: cfg.gridDimensions.originY } : {}),
          };
          mapModified = true;
        }

        // Hydrate Background artwork and calibration metadata
        if (cfg.backgroundArtwork) {
          const prevArt = existingMap.backgroundArtwork || {
            url: '',
            name: 'Artwork',
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            opacity: 1.0,
          };
          existingMap.backgroundArtwork = {
            ...prevArt,
            ...cfg.backgroundArtwork,
            calibration: cfg.backgroundArtwork.calibration
              ? {
                  ...(prevArt.calibration || { pitchPxPerCell: existingMap.grid.cellSizePx, originOffsetX: 0, originOffsetY: 0 }),
                  ...cfg.backgroundArtwork.calibration,
                }
              : prevArt.calibration,
          };
          mapModified = true;
        }

        // Hydrate Geometry if present
        if (cfg.geometry) {
          existingMap.geometry = {
            ...existingMap.geometry,
            ...cfg.geometry,
          };
          mapModified = true;
        }

        if (mapModified) {
          hasChanged = true;
        }
      } else {
        // Map does not exist in local sample set: instantiate new BattlemapDefinition from authoritative state
        const newMap: BattlemapDefinition = {
          id: mapId,
          name: cfg.name || cfg.mapName || mapId,
          locationId: cfg.locationId || `loc-${mapId}`,
          sceneSummary: cfg.sceneSummary || 'Synchronized tactical battlemap from server projection.',
          grid: {
            width: cfg.gridDimensions?.width || 20,
            height: cfg.gridDimensions?.height || 20,
            cellSizePx: cfg.gridDimensions?.cellSizePx || 40,
            feetPerCell: cfg.gridDimensions?.feetPerCell || 5,
            showGrid: true,
            gridColor: 'rgba(255, 255, 255, 0.2)',
            originX: cfg.gridDimensions?.originX || 0,
            originY: cfg.gridDimensions?.originY || 0,
          },
          backgroundArtwork: cfg.backgroundArtwork
            ? {
                url: cfg.backgroundArtwork.url || '',
                name: cfg.backgroundArtwork.name || 'Artwork',
                scale: cfg.backgroundArtwork.scale ?? 1.0,
                offsetX: cfg.backgroundArtwork.offsetX ?? 0,
                offsetY: cfg.backgroundArtwork.offsetY ?? 0,
                opacity: cfg.backgroundArtwork.opacity ?? 0.8,
                calibration: cfg.backgroundArtwork.calibration,
              }
            : undefined,
          geometry: {
            rooms: cfg.geometry?.rooms || [],
            corridors: cfg.geometry?.corridors || [],
            walls: cfg.geometry?.walls || [],
            doors: cfg.geometry?.doors || [],
            windows: cfg.geometry?.windows || [],
            railings: cfg.geometry?.railings || [],
            terrain: cfg.geometry?.terrain || [],
          },
          fog: {
            enabled: battlemapState.fogEnabled ?? false,
            defaultState: 'revealed',
            revealedCells: battlemapState.revealedCells || [],
            hiddenCells: [],
            exploredCells: battlemapState.revealedCells || [],
            partySharedVision: true,
            autoComputeTokenLos: true,
          },
          lineOfSight: {
            enabled: true,
            blocksOnWalls: true,
            blocksOnClosedDoors: true,
            maxSightRadiusFeet: 60,
            defaultSightRadiusFeet: 60,
          },
          tokens: [],
        };
        this.maps.push(newMap);
        hasChanged = true;
      }
    }

    // 2. Synchronize active map doors and fog if present on activeMapId
    if (battlemapState.activeMapId) {
      const active = this.maps.find((m) => m.id === battlemapState.activeMapId);
      if (active) {
        if(this.activeMapId!==active.id){this.activeMapId=active.id;hasChanged=true;}
        if (battlemapState.revealedCells && Array.isArray(battlemapState.revealedCells)) {
          active.fog.revealedCells = [...battlemapState.revealedCells];
          hasChanged = true;
        }
      }
    }

    if (hasChanged) {
      this.notify();
    }
  }

  /**
   * Clears privileged DM-only geometry, cached undo/redo stacks, and confidential metadata
   * when transitioning to a Player or Observer identity or entering Player Preview mode.
   */
  public clearPrivilegedCache(): void {
    // 1. Clear all undo/redo history stacks
    this.undoStacks = {};
    this.redoStacks = {};

    // 2. Sanitize privileged geometry from all cached session maps
    for (const map of this.maps) {
      if (map.backgroundArtwork) {
        delete (map.backgroundArtwork as any).dmOverlayUrl;
        delete (map.backgroundArtwork as any).secretMapUrl;
        delete (map.backgroundArtwork as any).dmNotes;
        if ((map.backgroundArtwork as any).playerArtworkUrl) {
          map.backgroundArtwork.url = (map.backgroundArtwork as any).playerArtworkUrl;
        }
      }

      if (map.geometry) {
        // Strip secret doors unless open
        if (map.geometry.doors) {
          map.geometry.doors = map.geometry.doors
            .filter((d: any) => !d.isSecret || d.state === 'open')
            .map((d: any) => {
              const copy = { ...d };
              delete copy.dmNotes;
              delete copy.secretDc;
              delete copy.lockpickDc;
              delete copy.keyId;
              return copy;
            });
        }

        // Strip secret windows unless open/broken
        if (map.geometry.windows) {
          map.geometry.windows = map.geometry.windows
            .filter((w: any) => !w.isSecret || w.state === 'broken' || w.state === 'open')
            .map((w: any) => {
              const copy = { ...w };
              delete copy.dmNotes;
              delete copy.secretDc;
              return copy;
            });
        }

        // Strip DM-only, secret, or hazard terrain zones
        if (map.geometry.terrain) {
          map.geometry.terrain = map.geometry.terrain.filter(
            (t: any) => t.isVisibleToPlayers !== false && !t.isHazard && !t.isSecret && !t.isDmOnly
          );
        }
      }

      // Filter hidden/DM-only tokens
      if (map.tokens) {
        map.tokens = map.tokens.filter((tok: any) => !tok.isHidden && !tok.isDmOnly);
      }
    }

    this.notify();
  }

  public resetToDefaults(): void {
    // Revoke all tracked blobs safely
    this.blobUrlRefCounts.forEach((_, url) => {
      try {
        if (typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
          window.URL.revokeObjectURL(url);
        }
      } catch {
        // ignore
      }
    });
    this.blobUrlRefCounts.clear();

    this.maps = JSON.parse(JSON.stringify(SAMPLE_BATTLEMAPS));
    this.activeMapId = this.maps[0]?.id || 'map-yawning-portal';
    this.undoStacks = {};
    this.redoStacks = {};
    this.notify();
  }
}

// Global session singleton instance for application workspace continuity
export const battlemapSessionManager = new BattlemapSessionManager();
