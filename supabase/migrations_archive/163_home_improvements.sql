-- Migration: 163_home_improvements
-- Home improvement project tracking for renovations, accessibility, personalisation

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_improvements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  project_type    text NOT NULL DEFAULT 'decorative_works',
  project_status  text NOT NULL DEFAULT 'proposed',
  priority_level  text NOT NULL DEFAULT 'medium',
  funding_source  text NOT NULL DEFAULT 'home_budget',

  project_name         text NOT NULL DEFAULT '',
  description          text NOT NULL DEFAULT '',
  location_in_home     text NOT NULL DEFAULT '',
  start_date           date,
  target_completion_date date,
  actual_completion_date date,
  estimated_cost       numeric(10,2),
  actual_cost          numeric(10,2),
  contractor_name      text,

  children_consulted            boolean NOT NULL DEFAULT false,
  children_involved             boolean NOT NULL DEFAULT false,
  child_room_personalisation    boolean NOT NULL DEFAULT false,
  accessibility_improvement     boolean NOT NULL DEFAULT false,
  energy_efficiency_improvement boolean NOT NULL DEFAULT false,
  safety_improvement            boolean NOT NULL DEFAULT false,
  planning_permission_required  boolean NOT NULL DEFAULT false,
  planning_permission_obtained  boolean NOT NULL DEFAULT false,
  building_regs_compliant       boolean NOT NULL DEFAULT true,
  fire_safety_maintained        boolean NOT NULL DEFAULT true,
  disruption_minimised          boolean NOT NULL DEFAULT true,

  issues_found   jsonb NOT NULL DEFAULT '[]',
  actions_taken  jsonb NOT NULL DEFAULT '[]',
  managed_by     text NOT NULL DEFAULT '',
  notes          text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_home_improvements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_home_improvements_home" ON cs_home_improvements;
CREATE POLICY "cs_home_improvements_home" ON cs_home_improvements
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_home_improvements_home
  ON cs_home_improvements(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 163 idempotent: %', SQLERRM;
END $$;
