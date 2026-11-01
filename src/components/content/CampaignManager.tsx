import {fetchStorageCapabilities,storageMessage,type StorageCapabilities} from '../../services/storageCapabilities.ts';
import React,{useEffect,useState} from 'react';
import {resolveV2ApiBaseUrl,v2BackendClient} from '../../services/v2BackendClient.ts';
import {saveSession,v2SessionHeaders,getV2CampaignId} from '../../services/v2Session.ts';

export function CampaignManager({onRefresh,onBusyChange}:{onRefresh:()=>Promise<unknown>;onBusyChange?:(busy:boolean)=>void}) {
  const [storage,setStorage]=useState<StorageCapabilities|null>(null);
  const [capacity,setCapacity]=useState<any>(null);
  const [campaigns,setCampaigns]=useState<any[]>([]);const [saves,setSaves]=useState<any[]>([]);
  const [saveId,setSaveId]=useState('');const [checkpoint,setCheckpoint]=useState<any>(null);
  const [name,setName]=useState('');const [selected,setSelected]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  const api=async(path:string,body?:any)=>{const r=await fetch(`${resolveV2ApiBaseUrl()}/campaigns${path}`,{method:body?'POST':'GET',headers:{...v2SessionHeaders('dm'),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.message||d.error);return d;};
  const load=async()=>{setStorage(null);const capability=await fetchStorageCapabilities();setStorage(capability);if(!capability.playable){setCampaigns([]);setSaves([]);setCapacity(null);return;}setCampaigns((await api('')).campaigns);setSaves((await api('/saves')).saves);setCapacity(await api('/capacity'));};
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
  const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);onBusyChange?.(true);setError('');setNotice('');try{await fn();}catch(e:any){setError(e.message);}finally{setBusy(false);onBusyChange?.(false);}};
  const activate=async(result:any)=>{saveSession(result.sessions);v2BackendClient.clearAssetBlobCache();await onRefresh();await load();setNotice('Campaign session changed. Content versions and world state were loaded from Python.');};
  const button='px-3 py-2 border border-neutral-600 rounded disabled:opacity-40';
  return <details className="border border-neutral-700 rounded p-3"><summary>Campaigns and Save branches</summary><p role="status">{storage?storageMessage(storage):error?'Save capabilities unavailable. Check the connection or sign in again.':'Checking Save capabilities...'}</p><button className="px-3 py-2 border rounded" disabled={busy} onClick={()=>void run(load)}>Recheck Save compatibility</button><div className="flex flex-wrap gap-2 mt-3">
    <input aria-label="New campaign name" value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="Campaign or Save branch name" className="bg-neutral-950 border border-neutral-700 rounded p-2"/>
    <button className={button} disabled={!storage?.playable||busy||!name.trim()} onClick={()=>void run(async()=>{const r=await api('',{name});await activate(r);})}>Create campaign</button>
    <select aria-label="Existing campaign" value={selected} onChange={e=>setSelected(e.target.value)} className="bg-neutral-950 border border-neutral-700 rounded p-2"><option value="">Choose campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}{c.id===getV2CampaignId()?' (active)':''}</option>)}</select>
    <button className={button} disabled={!storage?.playable||busy||!selected} onClick={()=>void run(async()=>activate(await api('/select',{campaignId:selected})))}>Load campaign</button>
    <button className={button} disabled={!storage?.playable||busy||!name.trim()} onClick={()=>void run(async()=>{const r=await api('/saves',{name});setNotice(`Save branch ${r.id} passed integrity checks. Restart the Windows launcher with this Save ID to open the independent branch.`);await load();})}>Create restartable Save branch</button>
  </div><p className="text-xs text-neutral-400 mt-2">New campaigns use the existing application party template. Pin your own world and adventure below. Save branches use SQLite backup; switching Save files requires a runtime restart.</p>
  {capacity&&<section aria-label="Save capacity"><h4>Save capacity: {capacity.status.replaceAll('_',' ')}</h4><p>Representative request {capacity.representativeRequestBytes.toLocaleString()} / {capacity.limitBytes.toLocaleString()} bytes. {capacity.counts.memories} retained NPC memories; {capacity.durableEventCount} committed events.</p><p>This estimate does not reserve capacity. Growing this Save beyond the current limit requires an approved storage migration. History is retained.</p><button className={button} disabled={!storage?.playable||busy} onClick={()=>void run(async()=>setCapacity(await api('/capacity')))}>Refresh Save capacity</button></section>}
  {error&&<p role="alert" className="text-red-300">{error}</p>}{notice&&<p role="status" className="text-teal-300">{notice}</p>}
  <div className="flex gap-2 mt-2"><select aria-label="Checkpoint timeline" value={saveId} onChange={e=>{setSaveId(e.target.value);setCheckpoint(null);}} className="bg-neutral-950"><option value="">Choose checkpoint</option>{saves.map(s=><option key={s.id} value={s.id}>{s.name} · {s.id}</option>)}</select>
    <button className={button} disabled={!storage?.playable||!saveId||busy} onClick={()=>void run(async()=>setCheckpoint(await api('/saves/inspect',{saveId})))}>Inspect checkpoint</button>
    <button className={button} disabled={!storage?.playable||!saveId||!name.trim()||busy} onClick={()=>void run(async()=>{const r=await api('/saves',{name,sourceSaveId:saveId});setNotice(`Independent timeline ${r.id} created from checkpoint ${saveId}. Open after stopping with -SaveId ${r.id}.`);await load();})}>Branch selected checkpoint</button></div>
  {checkpoint&&<p className="text-xs">Integrity {checkpoint.integrity} · revision {checkpoint.currentSnapshot.revision} · {checkpoint.contentPins.length} exact content pins · open after stopping: -SaveId {checkpoint.id} · whole-runtime checkpoint, not portable single-campaign export</p>}
  {saves.map(s=><p key={s.id} className="text-xs mt-2">{s.name} · {s.id} · integrity: {s.integrity}</p>)}
  </details>;
}
