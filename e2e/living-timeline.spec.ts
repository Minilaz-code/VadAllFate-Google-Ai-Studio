import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';

test('living knowledge, quest and relationship can diverge in an independent timeline',async({page})=>{
 test.setTimeout(90000);page.setDefaultTimeout(20000);test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Dedicated private timeline runtime required');
 const host=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));const ids=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_STATE_OUTPUT!,'utf8'));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByLabel('Host bootstrap key').fill(host.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();await panel.getByText('Campaigns and Save branches',{exact:true}).click();await panel.getByLabel('Existing campaign').selectOption(ids.campaignId);await panel.getByRole('button',{name:'Load campaign',exact:true}).click();await expect(panel.getByText(/Campaign session changed/)).toBeVisible({timeout:20000});
 const state=()=>page.evaluate(async()=>{const m='/src/services/v2ContentClient.ts';return (await import(m)).contentRequest('play','dm');});
 if(process.env.VADALLFATE_E2E_PHASE==='verify'){
  const p=await state();const npc=p.instances.find((n:any)=>n.id===ids.durnanId);expect(npc.token.cellX).toBe(18);expect(npc.cognition.relationships['char-lyra-01'].trust).toBe(0);expect(p.quests.find((q:any)=>q.title==='Confirm the follow-up report').status).toBe('completed');expect(npc.cognition.beliefs.admittedKnowledge.some((k:any)=>k.category==='suspicion')).toBe(true);return;
 }
 await panel.getByText('Living world · knowledge, consequences and source maps',{exact:true}).click();await panel.getByLabel('Knowledge NPC').selectOption(ids.durnanId);
 if(process.env.VADALLFATE_E2E_PHASE==='branch'){
  const message='The lantern is lit, according to an unverified rumour.';
  await panel.getByLabel('Speaking character').selectOption('char-lyra-01');await panel.getByLabel('Interaction NPC').selectOption('personal.waterdeep.handoff.world:durnan');await panel.getByLabel('Message to NPC').fill(message);await panel.getByRole('button',{name:'Speak and record'}).click();await expect(panel.getByText(`Lyra Vance addresses Durnan: ${message}`)).toBeVisible();
  await panel.getByLabel('NPC observed evidence').selectOption({label:message});await panel.getByLabel('Knowledge category').selectOption('suspicion');await panel.getByLabel('NPC knowledge statement').fill('The follow-up report may be unreliable.');await panel.getByRole('button',{name:'Approve NPC knowledge',exact:true}).click();
  await panel.getByLabel('Relationship rationale').fill('Human DM reassesses reliance after an uncertain follow-up.');await panel.getByLabel('Approved trust adjustment').fill('-0.1');const approved=page.waitForResponse(r=>r.url().includes('/content/relationship')&&r.request().method()==='POST');await panel.getByRole('button',{name:'Approve witnessed relationship consequence'}).click();expect((await (await approved).json()).receipt.status).toBe('COMMITTED');
  const p=await state();expect(p.instances.find((n:any)=>n.id===ids.durnanId).cognition.relationships['char-lyra-01'].trust).toBe(0);expect(p.quests.find((q:any)=>q.title==='Confirm the follow-up report').status).toBe('completed');return;
 }
 await panel.getByLabel('Report quest title').fill('Confirm the follow-up report');await panel.getByLabel('Report condition phrase').fill('the lantern is lit');const quest=page.waitForResponse(r=>r.url().includes('/content/report-quest')&&r.request().method()==='POST');await panel.getByRole('button',{name:'Approve report quest condition'}).click();expect((await (await quest).json()).receipt.status).toBe('COMMITTED');
 await panel.getByLabel('New campaign name').fill('Living world baseline before follow-up');const made=page.waitForResponse(r=>r.url().endsWith('/campaigns/saves')&&r.request().method()==='POST');await panel.getByRole('button',{name:'Create restartable Save branch'}).click();const checkpoint=await (await made).json();
 await panel.getByLabel('Checkpoint timeline').selectOption(checkpoint.id);await panel.getByLabel('New campaign name').fill('Independent uncertain follow-up timeline');const forked=page.waitForResponse(r=>r.url().endsWith('/campaigns/saves')&&r.request().method()==='POST');await panel.getByRole('button',{name:'Branch selected checkpoint'}).click();const branch=await (await forked).json();expect(branch.parentSaveId).toBe(checkpoint.id);
 if(process.env.VADALLFATE_E2E_CHECKPOINT_OUTPUT)writeFileSync(process.env.VADALLFATE_E2E_CHECKPOINT_OUTPUT,JSON.stringify({id:branch.id,campaignId:ids.campaignId}));
});
