-- Restorative Justice Practice tracking
-- CHR 2015 Reg 19 (behaviour management), Reg 34 (leadership)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_restorative_justice_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  practice_type text NOT NULL DEFAULT 'other',
  outcome_level text NOT NULL DEFAULT 'partially_resolved',
  participation_willingness text NOT NULL DEFAULT 'mostly_willing',
  relationship_impact text NOT NULL DEFAULT 'no_change',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  facilitated_by text NOT NULL,
  child_voice_heard boolean NOT NULL DEFAULT true,
  victim_supported boolean NOT NULL DEFAULT true,
  voluntary_participation boolean NOT NULL DEFAULT true,
  agreement_reached boolean NOT NULL DEFAULT true,
  follow_up_planned boolean NOT NULL DEFAULT true,
  empathy_demonstrated boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  staff_trained boolean NOT NULL DEFAULT true,
  safeguarding_considered boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_restorative_justice_practice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Home isolation" ON cs_restorative_justice_practice;
CREATE POLICY "Home isolation" ON cs_restorative_justice_practice
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_restorative_justice_practice_home
  ON cs_restorative_justice_practice(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_restorative_justice_practice migration: %', SQLERRM;
END $$;
