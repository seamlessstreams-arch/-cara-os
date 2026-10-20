-- CARA workforce intelligence — career-pathway development plans (own table, distinct
-- from the generic-HR cs_staff_development_plans). Persists the store-backed
-- /api/v1/workforce/development-plans so the CARA workforce pages work on live.
create table if not exists development_plans (
  id              text primary key default gen_random_uuid()::text,
  home_id         uuid,
  staff_id        text not null,
  title           text not null,
  from_stage      text,
  to_stage        text,
  status          text not null default 'draft',
  cara_generated  boolean not null default false,
  cara_rationale  text,
  actions         jsonb not null default '[]',
  review_notes    text,
  reviewed_by     text,
  reviewed_at     text,
  approved_by     text,
  approved_at     text,
  created_by      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table development_plans enable row level security;
drop policy if exists "Tenant isolation" on development_plans;
create policy "Tenant isolation" on development_plans
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));

create index if not exists idx_development_plans_home  on development_plans(home_id);
create index if not exists idx_development_plans_staff on development_plans(staff_id);

grant select, insert, update, delete on development_plans to service_role;
