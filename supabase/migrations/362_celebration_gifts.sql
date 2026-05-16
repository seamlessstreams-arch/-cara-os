-- Migration: 362_celebration_gifts
-- Domain: Children's Services — Birthday, Christmas & Celebration Management
-- Description: Tracks gift-giving, celebrations, cultural occasions, and special events
-- for looked-after children, ensuring every child's milestones and cultural identity
-- are recognised and celebrated in line with Corporate Parenting Principles.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 9 (quality of care — celebrations and special occasions),
-- SCCIF: Experiences — "Children enjoy celebrations."
-- Corporate Parenting Principles (Children and Social Work Act 2017).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_celebration_gifts (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  occasion_date                   date NOT NULL,
  recorded_by                     text NOT NULL,
  occasion_type                   text NOT NULL DEFAULT 'Birthday',
  gift_type                       text NOT NULL DEFAULT 'Multiple Items',
  gift_value                      numeric NOT NULL DEFAULT 0,
  budget_limit                    numeric NULL,
  within_budget                   boolean NOT NULL DEFAULT true,
  child_chose                     boolean NOT NULL DEFAULT false,
  age_appropriate                 boolean NOT NULL DEFAULT true,
  receipt_kept                    boolean NOT NULL DEFAULT false,
  social_worker_aware             boolean NULL,
  cultural_preference_considered  boolean NOT NULL DEFAULT false,
  celebration_activity_planned    boolean NOT NULL DEFAULT false,
  peers_included                  boolean NOT NULL DEFAULT false,
  child_feedback                  text NULL,
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_celebration_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_celebration_gifts
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_celebration_gifts_home
  ON cs_celebration_gifts(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_celebration_gifts_date
  ON cs_celebration_gifts(occasion_date);

CREATE INDEX IF NOT EXISTS idx_cs_celebration_gifts_type
  ON cs_celebration_gifts(occasion_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
