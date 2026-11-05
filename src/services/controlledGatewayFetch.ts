import {isLayeredRuntime,runtimeProfileKey} from './runtimeProfile.ts';
/** Controlled profile transport: honour 429 without changing an action/identity. */
function selection():string {
  if(typeof window==='undefined')return '';
  const store=typeof sessionStorage!=='undefined'?sessionStorage:window.sessionStorage;
  return [runtimeProfileKey(),window.location.search,store?.getItem('vadallfate.v2.session'),store?.getItem('vadallfate.v2.developmentSave')].join('|');
}
export async function controlledGatewayFetch(input:RequestInfo|URL,init?:RequestInit,wait:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms))):Promise<Response>{
  if(!isLayeredRuntime())return fetch(input,init);
  if(typeof Request!=='undefined'&&input instanceof Request)return fetch(input,init);
  const bound=selection();const request={...init,headers:new Headers(init?.headers)};
  // Callers serialize action bodies once. A stream cannot be safely replayed.
  if(request.body!=null&&typeof request.body!=='string')return fetch(input,request);
  for(let attempt=0;;attempt++){
    if(selection()!==bound)throw new Error('Session or Save changed; cancelled before retry.');
    const response=await fetch(input,request);
    if(response.status!==429||attempt===6)return response;
    await response.arrayBuffer();
    await wait(Math.min(1000*2**attempt,10000));
  }
}
