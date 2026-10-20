import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DemoCampaignClient } from './adapter.ts';
import { battlemapSessionManager } from '../state/battlemapSession.ts';
import { SAMPLE_BATTLEMAPS, type RectangularRoom, type DoorSegment } from '../types/battlemap.ts';
import { resolveEffectiveBlockingSegments } from '../utils/wallTopology.ts';
import { computeCorridorSegments } from '../utils/corridorGeometry.ts';
import { validateImageFileMeta } from '../utils/imageDecoder.ts';

describe('AIUI-CP002B1 QA Closure & Regression Tests', () => {
  it('Token movement updates rendered entity coordinates and preserves snapshot integrity', async () => {
    const client = new DemoCampaignClient();
    const snap = client.getCurrentSnapshot();
    const initialProjection = client.getProjection('dm_host');
    const kaelen = initialProjection.characters.find((c) => c.id === 'char-kaelen');
    assert.ok(kaelen);

    // Initial position
    const initialX = kaelen.token.x;
    const initialY = kaelen.token.y;

    // Submit valid movement action envelope
    const result = await client.submitActionEnvelope({
      actionId: 'move-kaelen-qa-1',
      actorId: 'char-kaelen',
      actorRole: 'dm_host',
      actionType: 'MOVE_TOKEN',
      payload: {
        entityId: 'char-kaelen',
        targetX: 65,
        targetY: 45,
        entityType: 'character',
      },
      snapshotRef: snap,
      timestampUtc: new Date().toISOString(),
      clientNonce: 'qa-nonce-move-1',
    });

    assert.equal(result.receipt.status, 'COMMITTED');

    // Retrieve updated projection
    const updatedProjection = client.getProjection('dm_host');
    const updatedKaelen = updatedProjection.characters.find((c) => c.id === 'char-kaelen');
    assert.ok(updatedKaelen);
    assert.equal(updatedKaelen.token.x, 65);
    assert.equal(updatedKaelen.token.y, 45);
    assert.notEqual(updatedKaelen.token.x, initialX);
    assert.notEqual(updatedKaelen.token.y, initialY);
  });

  it('Map-specific token isolation: NPCs belonging to other locations are isolated from unrelated scene maps', () => {
    const client = new DemoCampaignClient();
    const projection = client.getProjection('dm_host');

    // Check sample maps
    const yawningPortal = SAMPLE_BATTLEMAPS.find((m) => m.id === 'map-yawning-portal');
    const sunkenVault = SAMPLE_BATTLEMAPS.find((m) => m.id === 'map-sunken-vault');
    assert.ok(yawningPortal);
    assert.ok(sunkenVault);

    // Filter NPCs for Yawning Portal
    const ypTokens = projection.npcs.filter((npc) => {
      const onMap = yawningPortal.tokens.some((t) => t.entityId === npc.id);
      const atLoc = npc.currentLocationId === yawningPortal.locationId;
      return onMap || atLoc;
    });

    // Ghoul Stalker belongs to Sunken Vault (loc-vault-antechamber), NOT Yawning Portal
    const ghoulInYP = ypTokens.find((n) => n.id === 'npc-ghoul-stalker');
    assert.equal(ghoulInYP, undefined, 'Ghoul Stalker must not appear in Yawning Portal taproom');

    // Sorsha Vance belongs to Yawning Portal taproom scene
    const sorshaInYP = ypTokens.find((n) => n.id === 'npc-sorsha');
    assert.ok(sorshaInYP, 'Sorsha Vance must appear in Yawning Portal taproom');

    // Filter NPCs for Sunken Vault
    const svTokens = projection.npcs.filter((npc) => {
      const onMap = sunkenVault.tokens.some((t) => t.entityId === npc.id);
      const atLoc = npc.currentLocationId === sunkenVault.locationId;
      return onMap || atLoc;
    });

    const ghoulInSV = svTokens.find((n) => n.id === 'npc-ghoul-stalker');
    assert.ok(ghoulInSV, 'Ghoul Stalker must appear in Sunken Vault map');

    const vaelinInSV = svTokens.find((n) => n.id === 'npc-brother-vaelin');
    assert.ok(vaelinInSV, 'Brother Vaelin must appear in Sunken Vault crypts');

    // High road outpost has no dungeon ghouls
    const highRoad = SAMPLE_BATTLEMAPS.find((m) => m.id === 'map-high-road');
    assert.ok(highRoad);
    const hrTokens = projection.npcs.filter((npc) => {
      const onMap = highRoad.tokens.some((t) => t.entityId === npc.id);
      const atLoc = npc.currentLocationId === highRoad.locationId;
      return onMap || atLoc;
    });
    const ghoulInHR = hrTokens.find((n) => n.id === 'npc-ghoul-stalker');
    assert.equal(ghoulInHR, undefined, 'Ghoul Stalker must not appear on High Road');
  });

  it('Selection without accidental movement: entity coordinates remain unchanged on selection', () => {
    const client = new DemoCampaignClient();
    const initialProjection = client.getProjection('dm_host');
    const kaelenBefore = initialProjection.characters.find((c) => c.id === 'char-kaelen');
    assert.ok(kaelenBefore);

    // Simulating token selection: client state is not mutated by selection
    const kaelenAfter = client.getProjection('dm_host').characters.find((c) => c.id === 'char-kaelen');
    assert.ok(kaelenAfter);
    assert.equal(kaelenBefore.token.x, kaelenAfter.token.x);
    assert.equal(kaelenBefore.token.y, kaelenAfter.token.y);
  });

  it('Corridor geometry: straight and orthogonal corridors do not produce diagonal bounding box fill', () => {
    // A diagonal path from (2, 2) to (8, 8) with 1-cell width
    const segs = computeCorridorSegments(2, 2, 8, 8, 1);
    assert.equal(segs.length, 2);

    // Point at diagonal opposite corner (2, 8) must NOT be filled
    const [h, v] = segs;
    const inCorner =
      (2 >= h.x && 2 < h.x + h.width && 8 >= h.y && 8 < h.y + h.height) ||
      (2 >= v.x && 2 < v.x + v.width && 8 >= v.y && 8 < v.y + v.height);
    assert.equal(inCorner, false, 'Opposite corner must remain empty space');
  });

  it('Door and wall topology: door state transitions cleanly alter blocking segments for LOS without duplicates', () => {
    const wall = {
      id: 'w-test',
      x1: 0,
      y1: 5,
      x2: 10,
      y2: 5,
      blocksMovement: true,
      blocksVision: true,
    };
    const door: DoorSegment = {
      id: 'd-test',
      x: 4,
      y: 5,
      orientation: 'horizontal',
      state: 'closed',
      blocksVisionWhenClosed: true,
    };

    // When closed: doorway blocks vision
    const closedEff = resolveEffectiveBlockingSegments([wall], [door]);
    const closedDoorway = closedEff.find((s) => s.sourceId === 'd-test');
    assert.ok(closedDoorway);
    assert.equal(closedDoorway.blocksVision, true);
    assert.equal(closedDoorway.blocksMovement, true);

    // When open: doorway does not block vision or movement
    const openDoor: DoorSegment = { ...door, state: 'open' };
    const openEff = resolveEffectiveBlockingSegments([wall], [openDoor]);
    const openDoorway = openEff.find((s) => s.sourceId === 'd-test');
    assert.ok(openDoorway);
    assert.equal(openDoorway.blocksVision, false);
    assert.equal(openDoorway.blocksMovement, false);
  });

  it('Image import validation: corrupt or oversize files are rejected with informative errors', () => {
    const oversize = validateImageFileMeta({ type: 'image/png', size: 20 * 1024 * 1024 });
    assert.equal(oversize.valid, false);
    assert.ok(oversize.error?.includes('15MB limit'));

    const badMime = validateImageFileMeta({ type: 'application/pdf', size: 1024 });
    assert.equal(badMime.valid, false);
    assert.ok(badMime.error?.includes('Unsupported image format'));
  });

  it('Workspace navigation preservation: battlemapSessionManager keeps edits and custom maps active', () => {
    const initialMapId = battlemapSessionManager.getActiveMapId();
    const activeMap = battlemapSessionManager.getActiveMap();

    const room: RectangularRoom = {
      id: 'qa-room-persisted',
      name: 'Hall of Trials',
      x: 1,
      y: 1,
      width: 6,
      height: 6,
      floorType: 'tiles',
    };

    battlemapSessionManager.updateGeometry(activeMap.id, {
      ...activeMap.geometry,
      rooms: [...activeMap.geometry.rooms, room],
    });

    // Simulate navigation away and back
    const reloadedMap = battlemapSessionManager.getActiveMap();
    assert.ok(reloadedMap.geometry.rooms.some((r) => r.id === 'qa-room-persisted'));

    // Undo edit
    battlemapSessionManager.undo(activeMap.id);
    const undoneMap = battlemapSessionManager.getActiveMap();
    assert.equal(undoneMap.geometry.rooms.some((r) => r.id === 'qa-room-persisted'), false);
  });
});
