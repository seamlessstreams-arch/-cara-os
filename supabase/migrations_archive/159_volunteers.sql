-- ═══════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — VOLUNTEER MANAGEMENT
-- CHR 2015 Reg 32 (fitness of workers — includes volunteers),
-- Reg 12 (protection), Reg 33 (employment of staff).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_volunteers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,

  volunteer_name          text NOT NULL DEFAULT '',
  volunteer_role          text NOT NULL DEFAULT 'general_support',
  volunteer_status        text NOT NULL DEFAULT 'pending_checks',
  dbs_status              text NOT NULL DEFAULT 'not_submitted',
  training_status         text NOT NULL DEFAULT 'not_started',
  supervision_frequency   text NOT NULL DEFAULT 'monthly',

  start_date              date NOT NULL DEFAULT CURRENT_DATE,
  dbs_check_date          date,
  dbs_expiry_date         date,

  safeguarding_trained    boolean NOT NULL DEFAULT false,
  first_aid_trained       boolean NOT NULL DEFAULT false,
  health_safety_trained   boolean NOT NULL DEFAULT false,
  data_protection_trained boolean NOT NULL DEFAULT false,
  lone_working_allowed    boolean NOT NULL DEFAULT false,
  references_obtained     boolean NOT NULL DEFAULT false,
  interview_completed     boolean NOT NULL DEFAULT false,
  induction_completed     boolean NOT NULL DEFAULT false,

  last_supervision_date   date,
  next_supervision_date   date,
  hours_this_month        numeric NOT NULL DEFAULT 0,

  children_worked_with    text[] NOT NULL DEFAULT '{}',
  skills_offered          text[] NOT NULL DEFAULT '{}',
  issues_found            text[] NOT NULL DEFAULT '{}',
  actions_taken           text[] NOT NULL DEFAULT '{}',

  managed_by              text NOT NULL DEFAULT '',
  notes                   text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_volunteers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vol_home_isolation ON cs_volunteers;
CREATE POLICY vol_home_isolation ON cs_volunteers
  USING  (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_vol_home_status ON cs_volunteers(home_id, volunteer_status);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 159 (volunteers) idempotent skip: %', SQLERRM;
END $$;
