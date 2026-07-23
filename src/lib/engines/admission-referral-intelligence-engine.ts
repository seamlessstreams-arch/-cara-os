// ══════════════════════════════════════════════════════════════════════════════
// CARA — ADMISSION & REFERRAL INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses referral pipeline, impact assessments, matching decisions,
// placement planning timelines, and admission quality metrics.
//
// Regulatory: Reg 11 (Duty to protect and promote welfare — matching),
// Reg 12 (Impact assessments), Reg 14 (Care planning — placement stability),
// SCCIF: Leadership — "Does the home only accept children when an appropriate
// impact assessment demonstrates a good match?"
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meanOf, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export type ReferralSource = "local_authority" | "agency" | "emergency" | "internal_transfer";
export type ReferralStatus = "new" | "under_assessment" | "impact_assessment" | "panel" | "accepted" | "placed" | "declined" | "withdrawn";

export interface ReferralInput {
  id: string;
  child_name: string;
  age: number;
  gender: string;
  referral_date: string;
  referral_source: ReferralSource;
  local_authority: string;
  status: ReferralStatus;
  presenting_needs: string[];
  risk_factors: string[];
  impact_assessment_complete: boolean;
  decision_date: string | null;
  decision_reason: string | null;
  estimated_placement_date: string | null;
  days_open?: number; // calculated if not provided
}

export interface AdmissionReferralIntelligenceInput {
  referrals: ReferralInput[];
  current_occupancy: number;
  max_occupancy: number;
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface PipelineOverview {
  total_referrals: number;
  active_referrals: number; // not declined/withdrawn
  new_count: number;
  under_assessment_count: number;
  impact_assessment_count: number;
  panel_count: number;
  accepted_count: number;
  declined_count: number;
  withdrawn_count: number;
  impact_assessment_completion_rate: number | null; // % of non-new referrals with IA done
  avg_days_to_decision: number | null;              // null = nothing has been decided yet
  occupancy_rate: number | null;                    // percentage; null = no registered capacity
  available_beds: number;
}

export interface ReferralProfile {
  id: string;
  child_name: string;
  age: number;
  gender: string;
  status: ReferralStatus;
  source: ReferralSource;
  local_authority: string;
  days_open: number;
  presenting_needs_count: number;
  risk_factors_count: number;
  has_impact_assessment: boolean;
  urgency: "critical" | "high" | "standard";
}

export interface SourceAnalysis {
  source: ReferralSource;
  count: number;
  accepted: number;
  declined: number;
  avg_days_to_decision: number | null;
}

export interface DecisionAnalysis {
  total_decisions: number;
  acceptance_rate: number | null;
  decline_rate: number | null;
  withdrawal_rate: number | null;
  avg_days_to_decision: number | null;
  decisions_without_impact_assessment: number;
}

export interface AdmissionAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraAdmissionInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface AdmissionReferralIntelligenceResult {
  overview: PipelineOverview;
  referral_profiles: ReferralProfile[];
  source_analysis: SourceAnalysis[];
  decision_analysis: DecisionAnalysis;
  alerts: AdmissionAlert[];
  insights: CaraAdmissionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function daysUntil(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

const ACTIVE_STATUSES: ReferralStatus[] = ["new", "under_assessment", "impact_assessment", "panel", "accepted"];
const DECIDED_STATUSES: ReferralStatus[] = ["accepted", "placed", "declined"];

// ── Main Computation ────────────────────────────────────────────────────────

export function computeAdmissionReferralIntelligence(
  input: AdmissionReferralIntelligenceInput,
): AdmissionReferralIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { referrals, current_occupancy, max_occupancy } = input;

  // ── Pipeline counts ───────────────────────────────────────────────────
  const active = referrals.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const newCount = referrals.filter((r) => r.status === "new").length;
  const underAssessment = referrals.filter((r) => r.status === "under_assessment").length;
  const impactAssessment = referrals.filter((r) => r.status === "impact_assessment").length;
  const panel = referrals.filter((r) => r.status === "panel").length;
  const accepted = referrals.filter((r) => r.status === "accepted" || r.status === "placed").length;
  const declined = referrals.filter((r) => r.status === "declined").length;
  const withdrawn = referrals.filter((r) => r.status === "withdrawn").length;

  // Impact assessment completion — for referrals past "new" stage
  const pastNewStage = referrals.filter((r) => r.status !== "new");
  const withIA = pastNewStage.filter((r) => r.impact_assessment_complete).length;
  const iaRate = rate(withIA, pastNewStage.length);

  // Average days to decision (for decided referrals)
  const decided = referrals.filter((r) => DECIDED_STATUSES.includes(r.status) && r.decision_date);
  const decisionDays = decided.map((r) => daysBetween(r.referral_date, r.decision_date!));
  const avgDaysToDecision = meanOf(decisionDays);

  // Occupancy
  const occupancyRate = rate(current_occupancy, max_occupancy);
  const availableBeds = Math.max(0, max_occupancy - current_occupancy);

  const overview: PipelineOverview = {
    total_referrals: referrals.length,
    active_referrals: active.length,
    new_count: newCount,
    under_assessment_count: underAssessment,
    impact_assessment_count: impactAssessment,
    panel_count: panel,
    accepted_count: accepted,
    declined_count: declined,
    withdrawn_count: withdrawn,
    impact_assessment_completion_rate: iaRate,
    avg_days_to_decision: avgDaysToDecision,
    occupancy_rate: occupancyRate,
    available_beds: availableBeds,
  };

  // ── Referral Profiles ─────────────────────────────────────────────────
  const referral_profiles: ReferralProfile[] = referrals.map((r) => {
    const daysOpen = r.days_open ?? daysBetween(r.referral_date, today);

    // Urgency classification
    let urgency: "critical" | "high" | "standard" = "standard";
    if (r.referral_source === "emergency") urgency = "critical";
    else if (daysOpen > 14 && ACTIVE_STATUSES.includes(r.status) && r.status !== "accepted") urgency = "high";
    else if (r.risk_factors.length >= 3) urgency = "high";

    return {
      id: r.id,
      child_name: r.child_name,
      age: r.age,
      gender: r.gender,
      status: r.status,
      source: r.referral_source,
      local_authority: r.local_authority,
      days_open: daysOpen,
      presenting_needs_count: r.presenting_needs.length,
      risk_factors_count: r.risk_factors.length,
      has_impact_assessment: r.impact_assessment_complete,
      urgency,
    };
  });

  // ── Source Analysis ────────────────────────────────────────────────────
  const sourceMap = new Map<ReferralSource, ReferralInput[]>();
  for (const r of referrals) {
    const existing = sourceMap.get(r.referral_source) ?? [];
    existing.push(r);
    sourceMap.set(r.referral_source, existing);
  }

  const source_analysis: SourceAnalysis[] = [...sourceMap.entries()].map(([source, items]) => {
    const sourceAccepted = items.filter((r) => r.status === "accepted" || r.status === "placed").length;
    const sourceDeclined = items.filter((r) => r.status === "declined").length;
    const sourceDecided = items.filter((r) => DECIDED_STATUSES.includes(r.status) && r.decision_date);
    const sourceDays = sourceDecided.map((r) => daysBetween(r.referral_date, r.decision_date!));

    return {
      source,
      count: items.length,
      accepted: sourceAccepted,
      declined: sourceDeclined,
      avg_days_to_decision: meanOf(sourceDays),
    };
  });

  // ── Decision Analysis ─────────────────────────────────────────────────
  const totalDecisions = accepted + declined + withdrawn;
  const decisionsWithoutIA = referrals
    .filter((r) => DECIDED_STATUSES.includes(r.status) && !r.impact_assessment_complete)
    .length;

  const decision_analysis: DecisionAnalysis = {
    total_decisions: totalDecisions,
    acceptance_rate: rate(accepted, totalDecisions),
    decline_rate: rate(declined, totalDecisions),
    withdrawal_rate: rate(withdrawn, totalDecisions),
    avg_days_to_decision: avgDaysToDecision,
    decisions_without_impact_assessment: decisionsWithoutIA,
  };

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: AdmissionAlert[] = [];

  // Critical: emergency referrals without IA
  const emergencyWithoutIA = active.filter(
    (r) => r.referral_source === "emergency" && !r.impact_assessment_complete && r.status !== "new",
  );
  for (const r of emergencyWithoutIA) {
    alerts.push({
      severity: "critical",
      message: `Emergency referral for ${r.child_name} (age ${r.age}) — impact assessment not yet complete. Reg 12 requires assessment before admission.`,
    });
  }

  // Critical: at full capacity with accepted referrals
  if (availableBeds === 0 && accepted > 0) {
    alerts.push({
      severity: "critical",
      message: `Home at full capacity (${current_occupancy}/${max_occupancy}) with ${accepted} accepted referral${accepted > 1 ? "s" : ""} awaiting placement. Review placement timeline urgently.`,
    });
  }

  // High: referrals open > 14 days without decision
  const longOpenActive = active.filter((r) => {
    const daysOpen = r.days_open ?? daysBetween(r.referral_date, today);
    return daysOpen > 14 && r.status !== "accepted" && r.status !== "new";
  });
  if (longOpenActive.length > 0) {
    alerts.push({
      severity: "high",
      message: `${longOpenActive.length} referral${longOpenActive.length > 1 ? "s" : ""} open more than 14 days without final decision. Timely decision-making supports placement stability and the child's wellbeing.`,
    });
  }

  // Medium: accepted decisions made without IA
  if (decisionsWithoutIA > 0) {
    alerts.push({
      severity: "medium",
      message: `${decisionsWithoutIA} admission decision${decisionsWithoutIA > 1 ? "s" : ""} made without a completed impact assessment. Reg 12 compliance requires documented IA before all admissions.`,
    });
  }

  // Medium: high-risk referrals needing panel review
  const highRiskPending = active.filter(
    (r) => r.risk_factors.length >= 3 && r.status !== "accepted" && r.status !== "panel",
  );
  if (highRiskPending.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${highRiskPending.length} referral${highRiskPending.length > 1 ? "s" : ""} with 3+ risk factors not yet at panel stage. Complex referrals benefit from multi-disciplinary panel review.`,
    });
  }

  // Low: new referrals awaiting initial review
  if (newCount > 0) {
    alerts.push({
      severity: "low",
      message: `${newCount} new referral${newCount > 1 ? "s" : ""} awaiting initial review. Acknowledge receipt within 24 hours and commence assessment within 48 hours.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraAdmissionInsight[] = [];

  // Critical: no beds but active pipeline
  if (availableBeds === 0 && active.length > 0) {
    insights.push({
      severity: "critical",
      text: `Home at full capacity with ${active.length} active referral${active.length > 1 ? "s" : ""} in the pipeline. Ofsted expects homes to manage occupancy proactively. Consider whether accepted referrals need timeline review or alternative provision signposting.`,
    });
  }

  // Warning: impact assessment gaps
  if (below(iaRate, 100) && pastNewStage.length >= 2) {
    insights.push({
      severity: "warning",
      text: `Impact assessment completion rate is ${formatRate(iaRate)}. Reg 12 requires a documented impact assessment demonstrating how each new admission will interact with existing children. Incomplete IAs are a common Ofsted shortfall.`,
    });
  }

  // Warning: slow decision-making
  if (avgDaysToDecision !== null && avgDaysToDecision > 14 && decided.length >= 2) {
    insights.push({
      severity: "warning",
      text: `Average time to decision is ${avgDaysToDecision} days. While thorough assessment is essential, children waiting for placement decisions experience uncertainty. Review whether process bottlenecks can be addressed.`,
    });
  }

  // Warning: high decline rate
  if (meets(decision_analysis.decline_rate, 61) && totalDecisions >= 3) {
    insights.push({
      severity: "warning",
      text: `Decline rate is ${formatRate(decision_analysis.decline_rate)} (${declined} of ${totalDecisions}). A high decline rate may indicate referrals don't match the Statement of Purpose, or that the matching criteria need review with commissioners.`,
    });
  }

  // Positive: good IA compliance
  if (meets(iaRate, 100) && pastNewStage.length >= 2) {
    insights.push({
      severity: "positive",
      text: `100% impact assessment completion for all referrals past initial stage. Strong Reg 12 compliance — demonstrating robust matching and safeguarding before any admission decision.`,
    });
  }

  // Positive: timely decisions
  if (avgDaysToDecision !== null && avgDaysToDecision <= 14 && decided.length >= 2) {
    insights.push({
      severity: "positive",
      text: `Average decision time is ${avgDaysToDecision} days — within 14-day best practice. Timely decisions reduce uncertainty for children and demonstrate efficient management systems.`,
    });
  }

  // Positive: good bed availability
  if (availableBeds > 0 && active.length > 0) {
    insights.push({
      severity: "positive",
      text: `${availableBeds} bed${availableBeds > 1 ? "s" : ""} available with ${active.length} referral${active.length > 1 ? "s" : ""} in pipeline. Capacity exists to accept well-matched placements without compromising existing children's stability.`,
    });
  }

  return {
    overview,
    referral_profiles,
    source_analysis,
    decision_analysis,
    alerts,
    insights,
  };
}
