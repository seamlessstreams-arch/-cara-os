-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA VOICE OF THE CHILD SUMMARISER SCHEMA
-- Migration 011: voice_summaries, voice_summary_audit_log
--
-- Purpose: persist Aria-suggested voice-of-the-child summaries that aggregate
-- a child's voice across multiple records (daily logs, key work, 1:1s,
-- complaints, RHIs, family time, etc.) along with a tamper-evident audit
-- trail of every manager decision.
--
-- Companion to migration 010 (Management Oversight Engine). Same compliance
-- posture: drafts are not final until a human approves; every state change
-- is audit-logged.
--
-- Regulatory basis: UNCRC Articles 12 + 13, Children Act 1989 s.22(4),
-- Children's Homes Regs 2015 Reg 7 + Reg 11 (Quality Standard 1), SCCIF
-- Children's Experience.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── voice_summaries ──────────────────────────────────────────────────────────

create table if not exists voice_summaries (
  id                              text primary key,
  child_id                        text not null,
  child_pseudonym                 text,
  home_id                         text,

  status                          text not null default 'draft' check (status in (
                                    'draft','approved','rejected','rewrite_requested'
                                  )),

  narrative_draft                 text not null,
  ofsted_summary                  text not null,

  themes_present                  jsonb not null default '[]',
  themes_absent                   jsonb not null default '[]',
  direct_quotes                   jsonb not null default '[]',
  paraphrased_expressions         jsonb not null default '[]',

  what_child_appears_to_want      jsonb not null default '[]',
  what_child_appears_to_need      jsonb not null default '[]',
  what_child_appears_to_fear      jsonb not null default '[]',
  rights_or_wishes_unmet          jsonb not null default '[]',

  per_record_contributions        jsonb not null default '[]',
  overall_voice_capture_quality   text not null check (overall_voice_capture_quality in (
                                    'strong','adequate','weak','absent'
                                  )),

  suggested_actions               jsonb not null default '[]',
  regulatory_links                jsonb not null default '[]',

  records_considered              integer not null check (records_considered >= 0),
  period_start                    date,
  period_end                      date,

  aria_confidence                 numeric(3, 2) not null check (aria_confidence between 0 and 1),
  llm_used                        boolean not null default false,
  engine_version                  text not null,

  rejection_reason                text,
  rewrite_instructions            text,

  approved_by                     text,
  approved_at                     timestamptz,
  rejected_by                     text,
  rejected_at                     timestamptz,

  generated_at                    timestamptz not null default now(),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_voice_summaries_child   on voice_summaries(child_id);
create index if not exists idx_voice_summaries_home    on voice_summaries(home_id);
create index if not exists idx_voice_summaries_status  on voice_summaries(status);
create index if not exists idx_voice_summaries_period  on voice_summaries(period_start, period_end);

-- ── voice_summary_audit_log ─────────────────────────────────────────────────
-- Append-only audit trail of every event in a summary's lifecycle.

create table if not exists voice_summary_audit_log (
  id            text primary key,
  summary_id    text not null references voice_summaries(id) on delete cascade,
  actor_user_id text,
  actor_role    text,
  event_type    text not null check (event_type in (
                  'draft_generated','viewed','edited','approved','rejected',
                  'rewrite_requested','shared_with_child'
                )),
  event_detail  jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists idx_voice_audit_summary on voice_summary_audit_log(summary_id);
create index if not exists idx_voice_audit_actor   on voice_summary_audit_log(actor_user_id);
create index if not exists idx_voice_audit_type    on voice_summary_audit_log(event_type);

-- ── updated_at trigger for voice_summaries ──────────────────────────────────

create or replace function set_updated_at_voice_summaries()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_voice_summaries_updated_at on voice_summaries;
create trigger trg_voice_summaries_updated_at
  before update on voice_summaries
  for each row
  execute function set_updated_at_voice_summaries();

-- ── Row-level security ──────────────────────────────────────────────────────

alter table voice_summaries          enable row level security;
alter table voice_summary_audit_log  enable row level security;

create policy "service_role_full_access_voice_summaries"
  on voice_summaries for all to service_role using (true) with check (true);

create policy "service_role_full_access_voice_summary_audit_log"
  on voice_summary_audit_log for all to service_role using (true) with check (true);

-- Authenticated users: read-only (further per-home scoping is expected to be
-- enforced via the application layer).
create policy "authenticated_read_voice_summaries"
  on voice_summaries for select to authenticated using (true);

create policy "authenticated_read_voice_summary_audit_log"
  on voice_summary_audit_log for select to authenticated using (true);

-- ── Comments ────────────────────────────────────────────────────────────────

comment on table  voice_summaries          is 'Aria-suggested voice-of-the-child summaries aggregating voice across multiple records. Status flow: draft -> approved | rejected | rewrite_requested. Once approved, should also be shared back with the child in age-appropriate form (UNCRC Art 12).';
comment on table  voice_summary_audit_log  is 'Append-only audit trail for voice summaries — includes a shared_with_child event for evidencing UNCRC Art 12 in practice.';
comment on column voice_summaries.aria_confidence is 'Engine confidence in the deterministic analysis (0.0-1.0). LLM enhancement does not raise this value.';
comment on column voice_summaries.engine_version  is 'Engine version stamp (voiceOfChildSummariser.ENGINE_VERSION) for traceability.';
