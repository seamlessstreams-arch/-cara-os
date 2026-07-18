-- ════════════════════════════════════════════════════════════════════════
-- 122 — Medication Administrations
-- CHR 2015 Reg 23, Reg 6
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_medication_administrations (
  id                    uuid default gen_random_uuid() primary key,
  home_id               uuid not null references homes(id) on delete cascade,
  child_name            text not null,
  child_id              text not null,
  medication_name       text not null default '',
  medication_type       text not null default 'other',
  dosage                text not null default '',
  administration_route  text not null default 'oral',
  administration_outcome text not null default 'administered',
  scheduled_time        timestamptz not null default now(),
  actual_time           timestamptz,
  administered_by       text not null default '',
  witness_status        text not null default 'not_required',
  witness_name          text,
  reason_for_prn        text,
  reason_for_refusal    text,
  stock_balance         integer,
  controlled_drug       boolean not null default false,
  mar_chart_updated     boolean not null default false,
  side_effects_observed boolean not null default false,
  side_effects_details  text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS
alter table cs_medication_administrations enable row level security;

DO $$ BEGIN
  create policy "medication_administrations_home"
    on cs_medication_administrations
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index
create index if not exists idx_medication_administrations_home
  on cs_medication_administrations(home_id);
