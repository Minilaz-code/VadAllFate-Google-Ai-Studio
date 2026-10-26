import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SRD51ReferenceClient,
  SRD51ReferenceError,
  formatSRD51EntityDetails,
  type SRD51EntityRecord,
} from './srd51Reference.ts';
import { clientManager } from '../runtime/adapter.ts';

describe('SRD 5.1 Read-Only Reference Client & UI Formatting (Milestone 1)', () => {
  it('queries /api/srd51/status and verifies read-only provenance metadata', async () => {
    let requestedUrl = '';
    let requestedMethod = '';
    const client = new SRD51ReferenceClient({
      baseUrl: 'http://127.0.0.1:8765',
      fetchImpl: async (url, init) => {
        requestedUrl = url;
        requestedMethod = init?.method || 'GET';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ruleset: 'SRD-5.1',
            role: 'read_only_reference_data',
            query_only: true,
            combat_authorization: 'DISABLED_NO_APPROVED_MONSTER_COVERAGE',
            sqlite_sha256: '919857e19f0cc6bf0255045e8cc3d56f5c9c9e24da3921e07940a1749caf77a2',
            sqlite_size_bytes: 2670592,
            verified_canonical_snapshot: true,
            schema_version: '0.1.0',
            total_entities: 1207,
            counts_by_type: { spell: 319, monster: 334, condition: 15, rule: 33 },
            entity_types: ['class', 'condition', 'equipment', 'magic_item', 'monster', 'race', 'rollable_table', 'rule', 'spell'],
            source: {
              source_key: 'oracle-0.2.3',
              title: 'dnd-oracle SQLite source database',
              license_id: 'SRD-5.1-CC-BY-4.0-AND-ORACLE-MIT',
              attribution: 'SRD 5.1: CC BY 4.0',
            },
          }),
        };
      },
    });

    const status = await client.getStatus();
    assert.equal(requestedMethod, 'GET');
    assert.equal(requestedUrl, 'http://127.0.0.1:8765/api/srd51/status');
    assert.equal(status.total_entities, 1207);
    assert.equal(status.verified_canonical_snapshot, true);
    assert.equal(status.query_only, true);
  });

  it('constructs parameterized search queries across categories without mutating CampaignClient state', async () => {
    const initialSnapshot = clientManager.getClient().getCurrentSnapshot();
    const calledUrls: string[] = [];

    const client = new SRD51ReferenceClient({
      fetchImpl: async (url) => {
        calledUrls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ruleset: 'SRD-5.1',
            role: 'read_only_reference_data',
            query: 'fireball',
            entity_type: null,
            category: 'Magic',
            limit: 25,
            count: 1,
            items: [
              {
                entity_key: 'srd51:spell:112',
                entity_type: 'spell',
                name: 'Fireball',
                ruleset: 'SRD-5.1',
                verification_status: 'unverified',
                source_table: 'spells',
                original_id: 112,
                ui_category: 'Magic',
                summary: 'A bright streak flashes from your pointing finger to a point you choose within range...',
                data: {
                  id: 112,
                  name: 'Fireball',
                  level: 3,
                  school: 'Evocation',
                  casting_time: '1 action',
                  range: '150 feet',
                  duration: 'Instantaneous',
                  components_v: 1,
                  components_s: 1,
                  components_m: 1,
                  material_description: 'a tiny ball of bat guano and sulfur',
                  classes: ['Sorcerer', 'Wizard'],
                  description: 'A bright streak flashes from your pointing finger...',
                  higher_level: 'The damage increases by 1d6 for each slot level above 3rd.',
                },
              },
            ],
          }),
        };
      },
    });

    const res = await client.search({ query: 'fireball', category: 'Magic', limit: 25 });
    assert.equal(calledUrls[0], '/api/srd51/search?q=fireball&category=Magic&limit=25');
    assert.equal(res.count, 1);
    assert.equal(res.items[0].entity_key, 'srd51:spell:112');

    // Verify campaign snapshot sequence and hash are completely untouched
    const postSnapshot = clientManager.getClient().getCurrentSnapshot();
    assert.deepEqual(postSnapshot, initialSnapshot);
  });

  it('returns null on 404 unknown entity key and throws typed SRD51ReferenceError on 400 or network failure', async () => {
    const client404 = new SRD51ReferenceClient({
      fetchImpl: async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: 'NOT_FOUND', message: 'Entity not found' }),
      }),
    });
    const missing = await client404.getByKey('srd51:spell:99999');
    assert.equal(missing, null);

    const client400 = new SRD51ReferenceClient({
      fetchImpl: async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'VALIDATION_FAILED', message: 'limit must be between 1 and 100' }),
      }),
    });
    await assert.rejects(
      () => client400.search({ limit: 999 }),
      (err: any) => err instanceof SRD51ReferenceError && err.code === 'VALIDATION_FAILED' && err.statusCode === 400
    );

    const clientOffline = new SRD51ReferenceClient({
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED');
      },
    });
    await assert.rejects(
      () => clientOffline.getStatus(),
      (err: any) => err instanceof SRD51ReferenceError && err.code === 'BACKEND_UNREACHABLE'
    );
  });

  it('formats spells, monsters, conditions, and equipment deterministically for the Rules Inspector', () => {
    const monsterRecord: SRD51EntityRecord = {
      entity_key: 'srd51:monster:3',
      entity_type: 'monster',
      name: 'Adult Red Dragon',
      ruleset: 'SRD-5.1',
      verification_status: 'unverified',
      source_table: 'monsters',
      original_id: 3,
      ui_category: 'Monsters',
      summary: 'Huge dragon, chaotic evil. AC 19, HP 256 (19d12+133), CR 17.',
      data: {
        size: 'Huge',
        type: 'dragon',
        alignment: 'chaotic evil',
        ac: 19,
        ac_type: 'natural armor',
        hp: 256,
        hit_dice: '19d12+133',
        speed: '40 ft., climb 40 ft., fly 80 ft.',
        cr: '17',
        str: 27,
        dex: 10,
        con: 25,
        int: 16,
        wis: 13,
        cha: 21,
        immunities: 'fire',
        traits: [{ name: 'Legendary Resistance (3/Day)', description: 'If the dragon fails a saving throw, it can choose to succeed instead.' }],
        actions: [{ name: 'Fire Breath (Recharge 5-6)', description: 'The dragon exhales fire in a 60-foot cone.' }],
      },
    };

    const details = formatSRD51EntityDetails(monsterRecord);
    assert.equal(details.subtitle, 'Huge dragon, chaotic evil');
    assert.ok(details.statsSummary.some((s) => s.includes('AC: 19 (natural armor)')));
    assert.ok(details.statsSummary.some((s) => s.includes('Immunities: fire')));
    assert.ok(details.bodyText.includes('Fire Breath (Recharge 5-6)'));
  });
});
