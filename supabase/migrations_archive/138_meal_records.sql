-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — MEALTIMES & NUTRITION MONITORING
-- CHR 2015 Reg 9, Reg 6, Reg 36
-- SCCIF: Overall Experiences
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_meal_records (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  meal_date       date not null default now(),
  meal_type       text not null default 'lunch',
  menu_description text not null default '',
  dietary_requirements_met jsonb not null default '[]'::jsonb,
  meal_quality    text not null default 'not_assessed',
  hygiene_rating  text not null default 'not_rated',
  children_present int not null default 0,
  children_ate     int not null default 0,
  children_involved_in_preparation boolean not null default false,
  children_involved_in_choice      boolean not null default false,
  cultural_needs_considered boolean not null default false,
  allergies_checked         boolean not null default false,
  fresh_ingredients_used    boolean not null default false,
  balanced_meal             boolean not null default false,
  mealtime_atmosphere_positive boolean not null default false,
  staff_ate_with_children      boolean not null default false,
  food_waste_minimal           boolean not null default false,
  prepared_by     text not null default '',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_meal_records enable row level security;

DO $$ BEGIN
  create policy "meal_records_home_access" on cs_meal_records
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
create index if not exists idx_meal_records_home on cs_meal_records(home_id);
create index if not exists idx_meal_records_date on cs_meal_records(meal_date desc);
create index if not exists idx_meal_records_type on cs_meal_records(meal_type);
