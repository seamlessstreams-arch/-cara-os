-- ══════════════════════════════════════════════════════════════════════════════
-- 029 — Young Person Creation Workflow
-- Full referral-to-placement workflow: referral intake, impact assessment,
-- matching panel, pre-admission checklist, and young person profile creation.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── YP Admission Workflow (tracks the full journey) ─────────────────────────

CREATE TABLE IF NOT EXISTS cs_yp_admission_workflows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  referral_id    uuid REFERENCES admission_referrals(id),

  -- Phase tracking (the workflow phases)
  current_phase  text NOT NULL DEFAULT 'referral_intake'
    CHECK (current_phase IN (
      'referral_intake', 'initial_screening', 'impact_assessment',
      'matching_panel', 'pre_admission', 'admission_planning',
      'placement_start', 'completed', 'withdrawn'
    )),

  -- Child details (collected during referral intake)
  child_first_name       text NOT NULL,
  child_last_name        text NOT NULL,
  child_preferred_name   text,
  child_date_of_birth    date NOT NULL,
  child_gender           text NOT NULL,
  child_ethnicity        text,
  child_religion         text,
  child_nationality      text,
  child_first_language   text DEFAULT 'English',
  child_interpreter_needed boolean DEFAULT false,

  -- Referral details
  referral_date          date NOT NULL DEFAULT CURRENT_DATE,
  referral_source        text NOT NULL DEFAULT 'local_authority'
    CHECK (referral_source IN ('local_authority', 'agency', 'emergency', 'internal_transfer', 'court_directed')),
  referring_la           text NOT NULL,
  referring_sw_name      text,
  referring_sw_phone     text,
  referring_sw_email     text,
  iro_name               text,
  iro_phone              text,
  iro_email              text,

  -- Legal context
  legal_status           text,
  care_order_type        text,
  court_order_expiry     date,
  section_20_consent     boolean,

  -- Presenting needs (collected during screening)
  presenting_needs       text[] DEFAULT '{}',
  primary_reason_for_placement text,
  risk_factors           text[] DEFAULT '{}',
  protective_factors     text[] DEFAULT '{}',
  current_living         text,
  reason_for_move        text,
  placement_history_summary text,
  previous_placements_count integer DEFAULT 0,

  -- Health / education
  health_needs           text,
  medication_details     text,
  mental_health_diagnosis text[] DEFAULT '{}',
  camhs_involvement      boolean DEFAULT false,
  camhs_details          text,
  gp_name                text,
  gp_surgery             text,
  gp_phone               text,
  dentist_name           text,
  school_name            text,
  school_type            text,
  ehcp_in_place          boolean DEFAULT false,
  sen_needs              text,
  exclusion_history      text,
  education_status       text DEFAULT 'attending'
    CHECK (education_status IN ('attending', 'part_time', 'excluded', 'awaiting_placement', 'elective_home_ed', 'neet', 'unknown')),

  -- Family context
  family_composition     text,
  contact_arrangements   text,
  contact_restrictions   text,
  sibling_placements     text,
  significant_relationships text,

  -- Impact assessment
  impact_assessment_completed boolean DEFAULT false,
  impact_assessment_date      date,
  impact_assessment_by        uuid REFERENCES staff(id),
  impact_assessment_outcome   text CHECK (impact_assessment_outcome IN ('suitable', 'unsuitable', 'conditionally_suitable', null)),
  impact_on_current_yp        text,
  impact_on_staff_capacity    text,
  impact_on_environment       text,
  safeguarding_considerations text,
  matching_strengths          text,
  matching_risks              text,
  matching_mitigations        text,

  -- Matching panel
  panel_date             date,
  panel_chair            text,
  panel_members          text[] DEFAULT '{}',
  panel_decision         text CHECK (panel_decision IN ('accept', 'decline', 'defer', 'conditional_accept', null)),
  panel_conditions       text,
  panel_rationale        text,

  -- Pre-admission
  pre_admission_visit_date    date,
  pre_admission_visit_by      uuid REFERENCES staff(id),
  pre_admission_visit_notes   text,
  child_views_on_placement    text,
  family_views_on_placement   text,
  pre_admission_checklist     jsonb DEFAULT '{}',

  -- Admission planning
  planned_admission_date      date,
  actual_admission_date       date,
  key_worker_id               uuid REFERENCES staff(id),
  secondary_worker_id         uuid REFERENCES staff(id),
  bedroom_allocation          text,
  welcome_pack_provided       boolean DEFAULT false,
  placement_plan_drafted      boolean DEFAULT false,
  risk_assessment_completed   boolean DEFAULT false,
  missing_protocol_completed  boolean DEFAULT false,
  initial_health_assessment   boolean DEFAULT false,
  school_arrangements_made    boolean DEFAULT false,
  emergency_contacts          jsonb DEFAULT '[]',

  -- Created young person link (set when profile is created)
  created_yp_id          uuid,

  -- Workflow metadata
  aria_risk_summary      text,
  aria_recommendations   jsonb DEFAULT '[]',
  notes                  text,
  created_by             uuid NOT NULL REFERENCES staff(id),
  completed_at           timestamptz,
  withdrawn_at           timestamptz,
  withdrawn_reason       text,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ── Phase history (audit trail for workflow transitions) ────────────────────

CREATE TABLE IF NOT EXISTS cs_yp_admission_phase_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     uuid NOT NULL REFERENCES cs_yp_admission_workflows(id) ON DELETE CASCADE,
  from_phase      text NOT NULL,
  to_phase        text NOT NULL,
  transitioned_by uuid NOT NULL REFERENCES staff(id),
  reason          text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Pre-admission checklist items ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_yp_pre_admission_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     uuid NOT NULL REFERENCES cs_yp_admission_workflows(id) ON DELETE CASCADE,
  category        text NOT NULL
    CHECK (category IN (
      'documentation', 'health', 'education', 'safeguarding',
      'environment', 'staffing', 'legal', 'family', 'other'
    )),
  item_text       text NOT NULL,
  is_mandatory    boolean DEFAULT true,
  is_completed    boolean DEFAULT false,
  completed_by    uuid REFERENCES staff(id),
  completed_at    timestamptz,
  evidence_ref    text,
  notes           text,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── ARIA matching intelligence ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_yp_matching_factors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     uuid NOT NULL REFERENCES cs_yp_admission_workflows(id) ON DELETE CASCADE,
  factor_type     text NOT NULL
    CHECK (factor_type IN (
      'age_compatibility', 'gender_dynamics', 'needs_compatibility',
      'risk_compatibility', 'relationship_dynamics', 'cultural_needs',
      'environmental_capacity', 'staff_skills', 'therapeutic_approach',
      'education_alignment', 'family_contact_logistics', 'peer_group_dynamics'
    )),
  score           integer NOT NULL CHECK (score BETWEEN 1 AND 10),
  rationale       text NOT NULL,
  risk_level      text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  mitigations     text,
  assessed_by     text NOT NULL DEFAULT 'aria',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_yp_admission_wf_home ON cs_yp_admission_workflows(home_id);
CREATE INDEX IF NOT EXISTS idx_yp_admission_wf_phase ON cs_yp_admission_workflows(current_phase);
CREATE INDEX IF NOT EXISTS idx_yp_admission_wf_created_by ON cs_yp_admission_workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_yp_admission_phase_hist_wf ON cs_yp_admission_phase_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_yp_pre_admission_wf ON cs_yp_pre_admission_items(workflow_id);
CREATE INDEX IF NOT EXISTS idx_yp_matching_factors_wf ON cs_yp_matching_factors(workflow_id);

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE cs_yp_admission_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_yp_admission_phase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_yp_pre_admission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_yp_matching_factors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE format(
    'CREATE POLICY %I ON cs_yp_admission_workflows FOR ALL USING (home_id = get_my_home_id())',
    'yp_admission_wf_rls'
  );
  EXECUTE format(
    'CREATE POLICY %I ON cs_yp_admission_phase_history FOR ALL USING (
      workflow_id IN (SELECT id FROM cs_yp_admission_workflows WHERE home_id = get_my_home_id())
    )',
    'yp_admission_phase_hist_rls'
  );
  EXECUTE format(
    'CREATE POLICY %I ON cs_yp_pre_admission_items FOR ALL USING (
      workflow_id IN (SELECT id FROM cs_yp_admission_workflows WHERE home_id = get_my_home_id())
    )',
    'yp_pre_admission_items_rls'
  );
  EXECUTE format(
    'CREATE POLICY %I ON cs_yp_matching_factors FOR ALL USING (
      workflow_id IN (SELECT id FROM cs_yp_admission_workflows WHERE home_id = get_my_home_id())
    )',
    'yp_matching_factors_rls'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Seed: Default pre-admission checklist template ─────────────────────────

-- This is stored as a reference; items are created per-workflow
-- The service layer will use this to populate checklist items
-- (No seed data needed — the service creates items from template)
