// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STRATEGIC RISK INTELLIGENCE ENGINE
// Daily risk briefings, risk register, strategic risk, management plans, appetite.
// Pure deterministic engine. CHR 2015 Reg 35/40.
// ══════════════════════════════════════════════════════════════════════════════

export interface DailyRiskBriefingInput {
  id: string; date: string; shift_type: string;
  child_risks_count: number; home_alerts_count: number;
  staff_on_shift_count: number;
}

export interface RiskRegisterEntryInput {
  id: string; risk_level: string; // "critical" | "high" | "medium" | "low"
  status: string; // "active" | "mitigated" | "monitoring" | "closed" | "escalated"
  mitigations_count: number; review_date: string;
  last_reviewed: string;
}

export interface StrategicRiskInput {
  id: string; category: string;
  current_likelihood: number; current_impact: number;
  residual_risk_score: number | null; target_risk_score: number | null;
  controls_count: number; additional_controls_needed: number;
  last_reviewed: string; next_review_date: string;
  board_level: boolean; trend: string; // "improving" | "stable" | "worsening"
}

export interface RiskManagementPlanInput {
  id: string; child_id: string; risk_category: string;
  current_risk_level: string; // "critical" | "high" | "medium" | "low"
  strategies_count: number; triggers_count: number;
  protective_factors_count: number;
  review_date: string; last_reviewed: string;
  status: string; // "active" | "under_review" | "archived" | "draft"
  child_views_present: boolean;
}

export interface RiskAppetiteInput {
  id: string; name: string; appetite_level: string;
  red_lines_count: number; examples_count: number;
}

export interface HomeStrategicRiskInput {
  today: string;
  daily_risk_briefings: DailyRiskBriefingInput[];
  risk_register_entries: RiskRegisterEntryInput[];
  strategic_risks: StrategicRiskInput[];
  risk_management_plans: RiskManagementPlanInput[];
  risk_appetite_domains: RiskAppetiteInput[];
  total_children: number;
  total_staff: number;
}

export type StrategicRiskRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface BriefingSummary { total: number; recent_7_days: number; avg_child_risks: number; coverage_rate: number | null; }
export interface RegisterSummary { total: number; critical_count: number; high_count: number; overdue_reviews: number; mitigated_rate: number | null; }
export interface StrategicSummary { total: number; board_level_count: number; worsening_count: number; above_target_count: number; }
export interface PlanSummary { total: number; active_rate: number | null; child_views_rate: number | null; overdue_reviews: number; }
export interface AppetiteSummary { total: number; domains_with_red_lines: number; }

export interface HomeStrategicRiskResult {
  strategic_risk_rating: StrategicRiskRating; strategic_risk_score: number | null; headline: string;
  briefings: BriefingSummary; register: RegisterSummary; strategic: StrategicSummary;
  plans: PlanSummary; appetite: AppetiteSummary;
  strengths: string[]; concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }
function daysBetween(a: string, b: string): number { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000); }

export function computeHomeStrategicRisk(input: HomeStrategicRiskInput): HomeStrategicRiskResult {
  const { today, daily_risk_briefings, risk_register_entries, strategic_risks, risk_management_plans, risk_appetite_domains, total_children, total_staff } = input;

  if (total_children === 0 && daily_risk_briefings.length === 0 && risk_register_entries.length === 0 && strategic_risks.length === 0 && risk_management_plans.length === 0 && risk_appetite_domains.length === 0) {
    return {
      strategic_risk_rating: "insufficient_data", strategic_risk_score: 0,
      headline: "No strategic risk data available for analysis.",
      briefings: { total: 0, recent_7_days: 0, avg_child_risks: 0, coverage_rate: 0 },
      register: { total: 0, critical_count: 0, high_count: 0, overdue_reviews: 0, mitigated_rate: 0 },
      strategic: { total: 0, board_level_count: 0, worsening_count: 0, above_target_count: 0 },
      plans: { total: 0, active_rate: 0, child_views_rate: 0, overdue_reviews: 0 },
      appetite: { total: 0, domains_with_red_lines: 0 },
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Summaries ────────────────────────────────────────────────────────────
  const recent7 = daily_risk_briefings.filter(b => b.date && daysBetween(b.date, today) <= 7 && daysBetween(b.date, today) >= 0).length;
  const avgChildRisks = daily_risk_briefings.length > 0 ? Math.round(daily_risk_briefings.reduce((s, b) => s + b.child_risks_count, 0) / daily_risk_briefings.length) : null;
  // Coverage: assume 2 briefings per day (day + night) for 7 days = 14 expected
  const coverageRate = pct(recent7, 14);
  const briefings: BriefingSummary = { total: daily_risk_briefings.length, recent_7_days: recent7, avg_child_risks: avgChildRisks, coverage_rate: coverageRate };

  const critCount = risk_register_entries.filter(r => r.risk_level === "critical").length;
  const highCount = risk_register_entries.filter(r => r.risk_level === "high").length;
  const regOverdue = risk_register_entries.filter(r => r.review_date && daysBetween(r.review_date, today) > 0).length;
  const regMitigated = risk_register_entries.filter(r => r.status === "mitigated" || r.status === "closed").length;
  const register: RegisterSummary = {
    total: risk_register_entries.length,
    critical_count: critCount, high_count: highCount,
    overdue_reviews: regOverdue,
    mitigated_rate: pct(regMitigated, risk_register_entries.length),
  };

  const boardLevel = strategic_risks.filter(s => s.board_level).length;
  const worsening = strategic_risks.filter(s => s.trend === "worsening").length;
  const aboveTarget = strategic_risks.filter(s => (s.residual_risk_score ?? 0) > (s.target_risk_score ?? 0)).length;
  const strategic: StrategicSummary = { total: strategic_risks.length, board_level_count: boardLevel, worsening_count: worsening, above_target_count: aboveTarget };

  const planActive = risk_management_plans.filter(p => p.status === "active").length;
  const planViews = risk_management_plans.filter(p => p.child_views_present).length;
  const planOverdue = risk_management_plans.filter(p => p.review_date && daysBetween(p.review_date, today) > 0).length;
  const plans: PlanSummary = {
    total: risk_management_plans.length,
    active_rate: pct(planActive, risk_management_plans.length),
    child_views_rate: pct(planViews, risk_management_plans.length),
    overdue_reviews: planOverdue,
  };

  const redLineDomains = risk_appetite_domains.filter(d => d.red_lines_count > 0).length;
  const appetite: AppetiteSummary = { total: risk_appetite_domains.length, domains_with_red_lines: redLineDomains };

  // ── Score: base 52 + 8 modifiers (max ±28) ──────────────────────────────
  let score = 52;

  // Mod 1: Daily risk briefing coverage (±5)
  let mod1 = 0;
  if (daily_risk_briefings.length > 0) {
    if ((briefings.coverage_rate ?? 0) >= 80) mod1 = 5;
    else if ((briefings.coverage_rate ?? 0) >= 50) mod1 = 3;
    else if ((briefings.coverage_rate ?? 0) >= 30) mod1 = 1;
    else if (briefings.coverage_rate === 0) mod1 = -5;
    else mod1 = -2;
  } else if (total_staff >= 3) {
    mod1 = -2;
  }
  score += mod1;

  // Mod 2: Risk register management (±4)
  let mod2 = 0;
  if (risk_register_entries.length > 0) {
    if (critCount === 0 && regOverdue === 0 && (register.mitigated_rate ?? 0) >= 50) mod2 = 4;
    else if (critCount <= 1 && regOverdue <= 2) mod2 = 2;
    else if (critCount <= 2) mod2 = 0;
    else if (critCount >= 4 || regOverdue >= 5) mod2 = -4;
    else mod2 = -2;
  } else if (total_children >= 2) {
    mod2 = -2;
  }
  score += mod2;

  // Mod 3: Strategic risk oversight (±3)
  let mod3 = 0;
  if (strategic_risks.length > 0) {
    if (worsening === 0 && aboveTarget <= 1) mod3 = 3;
    else if (worsening <= 1 && aboveTarget <= 2) mod3 = 1;
    else if (worsening >= 3) mod3 = -3;
    else if (worsening >= 2) mod3 = -1;
    else mod3 = 0;
  }
  // No strategic risks = neutral
  score += mod3;

  // Mod 4: Risk management plans (±4)
  let mod4 = 0;
  if (risk_management_plans.length > 0) {
    if ((plans.active_rate ?? 0) >= 80 && (plans.child_views_rate ?? 0) >= 80 && planOverdue === 0) mod4 = 4;
    else if ((plans.active_rate ?? 0) >= 60 && (plans.child_views_rate ?? 0) >= 60) mod4 = 2;
    else if ((plans.active_rate ?? 0) >= 40) mod4 = 0;
    else if ((plans.active_rate ?? 0) < 30 || planOverdue >= 5) mod4 = -4;
    else mod4 = -2;
  } else if (total_children >= 2) {
    mod4 = -1;
  }
  score += mod4;

  // Mod 5: Risk appetite framework (±3)
  let mod5 = 0;
  if (risk_appetite_domains.length > 0) {
    if (risk_appetite_domains.length >= 5 && redLineDomains >= 3) mod5 = 3;
    else if (risk_appetite_domains.length >= 3) mod5 = 1;
    else mod5 = 0;
  }
  // No appetite domains = neutral
  score += mod5;

  // Mod 6: Critical risk escalation (±3)
  let mod6 = 0;
  const escalated = risk_register_entries.filter(r => r.status === "escalated").length;
  const critActive = risk_register_entries.filter(r => r.risk_level === "critical" && r.status === "active").length;
  if (risk_register_entries.length > 0) {
    if (critActive === 0) mod6 = 3;
    else if (critActive <= 1 && escalated >= critActive) mod6 = 1;
    else if (critActive >= 3) mod6 = -3;
    else mod6 = -1;
  }
  score += mod6;

  // Mod 7: Child voice in risk management (±3)
  let mod7 = 0;
  if (risk_management_plans.length > 0) {
    if ((plans.child_views_rate ?? 0) >= 80) mod7 = 3;
    else if ((plans.child_views_rate ?? 0) >= 60) mod7 = 1;
    else if ((plans.child_views_rate ?? 0) < 30) mod7 = -3;
    else mod7 = 0;
  }
  score += mod7;

  // Mod 8: Review currency & documentation (±3)
  let mod8 = 0;
  const totalOverdue = regOverdue + planOverdue;
  const totalReviewable = risk_register_entries.length + risk_management_plans.length;
  if (totalReviewable > 0) {
    const overdueRate = pct(totalOverdue, totalReviewable);
    if (overdueRate === 0) mod8 = 3;
    else if (overdueRate <= 15) mod8 = 1;
    else if (overdueRate >= 50) mod8 = -3;
    else mod8 = -1;
  }
  score += mod8;

  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────────
  const strategic_risk_rating: StrategicRiskRating = score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if ((briefings.coverage_rate ?? 0) >= 80) strengths.push("Excellent daily risk briefing coverage — shifts consistently briefed on current risks.");
  if (critCount === 0 && risk_register_entries.length > 0) strengths.push("No critical risks on the register — effective risk mitigation strategy.");
  if (worsening === 0 && strategic_risks.length > 0) strengths.push("All strategic risks stable or improving — proactive risk governance.");
  if ((plans.child_views_rate ?? 0) >= 80 && risk_management_plans.length > 0) strengths.push("Child voice strongly represented in risk management plans.");
  if (risk_appetite_domains.length >= 5) strengths.push("Comprehensive risk appetite framework with clear domains and red lines.");
  if (mod8 >= 3) strengths.push("All risk reviews are current — no overdue assessments.");
  if (critActive === 0 && risk_register_entries.length > 0) strengths.push("No unresolved critical risks — all critical items have been escalated or mitigated.");
  if ((register.mitigated_rate ?? 0) >= 60) strengths.push("Strong risk resolution — over 60% of register entries are mitigated or closed.");

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (daily_risk_briefings.length === 0 && total_staff >= 3) concerns.push("No daily risk briefings recorded — staff may not be aware of current risks at shift handover.");
  if (critCount >= 3) concerns.push(`${critCount} critical risks on the register — these require urgent board-level attention.`);
  if (worsening >= 2) concerns.push(`${worsening} strategic risks are worsening — trend analysis shows deteriorating risk profile.`);
  if ((plans.child_views_rate ?? 0) < 30 && risk_management_plans.length > 0) concerns.push("Children's views are missing from most risk management plans — their perspective is essential.");
  if (planOverdue >= 3) concerns.push(`${planOverdue} risk management plans have overdue reviews — plans may not reflect current risk levels.`);
  if (regOverdue >= 5) concerns.push(`${regOverdue} risk register entries have overdue reviews — risk oversight is lapsing.`);
  if (risk_register_entries.length === 0 && total_children >= 2) concerns.push("No risk register in place — the home lacks a systematic approach to tracking risks.");
  if ((briefings.coverage_rate ?? 0) < 30 && daily_risk_briefings.length > 0) concerns.push("Risk briefing coverage is below 30% — significant gaps in shift-to-shift risk communication.");

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (critCount >= 3) recommendations.push({ rank: ++rank, recommendation: "Convene emergency risk review for all critical register entries.", urgency: "immediate", regulatory_ref: "Reg 35" });
  if (worsening >= 2) recommendations.push({ rank: ++rank, recommendation: "Conduct root cause analysis on worsening strategic risks and strengthen controls.", urgency: "immediate", regulatory_ref: "Reg 40" });
  if (daily_risk_briefings.length === 0 && total_staff >= 3) recommendations.push({ rank: ++rank, recommendation: "Implement daily risk briefings at every shift handover.", urgency: "soon", regulatory_ref: "Reg 35" });
  if ((plans.child_views_rate ?? 0) < 50 && risk_management_plans.length > 0) recommendations.push({ rank: ++rank, recommendation: "Ensure every risk management plan includes the child's views and feelings about the risks.", urgency: "soon", regulatory_ref: "Reg 35" });
  if (risk_appetite_domains.length === 0) recommendations.push({ rank: ++rank, recommendation: "Develop a risk appetite framework to guide proportionate risk-taking decisions.", urgency: "planned", regulatory_ref: "Reg 40" });
  if (totalOverdue >= 3) recommendations.push({ rank: ++rank, recommendation: `Complete ${totalOverdue} overdue risk reviews to ensure all assessments are current.`, urgency: "soon", regulatory_ref: "Reg 35" });
  if (risk_register_entries.length === 0 && total_children >= 2) recommendations.push({ rank: ++rank, recommendation: "Establish a risk register to systematically track and mitigate identified risks.", urgency: "soon", regulatory_ref: "Reg 35" });

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (strategic_risk_rating === "outstanding") insights.push({ text: "Strategic risk governance is outstanding — comprehensive oversight with proactive controls and strong child voice.", severity: "positive" });
  if (strategic_risk_rating === "inadequate") insights.push({ text: "Risk management falls below acceptable standards — the home may be exposed to unmitigated safeguarding and operational risks.", severity: "critical" });
  if (critCount >= 2 && worsening >= 1) insights.push({ text: "Multiple critical risks combined with worsening trends suggest systemic risk management failure requiring board intervention.", severity: "critical" });
  if ((briefings.coverage_rate ?? 0) >= 80 && (plans.child_views_rate ?? 0) >= 80) insights.push({ text: "Strong integration of daily briefings with child-centred risk plans — information flows effectively from strategy to frontline.", severity: "positive" });
  if ((register.mitigated_rate ?? 0) >= 70 && mod8 >= 3) insights.push({ text: "Risk register shows strong closure rates with current reviews — a mature risk management culture is evidenced.", severity: "positive" });

  // ── Headline ─────────────────────────────────────────────────────────────
  let headline = "";
  if (strategic_risk_rating === "outstanding") headline = "Outstanding strategic risk governance — proactive oversight and effective controls across all domains.";
  else if (strategic_risk_rating === "good") headline = "Good risk management with effective controls and mostly current reviews.";
  else if (strategic_risk_rating === "adequate") headline = "Adequate risk management — some gaps in briefings, reviews, or child voice need attention.";
  else headline = "Risk management needs urgent improvement — critical risks and governance gaps require immediate action.";

  return {
    strategic_risk_rating, strategic_risk_score: score, headline,
    briefings, register, strategic, plans, appetite,
    strengths, concerns, recommendations, insights,
  };
}
