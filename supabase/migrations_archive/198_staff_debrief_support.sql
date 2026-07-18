-- Migration: 198_staff_debrief_support
-- Table: cs_staff_debrief_support
-- CHR 2015 Reg 13 (leadership/management), Reg 33 (fitness of staff)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_debrief_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  debrief_type text NOT NULL CHECK (debrief_type IN ('post_incident','post_restraint','post_missing','post_safeguarding','routine_end_of_shift','team_reflection','supervision_debrief','critical_incident','complaint_related','other')),
  incident_severity text NOT NULL CHECK (incident_severity IN ('critical','high','medium','low','not_applicable')),
  staff_impact text NOT NULL CHECK (staff_impact IN ('significantly_affected','moderately_affected','mildly_affected','not_affected','not_assessed')),
  support_outcome text NOT NULL CHECK (support_outcome IN ('fully_supported','partially_supported','further_support_needed','referred_externally','declined_support')),
  debrief_date date NOT NULL DEFAULT CURRENT_DATE,
  staff_name text NOT NULL,
  facilitated_by text NOT NULL,
  timely_debrief boolean NOT NULL DEFAULT true,
  safe_space_provided boolean NOT NULL DEFAULT true,
  confidentiality_assured boolean NOT NULL DEFAULT true,
  emotional_support_offered boolean NOT NULL DEFAULT true,
  learning_captured boolean NOT NULL DEFAULT true,
  action_plan_agreed boolean NOT NULL DEFAULT true,
  follow_up_scheduled boolean NOT NULL DEFAULT false,
  supervision_linked boolean NOT NULL DEFAULT true,
  occupational_health_considered boolean NOT NULL DEFAULT false,
  eap_signposted boolean NOT NULL DEFAULT false,
  peer_support_offered boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  debrief_duration_minutes integer NOT NULL DEFAULT 30,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_debrief_support ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_debrief_support_home ON cs_staff_debrief_support;
CREATE POLICY cs_staff_debrief_support_home ON cs_staff_debrief_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_staff_debrief_support_home ON cs_staff_debrief_support(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_debrief_support_date ON cs_staff_debrief_support(debrief_date);
CREATE INDEX IF NOT EXISTS idx_cs_staff_debrief_support_type ON cs_staff_debrief_support(debrief_type);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 198 staff_debrief_support: %', SQLERRM;
END $$;
