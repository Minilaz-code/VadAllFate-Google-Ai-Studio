/** Read-only profile discovery. It selects transport, never authorizes gameplay. */
let discovered = 'UNKNOWN';
export function runtimeProfileKey():string { return discovered; }
export function isLayeredRuntime():boolean {
  return discovered==='STORAGE-ALIGN-01.DISPOSABLE.v1'||
    (typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('storageAlign')==='2');
}
export async function discoverRuntimeProfile(apiBase:string):Promise<void> {
  discovered='UNKNOWN';
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);
  try {
    const response=await fetch(`${apiBase.replace(/\/$/,'')}/status`,{cache:'no-store',signal:controller.signal});
    if(!response.ok)return;
    const status=await response.json();
    if(status.experimentalStorageProfile==='STORAGE-ALIGN-01.DISPOSABLE.v1'&&status.readOnlyBaselineCount===5)discovered=status.experimentalStorageProfile;
    else if(!status.experimentalStorageProfile&&typeof status.isCurrentlyAuthoritative==='boolean')discovered='LEGACY';
  } catch { /* Connection/auth screens remain fail-closed; never enter demo. */ }
  finally {clearTimeout(timer);}
}
