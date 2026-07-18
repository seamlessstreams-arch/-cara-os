-- 257: Professional Network Directory
-- Tracks all professionals involved with each child — social worker, IRO, CAMHS, advocate, etc.
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_professional_network_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  child_name text NOT NULL,
  child_id uuid,
  professional_role text NOT NULL CHECK (professional_role IN ('social_worker','independent_reviewing_officer','camhs_therapist','guardian_ad_litem','advocate','education_link','health_visitor','yot_worker','family_support_worker','other')),
  contact_frequency text NOT NULL CHECK (contact_frequency IN ('daily','weekly','fortnightly','monthly','quarterly','as_needed','annually','on_referral','statutory_only','other')),
  engagement_quality text NOT NULL CHECK (engagement_quality IN ('excellent','good','adequate','poor','disengaged')),
  relationship_status text NOT NULL DEFAULT 'active' CHECK (relationship_status IN ('active','pending_allocation','on_leave','changed','ended')),
  session_date date NOT NULL,
  recorded_by text NOT NULL,
  professional_name text NOT NULL,
  organisation text NOT NULL,
  contact_email text,
  contact_phone text,
  last_contact_date text,
  next_planned_contact text,
  relationship_notes text,
  communication_preferences text,
  escalation_contact text,
  referral_source text,
  approved_by text,
  approved_at timestamptz,
  contact_details_current boolean NOT NULL DEFAULT false,
  consent_to_share boolean NOT NULL DEFAULT false,
  regular_communication boolean NOT NULL DEFAULT false,
  attends_reviews boolean NOT NULL DEFAULT false,
  responsive_to_contact boolean NOT NULL DEFAULT false,
  child_aware_of_professional boolean NOT NULL DEFAULT false,
  child_views_shared boolean NOT NULL DEFAULT false,
  information_sharing_agreed boolean NOT NULL DEFAULT false,
  emergency_contact_confirmed boolean NOT NULL DEFAULT false,
  statutory_requirements_met boolean NOT NULL DEFAULT false,
  relationship_quality_reviewed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_prof_network_home ON cs_professional_network_directory(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_prof_network_child ON cs_professional_network_directory(child_name);
CREATE INDEX IF NOT EXISTS idx_cs_prof_network_date ON cs_professional_network_directory(session_date);

ALTER TABLE cs_professional_network_directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professional_network_home" ON cs_professional_network_directory;
CREATE POLICY "professional_network_home" ON cs_professional_network_directory
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 257 (professional network directory): %', SQLERRM;
END $$;
