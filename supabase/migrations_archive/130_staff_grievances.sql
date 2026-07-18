-- ══════════════════════════════════════════════════════════════════════════════
-- 130 · STAFF GRIEVANCES
-- Tracks formal grievances, investigation process, outcomes,
-- appeal handling, and learning from staff complaints.
-- CHR 2015 Reg 33, Reg 13; ACAS Code of Practice.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_staff_grievances (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  staff_name                    text    not null,
  staff_id                      text    not null,
  grievance_date                date    not null default now(),
  grievance_category            text    not null default 'other',
  grievance_stage               text    not null default 'informal_raised',
  grievance_outcome             text    not null default 'pending',
  resolution_method             text    not null default 'formal_outcome',
  acknowledged_within_5_days    boolean not null default false,
  hearing_within_28_days        boolean,
  days_to_resolution            integer,
  investigating_officer         text    not null default '',
  union_representative_present  boolean not null default false,
  appeal_lodged                 boolean not null default false,
  appeal_outcome                text,
  learning_identified           boolean not null default false,
  learning_details              text,
  impact_on_children_assessed   boolean not null default false,
  acas_code_followed            boolean not null default false,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_staff_grievances_home
  on cs_staff_grievances(home_id);

-- RLS
alter table cs_staff_grievances enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_staff_grievances
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
