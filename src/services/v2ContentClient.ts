import { v2SessionHeaders, getStoredSession } from './v2Session.ts';
import { resolveV2ApiBaseUrl } from './v2BackendClient.ts';
export interface ContentPin { pack_id: string; pack_version: string; manifest_sha256: string }
export interface ContentPack { pin: ContentPin; title: string; kind: string; dependencies: ContentPin[]; ruleset: string }
export interface ContentRecord { ref: string; name: string; kind: string; pin: ContentPin }
export interface ContentDefinition { ref: string; name: string; kind: string; visibility: string; body: any; sourceRefs: any[]; references: any[]; assets: {id:string;path:string;url:string;status:string;attribution:string}[] }
export function selectContentClosure(packs: ContentPack[], roots: ContentPin[]): ContentPin[] {
  const result = new Map<string,ContentPin>();
  const visit = (pin:ContentPin, stack:Set<string>) => {
    if (stack.has(pin.pack_id)) throw new Error('Cyclic pack dependency');
    const found = packs.find(p=>JSON.stringify(p.pin)===JSON.stringify(pin) || (p.pin.pack_id===pin.pack_id && p.pin.pack_version===pin.pack_version && p.pin.manifest_sha256===pin.manifest_sha256));
    if (!found) throw new Error('Required exact content dependency is not installed');
    const prior=result.get(pin.pack_id);
    if (prior && prior.manifest_sha256!==pin.manifest_sha256) throw new Error('Conflicting content versions');
    if (prior) return;
    for (const dependency of found.dependencies) visit(dependency,new Set([...stack,pin.pack_id]));
    result.set(pin.pack_id,pin);
  };
  for (const pin of roots) visit(pin,new Set());
  return [...result.values()];
}
export async function contentRequest(path:string, role:string, body?:unknown):Promise<any> {
  const campaign=getStoredSession().campaignId || 'aethelgard-vault-001';
  const sep=path.includes('?')?'&':'?';
  const response=await fetch(`${resolveV2ApiBaseUrl()}/content/${path}${sep}campaign_id=${encodeURIComponent(campaign)}`,{
    method:body===undefined?'GET':'POST',headers:{...v2SessionHeaders(role),...(body===undefined?{}:{'Content-Type':'application/json'})},
    body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  const data=await response.json();
  if (!response.ok) throw new Error(data.message || data.error || `Content request failed (${response.status})`);
  return data;
}
export async function contentMutation(path:string,payload:unknown,snapshotRef:unknown,role:string):Promise<any> {
  const result=await contentRequest(path,role,{payload,snapshotRef,actionId:crypto.randomUUID()});
  if(result.receipt?.status!=='COMMITTED') throw new Error(result.receipt?.error || 'Action was not committed');
  return result;
}
