-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PROVIDER VISITS
-- CHR 2015 Reg 44 (independent person — monthly visits),
-- Reg 45 (review of quality of care),
-- Care Planning Regulations 2010 (SW visiting).
-- Tables: cs_provider_visits
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_provider_visits (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  visit_type                   text NOT NULL,
  visitor_name                 text NOT NULL,
  visitor_organisation         text NOT NULL,
  visit_date                   date NOT NULL,
  visit_status                 text NOT NULL DEFAULT 'scheduled',
  outcome                      text,
  children_seen                jsonb NOT NULL DEFAULT '[]',
  children_spoken_privately    jsonb NOT NULL DEFAULT '[]',
  staff_spoken_to              jsonb NOT NULL DEFAULT '[]',
  premises_inspected           boolean NOT NULL DEFAULT false,
  records_reviewed             boolean NOT NULL DEFAULT false,
  actions_raised               jsonb NOT NULL DEFAULT '[]',
  actions_completed            integer NOT NULL DEFAULT 0,
  report_received              boolean NOT NULL DEFAULT false,
  report_date                  date,
  next_visit_due               date,
  notes                        text,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prov_visits_home    ON cs_provider_visits(home_id);
CREATE INDEX IF NOT EXISTS idx_prov_visits_type    ON cs_provider_visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_prov_visits_date    ON cs_provider_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_prov_visits_status  ON cs_provider_visits(visit_status);

ALTER TABLE cs_provider_visits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own provider visits"
    ON cs_provider_visits FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
