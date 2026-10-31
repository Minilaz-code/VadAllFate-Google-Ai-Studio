import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('real Waterdeep content, protected artwork and committed interaction',async({page})=>{
  test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires a deliberately launched private Python runtime');
  const record=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('Host bootstrap key').fill(record.hostKey);
  await page.getByRole('button',{name:'Authenticate',exact:true}).click();
  const panel=page.getByRole('region',{name:'Campaign source content'});
  await expect(panel).toBeVisible();
  await panel.getByRole('button',{name:/Campaign content/}).click();
  await expect(panel.getByLabel('World pack').locator('option')).toHaveCount(2);
  await panel.getByLabel('World pack').selectOption({index:1});
  // Select the configured Waterdeep adventure rather than the SCC verification companion.
  const adventureValue=await panel.getByLabel('Adventure pack').locator('option').evaluateAll(options=>
    (options as HTMLOptionElement[]).find(o=>o.label.includes('handoff.adventure'))!.value);
  await panel.getByLabel('Adventure pack').selectOption(adventureValue);
  await panel.getByRole('button',{name:'Pin selected content'}).click();
  await expect(panel.getByRole('status')).toContainText('Committed');
  await panel.getByLabel('Location',{exact:true}).selectOption({label:'The Yawning Portal'});
  await panel.getByRole('button',{name:'Inspect location'}).click();
  await expect(panel.getByRole('heading',{name:/The Yawning Portal · DM only/})).toBeVisible();
  await expect(panel.locator('img').first()).toBeVisible();
  expect(await panel.locator('img').first().evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await panel.getByLabel('Scene',{exact:true}).selectOption({label:'Where to Start'});
  await panel.getByRole('button',{name:'Open scene',exact:true}).click();
  await expect(panel.getByRole('heading',{name:/Where to Start · DM only/})).toBeVisible();
  await panel.getByLabel('NPC definition').selectOption({label:'Durnan'});
  await panel.getByRole('button',{name:'Inspect NPC',exact:true}).click();
  await expect(panel.getByRole('heading',{name:/Durnan · DM only/})).toBeVisible();
  await panel.getByRole('button',{name:'Introduce NPC to party'}).click();
  await expect(panel.getByRole('article',{name:'Party scene'})).toContainText('Durnan');
  await panel.getByLabel('Speaking character').selectOption('char-lyra-01');
  await panel.getByLabel('Interaction NPC').selectOption({label:'Durnan'});
  const message='Good evening. May I ask about the inn?';
  await panel.getByLabel('Message to NPC').fill(message);
  await panel.getByRole('button',{name:'Speak and record'}).click();
  await expect(panel.getByText(/Lyra Vance addresses Durnan:/)).toContainText(message);
  await expect(panel.getByText(/AI NPC replies are unavailable/)).toBeVisible();
  expect(errors).toEqual([]);
  // Verify durability after browser reload with the same server-backed session.
  await page.reload();await panel.getByRole('button',{name:/Campaign content/}).click();
  await expect(panel.getByText(/Lyra Vance addresses Durnan:/)).toContainText(message);
});
