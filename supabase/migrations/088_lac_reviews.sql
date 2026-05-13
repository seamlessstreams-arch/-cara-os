-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — LAC REVIEWS
-- CHR 2015 Reg 45 (review of quality of care),
-- Care Planning Regs 2010, IRO Handbook.
-- Tables: cs_lac_reviews
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_lac_reviews (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                    text NOT NULL,
  child_id                      uuid NOT NULL,
  review_type                   text NOT NULL,
  review_date                   date NOT NULL,
  next_review_due               date,
  status                        text NOT NULL DEFAULT 'scheduled',
  iro_name                      text NOT NULL,
  child_participation           text NOT NULL DEFAULT 'did_not_participate',
  child_views_recorded          boolean NOT NULL DEFAULT false,
  parent_attended               boolean NOT NULL DEFAULT false,
  social_worker_attended        boolean NOT NULL DEFAULT false,
  key_worker_attended           boolean NOT NULL DEFAULT false,
  outcome                       text,
  recommendations               jsonb NOT NULL DEFAULT '[]',
  actions_agreed                jsonb NOT NULL DEFAULT '[]',
  placement_stability_discussed boolean NOT NULL DEFAULT false,
  permanence_plan_reviewed      boolean NOT NULL DEFAULT false,
  health_reviewed               boolean NOT NULL DEFAULT false,
  education_reviewed            boolean NOT NULL DEFAULT false,
  within_timescale              boolean NOT NULL DEFAULT true,
  notes                         text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lac_reviews_home     ON cs_lac_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_lac_reviews_child    ON cs_lac_reviews(child_id);
CREATE INDEX IF NOT EXISTS idx_lac_reviews_date     ON cs_lac_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_lac_reviews_status   ON cs_lac_reviews(status);
CREATE INDEX IF NOT EXISTS idx_lac_reviews_type     ON cs_lac_reviews(review_type);

ALTER TABLE cs_lac_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own LAC reviews"
    ON cs_lac_reviews FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
