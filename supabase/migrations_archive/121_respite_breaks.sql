-- ════════════════════════════════════════════════════════════════════════
-- 121 — Respite & Short Breaks
-- CHR 2015 Reg 14, Reg 36; Children Act 1989 Sch 2 para 6
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_respite_breaks (
  id              uuid default gen_random_uuid() primary key,
  home_id         uuid not null references homes(id) on delete cascade,
  child_name      text not null,
  child_id        text not null,
  break_type      text not null default 'other',
  break_reason    text not null default 'other',
  break_status    text not null default 'planned',
  start_date      date not null default now(),
  end_date        date,
  duration_nights integer not null default 0,
  provider_name   text not null default '',
  provider_type   text not null default '',
  child_views_sought boolean not null default false,
  child_wants_break  boolean,
  social_worker_approved boolean not null default false,
  risk_assessment_completed boolean not null default false,
  child_impact    text not null default 'not_assessed',
  child_feedback  text,
  return_plan_in_place boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_respite_breaks enable row level security;

DO $$ BEGIN
  create policy "respite_breaks_home"
    on cs_respite_breaks
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index
create index if not exists idx_respite_breaks_home
  on cs_respite_breaks(home_id);
