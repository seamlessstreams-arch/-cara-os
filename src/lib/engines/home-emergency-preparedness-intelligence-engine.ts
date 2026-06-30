// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EMERGENCY PREPAREDNESS INTELLIGENCE ENGINE
// Home-level: analyses emergency plans, protocol drills, and home policies to
// assess readiness for emergencies, policy compliance, drill coverage, and
// staff acknowledgement rates.
// CHR 2015 Reg 25, 22. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PolicyInput {
  id: string;
  title: string;
  status: string;                    // current | overdue | review_due | draft | archived
  next_review_date: string;
  read_acknowledgement_count: number;
  total_staff_required: number;
  has_statutory_basis: boolean;
}

export interface DrillInput {
  id: string;
  date: string;
  scenario_type: string;
  outcome: string;                   // satisfactory | needs_improvement | failed | not_completed
  protocol_followed: boolean;
  has_actions_required: boolean;
  response_time_minutes: number;
  participant_count: number;
  next_drill_due: string;
}

export interface EmergencyPlanInput {
  id: string;
  title: string;
  status: string;                    // current | review_due | archived | draft
  last_tested: string;
  next_test: string;
  has_child_considerations: boolean;
  has_staff_roles: boolean;
  has_contact_sequence: boolean;
}

export interface HomeEmergencyInput {
  today: string;
  total_staff: number;
  policies: PolicyInput[];
  drills: DrillInput[];
  emergency_plans: EmergencyPlanInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EmergencyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PolicyComplianceProfile {
  total_policies: number;
  current_count: number;
  overdue_count: number;
  review_due_count: number;
  avg_acknowledgement_rate: number;
  full_acknowledgement_count: number;
}

export interface DrillReadinessProfile {
  total_drills_12m: number;
  satisfactory_rate: number;
  protocol_followed_rate: number;
  drills_overdue: number;
  unique_scenario_types: number;
  avg_response_time: number;
}

export interface PlanCoverageProfile {
  total_plans: number;
  current_count: number;
  review_due_count: number;
  plans_with_child_considerations: number;
  plans_with_staff_roles: number;
  plans_tested_in_90d: number;
}

export interface EmergencyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EmergencyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeEmergencyResult {
  emergency_rating: EmergencyRating;
  emergency_score: number;
  headline: string;
  policy_compliance: PolicyComplianceProfile;
  drill_readiness: DrillReadinessProfile;
  plan_coverage: PlanCoverageProfile;
  strengths: string[];
  concerns: string[];
  recommendations: EmergencyRecommendation[];
  insights: EmergencyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EmergencyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeEmergencyPreparedness(
  input: HomeEmergencyInput,
): HomeEmergencyResult {
  const { today, total_staff, policies, drills, emergency_plans } = input;

  // Insufficient data: no policies AND no drills AND no emergency plans
  if (policies.length === 0 && drills.length === 0 && emergency_plans.length === 0) {
    return {
      emergency_rating: "insufficient_data",
      emergency_score: 0,
      headline: "No emergency preparedness data available.",
      policy_compliance: emptyPolicyProfile(),
      drill_readiness: emptyDrillProfile(),
      plan_coverage: emptyPlanProfile(),
      strengths: [],
      concerns: ["No policies, drills, or emergency plans found."],
      recommendations: [{ rank: 1, recommendation: "Establish emergency plans, policies, and a drill schedule — Reg 25 requires homes to be prepared for emergencies.", urgency: "immediate", regulatory_ref: "Reg 25" }],
      insights: [{ text: "No emergency preparedness data exists. Ofsted expects comprehensive emergency plans, regularly tested through drills, with current policies acknowledged by all staff.", severity: "critical" }],
    };
  }

  // ── Policy Compliance Profile ──────────────────────────────────────
  const currentPolicies = policies.filter(p => p.status === "current").length;
  const overduePolicies = policies.filter(p => p.status === "overdue" || (p.next_review_date && p.next_review_date < today && p.status !== "archived")).length;
  const reviewDuePolicies = policies.filter(p => p.status === "review_due").length;

  const ackRates = policies
    .filter(p => p.total_staff_required > 0)
    .map(p => pct(p.read_acknowledgement_count, p.total_staff_required));
  const avgAckRate = ackRates.length > 0
    ? Math.round(ackRates.reduce((a, b) => a + b, 0) / ackRates.length)
    : 0;
  const fullAckCount = ackRates.filter(r => r >= 100).length;

  const policyProfile: PolicyComplianceProfile = {
    total_policies: policies.length,
    current_count: currentPolicies,
    overdue_count: overduePolicies,
    review_due_count: reviewDuePolicies,
    avg_acknowledgement_rate: avgAckRate,
    full_acknowledgement_count: fullAckCount,
  };

  // ── Drill Readiness Profile ────────────────────────────────────────
  // 12-month window for drills
  const cutoff12m = new Date(today);
  cutoff12m.setDate(cutoff12m.getDate() - 365);
  const cutoff12mStr = cutoff12m.toISOString().slice(0, 10);
  const recentDrills = drills.filter(d => d.date >= cutoff12mStr && d.date <= today);

  const satisfactory = recentDrills.filter(d => d.outcome === "satisfactory").length;
  const satisfactoryRate = pct(satisfactory, recentDrills.length);

  const protocolFollowed = recentDrills.filter(d => d.protocol_followed).length;
  const protocolRate = pct(protocolFollowed, recentDrills.length);

  const overdueDrills = drills.filter(d => d.next_drill_due < today).length;

  const uniqueScenarios = new Set(recentDrills.map(d => d.scenario_type)).size;

  const responseTimes = recentDrills.map(d => d.response_time_minutes);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
    : 0;

  const drillProfile: DrillReadinessProfile = {
    total_drills_12m: recentDrills.length,
    satisfactory_rate: satisfactoryRate,
    protocol_followed_rate: protocolRate,
    drills_overdue: overdueDrills,
    unique_scenario_types: uniqueScenarios,
    avg_response_time: avgResponseTime,
  };

  // ── Plan Coverage Profile ──────────────────────────────────────────
  const currentPlans = emergency_plans.filter(p => p.status === "current").length;
  const reviewDuePlans = emergency_plans.filter(p => p.status === "review_due" || (p.next_test < today && p.status !== "archived")).length;
  const withChildConsiderations = emergency_plans.filter(p => p.has_child_considerations).length;
  const withStaffRoles = emergency_plans.filter(p => p.has_staff_roles).length;

  const cutoff90 = new Date(today);
  cutoff90.setDate(cutoff90.getDate() - 90);
  const cutoff90Str = cutoff90.toISOString().slice(0, 10);
  const testedIn90d = emergency_plans.filter(p => p.last_tested >= cutoff90Str && p.last_tested.slice(0, 10) <= today).length;

  const planProfile: PlanCoverageProfile = {
    total_plans: emergency_plans.length,
    current_count: currentPlans,
    review_due_count: reviewDuePlans,
    plans_with_child_considerations: withChildConsiderations,
    plans_with_staff_roles: withStaffRoles,
    plans_tested_in_90d: testedIn90d,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, max bonuses = 30, 52+30 = 82 (outstanding reachable)
  let score = 52;

  // 1. Policy overdue rate (±5)
  const policyOverdueRate = pct(overduePolicies, policies.length);
  if (policies.length > 0) {
    if (policyOverdueRate === 0) score += 5;
    else if (policyOverdueRate <= 20) score += 2;
    else score -= 4;
  }

  // 2. Staff acknowledgement rate (±4)
  if (policies.length > 0) {
    if (avgAckRate >= 90) score += 4;
    else if (avgAckRate >= 70) score += 2;
    else score -= 3;
  }

  // 3. Drill frequency — at least 4 drills per year (±4)
  if (recentDrills.length >= 6) score += 4;
  else if (recentDrills.length >= 4) score += 2;
  else if (recentDrills.length >= 2) score += 0;
  else score -= 3;

  // 4. Drill satisfactory rate (±3)
  if (recentDrills.length > 0) {
    if (satisfactoryRate >= 80) score += 3;
    else if (satisfactoryRate >= 60) score += 1;
    else score -= 2;
  }

  // 5. Protocol followed rate (±3)
  if (recentDrills.length > 0) {
    if (protocolRate >= 90) score += 3;
    else if (protocolRate >= 70) score += 1;
    else score -= 2;
  }

  // 6. Overdue drills (±3)
  if (overdueDrills === 0) score += 3;
  else if (overdueDrills <= 1) score += 1;
  else score -= 2;

  // 7. Emergency plan coverage (±3)
  if (emergency_plans.length >= 3) score += 3;
  else if (emergency_plans.length >= 2) score += 1;
  else if (emergency_plans.length === 0) score -= 2;

  // 8. Child considerations in plans (±3)
  const childConsRate = pct(withChildConsiderations, emergency_plans.length);
  if (emergency_plans.length > 0) {
    if (childConsRate >= 80) score += 3;
    else if (childConsRate >= 50) score += 1;
    else score -= 2;
  }

  // 9. Drill scenario diversity (±2)
  if (uniqueScenarios >= 4) score += 2;
  else if (uniqueScenarios >= 2) score += 1;
  else score += 0;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (policyOverdueRate === 0 && policies.length > 0) strengths.push(`All ${policies.length} policies are current — demonstrating proactive governance.`);
  if (avgAckRate >= 90 && policies.length > 0) strengths.push(`${avgAckRate}% average staff acknowledgement rate — all staff are informed of current policies.`);
  if (recentDrills.length >= 6) strengths.push(`${recentDrills.length} drills completed in 12 months — comprehensive emergency readiness programme.`);
  if (satisfactoryRate >= 80 && recentDrills.length > 0) strengths.push(`${satisfactoryRate}% of drills rated satisfactory — staff respond well to emergencies.`);
  if (protocolRate >= 90 && recentDrills.length > 0) strengths.push(`Protocol followed in ${protocolRate}% of drills — procedures are embedded.`);
  if (overdueDrills === 0 && drills.length > 0) strengths.push("No overdue drills — emergency testing schedule is on track.");
  if (childConsRate >= 80 && emergency_plans.length > 0) strengths.push(`${withChildConsiderations}/${emergency_plans.length} emergency plans include child-specific considerations — child-centred safety planning.`);
  if (uniqueScenarios >= 4) strengths.push(`${uniqueScenarios} different scenario types drilled — comprehensive threat coverage.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (overduePolicies > 0) concerns.push(`${overduePolicies} polic${overduePolicies > 1 ? "ies" : "y"} overdue for review — Ofsted expects all policies to be current.`);
  if (avgAckRate < 70 && policies.length > 0) concerns.push(`Average staff acknowledgement rate at ${avgAckRate}% — policies must be read and understood by all staff.`);
  if (recentDrills.length < 4 && recentDrills.length > 0) concerns.push(`Only ${recentDrills.length} drill${recentDrills.length === 1 ? "" : "s"} completed in 12 months — Ofsted expects regular, varied emergency drills.`);
  if (overdueDrills > 0) concerns.push(`${overdueDrills} drill${overdueDrills > 1 ? "s" : ""} overdue — emergency rehearsal schedule is behind.`);
  if (satisfactoryRate < 60 && recentDrills.length > 0) concerns.push(`Only ${satisfactoryRate}% of drills rated satisfactory — staff may not respond effectively in a real emergency.`);
  if (emergency_plans.length < 2) concerns.push("Fewer than 2 emergency plans — homes should have plans for fire, power failure, flooding, and serious incidents at minimum.");
  if (childConsRate < 50 && emergency_plans.length > 0) concerns.push("Fewer than half of emergency plans include child-specific considerations — each child's needs must be addressed.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: EmergencyRecommendation[] = [];
  let rank = 1;

  if (overduePolicies > 0) {
    recs.push({ rank: rank++, recommendation: `Review and update ${overduePolicies} overdue polic${overduePolicies > 1 ? "ies" : "y"} immediately.`, urgency: "immediate", regulatory_ref: "Reg 22" });
  }
  if (overdueDrills > 0) {
    recs.push({ rank: rank++, recommendation: `Schedule and complete ${overdueDrills} overdue drill${overdueDrills > 1 ? "s" : ""}.`, urgency: "immediate", regulatory_ref: "Reg 25" });
  }
  if (avgAckRate < 70 && policies.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure all staff read and acknowledge current policies — arrange policy briefings.", urgency: "soon", regulatory_ref: "Reg 22" });
  }
  if (recentDrills.length < 4) {
    recs.push({ rank: rank++, recommendation: "Increase drill frequency to at least quarterly — cover fire, medical, missing, and security scenarios.", urgency: "soon", regulatory_ref: "Reg 25" });
  }
  if (childConsRate < 50 && emergency_plans.length > 0) {
    recs.push({ rank: rank++, recommendation: "Add child-specific considerations to all emergency plans — address individual needs and vulnerabilities.", urgency: "planned", regulatory_ref: "Reg 25" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: EmergencyInsight[] = [];

  if (overduePolicies >= 2) {
    insights.push({ text: `${overduePolicies} policies overdue for review. Ofsted inspectors routinely check policy review dates — overdue policies suggest governance gaps and may contribute to a "requires improvement" judgement for leadership.`, severity: "critical" });
  }
  if (satisfactoryRate >= 80 && recentDrills.length >= 4 && overdueDrills === 0) {
    insights.push({ text: `${recentDrills.length} drills completed with ${satisfactoryRate}% satisfactory outcomes and no overdue rehearsals. This demonstrates a proactive, well-embedded emergency culture — a key indicator of outstanding safety practice that inspectors actively look for.`, severity: "positive" });
  }
  if (overdueDrills >= 2) {
    insights.push({ text: `${overdueDrills} drills overdue. Ofsted expects regular emergency rehearsals to ensure staff can respond effectively. Overdue drills suggest the home may not be adequately prepared for emergencies — this is a Reg 25 concern.`, severity: "warning" });
  }
  if (avgAckRate >= 90 && policyOverdueRate === 0 && policies.length >= 5) {
    insights.push({ text: `All ${policies.length} policies current with ${avgAckRate}% staff acknowledgement rate. This evidences outstanding governance — all staff are informed, policies are reviewed on schedule, and the home operates within a clear regulatory framework.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding emergency preparedness — ${recentDrills.length} drills, all policies current, ${avgAckRate}% staff acknowledgement.`;
  } else if (rating === "good") {
    headline = `Good emergency preparedness — solid drill programme with ${satisfactoryRate}% satisfactory outcomes.`;
  } else if (rating === "adequate") {
    headline = "Adequate emergency preparedness — gaps in policy reviews, drill frequency, or staff acknowledgement need addressing.";
  } else {
    headline = "Emergency preparedness is inadequate — significant gaps in policies, drills, or emergency plans.";
  }

  return {
    emergency_rating: rating,
    emergency_score: score,
    headline,
    policy_compliance: policyProfile,
    drill_readiness: drillProfile,
    plan_coverage: planProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyPolicyProfile(): PolicyComplianceProfile {
  return {
    total_policies: 0, current_count: 0, overdue_count: 0,
    review_due_count: 0, avg_acknowledgement_rate: 0,
    full_acknowledgement_count: 0,
  };
}

function emptyDrillProfile(): DrillReadinessProfile {
  return {
    total_drills_12m: 0, satisfactory_rate: 0,
    protocol_followed_rate: 0, drills_overdue: 0,
    unique_scenario_types: 0, avg_response_time: 0,
  };
}

function emptyPlanProfile(): PlanCoverageProfile {
  return {
    total_plans: 0, current_count: 0, review_due_count: 0,
    plans_with_child_considerations: 0, plans_with_staff_roles: 0,
    plans_tested_in_90d: 0,
  };
}
