-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — BUSINESS CONTINUITY PLANNING
-- CHR 2015 Reg 29 (business continuity), Reg 12 (protection from harm)
-- Tables: cs_business_continuity_plans, cs_business_continuity_tests
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_business_continuity_plans ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_business_continuity_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_type         text NOT NULL,
  title             text NOT NULL,
  description       text NOT NULL DEFAULT '',
  version           integer NOT NULL DEFAULT 1,
  risk_level        text NOT NULL DEFAULT 'medium',
  owner             text NOT NULL,
  approved_by       text,
  approval_date     date,
  effective_date    date NOT NULL,
  review_date       date NOT NULL,
  last_reviewed_date date,
  status            text NOT NULL DEFAULT 'draft',
  key_contacts      jsonb NOT NULL DEFAULT '[]',
  critical_functions jsonb NOT NULL DEFAULT '[]',
  recovery_time_objective_hours integer,
  recovery_procedures text NOT NULL DEFAULT '',
  communication_plan text,
  resource_requirements text,
  dependencies      text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bcp_plans_home    ON cs_business_continuity_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_bcp_plans_type    ON cs_business_continuity_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_bcp_plans_status  ON cs_business_continuity_plans(status);

ALTER TABLE cs_business_continuity_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own bcp plans"
    ON cs_business_continuity_plans FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_business_continuity_tests ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_business_continuity_tests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_id         uuid NOT NULL REFERENCES cs_business_continuity_plans(id) ON DELETE CASCADE,
  test_date       date NOT NULL,
  test_type       text NOT NULL,
  conducted_by    text NOT NULL,
  participants    jsonb NOT NULL DEFAULT '[]',
  scenario        text NOT NULL DEFAULT '',
  outcome         text NOT NULL DEFAULT 'passed',
  findings        text NOT NULL DEFAULT '',
  actions_required jsonb NOT NULL DEFAULT '[]',
  lessons_learned text,
  next_test_date  date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bcp_tests_home     ON cs_business_continuity_tests(home_id);
CREATE INDEX IF NOT EXISTS idx_bcp_tests_plan     ON cs_business_continuity_tests(plan_id);
CREATE INDEX IF NOT EXISTS idx_bcp_tests_date     ON cs_business_continuity_tests(test_date);

ALTER TABLE cs_business_continuity_tests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own bcp tests"
    ON cs_business_continuity_tests FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
