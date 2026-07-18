-- 259: EHCP & SEND Monitoring
-- Tracks Education Health and Care Plans for children with Special Educational Needs and Disabilities
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_ehcp_send_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  child_name text NOT NULL,
  child_id uuid,
  send_category text NOT NULL CHECK (send_category IN ('cognition_learning','communication_interaction','social_emotional_mental_health','sensory_physical','autism_spectrum','specific_learning_difficulty','moderate_learning_difficulty','severe_learning_difficulty','speech_language','other')),
  ehcp_status text NOT NULL CHECK (ehcp_status IN ('assessment_requested','assessment_in_progress','plan_issued','annual_review_due','annual_review_completed','plan_amended','plan_ceased','tribunal_pending','mediation','other')),
  provision_delivery text NOT NULL CHECK (provision_delivery IN ('fully_delivered','mostly_delivered','partially_delivered','not_delivered','under_review')),
  outcome_progress text NOT NULL CHECK (outcome_progress IN ('exceeding','on_track','below_expected','significantly_below','not_assessed')),
  session_date date NOT NULL,
  recorded_by text NOT NULL,
  primary_need_description text NOT NULL,
  provision_summary text NOT NULL,
  specialist_provision text,
  therapy_provision text,
  annual_review_date text,
  last_review_outcome text,
  outcomes_detail text,
  parent_carer_views text,
  child_views text,
  professional_advice text,
  local_authority_contact text,
  approved_by text,
  approved_at timestamptz,
  ehcp_in_place boolean NOT NULL DEFAULT false,
  annual_review_completed boolean NOT NULL DEFAULT false,
  provision_monitored boolean NOT NULL DEFAULT false,
  outcomes_tracked boolean NOT NULL DEFAULT false,
  child_views_captured boolean NOT NULL DEFAULT false,
  parent_views_captured boolean NOT NULL DEFAULT false,
  professional_advice_sought boolean NOT NULL DEFAULT false,
  local_authority_engaged boolean NOT NULL DEFAULT false,
  school_liaison_active boolean NOT NULL DEFAULT false,
  transport_arranged boolean NOT NULL DEFAULT false,
  transition_planned boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_ehcp_send_home ON cs_ehcp_send_monitoring(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_ehcp_send_child ON cs_ehcp_send_monitoring(child_name);
CREATE INDEX IF NOT EXISTS idx_cs_ehcp_send_date ON cs_ehcp_send_monitoring(session_date);

ALTER TABLE cs_ehcp_send_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ehcp_send_home" ON cs_ehcp_send_monitoring;
CREATE POLICY "ehcp_send_home" ON cs_ehcp_send_monitoring
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 259 (ehcp send monitoring): %', SQLERRM;
END $$;
