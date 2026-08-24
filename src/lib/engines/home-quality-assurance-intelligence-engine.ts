// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME QUALITY ASSURANCE INTELLIGENCE ENGINE
// Home-level: analyses QA audit records to assess audit coverage, rating
// trends, action plan completion, improvement culture, and governance.
// CHR 2015 Reg 35. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface QAActionInput {
  status: string;              // completed | in_progress | pending | overdue
  deadline: string;
}

export interface QAAuditInput {
  id: string;
  date: string;
  scope: string;
  overall_rating: string;      // excellent | good | requires_improvement | inadequate
  score: number;               // 1-4
  findings_count: number;
  strengths_count: number;
  improvement_areas_count: number;
  actions: QAActionInput[];
}

export interface HomeQAInput {
  today: string;
  audits: QAAuditInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type QARating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AuditCoverageProfile {
  total_audits_12m: number;
  unique_scopes: number;
  avg_score: number | null;
  excellent_count: number;
  good_count: number;
  ri_count: number;
  inadequate_count: number;
}

export interface ActionPlanProfile {
  total_actions: number;
  completed_count: number;
  completion_rate: number | null;
  overdue_count: number;
  in_progress_count: number;
}

export interface ImprovementProfile {
  avg_findings_per_audit: number | null;
  avg_strengths_per_audit: number | null;
  avg_improvement_areas: number | null;
  audit_frequency_months: number;
}

export interface QAInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface QARecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeQAResult {
  qa_rating: QARating;
  qa_score: number | null;
  headline: string;
  audit_coverage: AuditCoverageProfile;
  action_plan: ActionPlanProfile;
  improvement_profile: ImprovementProfile;
  strengths: string[];
  concerns: string[];
  recommendations: QARecommendation[];
  insights: QAInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): QARating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeQA(
  input: HomeQAInput,
): HomeQAResult {
  const { today, audits } = input;

  // 12-month window
  const cutoff12m = new Date(today);
  cutoff12m.setDate(cutoff12m.getDate() - 365);
  const cutoff12mStr = cutoff12m.toISOString().slice(0, 10);
  const recent = audits.filter(a => a.date >= cutoff12mStr && a.date <= today);

  // Insufficient data: 0 audits in 12m
  if (recent.length === 0) {
    return {
      qa_rating: "insufficient_data",
      qa_score: 0,
      headline: "No QA audit records in the last 12 months.",
      audit_coverage: emptyAuditProfile(),
      action_plan: emptyActionProfile(),
      improvement_profile: emptyImprovementProfile(),
      strengths: [],
      concerns: ["No QA audits conducted in 12 months — Ofsted expects an active quality assurance programme."],
      recommendations: [{ rank: 1, recommendation: "Implement a regular QA audit programme covering safeguarding, recording, health & safety, and care planning.", urgency: "immediate", regulatory_ref: "Reg 35" }],
      insights: [{ text: "No quality assurance audits found in 12 months. Ofsted expects homes to have a systematic approach to monitoring and improving quality. Without audits, the home cannot evidence continuous improvement.", severity: "critical" }],
    };
  }

  // ── Audit Coverage Profile ─────────────────────────────────────────
  const uniqueScopes = new Set(recent.map(a => a.scope)).size;
  const avgScore = Math.round((recent.reduce((a, r) => a + r.score, 0) / recent.length) * 10) / 10;
  const excellent = recent.filter(a => a.overall_rating === "excellent").length;
  const good = recent.filter(a => a.overall_rating === "good").length;
  const ri = recent.filter(a => a.overall_rating === "requires_improvement").length;
  const inadequate = recent.filter(a => a.overall_rating === "inadequate").length;

  const auditCoverage: AuditCoverageProfile = {
    total_audits_12m: recent.length,
    unique_scopes: uniqueScopes,
    avg_score: avgScore,
    excellent_count: excellent,
    good_count: good,
    ri_count: ri,
    inadequate_count: inadequate,
  };

  // ── Action Plan Profile ────────────────────────────────────────────
  const allActions = recent.flatMap(a => a.actions);
  const completed = allActions.filter(a => a.status === "completed").length;
  const overdue = allActions.filter(a => a.status === "overdue").length;
  const inProgress = allActions.filter(a => a.status === "in_progress").length;
  const completionRate = rate(completed, allActions.length);

  const actionProfile: ActionPlanProfile = {
    total_actions: allActions.length,
    completed_count: completed,
    completion_rate: completionRate,
    overdue_count: overdue,
    in_progress_count: inProgress,
  };

  // ── Improvement Profile ────────────────────────────────────────────
  const avgFindings = recent.length > 0
    ? Math.round((recent.reduce((a, r) => a + r.findings_count, 0) / recent.length) * 10) / 10
    : null;
  const avgStrengths = recent.length > 0
    ? Math.round((recent.reduce((a, r) => a + r.strengths_count, 0) / recent.length) * 10) / 10
    : null;
  const avgImprovementAreas = recent.length > 0
    ? Math.round((recent.reduce((a, r) => a + r.improvement_areas_count, 0) / recent.length) * 10) / 10
    : null;
  const auditFreqMonths = recent.length > 1
    ? Math.round(12 / recent.length * 10) / 10
    : 12;

  const improvementProfile: ImprovementProfile = {
    avg_findings_per_audit: avgFindings,
    avg_strengths_per_audit: avgStrengths,
    avg_improvement_areas: avgImprovementAreas,
    audit_frequency_months: auditFreqMonths,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Audit frequency (±5)
  if (recent.length >= 6) score += 5;
  else if (recent.length >= 4) score += 3;
  else if (recent.length >= 2) score += 1;
  else score -= 3;

  // 2. Average score (±4) — scores are 1-4
  if (avgScore >= 3.5) score += 4;
  else if (avgScore >= 2.5) score += 2;
  else score -= 3;

  // 3. Action completion rate (±4)
  if (allActions.length > 0) {
    if (meets(completionRate, 80)) score += 4;
    else if (meets(completionRate, 60)) score += 2;
    else score -= 3;
  } else {
    score += 1; // no actions needed
  }

  // 4. Overdue actions (±3)
  if (overdue === 0) score += 3;
  else if (overdue <= 2) score += 1;
  else score -= 2;

  // 5. Scope diversity (±3)
  if (uniqueScopes >= 5) score += 3;
  else if (uniqueScopes >= 3) score += 2;
  else if (uniqueScopes >= 2) score += 1;
  else score -= 1;

  // 6. No inadequate ratings (±3)
  if (inadequate === 0 && ri === 0) score += 3;
  else if (inadequate === 0) score += 1;
  else score -= 3;

  // 7. Excellent ratings present (±3)
  if (excellent >= 2) score += 3;
  else if (excellent >= 1) score += 2;
  else score += 0;

  // 8. Strengths identified (±3)
  if ((avgStrengths ?? 0) >= 2) score += 3;
  else if ((avgStrengths ?? 0) >= 1) score += 1;
  else score += 0;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (recent.length >= 6) strengths.push(`${recent.length} audits completed in 12 months — comprehensive quality assurance programme.`);
  if (avgScore >= 3.5) strengths.push(`Average audit score ${avgScore}/4 — consistently high-quality practice.`);
  if (meets(completionRate, 80) && allActions.length > 0) strengths.push(`${formatRate(completionRate)} of audit actions completed — improvement actions are followed through.`);
  if (overdue === 0 && allActions.length > 0) strengths.push("No overdue audit actions — governance is responsive and timely.");
  if (uniqueScopes >= 5) strengths.push(`${uniqueScopes} different audit scopes — comprehensive coverage of practice areas.`);
  if (excellent >= 2) strengths.push(`${excellent} audits rated excellent — evidence of outstanding practice in key areas.`);
  if (inadequate === 0 && ri === 0) strengths.push("No requires-improvement or inadequate ratings — consistent quality across all audited areas.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (recent.length < 4) concerns.push(`Only ${recent.length} audit${recent.length === 1 ? "" : "s"} in 12 months — Ofsted expects regular quality assurance.`);
  if (avgScore < 2.5) concerns.push(`Average audit score ${avgScore}/4 — quality needs significant improvement.`);
  if (below(completionRate, 60) && allActions.length > 0) concerns.push(`Only ${formatRate(completionRate)} of audit actions completed — improvement actions are not being followed through.`);
  if (overdue > 2) concerns.push(`${overdue} audit actions overdue — governance is not responsive.`);
  if (inadequate > 0) concerns.push(`${inadequate} audit${inadequate > 1 ? "s" : ""} rated inadequate — urgent improvement needed.`);
  if (uniqueScopes < 3 && recent.length >= 2) concerns.push(`Only ${uniqueScopes} audit scope${uniqueScopes === 1 ? "" : "s"} covered — audits should cover safeguarding, recording, health, care planning, and more.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: QARecommendation[] = [];
  let rank = 1;

  if (overdue > 2) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdue} overdue audit actions — assign owners and set revised deadlines.`, urgency: "immediate", regulatory_ref: "Reg 35" });
  }
  if (inadequate > 0) {
    recs.push({ rank: rank++, recommendation: "Address areas rated inadequate with an immediate improvement plan.", urgency: "immediate", regulatory_ref: "Reg 35" });
  }
  if (recent.length < 4) {
    recs.push({ rank: rank++, recommendation: "Increase audit frequency to at least quarterly — cover key areas systematically.", urgency: "soon", regulatory_ref: "Reg 35" });
  }
  if (below(completionRate, 60) && allActions.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve action plan follow-through — track completion in supervision and team meetings.", urgency: "soon", regulatory_ref: "Reg 35" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: QAInsight[] = [];

  if (inadequate > 0) {
    insights.push({ text: `${inadequate} audit${inadequate > 1 ? "s" : ""} rated inadequate. Ofsted will expect to see that the home identified this through self-assessment and has taken immediate action. This is a serious governance concern if not addressed.`, severity: "critical" });
  }
  if (avgScore >= 3.5 && meets(completionRate, 80) && recent.length >= 4) {
    insights.push({ text: `Average score ${avgScore}/4 with ${formatRate(completionRate)} action completion across ${recent.length} audits. This evidences an outstanding quality assurance culture — systematic monitoring with demonstrable improvement. Ofsted will see this as strong leadership.`, severity: "positive" });
  }
  if (overdue > 2) {
    insights.push({ text: `${overdue} audit actions overdue. Ofsted will check whether the home identifies areas for improvement AND follows through — overdue actions suggest a gap between identifying issues and resolving them.`, severity: "warning" });
  }
  if (uniqueScopes >= 5 && recent.length >= 4) {
    insights.push({ text: `${uniqueScopes} audit scopes across ${recent.length} audits demonstrate comprehensive self-assessment. Ofsted values homes that proactively monitor all areas of practice, not just the obvious ones.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding quality assurance — ${recent.length} audits with ${avgScore}/4 average score and ${formatRate(completionRate)} action completion.`;
  } else if (rating === "good") {
    headline = `Good quality assurance — regular audits with ${formatRate(completionRate)} action follow-through.`;
  } else if (rating === "adequate") {
    headline = "Adequate quality assurance — gaps in audit frequency, action completion, or coverage need addressing.";
  } else {
    headline = "Quality assurance is inadequate — significant gaps in audit programme, action follow-through, or ratings.";
  }

  return {
    qa_rating: rating,
    qa_score: score,
    headline,
    audit_coverage: auditCoverage,
    action_plan: actionProfile,
    improvement_profile: improvementProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyAuditProfile(): AuditCoverageProfile {
  return {
    total_audits_12m: 0, unique_scopes: 0, avg_score: 0,
    excellent_count: 0, good_count: 0, ri_count: 0, inadequate_count: 0,
  };
}

function emptyActionProfile(): ActionPlanProfile {
  return {
    total_actions: 0, completed_count: 0, completion_rate: 0,
    overdue_count: 0, in_progress_count: 0,
  };
}

function emptyImprovementProfile(): ImprovementProfile {
  return {
    avg_findings_per_audit: 0, avg_strengths_per_audit: 0,
    avg_improvement_areas: 0, audit_frequency_months: 0,
  };
}
