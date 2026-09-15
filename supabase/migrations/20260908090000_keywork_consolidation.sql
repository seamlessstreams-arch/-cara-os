-- ═══════════════════════════════════════════════════════════════════════════
-- KEYWORK CONSOLIDATION (1 of 6) — the capture table goes live.
--
-- Canonical model per the consolidation brief: cs_key_work_sessions is what
-- key-working-service (the app's actual key-work capture) writes; the two
-- store models (keyWorkingSessions / keyworkerSessions) were seed-only
-- intelligence shapes that nothing ever captured into. Promoted from
-- migrations_archive/035_safeguarding_keywork.sql under live conventions:
-- id text, home_id uuid, everything else nullable, no FKs/CHECKs. Kept
-- defaults are honest ones (status 'planned' lifecycle, framework 'none' —
-- an explicit nothing, jsonb containers, attachments_count 0 counts system
-- objects). session_type's 'one_to_one' default is stripped: the service
-- always supplies it, and an unspecified session must not claim a format.
--
-- APPLIED MANUALLY after merge (sixth pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_key_work_sessions (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  key_worker_id text,
  session_type text,
  therapeutic_framework text default 'none',
  status text default 'planned',
  planned_date date,
  completed_date date,
  duration_minutes integer,
  location text,
  topics_covered jsonb default '[]'::jsonb,
  child_voice text,
  child_mood integer,
  child_engagement integer,
  outcomes jsonb default '[]'::jsonb,
  actions jsonb default '[]'::jsonb,
  next_session_topics jsonb default '[]'::jsonb,
  safeguarding_concerns text,
  positive_observations jsonb default '[]'::jsonb,
  attachments_count integer default 0,
  signed_off_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_key_work_sessions enable row level security;
create index if not exists idx_cs_key_work_sessions_home on cs_key_work_sessions(home_id);
drop policy if exists "Tenant isolation" on cs_key_work_sessions;
create policy "Tenant isolation" on cs_key_work_sessions
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_key_work_sessions_child on cs_key_work_sessions(child_id);
create index if not exists idx_cs_key_work_sessions_worker on cs_key_work_sessions(key_worker_id);
