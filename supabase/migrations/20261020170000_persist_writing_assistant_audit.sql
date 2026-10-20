-- Writing Assistant audit trail: persist accept/ignore events (was store-only → lost on live).
create table if not exists writing_assistant_audit_events (
  id               text primary key default gen_random_uuid()::text,
  home_id          uuid,
  user_id          text not null,
  record_type      text,
  field_name       text,
  child_id         text,
  issue_type       text not null,
  action           text not null,
  original_text    text,
  replacement_text text,
  created_at       timestamptz not null default now()
);

alter table writing_assistant_audit_events enable row level security;
drop policy if exists "Tenant isolation" on writing_assistant_audit_events;
create policy "Tenant isolation" on writing_assistant_audit_events
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));

create index if not exists idx_wa_audit_home    on writing_assistant_audit_events(home_id);
create index if not exists idx_wa_audit_created on writing_assistant_audit_events(created_at desc);
create index if not exists idx_wa_audit_user    on writing_assistant_audit_events(user_id);

grant select, insert, update, delete on writing_assistant_audit_events to service_role;
