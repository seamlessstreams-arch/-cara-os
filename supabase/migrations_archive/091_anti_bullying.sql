-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ANTI-BULLYING
-- CHR 2015 Reg 12 (safeguarding — protection from bullying),
-- Reg 34 (staff — awareness of bullying dynamics),
-- Reg 7 (children's views — reporting bullying).
-- Tables: cs_bullying_incidents
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_bullying_incidents (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  incident_date             date NOT NULL,
  reported_by               text NOT NULL,
  bullying_type             text NOT NULL,
  severity                  text NOT NULL DEFAULT 'medium',
  perpetrator_name          text NOT NULL,
  perpetrator_is_resident   boolean NOT NULL DEFAULT false,
  victim_name               text NOT NULL,
  victim_id                 uuid NOT NULL,
  description               text NOT NULL,
  location                  text NOT NULL,
  witnesses                 jsonb NOT NULL DEFAULT '[]',
  intervention_type         text NOT NULL,
  outcome                   text NOT NULL DEFAULT 'pending',
  parent_carer_informed     boolean NOT NULL DEFAULT false,
  social_worker_informed    boolean NOT NULL DEFAULT false,
  follow_up_date            date,
  follow_up_completed       boolean NOT NULL DEFAULT false,
  impact_on_victim          text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bullying_home      ON cs_bullying_incidents(home_id);
CREATE INDEX IF NOT EXISTS idx_bullying_victim    ON cs_bullying_incidents(victim_id);
CREATE INDEX IF NOT EXISTS idx_bullying_date      ON cs_bullying_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_bullying_type      ON cs_bullying_incidents(bullying_type);
CREATE INDEX IF NOT EXISTS idx_bullying_severity  ON cs_bullying_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_bullying_outcome   ON cs_bullying_incidents(outcome);

ALTER TABLE cs_bullying_incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own bullying incidents"
    ON cs_bullying_incidents FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
