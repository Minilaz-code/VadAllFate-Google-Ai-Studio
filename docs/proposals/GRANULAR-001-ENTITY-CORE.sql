-- PROPOSAL ONLY. NOT EXECUTED, INSTALLED OR DISCOVERED BY ANY MIGRATION RUNNER.
-- I2 review unit: additive, incomplete entity-core schema in the SAME Save DB.
-- Requires explicit schema/authority approval even for disposable test fixtures.
-- Does not enable an active format, registry, typed codec or new commit route.
-- Existing runtime_events and immutable R1 evidence remain owned by CommitAuthority.

CREATE TABLE g_campaign_bindings (
    campaign_id TEXT PRIMARY KEY,
    logical_save_id TEXT NOT NULL UNIQUE,
    container_id TEXT NOT NULL,
    origin_logical_save_id TEXT,
    origin_snapshot_hash TEXT,
    migration_ref TEXT,
    storage_format TEXT NOT NULL CHECK(storage_format = 'granular.v1'),
    activation_state TEXT NOT NULL DEFAULT 'PREPARED'
        CHECK(activation_state IN ('PREPARED','ACTIVE'))
);
-- ACTIVE is not authorisation: a pinned registered profile and authority route
-- must also exist. I2 creates neither. Activation/conversion is separately gated.

CREATE TABLE g_campaign_heads (
    campaign_id TEXT PRIMARY KEY,
    revision INTEGER NOT NULL CHECK(revision >= 0),
    world_minute INTEGER NOT NULL CHECK(world_minute >= 0),
    content_root_hash TEXT NOT NULL CHECK(length(content_root_hash) = 64),
    evidence_head_hash TEXT NOT NULL CHECK(length(evidence_head_hash) = 64),
    hash_profile_ref TEXT NOT NULL,
    module_profile_hash TEXT NOT NULL CHECK(length(module_profile_hash) = 64),
    FOREIGN KEY(campaign_id) REFERENCES g_campaign_bindings(campaign_id)
        DEFERRABLE INITIALLY DEFERRED
);
-- I4 must approve hash field coverage, hex encoding verification and the
-- single owner of world-minute/head metadata. This is not an active hash profile.

CREATE TABLE g_entities (
    campaign_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_kind TEXT NOT NULL
        CHECK(entity_kind IN ('npc','character','memory','relationship')),
    owner_module_ref TEXT NOT NULL,
    state_schema_ref TEXT NOT NULL,
    state_schema_version TEXT NOT NULL,
    row_revision INTEGER NOT NULL CHECK(row_revision >= 0),
    row_hash TEXT NOT NULL CHECK(length(row_hash) = 64),
    visibility_policy_ref TEXT NOT NULL,
    is_tombstone INTEGER NOT NULL DEFAULT 0 CHECK(is_tombstone IN (0,1)),
    PRIMARY KEY(campaign_id,entity_id),
    UNIQUE(campaign_id,entity_id,entity_kind),
    FOREIGN KEY(campaign_id) REFERENCES g_campaign_heads(campaign_id)
        DEFERRABLE INITIALLY DEFERRED
);
-- Versions/hashes are derived from the typed record plus approved envelope
-- coverage; they are not another editable copy of that record's field values.

CREATE TABLE g_npc_instances (
    campaign_id TEXT NOT NULL,
    npc_id TEXT NOT NULL,
    entity_kind TEXT NOT NULL DEFAULT 'npc' CHECK(entity_kind = 'npc'),
    display_name TEXT NOT NULL CHECK(length(CAST(display_name AS BLOB)) BETWEEN 1 AND 1024),
    source_kind TEXT NOT NULL
        CHECK(source_kind IN ('PINNED_PACK','ORIGINAL_AUTHORING','LEGACY_IMPORT')),
    source_ref TEXT,
    pack_id TEXT,
    pack_version TEXT,
    manifest_hash TEXT,
    definition_hash TEXT,
    authoring_revision_ref TEXT,
    legacy_image_ref TEXT,
    provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)
        AND length(CAST(provenance_json AS BLOB)) <= 4096),
    PRIMARY KEY(campaign_id,npc_id),
    FOREIGN KEY(campaign_id,npc_id,entity_kind)
        REFERENCES g_entities(campaign_id,entity_id,entity_kind)
        DEFERRABLE INITIALLY DEFERRED,
    CHECK(source_kind != 'PINNED_PACK' OR
        (source_ref IS NOT NULL AND pack_id IS NOT NULL AND pack_version IS NOT NULL
         AND manifest_hash IS NOT NULL AND length(manifest_hash)=64
         AND definition_hash IS NOT NULL AND length(definition_hash)=64)),
    CHECK(source_kind != 'ORIGINAL_AUTHORING' OR authoring_revision_ref IS NOT NULL),
    CHECK(source_kind != 'LEGACY_IMPORT' OR legacy_image_ref IS NOT NULL)
);
-- References/provenance only, never source-book bodies or statblock copies.
-- All other existing NPC fields need explicit owners before any Save conversion;
-- this identity-only first slice is not a complete legacy NPC migration target.

-- Proposed additional parent key: an index change is still a gated migration.
CREATE UNIQUE INDEX g_runtime_events_campaign_event
    ON runtime_events(campaign_id,event_id);

CREATE TABLE g_npc_memories (
    campaign_id TEXT NOT NULL,
    memory_id TEXT NOT NULL,
    entity_kind TEXT NOT NULL DEFAULT 'memory' CHECK(entity_kind = 'memory'),
    owner_npc_id TEXT NOT NULL,
    actor_id TEXT,
    world_minute INTEGER NOT NULL CHECK(world_minute >= 0),
    causal_event_id TEXT,
    origin_kind TEXT NOT NULL CHECK(origin_kind IN ('WITNESSED','TOLD','LEGACY_IMPORT')),
    witness_mode TEXT NOT NULL CHECK(witness_mode IN ('SAW','HEARD','TOLD','LEGACY_IMPORT')),
    is_secret INTEGER NOT NULL CHECK(is_secret IN (0,1)),
    is_unverified INTEGER NOT NULL CHECK(is_unverified IN (0,1)),
    summary TEXT NOT NULL CHECK(length(CAST(summary AS BLOB)) BETWEEN 1 AND 2048),
    provenance_json TEXT NOT NULL CHECK(json_valid(provenance_json)
        AND length(CAST(provenance_json AS BLOB)) <= 4096),
    PRIMARY KEY(campaign_id,memory_id),
    FOREIGN KEY(campaign_id,memory_id,entity_kind)
        REFERENCES g_entities(campaign_id,entity_id,entity_kind)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,owner_npc_id) REFERENCES g_npc_instances(campaign_id,npc_id)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,actor_id) REFERENCES g_entities(campaign_id,entity_id)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,causal_event_id) REFERENCES runtime_events(campaign_id,event_id)
        DEFERRABLE INITIALLY DEFERRED,
    CHECK(origin_kind = 'LEGACY_IMPORT' OR (actor_id IS NOT NULL AND causal_event_id IS NOT NULL)),
    CHECK(origin_kind != 'TOLD' OR is_unverified = 1)
);
CREATE INDEX g_memory_owner_minute
    ON g_npc_memories(campaign_id,owner_npc_id,world_minute,memory_id);
-- Observation rows are append-only under the proposed driver policy; disclosure
-- is a separate later slice. Do not infer truth or invent missing legacy evidence.

CREATE TABLE g_relationships (
    campaign_id TEXT NOT NULL,
    relationship_id TEXT NOT NULL,
    entity_kind TEXT NOT NULL DEFAULT 'relationship' CHECK(entity_kind = 'relationship'),
    subject_npc_id TEXT NOT NULL,
    target_actor_id TEXT NOT NULL,
    affinity REAL NOT NULL CHECK(affinity BETWEEN -1 AND 1),
    trust REAL NOT NULL CHECK(trust BETWEEN -1 AND 1),
    fear REAL NOT NULL CHECK(fear BETWEEN 0 AND 1),
    debt REAL NOT NULL CHECK(debt BETWEEN -1 AND 1),
    familiarity REAL NOT NULL CHECK(familiarity BETWEEN 0 AND 1),
    last_change_event_id TEXT,
    PRIMARY KEY(campaign_id,subject_npc_id,target_actor_id),
    UNIQUE(campaign_id,relationship_id),
    FOREIGN KEY(campaign_id,relationship_id,entity_kind)
        REFERENCES g_entities(campaign_id,entity_id,entity_kind)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,subject_npc_id) REFERENCES g_npc_instances(campaign_id,npc_id)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,target_actor_id) REFERENCES g_entities(campaign_id,entity_id)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,last_change_event_id) REFERENCES runtime_events(campaign_id,event_id)
        DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE g_relationship_evidence (
    campaign_id TEXT NOT NULL,
    relationship_id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    sequence_index INTEGER NOT NULL CHECK(sequence_index >= 0),
    causal_event_id TEXT,
    legacy_image_ref TEXT,
    note TEXT NOT NULL CHECK(length(CAST(note AS BLOB)) <= 2048),
    PRIMARY KEY(campaign_id,relationship_id,entry_id),
    UNIQUE(campaign_id,relationship_id,sequence_index),
    FOREIGN KEY(campaign_id,relationship_id) REFERENCES g_relationships(campaign_id,relationship_id)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(campaign_id,causal_event_id) REFERENCES runtime_events(campaign_id,event_id)
        DEFERRABLE INITIALLY DEFERRED,
    CHECK(causal_event_id IS NOT NULL OR legacy_image_ref IS NOT NULL)
);
-- Preserve history_notes as ordered individual evidence, never a growing array.
-- REAL storage preserves current relationship model representation, but NaN,
-- infinity, canonical numeric encoding and delta caps need I1/I4/I5 validation.
-- SQL CHECK/FK success alone is not a ValidationResult or write authorisation.

-- Proposed driver interface, NOT IMPLEMENTED:
-- validate/read dependency closure -> prepare immutable typed candidate
-- apply_candidate(authority-owned connection, pinned-profile, validated-intents)
-- Must check CAS row counts, bounded encoded bytes and all ownership/evidence.
-- No connect(), commit(), dynamic table selection or model-controlled SQL.
-- The driver never updates campaign_state.state_json as its permanent write path.
-- Root/evidence/admission/ledger/outbox/receipt integration is I3-I5, not this DDL.
