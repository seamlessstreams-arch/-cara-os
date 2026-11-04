-- CARA "Write to the Child" — persist the child-friendly versions of care
-- records (management version + child-understandable version + Child Lens
-- score) for the live tenant.
--
-- POST/GET /api/cara/write-to-child already read AND write this table via
-- supabase-js, but no migration existed — so on live the insert errored and the
-- route (correctly) returned storageFailure("Writing to the child"). A
-- practitioner could draft a child's letter but never save it. This adds the
-- missing table so the feature persists.
--
-- Columns mirror the route's insert exactly (the route does not set home_id, so
-- it stays nullable). home_id is uuid (matches the ~100 uuid home_id tables);
-- RLS "Tenant isolation" via get_my_home_id() is defence in depth — the app
-- queries as service_role, which the grant covers and which bypasses RLS.

create table if not exists cara_write_to_child (
  id                 text primary key default gen_random_uuid()::text,
  home_id            uuid,
  source_type        text not null,
  source_record_id   text not null,
  source_text        text,
  child_name         text,
  child_age          integer,
  management_version text,
  child_version      text,
  child_lens_score   jsonb,
  status             text not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table cara_write_to_child enable row level security;
drop policy if exists "Tenant isolation" on cara_write_to_child;
create policy "Tenant isolation" on cara_write_to_child
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_cara_write_to_child_home   on cara_write_to_child(home_id);
create index if not exists idx_cara_write_to_child_source on cara_write_to_child(source_record_id);
create index if not exists idx_cara_write_to_child_type   on cara_write_to_child(source_type);
grant select, insert, update, delete on cara_write_to_child to service_role;
