-- Migration: 162_childrens_absences
-- Children's absence tracking for school attendance, exclusions, interventions

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_childrens_absences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  absence_type       text NOT NULL DEFAULT 'illness',
  absence_duration   text NOT NULL DEFAULT 'full_day',
  intervention_status text NOT NULL DEFAULT 'none_needed',
  attendance_risk    text NOT NULL DEFAULT 'on_track',

  absence_date  date NOT NULL DEFAULT CURRENT_DATE,
  return_date   date,
  child_name    text NOT NULL DEFAULT '',
  child_id      text,
  school_name   text NOT NULL DEFAULT '',

  authorised                boolean NOT NULL DEFAULT true,
  school_notified           boolean NOT NULL DEFAULT true,
  social_worker_informed    boolean NOT NULL DEFAULT false,
  parents_informed          boolean NOT NULL DEFAULT false,
  medical_evidence_provided boolean NOT NULL DEFAULT false,
  pep_reviewed              boolean NOT NULL DEFAULT false,
  catch_up_plan_in_place    boolean NOT NULL DEFAULT false,
  pattern_identified        boolean NOT NULL DEFAULT false,

  days_missed              int NOT NULL DEFAULT 1,
  cumulative_days_missed   int NOT NULL DEFAULT 0,
  attendance_percentage    numeric(5,1) NOT NULL DEFAULT 100.0,
  reason_details           text NOT NULL DEFAULT '',

  issues_found   jsonb NOT NULL DEFAULT '[]',
  actions_taken  jsonb NOT NULL DEFAULT '[]',
  recorded_by    text NOT NULL DEFAULT '',
  notes          text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_childrens_absences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_childrens_absences_home" ON cs_childrens_absences;
CREATE POLICY "cs_childrens_absences_home" ON cs_childrens_absences
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_childrens_absences_home
  ON cs_childrens_absences(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 162 idempotent: %', SQLERRM;
END $$;
