-- ════════════════════════════════════════════════════════════════════════
-- 126 — Complaints Investigation
-- CHR 2015 Reg 38, Reg 13; Children Act 1989 s26
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_complaint_investigations (
  id                                uuid default gen_random_uuid() primary key,
  home_id                           uuid not null references homes(id) on delete cascade,
  complaint_date                    date not null default now(),
  complaint_source                  text not null default 'other',
  complaint_category                text not null default 'other',
  investigation_stage               text not null default 'received',
  complaint_outcome                 text not null default 'pending',
  complainant_name                  text not null default '',
  is_child_complaint                boolean not null default false,
  investigating_officer             text not null default '',
  acknowledged_within_24h           boolean not null default false,
  investigation_started_within_5_days boolean not null default false,
  resolved_within_28_days           boolean,
  days_to_resolution                integer,
  learning_identified               boolean not null default false,
  learning_details                  text,
  actions_taken                     text[] not null default '{}',
  ofsted_notified                   boolean not null default false,
  complainant_satisfaction          text,
  review_date                       date,
  notes                             text,
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

alter table cs_complaint_investigations enable row level security;

DO $$ BEGIN
  create policy "complaint_investigations_home"
    on cs_complaint_investigations
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_complaint_investigations_home
  on cs_complaint_investigations(home_id);
