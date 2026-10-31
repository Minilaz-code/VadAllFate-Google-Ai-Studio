import test from 'node:test';
import assert from 'node:assert/strict';
import {selectContentClosure} from './v2ContentClient.ts';
import {V2BackendClient} from './v2BackendClient.ts';
import {saveSession,clearV2Session} from './v2Session.ts';

test('exact content dependency closure rejects missing/conflicting pins',()=>{
 const world={pack_id:'original.world',pack_version:'1.0.0',manifest_sha256:'a'.repeat(64)};
 const adventure={pack_id:'original.adventure',pack_version:'1.0.0',manifest_sha256:'b'.repeat(64)};
 const packs=[{pin:world,title:'Original World',kind:'world',dependencies:[],ruleset:'dnd5e-2014'},
              {pin:adventure,title:'Original Adventure',kind:'adventure_campaign',dependencies:[world],ruleset:'dnd5e-2014'}];
 assert.deepEqual(selectContentClosure(packs,[adventure]),[world,adventure]);
 assert.throws(()=>selectContentClosure(packs.slice(1),[adventure]),/not installed/);
 assert.throws(()=>selectContentClosure(packs,[{...world,manifest_sha256:'0'.repeat(64)}]),/not installed/);
});

test('protected artwork uses headers and never sends credentials to external origins',async()=>{
 const old=globalThis.fetch;const calls:any[]=[];
 saveSession({dm:'fixture-dm-session'});
 globalThis.fetch=(async(url:any,init:any)=>{calls.push({url,init});return new Response(new Blob(['fixture'],{type:'image/webp'}),{status:200});}) as any;
 const client=new V2BackendClient('http://127.0.0.1:8765/api/v2');
 try{
  const image=await client.fetchAuthenticatedAssetBlobUrl('/api/v2/content/asset?ref=original:npc&asset=fixture','dm');
  assert.ok(image.startsWith('blob:'));
  assert.equal(calls[0].init.headers['X-VadAllFate-Session-Token'],'fixture-dm-session');
  assert.equal(calls[0].init.cache,'no-store');
  assert.ok(!calls[0].url.includes('fixture-dm-session'));
  await assert.rejects(()=>client.fetchAuthenticatedAssetBlobUrl('https://example.invalid/api/v2/content/asset','dm'),/configured backend/);
  assert.equal(calls.length,1);
  await client.fetchAuthenticatedAssetBlobUrl('https://example.invalid/public.webp','dm');
  assert.deepEqual(calls[1].init.headers,{});
 }finally{client.clearAssetBlobCache();globalThis.fetch=old;clearV2Session();}
});

test('in-flight artwork cannot enter a cache after identity invalidation',async()=>{
 const old=globalThis.fetch;let complete!:(v:Response)=>void;
 globalThis.fetch=(()=>new Promise<Response>(resolve=>{complete=resolve;})) as any;
 const client=new V2BackendClient('http://127.0.0.1:8765/api/v2');
 try{
  const pending=client.fetchAuthenticatedAssetBlobUrl('/api/v2/content/asset?asset=fixture','dm');
  client.clearAssetBlobCache();complete(new Response(new Blob(['fixture']),{status:200}));
  await assert.rejects(()=>pending,/session changed/);
 }finally{globalThis.fetch=old;clearV2Session();}
});
