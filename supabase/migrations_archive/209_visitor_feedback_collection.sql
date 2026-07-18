-- 209: Visitor Feedback Collection
-- CHR 2015 Reg 44 (independent person visits), Reg 39 (complaints/feedback)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_visitor_feedback_collection (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  visitor_type text NOT NULL DEFAULT 'parent',
  feedback_rating text NOT NULL DEFAULT 'good',
  visit_purpose text NOT NULL DEFAULT 'family_contact',
  satisfaction_level text NOT NULL DEFAULT 'satisfied',
  visit_date   date NOT NULL DEFAULT now(),
  visitor_name text NOT NULL DEFAULT '',
  collected_by text NOT NULL DEFAULT '',
  feedback_sought_proactively boolean NOT NULL DEFAULT true,
  child_views_included boolean NOT NULL DEFAULT true,
  environment_commented boolean NOT NULL DEFAULT true,
  staff_interaction_positive boolean NOT NULL DEFAULT true,
  concerns_raised boolean NOT NULL DEFAULT false,
  complaints_linked boolean NOT NULL DEFAULT false,
  action_plan_created boolean NOT NULL DEFAULT true,
  feedback_shared_with_team boolean NOT NULL DEFAULT true,
  improvement_identified boolean NOT NULL DEFAULT true,
  follow_up_arranged boolean NOT NULL DEFAULT true,
  anonymity_offered boolean NOT NULL DEFAULT true,
  manager_reviewed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_visitor_feedback_collection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitor_feedback_collection_home" ON cs_visitor_feedback_collection;
CREATE POLICY "visitor_feedback_collection_home" ON cs_visitor_feedback_collection
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 209 idempotent: %', SQLERRM;
END $$;
