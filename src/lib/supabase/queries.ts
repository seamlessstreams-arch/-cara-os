/**
 * Supabase query helpers
 *
 * Each function accepts a Supabase client and returns data in the same
 * shape as the in-memory store, so API routes can swap between them
 * with minimal changes.
 *
 * All queries are scoped to home_id (passed explicitly — service role bypasses RLS).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { todayStr, daysFromNow } from "@/lib/utils";

// Use `any` to bypass Supabase SDK generic type narrowing issues when the
// Database schema type doesn't include Relationships[] (required by the SDK
// but not yet generated via `supabase gen types`). Once real credentials are
// wired and types are auto-generated this should be removed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF
// ─────────────────────────────────────────────────────────────────────────────

export async function getStaff(sb: SB, homeId: string, filters?: {
  role?: string;
  employment_type?: string;
  status?: string;
}) {
  let query = sb
    .from("staff_members")
    .select("*")
    .eq("home_id", homeId);

  if (!filters?.status || filters.status === "active") {
    query = query.eq("is_active", true).eq("employment_status", "active");
  } else if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }
  if (filters?.role) query = query.eq("role", filters.role);
  if (filters?.employment_type) query = query.eq("employment_type", filters.employment_type);

  return unwrap(await query.order("last_name"));
}

export async function getStaffById(sb: SB, id: string) {
  return unwrap(await sb.from("staff_members").select("*").eq("id", id).single());
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME (the one home this deployment serves — selected by SUPABASE_HOME_ID)
// ─────────────────────────────────────────────────────────────────────────────

/** The deployment's own home row, or null if the id matches nothing. */
export async function getHome(sb: SB, homeId: string) {
  return unwrap(await sb.from("homes").select("*").eq("id", homeId).maybeSingle());
}

// ─────────────────────────────────────────────────────────────────────────────
// YOUNG PEOPLE
// ─────────────────────────────────────────────────────────────────────────────

export async function getYoungPeople(sb: SB, homeId: string, status?: string) {
  let query = sb.from("young_people").select("*").eq("home_id", homeId);
  if (status && status !== "all") {
    const statusMap: Record<string, string> = { current: "current", former: "ended" };
    query = query.eq("status", statusMap[status] ?? status);
  }
  return unwrap(await query.order("first_name"));
}

export async function getYoungPersonById(sb: SB, id: string) {
  return unwrap(await sb.from("young_people").select("*").eq("id", id).single());
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

export async function getTasks(sb: SB, homeId: string, filters?: {
  assigned_to?: string;
  status?: string;
  priority?: string;
  category?: string;
  overdue?: boolean;
}) {
  let query = sb.from("tasks").select("*").eq("home_id", homeId);

  if (filters?.assigned_to) query = query.eq("assigned_to", filters.assigned_to);
  if (filters?.status)      query = query.eq("status", filters.status);
  if (filters?.priority)    query = query.eq("priority", filters.priority);
  if (filters?.category)    query = query.eq("category", filters.category);
  if (filters?.overdue)     query = query.lt("due_date", todayStr()).not("status", "in", '("completed","cancelled")');

  return unwrap(await query.order("due_date", { nullsFirst: false }));
}

export async function getTaskById(sb: SB, id: string) {
  return unwrap(await sb.from("tasks").select("*").eq("id", id).single());
}

export async function createTask(sb: SB, data: Database["public"]["Tables"]["tasks"]["Insert"]) {
  return unwrap(await sb.from("tasks").insert(data).select().single());
}

export async function updateTask(sb: SB, id: string, data: Database["public"]["Tables"]["tasks"]["Update"]) {
  return unwrap(await sb.from("tasks").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getIncidents(sb: SB, homeId: string, filters?: {
  status?: string;
  child_id?: string;
  needs_oversight?: boolean;
}) {
  let query = sb.from("incidents").select("*").eq("home_id", homeId);
  if (filters?.status)           query = query.eq("status", filters.status);
  if (filters?.child_id)         query = query.eq("child_id", filters.child_id);
  if (filters?.needs_oversight)  query = query.eq("requires_oversight", true).is("oversight_by", null);
  return unwrap(await query.order("date", { ascending: false }));
}

export async function getIncidentById(sb: SB, id: string) {
  return unwrap(await sb.from("incidents").select("*").eq("id", id).single());
}

export async function createIncident(sb: SB, data: Database["public"]["Tables"]["incidents"]["Insert"]) {
  return unwrap(await sb.from("incidents").insert(data).select().single());
}

export async function updateIncident(sb: SB, id: string, data: Database["public"]["Tables"]["incidents"]["Update"]) {
  return unwrap(await sb.from("incidents").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIFTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getShiftsForWeek(sb: SB, homeId: string, weekStart: string) {
  const start = new Date(weekStart);
  const weekEnd = new Date(start.setDate(start.getDate() + 7)).toISOString().split("T")[0];
  return unwrap(
    await sb.from("shifts")
      .select("*")
      .eq("home_id", homeId)
      .gte("date", weekStart)
      .lt("date", weekEnd)
      .order("date")
      .order("start_time")
  );
}

export async function getShiftsToday(sb: SB, homeId: string) {
  return unwrap(
    await sb.from("shifts").select("*").eq("home_id", homeId).eq("date", todayStr())
  );
}

export async function createShift(sb: SB, data: Database["public"]["Tables"]["shifts"]["Insert"]) {
  return unwrap(await sb.from("shifts").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────────────────────────────────────

export async function getLeaveRequests(sb: SB, homeId: string, filters?: {
  staff_id?: string;
  status?: string;
  leave_type?: string;
}) {
  let query = sb.from("leave_requests").select("*").eq("home_id", homeId);
  if (filters?.staff_id)   query = query.eq("staff_id", filters.staff_id);
  if (filters?.status)     query = query.eq("status", filters.status);
  if (filters?.leave_type) query = query.eq("leave_type", filters.leave_type);
  return unwrap(await query.order("start_date", { ascending: false }));
}

export async function getLeaveOnDate(sb: SB, homeId: string, date: string) {
  return unwrap(
    await sb.from("leave_requests")
      .select("*")
      .eq("home_id", homeId)
      .eq("status", "approved")
      .lte("start_date", date)
      .gte("end_date", date)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING
// ─────────────────────────────────────────────────────────────────────────────

export async function getTrainingRecords(sb: SB, homeId: string, filters?: {
  staff_id?: string;
  status?: string;
  category?: string;
}) {
  let query = sb.from("training_records").select("*").eq("home_id", homeId);
  if (filters?.staff_id) query = query.eq("staff_id", filters.staff_id);
  if (filters?.status)   query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category", filters.category);
  return unwrap(await query.order("expiry_date", { nullsFirst: false }));
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMedications(sb: SB, homeId: string, childId?: string) {
  let query = sb.from("medications").select("*").eq("home_id", homeId);
  if (childId) query = query.eq("child_id", childId);
  return unwrap(await query.order("name"));
}

export async function getMedicationAdministrations(sb: SB, homeId: string, filters?: {
  child_id?: string;
  medication_id?: string;
  since?: string;
}) {
  let query = sb.from("medication_administrations").select("*").eq("home_id", homeId);
  if (filters?.child_id)      query = query.eq("child_id", filters.child_id);
  if (filters?.medication_id) query = query.eq("medication_id", filters.medication_id);
  if (filters?.since)         query = query.gte("scheduled_time", filters.since);
  return unwrap(await query.order("scheduled_time", { ascending: false }));
}

export async function createMedicationAdministration(
  sb: SB,
  data: Database["public"]["Tables"]["medication_administrations"]["Insert"]
) {
  return unwrap(await sb.from("medication_administrations").insert(data).select().single());
}

export async function updateMedicationAdministration(
  sb: SB, id: string,
  data: Database["public"]["Tables"]["medication_administrations"]["Update"]
) {
  return unwrap(await sb.from("medication_administrations").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY LOG
// ─────────────────────────────────────────────────────────────────────────────

export async function getDailyLog(sb: SB, homeId: string, filters?: {
  child_id?: string;
  date?: string;
  entry_type?: string;
  days?: number;
}) {
  let query = sb.from("daily_log_entries").select("*").eq("home_id", homeId);
  if (filters?.child_id)   query = query.eq("child_id", filters.child_id);
  if (filters?.date)       query = query.eq("date", filters.date);
  if (filters?.entry_type) query = query.eq("entry_type", filters.entry_type);
  if (filters?.days) {
    const since = daysFromNow(-(filters.days));
    query = query.gte("date", since);
  }
  return unwrap(await query.order("date", { ascending: false }).order("time", { ascending: false, nullsFirst: false }));
}

export async function createDailyLogEntry(
  sb: SB,
  data: Database["public"]["Tables"]["daily_log_entries"]["Insert"]
) {
  return unwrap(await sb.from("daily_log_entries").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPERVISIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSupervisions(sb: SB, homeId: string, filters?: {
  staff_id?: string;
  supervisor_id?: string;
  status?: string;
  overdue?: boolean;
}) {
  let query = sb.from("supervisions").select("*").eq("home_id", homeId);
  if (filters?.staff_id)     query = query.eq("staff_id", filters.staff_id);
  if (filters?.supervisor_id) query = query.eq("supervisor_id", filters.supervisor_id);
  if (filters?.status)       query = query.eq("status", filters.status);
  if (filters?.overdue)      query = query.lt("scheduled_date", todayStr()).eq("status", "scheduled");
  return unwrap(await query.order("scheduled_date", { ascending: false }));
}

export async function getSupervisionById(sb: SB, id: string) {
  return unwrap(await sb.from("supervisions").select("*").eq("id", id).single());
}

export async function createSupervision(sb: SB, data: Database["public"]["Tables"]["supervisions"]["Insert"]) {
  return unwrap(await sb.from("supervisions").insert(data).select().single());
}

export async function updateSupervision(sb: SB, id: string, data: Database["public"]["Tables"]["supervisions"]["Update"]) {
  return unwrap(await sb.from("supervisions").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getDocuments(sb: SB, homeId: string, filters?: {
  category?: string;
  requires_read_sign?: boolean;
}) {
  let query = sb.from("documents").select("*").eq("home_id", homeId);
  if (filters?.category)           query = query.eq("category", filters.category);
  if (filters?.requires_read_sign) query = query.eq("requires_read_sign", true);
  return unwrap(await query.order("title"));
}

export async function createDocument(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("documents").insert(data as never).select().single());
}

export async function getDocumentReadReceipts(sb: SB, documentIds: string[]) {
  if (!documentIds.length) return [];
  return unwrap(
    await sb.from("document_read_receipts").select("*").in("document_id", documentIds)
  );
}

export async function upsertDocumentReadReceipt(sb: SB, documentId: string, staffId: string) {
  return unwrap(
    await sb.from("document_read_receipts")
      .upsert(
        { document_id: documentId, staff_id: staffId, signed_at: new Date().toISOString(), read_at: new Date().toISOString() },
        { onConflict: "document_id,staff_id" }
      )
      .select()
      .single()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────────────────────────────────────

export async function getExpenses(sb: SB, homeId: string, filters?: {
  status?: string;
  submitted_by?: string;
}) {
  let query = sb.from("expenses").select("*").eq("home_id", homeId);
  if (filters?.status)       query = query.eq("status", filters.status);
  if (filters?.submitted_by) query = query.eq("submitted_by", filters.submitted_by);
  return unwrap(await query.order("date", { ascending: false }));
}

export async function createExpense(sb: SB, data: Database["public"]["Tables"]["expenses"]["Insert"]) {
  return unwrap(await sb.from("expenses").insert(data).select().single());
}

export async function updateExpense(sb: SB, id: string, data: Database["public"]["Tables"]["expenses"]["Update"]) {
  return unwrap(await sb.from("expenses").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// CARE FORMS
// ─────────────────────────────────────────────────────────────────────────────

export async function getCareForms(sb: SB, homeId: string, filters?: {
  status?: string;
  form_type?: string;
  linked_child_id?: string;
  priority?: string;
  pending_review?: boolean;
}) {
  let query = sb.from("care_forms").select("*").eq("home_id", homeId);
  if (filters?.status)          query = query.eq("status", filters.status);
  if (filters?.form_type)       query = query.eq("form_type", filters.form_type);
  if (filters?.linked_child_id) query = query.eq("linked_child_id", filters.linked_child_id);
  if (filters?.priority)        query = query.eq("priority", filters.priority);
  if (filters?.pending_review)  query = query.eq("status", "submitted");
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function getCareFormById(sb: SB, id: string) {
  return unwrap(await sb.from("care_forms").select("*").eq("id", id).single());
}

export async function createCareForm(sb: SB, data: Database["public"]["Tables"]["care_forms"]["Insert"]) {
  return unwrap(await sb.from("care_forms").insert(data).select().single());
}

export async function updateCareForm(sb: SB, id: string, data: Database["public"]["Tables"]["care_forms"]["Update"]) {
  return unwrap(await sb.from("care_forms").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// QA AUDITS
// ─────────────────────────────────────────────────────────────────────────────

export async function getQaAudits(sb: SB, homeId: string, filters?: {
  status?: string;
  category?: string;
}) {
  let query = sb.from("qa_audits").select("*").eq("home_id", homeId);
  if (filters?.status)   query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category", filters.category);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function createQaAudit(sb: SB, data: Database["public"]["Tables"]["qa_audits"]["Insert"]) {
  return unwrap(await sb.from("qa_audits").insert(data).select().single());
}

export async function updateQaAudit(sb: SB, id: string, data: Database["public"]["Tables"]["qa_audits"]["Update"]) {
  return unwrap(await sb.from("qa_audits").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE
// ─────────────────────────────────────────────────────────────────────────────

export async function getMaintenanceItems(sb: SB, homeId: string, filters?: {
  status?: string;
  priority?: string;
}) {
  let query = sb.from("maintenance_items").select("*").eq("home_id", homeId);
  if (filters?.status)   query = query.eq("status", filters.status);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  return unwrap(await query.order("priority").order("due_date", { nullsFirst: false }));
}

export async function createMaintenanceItem(sb: SB, data: Database["public"]["Tables"]["maintenance_items"]["Insert"]) {
  return unwrap(await sb.from("maintenance_items").insert(data).select().single());
}

export async function updateMaintenanceItem(sb: SB, id: string, data: Database["public"]["Tables"]["maintenance_items"]["Update"]) {
  return unwrap(await sb.from("maintenance_items").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSING EPISODES
// ─────────────────────────────────────────────────────────────────────────────

export async function getMissingEpisodes(sb: SB, homeId: string, filters?: {
  child_id?: string;
  status?: string;
  risk_level?: string;
}) {
  let query = sb.from("missing_episodes").select("*").eq("home_id", homeId);
  if (filters?.child_id)   query = query.eq("child_id", filters.child_id);
  if (filters?.status)     query = query.eq("status", filters.status);
  if (filters?.risk_level) query = query.eq("risk_level", filters.risk_level);
  return unwrap(await query.order("date_missing", { ascending: false }));
}

export async function createMissingEpisode(sb: SB, data: Database["public"]["Tables"]["missing_episodes"]["Insert"]) {
  return unwrap(await sb.from("missing_episodes").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// CHRONOLOGY
// ─────────────────────────────────────────────────────────────────────────────

export async function getChronologyEntries(sb: SB, homeId: string, childId?: string) {
  let query = sb.from("chronology_entries").select("*").eq("home_id", homeId);
  if (childId) query = query.eq("child_id", childId);
  return unwrap(await query.order("date", { ascending: false }));
}

export async function createChronologyEntry(sb: SB, data: Database["public"]["Tables"]["chronology_entries"]["Insert"]) {
  return unwrap(await sb.from("chronology_entries").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDOVERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getHandovers(sb: SB, homeId: string, limit = 10) {
  return unwrap(
    await sb.from("handovers").select("*").eq("home_id", homeId)
      .order("shift_date", { ascending: false }).limit(limit)
  );
}

export async function createHandover(sb: SB, data: Database["public"]["Tables"]["handovers"]["Insert"]) {
  return unwrap(await sb.from("handovers").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDINGS & VEHICLES
// ─────────────────────────────────────────────────────────────────────────────

export async function getBuildings(sb: SB, homeId: string) {
  return unwrap(await sb.from("buildings").select("*").eq("home_id", homeId));
}

export async function getBuildingChecks(sb: SB, homeId: string, buildingId?: string) {
  let query = sb.from("building_checks").select("*").eq("home_id", homeId);
  if (buildingId) query = query.eq("building_id", buildingId);
  return unwrap(await query.order("check_date", { ascending: false }));
}

export async function createBuildingCheck(sb: SB, data: Database["public"]["Tables"]["building_checks"]["Insert"]) {
  return unwrap(await sb.from("building_checks").insert(data).select().single());
}

export async function getVehicles(sb: SB, homeId: string) {
  return unwrap(await sb.from("vehicles").select("*").eq("home_id", homeId));
}

export async function getVehicleChecks(sb: SB, homeId: string, vehicleId?: string) {
  let query = sb.from("vehicle_checks").select("*").eq("home_id", homeId);
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);
  return unwrap(await query.order("check_date", { ascending: false }));
}

export async function createVehicleCheck(sb: SB, data: Database["public"]["Tables"]["vehicle_checks"]["Insert"]) {
  return unwrap(await sb.from("vehicle_checks").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// RECRUITMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getVacancies(sb: SB, homeId: string) {
  return unwrap(await sb.from("vacancies").select("*").eq("home_id", homeId).order("created_at", { ascending: false }));
}

export async function getCandidateProfiles(sb: SB, homeId: string, vacancyId?: string) {
  let query = sb.from("candidate_profiles").select("*").eq("home_id", homeId);
  if (vacancyId) query = query.eq("vacancy_id", vacancyId);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function getCandidateById(sb: SB, id: string) {
  return unwrap(await sb.from("candidate_profiles").select("*").eq("id", id).single());
}

export async function createCandidateProfile(sb: SB, data: Database["public"]["Tables"]["candidate_profiles"]["Insert"]) {
  return unwrap(await sb.from("candidate_profiles").insert(data).select().single());
}

export async function updateCandidateProfile(sb: SB, id: string, data: Database["public"]["Tables"]["candidate_profiles"]["Update"]) {
  return unwrap(await sb.from("candidate_profiles").update(data).eq("id", id).select().single());
}

export async function getCandidateChecks(sb: SB, candidateId: string) {
  return unwrap(await sb.from("candidate_checks").select("*").eq("candidate_id", candidateId));
}

export async function updateCandidateCheck(sb: SB, id: string, data: Database["public"]["Tables"]["candidate_checks"]["Update"]) {
  return unwrap(await sb.from("candidate_checks").update(data).eq("id", id).select().single());
}

export async function getCandidateReferences(sb: SB, candidateId: string) {
  return unwrap(await sb.from("candidate_references").select("*").eq("candidate_id", candidateId));
}

export async function createCandidateReference(sb: SB, data: Database["public"]["Tables"]["candidate_references"]["Insert"]) {
  return unwrap(await sb.from("candidate_references").insert(data).select().single());
}

export async function updateCandidateReference(sb: SB, id: string, data: Database["public"]["Tables"]["candidate_references"]["Update"]) {
  return unwrap(await sb.from("candidate_references").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications(sb: SB, homeId: string, recipientId: string) {
  return unwrap(
    await sb.from("notifications").select("*")
      .eq("home_id", homeId)
      .eq("recipient_id", recipientId)
      .eq("read", false)
      .order("created_at", { ascending: false })
  );
}

export async function createNotification(sb: SB, data: Database["public"]["Tables"]["notifications"]["Insert"]) {
  return unwrap(await sb.from("notifications").insert(data).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE LAYER
// ─────────────────────────────────────────────────────────────────────────────

// ── Child Experience Snapshots ────────────────────────────────────────────────

export async function getChildExperienceSnapshots(sb: SB, childId: string) {
  return unwrap(
    await sb.from("child_experience_snapshots").select("*")
      .eq("child_id", childId)
      .order("period_start", { ascending: false })
  );
}

export async function getLatestChildExperienceSnapshot(sb: SB, childId: string) {
  const result = await sb.from("child_experience_snapshots").select("*")
    .eq("child_id", childId)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function createChildExperienceSnapshot(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("child_experience_snapshots").insert(data as never).select().single());
}

// ── Pattern Alerts ────────────────────────────────────────────────────────────

export async function getPatternAlerts(sb: SB, homeId: string, filters?: {
  childId?: string;
  status?: string;
  severity?: string;
}) {
  let query = sb.from("pattern_alerts").select("*").eq("home_id", homeId);
  if (filters?.childId) query = query.eq("child_id", filters.childId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.severity) query = query.eq("severity", filters.severity);
  return unwrap(await query.order("detected_at", { ascending: false }));
}

export async function createPatternAlert(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("pattern_alerts").insert(data as never).select().single());
}

export async function updatePatternAlert(sb: SB, id: string, data: Record<string, unknown>) {
  return unwrap(await sb.from("pattern_alerts").update(data as never).eq("id", id).select().single());
}

// ── Interventions ─────────────────────────────────────────────────────────────

export async function getInterventions(sb: SB, homeId: string, childId?: string) {
  let query = sb.from("interventions").select("*").eq("home_id", homeId);
  if (childId) query = query.eq("child_id", childId);
  return unwrap(await query.order("started_at", { ascending: false }));
}

export async function createIntervention(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("interventions").insert(data as never).select().single());
}

export async function updateIntervention(sb: SB, id: string, data: Record<string, unknown>) {
  return unwrap(await sb.from("interventions").update(data as never).eq("id", id).select().single());
}

// ── Relational Records ────────────────────────────────────────────────────────

export async function getRelationalRecords(sb: SB, childId: string, recordType?: string) {
  let query = sb.from("relational_records").select("*").eq("child_id", childId);
  if (recordType) query = query.eq("record_type", recordType);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function createRelationalRecord(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("relational_records").insert(data as never).select().single());
}

// ── Practice Bank ─────────────────────────────────────────────────────────────

export async function getPracticeBankEntries(sb: SB, childId: string, activeOnly = true) {
  let query = sb.from("practice_bank_entries").select("*").eq("child_id", childId);
  if (activeOnly) query = query.eq("is_active", true);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function createPracticeBankEntry(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("practice_bank_entries").insert(data as never).select().single());
}

export async function updatePracticeBankEntry(sb: SB, id: string, data: Record<string, unknown>) {
  return unwrap(await sb.from("practice_bank_entries").update(data as never).eq("id", id).select().single());
}

// ── Voice Records ─────────────────────────────────────────────────────────────

export async function getVoiceRecords(sb: SB, childId: string) {
  return unwrap(
    await sb.from("voice_records").select("*")
      .eq("child_id", childId)
      .order("recorded_at", { ascending: false })
  );
}

export async function createVoiceRecord(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("voice_records").insert(data as never).select().single());
}

// ── Home Climate Snapshots ────────────────────────────────────────────────────

export async function getHomeClimateSnapshots(sb: SB, homeId: string, limit = 12) {
  return unwrap(
    await sb.from("home_climate_snapshots").select("*")
      .eq("home_id", homeId)
      .order("snapshot_date", { ascending: false })
      .limit(limit)
  );
}

export async function getLatestHomeClimateSnapshot(sb: SB, homeId: string) {
  const result = await sb.from("home_climate_snapshots").select("*")
    .eq("home_id", homeId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function createHomeClimateSnapshot(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("home_climate_snapshots").insert(data as never).select().single());
}

// ── Document Intelligence Jobs ────────────────────────────────────────────────

export async function getDocumentJobs(sb: SB, homeId: string, status?: string) {
  let query = sb.from("document_intelligence_jobs").select("*").eq("home_id", homeId);
  if (status) query = query.eq("status", status);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function getDocumentJobById(sb: SB, id: string) {
  return unwrap(await sb.from("document_intelligence_jobs").select("*").eq("id", id).single());
}

export async function createDocumentJob(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("document_intelligence_jobs").insert(data as never).select().single());
}

export async function updateDocumentJob(sb: SB, id: string, data: Record<string, unknown>) {
  return unwrap(await sb.from("document_intelligence_jobs").update(data as never).eq("id", id).select().single());
}

// ── Action Outcomes ───────────────────────────────────────────────────────────

export async function getActionOutcomes(sb: SB, homeId: string, childId?: string) {
  let query = sb.from("action_outcomes").select("*").eq("home_id", homeId);
  if (childId) query = query.eq("child_id", childId);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function createActionOutcome(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("action_outcomes").insert(data as never).select().single());
}

export async function updateActionOutcome(sb: SB, id: string, data: Record<string, unknown>) {
  return unwrap(await sb.from("action_outcomes").update(data as never).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC RECORDS (catch-all for extended record types)
// ─────────────────────────────────────────────────────────────────────────────

export async function getGenericRecords(sb: SB, homeId: string, recordType: string, filters?: {
  child_id?: string;
  staff_id?: string;
}) {
  let query = sb.from("generic_records").select("*")
    .eq("home_id", homeId)
    .eq("record_type", recordType);
  if (filters?.child_id) query = query.eq("child_id", filters.child_id);
  if (filters?.staff_id) query = query.eq("staff_id", filters.staff_id);
  return unwrap(await query.order("created_at", { ascending: false }));
}

export async function getGenericRecordById(sb: SB, id: string) {
  return unwrap(await sb.from("generic_records").select("*").eq("id", id).single());
}

export async function createGenericRecord(sb: SB, data: {
  home_id: string;
  record_type: string;
  data: Record<string, unknown>;
  child_id?: string;
  staff_id?: string;
  created_by?: string;
}) {
  return unwrap(await sb.from("generic_records").insert(data).select().single());
}

export async function updateGenericRecord(sb: SB, id: string, data: Record<string, unknown>) {
  return unwrap(await sb.from("generic_records").update(data).eq("id", id).select().single());
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ROSTER / ASSET CREATES
// ─────────────────────────────────────────────────────────────────────────────
// Each insert is filtered to the table's real columns. Postgres hard-rejects an
// INSERT naming an unknown column, and client payloads legitimately carry extra
// UI-only fields — that combination is exactly how "admit a child" silently
// failed on the live tenant. Ids are deliberately excluded so the DB mints a
// uuid (store-shaped ids like "yp_x" are not valid uuids).
function pickColumns(data: Record<string, unknown>, cols: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const k of cols) if (data[k] !== undefined) out[k] = data[k];
  return out;
}

const YOUNG_PERSON_COLS = [
  "home_id", "first_name", "last_name", "preferred_name", "date_of_birth", "gender",
  "ethnicity", "religion", "placement_start", "placement_end", "placement_type",
  "local_authority", "social_worker_name", "social_worker_phone", "social_worker_email",
  "iro_name", "iro_phone", "key_worker_id", "secondary_worker_id", "legal_status",
  "risk_flags", "dietary_requirements", "allergies", "gp_name", "gp_phone",
  "school_name", "school_contact", "photo_url", "status", "created_by", "updated_by",
] as const;

export async function createYoungPerson(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("young_people").insert(pickColumns(data, YOUNG_PERSON_COLS)).select().single());
}

// full_name is a GENERATED column (first + last) — never insert it.
const STAFF_MEMBER_COLS = [
  "home_id", "first_name", "last_name", "email", "phone", "role", "job_title",
  "employment_type", "employment_status", "start_date", "end_date", "probation_end_date",
  "contracted_hours", "hourly_rate", "annual_salary", "payroll_id", "dbs_number",
  "dbs_issue_date", "dbs_update_service", "emergency_contact_name", "emergency_contact_phone",
  "next_supervision_due", "next_appraisal_due", "avatar_url", "is_active",
  "created_by", "updated_by", "auth_user_id",
] as const;

export async function createStaffMember(sb: SB, data: Record<string, unknown>) {
  const row = pickColumns(data, STAFF_MEMBER_COLS);
  // NOT NULL columns get working defaults so a minimal form can create a seat.
  row.role ??= "residential_care_worker";
  row.job_title ??= "Care Worker";
  row.employment_type ??= "permanent";
  row.employment_status ??= "active";
  row.start_date ??= todayStr();
  row.contracted_hours ??= 0;
  row.dbs_update_service ??= false;
  row.is_active ??= true;
  return unwrap(await sb.from("staff_members").insert(row).select().single());
}

const MEDICATION_COLS = [
  "home_id", "child_id", "name", "type", "dosage", "frequency", "route", "prescriber",
  "pharmacy", "start_date", "end_date", "is_active", "stock_count", "stock_last_checked",
  "side_effects", "special_instructions", "created_by",
] as const;

export async function createMedication(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("medications").insert(pickColumns(data, MEDICATION_COLS)).select().single());
}

const LEAVE_REQUEST_COLS = [
  "home_id", "staff_id", "leave_type", "start_date", "end_date", "total_days", "reason",
  "status", "approved_by", "approved_at", "return_to_work_required", "return_to_work_completed",
  "return_to_work_date", "return_to_work_by", "return_to_work_notes", "created_by",
] as const;

export async function createLeaveRequest(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("leave_requests").insert(pickColumns(data, LEAVE_REQUEST_COLS)).select().single());
}

const BUILDING_COLS = [
  "home_id", "name", "type", "address", "areas", "gas_cert_expiry", "electrical_cert_expiry",
  "fire_risk_assessment_date", "epc_rating", "last_full_inspection", "next_inspection_due", "status",
] as const;

export async function createBuilding(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("buildings").insert(pickColumns(data, BUILDING_COLS)).select().single());
}

const VEHICLE_COLS = [
  "home_id", "registration", "make", "model", "colour", "year", "seats", "mot_expiry",
  "insurance_expiry", "tax_expiry", "last_service", "next_service_due", "mileage", "status",
  "breakdown_cover", "breakdown_ref", "notes",
] as const;

export async function createVehicle(sb: SB, data: Record<string, unknown>) {
  return unwrap(await sb.from("vehicles").insert(pickColumns(data, VEHICLE_COLS)).select().single());
}
