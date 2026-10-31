import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('full runtime restart restores interaction and independent campaign sessions',async({page})=>{
 test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires a deliberately restarted private Python runtime');
 const record=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(record.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await expect(panel).toBeVisible();
 await panel.getByRole('button',{name:/Campaign content/}).click();
 await expect(panel.getByText(/Lyra Vance addresses Durnan:/)).toBeVisible();
 await panel.getByText('Campaigns and Save branches',{exact:true}).click();
 const name=`Independent test ${Date.now()}`;
 await panel.getByLabel('New campaign name').fill(name);await panel.getByRole('button',{name:'Create campaign',exact:true}).click();
 await expect(panel.getByRole('alert')).toHaveCount(0);
 await expect(panel.getByText(/Lyra Vance addresses Durnan:/)).toHaveCount(0);
 await expect.poll(()=>panel.getByLabel('Existing campaign').locator('option').allTextContents()).toContain(`${name} (active)`);
 const original=await panel.getByLabel('Existing campaign').locator('option').evaluateAll(options=>(options as HTMLOptionElement[]).find(o=>o.value==='aethelgard-vault-001')!.value);
 await panel.getByLabel('Existing campaign').selectOption(original);await panel.getByRole('button',{name:'Load campaign',exact:true}).click();
 await expect(panel.getByText(/Lyra Vance addresses Durnan:/)).toBeVisible();
 await panel.getByLabel('New campaign name').fill('Browser verified checkpoint');
 await panel.getByRole('button',{name:'Create restartable Save branch'}).click();
 await expect(panel.getByText(/passed integrity checks/)).toBeVisible();
 await expect(panel.getByRole('alert')).toHaveCount(0);
});
