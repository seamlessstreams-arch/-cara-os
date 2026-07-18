-- 260: Placement Matching Assessments
-- Structured assessment of how well a child's placement matches their needs
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_placement_matching_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  child_name text NOT NULL,
  child_id uuid,
  matching_domain text NOT NULL CHECK (matching_domain IN ('peer_dynamics','location_access','education_provision','health_provision','cultural_match','identity_needs','risk_compatibility','staff_skills_match','family_contact','other')),
  match_quality text NOT NULL CHECK (match_quality IN ('excellent_match','good_match','adequate_match','poor_match','unsuitable')),
  assessment_timing text NOT NULL CHECK (assessment_timing IN ('pre_admission','72_hour_review','2_week_review','monthly_review','quarterly_review','triggered_review','annual_review','disruption_review','transition_review','other')),
  impact_level text NOT NULL CHECK (impact_level IN ('very_positive','positive','neutral','negative','very_negative')),
  session_date date NOT NULL,
  assessed_by text NOT NULL,
  matching_rationale text NOT NULL,
  evidence_summary text NOT NULL,
  peer_group_analysis text,
  risk_assessment_summary text,
  child_views_on_placement text,
  existing_children_views text,
  staff_views text,
  improvements_needed text,
  contingency_plan text,
  escalation_notes text,
  approved_by text,
  approved_at timestamptz,
  child_views_sought boolean NOT NULL DEFAULT false,
  existing_children_consulted boolean NOT NULL DEFAULT false,
  staff_consulted boolean NOT NULL DEFAULT false,
  risk_assessment_completed boolean NOT NULL DEFAULT false,
  impact_on_others_assessed boolean NOT NULL DEFAULT false,
  cultural_needs_considered boolean NOT NULL DEFAULT false,
  education_access_confirmed boolean NOT NULL DEFAULT false,
  health_access_confirmed boolean NOT NULL DEFAULT false,
  family_contact_feasible boolean NOT NULL DEFAULT false,
  matching_panel_agreed boolean NOT NULL DEFAULT false,
  contingency_planned boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_placement_matching_home ON cs_placement_matching_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_placement_matching_child ON cs_placement_matching_assessments(child_name);
CREATE INDEX IF NOT EXISTS idx_cs_placement_matching_date ON cs_placement_matching_assessments(session_date);

ALTER TABLE cs_placement_matching_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "placement_matching_home" ON cs_placement_matching_assessments;
CREATE POLICY "placement_matching_home" ON cs_placement_matching_assessments
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 260 (placement matching assessments): %', SQLERRM;
END $$;
