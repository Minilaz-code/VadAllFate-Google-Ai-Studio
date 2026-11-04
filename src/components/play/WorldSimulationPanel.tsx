import {commitmentStatus} from '../../runtime/agendaPresentation.ts';
import React,{useEffect,useState,useRef} from 'react';
import {contentRequest,contentMutation} from '../../services/v2ContentClient.ts';
import {getStoredSession} from '../../services/v2Session.ts';

/** Development-only view of committed R1 projections; no local simulation. */
export function WorldSimulationPanel({initial,role,npcs,isPreview,onRefresh}:{initial:any;role:string;npcs:any[];isPreview:boolean;onRefresh:()=>Promise<unknown>}){
 const [world,setWorld]=useState(initial);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [actors,setActors]=useState<string[]>(['','','']);const [routines,setRoutines]=useState<any[]>([]);const [routine,setRoutine]=useState('');const [individual,setIndividual]=useState('');const [due,setDue]=useState('');const [parent,setParent]=useState('');const [location,setLocation]=useState('');const [agendaSources,setAgendaSources]=useState<any[]>([]);const [agendaSource,setAgendaSource]=useState('');const [agendaApproved,setAgendaApproved]=useState(false);const [agendaPage,setAgendaPage]=useState<any>(null);const locked=useRef(false);const dm=['dm','dm_host'].includes(role);
 useEffect(()=>{setWorld(initial);},[initial]);
 useEffect(()=>{if(dm&&initial?.causalScheduler&&!isPreview)contentRequest('routines',role).then(v=>setRoutines(v.entries)).catch(e=>setError(e.message));},[dm,role,initial?.causalScheduler,isPreview]);
 useEffect(()=>{if(dm&&initial?.agendaContract&&!isPreview){contentRequest('agenda-sources',role).then(v=>setAgendaSources(v.entries)).catch(e=>setError(e.message));contentRequest('world-agendas?limit=5',role).then(setAgendaPage).catch(e=>setError(e.message));}},[dm,role,initial?.agendaContract,isPreview]);
 const loadAgendas=async(after='')=>setAgendaPage(await contentRequest(`world-agendas?limit=5&after=${encodeURIComponent(after)}`,role));
 const selectedAgenda=agendaSources.find(a=>a.source.id===agendaSource);
 const agenda=async(admit:boolean)=>{if(locked.current||isPreview)return;locked.current=true;setBusy(true);setError('');try{let current=await contentRequest('world',role);if(admit){if(!agendaApproved||!individual||!selectedAgenda)throw new Error('Inspect and approve the selected source agenda.');await contentMutation('world-agenda',{id:crypto.randomUUID(),npc:individual,source:selectedAgenda.source},current.snapshotRef,role);current=await contentRequest('world',role);}const result=await contentRequest('world-activate',role,{payload:{budget:8},snapshotRef:current.snapshotRef,actionId:crypto.randomUUID()});if(result.status==='ERROR')throw new Error(`Integrity / authority error: ${result.error.message}`);setWorld(await contentRequest('world',role));await loadAgendas();await onRefresh();}catch(e:any){setError(e.message);try{setWorld(await contentRequest('world',role));await loadAgendas();}catch{}}finally{locked.current=false;setBusy(false);}};
 const locations=[...new Set(routines.flatMap(r=>r.definition.kind==='APPOINTMENT'?[r.definition.location]:[r.definition.route.origin,r.definition.route.destination]))];
 const edit=async(kind:string)=>{if(locked.current||isPreview)return;locked.current=true;setBusy(true);setError('');try{const current=await contentRequest('world',role);const selected=routines.find(r=>r.source.id===routine);await contentMutation(kind==='schedule'?'world-schedule':'world-associate',kind==='schedule'?{id:crypto.randomUUID(),npc:individual,source:selected.source,due:Number(due),parent}:{npc:individual,location},current.snapshotRef,role);setWorld(await contentRequest('world',role));await onRefresh();}catch(e:any){setError(e.message);}finally{locked.current=false;setBusy(false);}};
 const run=async(kind:string)=>{if(locked.current||isPreview)return;locked.current=true;setBusy(true);setError('');const selection=JSON.stringify(getStoredSession());
  try{let current=await contentRequest('world',role);if(selection!==JSON.stringify(getStoredSession()))throw new Error('Session changed; reload world view.');
   if(kind!=='resume'){await contentMutation(kind==='enrol'?'world-enrol':'world-advance',kind==='enrol'?{visitor:actors[0],listener:actors[1],outsider:actors[2]}:{minutes:Number(kind)},current.snapshotRef,role);current=await contentRequest('world',role);}
   // New profile continues on the authenticated host; the browser never simulates events.
   if(current.causalScheduler&&current.plan?.processing){const batch=await contentRequest('world-run',role,{payload:{budget:20},snapshotRef:current.snapshotRef,actionId:crypto.randomUUID()});if(batch.status==='ERROR')throw new Error(`Integrity / authority error: ${batch.error.message}`);current=await contentRequest('world',role);}
   else if(!current.causalScheduler){for(let i=0;i<20&&current.plan?.processing;i++){if(selection!==JSON.stringify(getStoredSession()))throw new Error('Session changed; resume with the selected Save.');await contentMutation('world-step',{},current.snapshotRef,role);current=await contentRequest('world',role);setWorld(current);}}
   setWorld(current);if(current.agendaContract)await loadAgendas();await onRefresh();
  }catch(e:any){setError(e.message);try{setWorld(await contentRequest('world',role));}catch{}}
  finally{setBusy(false);locked.current=false;}
 };
 if(!world)return null;
 return <section aria-label="Living world" className="border border-teal-800 p-3 my-4 space-y-2">
 <h3>Living world — controlled original region</h3><p>Master World Clock: minute {world.minute}. Offline time: {world.offlinePolicy}. Day {world.calendar.day}, {String(world.calendar.hour).padStart(2,'0')}:{String(world.calendar.minute).padStart(2,'0')}</p>
 <p>Regional weather: {world.weather.condition} (effective minute {world.weather.minute})</p>
 {dm&&<fieldset disabled={busy||isPreview} className="flex flex-wrap gap-2">
 {!world.agendaContract&&!world.plan?.actors.length&&<>{['Visitor','Listener','Uninformed NPC'].map((label,i)=><label key={label}>{label}<select aria-label={`World ${label}`} value={actors[i]} onChange={e=>setActors(a=>a.map((v,n)=>n===i?e.target.value:v))}><option value="">Choose individual</option>{npcs.map(n=><option key={n.id} value={n.id}>{n.name} · {n.id}</option>)}</select></label>)}<button disabled={new Set(actors.filter(Boolean)).size!==3} onClick={()=>void run('enrol')}>Approve original world routine</button></>}
 {['30','40','140'].map(n=><button key={n} disabled={world.plan?.processing||Boolean(world.agendaActivation?.agenda)} onClick={()=>void run(n)}>Advance world {n} minutes</button>)}
 <button disabled={!world.plan?.processing} onClick={()=>void run('resume')}>Resume pending world events</button>
 </fieldset>}
 {dm&&world.causalScheduler&&<fieldset disabled={busy||isPreview||world.plan?.processing||Boolean(world.agendaActivation?.agenda)} className="flex flex-wrap gap-2">
 <legend>Source-backed individual routines</legend>
 <label>Routine individual<select aria-label="Routine individual" value={individual} onChange={e=>setIndividual(e.target.value)}><option value="">Choose individual</option>{npcs.map(n=><option key={n.id} value={n.id}>{n.name} · {n.id}</option>)}</select></label>
 {!world.agendaContract&&<><label>Approved routine<select aria-label="Approved routine" value={routine} onChange={e=>setRoutine(e.target.value)}><option value="">Choose source activity</option>{routines.map(r=><option key={r.source.id} value={r.source.id}>{r.name} ({r.kind})</option>)}</select></label>
 <label>Due world minute<input aria-label="Due world minute" type="number" min={world.minute+1} value={due} onChange={e=>setDue(e.target.value)}/></label>
 <label>Prerequisite event<select aria-label="Prerequisite event" value={parent} onChange={e=>setParent(e.target.value)}><option value="">Independent</option>{world.jobs.map((j:any)=><option key={j.id} value={j.id}>{j.id} ({j.status})</option>)}</select></label>
 <button disabled={!individual||!routine||Number(due)<=world.minute} onClick={()=>void edit('schedule')}>Schedule approved activity</button></>}
 <label>Approved association<select aria-label="Approved association" value={location} onChange={e=>setLocation(e.target.value)}><option value="">Choose location</option>{locations.map(loc=><option key={loc} value={loc}>{loc}</option>)}</select></label>
 <button disabled={!individual||!location} onClick={()=>void edit('associate')}>Associate individual with location</button>
 </fieldset>}
 {dm&&world.agendaContract&&<section aria-label="Approved NPC agendas" className="border p-2 space-y-2">
 <fieldset disabled={busy||isPreview||world.plan?.processing||Boolean(world.agendaActivation?.agenda)}>
 <label>Approved source agenda<select aria-label="Approved source agenda" value={agendaSource} onChange={e=>{setAgendaSource(e.target.value);setAgendaApproved(false);}}><option value="">Inspect source agenda</option>{agendaSources.map(a=><option key={a.source.id} value={a.source.id}>{a.definition.name} · {a.source.id}</option>)}</select></label>
 {selectedAgenda&&<div aria-label="Agenda source preview"><p>{selectedAgenda.source.id} · {selectedAgenda.source.version} · {selectedAgenda.source.value_hash}</p>{selectedAgenda.definition.commitments.map((c:any)=><p key={c.slot}>{c.slot}: {c.routine.id}, +{c.offset} minutes; priority {c.priority}; appointment reservation {c.duration} minutes (travel uses source ETA); requires {c.parent||'none'}; alternative {c.fallback?`${c.fallback.on} → ${c.fallback.routine.id} after ${c.fallback.delay} minutes, once`:'none'}</p>)}</div>}
 <label><input aria-label="Approve source agenda" type="checkbox" checked={agendaApproved} onChange={e=>setAgendaApproved(e.target.checked)}/>DM approves these source commitments for the selected routine individual</label>
 <button disabled={!individual||!selectedAgenda||!agendaApproved} onClick={()=>void agenda(true)}>Approve and schedule NPC agenda</button>
 </fieldset>
 <button disabled={busy||isPreview||!world.agendaActivation?.agenda} onClick={()=>void agenda(false)}>Resume agenda activation</button>
 <p>Activation is a bounded sequence of native R1 commits; accepted work survives interruption.</p>
 {agendaPage?.entries.map((a:any)=><article key={a.root.id}><h4>{a.name}: {a.root.npc} · activation {a.root.status}</h4><p>Availability: {a.travel?.journey?`travelling ${a.travel.journey}`:a.availability&&world.minute<a.availability.until?`committed until ${a.availability.until}`:'no current commitment'}</p>{a.commitments.map((c:any)=><div key={c.slot}><p>{c.slot}: {commitmentStatus(c)}; due {c.due}; priority {c.priority}; job {c.job?.id||'not activated'}; reason {c.job?.outcome?.reason||c.arrival?.outcome?.reason||'none'}; precondition {c.job?.outcome?.precondition||c.arrival?.outcome?.precondition||'none'}</p>{c.alternative&&<p>Source-approved alternative: {c.alternative.status}; due {c.alternative.due}; cause {c.alternative.agenda.trigger}; job {c.alternative.id}; reason {c.alternative.outcome?.reason||'none'}</p>}</div>)}</article>)}
 <button disabled={busy||isPreview} onClick={()=>void loadAgendas().catch(e=>setError(e.message))}>First agenda page</button><button disabled={busy||isPreview||!agendaPage?.next} onClick={()=>void loadAgendas(agendaPage.next).catch(e=>setError(e.message))}>Next agenda page</button>
 </section>}
 {busy&&<p role="status">Processing bounded R1 world events…</p>}{error&&<p role="alert">{error}. Committed work is retained. Domain rejections appear in scheduled events; unresolved errors require investigation.</p>}
 {world.plan?.processing&&<p>World consequences are pending. Further actions wait for explicit scheduler completion.</p>}
 {world.people?.map((p:any)=><p key={p.id}>{p.name||'Unnamed'} · {p.id}: {p.location} ({p.lifecycle})</p>)}
 {world.journeys.map((j:any)=><p key={`${j.npc}:${j.cause}`}>Journey {j.npc}: {j.origin} → {j.destination}; {j.status}; depart {j.departure}, ETA {j.eta}; base {j.baseMinutes} minutes under {j.weather}. Named association only.</p>)}
 {dm&&<details><summary>Scheduled events and provenance</summary>{world.jobs.map((j:any)=><p key={j.id}>{j.kind}: {j.status}, due {j.due}, target {j.target}; cause {j.cause}; completion {j.completion||'pending'}{j.outcome&&<>; rejected because {j.outcome.reason}; prerequisite {j.outcome.dependency||'none'}</>}</p>)}</details>}
 {world.factions.map((f:any)=><p key={f.faction}>Faction {f.faction}: standing {f.standing}; clock {f.clock.filled_segments}/{f.clock.max_segments}</p>)}
 {dm&&<details><summary>Authorised NPC knowledge</summary>{world.memories.map((m:any,i:number)=><p key={i}>{m.npc}: {m.text} ({m.epistemic_status}; sender {m.sender||m.actor}; minute {m.minute})</p>)}</details>}
 {world.news.map((n:any)=><article key={n.issue.issueId}><h4>{n.issue.title} · published {n.issue.publicationMinute}</h4>{n.issue.stories.map((s:any,i:number)=><p key={i}>{s.headline} [{s.claimType}; {s.source}]</p>)}</article>)}
 {dm&&<details><summary>Recent committed world evidence</summary>{world.recentEvents.map((e:any)=><p key={e.event_id}>Revision {e.revision}: {e.event_id}</p>)}</details>}
 </section>;
}
