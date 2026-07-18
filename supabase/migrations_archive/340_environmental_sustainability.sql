-- Migration: 340_environmental_sustainability
-- Domain: Children's Services — Home Environmental Sustainability
-- Description: Tracks environmental sustainability audits and initiatives
-- including carbon footprint reviews, water conservation, biodiversity,
-- sustainable procurement, plastic reduction, low carbon transport,
-- sustainable food sourcing, food waste reduction, young people education,
-- staff awareness training, community environmental projects, green energy
-- tariffs, renewable installations, and insulation upgrades.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 25 (premises),
-- Climate Change Act 2008,
-- Environment Act 2021,
-- Streamlined Energy and Carbon Reporting (SECR),
-- SCCIF: premises modelling good practice for children —
-- environmental awareness as educational opportunity.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_environmental_sustainability (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  audit_date                  date NOT NULL,
  auditor_name                text NOT NULL,
  focus_area                  text NOT NULL DEFAULT 'Carbon Footprint Review',
  current_status              text NOT NULL DEFAULT 'Not Started',
  target_date                 date NULL,
  actual_completion_date      date NULL,
  estimated_carbon_saving_kg  numeric NULL,
  estimated_cost_saving       numeric NULL,
  investment_required         numeric NULL,
  young_people_involved       boolean NOT NULL DEFAULT false,
  educational_component       boolean NOT NULL DEFAULT false,
  community_benefit           boolean NOT NULL DEFAULT false,
  evidence_attached           boolean NOT NULL DEFAULT false,
  responsible_person          text NOT NULL,
  review_date                 date NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_environmental_sustainability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_environmental_sustainability
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_environmental_sustainability_home
  ON cs_environmental_sustainability(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_environmental_sustainability_date
  ON cs_environmental_sustainability(audit_date);

CREATE INDEX IF NOT EXISTS idx_cs_environmental_sustainability_area
  ON cs_environmental_sustainability(focus_area);

CREATE INDEX IF NOT EXISTS idx_cs_environmental_sustainability_status
  ON cs_environmental_sustainability(current_status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
