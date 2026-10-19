-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — EMERGENCY PLACEMENTS
-- CHR 2015 Reg 22 (arrangements when child is absent/missing),
-- Reg 27 (fitness of premises), Reg 14 (assessment of children),
-- Reg 36 (fitness of workers — emergency staffing).
-- Tables: cs_emergency_placements
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_emergency_placements (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                   text NOT NULL,
  child_id                     uuid NOT NULL,
  referral_date                date NOT NULL,
  referral_time                text NOT NULL,
  emergency_reason             text NOT NULL,
  referring_authority          text NOT NULL,
  social_worker_name           text NOT NULL,
  placement_decision           text NOT NULL DEFAULT 'pending',
  decision_made_by             text NOT NULL,
  decision_date                date NOT NULL,
  admission_date               date,
  risk_assessment_status       text NOT NULL DEFAULT 'not_completed',
  existing_children_consulted  boolean NOT NULL DEFAULT false,
  impact_assessment_completed  boolean NOT NULL DEFAULT false,
  out_of_hours                 boolean NOT NULL DEFAULT false,
  emergency_staffing_arranged  boolean NOT NULL DEFAULT false,
  essential_info_received      boolean NOT NULL DEFAULT false,
  care_plan_received           boolean NOT NULL DEFAULT false,
  post_admission_review        text NOT NULL DEFAULT 'not_due',
  emergency_status             text NOT NULL DEFAULT 'active',
  child_views                  text,
  existing_children_views      text,
  notes                        text,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_home     ON cs_emergency_placements(home_id);
CREATE INDEX IF NOT EXISTS idx_emergency_child    ON cs_emergency_placements(child_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reason   ON cs_emergency_placements(emergency_reason);
CREATE INDEX IF NOT EXISTS idx_emergency_decision ON cs_emergency_placements(placement_decision);
CREATE INDEX IF NOT EXISTS idx_emergency_status   ON cs_emergency_placements(emergency_status);
CREATE INDEX IF NOT EXISTS idx_emergency_date     ON cs_emergency_placements(referral_date);

ALTER TABLE cs_emergency_placements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own emergency placements"
    ON cs_emergency_placements FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
