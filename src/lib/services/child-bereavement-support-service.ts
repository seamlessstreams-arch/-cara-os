// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD BEREAVEMENT SUPPORT SERVICE
// Tracks bereavement support provided to children in residential care,
// including therapeutic interventions, grief stages, specialist referrals,
// and multi-agency notification.
// CHR 2015 Reg 7 (individual child — understanding each child's needs),
// CHR 2015 Reg 10 (health and wellbeing — emotional wellbeing),
// CHR 2015 Reg 12 (protection of children — safeguarding vulnerable children).
//
// Covers: bereavement dates, grief stages, support types, specialist
// referrals, CAMHS involvement, school/social worker notification,
// memorial activities, and ongoing support planning.
//
// SCCIF: Experiences — "Children feel cared for and listened to."
// "Staff understand and respond to children's emotional needs."
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

export const DECEASED_RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Grandparent",
  "Friend",
  "Carer",
  "Pet",
  "Other",
] as const;
export type DeceasedRelationship = (typeof DECEASED_RELATIONSHIPS)[number];

export const GRIEF_STAGES = [
  "Denial",
  "Anger",
  "Bargaining",
  "Depression",
  "Acceptance",
  "Not Assessed",
] as const;
export type GriefStage = (typeof GRIEF_STAGES)[number];

export const SUPPORT_TYPES = [
  "Key Worker",
  "Counselling",
  "Specialist Therapy",
  "Group Support",
  "Creative Therapy",
  "Memory Work",
  "Referral Only",
] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export interface ChildBereavementSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  bereavement_date: string;
  deceased_relationship: DeceasedRelationship;
  grief_stage: GriefStage;
  support_type: SupportType;
  specialist_referral_made: boolean;
  specialist_service: string | null;
  camhs_involvement: boolean;
  school_notified: boolean;
  social_worker_notified: boolean;
  memorial_activity_planned: boolean;
  ongoing_support_needed: boolean;
  review_date: string | null;
  key_worker_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildBereavementSupportRow[],
): {
  total_records: number;
  ongoing_support_count: number;
  specialist_referral_count: number;
  camhs_involvement_count: number;
  school_notification_rate: number;
  social_worker_rate: number;
  memorial_activity_rate: number;
  review_scheduled_rate: number;
  unique_children: number;
  unique_key_workers: number;
  deceased_relationship_breakdown: Record<string, number>;
  grief_stage_breakdown: Record<string, number>;
  support_type_breakdown: Record<string, number>;
} {
  const ongoingSupportCount = rows.filter((r) => r.ongoing_support_needed).length;
  const specialistReferralCount = rows.filter((r) => r.specialist_referral_made).length;
  const camhsInvolvementCount = rows.filter((r) => r.camhs_involvement).length;

  const boolRate = (fn: (r: ChildBereavementSupportRow) => boolean) => {
    const count = rows.filter(fn).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const schoolNotificationRate = boolRate((r) => r.school_notified);
  const socialWorkerRate = boolRate((r) => r.social_worker_notified);
  const memorialActivityRate = boolRate((r) => r.memorial_activity_planned);
  const reviewScheduledRate = boolRate((r) => r.review_date !== null);

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueKeyWorkers = new Set(rows.map((r) => r.key_worker_name)).size;

  const deceasedRelationshipBreakdown: Record<string, number> = {};
  for (const r of rows) deceasedRelationshipBreakdown[r.deceased_relationship] = (deceasedRelationshipBreakdown[r.deceased_relationship] ?? 0) + 1;

  const griefStageBreakdown: Record<string, number> = {};
  for (const r of rows) griefStageBreakdown[r.grief_stage] = (griefStageBreakdown[r.grief_stage] ?? 0) + 1;

  const supportTypeBreakdown: Record<string, number> = {};
  for (const r of rows) supportTypeBreakdown[r.support_type] = (supportTypeBreakdown[r.support_type] ?? 0) + 1;

  return {
    total_records: rows.length,
    ongoing_support_count: ongoingSupportCount,
    specialist_referral_count: specialistReferralCount,
    camhs_involvement_count: camhsInvolvementCount,
    school_notification_rate: schoolNotificationRate,
    social_worker_rate: socialWorkerRate,
    memorial_activity_rate: memorialActivityRate,
    review_scheduled_rate: reviewScheduledRate,
    unique_children: uniqueChildren,
    unique_key_workers: uniqueKeyWorkers,
    deceased_relationship_breakdown: deceasedRelationshipBreakdown,
    grief_stage_breakdown: griefStageBreakdown,
    support_type_breakdown: supportTypeBreakdown,
  };
}

export function computeAlerts(
  rows: ChildBereavementSupportRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // High: ongoing_support_needed without review_date
  for (const r of rows) {
    if (r.ongoing_support_needed && r.review_date === null) {
      alerts.push({
        type: "ongoing_support_no_review",
        severity: "high",
        message: `${r.child_name} has ongoing bereavement support needed without a review date scheduled — arrange review to ensure continued wellbeing`,
        record_id: r.id,
      });
    }
  }

  // High: grief_stage is "Depression" without specialist_referral_made
  for (const r of rows) {
    if (r.grief_stage === "Depression" && !r.specialist_referral_made) {
      alerts.push({
        type: "depression_no_referral",
        severity: "high",
        message: `${r.child_name} is assessed at Depression grief stage without specialist referral — consider referral for specialist bereavement support`,
        record_id: r.id,
      });
    }
  }

  // Medium: school not notified
  for (const r of rows) {
    if (!r.school_notified) {
      alerts.push({
        type: "school_not_notified",
        severity: "medium",
        message: `School not notified of bereavement for ${r.child_name} — notify school to ensure appropriate support in educational setting`,
        record_id: r.id,
      });
    }
  }

  // Medium: social worker not notified
  for (const r of rows) {
    if (!r.social_worker_notified) {
      alerts.push({
        type: "social_worker_not_notified",
        severity: "medium",
        message: `Social worker not notified of bereavement for ${r.child_name} — notify social worker as part of multi-agency support`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function computeCaraInsights(
  metrics: ReturnType<typeof computeMetrics>,
  alerts?: ReturnType<typeof computeAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[red] ${metrics.total_records} bereavement support ${metrics.total_records === 1 ? "record" : "records"} across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.ongoing_support_count} ongoing support, ${metrics.specialist_referral_count} specialist referrals, ${metrics.camhs_involvement_count} CAMHS involvement. ` +
      `School notification rate: ${metrics.school_notification_rate}%. Social worker rate: ${metrics.social_worker_rate}%.`,
  );

  // Insight 2: Priority actions from alerts
  const alertList = alerts ?? [];
  const highAlerts = alertList.filter((a) => a.severity === "high");
  const mediumAlerts = alertList.filter((a) => a.severity === "medium");
  if (highAlerts.length > 0) {
    insights.push(
      `[amber] ${highAlerts.length} high-priority and ${mediumAlerts.length} medium-priority alerts identified. ` +
        `Memorial activity rate: ${metrics.memorial_activity_rate}%. ` +
        `Review scheduled rate: ${metrics.review_scheduled_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No high-priority alerts identified. ` +
        `Memorial activity rate: ${metrics.memorial_activity_rate}%. ` +
        `Review scheduled rate: ${metrics.review_scheduled_rate}%.`,
    );
  }

  // Insight 3: Reflective question about bereavement support sensitivity
  insights.push(
    `[reflect] Are bereavement support plans being delivered with genuine sensitivity to each child's individual grief journey, ` +
      `and is the team confident that every child feels safe to express their emotions at their own pace?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildBereavementSupport(
  homeId: string,
): Promise<ServiceResult<ChildBereavementSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_bereavement_support") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("bereavement_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildBereavementSupport(input: {
  homeId: string;
  childName: string;
  bereavementDate: string;
  deceasedRelationship: DeceasedRelationship;
  griefStage: GriefStage;
  supportType: SupportType;
  specialistReferralMade?: boolean;
  specialistService?: string | null;
  camhsInvolvement?: boolean;
  schoolNotified?: boolean;
  socialWorkerNotified?: boolean;
  memorialActivityPlanned?: boolean;
  ongoingSupportNeeded?: boolean;
  reviewDate?: string | null;
  keyWorkerName: string;
  notes?: string | null;
}): Promise<ServiceResult<ChildBereavementSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_bereavement_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      bereavement_date: input.bereavementDate,
      deceased_relationship: input.deceasedRelationship,
      grief_stage: input.griefStage,
      support_type: input.supportType,
      specialist_referral_made: input.specialistReferralMade ?? false,
      specialist_service: input.specialistService ?? null,
      camhs_involvement: input.camhsInvolvement ?? false,
      school_notified: input.schoolNotified ?? true,
      social_worker_notified: input.socialWorkerNotified ?? true,
      memorial_activity_planned: input.memorialActivityPlanned ?? false,
      ongoing_support_needed: input.ongoingSupportNeeded ?? true,
      review_date: input.reviewDate ?? null,
      key_worker_name: input.keyWorkerName,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildBereavementSupport(
  id: string,
  homeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildBereavementSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_bereavement_support") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("home_id", homeId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
};
