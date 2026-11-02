import test from 'node:test';
import assert from 'node:assert/strict';
import {saveSession,getV2Token,v2SessionHeaders,selectDevelopmentSave,getDevelopmentSave,clearV2Session} from './v2Session.ts';

test('explicit layered Save switch clears credentials and binds every request header',()=>{
 const oldWindow=(globalThis as any).window,oldStorage=(globalThis as any).sessionStorage;
 const data=new Map<string,string>();(globalThis as any).sessionStorage={getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)};
 (globalThis as any).window={location:{search:'?storageAlign=2'}};
 try{saveSession({dm:'test-only-slot-a'});assert.equal(v2SessionHeaders('dm')['X-VadAllFate-Development-Save'],'a');selectDevelopmentSave('b');assert.equal(getDevelopmentSave(),'b');assert.equal(getV2Token('dm'),undefined);assert.equal(v2SessionHeaders()['X-VadAllFate-Development-Save'],'b');assert.throws(()=>selectDevelopmentSave('../other'));}
 finally{clearV2Session();(globalThis as any).window=oldWindow;(globalThis as any).sessionStorage=oldStorage;}
});

test('ordinary application requests never inherit the experimental Save selector',()=>{
 const oldWindow=(globalThis as any).window;(globalThis as any).window={location:{search:''}};
 try{assert.equal(v2SessionHeaders()['X-VadAllFate-Development-Save'],undefined);assert.throws(()=>selectDevelopmentSave('b'));}
 finally{(globalThis as any).window=oldWindow;}
});
