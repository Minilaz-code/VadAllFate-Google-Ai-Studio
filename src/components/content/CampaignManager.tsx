import React,{useEffect,useState} from 'react';
import {resolveV2ApiBaseUrl,v2BackendClient} from '../../services/v2BackendClient.ts';
import {saveSession,v2SessionHeaders,getV2CampaignId} from '../../services/v2Session.ts';

export function CampaignManager({onRefresh}:{onRefresh:()=>Promise<unknown>}) {
  const [campaigns,setCampaigns]=useState<any[]>([]);const [saves,setSaves]=useState<any[]>([]);
  const [name,setName]=useState('');const [selected,setSelected]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  const api=async(path:string,body?:any)=>{const r=await fetch(`${resolveV2ApiBaseUrl()}/campaigns${path}`,{method:body?'POST':'GET',headers:{...v2SessionHeaders('dm'),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.message||d.error);return d;};
  const load=async()=>{setCampaigns((await api('')).campaigns);setSaves((await api('/saves')).saves);};
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
  const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);setError('');setNotice('');try{await fn();}catch(e:any){setError(e.message);}finally{setBusy(false);}};
  const activate=async(result:any)=>{saveSession(result.sessions);v2BackendClient.clearAssetBlobCache();await onRefresh();await load();setNotice('Campaign session changed. Content versions and world state were loaded from Python.');};
  const button='px-3 py-2 border border-neutral-600 rounded disabled:opacity-40';
  return <details className="border border-neutral-700 rounded p-3"><summary>Campaigns and Save branches</summary><div className="flex flex-wrap gap-2 mt-3">
    <input aria-label="New campaign name" value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="Campaign or Save branch name" className="bg-neutral-950 border border-neutral-700 rounded p-2"/>
    <button className={button} disabled={busy||!name.trim()} onClick={()=>void run(async()=>{const r=await api('',{name});await activate(r);})}>Create campaign</button>
    <select aria-label="Existing campaign" value={selected} onChange={e=>setSelected(e.target.value)} className="bg-neutral-950 border border-neutral-700 rounded p-2"><option value="">Choose campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}{c.id===getV2CampaignId()?' (active)':''}</option>)}</select>
    <button className={button} disabled={busy||!selected} onClick={()=>void run(async()=>activate(await api('/select',{campaignId:selected})))}>Load campaign</button>
    <button className={button} disabled={busy||!name.trim()} onClick={()=>void run(async()=>{const r=await api('/saves',{name});setNotice(`Save branch ${r.id} passed integrity checks. Restart the Windows launcher with this Save ID to open the independent branch.`);await load();})}>Create restartable Save branch</button>
  </div><p className="text-xs text-neutral-400 mt-2">New campaigns use the existing application party template. Pin your own world and adventure below. Save branches use SQLite backup; switching Save files requires a runtime restart.</p>
  {error&&<p role="alert" className="text-red-300">{error}</p>}{notice&&<p role="status" className="text-teal-300">{notice}</p>}
  {saves.map(s=><p key={s.id} className="text-xs mt-2">{s.name} · {s.id} · integrity: {s.integrity}</p>)}
  </details>;
}
