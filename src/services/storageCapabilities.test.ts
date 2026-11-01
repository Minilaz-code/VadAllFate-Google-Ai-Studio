import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeCapabilities,fetchStorageCapabilities,storageMessage} from './storageCapabilities.ts';
import {saveSession} from './v2Session.ts';

const legacy={contractVersion:'I6.storage-capabilities.v1',status:'LEGACY_SUPPORTED',
  campaignId:'original',saveId:null,playable:true,granularActions:false,migrationAvailable:false,
  verification:'NOT_FULLY_AUDITED',reason:'LEGACY_SUPPORTED'};

test('I6 native legacy and prepared capabilities stay distinct',()=>{
  assert.equal(decodeCapabilities(legacy,'original').playable,true);
  const prepared={...legacy,status:'GRANULAR_PREPARED_READ_ONLY',saveId:'save.original',playable:false};
  assert.equal(decodeCapabilities(prepared,'original').granularActions,false);
  assert.match(storageMessage(prepared as any),/not a playable campaign/);
  for(const status of ['UNSUPPORTED_FORMAT','CORRUPT_OR_INCONSISTENT','MIGRATION_REQUIRED'])
    assert.equal(decodeCapabilities({...legacy,status,playable:false},'original').playable,false);
});

test('I6 unknown or mismatched replies fail closed',()=>{
  for(const change of [{contractVersion:'future'},{campaignId:'wrong'},{status:'ACTIVE'},
    {granularActions:true},{migrationAvailable:true},{status:'GRANULAR_PREPARED_READ_ONLY'},
    {verification:null},{saveId:2}])assert.throws(()=>decodeCapabilities({...legacy,...change},'original'));
});

test('I6 request binds session and campaign; old 404 preserves legacy only',async()=>{
  const old=globalThis.fetch;saveSession({campaignId:'original',dm:'original-test-credential'});
  try {
    globalThis.fetch=async(url,options)=>{
      assert.match(String(url),/campaign_id=original/);
      assert.equal((options?.headers as any)['X-VadAllFate-Session-Token'],'original-test-credential');
      return new Response('{}',{status:404});
    };
    const result=await fetchStorageCapabilities();assert.equal(result.playable,true);
    assert.equal(result.status,'LEGACY_BACKEND_NO_CAPABILITIES');assert.equal(result.granularActions,false);
    for(const status of [401,403,500]) {
      globalThis.fetch=async()=>new Response('{}',{status});
      await assert.rejects(()=>fetchStorageCapabilities());
    }
  } finally {globalThis.fetch=old;saveSession({});}
});

test('I6 switching sessions never caches the previous campaign capability',async()=>{
  const old=globalThis.fetch;
  try {
    globalThis.fetch=async(url)=>{
      const campaign=new URL(String(url)).searchParams.get('campaign_id');
      return Response.json({...legacy,campaignId:campaign});
    };
    for(const campaign of ['original','branch','original']) {
      saveSession({campaignId:campaign,dm:'original-test-credential'});
      assert.equal((await fetchStorageCapabilities()).campaignId,campaign);
    }
    globalThis.fetch=async()=>Response.json({...legacy,campaignId:'old-campaign'});
    await assert.rejects(()=>fetchStorageCapabilities());
  } finally {globalThis.fetch=old;saveSession({});}
});


test('I6 late responses cannot restore the previous session capability',async()=>{
  const old=globalThis.fetch;
  try {
    let complete: (response:Response)=>void = ()=>{};
    globalThis.fetch=()=>new Promise<Response>(resolve=>{complete=resolve;});
    saveSession({campaignId:'original',dm:'original-test-credential'});
    const pending=fetchStorageCapabilities();
    saveSession({campaignId:'branch',dm:'different-test-credential'});
    complete(Response.json(legacy));
    await assert.rejects(pending,/session changed/);
  } finally {globalThis.fetch=old;saveSession({});}
});
