-- ══════════════════════════════════════════════════════════════════════════════
-- 416 — CALENDAR EVENTS (write-through target)
--
-- Durable home for the calendar's ONE editable collection: planned meetings and
-- appointments. Everything else on the calendar is PROJECTED live from existing
-- tables (tasks, appointments, supervisions, lac_reviews, family time, training,
-- interviews, shifts) and is never copied here — capture once, surface
-- everywhere. Hot columns for range queries; attendees + linked tasks travel in
-- jsonb. TEXT primary key carries the application id (cal_…) so updates address
-- the row the insert created. Additive only; home-scoped RLS (413 pattern).
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists calendar_events (
  id text primary key,
  home_id uuid not null,
  title text not null,
  description text,
  event_type text not null default 'meeting',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  child_id text,
  organiser_id text,
  attendees jsonb not null default '[]',
  linked_task_ids jsonb not null default '[]',
  reminder_minutes_before integer,
  reminder_sent boolean not null default false,
  invite_sent boolean not null default false,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_starts_idx on calendar_events (starts_at);
create index if not exists calendar_events_child_idx on calendar_events (child_id);
create index if not exists calendar_events_status_idx on calendar_events (status);

alter table calendar_events enable row level security;
drop policy if exists "Tenant isolation" on calendar_events;
create policy "Tenant isolation" on calendar_events
  using (home_id = get_my_home_id())
  with check (home_id = get_my_home_id());

comment on table calendar_events is
  'Write-through target for planned meetings/appointments (the calendar''s only editable collection). All other calendar items are projected live from their source tables and never duplicated here. TEXT PK = application id (cal_…).';
