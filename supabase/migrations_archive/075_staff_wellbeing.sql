-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — STAFF WELLBEING
-- CHR 2015 Reg 33 (employment of staff — support and welfare),
-- Reg 34 (employment policies), Health and Safety at Work Act 1974.
-- Tables: cs_wellbeing_checks, cs_debrief_records
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_wellbeing_checks ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_wellbeing_checks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_member          text NOT NULL,
  check_date            date NOT NULL,
  checked_by            text NOT NULL,
  wellbeing_rating      text NOT NULL,
  stress_level          text NOT NULL,
  workload_manageable   boolean NOT NULL DEFAULT true,
  sleep_quality         text NOT NULL DEFAULT 'good',
  feeling_supported     boolean NOT NULL DEFAULT true,
  concerns              text,
  support_offered       jsonb NOT NULL DEFAULT '[]',
  support_accepted      boolean NOT NULL DEFAULT false,
  follow_up_date        date,
  follow_up_completed   boolean NOT NULL DEFAULT false,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellbeing_checks_home     ON cs_wellbeing_checks(home_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_checks_staff    ON cs_wellbeing_checks(staff_member);
CREATE INDEX IF NOT EXISTS idx_wellbeing_checks_date     ON cs_wellbeing_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_wellbeing_checks_rating   ON cs_wellbeing_checks(wellbeing_rating);

ALTER TABLE cs_wellbeing_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own wellbeing checks"
    ON cs_wellbeing_checks FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_debrief_records ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_debrief_records (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  debrief_date              date NOT NULL,
  staff_members             jsonb NOT NULL DEFAULT '[]',
  facilitated_by            text NOT NULL,
  trigger                   text NOT NULL,
  incident_date             date NOT NULL,
  incident_summary          text NOT NULL,
  emotional_impact          text,
  lessons_learned           text,
  support_needs_identified  text,
  actions_agreed            jsonb NOT NULL DEFAULT '[]',
  follow_up_required        boolean NOT NULL DEFAULT false,
  follow_up_date            date,
  follow_up_completed       boolean NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debrief_records_home      ON cs_debrief_records(home_id);
CREATE INDEX IF NOT EXISTS idx_debrief_records_date      ON cs_debrief_records(debrief_date);
CREATE INDEX IF NOT EXISTS idx_debrief_records_trigger   ON cs_debrief_records(trigger);

ALTER TABLE cs_debrief_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own debrief records"
    ON cs_debrief_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
