import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('I6 Edge prepared status, denied actions and session restart against actual read server',async({page})=>{
  test.skip(!process.env.VADALLFATE_I6_SESSION||Boolean(process.env.VADALLFATE_I6_OLD_BACKEND),'Fresh isolated I6 server required');
  const record=JSON.parse(readFileSync(process.env.VADALLFATE_I6_SESSION!,'utf8'));
  await page.addInitScript(({token,campaign})=>sessionStorage.setItem('vadallfate.v2.session',JSON.stringify({dm:token,campaignId:campaign})),
    {token:record.tokens.dm,campaign:record.campaignId});
  await page.goto('/e2e/storage-inspection.html');
  await page.getByText('Campaigns and Save branches',{exact:true}).click();
  await expect(page.getByText(/Prepared fixture: read-only inspection only/)).toBeVisible();
  for(const name of ['Create campaign','Load campaign','Create restartable Save branch','Inspect checkpoint','Branch selected checkpoint'])
    await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Recheck Save compatibility'})).toBeEnabled();
  await page.reload();await page.getByText('Campaigns and Save branches',{exact:true}).click();
  await expect(page.getByText(/not a playable campaign/)).toBeVisible();
  const result=await page.evaluate(async token=>{
    const r=await fetch('http://127.0.0.1:8896/api/v2/storage/npc?npc_id=npc.0000',{headers:{'X-VadAllFate-Session-Token':token}});
    return r.json();
  },record.tokens.player);
  expect(result.memories).toEqual([]);expect(result.source).toBeUndefined();
});

test('I6 Edge unavailable formats stay disabled and old endpoint absence is labelled',async({page})=>{
  test.skip(!process.env.VADALLFATE_I6_SESSION||Boolean(process.env.VADALLFATE_I6_OLD_BACKEND),'Fresh isolated I6 server required');
  const record=JSON.parse(readFileSync(process.env.VADALLFATE_I6_SESSION!,'utf8'));
  await page.addInitScript(({token,campaign})=>sessionStorage.setItem('vadallfate.v2.session',JSON.stringify({dm:token,campaignId:campaign})),
    {token:record.tokens.dm,campaign:record.campaignId});
  let status='MIGRATION_REQUIRED';
  await page.route('**/storage/capabilities?*',async route=>{
    if(status==='OLD')return route.fulfill({status:404,json:{error:'NOT_FOUND'}});
    return route.fulfill({json:{contractVersion:'I6.storage-capabilities.v1',campaignId:record.campaignId,saveId:'save.original',
      status,playable:false,granularActions:false,migrationAvailable:false,verification:'NOT_FULLY_AUDITED',reason:'Fixture unavailable'}});
  });
  await page.route('**/campaigns*',async route=>route.fulfill({json:route.request().url().includes('/capacity')?{status:'LEGACY_SUPPORTED',representativeRequestBytes:100,limitBytes:65536,counts:{memories:0},durableEventCount:0}:{campaigns:[],saves:[]}}));
  await page.goto('/e2e/storage-inspection.html');await page.getByText('Campaigns and Save branches',{exact:true}).click();
  await expect(page.getByText(/Save unavailable: MIGRATION REQUIRED/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Create campaign',exact:true})).toBeDisabled();
  status='OLD';await page.getByRole('button',{name:'Recheck Save compatibility'}).click();
  await expect(page.getByText(/does not report storage capabilities/)).toBeVisible();
  // HTTP fallback cases are synthetic; the first test uses actual Python data.
});


test('I6 new React client against actual archived I4 backend on fresh legacy Save',async({page})=>{
  test.skip(!process.env.VADALLFATE_I6_OLD_BACKEND||!process.env.VADALLFATE_I6_SESSION,'Actual isolated old backend required');
  const record=JSON.parse(readFileSync(process.env.VADALLFATE_I6_SESSION!,'utf8'));
  await page.addInitScript(({token,campaign})=>sessionStorage.setItem('vadallfate.v2.session',JSON.stringify({dm:token,campaignId:campaign})),
    {token:record.tokens.dm,campaign:record.campaignId});
  await page.goto('/e2e/storage-inspection.html');await page.getByText('Campaigns and Save branches',{exact:true}).click();
  await expect(page.getByText(/does not report storage capabilities/)).toBeVisible();
  await page.getByLabel('New campaign name').fill('Original compatibility timeline');
  await expect(page.getByRole('button',{name:'Create campaign',exact:true})).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:/Save capacity/})).toBeVisible();
  await page.reload();await page.getByText('Campaigns and Save branches',{exact:true}).click();
  await expect(page.getByText(/does not report storage capabilities/)).toBeVisible();
});
