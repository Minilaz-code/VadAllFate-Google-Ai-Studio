import test from 'node:test';
import assert from 'node:assert/strict';
import {PythonRuntimeGateway} from './adapter.ts';
import {saveSession,getStoredSession} from '../services/v2Session.ts';

test('late authenticated projection responses cannot switch back to another campaign',async()=>{
 const previous=getStoredSession();const originalFetch=globalThis.fetch;const release:(()=>void)[]=[];const statusTokens:string[]=[];
 try{
  saveSession({dm:'fixture-old-dm',player:'fixture-old-player',campaignId:'camp-old'});
  globalThis.fetch=(async(url:any,init:any)=>{
   const old=String(url).includes('camp-old');if(String(url).includes('/status'))statusTokens.push(init?.headers?.['X-VadAllFate-Session-Token']);
   if(old)await new Promise<void>(resolve=>release.push(resolve));
   return {ok:true,json:async()=>String(url).includes('/status')?{commitSequence:old?1:2,stateHash:old?'old':'new',worldMinute:1}:{campaignId:old?'camp-old':'camp-new'}} as any;
  }) as any;
  const gateway=new PythonRuntimeGateway('http://127.0.0.1:9999/api/v2');const oldRequest=gateway.connectToLiveBackend();
  saveSession({dm:'fixture-new-dm',player:'fixture-new-player',campaignId:'camp-new'});
  assert.equal(await gateway.connectToLiveBackend(),true);release.forEach(resolve=>resolve());await oldRequest;
  assert.equal(gateway.getCurrentSnapshot().campaignId,'camp-new');assert.equal(gateway.getProjection('dm_host').campaignId,'camp-new');
  assert.deepEqual(statusTokens,['fixture-old-dm','fixture-new-dm']);
 }finally{globalThis.fetch=originalFetch;saveSession(previous);}
});
