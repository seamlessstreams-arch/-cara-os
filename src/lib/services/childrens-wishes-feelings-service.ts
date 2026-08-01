// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S WISHES & FEELINGS SERVICE
// Systematic capture and tracking of children's wishes, feelings,
// preferences, and how they are responded to and acted upon.
// CHR 2015 Reg 7 (children's views, wishes, and feelings),
// Reg 14 (care planning — incorporating child's wishes),
// Children Act 1989 s1(3)(a) (welfare checklist — child's wishes).
//
// Captures: what the child wants, how they feel, preferred methods
// of communication, who they want to talk to, and evidence of
// how their wishes have influenced decisions.
//
// SCCIF: Overall Experiences — "Children's wishes and feelings are
// sought, listened to, and acted upon." "Children influence their care."
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

export type WishesCategory =
  | "placement"
  | "contact"
  | "education"
  | "health"
  | "daily_life"
  | "identity"
  | "friendships"
  | "activities"
  | "future_plans"
  | "safety"
  | "complaints"
  | "other";

export type FeelingRating =
  | "very_happy"
  | "happy"
  | "okay"
  | "unhappy"
  | "very_unhappy"
  | "mixed"
  | "not_expressed";

export type CaptureMethod =
  | "direct_conversation"
  | "key_worker_session"
  | "house_meeting"
  | "written_form"
  | "drawing_art"
  | "advocate"
  | "independent_visitor"
  | "review_meeting"
  | "informal_chat"
  | "digital_tool"
  | "other";

export type ResponseOutcome =
  | "wish_granted"
  | "wish_partially_met"
  | "wish_not_possible"
  | "under_consideration"
  | "referred_to_sw"
  | "awaiting_response"
  | "no_action_needed";

export interface WishesFeelingsRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  recorded_date: string;
  wishes_category: WishesCategory;
  feeling_rating: FeelingRating;
  capture_method: CaptureMethod;
  what_child_said: string;
  what_child_wants: string | null;
  response_outcome: ResponseOutcome;
  response_details: string | null;
  responded_by: string | null;
  response_date: string | null;
  child_informed_of_outcome: boolean;
  child_satisfied_with_response: boolean | null;
  influenced_care_plan: boolean;
  recorded_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const WISHES_CATEGORIES: { category: WishesCategory; label: string }[] = [
  { category: "placement", label: "Placement" },
  { category: "contact", label: "Contact" },
  { category: "education", label: "Education" },
  { category: "health", label: "Health" },
  { category: "daily_life", label: "Daily Life" },
  { category: "identity", label: "Identity" },
  { category: "friendships", label: "Friendships" },
  { category: "activities", label: "Activities" },
  { category: "future_plans", label: "Future Plans" },
  { category: "safety", label: "Safety" },
  { category: "complaints", label: "Complaints" },
  { category: "other", label: "Other" },
];

export const FEELING_RATINGS: { rating: FeelingRating; label: string }[] = [
  { rating: "very_happy", label: "Very Happy" },
  { rating: "happy", label: "Happy" },
  { rating: "okay", label: "Okay" },
  { rating: "unhappy", label: "Unhappy" },
  { rating: "very_unhappy", label: "Very Unhappy" },
  { rating: "mixed", label: "Mixed" },
  { rating: "not_expressed", label: "Not Expressed" },
];

export const CAPTURE_METHODS: { method: CaptureMethod; label: string }[] = [
  { method: "direct_conversation", label: "Direct Conversation" },
  { method: "key_worker_session", label: "Key Worker Session" },
  { method: "house_meeting", label: "House Meeting" },
  { method: "written_form", label: "Written Form" },
  { method: "drawing_art", label: "Drawing/Art" },
  { method: "advocate", label: "Advocate" },
  { method: "independent_visitor", label: "Independent Visitor" },
  { method: "review_meeting", label: "Review Meeting" },
  { method: "informal_chat", label: "Informal Chat" },
  { method: "digital_tool", label: "Digital Tool" },
  { method: "other", label: "Other" },
];

export const RESPONSE_OUTCOMES: { outcome: ResponseOutcome; label: string }[] = [
  { outcome: "wish_granted", label: "Wish Granted" },
  { outcome: "wish_partially_met", label: "Wish Partially Met" },
  { outcome: "wish_not_possible", label: "Wish Not Possible" },
  { outcome: "under_consideration", label: "Under Consideration" },
  { outcome: "referred_to_sw", label: "Referred to Social Worker" },
  { outcome: "awaiting_response", label: "Awaiting Response" },
  { outcome: "no_action_needed", label: "No Action Needed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeWishesMetrics(
  records: WishesFeelingsRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_with_records: number;
  participation_rate: number | null;
  wish_granted_count: number;
  wish_partially_met_count: number;
  wish_not_possible_count: number;
  awaiting_response_count: number;
  child_informed_rate: number | null;
  child_satisfied_rate: number | null;
  influenced_care_plan_rate: number | null;
  positive_feeling_rate: number | null;
  negative_feeling_rate: number | null;
  average_per_child: number | null;
  by_category: Record<string, number>;
  by_feeling: Record<string, number>;
  by_capture_method: Record<string, number>;
  by_outcome: Record<string, number>;
  by_child: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const participation =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const granted = records.filter((r) => r.response_outcome === "wish_granted").length;
  const partial = records.filter((r) => r.response_outcome === "wish_partially_met").length;
  const notPossible = records.filter((r) => r.response_outcome === "wish_not_possible").length;
  const awaiting = records.filter((r) => r.response_outcome === "awaiting_response").length;

  const informed = records.filter((r) => r.child_informed_of_outcome).length;
  const informedRate =
    records.length > 0
      ? Math.round((informed / records.length) * 1000) / 10
      : null;

  const satisfiedRecords = records.filter((r) => r.child_satisfied_with_response !== null);
  const satisfied = satisfiedRecords.filter((r) => r.child_satisfied_with_response === true).length;
  const satisfiedRate =
    satisfiedRecords.length > 0
      ? Math.round((satisfied / satisfiedRecords.length) * 1000) / 10
      : null;

  const influenced = records.filter((r) => r.influenced_care_plan).length;
  const influencedRate =
    records.length > 0
      ? Math.round((influenced / records.length) * 1000) / 10
      : null;

  const positive = records.filter(
    (r) => r.feeling_rating === "very_happy" || r.feeling_rating === "happy",
  ).length;
  const positiveRate =
    records.length > 0
      ? Math.round((positive / records.length) * 1000) / 10
      : null;

  const negative = records.filter(
    (r) => r.feeling_rating === "unhappy" || r.feeling_rating === "very_unhappy",
  ).length;
  const negativeRate =
    records.length > 0
      ? Math.round((negative / records.length) * 1000) / 10
      : null;

  const avgPerChild =
    uniqueChildren > 0
      ? Math.round((records.length / uniqueChildren) * 10) / 10
      : null;

  const byCat: Record<string, number> = {};
  for (const r of records) byCat[r.wishes_category] = (byCat[r.wishes_category] ?? 0) + 1;

  const byFeeling: Record<string, number> = {};
  for (const r of records) byFeeling[r.feeling_rating] = (byFeeling[r.feeling_rating] ?? 0) + 1;

  const byMethod: Record<string, number> = {};
  for (const r of records) byMethod[r.capture_method] = (byMethod[r.capture_method] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.response_outcome] = (byOutcome[r.response_outcome] ?? 0) + 1;

  const byChild: Record<string, number> = {};
  for (const r of records) byChild[r.child_name] = (byChild[r.child_name] ?? 0) + 1;

  return {
    total_records: records.length,
    children_with_records: uniqueChildren,
    participation_rate: participation,
    wish_granted_count: granted,
    wish_partially_met_count: partial,
    wish_not_possible_count: notPossible,
    awaiting_response_count: awaiting,
    child_informed_rate: informedRate,
    child_satisfied_rate: satisfiedRate,
    influenced_care_plan_rate: influencedRate,
    positive_feeling_rate: positiveRate,
    negative_feeling_rate: negativeRate,
    average_per_child: avgPerChild,
    by_category: byCat,
    by_feeling: byFeeling,
    by_capture_method: byMethod,
    by_outcome: byOutcome,
    by_child: byChild,
  };
}

export function identifyWishesAlerts(
  records: WishesFeelingsRecord[],
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

  // Children with no wishes/feelings captured
  const childrenRecorded = new Set(records.map((r) => r.child_id)).size;
  if (totalChildren > 0 && childrenRecorded < totalChildren) {
    const gap = totalChildren - childrenRecorded;
    alerts.push({
      type: "no_wishes_captured",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child's" : "children's"} wishes and feelings not captured — every child's voice must be heard`,
      id: "wishes_gap",
    });
  }

  // Wishes awaiting response for too long
  const awaitingCount = records.filter((r) => r.response_outcome === "awaiting_response").length;
  if (awaitingCount >= 2) {
    alerts.push({
      type: "wishes_awaiting",
      severity: "high",
      message: `${awaitingCount} wishes awaiting response — children need timely feedback on their requests`,
      id: "awaiting_responses",
    });
  }

  // Child not informed of outcome
  const notInformed = records.filter(
    (r) => !r.child_informed_of_outcome && r.response_outcome !== "awaiting_response" && r.response_outcome !== "under_consideration",
  ).length;
  if (notInformed >= 2) {
    alerts.push({
      type: "child_not_informed",
      severity: "medium",
      message: `${notInformed} wishes where the child has not been informed of the outcome — children deserve to know how their views were considered`,
      id: "not_informed",
    });
  }

  // Very unhappy feelings
  const veryUnhappy = records.filter((r) => r.feeling_rating === "very_unhappy");
  for (const r of veryUnhappy) {
    alerts.push({
      type: "very_unhappy",
      severity: "high",
      message: `${r.child_name} expressed feeling very unhappy about ${r.wishes_category.replace(/_/g, " ")} — explore and respond to their concerns`,
      id: r.id,
    });
  }

  // Wishes not influencing care plans
  const notInfluencing = records.filter(
    (r) => !r.influenced_care_plan && (r.wishes_category === "placement" || r.wishes_category === "contact" || r.wishes_category === "education"),
  ).length;
  if (notInfluencing >= 3) {
    alerts.push({
      type: "not_influencing_plans",
      severity: "medium",
      message: `${notInfluencing} significant wishes have not influenced care plans — children's views should shape their care`,
      id: "not_influencing",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    wishesCategory?: WishesCategory;
    feelingRating?: FeelingRating;
    responseOutcome?: ResponseOutcome;
    limit?: number;
  },
): Promise<ServiceResult<WishesFeelingsRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_wishes_feelings") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.wishesCategory) q = q.eq("wishes_category", filters.wishesCategory);
  if (filters?.feelingRating) q = q.eq("feeling_rating", filters.feelingRating);
  if (filters?.responseOutcome) q = q.eq("response_outcome", filters.responseOutcome);
  q = q.order("recorded_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    recordedDate: string;
    wishesCategory: WishesCategory;
    feelingRating: FeelingRating;
    captureMethod: CaptureMethod;
    whatChildSaid: string;
    whatChildWants?: string;
    responseOutcome: ResponseOutcome;
    responseDetails?: string;
    respondedBy?: string;
    responseDate?: string;
    childInformedOfOutcome: boolean;
    childSatisfiedWithResponse?: boolean;
    influencedCarePlan: boolean;
    recordedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<WishesFeelingsRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_wishes_feelings") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      recorded_date: input.recordedDate,
      wishes_category: input.wishesCategory,
      feeling_rating: input.feelingRating,
      capture_method: input.captureMethod,
      what_child_said: input.whatChildSaid,
      what_child_wants: input.whatChildWants ?? null,
      response_outcome: input.responseOutcome,
      response_details: input.responseDetails ?? null,
      responded_by: input.respondedBy ?? null,
      response_date: input.responseDate ?? null,
      child_informed_of_outcome: input.childInformedOfOutcome,
      child_satisfied_with_response: input.childSatisfiedWithResponse ?? null,
      influenced_care_plan: input.influencedCarePlan,
      recorded_by: input.recordedBy,
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
): Promise<ServiceResult<WishesFeelingsRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_wishes_feelings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWishesMetrics,
  identifyWishesAlerts,
};
