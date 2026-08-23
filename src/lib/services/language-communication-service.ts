// ══════════════════════════════════════════════════════════════════════════════
// CARA — LANGUAGE & COMMUNICATION SERVICE
// Tracks children's language, communication needs, EAL support,
// speech and language therapy, communication passports, and
// reasonable adjustments for effective participation.
// CHR 2015 Reg 6 (quality and purpose of care),
// Reg 7 (children's views — ensuring every child can communicate),
// Equality Act 2010 (reasonable adjustments).
//
// Covers: first language, interpreter needs, speech therapy,
// communication passports, Makaton/PECS/BSL, augmentative aids.
//
// SCCIF: Overall Experiences — "Children are listened to and
// their views are acted upon." "Communication needs are understood."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CommunicationNeed =
  | "english_additional_language"
  | "speech_language_delay"
  | "hearing_impairment"
  | "visual_impairment"
  | "autism_related"
  | "learning_disability"
  | "selective_mutism"
  | "stammering"
  | "nonverbal"
  | "limited_verbal"
  | "trauma_related"
  | "other";

export type SupportType =
  | "interpreter"
  | "speech_therapy"
  | "communication_passport"
  | "makaton"
  | "pecs"
  | "bsl"
  | "augmentative_device"
  | "visual_schedule"
  | "social_stories"
  | "easy_read"
  | "picture_exchange"
  | "staff_training"
  | "specialist_assessment"
  | "other";

export type SupportStatus =
  | "in_place"
  | "requested"
  | "awaiting_assessment"
  | "not_needed"
  | "refused"
  | "under_review";

export type ProgressRating =
  | "excellent"
  | "good"
  | "satisfactory"
  | "needs_improvement"
  | "not_assessed";

export interface LanguageRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  first_language: string;
  additional_languages: string[];
  communication_need: CommunicationNeed;
  support_type: SupportType;
  support_status: SupportStatus;
  progress_rating: ProgressRating;
  communication_passport_in_place: boolean;
  interpreter_required: boolean;
  interpreter_arranged: boolean;
  specialist_involved: boolean;
  specialist_name: string | null;
  staff_aware: boolean;
  staff_trained: boolean;
  child_views_captured: boolean;
  reasonable_adjustments: string[];
  review_date: string | null;
  last_assessment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const COMMUNICATION_NEEDS: { need: CommunicationNeed; label: string }[] = [
  { need: "english_additional_language", label: "English as Additional Language" },
  { need: "speech_language_delay", label: "Speech & Language Delay" },
  { need: "hearing_impairment", label: "Hearing Impairment" },
  { need: "visual_impairment", label: "Visual Impairment" },
  { need: "autism_related", label: "Autism-Related" },
  { need: "learning_disability", label: "Learning Disability" },
  { need: "selective_mutism", label: "Selective Mutism" },
  { need: "stammering", label: "Stammering" },
  { need: "nonverbal", label: "Nonverbal" },
  { need: "limited_verbal", label: "Limited Verbal" },
  { need: "trauma_related", label: "Trauma-Related" },
  { need: "other", label: "Other" },
];

export const SUPPORT_TYPES: { type: SupportType; label: string }[] = [
  { type: "interpreter", label: "Interpreter" },
  { type: "speech_therapy", label: "Speech Therapy" },
  { type: "communication_passport", label: "Communication Passport" },
  { type: "makaton", label: "Makaton" },
  { type: "pecs", label: "PECS" },
  { type: "bsl", label: "BSL" },
  { type: "augmentative_device", label: "Augmentative Device" },
  { type: "visual_schedule", label: "Visual Schedule" },
  { type: "social_stories", label: "Social Stories" },
  { type: "easy_read", label: "Easy Read" },
  { type: "picture_exchange", label: "Picture Exchange" },
  { type: "staff_training", label: "Staff Training" },
  { type: "specialist_assessment", label: "Specialist Assessment" },
  { type: "other", label: "Other" },
];

export const SUPPORT_STATUSES: { status: SupportStatus; label: string }[] = [
  { status: "in_place", label: "In Place" },
  { status: "requested", label: "Requested" },
  { status: "awaiting_assessment", label: "Awaiting Assessment" },
  { status: "not_needed", label: "Not Needed" },
  { status: "refused", label: "Refused" },
  { status: "under_review", label: "Under Review" },
];

export const PROGRESS_RATINGS: { rating: ProgressRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "satisfactory", label: "Satisfactory" },
  { rating: "needs_improvement", label: "Needs Improvement" },
  { rating: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeLanguageMetrics(
  records: LanguageRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_with_needs: number;
  needs_coverage: number | null;
  support_in_place_count: number;
  support_requested_count: number;
  awaiting_assessment_count: number;
  passport_in_place_rate: number | null;
  interpreter_required_count: number;
  interpreter_arranged_rate: number | null;
  specialist_involved_rate: number | null;
  staff_aware_rate: number | null;
  staff_trained_rate: number | null;
  child_views_rate: number | null;
  excellent_progress_count: number | null;
  needs_improvement_count: number | null;
  review_overdue_count: number | null;
  average_adjustments_per_child: number | null;
  by_communication_need: Record<string, number>;
  by_support_type: Record<string, number>;
  by_support_status: Record<string, number>;
  by_progress: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const needsCoverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const inPlace = records.filter((r) => r.support_status === "in_place").length;
  const requested = records.filter((r) => r.support_status === "requested").length;
  const awaiting = records.filter((r) => r.support_status === "awaiting_assessment").length;

  const passportInPlace = records.filter((r) => r.communication_passport_in_place).length;
  const passportRate =
    records.length > 0
      ? Math.round((passportInPlace / records.length) * 1000) / 10
      : null;

  const interpreterRequired = records.filter((r) => r.interpreter_required).length;
  const interpreterArranged = records.filter((r) => r.interpreter_required && r.interpreter_arranged).length;
  const interpreterRate =
    interpreterRequired > 0
      ? Math.round((interpreterArranged / interpreterRequired) * 1000) / 10
      : null;

  const specialist = records.filter((r) => r.specialist_involved).length;
  const specialistRate =
    records.length > 0
      ? Math.round((specialist / records.length) * 1000) / 10
      : null;

  const staffAware = records.filter((r) => r.staff_aware).length;
  const awareRate =
    records.length > 0
      ? Math.round((staffAware / records.length) * 1000) / 10
      : null;

  const staffTrained = records.filter((r) => r.staff_trained).length;
  const trainedRate =
    records.length > 0
      ? Math.round((staffTrained / records.length) * 1000) / 10
      : null;

  const childViews = records.filter((r) => r.child_views_captured).length;
  const viewsRate =
    records.length > 0
      ? Math.round((childViews / records.length) * 1000) / 10
      : null;

  const excellent = records.filter((r) => r.progress_rating === "excellent").length;
  const needsImprovement = records.filter((r) => r.progress_rating === "needs_improvement").length;

  const now = new Date();
  const reviewOverdue = records.filter(
    (r) => r.review_date && new Date(r.review_date) < now && r.support_status !== "not_needed",
  ).length;

  const totalAdjustments = records.reduce((sum, r) => sum + r.reasonable_adjustments.length, 0);
  const avgAdjustments =
    uniqueChildren > 0
      ? Math.round((totalAdjustments / uniqueChildren) * 10) / 10
      : null;

  const byNeed: Record<string, number> = {};
  for (const r of records) byNeed[r.communication_need] = (byNeed[r.communication_need] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.support_type] = (byType[r.support_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.support_status] = (byStatus[r.support_status] ?? 0) + 1;

  const byProgress: Record<string, number> = {};
  for (const r of records) byProgress[r.progress_rating] = (byProgress[r.progress_rating] ?? 0) + 1;

  return {
    total_records: records.length,
    children_with_needs: uniqueChildren,
    needs_coverage: needsCoverage,
    support_in_place_count: inPlace,
    support_requested_count: requested,
    awaiting_assessment_count: awaiting,
    passport_in_place_rate: passportRate,
    interpreter_required_count: interpreterRequired,
    interpreter_arranged_rate: interpreterRate,
    specialist_involved_rate: specialistRate,
    staff_aware_rate: awareRate,
    staff_trained_rate: trainedRate,
    child_views_rate: viewsRate,
    excellent_progress_count: excellent,
    needs_improvement_count: needsImprovement,
    review_overdue_count: reviewOverdue,
    average_adjustments_per_child: avgAdjustments,
    by_communication_need: byNeed,
    by_support_type: byType,
    by_support_status: byStatus,
    by_progress: byProgress,
  };
}

export function identifyLanguageAlerts(
  records: LanguageRecord[],
  _totalChildren: number,
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

  // Interpreter needed but not arranged
  for (const r of records) {
    if (r.interpreter_required && !r.interpreter_arranged) {
      alerts.push({
        type: "interpreter_not_arranged",
        severity: "critical",
        message: `Interpreter required for ${r.child_name} (${r.first_language}) but not yet arranged — child cannot participate fully without language support`,
        id: r.id,
      });
    }
  }

  // Support awaiting assessment
  const awaitingCount = records.filter((r) => r.support_status === "awaiting_assessment").length;
  if (awaitingCount >= 2) {
    alerts.push({
      type: "awaiting_assessment",
      severity: "high",
      message: `${awaitingCount} children awaiting communication assessment — delays may prevent children from expressing their views`,
      id: "awaiting_assessment",
    });
  }

  // Staff not trained for support needs
  for (const r of records) {
    if (!r.staff_trained && r.support_status === "in_place") {
      alerts.push({
        type: "staff_not_trained",
        severity: "high",
        message: `Staff not trained in ${r.child_name}'s communication support (${r.support_type.replace(/_/g, " ")}) — training needed for effective support`,
        id: r.id,
      });
    }
  }

  // Needs improvement without specialist
  for (const r of records) {
    if (r.progress_rating === "needs_improvement" && !r.specialist_involved) {
      alerts.push({
        type: "needs_specialist",
        severity: "medium",
        message: `${r.child_name}'s communication progress needs improvement but no specialist involved — consider referral`,
        id: r.id,
      });
    }
  }

  // Child views not captured
  const noViews = records.filter((r) => !r.child_views_captured && r.support_status !== "not_needed").length;
  if (noViews >= 3) {
    alerts.push({
      type: "child_views_missing",
      severity: "medium",
      message: `${noViews} communication support records lack the child's views — every child should be asked about their communication preferences`,
      id: "views_missing",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    communicationNeed?: CommunicationNeed;
    supportType?: SupportType;
    supportStatus?: SupportStatus;
    limit?: number;
  },
): Promise<ServiceResult<LanguageRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_language_communication") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.communicationNeed) q = q.eq("communication_need", filters.communicationNeed);
  if (filters?.supportType) q = q.eq("support_type", filters.supportType);
  if (filters?.supportStatus) q = q.eq("support_status", filters.supportStatus);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    firstLanguage: string;
    additionalLanguages: string[];
    communicationNeed: CommunicationNeed;
    supportType: SupportType;
    supportStatus: SupportStatus;
    progressRating: ProgressRating;
    communicationPassportInPlace: boolean;
    interpreterRequired: boolean;
    interpreterArranged: boolean;
    specialistInvolved: boolean;
    specialistName?: string;
    staffAware: boolean;
    staffTrained: boolean;
    childViewsCaptured: boolean;
    reasonableAdjustments: string[];
    reviewDate?: string;
    lastAssessmentDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<LanguageRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_language_communication") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      first_language: input.firstLanguage,
      additional_languages: input.additionalLanguages,
      communication_need: input.communicationNeed,
      support_type: input.supportType,
      support_status: input.supportStatus,
      progress_rating: input.progressRating,
      communication_passport_in_place: input.communicationPassportInPlace,
      interpreter_required: input.interpreterRequired,
      interpreter_arranged: input.interpreterArranged,
      specialist_involved: input.specialistInvolved,
      specialist_name: input.specialistName ?? null,
      staff_aware: input.staffAware,
      staff_trained: input.staffTrained,
      child_views_captured: input.childViewsCaptured,
      reasonable_adjustments: input.reasonableAdjustments,
      review_date: input.reviewDate ?? null,
      last_assessment_date: input.lastAssessmentDate ?? null,
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
): Promise<ServiceResult<LanguageRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_language_communication") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLanguageMetrics,
  identifyLanguageAlerts,
};
