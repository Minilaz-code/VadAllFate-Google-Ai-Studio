import React,{useEffect,useState,useRef} from 'react';
import {contentRequest,contentMutation} from '../../services/v2ContentClient.ts';
import {getStoredSession} from '../../services/v2Session.ts';

/** Development-only view of committed R1 projections; no local simulation. */
export function WorldSimulationPanel({initial,role,npcs,isPreview,onRefresh}:{initial:any;role:string;npcs:any[];isPreview:boolean;onRefresh:()=>Promise<unknown>}){
 const [world,setWorld]=useState(initial);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [actors,setActors]=useState<string[]>(['','','']);const locked=useRef(false);const dm=['dm','dm_host'].includes(role);
 useEffect(()=>{setWorld(initial);},[initial]);
 const run=async(kind:string)=>{if(locked.current||isPreview)return;locked.current=true;setBusy(true);setError('');const selection=JSON.stringify(getStoredSession());
  try{let current=await contentRequest('world',role);if(selection!==JSON.stringify(getStoredSession()))throw new Error('Session changed; reload world view.');
   if(kind!=='resume'){await contentMutation(kind==='enrol'?'world-enrol':'world-advance',kind==='enrol'?{visitor:actors[0],listener:actors[1],outsider:actors[2]}:{minutes:Number(kind)},current.snapshotRef,role);current=await contentRequest('world',role);}
   // Every consequence has a separate bounded receipt. Durable plan remains on interruption.
   for(let i=0;i<20&&current.plan?.processing;i++){if(selection!==JSON.stringify(getStoredSession()))throw new Error('Session changed; resume with the selected Save.');await contentMutation('world-step',{},current.snapshotRef,role);current=await contentRequest('world',role);setWorld(current);}
   setWorld(current);await onRefresh();
  }catch(e:any){setError(e.message);try{setWorld(await contentRequest('world',role));}catch{}}
  finally{setBusy(false);locked.current=false;}
 };
 if(!world)return null;
 return <section aria-label="Living world" className="border border-teal-800 p-3 my-4 space-y-2">
 <h3>Living world — controlled original region</h3><p>Master World Clock: minute {world.minute}. Offline time: {world.offlinePolicy}. Day {world.calendar.day}, {String(world.calendar.hour).padStart(2,'0')}:{String(world.calendar.minute).padStart(2,'0')}</p>
 <p>Regional weather: {world.weather.condition} (effective minute {world.weather.minute})</p>
 {dm&&<fieldset disabled={busy||isPreview} className="flex flex-wrap gap-2">
 {!world.plan?.actors.length&&<>{['Visitor','Listener','Uninformed NPC'].map((label,i)=><label key={label}>{label}<select aria-label={`World ${label}`} value={actors[i]} onChange={e=>setActors(a=>a.map((v,n)=>n===i?e.target.value:v))}><option value="">Choose individual</option>{npcs.map(n=><option key={n.id} value={n.id}>{n.name} · {n.id}</option>)}</select></label>)}<button disabled={new Set(actors.filter(Boolean)).size!==3} onClick={()=>void run('enrol')}>Approve original world routine</button></>}
 {['30','40','140'].map(n=><button key={n} disabled={world.plan?.processing} onClick={()=>void run(n)}>Advance world {n} minutes</button>)}
 <button disabled={!world.plan?.processing} onClick={()=>void run('resume')}>Resume pending world events</button>
 </fieldset>}
 {busy&&<p role="status">Processing bounded R1 world events…</p>}{error&&<p role="alert">{error}. Committed work is retained; resume pending events.</p>}
 {world.plan?.processing&&<p>World consequences are pending. Further actions wait for explicit scheduler completion.</p>}
 {world.people?.map((p:any)=><p key={p.id}>{p.name||'Unnamed'} · {p.id}: {p.location} ({p.lifecycle})</p>)}
 {world.journeys.map((j:any)=><p key={j.npc}>Journey {j.npc}: {j.origin} → {j.destination}; {j.status}; depart {j.departure}, ETA {j.eta}; base {j.baseMinutes} minutes under {j.weather}. Named association only.</p>)}
 {dm&&<details><summary>Scheduled events and provenance</summary>{world.jobs.map((j:any)=><p key={j.id}>{j.kind}: {j.status}, due {j.due}, target {j.target}; cause {j.cause}; completion {j.completion||'pending'}</p>)}</details>}
 {world.factions.map((f:any)=><p key={f.faction}>Faction {f.faction}: standing {f.standing}; clock {f.clock.filled_segments}/{f.clock.max_segments}</p>)}
 {dm&&<details><summary>Authorised NPC knowledge</summary>{world.memories.map((m:any,i:number)=><p key={i}>{m.npc}: {m.text} ({m.epistemic_status}; sender {m.sender||m.actor}; minute {m.minute})</p>)}</details>}
 {world.news.map((n:any)=><article key={n.issue.issueId}><h4>{n.issue.title} · published {n.issue.publicationMinute}</h4>{n.issue.stories.map((s:any,i:number)=><p key={i}>{s.headline} [{s.claimType}; {s.source}]</p>)}</article>)}
 {dm&&<details><summary>Recent committed world evidence</summary>{world.recentEvents.map((e:any)=><p key={e.event_id}>Revision {e.revision}: {e.event_id}</p>)}</details>}
 </section>;
}
