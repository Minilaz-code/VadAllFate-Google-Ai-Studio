import {test,expect,Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

function fixture(){
  const control=JSON.parse(readFileSync(process.env.VADALLFATE_PLAY00_CONTROL!,'utf8'));
  return {control,host:JSON.parse(readFileSync(join(control.root,'launcher','pids.json'),'utf8')),
    before:JSON.parse(readFileSync(join(control.root,'journey.private.json'),'utf8'))};
}

async function openCampaign(page:Page,control:any,host:any,campaignId:string){
  await page.goto('/');await page.getByLabel('Host bootstrap key').fill(host.hostKey);
  await page.getByRole('button',{name:'Authenticate',exact:true}).click();
  const source=page.getByRole('region',{name:'Campaign source content'});
  await source.getByRole('button',{name:/Campaign content/}).click();
  await source.getByText('Campaigns and Save branches',{exact:true}).click();
  await source.getByLabel('Existing campaign').selectOption(campaignId);
  await source.getByRole('button',{name:'Load campaign',exact:true}).click();
  await expect(source.getByRole('status')).toContainText('Campaign session changed');
  await page.getByLabel('Select Role and Hosting Status').click();
  await page.getByRole('button',{name:'Player Guest: Lyra',exact:false}).click();
  await expect(page.getByRole('region',{name:'Adventure play'})).toBeVisible();
}

async function readState(page:Page,control:any){
  return page.evaluate(async(api)=>{
    const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);
    const player={'X-VadAllFate-Session-Token':s.player};
    const p=await (await fetch(api+'/projection?campaign_id='+s.campaignId,{headers:player})).json();
    const status=await (await fetch(api+'/status?campaign_id='+s.campaignId,{headers:player})).json();
    const dm=await (await fetch(api+'/content/play',{headers:{'X-VadAllFate-Session-Token':s.dm}})).json();
    const lyra=p.characters.find((c:any)=>c.id===p.activeCharacterId);
    const keeper=dm.instances?.find((n:any)=>n.sourceBinding?.ref==='example.lantern-marsh:keeper');
    const contact=dm.instances?.find((n:any)=>n.sourceBinding?.ref==='example.reliability:observer');
    return {campaignId:p.campaignId,snapshot:{commitSequence:status.commitSequence,stateHash:status.fullStateHash||status.stateHash,worldMinute:status.worldMinute},
      hp:lyra.currentHp,inventory:lyra.inventory.map((i:any)=>({id:i.id,quantity:i.quantity})),rolls:p.activeRollRequests,
      memoryRecorded:Boolean(keeper?.cognition?.memories?.some((m:any)=>m.action_type==='CONTENT_INTERACTION'&&m.summary?.includes('amber lantern'))),
      dueContactPresent:Boolean(contact?.adventurePresent),sourcePins:dm.pins||dm.selection?.pins||[]};
  },'http://127.0.0.1:'+control.api+'/api/v2');
}

test('PLAY-00 same campaign story records actual AI and capacity holds',async({page})=>{
  test.skip(!process.env.VADALLFATE_PLAY00_CONTROL||process.env.VADALLFATE_PLAY00_PHASE!=='story','Run after the connected resource phase');
  test.setTimeout(240000);page.setDefaultTimeout(20000);
  const {control,host,before}=fixture();await openCampaign(page,control,host,before.campaignId);
  const play=page.getByRole('region',{name:'Adventure play'});
  await play.getByLabel('Talk to present NPC').selectOption({label:'Nera Reed'});
  await play.getByLabel('Adventure dialogue').fill('I promise to return with an amber lantern.');
  await play.getByRole('button',{name:'Speak',exact:true}).click();
  await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden({timeout:120000});
  const firstAlerts=await play.getByRole('alert').allTextContents();
  await play.getByRole('button',{name:'Wait five minutes',exact:true}).click();
  await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden({timeout:30000});
  await play.getByLabel('Adventure dialogue').fill('What object did I promise to bring back earlier?');
  await play.getByRole('button',{name:'Speak',exact:true}).click();
  await expect(play.getByText('Resolving your action…',{exact:true})).toBeHidden({timeout:120000});
  const finalAlerts=await play.getByRole('alert').allTextContents();
  const replies=await play.getByLabel('Primary adventure story feed').getByText(/^Nera Reed:/).allTextContents();
  const state=await readState(page,control);
  expect(state.campaignId).toBe(before.campaignId);
  expect(state.hp).toBe(before.hp);expect(state.inventory).toEqual(before.inventory);expect(state.rolls).toEqual(before.rolls);
  const evidence={...state,firstAlerts,finalAlerts,recallDemonstrated:/lantern/i.test(replies.at(-1)||''),
    storyDisposition:state.memoryRecorded?'RECORDED_MEMORY':'HOLD_MEMORY_NOT_RECORDED',
    automaticRecallDisposition:/lantern/i.test(replies.at(-1)||'')?'DEMONSTRATED':'HOLD_NO_VALID_RECALL_REPLY'};
  writeFileSync(join(control.root,'story.private.json'),JSON.stringify(evidence));
  await page.screenshot({path:join(control.root,'play00-story.png'),fullPage:true});
  console.log('PLAY00_STORY_DISPOSITION',evidence.storyDisposition,evidence.automaticRecallDisposition);
});

test('PLAY-00 cold application restart preserves the same campaign and eligible memory',async({page})=>{
  test.skip(!process.env.VADALLFATE_PLAY00_CONTROL||process.env.VADALLFATE_PLAY00_PHASE!=='resume','Requires deliberate stop/restart of both owned services');
  const {control,host,before}=fixture();const saved=JSON.parse(readFileSync(join(control.root,'story.private.json'),'utf8'));
  await openCampaign(page,control,host,before.campaignId);const restored=await readState(page,control);
  expect(restored).toEqual(Object.fromEntries(Object.entries(saved).filter(([k])=>!['firstAlerts','finalAlerts','recallDemonstrated','storyDisposition','automaticRecallDisposition'].includes(k))));
  await page.getByRole('button',{name:'Character',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Lyra Vance',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Inventory/}).click();
  await expect(page.getByText('Qty: 1',{exact:true}).first()).toBeVisible();
  writeFileSync(join(control.root,'restart-verified.private.json'),JSON.stringify({verified:true,snapshot:restored.snapshot,memoryRecorded:restored.memoryRecorded}));
  await page.screenshot({path:join(control.root,'play00-restarted.png'),fullPage:true});
});

test('PLAY-00 separate invited browser joins without DM credentials',async({page,browser})=>{
  test.skip(!process.env.VADALLFATE_PLAY00_CONTROL||process.env.VADALLFATE_PLAY00_PHASE!=='guest','Requires the original disposable campaign');
  const {control,host,before}=fixture();await openCampaign(page,control,host,before.campaignId);
  const invite=await page.evaluate(async(api)=>{
    const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!);
    const r=await fetch(api+'/auth/provision',{method:'POST',headers:{'Content-Type':'application/json','X-VadAllFate-Session-Token':s.dm},
      body:JSON.stringify({actorId:'char-lyra-01',role:'player',assignedCharacterId:'char-lyra-01',campaignId:s.campaignId,isHost:false,maxUses:1,ttlSeconds:300})});
    if(!r.ok)throw new Error('Host invite provisioning failed');return (await r.json()).inviteCode;
  },'http://127.0.0.1:'+control.api+'/api/v2');
  const context=await browser.newContext();const guest=await context.newPage();
  try {
    await guest.goto('http://127.0.0.1:'+control.ui+'/');
    await guest.getByLabel('Player invite code').fill(invite);await guest.getByRole('button',{name:'Join with invite',exact:true}).click();
    await expect(guest.getByRole('button',{name:'Character',exact:true})).toBeVisible();
    await expect(guest.getByRole('button',{name:'DM Planning',exact:true})).toHaveCount(0);
    expect(await guest.evaluate(()=>Boolean(JSON.parse(sessionStorage.getItem('vadallfate.v2.session')!).dm))).toBe(false);
    await guest.getByRole('button',{name:'Character',exact:true}).click();
    await expect(guest.getByRole('heading',{name:'Lyra Vance',exact:true})).toBeVisible();
    await expect(guest.getByText(/DM SECRET/)).toHaveCount(0);
    writeFileSync(join(control.root,'guest-verified.private.json'),JSON.stringify({verified:true,noDmCredential:true,noDmWorkspace:true,campaignId:before.campaignId}));
    await guest.screenshot({path:join(control.root,'play00-guest.png'),fullPage:true});
  }finally{await context.close();}
});

test('PLAY-00 live startup is fail closed and explicit demo dice never commit',async({page})=>{
  test.skip(!process.env.VADALLFATE_PLAY00_CONTROL||process.env.VADALLFATE_PLAY00_PHASE!=='demo','Dedicated application verification only');
  const writes:string[]=[];page.on('request',r=>{if(r.url().includes('/api/v2/actions'))writes.push(r.method());});
  await page.goto('/');
  await expect(page.getByText('AUTH REQUIRED',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Active Scene',exact:true})).toHaveCount(0);
  await page.goto('/?demo=1');
  await expect(page.getByText('EXPLICIT DEMO',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Authoritative dice')).toHaveCount(0);
  await page.getByRole('button',{name:'Roll Dice',exact:true}).click();
  await expect(page.getByText('Local practice dice tray (not saved)',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'d20',exact:true}).click();
  expect(writes).toEqual([]);
  const {control}=fixture();writeFileSync(join(control.root,'demo-verified.private.json'),JSON.stringify({verified:true,noAuthoritativeWrites:true}));
});
