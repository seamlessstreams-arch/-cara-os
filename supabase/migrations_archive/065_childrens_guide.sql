-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S GUIDE
-- CHR 2015 Reg 16(2) (children's guide), Reg 16(3) (age-appropriate,
-- kept under review). SCCIF Children's Experiences.
-- Tables: cs_childrens_guides, cs_guide_distributions, cs_guide_feedback
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_childrens_guides ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_childrens_guides (
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
  sections_included jsonb NOT NULL DEFAULT '[]',
  formats_available jsonb NOT NULL DEFAULT '["standard_print"]',
  languages_available jsonb NOT NULL DEFAULT '["English"]',
  age_range_minimum integer,
  age_range_maximum integer,
  key_contacts      jsonb NOT NULL DEFAULT '[]',
  ofsted_contact    text NOT NULL DEFAULT '',
  childrens_commissioner_contact text NOT NULL DEFAULT '',
  advocacy_service_contact text NOT NULL DEFAULT '',
  complaints_summary text NOT NULL DEFAULT '',
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guides_home   ON cs_childrens_guides(home_id);
CREATE INDEX IF NOT EXISTS idx_guides_status ON cs_childrens_guides(status);

ALTER TABLE cs_childrens_guides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own childrens guides"
    ON cs_childrens_guides FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_guide_distributions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_guide_distributions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  guide_id              uuid NOT NULL REFERENCES cs_childrens_guides(id) ON DELETE CASCADE,
  child_id              text NOT NULL,
  child_name            text NOT NULL,
  distribution_date     date NOT NULL,
  format_provided       text NOT NULL DEFAULT 'standard_print',
  language_provided     text NOT NULL DEFAULT 'English',
  distributed_by        text NOT NULL,
  child_confirmed_receipt boolean NOT NULL DEFAULT false,
  child_confirmed_understanding boolean NOT NULL DEFAULT false,
  discussed_with_child  boolean NOT NULL DEFAULT false,
  discussion_date       date,
  discussed_by          text,
  follow_up_needed      boolean NOT NULL DEFAULT false,
  follow_up_notes       text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guide_dist_home   ON cs_guide_distributions(home_id);
CREATE INDEX IF NOT EXISTS idx_guide_dist_guide  ON cs_guide_distributions(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_dist_child  ON cs_guide_distributions(child_id);

ALTER TABLE cs_guide_distributions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own guide distributions"
    ON cs_guide_distributions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_guide_feedback ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_guide_feedback (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  guide_id              uuid NOT NULL REFERENCES cs_childrens_guides(id) ON DELETE CASCADE,
  child_id              text NOT NULL,
  child_name            text NOT NULL,
  feedback_date         date NOT NULL,
  rating                text NOT NULL,
  what_was_helpful      text,
  what_could_improve    text,
  sections_found_confusing jsonb NOT NULL DEFAULT '[]',
  suggestions           text,
  collected_by          text NOT NULL,
  action_taken          text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guide_fb_home   ON cs_guide_feedback(home_id);
CREATE INDEX IF NOT EXISTS idx_guide_fb_guide  ON cs_guide_feedback(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_fb_child  ON cs_guide_feedback(child_id);

ALTER TABLE cs_guide_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own guide feedback"
    ON cs_guide_feedback FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
