-- Migration: 334_knife_weapon_safety
-- Domain: Home Safety — Knife & Weapon Safety Management
-- Description: Tracks kitchen knife audits, sharp object checks, weapon incidents,
-- bedroom searches (with consent), educational sessions, environmental safety measures,
-- Reg 40 notifications, and compliance status.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 12 (protection of children), Reg 25 (premises safety),
-- Offensive Weapons Act 2019, Serious Violence Duty 2022,
-- Knife Crime Prevention Orders,
-- SCCIF: Safety — "The home manages risks from weapons."
-- Reg 40 (notification of serious events to Ofsted).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_knife_weapon_safety (
  id                            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  record_date                   date NOT NULL,
  recorded_by                   text NOT NULL,
  record_type                   text NOT NULL DEFAULT 'Kitchen Knife Audit',
  child_name                    text NULL,
  weapon_type                   text NULL,
  location_found                text NULL,
  risk_level                    text NOT NULL DEFAULT 'Low',
  kitchen_knives_accounted_for  boolean NOT NULL DEFAULT true,
  kitchen_knife_count           integer NULL,
  sharp_objects_secured         boolean NOT NULL DEFAULT true,
  tool_storage_locked           boolean NOT NULL DEFAULT true,
  search_consent_obtained       boolean NULL,
  police_notified               boolean NOT NULL DEFAULT false,
  social_worker_informed        boolean NOT NULL DEFAULT false,
  reg_40_notification           boolean NOT NULL DEFAULT false,
  parent_carer_informed         boolean NOT NULL DEFAULT false,
  child_safety_plan_updated     boolean NOT NULL DEFAULT false,
  environmental_changes_made    text NULL,
  educational_content_delivered boolean NOT NULL DEFAULT false,
  next_audit_date               date NULL,
  compliance_status             text NOT NULL DEFAULT 'Compliant',
  notes                         text NULL,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_knife_weapon_safety ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_knife_weapon_safety
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_knife_weapon_safety_home
  ON cs_knife_weapon_safety(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_knife_weapon_safety_date
  ON cs_knife_weapon_safety(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_knife_weapon_safety_type
  ON cs_knife_weapon_safety(record_type);

CREATE INDEX IF NOT EXISTS idx_cs_knife_weapon_safety_compliance
  ON cs_knife_weapon_safety(compliance_status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
