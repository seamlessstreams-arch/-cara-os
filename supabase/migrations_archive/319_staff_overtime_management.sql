-- Migration: 319_staff_overtime_management
-- Domain: Staff Overtime Management
-- Tracks WTR 1998 compliance, opt-out status, 48-hour average, rest breaks

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_overtime_management (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  review_date       date        NOT NULL,
  reviewer_name     text        NOT NULL,
  staff_name        text        NOT NULL,

  review_period_start date      NOT NULL,
  review_period_end   date      NOT NULL,
  contracted_hours    numeric(5,1) NOT NULL,
  actual_hours        numeric(5,1) NOT NULL,
  overtime_hours      numeric(5,1) NOT NULL DEFAULT 0,

  weekly_average_hours  numeric(5,1) NOT NULL,
  exceeds_48_hours      boolean NOT NULL DEFAULT false,
  opt_out_signed        boolean NOT NULL DEFAULT false,
  opt_out_date          date    NULL,

  rest_break_compliant  boolean NOT NULL DEFAULT true,
  night_worker          boolean NOT NULL DEFAULT false,
  night_hours_compliant boolean NULL,

  overtime_authorised   boolean NOT NULL DEFAULT true,
  overtime_paid         boolean NOT NULL DEFAULT false,
  toil_accrued          boolean NOT NULL DEFAULT false,

  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Opt-Out Valid','Review Required')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_staff_overtime_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_staff_overtime_management;
CREATE POLICY "Tenant isolation" ON cs_staff_overtime_management
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_staff_overtime_home
  ON cs_staff_overtime_management(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_overtime_date
  ON cs_staff_overtime_management(review_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
