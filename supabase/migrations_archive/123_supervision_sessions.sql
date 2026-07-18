-- ════════════════════════════════════════════════════════════════════════
-- 123 — Staff Supervision Sessions
-- CHR 2015 Reg 33, Reg 16
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_supervision_sessions (
  id                        uuid default gen_random_uuid() primary key,
  home_id                   uuid not null references homes(id) on delete cascade,
  staff_name                text not null,
  staff_id                  text not null,
  supervisor_name           text not null default '',
  supervision_type          text not null default 'formal_scheduled',
  session_status            text not null default 'scheduled',
  session_date              date not null default now(),
  next_session_date         date,
  duration_minutes          integer not null default 0,
  children_discussed        text[] not null default '{}',
  cases_discussed_count     integer not null default 0,
  safeguarding_discussed    boolean not null default false,
  wellbeing_rating          text not null default 'satisfactory',
  wellbeing_concerns_raised boolean not null default false,
  actions_set               integer not null default 0,
  actions_completed_from_last integer not null default 0,
  actions_outstanding_from_last integer not null default 0,
  training_needs_identified boolean not null default false,
  reflective_practice_included boolean not null default false,
  signed_by_supervisee      boolean not null default false,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- RLS
alter table cs_supervision_sessions enable row level security;

DO $$ BEGIN
  create policy "supervision_sessions_home"
    on cs_supervision_sessions
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index
create index if not exists idx_supervision_sessions_home
  on cs_supervision_sessions(home_id);
