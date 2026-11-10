-- Responsible Individual provider-oversight log.
--
-- The provider-oversight dashboard lets the RI log an oversight entry against a
-- home — a comment, an action request, a review or an escalation, each with an
-- open/closed status. It is a list of entries, not a single field.
--
-- On the live tenant there was nowhere to store it: the route wrote into
-- provider_home_summaries (a period-metrics table) with columns that table does
-- not have, so every save failed and the log never appeared. This table is that
-- store: one row per entry.
--
-- home_id is uuid, matching every other live table. The actor is the signed-in
-- user (the route takes it from the session, never the request). RLS scopes
-- every row to the caller's home; only the service role, which the app uses,
-- has table grants. Applied BY HAND in the Supabase SQL editor; idempotent.

create table if not exists ri_oversight_notes (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null,
  entry_type  text not null default 'comment'
                check (entry_type in ('comment', 'action_request', 'review', 'escalation')),
  content     text not null,
  status      text not null default 'open'
                check (status in ('open', 'closed')),
  author_id   uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table ri_oversight_notes enable row level security;

drop policy if exists "Tenant isolation" on ri_oversight_notes;
create policy "Tenant isolation" on ri_oversight_notes
  for all
  using (home_id = (select get_my_home_id()))
  with check (home_id = (select get_my_home_id()));

grant select, insert, update on ri_oversight_notes to service_role;

create index if not exists idx_ri_oversight_notes_home_created
  on ri_oversight_notes (home_id, created_at desc);
