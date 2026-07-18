-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DAILY ROUTINES
-- CHR 2015 Reg 6 (quality and purpose of care — meeting needs),
-- Reg 9 (promoting positive behaviour through structure),
-- Reg 14 (care planning — daily living plans).
-- Tables: cs_daily_routines
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_daily_routines (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name              text NOT NULL,
  child_id                uuid NOT NULL,
  routine_date            date NOT NULL,
  routine_type            text NOT NULL DEFAULT 'weekday',
  routine_slot            text NOT NULL,
  scheduled_time          text NOT NULL,
  actual_time             text,
  compliance_rating       text NOT NULL DEFAULT 'fully_followed',
  adapted                 boolean NOT NULL DEFAULT false,
  adaptation_reason       text,
  child_engaged           boolean NOT NULL DEFAULT true,
  child_mood              text,
  staff_supporting        text NOT NULL,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routines_home       ON cs_daily_routines(home_id);
CREATE INDEX IF NOT EXISTS idx_routines_child      ON cs_daily_routines(child_id);
CREATE INDEX IF NOT EXISTS idx_routines_date       ON cs_daily_routines(routine_date);
CREATE INDEX IF NOT EXISTS idx_routines_type       ON cs_daily_routines(routine_type);
CREATE INDEX IF NOT EXISTS idx_routines_slot       ON cs_daily_routines(routine_slot);
CREATE INDEX IF NOT EXISTS idx_routines_compliance ON cs_daily_routines(compliance_rating);

ALTER TABLE cs_daily_routines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own daily routines"
    ON cs_daily_routines FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
