// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BODY MAP SERVICE
// Records and tracks body maps for children — documenting marks, injuries,
// bruises, and physical observations as part of safeguarding practice.
// CHR 2015 Reg 12 (safeguarding — recording injuries),
// Reg 36 (records — body map documentation),
// Reg 34 (staff — awareness of safeguarding recording).
//
// Body maps provide visual documentation of any marks found on children,
// supporting safeguarding assessments and ensuring accurate records.
//
// SCCIF: Safety — "Injuries and marks are recorded accurately
// and body maps are maintained as part of safeguarding practice."
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

export type MarkType =
  | "bruise"
  | "cut"
  | "scratch"
  | "burn"
  | "bite"
  | "swelling"
  | "rash"
  | "scar"
  | "birthmark"
  | "self_harm"
  | "other";

export type BodyLocation =
  | "head_face"
  | "neck"
  | "chest"
  | "abdomen"
  | "upper_back"
  | "lower_back"
  | "left_arm"
  | "right_arm"
  | "left_hand"
  | "right_hand"
  | "left_leg"
  | "right_leg"
  | "left_foot"
  | "right_foot"
  | "buttocks"
  | "groin"
  | "other";

export type ExplanationSource =
  | "child"
  | "staff_witnessed"
  | "parent_carer"
  | "unknown"
  | "inconsistent"
  | "none_given";

export type ActionTaken =
  | "recorded_only"
  | "first_aid"
  | "medical_attention"
  | "safeguarding_referral"
  | "police_informed"
  | "social_worker_informed"
  | "photograph_taken"
  | "parent_informed"
  | "manager_informed"
  | "lado_referral";

export interface BodyMapRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  observation_date: string;
  observed_by: string;
  mark_type: MarkType;
  body_location: BodyLocation;
  description: string;
  size_cm: string | null;
  colour: string | null;
  explanation: string | null;
  explanation_source: ExplanationSource;
  explanation_consistent: boolean | null;
  actions_taken: ActionTaken[];
  safeguarding_referral_made: boolean;
  photograph_taken: boolean;
  manager_informed: boolean;
  social_worker_informed: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MARK_TYPES: { type: MarkType; label: string }[] = [
  { type: "bruise", label: "Bruise" },
  { type: "cut", label: "Cut" },
  { type: "scratch", label: "Scratch" },
  { type: "burn", label: "Burn" },
  { type: "bite", label: "Bite" },
  { type: "swelling", label: "Swelling" },
  { type: "rash", label: "Rash" },
  { type: "scar", label: "Scar" },
  { type: "birthmark", label: "Birthmark" },
  { type: "self_harm", label: "Self-Harm" },
  { type: "other", label: "Other" },
];

export const BODY_LOCATIONS: { location: BodyLocation; label: string }[] = [
  { location: "head_face", label: "Head/Face" },
  { location: "neck", label: "Neck" },
  { location: "chest", label: "Chest" },
  { location: "abdomen", label: "Abdomen" },
  { location: "upper_back", label: "Upper Back" },
  { location: "lower_back", label: "Lower Back" },
  { location: "left_arm", label: "Left Arm" },
  { location: "right_arm", label: "Right Arm" },
  { location: "left_hand", label: "Left Hand" },
  { location: "right_hand", label: "Right Hand" },
  { location: "left_leg", label: "Left Leg" },
  { location: "right_leg", label: "Right Leg" },
  { location: "left_foot", label: "Left Foot" },
  { location: "right_foot", label: "Right Foot" },
  { location: "buttocks", label: "Buttocks" },
  { location: "groin", label: "Groin" },
  { location: "other", label: "Other" },
];

export const EXPLANATION_SOURCES: { source: ExplanationSource; label: string }[] = [
  { source: "child", label: "Child" },
  { source: "staff_witnessed", label: "Staff Witnessed" },
  { source: "parent_carer", label: "Parent/Carer" },
  { source: "unknown", label: "Unknown" },
  { source: "inconsistent", label: "Inconsistent" },
  { source: "none_given", label: "None Given" },
];

export const ACTIONS_TAKEN: { action: ActionTaken; label: string }[] = [
  { action: "recorded_only", label: "Recorded Only" },
  { action: "first_aid", label: "First Aid" },
  { action: "medical_attention", label: "Medical Attention" },
  { action: "safeguarding_referral", label: "Safeguarding Referral" },
  { action: "police_informed", label: "Police Informed" },
  { action: "social_worker_informed", label: "Social Worker Informed" },
  { action: "photograph_taken", label: "Photograph Taken" },
  { action: "parent_informed", label: "Parent Informed" },
  { action: "manager_informed", label: "Manager Informed" },
  { action: "lado_referral", label: "LADO Referral" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute body map metrics.
 */
export function computeBodyMapMetrics(
  records: BodyMapRecord[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_records: number;
  records_this_month: number;
  children_with_records: number;
  safeguarding_referrals: number;
  photographs_taken: number;
  manager_informed_rate: number;
  social_worker_informed_rate: number;
  follow_ups_pending: number;
  unexplained_marks: number;
  inconsistent_explanations: number;
  self_harm_marks: number;
  by_mark_type: Record<string, number>;
  by_body_location: Record<string, number>;
  by_explanation_source: Record<string, number>;
  by_child: Record<string, number>;
} {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thisMonth = records.filter(
    (r) => new Date(r.observation_date) >= thirtyDaysAgo && new Date(r.observation_date) <= now,
  ).length;

  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const safeguardingReferrals = records.filter((r) => r.safeguarding_referral_made).length;
  const photographsTaken = records.filter((r) => r.photograph_taken).length;

  const managerInformed = records.filter((r) => r.manager_informed).length;
  const managerRate =
    records.length > 0
      ? Math.round((managerInformed / records.length) * 1000) / 10
      : 0;

  const swInformed = records.filter((r) => r.social_worker_informed).length;
  const swRate =
    records.length > 0
      ? Math.round((swInformed / records.length) * 1000) / 10
      : 0;

  const followUpsPending = records.filter(
    (r) => r.follow_up_required && !r.follow_up_completed,
  ).length;

  const unexplainedMarks = records.filter(
    (r) => r.explanation_source === "unknown" || r.explanation_source === "none_given",
  ).length;

  const inconsistentExplanations = records.filter(
    (r) => r.explanation_source === "inconsistent" || r.explanation_consistent === false,
  ).length;

  const selfHarmMarks = records.filter((r) => r.mark_type === "self_harm").length;

  // By mark type
  const byMarkType: Record<string, number> = {};
  for (const r of records) {
    byMarkType[r.mark_type] = (byMarkType[r.mark_type] ?? 0) + 1;
  }

  // By body location
  const byBodyLocation: Record<string, number> = {};
  for (const r of records) {
    byBodyLocation[r.body_location] = (byBodyLocation[r.body_location] ?? 0) + 1;
  }

  // By explanation source
  const byExplanationSource: Record<string, number> = {};
  for (const r of records) {
    byExplanationSource[r.explanation_source] = (byExplanationSource[r.explanation_source] ?? 0) + 1;
  }

  // By child
  const byChild: Record<string, number> = {};
  for (const r of records) {
    byChild[r.child_name] = (byChild[r.child_name] ?? 0) + 1;
  }

  return {
    total_records: records.length,
    records_this_month: thisMonth,
    children_with_records: uniqueChildren,
    safeguarding_referrals: safeguardingReferrals,
    photographs_taken: photographsTaken,
    manager_informed_rate: managerRate,
    social_worker_informed_rate: swRate,
    follow_ups_pending: followUpsPending,
    unexplained_marks: unexplainedMarks,
    inconsistent_explanations: inconsistentExplanations,
    self_harm_marks: selfHarmMarks,
    by_mark_type: byMarkType,
    by_body_location: byBodyLocation,
    by_explanation_source: byExplanationSource,
    by_child: byChild,
  };
}

/**
 * Identify body map alerts.
 */
export function identifyBodyMapAlerts(
  records: BodyMapRecord[],
  _totalChildren: number,
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

  // Unexplained or inconsistent marks — critical safeguarding concern
  for (const r of records) {
    if (r.explanation_source === "inconsistent" || r.explanation_consistent === false) {
      alerts.push({
        type: "inconsistent_explanation",
        severity: "critical",
        message: `Inconsistent explanation for ${r.mark_type} on ${r.child_name} (${r.body_location.replace(/_/g, " ")}, ${r.observation_date}) — safeguarding assessment required`,
        id: r.id,
      });
    }
  }

  // Marks without manager being informed
  for (const r of records) {
    if (!r.manager_informed) {
      alerts.push({
        type: "manager_not_informed",
        severity: "high",
        message: `Manager not informed about ${r.mark_type} on ${r.child_name} (${r.observation_date}) — notify registered manager immediately`,
        id: r.id,
      });
    }
  }

  // Self-harm marks
  for (const r of records) {
    if (r.mark_type === "self_harm") {
      alerts.push({
        type: "self_harm",
        severity: "critical",
        message: `Self-harm mark recorded for ${r.child_name} (${r.observation_date}) — ensure safety plan is in place and therapeutic support is available`,
        id: r.id,
      });
    }
  }

  // Overdue follow-ups
  for (const r of records) {
    if (
      r.follow_up_required &&
      !r.follow_up_completed &&
      r.follow_up_date &&
      new Date(r.follow_up_date) < now
    ) {
      alerts.push({
        type: "follow_up_overdue",
        severity: "high",
        message: `Follow-up overdue for body map entry for ${r.child_name} (${r.mark_type}, ${r.observation_date}) — was due ${r.follow_up_date}`,
        id: r.id,
      });
    }
  }

  // Repeated marks for same child (3+ in 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentByChild: Record<string, { name: string; count: number }> = {};
  for (const r of records) {
    if (new Date(r.observation_date) >= thirtyDaysAgo && new Date(r.observation_date) <= now) {
      if (!recentByChild[r.child_id]) {
        recentByChild[r.child_id] = { name: r.child_name, count: 0 };
      }
      recentByChild[r.child_id].count += 1;
    }
  }
  for (const [id, data] of Object.entries(recentByChild)) {
    if (data.count >= 3) {
      alerts.push({
        type: "repeated_marks",
        severity: "critical",
        message: `${data.name} has ${data.count} body map entries in the last 30 days — review for patterns and consider safeguarding strategy meeting`,
        id: `pattern_${id}`,
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
    markType?: MarkType;
    bodyLocation?: BodyLocation;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<BodyMapRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_body_maps") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.markType) q = q.eq("mark_type", filters.markType);
  if (filters?.bodyLocation) q = q.eq("body_location", filters.bodyLocation);
  if (filters?.dateFrom) q = q.gte("observation_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("observation_date", filters.dateTo);
  q = q.order("observation_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    observationDate: string;
    observedBy: string;
    markType: MarkType;
    bodyLocation: BodyLocation;
    description: string;
    sizeCm?: string;
    colour?: string;
    explanation?: string;
    explanationSource: ExplanationSource;
    explanationConsistent?: boolean;
    actionsTaken: ActionTaken[];
    safeguardingReferralMade: boolean;
    photographTaken: boolean;
    managerInformed: boolean;
    socialWorkerInformed: boolean;
    followUpRequired: boolean;
    followUpDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<BodyMapRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_body_maps") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      observation_date: input.observationDate,
      observed_by: input.observedBy,
      mark_type: input.markType,
      body_location: input.bodyLocation,
      description: input.description,
      size_cm: input.sizeCm ?? null,
      colour: input.colour ?? null,
      explanation: input.explanation ?? null,
      explanation_source: input.explanationSource,
      explanation_consistent: input.explanationConsistent ?? null,
      actions_taken: input.actionsTaken,
      safeguarding_referral_made: input.safeguardingReferralMade,
      photograph_taken: input.photographTaken,
      manager_informed: input.managerInformed,
      social_worker_informed: input.socialWorkerInformed,
      follow_up_required: input.followUpRequired,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: false,
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
): Promise<ServiceResult<BodyMapRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_body_maps") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBodyMapMetrics,
  identifyBodyMapAlerts,
};
