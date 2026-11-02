import {test,expect,Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

function fixture(){
 const control=JSON.parse(readFileSync(process.env.VADALLFATE_STORAGE_ALIGN_CONTROL!,'utf8'));
 return {control,host:JSON.parse(readFileSync(join(control.root,'launcher','pids.json'),'utf8'))};
}
async function login(page:Page,host:any,save='a',role='dm'){
 await page.getByLabel('Disposable Save').selectOption(save);
 await page.getByLabel('Host bootstrap key').fill(host.hostKey);
 await page.getByLabel('Host role',{exact:true}).selectOption(role);
 const response=page.waitForResponse(r=>r.url().includes('/storage-align/login')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const token=(await (await response).json()).sessionToken;
 await expect(page.getByRole('heading',{name:'Lyra of Lantern Reach'})).toBeVisible();
 return token;
}
async function state(page:Page,control:any,token:string,save:string){
 const r=await page.request.get(`http://127.0.0.1:${control.api}/api/v2/storage-align/state?save=${save}`,{headers:{'X-VadAllFate-Session-Token':token}});
 expect(r.ok()).toBe(true);return r.json();
}
function hashes(control:any){
 const pins=JSON.parse(readFileSync(join(control.root,'mounts.json'),'utf8')).mounts;
 return Object.fromEntries(pins.map((p:any)=>[p.file,createHash('sha256').update(readFileSync(join(control.root,p.file))).digest('hex')]));
}

test('STORAGE-ALIGN real layered application journey and separate Save',async({page,browser})=>{
 test.skip(!process.env.VADALLFATE_STORAGE_ALIGN_CONTROL||process.env.VADALLFATE_STORAGE_ALIGN_PHASE!=='journey');
 const {control,host}=fixture();const before=hashes(control);
 await page.goto('/?storageAlign=1');const token=await login(page,host);
 await expect(page.getByTestId('hp')).toHaveText('12');await expect(page.getByTestId('balm')).toHaveText('2');
 await page.getByRole('button',{name:'Use lantern balm (4 HP)',exact:true}).click();
 await expect(page.getByTestId('hp')).toHaveText('16');await expect(page.getByTestId('balm')).toHaveText('1');
 await page.getByLabel('Witness record').fill('I will return with the amber lantern.');
 await page.getByRole('button',{name:'Record testimony and approve trust +1'}).click();
 await expect(page.getByText(/amber lantern.*TOLD_UNVERIFIED/)).toBeVisible();
 for(const revision of ['3','4']){
  await page.getByRole('button',{name:'Advance five minutes and objective'}).click();
  await expect(page.getByTestId('revision')).toHaveText(revision);
 }
 await expect(page.getByTestId('minute')).toHaveText('865');await expect(page.getByTestId('progress')).toHaveText('2');
 await page.getByRole('button',{name:'Run explicit complete audit'}).click();
 await expect(page.getByRole('status')).toContainText('verified revision 4');
 const a=await state(page,control,token,'a');
 expect(a.npc.trust.value).toBe(1);expect(a.quest.complete.value).toBe(true);
 writeFileSync(join(control.root,'edge-a.private.json'),JSON.stringify(a));
 await page.screenshot({path:join(control.root,'storage-align-a.png'),fullPage:true});
 const btoken=await login(page,host,'b');
 await expect(page.getByTestId('hp')).toHaveText('12');await expect(page.getByTestId('minute')).toHaveText('855');
 await page.getByRole('button',{name:'Advance five minutes and objective'}).click();
 await expect(page.getByTestId('revision')).toHaveText('1');
 const b=await state(page,control,btoken,'b');expect(b.memory).toEqual([]);expect(b.npc.trust.value).toBe(0);
 writeFileSync(join(control.root,'edge-b.private.json'),JSON.stringify(b));
 expect(hashes(control)).toEqual(before);
 const context=await browser.newContext();const guest=await context.newPage();
 try{
  await guest.goto(`http://127.0.0.1:${control.ui}/?storageAlign=1`);const ptoken=await login(guest,host,'a','player');
  await expect(guest.getByTestId('hp')).toHaveText('16');
  await expect(guest.getByRole('button',{name:'Record testimony and approve trust +1'})).toHaveCount(0);
  const player=await state(guest,control,ptoken,'a');expect(player.memory).toEqual([]);expect(player.npc.trust).toBe(null);
  const denied=await guest.request.post(`http://127.0.0.1:${control.api}/api/v2/storage-align/audit`,{headers:{'X-VadAllFate-Session-Token':ptoken},data:{}});expect(denied.status()).toBe(403);
 }finally{await context.close();}
 writeFileSync(join(control.root,'edge-journey.private.json'),JSON.stringify({verified:true,baselineHashes:before,primaryRevision:a.snapshot.revision,secondaryRevision:b.snapshot.revision,playerPrivateDataAbsent:true}));
});

test('STORAGE-ALIGN full application restart preserves both outcomes and source bytes',async({page})=>{
 test.skip(!process.env.VADALLFATE_STORAGE_ALIGN_CONTROL||process.env.VADALLFATE_STORAGE_ALIGN_PHASE!=='restart');
 const {control,host}=fixture();await page.goto('/?storageAlign=1');
 for(const save of ['a','b']){
  const token=await login(page,host,save);
  const expected=JSON.parse(readFileSync(join(control.root,`edge-${save}.private.json`),'utf8'));
  expect(await state(page,control,token,save)).toEqual(expected);
 }
 const before=JSON.parse(readFileSync(join(control.root,'edge-journey.private.json'),'utf8')).baselineHashes;
 expect(hashes(control)).toEqual(before);
 await page.screenshot({path:join(control.root,'storage-align-restarted.png'),fullPage:true});
 writeFileSync(join(control.root,'edge-restart.private.json'),JSON.stringify({verified:true,baselineHashesUnchanged:true,bothSaveSnapshotsExact:true}));
});
