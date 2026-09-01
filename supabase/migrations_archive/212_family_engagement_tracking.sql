-- 212: Family Engagement Tracking
-- CHR 2015 Reg 7 (children's wishes about contact), Reg 4 (welfare)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_family_engagement_tracking (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  engagement_type text NOT NULL DEFAULT 'phone_contact',
  family_response text NOT NULL DEFAULT 'engaged',
  participation_level text NOT NULL DEFAULT 'full_participation',
  relationship_quality text NOT NULL DEFAULT 'good',
  engagement_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  family_member_name text NOT NULL DEFAULT '',
  facilitated_by text NOT NULL DEFAULT '',
  child_views_sought boolean,
  child_prepared boolean,
  family_supported boolean,
  barriers_identified boolean,
  social_worker_informed boolean,
  care_plan_updated boolean,
  risk_assessment_current boolean,
  outcome_recorded boolean,
  follow_up_planned boolean,
  safeguarding_considered boolean,
  court_order_complied boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_family_engagement_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_engagement_tracking_home" ON cs_family_engagement_tracking;
CREATE POLICY "family_engagement_tracking_home" ON cs_family_engagement_tracking
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 212 idempotent: %', SQLERRM;
END $$;
