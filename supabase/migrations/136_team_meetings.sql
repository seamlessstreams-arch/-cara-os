-- ══════════════════════════════════════════════════════════════════════════════
-- 136 · STAFF TEAM MEETINGS
-- Tracks team meeting attendance, agendas, actions, safeguarding
-- discussions, and communication effectiveness.
-- CHR 2015 Reg 13, Reg 33, Reg 12.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_team_meetings (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  meeting_type                  text    not null default 'full_team',
  meeting_date                  date    not null default now(),
  meeting_status                text    not null default 'scheduled',
  chaired_by                    text    not null default '',
  minutes_status                text    not null default 'pending',
  attendees_expected            integer not null default 0,
  attendees_present             integer not null default 0,
  duration_minutes              integer,
  safeguarding_discussed        boolean not null default false,
  children_discussed            text[]  not null default '{}',
  agenda_items                  text[]  not null default '{}',
  actions_set                   integer not null default 0,
  actions_completed_from_last   integer not null default 0,
  actions_outstanding_from_last integer not null default 0,
  key_decisions                 text[]  not null default '{}',
  next_meeting_date             date,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_team_meetings_home
  on cs_team_meetings(home_id);

-- RLS
alter table cs_team_meetings enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_team_meetings
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
