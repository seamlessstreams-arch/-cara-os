-- Community Links Integration — CHR 2015 Reg 9, Reg 7, Reg 12
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_community_links_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'other',
  engagement_level text NOT NULL DEFAULT 'not_assessed',
  link_status text NOT NULL DEFAULT 'active',
  funding_source text NOT NULL DEFAULT 'home_budget',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  activity_name text NOT NULL,
  provider_name text NOT NULL,
  safeguarding_checked boolean NOT NULL DEFAULT true,
  dbs_verified boolean NOT NULL DEFAULT true,
  risk_assessed boolean NOT NULL DEFAULT true,
  consent_obtained boolean NOT NULL DEFAULT true,
  transport_arranged boolean NOT NULL DEFAULT true,
  child_chose_activity boolean NOT NULL DEFAULT true,
  feedback_obtained boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  care_plan_linked boolean NOT NULL DEFAULT false,
  cultural_needs_met boolean NOT NULL DEFAULT true,
  inclusive_access boolean NOT NULL DEFAULT true,
  review_scheduled boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  recorded_by text NOT NULL,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_community_links_integration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_community_links_integration_home ON cs_community_links_integration;
CREATE POLICY cs_community_links_integration_home ON cs_community_links_integration
  USING (home_id = get_my_home_id());

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
