import {test,expect,Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

function fixture(){const c=JSON.parse(readFileSync(process.env.VADALLFATE_SOURCE_CONTROL!,'utf8'));return {c,host:JSON.parse(readFileSync(join(c.root,'launcher/pids.json'),'utf8'))};}
async function login(page:Page,key:string){await page.getByLabel('Host bootstrap key').fill(key);await page.getByRole('button',{name:'Authenticate',exact:true}).click();await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible();}
async function read(page:Page,c:any){return page.evaluate(async(api)=>{const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);const save=sessionStorage.getItem('vadallfate.v2.developmentSave')||'a';const headers={'X-VadAllFate-Session-Token':s.dm||s.player,'X-VadAllFate-Development-Save':save};const p=await(await fetch(api+'/projection',{headers})).json();const st=await(await fetch(api+'/status',{headers})).json();const play=await(await fetch(api+'/content/adventure',{headers})).json();return {snapshot:{revision:st.commitSequence,hash:st.stateHash},character:p.characters[0],binding:p.npcs[0].sourceBinding,worldMinute:p.worldClock.totalWorldMinutes,quest:p.quests[0],memory:play.memory||[],trust:play.npcTrust??null};},`http://127.0.0.1:${c.api}/api/v2`);}
function hashes(c:any){return Object.fromEntries(JSON.parse(readFileSync(join(c.root,'mounts.json'),'utf8')).mounts.map((p:any)=>[p.file,createHash('sha256').update(readFileSync(join(c.root,p.file))).digest('hex')]));}

test('SA02 actual existing App consumes source baseline and R1 deltas',async({page,browser})=>{
 test.skip(!process.env.VADALLFATE_SOURCE_CONTROL||process.env.VADALLFATE_SOURCE_PHASE!=='journey');test.setTimeout(120000);
 const {c,host}=fixture();const before=hashes(c);await page.goto('/?storageAlign=2');await login(page,host.hostKey);
 await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible();
 const publication=JSON.parse(readFileSync(join(c.root,'publication.json'),'utf8'));
 expect((await read(page,c)).binding.ref).toBe(publication.npc_ref);
 await page.getByRole('button',{name:'Select Role and Hosting Status',exact:true}).click();await page.getByRole('button',{name:'Player Guest: Lyra',exact:false}).click();
 await page.getByRole('button',{name:'Character',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Lyra Vance',exact:true})).toBeVisible();
 await expect(page.getByText('24 / 32',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:/Inventory/}).click();await page.getByRole('button',{name:'Use supported consumable'}).click();
 await expect(page.getByText('28 / 32',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Select Role and Hosting Status',exact:true}).click();await page.getByRole('button',{name:'Dungeon Master (Host)',exact:false}).click();
 await page.getByRole('button',{name:'Play / Host',exact:true}).click();const play=page.getByRole('region',{name:'Adventure play'});
 await play.getByLabel('Talk to present NPC').selectOption({index:1});await play.getByLabel('Approve trust consequence').check();
 await play.getByLabel('Adventure dialogue').fill('I will return with the amber lantern.');await play.getByRole('button',{name:'Speak',exact:true}).click();
 await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden();await expect(play.getByText('Current NPC trust: 1.',{exact:false})).toBeVisible();
 await play.getByRole('button',{name:'Wait five minutes',exact:true}).click();await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden();
 for(const n of [1,2]){await play.getByRole('button',{name:'Advance one minute and objective'}).click();await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden();}
 const a=await read(page,c);expect(a.character.currentHp).toBe(28);expect(a.character.supportedConsumables[0].quantity).toBe(1);expect(a.memory.length).toBe(1);expect(a.trust).toBe(1);expect(a.worldMinute).toBe(862);expect(a.quest.status).toBe('COMPLETED');
 writeFileSync(join(c.root,'source-a.private.json'),JSON.stringify(a));await page.screenshot({path:join(c.root,'source-app-a.png'),fullPage:true});
 const invite=await page.evaluate(async(api)=>{const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);const r=await fetch(api+'/auth/provision',{method:'POST',headers:{'Content-Type':'application/json','X-VadAllFate-Session-Token':s.dm,'X-VadAllFate-Development-Save':'a'},body:JSON.stringify({actorId:'char-lyra-01',role:'player',campaignId:s.campaignId})});if(!r.ok)throw new Error('Invite failed');return(await r.json()).inviteCode;},`http://127.0.0.1:${c.api}/api/v2`);
 const context=await browser.newContext();const player=await context.newPage();try{
  await player.goto(`http://127.0.0.1:${c.ui}/?storageAlign=2`);await player.getByLabel('Player invite code').fill(invite);await player.getByRole('button',{name:'Join with invite',exact:true}).click();
  await expect(player.getByRole('region',{name:'Adventure play'})).toBeVisible();const safe=await read(player,c);expect(safe.memory).toEqual([]);expect(safe.trust).toBe(null);
  expect(await player.evaluate(()=>Boolean(JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!).dm))).toBe(false);
  await expect(player.getByLabel('Approve trust consequence')).toHaveCount(0);
 }finally{await context.close();}
 await page.getByLabel('Campaign Save').selectOption('b');await login(page,host.hostKey);
 const b=await read(page,c);expect(b.character.currentHp).toBe(24);expect(b.memory).toEqual([]);expect(b.worldMinute).toBe(855);writeFileSync(join(c.root,'source-b.private.json'),JSON.stringify(b));
 expect(hashes(c)).toEqual(before);writeFileSync(join(c.root,'source-ui.private.json'),JSON.stringify({verified:true,baselineHashes:before,playerNoDmCredential:true,playerPrivateDataAbsent:true}));
});

test('SA02 existing App full restart recovers both source-bound outcomes',async({page})=>{
 test.skip(!process.env.VADALLFATE_SOURCE_CONTROL||process.env.VADALLFATE_SOURCE_PHASE!=='restart');const {c,host}=fixture();
 await page.goto('/?storageAlign=2');
 for(const save of ['a','b']){if(save==='b')await page.getByLabel('Campaign Save').selectOption(save);await login(page,host.hostKey);expect(await read(page,c)).toEqual(JSON.parse(readFileSync(join(c.root,`source-${save}.private.json`),'utf8')));}
 expect(hashes(c)).toEqual(JSON.parse(readFileSync(join(c.root,'source-ui.private.json'),'utf8')).baselineHashes);
 writeFileSync(join(c.root,'source-restart.private.json'),JSON.stringify({verified:true,bothSnapshotsExact:true,baselineBytesUnchanged:true}));await page.screenshot({path:join(c.root,'source-app-restart.png'),fullPage:true});
});
