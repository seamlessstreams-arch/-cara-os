-- ══════════════════════════════════════════════════════════════════════════════
-- 027: ARIA "Writing to the Child" — trauma-informed child-friendly records
--
-- Stores dual-output versions (management + child-friendly) with Child Lens
-- Check scores, approach tracking, and full audit trail for Reg 44/45 and QA.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_write_to_child (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID REFERENCES homes(id) ON DELETE CASCADE,

  -- Source record linking
  source_type       TEXT NOT NULL
                      CHECK (source_type IN (
                        'incident', 'complaint', 'missing_from_care',
                        'weekly_summary', 'direct_work', 'management_oversight',
                        'key_work_session'
                      )),
  source_record_id  TEXT NOT NULL,

  -- Child context
  child_id          UUID REFERENCES young_people(id),
  child_name        TEXT NOT NULL,
  child_age         SMALLINT,

  -- Dual output
  source_text       TEXT,                  -- Original management/professional text
  management_version TEXT NOT NULL,        -- Full management oversight version
  child_version     TEXT,                  -- Child-understandable version

  -- Child Lens Check scoring
  child_lens_score  JSONB,                 -- {overall, clarity, dignity, jargonRisk, blameRisk, explanationOfConcern, supportOffered, flags[]}

  -- Approaches used
  approaches_used   TEXT[] DEFAULT ARRAY['PACE', 'ARC', 'Trauma-Informed'],

  -- Approval workflow
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'reviewed', 'approved', 'committed', 'rejected')),

  generated_by      TEXT DEFAULT 'aria',   -- 'aria' or user UUID
  reviewed_by       UUID REFERENCES staff(id),
  reviewed_at       TIMESTAMPTZ,
  approved_by       UUID REFERENCES staff(id),
  approved_at       TIMESTAMPTZ,
  approval_notes    TEXT,

  -- Edit tracking
  edited_version    TEXT,                  -- If human edited the child version
  edited_by         UUID REFERENCES staff(id),
  edited_at         TIMESTAMPTZ,

  -- Audit fields (Reg 44, Reg 45, QA)
  reg44_included    BOOLEAN DEFAULT false, -- Flagged for Reg 44 visit evidence
  reg45_included    BOOLEAN DEFAULT false, -- Flagged for Reg 45 report evidence
  qa_reviewed       BOOLEAN DEFAULT false, -- Reviewed by QA process
  qa_reviewed_by    UUID REFERENCES staff(id),
  qa_reviewed_at    TIMESTAMPTZ,
  qa_notes          TEXT,

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_wtc_source
  ON aria_write_to_child (source_type, source_record_id);
CREATE INDEX IF NOT EXISTS idx_wtc_child
  ON aria_write_to_child (child_id) WHERE child_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wtc_status
  ON aria_write_to_child (status);
CREATE INDEX IF NOT EXISTS idx_wtc_home
  ON aria_write_to_child (home_id);
CREATE INDEX IF NOT EXISTS idx_wtc_created
  ON aria_write_to_child (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wtc_reg44
  ON aria_write_to_child (reg44_included) WHERE reg44_included = true;
CREATE INDEX IF NOT EXISTS idx_wtc_reg45
  ON aria_write_to_child (reg45_included) WHERE reg45_included = true;
