import React,{useEffect,useRef,useState} from 'react';
import {contentRequest,contentMutation} from '../../services/v2ContentClient.ts';
import {getStoredSession} from '../../services/v2Session.ts';

export function AdventurePlayPanel({role,characters,isLive,isPreview,refreshKey,onAvailable,onRefresh}:{role:string;characters:{id:string;name:string}[];isLive:boolean;isPreview:boolean;refreshKey:string;onAvailable:(active:boolean)=>void;onRefresh:()=>Promise<unknown>}){
 const [view,setView]=useState<any>(null);const [characterId,setCharacterId]=useState('char-lyra-01');const [npcId,setNpcId]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const current=useRef<any>(null);const epoch=useRef(0);const pending=useRef(false);
 const campaign=getStoredSession().campaignId;const dm=role==='dm'||role==='dm_host';
 const load=async()=>{if(!isLive)return;const e=epoch.current;const v=await contentRequest(dm?`adventure?character_id=${encodeURIComponent(characterId)}`:'adventure',role);if(e!==epoch.current)return;current.current=v.snapshotRef;setView(v);onAvailable(Boolean(v.available));};
 useEffect(()=>{epoch.current++;setView(null);current.current=null;onAvailable(false);if(isLive)void load().catch(e=>setError(e.message));},[isLive,role,campaign,characterId]);
 useEffect(()=>{if(!pending.current&&isLive)void load().catch(e=>setError(e.message));},[refreshKey]);
 const act=async(path:string,payload:any,reply=false)=>{
  if(pending.current||isPreview)return;pending.current=true;setBusy(true);setError('');setNotice('');
  try{const result=await contentMutation(path,{characterId:view.characterId,...payload},current.current,role);await load();
   if(reply&&view?.operatingMode!=='human_sovereign'&&!['human_dm_assist','human_primary_codm'].includes(view?.operatingMode)){
    try{await contentMutation('ai-reply',{interactionId:result.receipt.actionId},current.current,role);await load();}catch(e:any){setError(`Your action was committed. NPC reply unavailable: ${e.message}`);}
   }
   await onRefresh();setNotice('Action recorded in the campaign.');
  }catch(e:any){setError(e.message);await load().catch(()=>{});}finally{pending.current=false;setBusy(false);}
 };
 if(!isLive||!view?.available)return null;
 const button='px-3 py-2 rounded border border-neutral-600 bg-neutral-800 disabled:opacity-40';const field='bg-neutral-950 border border-neutral-700 rounded p-2';
 return <section aria-label="Adventure play" className="flex-1 min-h-0 overflow-auto bg-neutral-950 p-5 text-neutral-200">
 <header className="flex flex-wrap items-center gap-4"><h2 className="text-xl text-amber-200">{view.title}</h2><p>World time {view.time}</p><p>Location: {view.location?.name||'Not yet entered'}</p>{dm&&<select aria-label="Adventure character" className={field} value={characterId} onChange={e=>setCharacterId(e.target.value)}>{characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}</header>
 {isPreview&&<p>Player preview is read only.</p>}{error&&<p role="alert" className="text-red-300">{error} <button onClick={()=>void load()}>Refresh</button></p>}{notice&&<p role="status" className="text-teal-300">{notice}</p>}
 <fieldset disabled={busy||isPreview} className="flex flex-wrap gap-3 my-4">
 {!view.location&&<button className={button} onClick={()=>void act('enter',{locationRef:view.start.ref})}>Enter {view.start.name}</button>}
 {view.location&&<><button className={button} onClick={()=>void act('wait',{minutes:5})}>Wait five minutes</button><button className={button} onClick={()=>void act('wait',{minutes:20})}>Wait twenty minutes</button>{view.destinations.map((d:any)=><button className={button} key={d.ref} onClick={()=>void act('travel',{locationRef:d.ref})}>Travel to {d.name} · five minutes</button>)}</>}
 </fieldset>
 <div className="grid md:grid-cols-[1fr_2fr] gap-5"><aside className="space-y-4"><section aria-label="People present"><h3 className="font-semibold">People here now</h3>{view.npcs.map((n:any)=><p key={n.id}>{n.name}</p>)}{view.location&&!view.npcs.length&&<p>No one is currently available.</p>}</section>
 <section aria-label="Released player knowledge"><h3 className="font-semibold">What you have learned</h3>{view.knowledge?.length?view.knowledge.map((k:any,i:number)=><p key={i}>{k.npcName}: {k.text} ({k.category})</p>):<p>No additional knowledge has been released.</p>}</section>
 <section aria-label="Adventure quest"><h3 className="font-semibold">{view.quest.accepted?'Current quest':'Available lead'} · {view.quest.status}</h3><ol>{view.quest.objectives.map((o:any)=><li key={o.id}>{o.isCompleted?'✓':'○'} {o.description}</li>)}</ol></section>
 <fieldset disabled={busy||isPreview} className="space-y-2">{view.topics.map((t:any)=><button key={t.id} className={button} onClick={()=>void act('topic',{npcId:t.npcId,topicId:t.id},true)}>{t.label}</button>)}</fieldset>
 </aside><div><div aria-label="Primary adventure story feed" className="space-y-3 max-h-[55vh] overflow-auto">{view.events.map((e:any)=><article key={e.eventId} className="border-l-2 border-teal-800 pl-3"><p className="text-xs text-neutral-500">World minute {e.worldMinute}</p>{e.playerMessage&&<p>You: {e.playerMessage}</p>}{e.npcReply?<p>{e.targetNpcName||'NPC'}: {e.npcReply}</p>:!e.playerMessage&&<p>{e.narration||e.summary}</p>}{e.questChanges?.map((q:any)=><p key={q.questId} className="text-amber-300">Quest {q.status}: {q.title}</p>)}</article>)}</div>
 <fieldset disabled={busy||isPreview||!view.npcs.length} className="flex flex-wrap gap-2 mt-4"><select aria-label="Talk to present NPC" className={field} value={npcId} onChange={e=>setNpcId(e.target.value)}><option value="">Choose someone present</option>{view.npcs.map((n:any)=><option key={n.id} value={n.id}>{n.name}</option>)}</select><input aria-label="Adventure dialogue" className={`${field} flex-1`} value={message} maxLength={1200} onChange={e=>setMessage(e.target.value)} placeholder="What do you say?"/><button className={button} disabled={!message.trim()||!view.npcs.some((n:any)=>n.id===npcId)} onClick={()=>void act('talk',{npcId,message},true).then(()=>setMessage(''))}>Speak</button></fieldset>
 {busy&&<p>Resolving your action…</p>}</div></div>
 </section>;
}
