// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT MONITORING SERVICE
// Detailed monitoring and recording of contact sessions between children
// and their parents, family members, and significant others.
// CHR 2015 Reg 7 (children's views on contact),
// Reg 8 (parental responsibility — contact arrangements),
// Care Planning Regs 2010 (contact provisions).
//
// Tracks scheduled contacts, supervision levels, child observations,
// missed contacts, and outcomes to inform care planning.
//
// SCCIF: Overall Experiences — "Contact arrangements support
// children's wellbeing." "Children's wishes about contact are respected."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face"
  | "phone_call"
  | "video_call"
  | "letter"
  | "supervised_visit"
  | "unsupervised_visit"
  | "community_outing"
  | "overnight_stay"
  | "other";

export type SupervisionLevel =
  | "none"
  | "monitored"
  | "supervised"
  | "observed"
  | "restricted";

export type ContactOutcome =
  | "completed_positive"
  | "completed_neutral"
  | "completed_negative"
  | "cancelled_by_parent"
  | "cancelled_by_child"
  | "cancelled_by_la"
  | "no_show"
  | "refused_by_child"
  | "rescheduled";

export type ChildMood =
  | "happy"
  | "excited"
  | "calm"
  | "anxious"
  | "upset"
  | "angry"
  | "withdrawn"
  | "mixed";

export interface ContactSession {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  contact_with: string;
  relationship: string;
  contact_type: ContactType;
  supervision_level: SupervisionLevel;
  scheduled_date: string;
  actual_date: string | null;
  duration_minutes: number | null;
  outcome: ContactOutcome;
  child_mood_before: ChildMood | null;
  child_mood_after: ChildMood | null;
  child_views: string | null;
  staff_observations: string | null;
  concerns_raised: boolean;
  concern_details: string | null;
  social_worker_informed: boolean;
  court_ordered: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONTACT_TYPES: { type: ContactType; label: string }[] = [
  { type: "face_to_face", label: "Face to Face" },
  { type: "phone_call", label: "Phone Call" },
  { type: "video_call", label: "Video Call" },
  { type: "letter", label: "Letter" },
  { type: "supervised_visit", label: "Supervised Visit" },
  { type: "unsupervised_visit", label: "Unsupervised Visit" },
  { type: "community_outing", label: "Community Outing" },
  { type: "overnight_stay", label: "Overnight Stay" },
  { type: "other", label: "Other" },
];

export const SUPERVISION_LEVELS: { level: SupervisionLevel; label: string }[] = [
  { level: "none", label: "None" },
  { level: "monitored", label: "Monitored" },
  { level: "supervised", label: "Supervised" },
  { level: "observed", label: "Observed" },
  { level: "restricted", label: "Restricted" },
];

export const CONTACT_OUTCOMES: { outcome: ContactOutcome; label: string }[] = [
  { outcome: "completed_positive", label: "Completed (Positive)" },
  { outcome: "completed_neutral", label: "Completed (Neutral)" },
  { outcome: "completed_negative", label: "Completed (Negative)" },
  { outcome: "cancelled_by_parent", label: "Cancelled by Parent" },
  { outcome: "cancelled_by_child", label: "Cancelled by Child" },
  { outcome: "cancelled_by_la", label: "Cancelled by LA" },
  { outcome: "no_show", label: "No Show" },
  { outcome: "refused_by_child", label: "Refused by Child" },
  { outcome: "rescheduled", label: "Rescheduled" },
];

export const CHILD_MOODS: { mood: ChildMood; label: string }[] = [
  { mood: "happy", label: "Happy" },
  { mood: "excited", label: "Excited" },
  { mood: "calm", label: "Calm" },
  { mood: "anxious", label: "Anxious" },
  { mood: "upset", label: "Upset" },
  { mood: "angry", label: "Angry" },
  { mood: "withdrawn", label: "Withdrawn" },
  { mood: "mixed", label: "Mixed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeContactMetrics(
  sessions: ContactSession[],
  totalChildren: number,
): {
  total_sessions: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  refused_count: number;
  completion_rate: number | null;
  positive_outcome_rate: number | null;
  negative_outcome_rate: number | null;
  children_with_contact: number;
  contact_coverage: number | null;
  concerns_raised_count: number;
  supervised_count: number;
  court_ordered_count: number;
  average_duration: number | null;
  child_views_recorded_rate: number | null;
  by_contact_type: Record<string, number>;
  by_outcome: Record<string, number>;
  by_supervision_level: Record<string, number>;
  by_child: Record<string, number>;
} {
  const completed = sessions.filter(
    (s) => s.outcome === "completed_positive" || s.outcome === "completed_neutral" || s.outcome === "completed_negative",
  ).length;
  const cancelled = sessions.filter(
    (s) => s.outcome === "cancelled_by_parent" || s.outcome === "cancelled_by_child" || s.outcome === "cancelled_by_la",
  ).length;
  const noShow = sessions.filter((s) => s.outcome === "no_show").length;
  const refused = sessions.filter((s) => s.outcome === "refused_by_child").length;

  const completionRate =
    sessions.length > 0
      ? Math.round((completed / sessions.length) * 1000) / 10
      : null;

  const positive = sessions.filter((s) => s.outcome === "completed_positive").length;
  const positiveRate =
    completed > 0
      ? Math.round((positive / completed) * 1000) / 10
      : null;

  const negative = sessions.filter((s) => s.outcome === "completed_negative").length;
  const negativeRate =
    completed > 0
      ? Math.round((negative / completed) * 1000) / 10
      : null;

  const uniqueChildren = new Set(sessions.map((s) => s.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const concerns = sessions.filter((s) => s.concerns_raised).length;
  const supervised = sessions.filter(
    (s) => s.supervision_level !== "none",
  ).length;
  const courtOrdered = sessions.filter((s) => s.court_ordered).length;

  const completedWithDuration = sessions.filter(
    (s) => s.duration_minutes !== null && (s.outcome === "completed_positive" || s.outcome === "completed_neutral" || s.outcome === "completed_negative"),
  );
  const totalDuration = completedWithDuration.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const avgDuration =
    completedWithDuration.length > 0
      ? Math.round(totalDuration / completedWithDuration.length)
      : null;

  const childViews = sessions.filter((s) => s.child_views !== null).length;
  const childRate =
    sessions.length > 0
      ? Math.round((childViews / sessions.length) * 1000) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const s of sessions) byType[s.contact_type] = (byType[s.contact_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const s of sessions) byOutcome[s.outcome] = (byOutcome[s.outcome] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const s of sessions) byLevel[s.supervision_level] = (byLevel[s.supervision_level] ?? 0) + 1;

  const byChild: Record<string, number> = {};
  for (const s of sessions) byChild[s.child_name] = (byChild[s.child_name] ?? 0) + 1;

  return {
    total_sessions: sessions.length,
    completed_count: completed,
    cancelled_count: cancelled,
    no_show_count: noShow,
    refused_count: refused,
    completion_rate: completionRate,
    positive_outcome_rate: positiveRate,
    negative_outcome_rate: negativeRate,
    children_with_contact: uniqueChildren,
    contact_coverage: coverage,
    concerns_raised_count: concerns,
    supervised_count: supervised,
    court_ordered_count: courtOrdered,
    average_duration: avgDuration,
    child_views_recorded_rate: childRate,
    by_contact_type: byType,
    by_outcome: byOutcome,
    by_supervision_level: byLevel,
    by_child: byChild,
  };
}

export function identifyContactAlerts(
  sessions: ContactSession[],
  totalChildren: number,
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

  // Concerns raised but social worker not informed
  for (const s of sessions) {
    if (s.concerns_raised && !s.social_worker_informed) {
      alerts.push({
        type: "concern_not_reported",
        severity: "critical",
        message: `Concerns raised during contact for ${s.child_name} with ${s.contact_with} (${s.scheduled_date}) but social worker not informed`,
        id: s.id,
      });
    }
  }

  // Repeated no-shows from parent
  const noShowsByParent: Record<string, { child: string; parent: string; count: number }> = {};
  for (const s of sessions) {
    if (s.outcome === "no_show") {
      const key = `${s.child_id}_${s.contact_with}`;
      if (!noShowsByParent[key]) {
        noShowsByParent[key] = { child: s.child_name, parent: s.contact_with, count: 0 };
      }
      noShowsByParent[key].count += 1;
    }
  }
  for (const [key, data] of Object.entries(noShowsByParent)) {
    if (data.count >= 2) {
      alerts.push({
        type: "repeated_no_show",
        severity: "high",
        message: `${data.parent} has not attended ${data.count} scheduled contacts with ${data.child} — discuss with social worker and review contact plan`,
        id: `no_show_${key}`,
      });
    }
  }

  // Child refusing contact repeatedly
  const refusalsByChild: Record<string, { name: string; count: number }> = {};
  for (const s of sessions) {
    if (s.outcome === "refused_by_child") {
      if (!refusalsByChild[s.child_id]) {
        refusalsByChild[s.child_id] = { name: s.child_name, count: 0 };
      }
      refusalsByChild[s.child_id].count += 1;
    }
  }
  for (const [id, data] of Object.entries(refusalsByChild)) {
    if (data.count >= 2) {
      alerts.push({
        type: "repeated_refusal",
        severity: "high",
        message: `${data.name} has refused contact ${data.count} times — explore reasons and record child's wishes and feelings`,
        id: `refusal_${id}`,
      });
    }
  }

  // Negative outcomes — child distressed after contact
  for (const s of sessions) {
    if (
      s.outcome === "completed_negative" &&
      (s.child_mood_after === "upset" || s.child_mood_after === "angry" || s.child_mood_after === "withdrawn")
    ) {
      alerts.push({
        type: "distress_after_contact",
        severity: "medium",
        message: `${s.child_name} was ${s.child_mood_after} after contact with ${s.contact_with} (${s.scheduled_date}) — review contact arrangements`,
        id: s.id,
      });
    }
  }

  // Children with no contact recorded
  const childrenWithContact = new Set(sessions.map((s) => s.child_id));
  if (totalChildren > 0 && childrenWithContact.size < totalChildren) {
    const gap = totalChildren - childrenWithContact.size;
    alerts.push({
      type: "no_contact_recorded",
      severity: "medium",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no contact sessions recorded — review contact arrangements`,
      id: "contact_gap",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSessions(
  homeId: string,
  filters?: {
    childId?: string;
    contactType?: ContactType;
    outcome?: ContactOutcome;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<ContactSession[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_contact_sessions") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.contactType) q = q.eq("contact_type", filters.contactType);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  if (filters?.dateFrom) q = q.gte("scheduled_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("scheduled_date", filters.dateTo);
  q = q.order("scheduled_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSession(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    contactWith: string;
    relationship: string;
    contactType: ContactType;
    supervisionLevel: SupervisionLevel;
    scheduledDate: string;
    actualDate?: string;
    durationMinutes?: number;
    outcome: ContactOutcome;
    childMoodBefore?: ChildMood;
    childMoodAfter?: ChildMood;
    childViews?: string;
    staffObservations?: string;
    concernsRaised: boolean;
    concernDetails?: string;
    socialWorkerInformed: boolean;
    courtOrdered: boolean;
    notes?: string;
  },
): Promise<ServiceResult<ContactSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_sessions") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      contact_with: input.contactWith,
      relationship: input.relationship,
      contact_type: input.contactType,
      supervision_level: input.supervisionLevel,
      scheduled_date: input.scheduledDate,
      actual_date: input.actualDate ?? null,
      duration_minutes: input.durationMinutes ?? null,
      outcome: input.outcome,
      child_mood_before: input.childMoodBefore ?? null,
      child_mood_after: input.childMoodAfter ?? null,
      child_views: input.childViews ?? null,
      staff_observations: input.staffObservations ?? null,
      concerns_raised: input.concernsRaised,
      concern_details: input.concernDetails ?? null,
      social_worker_informed: input.socialWorkerInformed,
      court_ordered: input.courtOrdered,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSession(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ContactSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_sessions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeContactMetrics,
  identifyContactAlerts,
};
