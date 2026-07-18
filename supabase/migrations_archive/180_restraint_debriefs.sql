-- Migration: cs_restraint_debriefs
-- Tracks post-restraint debriefing sessions

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_restraint_debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  debrief_type text NOT NULL DEFAULT 'child_debrief',
  restraint_type text NOT NULL DEFAULT 'planned_intervention',
  debrief_outcome text NOT NULL DEFAULT 'no_concerns',
  child_emotional_state text NOT NULL DEFAULT 'calm',
  debrief_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  staff_involved text NOT NULL DEFAULT '',
  child_debrief_completed boolean NOT NULL DEFAULT true,
  staff_debrief_completed boolean NOT NULL DEFAULT true,
  medical_check_done boolean NOT NULL DEFAULT true,
  body_map_completed boolean NOT NULL DEFAULT true,
  ofsted_notified boolean NOT NULL DEFAULT true,
  social_worker_notified boolean NOT NULL DEFAULT true,
  parent_notified boolean NOT NULL DEFAULT true,
  witness_statements_taken boolean NOT NULL DEFAULT true,
  cctv_reviewed boolean NOT NULL DEFAULT false,
  proportionate_response boolean NOT NULL DEFAULT true,
  learning_documented boolean NOT NULL DEFAULT true,
  plan_updated boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  debriefed_by text NOT NULL DEFAULT '',
  restraint_duration_minutes integer NOT NULL DEFAULT 5,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_restraint_debriefs_home ON cs_restraint_debriefs(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_restraint_debriefs_date ON cs_restraint_debriefs(debrief_date);

ALTER TABLE cs_restraint_debriefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_restraint_debriefs_home_isolation ON cs_restraint_debriefs;
CREATE POLICY cs_restraint_debriefs_home_isolation ON cs_restraint_debriefs
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_restraint_debriefs migration: %', SQLERRM;
END $$;
