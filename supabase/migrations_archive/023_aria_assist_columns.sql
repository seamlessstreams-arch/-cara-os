-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 023: Add aria_assist_used columns to remaining record tables
--
-- Extends the ARIA audit trail to handovers and key work sessions. These
-- columns allow the AriaUsageBadge component to show whether ARIA was used
-- to assist with creating or improving a record.
--
-- Existing columns:
--   - incidents.aria_oversight_used (added in migration 022)
--   - daily_log_entries.aria_assist_used (added in migration 022)
--   - supervisions.aria_assist_used (added in migration 022)
--   - care_forms.aria_assist_used (added in migration 022)
-- ══════════════════════════════════════════════════════════════════════════════

-- Handovers: track when ARIA was used to draft handover content
ALTER TABLE IF EXISTS handovers
  ADD COLUMN IF NOT EXISTS aria_assist_used BOOLEAN DEFAULT FALSE;

-- Key work sessions: track when ARIA drafted session notes or summaries
ALTER TABLE IF EXISTS key_work_sessions
  ADD COLUMN IF NOT EXISTS aria_assist_used BOOLEAN DEFAULT FALSE;

-- Care plan reviews: track when ARIA helped with care plan analysis
ALTER TABLE IF EXISTS care_plan_reviews
  ADD COLUMN IF NOT EXISTS aria_assist_used BOOLEAN DEFAULT FALSE;

-- Staff development records: track when ARIA generated training recommendations
ALTER TABLE IF EXISTS staff_development_records
  ADD COLUMN IF NOT EXISTS aria_assist_used BOOLEAN DEFAULT FALSE;

-- Create index for efficient ARIA-assisted record queries
CREATE INDEX IF NOT EXISTS idx_handovers_aria ON handovers (aria_assist_used) WHERE aria_assist_used = TRUE;
CREATE INDEX IF NOT EXISTS idx_key_work_sessions_aria ON key_work_sessions (aria_assist_used) WHERE aria_assist_used = TRUE;
