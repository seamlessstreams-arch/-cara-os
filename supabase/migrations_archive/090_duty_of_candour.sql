-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DUTY OF CANDOUR
-- CHR 2015 Reg 20 (duty of candour),
-- Reg 40 (notification of events).
-- Tables: cs_candour_records
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_candour_records (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                    text NOT NULL,
  child_id                      uuid NOT NULL,
  trigger                       text NOT NULL,
  incident_date                 date NOT NULL,
  identified_date               date NOT NULL,
  status                        text NOT NULL DEFAULT 'identified',
  description                   text NOT NULL,
  verbal_apology_date           date,
  written_apology_date          date,
  family_informed               boolean NOT NULL DEFAULT false,
  social_worker_informed        boolean NOT NULL DEFAULT false,
  ofsted_notified               boolean NOT NULL DEFAULT false,
  ofsted_notification_date      date,
  investigation_lead            text,
  investigation_outcome         text,
  investigation_completed_date  date,
  lessons_learned               jsonb NOT NULL DEFAULT '[]',
  actions_taken                 jsonb NOT NULL DEFAULT '[]',
  final_response_date           date,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candour_home     ON cs_candour_records(home_id);
CREATE INDEX IF NOT EXISTS idx_candour_child    ON cs_candour_records(child_id);
CREATE INDEX IF NOT EXISTS idx_candour_trigger  ON cs_candour_records(trigger);
CREATE INDEX IF NOT EXISTS idx_candour_status   ON cs_candour_records(status);
CREATE INDEX IF NOT EXISTS idx_candour_date     ON cs_candour_records(incident_date);

ALTER TABLE cs_candour_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own candour records"
    ON cs_candour_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
