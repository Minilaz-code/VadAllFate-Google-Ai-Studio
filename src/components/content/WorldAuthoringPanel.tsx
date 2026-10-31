import React,{useState} from 'react';

/** Structured DM authoring over existing quest/activity commands; no client state authority. */
export function WorldAuthoringPanel({play,records,action}:{play:any;records:any[];action:(path:string,payload:any)=>Promise<unknown>}){
 const [title,setTitle]=useState('');const [giver,setGiver]=useState('');const [description,setDescription]=useState('');
 const [kind,setKind]=useState('visit');const [location,setLocation]=useState('');const [npc,setNpc]=useState('');const [eventKey,setEventKey]=useState('');
 const [start,setStart]=useState(0);const [end,setEnd]=useState(5);const [prior,setPrior]=useState('');const [objectives,setObjectives]=useState<any[]>([]);
 const [scheduleNpc,setScheduleNpc]=useState('');const [activities,setActivities]=useState<any[]>([]);const [goal,setGoal]=useState('');const [present,setPresent]=useState(true);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');
 const field='bg-neutral-950 border border-neutral-700 rounded p-2';const button='border border-neutral-600 rounded px-3 py-2 disabled:opacity-40';
 const instances=play.instances||[];const locations=records.filter(r=>r.kind==='location');
 const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);setError('');setNotice('');try{await fn();setNotice('Approved changes committed to this campaign.');}catch(e:any){setError(e.message);}finally{setBusy(false);}};
 const condition=()=>kind==='visit'?{kind,locationRef:location}:kind==='information_received'?{kind,npcId:npc}:kind==='objective_completed'?{kind,questId:prior.split('|')[0],objectiveId:prior.split('|')[1]}:kind==='time_event'?{kind,eventKey,startMinute:start,endMinute:end,...(location?{locationRef:location}:{})}:{kind,eventKey};
 const canAdd=description.trim()&&(kind!=='visit'||location)&&(kind!=='information_received'||npc)&&(kind!=='objective_completed'||prior)&&(!['time_event','approved_event'].includes(kind)||eventKey.trim());
 return <details className="border border-neutral-700 rounded p-3"><summary>Author quests and NPC appointments · DM only</summary>
 <p>Current world minute: {play.worldMinute}. Each objective uses a committed event. Receiving a report does not establish its truth. Time windows use absolute campaign world minutes. Physical movement uses the existing calibrated VTT.</p>
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <fieldset disabled={busy} className="space-y-3"><h4>Create a quest chain</h4>
 <input aria-label="Authored quest title" className={field} value={title} maxLength={100} onChange={e=>setTitle(e.target.value)} placeholder="Quest title"/>
 <select aria-label="Authored quest giver" className={field} value={giver} onChange={e=>setGiver(e.target.value)}><option value="">Choose giver</option>{instances.map((n:any)=><option key={n.id} value={n.id}>{n.name}</option>)}</select>
 <input aria-label="Authored objective description" className={field} value={description} maxLength={300} onChange={e=>setDescription(e.target.value)} placeholder="What must happen?"/>
 <select aria-label="Authored objective condition" className={field} value={kind} onChange={e=>setKind(e.target.value)}>{[['visit','Visit a location'],['information_received','NPC receives information'],['time_event','Approved event in a time window'],['approved_event','DM approves an event'],['objective_completed','Earlier quest objective completes']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
 {['visit','time_event'].includes(kind)&&<select aria-label="Authored objective location" className={field} value={location} onChange={e=>setLocation(e.target.value)}><option value="">{kind==='time_event'?'Any approved event location':'Choose location'}</option>{locations.map(l=><option key={l.ref} value={l.ref}>{l.name}</option>)}</select>}
 {kind==='information_received'&&<select aria-label="Authored objective NPC" className={field} value={npc} onChange={e=>setNpc(e.target.value)}><option value="">Choose recipient</option>{instances.map((n:any)=><option key={n.id} value={n.id}>{n.name}</option>)}</select>}
 {['time_event','approved_event'].includes(kind)&&<input aria-label="Authored event key" className={field} value={eventKey} maxLength={80} onChange={e=>setEventKey(e.target.value)} placeholder="Approved event key"/>}
 {kind==='objective_completed'&&<select aria-label="Authored prior objective" value={prior} onChange={e=>setPrior(e.target.value)} className={field}><option value="">Choose prior objective</option>{play.quests?.flatMap((q:any)=>q.objectives.map((o:any)=><option key={q.id+'|'+o.id} value={q.id+'|'+o.id}>{q.title}: {o.description}</option>))}</select>}
 {kind==='time_event'&&<><input aria-label="Objective start world minute" type="number" value={start} onChange={e=>setStart(Number(e.target.value))}/><input aria-label="Objective end world minute" type="number" value={end} onChange={e=>setEnd(Number(e.target.value))}/></>}
 <button className={button} disabled={!eventKey.trim()} onClick={()=>void run(()=>action('world-event',{eventKey}))}>Approve occurrence of event</button>
 <button className={button} disabled={!canAdd||objectives.length>=16} onClick={()=>{const id=`objective-${objectives.length+1}`;setObjectives([...objectives,{id,description,condition:condition(),...(objectives.length?{prerequisites:[objectives[objectives.length-1].id]}:{})}]);setDescription('');}}>Add next objective</button>
 <ol>{objectives.map(o=><li key={o.id}>{o.description} · {o.condition.kind}</li>)}</ol>
 <button className={button} disabled={!objectives.length} onClick={()=>setObjectives([])}>Clear draft objectives</button>
 <button className={button} disabled={!title.trim()||!giver||!objectives.length} onClick={()=>void run(async()=>{await action('event-quest',{npcId:giver,title,objectives});setObjectives([]);setTitle('');})}>Approve quest chain</button>
 </fieldset><hr className="my-3"/><fieldset disabled={busy} className="space-y-3"><h4>Approve an NPC activity schedule</h4>
 <select aria-label="Authored schedule NPC" className={field} value={scheduleNpc} onChange={e=>setScheduleNpc(e.target.value)}><option value="">Choose NPC</option>{instances.map((n:any)=><option key={n.id} value={n.id}>{n.name}</option>)}</select>
 <ul aria-label="Existing NPC activities">{play.npcRoutines?.routines?.[scheduleNpc]?.map((a:any,i:number)=><li key={i}>{a.fromMinute??a.start}–{a.toMinute??a.end}: {a.goal}</li>)}</ul>
 <select aria-label="Authored activity location" className={field} value={location} onChange={e=>setLocation(e.target.value)}><option value="">Choose location</option>{locations.map(l=><option key={l.ref} value={l.ref}>{l.name}</option>)}</select>
 <input aria-label="Activity start world minute" type="number" value={start} onChange={e=>setStart(Number(e.target.value))}/><input aria-label="Activity end world minute" type="number" value={end} onChange={e=>setEnd(Number(e.target.value))}/>
 <input aria-label="Authored activity goal" className={field} value={goal} maxLength={200} onChange={e=>setGoal(e.target.value)} placeholder="Approved activity"/>
 <label><input type="checkbox" checked={present} onChange={e=>setPresent(e.target.checked)}/>Available for conversation here</label>
 <button className={button} disabled={!location||!goal.trim()||start<0||end<=start||activities.length>=12} onClick={()=>setActivities([...activities,{fromMinute:start,toMinute:end,locationRef:location,present,goal}])}>Add activity interval</button>
 <ol>{activities.map((a,i)=><li key={i}>{a.fromMinute}–{a.toMinute}: {a.goal} · {a.present?'available':'unavailable'}</li>)}</ol>
 <button className={button} disabled={!activities.length} onClick={()=>setActivities([])}>Clear draft activities</button>
 <p>Approving replaces this NPC's existing routine. Intervals must be ordered and non-overlapping; no geometry is inferred.</p>
 <button className={button} disabled={!scheduleNpc||!activities.length} onClick={()=>void run(async()=>{await action('activities',{npcId:scheduleNpc,activities});setActivities([]);})}>Approve replacement activity schedule</button>
 </fieldset></details>;
}
