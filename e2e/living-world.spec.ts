import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';

const hostRecord=process.env.VADALLFATE_E2E_HOST_RECORD;
async function login(page:any){const host=JSON.parse(readFileSync(hostRecord!,'utf8'));await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByLabel('Host bootstrap key').fill(host.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();const panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();return panel;}
async function play(page:any){return page.evaluate(async()=>{const modulePath='/src/services/v2ContentClient.ts';const c=await import(modulePath);return c.contentRequest('play','dm');});}

test('Waterdeep living world: distinct knowledge, consequences and actual VTT placement',async({page})=>{
 test.setTimeout(240000);page.setDefaultTimeout(20000);test.skip(!hostRecord,'Requires dedicated private acceptance runtime and installed local model');
 const rateErrors:number[]=[];page.on('response',r=>{if(r.status()===429)rateErrors.push(429);});
 page.on('response',async r=>{if(r.request().method()==='POST'&&r.url().includes('/content/')){try{const data=await r.json();console.log('Content response',new URL(r.url()).pathname,r.status(),data.receipt?.status,data.error||data.receipt?.error||'');}catch{}}});
 let panel=await login(page);
 if(process.env.VADALLFATE_E2E_PHASE==='resume'){
  const stored=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_STATE_OUTPUT!,'utf8'));await panel.getByText('Campaigns and Save branches',{exact:true}).click();await panel.getByLabel('Existing campaign').selectOption(stored.campaignId);await panel.getByRole('button',{name:'Load campaign',exact:true}).click();await expect(panel.getByText(/Campaign session changed/)).toBeVisible({timeout:20000});
  const state=await play(page);const d=state.instances.find((n:any)=>n.name==='Durnan'&&n.sourceBinding.ref.endsWith(':durnan'));
  expect(d.token.cellX).toBe(18);expect(d.cognition.beliefs.admittedKnowledge.some((k:any)=>k.text.includes('ROOK-417'))).toBe(true);
  expect(d.cognition.relationships['char-lyra-01'].trust).toBe(0.1);
  expect(state.quests.find((q:any)=>q.title==='Hear the copper owl report').status).toBe('completed');
  expect(state.quests.find((q:any)=>q.title==='Nera has not heard the report').status).toBe('active');return;
 }
 await panel.getByText('Campaigns and Save branches',{exact:true}).click();await panel.getByLabel('New campaign name').fill(`Living world acceptance ${Date.now()}`);await panel.getByRole('button',{name:'Create campaign',exact:true}).click();await expect(panel.getByText(/Campaign session changed/)).toBeVisible({timeout:20000});
 await page.evaluate(async()=>{const modulePath='/src/services/v2ContentClient.ts';const c=await import(modulePath);const packs=(await c.contentRequest('packs','dm')).packs;
 const ids=['personal.waterdeep.handoff.world','personal.waterdeep.handoff.adventure','example.lantern-marsh'];const roots=ids.map(id=>packs.find((p:any)=>p.pin.pack_id===id).pin);
 const snapshot=(await c.contentRequest('selection','dm')).snapshotRef;await c.contentMutation('selection',{pins:c.selectContentClosure(packs,roots)},snapshot,'dm');});
 await page.reload({waitUntil:'domcontentloaded'});panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();
 await panel.getByLabel('Location',{exact:true}).selectOption('personal.waterdeep.handoff.world:yawning-portal');await panel.getByLabel('Scene',{exact:true}).selectOption('personal.waterdeep.handoff.adventure:yawning-portal-opening');await panel.getByRole('button',{name:'Open scene',exact:true}).click();
 await panel.getByLabel('NPC definition').selectOption('personal.waterdeep.handoff.world:durnan');await panel.getByLabel('Player-safe NPC characterization').fill('A reserved innkeeper. Only speak about personally admitted knowledge and witnessed statements.');await panel.getByRole('button',{name:'Create or place source NPC'}).click();await panel.getByRole('button',{name:'Introduce NPC to party'}).click();
 await panel.getByLabel('NPC definition').selectOption('example.lantern-marsh:keeper');await panel.getByText('Approve draft source as campaign instance',{exact:true}).click();await panel.getByLabel('Player-safe NPC characterization').fill('Nera is a patient pier keeper. She does not know conversations she did not hear.');await panel.getByRole('button',{name:'Create or place source NPC'}).click();await panel.getByRole('button',{name:'Introduce NPC to party'}).click();
 let state=await play(page);const d=state.instances.find((n:any)=>n.sourceBinding.ref.endsWith(':durnan'));const n=state.instances.find((n:any)=>n.sourceBinding.ref==='example.lantern-marsh:keeper');
 await panel.getByText('Living world · knowledge, consequences and source maps',{exact:true}).click();
 for(const [id,title] of [[d.id,'Hear the copper owl report'],[n.id,'Nera has not heard the report']]){await panel.getByLabel('Knowledge NPC').selectOption(id);await panel.getByLabel('Report quest title').fill(title);await panel.getByLabel('Report condition phrase').fill('copper owl marker');await panel.getByRole('button',{name:'Approve report quest condition'}).click();}
 await panel.getByLabel('Speaking character').selectOption('char-lyra-01');await panel.getByLabel('Interaction NPC').selectOption('personal.waterdeep.handoff.world:durnan');await panel.getByLabel('Message to NPC').fill('The copper owl marker is ROOK-417. This is my report, not independently verified.');await panel.getByRole('button',{name:'Speak and record'}).click();
 await expect(panel.getByText('Lyra Vance addresses Durnan: The copper owl marker is ROOK-417. This is my report, not independently verified.')).toBeVisible({timeout:30000});
 await panel.getByLabel('Knowledge NPC').selectOption(d.id);await panel.getByLabel('NPC observed evidence').selectOption({label:'The copper owl marker is ROOK-417. This is my report, not independently verified.'});
 await panel.getByLabel('Knowledge category').selectOption('rumour');await panel.getByLabel('NPC knowledge statement').fill('Lyra reported marker ROOK-417; this is unverified.');await panel.getByText('Explicitly share with party / permit dialogue',{exact:true}).click();await panel.getByRole('button',{name:'Approve NPC knowledge',exact:true}).click();
 await panel.getByText('Explicitly share with party / permit dialogue',{exact:true}).click();await panel.getByLabel('Knowledge acquisition').selectOption('dm_adjudication');await panel.getByLabel('Knowledge category').selectOption('guarded_secret');await panel.getByLabel('NPC knowledge statement').fill('Private marker NIGHT-992 must not be disclosed.');await panel.getByRole('button',{name:'Approve NPC knowledge',exact:true}).click();
 await panel.getByLabel('Relationship rationale').fill('A useful report was heard; its truth remains unverified.');await panel.getByRole('button',{name:'Approve witnessed relationship consequence'}).click();
 await panel.getByRole('button',{name:'Request AI NPC reply'}).click();await expect(panel.getByText(/^AI NPC:/)).toBeVisible({timeout:110000});
 await panel.getByLabel('Interaction NPC').selectOption('example.lantern-marsh:keeper');await panel.getByLabel('Message to NPC').fill('Do you know the marker I mentioned in my other conversation? Please admit when you do not know.');await panel.getByRole('button',{name:'Speak and record'}).click();await panel.getByRole('button',{name:'Request AI NPC reply'}).click();
 await expect(panel.getByText(/^AI NPC:/)).toHaveCount(2,{timeout:110000});state=await play(page);
 const nReply=state.interactions.find((e:any)=>e.npcInstanceId===n.id).reply;expect(nReply).not.toContain('ROOK-417');expect(nReply).not.toContain('NIGHT-992');
 expect(state.instances.find((x:any)=>x.id===n.id).cognition.beliefs?.admittedKnowledge||[]).toHaveLength(0);
 expect(state.quests.find((q:any)=>q.title==='Hear the copper owl report').status).toBe('completed');expect(state.quests.find((q:any)=>q.title==='Nera has not heard the report').status).toBe('active');
 await panel.getByRole('button',{name:'Configure and select source battlemap'}).isDisabled();await panel.getByText('DM confirms grid calibration values',{exact:true}).click();await panel.getByRole('button',{name:'Configure and select source battlemap'}).click();
 await panel.getByLabel('NPC definition').selectOption('personal.waterdeep.handoff.world:durnan');await panel.getByText('Place token on configured active battlemap',{exact:true}).click();await panel.getByLabel('NPC cell X').fill('18');await panel.getByLabel('NPC cell Y').fill('18');const placed=page.waitForResponse(r=>r.url().includes('/content/place')&&r.request().method()==='POST');await panel.getByRole('button',{name:'Create or place source NPC'}).click();expect((await (await placed).json()).receipt.status).toBe('COMMITTED');
 state=await play(page);expect(state.instances.find((x:any)=>x.id===d.id).token.cellX).toBe(18);
 await page.getByRole('button',{name:/Battlemap/i}).first().click();await expect(page.getByRole('button',{name:'NPC token Durnan',exact:true})).toBeVisible();
 expect(rateErrors).toHaveLength(0);
 if(process.env.VADALLFATE_E2E_STATE_OUTPUT)writeFileSync(process.env.VADALLFATE_E2E_STATE_OUTPUT,JSON.stringify({durnanId:d.id,neraId:n.id,campaignId:state.snapshotRef.campaignId}));
});
