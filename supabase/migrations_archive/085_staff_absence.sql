-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — STAFF ABSENCE
-- CHR 2015 Reg 34 (employment of staff — fitness to work),
-- Reg 33 (employment of staff — sufficient and suitable).
-- Tables: cs_staff_absences
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_staff_absences (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name                  text NOT NULL,
  staff_role                  text NOT NULL,
  absence_type                text NOT NULL,
  sickness_reason             text,
  start_date                  date NOT NULL,
  end_date                    date,
  days_lost                   integer NOT NULL DEFAULT 0,
  status                      text NOT NULL DEFAULT 'current',
  covered_by                  text,
  agency_cover_used           boolean NOT NULL DEFAULT false,
  return_to_work_status       text NOT NULL DEFAULT 'not_required',
  return_to_work_date         date,
  return_to_work_notes        text,
  occupational_health_referral boolean NOT NULL DEFAULT false,
  impact_on_children          text,
  fit_note_received           boolean NOT NULL DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_absences_home     ON cs_staff_absences(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_absences_type     ON cs_staff_absences(absence_type);
CREATE INDEX IF NOT EXISTS idx_staff_absences_status   ON cs_staff_absences(status);
CREATE INDEX IF NOT EXISTS idx_staff_absences_start    ON cs_staff_absences(start_date);
CREATE INDEX IF NOT EXISTS idx_staff_absences_staff    ON cs_staff_absences(staff_name);

ALTER TABLE cs_staff_absences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own absence records"
    ON cs_staff_absences FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
