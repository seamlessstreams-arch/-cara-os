-- Faith Spiritual Observance
-- CHR 2015 Reg 11 (religious observance), Reg 16 (statement of purpose)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_faith_spiritual_observance (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  observance_type text NOT NULL DEFAULT 'other',
  support_level   text NOT NULL DEFAULT 'partially_supported',
  child_engagement text NOT NULL DEFAULT 'engaged',
  cultural_sensitivity text NOT NULL DEFAULT 'adequate',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name   text NOT NULL,
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  supported_by text NOT NULL,
  child_wishes_respected       boolean,
  dietary_needs_met            boolean,
  attendance_facilitated       boolean,
  resources_provided           boolean,
  care_plan_reflects           boolean,
  social_worker_informed       boolean,
  parent_informed              boolean,
  cultural_awareness_shown     boolean,
  privacy_respected            boolean,
  peer_understanding_promoted  boolean,
  festivals_acknowledged       boolean,
  recorded_promptly            boolean,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_faith_spiritual_observance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faith_spiritual_observance_home" ON cs_faith_spiritual_observance;
CREATE POLICY "faith_spiritual_observance_home" ON cs_faith_spiritual_observance
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_faith_spiritual_observance_home ON cs_faith_spiritual_observance(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'faith_spiritual_observance migration: %', SQLERRM;
END $$;
