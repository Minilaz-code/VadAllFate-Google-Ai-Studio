import {resolveV2ApiBaseUrl} from './v2BackendClient.ts';
import {getV2CampaignId, v2SessionHeaders} from './v2Session.ts';

export interface StorageCapabilities {
  status: string; campaignId: string; saveId: string | null;
  playable: boolean; granularActions: false; migrationAvailable: false;
  verification: string; reason: string;
}
const known = new Set(['LEGACY_SUPPORTED','GRANULAR_PREPARED_READ_ONLY','UNSUPPORTED_FORMAT',
  'CORRUPT_OR_INCONSISTENT','MIGRATION_REQUIRED']);

export function decodeCapabilities(data: any, campaign: string): StorageCapabilities {
  if (data?.contractVersion !== 'I6.storage-capabilities.v1' || data.campaignId !== campaign ||
      !known.has(data.status) || data.playable !== (data.status === 'LEGACY_SUPPORTED') ||
      data.granularActions !== false || data.migrationAvailable !== false ||
      !(data.saveId === null || typeof data.saveId === 'string') ||
      typeof data.verification !== 'string' || typeof data.reason !== 'string') {
    throw new Error('Storage capabilities are inconsistent or unsupported. Gameplay remains unavailable.');
  }
  return data;
}

export async function fetchStorageCapabilities(role = 'dm', campaign = getV2CampaignId(), signal?: AbortSignal): Promise<StorageCapabilities> {
  const query = new URLSearchParams({campaign_id: campaign});
  const headers = v2SessionHeaders(role);
  const response = await fetch(`${resolveV2ApiBaseUrl()}/storage/capabilities?${query}`, {
    headers, cache: 'no-store', signal: signal ? AbortSignal.any([signal,AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
  });
  if (campaign !== getV2CampaignId() || headers['X-VadAllFate-Session-Token'] !== v2SessionHeaders(role)['X-VadAllFate-Session-Token'])
    throw new Error('Campaign session changed during capability negotiation. Retry for the current campaign.');
  if (response.status === 404) {
    // Old endpoint absence preserves native legacy UI, never grants typed writes.
    return {status:'LEGACY_BACKEND_NO_CAPABILITIES',campaignId:campaign,saveId:null,
      playable:true,granularActions:false,migrationAvailable:false,
      verification:'NOT_REPORTED',reason:'This backend does not report storage capabilities; native legacy operation only.'};
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Storage capability request failed.');
  return decodeCapabilities(data, campaign);
}

export function storageMessage(value: StorageCapabilities): string {
  if (value.status === 'LEGACY_SUPPORTED') return 'Native legacy Save supported. Granular gameplay and migration are unavailable.';
  if (value.status === 'LEGACY_BACKEND_NO_CAPABILITIES') return value.reason;
  if (value.status === 'GRANULAR_PREPARED_READ_ONLY') return 'Prepared fixture: read-only inspection only. This is not a playable campaign.';
  return `Save unavailable: ${value.status.replaceAll('_',' ')}. ${value.reason}`;
}
