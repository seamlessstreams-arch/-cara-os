// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING SERVICE
// Manages safeguarding referrals, LADO notifications, multi-agency tracking,
// and compliance analytics. Reg 34/35 and Working Together 2023.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ReferralType =
  | "mash" | "lado" | "police" | "child_protection"
  | "strategy_meeting" | "section_47" | "icpc" | "rcpc"
  | "professional_consultation" | "prevent" | "fgm" | "forced_marriage";

export type ReferralStatus =
  | "pending" | "submitted" | "acknowledged" | "investigating"
  | "outcome_received" | "closed" | "escalated";

export type ReferralUrgency = "immediate" | "within_24h" | "within_72h" | "routine";

export interface SafeguardingReferral {
  id: string;
  home_id: string;
  child_id: string;
  referral_type: ReferralType;
  urgency: ReferralUrgency;
  title: string;
  description: string;
  referred_to: string;
  referred_by: string;
  referral_date: string;
  acknowledged_date: string | null;
  outcome: string | null;
  outcome_date: string | null;
  status: ReferralStatus;
  follow_up_actions: string[];
  multi_agency_involved: string[];
  ofsted_notified: boolean;
  ofsted_notification_date: string | null;
  reg40_notification_sent: boolean;
  linked_incident_id: string | null;
  linked_risk_assessment_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFERRAL_TYPES: {
  type: ReferralType;
  label: string;
  description: string;
  typical_urgency: ReferralUrgency;
  notification_required: boolean;
  regulation_ref: string;
}[] = [
  { type: "mash", label: "MASH Referral", description: "Multi-Agency Safeguarding Hub referral for children at risk of harm", typical_urgency: "within_24h", notification_required: true, regulation_ref: "Reg 40(4)(a)" },
  { type: "lado", label: "LADO Referral", description: "Local Authority Designated Officer referral for allegations against staff", typical_urgency: "within_24h", notification_required: true, regulation_ref: "Working Together 2023" },
  { type: "police", label: "Police Referral", description: "Referral to police for criminal investigation or immediate safety concerns", typical_urgency: "immediate", notification_required: true, regulation_ref: "Reg 40(4)(c)" },
  { type: "child_protection", label: "Child Protection Referral", description: "Referral to children's social care for suspected significant harm", typical_urgency: "immediate", notification_required: true, regulation_ref: "Children Act 1989 s47" },
  { type: "strategy_meeting", label: "Strategy Meeting", description: "Multi-agency strategy discussion to plan investigation or response", typical_urgency: "within_72h", notification_required: false, regulation_ref: "Working Together 2023" },
  { type: "section_47", label: "Section 47 Investigation", description: "Local authority investigation into whether a child is suffering or likely to suffer significant harm", typical_urgency: "immediate", notification_required: true, regulation_ref: "Children Act 1989 s47" },
  { type: "icpc", label: "Initial Child Protection Conference", description: "Multi-agency conference to decide whether a child protection plan is needed", typical_urgency: "within_72h", notification_required: true, regulation_ref: "Working Together 2023" },
  { type: "rcpc", label: "Review Child Protection Conference", description: "Review conference to assess progress of child protection plan", typical_urgency: "routine", notification_required: false, regulation_ref: "Working Together 2023" },
  { type: "professional_consultation", label: "Professional Consultation", description: "Consultation with safeguarding professionals for advice or guidance", typical_urgency: "routine", notification_required: false, regulation_ref: "Working Together 2023" },
  { type: "prevent", label: "Prevent Referral", description: "Referral under Prevent duty for concerns about radicalisation or extremism", typical_urgency: "within_24h", notification_required: true, regulation_ref: "Prevent Duty 2023" },
  { type: "fgm", label: "FGM Mandatory Report", description: "Mandatory report of known or suspected female genital mutilation", typical_urgency: "immediate", notification_required: true, regulation_ref: "FGM Act 2003" },
  { type: "forced_marriage", label: "Forced Marriage Report", description: "Report of known or suspected forced marriage", typical_urgency: "immediate", notification_required: true, regulation_ref: "Forced Marriage Act 2007" },
];

export const NOTIFICATION_TIMEFRAMES: Record<ReferralUrgency, { maxHours: number; label: string }> = {
  immediate: { maxHours: 1, label: "Within 1 hour" },
  within_24h: { maxHours: 24, label: "Within 24 hours" },
  within_72h: { maxHours: 72, label: "Within 72 hours" },
  routine: { maxHours: 120, label: "Within 5 working days" },
};

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute overall safeguarding compliance metrics from a set of referrals.
 */
export function computeSafeguardingCompliance(
  referrals: SafeguardingReferral[],
  now: Date,
): {
  total_referrals: number;
  pending: number;
  overdue_acknowledgement: number;
  ofsted_notifications_required: number;
  ofsted_notifications_sent: number;
  notification_compliance_percentage: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  average_resolution_days: number | null;
} {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  let pending = 0;
  let overdueAcknowledgement = 0;
  let ofstedRequired = 0;
  let ofstedSent = 0;
  let totalResolutionDays = 0;
  let resolvedCount = 0;

  const fiveWorkingDaysMs = 5 * 24 * 60 * 60 * 1000;

  for (const r of referrals) {
    // Count by type
    byType[r.referral_type] = (byType[r.referral_type] ?? 0) + 1;

    // Count by status
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    // Count pending
    if (r.status === "pending") pending++;

    // Check overdue acknowledgement: submitted > 5 working days ago without acknowledgement
    if (r.status === "submitted" && !r.acknowledged_date) {
      const referralDate = new Date(r.referral_date);
      if (now.getTime() - referralDate.getTime() > fiveWorkingDaysMs) {
        overdueAcknowledgement++;
      }
    }

    // Ofsted notification tracking
    const typeConfig = REFERRAL_TYPES.find((t) => t.type === r.referral_type);
    if (typeConfig?.notification_required) {
      ofstedRequired++;
      if (r.ofsted_notified) ofstedSent++;
    }

    // Resolution time for closed referrals
    if (r.status === "closed" && r.outcome_date) {
      const created = new Date(r.referral_date);
      const resolved = new Date(r.outcome_date);
      const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      totalResolutionDays += days;
      resolvedCount++;
    }
  }

  const notificationCompliancePercentage =
    ofstedRequired > 0
      ? Math.round((ofstedSent / ofstedRequired) * 100)
      : 100;

  const averageResolutionDays =
    resolvedCount > 0
      ? Math.round((totalResolutionDays / resolvedCount) * 10) / 10
      : null;

  return {
    total_referrals: referrals.length,
    pending,
    overdue_acknowledgement: overdueAcknowledgement,
    ofsted_notifications_required: ofstedRequired,
    ofsted_notifications_sent: ofstedSent,
    notification_compliance_percentage: notificationCompliancePercentage,
    by_type: byType,
    by_status: byStatus,
    average_resolution_days: averageResolutionDays,
  };
}

/**
 * Check whether a referral is overdue based on urgency timeframe and acknowledgement.
 *
 * A referral is overdue if:
 *   - Status is "pending" and the urgency timeframe has expired
 *   - Status is "submitted" and >5 days without acknowledgement
 */
export function isReferralOverdue(
  referral: SafeguardingReferral,
  now: Date,
): boolean {
  const referralDate = new Date(referral.referral_date);

  // Pending referral: check urgency timeframe
  if (referral.status === "pending") {
    const timeframe = NOTIFICATION_TIMEFRAMES[referral.urgency];
    const maxMs = timeframe.maxHours * 60 * 60 * 1000;
    return now.getTime() - referralDate.getTime() > maxMs;
  }

  // Submitted referral: check acknowledgement deadline (5 working days)
  if (referral.status === "submitted" && !referral.acknowledged_date) {
    const fiveWorkingDaysMs = 5 * 24 * 60 * 60 * 1000;
    return now.getTime() - referralDate.getTime() > fiveWorkingDaysMs;
  }

  return false;
}

/**
 * Compute a safeguarding profile summary for a specific child.
 */
export function computeChildSafeguardingProfile(
  referrals: SafeguardingReferral[],
): {
  child_id: string;
  total_referrals: number;
  active_referrals: number;
  on_child_protection_plan: boolean;
  referral_history: { type: ReferralType; date: string; status: ReferralStatus }[];
  risk_indicator: "critical" | "high" | "medium" | "low";
} {
  const childId = referrals.length > 0 ? referrals[0].child_id : "";

  const activeStatuses: ReferralStatus[] = [
    "pending", "submitted", "acknowledged", "investigating", "escalated",
  ];

  const activeReferrals = referrals.filter((r) => activeStatuses.includes(r.status));

  // On child protection plan if any active section_47, icpc, or rcpc referral
  const cpPlanTypes: ReferralType[] = ["section_47", "icpc", "rcpc"];
  const onChildProtectionPlan = activeReferrals.some(
    (r) => cpPlanTypes.includes(r.referral_type),
  );

  // Build referral history
  const referralHistory = referrals.map((r) => ({
    type: r.referral_type,
    date: r.referral_date,
    status: r.status,
  }));

  // Compute risk indicator based on active referral severity
  let riskIndicator: "critical" | "high" | "medium" | "low" = "low";

  const hasImmediate = activeReferrals.some((r) => r.urgency === "immediate");
  const has24h = activeReferrals.some((r) => r.urgency === "within_24h");

  if (hasImmediate || activeReferrals.length >= 3 || onChildProtectionPlan) {
    riskIndicator = "critical";
  } else if (has24h || activeReferrals.length === 2) {
    riskIndicator = "high";
  } else if (activeReferrals.length === 1) {
    riskIndicator = "medium";
  }

  return {
    child_id: childId,
    total_referrals: referrals.length,
    active_referrals: activeReferrals.length,
    on_child_protection_plan: onChildProtectionPlan,
    referral_history: referralHistory,
    risk_indicator: riskIndicator,
  };
}

/**
 * Build a chronological safeguarding timeline from referrals.
 * Input referrals should be sorted by date (ascending).
 */
export function computeSafeguardingTimeline(
  referrals: SafeguardingReferral[],
): { date: string; type: ReferralType; event: string; description: string; outcome: string | null }[] {
  const timeline: { date: string; type: ReferralType; event: string; description: string; outcome: string | null }[] = [];

  for (const r of referrals) {
    const typeConfig = REFERRAL_TYPES.find((t) => t.type === r.referral_type);
    const label = typeConfig?.label ?? r.referral_type;

    // Referral created event
    timeline.push({
      date: r.referral_date,
      type: r.referral_type,
      event: `${label} initiated`,
      description: `${label} submitted to ${r.referred_to}: ${r.title}`,
      outcome: null,
    });

    // Acknowledged event
    if (r.acknowledged_date) {
      timeline.push({
        date: r.acknowledged_date,
        type: r.referral_type,
        event: `${label} acknowledged`,
        description: `${label} acknowledged by ${r.referred_to}`,
        outcome: null,
      });
    }

    // Outcome event
    if (r.outcome_date && r.outcome) {
      timeline.push({
        date: r.outcome_date,
        type: r.referral_type,
        event: `${label} outcome received`,
        description: `Outcome for ${label}: ${r.outcome}`,
        outcome: r.outcome,
      });
    }
  }

  // Sort timeline by date ascending
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return timeline;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listSafeguardingReferrals(
  homeId: string,
  opts?: {
    childId?: string;
    referralType?: ReferralType;
    status?: ReferralStatus;
    urgency?: ReferralUrgency;
    limit?: number;
  },
): Promise<ServiceResult<SafeguardingReferral[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_safeguarding_referrals") as SB).select("*").eq("home_id", homeId);
  if (opts?.childId) q = q.eq("child_id", opts.childId);
  if (opts?.referralType) q = q.eq("referral_type", opts.referralType);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.urgency) q = q.eq("urgency", opts.urgency);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getSafeguardingReferral(
  id: string,
): Promise<ServiceResult<SafeguardingReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createSafeguardingReferral(
  input: {
    homeId: string;
    childId: string;
    referralType: ReferralType;
    urgency: ReferralUrgency;
    title: string;
    description: string;
    referredTo: string;
    referredBy: string;
    referralDate?: string;
    followUpActions?: string[];
    multiAgencyInvolved?: string[];
    ofstedNotified?: boolean;
    ofstedNotificationDate?: string;
    reg40NotificationSent?: boolean;
    linkedIncidentId?: string;
    linkedRiskAssessmentId?: string;
  },
): Promise<ServiceResult<SafeguardingReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      referral_type: input.referralType,
      urgency: input.urgency,
      title: input.title,
      description: input.description,
      referred_to: input.referredTo,
      referred_by: input.referredBy,
      referral_date: input.referralDate ?? new Date().toISOString(),
      status: "pending" as ReferralStatus,
      follow_up_actions: input.followUpActions ?? [],
      multi_agency_involved: input.multiAgencyInvolved ?? [],
      ofsted_notified: input.ofstedNotified ?? false,
      ofsted_notification_date: input.ofstedNotificationDate ?? null,
      reg40_notification_sent: input.reg40NotificationSent ?? false,
      linked_incident_id: input.linkedIncidentId ?? null,
      linked_risk_assessment_id: input.linkedRiskAssessmentId ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSafeguardingReferral(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SafeguardingReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function acknowledgeReferral(
  id: string,
): Promise<ServiceResult<SafeguardingReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .update({
      status: "acknowledged" as ReferralStatus,
      acknowledged_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function closeReferral(
  id: string,
  outcome: string,
): Promise<ServiceResult<SafeguardingReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .update({
      status: "closed" as ReferralStatus,
      outcome,
      outcome_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSafeguardingCompliance,
  isReferralOverdue,
  computeChildSafeguardingProfile,
  computeSafeguardingTimeline,
  REFERRAL_TYPES,
  NOTIFICATION_TIMEFRAMES,
};
