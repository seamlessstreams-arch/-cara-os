DO $$ BEGIN
CREATE TABLE IF NOT EXISTS cs_school_exclusion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name text NOT NULL,
  exclusion_date date NOT NULL,
  recorded_by text NOT NULL,
  exclusion_type text NOT NULL,
  duration_days integer NULL,
  reason_given text NOT NULL,
  school_name text NOT NULL,
  virtual_school_head_notified boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  independent_review_requested boolean NULL,
  governor_meeting_attended boolean NULL,
  alternative_provision_arranged boolean NOT NULL DEFAULT false,
  provision_name text NULL,
  education_hours_per_week numeric NULL,
  reintegration_plan boolean NOT NULL DEFAULT false,
  child_views_obtained boolean NOT NULL DEFAULT false,
  parent_carer_views boolean NOT NULL DEFAULT false,
  advocacy_provided boolean NOT NULL DEFAULT false,
  appeal_outcome text NULL,
  return_date date NULL,
  status text NOT NULL DEFAULT 'Active',
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cs_school_exclusion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON cs_school_exclusion USING (home_id = get_my_home_id());
CREATE INDEX IF NOT EXISTS idx_cs_school_exclusion_home ON cs_school_exclusion(home_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
