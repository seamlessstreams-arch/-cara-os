// ══════════════════════════════════════════════════════════════════════════════
// CARA — PHYSICAL INTERVENTION PATTERN INTELLIGENCE
// GET /api/v1/physical-intervention-pattern-intelligence
//
// Surfaces per-child and per-staff PI frequency trends, antecedent patterns,
// de-escalation documentation, debrief completion, injury data, and pending
// reviews. Designed to help the manager answer the Ofsted question:
//
// "Is your use of physical intervention reducing over time, and what
//  specific steps are you taking to prevent it?"
//
// This is a regulation-support and practice-improvement tool. Low scores
// prompt supervision conversations — not disciplinary processes.
//
// "Physical intervention should always be a last resort. The reduction
//  of restraint is a sign of a therapeutic culture, not weakness."
// — DfE Guidance; Reg 18 & 19; Love & Logic / Positive Environments
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PITrend = "increasing" | "stable" | "decreasing";
export type ChildPISignal = "concerning" | "monitoring" | "stable" | "improving";

export interface ChildPIProfile {
  childId: string;
  childName: string;
  totalRestraints: number;
  last30d: number;
  prior30d: number;
  trend: "increasing" | "stable" | "decreasing";
  avgDurationMinutes: number | null;
  deEscalationRate: number | null;         // 0–100
  debriefRate: number | null;              // 0–100
  staffDebriefRate: number | null;         // 0–100
  injuryCount: number;
  pendingReviewCount: number;
  recentAntecedents: string[];
  recentTypes: string[];
  signal: ChildPISignal;
  supervisionPrompt: string;
}

export interface StaffPIProfile {
  staffId: string;
  staffName: string;
  leadCount: number;
  supportCount: number;
  totalInvolvements: number;
  deEscalationDocumentedOnLeads: number;
  deEscalationRateOnLeads: number | null;  // 0–100
}

export interface AntecedentFrequency {
  antecedent: string;
  count: number;
}

export interface PhysicalInterventionSummary {
  totalRestraints: number;
  totalLast30d: number;
  totalPrior30d: number;
  homeTrend: PITrend;
  pendingReviews: number;
  childrenWithPendingDebrief: number;
  totalInjuries: number;
  avgDurationMinutes: number | null;
  commonAntecedents: AntecedentFrequency[];
  ofstedNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trend(last: number, prior: number): "increasing" | "stable" | "decreasing" {
  if (prior === 0 && last === 0) return "stable";
  if (prior === 0) return "increasing";
  const change = (last - prior) / prior;
  if (change >= 0.2) return "increasing";
  if (change <= -0.2) return "decreasing";
  return "stable";
}

function childSignal(
  totalRestraints: number,
  last30d: number,
  piTrend: "increasing" | "stable" | "decreasing",
  injuryCount: number,
): ChildPISignal {
  if (totalRestraints === 0) return "stable";
  if (injuryCount > 0 || (last30d >= 3 && piTrend === "increasing")) return "concerning";
  if (last30d >= 2 || piTrend === "increasing") return "monitoring";
  if (piTrend === "decreasing" && last30d <= 1) return "improving";
  return "stable";
}

function buildChildPrompt(
  childName: string,
  signal: ChildPISignal,
  totalRestraints: number,
  last30d: number,
  piTrend: "increasing" | "stable" | "decreasing",
  deEscalationRate: number,
  debriefRate: number,
  antecedents: string[],
): string {
  if (totalRestraints === 0) {
    return `${childName} has had no recorded physical interventions. This is positive — ensure behaviour support strategies are documented to sustain this.`;
  }
  if (signal === "concerning") {
    return `${childName}'s PI rate is concerning — ${last30d} in the last 30 days and a trend of ${piTrend}. Bring to next supervision and MDT. Are unmet needs driving the escalation? Has the behaviour support plan been reviewed?`;
  }
  if (piTrend === "increasing") {
    return `${childName}'s PIs are increasing (${last30d} in last 30d vs prior period). In supervision: what is the trigger pattern? ${antecedents.length > 0 ? `The most common antecedent documented is: "${antecedents[0]}".` : ""} Is the existing plan sufficient?`;
  }
  if (deEscalationRate < 50) {
    return `De-escalation is underdocumented in ${childName}'s PI records (${deEscalationRate}% of records show attempts). Explore in supervision: are staff consistently trying alternatives before intervening? Is this a recording gap or a practice gap?`;
  }
  if (debriefRate < 75) {
    return `${childName}'s child debrief completion rate is ${debriefRate}%. Every child deserves a conversation after a PI. Explore in supervision: is this a timing barrier, or are staff uncertain how to approach the debrief?`;
  }
  if (signal === "improving") {
    return `${childName}'s physical intervention rate is improving — ${last30d} in the last 30 days, down from the prior period. Explore in supervision: what's working? How can we embed those strategies across the team?`;
  }
  return `${childName}'s PI pattern is stable. Review the antecedent documentation in supervision and ensure the behaviour support plan reflects current understanding of ${childName}'s needs.`;
}

// ── Extract simple antecedent from text (first ~60 chars) ─────────────────────

function shortAntecedent(text: string): string {
  if (!text || text.trim().length === 0) return "Not documented";
  const trimmed = text.trim();
  if (trimmed.length <= 60) return trimmed;
  const spaceIdx = trimmed.lastIndexOf(" ", 60);
  return spaceIdx > 0 ? trimmed.slice(0, spaceIdx) + "…" : trimmed.slice(0, 60) + "…";
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const now = new Date();
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoff60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const restraints = (store.restraints ?? []) as Array<{
    id: string;
    date: string;
    duration: number;
    child_id: string;
    staff_involved: Array<{ staff_id: string; role: string }>;
    reason: string;
    restraint_type: string;
    antecedent: string;
    de_escalation_attempts: string[];
    child_debriefed: boolean;
    staff_debriefed: boolean;
    injuries: Array<{ person: string }>;
    review_status: string;
  }>;

  const staff = (store.staff ?? []) as Array<{
    id: string; full_name: string; first_name: string; last_name: string; employment_status: string;
  }>;

  const staffById = new Map(staff.map((s) => [s.id, s.full_name || `${s.first_name} ${s.last_name}`]));

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // Index restraints by child
  const restraintsByChild = new Map<string, typeof restraints>();
  for (const r of restraints) {
    const arr = restraintsByChild.get(r.child_id) ?? [];
    arr.push(r);
    restraintsByChild.set(r.child_id, arr);
  }

  // ── Per-child profiles ────────────────────────────────────────────────────
  const childProfiles: ChildPIProfile[] = currentChildren.map((yp) => {
    const childRestraints = restraintsByChild.get(yp.id) ?? [];
    const r30d = childRestraints.filter((r) => new Date(r.date) >= cutoff30d);
    const rPrior = childRestraints.filter((r) => {
      const d = new Date(r.date);
      return d >= cutoff60d && d < cutoff30d;
    });

    const avgDuration = childRestraints.length > 0
      ? Math.round(childRestraints.reduce((s, r) => s + (r.duration ?? 0), 0) / childRestraints.length * 10) / 10
      : null;

    const withDeEscalation = childRestraints.filter((r) => r.de_escalation_attempts && r.de_escalation_attempts.length > 0);
    const deEscalationRate = childRestraints.length > 0
      ? Math.round((withDeEscalation.length / childRestraints.length) * 100) : null;

    const childDebriefed = childRestraints.filter((r) => r.child_debriefed);
    const debriefRate = childRestraints.length > 0
      ? Math.round((childDebriefed.length / childRestraints.length) * 100) : null;

    const staffDebriefed = childRestraints.filter((r) => r.staff_debriefed);
    const staffDebriefRate = childRestraints.length > 0
      ? Math.round((staffDebriefed.length / childRestraints.length) * 100) : null;

    const injuryCount = childRestraints.reduce((s, r) => s + (r.injuries ?? []).length, 0);
    const pendingReviewCount = childRestraints.filter((r) =>
      r.review_status && r.review_status !== "reviewed" && r.review_status !== "referred_lado"
    ).length;

    const recentAntecedents = childRestraints
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map((r) => shortAntecedent(r.antecedent));

    const recentTypes = [...new Set(r30d.map((r) => r.restraint_type))];

    const piTrend = trend(r30d.length, rPrior.length);
    const signal = childSignal(childRestraints.length, r30d.length, piTrend, injuryCount);

    return {
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      totalRestraints: childRestraints.length,
      last30d: r30d.length,
      prior30d: rPrior.length,
      trend: piTrend,
      avgDurationMinutes: avgDuration,
      deEscalationRate,
      debriefRate,
      staffDebriefRate,
      injuryCount,
      pendingReviewCount,
      recentAntecedents,
      recentTypes,
      signal,
      supervisionPrompt: buildChildPrompt(
        `${yp.first_name} ${yp.last_name}`, signal,
        childRestraints.length, r30d.length, piTrend, (deEscalationRate ?? 0), (debriefRate ?? 0),
        recentAntecedents,
      ),
    };
  });

  // Sort: concerning → monitoring → stable → improving
  const SIGNAL_ORDER: Record<ChildPISignal, number> = {
    concerning: 0, monitoring: 1, stable: 2, improving: 3,
  };
  childProfiles.sort((a, b) => SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal]);

  // ── Per-staff profiles ────────────────────────────────────────────────────
  const staffPIMap = new Map<string, { leadCount: number; supportCount: number; leadWithDeEscalation: number }>();

  for (const r of restraints) {
    for (const entry of (r.staff_involved ?? []) as Array<{ staff_id: string; role: string }>) {
      const existing = staffPIMap.get(entry.staff_id) ?? { leadCount: 0, supportCount: 0, leadWithDeEscalation: 0 };
      if (entry.role === "lead") {
        existing.leadCount++;
        if (r.de_escalation_attempts && r.de_escalation_attempts.length > 0) {
          existing.leadWithDeEscalation++;
        }
      } else {
        existing.supportCount++;
      }
      staffPIMap.set(entry.staff_id, existing);
    }
  }

  const staffProfiles: StaffPIProfile[] = [...staffPIMap.entries()]
    .map(([staffId, counts]) => ({
      staffId,
      staffName: staffById.get(staffId) ?? staffId,
      leadCount: counts.leadCount,
      supportCount: counts.supportCount,
      totalInvolvements: counts.leadCount + counts.supportCount,
      deEscalationDocumentedOnLeads: counts.leadWithDeEscalation,
      deEscalationRateOnLeads: counts.leadCount > 0
        ? Math.round((counts.leadWithDeEscalation / counts.leadCount) * 100) : null,
    }))
    .sort((a, b) => b.totalInvolvements - a.totalInvolvements);

  // ── Common antecedents ────────────────────────────────────────────────────
  const ANTECEDENT_KEYWORDS = [
    { key: "phone call", label: "Family phone call" },
    { key: "community", label: "Community visit / outing" },
    { key: "court", label: "Court / legal proceedings" },
    { key: "school", label: "School / education" },
    { key: "homework", label: "Homework / tasks" },
    { key: "peer", label: "Peer conflict" },
    { key: "refused", label: "Refusal / limit setting" },
    { key: "self-harm", label: "Self-harm episode" },
    { key: "disappoint", label: "Disappointment / unmet expectation" },
  ];

  const antecedentCounts: AntecedentFrequency[] = ANTECEDENT_KEYWORDS
    .map(({ key, label }) => ({
      antecedent: label,
      count: restraints.filter((r) => r.antecedent && r.antecedent.toLowerCase().includes(key)).length,
    }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Home summary ──────────────────────────────────────────────────────────
  const total30d = restraints.filter((r) => new Date(r.date) >= cutoff30d).length;
  const totalPrior30d = restraints.filter((r) => {
    const d = new Date(r.date);
    return d >= cutoff60d && d < cutoff30d;
  }).length;

  const homeTrend = trend(total30d, totalPrior30d);
  const pendingReviews = restraints.filter((r) =>
    r.review_status && r.review_status !== "reviewed" && r.review_status !== "referred_lado"
  ).length;
  const notDebriefed = childProfiles.filter((c) => c.totalRestraints > 0 && (c.debriefRate ?? 0) < 100).length;
  const totalInjuries = restraints.reduce((s, r) => s + (r.injuries ?? []).length, 0);
  const avgDuration = restraints.length > 0
    ? Math.round(restraints.reduce((s, r) => s + (r.duration ?? 0), 0) / restraints.length * 10) / 10
    : null;

  const ofstedNote =
    restraints.length === 0
      ? "No physical interventions recorded. Ensure this is accurate and that the team knows when and how to record them."
      : homeTrend === "increasing"
      ? `Physical interventions are increasing: ${total30d} in the last 30 days vs ${totalPrior30d} in the prior period. An inspector will ask: what is the team doing to understand and address this escalation?`
      : pendingReviews > 0
      ? `${pendingReviews} physical intervention${pendingReviews > 1 ? "s" : ""} are pending manager review. Ofsted expect all restraints to be reviewed promptly.`
      : totalInjuries > 0
      ? `${totalInjuries} injury${totalInjuries > 1 ? "ies" : ""} recorded alongside physical interventions. These require individual review and should be reflected in behaviour support plans.`
      : homeTrend === "decreasing"
      ? `Physical intervention rate is decreasing (${total30d} last 30d vs ${totalPrior30d} prior period). This is a positive sign of a therapeutic culture — document and share what's working.`
      : `${restraints.length} physical intervention${restraints.length > 1 ? "s" : ""} recorded. Rate is stable. Ensure regular supervision review of antecedents and patterns.`;

  const summary: PhysicalInterventionSummary = {
    totalRestraints: restraints.length,
    totalLast30d: total30d,
    totalPrior30d,
    homeTrend,
    pendingReviews,
    childrenWithPendingDebrief: notDebriefed,
    totalInjuries,
    avgDurationMinutes: avgDuration,
    commonAntecedents: antecedentCounts,
    ofstedNote,
  };

  return NextResponse.json({ data: { childProfiles, staffProfiles, summary } });
}

export interface PhysicalInterventionPatternResponse {
  data: {
    childProfiles: ChildPIProfile[];
    staffProfiles: StaffPIProfile[];
    summary: PhysicalInterventionSummary;
  };
}
