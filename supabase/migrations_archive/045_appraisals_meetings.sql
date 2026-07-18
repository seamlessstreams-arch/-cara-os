-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 045 Staff Appraisals + Children's Meetings & Consultation
-- Appraisals: Reg 32 (fitness of workers), Reg 33 (employment of staff)
-- Meetings: Reg 7 (wishes & feelings), Reg 16 (consultation with children)
-- Tables: cs_staff_appraisals, cs_performance_goals, cs_house_meetings,
--         cs_consultation_records
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_staff_appraisals ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_staff_appraisals (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                UUID NOT NULL,
  staff_name              TEXT NOT NULL,
  appraisal_type          TEXT NOT NULL DEFAULT 'annual',
  appraisal_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  appraiser               TEXT NOT NULL,
  period_from             DATE NOT NULL,
  period_to               DATE NOT NULL,
  overall_rating          TEXT NOT NULL DEFAULT 'good',
  strengths               JSONB NOT NULL DEFAULT '[]',
  areas_for_development   JSONB NOT NULL DEFAULT '[]',
  objectives              JSONB NOT NULL DEFAULT '[]',
  training_needs          JSONB NOT NULL DEFAULT '[]',
  supervision_frequency   TEXT NOT NULL DEFAULT 'monthly',
  fitness_confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
  next_appraisal_date     DATE,
  notes                   TEXT,
  status                  TEXT NOT NULL DEFAULT 'scheduled',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_appraisals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "staff_appraisals_home" ON cs_staff_appraisals
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_staff_appraisals_home
  ON cs_staff_appraisals(home_id);

CREATE INDEX IF NOT EXISTS idx_staff_appraisals_staff
  ON cs_staff_appraisals(staff_id, appraisal_date);

CREATE INDEX IF NOT EXISTS idx_staff_appraisals_status
  ON cs_staff_appraisals(status);

-- ── cs_performance_goals ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_performance_goals (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                UUID NOT NULL,
  staff_name              TEXT NOT NULL,
  goal_description        TEXT NOT NULL,
  category                TEXT NOT NULL,
  target_date             DATE NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active',
  progress_notes          JSONB NOT NULL DEFAULT '[]',
  linked_appraisal_id     UUID REFERENCES cs_staff_appraisals(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_performance_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "performance_goals_home" ON cs_performance_goals
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_performance_goals_home
  ON cs_performance_goals(home_id);

CREATE INDEX IF NOT EXISTS idx_performance_goals_staff
  ON cs_performance_goals(staff_id, status);

-- ── cs_house_meetings ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_house_meetings (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  meeting_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  meeting_type            TEXT NOT NULL DEFAULT 'house_meeting',
  facilitated_by          TEXT NOT NULL,
  children_present        JSONB NOT NULL DEFAULT '[]',
  children_absent         JSONB NOT NULL DEFAULT '[]',
  agenda_items            JSONB NOT NULL DEFAULT '[]',
  actions                 JSONB NOT NULL DEFAULT '[]',
  child_feedback_summary  TEXT NOT NULL DEFAULT '',
  staff_response          TEXT NOT NULL DEFAULT '',
  next_meeting_date       DATE,
  minutes_approved        BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_house_meetings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "house_meetings_home" ON cs_house_meetings
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_house_meetings_home
  ON cs_house_meetings(home_id, meeting_date);

-- ── cs_consultation_records ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_consultation_records (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                UUID NOT NULL,
  child_name              TEXT NOT NULL,
  consultation_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  consultation_type       TEXT NOT NULL,
  topic                   TEXT NOT NULL,
  child_views             TEXT NOT NULL DEFAULT '',
  outcome                 TEXT NOT NULL DEFAULT '',
  action_taken            TEXT,
  consulted_by            TEXT NOT NULL,
  impact_rating           TEXT NOT NULL DEFAULT 'no_impact',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_consultation_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "consultation_records_home" ON cs_consultation_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultation_records_home
  ON cs_consultation_records(home_id);

CREATE INDEX IF NOT EXISTS idx_consultation_records_child
  ON cs_consultation_records(child_id, consultation_date);
