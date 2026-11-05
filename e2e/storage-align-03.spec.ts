import {test,expect,Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

function fixture(){const c=JSON.parse(readFileSync(process.env.VADALLFATE_ENTITY_CONTROL!,'utf8'));return {c,host:JSON.parse(readFileSync(join(c.root,'launcher/pids.json'),'utf8'))};}
function hashes(c:any){return Object.fromEntries(JSON.parse(readFileSync(join(c.root,'mounts.json'),'utf8')).mounts.map((p:any)=>[p.file,createHash('sha256').update(readFileSync(join(c.root,p.file))).digest('hex')]));}
async function login(page:Page,key:string){await page.getByLabel('Host bootstrap key').fill(key);await page.getByRole('button',{name:'Authenticate',exact:true}).click();await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible();}
async function request(page:Page,c:any,path:string,body?:any){return page.evaluate(async({api,path,body})=>{const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);const save=sessionStorage.getItem('vadallfate.v2.developmentSave')||'a';const r=await fetch(api+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-VadAllFate-Session-Token':s.dm||s.player,'X-VadAllFate-Development-Save':save},body:body?JSON.stringify(body):undefined});if(!r.ok)throw new Error('Connected request rejected '+r.status);return r.json();},{api:`http://127.0.0.1:${c.api}/api/v2`,path,body});}
async function snapshot(page:Page,c:any){const p=await request(page,c,'/projection');delete p.projectionGeneratedAtUtc;const histories:any={};for(const n of p.npcs)histories[n.id]=await request(page,c,`/content/history?npc_id=${n.id}&limit=30`);return {projection:p,histories};}
async function tell(page:Page,npc:string,text:string){const play=page.getByRole('region',{name:'Adventure play'});await play.getByLabel('Talk to present NPC').selectOption(npc);await expect(play.getByRole('button',{name:'Speak',exact:true})).toBeVisible();await play.getByLabel('Adventure dialogue').fill(text);await play.getByRole('button',{name:'Speak',exact:true}).click();await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden();await expect(play.getByRole('status')).toContainText('Action recorded');}

test('SA03 existing App multi-character and independent NPC journey',async({page,browser})=>{
 test.skip(!process.env.VADALLFATE_ENTITY_CONTROL||process.env.VADALLFATE_ENTITY_PHASE!=='journey');test.setTimeout(150000);
 const {c,host}=fixture();const before=hashes(c);await page.goto('/?storageAlign=2');await login(page,host.hostKey);
 const play=page.getByRole('region',{name:'Adventure play'});
 await expect(play.getByLabel('Adventure character').locator('option')).toHaveCount(2);
 await expect(play.getByLabel('Talk to present NPC').locator('option')).toHaveCount(5);
 for(const [actor,name,message] of [['actor.ada','Ada Brook','I will return with the amber lantern.'],['actor.ben','Ben Ash','The blue boat arrives tomorrow.']]){
  const invite=(await request(page,c,'/auth/provision',{actorId:actor,role:'player',campaignId:'campaign.amber'})).inviteCode;
  const context=await browser.newContext();const player=await context.newPage();try{
   await player.goto(`http://127.0.0.1:${c.ui}/?storageAlign=2`);await player.getByLabel('Player invite code').fill(invite);await player.getByRole('button',{name:'Join with invite',exact:true}).click();
   await expect(player.getByRole('region',{name:'Adventure play'})).toBeVisible();await tell(player,'instance.v1.iris',message);
   const p=await request(player,c,'/projection');expect(p.characters.map((x:any)=>x.id)).toEqual([actor]);
   expect(await player.evaluate(()=>Boolean(JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!).dm))).toBe(false);
   const safe=await request(player,c,'/content/adventure');expect(safe.memory).toBeUndefined();expect(safe.npcTrust).toBeUndefined();
   await player.getByRole('button',{name:'Character',exact:true}).click();await expect(player.getByRole('heading',{name,exact:true})).toBeVisible();await player.getByRole('button',{name:/Inventory/}).click();await player.getByRole('button',{name:'Use supported consumable'}).click();
   await expect(player.getByText(actor==='actor.ada'?'16 / 20':'13 / 20',{exact:false})).toBeVisible();
  }finally{await context.close();}
 }
 await page.reload();await expect(play).toBeVisible();await play.getByLabel('Adventure character').selectOption('actor.ben');
 await play.getByLabel('Approve trust consequence').check();await tell(page,'instance.v1.tovan','The bridge marker is missing.');
 await expect(play.getByText('Current NPC trust: 1.',{exact:false})).toBeVisible();
 await play.getByLabel('Adventure character').selectOption('actor.ada');await expect(play.getByText('Current NPC trust: 0.',{exact:false})).toBeVisible();
 await play.getByRole('button',{name:'Wait five minutes',exact:true}).click();await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden();
 await play.getByRole('button',{name:'Advance one minute and objective'}).click();await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden();
 await play.getByLabel('Talk to present NPC').selectOption('instance.v1.iris');await play.getByRole('button',{name:'Read earlier story'}).click();
 await expect(play.getByText('actor.ada: I will return with the amber lantern.',{exact:true})).toBeVisible();await expect(play.getByText('actor.ben: The blue boat arrives tomorrow.',{exact:true})).toBeVisible();
 const a=await snapshot(page,c);expect(a.histories['instance.v1.iris'].memories).toHaveLength(2);expect(a.histories['instance.v1.tovan'].memories).toHaveLength(1);expect(a.histories['instance.v1.mira'].memories).toEqual([]);expect(a.histories['instance.v1.iris-second'].memories).toEqual([]);expect(a.projection.worldClock.totalWorldMinutes).toBe(861);
 writeFileSync(join(c.root,'entity-a.private.json'),JSON.stringify(a));await page.screenshot({path:join(c.root,'entity-app-a.png'),fullPage:true});
 await page.getByLabel('Campaign Save').selectOption('b');await login(page,host.hostKey);const b=await snapshot(page,c);expect(b.projection.characters.map((x:any)=>x.currentHp)).toEqual([12,9]);for(const h of Object.values(b.histories) as any[])expect(h.memories).toEqual([]);
 writeFileSync(join(c.root,'entity-b.private.json'),JSON.stringify(b));expect(hashes(c)).toEqual(before);writeFileSync(join(c.root,'entity-ui.json'),JSON.stringify({verified:true,baselineHashes:before,characters:2,npcInstances:4,sharedDefinitionInstances:2,separateInvitedPlayers:2,playerPrivateDataAbsent:true}));
});

test('SA03 full application restart recovers exact independent outcomes',async({page})=>{
 test.skip(!process.env.VADALLFATE_ENTITY_CONTROL||process.env.VADALLFATE_ENTITY_PHASE!=='restart');const {c,host}=fixture();await page.goto('/?storageAlign=2');
 for(const save of ['a','b']){if(save==='b')await page.getByLabel('Campaign Save').selectOption(save);await login(page,host.hostKey);const recovered=await snapshot(page,c);expect(recovered).toEqual(JSON.parse(readFileSync(join(c.root,`entity-${save}.private.json`),'utf8')));for(const npc of recovered.projection.npcs){const entity=await request(page,c,`/content/entity?entity_id=${npc.id}`);for(const [actor,value] of Object.entries(entity.relationships) as [string,any][]){expect(value.value).toBe(save==='a'&&npc.id==='instance.v1.tovan'&&actor==='actor.ben'?1:0);}}}
 expect(hashes(c)).toEqual(JSON.parse(readFileSync(join(c.root,'entity-ui.json'),'utf8')).baselineHashes);writeFileSync(join(c.root,'entity-restart.json'),JSON.stringify({verified:true,bothSnapshotsExact:true,relationshipsVerified:true,baselineHashesUnchanged:true}));
});
