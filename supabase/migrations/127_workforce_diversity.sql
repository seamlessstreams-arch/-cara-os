-- ════════════════════════════════════════════════════════════════════════
-- 127 — Workforce Diversity & Equality
-- CHR 2015 Reg 16; Equality Act 2010; PSED
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_workforce_diversity (
  id                              uuid default gen_random_uuid() primary key,
  home_id                         uuid not null references homes(id) on delete cascade,
  staff_name                      text not null,
  staff_id                        text not null,
  diversity_category              text not null default 'other',
  disclosure_status               text not null default 'not_asked',
  equality_training_status        text not null default 'not_started',
  equality_training_date          date,
  adjustment_status               text not null default 'no_longer_needed',
  adjustment_details              text,
  eia_outcome                     text not null default 'not_assessed',
  discrimination_reported         boolean not null default false,
  discrimination_details          text,
  inclusive_practice_rating        integer not null default 0,
  staff_satisfaction_with_inclusion integer,
  review_date                     date,
  notes                           text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

alter table cs_workforce_diversity enable row level security;

DO $$ BEGIN
  create policy "workforce_diversity_home"
    on cs_workforce_diversity
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_workforce_diversity_home
  on cs_workforce_diversity(home_id);
