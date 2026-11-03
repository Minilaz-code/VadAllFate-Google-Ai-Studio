import React, {useState} from 'react';
import type {CampaignProjection, DemoActionType} from '../../types/runtime.ts';
import {runtimeService} from '../../runtime/adapter.ts';

/** Existing legacy R1 actions only. No client-generated authoritative faces. */
export function LiveRollPanel({projection,role,actorId,isLive,isPreview,onRefresh,externalBusy=false}:{
  externalBusy?:boolean;projection:CampaignProjection;role:string;actorId?:string;isLive:boolean;isPreview:boolean;onRefresh:()=>Promise<unknown>
}) {
  const [character,setCharacter]=useState(''); const [faces,setFaces]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');
  const [hp,setHp]=useState('');const [reason,setReason]=useState('');
  const dm=role==='dm_host'||role==='dm';
  const selected=dm?(character||projection.characters[0]?.id):actorId;
  if(!isLive)return null;
  const submit=async(kind:DemoActionType,payload:Record<string,unknown>)=>{
    setBusy(true);setNotice('');
    try {
      const id=crypto.randomUUID();
      const result=await runtimeService.submitAction({actionId:id,clientNonce:id,
        actorId:dm?'dm-1':actorId!,actorRole:role as any,actionType:kind,payload,
        snapshotRef:runtimeService.getCurrentSnapshot(),timestampUtc:new Date().toISOString()});
      // submitAction already refreshes and publishes the authoritative projection.
      if(!['COMMITTED','PENDING_HUMAN_DM_APPROVAL'].includes(result.receipt.status))throw new Error(result.receipt.error||result.receipt.status);
      setNotice(result.receipt.status==='PENDING_HUMAN_DM_APPROVAL'?'Physical report saved; awaiting DM confirmation.':'Roll action committed by Python.');
    }catch(e:any){setNotice(`Action failed: ${e.message}`);}finally{setBusy(false);}
  };
  const pending=projection.pendingAdjudications||[];
  return <details className="border border-amber-900 bg-neutral-950 p-3 text-neutral-200 shrink-0" aria-label="Authoritative dice">
    <summary>Campaign dice · saved requests and DM confirmation</summary>
    <p>Python generates digital faces. Physical faces are testimony under the table policy: {projection.dicePolicy}. A basic d20 request has no automatic modifiers or combat effect.</p>
    <fieldset disabled={busy||externalBusy||isPreview||role==='observer'} className="flex flex-wrap gap-2 my-2">
      {dm&&<select aria-label="Roll character" value={selected} onChange={e=>setCharacter(e.target.value)} className="bg-neutral-900">{projection.characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      <button disabled={!selected} onClick={()=>void submit('REQUEST_ROLL',{actorId:selected,requestId:'req-'+crypto.randomUUID(),rollKind:'ability_check',formula:'1d20',dieSides:20,dieCount:1})}>Request d20 check</button>
      {dm&&<button onClick={()=>void submit('SET_DICE_POLICY',{policy:'REQUIRE_DM_CONFIRMATION'})}>Require DM confirmation of physical rolls</button>}
    </fieldset>
    {dm&&<fieldset disabled={busy||externalBusy||isPreview} className="flex flex-wrap gap-2 my-2" aria-label="DM resource adjudication">
      <label>Adjudicated HP <input aria-label="Adjudicated HP" type="number" min={0} max={projection.characters.find(c=>c.id===selected)?.maxHp} value={hp} onChange={e=>setHp(e.target.value)} className="bg-neutral-900 w-20"/></label>
      <input aria-label="HP adjudication reason" value={reason} maxLength={200} onChange={e=>setReason(e.target.value)} placeholder="DM adjudication reason" className="bg-neutral-900"/>
      <button disabled={!selected||!reason.trim()||!hp.trim()||!Number.isInteger(Number(hp))||Number(hp)<0||Number(hp)>(projection.characters.find(c=>c.id===selected)?.maxHp||0)} onClick={()=>void submit('DM_OVERRIDE_STATE',{entityId:selected,entityType:'character',path:'currentHp',value:Number(hp),reason:reason.trim()})}>Record DM HP</button>
      <span>Manual DM adjudication; no attack or source-combat mechanics.</span>
    </fieldset>}
    <div aria-label="Saved roll requests">{(projection.activeRollRequests||[]).slice(-20).map(r=><article key={r.requestId} className="border-t border-neutral-700 py-2" aria-label={`Roll ${r.requestId}`}>
      <p>{projection.characters.find(c=>c.id===r.actorId)?.name||'Character'} · {r.formula} · {r.status}</p>
      {r.resolvedOutcome&&<p>Confirmed result: {r.resolvedOutcome.total} · {r.resolvedOutcome.rollSource}</p>}
      {r.status==='PENDING_CONFIRMATION'&&<p>Reported faces: {r.reportedFaces?.join(', ')} · not yet confirmed</p>}
      <fieldset disabled={busy||externalBusy||isPreview||role==='observer'} className="flex flex-wrap gap-2">
        {r.status==='PENDING_INPUT'&&(dm||r.actorId===actorId)&&<>
          {r.allowedModes.includes('SERVER_DIGITAL')&&<button onClick={()=>void submit('SUBMIT_ROLL',{requestId:r.requestId,diceMode:'SERVER_DIGITAL'})}>Roll digitally</button>}
          {r.allowedModes.includes('PLAYER_PHYSICAL')&&<><input aria-label={`Physical faces ${r.requestId}`} value={faces[r.requestId]||''} onChange={e=>setFaces({...faces,[r.requestId]:e.target.value})} placeholder="Physical faces, comma separated" className="bg-neutral-900"/>
          <button disabled={!faces[r.requestId]?.trim()} onClick={()=>void submit('SUBMIT_ROLL',{requestId:r.requestId,diceMode:'PLAYER_PHYSICAL',rawRolls:faces[r.requestId].split(',').map(x=>Number(x.trim()))})}>Report physical roll</button></>}
        </>}
        {dm&&pending.filter(a=>a.status==='PENDING_HUMAN_DM_APPROVAL'&&(a as any).requestId===r.requestId).map(a=><React.Fragment key={a.adjudicationId}><button onClick={()=>void submit('APPROVE_ADJUDICATION',{adjudicationId:a.adjudicationId})}>Confirm physical roll</button><button onClick={()=>void submit('REJECT_ADJUDICATION',{adjudicationId:a.adjudicationId})}>Reject physical roll</button></React.Fragment>)}
      </fieldset>
    </article>)}</div>
    {externalBusy&&<p>Waiting for the current NPC action to finish.</p>}
    {notice&&<p role="status">{notice}</p>}{isPreview&&<p>Player preview is read only.</p>}
  </details>;
}
