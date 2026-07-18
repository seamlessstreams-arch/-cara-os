-- Migration: 165_key_holding
-- Key holding register for key allocation, audits, lost/stolen incidents

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_key_holding (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  key_event_type text NOT NULL DEFAULT 'key_issued',
  key_type       text NOT NULL DEFAULT 'front_door',
  key_status     text NOT NULL DEFAULT 'in_use',
  audit_result   text NOT NULL DEFAULT 'all_accounted',

  event_date   date NOT NULL DEFAULT CURRENT_DATE,
  key_number   text NOT NULL DEFAULT '',
  holder_name  text NOT NULL DEFAULT '',
  holder_role  text NOT NULL DEFAULT '',

  all_keys_accounted      boolean NOT NULL DEFAULT true,
  register_updated        boolean NOT NULL DEFAULT true,
  lock_changed_after_loss boolean NOT NULL DEFAULT false,
  incident_reported       boolean NOT NULL DEFAULT false,
  police_notified         boolean NOT NULL DEFAULT false,
  manager_informed        boolean NOT NULL DEFAULT true,
  spare_keys_secure       boolean NOT NULL DEFAULT true,
  medication_keys_separate boolean NOT NULL DEFAULT true,

  keys_checked_count int NOT NULL DEFAULT 0,
  keys_missing_count int NOT NULL DEFAULT 0,

  issues_found   jsonb NOT NULL DEFAULT '[]',
  actions_taken  jsonb NOT NULL DEFAULT '[]',
  recorded_by    text NOT NULL DEFAULT '',
  notes          text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_key_holding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_key_holding_home" ON cs_key_holding;
CREATE POLICY "cs_key_holding_home" ON cs_key_holding
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_key_holding_home
  ON cs_key_holding(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 165 idempotent: %', SQLERRM;
END $$;
