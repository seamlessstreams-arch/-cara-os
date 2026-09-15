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
  rest_period_compliant boolean,
  working_time_directive_met boolean,
  lone_working_risk_assessed boolean,
  handover_completed boolean,
  break_taken  boolean,
  training_current boolean,
  dbs_current  boolean,
  first_aid_current boolean,
  medication_trained boolean,
  supervision_up_to_date boolean,
  wellbeing_checked boolean,
  recorded_promptly boolean,
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
