-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE INTELLIGENCE LAYER — USER-LEVEL RLS POLICIES
-- Migration 016
--
-- Replaces the blanket service_role policies on intelligence tables with
-- proper home-scoped policies. Uses get_my_home_id() from migration 003.
--
-- Strategy:
--   • SELECT: authenticated staff at same home
--   • INSERT: authenticated staff at same home
--   • UPDATE: authenticated staff at same home
--   • DELETE: managers only (via role check)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Helper: check if current user is a manager ────────────────────────────
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE auth_user_id = auth.uid()
      AND role IN ('registered_manager', 'deputy_manager', 'responsible_individual')
  );
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- MANAGER ATTENTION ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON manager_attention_items;

CREATE POLICY "staff_read_own_home" ON manager_attention_items
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON manager_attention_items
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON manager_attention_items
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON manager_attention_items
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- INSPECTION EVIDENCE ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON inspection_evidence_items;

CREATE POLICY "staff_read_own_home" ON inspection_evidence_items
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON inspection_evidence_items
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON inspection_evidence_items
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON inspection_evidence_items
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- INSPECTION EVIDENCE LINKS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON inspection_evidence_links;

CREATE POLICY "staff_read" ON inspection_evidence_links
  FOR SELECT USING (
    evidence_item_id IN (SELECT id FROM inspection_evidence_items WHERE home_id = get_my_home_id())
  );

CREATE POLICY "staff_insert" ON inspection_evidence_links
  FOR INSERT WITH CHECK (
    evidence_item_id IN (SELECT id FROM inspection_evidence_items WHERE home_id = get_my_home_id())
  );

CREATE POLICY "managers_delete" ON inspection_evidence_links
  FOR DELETE USING (
    evidence_item_id IN (SELECT id FROM inspection_evidence_items WHERE home_id = get_my_home_id()) AND is_manager()
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- INSPECTION EVIDENCE PACKS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON inspection_evidence_packs;

CREATE POLICY "staff_read_own_home" ON inspection_evidence_packs
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON inspection_evidence_packs
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON inspection_evidence_packs
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON inspection_evidence_packs
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD PROGRESS GOALS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_progress_goals;

CREATE POLICY "staff_read_own_home" ON child_progress_goals
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON child_progress_goals
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON child_progress_goals
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON child_progress_goals
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD PROGRESS ENTRIES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_progress_entries;

CREATE POLICY "staff_read_own_home" ON child_progress_entries
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON child_progress_entries
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON child_progress_entries
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON child_progress_entries
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD OUTCOME SNAPSHOTS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_outcome_snapshots;

CREATE POLICY "staff_read_own_home" ON child_outcome_snapshots
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON child_outcome_snapshots
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON child_outcome_snapshots
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- REG 44 VISITS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg44_visits;

CREATE POLICY "staff_read_own_home" ON reg44_visits
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON reg44_visits
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON reg44_visits
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON reg44_visits
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- REG 44 ACTIONS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg44_actions;

CREATE POLICY "staff_read_own_home" ON reg44_actions
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON reg44_actions
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON reg44_actions
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON reg44_actions
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- REG 45 REVIEWS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg45_reviews;

CREATE POLICY "staff_read_own_home" ON reg45_reviews
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON reg45_reviews
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON reg45_reviews
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON reg45_reviews
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- REG 45 EVIDENCE LINKS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg45_evidence_links;

CREATE POLICY "staff_read" ON reg45_evidence_links
  FOR SELECT USING (
    review_id IN (SELECT id FROM reg45_reviews WHERE home_id = get_my_home_id())
  );

CREATE POLICY "staff_insert" ON reg45_evidence_links
  FOR INSERT WITH CHECK (
    review_id IN (SELECT id FROM reg45_reviews WHERE home_id = get_my_home_id())
  );

CREATE POLICY "managers_delete" ON reg45_evidence_links
  FOR DELETE USING (
    review_id IN (SELECT id FROM reg45_reviews WHERE home_id = get_my_home_id()) AND is_manager()
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- INCIDENT LEARNING REVIEWS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON incident_learning_reviews;

CREATE POLICY "staff_read_own_home" ON incident_learning_reviews
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON incident_learning_reviews
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON incident_learning_reviews
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON incident_learning_reviews
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- SMART RECORD LINKS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON smart_record_links;

CREATE POLICY "staff_read_own_home" ON smart_record_links
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON smart_record_links
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON smart_record_links
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF COMPETENCE RECORDS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON staff_competence_records;

CREATE POLICY "staff_read_own_home" ON staff_competence_records
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON staff_competence_records
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON staff_competence_records
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON staff_competence_records
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- Unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_scr_staff_home ON staff_competence_records(staff_id, home_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD VOICE ENTRIES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_voice_entries;

CREATE POLICY "staff_read_own_home" ON child_voice_entries
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON child_voice_entries
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "staff_update_own_home" ON child_voice_entries
  FOR UPDATE USING (home_id = get_my_home_id());

CREATE POLICY "managers_delete" ON child_voice_entries
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- PROVIDER HOME SUMMARIES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON provider_home_summaries;

CREATE POLICY "staff_read_own_home" ON provider_home_summaries
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "managers_insert" ON provider_home_summaries
  FOR INSERT WITH CHECK (home_id = get_my_home_id() AND is_manager());

CREATE POLICY "managers_update" ON provider_home_summaries
  FOR UPDATE USING (home_id = get_my_home_id() AND is_manager());

CREATE POLICY "managers_delete" ON provider_home_summaries
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- INTELLIGENCE AUDIT LOG
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON intelligence_audit_log;

CREATE POLICY "staff_read_own_home" ON intelligence_audit_log
  FOR SELECT USING (home_id = get_my_home_id());

CREATE POLICY "staff_insert_own_home" ON intelligence_audit_log
  FOR INSERT WITH CHECK (home_id = get_my_home_id());

-- Audit log: no update or delete for any user (append-only)
