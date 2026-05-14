-- 214: Key Worker Allocation
-- CHR 2015 Reg 21 (privacy and dignity), Reg 31 (workforce planning)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_key_worker_allocation (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  allocation_status text NOT NULL DEFAULT 'active',
  relationship_quality text NOT NULL DEFAULT 'good',
  workload_level text NOT NULL DEFAULT 'balanced',
  continuity_rating text NOT NULL DEFAULT 'stable',
  review_date  date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  key_worker_name text NOT NULL DEFAULT '',
  reviewed_by  text NOT NULL DEFAULT '',
  child_views_sought boolean NOT NULL DEFAULT true,
  child_choice_considered boolean NOT NULL DEFAULT true,
  regular_sessions_held boolean NOT NULL DEFAULT true,
  care_plan_involvement boolean NOT NULL DEFAULT true,
  advocacy_role_fulfilled boolean NOT NULL DEFAULT true,
  training_appropriate boolean NOT NULL DEFAULT true,
  supervision_discussed boolean NOT NULL DEFAULT true,
  handover_plan_exists boolean NOT NULL DEFAULT true,
  backup_worker_identified boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  relationship_supported boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_key_worker_allocation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "key_worker_allocation_home" ON cs_key_worker_allocation;
CREATE POLICY "key_worker_allocation_home" ON cs_key_worker_allocation
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 214 idempotent: %', SQLERRM;
END $$;
