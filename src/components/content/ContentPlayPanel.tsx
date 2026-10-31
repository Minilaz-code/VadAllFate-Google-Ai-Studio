import React,{useEffect,useState} from 'react';
import {contentRequest,contentMutation,selectContentClosure,type ContentPack,type ContentRecord,type ContentDefinition} from '../../services/v2ContentClient.ts';
import {CampaignManager} from './CampaignManager.tsx';
import {v2BackendClient} from '../../services/v2BackendClient.ts';

const text = (s:string) => s.replace(/\{@\w+ ([^}]+)\}/g,(_,value:string)=>{const p=value.split('|');return p[2]||p[0];});
function SourceBody({value,depth=0}:{value:any;depth?:number}):React.ReactNode {
  if(depth>14 || value==null) return null;
  if(typeof value==='string') return <p className="my-2 whitespace-pre-wrap">{text(value)}</p>;
  if(Array.isArray(value)) return value.map((v,i)=><SourceBody key={i} value={v} depth={depth+1}/>);
  if(typeof value!=='object') return String(value);
  if(value.type==='image'||value.type==='gallery') return null;
  return <div className={value.type==='insetReadaloud'?'border-l-2 border-teal-600 pl-3 my-3 bg-teal-950/30':'my-2'}>
    {value.name&&<h4 className="font-semibold text-amber-200">{text(value.name)}</h4>}
    {value.rows&&<table className="w-full border border-neutral-700"><thead><tr>{(value.colLabels||[]).map((v:any,i:number)=><th key={i}>{typeof v==='string'?text(v):''}</th>)}</tr></thead><tbody>{value.rows.map((row:any,i:number)=><tr key={i}>{(Array.isArray(row)?row:row.row||[]).map((v:any,j:number)=><td className="border border-neutral-700 p-2" key={j}><SourceBody value={v} depth={depth+1}/></td>)}</tr>)}</tbody></table>}
    <SourceBody value={value.entries || value.items || value.entry || value.description} depth={depth+1}/>
    {value.trait&&<SourceBody value={value.trait} depth={depth+1}/>}
    {value.action&&<SourceBody value={value.action} depth={depth+1}/>}
  </div>;
}
function ProtectedArtwork({asset,role}:{asset:ContentDefinition['assets'][number];role:string}) {
  const [src,setSrc]=useState('');const [error,setError]=useState('');
  useEffect(()=>{let live=true;setSrc('');setError('');if(asset.status!=='present')return;
    v2BackendClient.fetchAuthenticatedAssetBlobUrl(asset.url,role).then(url=>{if(live)setSrc(url);}).catch(e=>{if(live)setError(e.message);});
    return()=>{live=false;v2BackendClient.revokeAssetBlobUrl(asset.url,role);};},[asset.url,asset.status,role]);
  return <figure className="my-3">{src&&<img src={src} alt={asset.path.split('/').pop()} className="max-h-96 max-w-full object-contain"/>}<figcaption className="text-xs text-neutral-400">{asset.status!=='present'?`Artwork unavailable: ${asset.status}`:error||(!src?'Loading protected artwork…':asset.attribution)}</figcaption></figure>;
}
export function ContentPlayPanel({role,snapshot,characters,isLive,onRefresh,isPreview=false}:{role:string;snapshot:any;characters:{id:string;name:string}[];isLive:boolean;isPreview?:boolean;onRefresh:()=>Promise<unknown>}) {
  const isDm=role==='dm'||role==='dm_host';
  const [packs,setPacks]=useState<ContentPack[]>([]);const [records,setRecords]=useState<ContentRecord[]>([]);
  const [world,setWorld]=useState('');const [adventure,setAdventure]=useState('');const [scene,setScene]=useState('');const [location,setLocation]=useState('');
  const [definition,setDefinition]=useState<ContentDefinition|null>(null);const [play,setPlay]=useState<any>({});
  const [brief,setBrief]=useState('');const [placeOnMap,setPlaceOnMap]=useState(false);const [cellX,setCellX]=useState(0);const [cellY,setCellY]=useState(0);
  const [npc,setNpc]=useState('');const [character,setCharacter]=useState('');const [message,setMessage]=useState('');const [reply,setReply]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [receipt,setReceipt]=useState('');const [expanded,setExpanded]=useState(false);
  const load=async()=>{
    if(!isLive)return;
    const p=await contentRequest('play',role);setPlay(p);
    if(isDm){const d=await contentRequest('packs',role);setPacks(d.packs);if(p.selection?.pins?.length){const r=await contentRequest('records',role);setRecords(r.records);}else setRecords([]);}
  };
  useEffect(()=>{setDefinition(null);setRecords([]);setPacks([]);setPlay({});setError('');
    if(isLive)void load().catch(e=>setError(e.message));
  },[role,isLive,snapshot?.campaignId,snapshot?.commitSequence]);
  useEffect(()=>setReceipt(''),[role,isLive,snapshot?.campaignId]);
  const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);setError('');try{await fn();}catch(e:any){setError(e.message);}finally{setBusy(false);}};
  const action=async(path:string,payload:unknown)=>{if(isPreview)throw new Error('Player preview is read only. Exit preview to act.');const r=await contentMutation(path,payload,snapshot,role);setReceipt(`Committed · ${r.receipt.commitId}`);await onRefresh();await load();};
  const inspect=async(ref:string)=>{setDefinition(null);setDefinition(await contentRequest(`definition?ref=${encodeURIComponent(ref)}`,role));};
  const button='px-3 py-2 rounded border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40';
  const field='bg-neutral-950 border border-neutral-700 rounded px-2 py-2 max-w-full';
  if(!isLive)return <div className="border-b border-neutral-800 px-4 py-2 text-xs text-amber-300">Source content is unavailable in demo or disconnected mode. Connect to Python to play with installed packs.</div>;
  return <section aria-label="Campaign source content" className="border-b border-neutral-700 bg-neutral-900 text-neutral-200 text-sm px-4 py-3 shrink-0 max-h-[60vh] overflow-auto">
    <button onClick={()=>setExpanded(!expanded)} className="font-semibold text-teal-300">{expanded?'▾':'▸'} Campaign content · LIVE {isDm?'· DM private':''}</button>
    {error&&<p role="alert" className="text-red-300 mt-2">{error} <button onClick={()=>void run(load)}>Retry</button></p>}
    {isPreview&&<p className="text-amber-300">Player preview is read only.</p>}{expanded&&<div className="space-y-3 mt-3">
      {isDm&&<>
        <CampaignManager onRefresh={onRefresh}/>
        <div className="flex flex-wrap gap-2 items-end">
          <label>World <select aria-label="World pack" className={field} value={world} onChange={e=>setWorld(e.target.value)}><option value="">Choose world</option>{packs.filter(p=>p.kind==='world').map(p=><option key={p.pin.manifest_sha256} value={p.pin.manifest_sha256}>{p.title} · {p.pin.pack_version}</option>)}</select></label>
          <label>Adventure <select aria-label="Adventure pack" className={field} value={adventure} onChange={e=>setAdventure(e.target.value)}><option value="">Choose adventure</option>{packs.filter(p=>p.kind==='adventure_campaign').map(p=><option key={p.pin.manifest_sha256} value={p.pin.manifest_sha256}>{p.title} · {p.pin.pack_version}</option>)}</select></label>
          <button className={button} disabled={busy||!world||!adventure} onClick={()=>void run(async()=>{const roots=[world,adventure].map(h=>packs.find(p=>p.pin.manifest_sha256===h)!.pin);await action('selection',{pins:selectContentClosure(packs,roots)});setDefinition(null);})}>Pin selected content</button>
        </div>
        {records.length>0&&<><div className="flex flex-wrap gap-2">
          <select aria-label="Location" className={field} value={location} onChange={e=>setLocation(e.target.value)}><option value="">Choose location</option>{records.filter(r=>r.kind==='location').map(r=><option key={r.ref} value={r.ref}>{r.name}</option>)}</select>
          <button className={button} disabled={!location||busy} onClick={()=>void run(()=>inspect(location))}>Inspect location</button>
          <select aria-label="Scene" className={field} value={scene} onChange={e=>setScene(e.target.value)}><option value="">Choose scene</option>{records.filter(r=>r.kind==='scene').map(r=><option key={r.ref} value={r.ref}>{r.name}</option>)}</select>
          <button className={button} disabled={!scene||!location||busy} onClick={()=>void run(async()=>{await action('open',{sceneRef:scene,locationRef:location});await inspect(scene);})}>Open scene</button>
        </div>
        <div className="flex flex-wrap gap-2"><select aria-label="NPC definition" className={field} value={npc} onChange={e=>setNpc(e.target.value)}><option value="">Choose NPC</option>{records.filter(r=>r.kind==='npc').map(r=><option key={r.ref} value={r.ref}>{r.name} {r.ref.endsWith('-template')?'(template)':''}</option>)}</select>
          <button className={button} disabled={!npc||busy} onClick={()=>void run(()=>inspect(npc))}>Inspect NPC</button>
          <button className={button} disabled={!npc||!play.selection?.activeScene||busy} onClick={()=>void run(()=>action('release',{npcRefs:[npc],readAloudIndexes:[]}))}>Introduce NPC to party</button>
        </div><div className="flex flex-wrap gap-2"><input aria-label="Player-safe NPC characterization" className={field} value={brief} maxLength={1200} onChange={e=>setBrief(e.target.value)} placeholder="DM-approved player-safe NPC characterization"/>
          <label><input type="checkbox" checked={placeOnMap} onChange={e=>setPlaceOnMap(e.target.checked)}/>Place token on configured active battlemap</label>
          {placeOnMap&&<><input aria-label="NPC cell X" type="number" value={cellX} onChange={e=>setCellX(Number(e.target.value))}/><input aria-label="NPC cell Y" type="number" value={cellY} onChange={e=>setCellY(Number(e.target.value))}/></>}
          <button className={button} disabled={!npc||!location||busy} onClick={()=>void run(()=>action('place',{npcRef:npc,locationRef:location,dialogueBrief:brief,...(placeOnMap?{targetCell:{x:cellX,y:cellY}}:{})}))}>Create or place source NPC</button>
        </div></>}
        {definition&&<article className="rounded border border-amber-800 p-4 bg-neutral-950"><h3 className="font-semibold text-lg">{definition.name} · DM only</h3><p className="text-xs text-neutral-500">Source material; not instructions for the runtime.</p><SourceBody value={definition.body}/>
          {definition.kind==='scene'&&play.selection?.activeScene===definition.ref&&<div className="flex gap-2 flex-wrap">{(()=>{let i=0;const buttons:React.ReactNode[]=[];const walk=(v:any)=>{if(!v||typeof v!=='object')return;if(v.type==='insetReadaloud'){const index=i++;buttons.push(<button key={index} className={button} disabled={busy} onClick={()=>void run(()=>action('release',{npcRefs:play.released?.npcs?.map((n:any)=>n.ref)||[],readAloudIndexes:[index]}))}>Release read-aloud {index+1}</button>);}for(const child of Object.values(v))if(typeof child==='object')Array.isArray(child)?child.forEach(walk):walk(child);};walk(definition.body);return buttons;})()}</div>}
          {definition.assets.map(a=><ProtectedArtwork key={a.id} asset={a} role={role}/>)}
          <details className="text-xs text-neutral-400"><summary>Source and rights</summary>{definition.sourceRefs.map((s:any,i:number)=><p key={i}>{s.path} {s.pointer} · {s.rights}</p>)}<p>{definition.references?.filter((r:any)=>r.status==='unresolved').length||0} unresolved source references</p></details>
        </article>}
      </>}
      {isDm&&play.instances?.map((n:any)=><p key={n.id}>Persistent NPC: {n.name} · {n.id} · location {n.sourceLocationRef} · {n.token?.placed?'token placed':'location association only'} · noncombat · observed memories {n.cognition?.memories?.length||0}</p>)}
      {play.released?.location&&<article aria-label="Party scene"><h3 className="text-teal-200 font-semibold">{play.released.location.name}</h3>{play.released.readAloud?.map((s:string,i:number)=><p key={i} className="my-2">{text(s)}</p>)}
        <p>Introduced: {play.released.npcs?.map((n:any)=>n.name).join(', ')||'No NPCs yet'}</p></article>}
      {play.released?.npcs?.length>0&&<div className="flex flex-wrap gap-2 items-center"><select aria-label="Speaking character" value={character} onChange={e=>setCharacter(e.target.value)} className={field}><option value="">Choose character</option>{characters.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>
        <select aria-label="Interaction NPC" value={npc} onChange={e=>setNpc(e.target.value)} className={field}><option value="">Choose introduced NPC</option>{play.released.npcs.map((n:any)=><option key={n.ref} value={n.ref}>{n.name}</option>)}</select>
        <input aria-label="Message to NPC" className={`${field} flex-1`} value={message} maxLength={1200} onChange={e=>setMessage(e.target.value)} placeholder="What do you say?"/>
        <button className={button} disabled={busy||!message.trim()||!character||!npc} onClick={()=>void run(async()=>{await action('interact',{npcRef:npc,characterId:character,message});setMessage('');})}>Speak and record</button>
      </div>}
      <p className="text-xs text-neutral-500">Interactions and witnessed memories are committed by Python. AI requests require a real configured model; failures commit no reply. Human DM replies remain available.</p>
      {play.interactions?.map((e:any)=><div key={e.id}><p>{e.narration}</p>{e.reply&&<p className="text-teal-200">{e.replyOrigin==='human_dm'?'Human DM, as the NPC':e.replyOrigin==='ai_model_dm_approved'?'AI NPC, approved by DM':'AI NPC'}: {e.reply}</p>}</div>)}
      {play.aiReplyAvailable&&play.interactions?.some((e:any)=>e.npcInstanceId&&!e.reply&&!e.aiDraft)&&<button className={button} disabled={busy||isPreview} onClick={()=>void run(async()=>{const entry=[...play.interactions].reverse().find((e:any)=>e.npcInstanceId&&!e.reply&&!e.aiDraft);await action('ai-reply',{interactionId:entry.id});})}>Request AI NPC reply</button>}
      {isDm&&play.interactions?.filter((e:any)=>e.aiDraft).map((e:any)=><div key={e.id}><p>AI draft · DM only: {e.aiDraft.reply}</p><button className={button} disabled={busy} onClick={()=>void run(()=>action('approve-ai',{interactionId:e.id}))}>Approve AI reply</button></div>)}
      {isDm&&play.interactions?.some((e:any)=>!e.reply&&e.sceneRef===play.selection?.activeScene)&&<div className="flex gap-2"><input aria-label="Human DM NPC reply" className={`${field} flex-1`} value={reply} maxLength={2400} onChange={e=>setReply(e.target.value)} placeholder="Reply in character as the human DM"/><button className={button} disabled={busy||!reply.trim()} onClick={()=>void run(async()=>{const entry=[...play.interactions].reverse().find((e:any)=>!e.reply&&e.sceneRef===play.selection?.activeScene);await action('reply',{interactionId:entry.id,reply});setReply('');})}>Send human DM reply</button></div>}
      {receipt&&<p role="status" className="text-xs text-teal-300">{receipt}</p>}
    </div>}
  </section>;
}
