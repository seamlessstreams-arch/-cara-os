-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — TRANSITION PLANNING
-- CHR 2015 Reg 12 (preparing children), Reg 36 (notification), Reg 14 (care)
-- Tables: cs_transition_plans, cs_transition_reviews
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_transition_plans ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_transition_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id              text NOT NULL,
  child_name            text NOT NULL,
  transition_type       text NOT NULL,
  planned_date          date NOT NULL,
  actual_date           date,
  destination           text,
  destination_type      text,
  reason                text NOT NULL DEFAULT '',
  status                text NOT NULL DEFAULT 'planned',
  social_worker_name    text,
  social_worker_notified boolean NOT NULL DEFAULT false,
  iro_notified          boolean NOT NULL DEFAULT false,
  parent_notified       boolean NOT NULL DEFAULT false,
  child_views_sought    boolean NOT NULL DEFAULT false,
  child_views           text,
  readiness_assessment  jsonb NOT NULL DEFAULT '[]',
  goals                 jsonb NOT NULL DEFAULT '[]',
  handover_completed    boolean NOT NULL DEFAULT false,
  handover_date         date,
  handover_to           text,
  records_transferred   boolean NOT NULL DEFAULT false,
  follow_up_date        date,
  follow_up_completed   boolean NOT NULL DEFAULT false,
  ofsted_notified       boolean NOT NULL DEFAULT false,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transition_plans_home   ON cs_transition_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_transition_plans_child  ON cs_transition_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_transition_plans_status ON cs_transition_plans(status);
CREATE INDEX IF NOT EXISTS idx_transition_plans_type   ON cs_transition_plans(transition_type);

ALTER TABLE cs_transition_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own transition plans"
    ON cs_transition_plans FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_transition_reviews ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_transition_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_id           uuid NOT NULL REFERENCES cs_transition_plans(id) ON DELETE CASCADE,
  child_id          text NOT NULL,
  child_name        text NOT NULL,
  review_date       date NOT NULL,
  reviewer          text NOT NULL,
  progress_summary  text NOT NULL DEFAULT '',
  goals_reviewed    integer NOT NULL DEFAULT 0,
  goals_on_track    integer NOT NULL DEFAULT 0,
  child_views       text,
  concerns          text,
  next_steps        text,
  next_review_date  date,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transition_reviews_home ON cs_transition_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_transition_reviews_plan ON cs_transition_reviews(plan_id);

ALTER TABLE cs_transition_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own transition reviews"
    ON cs_transition_reviews FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
