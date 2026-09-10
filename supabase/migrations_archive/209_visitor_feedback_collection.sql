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
  feedback_sought_proactively boolean,
  child_views_included boolean,
  environment_commented boolean,
  staff_interaction_positive boolean,
  concerns_raised boolean,
  complaints_linked boolean NOT NULL DEFAULT false,
  action_plan_created boolean,
  feedback_shared_with_team boolean,
  improvement_identified boolean,
  follow_up_arranged boolean,
  anonymity_offered boolean,
  manager_reviewed boolean,
  recorded_promptly boolean,
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
