-- 222: Creative Enrichment Activities
-- CHR 2015 Reg 9 (leisure activities — creative expression), Reg 7 (children's wishes — interests and hobbies)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_creative_enrichment_activities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'art_drawing',
  engagement_level text NOT NULL DEFAULT 'engaged',
  skill_development text NOT NULL DEFAULT 'some_progress',
  creative_output text NOT NULL DEFAULT 'work_in_progress',
  activity_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  facilitated_by text NOT NULL DEFAULT '',
  child_choice_offered boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  therapeutic_value boolean NOT NULL DEFAULT true,
  peer_interaction boolean NOT NULL DEFAULT true,
  self_expression_supported boolean NOT NULL DEFAULT true,
  achievement_recognised boolean NOT NULL DEFAULT true,
  resources_available boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  family_updated boolean NOT NULL DEFAULT true,
  continuation_planned boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_creative_enrichment_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creative_enrichment_activities_home" ON cs_creative_enrichment_activities;
CREATE POLICY "creative_enrichment_activities_home" ON cs_creative_enrichment_activities
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 222 idempotent: %', SQLERRM;
END $$;
