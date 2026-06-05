-- ══════════════════════════════════════════════════════════════════════════════
-- Workforce Safe Access — durable persistence for the workforce engine (Phases 5/7)
--
-- Tables for the in-memory collections added by Smart Sign-In presence verification
-- (Phase 5) and Safe Staffing & Emergency (Phase 7). Write-through happens at the
-- service boundary only when Supabase is configured (otherwise the in-memory store
-- holds the data — zero behaviour change). Home-scoped RLS; the service-role key used
-- by API routes bypasses RLS.
--
-- PRIVACY: sign_in_verifications stores method + outcome + a COARSE band only —
-- there is deliberately NO latitude/longitude column. Emergency broadcasts carry no
-- sensitive detail (enforced in the application layer).
--
-- Tables:
--   sign_in_verifications  — presence checks at clock-in (no coordinates)
--   emergency_alerts       — emergency alerts + responders + resolution
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. sign_in_verifications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sign_in_verifications (
  id          TEXT PRIMARY KEY,
  staff_id    TEXT NOT NULL,
  shift_id    TEXT,
  home_id     TEXT NOT NULL DEFAULT 'home_oak',
  method      TEXT NOT NULL,                  -- kiosk | geofence | manual
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  band        TEXT,                           -- on_site | nearby | off_site | null
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: intentionally no latitude/longitude — coordinates are never stored.
);
CREATE INDEX IF NOT EXISTS idx_sign_in_verifs_home ON sign_in_verifications (home_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sign_in_verifs_staff ON sign_in_verifications (staff_id);
CREATE INDEX IF NOT EXISTS idx_sign_in_verifs_shift ON sign_in_verifications (shift_id);

-- ── 2. emergency_alerts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id                    TEXT PRIMARY KEY,
  home_id               TEXT NOT NULL DEFAULT 'home_oak',
  type                  TEXT NOT NULL,        -- medical|fire|security|evacuation|missing|other
  raised_by             TEXT NOT NULL,
  raised_by_name        TEXT NOT NULL,
  location              TEXT,
  note                  TEXT,
  status                TEXT NOT NULL DEFAULT 'active',  -- active | resolved
  responders            JSONB NOT NULL DEFAULT '[]'::jsonb,
  broadcast_message_id  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ,
  resolved_by           TEXT
);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_home ON emergency_alerts (home_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_active ON emergency_alerts (home_id) WHERE status = 'active';

-- ── 3. Row-level security (home-scoped; service role bypasses) ─────────────────
ALTER TABLE sign_in_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sign_in_verifs_select ON sign_in_verifications;
CREATE POLICY sign_in_verifs_select ON sign_in_verifications FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS sign_in_verifs_insert ON sign_in_verifications;
CREATE POLICY sign_in_verifs_insert ON sign_in_verifications FOR INSERT WITH CHECK (home_id = get_my_home_id());

DROP POLICY IF EXISTS emergency_alerts_select ON emergency_alerts;
CREATE POLICY emergency_alerts_select ON emergency_alerts FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS emergency_alerts_insert ON emergency_alerts;
CREATE POLICY emergency_alerts_insert ON emergency_alerts FOR INSERT WITH CHECK (home_id = get_my_home_id());
DROP POLICY IF EXISTS emergency_alerts_update ON emergency_alerts;
CREATE POLICY emergency_alerts_update ON emergency_alerts FOR UPDATE USING (home_id = get_my_home_id());

COMMENT ON TABLE sign_in_verifications IS 'Sign-in presence checks (Phase 5) — method/outcome/band only; coordinates are never stored.';
COMMENT ON TABLE emergency_alerts IS 'Emergency alerts (Phase 7) — broadcasts carry no sensitive detail (enforced in app).';
