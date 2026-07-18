-- 251: Staff Trigger Maps
-- Maps situations, contexts, or stressors that trigger concerning staff practice patterns
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_trigger_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  staff_name text NOT NULL,
  staff_id uuid,
  trigger_category text NOT NULL CHECK (trigger_category IN ('environmental','interpersonal','workload','child_behaviour','team_conflict','personal_stress','organisational_change','shift_pattern','safeguarding_pressure','other')),
  trigger_severity text NOT NULL CHECK (trigger_severity IN ('mild','moderate','significant','severe','overwhelming')),
  coping_effectiveness text NOT NULL CHECK (coping_effectiveness IN ('very_effective','effective','partially_effective','ineffective','counterproductive')),
  map_status text NOT NULL DEFAULT 'draft' CHECK (map_status IN ('draft','active','under_review','resolved','archived')),
  session_date date NOT NULL,
  identified_by text NOT NULL,
  trigger_description text NOT NULL,
  context_when_triggered text NOT NULL,
  observable_response text NOT NULL,
  impact_on_practice text,
  current_coping_strategies text,
  support_strategies text,
  environmental_adjustments text,
  supervision_response text,
  staff_self_awareness text,
  staff_comment text,
  approved_by text,
  approved_at timestamptz,
  evidence_documented boolean NOT NULL DEFAULT false,
  staff_involved boolean NOT NULL DEFAULT false,
  triggers_explored boolean NOT NULL DEFAULT false,
  coping_strategies_identified boolean NOT NULL DEFAULT false,
  support_plan_linked boolean NOT NULL DEFAULT false,
  environmental_factors_considered boolean NOT NULL DEFAULT false,
  supervision_adjusted boolean NOT NULL DEFAULT false,
  wellbeing_checked boolean NOT NULL DEFAULT false,
  manager_reviewed boolean NOT NULL DEFAULT false,
  team_aware_if_appropriate boolean NOT NULL DEFAULT false,
  follow_up_scheduled boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_trigger_maps_home ON cs_staff_trigger_maps(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_trigger_maps_staff ON cs_staff_trigger_maps(staff_name);
CREATE INDEX IF NOT EXISTS idx_cs_staff_trigger_maps_date ON cs_staff_trigger_maps(session_date);

ALTER TABLE cs_staff_trigger_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_trigger_maps_home" ON cs_staff_trigger_maps;
CREATE POLICY "staff_trigger_maps_home" ON cs_staff_trigger_maps
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 251 (staff trigger maps): %', SQLERRM;
END $$;
