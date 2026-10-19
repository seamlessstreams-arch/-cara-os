-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DISCHARGE & TRANSITION REVIEWS
-- CHR 2015 Reg 36 (fitness of premises — move planning),
-- Reg 37 (fitness of workers — discharge support),
-- Children Act 1989 s23C/23CZA (continuing care/support).
-- Tables: cs_discharge_reviews
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_discharge_reviews (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                text NOT NULL,
  child_id                  uuid NOT NULL,
  discharge_reason          text NOT NULL,
  planned_date              date NOT NULL,
  actual_date               date,
  readiness_level           text NOT NULL DEFAULT 'not_assessed',
  review_status             text NOT NULL DEFAULT 'scheduled',
  review_date               date,
  reviewed_by               text,
  destination               text,
  support_packages          jsonb NOT NULL DEFAULT '[]',
  child_views_recorded      boolean NOT NULL DEFAULT false,
  child_wants_to_leave      boolean,
  social_worker_involved    boolean NOT NULL DEFAULT false,
  family_consulted          boolean NOT NULL DEFAULT false,
  education_plan_in_place   boolean NOT NULL DEFAULT false,
  health_needs_transferred  boolean NOT NULL DEFAULT false,
  life_story_work_complete  boolean NOT NULL DEFAULT false,
  goodbye_event_planned     boolean NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discharge_home      ON cs_discharge_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_discharge_child     ON cs_discharge_reviews(child_id);
CREATE INDEX IF NOT EXISTS idx_discharge_reason    ON cs_discharge_reviews(discharge_reason);
CREATE INDEX IF NOT EXISTS idx_discharge_readiness ON cs_discharge_reviews(readiness_level);
CREATE INDEX IF NOT EXISTS idx_discharge_status    ON cs_discharge_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_discharge_date      ON cs_discharge_reviews(planned_date);

ALTER TABLE cs_discharge_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own discharge reviews"
    ON cs_discharge_reviews FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
