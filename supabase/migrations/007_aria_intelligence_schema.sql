-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA INTELLIGENCE MODULE SCHEMA
-- Migration 007: aria_assessments, aria_oversight, key_work_sessions,
--                child_resources, interactive_sessions, aria_audit_trail,
--                aria_recommendations, aria_safeguarding_flags
-- ══════════════════════════════════════════════════════════════════════════════

-- ── aria_assessments ──────────────────────────────────────────────────────────

create table if not exists aria_assessments (
  id                    text primary key,
  home_id               text not null,
  child_id              text not null,
  source_record_type    text,
  source_record_id      text,
  assessment_type       text not null check (assessment_type in ('situation_review','pattern_scan','safeguarding_scan','reflective_debrief')),
  situation_summary     text,
  risk_level            text not null default 'not_identified' check (risk_level in ('critical','high','medium','low','not_identified')),
  safeguarding_flags    jsonb not null default '[]',
  protective_factors    jsonb not null default '[]',
  emotional_needs       jsonb not null default '[]',
  suggested_actions     jsonb not null default '[]',
  confidence_level      text not null default 'needs_human_review' check (confidence_level in ('high','possible','needs_human_review','insufficient_information')),
  ai_generated_text     text not null,
  human_reviewed_text   text,
  status                text not null default 'draft' check (status in ('draft','reviewed','approved','archived')),
  created_by            text,
  reviewed_by           text,
  approved_by           text,
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz,
  approved_at           timestamptz
);

alter table aria_assessments enable row level security;

create policy "service_role_full_access_aria_assessments"
  on aria_assessments
  for all
  to service_role
  using (true)
  with check (true);

-- ── aria_oversight ────────────────────────────────────────────────────────────

create table if not exists aria_oversight (
  id                text primary key,
  home_id           text not null,
  child_id          text,
  record_type       text not null,
  record_id         text,
  oversight_style   text not null,
  ai_draft          text not null,
  edited_version    text,
  final_version     text,
  approval_status   text not null default 'draft' check (approval_status in ('draft','submitted','approved','archived')),
  manager_id        text,
  quality_rating    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  approved_at       timestamptz
);

alter table aria_oversight enable row level security;

create policy "service_role_full_access_aria_oversight"
  on aria_oversight
  for all
  to service_role
  using (true)
  with check (true);

-- ── key_work_sessions ─────────────────────────────────────────────────────────

create table if not exists key_work_sessions (
  id                    text primary key,
  home_id               text not null,
  child_id              text not null,
  title                 text not null,
  theme                 text not null,
  reason                text not null,
  aims                  text not null,
  desired_outcomes      text not null,
  session_plan          jsonb,
  resources             jsonb not null default '[]',
  child_voice           text,
  staff_reflection      text,
  aria_summary          text,
  manager_oversight_id  text,
  status                text not null default 'planned' check (status in ('planned','in_progress','completed','reviewed','approved')),
  created_by            text,
  completed_by          text,
  reviewed_by           text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz,
  reviewed_at           timestamptz
);

alter table key_work_sessions enable row level security;

create policy "service_role_full_access_key_work_sessions"
  on key_work_sessions
  for all
  to service_role
  using (true)
  with check (true);

-- ── child_resources ───────────────────────────────────────────────────────────

create table if not exists child_resources (
  id              text primary key,
  home_id         text not null,
  child_id        text not null,
  title           text not null,
  resource_type   text not null,
  theme           text not null,
  age_range       text not null,
  reading_level   text not null,
  tone            text not null,
  content         jsonb,
  printable_html  text,
  pdf_url         text,
  created_by      text,
  approved_by     text,
  status          text not null default 'draft' check (status in ('draft','reviewed','approved','archived')),
  created_at      timestamptz not null default now(),
  approved_at     timestamptz
);

alter table child_resources enable row level security;

create policy "service_role_full_access_child_resources"
  on child_resources
  for all
  to service_role
  using (true)
  with check (true);

-- ── interactive_sessions ──────────────────────────────────────────────────────

create table if not exists interactive_sessions (
  id                    text primary key,
  home_id               text not null,
  child_id              text not null,
  key_work_session_id   text,
  consent_recorded      boolean not null default false,
  consent_notes         text,
  session_mode          text not null default 'guided' check (session_mode in ('guided','freeform','activity')),
  responses             jsonb not null default '[]',
  child_voice           text,
  staff_notes           text,
  aria_summary          text,
  safeguarding_flags    jsonb not null default '[]',
  follow_up_actions     jsonb not null default '[]',
  status                text not null default 'active' check (status in ('active','paused','completed','reviewed')),
  created_by            text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

alter table interactive_sessions enable row level security;

create policy "service_role_full_access_interactive_sessions"
  on interactive_sessions
  for all
  to service_role
  using (true)
  with check (true);

-- ── aria_audit_trail ──────────────────────────────────────────────────────────

create table if not exists aria_audit_trail (
  id                text primary key,
  home_id           text not null,
  user_id           text not null,
  child_id          text,
  action_type       text not null,
  source_table      text,
  source_id         text,
  ai_prompt         text,
  ai_response       text,
  human_edit        text,
  approval_status   text,
  created_at        timestamptz not null default now()
);

alter table aria_audit_trail enable row level security;

create policy "service_role_full_access_aria_audit_trail"
  on aria_audit_trail
  for all
  to service_role
  using (true)
  with check (true);

-- ── aria_recommendations ──────────────────────────────────────────────────────

create table if not exists aria_recommendations (
  id                    text primary key,
  home_id               text not null,
  child_id              text,
  source_type           text,
  source_id             text,
  recommendation_type   text not null,
  title                 text not null,
  reason                text not null,
  priority              text not null default 'medium' check (priority in ('urgent','high','medium','low')),
  deadline              timestamptz,
  assigned_role         text,
  task_created          boolean not null default false,
  task_id               text,
  status                text not null default 'pending' check (status in ('pending','actioned','dismissed','task_created')),
  created_at            timestamptz not null default now()
);

alter table aria_recommendations enable row level security;

create policy "service_role_full_access_aria_recommendations"
  on aria_recommendations
  for all
  to service_role
  using (true)
  with check (true);

-- ── aria_safeguarding_flags ───────────────────────────────────────────────────

create table if not exists aria_safeguarding_flags (
  id                  text primary key,
  home_id             text not null,
  child_id            text not null,
  source_type         text,
  source_id           text,
  flag_type           text not null,
  severity            text not null check (severity in ('critical','high','medium','low')),
  description         text not null,
  recommended_action  text not null,
  reviewed_by         text,
  review_outcome      text,
  status              text not null default 'open' check (status in ('open','reviewed','escalated','closed')),
  created_at          timestamptz not null default now(),
  reviewed_at         timestamptz
);

alter table aria_safeguarding_flags enable row level security;

create policy "service_role_full_access_aria_safeguarding_flags"
  on aria_safeguarding_flags
  for all
  to service_role
  using (true)
  with check (true);
