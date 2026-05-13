-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ENVIRONMENTAL SAFETY
-- CHR 2015 Reg 25 (premises safety and suitability),
-- Reg 44 (fire safety), Health and Safety at Work Act 1974.
-- Tables: cs_safety_checks, cs_fire_drills
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_safety_checks ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_safety_checks (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  category                text NOT NULL,
  check_name              text NOT NULL,
  check_date              date NOT NULL,
  checked_by              text NOT NULL,
  frequency               text NOT NULL,
  next_due_date           date NOT NULL,
  compliance_status       text NOT NULL DEFAULT 'compliant',
  findings                text,
  remedial_actions        jsonb NOT NULL DEFAULT '[]',
  certificate_reference   text,
  certificate_expiry      date,
  certificate_status      text NOT NULL DEFAULT 'valid',
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_checks_home       ON cs_safety_checks(home_id);
CREATE INDEX IF NOT EXISTS idx_safety_checks_category   ON cs_safety_checks(category);
CREATE INDEX IF NOT EXISTS idx_safety_checks_status     ON cs_safety_checks(compliance_status);
CREATE INDEX IF NOT EXISTS idx_safety_checks_due        ON cs_safety_checks(next_due_date);

ALTER TABLE cs_safety_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own safety checks"
    ON cs_safety_checks FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_fire_drills ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_fire_drills (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  drill_date                date NOT NULL,
  drill_time                text NOT NULL,
  drill_type                text NOT NULL DEFAULT 'planned',
  evacuation_time_seconds   integer NOT NULL,
  all_evacuated             boolean NOT NULL DEFAULT true,
  children_present          integer NOT NULL DEFAULT 0,
  staff_present             integer NOT NULL DEFAULT 0,
  visitors_present          integer NOT NULL DEFAULT 0,
  assembly_point_used       text NOT NULL,
  issues_identified         text,
  actions_required          text,
  conducted_by              text NOT NULL,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fire_drills_home   ON cs_fire_drills(home_id);
CREATE INDEX IF NOT EXISTS idx_fire_drills_date   ON cs_fire_drills(drill_date);

ALTER TABLE cs_fire_drills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own fire drills"
    ON cs_fire_drills FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
