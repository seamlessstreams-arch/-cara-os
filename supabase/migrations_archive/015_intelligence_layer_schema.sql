-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE INTELLIGENCE LAYER — SCHEMA
-- Migration 015
--
-- Tables for 10 intelligence modules:
--   1. Manager Control Centre (attention items)
--   2. Ofsted Evidence Room (evidence items, links, packs)
--   3. Child Progress & Outcomes Engine (goals, entries, snapshots)
--   4. Regulation 44 / 45 Quality Assurance (visits, actions, reviews)
--   5. Incident-to-Learning Loop (learning reviews)
--   6. Cross-System Smart Linking (record links)
--   7. Staff Competence Passport (competencies, restrictions)
--   8. Voice of the Child Portal (entries)
--   9. RI / Provider Oversight Dashboard (home summaries)
--  10. Intelligence audit log (unified)
--
-- All tables follow existing Cornerstone patterns:
--   - UUID primary keys
--   - home_id for per-home scoping
--   - created_by / created_at / updated_at
--   - RLS enabled, service role full access
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Manager attention items ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manager_attention_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  title           text NOT NULL,
  category        text NOT NULL,
  urgency         text NOT NULL DEFAULT 'medium'
                    CHECK (urgency IN ('low','medium','high','critical')),
  child_id        uuid,
  staff_id        uuid,
  source_record_type text NOT NULL,
  source_record_id   uuid,
  reason          text,
  suggested_action text,
  due_date        date,
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','reviewed','escalated','closed')),
  assigned_to     uuid,
  reviewed_by     uuid,
  reviewed_at     timestamptz,
  escalated_to    text,
  escalated_at    timestamptz,
  aria_draft_id   uuid,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE manager_attention_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON manager_attention_items
  FOR ALL USING (true) WITH CHECK (true);

-- ── 2. Ofsted Evidence Room ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inspection_evidence_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL,
  child_id            uuid,
  staff_id            uuid,
  source_type         text NOT NULL,
  source_id           uuid,
  title               text NOT NULL,
  summary             text,
  evidence_category   text NOT NULL,
  judgement_area       text,
  regulation_reference text,
  confidence_score    numeric,
  evidence_date       date,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inspection_evidence_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON inspection_evidence_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS inspection_evidence_links (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_item_id    uuid NOT NULL REFERENCES inspection_evidence_items(id),
  linked_record_type  text NOT NULL,
  linked_record_id    uuid NOT NULL,
  relationship_type   text,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inspection_evidence_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON inspection_evidence_links
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS inspection_evidence_packs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  title           text NOT NULL,
  period_start    date,
  period_end      date,
  generated_by    uuid,
  generated_at    timestamptz,
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','ready','exported','archived')),
  summary         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inspection_evidence_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON inspection_evidence_packs
  FOR ALL USING (true) WITH CHECK (true);

-- ── 3. Child Progress & Outcomes ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_progress_goals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid NOT NULL,
  home_id           uuid NOT NULL,
  goal_area         text NOT NULL,
  title             text NOT NULL,
  description       text,
  starting_point    text,
  desired_outcome   text,
  plan_actions      text,
  responsible_people text[],
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','achieved','paused','closed')),
  target_date       date,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE child_progress_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON child_progress_goals
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS child_progress_entries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              uuid NOT NULL,
  home_id               uuid NOT NULL,
  goal_id               uuid REFERENCES child_progress_goals(id),
  entry_date            date NOT NULL,
  area                  text NOT NULL,
  what_happened         text NOT NULL,
  impact_on_child       text,
  evidence_source_type  text,
  evidence_source_id    uuid,
  manager_analysis      text,
  aria_suggested_analysis text,
  approved_by           uuid,
  approved_at           timestamptz,
  created_by            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE child_progress_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON child_progress_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS child_outcome_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id                uuid NOT NULL,
  home_id                 uuid NOT NULL,
  snapshot_date           date NOT NULL,
  education_score         integer,
  health_score            integer,
  emotional_wellbeing_score integer,
  safety_score            integer,
  relationships_score     integer,
  independence_score      integer,
  engagement_score        integer,
  summary                 text,
  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE child_outcome_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON child_outcome_snapshots
  FOR ALL USING (true) WITH CHECK (true);

-- ── 4. Regulation 44 / 45 ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reg44_visits (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL,
  visit_date              date NOT NULL,
  visitor_name            text NOT NULL,
  report_status           text NOT NULL DEFAULT 'draft'
                            CHECK (report_status IN ('draft','submitted','reviewed','closed')),
  summary                 text,
  strengths               text,
  concerns                text,
  children_views_summary  text,
  staff_views_summary     text,
  manager_response        text,
  ri_response             text,
  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reg44_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON reg44_visits
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reg44_actions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id          uuid NOT NULL REFERENCES reg44_visits(id),
  home_id           uuid NOT NULL,
  title             text NOT NULL,
  description       text,
  priority          text NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to       uuid,
  due_date          date,
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','completed','overdue','cancelled')),
  manager_response  text,
  completed_at      timestamptz,
  evidence_item_id  uuid,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reg44_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON reg44_actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reg45_reviews (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL,
  period_start                date NOT NULL,
  period_end                  date NOT NULL,
  status                      text NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','in_progress','submitted','approved','published')),
  quality_of_care_summary     text,
  children_experiences_summary text,
  outcomes_summary            text,
  safeguarding_summary        text,
  leadership_summary          text,
  strengths                   text,
  weaknesses                  text,
  improvement_actions         text,
  children_views              text,
  parents_views               text,
  placing_authority_views     text,
  staff_views                 text,
  generated_by                uuid,
  approved_by                 uuid,
  approved_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reg45_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON reg45_reviews
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reg45_evidence_links (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id         uuid NOT NULL REFERENCES reg45_reviews(id),
  evidence_item_id  uuid NOT NULL REFERENCES inspection_evidence_items(id),
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reg45_evidence_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON reg45_evidence_links
  FOR ALL USING (true) WITH CHECK (true);

-- ── 5. Incident-to-Learning Loop ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incident_learning_reviews (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                     uuid NOT NULL,
  home_id                         uuid NOT NULL,
  child_id                        uuid,
  review_status                   text NOT NULL DEFAULT 'required'
                                    CHECK (review_status IN ('required','in_progress','completed','not_required')),
  manager_oversight               text,
  aria_suggested_analysis         text,
  trigger_analysis                text,
  what_worked                     text,
  what_did_not_work               text,
  impact_on_child                 text,
  staff_debrief_required          boolean NOT NULL DEFAULT false,
  child_keywork_required          boolean NOT NULL DEFAULT false,
  risk_assessment_review_required boolean NOT NULL DEFAULT false,
  placement_plan_review_required  boolean NOT NULL DEFAULT false,
  notification_review_required    boolean NOT NULL DEFAULT false,
  learning_summary                text,
  actions_created                 boolean NOT NULL DEFAULT false,
  approved_by                     uuid,
  approved_at                     timestamptz,
  created_by                      uuid,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE incident_learning_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON incident_learning_reviews
  FOR ALL USING (true) WITH CHECK (true);

-- ── 7. Smart record links ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS smart_record_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  source_type     text NOT NULL,
  source_id       uuid NOT NULL,
  target_type     text NOT NULL,
  target_id       uuid NOT NULL,
  relationship    text NOT NULL,
  suggested_by    text NOT NULL DEFAULT 'system',
  approved_by     uuid,
  approved_at     timestamptz,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE smart_record_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON smart_record_links
  FOR ALL USING (true) WITH CHECK (true);

-- ── 8. Staff competence passport ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_competence_records (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                      uuid NOT NULL,
  home_id                       uuid NOT NULL,
  safer_recruitment_complete    boolean NOT NULL DEFAULT false,
  dbs_status                    text NOT NULL DEFAULT 'not_started'
                                  CHECK (dbs_status IN ('not_started','applied','current','due_renewal','expired')),
  dbs_date                      date,
  dbs_update_service            boolean NOT NULL DEFAULT false,
  references_received           boolean NOT NULL DEFAULT false,
  reference_count               integer NOT NULL DEFAULT 0,
  right_to_work                 boolean NOT NULL DEFAULT false,
  induction_complete            boolean NOT NULL DEFAULT false,
  induction_date                date,
  probation_status              text NOT NULL DEFAULT 'not_started'
                                  CHECK (probation_status IN ('not_started','in_progress','passed','extended','failed')),
  probation_end_date            date,
  level3_status                 text NOT NULL DEFAULT 'not_started'
                                  CHECK (level3_status IN ('not_started','enrolled','in_progress','achieved','exempt')),
  mandatory_training_complete   boolean NOT NULL DEFAULT false,
  safeguarding_training_date    date,
  medication_competency         boolean NOT NULL DEFAULT false,
  medication_competency_date    date,
  physical_intervention_trained boolean NOT NULL DEFAULT false,
  physical_intervention_date    date,
  last_supervision_date         date,
  supervision_frequency_weeks   integer NOT NULL DEFAULT 6,
  last_appraisal_date           date,
  can_lead_shift                boolean NOT NULL DEFAULT false,
  can_administer_medication     boolean NOT NULL DEFAULT false,
  can_lone_work                 boolean NOT NULL DEFAULT false,
  can_supervise_others          boolean NOT NULL DEFAULT false,
  restrictions                  text[],
  compliments                   text[],
  performance_concerns          text[],
  role_competencies             jsonb NOT NULL DEFAULT '{}',
  created_by                    uuid,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE staff_competence_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON staff_competence_records
  FOR ALL USING (true) WITH CHECK (true);

-- ── 9. Voice of the Child ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_voice_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id            uuid NOT NULL,
  home_id             uuid NOT NULL,
  entry_date          date NOT NULL,
  category            text NOT NULL,
  child_words         text,
  summary             text,
  action_taken        text,
  staff_response      text,
  manager_review      text,
  linked_record_type  text,
  linked_record_id    uuid,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE child_voice_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON child_voice_entries
  FOR ALL USING (true) WITH CHECK (true);

-- ── 10. Provider oversight summaries ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_home_summaries (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL,
  period_start                date NOT NULL,
  period_end                  date NOT NULL,
  inspection_readiness_score  integer,
  open_risks_count            integer NOT NULL DEFAULT 0,
  serious_incidents_count     integer NOT NULL DEFAULT 0,
  safeguarding_themes         text[],
  reg44_status                text,
  reg45_status                text,
  overdue_actions_count       integer NOT NULL DEFAULT 0,
  supervision_compliance_pct  numeric,
  training_compliance_pct     numeric,
  recruitment_compliance_pct  numeric,
  complaints_open             integer NOT NULL DEFAULT 0,
  missing_episodes            integer NOT NULL DEFAULT 0,
  placement_stability_pct     numeric,
  manager_oversight_pct       numeric,
  aria_risk_flags             text[],
  ri_oversight_notes          text,
  ri_reviewed_at              timestamptz,
  ri_reviewed_by              uuid,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE provider_home_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON provider_home_summaries
  FOR ALL USING (true) WITH CHECK (true);

-- ── Intelligence audit log ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intelligence_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid,
  entity_type     text NOT NULL,
  entity_id       uuid,
  action          text NOT NULL,
  actor_user_id   uuid,
  actor_role      text,
  detail          jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE intelligence_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON intelligence_audit_log
  FOR ALL USING (true) WITH CHECK (true);

-- ── Indices ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mai_home_status ON manager_attention_items(home_id, status);
CREATE INDEX IF NOT EXISTS idx_mai_urgency ON manager_attention_items(urgency);
CREATE INDEX IF NOT EXISTS idx_iei_home_category ON inspection_evidence_items(home_id, evidence_category);
CREATE INDEX IF NOT EXISTS idx_iei_child ON inspection_evidence_items(child_id);
CREATE INDEX IF NOT EXISTS idx_cpg_child ON child_progress_goals(child_id);
CREATE INDEX IF NOT EXISTS idx_cpe_child ON child_progress_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_cos_child ON child_outcome_snapshots(child_id);
CREATE INDEX IF NOT EXISTS idx_r44v_home ON reg44_visits(home_id);
CREATE INDEX IF NOT EXISTS idx_r44a_visit ON reg44_actions(visit_id);
CREATE INDEX IF NOT EXISTS idx_r45r_home ON reg45_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_ilr_incident ON incident_learning_reviews(incident_id);
CREATE INDEX IF NOT EXISTS idx_srl_source ON smart_record_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_srl_target ON smart_record_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_scr_staff ON staff_competence_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_cve_child ON child_voice_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_phs_home ON provider_home_summaries(home_id);
CREATE INDEX IF NOT EXISTS idx_ial_entity ON intelligence_audit_log(entity_type, entity_id);
