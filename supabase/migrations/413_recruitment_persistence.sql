-- ══════════════════════════════════════════════════════════════════════════════
-- 413 — RECRUITMENT PERSISTENCE (write-through targets)
--
-- Durable homes for the two safer-recruitment flows that mutate in production
-- demo use: candidate references (secure one-time links, referee submissions,
-- verification) and the recruitment audit trail. TEXT primary keys carry the
-- application ids (ref_…, aud_…) so updates address the rows that inserts
-- created. Additive only; home-scoped RLS.
--
-- Also: unique index on cara_child_learning_profiles.child_id (one live
-- learning profile per child — the upsert key the app uses).
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists recruitment_candidate_references (
  id text primary key,
  home_id uuid not null,
  candidate_id text not null,
  referee_name text not null,
  referee_role text,
  organisation_name text,
  email text,
  phone text,
  relationship_to_candidate text,
  is_most_recent_employer boolean not null default false,
  requested_at timestamptz,
  chased_at timestamptz,
  received_at timestamptz,
  structured_response jsonb,
  verbal_verification_completed boolean not null default false,
  verbal_verified_by text,
  verbal_verified_at timestamptz,
  discrepancy_flag boolean not null default false,
  discrepancy_notes text,
  reliability_rating text,
  status text not null default 'not_requested',
  -- Secure one-time link state: only the SHA-256 hash is ever stored.
  secure_token_hash text,
  token_expires_at timestamptz,
  token_used_at timestamptz,
  submission_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruitment_refs_candidate_idx on recruitment_candidate_references (candidate_id);
create index if not exists recruitment_refs_token_idx on recruitment_candidate_references (secure_token_hash) where secure_token_hash is not null;

create table if not exists recruitment_audit (
  id text primary key,
  home_id uuid not null,
  candidate_id text,
  vacancy_id text,
  actor_id text not null,
  event_type text not null,
  entity_type text,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists recruitment_audit_candidate_idx on recruitment_audit (candidate_id);

do $$
declare t text;
begin
  foreach t in array array['recruitment_candidate_references','recruitment_audit'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('create policy "Tenant isolation" on %I using (home_id = get_my_home_id()) with check (home_id = get_my_home_id())', t);
  end loop;
end $$;

-- One live learning profile per child (the application upserts by child_id).
create unique index if not exists cara_learning_profiles_child_uidx
  on cara_child_learning_profiles (child_id);

comment on table recruitment_candidate_references is
  'Write-through target for safer-recruitment references: secure-link state (hash only), referee submissions with IP/user-agent meta, and verification outcomes. TEXT PK = application id.';
comment on table recruitment_audit is
  'Write-through target for the safer-recruitment audit trail (link issued, reference received, checks verified, reminders synced, clearance decisions).';
