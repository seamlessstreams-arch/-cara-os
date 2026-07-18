-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 057 Multi-Agency Working
-- Professional contacts register, LAC review tracking, professional meetings.
-- CHR 2015 Reg 5 (engagement with parents & others), Reg 13 (leadership),
-- Working Together to Safeguard Children 2018.
-- Tables: cs_professional_contacts, cs_lac_reviews, cs_professional_meetings
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_professional_contacts ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_professional_contacts (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                UUID,
  child_name              TEXT,
  professional_name       TEXT NOT NULL,
  role                    TEXT NOT NULL,
  organisation            TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  is_primary_contact      BOOLEAN NOT NULL DEFAULT FALSE,
  relationship_start_date DATE,
  last_contact_date       DATE,
  next_contact_due        DATE,
  status                  TEXT NOT NULL DEFAULT 'active',
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_professional_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "professional_contacts_home" ON cs_professional_contacts
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_professional_contacts_home
  ON cs_professional_contacts(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_professional_contacts_role
  ON cs_professional_contacts(role, status);

-- ── cs_lac_reviews ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_lac_reviews (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                    UUID NOT NULL,
  child_name                  TEXT NOT NULL,
  review_date                 DATE NOT NULL,
  review_type                 TEXT NOT NULL,
  chaired_by                  TEXT NOT NULL,
  venue                       TEXT,
  child_attended              BOOLEAN NOT NULL DEFAULT FALSE,
  child_contributed           BOOLEAN NOT NULL DEFAULT FALSE,
  contribution_method         TEXT,
  care_plan_agreed            BOOLEAN NOT NULL DEFAULT FALSE,
  placement_confirmed         BOOLEAN NOT NULL DEFAULT FALSE,
  key_decisions               JSONB NOT NULL DEFAULT '[]',
  actions                     JSONB NOT NULL DEFAULT '[]',
  next_review_date            DATE,
  next_review_type            TEXT,
  home_report_submitted       BOOLEAN NOT NULL DEFAULT FALSE,
  home_report_submitted_date  DATE,
  status                      TEXT NOT NULL DEFAULT 'scheduled',
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_lac_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "lac_reviews_home" ON cs_lac_reviews
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_lac_reviews_home
  ON cs_lac_reviews(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_lac_reviews_date
  ON cs_lac_reviews(review_date, status);

-- ── cs_professional_meetings ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_professional_meetings (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID,
  child_name          TEXT,
  meeting_date        DATE NOT NULL,
  meeting_type        TEXT NOT NULL,
  purpose             TEXT NOT NULL DEFAULT '',
  location            TEXT,
  attendees           JSONB NOT NULL DEFAULT '[]',
  apologies           JSONB DEFAULT '[]',
  home_representative TEXT NOT NULL,
  key_decisions       JSONB DEFAULT '[]',
  actions             JSONB DEFAULT '[]',
  follow_up_date      DATE,
  follow_up_completed BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'scheduled',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_professional_meetings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "professional_meetings_home" ON cs_professional_meetings
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_professional_meetings_home
  ON cs_professional_meetings(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_professional_meetings_type
  ON cs_professional_meetings(meeting_type, meeting_date);
