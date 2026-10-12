-- Migration: 20261012000000_inspection_history
-- Domain: Ofsted inspection history (Phase 2 — store-on-live table creation)
-- Promotes the store-only `inspectionHistory` collection to a durable table so
-- /api/v1/inspection-history works on a live tenant. Shape mirrors the app
-- InspectionRecord type (src/types/extended.ts). RLS: tenant isolation by home.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS inspection_history (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id            uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  inspection_date    date        NOT NULL,
  inspection_type    text        NOT NULL DEFAULT 'Full inspection'
                       CHECK (inspection_type IN ('Full inspection','Short notice','Focused visit','Monitoring visit')),
  grade              text        NOT NULL
                       CHECK (grade IN ('Outstanding','Good','Requires improvement','Inadequate')),
  inspector_name     text        NOT NULL DEFAULT '',
  report_reference   text        NULL,
  report_url         text        NULL,
  actions_required   integer     NOT NULL DEFAULT 0,
  actions_completed  integer     NOT NULL DEFAULT 0,
  summary            text        NULL,
  published_at       text        NULL,

  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE inspection_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON inspection_history;
CREATE POLICY "Tenant isolation" ON inspection_history
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_inspection_history_home
  ON inspection_history(home_id);
CREATE INDEX IF NOT EXISTS idx_inspection_history_date
  ON inspection_history(inspection_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
