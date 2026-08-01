// ══════════════════════════════════════════════════════════════════════════════
// CARA — ATTACHMENT & RELATIONSHIPS SERVICE
// Tracks attachment styles, key relationships, therapeutic reparenting
// approaches, and relationship quality for each child in care.
// CHR 2015 Reg 6 (quality and purpose of care — attachment-aware),
// Reg 10 (the care planning standard — relational security),
// Reg 12 (health and education — emotional wellbeing).
//
// Records attachment assessments, key relationship mappings,
// therapeutic approaches, and relational progress over time.
//
// SCCIF: Overall Experiences — "Children form trusting relationships
// with staff." "Attachment-aware practice supports children's recovery."
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

export type AttachmentStyle =
  | "secure"
  | "anxious_ambivalent"
  | "anxious_avoidant"
  | "disorganised"
  | "not_yet_assessed";

export type RelationshipType =
  | "key_worker"
  | "parent"
  | "sibling"
  | "extended_family"
  | "foster_carer"
  | "social_worker"
  | "therapist"
  | "teacher"
  | "peer"
  | "mentor"
  | "other_professional"
  | "other";

export type RelationshipQuality =
  | "strong_positive"
  | "positive"
  | "developing"
  | "inconsistent"
  | "strained"
  | "broken";

export type TherapeuticApproach =
  | "pace"
  | "dan_hughes"
  | "theraplay"
  | "dyadic_developmental"
  | "nurture_group"
  | "team_around_child"
  | "life_story_work"
  | "play_therapy"
  | "art_therapy"
  | "emdr"
  | "cbt"
  | "other";

export type AssessmentStatus =
  | "current"
  | "under_review"
  | "outdated"
  | "initial";

export interface AttachmentRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  attachment_style: AttachmentStyle;
  assessed_by: string;
  assessed_date: string;
  assessment_status: AssessmentStatus;
  next_review_date: string | null;
  relationship_type: RelationshipType;
  relationship_person: string;
  relationship_quality: RelationshipQuality;
  therapeutic_approach: TherapeuticApproach | null;
  approach_start_date: string | null;
  progress_notes: string | null;
  child_views: string | null;
  staff_trained_attachment: boolean;
  psychologist_involved: boolean;
  key_triggers: string[];
  calming_strategies: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ATTACHMENT_STYLES: { style: AttachmentStyle; label: string }[] = [
  { style: "secure", label: "Secure" },
  { style: "anxious_ambivalent", label: "Anxious-Ambivalent" },
  { style: "anxious_avoidant", label: "Anxious-Avoidant" },
  { style: "disorganised", label: "Disorganised" },
  { style: "not_yet_assessed", label: "Not Yet Assessed" },
];

export const RELATIONSHIP_TYPES: { type: RelationshipType; label: string }[] = [
  { type: "key_worker", label: "Key Worker" },
  { type: "parent", label: "Parent" },
  { type: "sibling", label: "Sibling" },
  { type: "extended_family", label: "Extended Family" },
  { type: "foster_carer", label: "Foster Carer" },
  { type: "social_worker", label: "Social Worker" },
  { type: "therapist", label: "Therapist" },
  { type: "teacher", label: "Teacher" },
  { type: "peer", label: "Peer" },
  { type: "mentor", label: "Mentor" },
  { type: "other_professional", label: "Other Professional" },
  { type: "other", label: "Other" },
];

export const RELATIONSHIP_QUALITIES: { quality: RelationshipQuality; label: string }[] = [
  { quality: "strong_positive", label: "Strong Positive" },
  { quality: "positive", label: "Positive" },
  { quality: "developing", label: "Developing" },
  { quality: "inconsistent", label: "Inconsistent" },
  { quality: "strained", label: "Strained" },
  { quality: "broken", label: "Broken" },
];

export const THERAPEUTIC_APPROACHES: { approach: TherapeuticApproach; label: string }[] = [
  { approach: "pace", label: "PACE (Playfulness, Acceptance, Curiosity, Empathy)" },
  { approach: "dan_hughes", label: "Dan Hughes Model" },
  { approach: "theraplay", label: "Theraplay" },
  { approach: "dyadic_developmental", label: "Dyadic Developmental Psychotherapy" },
  { approach: "nurture_group", label: "Nurture Group" },
  { approach: "team_around_child", label: "Team Around the Child" },
  { approach: "life_story_work", label: "Life Story Work" },
  { approach: "play_therapy", label: "Play Therapy" },
  { approach: "art_therapy", label: "Art Therapy" },
  { approach: "emdr", label: "EMDR" },
  { approach: "cbt", label: "CBT" },
  { approach: "other", label: "Other" },
];

export const ASSESSMENT_STATUSES: { status: AssessmentStatus; label: string }[] = [
  { status: "current", label: "Current" },
  { status: "under_review", label: "Under Review" },
  { status: "outdated", label: "Outdated" },
  { status: "initial", label: "Initial" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAttachmentMetrics(
  records: AttachmentRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_assessed: number;
  assessment_coverage: number | null;
  secure_count: number;
  anxious_ambivalent_count: number;
  anxious_avoidant_count: number;
  disorganised_count: number;
  not_assessed_count: number;
  current_assessments: number;
  outdated_assessments: number;
  strong_positive_relationships: number;
  strained_or_broken_count: number;
  therapeutic_approach_rate: number | null;
  psychologist_involved_rate: number | null;
  staff_trained_rate: number | null;
  child_views_rate: number | null;
  by_attachment_style: Record<string, number>;
  by_relationship_type: Record<string, number>;
  by_relationship_quality: Record<string, number>;
  by_therapeutic_approach: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const secure = records.filter((r) => r.attachment_style === "secure").length;
  const anxAmb = records.filter((r) => r.attachment_style === "anxious_ambivalent").length;
  const anxAvo = records.filter((r) => r.attachment_style === "anxious_avoidant").length;
  const disorg = records.filter((r) => r.attachment_style === "disorganised").length;
  const notAssessed = records.filter((r) => r.attachment_style === "not_yet_assessed").length;

  const current = records.filter((r) => r.assessment_status === "current").length;
  const outdated = records.filter((r) => r.assessment_status === "outdated").length;

  const strongPositive = records.filter((r) => r.relationship_quality === "strong_positive").length;
  const strainedBroken = records.filter(
    (r) => r.relationship_quality === "strained" || r.relationship_quality === "broken",
  ).length;

  const withTherapeutic = records.filter((r) => r.therapeutic_approach !== null).length;
  const therapeuticRate =
    records.length > 0
      ? Math.round((withTherapeutic / records.length) * 1000) / 10
      : null;

  const psychInvolved = records.filter((r) => r.psychologist_involved).length;
  const psychRate =
    records.length > 0
      ? Math.round((psychInvolved / records.length) * 1000) / 10
      : null;

  const staffTrained = records.filter((r) => r.staff_trained_attachment).length;
  const staffRate =
    records.length > 0
      ? Math.round((staffTrained / records.length) * 1000) / 10
      : null;

  const childViews = records.filter((r) => r.child_views !== null).length;
  const childRate =
    records.length > 0
      ? Math.round((childViews / records.length) * 1000) / 10
      : null;

  const byStyle: Record<string, number> = {};
  for (const r of records) byStyle[r.attachment_style] = (byStyle[r.attachment_style] ?? 0) + 1;

  const byRelType: Record<string, number> = {};
  for (const r of records) byRelType[r.relationship_type] = (byRelType[r.relationship_type] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.relationship_quality] = (byQuality[r.relationship_quality] ?? 0) + 1;

  const byApproach: Record<string, number> = {};
  for (const r of records) {
    if (r.therapeutic_approach) byApproach[r.therapeutic_approach] = (byApproach[r.therapeutic_approach] ?? 0) + 1;
  }

  return {
    total_records: records.length,
    children_assessed: uniqueChildren,
    assessment_coverage: coverage,
    secure_count: secure,
    anxious_ambivalent_count: anxAmb,
    anxious_avoidant_count: anxAvo,
    disorganised_count: disorg,
    not_assessed_count: notAssessed,
    current_assessments: current,
    outdated_assessments: outdated,
    strong_positive_relationships: strongPositive,
    strained_or_broken_count: strainedBroken,
    therapeutic_approach_rate: therapeuticRate,
    psychologist_involved_rate: psychRate,
    staff_trained_rate: staffRate,
    child_views_rate: childRate,
    by_attachment_style: byStyle,
    by_relationship_type: byRelType,
    by_relationship_quality: byQuality,
    by_therapeutic_approach: byApproach,
  };
}

export function identifyAttachmentAlerts(
  records: AttachmentRecord[],
  totalChildren: number,
  now: Date = new Date(),
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

  // Children without attachment assessment
  const childrenAssessed = new Set(records.map((r) => r.child_id));
  if (totalChildren > 0 && childrenAssessed.size < totalChildren) {
    const gap = totalChildren - childrenAssessed.size;
    alerts.push({
      type: "no_assessment",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no attachment assessment — assess attachment style to inform care approach`,
      id: "assessment_gap",
    });
  }

  // Disorganised attachment without therapeutic approach
  for (const r of records) {
    if (r.attachment_style === "disorganised" && r.therapeutic_approach === null) {
      alerts.push({
        type: "disorganised_no_therapy",
        severity: "critical",
        message: `${r.child_name} has disorganised attachment but no therapeutic approach in place — urgent specialist input needed`,
        id: r.id,
      });
    }
  }

  // Strained or broken key worker relationships
  for (const r of records) {
    if (
      r.relationship_type === "key_worker" &&
      (r.relationship_quality === "strained" || r.relationship_quality === "broken")
    ) {
      alerts.push({
        type: "key_worker_strained",
        severity: "high",
        message: `${r.child_name}'s relationship with key worker (${r.relationship_person}) is ${r.relationship_quality} — review key worker allocation`,
        id: r.id,
      });
    }
  }

  // Staff not trained in attachment-aware practice
  for (const r of records) {
    if (!r.staff_trained_attachment && r.attachment_style !== "not_yet_assessed" && r.attachment_style !== "secure") {
      alerts.push({
        type: "staff_not_trained",
        severity: "high",
        message: `Staff not trained on attachment-aware practice for ${r.child_name} (${r.attachment_style.replace(/_/g, " ")}) — training required`,
        id: r.id,
      });
    }
  }

  // Review overdue
  for (const r of records) {
    if (r.next_review_date && new Date(r.next_review_date) < now) {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Attachment assessment review for ${r.child_name} overdue since ${r.next_review_date}`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    attachmentStyle?: AttachmentStyle;
    relationshipType?: RelationshipType;
    assessmentStatus?: AssessmentStatus;
    limit?: number;
  },
): Promise<ServiceResult<AttachmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_attachment_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.attachmentStyle) q = q.eq("attachment_style", filters.attachmentStyle);
  if (filters?.relationshipType) q = q.eq("relationship_type", filters.relationshipType);
  if (filters?.assessmentStatus) q = q.eq("assessment_status", filters.assessmentStatus);
  q = q.order("assessed_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    attachmentStyle: AttachmentStyle;
    assessedBy: string;
    assessedDate: string;
    assessmentStatus: AssessmentStatus;
    nextReviewDate?: string;
    relationshipType: RelationshipType;
    relationshipPerson: string;
    relationshipQuality: RelationshipQuality;
    therapeuticApproach?: TherapeuticApproach;
    approachStartDate?: string;
    progressNotes?: string;
    childViews?: string;
    staffTrainedAttachment: boolean;
    psychologistInvolved: boolean;
    keyTriggers: string[];
    calmingStrategies: string[];
    notes?: string;
  },
): Promise<ServiceResult<AttachmentRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_attachment_records") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      attachment_style: input.attachmentStyle,
      assessed_by: input.assessedBy,
      assessed_date: input.assessedDate,
      assessment_status: input.assessmentStatus,
      next_review_date: input.nextReviewDate ?? null,
      relationship_type: input.relationshipType,
      relationship_person: input.relationshipPerson,
      relationship_quality: input.relationshipQuality,
      therapeutic_approach: input.therapeuticApproach ?? null,
      approach_start_date: input.approachStartDate ?? null,
      progress_notes: input.progressNotes ?? null,
      child_views: input.childViews ?? null,
      staff_trained_attachment: input.staffTrainedAttachment,
      psychologist_involved: input.psychologistInvolved,
      key_triggers: input.keyTriggers,
      calming_strategies: input.calmingStrategies,
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
): Promise<ServiceResult<AttachmentRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_attachment_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAttachmentMetrics,
  identifyAttachmentAlerts,
};
