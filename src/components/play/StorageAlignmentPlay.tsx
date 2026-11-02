import React,{useEffect,useState} from 'react';

/** Explicit disposable application slice. Never substitutes for legacy play. */
export function StorageAlignmentPlay(){
 const api=(import.meta as any).env.VITE_VADALLFATE_V2_API_URL||'http://127.0.0.1:8765/api/v2';
 const [save,setSave]=useState('a');const [key,setKey]=useState('');const [role,setRole]=useState('dm');
 const [token,setToken]=useState('');const [state,setState]=useState<any>(null);const [error,setError]=useState('');
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [text,setText]=useState('I will return with the amber lantern.');
 const [status,setStatus]=useState<any>(null);
 async function call(path:string,body?:any,credential=token){
  const r=await fetch(`${api}/storage-align/${path}?save=${save}`,{method:body?'POST':'GET',
   headers:{'Content-Type':'application/json',...(credential?{'X-VadAllFate-Session-Token':credential}:{})},body:body?JSON.stringify(body):undefined});
  const data=await r.json();if(!r.ok)throw new Error(data.message||data.error||'Request refused');return data;
 }
 useEffect(()=>{setState(null);setToken('');setError('');setNotice('');void call('status',undefined,'').then(setStatus).catch(e=>setError(e.message));},[save]);
 async function login(){setBusy(true);setError('');try{const auth=await call('login',{bootstrapKey:key,role},'');
  const view=await call('state',undefined,auth.sessionToken);setToken(auth.sessionToken);setState(view);setKey('');
 }catch(e:any){setError(e.message);}finally{setBusy(false);}}
 async function act(operation:string,args:any){setBusy(true);setError('');setNotice('');try{
  const result=await call('action',{operation,arguments:args,snapshot:state.snapshot,idempotencyKey:crypto.randomUUID()});
  setState(await call('state'));setNotice(`R1 committed revision ${result.receipt.revision_after}; material request ${result.requestBytes} bytes.`);
 }catch(e:any){setError(e.message);}finally{setBusy(false);}}
 const value=(x:any)=>x?.value??'Hidden';
 return <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 space-y-5">
  <h1 className="text-2xl text-amber-400">Lantern Reach — layered Save journey</h1>
  <p>Disposable development profile. Original accounting rules; no combat or AI provider. Existing campaigns are not opened here.</p>
  <label>Disposable Save <select aria-label="Disposable Save" value={save} disabled={busy} onChange={e=>setSave(e.target.value)} className="bg-neutral-800 p-2"><option value="a">A</option><option value="b">B</option></select></label>
  <p>{status?.isCurrentlyAuthoritative?'Five pinned read-only baselines; one R1 Save writer.':'Runtime unavailable or HOLD.'}</p>
  {error&&<p role="alert" className="text-red-400">{error}</p>}{notice&&<p role="status" className="text-emerald-300">{notice}</p>}
  {!state?<section className="space-x-3"><label>Host bootstrap key <input aria-label="Host bootstrap key" type="password" value={key} onChange={e=>setKey(e.target.value)} className="bg-neutral-800 p-2"/></label>
   <label>Host role <select aria-label="Host role" value={role} onChange={e=>setRole(e.target.value)} className="bg-neutral-800 p-2"><option value="dm">DM</option><option value="player">Player</option></select></label>
   <button disabled={busy||!key} onClick={login} className="p-2 bg-amber-900">Authenticate</button></section>:
   <><p>Save {state.save_id} · revision <span data-testid="revision">{state.snapshot.revision}</span> · {state.snapshot.state_hash}</p>
   <section aria-label="Character" className="border border-neutral-700 p-4"><h2>{value(state.character.name)}</h2>
    <p>HP <span data-testid="hp">{value(state.character.hp)}</span> / {value(state.character.max_hp)}</p>
    <p>Lantern balm <span data-testid="balm">{value(state.character.potion)}</span></p>
    <button disabled={busy||value(state.character.potion)===0} onClick={()=>act('USE_BALM',{})} className="p-2 bg-emerald-900">Use lantern balm (4 HP)</button>
   </section>
   <section aria-label="World" className="border border-neutral-700 p-4"><h2>{value(state.place)}</h2><p>World minute <span data-testid="minute">{value(state.clock)}</span></p>
    <p>Lantern objective <span data-testid="progress">{value(state.quest.progress)}</span> / {value(state.quest.goal)} · {value(state.quest.complete)?'Complete':'Open'}</p>
    {state.role==='dm'&&<button disabled={busy} onClick={()=>act('ADVANCE',{minutes:5,progress:value(state.quest.complete)?0:1})} className="p-2 bg-emerald-900">Advance five minutes and objective</button>}
   </section>
   <section aria-label="NPC" className="border border-neutral-700 p-4"><h2>{value(state.npc.name)}</h2>
    {state.role==='dm'&&<><p>Trust {value(state.npc.trust)}</p><label>Witness record <input aria-label="Witness record" value={text} maxLength={160} onChange={e=>setText(e.target.value)} className="bg-neutral-800 p-2"/></label>
     <button disabled={busy||!text.trim()} onClick={()=>act('TELL_NPC',{npc:'npc.nera',text,trust_delta:1})} className="p-2 bg-emerald-900">Record testimony and approve trust +1</button>
     <p>NPC-private testimony, unverified; this is not objective truth or automatic AI recall.</p>
     <ul>{state.memory.map((m:any,i:number)=><li key={i}>{m.value.text} · {m.value.epistemic_status} · revision {m.save_revision}</li>)}</ul></>}
   </section>
   <details><summary>Mounted versions and provenance</summary><ul>{state.mounts.map((m:any)=><li key={m.layer}>{m.layer} · {m.version} · {m.sha256} · {m.licence}</li>)}</ul></details>
   {state.role==='dm'&&<button disabled={busy} onClick={async()=>{setBusy(true);try{const a=await call('audit',{});setNotice(`Independent complete audit verified revision ${a.revision}.`);}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>Run explicit complete audit</button>}
  </>}
 </main>;
}
