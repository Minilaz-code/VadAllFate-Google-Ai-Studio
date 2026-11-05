import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverRuntimeProfile,isLayeredRuntime,runtimeProfileKey} from './runtimeProfile.ts';
import {clearV2Session,loginWithHostKey,v2SessionHeaders,selectDevelopmentSave,getV2Token} from './v2Session.ts';

test('normal root discovers layered authority before host/player authentication and clears on Save switch',async()=>{
 const oldFetch=globalThis.fetch,oldWindow=(globalThis as any).window,oldStorage=(globalThis as any).sessionStorage;
 const values=new Map<string,string>();const calls:any[]=[];
 (globalThis as any).window={location:{search:''}};
 (globalThis as any).sessionStorage={getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
 try{
  globalThis.fetch=async(input:any,init:any)=>{
   const url=String(input);calls.push({url,headers:init?.headers,body:init?.body&&JSON.parse(init.body)});
   if(url.endsWith('/status'))return new Response(JSON.stringify({experimentalStorageProfile:'STORAGE-ALIGN-01.DISPOSABLE.v1',readOnlyBaselineCount:5}));
   if(url.endsWith('/projection'))return new Response(JSON.stringify({characters:[{id:'original.hero'}]}));
   return new Response(JSON.stringify({sessionToken:'test-only-issued',campaignId:'original.campaign'}));
  };
  await loginWithHostKey('test-bootstrap');
  assert.equal(isLayeredRuntime(),true);assert.equal(calls[0].url.endsWith('/status'),true);
  assert.equal(calls.at(-1).body.actorId,'original.hero');
  assert.equal(v2SessionHeaders('dm')['X-VadAllFate-Development-Save'],'a');
  selectDevelopmentSave('b');assert.equal(getV2Token('dm'),undefined);
  assert.equal(v2SessionHeaders('dm')['X-VadAllFate-Development-Save'],'b');
  assert.throws(()=>selectDevelopmentSave('../other'));
 }finally{clearV2Session();globalThis.fetch=async()=>new Response('{}');await discoverRuntimeProfile('/reset');globalThis.fetch=oldFetch;(globalThis as any).window=oldWindow;(globalThis as any).sessionStorage=oldStorage;}
});

test('unknown/failed/legacy status never activates layered transport or demo',async()=>{
 const oldFetch=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({experimentalStorageProfile:'unreviewed',readOnlyBaselineCount:5}));await discoverRuntimeProfile('/api/v2');assert.equal(isLayeredRuntime(),false);
  globalThis.fetch=async()=>{throw new Error('offline');};await discoverRuntimeProfile('/api/v2');assert.equal(runtimeProfileKey(),'UNKNOWN');
  globalThis.fetch=async()=>new Response(JSON.stringify({isCurrentlyAuthoritative:true}));await discoverRuntimeProfile('/api/v2');assert.equal(runtimeProfileKey(),'LEGACY');assert.equal(isLayeredRuntime(),false);
 }finally{globalThis.fetch=oldFetch;}
});
