import test from 'node:test';
import assert from 'node:assert/strict';
import { clearV2Session, getV2Token, hasV2Session, loginWithHostKey, loginWithInvite, v2SessionHeaders } from './v2Session.ts';

test('no credential means no auth header and no implicit DM authority', () => {
  clearV2Session();
  assert.equal(hasV2Session(), false);
  assert.deepEqual(v2SessionHeaders('dm_host'), {});
  assert.equal(getV2Token('dm'), undefined);
});

test('login never sends a self-asserted role without a credential and stores backend-issued tokens', async () => {
  const calls: any[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: any) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    if (!body.bootstrapKey && !body.inviteCode) {
      return { ok: false, status: 401, json: async () => ({ message: 'AUTHENTICATION_REQUIRED' }) } as any;
    }
    const role = body.inviteCode ? 'player' : body.role === 'dm_host' ? 'dm' : 'player';
    return { ok: true, status: 200, json: async () => ({ sessionToken: `v2sess.${role}.tok`, role }) } as any;
  }) as any;
  try {
    clearV2Session();
    await loginWithHostKey('k');
    assert.equal(getV2Token('dm'), 'v2sess.dm.tok');
    assert.equal(getV2Token('player'), 'v2sess.player.tok');
    assert.ok(calls.every((c) => c.bootstrapKey === 'k'));
    assert.equal(v2SessionHeaders('player')['X-VadAllFate-Session-Token'], 'v2sess.player.tok');

    clearV2Session();
    await loginWithInvite('INV-1');
    assert.equal(getV2Token('dm'), undefined, 'an invite for a player never yields a DM token');
    assert.equal(getV2Token('player'), 'v2sess.player.tok');
    assert.deepEqual(calls[calls.length - 1], { inviteCode: 'INV-1' });
  } finally {
    globalThis.fetch = realFetch;
    clearV2Session();
  }
});
