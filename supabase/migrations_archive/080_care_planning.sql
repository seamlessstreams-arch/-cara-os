-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CARE PLANNING
-- CHR 2015 Reg 14 (care planning — placement plan),
-- Reg 6 (quality of care — meeting needs in plans).
-- Tables: cs_care_plans, cs_plan_objectives, cs_plan_reviews
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_care_plans ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_care_plans (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id               uuid NOT NULL,
  child_name             text NOT NULL,
  plan_type              text NOT NULL,
  status                 text NOT NULL DEFAULT 'current',
  start_date             date NOT NULL,
  next_review_date       date NOT NULL,
  last_reviewed_date     date,
  social_worker          text NOT NULL,
  key_worker             text NOT NULL,
  objectives_count       integer NOT NULL DEFAULT 0,
  objectives_completed   integer NOT NULL DEFAULT 0,
  objectives_at_risk     integer NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_plans_home     ON cs_care_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_child    ON cs_care_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_type     ON cs_care_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_care_plans_status   ON cs_care_plans(status);
CREATE INDEX IF NOT EXISTS idx_care_plans_review   ON cs_care_plans(next_review_date);

ALTER TABLE cs_care_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own care plans"
    ON cs_care_plans FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_plan_objectives ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_plan_objectives (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_id                uuid NOT NULL REFERENCES cs_care_plans(id) ON DELETE CASCADE,
  child_id               uuid NOT NULL,
  child_name             text NOT NULL,
  objective              text NOT NULL,
  target_date            date NOT NULL,
  status                 text NOT NULL DEFAULT 'not_started',
  responsible_person     text NOT NULL,
  progress_notes         jsonb NOT NULL DEFAULT '[]',
  evidence               jsonb NOT NULL DEFAULT '[]',
  date_completed         date,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_objectives_home    ON cs_plan_objectives(home_id);
CREATE INDEX IF NOT EXISTS idx_plan_objectives_plan    ON cs_plan_objectives(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_objectives_child   ON cs_plan_objectives(child_id);
CREATE INDEX IF NOT EXISTS idx_plan_objectives_status  ON cs_plan_objectives(status);

ALTER TABLE cs_plan_objectives ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own plan objectives"
    ON cs_plan_objectives FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_plan_reviews ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_plan_reviews (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_id                uuid NOT NULL REFERENCES cs_care_plans(id) ON DELETE CASCADE,
  child_id               uuid NOT NULL,
  child_name             text NOT NULL,
  review_type            text NOT NULL,
  review_date            date NOT NULL,
  chaired_by             text NOT NULL,
  attendees              jsonb NOT NULL DEFAULT '[]',
  child_participated     boolean NOT NULL DEFAULT false,
  child_views_recorded   boolean NOT NULL DEFAULT false,
  outcome                text NOT NULL,
  actions                jsonb NOT NULL DEFAULT '[]',
  next_review_date       date NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_reviews_home    ON cs_plan_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_plan    ON cs_plan_reviews(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_child   ON cs_plan_reviews(child_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_date    ON cs_plan_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_type    ON cs_plan_reviews(review_type);

ALTER TABLE cs_plan_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own plan reviews"
    ON cs_plan_reviews FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
