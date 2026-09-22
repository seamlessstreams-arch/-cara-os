-- ─────────────────────────────────────────────────────────────────────────
-- Persistence: Cara Incident Mode.
--
-- src/lib/supabase/incident-persist.ts writes seven tables. Six of them have
-- never existed. Its header calls them "the migration-409/408 tables"; no such
-- migration is in this repo, and none of the six appears anywhere in
-- supabase/migrations. Only reflective_supervisions was ever created.
--
-- Nothing reported it. The helper is
--
--   try { await c.from(table).insert(row); } catch { /* best-effort */ }
--
-- and supabase-js does not throw on a missing table — it resolves with the
-- error in `error`, which this code never reads. So the catch cannot fire and
-- there is nothing to fire it. Every caller then invokes it as
-- `void persistIncidentSession(...)`: no await, no handler. The failure had no
-- surface anywhere.
--
-- What actually ran was the line above each call:
--
--   store.caraIncidentSessions.push(session);
--
-- In-memory only. isLiveTenant() empties those arrays at module load and the
-- process restarts on every redeploy, so on the live tenant an incident
-- recorded through Incident Mode — the session, its timeline, the recording
-- review, the restorative conversation, the post-incident reflection, and the
-- audit trail over all of it — was held until the next deploy and then lost.
--
-- This is the same fault as 20260815090000_persist_behaviour_support_plans.sql
-- ("no migration ever created the table, so both writes fell through to the
-- in-memory store"), and it is fixed the same way, with that file's
-- conventions: text ids so the app's own "ais_*"/"ait_*" ids are accepted,
-- home_id uuid, every other column nullable so a write never fails on an
-- omitted field, RLS on with the tenant policy, and indexes on home and child.
--
-- home_id being uuid matters: incident-persist hardcoded home_id: "home_oak",
-- which cannot go into a uuid column. That literal is replaced in the same
-- change by the env-driven homeId() its sibling helpers already use.
--
-- Shapes follow IncidentSession, IncidentTimelineEntry and CaraRecordingReview
-- in src/lib/cara-incident/cara-incident-engine.ts, RestorativeConversation-
-- Record and PostIncidentReflectionRecord in post-incident-engine.ts, and the
-- row persistIncidentAudit builds inline.
--
-- Nothing is backfilled. The lost records were never anywhere to recover from.
-- ─────────────────────────────────────────────────────────────────────────

-- ── The session: one live incident, from "started" to "record created" ──────
create table if not exists incident_sessions (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  started_by_user_id text,
  started_at text,
  ended_at text,
  incident_type text,
  incident_status text,
  immediate_risk_level text,
  manager_notified boolean default false,
  manager_notified_at text,
  ai_support_used boolean default false,
  final_record_created boolean default false,
  -- Checklist keys -> done. An object, not a list, so a step added later reads
  -- as not-done rather than shifting an index.
  workflow_progress jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── The timeline: what staff said, what the AI offered, what was accepted ───
-- All three are kept. Staff may never hide the original note behind a rewrite,
-- which is the whole reason this table is not just an edit-in-place field.
create table if not exists incident_timeline_entries (
  id text primary key default gen_random_uuid()::text,
  incident_session_id text,
  home_id uuid,
  child_id text,
  user_id text,
  entry_type text,
  raw_text text,
  ai_rewritten_text text,
  accepted_text text,
  -- Quoted: `timestamp` is a type name unquoted, and the in-memory shape calls
  -- this field exactly that.
  "timestamp" text,
  created_at timestamptz default now()
);

-- ── The recording review: same three-version rule, outside a live incident ──
create table if not exists cara_recording_reviews (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  user_id text,
  incident_session_id text,
  record_type text,
  raw_text text,
  ai_suggested_text text,
  final_accepted_text text,
  ai_quality_flags text[] default '{}',
  staff_accepted boolean default false,
  accepted_at text,
  manager_review_required boolean default false,
  manager_reviewed_by text,
  manager_reviewed_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── The restorative conversation: the child's own account, afterwards ───────
-- child_ready_to_engage defaults to nothing: a child who was not asked and a
-- child who declined are different facts, and the summary builder says so.
create table if not exists restorative_conversations (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  incident_session_id text,
  completed_by_user_id text,
  conversation_date text,
  child_ready_to_engage boolean,
  child_voice text,
  what_happened text,
  who_was_affected text,
  what_helped text,
  what_made_it_worse text,
  repair_actions text,
  follow_up_required boolean default false,
  ai_summary text,
  manager_review_required boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── The post-incident reflection: what staff learned ────────────────────────
create table if not exists post_incident_reflections (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  incident_session_id text,
  completed_by_user_id text,
  antecedents text,
  early_warning_signs text,
  staff_response text,
  what_worked text,
  what_did_not_work text,
  child_needs_identified text,
  environmental_factors text,
  factors text[] default '{}',
  outcomes text[] default '{}',
  follow_up_actions text[] default '{}',
  ai_reflective_summary text,
  manager_review_required boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── The audit trail over all of the above ───────────────────────────────────
create table if not exists cara_audit_logs (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  user_id text,
  action_type text,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- The app queries as service_role and bypasses RLS; this protects anyone
-- holding the anon key. Same policy as every other tenant table.
alter table incident_sessions           enable row level security;
alter table incident_timeline_entries   enable row level security;
alter table cara_recording_reviews      enable row level security;
alter table restorative_conversations   enable row level security;
alter table post_incident_reflections   enable row level security;
alter table cara_audit_logs             enable row level security;

drop policy if exists "Tenant isolation" on incident_sessions;
create policy "Tenant isolation" on incident_sessions
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

drop policy if exists "Tenant isolation" on incident_timeline_entries;
create policy "Tenant isolation" on incident_timeline_entries
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

drop policy if exists "Tenant isolation" on cara_recording_reviews;
create policy "Tenant isolation" on cara_recording_reviews
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

drop policy if exists "Tenant isolation" on restorative_conversations;
create policy "Tenant isolation" on restorative_conversations
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

drop policy if exists "Tenant isolation" on post_incident_reflections;
create policy "Tenant isolation" on post_incident_reflections
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

drop policy if exists "Tenant isolation" on cara_audit_logs;
create policy "Tenant isolation" on cara_audit_logs
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_incident_sessions_home on incident_sessions(home_id);
create index if not exists idx_incident_sessions_child on incident_sessions(child_id);
-- The incident list opens on what is still running.
create index if not exists idx_incident_sessions_active on incident_sessions(home_id, incident_status);

create index if not exists idx_incident_timeline_session on incident_timeline_entries(incident_session_id);
create index if not exists idx_incident_timeline_home on incident_timeline_entries(home_id);

create index if not exists idx_recording_reviews_home on cara_recording_reviews(home_id);
create index if not exists idx_recording_reviews_child on cara_recording_reviews(child_id);
-- Manager review queue.
create index if not exists idx_recording_reviews_pending on cara_recording_reviews(home_id)
  where manager_review_required and manager_reviewed_at is null;

create index if not exists idx_restorative_home on restorative_conversations(home_id);
create index if not exists idx_restorative_child on restorative_conversations(child_id);
create index if not exists idx_restorative_session on restorative_conversations(incident_session_id);

create index if not exists idx_reflections_home on post_incident_reflections(home_id);
create index if not exists idx_reflections_child on post_incident_reflections(child_id);
create index if not exists idx_reflections_session on post_incident_reflections(incident_session_id);

create index if not exists idx_cara_audit_logs_home on cara_audit_logs(home_id);
create index if not exists idx_cara_audit_logs_entity on cara_audit_logs(entity_type, entity_id);

-- ── Column comments ─────────────────────────────────────────────────────────
comment on table incident_sessions is
  'A live incident being recorded in Cara Incident Mode. Created before the outcome is known, so incident_status moves active -> ended -> record_created.';
comment on column incident_timeline_entries.raw_text is
  'What the member of staff actually said or typed. Never overwritten by the AI rewrite — accepted_text holds what was signed off.';
comment on column restorative_conversations.child_ready_to_engage is
  'Null means the child was not asked. False means they were asked and declined, which is itself a recorded outcome.';
comment on column cara_audit_logs.entity_type is
  'The table the action was about, e.g. cara_incident_sessions.';
