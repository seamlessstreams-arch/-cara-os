// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRIVACY & DIGNITY MONITORING SERVICE
// Monitors respect for children's privacy, personal space,
// dignity in care practices, and confidentiality standards.
// CHR 2015 Reg 21 (privacy and dignity),
// Reg 10 (contact with family — private communications).
//
// Covers: privacy area, dignity rating, intrusion type,
// response quality, and staff awareness.
//
// SCCIF: Experiences — "Children's privacy is consistently respected."
// "Dignity is upheld in all aspects of daily care."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PrivacyArea =
  | "bedroom_privacy"
  | "bathroom_privacy"
  | "personal_belongings"
  | "correspondence"
  | "phone_calls"
  | "online_communications"
  | "health_information"
  | "personal_records"
  | "intimate_care"
  | "other";

export type DignityRating =
  | "exemplary"
  | "good"
  | "adequate"
  | "poor"
  | "unacceptable";

export type IntrusionType =
  | "none"
  | "room_entry_without_knock"
  | "belongings_searched"
  | "mail_opened"
  | "phone_monitored"
  | "conversation_overheard"
  | "personal_info_shared"
  | "intimate_care_issue"
  | "cctv_concern"
  | "other";

export type ResponseQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "no_response";

export interface PrivacyDignityMonitoringRecord {
  id: string;
  home_id: string;
  privacy_area: PrivacyArea;
  dignity_rating: DignityRating;
  intrusion_type: IntrusionType;
  response_quality: ResponseQuality;
  monitoring_date: string;
  child_name: string;
  child_id: string | null;
  monitored_by: string;
  child_views_sought: boolean;
  knock_before_entry: boolean;
  personal_space_respected: boolean;
  confidentiality_maintained: boolean;
  complaints_process_explained: boolean;
  staff_awareness_adequate: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  intimate_care_policy_followed: boolean;
  cctv_compliant: boolean;
  dignity_in_language: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PRIVACY_AREAS: { area: PrivacyArea; label: string }[] = [
  { area: "bedroom_privacy", label: "Bedroom Privacy" },
  { area: "bathroom_privacy", label: "Bathroom Privacy" },
  { area: "personal_belongings", label: "Personal Belongings" },
  { area: "correspondence", label: "Correspondence" },
  { area: "phone_calls", label: "Phone Calls" },
  { area: "online_communications", label: "Online Communications" },
  { area: "health_information", label: "Health Information" },
  { area: "personal_records", label: "Personal Records" },
  { area: "intimate_care", label: "Intimate Care" },
  { area: "other", label: "Other" },
];

export const DIGNITY_RATINGS: { rating: DignityRating; label: string }[] = [
  { rating: "exemplary", label: "Exemplary" },
  { rating: "good", label: "Good" },
  { rating: "adequate", label: "Adequate" },
  { rating: "poor", label: "Poor" },
  { rating: "unacceptable", label: "Unacceptable" },
];

export const INTRUSION_TYPES: { type: IntrusionType; label: string }[] = [
  { type: "none", label: "None" },
  { type: "room_entry_without_knock", label: "Room Entry Without Knock" },
  { type: "belongings_searched", label: "Belongings Searched" },
  { type: "mail_opened", label: "Mail Opened" },
  { type: "phone_monitored", label: "Phone Monitored" },
  { type: "conversation_overheard", label: "Conversation Overheard" },
  { type: "personal_info_shared", label: "Personal Info Shared" },
  { type: "intimate_care_issue", label: "Intimate Care Issue" },
  { type: "cctv_concern", label: "CCTV Concern" },
  { type: "other", label: "Other" },
];

export const RESPONSE_QUALITIES: { quality: ResponseQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "no_response", label: "No Response" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computePrivacyDignityMetrics(
  records: PrivacyDignityMonitoringRecord[],
): {
  total_checks: number;
  poor_dignity_count: number;
  unacceptable_count: number;
  intrusion_count: number;
  no_response_count: number;
  child_views_rate: number | null;
  knock_rate: number | null;
  personal_space_rate: number | null;
  confidentiality_rate: number | null;
  complaints_process_rate: number | null;
  staff_awareness_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  intimate_care_rate: number | null;
  cctv_rate: number | null;
  dignity_language_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_privacy_area: Record<string, number>;
  by_dignity_rating: Record<string, number>;
  by_intrusion_type: Record<string, number>;
  by_response_quality: Record<string, number>;
} {
  const poorDignity = records.filter((r) => r.dignity_rating === "poor").length;
  const unacceptable = records.filter((r) => r.dignity_rating === "unacceptable").length;
  const intrusions = records.filter((r) => r.intrusion_type !== "none").length;
  const noResponse = records.filter((r) => r.response_quality === "no_response").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof PrivacyDignityMonitoringRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.privacy_area] = (byArea[r.privacy_area] ?? 0) + 1;

  const byDignity: Record<string, number> = {};
  for (const r of records) byDignity[r.dignity_rating] = (byDignity[r.dignity_rating] ?? 0) + 1;

  const byIntrusion: Record<string, number> = {};
  for (const r of records) byIntrusion[r.intrusion_type] = (byIntrusion[r.intrusion_type] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.response_quality] = (byResponse[r.response_quality] ?? 0) + 1;

  return {
    total_checks: records.length,
    poor_dignity_count: poorDignity,
    unacceptable_count: unacceptable,
    intrusion_count: intrusions,
    no_response_count: noResponse,
    child_views_rate: boolRate("child_views_sought"),
    knock_rate: boolRate("knock_before_entry"),
    personal_space_rate: boolRate("personal_space_respected"),
    confidentiality_rate: boolRate("confidentiality_maintained"),
    complaints_process_rate: boolRate("complaints_process_explained"),
    staff_awareness_rate: boolRate("staff_awareness_adequate"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    intimate_care_rate: boolRate("intimate_care_policy_followed"),
    cctv_rate: boolRate("cctv_compliant"),
    dignity_language_rate: boolRate("dignity_in_language"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_privacy_area: byArea,
    by_dignity_rating: byDignity,
    by_intrusion_type: byIntrusion,
    by_response_quality: byResponse,
  };
}

export function identifyPrivacyDignityAlerts(
  records: PrivacyDignityMonitoringRecord[],
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

  // Unacceptable dignity with intrusion — per-record
  for (const r of records) {
    if (r.dignity_rating === "unacceptable" && r.intrusion_type !== "none") {
      alerts.push({
        type: "unacceptable_with_intrusion",
        severity: "critical",
        message: `${r.child_name}'s dignity rated unacceptable with ${r.intrusion_type.replace(/_/g, " ")} — immediate Reg 21 action required`,
        id: r.id,
      });
    }
  }

  // Confidentiality not maintained
  const noConfidentiality = records.filter((r) => !r.confidentiality_maintained).length;
  if (noConfidentiality >= 1) {
    alerts.push({
      type: "confidentiality_breach",
      severity: "high",
      message: `${noConfidentiality} ${noConfidentiality === 1 ? "check shows" : "checks show"} confidentiality not maintained — review information sharing`,
      id: "confidentiality_breach",
    });
  }

  // Knock before entry not practiced
  const noKnock = records.filter((r) => !r.knock_before_entry).length;
  if (noKnock >= 1) {
    alerts.push({
      type: "no_knock_before_entry",
      severity: "high",
      message: `${noKnock} ${noKnock === 1 ? "check shows" : "checks show"} no knock before entry — reinforce privacy practice`,
      id: "no_knock_before_entry",
    });
  }

  // Staff awareness not adequate
  const noAwareness = records.filter((r) => !r.staff_awareness_adequate).length;
  if (noAwareness >= 2) {
    alerts.push({
      type: "staff_awareness_lacking",
      severity: "medium",
      message: `${noAwareness} checks with inadequate staff awareness — arrange privacy and dignity training`,
      id: "staff_awareness_lacking",
    });
  }

  // Intimate care policy not followed
  const noIntimate = records.filter((r) => !r.intimate_care_policy_followed).length;
  if (noIntimate >= 2) {
    alerts.push({
      type: "intimate_care_policy_breach",
      severity: "medium",
      message: `${noIntimate} checks with intimate care policy not followed — review procedures urgently`,
      id: "intimate_care_policy_breach",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    privacyArea?: PrivacyArea;
    dignityRating?: DignityRating;
    intrusionType?: IntrusionType;
    responseQuality?: ResponseQuality;
    limit?: number;
  },
): Promise<ServiceResult<PrivacyDignityMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_privacy_dignity_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.privacyArea) q = q.eq("privacy_area", filters.privacyArea);
  if (filters?.dignityRating) q = q.eq("dignity_rating", filters.dignityRating);
  if (filters?.intrusionType) q = q.eq("intrusion_type", filters.intrusionType);
  if (filters?.responseQuality) q = q.eq("response_quality", filters.responseQuality);
  q = q.order("monitoring_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PrivacyDignityMonitoringRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  privacyArea: PrivacyArea;
  dignityRating: DignityRating;
  intrusionType: IntrusionType;
  responseQuality: ResponseQuality;
  monitoringDate: string;
  childName: string;
  childId?: string | null;
  monitoredBy: string;
  childViewsSought?: boolean;
  knockBeforeEntry?: boolean;
  personalSpaceRespected?: boolean;
  confidentialityMaintained?: boolean;
  complaintsProcessExplained?: boolean;
  staffAwarenessAdequate?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  intimateCarePolicyFollowed?: boolean;
  cctvCompliant?: boolean;
  dignityInLanguage?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<PrivacyDignityMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_privacy_dignity_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      privacy_area: payload.privacyArea,
      dignity_rating: payload.dignityRating,
      intrusion_type: payload.intrusionType,
      response_quality: payload.responseQuality,
      monitoring_date: payload.monitoringDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      monitored_by: payload.monitoredBy,
      child_views_sought: payload.childViewsSought ?? true,
      knock_before_entry: payload.knockBeforeEntry ?? true,
      personal_space_respected: payload.personalSpaceRespected ?? true,
      confidentiality_maintained: payload.confidentialityMaintained ?? true,
      complaints_process_explained: payload.complaintsProcessExplained ?? true,
      staff_awareness_adequate: payload.staffAwarenessAdequate ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      intimate_care_policy_followed: payload.intimateCarePolicyFollowed ?? true,
      cctv_compliant: payload.cctvCompliant ?? true,
      dignity_in_language: payload.dignityInLanguage ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PrivacyDignityMonitoringRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    privacyArea: PrivacyArea;
    dignityRating: DignityRating;
    intrusionType: IntrusionType;
    responseQuality: ResponseQuality;
    monitoringDate: string;
    childName: string;
    childId: string | null;
    monitoredBy: string;
    childViewsSought: boolean;
    knockBeforeEntry: boolean;
    personalSpaceRespected: boolean;
    confidentialityMaintained: boolean;
    complaintsProcessExplained: boolean;
    staffAwarenessAdequate: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    intimateCarePolicyFollowed: boolean;
    cctvCompliant: boolean;
    dignityInLanguage: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PrivacyDignityMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.privacyArea !== undefined) mapped.privacy_area = updates.privacyArea;
  if (updates.dignityRating !== undefined) mapped.dignity_rating = updates.dignityRating;
  if (updates.intrusionType !== undefined) mapped.intrusion_type = updates.intrusionType;
  if (updates.responseQuality !== undefined) mapped.response_quality = updates.responseQuality;
  if (updates.monitoringDate !== undefined) mapped.monitoring_date = updates.monitoringDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.monitoredBy !== undefined) mapped.monitored_by = updates.monitoredBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.knockBeforeEntry !== undefined) mapped.knock_before_entry = updates.knockBeforeEntry;
  if (updates.personalSpaceRespected !== undefined) mapped.personal_space_respected = updates.personalSpaceRespected;
  if (updates.confidentialityMaintained !== undefined) mapped.confidentiality_maintained = updates.confidentialityMaintained;
  if (updates.complaintsProcessExplained !== undefined) mapped.complaints_process_explained = updates.complaintsProcessExplained;
  if (updates.staffAwarenessAdequate !== undefined) mapped.staff_awareness_adequate = updates.staffAwarenessAdequate;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.intimateCarePolicyFollowed !== undefined) mapped.intimate_care_policy_followed = updates.intimateCarePolicyFollowed;
  if (updates.cctvCompliant !== undefined) mapped.cctv_compliant = updates.cctvCompliant;
  if (updates.dignityInLanguage !== undefined) mapped.dignity_in_language = updates.dignityInLanguage;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_privacy_dignity_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PrivacyDignityMonitoringRecord };
}

export const _testing = { computePrivacyDignityMetrics, identifyPrivacyDignityAlerts };
