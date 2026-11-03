import {test} from 'node:test';
import assert from 'node:assert/strict';
import {controlledGatewayFetch} from './controlledGatewayFetch.ts';

test('429 backoff preserves exact action bytes and headers; other errors do not retry',async()=>{
 const oldWindow=globalThis.window;const oldFetch=globalThis.fetch;const calls:any[]=[];const delays:number[]=[];
 (globalThis as any).window={location:{search:'?storageAlign=2'},sessionStorage:{getItem:(key:string)=>key.includes('developmentSave')?'a':'signed-session'}};
 try{
  globalThis.fetch=async(input,init)=>{calls.push([input,init?.body,new Headers(init?.headers).get('X-Session')]);return new Response('{}',{status:calls.length===1?429:200});};
  const body=JSON.stringify({actionId:'fixed',snapshotRef:{hash:'original'},payload:{target:'exact'}});
  const response=await controlledGatewayFetch('/actions',{method:'POST',body,headers:{'X-Session':'original'}},async ms=>{delays.push(ms);});
  assert.equal(response.status,200);assert.deepEqual(calls[0],calls[1]);assert.deepEqual(delays,[1000]);
  calls.length=0;globalThis.fetch=async()=>{calls.push('call');return new Response('{}',{status:403});};
  assert.equal((await controlledGatewayFetch('/actions',{},async()=>{})).status,403);assert.equal(calls.length,1);
 }finally{globalThis.fetch=oldFetch;(globalThis as any).window=oldWindow;}
});

test('Save/session change while rate-limited cancels before another submission',async()=>{
 const oldWindow=globalThis.window;const oldFetch=globalThis.fetch;let save='a';let calls=0;
 (globalThis as any).window={location:{search:'?storageAlign=2'},sessionStorage:{getItem:()=>save}};
 try{
  globalThis.fetch=async()=>{calls++;return new Response('{}',{status:429});};
  await assert.rejects(controlledGatewayFetch('/actions',{body:'same'},async()=>{save='b';}),/cancelled/);assert.equal(calls,1);
 }finally{globalThis.fetch=oldFetch;(globalThis as any).window=oldWindow;}
});
