-- Migration: 367_clothing_allowance
-- Domain: Children's Services — Clothing Allowance & Wardrobe Management
-- Description: Tracks clothing purchases, allowances, wardrobe audits, and style
-- consultations for looked-after children. Ensures children have appropriate,
-- sufficient, and personally chosen clothing that meets their needs.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 9 (quality of care — ensuring children are well-clothed),
-- Reg 5 (individual needs),
-- SCCIF: Experiences — "Children have appropriate clothing."
-- Corporate Parenting Principles — children should have what peers have.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_clothing_allowance (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  record_date                     date NOT NULL,
  recorded_by                     text NOT NULL,
  record_type                     text NOT NULL DEFAULT 'Seasonal Allowance',
  amount                          numeric NOT NULL DEFAULT 0,
  budget_period                   text NULL,
  child_chose                     boolean NOT NULL DEFAULT false,
  age_appropriate                 boolean NOT NULL DEFAULT true,
  good_condition                  boolean NOT NULL DEFAULT true,
  sufficient_quantity             boolean NOT NULL DEFAULT true,
  brand_preference_respected      boolean NOT NULL DEFAULT false,
  cultural_needs_met              boolean NOT NULL DEFAULT false,
  receipt_kept                    boolean NOT NULL DEFAULT false,
  season_appropriate              boolean NOT NULL DEFAULT true,
  school_requirements_met         boolean NULL,
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_clothing_allowance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_clothing_allowance
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_clothing_allowance_home
  ON cs_clothing_allowance(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_clothing_allowance_date
  ON cs_clothing_allowance(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_clothing_allowance_type
  ON cs_clothing_allowance(record_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
