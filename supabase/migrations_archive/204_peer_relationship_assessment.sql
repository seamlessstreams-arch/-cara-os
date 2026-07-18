-- Migration: 204_peer_relationship_assessment
-- Assesses quality of peer relationships, friendship patterns

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_peer_relationship_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  relationship_quality text NOT NULL DEFAULT 'developing',
  social_skill_level text NOT NULL DEFAULT 'not_assessed',
  conflict_style text NOT NULL DEFAULT 'other',
  friendship_stability text NOT NULL DEFAULT 'fluctuating',
  assessment_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL,
  child_id uuid,
  assessed_by text NOT NULL,
  child_views_sought boolean NOT NULL DEFAULT true,
  positive_interactions_observed boolean NOT NULL DEFAULT true,
  bullying_screened boolean NOT NULL DEFAULT true,
  social_skills_supported boolean NOT NULL DEFAULT true,
  group_activities_encouraged boolean NOT NULL DEFAULT true,
  conflict_resolution_taught boolean NOT NULL DEFAULT true,
  peer_mentoring_available boolean NOT NULL DEFAULT false,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  school_liaison boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_peer_relationship_assessment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_peer_relationship_assessment_home ON cs_peer_relationship_assessment;
CREATE POLICY cs_peer_relationship_assessment_home ON cs_peer_relationship_assessment
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 204 idempotent: %', SQLERRM;
END $$;
