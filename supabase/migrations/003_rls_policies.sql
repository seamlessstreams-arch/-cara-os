-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ROW LEVEL SECURITY POLICIES
-- Migration 003 — 2026-04-23
--
-- All policies are home-scoped: staff can only read/write data belonging
-- to their home. The service role key (used by API routes) bypasses all RLS.
--
-- Strategy:
--   • SELECT: any authenticated staff at same home
--   • INSERT: any authenticated staff at same home
--   • UPDATE: any authenticated staff at same home (fine-grained control
--             is handled in application logic, not DB)
--   • DELETE: managers only (registered_manager, deputy_manager, responsible_individual)
--
-- auth.uid() resolves to the Supabase auth user id.
-- Staff rows store their Supabase auth id in a separate column (auth_user_id).
-- We maintain a fast lookup via get_staff_home_id() helper.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Add auth_user_id to staff_members ────────────────────────────────────────
-- Links Supabase Auth users to staff records

alter table staff_members add column if not exists auth_user_id uuid unique;
create index if not exists idx_staff_auth_user on staff_members(auth_user_id);

-- ── Helper: get the home_id for the current authenticated user ─────────────

create or replace function get_my_home_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select home_id
  from staff_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ── Helper: get the role for the current authenticated user ─────────────────

create or replace function get_my_role()
returns system_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from staff_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ── Helper: is current user a manager? ────────────────────────────────────

create or replace function is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select role in ('registered_manager', 'deputy_manager', 'responsible_individual', 'team_leader')
  from staff_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- HOMES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "homes_read" on homes
  for select using (id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF MEMBERS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "staff_read" on staff_members
  for select using (home_id = get_my_home_id());

create policy "staff_insert" on staff_members
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "staff_update" on staff_members
  for update using (home_id = get_my_home_id() and is_manager());

create policy "staff_delete" on staff_members
  for delete using (home_id = get_my_home_id() and get_my_role() = 'registered_manager');

-- ══════════════════════════════════════════════════════════════════════════════
-- YOUNG PEOPLE
-- ══════════════════════════════════════════════════════════════════════════════

create policy "young_people_read" on young_people
  for select using (home_id = get_my_home_id());

create policy "young_people_insert" on young_people
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "young_people_update" on young_people
  for update using (home_id = get_my_home_id());

create policy "young_people_delete" on young_people
  for delete using (home_id = get_my_home_id() and get_my_role() = 'registered_manager');

-- ══════════════════════════════════════════════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "tasks_read" on tasks
  for select using (home_id = get_my_home_id());

create policy "tasks_insert" on tasks
  for insert with check (home_id = get_my_home_id());

create policy "tasks_update" on tasks
  for update using (home_id = get_my_home_id());

create policy "tasks_delete" on tasks
  for delete using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- INCIDENTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "incidents_read" on incidents
  for select using (home_id = get_my_home_id());

create policy "incidents_insert" on incidents
  for insert with check (home_id = get_my_home_id());

create policy "incidents_update" on incidents
  for update using (home_id = get_my_home_id());

create policy "incidents_delete" on incidents
  for delete using (home_id = get_my_home_id() and get_my_role() = 'registered_manager');

-- ══════════════════════════════════════════════════════════════════════════════
-- MISSING EPISODES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "missing_episodes_read" on missing_episodes
  for select using (home_id = get_my_home_id());

create policy "missing_episodes_insert" on missing_episodes
  for insert with check (home_id = get_my_home_id());

create policy "missing_episodes_update" on missing_episodes
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- CHRONOLOGY
-- ══════════════════════════════════════════════════════════════════════════════

create policy "chronology_read" on chronology_entries
  for select using (home_id = get_my_home_id());

create policy "chronology_insert" on chronology_entries
  for insert with check (home_id = get_my_home_id());

-- chronology is immutable — no update/delete (audit integrity)

-- ══════════════════════════════════════════════════════════════════════════════
-- SHIFTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "shifts_read" on shifts
  for select using (home_id = get_my_home_id());

create policy "shifts_insert" on shifts
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "shifts_update" on shifts
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- LEAVE REQUESTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "leave_read" on leave_requests
  for select using (home_id = get_my_home_id());

create policy "leave_insert" on leave_requests
  for insert with check (home_id = get_my_home_id());

create policy "leave_update" on leave_requests
  for update using (
    home_id = get_my_home_id()
    and (
      -- staff can update own leave; managers can update any
      staff_id = (select id from staff_members where auth_user_id = auth.uid())
      or is_manager()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- MEDICATIONS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "medications_read" on medications
  for select using (home_id = get_my_home_id());

create policy "medications_insert" on medications
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "medications_update" on medications
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- MEDICATION ADMINISTRATIONS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "mar_read" on medication_administrations
  for select using (home_id = get_my_home_id());

create policy "mar_insert" on medication_administrations
  for insert with check (home_id = get_my_home_id());

create policy "mar_update" on medication_administrations
  for update using (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- DAILY LOG
-- ══════════════════════════════════════════════════════════════════════════════

create policy "daily_log_read" on daily_log_entries
  for select using (home_id = get_my_home_id());

create policy "daily_log_insert" on daily_log_entries
  for insert with check (home_id = get_my_home_id());

create policy "daily_log_update" on daily_log_entries
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- HANDOVERS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "handovers_read" on handovers
  for select using (home_id = get_my_home_id());

create policy "handovers_insert" on handovers
  for insert with check (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- TRAINING
-- ══════════════════════════════════════════════════════════════════════════════

create policy "training_read" on training_records
  for select using (home_id = get_my_home_id());

create policy "training_insert" on training_records
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "training_update" on training_records
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- SUPERVISIONS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "supervisions_read" on supervisions
  for select using (home_id = get_my_home_id());

create policy "supervisions_insert" on supervisions
  for insert with check (home_id = get_my_home_id());

create policy "supervisions_update" on supervisions
  for update using (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- DOCUMENTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "documents_read" on documents
  for select using (home_id = get_my_home_id());

create policy "documents_insert" on documents
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "documents_update" on documents
  for update using (home_id = get_my_home_id() and is_manager());

create policy "doc_receipts_read" on document_read_receipts
  for select using (
    exists (select 1 from documents where id = document_id and home_id = get_my_home_id())
  );

create policy "doc_receipts_insert" on document_read_receipts
  for insert with check (
    exists (select 1 from documents where id = document_id and home_id = get_my_home_id())
  );

create policy "doc_receipts_update" on document_read_receipts
  for update using (
    exists (select 1 from documents where id = document_id and home_id = get_my_home_id())
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- EXPENSES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "expenses_read" on expenses
  for select using (home_id = get_my_home_id());

create policy "expenses_insert" on expenses
  for insert with check (home_id = get_my_home_id());

create policy "expenses_update" on expenses
  for update using (
    home_id = get_my_home_id()
    and (
      submitted_by = (select id from staff_members where auth_user_id = auth.uid())
      or is_manager()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- BUILDINGS & VEHICLES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "buildings_read" on buildings
  for select using (home_id = get_my_home_id());

create policy "building_checks_read" on building_checks
  for select using (home_id = get_my_home_id());

create policy "building_checks_insert" on building_checks
  for insert with check (home_id = get_my_home_id());

create policy "vehicles_read" on vehicles
  for select using (home_id = get_my_home_id());

create policy "vehicle_checks_read" on vehicle_checks
  for select using (home_id = get_my_home_id());

create policy "vehicle_checks_insert" on vehicle_checks
  for insert with check (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "notifications_read" on notifications
  for select using (
    recipient_id = (select id from staff_members where auth_user_id = auth.uid())
  );

create policy "notifications_update" on notifications
  for update using (
    recipient_id = (select id from staff_members where auth_user_id = auth.uid())
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- ══════════════════════════════════════════════════════════════════════════════

create policy "audit_log_read" on audit_log
  for select using (home_id = get_my_home_id() and is_manager());

-- Audit log is insert-only from application — no update/delete

-- ══════════════════════════════════════════════════════════════════════════════
-- ARIA INTERACTIONS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "aria_read" on aria_interactions
  for select using (home_id = get_my_home_id());

create policy "aria_insert" on aria_interactions
  for insert with check (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- TIME SAVED
-- ══════════════════════════════════════════════════════════════════════════════

create policy "time_saved_read" on time_saved_entries
  for select using (home_id = get_my_home_id());

create policy "time_saved_insert" on time_saved_entries
  for insert with check (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CARE FORMS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "care_forms_read" on care_forms
  for select using (home_id = get_my_home_id());

create policy "care_forms_insert" on care_forms
  for insert with check (home_id = get_my_home_id());

create policy "care_forms_update" on care_forms
  for update using (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- QA AUDITS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "qa_audits_read" on qa_audits
  for select using (home_id = get_my_home_id());

create policy "qa_audits_insert" on qa_audits
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "qa_audits_update" on qa_audits
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- MAINTENANCE ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "maintenance_read" on maintenance_items
  for select using (home_id = get_my_home_id());

create policy "maintenance_insert" on maintenance_items
  for insert with check (home_id = get_my_home_id());

create policy "maintenance_update" on maintenance_items
  for update using (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- RECRUITMENT
-- ══════════════════════════════════════════════════════════════════════════════

create policy "vacancies_read" on vacancies
  for select using (home_id = get_my_home_id());

create policy "vacancies_insert" on vacancies
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "vacancies_update" on vacancies
  for update using (home_id = get_my_home_id() and is_manager());

create policy "candidate_profiles_read" on candidate_profiles
  for select using (home_id = get_my_home_id());

create policy "candidate_profiles_insert" on candidate_profiles
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "candidate_profiles_update" on candidate_profiles
  for update using (home_id = get_my_home_id() and is_manager());

create policy "candidate_checks_read" on candidate_checks
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "candidate_checks_insert" on candidate_checks
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "candidate_checks_update" on candidate_checks
  for update using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
    and is_manager()
  );

create policy "candidate_references_read" on candidate_references
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "candidate_references_insert" on candidate_references
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "candidate_references_update" on candidate_references
  for update using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
    and is_manager()
  );

create policy "employment_history_read" on employment_history_entries
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "employment_history_insert" on employment_history_entries
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "gap_explanations_read" on gap_explanations
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "gap_explanations_insert" on gap_explanations
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "candidate_interviews_read" on candidate_interviews
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "candidate_interviews_insert" on candidate_interviews
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
    and is_manager()
  );

create policy "candidate_interviews_update" on candidate_interviews
  for update using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
    and is_manager()
  );

create policy "conditional_offers_read" on conditional_offers
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "conditional_offers_insert" on conditional_offers
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
    and is_manager()
  );

create policy "conditional_offers_update" on conditional_offers
  for update using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
    and is_manager()
  );

create policy "recruitment_audit_read" on recruitment_audit_entries
  for select using (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );

create policy "recruitment_audit_insert" on recruitment_audit_entries
  for insert with check (
    exists (select 1 from candidate_profiles where id = candidate_id and home_id = get_my_home_id())
  );
