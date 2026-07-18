-- 218: Religious & Cultural Observance
-- CHR 2015 Reg 10 (religion, language, culture), Reg 7 (children's wishes — cultural identity)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_religious_cultural_observance (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  observance_type text NOT NULL DEFAULT 'other',
  accommodation_level text NOT NULL DEFAULT 'fully_accommodated',
  cultural_sensitivity text NOT NULL DEFAULT 'good',
  staff_competence text NOT NULL DEFAULT 'competent',
  observance_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  supported_by text NOT NULL DEFAULT '',
  child_views_sought boolean NOT NULL DEFAULT true,
  family_consulted boolean NOT NULL DEFAULT true,
  dietary_needs_met boolean NOT NULL DEFAULT true,
  resources_provided boolean NOT NULL DEFAULT true,
  community_links_used boolean NOT NULL DEFAULT true,
  staff_trained boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  respectful_approach boolean NOT NULL DEFAULT true,
  celebration_supported boolean NOT NULL DEFAULT true,
  discrimination_addressed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_religious_cultural_observance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "religious_cultural_observance_home" ON cs_religious_cultural_observance;
CREATE POLICY "religious_cultural_observance_home" ON cs_religious_cultural_observance
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 218 idempotent: %', SQLERRM;
END $$;
