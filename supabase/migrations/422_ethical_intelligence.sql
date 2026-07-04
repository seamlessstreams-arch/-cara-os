-- ══════════════════════════════════════════════════════════════════════════════
-- 422 — ETHICAL INTELLIGENCE SPINE
--
-- The persisted, source-linked system of record for the ethical practice cycle:
--   Experience → Insight → Decision → Impact → Learning → Integration
--
-- Every stage row MUST cite the operational records it is grounded in
-- ("If Cara cannot trace it, Cara cannot claim it") — enforced app-side by the
-- capture service and here by NOT NULL source_records JSONB (≥1 element checked).
-- Cara never makes the decisions these tables record; decision_maker is a human.
--
-- Mirrors src/lib/ethical-intelligence/types.ts (in-memory store collection
-- `ethicalIntelligenceEvents`); adopted by the dual-mode dal when Supabase is on.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists ethical_intelligence_events (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null,
  home_id text,
  child_id text,
  child_name text,
  trigger_record_type text not null,
  trigger_record_id text not null,
  trigger_summary text not null,
  what_happened text not null,
  child_experience text,
  staff_observed text
);

create table if not exists ethical_intelligence_insights (
  id text primary key,
  event_id text not null references ethical_intelligence_events(id) on delete cascade,
  captured_at timestamptz not null default now(),
  captured_by text not null,
  information_known jsonb not null default '[]'::jsonb,
  interpretation text not null,
  alternative_explanations jsonb not null default '[]'::jsonb,
  source_records jsonb not null,
  constraint insights_traceable check (jsonb_array_length(source_records) >= 1)
);

create table if not exists ethical_intelligence_decisions (
  id text primary key,
  event_id text not null references ethical_intelligence_events(id) on delete cascade,
  captured_at timestamptz not null default now(),
  decision_summary text not null,
  decision_maker text not null,
  decision_maker_role text,
  evidence jsonb not null default '[]'::jsonb,
  defensible_decision jsonb,
  source_records jsonb not null,
  constraint decisions_traceable check (jsonb_array_length(source_records) >= 1)
);

create table if not exists ethical_intelligence_actions (
  id text primary key,
  event_id text not null references ethical_intelligence_events(id) on delete cascade,
  captured_at timestamptz not null default now(),
  captured_by text not null,
  action_taken text not null,
  follow_up_required jsonb not null default '[]'::jsonb,
  follow_up_owner text,
  follow_up_due date,
  source_records jsonb not null,
  constraint actions_traceable check (jsonb_array_length(source_records) >= 1)
);

create table if not exists ethical_intelligence_outcomes (
  id text primary key,
  event_id text not null references ethical_intelligence_events(id) on delete cascade,
  captured_at timestamptz not null default now(),
  captured_by text not null,
  what_changed text not null,
  direction text not null check (direction in ('improved','no_change','worsened','too_early_to_say')),
  reviewed_at timestamptz,
  reviewed_by text,
  source_records jsonb not null,
  constraint outcomes_traceable check (jsonb_array_length(source_records) >= 1)
);

create table if not exists ethical_intelligence_learning (
  id text primary key,
  event_id text not null references ethical_intelligence_events(id) on delete cascade,
  captured_at timestamptz not null default now(),
  captured_by text not null,
  what_was_learned text not null,
  to_embed_in_practice jsonb not null default '[]'::jsonb,
  embed_targets jsonb not null default '[]'::jsonb,
  embedded boolean not null default false,
  embedded_at timestamptz,
  source_records jsonb not null,
  constraint learning_traceable check (jsonb_array_length(source_records) >= 1)
);

create table if not exists ethical_intelligence_audit_trail (
  id text primary key,
  event_id text not null references ethical_intelligence_events(id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  stage text,
  detail text
);

-- Integration checklist lives on the event (one row each), tri-state per question:
-- null = honestly unanswered, never defaulted.
alter table ethical_intelligence_events
  add column if not exists child_voice_heard boolean,
  add column if not exists child_plan_updated boolean,
  add column if not exists risk_assessment_updated boolean,
  add column if not exists behaviour_support_plan_updated boolean,
  add column if not exists management_oversight_completed boolean,
  add column if not exists workflow_fully_completed boolean,
  add column if not exists outcome_reviewed boolean;

create index if not exists eie_child_idx on ethical_intelligence_events (child_id);
create index if not exists eie_trigger_idx on ethical_intelligence_events (trigger_record_type, trigger_record_id);
create index if not exists eii_event_idx on ethical_intelligence_insights (event_id);
create index if not exists eid_event_idx on ethical_intelligence_decisions (event_id);
create index if not exists eiact_event_idx on ethical_intelligence_actions (event_id);
create index if not exists eio_event_idx on ethical_intelligence_outcomes (event_id);
create index if not exists eil_event_idx on ethical_intelligence_learning (event_id);
create index if not exists eia_event_idx on ethical_intelligence_audit_trail (event_id);

-- Same tenancy posture as 421: RLS scoped to the child's home when auth is on.
alter table ethical_intelligence_events enable row level security;
alter table ethical_intelligence_insights enable row level security;
alter table ethical_intelligence_decisions enable row level security;
alter table ethical_intelligence_actions enable row level security;
alter table ethical_intelligence_outcomes enable row level security;
alter table ethical_intelligence_learning enable row level security;
alter table ethical_intelligence_audit_trail enable row level security;
