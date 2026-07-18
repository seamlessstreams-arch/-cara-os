-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PLACEMENT STABILITY
-- CHR 2015 Reg 36 (records — placement history),
-- Reg 8 (placement plans — matching and stability),
-- Reg 9 (quality of care — continuity and stability).
-- Tables: cs_placement_moves
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_placement_moves (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  move_date                   date NOT NULL,
  placement_type              text NOT NULL,
  previous_placement_type     text,
  move_reason                 text NOT NULL,
  planned                     boolean NOT NULL DEFAULT true,
  disruption_meeting_held     boolean NOT NULL DEFAULT false,
  disruption_outcome          text NOT NULL DEFAULT 'not_applicable',
  placement_duration_days     integer NOT NULL DEFAULT 0,
  child_views_sought          boolean NOT NULL DEFAULT false,
  child_views                 text,
  social_worker_consulted     boolean NOT NULL DEFAULT false,
  irp_updated                 boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_moves_home    ON cs_placement_moves(home_id);
CREATE INDEX IF NOT EXISTS idx_placement_moves_child   ON cs_placement_moves(child_id);
CREATE INDEX IF NOT EXISTS idx_placement_moves_date    ON cs_placement_moves(move_date);
CREATE INDEX IF NOT EXISTS idx_placement_moves_type    ON cs_placement_moves(placement_type);
CREATE INDEX IF NOT EXISTS idx_placement_moves_reason  ON cs_placement_moves(move_reason);
CREATE INDEX IF NOT EXISTS idx_placement_moves_planned ON cs_placement_moves(planned);

ALTER TABLE cs_placement_moves ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own placement moves"
    ON cs_placement_moves FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
