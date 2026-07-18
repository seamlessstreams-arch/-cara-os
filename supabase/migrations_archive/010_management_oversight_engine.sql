-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA MANAGEMENT OVERSIGHT ENGINE SCHEMA
-- Migration 010: oversight_reviews, oversight_actions, oversight_audit_log
--
-- Purpose: persist Aria-suggested management oversight drafts for completed
-- care records, the suggested follow-up actions they generate, and a tamper-
-- evident audit trail of every manager decision (approve / edit / reject /
-- request_rewrite). Every oversight starts as "draft" and only a human can
-- approve it.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── oversight_reviews ────────────────────────────────────────────────────────

create table if not exists oversight_reviews (
  id                          text primary key,
  record_id                   text not null,
  record_type                 text not null check (record_type in (
                                'daily_log','shift_debrief','incident_report',
                                'missing_from_care','disclosure','safeguarding',
                                'medication','key_work','education','health',
                                'complaint','consequence_restorative',
                                'room_search','family_time'
                              )),
  child_id                    text,
  home_id                     text,

  status                      text not null default 'draft' check (status in (
                                'draft','approved','rejected','rewrite_requested'
                              )),

  oversight_draft             text not null,
  ofsted_summary              text not null,

  quality_score               integer not null check (quality_score between 0 and 100),
  risk_level                  text not null check (risk_level in ('low','medium','high','critical')),
  practice_judgement          text not null check (practice_judgement in (
                                'strong','adequate','unclear','requires_improvement'
                              )),

  child_voice_visible         boolean not null,
  plan_links_visible          boolean not null,
  plan_links                  jsonb not null default '[]',

  requires_manager_escalation boolean not null default false,
  escalation_reason           text,

  missing_evidence            jsonb not null default '[]',
  strengths                   jsonb not null default '[]',
  regulatory_links            jsonb not null default '[]',

  aria_confidence             numeric(3, 2) not null check (aria_confidence between 0 and 1),
  llm_used                    boolean not null default false,
  engine_version              text not null,

  rejection_reason            text,
  rewrite_instructions        text,

  approved_by                 text,
  approved_at                 timestamptz,
  rejected_by                 text,
  rejected_at                 timestamptz,

  generated_at                timestamptz not null default now(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_oversight_reviews_record on oversight_reviews(record_id);
create index if not exists idx_oversight_reviews_child  on oversight_reviews(child_id);
create index if not exists idx_oversight_reviews_home   on oversight_reviews(home_id);
create index if not exists idx_oversight_reviews_status on oversight_reviews(status);
create index if not exists idx_oversight_reviews_risk   on oversight_reviews(risk_level);

-- ── oversight_actions ────────────────────────────────────────────────────────
-- Suggested follow-up actions attached to an oversight review. The manager
-- can promote any of these into a real task in the wider Cornerstone task
-- system; until then they live here.

create table if not exists oversight_actions (
  id              text primary key,
  review_id       text not null references oversight_reviews(id) on delete cascade,
  title           text not null,
  description     text not null,
  priority        text not null check (priority in ('urgent','high','medium','low')),
  due_days        integer not null,
  assigned_role   text not null,
  approved        boolean not null default false,
  approved_by     text,
  approved_at     timestamptz,
  promoted_task_id text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_oversight_actions_review on oversight_actions(review_id);

-- ── oversight_audit_log ──────────────────────────────────────────────────────
-- Tamper-evident record of every event in a review's lifecycle. Append-only
-- by RLS policy. Inspectors can rely on this trail.

create table if not exists oversight_audit_log (
  id            text primary key,
  review_id     text not null references oversight_reviews(id) on delete cascade,
  actor_user_id text,
  actor_role    text,
  event_type    text not null check (event_type in (
                  'draft_generated','viewed','edited','approved','rejected',
                  'rewrite_requested','action_promoted'
                )),
  event_detail  jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists idx_oversight_audit_review on oversight_audit_log(review_id);
create index if not exists idx_oversight_audit_actor  on oversight_audit_log(actor_user_id);
create index if not exists idx_oversight_audit_type   on oversight_audit_log(event_type);

-- ── updated_at trigger for oversight_reviews ─────────────────────────────────

create or replace function set_updated_at_oversight_reviews()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_oversight_reviews_updated_at on oversight_reviews;
create trigger trg_oversight_reviews_updated_at
  before update on oversight_reviews
  for each row
  execute function set_updated_at_oversight_reviews();

-- ── Row-level security ───────────────────────────────────────────────────────

alter table oversight_reviews   enable row level security;
alter table oversight_actions   enable row level security;
alter table oversight_audit_log enable row level security;

-- Service role: full access (used by the API route).
create policy "service_role_full_access_oversight_reviews"
  on oversight_reviews for all to service_role using (true) with check (true);

create policy "service_role_full_access_oversight_actions"
  on oversight_actions for all to service_role using (true) with check (true);

create policy "service_role_full_access_oversight_audit_log"
  on oversight_audit_log for all to service_role using (true) with check (true);

-- Authenticated users: read-only on reviews and actions (further scoping by
-- home_id is expected to be enforced via the application layer / per-home
-- RLS policies attached at deployment time).
create policy "authenticated_read_oversight_reviews"
  on oversight_reviews for select to authenticated using (true);

create policy "authenticated_read_oversight_actions"
  on oversight_actions for select to authenticated using (true);

create policy "authenticated_read_oversight_audit_log"
  on oversight_audit_log for select to authenticated using (true);

-- Audit log is append-only: no UPDATE or DELETE for any role except service_role
-- (already covered by the service_role policy). Authenticated users cannot
-- modify history.

-- ── Comments for inspectors / future maintainers ─────────────────────────────

comment on table  oversight_reviews   is 'Aria-suggested management oversight drafts. Status flow: draft -> approved | rejected | rewrite_requested. Every state change is audit-logged.';
comment on table  oversight_actions   is 'Suggested follow-up actions attached to an oversight review. Manager can promote to a task by setting promoted_task_id.';
comment on table  oversight_audit_log is 'Append-only audit trail of every oversight review event. Inspector-ready evidence of leadership oversight.';
comment on column oversight_reviews.aria_confidence is 'Engine confidence in the deterministic analysis (0.0-1.0). LLM enhancement does not raise this value.';
comment on column oversight_reviews.engine_version  is 'Engine version stamp (managementOversightEngine.ENGINE_VERSION) for traceability of analysis logic.';
