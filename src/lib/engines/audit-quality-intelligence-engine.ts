// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUDIT QUALITY ASSURANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses internal quality assurance audits to surface compliance scores,
// overdue audits, findings-to-actions ratios, and category-level trends.
//
// Regulatory: Reg 45 (review of quality of care — the registered person must
// establish and maintain a system for monitoring, reviewing, and evaluating
// the quality of care). Schedule 6 (monitoring and review). SCCIF: "Does the
// home have robust quality assurance systems?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type AuditStatus = "completed" | "scheduled" | "in_progress";

export interface AuditInput {
  id: string;
  title: string;
  category: string;
  date: string;
  completed_by: string | null;
  score: number;
  max_score: number;
  status: AuditStatus;
  findings: number;
  actions: number;
  created_at: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface AuditQualityIntelligenceInput {
  audits: AuditInput[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface AuditOverview {
  total_audits: number;
  completed_count: number;
  scheduled_count: number;
  in_progress_count: number;
  overdue_count: number;
  avg_compliance_score: number;         // pct across completed audits
  high_performing_count: number;        // completed with score >=90%
  below_threshold_count: number;        // completed with score <70%
  total_findings: number;
  total_actions: number;
  unresolved_findings: number;          // findings - actions (floor 0)
  categories_covered: number;
}

export interface AuditProfile {
  audit_id: string;
  title: string;
  category: string;
  status: AuditStatus;
  compliance_pct: number;               // score/max_score * 100 (0 if scheduled)
  completed_by_name: string | null;
  date: string;
  days_since_or_until: number;          // negative = past, positive = future
  is_overdue: boolean;
  findings: number;
  actions: number;
  unresolved_findings: number;
  risk_flags: string[];
}

export interface CategoryAnalysis {
  category: string;
  audit_count: number;
  completed_count: number;
  avg_compliance_score: number;
  total_findings: number;
  total_actions: number;
}

export interface AuditAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraAuditInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface AuditQualityIntelligenceResult {
  overview: AuditOverview;
  audit_profiles: AuditProfile[];
  category_analysis: CategoryAnalysis[];
  alerts: AuditAlert[];
  insights: CaraAuditInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeAuditQualityIntelligence(
  input: AuditQualityIntelligenceInput,
): AuditQualityIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { audits, staff } = input;

  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  // ── Status breakdowns ──────────────────────────────────────────────────
  const completed = audits.filter((a) => a.status === "completed");
  const scheduled = audits.filter((a) => a.status === "scheduled");
  const inProgress = audits.filter((a) => a.status === "in_progress");

  // Overdue: scheduled or in_progress with date in the past
  const overdue = audits.filter(
    (a) => (a.status === "scheduled" || a.status === "in_progress") && daysBetween(a.date, today) > 0,
  );

  // ── Compliance scores ──────────────────────────────────────────────────
  const completedWithScore = completed.filter((a) => a.max_score > 0);
  const complianceScores = completedWithScore.map(
    (a) => Math.round((a.score / a.max_score) * 100),
  );
  const avgCompliance = complianceScores.length > 0
    ? Math.round(complianceScores.reduce((s, v) => s + v, 0) / complianceScores.length)
    : 0;

  const highPerforming = complianceScores.filter((s) => s >= 90).length;
  const belowThreshold = complianceScores.filter((s) => s < 70).length;

  // ── Findings & actions ─────────────────────────────────────────────────
  const totalFindings = audits.reduce((s, a) => s + a.findings, 0);
  const totalActions = audits.reduce((s, a) => s + a.actions, 0);
  const unresolvedFindings = Math.max(0, totalFindings - totalActions);

  // ── Categories ─────────────────────────────────────────────────────────
  const catSet = new Set(audits.map((a) => a.category));

  const overview: AuditOverview = {
    total_audits: audits.length,
    completed_count: completed.length,
    scheduled_count: scheduled.length,
    in_progress_count: inProgress.length,
    overdue_count: overdue.length,
    avg_compliance_score: avgCompliance,
    high_performing_count: highPerforming,
    below_threshold_count: belowThreshold,
    total_findings: totalFindings,
    total_actions: totalActions,
    unresolved_findings: unresolvedFindings,
    categories_covered: catSet.size,
  };

  // ── Audit Profiles ─────────────────────────────────────────────────────
  const audit_profiles: AuditProfile[] = audits.map((a) => {
    const compliancePct = a.status === "completed" && a.max_score > 0
      ? Math.round((a.score / a.max_score) * 100)
      : 0;
    const daysDiff = daysBetween(today, a.date); // positive = future, negative = past
    const isOverdue = (a.status === "scheduled" || a.status === "in_progress") && daysDiff < 0;
    const unresolved = Math.max(0, a.findings - a.actions);

    const riskFlags: string[] = [];
    if (isOverdue) riskFlags.push("overdue");
    if (a.status === "completed" && compliancePct < 70) riskFlags.push("below_threshold");
    if (a.status === "completed" && compliancePct < 50) riskFlags.push("critical_score");
    if (unresolved > 0) riskFlags.push("unresolved_findings");
    if (a.status === "completed" && a.findings > 0 && a.actions === 0) riskFlags.push("no_actions_raised");

    return {
      audit_id: a.id,
      title: a.title,
      category: a.category,
      status: a.status,
      compliance_pct: compliancePct,
      completed_by_name: a.completed_by ? (staffMap.get(a.completed_by) ?? a.completed_by) : null,
      date: a.date,
      days_since_or_until: daysDiff,
      is_overdue: isOverdue,
      findings: a.findings,
      actions: a.actions,
      unresolved_findings: unresolved,
      risk_flags: riskFlags,
    };
  });

  // ── Category Analysis ──────────────────────────────────────────────────
  const catMap = new Map<string, AuditInput[]>();
  for (const a of audits) {
    const arr = catMap.get(a.category) ?? [];
    arr.push(a);
    catMap.set(a.category, arr);
  }

  const category_analysis: CategoryAnalysis[] = [...catMap.entries()]
    .map(([category, items]) => {
      const catCompleted = items.filter((a) => a.status === "completed" && a.max_score > 0);
      const catScores = catCompleted.map((a) => Math.round((a.score / a.max_score) * 100));
      const catAvg = catScores.length > 0
        ? Math.round(catScores.reduce((s, v) => s + v, 0) / catScores.length)
        : 0;

      return {
        category,
        audit_count: items.length,
        completed_count: catCompleted.length,
        avg_compliance_score: catAvg,
        total_findings: items.reduce((s, a) => s + a.findings, 0),
        total_actions: items.reduce((s, a) => s + a.actions, 0),
      };
    })
    .sort((a, b) => a.avg_compliance_score - b.avg_compliance_score); // weakest first

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: AuditAlert[] = [];

  // Critical: overdue audits
  if (overdue.length > 0) {
    const titles = overdue.map((a) => a.title).join(", ");
    alerts.push({
      severity: "critical",
      message: `${overdue.length} audit(s) overdue: ${titles}. Reg 45 requires systematic and ongoing quality review. Overdue audits represent a governance failure.`,
    });
  }

  // High: audits below 70% compliance
  const lowScoreAudits = completedWithScore.filter(
    (a) => Math.round((a.score / a.max_score) * 100) < 70,
  );
  if (lowScoreAudits.length > 0) {
    const descs = lowScoreAudits
      .map((a) => `${a.title} (${Math.round((a.score / a.max_score) * 100)}%)`)
      .join(", ");
    alerts.push({
      severity: "high",
      message: `${lowScoreAudits.length} audit(s) scored below 70% compliance: ${descs}. Areas scoring below threshold require immediate improvement plans.`,
    });
  }

  // High: findings without actions
  if (unresolvedFindings > 0) {
    alerts.push({
      severity: "high",
      message: `${unresolvedFindings} finding(s) without corresponding corrective actions. Every audit finding should generate a tracked improvement action.`,
    });
  }

  // Medium: audits scheduled within 7 days
  const upcoming = scheduled.filter(
    (a) => daysBetween(today, a.date) >= 0 && daysBetween(today, a.date) <= 7,
  );
  if (upcoming.length > 0) {
    const titles = upcoming.map((a) => a.title).join(", ");
    alerts.push({
      severity: "medium",
      message: `${upcoming.length} audit(s) scheduled within the next 7 days: ${titles}. Ensure audit tools and assessors are prepared.`,
    });
  }

  // Medium: in-progress audits
  if (inProgress.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${inProgress.length} audit(s) in progress. Complete promptly to maintain the quality review schedule.`,
    });
  }

  // Low: no completed audits in last 30 days
  const recentCompleted = completed.filter(
    (a) => daysBetween(a.date, today) >= 0 && daysBetween(a.date, today) <= 30,
  );
  if (recentCompleted.length === 0 && audits.length > 0) {
    alerts.push({
      severity: "low",
      message: `No audits completed in the last 30 days. Regular quality assurance audits demonstrate proactive governance under Reg 45.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraAuditInsight[] = [];

  // Critical: overdue audits
  if (overdue.length > 0) {
    insights.push({
      severity: "critical",
      text: `${overdue.length} quality assurance audit(s) are overdue. Inspectors expect to see a live, up-to-date audit schedule under Reg 45 and Schedule 6. Overdue audits indicate a gap in the home's self-evaluation framework.`,
    });
  }

  // Warning: low scores
  if (belowThreshold > 0 && completedWithScore.length > 0) {
    insights.push({
      severity: "warning",
      text: `${belowThreshold} of ${completedWithScore.length} completed audit(s) scored below 70%. Low-scoring audits should trigger improvement plans with clear timescales and responsible owners. Review with your quality assurance lead.`,
    });
  }

  // Warning: unresolved findings
  if (unresolvedFindings > 0 && totalFindings > 0) {
    const pct = Math.round((unresolvedFindings / totalFindings) * 100);
    insights.push({
      severity: "warning",
      text: `${pct}% of audit findings (${unresolvedFindings} of ${totalFindings}) do not have corresponding corrective actions. Ofsted inspectors review action follow-through as part of SCCIF governance assessment.`,
    });
  }

  // Positive: high average compliance
  if (avgCompliance >= 85 && completedWithScore.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average audit compliance score is ${avgCompliance}% across ${completedWithScore.length} completed audit(s). Scores above 85% indicate strong operational standards and proactive quality management.`,
    });
  }

  // Positive: no overdue audits
  if (overdue.length === 0 && audits.length > 0) {
    insights.push({
      severity: "positive",
      text: `No audits are overdue. The quality assurance schedule is being maintained — a positive indicator of management oversight under Reg 45.`,
    });
  }

  // Positive: all completed audits above 80%
  if (completedWithScore.length > 0 && complianceScores.every((s) => s >= 80)) {
    insights.push({
      severity: "positive",
      text: `All ${completedWithScore.length} completed audit(s) scored 80% or above. Consistent high scores across audit domains demonstrate a well-maintained care environment.`,
    });
  }

  // Positive: diverse audit coverage (3+ categories)
  if (catSet.size >= 3) {
    insights.push({
      severity: "positive",
      text: `Quality audits cover ${catSet.size} distinct areas including ${[...catSet].slice(0, 3).join(", ")}. Broad audit coverage demonstrates a comprehensive approach to quality assurance under Schedule 6.`,
    });
  }

  // Positive: recent audit activity
  if (recentCompleted.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${recentCompleted.length} audit(s) completed in the last 30 days. Regular audit activity shows the home is actively self-evaluating and driving improvements.`,
    });
  }

  return {
    overview,
    audit_profiles,
    category_analysis,
    alerts,
    insights,
  };
}
