/**
 * VadAllFate V2 — Read-Only SRD 5.1 Reference Client (srd51Reference.ts)
 *
 * Connects the React Rules Browser to the read-only Python SRD 5.1 HTTP API
 * (`/api/srd51/*`) backed by the verified `vadallfate_srd51.sqlite` database.
 *
 * ARCHITECTURAL INVARIANTS:
 * - Strictly read-only reference queries (GET only).
 * - Zero LLM / Gemini invocations.
 * - Independent of CampaignClient / DemoCampaignClient / PythonRuntimeGateway.
 * - Fails explicitly with typed error states when the backend reference API is unreachable;
 *   never silently fabricates fake SRD rows.
 */

export type SRD51EntityType =
  | 'class'
  | 'race'
  | 'monster'
  | 'spell'
  | 'equipment'
  | 'magic_item'
  | 'condition'
  | 'rule'
  | 'rollable_table';

export interface SRD51EntityRecord {
  entity_key: string;
  entity_type: SRD51EntityType;
  name: string;
  ruleset: 'SRD-5.1';
  verification_status: 'unverified' | 'verified' | string;
  source_table: string;
  original_id: number;
  ui_category: string;
  summary: string;
  data: Record<string, any>;
}

export interface SRD51SourceMetadata {
  ruleset: 'SRD-5.1';
  role: 'read_only_reference_data';
  query_only: boolean;
  combat_authorization: string;
  sqlite_sha256: string;
  sqlite_size_bytes: number;
  verified_canonical_snapshot: boolean;
  schema_version: string | null;
  total_entities: number;
  counts_by_type: Record<string, number>;
  entity_types: SRD51EntityType[];
  source: {
    source_key: string;
    title: string;
    version?: string;
    license_id: string;
    attribution: string;
    source_url?: string;
    sha256?: string;
    imported_at?: string;
  };
}

export interface SRD51SearchResponse {
  ruleset: 'SRD-5.1';
  role: 'read_only_reference_data';
  query: string;
  entity_type: SRD51EntityType | null;
  category: string;
  limit: number;
  count: number;
  items: SRD51EntityRecord[];
}

export interface SRD51SearchOptions {
  query?: string;
  type?: SRD51EntityType;
  category?: string;
  limit?: number;
  signal?: AbortSignal;
}

export class SRD51ReferenceError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.name = 'SRD51ReferenceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
}>;

export class SRD51ReferenceClient {
  private baseUrl: string;
  private fetchImpl: FetchLike;

  constructor(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
    const rawBase = options?.baseUrl ?? '';
    this.baseUrl = rawBase.replace(/\/+$/, '');
    this.fetchImpl = options?.fetchImpl ?? ((url, init) => fetch(url, init));
  }

  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let response: { ok: boolean; status: number; json(): Promise<any> };
    try {
      response = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        throw err;
      }
      throw new SRD51ReferenceError(
        'BACKEND_UNREACHABLE',
        `SRD 5.1 Python reference API is unreachable at ${url || '/api/srd51'}. Start the Python SRD API server to browse the 1,207-record SQLite database.`
      );
    }

    let body: any = null;
    try {
      body = await response.json();
    } catch {
      throw new SRD51ReferenceError(
        'INVALID_RESPONSE',
        `SRD 5.1 reference API returned non-JSON response (HTTP ${response.status}).`,
        response.status
      );
    }

    if (!response.ok) {
      const code = typeof body?.error === 'string' ? body.error : `HTTP_${response.status}`;
      const msg =
        typeof body?.message === 'string'
          ? body.message
          : `SRD 5.1 reference query failed with status ${response.status}.`;
      throw new SRD51ReferenceError(code, msg, response.status);
    }

    return body as T;
  }

  public async getStatus(signal?: AbortSignal): Promise<SRD51SourceMetadata> {
    return this.requestJson<SRD51SourceMetadata>('/api/srd51/status', signal);
  }

  public async search(options: SRD51SearchOptions = {}): Promise<SRD51SearchResponse> {
    const params = new URLSearchParams();
    if (options.query !== undefined && options.query.trim() !== '') {
      params.set('q', options.query.trim());
    }
    if (options.type) {
      params.set('type', options.type);
    }
    if (options.category && options.category !== 'All') {
      params.set('category', options.category);
    }
    if (options.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    const qs = params.toString();
    const path = qs ? `/api/srd51/search?${qs}` : '/api/srd51/search';
    return this.requestJson<SRD51SearchResponse>(path, options.signal);
  }

  public async getByKey(
    entityKey: string,
    signal?: AbortSignal
  ): Promise<SRD51EntityRecord | null> {
    if (!entityKey || !entityKey.trim()) {
      throw new SRD51ReferenceError('VALIDATION_FAILED', 'Entity key must be non-empty.');
    }
    const encoded = encodeURIComponent(entityKey.trim());
    try {
      const res = await this.requestJson<{ item: SRD51EntityRecord }>(
        `/api/srd51/entities/${encoded}`,
        signal
      );
      return res.item ?? null;
    } catch (err) {
      if (err instanceof SRD51ReferenceError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  public async listByType(
    entityType: SRD51EntityType,
    limit: number = 50,
    signal?: AbortSignal
  ): Promise<SRD51EntityRecord[]> {
    const encoded = encodeURIComponent(entityType);
    const res = await this.requestJson<{ items: SRD51EntityRecord[] }>(
      `/api/srd51/types/${encoded}?limit=${encodeURIComponent(String(limit))}`,
      signal
    );
    return res.items ?? [];
  }
}

/**
 * Formats structured SRD 5.1 entity `data` into readable multi-line reference text
 * while preserving exact source fields.
 */
export function formatSRD51EntityDetails(entity: SRD51EntityRecord): {
  subtitle: string;
  statsSummary: string[];
  bodyText: string;
} {
  const d = entity.data || {};
  const stats: string[] = [];
  let subtitle = `${entity.entity_type.replace('_', ' ').toUpperCase()} • ${entity.ui_category}`;
  let bodyText = typeof d.description === 'string' ? d.description : entity.summary;

  if (entity.entity_type === 'spell') {
    const levelLabel = d.level === 0 ? 'Cantrip' : `Level ${d.level ?? '?'}`;
    subtitle = `${levelLabel} ${d.school || 'Spell'}${d.ritual ? ' (Ritual)' : ''}`;
    if (d.casting_time) stats.push(`Casting Time: ${d.casting_time}`);
    if (d.range) stats.push(`Range: ${d.range}`);
    if (d.duration) stats.push(`Duration: ${d.duration}${d.concentration ? ' (Concentration)' : ''}`);
    const comps: string[] = [];
    if (d.components_v) comps.push('V');
    if (d.components_s) comps.push('S');
    if (d.components_m) comps.push(`M (${d.material_description || 'material'})`);
    if (comps.length > 0) stats.push(`Components: ${comps.join(', ')}`);
    if (Array.isArray(d.classes) && d.classes.length > 0) {
      stats.push(`Classes: ${d.classes.join(', ')}`);
    }
    if (d.higher_level) {
      bodyText = `${bodyText}\n\nAt Higher Levels: ${d.higher_level}`;
    }
  } else if (entity.entity_type === 'monster') {
    subtitle = `${d.size || ''} ${d.type || 'creature'}${d.subtype ? ` (${d.subtype})` : ''}, ${d.alignment || 'unaligned'}`.trim();
    stats.push(`AC: ${d.ac ?? '?'}${d.ac_type ? ` (${d.ac_type})` : ''}`);
    stats.push(`HP: ${d.hp ?? '?'}${d.hit_dice ? ` (${d.hit_dice})` : ''}`);
    stats.push(`Speed: ${d.speed || '30 ft.'}`);
    stats.push(`CR: ${d.cr ?? '?'}${d.xp ? ` (${d.xp} XP)` : ''}`);
    if (d.str !== undefined) {
      stats.push(`STR ${d.str} | DEX ${d.dex} | CON ${d.con} | INT ${d.int} | WIS ${d.wis} | CHA ${d.cha}`);
    }
    if (d.immunities) stats.push(`Immunities: ${d.immunities}`);
    if (d.resistances) stats.push(`Resistances: ${d.resistances}`);
    if (d.senses) stats.push(`Senses: ${d.senses}`);

    const sections: string[] = [];
    if (Array.isArray(d.traits) && d.traits.length > 0) {
      sections.push(
        'TRAITS:\n' +
          d.traits.map((t: any) => `• ${t.name}: ${t.description || t.desc || ''}`).join('\n')
      );
    }
    if (Array.isArray(d.actions) && d.actions.length > 0) {
      sections.push(
        'ACTIONS:\n' +
          d.actions.map((a: any) => `• ${a.name}: ${a.description || a.desc || ''}`).join('\n')
      );
    }
    if (Array.isArray(d.legendary_actions) && d.legendary_actions.length > 0) {
      sections.push(
        'LEGENDARY ACTIONS:\n' +
          d.legendary_actions.map((la: any) => `• ${la.name}: ${la.description || la.desc || ''}`).join('\n')
      );
    }
    if (sections.length > 0) {
      bodyText = sections.join('\n\n');
    }
  } else if (entity.entity_type === 'equipment') {
    subtitle = `Equipment • ${d.category || 'Gear'}`;
    if (d.cost_gp !== undefined && d.cost_gp !== null) {
      stats.push(`Cost: ${d.cost_gp} ${d.cost_unit || 'gp'}`);
    }
    if (d.weight !== undefined && d.weight !== null) {
      stats.push(`Weight: ${d.weight} lb.`);
    }
    if (d.damage_dice) {
      stats.push(`Damage: ${d.damage_dice} ${d.damage_type || ''}`.trim());
    }
    if (d.ac_base) {
      stats.push(`Armor Class: ${d.ac_base}${d.ac_dex_bonus ? ' + Dex' : ''}`);
    }
  } else if (entity.entity_type === 'magic_item') {
    subtitle = `${d.type || 'Wondrous item'}, ${d.rarity || 'uncommon'}`;
    if (d.requires_attunement) {
      stats.push(`Attunement: ${d.attunement_description || 'Required'}`);
    }
  } else if (entity.entity_type === 'class') {
    subtitle = `Character Class • Hit Die d${d.hit_die ?? '?'}`;
    if (Array.isArray(d.saving_throws)) {
      stats.push(`Saving Throws: ${d.saving_throws.join(', ')}`);
    }
    if (d.spellcasting_ability) {
      stats.push(`Spellcasting: ${d.spellcasting_ability}`);
    }
  } else if (entity.entity_type === 'race') {
    subtitle = `Character Race • ${d.size || 'Medium'}`;
    if (d.speed) stats.push(`Speed: ${d.speed} ft.`);
  }

  return {
    subtitle,
    statsSummary: stats,
    bodyText: bodyText || entity.summary,
  };
}

export const srd51ReferenceClient = new SRD51ReferenceClient();
