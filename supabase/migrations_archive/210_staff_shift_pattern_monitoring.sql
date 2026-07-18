-- 210: Staff Shift Pattern Monitoring
-- CHR 2015 Reg 31 (workforce planning), Reg 33 (fitness of staff)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_shift_pattern_monitoring (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  shift_type   text NOT NULL DEFAULT 'morning',
  fatigue_risk text NOT NULL DEFAULT 'low',
  staffing_level text NOT NULL DEFAULT 'fully_staffed',
  shift_compliance text NOT NULL DEFAULT 'fully_compliant',
  shift_date   date NOT NULL DEFAULT now(),
  staff_name   text NOT NULL DEFAULT '',
  shift_supervisor text NOT NULL DEFAULT '',
  rest_period_compliant boolean NOT NULL DEFAULT true,
  working_time_directive_met boolean NOT NULL DEFAULT true,
  lone_working_risk_assessed boolean NOT NULL DEFAULT true,
  handover_completed boolean NOT NULL DEFAULT true,
  break_taken  boolean NOT NULL DEFAULT true,
  training_current boolean NOT NULL DEFAULT true,
  dbs_current  boolean NOT NULL DEFAULT true,
  first_aid_current boolean NOT NULL DEFAULT true,
  medication_trained boolean NOT NULL DEFAULT true,
  supervision_up_to_date boolean NOT NULL DEFAULT true,
  wellbeing_checked boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  shift_duration_hours numeric NOT NULL DEFAULT 8,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_shift_pattern_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_shift_pattern_monitoring_home" ON cs_staff_shift_pattern_monitoring;
CREATE POLICY "staff_shift_pattern_monitoring_home" ON cs_staff_shift_pattern_monitoring
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 210 idempotent: %', SQLERRM;
END $$;
