-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INTELLIGENCE LAYER RLS POLICIES
-- Migration 006 — 2026-04-24
--
-- Row-level security policies for the 9 intelligence tables added in
-- migration 005. All policies are home-scoped (same pattern as migration 003).
-- The service role key used by all API routes bypasses RLS automatically.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── child_experience_snapshots ───────────────────────────────────────────────

create policy "ces_select" on child_experience_snapshots
  for select using (home_id = get_my_home_id());

create policy "ces_insert" on child_experience_snapshots
  for insert with check (home_id = get_my_home_id());

create policy "ces_update" on child_experience_snapshots
  for update using (home_id = get_my_home_id());

create policy "ces_delete" on child_experience_snapshots
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── pattern_alerts ───────────────────────────────────────────────────────────

create policy "pa_select" on pattern_alerts
  for select using (home_id = get_my_home_id());

create policy "pa_insert" on pattern_alerts
  for insert with check (home_id = get_my_home_id());

create policy "pa_update" on pattern_alerts
  for update using (home_id = get_my_home_id());

create policy "pa_delete" on pattern_alerts
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── interventions ────────────────────────────────────────────────────────────

create policy "int_select" on interventions
  for select using (home_id = get_my_home_id());

create policy "int_insert" on interventions
  for insert with check (home_id = get_my_home_id());

create policy "int_update" on interventions
  for update using (home_id = get_my_home_id());

create policy "int_delete" on interventions
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── relational_records ───────────────────────────────────────────────────────

create policy "rr_select" on relational_records
  for select using (home_id = get_my_home_id());

create policy "rr_insert" on relational_records
  for insert with check (home_id = get_my_home_id());

create policy "rr_update" on relational_records
  for update using (home_id = get_my_home_id());

create policy "rr_delete" on relational_records
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── practice_bank_entries ────────────────────────────────────────────────────

create policy "pbe_select" on practice_bank_entries
  for select using (home_id = get_my_home_id());

create policy "pbe_insert" on practice_bank_entries
  for insert with check (home_id = get_my_home_id());

create policy "pbe_update" on practice_bank_entries
  for update using (home_id = get_my_home_id());

create policy "pbe_delete" on practice_bank_entries
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── voice_records ────────────────────────────────────────────────────────────

create policy "vr_select" on voice_records
  for select using (home_id = get_my_home_id());

create policy "vr_insert" on voice_records
  for insert with check (home_id = get_my_home_id());

create policy "vr_update" on voice_records
  for update using (home_id = get_my_home_id());

create policy "vr_delete" on voice_records
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── document_intelligence_jobs ───────────────────────────────────────────────

create policy "dij_select" on document_intelligence_jobs
  for select using (home_id = get_my_home_id());

create policy "dij_insert" on document_intelligence_jobs
  for insert with check (home_id = get_my_home_id());

create policy "dij_update" on document_intelligence_jobs
  for update using (home_id = get_my_home_id());

create policy "dij_delete" on document_intelligence_jobs
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── home_climate_snapshots ───────────────────────────────────────────────────

create policy "hcs_select" on home_climate_snapshots
  for select using (home_id = get_my_home_id());

create policy "hcs_insert" on home_climate_snapshots
  for insert with check (home_id = get_my_home_id());

create policy "hcs_update" on home_climate_snapshots
  for update using (home_id = get_my_home_id());

create policy "hcs_delete" on home_climate_snapshots
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );

-- ── action_outcomes ──────────────────────────────────────────────────────────

create policy "ao_select" on action_outcomes
  for select using (home_id = get_my_home_id());

create policy "ao_insert" on action_outcomes
  for insert with check (home_id = get_my_home_id());

create policy "ao_update" on action_outcomes
  for update using (home_id = get_my_home_id());

create policy "ao_delete" on action_outcomes
  for delete using (
    home_id = get_my_home_id()
    and get_my_role() in ('registered_manager', 'deputy_manager', 'responsible_individual')
  );
