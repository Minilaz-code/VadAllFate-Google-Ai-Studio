import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
test('connected adventure in PLAY with actual local model and durable quest',async({page})=>{
 test.setTimeout(300000);page.setDefaultTimeout(20000);test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Dedicated private runtime required');
 const record=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(record.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const source=page.getByRole('region',{name:'Campaign source content'});await source.getByRole('button',{name:/Campaign content/}).click();
 const prepared=await page.evaluate(async()=>{const p='/src/services/v2ContentClient.ts';const c=await import(p);return (await c.contentRequest('adventure','dm')).available;});
 if(process.env.VADALLFATE_E2E_PHASE!=='resume'&&!prepared){
 await page.evaluate(async()=>{const p='/src/services/v2ContentClient.ts';const c=await import(p);const packs=(await c.contentRequest('packs','dm')).packs;const ids=['personal.waterdeep.handoff.world','personal.waterdeep.handoff.adventure'];const roots=ids.map(id=>packs.find((p:any)=>p.pin.pack_id===id).pin);await c.contentMutation('selection',{pins:c.selectContentClosure(packs,roots)},(await c.contentRequest('play','dm')).snapshotRef,'dm');});
 await page.reload();await source.getByRole('button',{name:/Campaign content/}).click();
 await source.getByText('Prepare a connected noncombat adventure · DM only',{exact:true}).click();
 for(const [label,value] of [['Adventure host','personal.waterdeep.handoff.world:durnan'],['Appointment contact','personal.waterdeep.handoff.world:volo'],['Adventure start location','personal.waterdeep.handoff.world:yawning-portal'],['Appointment location','personal.waterdeep.handoff.world:yawning-portal'],['Adventure source scene','personal.waterdeep.handoff.adventure:yawning-portal-opening']])await source.getByLabel(label,{exact:true}).selectOption(value);
 await source.getByText('Approve these identities, draft instances and the appointment conditions for this campaign',{exact:true}).click();await source.getByRole('button',{name:'Prepare adventure',exact:true}).click();
 }
 await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible({timeout:20000});
 await page.getByLabel('Select Role and Hosting Status').click();await page.getByRole('button',{name:'Player Guest: Lyra',exact:false}).click();
 const play=page.getByRole('region',{name:'Adventure play'});
 if(['branch','branch-resume'].includes(process.env.VADALLFATE_E2E_PHASE||'')){if(process.env.VADALLFATE_E2E_PHASE==='branch')await play.getByRole('button',{name:'Wait twenty minutes',exact:true}).click();await expect(play.getByText('Current quest · failed',{exact:true})).toBeVisible();return;}
 if(process.env.VADALLFATE_E2E_PHASE==='resume'){await expect(play.getByText('Current quest · completed',{exact:true})).toBeVisible();await expect(play.getByLabel('Primary adventure story feed').getByText(/^Durnan:/).first()).toBeVisible();
 const recovered=await page.evaluate(async()=>{const p='/src/services/v2ContentClient.ts';return (await import(p)).contentRequest('play','dm');});
 const contact=recovered.instances.find((n:any)=>n.sourceBinding?.ref==='personal.waterdeep.handoff.world:volo');expect(contact.sourceBinding.pin.pack_version).toBe('1.0.0');expect(contact.cognition.memories.some((m:any)=>m.action_type==='APPROVED_SCHEDULE_EVENT')).toBe(true);expect(contact.cognition.beliefs.admittedKnowledge.some((k:any)=>k.shareWithCharacterId==='char-lyra-01')).toBe(true);return;}
 await play.getByRole('button',{name:/Enter .*Yawning Portal/}).click();await expect(play.getByLabel('People present').getByText('Durnan',{exact:true})).toBeVisible();await expect(play.getByLabel('People present').getByText('Volothamp Geddarm',{exact:true})).toHaveCount(0);
 const ai1=page.waitForResponse(r=>r.url().includes('/content/ai-reply')&&r.request().method()==='POST',{timeout:120000});await play.getByRole('button',{name:'Accept the appointment lead',exact:true}).click();expect((await (await ai1).json()).receipt.status).toBe('COMMITTED');
 await expect(play.getByText('Action recorded in the campaign.',{exact:true})).toBeVisible();const checkpoint=await page.evaluate(async()=>{const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);const r=await fetch('http://127.0.0.1:8876/api/v2/campaigns/saves',{method:'POST',headers:{'Content-Type':'application/json','X-VadAllFate-Session-Token':s.dm},body:JSON.stringify({name:'Before appointment outcome'})});if(!r.ok)throw new Error('Checkpoint failed');return r.json();});
 if(process.env.VADALLFATE_E2E_CHECKPOINT_OUTPUT)writeFileSync(process.env.VADALLFATE_E2E_CHECKPOINT_OUTPUT,JSON.stringify(checkpoint));
 await play.getByRole('button',{name:'Wait five minutes',exact:true}).click();await expect(play.getByLabel('People present').getByText('Volothamp Geddarm',{exact:true})).toBeVisible();
 const ai2=page.waitForResponse(r=>r.url().includes('/content/ai-reply')&&r.request().method()==='POST',{timeout:120000});await play.getByRole('button',{name:'Deliver the agreed report',exact:true}).click();expect((await (await ai2).json()).receipt.status).toBe('COMMITTED');await expect(play.getByText('Current quest · completed',{exact:true})).toBeVisible();
 const proof=await page.evaluate(async()=>{const p='/src/services/v2ContentClient.ts';const c=await import(p);return c.contentRequest('play','dm');});
 const replies=proof.interactions.filter((i:any)=>i.replyOrigin==='ai_model');expect(replies.length).toBeGreaterThanOrEqual(2);for(const r of replies)expect(r.aiProvenance.provider).toContain('ollama-live:');
 const d=proof.instances.find((n:any)=>n.name==='Durnan');const v=proof.instances.find((n:any)=>n.name==='Volothamp Geddarm');expect(d.cognition.memories.some((m:any)=>m.summary.includes('delivering my report'))).toBe(false);expect(v.cognition.memories.some((m:any)=>m.summary.includes('accept the appointment lead'))).toBe(false);
 if(process.env.VADALLFATE_E2E_STATE_OUTPUT)writeFileSync(process.env.VADALLFATE_E2E_STATE_OUTPUT,JSON.stringify({quest:proof.quests,replies},null,2));
 await expect(play.getByText('Resolving your action…',{exact:true})).toHaveCount(0,{timeout:20000});
 await page.screenshot({path:process.env.VADALLFATE_E2E_SCREENSHOT||'test-results/adventure.png',fullPage:true});
});
