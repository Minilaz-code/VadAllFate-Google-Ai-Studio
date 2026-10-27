import { v2SessionHeaders } from './v2Session.ts';
/**
 * V2 Authoritative Backend Client (KGP-03, HAR-01, Milestone 5)
 *
 * Connects the React UI to the Python V2 HTTP Gateway (`/api/v2/*`):
 * - Knowledge Graph Projection & Entity Dossiers (`/api/v2/graph`)
 * - Authored Markdown Notes + ACLs (`/api/v2/notes`)
 * - DM Planning Lifecycle: Draft -> Propose -> Confirm (`/api/v2/plans`)
 * - Homebrew Workshop Lifecycle: Draft -> Validate -> Implement (`/api/v2/homebrew`)
 * - Single Bounded AI Harness (`/api/v2/harness/run`)
 * - Native Runtime TTS Adapter (`/api/v2/tts/synthesize`)
 */

export interface V2AudienceParams {
  actor_id: string;
  role: 'dm' | 'player' | 'observer' | 'dm_host';
  campaign_id?: string;
  save_id?: string;
  branch_id?: string;
  is_host?: boolean;
  preview_as_player_id?: string | null;
}

export interface V2GraphNode {
  node_id: string;
  label: string;
  entity_type: string;
  summary: string;
  visibility: string;
  truth_level: string;
  revision: number;
  campaign_id: string;
  save_id: string;
  attributes: Record<string, any>;
  provenance: Record<string, any>;
  tags: string[];
}

export interface V2GraphEdge {
  edge_id: string;
  source_uri: string;
  target_uri: string;
  relation_type: string;
  label: string;
  visibility: string;
  truth_level: string;
  revision: number;
}

export interface V2GraphProjectionResponse {
  contract_version: string;
  nodes: V2GraphNode[];
  edges: V2GraphEdge[];
  projection_hash: string;
  total_visible_nodes: number;
  total_visible_edges: number;
  source: 'python_sqlite' | 'fallback_local';
}

export interface V2MarkdownNote {
  note_id: string;
  campaign_id: string;
  save_id: string;
  owner_actor_id: string;
  owner_role: string;
  title: string;
  visibility: 'private_player' | 'party_shared' | 'shared_with_dm' | 'dm_private';
  markdown_rel_path: string;
  content_hash: string;
  revision: number;
  linked_entity_uris: string[];
  tags: string[];
  sync_status: string;
  updated_at: string;
  markdown_body: string;
}

export interface V2PlanRevision {
  plan_id: string;
  campaign_id: string;
  save_id: string;
  branch_id: string;
  revision: number;
  title: string;
  plan_kind: string;
  status: 'draft' | 'proposed' | 'confirmed' | 'withdrawn' | 'superseded' | 'completed';
  source_markdown_hash: string;
  source_markdown_snapshot: string;
  structured_payload: Record<string, any>;
  linked_entity_uris: string[];
  created_by: string;
  confirmed_commit_id: string | null;
  updated_at: string;
}

export interface V2HomebrewRecord {
  homebrew_id: string;
  version: number;
  scope_kind: 'campaign' | 'save' | 'library';
  scope_id: string;
  category: string;
  name: string;
  status: 'draft' | 'validated' | 'implemented' | 'deprecated';
  base_srd_uri: string | null;
  specification: Record<string, any>;
  validation_errors: string[];
  validation_warnings: string[];
  spec_hash: string;
  created_by: string;
  activated_at_revision: number | null;
  updated_at: string;
}

export interface V2TtsSynthesisResult {
  contract_version: string;
  backend_used: string;
  is_neural_speech?: boolean;
  ada_voice_id?: string;
  voice_display_name?: string;
  played_on_host_device?: boolean;
  playback_detail?: string;
  preset: {
    preset_id: string;
    display_name: string;
    role_category: string;
    base_pitch_hz: number;
    speaking_rate: number;
    timbre_description: string;
  };
  speaking_rate: number;
  duration_sec: number;
  mime_type: string;
  audio_sha256: string;
  audio_base64: string;
  audio_data_url: string;
}

export function resolveV2ApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_VADALLFATE_V2_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:8765/api/v2';
}

function buildAudienceQuery(aud: V2AudienceParams): URLSearchParams {
  const params = new URLSearchParams();
  params.set('actor_id', aud.actor_id || 'dm-1');
  params.set('role', aud.role === 'dm_host' ? 'dm' : aud.role);
  params.set('campaign_id', aud.campaign_id || 'aethelgard-vault-001');
  params.set('save_id', aud.save_id || 'save-main');
  params.set('branch_id', aud.branch_id || 'main');
  params.set('is_host', aud.is_host ? 'true' : 'false');
  if (aud.preview_as_player_id) {
    params.set('preview_as_player_id', aud.preview_as_player_id);
  }
  return params;
}

// Local fallback stores for unit test / offline browser usage when Python server is not running
const fallbackNotes: V2MarkdownNote[] = [
  {
    note_id: 'note-lyra-harbor-ledger',
    campaign_id: 'aethelgard-vault-001',
    save_id: 'save-main',
    owner_actor_id: 'char-lyra-01',
    owner_role: 'player',
    title: 'Harbor Ledger Discrepancies',
    visibility: 'party_shared',
    markdown_rel_path: 'aethelgard-vault-001/save-main/char-lyra-01/note-lyra-harbor-ledger.md',
    content_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    revision: 1,
    linked_entity_uris: [
      'world:save:aethelgard-vault-001/save-main:npc:npc-jorren-vale',
      'world:save:aethelgard-vault-001/save-main:location:loc-primara-cathedral',
      'srd51:spell:119',
    ],
    tags: ['investigation', 'ledger'],
    sync_status: 'ok',
    updated_at: '2026-04-17T12:00:00Z',
    markdown_body:
      'We met [[Jorren Vale]] outside [[Primara Cathedral]]. He claims the cold iron vanished from Pier 4, and I prepared [[Fireball]] just in case.',
  },
];

const fallbackPlans: V2PlanRevision[] = [
  {
    plan_id: 'plan-altar-revelation',
    campaign_id: 'aethelgard-vault-001',
    save_id: 'save-main',
    branch_id: 'main',
    revision: 1,
    title: 'Sub-Altar Conduit Ambush',
    plan_kind: 'encounter_beat',
    status: 'proposed',
    source_markdown_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    source_markdown_snapshot:
      'When the party inspects the altar inside [[Primara Cathedral]], [[Jorren Vale]] retreats while the Ashen Rift Stalker emerges.',
    structured_payload: {
      location: 'loc-primara-cathedral',
      trigger: 'Inspecting high altar seal',
      dc: 15,
    },
    linked_entity_uris: [
      'world:save:aethelgard-vault-001/save-main:location:loc-primara-cathedral',
      'world:save:aethelgard-vault-001/save-main:npc:npc-jorren-vale',
    ],
    created_by: 'dm-1',
    confirmed_commit_id: null,
    updated_at: '2026-04-17T12:00:00Z',
  },
];

const fallbackHomebrew: V2HomebrewRecord[] = [
  {
    homebrew_id: 'hb-aethelgard-rimefire',
    version: 1,
    scope_kind: 'campaign',
    scope_id: 'aethelgard-vault-001',
    category: 'spell',
    name: 'Aethelgard Rimefire',
    status: 'draft',
    base_srd_uri: 'srd51:spell:119',
    specification: {
      level: 3,
      school: 'Evocation',
      casting_time: '1 action',
      damage: '8d6 cold/fire',
      summary: 'Coastal fog-infused variant of Fireball used by Highgate battle-mages.',
    },
    validation_errors: [],
    validation_warnings: [],
    spec_hash: 'a1b2c3d4e5f6',
    created_by: 'dm-1',
    activated_at_revision: null,
    updated_at: '2026-04-17T12:00:00Z',
  },
];

function extractWikilinkUris(markdown: string): string[] {
  const regex = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g;
  const uris: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const token = match[1].trim();
    if (token.toLowerCase().includes('jorren')) {
      uris.push('world:save:aethelgard-vault-001/save-main:npc:npc-jorren-vale');
    } else if (token.toLowerCase().includes('primara')) {
      uris.push('world:save:aethelgard-vault-001/save-main:location:loc-primara-cathedral');
    } else if (token.toLowerCase().includes('fireball')) {
      uris.push('srd51:spell:119');
    } else {
      uris.push(`world:save:aethelgard-vault-001/save-main:entity:${token.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }
  return Array.from(new Set(uris));
}

export class V2BackendClient {
  private baseUrl: string;

  constructor(baseUrl: string = resolveV2ApiBaseUrl()) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public async queryGraph(
    audience: V2AudienceParams,
    searchQuery: string = ''
  ): Promise<V2GraphProjectionResponse> {
    const params = buildAudienceQuery(audience);
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    try {
      const resp = await fetch(`${this.baseUrl}/graph?${params.toString()}`, { headers: v2SessionHeaders(audience.role) });
      if (resp.ok) {
        const data = await resp.json();
        return { ...data, source: 'python_sqlite' };
      }
    } catch {
      // Fall through to deterministic audience-filtered local projection
    }

    const isDmEffective =
      (audience.role === 'dm' || audience.role === 'dm_host') && !audience.preview_as_player_id;
    const nodes: V2GraphNode[] = [
      {
        node_id: 'world:save:aethelgard-vault-001/save-main:npc:npc-jorren-vale',
        label: 'Jorren Vale',
        entity_type: 'npc',
        summary: isDmEffective
          ? 'Secret Ashen Covenant agent who diverted the cold iron to the Primara crypts.'
          : 'Port Customs Magistrate investigating the missing cold iron.',
        visibility: 'party_shared',
        truth_level: isDmEffective ? 'canonical_party' : 'perceived_belief',
        revision: 1,
        campaign_id: 'aethelgard-vault-001',
        save_id: 'save-main',
        attributes: { location: 'Primara Cathedral' },
        provenance: { source_table: 'v2_world_entities' },
        tags: ['npc', 'highgate'],
      },
      {
        node_id: 'world:save:aethelgard-vault-001/save-main:location:loc-primara-cathedral',
        label: 'Primara Cathedral',
        entity_type: 'location',
        summary: isDmEffective
          ? 'Houses a sealed planar conduit to Avernus beneath the high altar.'
          : 'An ancient marble cathedral overlooking the fog-shrouded harbor.',
        visibility: 'party_shared',
        truth_level: 'canonical_party',
        revision: 1,
        campaign_id: 'aethelgard-vault-001',
        save_id: 'save-main',
        attributes: {},
        provenance: { source_table: 'v2_world_entities' },
        tags: ['location', 'highgate'],
      },
    ];

    const edges: V2GraphEdge[] = [
      {
        edge_id: 'edge-jorren-at-primara',
        source_uri: 'world:save:aethelgard-vault-001/save-main:npc:npc-jorren-vale',
        target_uri: 'world:save:aethelgard-vault-001/save-main:location:loc-primara-cathedral',
        relation_type: 'LOCATED_AT',
        label: 'stationed at',
        visibility: 'party_shared',
        truth_level: 'canonical_party',
        revision: 1,
      },
    ];

    if (isDmEffective) {
      nodes.push({
        node_id: 'world:save:aethelgard-vault-001/save-main:location:loc-avernus-rift',
        label: 'Avernus Planar Conduit',
        entity_type: 'location',
        summary: 'Infernal bronze fissure beneath Primara Cathedral.',
        visibility: 'dm_secret',
        truth_level: 'dm_truth',
        revision: 1,
        campaign_id: 'aethelgard-vault-001',
        save_id: 'save-main',
        attributes: {},
        provenance: { source_table: 'v2_world_entities' },
        tags: ['location', 'secret'],
      });
      edges.push({
        edge_id: 'edge-primara-avernus-secret',
        source_uri: 'world:save:aethelgard-vault-001/save-main:location:loc-primara-cathedral',
        target_uri: 'world:save:aethelgard-vault-001/save-main:location:loc-avernus-rift',
        relation_type: 'SECRETLY_LEADS_TO',
        label: 'conceals planar rift to',
        visibility: 'dm_secret',
        truth_level: 'dm_truth',
        revision: 1,
      });
    }

    const needle = searchQuery.trim().toLowerCase();
    const filteredNodes = needle
      ? nodes.filter(
          (n) =>
            n.label.toLowerCase().includes(needle) ||
            n.summary.toLowerCase().includes(needle) ||
            n.entity_type.toLowerCase().includes(needle)
        )
      : nodes;
    const nodeIds = new Set(filteredNodes.map((n) => n.node_id));
    const filteredEdges = edges.filter(
      (e) => nodeIds.has(e.source_uri) && nodeIds.has(e.target_uri)
    );

    return {
      contract_version: 'v2.kgp.0.1.0',
      nodes: filteredNodes,
      edges: filteredEdges,
      projection_hash: isDmEffective ? 'dm-full-hash' : 'player-safe-hash',
      total_visible_nodes: filteredNodes.length,
      total_visible_edges: filteredEdges.length,
      source: 'fallback_local',
    };
  }

  public async listNotes(audience: V2AudienceParams): Promise<V2MarkdownNote[]> {
    const params = buildAudienceQuery(audience);
    try {
      const resp = await fetch(`${this.baseUrl}/notes?${params.toString()}`, { headers: v2SessionHeaders(audience.role) });
      if (resp.ok) {
        const data = await resp.json();
        return data.notes || [];
      }
    } catch {
      // Fallback
    }
    const isDm =
      (audience.role === 'dm' || audience.role === 'dm_host') && !audience.preview_as_player_id;
    const effActor = audience.preview_as_player_id || audience.actor_id;
    return fallbackNotes.filter((n) => {
      if (n.visibility === 'party_shared') return true;
      if (n.visibility === 'private_player') return n.owner_actor_id === effActor;
      if (n.visibility === 'shared_with_dm') return isDm || n.owner_actor_id === effActor;
      if (n.visibility === 'dm_private') return isDm;
      return false;
    });
  }

  public async saveNote(
    audience: V2AudienceParams,
    input: {
      note_id?: string;
      title: string;
      markdown_body: string;
      visibility: 'private_player' | 'party_shared' | 'shared_with_dm' | 'dm_private';
      tags?: string[];
    }
  ): Promise<V2MarkdownNote> {
    try {
      const resp = await fetch(`${this.baseUrl}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders(audience.role) },
        body: JSON.stringify({
          audience,
          ...input,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.note;
      }
    } catch {
      // Fallback
    }

    const noteId = input.note_id || `note-${Date.now()}`;
    const existingIdx = fallbackNotes.findIndex((n) => n.note_id === noteId);
    const nextRev = existingIdx >= 0 ? fallbackNotes[existingIdx].revision + 1 : 1;
    const note: V2MarkdownNote = {
      note_id: noteId,
      campaign_id: audience.campaign_id || 'aethelgard-vault-001',
      save_id: audience.save_id || 'save-main',
      owner_actor_id: audience.preview_as_player_id || audience.actor_id,
      owner_role: audience.role === 'dm_host' || audience.role === 'dm' ? 'dm' : 'player',
      title: input.title.trim() || 'Untitled Note',
      visibility: input.visibility,
      markdown_rel_path: `aethelgard-vault-001/save-main/${audience.actor_id}/${noteId}.md`,
      content_hash: `sha256-${Date.now().toString(16).padEnd(56, '0')}`,
      revision: nextRev,
      linked_entity_uris: extractWikilinkUris(input.markdown_body),
      tags: input.tags || [],
      sync_status: 'ok',
      updated_at: new Date().toISOString(),
      markdown_body: input.markdown_body,
    };
    if (existingIdx >= 0) {
      fallbackNotes[existingIdx] = note;
    } else {
      fallbackNotes.unshift(note);
    }
    return note;
  }

  public async changeNoteVisibility(
    audience: V2AudienceParams,
    noteId: string,
    visibility: 'private_player' | 'party_shared' | 'shared_with_dm' | 'dm_private'
  ): Promise<V2MarkdownNote> {
    try {
      const resp = await fetch(`${this.baseUrl}/notes/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders(audience.role) },
        body: JSON.stringify({
          audience,
          note_id: noteId,
          visibility,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.note;
      }
    } catch {
      // Fallback
    }
    const target = fallbackNotes.find((n) => n.note_id === noteId);
    if (!target) {
      throw new Error(`Note not found: ${noteId}`);
    }
    target.visibility = visibility;
    target.revision += 1;
    target.updated_at = new Date().toISOString();
    return { ...target };
  }

  public async listPlans(audience: V2AudienceParams): Promise<V2PlanRevision[]> {
    const params = buildAudienceQuery(audience);
    try {
      const resp = await fetch(`${this.baseUrl}/plans?${params.toString()}`, { headers: v2SessionHeaders(audience.role) });
      if (resp.ok) {
        const data = await resp.json();
        return data.plans || [];
      }
    } catch {
      // Fallback
    }
    const isDm =
      (audience.role === 'dm' || audience.role === 'dm_host') && !audience.preview_as_player_id;
    return isDm ? [...fallbackPlans] : [];
  }

  public async proposePlan(
    audience: V2AudienceParams,
    input: {
      plan_id?: string;
      title: string;
      plan_kind: string;
      source_markdown: string;
      structured_payload: Record<string, any>;
      status?: 'draft' | 'proposed';
    }
  ): Promise<V2PlanRevision> {
    try {
      const resp = await fetch(`${this.baseUrl}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders(audience.role) },
        body: JSON.stringify({
          audience,
          ...input,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.plan;
      }
    } catch {
      // Fallback
    }
    const planId = input.plan_id || `plan-${Date.now()}`;
    const prevRevs = fallbackPlans.filter((p) => p.plan_id === planId);
    const nextRev = prevRevs.length > 0 ? Math.max(...prevRevs.map((p) => p.revision)) + 1 : 1;
    const plan: V2PlanRevision = {
      plan_id: planId,
      campaign_id: audience.campaign_id || 'aethelgard-vault-001',
      save_id: audience.save_id || 'save-main',
      branch_id: audience.branch_id || 'main',
      revision: nextRev,
      title: input.title,
      plan_kind: input.plan_kind,
      status: input.status || 'proposed',
      source_markdown_hash: `pinned-${Date.now().toString(16).padEnd(57, 'a')}`,
      source_markdown_snapshot: input.source_markdown,
      structured_payload: input.structured_payload,
      linked_entity_uris: extractWikilinkUris(input.source_markdown),
      created_by: audience.actor_id,
      confirmed_commit_id: null,
      updated_at: new Date().toISOString(),
    };
    fallbackPlans.unshift(plan);
    return plan;
  }

  public async transitionPlan(
    audience: V2AudienceParams,
    planId: string,
    targetStatus: 'confirmed' | 'withdrawn' | 'superseded' | 'completed',
    revision?: number
  ): Promise<V2PlanRevision> {
    try {
      const resp = await fetch(`${this.baseUrl}/plans/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders(audience.role) },
        body: JSON.stringify({
          audience,
          plan_id: planId,
          target_status: targetStatus,
          revision,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.plan;
      }
    } catch {
      // Fallback
    }
    const target = fallbackPlans.find(
      (p) => p.plan_id === planId && (revision == null || p.revision === revision)
    );
    if (!target) {
      throw new Error(`Plan not found: ${planId}`);
    }
    if (targetStatus === 'confirmed') {
      for (const p of fallbackPlans) {
        if (p.plan_id === planId && p.status === 'confirmed' && p.revision !== target.revision) {
          p.status = 'superseded';
        }
      }
      target.confirmed_commit_id = `plan-confirm-${planId}-r${target.revision}`;
    }
    target.status = targetStatus;
    target.updated_at = new Date().toISOString();
    return { ...target };
  }

  public async listHomebrew(audience: V2AudienceParams): Promise<V2HomebrewRecord[]> {
    const params = buildAudienceQuery(audience);
    try {
      const resp = await fetch(`${this.baseUrl}/homebrew?${params.toString()}`, { headers: v2SessionHeaders(audience.role) });
      if (resp.ok) {
        const data = await resp.json();
        return data.homebrew || [];
      }
    } catch {
      // Fallback
    }
    const isDm =
      (audience.role === 'dm' || audience.role === 'dm_host') && !audience.preview_as_player_id;
    return isDm
      ? [...fallbackHomebrew]
      : fallbackHomebrew.filter((h) => h.status === 'implemented');
  }

  public async saveHomebrewDraft(
    audience: V2AudienceParams,
    input: {
      homebrew_id?: string;
      category: string;
      name: string;
      base_srd_uri?: string | null;
      specification: Record<string, any>;
    }
  ): Promise<V2HomebrewRecord> {
    try {
      const resp = await fetch(`${this.baseUrl}/homebrew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders(audience.role) },
        body: JSON.stringify({
          audience,
          ...input,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.homebrew;
      }
    } catch {
      // Fallback
    }
    const hbId = input.homebrew_id || `hb-${Date.now()}`;
    const prev = fallbackHomebrew.filter((h) => h.homebrew_id === hbId);
    const nextVer = prev.length > 0 ? Math.max(...prev.map((h) => h.version)) + 1 : 1;
    const errors: string[] = [];
    if (!input.name.trim()) errors.push('Homebrew name must not be empty');
    if (
      input.category === 'spell' &&
      (typeof input.specification.level !== 'number' ||
        input.specification.level < 0 ||
        input.specification.level > 9)
    ) {
      errors.push('Spell level must be between 0 and 9');
    }
    const rec: V2HomebrewRecord = {
      homebrew_id: hbId,
      version: nextVer,
      scope_kind: 'campaign',
      scope_id: audience.campaign_id || 'aethelgard-vault-001',
      category: input.category,
      name: input.name,
      status: 'draft',
      base_srd_uri: input.base_srd_uri || null,
      specification: input.specification,
      validation_errors: errors,
      validation_warnings: [],
      spec_hash: `spec-${Date.now().toString(16)}`,
      created_by: audience.actor_id,
      activated_at_revision: null,
      updated_at: new Date().toISOString(),
    };
    fallbackHomebrew.unshift(rec);
    return rec;
  }

  public async transitionHomebrew(
    audience: V2AudienceParams,
    homebrewId: string,
    targetStatus: 'validated' | 'implemented' | 'deprecated',
    version?: number
  ): Promise<V2HomebrewRecord> {
    try {
      const resp = await fetch(`${this.baseUrl}/homebrew/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders(audience.role) },
        body: JSON.stringify({
          audience,
          homebrew_id: homebrewId,
          target_status: targetStatus,
          version,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.homebrew;
      }
    } catch {
      // Fallback
    }
    const target = fallbackHomebrew.find(
      (h) => h.homebrew_id === homebrewId && (version == null || h.version === version)
    );
    if (!target) {
      throw new Error(`Homebrew not found: ${homebrewId}`);
    }
    if (target.validation_errors.length > 0 && targetStatus !== 'deprecated') {
      throw new Error(`Cannot transition homebrew with validation errors: ${target.validation_errors.join(', ')}`);
    }
    if (targetStatus === 'implemented') {
      for (const h of fallbackHomebrew) {
        if (h.homebrew_id === homebrewId && h.status === 'implemented' && h.version !== target.version) {
          h.status = 'deprecated';
        }
      }
      target.activated_at_revision = 1;
    }
    target.status = targetStatus;
    target.updated_at = new Date().toISOString();
    return { ...target };
  }

  public async synthesizeSpeech(
    text: string,
    presetId: string = 'dm-narrator',
    speakingRate?: number,
    playLocally: boolean = false
  ): Promise<V2TtsSynthesisResult> {
    try {
      const resp = await fetch(`${this.baseUrl}/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...v2SessionHeaders() },
        body: JSON.stringify({
          text,
          preset_id: presetId,
          speaking_rate: speakingRate,
          play_locally: playLocally,
        }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // Offline deterministic fallback minimal WAV header
    }
    const minimalWavBase64 =
      'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    return {
      contract_version: 'v2.tts.0.2.0',
      backend_used: 'browser_offline_fallback',
      is_neural_speech: false,
      preset: {
        preset_id: presetId,
        display_name: presetId,
        role_category: 'narrator',
        base_pitch_hz: 130,
        speaking_rate: speakingRate || 1.0,
        timbre_description: 'Fallback voice preset',
      },
      speaking_rate: speakingRate || 1.0,
      duration_sec: 1.0,
      mime_type: 'audio/wav',
      audio_sha256: 'fallback',
      audio_base64: minimalWavBase64,
      audio_data_url: `data:audio/wav;base64,${minimalWavBase64}`,
    };
  }
}

export const v2BackendClient = new V2BackendClient();
