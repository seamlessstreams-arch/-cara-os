-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — IMPACT & RISK ASSESSMENT
-- CHR 2015 Reg 12 (appropriate care), Reg 14 (placement matching),
-- Reg 36 (notifications). SCCIF: Helped & Protected.
-- Table: cs_impact_assessments
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_impact_assessments (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                      text NOT NULL,
  child_name                    text NOT NULL,
  referral_date                 date NOT NULL,
  assessment_date               date NOT NULL,
  assessed_by                   text NOT NULL,
  status                        text NOT NULL DEFAULT 'draft',
  overall_risk_level            text NOT NULL DEFAULT 'medium',
  compatibility_factors         jsonb NOT NULL DEFAULT '[]',
  impact_areas                  jsonb NOT NULL DEFAULT '[]',
  mitigations                   jsonb NOT NULL DEFAULT '[]',
  existing_children_consulted   boolean NOT NULL DEFAULT false,
  existing_children_views       text,
  staff_consulted               boolean NOT NULL DEFAULT false,
  staff_views                   text,
  recommendation                text NOT NULL DEFAULT 'defer',
  conditions                    text,
  approved_by                   text,
  approval_date                 date,
  review_date                   date,
  notes                         text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impact_assessments_home     ON cs_impact_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_impact_assessments_status   ON cs_impact_assessments(status);
CREATE INDEX IF NOT EXISTS idx_impact_assessments_risk     ON cs_impact_assessments(overall_risk_level);
CREATE INDEX IF NOT EXISTS idx_impact_assessments_child    ON cs_impact_assessments(child_id);

ALTER TABLE cs_impact_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own impact assessments"
    ON cs_impact_assessments FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
