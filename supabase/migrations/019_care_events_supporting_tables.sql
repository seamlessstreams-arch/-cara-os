-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CARE EVENTS SUPPORTING TABLES
-- Migration 019 — 2026-05-09
--
-- Adds the remaining tables referenced by the care event routing engine:
--   management_oversight_tasks  — tasks queued for manager review
--   reg40_tasks                 — Regulation 40 notification triage queue
--   filing_cabinet_items        — auto-filed record references
--   saved_time_metrics          — per-event time saving calculations
--
-- Also adds Reg 45 and Annex A evidence queue tables (if not already created
-- by 018). Safe to run on a clean schema — all creates use IF NOT EXISTS.
--
-- ROLLBACK: drop management_oversight_tasks, reg40_tasks, filing_cabinet_items,
--           saved_time_metrics in that order after backing up any data.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Reg 45 evidence queue (ensure exists — 018 may not have created it) ───────

create table if not exists reg45_evidence_queue (
  id              uuid primary key default gen_random_uuid(),
  care_event_id   uuid not null references care_events(id) on delete cascade,
  home_id         uuid not null,
  child_ids       jsonb not null default '[]',
  category        text not null,
  evidence_type   text not null,
  summary         text not null,
  source_date     date not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'deferred')),
  suggested_by    text not null default 'system',
  reviewed_by     text,
  reviewed_at     timestamptz,
  review_notes    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- prevent duplicate evidence suggestions for the same event + type
  unique (care_event_id, evidence_type)
);

-- ── Annex A evidence queue (ensure exists — 018 may not have created it) ──────

create table if not exists annex_a_evidence_queue (
  id              uuid primary key default gen_random_uuid(),
  care_event_id   uuid not null references care_events(id) on delete cascade,
  home_id         uuid not null,
  child_ids       jsonb not null default '[]',
  category        text not null,
  annex_a_section text not null,
  evidence_type   text not null,
  summary         text not null,
  source_date     date not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'deferred')),
  suggested_by    text not null default 'system',
  reviewed_by     text,
  reviewed_at     timestamptz,
  review_notes    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (care_event_id, annex_a_section, evidence_type)
);

-- ── Child daily summaries (ensure exists) ─────────────────────────────────────

create table if not exists child_daily_summaries (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null,
  child_id        text not null,
  summary_date    date not null,
  care_event_ids  jsonb not null default '[]',
  mood            text,
  wellbeing_score int check (wellbeing_score between 1 and 10),
  sleep_quality   text,
  appetite        text,
  behaviour_notes text,
  health_notes    text,
  education_notes text,
  family_contact  boolean not null default false,
  incidents_count int not null default 0,
  medications_given jsonb not null default '[]',
  activities      jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (home_id, child_id, summary_date)
);

-- ── Management oversight tasks ────────────────────────────────────────────────

create table if not exists management_oversight_tasks (
  id              uuid primary key default gen_random_uuid(),
  care_event_id   uuid not null references care_events(id) on delete cascade,
  home_id         uuid not null,
  child_ids       jsonb not null default '[]',
  category        text not null,
  priority        text not null default 'normal'
                    check (priority in ('low', 'normal', 'high', 'urgent')),
  title           text not null,
  summary         text not null,
  status          text not null default 'open'
                    check (status in ('open', 'in_review', 'completed', 'deferred', 'cancelled')),
  assigned_to     text,
  due_date        date,
  completed_at    timestamptz,
  completed_by    text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- prevent duplicate oversight tasks for the same event + category
  unique (care_event_id, category)
);

-- ── Regulation 40 triage tasks ────────────────────────────────────────────────

create table if not exists reg40_tasks (
  id                  uuid primary key default gen_random_uuid(),
  care_event_id       uuid not null references care_events(id) on delete cascade,
  home_id             uuid not null,
  category            text not null,
  severity            text not null default 'medium'
                        check (severity in ('low', 'medium', 'high', 'critical')),
  title               text not null,
  description         text not null,
  status              text not null default 'triage_required'
                        check (status in (
                          'triage_required',
                          'notification_required',
                          'notification_sent',
                          'no_action_required',
                          'deferred'
                        )),
  triage_decision     text,
  triage_notes        text,
  triaged_by          text,
  triaged_at          timestamptz,
  notification_sent   boolean not null default false,
  notification_sent_at timestamptz,
  notification_ref    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (care_event_id, category)
);

-- ── Filing cabinet items ───────────────────────────────────────────────────────

create table if not exists filing_cabinet_items (
  id              uuid primary key default gen_random_uuid(),
  care_event_id   uuid not null references care_events(id) on delete cascade,
  home_id         uuid not null,
  child_ids       jsonb not null default '[]',
  category        text not null,
  subcategory     text,
  title           text not null,
  summary         text not null,
  file_date       date not null,
  status          text not null default 'filed'
                    check (status in ('filed', 'verified', 'archived', 'recalled')),
  verified_at     timestamptz,
  verified_by     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (care_event_id, category)
);

-- ── Saved time metrics ────────────────────────────────────────────────────────

create table if not exists saved_time_metrics (
  id                      uuid primary key default gen_random_uuid(),
  care_event_id           uuid not null references care_events(id) on delete cascade,
  home_id                 uuid not null,
  staff_id                text not null,
  routes_count            int not null default 0,
  estimated_minutes_saved int not null default 0,
  created_at              timestamptz not null default now(),
  -- one metric row per event
  unique (care_event_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- management_oversight_tasks
create index if not exists management_oversight_tasks_home_id_idx
  on management_oversight_tasks(home_id);
create index if not exists management_oversight_tasks_care_event_id_idx
  on management_oversight_tasks(care_event_id);
create index if not exists management_oversight_tasks_status_idx
  on management_oversight_tasks(status);
create index if not exists management_oversight_tasks_priority_idx
  on management_oversight_tasks(priority);
create index if not exists management_oversight_tasks_due_date_idx
  on management_oversight_tasks(due_date);

-- reg40_tasks
create index if not exists reg40_tasks_home_id_idx
  on reg40_tasks(home_id);
create index if not exists reg40_tasks_care_event_id_idx
  on reg40_tasks(care_event_id);
create index if not exists reg40_tasks_status_idx
  on reg40_tasks(status);
create index if not exists reg40_tasks_severity_idx
  on reg40_tasks(severity);

-- filing_cabinet_items
create index if not exists filing_cabinet_items_home_id_idx
  on filing_cabinet_items(home_id);
create index if not exists filing_cabinet_items_care_event_id_idx
  on filing_cabinet_items(care_event_id);
create index if not exists filing_cabinet_items_category_idx
  on filing_cabinet_items(category);
create index if not exists filing_cabinet_items_file_date_idx
  on filing_cabinet_items(file_date);

-- saved_time_metrics
create index if not exists saved_time_metrics_home_id_idx
  on saved_time_metrics(home_id);
create index if not exists saved_time_metrics_staff_id_idx
  on saved_time_metrics(staff_id);
create index if not exists saved_time_metrics_created_at_idx
  on saved_time_metrics(created_at);

-- reg45_evidence_queue
create index if not exists reg45_evidence_queue_home_id_idx
  on reg45_evidence_queue(home_id);
create index if not exists reg45_evidence_queue_status_idx
  on reg45_evidence_queue(status);
create index if not exists reg45_evidence_queue_source_date_idx
  on reg45_evidence_queue(source_date);

-- annex_a_evidence_queue
create index if not exists annex_a_evidence_queue_home_id_idx
  on annex_a_evidence_queue(home_id);
create index if not exists annex_a_evidence_queue_status_idx
  on annex_a_evidence_queue(status);
create index if not exists annex_a_evidence_queue_section_idx
  on annex_a_evidence_queue(annex_a_section);

-- child_daily_summaries
create index if not exists child_daily_summaries_home_id_idx
  on child_daily_summaries(home_id);
create index if not exists child_daily_summaries_child_id_idx
  on child_daily_summaries(child_id);
create index if not exists child_daily_summaries_summary_date_idx
  on child_daily_summaries(summary_date);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table management_oversight_tasks enable row level security;
alter table reg40_tasks enable row level security;
alter table filing_cabinet_items enable row level security;
alter table saved_time_metrics enable row level security;
alter table reg45_evidence_queue enable row level security;
alter table annex_a_evidence_queue enable row level security;
alter table child_daily_summaries enable row level security;

-- Service role bypass (used by server-side API)
create policy "service_role_all_management_oversight_tasks"
  on management_oversight_tasks for all
  to service_role using (true) with check (true);

create policy "service_role_all_reg40_tasks"
  on reg40_tasks for all
  to service_role using (true) with check (true);

create policy "service_role_all_filing_cabinet_items"
  on filing_cabinet_items for all
  to service_role using (true) with check (true);

create policy "service_role_all_saved_time_metrics"
  on saved_time_metrics for all
  to service_role using (true) with check (true);

create policy "service_role_all_reg45_evidence_queue"
  on reg45_evidence_queue for all
  to service_role using (true) with check (true);

create policy "service_role_all_annex_a_evidence_queue"
  on annex_a_evidence_queue for all
  to service_role using (true) with check (true);

create policy "service_role_all_child_daily_summaries"
  on child_daily_summaries for all
  to service_role using (true) with check (true);

-- ── Updated-at triggers ───────────────────────────────────────────────────────

-- Reuse the trigger function from migration 001 if it exists, otherwise create it
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger management_oversight_tasks_updated_at
  before update on management_oversight_tasks
  for each row execute function update_updated_at_column();

create or replace trigger reg40_tasks_updated_at
  before update on reg40_tasks
  for each row execute function update_updated_at_column();

create or replace trigger filing_cabinet_items_updated_at
  before update on filing_cabinet_items
  for each row execute function update_updated_at_column();

create or replace trigger reg45_evidence_queue_updated_at
  before update on reg45_evidence_queue
  for each row execute function update_updated_at_column();

create or replace trigger annex_a_evidence_queue_updated_at
  before update on annex_a_evidence_queue
  for each row execute function update_updated_at_column();

create or replace trigger child_daily_summaries_updated_at
  before update on child_daily_summaries
  for each row execute function update_updated_at_column();
