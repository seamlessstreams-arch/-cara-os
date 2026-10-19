-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S RIGHTS
-- CHR 2015 Reg 7 (right to be heard), Reg 8 (views, wishes, feelings),
-- Reg 16 (providing information — rights).
-- Tables: cs_rights_audits, cs_child_rights_profiles
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_rights_audits ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_rights_audits (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  audit_date             date NOT NULL,
  auditor                text NOT NULL,
  rights_checks          jsonb NOT NULL DEFAULT '[]',
  children_consulted     integer NOT NULL DEFAULT 0,
  overall_rating         text NOT NULL,
  key_findings           jsonb NOT NULL DEFAULT '[]',
  actions                jsonb NOT NULL DEFAULT '[]',
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rights_audits_home  ON cs_rights_audits(home_id);
CREATE INDEX IF NOT EXISTS idx_rights_audits_date  ON cs_rights_audits(audit_date);

ALTER TABLE cs_rights_audits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own rights audits"
    ON cs_rights_audits FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_child_rights_profiles ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_child_rights_profiles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                  uuid NOT NULL,
  child_name                text NOT NULL,
  knows_rights              boolean NOT NULL DEFAULT false,
  knows_how_to_complain     boolean NOT NULL DEFAULT false,
  has_advocate              boolean NOT NULL DEFAULT false,
  advocate_name             text,
  views_sought_regularly    boolean NOT NULL DEFAULT false,
  empowerment_level         text NOT NULL DEFAULT 'not_assessed',
  preferred_communication   text NOT NULL,
  last_rights_discussion    date,
  barriers_to_participation jsonb NOT NULL DEFAULT '[]',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_rights_home         ON cs_child_rights_profiles(home_id);
CREATE INDEX IF NOT EXISTS idx_child_rights_child        ON cs_child_rights_profiles(child_id);
CREATE INDEX IF NOT EXISTS idx_child_rights_empowerment  ON cs_child_rights_profiles(empowerment_level);

ALTER TABLE cs_child_rights_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own child rights profiles"
    ON cs_child_rights_profiles FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
