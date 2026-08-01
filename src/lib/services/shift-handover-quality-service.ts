// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT HANDOVER QUALITY SERVICE
// Tracks the quality and completeness of shift handovers between staff
// teams, ensuring critical information is passed on safely.
// CHR 2015 Reg 22 (arrangements for supervision — shift handovers),
// Reg 12 (health and wellbeing — continuity of care),
// Reg 13 (leadership — effective communication between shifts).
//
// Covers: handover quality audits, information completeness checks,
// critical information transfer, medication handover, safeguarding
// updates, incident continuity, and care plan communication.
//
// SCCIF: Leadership — "Handovers are thorough and informative."
// "Staff are fully briefed on children's needs."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type HandoverType =
  | "day_to_night"
  | "night_to_day"
  | "day_to_day"
  | "weekend_handover"
  | "emergency_handover"
  | "staff_changeover"
  | "management_handover"
  | "agency_staff_handover"
  | "annual_leave_return"
  | "other";

export type QualityRating =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "inadequate";

export type CompletionStatus =
  | "fully_complete"
  | "mostly_complete"
  | "partially_complete"
  | "incomplete"
  | "not_done";

export type HandoverFormat =
  | "face_to_face"
  | "written_only"
  | "verbal_and_written"
  | "digital_system"
  | "telephone";

export interface ShiftHandoverQualityRecord {
  id: string;
  home_id: string;
  handover_type: HandoverType;
  quality_rating: QualityRating;
  completion_status: CompletionStatus;
  handover_format: HandoverFormat;
  handover_date: string;
  outgoing_staff: string;
  incoming_staff: string;
  medication_info_shared: boolean;
  safeguarding_updates: boolean;
  incident_continuity: boolean;
  care_plan_updates: boolean;
  risk_info_shared: boolean;
  appointments_communicated: boolean;
  behaviour_updates: boolean;
  emotional_wellbeing_noted: boolean;
  food_dietary_noted: boolean;
  contact_updates: boolean;
  key_tasks_identified: boolean;
  read_and_signed: boolean;
  issues_found: string[];
  actions_taken: string[];
  audited_by: string;
  next_audit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const HANDOVER_TYPES: { type: HandoverType; label: string }[] = [
  { type: "day_to_night", label: "Day to Night" },
  { type: "night_to_day", label: "Night to Day" },
  { type: "day_to_day", label: "Day to Day" },
  { type: "weekend_handover", label: "Weekend Handover" },
  { type: "emergency_handover", label: "Emergency Handover" },
  { type: "staff_changeover", label: "Staff Changeover" },
  { type: "management_handover", label: "Management Handover" },
  { type: "agency_staff_handover", label: "Agency Staff Handover" },
  { type: "annual_leave_return", label: "Annual Leave Return" },
  { type: "other", label: "Other" },
];

export const QUALITY_RATINGS: { rating: QualityRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "adequate", label: "Adequate" },
  { rating: "poor", label: "Poor" },
  { rating: "inadequate", label: "Inadequate" },
];

export const COMPLETION_STATUSES: { status: CompletionStatus; label: string }[] = [
  { status: "fully_complete", label: "Fully Complete" },
  { status: "mostly_complete", label: "Mostly Complete" },
  { status: "partially_complete", label: "Partially Complete" },
  { status: "incomplete", label: "Incomplete" },
  { status: "not_done", label: "Not Done" },
];

export const HANDOVER_FORMATS: { format: HandoverFormat; label: string }[] = [
  { format: "face_to_face", label: "Face to Face" },
  { format: "written_only", label: "Written Only" },
  { format: "verbal_and_written", label: "Verbal & Written" },
  { format: "digital_system", label: "Digital System" },
  { format: "telephone", label: "Telephone" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeShiftHandoverQualityMetrics(
  records: ShiftHandoverQualityRecord[],
): {
  total_audits: number;
  excellent_count: number;
  good_count: number;
  poor_count: number;
  inadequate_count: number;
  fully_complete_count: number;
  incomplete_count: number;
  medication_info_rate: number | null;
  safeguarding_updates_rate: number | null;
  incident_continuity_rate: number | null;
  care_plan_updates_rate: number | null;
  risk_info_rate: number | null;
  appointments_rate: number | null;
  behaviour_updates_rate: number | null;
  emotional_wellbeing_rate: number | null;
  food_dietary_rate: number | null;
  contact_updates_rate: number | null;
  key_tasks_rate: number | null;
  read_and_signed_rate: number | null;
  by_handover_type: Record<string, number>;
  by_quality_rating: Record<string, number>;
  by_completion_status: Record<string, number>;
  by_handover_format: Record<string, number>;
} {
  const excellent = records.filter((r) => r.quality_rating === "excellent").length;
  const good = records.filter((r) => r.quality_rating === "good").length;
  const poor = records.filter((r) => r.quality_rating === "poor").length;
  const inadequate = records.filter((r) => r.quality_rating === "inadequate").length;
  const fullyComplete = records.filter((r) => r.completion_status === "fully_complete").length;
  const incomplete = records.filter((r) => r.completion_status === "incomplete" || r.completion_status === "not_done").length;

  const boolRate = (field: keyof ShiftHandoverQualityRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.handover_type] = (byType[r.handover_type] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.quality_rating] = (byRating[r.quality_rating] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.completion_status] = (byStatus[r.completion_status] ?? 0) + 1;

  const byFormat: Record<string, number> = {};
  for (const r of records) byFormat[r.handover_format] = (byFormat[r.handover_format] ?? 0) + 1;

  return {
    total_audits: records.length,
    excellent_count: excellent,
    good_count: good,
    poor_count: poor,
    inadequate_count: inadequate,
    fully_complete_count: fullyComplete,
    incomplete_count: incomplete,
    medication_info_rate: boolRate("medication_info_shared"),
    safeguarding_updates_rate: boolRate("safeguarding_updates"),
    incident_continuity_rate: boolRate("incident_continuity"),
    care_plan_updates_rate: boolRate("care_plan_updates"),
    risk_info_rate: boolRate("risk_info_shared"),
    appointments_rate: boolRate("appointments_communicated"),
    behaviour_updates_rate: boolRate("behaviour_updates"),
    emotional_wellbeing_rate: boolRate("emotional_wellbeing_noted"),
    food_dietary_rate: boolRate("food_dietary_noted"),
    contact_updates_rate: boolRate("contact_updates"),
    key_tasks_rate: boolRate("key_tasks_identified"),
    read_and_signed_rate: boolRate("read_and_signed"),
    by_handover_type: byType,
    by_quality_rating: byRating,
    by_completion_status: byStatus,
    by_handover_format: byFormat,
  };
}

export function identifyShiftHandoverQualityAlerts(
  records: ShiftHandoverQualityRecord[],
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

  // Inadequate handover with safeguarding gaps
  for (const r of records) {
    if (r.quality_rating === "inadequate" && !r.safeguarding_updates) {
      alerts.push({
        type: "inadequate_safeguarding_gap",
        severity: "critical",
        message: `Inadequate handover on ${r.handover_date} — safeguarding updates not shared between ${r.outgoing_staff} and ${r.incoming_staff}`,
        id: r.id,
      });
    }
  }

  // Medication info not shared
  const noMedInfo = records.filter((r) => !r.medication_info_shared).length;
  if (noMedInfo >= 1) {
    alerts.push({
      type: "medication_not_shared",
      severity: "high",
      message: `${noMedInfo} ${noMedInfo === 1 ? "handover has" : "handovers have"} medication info not shared — risk to children's health`,
      id: "medication_not_shared",
    });
  }

  // Risk info not shared
  const noRiskInfo = records.filter((r) => !r.risk_info_shared).length;
  if (noRiskInfo >= 1) {
    alerts.push({
      type: "risk_not_shared",
      severity: "high",
      message: `${noRiskInfo} ${noRiskInfo === 1 ? "handover has" : "handovers have"} risk information not shared — review handover process`,
      id: "risk_not_shared",
    });
  }

  // Not read and signed
  const notSigned = records.filter((r) => !r.read_and_signed).length;
  if (notSigned >= 2) {
    alerts.push({
      type: "not_read_signed",
      severity: "medium",
      message: `${notSigned} handovers not read and signed — ensure accountability`,
      id: "not_read_signed",
    });
  }

  // Care plan updates not shared
  const noCarePlan = records.filter((r) => !r.care_plan_updates).length;
  if (noCarePlan >= 3) {
    alerts.push({
      type: "care_plan_not_shared",
      severity: "medium",
      message: `${noCarePlan} handovers without care plan updates — improve continuity`,
      id: "care_plan_not_shared",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    handoverType?: HandoverType;
    qualityRating?: QualityRating;
    completionStatus?: CompletionStatus;
    handoverFormat?: HandoverFormat;
    limit?: number;
  },
): Promise<ServiceResult<ShiftHandoverQualityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_shift_handover_quality") as SB).select("*").eq("home_id", homeId);
  if (filters?.handoverType) q = q.eq("handover_type", filters.handoverType);
  if (filters?.qualityRating) q = q.eq("quality_rating", filters.qualityRating);
  if (filters?.completionStatus) q = q.eq("completion_status", filters.completionStatus);
  if (filters?.handoverFormat) q = q.eq("handover_format", filters.handoverFormat);
  q = q.order("handover_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    handoverType: HandoverType;
    qualityRating: QualityRating;
    completionStatus: CompletionStatus;
    handoverFormat: HandoverFormat;
    handoverDate: string;
    outgoingStaff: string;
    incomingStaff: string;
    medicationInfoShared?: boolean;
    safeguardingUpdates?: boolean;
    incidentContinuity?: boolean;
    carePlanUpdates?: boolean;
    riskInfoShared?: boolean;
    appointmentsCommunicated?: boolean;
    behaviourUpdates?: boolean;
    emotionalWellbeingNoted?: boolean;
    foodDietaryNoted?: boolean;
    contactUpdates?: boolean;
    keyTasksIdentified?: boolean;
    readAndSigned?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    auditedBy: string;
    nextAuditDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ShiftHandoverQualityRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_shift_handover_quality") as SB)
    .insert({
      home_id: payload.homeId,
      handover_type: payload.handoverType,
      quality_rating: payload.qualityRating,
      completion_status: payload.completionStatus,
      handover_format: payload.handoverFormat,
      handover_date: payload.handoverDate,
      outgoing_staff: payload.outgoingStaff,
      incoming_staff: payload.incomingStaff,
      medication_info_shared: payload.medicationInfoShared ?? true,
      safeguarding_updates: payload.safeguardingUpdates ?? true,
      incident_continuity: payload.incidentContinuity ?? true,
      care_plan_updates: payload.carePlanUpdates ?? true,
      risk_info_shared: payload.riskInfoShared ?? true,
      appointments_communicated: payload.appointmentsCommunicated ?? true,
      behaviour_updates: payload.behaviourUpdates ?? true,
      emotional_wellbeing_noted: payload.emotionalWellbeingNoted ?? true,
      food_dietary_noted: payload.foodDietaryNoted ?? true,
      contact_updates: payload.contactUpdates ?? true,
      key_tasks_identified: payload.keyTasksIdentified ?? true,
      read_and_signed: payload.readAndSigned ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      audited_by: payload.auditedBy,
      next_audit_date: payload.nextAuditDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    handoverType: HandoverType;
    qualityRating: QualityRating;
    completionStatus: CompletionStatus;
    handoverFormat: HandoverFormat;
    handoverDate: string;
    outgoingStaff: string;
    incomingStaff: string;
    medicationInfoShared: boolean;
    safeguardingUpdates: boolean;
    incidentContinuity: boolean;
    carePlanUpdates: boolean;
    riskInfoShared: boolean;
    appointmentsCommunicated: boolean;
    behaviourUpdates: boolean;
    emotionalWellbeingNoted: boolean;
    foodDietaryNoted: boolean;
    contactUpdates: boolean;
    keyTasksIdentified: boolean;
    readAndSigned: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    auditedBy: string;
    nextAuditDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ShiftHandoverQualityRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.handoverType !== undefined) mapped.handover_type = updates.handoverType;
  if (updates.qualityRating !== undefined) mapped.quality_rating = updates.qualityRating;
  if (updates.completionStatus !== undefined) mapped.completion_status = updates.completionStatus;
  if (updates.handoverFormat !== undefined) mapped.handover_format = updates.handoverFormat;
  if (updates.handoverDate !== undefined) mapped.handover_date = updates.handoverDate;
  if (updates.outgoingStaff !== undefined) mapped.outgoing_staff = updates.outgoingStaff;
  if (updates.incomingStaff !== undefined) mapped.incoming_staff = updates.incomingStaff;
  if (updates.medicationInfoShared !== undefined) mapped.medication_info_shared = updates.medicationInfoShared;
  if (updates.safeguardingUpdates !== undefined) mapped.safeguarding_updates = updates.safeguardingUpdates;
  if (updates.incidentContinuity !== undefined) mapped.incident_continuity = updates.incidentContinuity;
  if (updates.carePlanUpdates !== undefined) mapped.care_plan_updates = updates.carePlanUpdates;
  if (updates.riskInfoShared !== undefined) mapped.risk_info_shared = updates.riskInfoShared;
  if (updates.appointmentsCommunicated !== undefined) mapped.appointments_communicated = updates.appointmentsCommunicated;
  if (updates.behaviourUpdates !== undefined) mapped.behaviour_updates = updates.behaviourUpdates;
  if (updates.emotionalWellbeingNoted !== undefined) mapped.emotional_wellbeing_noted = updates.emotionalWellbeingNoted;
  if (updates.foodDietaryNoted !== undefined) mapped.food_dietary_noted = updates.foodDietaryNoted;
  if (updates.contactUpdates !== undefined) mapped.contact_updates = updates.contactUpdates;
  if (updates.keyTasksIdentified !== undefined) mapped.key_tasks_identified = updates.keyTasksIdentified;
  if (updates.readAndSigned !== undefined) mapped.read_and_signed = updates.readAndSigned;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.auditedBy !== undefined) mapped.audited_by = updates.auditedBy;
  if (updates.nextAuditDate !== undefined) mapped.next_audit_date = updates.nextAuditDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_shift_handover_quality") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeShiftHandoverQualityMetrics,
  identifyShiftHandoverQualityAlerts,
};
