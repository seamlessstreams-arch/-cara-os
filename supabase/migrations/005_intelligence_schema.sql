-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INTELLIGENCE LAYER SCHEMA
-- Migration 005 — 2026-04-23
--
-- Adds the ARIA intelligence layer tables:
--   child_experience_snapshots  — weekly scored indicators per child
--   pattern_alerts              — detected patterns across records
--   interventions               — what was tried, why, outcomes
--   relational_records          — trusted adults, what helps/harms
--   practice_bank_entries       — what works for this child
--   voice_records               — structured child voice capture
--   document_intelligence_jobs  — ARIA document processing queue
--   home_climate_snapshots      — daily/weekly home climate scores
--   action_outcomes             — enhanced action tracking
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Child Experience Snapshots ────────────────────────────────────────────────
-- Computed weekly by ARIA across ten wellbeing indicators per child.
-- score_delta reflects movement vs the immediately preceding period (can be negative).

create table child_experience_snapshots (
  id                  uuid          primary key default uuid_generate_v4(),
  home_id             uuid          not null references homes(id) on delete cascade,
  child_id            uuid          not null references young_people(id) on delete cascade,

  -- Period
  period_start        date          not null,
  period_end          date          not null,

  -- Individual indicator scores (0–100)
  safety_score        int           not null check (safety_score between 0 and 100),
  belonging_score     int           not null check (belonging_score between 0 and 100),
  regulation_score    int           not null check (regulation_score between 0 and 100),
  engagement_score    int           not null check (engagement_score between 0 and 100),
  relationships_score int           not null check (relationships_score between 0 and 100),
  participation_score int           not null check (participation_score between 0 and 100),
  health_score        int           not null check (health_score between 0 and 100),
  education_score     int           not null check (education_score between 0 and 100),
  stability_score     int           not null check (stability_score between 0 and 100),
  achievement_score   int           not null check (achievement_score between 0 and 100),

  -- Composite
  overall_score       int           not null check (overall_score between 0 and 100),
  score_delta         int,                        -- nullable: null on first snapshot

  -- ARIA output
  narrative           text          not null default '',
  evidence_refs       jsonb         not null default '[]',  -- array of {type, id, date, excerpt, significance}

  -- Provenance
  computed_by         text          not null default 'aria',
  reviewed_by         uuid          references staff_members(id),

  created_at          timestamptz   not null default now(),

  constraint child_experience_snapshots_period_check check (period_end >= period_start)
);

create index idx_ces_child        on child_experience_snapshots(child_id, period_start desc);
create index idx_ces_home         on child_experience_snapshots(home_id);
create index idx_ces_period_start on child_experience_snapshots(period_start desc);
create index idx_ces_reviewed_by  on child_experience_snapshots(reviewed_by);

alter table child_experience_snapshots enable row level security;

-- ── Pattern Alerts ────────────────────────────────────────────────────────────
-- ARIA-detected patterns. child_id nullable = home-wide alert.

create table pattern_alerts (
  id                  uuid          primary key default uuid_generate_v4(),
  home_id             uuid          not null references homes(id) on delete cascade,
  child_id            uuid          references young_people(id) on delete cascade,  -- null = home-wide

  -- Classification
  alert_type          text          not null,
  title               text          not null,
  description         text          not null,
  severity            text          not null check (severity in ('low', 'medium', 'high', 'critical')),

  -- Lifecycle
  status              text          not null default 'active'
                                    check (status in ('active', 'acknowledged', 'resolved', 'dismissed')),

  -- Evidence
  evidence_refs       jsonb         not null default '[]',
  period_start        date,
  period_end          date,
  recurrence_count    int           not null default 1,

  -- Timestamps
  first_detected_at   timestamptz   not null default now(),
  last_detected_at    timestamptz   not null default now(),

  -- Acknowledgement
  acknowledged_by     uuid          references staff_members(id),
  acknowledged_at     timestamptz,

  -- Resolution
  resolved_by         uuid          references staff_members(id),
  resolved_at         timestamptz,
  resolution_notes    text,

  -- ARIA suggestions
  suggested_actions   jsonb         not null default '[]',

  created_at          timestamptz   not null default now()
);

create index idx_pa_home         on pattern_alerts(home_id);
create index idx_pa_child        on pattern_alerts(child_id);
create index idx_pa_status       on pattern_alerts(status);
create index idx_pa_severity     on pattern_alerts(severity);
create index idx_pa_alert_type   on pattern_alerts(alert_type);
create index idx_pa_created_at   on pattern_alerts(created_at desc);
create index idx_pa_active       on pattern_alerts(home_id, status) where status = 'active';

alter table pattern_alerts enable row level security;

-- ── Interventions ─────────────────────────────────────────────────────────────
-- Records of specific strategies and approaches tried for a child,
-- with outcomes, effectiveness ratings and continuation recommendations.

create table interventions (
  id                      uuid        primary key default uuid_generate_v4(),
  home_id                 uuid        not null references homes(id) on delete cascade,
  child_id                uuid        not null references young_people(id) on delete cascade,

  -- What and why
  title                   text        not null,
  description             text        not null,
  rationale               text        not null,

  -- Categorisation
  category                text        not null
                                      check (category in (
                                        'behaviour_support', 'therapeutic', 'educational',
                                        'relational', 'health', 'environmental', 'routine',
                                        'communication', 'other'
                                      )),

  -- Timeline
  started_by              uuid        references staff_members(id),
  started_at              date        not null,
  agreed_by               uuid        references staff_members(id),
  review_date             date,

  -- Status
  status                  text        not null default 'active'
                                      check (status in ('active', 'paused', 'stopped', 'completed', 'under_review')),

  -- Outcome
  intended_outcome        text        not null,
  actual_outcome          text,
  effectiveness_rating    int         check (effectiveness_rating between 1 and 5),
  effectiveness_notes     text,
  what_changed            text,
  continue_recommendation text        check (continue_recommendation in ('continue', 'adapt', 'stop', 'replace')),

  -- Evidence
  evidence_refs           jsonb       not null default '[]',
  linked_task_id          uuid        references tasks(id),

  -- Audit
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid        references staff_members(id)
);

create trigger interventions_updated_at before update on interventions
  for each row execute function set_updated_at();

create index idx_interventions_home      on interventions(home_id);
create index idx_interventions_child     on interventions(child_id);
create index idx_interventions_status    on interventions(status);
create index idx_interventions_category  on interventions(category);
create index idx_interventions_created   on interventions(created_at desc);

alter table interventions enable row level security;

-- ── Relational Records ────────────────────────────────────────────────────────
-- Trusted adult maps, rupture-repair records, regulation strategies,
-- sensory needs, voice moments and participation records.

create table relational_records (
  id              uuid        primary key default uuid_generate_v4(),
  home_id         uuid        not null references homes(id) on delete cascade,
  child_id        uuid        not null references young_people(id) on delete cascade,

  -- Classification
  record_type     text        not null
                              check (record_type in (
                                'trusted_adult', 'rupture_repair', 'deescalation',
                                'regulation_strategy', 'sensory_need', 'attachment_indicator',
                                'avoidance_signal', 'what_helps', 'what_harms',
                                'voice_moment', 'participation_record'
                              )),

  -- Content
  title           text        not null,
  description     text        not null,
  staff_id        uuid        references staff_members(id),  -- relevant staff member, if applicable
  context         text,
  evidence        text,

  -- Review
  reviewed        boolean     not null default false,
  review_date     date,
  is_active       boolean     not null default true,

  -- Metadata
  tags            text[]      not null default '{}',

  -- Audit
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid        references staff_members(id)
);

create trigger relational_records_updated_at before update on relational_records
  for each row execute function set_updated_at();

create index idx_rr_home        on relational_records(home_id);
create index idx_rr_child       on relational_records(child_id);
create index idx_rr_type        on relational_records(record_type);
create index idx_rr_is_active   on relational_records(is_active);
create index idx_rr_created_at  on relational_records(created_at desc);

alter table relational_records enable row level security;

-- ── Practice Bank Entries ─────────────────────────────────────────────────────
-- Curated, child-specific knowledge bank: what works, what to avoid,
-- how to prepare, how to de-escalate, etc.

create table practice_bank_entries (
  id                    uuid        primary key default uuid_generate_v4(),
  home_id               uuid        not null references homes(id) on delete cascade,
  child_id              uuid        not null references young_people(id) on delete cascade,

  -- Classification
  category              text        not null
                                    check (category in (
                                      'approach', 'language', 'avoid', 'preparation', 'repair',
                                      'deescalation', 'sensory_regulation', 'education_engagement',
                                      'contact_preparation', 'respectful_challenge', 'risk_reduction',
                                      'routine', 'other'
                                    )),

  -- Content
  title                 text        not null,
  description           text        not null,
  context               text,
  examples              text,

  -- Curation
  added_by              uuid        references staff_members(id),
  verified_by           uuid        references staff_members(id),
  is_active             boolean     not null default true,
  last_used_at          date,
  effectiveness_notes   text,

  -- Audit
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger practice_bank_entries_updated_at before update on practice_bank_entries
  for each row execute function set_updated_at();

create index idx_pbe_home       on practice_bank_entries(home_id);
create index idx_pbe_child      on practice_bank_entries(child_id);
create index idx_pbe_category   on practice_bank_entries(category);
create index idx_pbe_is_active  on practice_bank_entries(is_active);
create index idx_pbe_created_at on practice_bank_entries(created_at desc);

alter table practice_bank_entries enable row level security;

-- ── Voice Records ─────────────────────────────────────────────────────────────
-- Structured capture of child voice, wishes and feelings, and how they were
-- acted on — covering every required element for Ofsted and IRO purposes.

create table voice_records (
  id                      uuid        primary key default uuid_generate_v4(),
  home_id                 uuid        not null references homes(id) on delete cascade,
  child_id                uuid        not null references young_people(id) on delete cascade,

  -- When and how
  record_date             date        not null,
  method                  text        not null,  -- e.g. 'direct_conversation', 'key_work', 'review', 'form', 'observation', 'written', 'creative_activity'
  context                 text,

  -- Core capture
  wishes_and_feelings     text        not null,
  what_child_said         text,
  what_child_wants_to_happen text,

  -- Adult response
  adult_response          text,
  action_taken            text,
  outcome                 text,

  -- Was it acted on?
  was_acted_on            boolean,
  acted_on_rationale      text,

  -- Plan linkage
  linked_to_plan          boolean     not null default false,
  linked_plan_ref         text,

  -- Provenance
  captured_by             uuid        references staff_members(id),
  reviewed_by             uuid        references staff_members(id),

  -- Metadata
  tags                    text[]      not null default '{}',

  -- Audit
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger voice_records_updated_at before update on voice_records
  for each row execute function set_updated_at();

create index idx_vr_home        on voice_records(home_id);
create index idx_vr_child       on voice_records(child_id);
create index idx_vr_record_date on voice_records(record_date desc);
create index idx_vr_created_at  on voice_records(created_at desc);

alter table voice_records enable row level security;

-- ── Document Intelligence Jobs ────────────────────────────────────────────────
-- ARIA processes uploaded documents: extracts text, classifies type,
-- suggests module placement and linked records, generates chronology entries.

create table document_intelligence_jobs (
  id                          uuid        primary key default uuid_generate_v4(),
  home_id                     uuid        not null references homes(id) on delete cascade,

  -- Source file
  file_name                   text        not null,
  file_url                    text        not null,
  file_size                   bigint,
  mime_type                   text,

  -- Extraction
  raw_text                    text,

  -- ARIA classification result
  -- {type, confidence, suggested_module, suggested_child_id, suggested_staff_id,
  --  suggested_form_type, suggested_tags, suggested_confidentiality,
  --  key_facts, key_dates, key_people, risks_identified, actions_identified,
  --  child_voice_present, safeguarding_indicators, missing_information,
  --  recommended_placement, recommended_linkages}
  classification              jsonb,

  -- Pipeline status
  status                      text        not null default 'pending'
                                          check (status in (
                                            'pending', 'extracting', 'classifying',
                                            'classified', 'placed', 'failed', 'dismissed'
                                          )),

  -- Human confirmation of placement
  placement_confirmed         boolean     not null default false,
  placement_module            text,
  placement_record_id         uuid,
  placement_confirmed_by      uuid        references staff_members(id),
  placement_confirmed_at      timestamptz,

  -- Form draft creation
  form_draft_created          boolean     not null default false,
  form_draft_id               uuid,

  -- Suggested additions
  chronology_entries_suggested jsonb      not null default '[]',
  actions_suggested           jsonb       not null default '[]',

  -- ARIA summary fields
  aria_summary                text,
  aria_confidence             real        check (aria_confidence between 0 and 1),

  -- Error handling
  error_message               text,

  -- Provenance
  uploaded_by                 uuid        references staff_members(id),

  -- Audit
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger document_intelligence_jobs_updated_at before update on document_intelligence_jobs
  for each row execute function set_updated_at();

create index idx_dij_home       on document_intelligence_jobs(home_id);
create index idx_dij_status     on document_intelligence_jobs(status);
create index idx_dij_created_at on document_intelligence_jobs(created_at desc);
create index idx_dij_pending    on document_intelligence_jobs(home_id, status) where status in ('pending', 'classifying');

alter table document_intelligence_jobs enable row level security;

-- ── Home Climate Snapshots ────────────────────────────────────────────────────
-- Daily or weekly scored summary of overall home climate, derived from
-- incident patterns, staffing consistency, wellbeing indicators, etc.

create table home_climate_snapshots (
  id                          uuid        primary key default uuid_generate_v4(),
  home_id                     uuid        not null references homes(id) on delete cascade,

  -- Period
  snapshot_date               date        not null,
  period                      text        not null default 'daily'
                                          check (period in ('daily', 'weekly', 'monthly')),

  -- Dimension scores (0–100)
  staffing_consistency_score  int         check (staffing_consistency_score between 0 and 100),
  incident_frequency_score    int         check (incident_frequency_score between 0 and 100),
  wellbeing_score             int         check (wellbeing_score between 0 and 100),
  compliance_score            int         check (compliance_score between 0 and 100),
  environment_score           int         check (environment_score between 0 and 100),
  peer_tension_score          int         check (peer_tension_score between 0 and 100),

  -- Composite
  overall_climate_score       int         check (overall_climate_score between 0 and 100),
  climate_delta               int,        -- nullable: null on first snapshot

  -- Flags and narrative
  hotspot_flags               text[]      not null default '{}',
  narrative                   text,
  evidence_summary            jsonb       not null default '{}',

  created_at                  timestamptz not null default now()
);

create index idx_hcs_home          on home_climate_snapshots(home_id);
create index idx_hcs_snapshot_date on home_climate_snapshots(snapshot_date desc);
create index idx_hcs_home_date     on home_climate_snapshots(home_id, snapshot_date desc);
create index idx_hcs_period        on home_climate_snapshots(home_id, period, snapshot_date desc);

alter table home_climate_snapshots enable row level security;

-- ── Action Outcomes ───────────────────────────────────────────────────────────
-- Enhanced outcome tracking beyond the basic tasks table. Links to the
-- source record (supervision, incident, etc.) and captures what happened,
-- whether it worked, and what comes next.

create table action_outcomes (
  id                      uuid        primary key default uuid_generate_v4(),
  home_id                 uuid        not null references homes(id) on delete cascade,

  -- Source linkages (all optional — at least one expected but not enforced)
  linked_task_id          uuid        references tasks(id),
  linked_incident_id      uuid        references incidents(id),
  linked_supervision_id   uuid        references supervisions(id),
  child_id                uuid        references young_people(id),

  -- What was agreed and why it mattered
  what_was_agreed         text        not null,
  why_it_mattered         text        not null,

  -- Ownership
  owner_id                uuid        references staff_members(id),
  due_date                date,

  -- Progress
  status                  text        not null default 'agreed'
                                      check (status in ('agreed', 'in_progress', 'completed', 'overdue', 'stalled', 'cancelled')),

  -- Outcome narrative
  what_was_done           text,
  what_changed            text,
  did_it_work             text        check (did_it_work in ('yes', 'partially', 'no', 'too_early')),
  continue_recommendation text        check (continue_recommendation in ('continue', 'adapt', 'stop')),
  effectiveness_notes     text,

  -- Evidence
  evidence_refs           jsonb       not null default '[]',

  -- Escalation
  escalated               boolean     not null default false,
  escalation_reason       text,

  -- Review
  review_date             date,
  reviewed_by             uuid        references staff_members(id),
  reviewed_at             timestamptz,

  -- Audit
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid        references staff_members(id)
);

create trigger action_outcomes_updated_at before update on action_outcomes
  for each row execute function set_updated_at();

create index idx_ao_home                  on action_outcomes(home_id);
create index idx_ao_child                 on action_outcomes(child_id);
create index idx_ao_status                on action_outcomes(status);
create index idx_ao_owner                 on action_outcomes(owner_id);
create index idx_ao_due_date              on action_outcomes(due_date);
create index idx_ao_linked_task           on action_outcomes(linked_task_id);
create index idx_ao_linked_incident       on action_outcomes(linked_incident_id);
create index idx_ao_linked_supervision    on action_outcomes(linked_supervision_id);
create index idx_ao_created_at            on action_outcomes(created_at desc);
create index idx_ao_open                  on action_outcomes(home_id, status)
  where status in ('agreed', 'in_progress', 'overdue', 'stalled');

alter table action_outcomes enable row level security;

-- ── Realtime subscriptions ────────────────────────────────────────────────────

alter publication supabase_realtime add table pattern_alerts;
alter publication supabase_realtime add table document_intelligence_jobs;
alter publication supabase_realtime add table home_climate_snapshots;
alter publication supabase_realtime add table action_outcomes;
