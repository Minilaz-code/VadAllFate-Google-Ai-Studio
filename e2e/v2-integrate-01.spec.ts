import {test,expect as baseExpect,Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const expect=baseExpect.configure({timeout:45000});
test.use({actionTimeout:45000,screenshot:'only-on-failure'});
function fixture(){const c=JSON.parse(readFileSync(process.env.VADALLFATE_INTEGRATE_01_CONTROL!,'utf8'));const host=JSON.parse(readFileSync(join(c.root,'launcher/pids.json'),'utf8'));return {c,host};}
function hashes(c:any){const m=JSON.parse(readFileSync(join(c.root,'mounts.json'),'utf8'));return Object.fromEntries(m.mounts.map((p:any)=>[p.file,createHash('sha256').update(readFileSync(join(c.root,p.file))).digest('hex')]));}
async function login(page:Page,key:string){await page.getByLabel('Host bootstrap key').fill(key);await page.getByRole('button',{name:'Authenticate',exact:true}).click();await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible({timeout:45000});expect(new URL(page.url()).search).toBe('');}
async function request(page:Page,c:any,path:string,body?:any){return page.evaluate(async({c,path,body})=>{const session=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);const save=sessionStorage.getItem('vadallfate.v2.developmentSave')||'a';let r:Response;for(let attempt=0;;attempt++){r=await fetch(`http://127.0.0.1:${c.api}/api/v2${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-VadAllFate-Session-Token':session.dm||session.player,'X-VadAllFate-Development-Save':save},body:body?JSON.stringify(body):undefined});if(r.status!==429||attempt===6)break;await new Promise(resolve=>setTimeout(resolve,Math.min(1000*2**attempt,10000)));}const value=await r.json();if(!r.ok)throw new Error(`Real backend rejected ${r.status}: ${JSON.stringify(value)}`);return value;},{c,path,body});}
async function projection(page:Page,c:any){const p=await request(page,c,'/projection');delete p.projectionGeneratedAtUtc;return p;}
async function clickAction(page:Page,label:string){const response=page.waitForResponse(r=>r.url().includes('/api/v2/actions')&&r.request().method()==='POST');await page.getByRole('region',{name:'Original encounter'}).getByRole('button',{name:label,exact:true}).click();const r=await response;const data=await r.json();if(r.ok()){expect(data.r1Receipt.status).toBe('APPLIED');await expect(page.getByRole('region',{name:'Original encounter'}).getByRole('status')).toContainText(data.r1Receipt.commit_id);}return {status:r.status(),data,body:r.request().postDataJSON()};}

test('normal Windows application: selected persistent Save, one PC duel, real dice, refusal and receipt evidence',async({page,browser})=>{
 test.skip(!process.env.VADALLFATE_INTEGRATE_01_CONTROL||process.env.VADALLFATE_INTEGRATE_01_PHASE!=='journey');test.setTimeout(420000);
 const {c,host}=fixture();const before=hashes(c);await page.goto('/');
 await expect(page.getByLabel('Campaign Save')).toBeVisible();await page.getByLabel('Campaign Save').selectOption('b');await login(page,host.hostKey);
 const baselineB=await projection(page,c);expect(baselineB.npcs).toEqual([]);writeFileSync(join(c.root,'integrate-b.private.json'),JSON.stringify(baselineB));
 await page.getByLabel('Campaign Save').selectOption('a');await login(page,host.hostKey);
 const play=page.getByRole('region',{name:'Adventure play'});const panel=play.getByLabel('NPC catalogue and lifecycle');await panel.locator('summary').click();
 await panel.getByLabel('Exact source NPC name').fill('Skeleton');await panel.getByRole('button',{name:'Browse source catalogue',exact:true}).click();await panel.getByLabel('Catalogue definition').selectOption('srd51:monster:256');await panel.getByRole('button',{name:'Inspect selected source NPC'}).click();await expect(panel.getByText('Source: Skeleton',{exact:false})).toBeVisible();await panel.getByLabel('Approve NPC establishment').check();await panel.getByRole('button',{name:'Create selected source NPC',exact:true}).click();
 await expect(page.getByText('Resolving your action…',{exact:true})).toBeHidden();
 const p=await projection(page,c);expect(p.npcs.length).toBe(1);const npc=p.npcs[0].id;
 const combat=page.getByRole('region',{name:'Original encounter'});await combat.getByLabel('Include character instance.v1.ben').uncheck();await combat.getByLabel('Original opponent').selectOption(npc);
 const start=await clickAction(page,'Start original encounter');expect(start.status).toBe(200);let state=await projection(page,c);expect(state.combatState.combatants.length).toBe(2);
 if(state.combatState.combatants[state.combatState.activeTurnIndex].entityType==='npc')expect((await clickAction(page,'Next original turn')).status).toBe(200);
 let refused=false;let attacks=0;let last:any=null;
 for(let turn=0;turn<24;turn++){
  state=await projection(page,c);const cs=state.combatState;if(cs.combatants.some((x:any)=>x.currentHp===0))break;
  const active=cs.combatants[cs.activeTurnIndex];const pc=active.entityType==='character';const target=cs.combatants.find((x:any)=>x.entityId!==active.entityId);
  await combat.getByLabel('Original attack target').selectOption(target.entityId);
  if(pc){
   if(!refused){const beforeReject=await projection(page,c);const unowned=await combat.getByLabel('Approved weapon profile').locator('option').filter({hasText:'[unowned]'}).first().getAttribute('value');expect(unowned).toBeTruthy();await combat.getByLabel('Approved weapon profile').selectOption(unowned!);const denied=await clickAction(page,'Resolve original attack');expect(denied.status).toBe(400);expect((await projection(page,c)).combatState).toEqual(beforeReject.combatState);expect((await projection(page,c)).combatEvidence).toEqual(beforeReject.combatEvidence);await expect(combat.getByRole('status')).toContainText('rejected action HTTP 400');refused=true;}
   await combat.getByLabel('Approved weapon profile').selectOption('steel_longsword');
  }else await combat.getByLabel('Monster attack name').fill('Shortsword');
  const attack=await clickAction(page,'Resolve original attack');expect(attack.status).toBe(200);attacks++;last=attack;
  state=await projection(page,c);await expect(combat.getByLabel('Last attack resolution')).toContainText('Committed attack: d20');
  expect(state.combatEvidence[0].receipt).toEqual(attack.data.r1Receipt);
  if(state.combatState.combatants.some((x:any)=>x.currentHp===0))break;
  expect((await clickAction(page,'Next original turn')).status).toBe(200);
 }
 expect(refused).toBe(true);expect(attacks).toBeGreaterThan(0);state=await projection(page,c);expect(state.combatState.combatants.some((x:any)=>x.currentHp===0)).toBe(true);
 expect(state.combatState.combatants.some((x:any)=>x.conditions?.includes('Unconscious'))).toBe(true);
 await combat.getByLabel('Committed combat receipts').locator('summary').click();await expect(combat.getByText(last.data.r1Receipt.commit_id,{exact:true})).toBeVisible();
 await combat.scrollIntoViewIfNeeded();await page.screenshot({path:join(c.root,'integrate-duel.png'),fullPage:false});
 const reference=page.getByLabel('SRD 5.1 reference');await reference.locator('summary').click();await reference.getByLabel('Search SRD 5.1',{exact:true}).fill('Skeleton');await reference.getByRole('button',{name:'Search rules',exact:true}).click();await expect(reference.getByText(/1207 Entities/)).toBeVisible();await expect(reference.getByRole('button',{name:'Skeleton · monster',exact:true})).toBeVisible();await reference.getByRole('button',{name:'Skeleton · monster',exact:true}).click();await expect(reference.getByRole('heading',{name:'Skeleton',exact:true})).toBeVisible();
 const rules=await page.evaluate(async()=>{const r=await fetch('/api/srd51/search?q=Skeleton&limit=5');return r.json();});expect(rules.ruleset).toBe('SRD-5.1');expect(rules.items.some((x:any)=>x.name==='Skeleton')).toBe(true);
 await page.screenshot({path:join(c.root,'integrate-rules.png'),fullPage:false});
 expect((await clickAction(page,'End original encounter')).status).toBe(200);
 expect((await request(page,c,'/storage-align/audit',{})).complete_history_verified).toBe(true);
 writeFileSync(join(c.root,'integrate-a.private.json'),JSON.stringify(await projection(page,c)));writeFileSync(join(c.root,'integrate-retry.private.json'),JSON.stringify(last));
 await page.getByLabel('Campaign Save').selectOption('b');await login(page,host.hostKey);expect(await projection(page,c)).toEqual(baselineB);expect(hashes(c)).toEqual(before);
 writeFileSync(join(c.root,'integrate-journey.json'),JSON.stringify({verified:true,normalRoot:true,query:'',twoCombatants:true,refused,attacks,zeroHp:true,sources:before,browser:browser.version(),saveBIsolated:true}));
});

test('normal application full Python and React restart restores exact duel and native receipts',async({page})=>{
 test.skip(!process.env.VADALLFATE_INTEGRATE_01_CONTROL||process.env.VADALLFATE_INTEGRATE_01_PHASE!=='restart');test.setTimeout(180000);
 const {c,host}=fixture();await page.goto('/');await login(page,host.hostKey);
 expect(await projection(page,c)).toEqual(JSON.parse(readFileSync(join(c.root,'integrate-a.private.json'),'utf8')));
 const retry=JSON.parse(readFileSync(join(c.root,'integrate-retry.private.json'),'utf8'));const before=await projection(page,c);expect((await request(page,c,'/actions',retry.body)).r1Receipt).toEqual(retry.data.r1Receipt);expect(await projection(page,c)).toEqual(before);
 expect((await request(page,c,'/storage-align/audit',{})).complete_history_verified).toBe(true);
 await page.getByLabel('Campaign Save').selectOption('b');await login(page,host.hostKey);expect(await projection(page,c)).toEqual(JSON.parse(readFileSync(join(c.root,'integrate-b.private.json'),'utf8')));
 const journey=JSON.parse(readFileSync(join(c.root,'integrate-journey.json'),'utf8'));expect(hashes(c)).toEqual(journey.sources);
 writeFileSync(join(c.root,'integrate-restart.json'),JSON.stringify({verified:true,exactState:true,exactReceipt:true,saveBIsolated:true,sourcesUnchanged:true}));
});
