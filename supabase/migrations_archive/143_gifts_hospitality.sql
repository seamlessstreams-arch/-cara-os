-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — GIFTS & HOSPITALITY REGISTER
-- CHR 2015 Reg 13, Reg 33; Bribery Act 2010; NMS 19
-- SCCIF: Leadership & Management
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_gifts_hospitality (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  gift_date       date not null default now(),
  direction       text not null default 'received',
  source          text not null default 'other',
  description     text not null default '',
  estimated_value numeric not null default 0,
  approval_status text not null default 'pending',
  declaration_status text not null default 'declared',
  staff_name      text not null default '',
  approved_by     text,
  conflict_of_interest boolean not null default false,
  child_involved  boolean not null default false,
  receipt_kept    boolean not null default false,
  policy_compliant boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table cs_gifts_hospitality enable row level security;

DO $$ BEGIN
  create policy "gifts_hospitality_home_access" on cs_gifts_hospitality
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_gifts_hospitality_home on cs_gifts_hospitality(home_id);
create index if not exists idx_gifts_hospitality_date on cs_gifts_hospitality(gift_date desc);
