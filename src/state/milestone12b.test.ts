import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BattlemapSessionManager } from './battlemapSession.ts';
import type { BattlemapDefinition } from '../types/battlemap.ts';

describe('Milestone 12B — Trust, Physical Dice & Spatial Secrecy Frontend Gates', () => {
  it('clearPrivilegedCache() purges undo/redo history, secret geometry, and DM artwork overlays', () => {
    const session = new BattlemapSessionManager();

    // 1. Create a custom battlemap with secret doors, secret windows, hazard terrain, and DM overlay artwork
    const privilegedMap: BattlemapDefinition = {
      id: 'map-sanctum-secret',
      name: 'Sanctum Sanctorum',
      locationId: 'loc-sanctum',
      sceneSummary: 'Secret DM sanctum with confidential traps and secret doors.',
      grid: {
        width: 25,
        height: 25,
        cellSizePx: 40,
        feetPerCell: 5,
        showGrid: true,
        gridColor: 'rgba(255, 255, 255, 0.2)',
      },
      backgroundArtwork: {
        url: '/api/v2/battlemap/assets/dm-full-sanctum',
        name: 'Sanctum Artwork',
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        opacity: 0.8,
        playerArtworkUrl: '/api/v2/battlemap/assets/player-safe-sanctum',
        dmOverlayUrl: '/api/v2/battlemap/assets/dm-overlay-traps',
        secretMapUrl: '/api/v2/battlemap/assets/dm-secret-tunnels',
        dmNotes: 'Pressure plate triggers ceiling collapse at (10, 12)',
      } as any,
      geometry: {
        rooms: [],
        corridors: [],
        walls: [],
        doors: [
          {
            id: 'door-secret-vault',
            x: 5,
            y: 5,
            orientation: 'horizontal',
            state: 'closed',
            blocksVisionWhenClosed: true,
            isSecret: true,
            secretDc: 20,
            dmNotes: 'Requires ruby key',
          } as any,
          {
            id: 'door-public-nave',
            x: 10,
            y: 10,
            orientation: 'vertical',
            state: 'closed',
            blocksVisionWhenClosed: true,
            isSecret: false,
            dmNotes: 'Slightly rusted',
            secretDc: 10,
          } as any,
        ],
        windows: [
          {
            id: 'win-secret-slit',
            x: 2,
            y: 2,
            orientation: 'horizontal',
            state: 'clear',
            isSecret: true,
            secretDc: 18,
            dmNotes: 'Arrow slit covered by tapestry',
          } as any,
          {
            id: 'win-stained-glass',
            x: 8,
            y: 8,
            orientation: 'vertical',
            state: 'clear',
            isSecret: false,
            dmNotes: 'Depicts deity of war',
          } as any,
        ],
        railings: [],
        terrain: [
          {
            id: 'zone-hidden-spikes',
            name: 'Spike Trap Zone',
            x: 12,
            y: 12,
            width: 4,
            height: 4,
            terrainType: 'custom',
            movementCostMultiplier: 2,
            isHazard: true,
            isSecret: true,
          } as any,
          {
            id: 'zone-mud',
            name: 'Muddy Waters',
            x: 1,
            y: 1,
            width: 3,
            height: 3,
            terrainType: 'mud',
            movementCostMultiplier: 2,
            isVisibleToPlayers: true,
          },
        ],
      },
      tokens: [
        {
          id: 'tok-hidden-lich',
          name: 'Lich King',
          x: 14,
          y: 14,
          entityType: 'npc',
          size: 'medium',
          isHidden: true,
        } as any,
        {
          id: 'tok-paladin',
          name: 'Kaelen',
          x: 4,
          y: 4,
          entityType: 'character',
          size: 'medium',
          isHidden: false,
        },
      ],
      fog: {
        enabled: true,
        defaultState: 'unexplored',
        revealedCells: [],
        hiddenCells: [],
        exploredCells: [],
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
    };

    session.addCustomMap(privilegedMap);
    session.setActiveMapId('map-sanctum-secret');

    // Simulate geometry edit pushing to undo stack
    session.updateGeometry('map-sanctum-secret', {
      ...privilegedMap.geometry,
      rooms: [
        {
          id: 'room-priv-1',
          name: 'Privileged Room',
          x: 0,
          y: 0,
          width: 5,
          height: 5,
          floorType: 'stone',
        },
      ],
    });
    assert.equal(session.canUndo('map-sanctum-secret'), true);

    // 2. Perform clearPrivilegedCache() (triggered on role switch to player/observer or preview)
    session.clearPrivilegedCache();

    // 3. Verify undo/redo stacks are emptied to prevent undo-inspection of DM edits
    assert.equal(session.canUndo('map-sanctum-secret'), false);
    assert.equal(session.canRedo('map-sanctum-secret'), false);

    // 4. Verify privileged map is sanitized
    const sanitizedMap = session.getMaps().find((m) => m.id === 'map-sanctum-secret')!;
    assert.ok(sanitizedMap);

    // Background artwork secrets stripped & playerArtworkUrl substituted
    const art = sanitizedMap.backgroundArtwork as any;
    assert.equal(art.url, '/api/v2/battlemap/assets/player-safe-sanctum');
    assert.equal(art.dmOverlayUrl, undefined);
    assert.equal(art.secretMapUrl, undefined);
    assert.equal(art.dmNotes, undefined);

    // Secret doors stripped; remaining doors stripped of confidential metadata
    const doors = sanitizedMap.geometry.doors as any[];
    assert.equal(doors.length, 1);
    assert.equal(doors[0].id, 'door-public-nave');
    assert.equal(doors[0].dmNotes, undefined);
    assert.equal(doors[0].secretDc, undefined);

    // Secret windows stripped; remaining windows stripped of confidential metadata
    const windows = sanitizedMap.geometry.windows as any[];
    assert.equal(windows.length, 1);
    assert.equal(windows[0].id, 'win-stained-glass');
    assert.equal(windows[0].dmNotes, undefined);
    assert.equal(windows[0].secretDc, undefined);

    // Secret/hazard terrain stripped
    const terrain = sanitizedMap.geometry.terrain as any[];
    assert.equal(terrain.length, 1);
    assert.equal(terrain[0].id, 'zone-mud');

    // Hidden tokens stripped
    const tokens = sanitizedMap.tokens as any[];
    assert.equal(tokens.length, 1);
    assert.equal(tokens[0].id, 'tok-paladin');
  });

  it('hydration from backend projection preserves durable asset URLs and grid dimensions', () => {
    const session = new BattlemapSessionManager();

    session.hydrateFromBackendProjection({
      activeMapId: 'map-vault-durable',
      mapConfigs: {
        'map-vault-durable': {
          name: 'Durable Crypt',
          gridDimensions: {
            width: 32,
            height: 24,
            cellSizePx: 45,
            originX: 10,
            originY: 15,
          },
          backgroundArtwork: {
            url: '/api/v2/battlemap/assets/asset-durable-987',
            name: 'Crypt Map',
            scale: 1.0,
            offsetX: 5,
            offsetY: 5,
            opacity: 0.9,
          },
        },
      },
    });

    const map = session.getMaps().find((m) => m.id === 'map-vault-durable');
    assert.ok(map);
    assert.equal(map.grid.width, 32);
    assert.equal(map.grid.height, 24);
    assert.equal(map.grid.cellSizePx, 45);
    assert.equal(map.grid.originX, 10);
    assert.equal(map.grid.originY, 15);
    assert.equal(map.backgroundArtwork?.url, '/api/v2/battlemap/assets/asset-durable-987');
    assert.equal(map.backgroundArtwork?.isLocalBlob, undefined);
  });
});
