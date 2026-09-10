-- ═══════════════════════════════════════════════════════════════════════════
-- EDUCATION EVENTS (Phase 3 of the processor-persistence programme) —
-- the education EVENT LOG goes live.
--
-- This is the table the education CONSOLIDATION (#108) deliberately did NOT
-- create: store.educationRecords is an event log (suspensions, managed moves,
-- PEP meetings, informal send-homes — the off-rolling scrutiny triggers),
-- distinct from cs_education_records (the per-child PROFILE, #108). The
-- care-events processor creates these events via db.educationRecords.create
-- and, until now, they evaporated on live. cs_education_events gives them a
-- durable home; dal.educationRecords becomes dual-mode so all 21 readers
-- (off-rolling triggers, chronology composite, education intelligence) see
-- live events, and the processor mirrors each event here best-effort.
--
-- No judgement defaults: record_type/status/attendance_status/linked_pep all
-- nullable — the recorder's answer or nothing.
--
-- APPLIED MANUALLY after merge.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_education_events (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  record_type text,
  title text,
  date date,
  school text,
  details text,
  outcome text,
  follow_up_date date,
  attendance_status text,
  linked_pep boolean,
  status text,
  staff_id text,
  care_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_education_events enable row level security;
create index if not exists idx_cs_education_events_home on cs_education_events(home_id);
drop policy if exists "Tenant isolation" on cs_education_events;
create policy "Tenant isolation" on cs_education_events
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_education_events_child on cs_education_events(child_id);
create index if not exists idx_cs_education_events_date on cs_education_events(date);
create index if not exists idx_cs_education_events_type on cs_education_events(record_type);
