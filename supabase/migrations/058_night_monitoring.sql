

-- ── cs_night_logs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_night_logs (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  shift_date              DATE NOT NULL,
  shift_start             TIMESTAMPTZ NOT NULL,
  shift_end               TIMESTAMPTZ,
  staff_on_duty           JSONB NOT NULL DEFAULT '[]',
  lead_staff              TEXT NOT NULL,
  handover_received       BOOLEAN NOT NULL DEFAULT FALSE,
  handover_notes          TEXT,
  total_checks_completed  INT NOT NULL DEFAULT 0,
  all_children_checked    BOOLEAN NOT NULL DEFAULT FALSE,
  incidents_count         INT NOT NULL DEFAULT 0,
  disturbances_count      INT NOT NULL DEFAULT 0,
  premises_secure         boolean,
  fire_panel_checked      boolean,
  overnight_summary       TEXT NOT NULL DEFAULT '',
  handover_given          BOOLEAN NOT NULL DEFAULT FALSE,
  handover_given_notes    TEXT,
  status                  TEXT NOT NULL DEFAULT 'in_progress',
  reviewed_by             TEXT,
  reviewed_date           DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_night_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "night_logs_home" ON cs_night_logs
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_night_logs_home
  ON cs_night_logs(home_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_night_logs_status
  ON cs_night_logs(status, shift_date);
