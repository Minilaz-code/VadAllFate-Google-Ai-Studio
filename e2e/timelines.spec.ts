import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';

test('inspect a checkpoint and branch its timeline without overwriting the runtime',async({page})=>{
 test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires dedicated private Windows runtime');
 const host=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(host.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();
 await panel.getByText('Campaigns and Save branches',{exact:true}).click();
 await panel.getByLabel('New campaign name').fill('Persistent world checkpoint');
 const created=page.waitForResponse(r=>r.url().endsWith('/campaigns/saves')&&r.request().method()==='POST');
 await panel.getByRole('button',{name:'Create restartable Save branch'}).click();const checkpoint=await (await created).json();
 expect(checkpoint.integrity).toBe('ok');
 await panel.getByLabel('Checkpoint timeline').selectOption(checkpoint.id);
 await panel.getByRole('button',{name:'Inspect checkpoint',exact:true}).click();
 await expect(panel.getByText(/whole-runtime checkpoint, not portable/)).toBeVisible();
 await panel.getByLabel('New campaign name').fill('Independent persistent world timeline');
 const branched=page.waitForResponse(r=>r.url().endsWith('/campaigns/saves')&&r.request().method()==='POST');
 await panel.getByRole('button',{name:'Branch selected checkpoint'}).click();const child=await (await branched).json();
 expect(child.parentSaveId).toBe(checkpoint.id);expect(child.snapshotRef).toEqual(checkpoint.snapshotRef);expect(child.id).not.toBe(checkpoint.id);
 if(process.env.VADALLFATE_E2E_CHECKPOINT_OUTPUT)writeFileSync(process.env.VADALLFATE_E2E_CHECKPOINT_OUTPUT,JSON.stringify({id:child.id}));
});
