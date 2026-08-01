// ══════════════════════════════════════════════════════════════════════════════
// CARA — PEER MENTORING SERVICE
// Manages peer mentoring and buddy programmes — pairing children for
// mutual support, tracking progress, and monitoring outcomes.
// CHR 2015 Reg 5 (engaging with the wider community — peer support),
// Reg 7 (children's views — peer relationships),
// Reg 6 (quality and purpose of care — positive peer culture).
//
// Tracks mentoring pairings, session records, progress,
// and safeguarding considerations in peer relationships.
//
// SCCIF: Overall Experiences — "Children support each other."
// "Positive peer relationships are encouraged and supported."
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

export type PairingType =
  | "buddy_system"
  | "peer_mentor"
  | "welcome_buddy"
  | "skills_partner"
  | "study_buddy"
  | "activity_partner"
  | "other";

export type PairingStatus =
  | "active"
  | "paused"
  | "completed"
  | "ended_early"
  | "pending_review";

export type SessionOutcome =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "session_cancelled";

export type SafeguardingFlag =
  | "none"
  | "power_imbalance"
  | "bullying_concern"
  | "inappropriate_behaviour"
  | "emotional_harm"
  | "escalated";

export interface PeerPairing {
  id: string;
  home_id: string;
  mentor_name: string;
  mentor_id: string;
  mentee_name: string;
  mentee_id: string;
  pairing_type: PairingType;
  pairing_status: PairingStatus;
  start_date: string;
  end_date: string | null;
  goals: string[];
  sessions_completed: number;
  last_session_date: string | null;
  last_session_outcome: SessionOutcome | null;
  safeguarding_flag: SafeguardingFlag;
  mentor_feedback: string | null;
  mentee_feedback: string | null;
  staff_observations: string | null;
  reviewed_by: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PAIRING_TYPES: { type: PairingType; label: string }[] = [
  { type: "buddy_system", label: "Buddy System" },
  { type: "peer_mentor", label: "Peer Mentor" },
  { type: "welcome_buddy", label: "Welcome Buddy" },
  { type: "skills_partner", label: "Skills Partner" },
  { type: "study_buddy", label: "Study Buddy" },
  { type: "activity_partner", label: "Activity Partner" },
  { type: "other", label: "Other" },
];

export const PAIRING_STATUSES: { status: PairingStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "paused", label: "Paused" },
  { status: "completed", label: "Completed" },
  { status: "ended_early", label: "Ended Early" },
  { status: "pending_review", label: "Pending Review" },
];

export const SESSION_OUTCOMES: { outcome: SessionOutcome; label: string }[] = [
  { outcome: "very_positive", label: "Very Positive" },
  { outcome: "positive", label: "Positive" },
  { outcome: "neutral", label: "Neutral" },
  { outcome: "negative", label: "Negative" },
  { outcome: "session_cancelled", label: "Cancelled" },
];

export const SAFEGUARDING_FLAGS: { flag: SafeguardingFlag; label: string }[] = [
  { flag: "none", label: "None" },
  { flag: "power_imbalance", label: "Power Imbalance" },
  { flag: "bullying_concern", label: "Bullying Concern" },
  { flag: "inappropriate_behaviour", label: "Inappropriate Behaviour" },
  { flag: "emotional_harm", label: "Emotional Harm" },
  { flag: "escalated", label: "Escalated" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePeerMetrics(
  pairings: PeerPairing[],
  totalChildren: number,
): {
  total_pairings: number;
  active_pairings: number;
  completed_pairings: number;
  ended_early_count: number;
  children_involved: number;
  participation_rate: number | null;
  total_sessions: number;
  average_sessions_per_pairing: number | null;
  positive_outcome_rate: number | null;
  safeguarding_concerns: number;
  mentor_feedback_rate: number | null;
  mentee_feedback_rate: number | null;
  by_pairing_type: Record<string, number>;
  by_status: Record<string, number>;
  by_session_outcome: Record<string, number>;
  by_safeguarding_flag: Record<string, number>;
} {
  const active = pairings.filter((p) => p.pairing_status === "active").length;
  const completed = pairings.filter((p) => p.pairing_status === "completed").length;
  const endedEarly = pairings.filter((p) => p.pairing_status === "ended_early").length;

  const childrenInvolved = new Set([
    ...pairings.map((p) => p.mentor_id),
    ...pairings.map((p) => p.mentee_id),
  ]).size;
  const participationRate =
    totalChildren > 0
      ? Math.round((childrenInvolved / totalChildren) * 1000) / 10
      : null;

  const totalSessions = pairings.reduce((sum, p) => sum + p.sessions_completed, 0);
  const avgSessions =
    pairings.length > 0
      ? Math.round((totalSessions / pairings.length) * 10) / 10
      : null;

  const withOutcome = pairings.filter((p) => p.last_session_outcome !== null);
  const positiveOutcomes = withOutcome.filter(
    (p) => p.last_session_outcome === "very_positive" || p.last_session_outcome === "positive",
  ).length;
  const positiveRate =
    withOutcome.length > 0
      ? Math.round((positiveOutcomes / withOutcome.length) * 1000) / 10
      : null;

  const safeguardingConcerns = pairings.filter(
    (p) => p.safeguarding_flag !== "none",
  ).length;

  const mentorFeedback = pairings.filter((p) => p.mentor_feedback !== null).length;
  const mentorRate =
    pairings.length > 0
      ? Math.round((mentorFeedback / pairings.length) * 1000) / 10
      : null;

  const menteeFeedback = pairings.filter((p) => p.mentee_feedback !== null).length;
  const menteeRate =
    pairings.length > 0
      ? Math.round((menteeFeedback / pairings.length) * 1000) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const p of pairings) byType[p.pairing_type] = (byType[p.pairing_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const p of pairings) byStatus[p.pairing_status] = (byStatus[p.pairing_status] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const p of pairings) {
    if (p.last_session_outcome) byOutcome[p.last_session_outcome] = (byOutcome[p.last_session_outcome] ?? 0) + 1;
  }

  const byFlag: Record<string, number> = {};
  for (const p of pairings) byFlag[p.safeguarding_flag] = (byFlag[p.safeguarding_flag] ?? 0) + 1;

  return {
    total_pairings: pairings.length,
    active_pairings: active,
    completed_pairings: completed,
    ended_early_count: endedEarly,
    children_involved: childrenInvolved,
    participation_rate: participationRate,
    total_sessions: totalSessions,
    average_sessions_per_pairing: avgSessions,
    positive_outcome_rate: positiveRate,
    safeguarding_concerns: safeguardingConcerns,
    mentor_feedback_rate: mentorRate,
    mentee_feedback_rate: menteeRate,
    by_pairing_type: byType,
    by_status: byStatus,
    by_session_outcome: byOutcome,
    by_safeguarding_flag: byFlag,
  };
}

export function identifyPeerAlerts(
  pairings: PeerPairing[],
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

  // Safeguarding concerns
  for (const p of pairings) {
    if (p.safeguarding_flag !== "none" && p.safeguarding_flag !== "escalated") {
      alerts.push({
        type: "safeguarding_concern",
        severity: "high",
        message: `Safeguarding concern (${p.safeguarding_flag.replace(/_/g, " ")}) in pairing between ${p.mentor_name} and ${p.mentee_name} — review and consider pausing`,
        id: p.id,
      });
    }
    if (p.safeguarding_flag === "escalated") {
      alerts.push({
        type: "safeguarding_escalated",
        severity: "critical",
        message: `Escalated safeguarding concern in pairing between ${p.mentor_name} and ${p.mentee_name} — immediate action required`,
        id: p.id,
      });
    }
  }

  // Negative session outcomes
  for (const p of pairings) {
    if (p.last_session_outcome === "negative" && p.pairing_status === "active") {
      alerts.push({
        type: "negative_outcome",
        severity: "medium",
        message: `Last session between ${p.mentor_name} and ${p.mentee_name} was negative — review pairing suitability`,
        id: p.id,
      });
    }
  }

  // Pairings pending review
  for (const p of pairings) {
    if (p.pairing_status === "pending_review") {
      alerts.push({
        type: "review_needed",
        severity: "medium",
        message: `Peer pairing between ${p.mentor_name} and ${p.mentee_name} needs review — decide whether to continue, adjust, or end`,
        id: p.id,
      });
    }
  }

  // Active pairings with no sessions
  for (const p of pairings) {
    if (p.pairing_status === "active" && p.sessions_completed === 0) {
      alerts.push({
        type: "no_sessions",
        severity: "medium",
        message: `Peer pairing between ${p.mentor_name} and ${p.mentee_name} is active but no sessions recorded — schedule first session`,
        id: p.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listPairings(
  homeId: string,
  filters?: {
    mentorId?: string;
    menteeId?: string;
    pairingType?: PairingType;
    pairingStatus?: PairingStatus;
    limit?: number;
  },
): Promise<ServiceResult<PeerPairing[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_peer_pairings") as SB).select("*").eq("home_id", homeId);
  if (filters?.mentorId) q = q.eq("mentor_id", filters.mentorId);
  if (filters?.menteeId) q = q.eq("mentee_id", filters.menteeId);
  if (filters?.pairingType) q = q.eq("pairing_type", filters.pairingType);
  if (filters?.pairingStatus) q = q.eq("pairing_status", filters.pairingStatus);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPairing(
  input: {
    homeId: string;
    mentorName: string;
    mentorId: string;
    menteeName: string;
    menteeId: string;
    pairingType: PairingType;
    pairingStatus: PairingStatus;
    startDate: string;
    goals: string[];
    notes?: string;
  },
): Promise<ServiceResult<PeerPairing>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_peer_pairings") as SB)
    .insert({
      home_id: input.homeId,
      mentor_name: input.mentorName,
      mentor_id: input.mentorId,
      mentee_name: input.menteeName,
      mentee_id: input.menteeId,
      pairing_type: input.pairingType,
      pairing_status: input.pairingStatus,
      start_date: input.startDate,
      end_date: null,
      goals: input.goals,
      sessions_completed: 0,
      last_session_date: null,
      last_session_outcome: null,
      safeguarding_flag: "none",
      mentor_feedback: null,
      mentee_feedback: null,
      staff_observations: null,
      reviewed_by: null,
      review_date: null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePairing(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<PeerPairing>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_peer_pairings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePeerMetrics,
  identifyPeerAlerts,
};
