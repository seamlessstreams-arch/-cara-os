-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — COURT PROCEEDINGS
-- CHR 2015 Reg 38 (providing information to courts),
-- Reg 8 (parental responsibility — court orders),
-- Children Act 1989 (care proceedings).
-- Tables: cs_court_proceedings
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_court_proceedings (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  proceeding_type             text NOT NULL,
  proceeding_status           text NOT NULL DEFAULT 'active',
  court_name                  text NOT NULL,
  case_number                 text,
  start_date                  date NOT NULL,
  next_hearing_date           date,
  next_hearing_type           text,
  guardian_appointed          boolean NOT NULL DEFAULT false,
  guardian_name               text,
  solicitor_name              text,
  statement_status            text NOT NULL DEFAULT 'not_started',
  statement_deadline          date,
  la_social_worker            text NOT NULL,
  home_statement_required     boolean NOT NULL DEFAULT false,
  home_statement_submitted    boolean NOT NULL DEFAULT false,
  court_actions               jsonb NOT NULL DEFAULT '[]',
  child_views_sought          boolean NOT NULL DEFAULT false,
  child_wishes_communicated   boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_court_home     ON cs_court_proceedings(home_id);
CREATE INDEX IF NOT EXISTS idx_court_child    ON cs_court_proceedings(child_id);
CREATE INDEX IF NOT EXISTS idx_court_type     ON cs_court_proceedings(proceeding_type);
CREATE INDEX IF NOT EXISTS idx_court_status   ON cs_court_proceedings(proceeding_status);
CREATE INDEX IF NOT EXISTS idx_court_hearing  ON cs_court_proceedings(next_hearing_date);

ALTER TABLE cs_court_proceedings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own court proceedings"
    ON cs_court_proceedings FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
