-- CARA workforce intelligence — staff appraisals with competency-domain scoring +
-- cara insights (own table, distinct from the generic-HR cs_staff_appraisals).
-- Persists the store-backed /api/v1/workforce/appraisals for live.
create table if not exists appraisals (
  id                        text primary key default gen_random_uuid()::text,
  home_id                   uuid,
  staff_id                  text not null,
  appraisal_type            text not null,
  appraisal_date            text,
  appraiser_id              text,
  status                    text not null default 'draft',
  overall_rating            text,
  competency_scores         jsonb not null default '{}',
  key_achievements          text,
  areas_for_improvement     text,
  objectives_next_period    text,
  linked_development_plan_id text,
  cara_insights             text,
  staff_comments            text,
  signed_by_staff           boolean not null default false,
  signed_at                 text,
  next_review_date          text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table appraisals enable row level security;
drop policy if exists "Tenant isolation" on appraisals;
create policy "Tenant isolation" on appraisals
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));

create index if not exists idx_appraisals_home  on appraisals(home_id);
create index if not exists idx_appraisals_staff on appraisals(staff_id);

grant select, insert, update, delete on appraisals to service_role;
