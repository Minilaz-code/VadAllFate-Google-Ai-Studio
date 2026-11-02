import test from 'node:test';
import assert from 'node:assert/strict';
import {PythonRuntimeGateway} from '../runtime/adapter.ts';
import {saveSession,clearV2Session} from './v2Session.ts';

test('a player-only session connects without requesting DM data or replacing its assigned identity',async()=>{
  const previous=globalThis.fetch;const urls:string[]=[];
  saveSession({player:'test-disposable-player',campaignId:'original-test'});
  globalThis.fetch=(async(input:any)=>{
    const url=String(input);urls.push(url);
    if(url.includes('role=dm_host'))return new Response('{}',{status:403});
    const data=url.includes('/status')?{commitSequence:0,worldMinute:0,stateHash:'original-hash'}:
      {campaignId:'original-test',projectionRole:'player',activeCharacterId:'assigned.original',characters:[],isServerVerifiedProjection:true};
    return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  }) as any;
  try {
    const gateway=new PythonRuntimeGateway();
    assert.equal(await gateway.connectToLiveBackend(),true);
    const projection:any=gateway.getProjection('player','forged.other');
    assert.equal(projection.activeCharacterId,'assigned.original');
    assert.equal(gateway.getCurrentSnapshot().commitSequence,0);
    assert.equal(gateway.getCurrentSnapshot().worldMinute,0);
    assert.equal(urls.some(u=>u.includes('role=dm_host')||u.includes('character_id=')),false);
    assert.throws(()=>gateway.getProjection('dm_host'),/authorized|authorised|permission/i);
  }finally{globalThis.fetch=previous;clearV2Session();}
});

test('an HTTP-successful runtime that denies write eligibility is never labelled authoritative',async()=>{
  const previous=globalThis.fetch;const calls:string[]=[];
  saveSession({player:'test-disposable-player',campaignId:'original-test'});
  globalThis.fetch=(async(input:any)=>{
    calls.push(String(input));
    return new Response(JSON.stringify(String(input).includes('/status')?
      {isCurrentlyAuthoritative:false,canAcceptAuthoritativeActions:false}:
      {campaignId:'original-test',projectionRole:'player',activeCharacterId:'assigned.original'}),{status:200});
  }) as any;
  try {
    const gateway=new PythonRuntimeGateway();assert.equal(await gateway.connectToLiveBackend(),false);
    assert.equal(gateway.getConnectionStatus().canAcceptAuthoritativeActions,false);
    assert.throws(()=>gateway.getProjection('player'),/disconnected/);
    await assert.rejects(()=>gateway.submitAction({} as any),/disconnected/);
    assert.equal(calls.some(c=>c.endsWith('/actions')),false);
  }finally{globalThis.fetch=previous;clearV2Session();}
});
