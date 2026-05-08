-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CARE EVENTS SCHEMA
-- Migration 018 — 2026-05-08
--
-- Implements the Care Event routing system: the central mechanism by which
-- a single staff entry automatically and safely updates all connected records,
-- dashboards, reports and evidence banks.
--
-- Tables:
--   care_events           — source event record (the staff entry)
--   care_event_routes     — routing results (one row per linked area updated)
--   care_event_jobs       — background job queue for heavy processing
--   care_event_audit_log  — append-only audit trail for all actions
--
-- Unique constraints prevent idempotency violations.
-- All tables are home-scoped and RLS-protected.
-- Indexes support fast dashboard queries.
--
-- ROLLBACK: drop tables in reverse order (audit_log, jobs, routes, events)
--           after backing up any production data.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type care_event_status as enum (
  'draft',
  'submitted',
  'routing',
  'routed',
  'manager_review_required',
  'returned',
  'verified',
  'locked',
  'routing_failed'
);

create type care_event_category as enum (
  'general',
  'behaviour',
  'health',
  'medication',
  'education',
  'family_contact',
  'professional_contact',
  'safeguarding',
  'missing_episode',
  'physical_intervention',
  'restraint',
  'complaint',
  'activity',
  'wellbeing',
  'sleep',
  'food',
  'finance',
  'other'
);

create type route_type as enum (
  'daily_log',
  'child_daily_summary',
  'incident',
  'missing_episode',
  'physical_intervention',
  'health_record',
  'medication_record',
  'education_record',
  'family_contact_record',
  'professional_contact_record',
  'complaint_record',
  'safeguarding_record',
  'risk_assessment_task',
  'behaviour_plan_task',
  'followup_task',
  'management_oversight',
  'reg40_triage',
  'reg44_evidence',
  'reg45_evidence',
  'annex_a_evidence',
  'filing_cabinet',
  'saved_time'
);

create type route_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
  'retry_required'
);

create type job_type as enum (
  'reg45_summary_update',
  'annex_a_snapshot_update',
  'inspection_readiness_update',
  'pattern_analysis',
  'pdf_generation',
  'evidence_pack_export',
  'filing_cabinet_index_rebuild',
  'saved_time_metrics'
);

create type job_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'retry_required'
);

create type audit_action as enum (
  'care_event_created',
  'care_event_submitted',
  'care_event_routed',
  'care_event_route_failed',
  'care_event_route_retried',
  'care_event_verified',
  'care_event_returned',
  'care_event_amended',
  'care_event_locked',
  'evidence_prompt_completed',
  'manager_review_completed',
  'reg45_evidence_suggested',
  'reg45_evidence_accepted',
  'reg45_evidence_rejected',
  'annex_a_evidence_suggested',
  'annex_a_snapshot_generated',
  'export_generated',
  'permission_denied',
  'validation_failed'
);

-- ── Care Events ───────────────────────────────────────────────────────────────

create table care_events (
  id                          uuid primary key default uuid_generate_v4(),
  home_id                     uuid not null references homes(id) on delete restrict,
  child_id                    uuid references young_people(id) on delete restrict,
  shift_id                    uuid,                          -- optional link to shift
  staff_id                    uuid not null references staff_members(id) on delete restrict,
  verified_by                 uuid references staff_members(id),
  returned_by                 uuid references staff_members(id),
  locked_by                   uuid references staff_members(id),

  -- Classification
  category                    care_event_category not null default 'general',
  title                       text not null,
  content                     text not null,
  mood_score                  int check (mood_score between 1 and 10),
  is_significant              boolean not null default false,

  -- Status lifecycle
  status                      care_event_status not null default 'draft',
  event_date                  date not null default current_date,
  event_time                  time,

  -- Flags
  requires_manager_review     boolean not null default false,
  requires_reg40_triage       boolean not null default false,
  contributes_to_reg45        boolean not null default false,
  contributes_to_annex_a      boolean not null default false,
  is_safeguarding             boolean not null default false,

  -- Evidence prompts
  evidence_prompts            jsonb not null default '[]'::jsonb,
  evidence_prompts_completed  boolean not null default false,

  -- Staff signature
  staff_signature             boolean not null default false,
  staff_signed_at             timestamptz,

  -- Manager actions
  manager_review_note         text,
  manager_review_at           timestamptz,
  return_reason               text,
  returned_at                 timestamptz,

  -- Verification
  verified_at                 timestamptz,
  locked_at                   timestamptz,

  -- Amendment versioning
  version                     int not null default 1,
  previous_version_id         uuid references care_events(id),
  amendment_reason            text,
  is_current_version          boolean not null default true,

  -- ARIA suggestions (stored separately from approved record)
  aria_suggested_summary      text,
  aria_suggested_category     care_event_category,
  aria_suggested_routing      jsonb,
  aria_suggested_reg45        text,
  aria_suggested_annex_a      text,
  aria_suggestions_reviewed   boolean not null default false,

  -- Routing result summary (populated after routing)
  routing_summary             jsonb,    -- { records_updated, tasks_created, reg45_count, annex_a_count }

  -- Metadata
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint care_events_version_check check (version >= 1)
);

-- Trigger to keep updated_at current
create trigger care_events_updated_at
  before update on care_events
  for each row execute function set_updated_at();

-- ── Care Event Routes ─────────────────────────────────────────────────────────

create table care_event_routes (
  id                  uuid primary key default uuid_generate_v4(),
  care_event_id       uuid not null references care_events(id) on delete cascade,
  home_id             uuid not null references homes(id) on delete restrict,
  route_type          route_type not null,
  status              route_status not null default 'pending',

  -- Link to the record created/updated by this route
  linked_record_id    text,          -- id of the created/updated record
  linked_record_table text,          -- table name for traceability

  -- Processing detail
  processing_notes    text,
  error_message       text,
  retry_count         int not null default 0,
  last_retried_at     timestamptz,

  -- Time saved tracking
  time_saved_minutes  int not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Idempotency: one route row per care event + route type
  constraint care_event_routes_unique unique (care_event_id, route_type)
);

create trigger care_event_routes_updated_at
  before update on care_event_routes
  for each row execute function set_updated_at();

-- ── Care Event Jobs ───────────────────────────────────────────────────────────
-- Background job queue for heavy processing that must not block staff saves

create table care_event_jobs (
  id                  uuid primary key default uuid_generate_v4(),
  care_event_id       uuid not null references care_events(id) on delete cascade,
  home_id             uuid not null references homes(id) on delete restrict,
  job_type            job_type not null,
  status              job_status not null default 'pending',
  payload             jsonb not null default '{}'::jsonb,
  result              jsonb,
  error_message       text,
  retry_count         int not null default 0,
  max_retries         int not null default 3,
  scheduled_at        timestamptz not null default now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  last_retried_at     timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Idempotency: one job per care event + job type
  constraint care_event_jobs_unique unique (care_event_id, job_type)
);

create trigger care_event_jobs_updated_at
  before update on care_event_jobs
  for each row execute function set_updated_at();

-- ── Care Event Audit Log ──────────────────────────────────────────────────────
-- Append-only audit trail. Never update, never delete.

create table care_event_audit_log (
  id                  uuid primary key default uuid_generate_v4(),
  care_event_id       uuid not null references care_events(id) on delete restrict,
  home_id             uuid not null references homes(id) on delete restrict,
  action              audit_action not null,
  actor_staff_id      uuid references staff_members(id),
  actor_role          text,
  detail              jsonb not null default '{}'::jsonb,
  ip_address          text,           -- do not log PII; log request origin only
  created_at          timestamptz not null default now()
);

-- ── Reg 45 Evidence Queue ─────────────────────────────────────────────────────
-- Suggested evidence items from care events. Manager must approve before
-- they become part of the final Regulation 45 report.

create table reg45_evidence_queue (
  id                      uuid primary key default uuid_generate_v4(),
  care_event_id           uuid not null references care_events(id) on delete cascade,
  home_id                 uuid not null references homes(id) on delete restrict,
  suggested_text          text not null,
  suggested_theme         text,
  suggested_section       text,
  manager_decision        text check (manager_decision in ('pending', 'accepted', 'rejected', 'deferred')),
  manager_approved_text   text,        -- human-edited final wording
  reviewed_by             uuid references staff_members(id),
  reviewed_at             timestamptz,
  review_notes            text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Idempotency
  constraint reg45_evidence_unique unique (care_event_id)
);

create trigger reg45_evidence_queue_updated_at
  before update on reg45_evidence_queue
  for each row execute function set_updated_at();

-- ── Annex A Evidence Queue ────────────────────────────────────────────────────
-- Suggested evidence items for Annex A inspection readiness.

create table annex_a_evidence_queue (
  id                      uuid primary key default uuid_generate_v4(),
  care_event_id           uuid not null references care_events(id) on delete cascade,
  home_id                 uuid not null references homes(id) on delete restrict,
  annex_section           text not null,   -- e.g. 'children', 'staff', 'incidents'
  suggested_text          text not null,
  manager_decision        text check (manager_decision in ('pending', 'accepted', 'rejected', 'deferred')),
  manager_approved_text   text,
  reviewed_by             uuid references staff_members(id),
  reviewed_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Idempotency
  constraint annex_a_evidence_unique unique (care_event_id, annex_section)
);

create trigger annex_a_evidence_queue_updated_at
  before update on annex_a_evidence_queue
  for each row execute function set_updated_at();

-- ── Child Daily Summaries ─────────────────────────────────────────────────────
-- Auto-generated per-child per-day summary aggregating care events.

create table child_daily_summaries (
  id                  uuid primary key default uuid_generate_v4(),
  home_id             uuid not null references homes(id) on delete restrict,
  child_id            uuid not null references young_people(id) on delete restrict,
  summary_date        date not null,
  event_count         int not null default 0,
  significant_count   int not null default 0,
  avg_mood_score      numeric(3,1),
  categories          jsonb not null default '[]'::jsonb,   -- array of categories present
  summary_text        text,
  requires_followup   boolean not null default false,
  generated_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Idempotency: one summary per child per day
  constraint child_daily_summary_unique unique (home_id, child_id, summary_date)
);

create trigger child_daily_summaries_updated_at
  before update on child_daily_summaries
  for each row execute function set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ══════════════════════════════════════════════════════════════════════════════

-- care_events
create index idx_care_events_home_id              on care_events(home_id);
create index idx_care_events_child_id             on care_events(child_id);
create index idx_care_events_staff_id             on care_events(staff_id);
create index idx_care_events_shift_id             on care_events(shift_id);
create index idx_care_events_category             on care_events(category);
create index idx_care_events_status               on care_events(status);
create index idx_care_events_event_date           on care_events(event_date);
create index idx_care_events_created_at           on care_events(created_at);
create index idx_care_events_verified_at          on care_events(verified_at);
create index idx_care_events_locked_at            on care_events(locked_at);
create index idx_care_events_req_manager_review   on care_events(requires_manager_review) where requires_manager_review = true;
create index idx_care_events_req_reg40            on care_events(requires_reg40_triage) where requires_reg40_triage = true;
create index idx_care_events_reg45                on care_events(contributes_to_reg45) where contributes_to_reg45 = true;
create index idx_care_events_annex_a              on care_events(contributes_to_annex_a) where contributes_to_annex_a = true;
create index idx_care_events_is_current           on care_events(is_current_version) where is_current_version = true;

-- care_event_routes
create index idx_cer_care_event_id    on care_event_routes(care_event_id);
create index idx_cer_home_id          on care_event_routes(home_id);
create index idx_cer_status           on care_event_routes(status);
create index idx_cer_route_type       on care_event_routes(route_type);

-- care_event_jobs
create index idx_cej_care_event_id   on care_event_jobs(care_event_id);
create index idx_cej_home_id         on care_event_jobs(home_id);
create index idx_cej_status          on care_event_jobs(status);
create index idx_cej_job_type        on care_event_jobs(job_type);
create index idx_cej_scheduled_at    on care_event_jobs(scheduled_at);

-- care_event_audit_log
create index idx_ceal_care_event_id  on care_event_audit_log(care_event_id);
create index idx_ceal_home_id        on care_event_audit_log(home_id);
create index idx_ceal_action         on care_event_audit_log(action);
create index idx_ceal_created_at     on care_event_audit_log(created_at);

-- reg45 / annex_a queues
create index idx_reg45_home_id       on reg45_evidence_queue(home_id);
create index idx_reg45_decision      on reg45_evidence_queue(manager_decision);
create index idx_annex_a_home_id     on annex_a_evidence_queue(home_id);
create index idx_annex_a_section     on annex_a_evidence_queue(annex_section);
create index idx_annex_a_decision    on annex_a_evidence_queue(manager_decision);

-- child_daily_summaries
create index idx_cds_home_child      on child_daily_summaries(home_id, child_id);
create index idx_cds_date            on child_daily_summaries(summary_date);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

alter table care_events             enable row level security;
alter table care_event_routes       enable row level security;
alter table care_event_jobs         enable row level security;
alter table care_event_audit_log    enable row level security;
alter table reg45_evidence_queue    enable row level security;
alter table annex_a_evidence_queue  enable row level security;
alter table child_daily_summaries   enable row level security;

-- Service role bypasses all RLS (used by API routes)
-- Staff can read/write their own home's data

create policy "care_events_home_select" on care_events
  for select using (home_id = get_my_home_id());

create policy "care_events_home_insert" on care_events
  for insert with check (home_id = get_my_home_id());

create policy "care_events_home_update" on care_events
  for update using (home_id = get_my_home_id());

-- Only managers can delete (soft-delete via status preferred)
create policy "care_events_manager_delete" on care_events
  for delete using (home_id = get_my_home_id() and is_manager());

-- Routes: home-scoped read, insert
create policy "care_event_routes_select" on care_event_routes
  for select using (home_id = get_my_home_id());

create policy "care_event_routes_insert" on care_event_routes
  for insert with check (home_id = get_my_home_id());

create policy "care_event_routes_update" on care_event_routes
  for update using (home_id = get_my_home_id());

-- Jobs: home-scoped read; write via service role only
create policy "care_event_jobs_select" on care_event_jobs
  for select using (home_id = get_my_home_id());

-- Audit log: home-scoped read, insert only (never update/delete)
create policy "care_event_audit_select" on care_event_audit_log
  for select using (home_id = get_my_home_id());

create policy "care_event_audit_insert" on care_event_audit_log
  for insert with check (home_id = get_my_home_id());

-- Reg 45 evidence: restricted to managers
create policy "reg45_evidence_select" on reg45_evidence_queue
  for select using (home_id = get_my_home_id() and is_manager());

create policy "reg45_evidence_insert" on reg45_evidence_queue
  for insert with check (home_id = get_my_home_id());

create policy "reg45_evidence_update" on reg45_evidence_queue
  for update using (home_id = get_my_home_id() and is_manager());

-- Annex A evidence: restricted to managers
create policy "annex_a_evidence_select" on annex_a_evidence_queue
  for select using (home_id = get_my_home_id() and is_manager());

create policy "annex_a_evidence_insert" on annex_a_evidence_queue
  for insert with check (home_id = get_my_home_id());

create policy "annex_a_evidence_update" on annex_a_evidence_queue
  for update using (home_id = get_my_home_id() and is_manager());

-- Child daily summaries: home-scoped read, service role write
create policy "child_daily_summaries_select" on child_daily_summaries
  for select using (home_id = get_my_home_id());

create policy "child_daily_summaries_insert" on child_daily_summaries
  for insert with check (home_id = get_my_home_id());

create policy "child_daily_summaries_update" on child_daily_summaries
  for update using (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- POSTGRES TRIGGERS — live Supabase Realtime subscriptions
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable realtime for the care_events table so clients can subscribe
-- to status changes without polling.
-- Note: in Supabase, realtime is enabled via the dashboard or supabase_realtime
-- publication. The trigger below ensures updated_at advances on every change
-- so subscriptions always fire.

alter publication supabase_realtime add table care_events;
alter publication supabase_realtime add table care_event_routes;
alter publication supabase_realtime add table care_event_jobs;
alter publication supabase_realtime add table reg45_evidence_queue;
alter publication supabase_realtime add table annex_a_evidence_queue;
alter publication supabase_realtime add table child_daily_summaries;

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════════

comment on table care_events is
  'Source Care Event record. A single staff entry that routes automatically to '
  'all connected areas: daily log, incidents, Reg 45, Annex A, etc. '
  'Status lifecycle: draft → submitted → routing → routed → manager_review_required '
  '→ verified → locked. ARIA suggestions are stored separately and must not '
  'silently become final statutory records.';

comment on table care_event_routes is
  'One row per routing destination for a care event. Idempotency constraint '
  '(care_event_id + route_type) prevents duplicate records. Failed routes are '
  'retried without creating duplicates.';

comment on table care_event_jobs is
  'Background job queue for heavy processing (Reg 45 summaries, Annex A '
  'snapshots, PDFs, etc). Staff saves must never block on these jobs.';

comment on table care_event_audit_log is
  'Append-only audit trail for all care event actions. Inspector-ready evidence '
  'of every creation, submission, verification, return, amendment and lock. '
  'Never update or delete rows.';

comment on table reg45_evidence_queue is
  'Suggested Reg 45 evidence from care events. Manager must approve, edit or '
  'reject each item — AI suggestions must not auto-finalise into statutory reports.';

comment on table annex_a_evidence_queue is
  'Suggested Annex A evidence from care events. Same approval requirement as '
  'reg45_evidence_queue. Supports per-section structuring.';

comment on table child_daily_summaries is
  'Auto-generated per-child per-day summary. Idempotency constraint '
  '(home_id + child_id + summary_date) prevents duplicates on replay.';
