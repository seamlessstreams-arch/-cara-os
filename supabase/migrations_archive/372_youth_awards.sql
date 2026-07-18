DO $$ BEGIN
CREATE TABLE IF NOT EXISTS cs_youth_awards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name text NOT NULL,
  record_date date NOT NULL,
  supporting_staff text NOT NULL,
  award_scheme text NOT NULL,
  section text NULL,
  activity_description text NOT NULL,
  hours_completed numeric NULL,
  hours_required numeric NULL,
  assessor_name text NULL,
  evidence_recorded boolean NOT NULL DEFAULT false,
  young_person_engaged boolean NOT NULL DEFAULT false,
  barriers_identified text NULL,
  support_provided text NULL,
  milestone_achieved boolean NOT NULL DEFAULT false,
  completion_date date NULL,
  certificate_received boolean NOT NULL DEFAULT false,
  celebrated_achievement boolean NOT NULL DEFAULT false,
  linked_to_pathway_plan boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cs_youth_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON cs_youth_awards USING (home_id = get_my_home_id());
CREATE INDEX IF NOT EXISTS idx_cs_youth_awards_home ON cs_youth_awards(home_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
