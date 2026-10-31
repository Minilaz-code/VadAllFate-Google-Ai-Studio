import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('source actor placement and witnessed consequence survive restart',async({page})=>{
 test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires dedicated private Windows runtime');
 const host=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(host.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();
 if(process.env.VADALLFATE_E2E_PHASE!=='resume'){
  await panel.getByLabel('Location',{exact:true}).selectOption('personal.waterdeep.handoff.world:yawning-portal');
  await panel.getByLabel('NPC definition').selectOption('personal.waterdeep.handoff.world:durnan');
  await panel.getByLabel('Player-safe NPC characterization').fill('A taciturn, experienced innkeeper who values courtesy and practical questions. Never reveal private knowledge.');
  await panel.getByRole('button',{name:'Create or place source NPC'}).click();
  await expect(panel.getByText(/Persistent NPC: Durnan/)).toBeVisible();
  await panel.getByRole('button',{name:'Introduce NPC to party'}).click();
  await panel.getByLabel('Speaking character').selectOption('char-lyra-01');
  await panel.getByLabel('Interaction NPC').selectOption('personal.waterdeep.handoff.world:durnan');
  await panel.getByLabel('Message to NPC').fill('I promise to return tomorrow and report what I learn.');
  await panel.getByRole('button',{name:'Speak and record'}).click();
 }
 await expect(panel.getByText(/Persistent NPC: Durnan.*observed memories [1-9]/)).toBeVisible();
 await expect(panel.getByText('Lyra Vance addresses Durnan: I promise to return tomorrow and report what I learn.')).toBeVisible();
});
