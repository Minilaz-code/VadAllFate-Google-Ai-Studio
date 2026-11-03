import {test,expect as baseExpect,Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const expect=baseExpect.configure({timeout:45000});

function fixture(){
  const c=JSON.parse(readFileSync(process.env.VADALLFATE_COMBAT_R1_01_CONTROL!,'utf8'));
  return {c,host:JSON.parse(readFileSync(join(c.root,'launcher/pids.json'),'utf8'))};
}

function hashes(c:any){
  const m=JSON.parse(readFileSync(join(c.root,'mounts.json'),'utf8'));
  const out:Record<string,string>=Object.fromEntries(m.mounts.map((p:any)=>[p.file,createHash('sha256').update(readFileSync(join(c.root,p.file))).digest('hex')]));
  if(c.srdDbPath){
    out['vadallfate_srd51.sqlite']=createHash('sha256').update(readFileSync(c.srdDbPath)).digest('hex');
  }
  return out;
}

async function login(page:Page,key:string){
  await page.getByLabel('Host bootstrap key').fill(key);
  await page.getByRole('button',{name:'Authenticate',exact:true}).click();
  await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible();
}

async function request(page:Page,c:any,path:string,body?:any,allowError=false){
  return page.evaluate(async({api,path,body,allowError})=>{
    const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);
    let r:Response;
    for(let attempt=0;;attempt++){
      r=await fetch(api+path,{
        method:body?'POST':'GET',
        headers:{
          'Content-Type':'application/json',
          'X-VadAllFate-Session-Token':s.dm||s.player,
          'X-VadAllFate-Development-Save':sessionStorage.getItem('vadallfate.v2.developmentSave')||'a'
        },
        body:body?JSON.stringify(body):undefined
      });
      if(r.status!==429||body||attempt===6)break;
      await new Promise(resolve=>setTimeout(resolve,Math.min(1000*2**attempt,10000)));
    }
    const json=await r.json().catch(()=>({status:r.status}));
    if(!r.ok&&!allowError)throw new Error('Connected request rejected '+r.status+': '+JSON.stringify(json));
    return allowError?{status:r.status,body:json}:json;
  },{api:`http://127.0.0.1:${c.api}/api/v2`,path,body,allowError});
}

async function state(page:Page,c:any){
  const p=await request(page,c,'/projection');
  delete p.projectionGeneratedAtUtc;
  const instances=await request(page,c,'/content/instances?limit=30');
  const entities:any={};
  for(const n of instances.entries){
    entities[n.id]={
      entity:await request(page,c,`/content/entity?entity_id=${n.id}`),
      history:await request(page,c,`/content/history?npc_id=${n.id}`)
    };
  }
  return {projection:p,entities};
}

async function settle(page:Page){
  await expect(page.getByText('Resolving your action…',{exact:true})).toBeHidden();
}

test('COMBAT-R1-01 connected Edge acceptance: reviewed SRD 5.1 monsters, >3 combatants, vulnerability/resistance/qualifiers, physical confirmation, defeat memory, and Save isolation',async({page,browser})=>{
  test.skip(!process.env.VADALLFATE_COMBAT_R1_01_CONTROL||process.env.VADALLFATE_COMBAT_R1_01_PHASE!=='journey');
  test.setTimeout(360000);
  const {c,host}=fixture();
  const before=hashes(c);

  await page.goto('/?storageAlign=2');
  await login(page,host.hostKey);
  const play=page.getByRole('region',{name:'Adventure play'});
  const panel=play.getByLabel('NPC catalogue and lifecycle');
  await panel.locator('summary').click();

  // 1. Browse & spawn two instances of Skeleton (srd51:monster:256) + one Gargoyle (srd51:monster:108) + one Fire Elemental (srd51:monster:101, HELD)
  await panel.getByLabel('Exact source NPC name').fill('Skeleton');
  await panel.getByRole('button',{name:'Browse source catalogue',exact:true}).click();
  await panel.getByLabel('Catalogue definition').selectOption('srd51:monster:256');
  await panel.getByRole('button',{name:'Inspect selected source NPC'}).click();
  await expect(panel.getByText('Source: Skeleton',{exact:false})).toBeVisible();
  await panel.getByLabel('Approve NPC establishment').check();

  // Create Skeleton #1
  await panel.getByRole('button',{name:'Create selected source NPC',exact:true}).click();
  await settle(page);
  const skel1=(await request(page,c,'/content/adventure')).selectedNpcId;
  await play.getByLabel('Talk to present NPC').selectOption(skel1);
  await play.getByLabel('Approve trust consequence').check();
  await play.getByLabel('Adventure dialogue').fill('Crypt Skeleton Alpha guards the bronze reliquary.');
  await play.getByRole('button',{name:'Speak',exact:true}).click();
  await settle(page);

  // Create Skeleton #2 from the same SRD source `srd51:monster:256`
  await panel.getByRole('button',{name:'Create selected source NPC',exact:true}).click();
  await settle(page);
  let instList=await request(page,c,'/content/instances?limit=30');
  const skel2=instList.entries.find((x:any)=>x.id!==skel1).id;
  expect((await request(page,c,`/content/history?npc_id=${skel2}`)).memories).toEqual([]);

  // Browse & spawn Gargoyle (`srd51:monster:108`)
  await panel.getByLabel('Exact source NPC name').fill('Gargoyle');
  await panel.getByRole('button',{name:'Browse source catalogue',exact:true}).click();
  await panel.getByLabel('Catalogue definition').selectOption('srd51:monster:108');
  await panel.getByRole('button',{name:'Create selected source NPC',exact:true}).click();
  await settle(page);
  instList=await request(page,c,'/content/instances?limit=30');
  const gargoyle=instList.entries.find((x:any)=>![skel1,skel2].includes(x.id)).id;

  // Browse & spawn Fire Elemental (`srd51:monster:101`, explicitly HELD) to prove UI/backend fail-closed refusal
  await panel.getByLabel('Exact source NPC name').fill('Fire Elemental');
  await panel.getByRole('button',{name:'Browse source catalogue',exact:true}).click();
  await panel.getByLabel('Catalogue definition').selectOption('srd51:monster:101');
  await panel.getByRole('button',{name:'Create selected source NPC',exact:true}).click();
  await settle(page);
  instList=await request(page,c,'/content/instances?limit=30');
  const fireElem=instList.entries.find((x:any)=>![skel1,skel2,gargoyle].includes(x.id)).id;

  const combat=page.getByRole('region',{name:'Original encounter'});
  // Attempt to start encounter with HELD Fire Elemental -> must fail closed and keep encounter inactive
  await combat.getByLabel('Original opponent').selectOption(fireElem);
  await combat.getByRole('button',{name:'Start original encounter'}).click();
  await expect(combat.getByRole('status')).toContainText('rejected action HTTP 400');
  expect((await request(page,c,'/projection')).combatState.isActive).toBe(false);

  // Mark Fire Elemental dormant so active roster focuses on the approved encounter
  await play.getByLabel('Talk to present NPC').selectOption(fireElem);
  await panel.getByRole('button',{name:'Mark NPC dormant'}).click();
  await settle(page);

  // 2. Provision player session for Ada and verify player secret isolation + physical roll confirmation
  const invite=(await request(page,c,'/auth/provision',{actorId:'actor.ada',role:'player',campaignId:'campaign.amber'})).inviteCode;
  const context=await browser.newContext();
  const player=await context.newPage();
  let physicalRollId='';
  try{
    await player.goto(`http://127.0.0.1:${c.ui}/?storageAlign=2`);
    await player.getByLabel('Player invite code').fill(invite);
    await player.getByRole('button',{name:'Join with invite',exact:true}).click();
    await expect(player.getByRole('region',{name:'Adventure play'})).toBeVisible();
    const safeAdv=await request(player,c,'/content/adventure');
    expect(safeAdv.memory).toBeUndefined();
    const dmOnlyHistoryAttempt=await request(player,c,`/content/history?npc_id=${skel1}`,undefined,true);
    expect(dmOnlyHistoryAttempt.status).toBe(403);

    const dice=player.getByLabel('Authoritative dice');
    await dice.locator('summary').click();
    await dice.getByRole('button',{name:'Request d20 check'}).click();
    const rolls=(await request(player,c,'/projection')).activeRollRequests;
    physicalRollId=rolls.find((r:any)=>r.status==='PENDING_INPUT').requestId;
    const card=dice.getByLabel(`Roll ${physicalRollId}`,{exact:true});
    await card.getByLabel(`Physical faces ${physicalRollId}`).fill('18');
    await card.getByRole('button',{name:'Report physical roll'}).click();
    await expect(card.getByText('PENDING_CONFIRMATION',{exact:false})).toBeVisible();
  }finally{
    await context.close();
  }

  await page.reload();
  await expect(play).toBeVisible();
  const dice=page.getByLabel('Authoritative dice');
  await dice.locator('summary').click();
  await dice.getByLabel(`Roll ${physicalRollId}`,{exact:true}).getByRole('button',{name:'Confirm physical roll'}).click();
  await expect(dice.getByLabel(`Roll ${physicalRollId}`,{exact:true}).getByText('Confirmed result: 18',{exact:false})).toBeVisible();

  // 3. Start a 5-combatant encounter (>3 participants): Ada, Ben, Skeleton #1, Skeleton #2, Gargoyle
  await combat.getByLabel('Original opponent').selectOption(skel1);
  await combat.getByLabel(`Include opponent ${skel2}`).check();
  await combat.getByLabel(`Include opponent ${gargoyle}`).check();
  await combat.getByRole('button',{name:'Start original encounter'}).click();
  await expect(combat.getByRole('button',{name:'End original encounter'})).toBeVisible();

  const initSt=await state(page,c);
  expect(initSt.projection.combatState.combatants).toHaveLength(5);

  // 4. Advance turns and execute attacks proving:
  // - forged weapon ownership refusal (Ada attempting Ben's `adamantine_warhammer` fails closed)
  // - conditional resistance on Gargoyle (Ada's owned `steel_longsword` nonmagical slashing halved)
  // - qualifier bypass on Gargoyle (Ben's owned `adamantine_warhammer` adamantine bludgeoning full damage)
  // - vulnerability on Skeleton #1 (Ada's owned `iron_mace` bludgeoning doubled) until Skeleton #1 is defeated (0 HP)
  // - Skeleton #2 remains at full HP (13/13) proving shared-source instance independence
  let sawForgedOwnershipRefusal=false;
  let sawResistance=false;
  let sawBypass=false;
  let sawVulnerability=false;
  let skel1Defeated=false;

  for(let step=0;step<25&&(!sawForgedOwnershipRefusal||!sawResistance||!sawBypass||!sawVulnerability||!skel1Defeated);step++){
    const proj=await request(page,c,'/projection');
    const cs=proj.combatState;
    const active=cs.combatants[cs.activeTurnIndex];
    const activeHp=active.currentHp;

    if(activeHp>0){
      if(active.entityId==='instance.v1.ada'){
        if(!sawForgedOwnershipRefusal){
          await combat.getByLabel('Original attack target').selectOption(gargoyle);
          await combat.getByLabel('Approved weapon profile').selectOption('adamantine_warhammer');
          await combat.getByLabel('Combat roll mode').selectOption('PLAYER_PHYSICAL');
          await combat.getByLabel('Physical d20 face').fill('19');
          await combat.getByLabel('Physical damage face').fill('6');
          await combat.getByRole('button',{name:'Resolve original attack'}).click();
          await expect(combat.getByRole('status')).toContainText('rejected action HTTP 403');
          sawForgedOwnershipRefusal=true;
        }
        if(!sawResistance){
          await combat.getByLabel('Original attack target').selectOption(gargoyle);
          await combat.getByLabel('Approved weapon profile').selectOption('steel_longsword');
          await combat.getByLabel('Combat roll mode').selectOption('PLAYER_PHYSICAL');
          await combat.getByLabel('Physical d20 face').fill('19');
          await combat.getByLabel('Physical damage face').fill('6');
          await combat.getByRole('button',{name:'Resolve original attack'}).click();
          await expect(combat.getByRole('status')).toContainText('committed');
          const afterProj=await request(page,c,'/projection');
          expect(afterProj.combatState.lastAttack.ruleApplied).toBe('RESISTANCE_HALF_FLOOR');
          expect(afterProj.combatState.lastAttack.rawDamage).toBe(7);
          expect(afterProj.combatState.lastAttack.damage).toBe(3);
          sawResistance=true;
        }else if(!skel1Defeated){
          await combat.getByLabel('Original attack target').selectOption(skel1);
          await combat.getByLabel('Approved weapon profile').selectOption('iron_mace');
          await combat.getByLabel('Combat roll mode').selectOption('PLAYER_PHYSICAL');
          await combat.getByLabel('Physical d20 face').fill('18');
          await combat.getByLabel('Physical damage face').fill('6');
          await combat.getByRole('button',{name:'Resolve original attack'}).click();
          await expect(combat.getByRole('status')).toContainText('committed');
          const afterProj=await request(page,c,'/projection');
          expect(afterProj.combatState.lastAttack.ruleApplied).toBe('VULNERABILITY_DOUBLE');
          expect(afterProj.combatState.lastAttack.rawDamage).toBe(7);
          expect(afterProj.combatState.lastAttack.damage).toBe(14);
          const skel1Combatant=afterProj.combatState.combatants.find((x:any)=>x.entityId===skel1);
          const skel2Combatant=afterProj.combatState.combatants.find((x:any)=>x.entityId===skel2);
          expect(skel1Combatant.currentHp).toBe(0);
          expect(skel2Combatant.currentHp).toBe(13);
          sawVulnerability=true;
          skel1Defeated=true;
        }
      }else if(active.entityId==='instance.v1.ben'){
        if(!sawBypass){
          await combat.getByLabel('Original attack target').selectOption(gargoyle);
          await combat.getByLabel('Approved weapon profile').selectOption('adamantine_warhammer');
          await combat.getByLabel('Combat roll mode').selectOption('PLAYER_PHYSICAL');
          await combat.getByLabel('Physical d20 face').fill('19');
          await combat.getByLabel('Physical damage face').fill('6');
          await combat.getByRole('button',{name:'Resolve original attack'}).click();
          await expect(combat.getByRole('status')).toContainText('committed');
          const afterProj=await request(page,c,'/projection');
          expect(afterProj.combatState.lastAttack.ruleApplied).toBe('UNMODIFIED');
          expect(afterProj.combatState.lastAttack.rawDamage).toBe(7);
          expect(afterProj.combatState.lastAttack.damage).toBe(7);
          sawBypass=true;
        }
      }else{
        // Monster turn: digital attack against Ben
        await combat.getByLabel('Original attack target').selectOption('instance.v1.ben');
        await combat.getByLabel('Combat roll mode').selectOption('SERVER_DIGITAL');
        await combat.getByRole('button',{name:'Resolve original attack'}).click();
        await expect(combat.getByRole('status')).toContainText('committed');
      }
    }
    await combat.getByRole('button',{name:'Next original turn'}).click();
    await expect(combat.getByRole('status')).toContainText('committed');
  }

  expect(sawForgedOwnershipRefusal).toBe(true);
  expect(sawResistance).toBe(true);
  expect(sawBypass).toBe(true);
  expect(sawVulnerability).toBe(true);
  expect(skel1Defeated).toBe(true);

  await combat.getByRole('button',{name:'End original encounter'}).click();
  await expect(combat.getByRole('button',{name:'Start original encounter'})).toBeVisible();

  const a=await state(page,c);
  // Skeleton #1 was defeated (0 HP) but retains its memory history!
  expect(a.entities[skel1].entity.resources.hp.value).toBe(0);
  expect(a.entities[skel1].history.memories).toHaveLength(1);
  expect(a.entities[skel1].history.memories[0].value.text).toBe('Crypt Skeleton Alpha guards the bronze reliquary.');
  // Skeleton #2 (same SRD source `srd51:monster:256`) is untouched at 13 HP and 0 memories
  expect(a.entities[skel2].entity.resources.hp.value).toBe(13);
  expect(a.entities[skel2].history.memories).toHaveLength(0);

  writeFileSync(join(c.root,'combat-r1-01-a.private.json'),JSON.stringify(a));
  await page.screenshot({path:join(c.root,'combat-r1-01-app-a.png'),fullPage:true});
  const auditA=await request(page,c,'/storage-align/audit',{});
  expect(auditA.complete_history_verified).toBe(true);

  // Switch to Save B and verify complete Save isolation
  await page.getByLabel('Layered development Save').selectOption('b');
  await login(page,host.hostKey);
  const b=await state(page,c);
  expect(b.projection.npcs).toEqual([]);
  expect(b.projection.characters.map((x:any)=>x.currentHp)).toEqual([12,9]);
  writeFileSync(join(c.root,'combat-r1-01-b.private.json'),JSON.stringify(b));

  const afterHashes=hashes(c);
  expect(afterHashes).toEqual(before);
  writeFileSync(join(c.root,'combat-r1-01-ui.json'),JSON.stringify({
    verified:true,
    catalogueCount:JSON.parse(readFileSync(join(c.root,'mounts.json'),'utf8')).population.catalogueCount,
    skel1,
    skel2,
    gargoyle,
    fireElem,
    sawForgedOwnershipRefusal,
    sawResistance,
    sawBypass,
    sawVulnerability,
    skel1Defeated,
    baselineHashes:before,
    playerSecretsAbsent:true
  },null,2));
});

test('COMBAT-R1-01 full restart recovers SRD encounter state, defeated NPC memory, and Save isolation without full replay',async({page})=>{
  test.skip(!process.env.VADALLFATE_COMBAT_R1_01_CONTROL||process.env.VADALLFATE_COMBAT_R1_01_PHASE!=='restart');
  const {c,host}=fixture();
  await page.goto('/?storageAlign=2');
  for(const save of ['a','b']){
    if(save==='b')await page.getByLabel('Layered development Save').selectOption(save);
    await login(page,host.hostKey);
    const current=await state(page,c);
    expect(current).toEqual(JSON.parse(readFileSync(join(c.root,`combat-r1-01-${save}.private.json`),'utf8')));
    const status=await request(page,c,'/status');
    expect(status.startupFullHistoryReplayed).toBe(false);
    const audit=await request(page,c,'/storage-align/audit',{});
    expect(audit.complete_history_verified).toBe(true);
  }
  expect(hashes(c)).toEqual(JSON.parse(readFileSync(join(c.root,'combat-r1-01-ui.json'),'utf8')).baselineHashes);
  writeFileSync(join(c.root,'combat-r1-01-restart.json'),JSON.stringify({
    verified:true,
    bothSnapshotsExact:true,
    startupFullHistoryReplayed:false,
    baselineHashesUnchanged:true
  },null,2));
});
