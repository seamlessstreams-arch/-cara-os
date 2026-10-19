-- Migration: 338_equality_diversity_monitoring
-- Domain: Children's Services — Equality, Diversity & Inclusion Monitoring
-- Description: Tracks equality and diversity records including staff training,
-- policy reviews, practice audits, discrimination complaints, hate crime
-- incidents, inclusive practice examples, reasonable adjustments, accessibility
-- reviews, cultural calendar events, diversity celebrations, and feedback
-- from young people and staff.
--
-- UK Regulatory Framework:
-- Equality Act 2010 (9 protected characteristics),
-- Public Sector Equality Duty s149,
-- CHR 2015 Reg 5 (individual needs including disability, sexuality, gender identity),
-- SCCIF: Leadership and management — "The home promotes equality and diversity.",
-- UNCRC Article 2 (non-discrimination).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_equality_diversity_monitoring (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  record_date                 date NOT NULL,
  recorder_name               text NOT NULL,
  record_type                 text NOT NULL DEFAULT 'Inclusive Practice Example',
  protected_characteristic    text NOT NULL DEFAULT 'Not Specific',
  child_name                  text NULL,
  staff_name                  text NULL,
  description                 text NOT NULL,
  positive_action_taken       text NULL,
  barriers_identified         text NULL,
  reasonable_adjustments_made boolean NOT NULL DEFAULT false,
  training_delivered          boolean NOT NULL DEFAULT false,
  policy_updated              boolean NOT NULL DEFAULT false,
  complaint_upheld            boolean NULL,
  external_agency_involved    boolean NOT NULL DEFAULT false,
  evidence_attached           boolean NOT NULL DEFAULT false,
  review_date                 date NULL,
  status                      text NOT NULL DEFAULT 'Recorded',
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_equality_diversity_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_equality_diversity_monitoring
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_equality_diversity_monitoring_home
  ON cs_equality_diversity_monitoring(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_equality_diversity_monitoring_date
  ON cs_equality_diversity_monitoring(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_equality_diversity_monitoring_type
  ON cs_equality_diversity_monitoring(record_type);

CREATE INDEX IF NOT EXISTS idx_cs_equality_diversity_monitoring_characteristic
  ON cs_equality_diversity_monitoring(protected_characteristic);

CREATE INDEX IF NOT EXISTS idx_cs_equality_diversity_monitoring_status
  ON cs_equality_diversity_monitoring(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
