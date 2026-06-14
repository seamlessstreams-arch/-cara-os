// ══════════════════════════════════════════════════════════════════════════════
// CARA — PARENTAL CONTACT ARRANGEMENT SERVICE
// Manages scheduled contact sessions with parents/carers/family members,
// court-ordered contact compliance, quality of contact monitoring,
// and the child's experience of contact.
// CHR 2015 Reg 22 (contact — facilitating family contact),
// Reg 7 (individual child — managing contact sensitively),
// Children Act 1989 s34 (contact with children in care).
//
// Covers: contact type, contact outcome, court order compliance,
// child experience, parental engagement, and care plan linkage.
//
// SCCIF: Experiences — "Contact arrangements support children's wellbeing
// and relationships." "Court-ordered contact is complied with and monitored."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const CONTACT_TYPES = [
  "face_to_face_supervised",
  "face_to_face_unsupervised",
  "telephone",
  "video_call",
  "letter_correspondence",
  "overnight_stay",
  "community_outing",
  "family_event",
  "sibling_contact",
  "indirect_contact",
] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_OUTCOMES = [
  "positive",
  "mixed",
  "negative",
  "cancelled_by_parent",
  "cancelled_by_child",
] as const;
export type ContactOutcome = (typeof CONTACT_OUTCOMES)[number];

export const COURT_ORDER_STATUSES = [
  "court_ordered",
  "agreed_informally",
  "no_contact_order",
  "supervised_order",
  "under_review",
] as const;
export type CourtOrderStatus = (typeof COURT_ORDER_STATUSES)[number];

export const CHILD_EXPERIENCES = [
  "happy_engaged",
  "anxious_before",
  "settled_during",
  "upset_after",
  "refused_contact",
  "indifferent",
  "excited",
  "withdrawn",
  "angry_aggressive",
  "mixed_emotions",
] as const;
export type ChildExperience = (typeof CHILD_EXPERIENCES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ParentalContactArrangementRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  contact_date: string;
  contact_type: string;
  contact_outcome: string;
  court_order_status: string;
  child_experience: string;
  parent_carer_name: string;
  duration_minutes: number;
  supervised: boolean;
  supervisor_name: string | null;
  court_order_complied: boolean;
  child_views_before: boolean;
  child_views_after: boolean;
  social_worker_informed: boolean;
  recorded_in_care_plan: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeParentalContactMetrics(
  rows: ParentalContactArrangementRow[],
): {
  total_contacts: number;
  negative_count: number;
  cancelled_count: number;
  court_order_non_compliant_count: number;
  refused_count: number;
  child_views_before_rate: number;
  child_views_after_rate: number;
  social_worker_informed_rate: number;
  recorded_in_care_plan_rate: number;
  court_compliance_rate: number;
  outcome_breakdown: Record<string, number>;
  experience_breakdown: Record<string, number>;
  unique_children: number;
} {
  const negativeCount = rows.filter((r) => r.contact_outcome === "negative").length;
  const cancelledCount = rows.filter(
    (r) => r.contact_outcome === "cancelled_by_parent" || r.contact_outcome === "cancelled_by_child",
  ).length;
  const courtOrderNonCompliantCount = rows.filter(
    (r) => r.court_order_status === "court_ordered" && !r.court_order_complied,
  ).length;
  const refusedCount = rows.filter((r) => r.child_experience === "refused_contact").length;

  const boolRate = (field: keyof ParentalContactArrangementRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const courtOrderedRows = rows.filter((r) => r.court_order_status === "court_ordered");
  const courtComplianceRate =
    courtOrderedRows.length > 0
      ? Math.round(
          (courtOrderedRows.filter((r) => r.court_order_complied).length / courtOrderedRows.length) * 1000,
        ) / 10
      : 0;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  const outcomeBreakdown: Record<string, number> = {};
  for (const r of rows) outcomeBreakdown[r.contact_outcome] = (outcomeBreakdown[r.contact_outcome] ?? 0) + 1;

  const experienceBreakdown: Record<string, number> = {};
  for (const r of rows) experienceBreakdown[r.child_experience] = (experienceBreakdown[r.child_experience] ?? 0) + 1;

  return {
    total_contacts: rows.length,
    negative_count: negativeCount,
    cancelled_count: cancelledCount,
    court_order_non_compliant_count: courtOrderNonCompliantCount,
    refused_count: refusedCount,
    child_views_before_rate: boolRate("child_views_before"),
    child_views_after_rate: boolRate("child_views_after"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    recorded_in_care_plan_rate: boolRate("recorded_in_care_plan"),
    court_compliance_rate: courtComplianceRate,
    outcome_breakdown: outcomeBreakdown,
    experience_breakdown: experienceBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeParentalContactAlerts(
  rows: ParentalContactArrangementRow[],
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

  // Critical: court_ordered + not complied + negative outcome
  for (const r of rows) {
    if (
      r.court_order_status === "court_ordered" &&
      !r.court_order_complied &&
      r.contact_outcome === "negative"
    ) {
      alerts.push({
        type: "court_order_breach_negative",
        severity: "critical",
        message: `Court-ordered contact for ${r.child_name} with ${r.parent_carer_name} was non-compliant with a negative outcome — immediate review and legal notification required`,
        record_id: r.id,
      });
    }
  }

  // High: multiple cancelled contacts for same child
  const cancelledByChild: Record<string, number> = {};
  for (const r of rows) {
    if (r.contact_outcome === "cancelled_by_parent" || r.contact_outcome === "cancelled_by_child") {
      cancelledByChild[r.child_name] = (cancelledByChild[r.child_name] ?? 0) + 1;
    }
  }
  for (const [childName, count] of Object.entries(cancelledByChild)) {
    if (count >= 2) {
      alerts.push({
        type: "repeated_cancellations",
        severity: "high",
        message: `${count} cancelled contacts for ${childName} — review contact arrangements and assess impact on child`,
      });
    }
  }

  // High: child views not captured (before or after) for multiple contacts
  const noViewsCount = rows.filter((r) => !r.child_views_before || !r.child_views_after).length;
  if (noViewsCount >= 2) {
    alerts.push({
      type: "child_views_not_captured",
      severity: "high",
      message: `${noViewsCount} contacts without full child views captured (before or after) — ensure child's voice is recorded for every contact`,
    });
  }

  // Medium: social worker not informed for court-ordered contacts
  const swNotInformedCourtOrdered = rows.filter(
    (r) => r.court_order_status === "court_ordered" && !r.social_worker_informed,
  ).length;
  if (swNotInformedCourtOrdered >= 1) {
    alerts.push({
      type: "sw_not_informed_court_ordered",
      severity: "medium",
      message: `${swNotInformedCourtOrdered} court-ordered ${swNotInformedCourtOrdered === 1 ? "contact has" : "contacts have"} social worker not informed — ensure social worker is notified of all court-ordered contact`,
    });
  }

  return alerts;
}

export function generateParentalContactCaraInsights(
  metrics: ReturnType<typeof computeParentalContactMetrics>,
  alerts: ReturnType<typeof computeParentalContactAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (pink-themed)
  const negativePct =
    metrics.total_contacts > 0
      ? Math.round((metrics.negative_count / metrics.total_contacts) * 1000) / 10
      : 0;
  insights.push(
    `[pink] ${metrics.total_contacts} parental contact arrangements recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.negative_count} (${negativePct}%) had negative outcomes. ` +
      `${metrics.cancelled_count} cancelled, ${metrics.refused_count} refused by child. ` +
      `Court compliance rate: ${metrics.court_compliance_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Child views before rate: ${metrics.child_views_before_rate}%. ` +
        `Child views after rate: ${metrics.child_views_after_rate}%. ` +
        `Social worker informed rate: ${metrics.social_worker_informed_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns. ` +
        `Child views before rate: ${metrics.child_views_before_rate}%. ` +
        `Child views after rate: ${metrics.child_views_after_rate}%. ` +
        `Social worker informed rate: ${metrics.social_worker_informed_rate}%.`,
    );
  }

  // Insight 3: Reflective question about contact quality and child voice
  insights.push(
    `[reflect] Are contact arrangements genuinely supporting each child's relationships and emotional wellbeing, ` +
      `and is the child's voice meaningfully captured before and after every contact session?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listParentalContactArrangements(
  homeId: string,
): Promise<ServiceResult<ParentalContactArrangementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = createServerClient();
  if (!s) return { ok: true, data: [] };

  let q = ((await s).from("cs_parental_contact_arrangements") as any)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("contact_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createParentalContactArrangement(payload: {
  homeId: string;
  childName: string;
  childId?: string | null;
  contactDate: string;
  contactType: ContactType;
  contactOutcome: ContactOutcome;
  courtOrderStatus: CourtOrderStatus;
  childExperience: ChildExperience;
  parentCarerName: string;
  durationMinutes: number;
  supervised: boolean;
  supervisorName?: string | null;
  courtOrderComplied?: boolean;
  childViewsBefore?: boolean;
  childViewsAfter?: boolean;
  socialWorkerInformed?: boolean;
  recordedInCarePlan?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<ParentalContactArrangementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = createServerClient();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await ((await s).from("cs_parental_contact_arrangements") as any)
    .insert({
      home_id: payload.homeId,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      contact_date: payload.contactDate,
      contact_type: payload.contactType,
      contact_outcome: payload.contactOutcome,
      court_order_status: payload.courtOrderStatus,
      child_experience: payload.childExperience,
      parent_carer_name: payload.parentCarerName,
      duration_minutes: payload.durationMinutes,
      supervised: payload.supervised,
      supervisor_name: payload.supervisorName ?? null,
      court_order_complied: payload.courtOrderComplied ?? true,
      child_views_before: payload.childViewsBefore ?? true,
      child_views_after: payload.childViewsAfter ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      recorded_in_care_plan: payload.recordedInCarePlan ?? true,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeParentalContactMetrics,
  computeParentalContactAlerts,
  generateParentalContactCaraInsights,
};
