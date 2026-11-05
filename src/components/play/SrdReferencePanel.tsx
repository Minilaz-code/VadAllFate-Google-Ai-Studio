import React,{useEffect,useState} from 'react';
import {srd51ReferenceClient,formatSRD51EntityDetails,type SRD51EntityRecord,type SRD51SourceMetadata} from '../../services/srd51Reference.ts';

/** Existing reference client, exposed in the connected adventure workspace. */
export function SrdReferencePanel(){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [source,setSource]=useState<SRD51SourceMetadata|null>(null),[items,setItems]=useState<SRD51EntityRecord[]>([]),[selected,setSelected]=useState<SRD51EntityRecord|null>(null);
 useEffect(()=>{if(!open)return;const abort=new AbortController();srd51ReferenceClient.getStatus(abort.signal).then(setSource).catch(e=>{if(!abort.signal.aborted)setError(e.message);});return()=>abort.abort();},[open]);
 const search=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setSelected(null);try{const result=await srd51ReferenceClient.search({query,limit:10});setItems(result.items);}catch(e:any){setError(e.message);}finally{setBusy(false);}};
 const inspect=async(item:SRD51EntityRecord)=>{setBusy(true);setError('');try{const record=await srd51ReferenceClient.getByKey(item.entity_key);if(!record)throw new Error('Reference is no longer available.');setSelected(record);}catch(e:any){setError(e.message);}finally{setBusy(false);}};
 return <details aria-label="SRD 5.1 reference" className="border border-neutral-700 rounded p-3 text-sm" onToggle={e=>setOpen(e.currentTarget.open)}><summary>5e Rules · SRD 5.1 reference</summary>
 {source&&<p>{source.total_entities} Entities · read-only · {source.source.license_id} · SHA {source.sqlite_sha256.slice(0,12)}</p>}
 <form onSubmit={e=>void search(e)} className="flex gap-2 mt-2"><input aria-label="Search SRD 5.1" value={query} maxLength={200} onChange={e=>setQuery(e.target.value)} className="bg-neutral-950 border border-neutral-700 rounded p-2"/><button disabled={busy||!query.trim()} className="border border-neutral-600 rounded px-3">Search rules</button></form>
 {error&&<p role="alert" className="text-red-300">{error}</p>}
 <ul>{items.map(item=><li key={item.entity_key}><button disabled={busy} onClick={()=>void inspect(item)} className="underline text-amber-300">{item.name} · {item.entity_type}</button></li>)}</ul>
 {selected&&<article><h4>{selected.name}</h4><pre className="whitespace-pre-wrap text-xs">{formatSRD51EntityDetails(selected).bodyText}</pre></article>}
 <p className="text-xs text-neutral-400">Rules reference only. Finding a creature here does not approve it for combat.</p></details>;
}
