-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 061 Independent Visitors
-- IV assignments, visit records, child engagement tracking.
-- Children Act 1989 s23ZB (independent visitors),
-- CHR 2015 Reg 44 (independent person), IRO Handbook 2010.
-- Tables: cs_independent_visitor_assignments, cs_independent_visitor_visits
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_independent_visitor_assignments ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_independent_visitor_assignments (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              UUID NOT NULL,
  child_name            TEXT NOT NULL,
  visitor_name          TEXT NOT NULL,
  visitor_organisation  TEXT,
  visitor_contact       TEXT,
  dbs_check_date        DATE,
  dbs_reference         TEXT,
  assignment_date       DATE NOT NULL,
  assignment_reason     TEXT NOT NULL,
  visit_frequency       TEXT NOT NULL DEFAULT 'monthly',
  last_visit_date       DATE,
  next_visit_due        DATE,
  status                TEXT NOT NULL DEFAULT 'active',
  end_date              DATE,
  end_reason            TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_independent_visitor_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "iv_assignments_home" ON cs_independent_visitor_assignments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_iv_assignments_home
  ON cs_independent_visitor_assignments(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_iv_assignments_status
  ON cs_independent_visitor_assignments(status, next_visit_due);

-- ── cs_independent_visitor_visits ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_independent_visitor_visits (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                UUID NOT NULL,
  child_name              TEXT NOT NULL,
  assignment_id           UUID NOT NULL REFERENCES cs_independent_visitor_assignments(id) ON DELETE CASCADE,
  visit_date              DATE NOT NULL,
  visit_duration_minutes  INT,
  visit_type              TEXT NOT NULL,
  visitor_name            TEXT NOT NULL,
  location                TEXT,
  child_attended          BOOLEAN NOT NULL DEFAULT TRUE,
  child_views             TEXT,
  topics_discussed        JSONB DEFAULT '[]',
  concerns_raised         BOOLEAN NOT NULL DEFAULT FALSE,
  concern_details         TEXT,
  concerns_escalated      BOOLEAN NOT NULL DEFAULT FALSE,
  escalated_to            TEXT,
  child_wishes_recorded   BOOLEAN NOT NULL DEFAULT FALSE,
  child_wishes            TEXT,
  next_visit_date         DATE,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_independent_visitor_visits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "iv_visits_home" ON cs_independent_visitor_visits
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_iv_visits_assignment
  ON cs_independent_visitor_visits(assignment_id, visit_date);

CREATE INDEX IF NOT EXISTS idx_iv_visits_home
  ON cs_independent_visitor_visits(home_id, child_id);
