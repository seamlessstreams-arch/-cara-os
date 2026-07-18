-- Migration: 352_smoking_vaping_management
-- Domain: Children's Services — Smoking Cessation & Vaping Prevention
-- Description: Tracks smoking cessation support, vaping prevention, NRT provision,
-- education sessions, GP and stop smoking service referrals, harm reduction
-- discussions, peer pressure support, and environmental compliance for looked-after
-- children. Covers cigarettes, roll-up tobacco, e-cigarettes/vapes (nicotine and
-- non-nicotine), shisha, and nicotine pouches.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 10 (health/wellbeing),
-- CHR 2015 Reg 12 (protection),
-- NICE PH23 (smoking prevention),
-- NICE NG209 (tobacco harm reduction),
-- SCCIF: Health — "The home supports children's physical health."
-- Health Act 2006 (smoke-free premises),
-- Tobacco and Vapes Bill 2024.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_smoking_vaping_management (
  id                            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                    text NOT NULL,
  record_date                   date NOT NULL,
  recorded_by                   text NOT NULL,
  record_type                   text NOT NULL DEFAULT 'Initial Assessment',
  substance                     text NOT NULL DEFAULT 'Unknown/Undisclosed',
  usage_frequency               text NOT NULL DEFAULT 'Non-User',
  motivation_to_quit            text NOT NULL DEFAULT 'Not Ready',
  nrt_provided                  boolean NOT NULL DEFAULT false,
  gp_consulted                  boolean NOT NULL DEFAULT false,
  young_person_engaged          boolean NOT NULL DEFAULT true,
  harm_reduction_approach       boolean NOT NULL DEFAULT false,
  education_provided            boolean NOT NULL DEFAULT false,
  peer_influence_addressed      boolean NOT NULL DEFAULT false,
  smoke_free_premises_compliant boolean NOT NULL DEFAULT true,
  age_verified                  boolean NOT NULL DEFAULT true,
  social_worker_informed        boolean NOT NULL DEFAULT false,
  next_review_date              date NULL,
  notes                         text NULL,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_smoking_vaping_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_smoking_vaping_management
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_smoking_vaping_management_home
  ON cs_smoking_vaping_management(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_smoking_vaping_management_date
  ON cs_smoking_vaping_management(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_smoking_vaping_management_type
  ON cs_smoking_vaping_management(record_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
