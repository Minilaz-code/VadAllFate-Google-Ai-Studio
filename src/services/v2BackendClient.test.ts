import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { V2BackendClient } from './v2BackendClient.ts';

describe('V2BackendClient (KGP-03, HAR-01, Milestone 5)', () => {
  const client = new V2BackendClient('http://127.0.0.1:9/api/v2');

  it('enforces epistemic filtering between DM full graph and Player-Safe preview graph', async () => {
    const dmGraph = await client.queryGraph({
      actor_id: 'dm-1',
      role: 'dm',
      campaign_id: 'aethelgard-vault-001',
    });
    const dmDump = JSON.stringify(dmGraph);
    assert.equal(dmDump.includes('Avernus Planar Conduit'), true);
    assert.equal(dmDump.includes('SECRETLY_LEADS_TO'), true);

    const playerPreviewGraph = await client.queryGraph({
      actor_id: 'dm-1',
      role: 'dm',
      is_host: true,
      preview_as_player_id: 'char-lyra-01',
      campaign_id: 'aethelgard-vault-001',
    });
    const playerDump = JSON.stringify(playerPreviewGraph);
    assert.equal(playerDump.includes('Primara Cathedral'), true);
    assert.equal(playerDump.includes('Avernus Planar Conduit'), false);
    assert.equal(playerDump.includes('SECRETLY_LEADS_TO'), false);
  });

  it('supports Markdown Note authoring, wikilink extraction, and ACL transitions', async () => {
    const p1 = {
      actor_id: 'char-lyra-01',
      role: 'player' as const,
      campaign_id: 'aethelgard-vault-001',
    };
    const p2 = {
      actor_id: 'char-kaelen-02',
      role: 'player' as const,
      campaign_id: 'aethelgard-vault-001',
    };

    const note = await client.saveNote(p1, {
      note_id: 'note-test-acl-1',
      title: 'Private Suspect Note',
      markdown_body: 'I saw [[Jorren Vale]] near [[Primara Cathedral]] with [[Fireball]] scrolls.',
      visibility: 'private_player',
    });
    assert.equal(note.visibility, 'private_player');
    assert.equal(note.linked_entity_uris.includes('srd51:spell:119'), true);

    // Player 2 cannot see Player 1's private_player note
    const p2NotesBefore = await client.listNotes(p2);
    assert.equal(p2NotesBefore.some((n) => n.note_id === 'note-test-acl-1'), false);

    // Player 1 shares note with party -> Player 2 can now see it
    await client.changeNoteVisibility(p1, 'note-test-acl-1', 'party_shared');
    const p2NotesAfter = await client.listNotes(p2);
    assert.equal(p2NotesAfter.some((n) => n.note_id === 'note-test-acl-1'), true);
  });

  it('enforces DM Plan Proposal -> Confirmation lifecycle and hides plans from players', async () => {
    const dm = {
      actor_id: 'dm-1',
      role: 'dm' as const,
      campaign_id: 'aethelgard-vault-001',
    };
    const player = {
      actor_id: 'char-lyra-01',
      role: 'player' as const,
      campaign_id: 'aethelgard-vault-001',
    };

    const proposed = await client.proposePlan(dm, {
      plan_id: 'plan-test-1',
      title: 'Pier 4 Trap',
      plan_kind: 'encounter_beat',
      source_markdown: 'Trap triggers near [[Primara Cathedral]].',
      structured_payload: { dc: 15 },
    });
    assert.equal(proposed.status, 'proposed');

    const confirmed = await client.transitionPlan(dm, 'plan-test-1', 'confirmed', proposed.revision);
    assert.equal(confirmed.status, 'confirmed');
    assert.equal(Boolean(confirmed.confirmed_commit_id), true);

    const playerPlans = await client.listPlans(player);
    assert.equal(playerPlans.length, 0);
  });

  it('enforces Homebrew Draft -> Validate -> Implement lifecycle', async () => {
    const dm = {
      actor_id: 'dm-1',
      role: 'dm' as const,
      campaign_id: 'aethelgard-vault-001',
    };
    const player = {
      actor_id: 'char-lyra-01',
      role: 'player' as const,
      campaign_id: 'aethelgard-vault-001',
    };

    const draft = await client.saveHomebrewDraft(dm, {
      homebrew_id: 'hb-test-spell-1',
      category: 'spell',
      name: 'Frostbolt of Highgate',
      base_srd_uri: 'srd51:spell:119',
      specification: {
        level: 2,
        school: 'Evocation',
        summary: 'Deals 4d6 cold damage.',
      },
    });
    assert.equal(draft.status, 'draft');

    // Player does not see unimplemented draft
    const playerHbBefore = await client.listHomebrew(player);
    assert.equal(playerHbBefore.some((h) => h.homebrew_id === 'hb-test-spell-1'), false);

    const validated = await client.transitionHomebrew(dm, 'hb-test-spell-1', 'validated', draft.version);
    assert.equal(validated.status, 'validated');

    const implemented = await client.transitionHomebrew(
      dm,
      'hb-test-spell-1',
      'implemented',
      draft.version
    );
    assert.equal(implemented.status, 'implemented');

    const playerHbAfter = await client.listHomebrew(player);
    assert.equal(playerHbAfter.some((h) => h.homebrew_id === 'hb-test-spell-1'), true);
  });

  it('synthesizes playable WAV audio via Native TTS adapter', async () => {
    const res = await client.synthesizeSpeech('The bells of Primara toll.', 'dm-narrator');
    assert.equal(res.mime_type, 'audio/wav');
    assert.equal(res.audio_data_url.startsWith('data:audio/wav;base64,'), true);
  });
});
