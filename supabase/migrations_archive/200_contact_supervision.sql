-- Migration: 200_contact_supervision
-- Table: cs_contact_supervision
-- CHR 2015 Reg 22 (contact), Reg 7 (individual child)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_contact_supervision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  contact_type text NOT NULL CHECK (contact_type IN ('face_to_face','phone_call','video_call','letter','supervised_visit','unsupervised_visit','community_contact','overnight_stay','indirect_contact','other')),
  supervision_level text NOT NULL CHECK (supervision_level IN ('full_supervision','partial_supervision','monitored','unsupervised','no_contact_order')),
  child_response text NOT NULL CHECK (child_response IN ('positive','mixed','neutral','distressed','refused')),
  contact_outcome text NOT NULL CHECK (contact_outcome IN ('completed_as_planned','shortened','extended','cancelled_by_family','cancelled_by_child')),
  contact_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supervised_by text NOT NULL,
  risk_assessment_current boolean NOT NULL DEFAULT true,
  child_prepared boolean NOT NULL DEFAULT true,
  child_debriefed boolean NOT NULL DEFAULT true,
  court_order_complied boolean NOT NULL DEFAULT true,
  safeguarding_concerns boolean NOT NULL DEFAULT false,
  transport_arranged boolean NOT NULL DEFAULT true,
  venue_appropriate boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  care_plan_linked boolean NOT NULL DEFAULT true,
  child_views_sought boolean NOT NULL DEFAULT true,
  recorded_within_24h boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact_duration_minutes integer NOT NULL DEFAULT 60,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_contact_supervision ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_contact_supervision_home ON cs_contact_supervision;
CREATE POLICY cs_contact_supervision_home ON cs_contact_supervision
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_contact_supervision_home ON cs_contact_supervision(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_contact_supervision_date ON cs_contact_supervision(contact_date);
CREATE INDEX IF NOT EXISTS idx_cs_contact_supervision_type ON cs_contact_supervision(contact_type);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 200 contact_supervision: %', SQLERRM;
END $$;
