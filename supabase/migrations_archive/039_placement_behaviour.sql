-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PLACEMENT & CARE PLANNING + BEHAVIOUR SUPPORT
-- Migration 039: Placement plans, LAC reviews, behaviour entries with ABC
-- analysis, physical intervention tracking, and rewards/sanctions.
-- Reg 11/12/14 (care planning) and Reg 19/20 (behaviour/restraint).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Placement plans ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_placement_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            uuid NOT NULL,
  plan_type           text NOT NULL
                        CHECK (plan_type IN (
                          'placement_plan','care_plan','pathway_plan',
                          'behaviour_support_plan','risk_management_plan',
                          'education_plan','health_plan','missing_protocol'
                        )),
  title               text NOT NULL,
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','under_review','superseded','archived')),
  version             integer NOT NULL DEFAULT 1,
  sections            jsonb NOT NULL DEFAULT '[]'::jsonb,
  objectives          jsonb NOT NULL DEFAULT '[]'::jsonb,
  placing_authority   text NOT NULL DEFAULT '',
  social_worker_name  text,
  iro_name            text,
  created_by          uuid NOT NULL,
  approved_by         uuid,
  approved_date       date,
  review_date         date,
  next_review_date    date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_home     ON cs_placement_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_plan_child    ON cs_placement_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_plan_type     ON cs_placement_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_status   ON cs_placement_plans(status);

-- ── LAC reviews ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_lac_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  review_type           text NOT NULL
                          CHECK (review_type IN ('initial','first_review','subsequent')),
  review_date           date NOT NULL,
  chaired_by            text NOT NULL,
  attendees             jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcomes              jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions               jsonb NOT NULL DEFAULT '[]'::jsonb,
  child_participated    boolean NOT NULL DEFAULT false,
  child_views_recorded  boolean NOT NULL DEFAULT false,
  plan_changes          jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date      date,
  minutes_recorded      boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','completed','cancelled')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lac_home     ON cs_lac_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_lac_child    ON cs_lac_reviews(child_id);
CREATE INDEX IF NOT EXISTS idx_lac_date     ON cs_lac_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_lac_status   ON cs_lac_reviews(status);

-- ── Behaviour entries ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_behaviour_entries (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                uuid NOT NULL,
  date                    date NOT NULL,
  time                    time NOT NULL,
  category                text NOT NULL
                            CHECK (category IN (
                              'positive','concerning','escalating','crisis',
                              'self_harm','aggression','absconding',
                              'property_damage','verbal_aggression','substance_use'
                            )),
  description             text NOT NULL,
  antecedent              text,
  behaviour               text NOT NULL,
  consequence             text,
  de_escalation_used      jsonb NOT NULL DEFAULT '[]'::jsonb,
  de_escalation_effective boolean NOT NULL DEFAULT false,
  physical_intervention   boolean NOT NULL DEFAULT false,
  pi_technique            text,
  pi_duration_minutes     integer,
  pi_staff_involved       jsonb NOT NULL DEFAULT '[]'::jsonb,
  pi_injuries_child       boolean NOT NULL DEFAULT false,
  pi_injuries_staff       boolean NOT NULL DEFAULT false,
  pi_debrief_completed    boolean NOT NULL DEFAULT false,
  pi_debrief_date         date,
  outcome                 text,
  recorded_by             uuid NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behav_home     ON cs_behaviour_entries(home_id);
CREATE INDEX IF NOT EXISTS idx_behav_child    ON cs_behaviour_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_behav_date     ON cs_behaviour_entries(date);
CREATE INDEX IF NOT EXISTS idx_behav_category ON cs_behaviour_entries(category);
CREATE INDEX IF NOT EXISTS idx_behav_pi       ON cs_behaviour_entries(physical_intervention);

-- ── Rewards and sanctions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_rewards_sanctions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id        uuid NOT NULL,
  type            text NOT NULL CHECK (type IN ('reward','sanction')),
  subtype         text NOT NULL,
  reason          text NOT NULL,
  date            date NOT NULL,
  given_by        uuid NOT NULL,
  child_response  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rs_home    ON cs_rewards_sanctions(home_id);
CREATE INDEX IF NOT EXISTS idx_rs_child   ON cs_rewards_sanctions(child_id);
CREATE INDEX IF NOT EXISTS idx_rs_type    ON cs_rewards_sanctions(type);
CREATE INDEX IF NOT EXISTS idx_rs_date    ON cs_rewards_sanctions(date);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_placement_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_lac_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_behaviour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_rewards_sanctions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY plan_home_policy ON cs_placement_plans
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY lac_home_policy ON cs_lac_reviews
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY behav_home_policy ON cs_behaviour_entries
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY rs_home_policy ON cs_rewards_sanctions
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
