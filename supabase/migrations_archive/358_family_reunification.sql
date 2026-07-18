-- Migration: 358_family_reunification
-- Domain: Children's Services — Family Reunification & Return Home Planning
-- Description: Tracks family reunification planning: initial and viability assessments,
-- family and home environment checks, phased contact and overnight/extended stay trials,
-- reunification decisions, transition plans, post-reunification support, breakdown
-- monitoring, and case closure for looked-after children returning to family care.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 7 (children's plans — rehabilitation to family),
-- Children Act 1989 s23C,
-- Care Planning Regulations 2010 Part 5 (ceasing to look after),
-- SCCIF: Overall experiences — "When safe, children return to their families with
-- appropriate support."
-- DfE reunification practice framework.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_family_reunification (
  id                                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                            text NOT NULL,
  record_date                           date NOT NULL,
  social_worker_name                    text NOT NULL,
  planning_stage                        text NOT NULL DEFAULT 'Initial Assessment',
  family_member                         text NOT NULL,
  relationship                          text NOT NULL DEFAULT 'Mother',
  risk_assessment_current               boolean NOT NULL DEFAULT false,
  safeguarding_cleared                  boolean NOT NULL DEFAULT false,
  child_views_obtained                  boolean NOT NULL DEFAULT false,
  child_wishes_to_return                boolean NULL,
  family_support_services               boolean NOT NULL DEFAULT false,
  parenting_assessment_completed        boolean NOT NULL DEFAULT false,
  home_suitable                         boolean NULL,
  local_authority_support_plan          boolean NOT NULL DEFAULT false,
  school_transition_planned             boolean NOT NULL DEFAULT false,
  health_services_transferred           boolean NOT NULL DEFAULT false,
  independent_reviewing_officer_consulted boolean NOT NULL DEFAULT false,
  legal_advice_obtained                 boolean NOT NULL DEFAULT false,
  court_order_status                    text NULL,
  estimated_return_date                 date NULL,
  actual_return_date                    date NULL,
  post_return_monitoring_weeks          integer NULL,
  status                                text NOT NULL DEFAULT 'Active Planning',
  notes                                 text NULL,
  created_at                            timestamptz NOT NULL DEFAULT now(),
  updated_at                            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_family_reunification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_family_reunification
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_family_reunification_home
  ON cs_family_reunification(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_family_reunification_date
  ON cs_family_reunification(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_family_reunification_stage
  ON cs_family_reunification(planning_stage);

CREATE INDEX IF NOT EXISTS idx_cs_family_reunification_status
  ON cs_family_reunification(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
