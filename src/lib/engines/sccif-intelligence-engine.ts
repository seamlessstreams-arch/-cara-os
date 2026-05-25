// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SCCIF SELF-EVALUATION INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses self-evaluation coverage across the three SCCIF judgment areas,
// strength/development ratios, action completion, evidence gaps, and
// computes a weighted inspection readiness score.
//
// Regulatory: Social Care Common Inspection Framework (Ofsted),
// Reg 45 — quality of care review, self-evaluation for inspection readiness.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SelfEvaluationActionInput {
  action: string;
  owner: string;
  target_date: string;
  status: string; // open, in_progress, completed
}

export interface SelfEvaluationAreaInput {
  id: string;
  area: string; // overall_experiences, helped_and_protected, leadership_and_management
  self_grade: string; // outstanding, good, requires_improvement, inadequate
  strengths: string[];
  evidence: string[];
  areas_for_development: string[];
  actions: SelfEvaluationActionInput[];
}

export interface SCCIFIntelligenceInput {
  areas: SelfEvaluationAreaInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface SCCIFOverview {
  status: string; // draft, in_review, final
  total_evidence: number;
  coverage_rate: number; // percentage of judgment areas with evidence
  strength_ratio: number; // overall strengths / (strengths + developments) %
  total_areas: number;
  areas_with_evidence: number;
  inspection_readiness_score: number; // 0-100 weighted score
}

export interface JudgmentSummary {
  area: string;
  area_label: string;
  self_grade: string;
  strengths_count: number;
  developments_count: number;
  evidence_count: number;
  strength_ratio: number; // strengths / (strengths + developments) %
}

export interface ActionTracker {
  total_actions: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
}

export interface SCCIFAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaSCCIFInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface SCCIFIntelligenceResult {
  overview: SCCIFOverview;
  judgment_summaries: JudgmentSummary[];
  evidence_gaps: string[];
  action_tracker: ActionTracker;
  alerts: SCCIFAlert[];
  insights: AriaSCCIFInsight[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const SCCIF_JUDGMENT_AREAS = [
  "overall_experiences",
  "helped_and_protected",
  "leadership_and_management",
] as const;

export const AREA_LABELS: Record<string, string> = {
  overall_experiences: "Experiences & Progress",
  helped_and_protected: "Helped & Protected",
  leadership_and_management: "Leadership & Management",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

/** Returns true if the action's target_date is before today and status is not completed. */
export function isOverdue(action: SelfEvaluationActionInput, today: string): boolean {
  if (action.status === "completed") return false;
  return action.target_date < today;
}

/** Computes a percentage, returning 0 when denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeSCCIFIntelligence(input: SCCIFIntelligenceInput): SCCIFIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { areas } = input;

  // ── Judgment Summaries ──────────────────────────────────────────────────
  const judgment_summaries: JudgmentSummary[] = areas.map((area) => {
    const strengthsCount = area.strengths.length;
    const developmentsCount = area.areas_for_development.length;
    const evidenceCount = area.evidence.length;
    const total = strengthsCount + developmentsCount;

    return {
      area: area.area,
      area_label: AREA_LABELS[area.area] ?? area.area,
      self_grade: area.self_grade,
      strengths_count: strengthsCount,
      developments_count: developmentsCount,
      evidence_count: evidenceCount,
      strength_ratio: pct(strengthsCount, total),
    };
  });

  // ── Evidence Gaps ───────────────────────────────────────────────────────
  // Identify which SCCIF judgment areas have no entries at all
  const coveredAreas = new Set(areas.map((a) => a.area));
  const evidence_gaps: string[] = SCCIF_JUDGMENT_AREAS.filter(
    (ja) => !coveredAreas.has(ja)
  ).map((ja) => AREA_LABELS[ja] ?? ja);

  // Also include covered areas that have zero evidence items
  for (const area of areas) {
    if (area.evidence.length === 0 && !evidence_gaps.includes(AREA_LABELS[area.area] ?? area.area)) {
      evidence_gaps.push(AREA_LABELS[area.area] ?? area.area);
    }
  }

  // ── Coverage ────────────────────────────────────────────────────────────
  // Areas with evidence = areas that have at least one evidence item
  const areasWithEvidence = areas.filter((a) => a.evidence.length > 0);
  const totalJudgmentAreas = SCCIF_JUDGMENT_AREAS.length;
  const coverage_rate = pct(areasWithEvidence.length, totalJudgmentAreas);

  // ── Strength Ratio (overall) ────────────────────────────────────────────
  const totalStrengths = areas.reduce((s, a) => s + a.strengths.length, 0);
  const totalDevelopments = areas.reduce((s, a) => s + a.areas_for_development.length, 0);
  const overallStrengthRatio = pct(totalStrengths, totalStrengths + totalDevelopments);

  // ── Total Evidence ──────────────────────────────────────────────────────
  const totalEvidence = areas.reduce((s, a) => s + a.evidence.length, 0);

  // ── Action Tracker ──────────────────────────────────────────────────────
  const allActions = areas.flatMap((a) => a.actions);
  const completedActions = allActions.filter((a) => a.status === "completed");
  const inProgressActions = allActions.filter((a) => a.status === "in_progress");
  const overdueActions = allActions.filter((a) => isOverdue(a, today));

  const action_tracker: ActionTracker = {
    total_actions: allActions.length,
    completed: completedActions.length,
    in_progress: inProgressActions.length,
    overdue: overdueActions.length,
    completion_rate: pct(completedActions.length, allActions.length),
  };

  // ── Inspection Readiness Score (weighted 0-100) ─────────────────────────
  // Weights:
  //   Coverage rate:       25%
  //   Strength ratio:      20%
  //   Grade quality:       30%
  //   Action completion:   15%
  //   Evidence depth:      10%

  // Grade quality: 100 for outstanding, 75 for good, 40 for RI, 10 for inadequate
  const gradeScores: Record<string, number> = {
    outstanding: 100,
    good: 75,
    requires_improvement: 40,
    inadequate: 10,
  };
  const avgGradeScore = areas.length > 0
    ? areas.reduce((s, a) => s + (gradeScores[a.self_grade] ?? 0), 0) / areas.length
    : 0;

  // Evidence depth: how rich is the evidence? Score based on average evidence items
  // Heuristic: 5+ evidence items per area = 100, scale linearly
  const avgEvidencePerArea = areas.length > 0
    ? totalEvidence / areas.length
    : 0;
  const evidenceDepthScore = Math.min(100, Math.round((avgEvidencePerArea / 5) * 100));

  const inspection_readiness_score = Math.round(
    (coverage_rate * 0.25) +
    (overallStrengthRatio * 0.20) +
    (avgGradeScore * 0.30) +
    (action_tracker.completion_rate * 0.15) +
    (evidenceDepthScore * 0.10)
  );

  // ── Status Determination ────────────────────────────────────────────────
  // draft: < 3 areas filled, or coverage < 67%
  // in_review: all 3 areas covered but actions still open
  // final: all 3 areas covered, no overdue actions, coverage 100%
  let status: string;
  if (areas.length < 3 || coverage_rate < 67) {
    status = "draft";
  } else if (overdueActions.length > 0 || action_tracker.completion_rate < 100) {
    status = "in_review";
  } else {
    status = "final";
  }

  // ── Overview ────────────────────────────────────────────────────────────
  const overview: SCCIFOverview = {
    status,
    total_evidence: totalEvidence,
    coverage_rate,
    strength_ratio: overallStrengthRatio,
    total_areas: areas.length,
    areas_with_evidence: areasWithEvidence.length,
    inspection_readiness_score,
  };

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: SCCIFAlert[] = [];

  // Critical: Any area rated inadequate
  for (const area of areas) {
    if (area.self_grade === "inadequate") {
      alerts.push({
        severity: "critical",
        message: `${AREA_LABELS[area.area] ?? area.area} is rated Inadequate — urgent action required.`,
      });
    }
  }

  // High: Any area rated requires_improvement
  for (const area of areas) {
    if (area.self_grade === "requires_improvement") {
      alerts.push({
        severity: "high",
        message: `${AREA_LABELS[area.area] ?? area.area} is rated Requires Improvement.`,
      });
    }
  }

  // High: Coverage rate below 50%
  if (coverage_rate < 50) {
    alerts.push({
      severity: "high",
      message: `Evidence coverage is only ${coverage_rate}% — below the 50% threshold.`,
    });
  }

  // Medium: Evidence gaps exist
  if (evidence_gaps.length > 0) {
    alerts.push({
      severity: "medium",
      message: `Evidence gaps in ${evidence_gaps.length} judgment area(s): ${evidence_gaps.join(", ")}.`,
    });
  }

  // Medium: Overdue actions
  if (overdueActions.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${overdueActions.length} action(s) overdue.`,
    });
  }

  // Low: Strength ratio below 60% in any area
  for (const summary of judgment_summaries) {
    const total = summary.strengths_count + summary.developments_count;
    if (total > 0 && summary.strength_ratio < 60) {
      alerts.push({
        severity: "low",
        message: `${summary.area_label} strength ratio is ${summary.strength_ratio}% — below 60%.`,
      });
    }
  }

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: AriaSCCIFInsight[] = [];

  // Critical: Inadequate area
  for (const area of areas) {
    if (area.self_grade === "inadequate") {
      insights.push({
        severity: "critical",
        text: `${AREA_LABELS[area.area] ?? area.area} self-evaluated as Inadequate — urgent improvement plan needed before inspection.`,
      });
    }
  }

  // Warning: Low evidence coverage (< 70%)
  if (coverage_rate < 70) {
    insights.push({
      severity: "warning",
      text: `Evidence coverage at ${coverage_rate}% — consider completing self-evaluation for all SCCIF judgment areas.`,
    });
  }

  // Warning: Overdue actions exist
  if (overdueActions.length > 0) {
    insights.push({
      severity: "warning",
      text: `${overdueActions.length} action(s) past target date — review and update before inspection.`,
    });
  }

  // Positive: All areas rated good or outstanding
  const allGoodOrAbove = areas.length > 0 && areas.every(
    (a) => a.self_grade === "good" || a.self_grade === "outstanding"
  );
  if (allGoodOrAbove) {
    insights.push({
      severity: "positive",
      text: "All self-evaluated areas rated Good or Outstanding — strong position for inspection.",
    });
  }

  // Positive: Coverage rate 90%+ with strength ratio 65%+
  if (coverage_rate >= 90 && overallStrengthRatio >= 65) {
    insights.push({
      severity: "positive",
      text: `Excellent evidence coverage (${coverage_rate}%) with strong strength ratio (${overallStrengthRatio}%) — well-prepared for inspection.`,
    });
  }

  return {
    overview,
    judgment_summaries,
    evidence_gaps,
    action_tracker,
    alerts,
    insights,
  };
}
