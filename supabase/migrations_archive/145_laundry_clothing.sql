-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — LAUNDRY & CLOTHING MANAGEMENT
-- CHR 2015 Reg 7, Reg 6, Reg 10
-- SCCIF: Overall Experiences
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_laundry_clothing (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  event_type      text not null default 'clothing_inventory',
  event_date      date not null default now(),
  child_name      text not null default '',
  clothing_condition text not null default 'good',
  laundry_standard text not null default 'not_assessed',
  choice_level    text not null default 'not_assessed',
  child_chose_own_clothes boolean not null default false,
  adequate_wardrobe boolean not null default true,
  school_uniform_adequate boolean not null default true,
  seasonal_clothing_adequate boolean not null default true,
  laundry_done_regularly boolean not null default true,
  clothes_returned_promptly boolean not null default true,
  personal_items_labelled boolean not null default false,
  budget_amount   numeric,
  amount_spent    numeric,
  dignity_maintained boolean not null default true,
  cultural_needs_met boolean not null default true,
  issues_found    jsonb not null default '[]'::jsonb,
  actions_taken   jsonb not null default '[]'::jsonb,
  assessed_by     text not null default '',
  next_review_date date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table cs_laundry_clothing enable row level security;

DO $$ BEGIN
  create policy "laundry_clothing_home_access" on cs_laundry_clothing
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_laundry_clothing_home on cs_laundry_clothing(home_id);
create index if not exists idx_laundry_clothing_date on cs_laundry_clothing(event_date desc);
