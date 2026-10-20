import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BattlemapSessionManager } from './battlemapSession.ts';
import type { RectangularRoom, BattlemapDefinition } from '../types/battlemap.ts';

describe('Battlemap Session Lifecycle & Workspace Persistence (AIUI-CP002B1)', () => {
  it('initializes with sample maps and default active map', () => {
    const session = new BattlemapSessionManager();
    const maps = session.getMaps();
    assert.ok(maps.length >= 3);
    assert.equal(session.getActiveMapId(), 'map-yawning-portal');
    assert.equal(session.getActiveMap().id, 'map-yawning-portal');
  });

  it('preserves geometry edits across active map switching and simulates workspace navigation', () => {
    const session = new BattlemapSessionManager();
    const activeMap = session.getActiveMap();

    const newRoom: RectangularRoom = {
      id: 'custom-chamber-test',
      name: 'Secret Chamber',
      x: 3,
      y: 3,
      width: 5,
      height: 5,
      floorType: 'stone',
    };

    // Add room to active map
    session.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      rooms: [...activeMap.geometry.rooms, newRoom],
    });

    // Verify room added
    let currentRooms = session.getActiveMap().geometry.rooms;
    assert.ok(currentRooms.some((r) => r.id === 'custom-chamber-test'));

    // Switch to another map (e.g. user goes to Sunken Vault)
    session.setActiveMapId('map-sunken-vault');
    assert.equal(session.getActiveMapId(), 'map-sunken-vault');

    // Simulate user navigating to Play / Host workspace and returning to Yawning Portal
    session.setActiveMapId('map-yawning-portal');
    currentRooms = session.getActiveMap().geometry.rooms;

    // Room must still be present!
    assert.ok(currentRooms.some((r) => r.id === 'custom-chamber-test'));
  });

  it('manages map-specific undo and redo stacks reliably', () => {
    const session = new BattlemapSessionManager();
    const mapId = 'map-high-road';
    session.setActiveMapId(mapId);

    const initialRoomCount = session.getActiveMap().geometry.rooms.length;

    const newRoom: RectangularRoom = {
      id: 'test-room-undo',
      name: 'Tower Annex',
      x: 10,
      y: 10,
      width: 4,
      height: 4,
      floorType: 'wood',
    };

    // Perform edit
    session.updateGeometry(mapId, {
      ...session.getActiveMap().geometry,
      rooms: [...session.getActiveMap().geometry.rooms, newRoom],
    });

    assert.equal(session.canUndo(mapId), true);
    assert.equal(session.getActiveMap().geometry.rooms.length, initialRoomCount + 1);

    // Perform Undo
    const undone = session.undo(mapId);
    assert.equal(undone, true);
    assert.equal(session.getActiveMap().geometry.rooms.length, initialRoomCount);
    assert.equal(session.canRedo(mapId), true);

    // Perform Redo
    const redone = session.redo(mapId);
    assert.equal(redone, true);
    assert.equal(session.getActiveMap().geometry.rooms.length, initialRoomCount + 1);
  });

  it('allows adding and deleting custom imported maps without affecting defaults', () => {
    const session = new BattlemapSessionManager();
    const initialCount = session.getMaps().length;

    const customMap: BattlemapDefinition = {
      id: 'custom-session-map-1',
      name: 'Custom Sewer Map',
      locationId: 'loc-custom',
      sceneSummary: 'Session imported sewer',
      grid: {
        width: 15,
        height: 15,
        cellSizePx: 40,
        feetPerCell: 5,
        showGrid: true,
        gridColor: 'rgba(255,255,255,0.2)',
      },
      geometry: { rooms: [], corridors: [], walls: [], doors: [] },
      fog: { enabled: false, defaultState: 'revealed', revealedCells: [], exploredCells: [], previousExploredCells: [] },
      lineOfSight: { enabled: false, blocksOnWalls: true, blocksOnClosedDoors: true, maxSightRadiusFeet: 60 },
      tokens: [],
    };

    session.addCustomMap(customMap);
    assert.equal(session.getMaps().length, initialCount + 1);
    assert.equal(session.getActiveMapId(), 'custom-session-map-1');

    session.deleteMap('custom-session-map-1');
    assert.equal(session.getMaps().length, initialCount);
    assert.notEqual(session.getActiveMapId(), 'custom-session-map-1');
  });

  it('updates and persists map-specific Fog of War and Line of Sight configurations across sessions', () => {
    const session = new BattlemapSessionManager();
    const mapId = 'map-yawning-portal';
    session.setActiveMapId(mapId);

    // Initial state check
    assert.equal(session.getActiveMap().fog.enabled, false);

    // Enable fog and set custom revealed cells
    session.updateFog(mapId, {
      enabled: true,
      revealedCells: ['4,4', '4,5', '5,4'],
      previewPlayerFog: true,
    });

    assert.equal(session.getActiveMap().fog.enabled, true);
    assert.deepEqual(session.getActiveMap().fog.revealedCells, ['4,4', '4,5', '5,4']);
    assert.equal(session.getActiveMap().fog.previewPlayerFog, true);

    // Update Line of Sight default sight radius
    session.updateLineOfSight(mapId, {
      defaultSightRadiusFeet: 120,
    });

    assert.equal(session.getActiveMap().lineOfSight.defaultSightRadiusFeet, 120);

    // Switching maps does not overwrite or lose Yawning Portal fog config
    session.setActiveMapId('map-sunken-vault');
    assert.equal(session.getActiveMap().id, 'map-sunken-vault');
    assert.equal(session.getActiveMap().lineOfSight.defaultSightRadiusFeet, 30);

    // Returning to Yawning Portal retains all fog and LOS changes
    session.setActiveMapId('map-yawning-portal');
    assert.equal(session.getActiveMap().fog.enabled, true);
    assert.deepEqual(session.getActiveMap().fog.revealedCells, ['4,4', '4,5', '5,4']);
    assert.equal(session.getActiveMap().lineOfSight.defaultSightRadiusFeet, 120);
  });
});
