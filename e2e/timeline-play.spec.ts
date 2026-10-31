import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('independent timeline resumes the AI reply and commits its own witnessed statement',async({page})=>{
 test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires deliberately launched child timeline');
 const host=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(host.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();
 await expect(panel.getByText(/^AI NPC:/)).toBeVisible();
 await panel.getByLabel('Speaking character').selectOption('char-lyra-01');await panel.getByLabel('Interaction NPC').selectOption('personal.waterdeep.handoff.world:durnan');
 await panel.getByLabel('Message to NPC').fill('This statement belongs only to this timeline.');await panel.getByRole('button',{name:'Speak and record'}).click();
 await expect(panel.getByText('Lyra Vance addresses Durnan: This statement belongs only to this timeline.')).toBeVisible();
 await expect(panel.getByText(/Persistent NPC: Durnan.*observed memories [2-9]/)).toBeVisible();
});
