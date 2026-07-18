-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S MEETINGS
-- CHR 2015 Reg 7, Reg 10, Reg 16
-- SCCIF: Voice of the Child
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_childrens_meetings (
  id                            uuid primary key default gen_random_uuid(),
  home_id                       uuid not null references homes(id) on delete cascade,
  meeting_type                  text not null default 'house_meeting',
  meeting_date                  date not null default now(),
  participation_level           text not null default 'some_participated',
  action_outcome                text not null default 'no_actions_needed',
  meeting_atmosphere            text not null default 'positive',
  children_invited              integer not null default 0,
  children_attended             integer not null default 0,
  agenda_shared_beforehand      boolean not null default false,
  children_set_agenda           boolean not null default false,
  minutes_recorded              boolean not null default true,
  actions_from_previous_reviewed boolean not null default false,
  child_chair                   boolean not null default false,
  food_provided                 boolean not null default false,
  changes_implemented           boolean not null default false,
  children_feedback_positive    boolean not null default true,
  staff_facilitator             text not null default '',
  topics_discussed              jsonb not null default '[]'::jsonb,
  actions_agreed                jsonb not null default '[]'::jsonb,
  next_meeting_date             date,
  notes                         text,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

alter table cs_childrens_meetings enable row level security;

DO $$ BEGIN
  create policy "childrens_meetings_home_access" on cs_childrens_meetings
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_childrens_meetings_home on cs_childrens_meetings(home_id);
create index if not exists idx_childrens_meetings_date on cs_childrens_meetings(meeting_date desc);
