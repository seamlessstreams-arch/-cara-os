// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOLIDAY & TRIPS SERVICE
// Tracks outings, holidays, day trips, and recreational activities
// for children, including risk assessments, consent, and outcomes.
// CHR 2015 Reg 7 (children's plan — enrichment activities),
// Reg 10 (children's views — activity choice),
// Reg 25 (health and safety — off-site risk management).
//
// Covers: day trips, overnight stays, holidays, educational visits,
// reward outings, birthday treats, and community activities.
//
// SCCIF: Overall Experiences — "Children enjoy a range of activities."
// "Outings are well-planned, safe, and child-led."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TripType =
  | "day_trip"
  | "overnight_stay"
  | "holiday"
  | "educational_visit"
  | "reward_outing"
  | "birthday_treat"
  | "community_activity"
  | "sporting_event"
  | "cultural_visit"
  | "other";

export type TripStatus =
  | "planned"
  | "approved"
  | "completed"
  | "cancelled"
  | "postponed";

export type RiskAssessmentStatus =
  | "completed"
  | "pending"
  | "not_required"
  | "overdue";

export type ChildEnjoyment =
  | "loved_it"
  | "enjoyed"
  | "mixed"
  | "did_not_enjoy"
  | "not_assessed";

export interface HolidayTripRecord {
  id: string;
  home_id: string;
  trip_type: TripType;
  trip_date: string;
  return_date: string | null;
  trip_status: TripStatus;
  risk_assessment_status: RiskAssessmentStatus;
  child_enjoyment: ChildEnjoyment;
  destination: string;
  children_attending: number;
  staff_attending: number;
  child_chose_activity: boolean;
  consent_obtained: boolean;
  social_worker_informed: boolean;
  parent_carer_informed: boolean;
  delegated_authority_used: boolean;
  emergency_contacts_carried: boolean;
  medication_taken: boolean;
  first_aid_kit_carried: boolean;
  incident_during_trip: boolean;
  cost: number | null;
  budget_approved: boolean;
  children_names: string[];
  learning_outcomes: string[];
  issues_found: string[];
  actions_taken: string[];
  organised_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRIP_TYPES: { type: TripType; label: string }[] = [
  { type: "day_trip", label: "Day Trip" },
  { type: "overnight_stay", label: "Overnight Stay" },
  { type: "holiday", label: "Holiday" },
  { type: "educational_visit", label: "Educational Visit" },
  { type: "reward_outing", label: "Reward Outing" },
  { type: "birthday_treat", label: "Birthday Treat" },
  { type: "community_activity", label: "Community Activity" },
  { type: "sporting_event", label: "Sporting Event" },
  { type: "cultural_visit", label: "Cultural Visit" },
  { type: "other", label: "Other" },
];

export const TRIP_STATUSES: { status: TripStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "approved", label: "Approved" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "postponed", label: "Postponed" },
];

export const RISK_ASSESSMENT_STATUSES: { status: RiskAssessmentStatus; label: string }[] = [
  { status: "completed", label: "Completed" },
  { status: "pending", label: "Pending" },
  { status: "not_required", label: "Not Required" },
  { status: "overdue", label: "Overdue" },
];

export const CHILD_ENJOYMENT_LEVELS: { level: ChildEnjoyment; label: string }[] = [
  { level: "loved_it", label: "Loved It" },
  { level: "enjoyed", label: "Enjoyed" },
  { level: "mixed", label: "Mixed" },
  { level: "did_not_enjoy", label: "Did Not Enjoy" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeTripMetrics(
  records: HolidayTripRecord[],
): {
  total_trips: number;
  day_trip_count: number;
  overnight_count: number;
  holiday_count: number;
  educational_count: number;
  completed_count: number;
  cancelled_count: number;
  planned_count: number;
  loved_it_rate: number | null;
  enjoyed_rate: number | null;
  did_not_enjoy_count: number;
  child_chose_rate: number | null;
  consent_obtained_rate: number | null;
  risk_assessment_completed_rate: number | null;
  risk_assessment_overdue_count: number;
  social_worker_informed_rate: number | null;
  parent_carer_informed_rate: number | null;
  emergency_contacts_rate: number | null;
  first_aid_rate: number | null;
  incident_count: number;
  total_cost: number;
  average_cost: number | null;
  unique_children: number;
  by_trip_type: Record<string, number>;
  by_trip_status: Record<string, number>;
  by_risk_assessment: Record<string, number>;
  by_child_enjoyment: Record<string, number>;
} {
  const dayTrip = records.filter((r) => r.trip_type === "day_trip").length;
  const overnight = records.filter((r) => r.trip_type === "overnight_stay").length;
  const holiday = records.filter((r) => r.trip_type === "holiday").length;
  const educational = records.filter((r) => r.trip_type === "educational_visit").length;

  const completed = records.filter((r) => r.trip_status === "completed").length;
  const cancelled = records.filter((r) => r.trip_status === "cancelled").length;
  const planned = records.filter((r) => r.trip_status === "planned").length;

  const lovedIt = records.filter((r) => r.child_enjoyment === "loved_it").length;
  const lovedItRate =
    records.length > 0
      ? Math.round((lovedIt / records.length) * 1000) / 10
      : null;

  const enjoyed = records.filter((r) => r.child_enjoyment === "enjoyed").length;
  const enjoyedRate =
    records.length > 0
      ? Math.round((enjoyed / records.length) * 1000) / 10
      : null;

  const didNotEnjoy = records.filter((r) => r.child_enjoyment === "did_not_enjoy").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof HolidayTripRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const raCompleted = records.filter((r) => r.risk_assessment_status === "completed").length;
  const raCompletedRate =
    records.length > 0
      ? Math.round((raCompleted / records.length) * 1000) / 10
      : null;

  const raOverdue = records.filter((r) => r.risk_assessment_status === "overdue").length;

  const incident = records.filter((r) => r.incident_during_trip).length;

  const costs = records.filter((r) => r.cost !== null).map((r) => r.cost!);
  const totalCost = Math.round(costs.reduce((a, b) => a + b, 0) * 100) / 100;
  const avgCost =
    costs.length > 0
      ? Math.round((totalCost / costs.length) * 100) / 100
      : null;

  const allChildren = records.flatMap((r) => r.children_names);
  const uniqueChildren = new Set(allChildren).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.trip_type] = (byType[r.trip_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.trip_status] = (byStatus[r.trip_status] ?? 0) + 1;

  const byRA: Record<string, number> = {};
  for (const r of records) byRA[r.risk_assessment_status] = (byRA[r.risk_assessment_status] ?? 0) + 1;

  const byEnjoyment: Record<string, number> = {};
  for (const r of records) byEnjoyment[r.child_enjoyment] = (byEnjoyment[r.child_enjoyment] ?? 0) + 1;

  return {
    total_trips: records.length,
    day_trip_count: dayTrip,
    overnight_count: overnight,
    holiday_count: holiday,
    educational_count: educational,
    completed_count: completed,
    cancelled_count: cancelled,
    planned_count: planned,
    loved_it_rate: lovedItRate,
    enjoyed_rate: enjoyedRate,
    did_not_enjoy_count: didNotEnjoy,
    child_chose_rate: boolRate("child_chose_activity"),
    consent_obtained_rate: boolRate("consent_obtained"),
    risk_assessment_completed_rate: raCompletedRate,
    risk_assessment_overdue_count: raOverdue,
    social_worker_informed_rate: boolRate("social_worker_informed"),
    parent_carer_informed_rate: boolRate("parent_carer_informed"),
    emergency_contacts_rate: boolRate("emergency_contacts_carried"),
    first_aid_rate: boolRate("first_aid_kit_carried"),
    incident_count: incident,
    total_cost: totalCost,
    average_cost: avgCost,
    unique_children: uniqueChildren,
    by_trip_type: byType,
    by_trip_status: byStatus,
    by_risk_assessment: byRA,
    by_child_enjoyment: byEnjoyment,
  };
}

export function identifyTripAlerts(
  records: HolidayTripRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Incident during trip
  for (const r of records) {
    if (r.incident_during_trip) {
      alerts.push({
        type: "incident_during_trip",
        severity: "critical",
        message: `Incident during ${r.trip_type.replace(/_/g, " ")} to ${r.destination} on ${r.trip_date} — review and report`,
        id: r.id,
      });
    }
  }

  // Risk assessment overdue
  const raOverdue = records.filter((r) => r.risk_assessment_status === "overdue").length;
  if (raOverdue >= 1) {
    alerts.push({
      type: "risk_assessment_overdue",
      severity: "high",
      message: `${raOverdue} ${raOverdue === 1 ? "trip has" : "trips have"} overdue risk assessment — complete before departure`,
      id: "risk_assessment_overdue",
    });
  }

  // Consent not obtained
  const noConsent = records.filter(
    (r) => !r.consent_obtained && r.trip_status !== "cancelled",
  ).length;
  if (noConsent >= 1) {
    alerts.push({
      type: "no_consent",
      severity: "high",
      message: `${noConsent} ${noConsent === 1 ? "trip" : "trips"} without consent obtained — secure before proceeding`,
      id: "no_consent",
    });
  }

  // Child did not enjoy
  const didNotEnjoy = records.filter((r) => r.child_enjoyment === "did_not_enjoy").length;
  if (didNotEnjoy >= 1) {
    alerts.push({
      type: "child_did_not_enjoy",
      severity: "medium",
      message: `${didNotEnjoy} ${didNotEnjoy === 1 ? "trip" : "trips"} where child did not enjoy — review activity planning`,
      id: "child_did_not_enjoy",
    });
  }

  // Child did not choose
  const noChoice = records.filter(
    (r) => !r.child_chose_activity && r.trip_status !== "cancelled",
  ).length;
  if (noChoice >= 3) {
    alerts.push({
      type: "child_not_choosing",
      severity: "medium",
      message: `${noChoice} trips where child did not choose activity — increase child-led planning`,
      id: "child_not_choosing",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    tripType?: TripType;
    tripStatus?: TripStatus;
    riskAssessmentStatus?: RiskAssessmentStatus;
    limit?: number;
  },
): Promise<ServiceResult<HolidayTripRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_holiday_trips") as SB).select("*").eq("home_id", homeId);
  if (filters?.tripType) q = q.eq("trip_type", filters.tripType);
  if (filters?.tripStatus) q = q.eq("trip_status", filters.tripStatus);
  if (filters?.riskAssessmentStatus) q = q.eq("risk_assessment_status", filters.riskAssessmentStatus);
  q = q.order("trip_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    tripType: TripType;
    tripDate: string;
    returnDate?: string;
    tripStatus: TripStatus;
    riskAssessmentStatus: RiskAssessmentStatus;
    childEnjoyment: ChildEnjoyment;
    destination: string;
    childrenAttending: number;
    staffAttending: number;
    childChoseActivity: boolean;
    consentObtained: boolean;
    socialWorkerInformed: boolean;
    parentCarerInformed: boolean;
    delegatedAuthorityUsed: boolean;
    emergencyContactsCarried: boolean;
    medicationTaken: boolean;
    firstAidKitCarried: boolean;
    incidentDuringTrip: boolean;
    cost?: number;
    budgetApproved: boolean;
    childrenNames: string[];
    learningOutcomes: string[];
    issuesFound: string[];
    actionsTaken: string[];
    organisedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<HolidayTripRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_holiday_trips") as SB)
    .insert({
      home_id: input.homeId,
      trip_type: input.tripType,
      trip_date: input.tripDate,
      return_date: input.returnDate ?? null,
      trip_status: input.tripStatus,
      risk_assessment_status: input.riskAssessmentStatus,
      child_enjoyment: input.childEnjoyment,
      destination: input.destination,
      children_attending: input.childrenAttending,
      staff_attending: input.staffAttending,
      child_chose_activity: input.childChoseActivity,
      consent_obtained: input.consentObtained,
      social_worker_informed: input.socialWorkerInformed,
      parent_carer_informed: input.parentCarerInformed,
      delegated_authority_used: input.delegatedAuthorityUsed,
      emergency_contacts_carried: input.emergencyContactsCarried,
      medication_taken: input.medicationTaken,
      first_aid_kit_carried: input.firstAidKitCarried,
      incident_during_trip: input.incidentDuringTrip,
      cost: input.cost ?? null,
      budget_approved: input.budgetApproved,
      children_names: input.childrenNames,
      learning_outcomes: input.learningOutcomes,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      organised_by: input.organisedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HolidayTripRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_holiday_trips") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTripMetrics,
  identifyTripAlerts,
};
