-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — STATEMENT OF PURPOSE
-- CHR 2015 Reg 16 (statement of purpose), Reg 28 (review and revision),
-- Reg 31 (notification to HMCI), Schedule 1 (content requirements)
-- Tables: cs_statements_of_purpose, cs_statement_reviews, cs_statement_amendments
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_statements_of_purpose ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_statements_of_purpose (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  version           text NOT NULL DEFAULT '1.0',
  title             text NOT NULL,
  effective_date    date NOT NULL,
  review_date       date NOT NULL,
  last_reviewed_date date,
  reviewed_by       text,
  approved_by       text,
  approval_date     date,
  status            text NOT NULL DEFAULT 'draft',
  range_of_needs    text NOT NULL DEFAULT '',
  ethos_and_philosophy text NOT NULL DEFAULT '',
  accommodation_details text NOT NULL DEFAULT '',
  location_details  text NOT NULL DEFAULT '',
  staffing_structure text NOT NULL DEFAULT '',
  fire_safety_arrangements text NOT NULL DEFAULT '',
  behaviour_management_approach text NOT NULL DEFAULT '',
  education_provision text NOT NULL DEFAULT '',
  health_arrangements text NOT NULL DEFAULT '',
  contact_arrangements text NOT NULL DEFAULT '',
  complaints_procedure text NOT NULL DEFAULT '',
  religious_cultural_needs text NOT NULL DEFAULT '',
  emergency_placement_procedure text,
  registered_manager text NOT NULL,
  responsible_individual text,
  ofsted_notification_date date,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sop_home   ON cs_statements_of_purpose(home_id);
CREATE INDEX IF NOT EXISTS idx_sop_status ON cs_statements_of_purpose(status);

ALTER TABLE cs_statements_of_purpose ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own statements of purpose"
    ON cs_statements_of_purpose FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_statement_reviews ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_statement_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  statement_id      uuid NOT NULL REFERENCES cs_statements_of_purpose(id) ON DELETE CASCADE,
  review_date       date NOT NULL,
  reviewer_name     text NOT NULL,
  reviewer_role     text NOT NULL,
  outcome           text NOT NULL,
  sections_reviewed jsonb NOT NULL DEFAULT '[]',
  changes_required  text,
  changes_made      text,
  next_review_date  date,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sop_reviews_home      ON cs_statement_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_sop_reviews_statement  ON cs_statement_reviews(statement_id);
CREATE INDEX IF NOT EXISTS idx_sop_reviews_date       ON cs_statement_reviews(review_date);

ALTER TABLE cs_statement_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own statement reviews"
    ON cs_statement_reviews FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_statement_amendments ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_statement_amendments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  statement_id      uuid NOT NULL REFERENCES cs_statements_of_purpose(id) ON DELETE CASCADE,
  amendment_date    date NOT NULL,
  amendment_type    text NOT NULL,
  amended_by        text NOT NULL,
  section_amended   text NOT NULL,
  previous_content  text NOT NULL DEFAULT '',
  new_content       text NOT NULL DEFAULT '',
  reason_for_change text NOT NULL DEFAULT '',
  approved_by       text,
  ofsted_notified   boolean NOT NULL DEFAULT false,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sop_amendments_home      ON cs_statement_amendments(home_id);
CREATE INDEX IF NOT EXISTS idx_sop_amendments_statement  ON cs_statement_amendments(statement_id);
CREATE INDEX IF NOT EXISTS idx_sop_amendments_date       ON cs_statement_amendments(amendment_date);

ALTER TABLE cs_statement_amendments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own statement amendments"
    ON cs_statement_amendments FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
