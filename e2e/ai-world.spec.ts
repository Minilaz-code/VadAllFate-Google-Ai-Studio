import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('real configured model replies to persistent source NPC interaction',async({page})=>{
 test.setTimeout(150000);
 test.skip(!process.env.VADALLFATE_E2E_HOST_RECORD,'Requires dedicated private runtime and real configured model');
 const host=JSON.parse(readFileSync(process.env.VADALLFATE_E2E_HOST_RECORD!,'utf8'));
 await page.goto('/');await page.getByLabel('Host bootstrap key').fill(host.hostKey);await page.getByRole('button',{name:'Authenticate',exact:true}).click();
 const panel=page.getByRole('region',{name:'Campaign source content'});await panel.getByRole('button',{name:/Campaign content/}).click();
 await expect(panel.getByText(/Persistent NPC: Durnan.*observed memories [1-9]/)).toBeVisible();
 if(process.env.VADALLFATE_E2E_PHASE==='new'){
  await panel.getByLabel('Speaking character').selectOption('char-lyra-01');await panel.getByLabel('Interaction NPC').selectOption('personal.waterdeep.handoff.world:durnan');
  await panel.getByLabel('Message to NPC').fill('Thank you for hearing my promise. I will speak with you when I return.');await panel.getByRole('button',{name:'Speak and record'}).click();
 }
 if(process.env.VADALLFATE_E2E_PHASE!=='resume'){
  const pending=page.waitForResponse(r=>r.url().includes('/content/ai-reply')&&r.request().method()==='POST',{timeout:120000});
  await panel.getByRole('button',{name:'Request AI NPC reply'}).click();
  const response=await pending;expect(response.status()).toBe(200);expect((await response.json()).receipt.status).toBe('COMMITTED');
 }
 await expect(panel.getByText(/^AI NPC:/).last()).toBeVisible({timeout:15000});
 const play=await page.evaluate(async()=>{const s=JSON.parse(sessionStorage.getItem('vadallfate.v2.session')||localStorage.getItem('vadallfate.v2.session')||'{}');
  return await (await fetch('http://127.0.0.1:8876/api/v2/content/play',{headers:{'X-VadAllFate-Session-Token':s.dm}})).json();});
 const answer=[...play.interactions].reverse().find((e:any)=>e.replyOrigin==='ai_model');
 expect(answer.aiProvenance.provider).toContain('ollama-live:');expect(answer.aiProvenance.usedChars).toBeLessThanOrEqual(5000);
 expect(answer.npcInstanceId).toBeTruthy();
});
