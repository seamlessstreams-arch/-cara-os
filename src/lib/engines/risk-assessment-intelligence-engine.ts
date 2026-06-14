// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ASSESSMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses risk levels, trends, review compliance, mitigation effectiveness,
// child voice presence, and domain-level risk intelligence.
//
// Regulatory: Reg 12 (Health & safety — risk assessments),
// Reg 34 (Missing children — risk management), Reg 11 (Positive relationships),
// SCCIF: Safety domain — "Are risks assessed and managed effectively?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type RiskLevel = "very_high" | "high" | "medium" | "low" | "minimal";
export type RiskTrend = "increasing" | "stable" | "decreasing";
export type RiskStatus = "current" | "closed" | "under_review";
export type MitigationEffectiveness = "effective" | "partially_effective" | "ineffective" | "not_assessed";

export interface MitigationInput {
  strategy: string;
  responsible: string;
  effectiveness: MitigationEffectiveness;
}

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  domain: string; // aggression, absconding, self_harm, exploitation, etc.
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: RiskTrend;
  status: RiskStatus;
  assessed_date: string;
  review_date: string;
  mitigations: MitigationInput[];
  has_child_views: boolean;
  has_contingency_plan: boolean;
  linked_incidents_count: number;
}

export interface ChildInput {
  id: string;
  name: string;
}

export interface RiskAssessmentIntelligenceInput {
  children: ChildInput[];
  assessments: RiskAssessmentInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface RiskOverview {
  total_current_assessments: number;
  very_high_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  increasing_count: number;
  decreasing_count: number;
  overdue_review_count: number;
  child_voice_rate: number;        // 0-100
  contingency_plan_rate: number;   // 0-100
  mitigation_effectiveness_rate: number; // 0-100 (pct effective)
}

export interface ChildRiskProfile {
  child_id: string;
  child_name: string;
  active_assessments: number;
  highest_level: RiskLevel;
  domains: string[];
  increasing_risks: number;
  overdue_reviews: number;
  child_voice_present: boolean;
}

export interface DomainAnalysis {
  domain: string;
  count: number;
  avg_level_score: number; // 1-5 (minimal to very_high)
  increasing: number;
  decreasing: number;
  mitigation_effective_rate: number;
}

export interface RiskAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraRiskInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface RiskAssessmentIntelligenceResult {
  overview: RiskOverview;
  child_profiles: ChildRiskProfile[];
  domain_analysis: DomainAnalysis[];
  alerts: RiskAlert[];
  insights: CaraRiskInsight[];
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

const LEVEL_SCORES: Record<RiskLevel, number> = {
  minimal: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5,
};

const LEVEL_ORDER: RiskLevel[] = ["minimal", "low", "medium", "high", "very_high"];

export function highestLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.length === 0) return "minimal";
  let best = 0;
  for (const l of levels) {
    const score = LEVEL_SCORES[l];
    if (score > best) best = score;
  }
  return LEVEL_ORDER[best - 1];
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeRiskAssessmentIntelligence(input: RiskAssessmentIntelligenceInput): RiskAssessmentIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, assessments } = input;

  const current = assessments.filter((a) => a.status === "current");

  // ── Overview ──────────────────────────────────────────────────────────
  const veryHigh = current.filter((a) => a.current_level === "very_high").length;
  const high = current.filter((a) => a.current_level === "high").length;
  const medium = current.filter((a) => a.current_level === "medium").length;
  const low = current.filter((a) => a.current_level === "low" || a.current_level === "minimal").length;

  const increasing = current.filter((a) => a.trend === "increasing").length;
  const decreasing = current.filter((a) => a.trend === "decreasing").length;

  const overdueReviews = current.filter((a) => daysUntil(today, a.review_date) < 0).length;

  const withChildViews = current.filter((a) => a.has_child_views).length;
  const withContingency = current.filter((a) => a.has_contingency_plan).length;

  // Mitigation effectiveness
  const allMitigations = current.flatMap((a) => a.mitigations);
  const effectiveMitigations = allMitigations.filter((m) => m.effectiveness === "effective").length;

  const overview: RiskOverview = {
    total_current_assessments: current.length,
    very_high_count: veryHigh,
    high_count: high,
    medium_count: medium,
    low_count: low,
    increasing_count: increasing,
    decreasing_count: decreasing,
    overdue_review_count: overdueReviews,
    child_voice_rate: current.length > 0 ? Math.round((withChildViews / current.length) * 100) : 100,
    contingency_plan_rate: current.length > 0 ? Math.round((withContingency / current.length) * 100) : 100,
    mitigation_effectiveness_rate: allMitigations.length > 0
      ? Math.round((effectiveMitigations / allMitigations.length) * 100)
      : 100,
  };

  // ── Child Profiles ────────────────────────────────────────────────────
  const child_profiles: ChildRiskProfile[] = children
    .filter((c) => current.some((a) => a.child_id === c.id))
    .map((child) => {
      const childAssessments = current.filter((a) => a.child_id === child.id);
      const levels = childAssessments.map((a) => a.current_level);
      const domains = [...new Set(childAssessments.map((a) => a.domain))];
      const increasingRisks = childAssessments.filter((a) => a.trend === "increasing").length;
      const overdueChildReviews = childAssessments.filter((a) => daysUntil(today, a.review_date) < 0).length;
      const hasVoice = childAssessments.some((a) => a.has_child_views);

      return {
        child_id: child.id,
        child_name: child.name,
        active_assessments: childAssessments.length,
        highest_level: highestLevel(levels),
        domains,
        increasing_risks: increasingRisks,
        overdue_reviews: overdueChildReviews,
        child_voice_present: hasVoice,
      };
    });

  // ── Domain Analysis ───────────────────────────────────────────────────
  const domainMap = new Map<string, RiskAssessmentInput[]>();
  for (const a of current) {
    const existing = domainMap.get(a.domain) ?? [];
    existing.push(a);
    domainMap.set(a.domain, existing);
  }

  const domain_analysis: DomainAnalysis[] = [...domainMap.entries()]
    .map(([domain, items]) => {
      const scores = items.map((a) => LEVEL_SCORES[a.current_level]);
      const mitigations = items.flatMap((a) => a.mitigations);
      const effective = mitigations.filter((m) => m.effectiveness === "effective").length;

      return {
        domain,
        count: items.length,
        avg_level_score: Math.round(average(scores) * 10) / 10,
        increasing: items.filter((a) => a.trend === "increasing").length,
        decreasing: items.filter((a) => a.trend === "decreasing").length,
        mitigation_effective_rate: mitigations.length > 0 ? Math.round((effective / mitigations.length) * 100) : 100,
      };
    })
    .sort((a, b) => b.avg_level_score - a.avg_level_score);

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: RiskAlert[] = [];

  // Critical: very_high or increasing high risk
  for (const profile of child_profiles) {
    if (profile.highest_level === "very_high") {
      alerts.push({
        severity: "critical",
        message: `${profile.child_name} has a very high risk assessment — immediate multi-agency review required`,
      });
    }
  }

  const increasingHigh = current.filter(
    (a) => a.trend === "increasing" && (a.current_level === "high" || a.current_level === "very_high"),
  );
  for (const a of increasingHigh) {
    const childName = children.find((c) => c.id === a.child_id)?.name ?? "Unknown";
    alerts.push({
      severity: "critical",
      message: `${childName}'s ${a.domain} risk is increasing at ${a.current_level} level — escalate to social worker and review placement stability`,
    });
  }

  // High: overdue reviews
  if (overdueReviews > 0) {
    alerts.push({
      severity: "high",
      message: `${overdueReviews} risk assessment review${overdueReviews > 1 ? "s" : ""} overdue — assessments must be reviewed at scheduled intervals`,
    });
  }

  // Medium: ineffective mitigations
  const ineffective = allMitigations.filter((m) => m.effectiveness === "ineffective");
  if (ineffective.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${ineffective.length} mitigation strateg${ineffective.length > 1 ? "ies" : "y"} rated as ineffective — review and replace with evidence-based alternatives`,
    });
  }

  // Medium: missing child views
  const missingViews = current.filter((a) => !a.has_child_views);
  if (missingViews.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${missingViews.length} assessment${missingViews.length > 1 ? "s" : ""} without child's views — Reg 7 requires the child's voice in all care planning`,
    });
  }

  // Low: reviews due soon (within 7 days)
  const dueSoon = current.filter((a) => {
    const days = daysUntil(today, a.review_date);
    return days >= 0 && days <= 7;
  });
  if (dueSoon.length > 0) {
    alerts.push({
      severity: "low",
      message: `${dueSoon.length} risk assessment review${dueSoon.length > 1 ? "s" : ""} due within 7 days — prepare updated evidence`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraRiskInsight[] = [];

  // Critical: very_high risk present
  if (veryHigh > 0) {
    insights.push({
      severity: "critical",
      text: `${veryHigh} risk assessment${veryHigh > 1 ? "s" : ""} at very high level. Ofsted will scrutinise whether additional protective measures, multi-agency support, and senior management oversight are in place. Ensure daily monitoring and strategy meetings are documented.`,
    });
  }

  // Warning: increasing trends
  if (increasing > 0) {
    const names = child_profiles
      .filter((p) => p.increasing_risks > 0)
      .map((p) => p.child_name)
      .join(", ");
    insights.push({
      severity: "warning",
      text: `${increasing} risk${increasing > 1 ? "s" : ""} showing an increasing trend (${names}). Review whether current mitigations are sufficient, whether triggers have changed, and whether additional professional input is needed.`,
    });
  }

  // Warning: overdue reviews
  if (overdueReviews > 0) {
    insights.push({
      severity: "warning",
      text: `${overdueReviews} risk assessment review${overdueReviews > 1 ? "s" : ""} overdue. Outdated assessments cannot effectively protect children. Inspectors expect current, dynamic risk management — schedule reviews immediately.`,
    });
  }

  // Positive: all decreasing
  if (current.length >= 2 && decreasing > 0 && increasing === 0) {
    insights.push({
      severity: "positive",
      text: `${decreasing} of ${current.length} risk assessments showing decreasing trends with no increases. This evidences effective risk management, therapeutic progress, and stable care provision.`,
    });
  }

  // Positive: full child voice
  if (current.length >= 2 && overview.child_voice_rate === 100) {
    insights.push({
      severity: "positive",
      text: `Child's voice present in 100% of risk assessments. This demonstrates genuine participation in their own safety planning — a key indicator of child-centred practice.`,
    });
  }

  // Positive: high mitigation effectiveness
  if (allMitigations.length >= 3 && overview.mitigation_effectiveness_rate >= 80) {
    insights.push({
      severity: "positive",
      text: `${overview.mitigation_effectiveness_rate}% of risk mitigation strategies rated as effective. Evidence-based interventions are reducing risk and keeping children safe.`,
    });
  }

  return {
    overview,
    child_profiles,
    domain_analysis,
    alerts,
    insights,
  };
}
