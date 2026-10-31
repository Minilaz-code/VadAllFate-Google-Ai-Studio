import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('reopened SQLite Save branch accepts an explicit human DM reply',async({page})=>{
 test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires a deliberately launched Save branch');
 const record=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(record.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await expect(panel).toBeVisible();await panel.getByRole('button',{name:/Campaign content/}).click();
 await expect(panel.getByText(/Lyra Vance addresses Durnan:/)).toBeVisible();
 if(await panel.getByLabel('Human DM NPC reply').isVisible()){
 await panel.getByLabel('Human DM NPC reply').fill('Welcome. What would you like to know?');
 await panel.getByRole('button',{name:'Send human DM reply'}).click();
 await expect(panel.getByText('Human DM, as the NPC: Welcome. What would you like to know?')).toBeVisible();
 await expect(panel.getByRole('status')).toContainText('Committed');
 }
 await page.reload();await panel.getByRole('button',{name:/Campaign content/}).click();
 await expect(panel.getByText('Human DM, as the NPC: Welcome. What would you like to know?')).toBeVisible();
});
