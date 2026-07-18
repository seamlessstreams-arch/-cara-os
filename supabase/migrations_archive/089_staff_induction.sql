-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — STAFF INDUCTION
-- CHR 2015 Reg 33 (employment of staff — recruitment, fitness),
-- Reg 34 (employment of staff — support, training, supervision),
-- Schedule 2 (information re: persons working at children's home).
-- Tables: cs_induction_records, cs_induction_tasks
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_induction_records ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_induction_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name              text NOT NULL,
  staff_role              text NOT NULL,
  start_date              date NOT NULL,
  induction_lead          text NOT NULL,
  probation_status        text NOT NULL DEFAULT 'in_probation',
  probation_end_date      date,
  total_tasks             integer NOT NULL DEFAULT 0,
  tasks_completed         integer NOT NULL DEFAULT 0,
  tasks_overdue           integer NOT NULL DEFAULT 0,
  dbs_verified            boolean NOT NULL DEFAULT false,
  references_verified     boolean NOT NULL DEFAULT false,
  right_to_work_verified  boolean NOT NULL DEFAULT false,
  can_work_unsupervised   boolean NOT NULL DEFAULT false,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_induction_records_home      ON cs_induction_records(home_id);
CREATE INDEX IF NOT EXISTS idx_induction_records_probation ON cs_induction_records(probation_status);
CREATE INDEX IF NOT EXISTS idx_induction_records_start     ON cs_induction_records(start_date);

ALTER TABLE cs_induction_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own induction records"
    ON cs_induction_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_induction_tasks ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_induction_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  induction_id    uuid NOT NULL REFERENCES cs_induction_records(id) ON DELETE CASCADE,
  category        text NOT NULL,
  task            text NOT NULL,
  target_date     date NOT NULL,
  status          text NOT NULL DEFAULT 'not_started',
  completed_date  date,
  signed_off_by   text,
  evidence        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_induction_tasks_home       ON cs_induction_tasks(home_id);
CREATE INDEX IF NOT EXISTS idx_induction_tasks_induction  ON cs_induction_tasks(induction_id);
CREATE INDEX IF NOT EXISTS idx_induction_tasks_status     ON cs_induction_tasks(status);
CREATE INDEX IF NOT EXISTS idx_induction_tasks_category   ON cs_induction_tasks(category);

ALTER TABLE cs_induction_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own induction tasks"
    ON cs_induction_tasks FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
