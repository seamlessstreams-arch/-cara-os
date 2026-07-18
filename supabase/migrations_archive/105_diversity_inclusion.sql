-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DIVERSITY & INCLUSION
-- CHR 2015 Reg 6 (quality of care — individual needs),
-- Reg 11 (positive relationships — respecting diversity),
-- Equality Act 2010 (protected characteristics).
-- Tables: cs_diversity_records
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_diversity_records (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                text NOT NULL,
  child_id                  uuid NOT NULL,
  protected_characteristic  text NOT NULL,
  characteristic_detail     text NOT NULL,
  support_category          text NOT NULL,
  support_description       text NOT NULL,
  support_status            text NOT NULL DEFAULT 'under_review',
  review_outcome            text NOT NULL DEFAULT 'not_reviewed',
  reviewed_date             date,
  next_review_date          date,
  child_views               text,
  child_satisfied           boolean,
  staff_aware               boolean NOT NULL DEFAULT false,
  staff_trained             boolean NOT NULL DEFAULT false,
  external_support          text,
  equality_impact_assessed  boolean NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diversity_home    ON cs_diversity_records(home_id);
CREATE INDEX IF NOT EXISTS idx_diversity_child   ON cs_diversity_records(child_id);
CREATE INDEX IF NOT EXISTS idx_diversity_char    ON cs_diversity_records(protected_characteristic);
CREATE INDEX IF NOT EXISTS idx_diversity_cat     ON cs_diversity_records(support_category);
CREATE INDEX IF NOT EXISTS idx_diversity_status  ON cs_diversity_records(support_status);

ALTER TABLE cs_diversity_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own diversity records"
    ON cs_diversity_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
