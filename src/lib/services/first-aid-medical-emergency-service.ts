// ══════════════════════════════════════════════════════════════════════════════
// CARA — FIRST AID MEDICAL EMERGENCY SERVICE
// Tracks first aid incidents, medical emergencies, staff response,
// equipment checks, and emergency preparedness.
// CHR 2015 Reg 25(2)(c) (staff first aid training),
// Reg 31(2)(a) (health and safety — emergency procedures).
//
// Covers: incident type, severity level, response quality,
// outcome assessment, and training compliance.
//
// SCCIF: Leadership — "Emergency procedures are effective."
// "Staff are trained and respond appropriately to medical needs."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type IncidentType =
  | "minor_injury"
  | "major_injury"
  | "allergic_reaction"
  | "seizure"
  | "breathing_difficulty"
  | "choking"
  | "mental_health_crisis"
  | "medication_error"
  | "equipment_check"
  | "other";

export type SeverityLevel =
  | "minor"
  | "moderate"
  | "serious"
  | "life_threatening"
  | "preventive";

export type ResponseQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "failed";

export type OutcomeAssessment =
  | "full_recovery"
  | "improving"
  | "ongoing_treatment"
  | "hospitalised"
  | "escalated";

export interface FirstAidMedicalEmergencyRecord {
  id: string;
  home_id: string;
  incident_type: IncidentType;
  severity_level: SeverityLevel;
  response_quality: ResponseQuality;
  outcome_assessment: OutcomeAssessment;
  incident_date: string;
  child_name: string;
  child_id: string | null;
  responded_by: string;
  first_aid_trained: boolean;
  correct_procedure_followed: boolean;
  equipment_available: boolean;
  ambulance_called: boolean;
  parent_notified: boolean;
  gp_informed: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  incident_recorded: boolean;
  ofsted_notified: boolean;
  debrief_completed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INCIDENT_TYPES: { type: IncidentType; label: string }[] = [
  { type: "minor_injury", label: "Minor Injury" },
  { type: "major_injury", label: "Major Injury" },
  { type: "allergic_reaction", label: "Allergic Reaction" },
  { type: "seizure", label: "Seizure" },
  { type: "breathing_difficulty", label: "Breathing Difficulty" },
  { type: "choking", label: "Choking" },
  { type: "mental_health_crisis", label: "Mental Health Crisis" },
  { type: "medication_error", label: "Medication Error" },
  { type: "equipment_check", label: "Equipment Check" },
  { type: "other", label: "Other" },
];

export const SEVERITY_LEVELS: { level: SeverityLevel; label: string }[] = [
  { level: "minor", label: "Minor" },
  { level: "moderate", label: "Moderate" },
  { level: "serious", label: "Serious" },
  { level: "life_threatening", label: "Life Threatening" },
  { level: "preventive", label: "Preventive" },
];

export const RESPONSE_QUALITIES: { quality: ResponseQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "failed", label: "Failed" },
];

export const OUTCOME_ASSESSMENTS: { assessment: OutcomeAssessment; label: string }[] = [
  { assessment: "full_recovery", label: "Full Recovery" },
  { assessment: "improving", label: "Improving" },
  { assessment: "ongoing_treatment", label: "Ongoing Treatment" },
  { assessment: "hospitalised", label: "Hospitalised" },
  { assessment: "escalated", label: "Escalated" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeFirstAidMetrics(
  records: FirstAidMedicalEmergencyRecord[],
): {
  total_incidents: number;
  serious_count: number;
  poor_response_count: number;
  hospitalised_count: number;
  untrained_count: number;
  first_aid_trained_rate: number | null;
  correct_procedure_rate: number | null;
  equipment_rate: number | null;
  ambulance_rate: number | null;
  parent_notified_rate: number | null;
  gp_informed_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  incident_recorded_rate: number | null;
  ofsted_notified_rate: number | null;
  debrief_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_incident_type: Record<string, number>;
  by_severity_level: Record<string, number>;
  by_response_quality: Record<string, number>;
  by_outcome_assessment: Record<string, number>;
} {
  const serious = records.filter((r) => r.severity_level === "serious" || r.severity_level === "life_threatening").length;
  const poorResponse = records.filter((r) => r.response_quality === "poor" || r.response_quality === "failed").length;
  const hospitalised = records.filter((r) => r.outcome_assessment === "hospitalised").length;
  const untrained = records.filter((r) => !r.first_aid_trained).length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof FirstAidMedicalEmergencyRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.incident_type] = (byType[r.incident_type] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const r of records) bySeverity[r.severity_level] = (bySeverity[r.severity_level] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.response_quality] = (byResponse[r.response_quality] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.outcome_assessment] = (byOutcome[r.outcome_assessment] ?? 0) + 1;

  return {
    total_incidents: records.length,
    serious_count: serious,
    poor_response_count: poorResponse,
    hospitalised_count: hospitalised,
    untrained_count: untrained,
    first_aid_trained_rate: boolRate("first_aid_trained"),
    correct_procedure_rate: boolRate("correct_procedure_followed"),
    equipment_rate: boolRate("equipment_available"),
    ambulance_rate: boolRate("ambulance_called"),
    parent_notified_rate: boolRate("parent_notified"),
    gp_informed_rate: boolRate("gp_informed"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    incident_recorded_rate: boolRate("incident_recorded"),
    ofsted_notified_rate: boolRate("ofsted_notified"),
    debrief_rate: boolRate("debrief_completed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_incident_type: byType,
    by_severity_level: bySeverity,
    by_response_quality: byResponse,
    by_outcome_assessment: byOutcome,
  };
}

export function identifyFirstAidAlerts(
  records: FirstAidMedicalEmergencyRecord[],
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

  // Serious incident with failed response — per-record critical
  for (const r of records) {
    if ((r.severity_level === "serious" || r.severity_level === "life_threatening") && (r.response_quality === "poor" || r.response_quality === "failed")) {
      alerts.push({
        type: "serious_poor_response",
        severity: "critical",
        message: `${r.child_name} had ${r.severity_level.replace(/_/g, " ")} ${r.incident_type.replace(/_/g, " ")} with ${r.response_quality} response — immediate review required`,
        id: r.id,
      });
    }
  }

  // Untrained responder
  const untrained = records.filter((r) => !r.first_aid_trained).length;
  if (untrained >= 1) {
    alerts.push({
      type: "untrained_responder",
      severity: "high",
      message: `${untrained} ${untrained === 1 ? "incident has" : "incidents have"} untrained first aider responding — all staff must be trained`,
      id: "untrained_responder",
    });
  }

  // No correct procedure
  const noProcedure = records.filter((r) => !r.correct_procedure_followed).length;
  if (noProcedure >= 1) {
    alerts.push({
      type: "incorrect_procedure",
      severity: "high",
      message: `${noProcedure} ${noProcedure === 1 ? "incident has" : "incidents have"} incorrect procedure followed — review training and protocols`,
      id: "incorrect_procedure",
    });
  }

  // No debrief
  const noDebrief = records.filter((r) => !r.debrief_completed).length;
  if (noDebrief >= 2) {
    alerts.push({
      type: "no_debrief",
      severity: "medium",
      message: `${noDebrief} incidents without debrief completed — learning from incidents essential`,
      id: "no_debrief",
    });
  }

  // Equipment not available
  const noEquipment = records.filter((r) => !r.equipment_available).length;
  if (noEquipment >= 2) {
    alerts.push({
      type: "no_equipment",
      severity: "medium",
      message: `${noEquipment} incidents where equipment not available — ensure first aid supplies maintained`,
      id: "no_equipment",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    incidentType?: IncidentType; severityLevel?: SeverityLevel;
    responseQuality?: ResponseQuality; outcomeAssessment?: OutcomeAssessment; limit?: number;
  },
): Promise<ServiceResult<FirstAidMedicalEmergencyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_first_aid_medical_emergency") as SB).select("*").eq("home_id", homeId);
  if (filters?.incidentType) q = q.eq("incident_type", filters.incidentType);
  if (filters?.severityLevel) q = q.eq("severity_level", filters.severityLevel);
  if (filters?.responseQuality) q = q.eq("response_quality", filters.responseQuality);
  if (filters?.outcomeAssessment) q = q.eq("outcome_assessment", filters.outcomeAssessment);
  q = q.order("incident_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FirstAidMedicalEmergencyRecord[] };
}

export async function createRecord(payload: {
  homeId: string; incidentType: IncidentType; severityLevel: SeverityLevel;
  responseQuality: ResponseQuality; outcomeAssessment: OutcomeAssessment;
  incidentDate: string; childName: string; childId?: string | null; respondedBy: string;
  firstAidTrained?: boolean; correctProcedureFollowed?: boolean; equipmentAvailable?: boolean;
  ambulanceCalled?: boolean; parentNotified?: boolean; gpInformed?: boolean;
  carePlanReflects?: boolean; socialWorkerInformed?: boolean; incidentRecorded?: boolean;
  ofstedNotified?: boolean; debriefCompleted?: boolean; recordedPromptly?: boolean;
  issuesFound?: string[]; actionsTaken?: string[]; nextReviewDate?: string | null; notes?: string | null;
}): Promise<ServiceResult<FirstAidMedicalEmergencyRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_first_aid_medical_emergency") as SB)
    .insert({
      home_id: payload.homeId, incident_type: payload.incidentType, severity_level: payload.severityLevel,
      response_quality: payload.responseQuality, outcome_assessment: payload.outcomeAssessment,
      incident_date: payload.incidentDate, child_name: payload.childName, child_id: payload.childId ?? null,
      responded_by: payload.respondedBy, first_aid_trained: payload.firstAidTrained ?? true,
      correct_procedure_followed: payload.correctProcedureFollowed ?? true, equipment_available: payload.equipmentAvailable ?? true,
      ambulance_called: payload.ambulanceCalled ?? true, parent_notified: payload.parentNotified ?? true,
      gp_informed: payload.gpInformed ?? true, care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true, incident_recorded: payload.incidentRecorded ?? true,
      ofsted_notified: payload.ofstedNotified ?? true, debrief_completed: payload.debriefCompleted ?? true,
      recorded_promptly: payload.recordedPromptly ?? true, issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [], next_review_date: payload.nextReviewDate ?? null, notes: payload.notes ?? null,
    }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FirstAidMedicalEmergencyRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    incidentType: IncidentType; severityLevel: SeverityLevel; responseQuality: ResponseQuality;
    outcomeAssessment: OutcomeAssessment; incidentDate: string; childName: string; childId: string | null;
    respondedBy: string; firstAidTrained: boolean; correctProcedureFollowed: boolean; equipmentAvailable: boolean;
    ambulanceCalled: boolean; parentNotified: boolean; gpInformed: boolean; carePlanReflects: boolean;
    socialWorkerInformed: boolean; incidentRecorded: boolean; ofstedNotified: boolean; debriefCompleted: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<FirstAidMedicalEmergencyRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.incidentType !== undefined) mapped.incident_type = updates.incidentType;
  if (updates.severityLevel !== undefined) mapped.severity_level = updates.severityLevel;
  if (updates.responseQuality !== undefined) mapped.response_quality = updates.responseQuality;
  if (updates.outcomeAssessment !== undefined) mapped.outcome_assessment = updates.outcomeAssessment;
  if (updates.incidentDate !== undefined) mapped.incident_date = updates.incidentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.respondedBy !== undefined) mapped.responded_by = updates.respondedBy;
  if (updates.firstAidTrained !== undefined) mapped.first_aid_trained = updates.firstAidTrained;
  if (updates.correctProcedureFollowed !== undefined) mapped.correct_procedure_followed = updates.correctProcedureFollowed;
  if (updates.equipmentAvailable !== undefined) mapped.equipment_available = updates.equipmentAvailable;
  if (updates.ambulanceCalled !== undefined) mapped.ambulance_called = updates.ambulanceCalled;
  if (updates.parentNotified !== undefined) mapped.parent_notified = updates.parentNotified;
  if (updates.gpInformed !== undefined) mapped.gp_informed = updates.gpInformed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.incidentRecorded !== undefined) mapped.incident_recorded = updates.incidentRecorded;
  if (updates.ofstedNotified !== undefined) mapped.ofsted_notified = updates.ofstedNotified;
  if (updates.debriefCompleted !== undefined) mapped.debrief_completed = updates.debriefCompleted;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_first_aid_medical_emergency") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as FirstAidMedicalEmergencyRecord };
}

export const _testing = { computeFirstAidMetrics, identifyFirstAidAlerts };
