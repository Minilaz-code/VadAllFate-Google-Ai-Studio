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
  private blobUrls: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.maps = JSON.parse(JSON.stringify(SAMPLE_BATTLEMAPS));
    this.activeMapId = this.maps[0]?.id || 'map-yawning-portal';
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
      this.blobUrls.add(newMap.backgroundArtwork.url);
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
      try {
        if (typeof window !== 'undefined' && window.URL) {
          window.URL.revokeObjectURL(targetMap.backgroundArtwork.url);
        }
      } catch {
        // ignore
      }
      this.blobUrls.delete(targetMap.backgroundArtwork.url);
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

  public resetToDefaults(): void {
    // Revoke all tracked blobs
    this.blobUrls.forEach((url) => {
      try {
        if (typeof window !== 'undefined' && window.URL) {
          window.URL.revokeObjectURL(url);
        }
      } catch {
        // ignore
      }
    });
    this.blobUrls.clear();

    this.maps = JSON.parse(JSON.stringify(SAMPLE_BATTLEMAPS));
    this.activeMapId = this.maps[0]?.id || 'map-yawning-portal';
    this.undoStacks = {};
    this.redoStacks = {};
    this.notify();
  }
}

// Global session singleton instance for application workspace continuity
export const battlemapSessionManager = new BattlemapSessionManager();
