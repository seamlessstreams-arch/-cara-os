// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMISSIONING & REFERRALS SERVICE
// Manages incoming placement referrals, matching assessments, commissioning
// relationships, and occupancy tracking.
// CHR 2015 Reg 36 (assessment of prospective children — referral process),
// Reg 12 (impact risk assessment — matching),
// Reg 14 (care planning — placement suitability).
//
// Tracks referrals from receipt through matching to decision, monitors
// occupancy, manages commissioning authority relationships, and ensures
// robust matching informs all placement decisions.
//
// SCCIF: Well-Led — "Leaders understand the needs of the children they
// can care for." "Matching decisions are well-informed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ReferralStatus =
  | "received"
  | "under_review"
  | "information_requested"
  | "matching_assessment"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "placed";

export type DeclineReason =
  | "no_capacity"
  | "needs_mismatch"
  | "risk_too_high"
  | "age_mismatch"
  | "gender_mismatch"
  | "existing_dynamics"
  | "insufficient_info"
  | "other";

export type ReferralUrgency =
  | "emergency"
  | "urgent"
  | "planned"
  | "standard";

export type CommissioningRelationship =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "new";

export interface PlacementReferral {
  id: string;
  home_id: string;
  child_name: string;
  child_age: number;
  child_gender: string;
  referring_authority: string;
  social_worker_name: string;
  social_worker_email: string | null;
  referral_date: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  presenting_needs: string[];
  risk_factors: string[];
  decline_reason: DeclineReason | null;
  decline_notes: string | null;
  decision_date: string | null;
  decision_by: string | null;
  matching_score: number | null;
  placement_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OccupancyRecord {
  id: string;
  home_id: string;
  record_date: string;
  registered_places: number;
  children_in_placement: number;
  occupancy_rate: number | null;
  referrals_in_progress: number;
  planned_admissions: number;
  planned_departures: number;
  commentary: string | null;
  recorded_by: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFERRAL_STATUSES: { status: ReferralStatus; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "under_review", label: "Under Review" },
  { status: "information_requested", label: "Information Requested" },
  { status: "matching_assessment", label: "Matching Assessment" },
  { status: "accepted", label: "Accepted" },
  { status: "declined", label: "Declined" },
  { status: "withdrawn", label: "Withdrawn" },
  { status: "placed", label: "Placed" },
];

export const DECLINE_REASONS: { reason: DeclineReason; label: string }[] = [
  { reason: "no_capacity", label: "No Capacity" },
  { reason: "needs_mismatch", label: "Needs Mismatch" },
  { reason: "risk_too_high", label: "Risk Too High" },
  { reason: "age_mismatch", label: "Age Mismatch" },
  { reason: "gender_mismatch", label: "Gender Mismatch" },
  { reason: "existing_dynamics", label: "Existing Group Dynamics" },
  { reason: "insufficient_info", label: "Insufficient Information" },
  { reason: "other", label: "Other" },
];

export const REFERRAL_URGENCIES: { urgency: ReferralUrgency; label: string }[] = [
  { urgency: "emergency", label: "Emergency (Same Day)" },
  { urgency: "urgent", label: "Urgent (48 Hours)" },
  { urgency: "planned", label: "Planned" },
  { urgency: "standard", label: "Standard" },
];

export const COMMISSIONING_RELATIONSHIPS: { relationship: CommissioningRelationship; label: string }[] = [
  { relationship: "excellent", label: "Excellent" },
  { relationship: "good", label: "Good" },
  { relationship: "adequate", label: "Adequate" },
  { relationship: "poor", label: "Poor" },
  { relationship: "new", label: "New" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute commissioning and referral metrics.
 */
export function computeReferralMetrics(
  referrals: PlacementReferral[],
  occupancy: OccupancyRecord[],
): {
  total_referrals: number;
  active_referrals: number;
  accepted: number;
  declined: number;
  withdrawn: number;
  placed: number;
  acceptance_rate: number | null;
  avg_decision_days: number;
  emergency_referrals: number;
  current_occupancy_rate: number | null;
  available_places: number;
  by_status: Record<string, number>;
  by_urgency: Record<string, number>;
  by_decline_reason: Record<string, number>;
  by_authority: Record<string, number>;
} {
  // Referral counts
  const active = referrals.filter(
    (r) =>
      r.status === "received" ||
      r.status === "under_review" ||
      r.status === "information_requested" ||
      r.status === "matching_assessment",
  ).length;
  const accepted = referrals.filter((r) => r.status === "accepted" || r.status === "placed").length;
  const declined = referrals.filter((r) => r.status === "declined").length;
  const withdrawn = referrals.filter((r) => r.status === "withdrawn").length;
  const placed = referrals.filter((r) => r.status === "placed").length;
  const emergency = referrals.filter((r) => r.urgency === "emergency").length;

  // Acceptance rate (of resolved referrals)
  const resolved = accepted + declined;
  const acceptanceRate =
    resolved > 0
      ? Math.round((accepted / resolved) * 1000) / 10
      : null;

  // Avg decision time
  const decidedReferrals = referrals.filter(
    (r) => r.decision_date && (r.status === "accepted" || r.status === "declined" || r.status === "placed"),
  );
  let avgDecisionDays = 0;
  if (decidedReferrals.length > 0) {
    const totalDays = decidedReferrals.reduce((sum, r) => {
      const referred = new Date(r.referral_date);
      const decided = new Date(r.decision_date!);
      return sum + Math.round((decided.getTime() - referred.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDecisionDays = Math.round(totalDays / decidedReferrals.length);
  }

  // Latest occupancy
  const sortedOcc = [...occupancy].sort(
    (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime(),
  );
  const latestOcc = sortedOcc[0];
  const currentOccupancyRate = latestOcc?.occupancy_rate ?? 0;
  const availablePlaces = latestOcc
    ? latestOcc.registered_places - latestOcc.children_in_placement
    : 0;

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of referrals) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // By urgency
  const byUrgency: Record<string, number> = {};
  for (const r of referrals) {
    byUrgency[r.urgency] = (byUrgency[r.urgency] ?? 0) + 1;
  }

  // By decline reason
  const byDeclineReason: Record<string, number> = {};
  for (const r of referrals.filter((r) => r.status === "declined" && r.decline_reason)) {
    byDeclineReason[r.decline_reason!] = (byDeclineReason[r.decline_reason!] ?? 0) + 1;
  }

  // By authority
  const byAuthority: Record<string, number> = {};
  for (const r of referrals) {
    byAuthority[r.referring_authority] = (byAuthority[r.referring_authority] ?? 0) + 1;
  }

  return {
    total_referrals: referrals.length,
    active_referrals: active,
    accepted,
    declined,
    withdrawn,
    placed,
    acceptance_rate: acceptanceRate,
    avg_decision_days: avgDecisionDays,
    emergency_referrals: emergency,
    current_occupancy_rate: currentOccupancyRate,
    available_places: availablePlaces,
    by_status: byStatus,
    by_urgency: byUrgency,
    by_decline_reason: byDeclineReason,
    by_authority: byAuthority,
  };
}

/**
 * Identify commissioning and referral alerts.
 */
export function identifyReferralAlerts(
  referrals: PlacementReferral[],
  occupancy: OccupancyRecord[],
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

  // Emergency referrals pending
  for (const r of referrals) {
    if (r.urgency === "emergency" && (r.status === "received" || r.status === "under_review")) {
      alerts.push({
        type: "emergency_pending",
        severity: "critical",
        message: `Emergency referral for ${r.child_name} (age ${r.child_age}) from ${r.referring_authority} — requires same-day decision`,
        id: r.id,
      });
    }
  }

  // Urgent referrals pending >2 days
  for (const r of referrals) {
    if (
      r.urgency === "urgent" &&
      (r.status === "received" || r.status === "under_review")
    ) {
      const daysSinceReferred = Math.round(
-londonDayDiff(new Date(r.referral_date), now),
      );
      if (daysSinceReferred > 2) {
        alerts.push({
          type: "urgent_overdue",
          severity: "high",
          message: `Urgent referral for ${r.child_name} is ${daysSinceReferred} days old — 48-hour decision window exceeded`,
          id: r.id,
        });
      }
    }
  }

  // Stale referrals (>7 days without decision)
  for (const r of referrals) {
    if (
      (r.status === "received" || r.status === "under_review" || r.status === "information_requested") &&
      r.urgency !== "emergency"
    ) {
      const daysSinceReferred = Math.round(
-londonDayDiff(new Date(r.referral_date), now),
      );
      if (daysSinceReferred > 7) {
        alerts.push({
          type: "stale_referral",
          severity: "medium",
          message: `Referral for ${r.child_name} from ${r.referring_authority} is ${daysSinceReferred} days old — update status or make decision`,
          id: r.id,
        });
      }
    }
  }

  // Full occupancy
  const sortedOcc = [...occupancy].sort(
    (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime(),
  );
  const latestOcc = sortedOcc[0];
  if (latestOcc && latestOcc.children_in_placement >= latestOcc.registered_places) {
    alerts.push({
      type: "full_occupancy",
      severity: "high",
      message: `Home is at full occupancy (${latestOcc.children_in_placement}/${latestOcc.registered_places}) — no registered places available`,
      id: latestOcc.id,
    });
  }

  // High decline rate
  const resolved = referrals.filter(
    (r) => r.status === "accepted" || r.status === "declined" || r.status === "placed",
  );
  const declinedCount = referrals.filter((r) => r.status === "declined").length;
  if (resolved.length >= 5 && declinedCount / resolved.length > 0.5) {
    alerts.push({
      type: "high_decline_rate",
      severity: "medium",
      message: `Decline rate is ${Math.round((declinedCount / resolved.length) * 100)}% — review if statement of purpose and referral criteria are aligned`,
      id: "decline-rate",
    });
  }

  return alerts;
}

// ── CRUD — Referrals ──────────────────────────────────────────────────────

export async function listReferrals(
  homeId: string,
  filters?: {
    status?: ReferralStatus;
    urgency?: ReferralUrgency;
    referringAuthority?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<PlacementReferral[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_placement_referrals") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.urgency) q = q.eq("urgency", filters.urgency);
  if (filters?.referringAuthority) q = q.eq("referring_authority", filters.referringAuthority);
  if (filters?.dateFrom) q = q.gte("referral_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("referral_date", filters.dateTo);
  q = q.order("referral_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReferral(
  input: {
    homeId: string;
    childName: string;
    childAge: number;
    childGender: string;
    referringAuthority: string;
    socialWorkerName: string;
    socialWorkerEmail?: string;
    referralDate: string;
    urgency: ReferralUrgency;
    presentingNeeds: string[];
    riskFactors: string[];
  },
): Promise<ServiceResult<PlacementReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_referrals") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_age: input.childAge,
      child_gender: input.childGender,
      referring_authority: input.referringAuthority,
      social_worker_name: input.socialWorkerName,
      social_worker_email: input.socialWorkerEmail ?? null,
      referral_date: input.referralDate,
      urgency: input.urgency,
      status: "received",
      presenting_needs: input.presentingNeeds,
      risk_factors: input.riskFactors,
      decline_reason: null,
      decline_notes: null,
      decision_date: null,
      decision_by: null,
      matching_score: null,
      placement_start_date: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReferral(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<PlacementReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_referrals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Occupancy ──────────────────────────────────────────────────────

export async function listOccupancy(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<OccupancyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_occupancy_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.dateFrom) q = q.gte("record_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("record_date", filters.dateTo);
  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createOccupancyRecord(
  input: {
    homeId: string;
    recordDate: string;
    registeredPlaces: number;
    childrenInPlacement: number;
    referralsInProgress: number;
    plannedAdmissions: number;
    plannedDepartures: number;
    commentary?: string;
    recordedBy: string;
  },
): Promise<ServiceResult<OccupancyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const occupancyRate =
    input.registeredPlaces > 0
      ? Math.round((input.childrenInPlacement / input.registeredPlaces) * 1000) / 10
      : null;

  const { data, error } = await (s.from("cs_occupancy_records") as SB)
    .insert({
      home_id: input.homeId,
      record_date: input.recordDate,
      registered_places: input.registeredPlaces,
      children_in_placement: input.childrenInPlacement,
      occupancy_rate: occupancyRate,
      referrals_in_progress: input.referralsInProgress,
      planned_admissions: input.plannedAdmissions,
      planned_departures: input.plannedDepartures,
      commentary: input.commentary ?? null,
      recorded_by: input.recordedBy,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeReferralMetrics,
  identifyReferralAlerts,
};
