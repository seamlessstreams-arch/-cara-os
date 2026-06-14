// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING PARTNERSHIP INTELLIGENCE SERVICE
// Manages multi-agency safeguarding partnerships, MASH referrals, strategy
// discussions, Section 47 enquiry outcomes, MARAC conferences, and child
// protection plan tracking.
// CHR 2015 Reg 12 (protection — safeguarding referral obligations),
// Reg 13 (leadership — multi-agency engagement and information sharing),
// Reg 34 (statutory guidance — safeguarding partnerships).
//
// Covers: MASH referrals, strategy discussions, Section 47 enquiries,
// child protection conferences, MARAC, MAPPA, Channel Panel,
// exploitation meetings, professional consultations, and LADO referrals.
//
// SCCIF: Helped & Protected — "The home works effectively with
// safeguarding partners." "Children's views are captured and shared."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const REFERRAL_TYPES = [
  "mash_referral",
  "strategy_discussion",
  "section_47_enquiry",
  "child_protection_conference",
  "marac",
  "mappa",
  "channel_panel",
  "exploitation_meeting",
  "professional_consultation",
  "lado_referral",
] as const;
export type ReferralType = (typeof REFERRAL_TYPES)[number];

export const REFERRAL_OUTCOMES = [
  "substantiated",
  "unsubstantiated",
  "ongoing_investigation",
  "no_further_action",
  "escalated",
] as const;
export type ReferralOutcome = (typeof REFERRAL_OUTCOMES)[number];

export const PARTNER_AGENCIES = [
  "police",
  "social_services",
  "health_visitor",
  "camhs",
  "education",
  "probation",
  "housing",
  "substance_misuse_service",
  "domestic_abuse_service",
  "youth_justice",
] as const;
export type PartnerAgency = (typeof PARTNER_AGENCIES)[number];

export const URGENCY_LEVELS = [
  "routine",
  "priority",
  "urgent",
  "emergency",
  "immediate_risk",
] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface SafeguardingPartnershipRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  referral_date: string;
  referral_type: ReferralType;
  referral_outcome: ReferralOutcome;
  partner_agency: PartnerAgency;
  urgency_level: UrgencyLevel;
  lead_professional: string | null;
  strategy_discussion_held: boolean;
  child_seen_alone: boolean;
  child_views_recorded: boolean;
  home_contributed_to_assessment: boolean;
  outcome_shared_with_home: boolean;
  follow_up_actions_agreed: boolean;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSafeguardingPartnerships(
  homeId: string,
): Promise<ServiceResult<SafeguardingPartnershipRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_safeguarding_partnerships") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("referral_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSafeguardingPartnership(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  referralDate: string;
  referralType: ReferralType;
  referralOutcome: ReferralOutcome;
  partnerAgency: PartnerAgency;
  urgencyLevel: UrgencyLevel;
  leadProfessional?: string | null;
  strategyDiscussionHeld: boolean;
  childSeenAlone: boolean;
  childViewsRecorded: boolean;
  homeContributedToAssessment: boolean;
  outcomeSharedWithHome: boolean;
  followUpActionsAgreed: boolean;
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<SafeguardingPartnershipRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_safeguarding_partnerships") as any)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      referral_date: input.referralDate,
      referral_type: input.referralType,
      referral_outcome: input.referralOutcome,
      partner_agency: input.partnerAgency,
      urgency_level: input.urgencyLevel,
      lead_professional: input.leadProfessional ?? null,
      strategy_discussion_held: input.strategyDiscussionHeld,
      child_seen_alone: input.childSeenAlone,
      child_views_recorded: input.childViewsRecorded,
      home_contributed_to_assessment: input.homeContributedToAssessment,
      outcome_shared_with_home: input.outcomeSharedWithHome,
      follow_up_actions_agreed: input.followUpActionsAgreed,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSafeguardingPartnershipMetrics(
  rows: SafeguardingPartnershipRow[],
): {
  total_referrals: number;
  substantiated_count: number;
  ongoing_count: number;
  emergency_count: number;
  escalated_count: number;
  child_seen_alone_rate: number;
  child_views_rate: number;
  home_contributed_rate: number;
  outcome_shared_rate: number;
  follow_up_agreed_rate: number;
  referral_type_breakdown: Record<string, number>;
  outcome_breakdown: Record<string, number>;
  unique_children: number;
} {
  const total = rows.length;

  const substantiated = rows.filter((r) => r.referral_outcome === "substantiated").length;
  const ongoing = rows.filter((r) => r.referral_outcome === "ongoing_investigation").length;
  const emergency = rows.filter((r) => r.urgency_level === "emergency" || r.urgency_level === "immediate_risk").length;
  const escalated = rows.filter((r) => r.referral_outcome === "escalated").length;

  const boolRate = (field: keyof SafeguardingPartnershipRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const referralTypeBreakdown: Record<string, number> = {};
  for (const r of rows) referralTypeBreakdown[r.referral_type] = (referralTypeBreakdown[r.referral_type] ?? 0) + 1;

  const outcomeBreakdown: Record<string, number> = {};
  for (const r of rows) outcomeBreakdown[r.referral_outcome] = (outcomeBreakdown[r.referral_outcome] ?? 0) + 1;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  return {
    total_referrals: total,
    substantiated_count: substantiated,
    ongoing_count: ongoing,
    emergency_count: emergency,
    escalated_count: escalated,
    child_seen_alone_rate: boolRate("child_seen_alone"),
    child_views_rate: boolRate("child_views_recorded"),
    home_contributed_rate: boolRate("home_contributed_to_assessment"),
    outcome_shared_rate: boolRate("outcome_shared_with_home"),
    follow_up_agreed_rate: boolRate("follow_up_actions_agreed"),
    referral_type_breakdown: referralTypeBreakdown,
    outcome_breakdown: outcomeBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeSafeguardingPartnershipAlerts(
  rows: SafeguardingPartnershipRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: emergency/immediate_risk + child not seen alone
  for (const r of rows) {
    if ((r.urgency_level === "emergency" || r.urgency_level === "immediate_risk") && !r.child_seen_alone) {
      alerts.push({
        type: "emergency_child_not_seen_alone",
        severity: "critical",
        message: `${r.child_name} has an ${r.urgency_level.replace(/_/g, " ")} referral but was not seen alone — immediate direct work with the child is required`,
        record_id: r.id,
      });
    }
  }

  // High: substantiated outcome + outcome not shared with home
  for (const r of rows) {
    if (r.referral_outcome === "substantiated" && !r.outcome_shared_with_home) {
      alerts.push({
        type: "substantiated_outcome_not_shared",
        severity: "high",
        message: `Substantiated referral outcome for ${r.child_name} has not been shared with the home — ensure information sharing obligations are met`,
        record_id: r.id,
      });
    }
  }

  // High: child views not recorded for multiple referrals
  const noChildViews = rows.filter((r) => !r.child_views_recorded);
  if (noChildViews.length >= 2) {
    alerts.push({
      type: "child_views_not_recorded",
      severity: "high",
      message: `${noChildViews.length} referrals have child views not recorded — the child's voice must be captured per Working Together 2023`,
    });
  }

  // Medium: follow-up actions not agreed for multiple cases
  const noFollowUp = rows.filter((r) => !r.follow_up_actions_agreed);
  if (noFollowUp.length >= 2) {
    alerts.push({
      type: "follow_up_not_agreed",
      severity: "medium",
      message: `${noFollowUp.length} referrals without follow-up actions agreed — review multi-agency action planning to ensure continuity of safeguarding`,
    });
  }

  return alerts;
}

export function generateSafeguardingPartnershipCaraInsights(
  metrics: ReturnType<typeof computeSafeguardingPartnershipMetrics>,
  alerts: ReturnType<typeof computeSafeguardingPartnershipAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_referrals} safeguarding partnership ${metrics.total_referrals === 1 ? "referral" : "referrals"} tracked across ${metrics.unique_children} unique ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Child seen alone rate is ${metrics.child_seen_alone_rate}%, child views recorded at ${metrics.child_views_rate}%, ` +
      `and the home contributed to ${metrics.home_contributed_rate}% of assessments.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.substantiated_count} substantiated ${metrics.substantiated_count === 1 ? "outcome" : "outcomes"}, ` +
        `${metrics.ongoing_count} ongoing ${metrics.ongoing_count === 1 ? "investigation" : "investigations"}, ` +
        `and ${metrics.emergency_count} emergency-level ${metrics.emergency_count === 1 ? "referral" : "referrals"} requiring immediate attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.substantiated_count} substantiated and ${metrics.escalated_count} escalated. ` +
        `Continue strengthening multi-agency partnerships to maintain safeguarding standards.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.emergency_count > 0) {
    insights.push(
      `[reflect] ${metrics.emergency_count} emergency-level ${metrics.emergency_count === 1 ? "referral has" : "referrals have"} been recorded. ` +
        `Are the home's emergency safeguarding protocols robust enough to ensure children are seen promptly ` +
        `and their views captured during high-risk multi-agency processes?`,
    );
  } else if (metrics.outcome_shared_rate < 100) {
    insights.push(
      `[reflect] Outcomes have been shared with the home in ${metrics.outcome_shared_rate}% of referrals. ` +
        `Could gaps in information sharing between safeguarding partners and the home ` +
        `undermine the quality of care planning for children?`,
    );
  } else {
    insights.push(
      `[reflect] All safeguarding partnership outcomes are being shared and followed up effectively. ` +
        `How can the home build on this strong multi-agency collaboration to further improve ` +
        `outcomes for children subject to safeguarding processes?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSafeguardingPartnershipMetrics,
  computeSafeguardingPartnershipAlerts,
  generateSafeguardingPartnershipCaraInsights,
};
