-- Migration: 208_child_development_milestone
-- Tracks developmental milestones and progress

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_development_milestone (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  developmental_domain text NOT NULL DEFAULT 'other',
  achievement_status text NOT NULL DEFAULT 'progressing',
  support_level text NOT NULL DEFAULT 'moderate_support',
  progress_rating text NOT NULL DEFAULT 'steady_progress',
  assessment_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL,
  child_id uuid,
  assessed_by text NOT NULL,
  child_views_included boolean NOT NULL DEFAULT true,
  age_appropriate_targets boolean NOT NULL DEFAULT true,
  care_plan_linked boolean NOT NULL DEFAULT true,
  school_input_obtained boolean NOT NULL DEFAULT true,
  specialist_input_obtained boolean NOT NULL DEFAULT false,
  parent_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT true,
  celebration_of_achievement boolean NOT NULL DEFAULT true,
  next_steps_identified boolean NOT NULL DEFAULT true,
  resources_in_place boolean NOT NULL DEFAULT true,
  multi_agency_coordinated boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_child_development_milestone ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_child_development_milestone_home ON cs_child_development_milestone;
CREATE POLICY cs_child_development_milestone_home ON cs_child_development_milestone
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 208 idempotent: %', SQLERRM;
END $$;
