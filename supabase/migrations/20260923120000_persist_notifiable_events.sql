-- ─────────────────────────────────────────────────────────────────────────
-- Persistence: cs_notifiable_events + cs_event_notifications.
--
-- Regulation 40 of the Children's Homes (England) Regulations 2015 requires
-- the registered person to notify Ofsted, and the child's placing authority,
-- of specified events without delay. Cara has carried a Reg 40 record since
-- before the live tenant existed and has never had a table for it.
--
-- The consequence is specific to this record. A Reg 40 notification is not
-- evidenced by having made it — it is evidenced by the record of having made
-- it, on a date, by a method, with a reference. A home that notified Ofsted
-- correctly had no way to show that it did.
--
-- ── Why these names ──────────────────────────────────────────────────────
--
-- These tables are not new. supabase/migrations_archive/
-- 042_life_skills_notifiable_events.sql created them, and
-- src/lib/services/notifiable-events-service.ts queries them today — every
-- call returning "relation does not exist", which that service reports
-- honestly and the route above it surfaces as an error. They appear in
-- scripts/storage-tables-baseline.json as queried-with-no-migration.
--
-- So this revives the archived schema under its own names rather than
-- inventing a third. The service starts working with no code change.
--
-- Three things are corrected from the archived version, all of which would
-- have failed at apply time or at first write:
--
--   1. home_id REFERENCES cs_homes(id). cs_homes does not exist in the lean
--      live baseline — twelve cs_ tables do, that is not one of them. The FK
--      is dropped; home_id stays uuid and RLS still scopes by it.
--   2. id UUID, child_id UUID. The app generates text ids ("nev_…", "yp_…"),
--      so a uuid column rejects every write the app makes. Both are text, per
--      the convention in 20260722120000_persist_typed_tables.sql.
--   3. NOT NULL on description, immediate_actions_taken, reported_by and
--      deadline. Same convention: a write must never fail on an omitted
--      field. An absent Reg 40 detail should record as absent, not 500.
--
-- ── Added columns ────────────────────────────────────────────────────────
--
-- summary, follow_up and lesson_learned exist on the flat NotifiableEvent in
-- src/types/extended.ts that eight /api/v1 routes read, and had nowhere to go
-- in the archived shape. met_deadline is new — see below. All are additive
-- and nullable, so the existing service, which writes a subset, is unaffected.
--
-- ── Timeliness is recorded, not inferred ─────────────────────────────────
--
-- deadline, sent_date and met_deadline are all stored. met_deadline is
-- computed once, when the notification is recorded, and kept — not derived at
-- read time. An inspector asking "was this notified in time" gets the answer
-- the home recorded, not this deploy's interpretation of two timestamps.
--
-- It is null only where the answer is not yet knowable: nothing sent, or no
-- deadline recorded. Null is deliberate there rather than a default false,
-- which would read as a missed deadline the home never missed.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists cs_notifiable_events (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  event_type text,
  event_date text,
  event_time text,
  child_id text,
  child_name text,
  staff_involved jsonb default '[]',
  summary text,
  description text,
  immediate_actions_taken text,
  outcome text,
  follow_up text,
  lesson_learned text,
  reported_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);

create index if not exists idx_notifiable_events_home on cs_notifiable_events(home_id);
create index if not exists idx_notifiable_events_child on cs_notifiable_events(child_id);
create index if not exists idx_notifiable_events_type on cs_notifiable_events(event_type, event_date);

alter table cs_notifiable_events enable row level security;

drop policy if exists "Tenant isolation" on cs_notifiable_events;
create policy "Tenant isolation" on cs_notifiable_events
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

-- One row per recipient notified, or required to be notified, for one event.
--
-- status carries the archived vocabulary ('draft', 'sent', …) plus
-- 'not_required', which marks a recipient this event genuinely did not need to
-- go to. Recorded rather than left absent, so "considered and not applicable"
-- stays distinguishable from "nobody has dealt with this yet" — the flat
-- shape's NotifiableStatus draws exactly that distinction and has no other way
-- to populate it.
create table if not exists cs_event_notifications (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  event_id text,
  recipient_type text,
  recipient_name text,
  body text,
  sent_date timestamptz,
  sent_by text,
  method text default 'email',
  reference_number text,
  status text default 'draft',
  deadline timestamptz,
  met_deadline boolean,
  acknowledged_date timestamptz,
  acknowledged_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);

create index if not exists idx_event_notifications_home on cs_event_notifications(home_id);
create index if not exists idx_event_notifications_event on cs_event_notifications(event_id);
create index if not exists idx_event_notifications_recipient on cs_event_notifications(recipient_type);

alter table cs_event_notifications enable row level security;

drop policy if exists "Tenant isolation" on cs_event_notifications;
create policy "Tenant isolation" on cs_event_notifications
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
