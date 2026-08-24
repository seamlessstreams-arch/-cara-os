// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME REG 44/45 EVIDENCE INTELLIGENCE ENGINE
// Aggregates Reg 44 visits, reports, actions; Reg 45 evidence; Reg 46 reviews;
// and Annex A evidence readiness.
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Regulatory: CHR 2015 Reg 44, Reg 45, Reg 46.
// ══════════════════════════════════════════════════════════════════════════════

export interface Reg44PackInput {
  id: string;
  month: string; // "2026-05"
  visit_completed: boolean;
  report_submitted: boolean;
  children_spoken_to: number;
  areas_covered: number;
  actions_raised: number;
}

export interface Reg44VisitReportInput {
  id: string;
  visit_date: string;
  children_interviewed: number;
  staff_interviewed: number;
  areas_inspected: string[];
  positive_findings: number;
  concerns_raised: number;
  child_voice_included: boolean;
}

export interface Reg44ActionRecordInput {
  id: string;
  raised_date: string;
  due_date: string;
  completed_date: string;
  status: string; // "open" | "in_progress" | "completed" | "overdue"
  priority: string; // "high" | "medium" | "low"
}

export interface Reg45EvidenceInput {
  id: string;
  quality_area: string;
  evidence_date: string;
  evidence_type: string;
  strength_of_evidence: string; // "strong" | "adequate" | "weak"
  child_voice_present: boolean;
  review_date: string;
}

export interface Reg46ReviewInput {
  id: string;
  review_date: string;
  areas_reviewed: string[];
  actions_raised: number;
  actions_completed: number;
  next_review_date: string;
}

export interface AnnexAEvidenceInput {
  id: string;
  standard_ref: string;
  evidence_present: boolean;
  evidence_current: boolean;
  last_updated: string;
  gap_identified: boolean;
}

export interface HomeReg4445EvidenceInput {
  today: string;
  reg44_packs: Reg44PackInput[];
  reg44_visit_reports: Reg44VisitReportInput[];
  reg44_actions: Reg44ActionRecordInput[];
  reg45_evidence: Reg45EvidenceInput[];
  reg46_reviews: Reg46ReviewInput[];
  annex_a_evidence: AnnexAEvidenceInput[];
  total_children: number;
}

export type Reg4445Rating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface Reg44VisitSummary {
  total_packs: number;
  visit_completed_rate: number | null;
  report_submitted_rate: number | null;
  avg_areas_covered: number | null;
}

export interface Reg44ReportSummary {
  total_reports: number;
  avg_children_interviewed: number | null;
  child_voice_rate: number | null;
  avg_concerns: number | null;
}

export interface Reg44ActionSummary {
  total_actions: number;
  completed_rate: number | null;
  overdue_count: number;
  high_priority_open: number;
}

export interface Reg45Summary {
  total_evidence: number;
  strong_evidence_rate: number | null;
  child_voice_rate: number | null;
  overdue_reviews: number;
  unique_quality_areas: number;
}

export interface Reg46Summary {
  total_reviews: number;
  action_completion_rate: number | null;
  overdue_reviews: number;
}

export interface AnnexASummary {
  total_standards: number;
  evidence_present_rate: number | null;
  evidence_current_rate: number | null;
  gaps_identified: number;
}

export interface HomeReg4445EvidenceResult {
  reg4445_rating: Reg4445Rating;
  reg4445_score: number | null;
  headline: string;
  reg44_visits: Reg44VisitSummary;
  reg44_reports: Reg44ReportSummary;
  reg44_actions: Reg44ActionSummary;
  reg45: Reg45Summary;
  reg46: Reg46Summary;
  annex_a: AnnexASummary;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function computeHomeReg4445Evidence(input: HomeReg4445EvidenceInput): HomeReg4445EvidenceResult {
  const { today, reg44_packs, reg44_visit_reports, reg44_actions, reg45_evidence, reg46_reviews, annex_a_evidence, total_children } = input;

  if (
    total_children === 0 &&
    reg44_packs.length === 0 && reg44_visit_reports.length === 0 &&
    reg44_actions.length === 0 && reg45_evidence.length === 0 &&
    reg46_reviews.length === 0 && annex_a_evidence.length === 0
  ) {
    return {
      reg4445_rating: "insufficient_data", reg4445_score: 0,
      headline: "No Reg 44/45 evidence data available for analysis.",
      reg44_visits: { total_packs: 0, visit_completed_rate: null, report_submitted_rate: null, avg_areas_covered: 0 },
      reg44_reports: { total_reports: 0, avg_children_interviewed: 0, child_voice_rate: null, avg_concerns: 0 },
      reg44_actions: { total_actions: 0, completed_rate: null, overdue_count: 0, high_priority_open: 0 },
      reg45: { total_evidence: 0, strong_evidence_rate: null, child_voice_rate: null, overdue_reviews: 0, unique_quality_areas: 0 },
      reg46: { total_reviews: 0, action_completion_rate: null, overdue_reviews: 0 },
      annex_a: { total_standards: 0, evidence_present_rate: null, evidence_current_rate: null, gaps_identified: 0 },
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Analysis ──────────────────────────────────────────────────────

  // Reg 44 Packs
  const p44Completed = reg44_packs.filter(p => p.visit_completed).length;
  const p44CompRate = pct(p44Completed, reg44_packs.length);
  const p44Submitted = reg44_packs.filter(p => p.report_submitted).length;
  const p44SubmitRate = pct(p44Submitted, reg44_packs.length);
  const p44AvgAreas = reg44_packs.length > 0
    ? Math.round((reg44_packs.reduce((s, p) => s + p.areas_covered, 0) / reg44_packs.length) * 10) / 10 : null;

  // Reg 44 Reports
  const r44AvgChildren = reg44_visit_reports.length > 0
    ? Math.round((reg44_visit_reports.reduce((s, r) => s + r.children_interviewed, 0) / reg44_visit_reports.length) * 10) / 10 : null;
  const r44Voice = reg44_visit_reports.filter(r => r.child_voice_included).length;
  const r44VoiceRate = pct(r44Voice, reg44_visit_reports.length);
  const r44AvgConcerns = reg44_visit_reports.length > 0
    ? Math.round((reg44_visit_reports.reduce((s, r) => s + r.concerns_raised, 0) / reg44_visit_reports.length) * 10) / 10 : null;

  // Reg 44 Actions
  const a44Completed = reg44_actions.filter(a => a.status === "completed").length;
  const a44CompRate = pct(a44Completed, reg44_actions.length);
  const a44Overdue = reg44_actions.filter(a => a.status === "overdue" || (a.status !== "completed" && daysBetween(a.due_date, today) > 0)).length;
  const a44HighOpen = reg44_actions.filter(a => a.priority === "high" && a.status !== "completed").length;

  // Reg 45 Evidence
  const e45Strong = reg45_evidence.filter(e => e.strength_of_evidence === "strong").length;
  const e45StrongRate = pct(e45Strong, reg45_evidence.length);
  const e45Voice = reg45_evidence.filter(e => e.child_voice_present).length;
  const e45VoiceRate = pct(e45Voice, reg45_evidence.length);
  const e45Overdue = reg45_evidence.filter(e => daysBetween(e.review_date, today) > 0).length;
  const e45Areas = new Set(reg45_evidence.map(e => e.quality_area));

  // Reg 46 Reviews
  const r46ActionsSet = reg46_reviews.reduce((s, r) => s + r.actions_raised, 0);
  const r46ActionsComp = reg46_reviews.reduce((s, r) => s + r.actions_completed, 0);
  const r46ActCompRate = pct(r46ActionsComp, r46ActionsSet);
  const r46Overdue = reg46_reviews.filter(r => daysBetween(r.next_review_date, today) > 0).length;

  // Annex A
  const aaPresent = annex_a_evidence.filter(a => a.evidence_present).length;
  const aaPresentRate = pct(aaPresent, annex_a_evidence.length);
  const aaCurrent = annex_a_evidence.filter(a => a.evidence_current).length;
  const aaCurrentRate = pct(aaCurrent, annex_a_evidence.length);
  const aaGaps = annex_a_evidence.filter(a => a.gap_identified).length;

  // ── Summaries ──────────────────────────────────────────────────────
  const reg44_visits_sum: Reg44VisitSummary = { total_packs: reg44_packs.length, visit_completed_rate: p44CompRate, report_submitted_rate: p44SubmitRate, avg_areas_covered: p44AvgAreas };
  const reg44_reports_sum: Reg44ReportSummary = { total_reports: reg44_visit_reports.length, avg_children_interviewed: r44AvgChildren, child_voice_rate: r44VoiceRate, avg_concerns: r44AvgConcerns };
  const reg44_actions_sum: Reg44ActionSummary = { total_actions: reg44_actions.length, completed_rate: a44CompRate, overdue_count: a44Overdue, high_priority_open: a44HighOpen };
  const reg45_sum: Reg45Summary = { total_evidence: reg45_evidence.length, strong_evidence_rate: e45StrongRate, child_voice_rate: e45VoiceRate, overdue_reviews: e45Overdue, unique_quality_areas: e45Areas.size };
  const reg46_sum: Reg46Summary = { total_reviews: reg46_reviews.length, action_completion_rate: r46ActCompRate, overdue_reviews: r46Overdue };
  const annex_a_sum: AnnexASummary = { total_standards: annex_a_evidence.length, evidence_present_rate: aaPresentRate, evidence_current_rate: aaCurrentRate, gaps_identified: aaGaps };

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max +28) -> max 80
  // ═══════════════════════════════════════════════════════════════════════

  let score = 52;

  // Mod 1: Reg 44 visit frequency & timeliness (±5)
  {
    let m = 0;
    if (reg44_packs.length > 0) {
      if (p44CompRate >= 90) m += 2; else if (p44CompRate < 50) m -= 2;
      if (p44SubmitRate >= 90) m += 2; else if (p44SubmitRate < 50) m -= 2;
      if ((p44AvgAreas ?? 0) >= 5) m += 1; else if ((p44AvgAreas ?? 0) < 2) m -= 1;
    } else {
      if (total_children >= 1) m -= 3;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // Mod 2: Reg 44 report quality (±4)
  {
    let m = 0;
    if (reg44_visit_reports.length > 0) {
      if (r44VoiceRate >= 80) m += 2; else if (r44VoiceRate < 40) m -= 1;
      if ((r44AvgChildren ?? 0) >= 3) m += 1; else if ((r44AvgChildren ?? 0) < 1) m -= 1;
      const avgAreas = reg44_visit_reports.length > 0
        ? reg44_visit_reports.reduce((s, r) => s + r.areas_inspected.length, 0) / reg44_visit_reports.length : 0;
      if (avgAreas >= 5) m += 1; else if (avgAreas < 2) m -= 1;
    } else {
      if (total_children >= 1) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // Mod 3: Reg 44 action tracking (±3)
  {
    let m = 0;
    if (reg44_actions.length > 0) {
      if (a44CompRate >= 80) m += 1; else if (a44CompRate < 40) m -= 1;
      if (a44Overdue === 0) m += 1; else if (a44Overdue >= 5) m -= 2; else m -= 1;
      if (a44HighOpen === 0) m += 1; else if (a44HighOpen >= 3) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 4: Reg 45 evidence completeness (±4)
  {
    let m = 0;
    if (reg45_evidence.length > 0) {
      if (e45StrongRate >= 70) m += 2; else if (e45StrongRate < 30) m -= 1;
      if (e45Areas.size >= 5) m += 1; else if (e45Areas.size < 2) m -= 1;
      if (e45Overdue === 0) m += 1; else if (e45Overdue >= 5) m -= 2; else m -= 1;
    } else {
      if (total_children >= 1) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // Mod 5: Reg 46 premises review (±3)
  {
    let m = 0;
    if (reg46_reviews.length > 0) {
      if (r46ActCompRate >= 80) m += 1; else if (r46ActCompRate < 40) m -= 1;
      if (r46Overdue === 0) m += 1; else if (r46Overdue >= 3) m -= 2; else m -= 1;
      if (reg46_reviews.length >= 2) m += 1;
    } else {
      if (total_children >= 1) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 6: Annex A evidence readiness (±3)
  {
    let m = 0;
    if (annex_a_evidence.length > 0) {
      if (aaPresentRate >= 90) m += 1; else if (aaPresentRate < 50) m -= 1;
      if (aaCurrentRate >= 80) m += 1; else if (aaCurrentRate < 40) m -= 1;
      if (aaGaps === 0) m += 1; else if (aaGaps >= 5) m -= 2; else m -= 1;
    } else {
      if (total_children >= 1) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 7: Child voice in regulatory evidence (±3)
  {
    let m = 0;
    const voiceSources: number[] = [];
    if (reg44_visit_reports.length > 0) voiceSources.push(r44VoiceRate);
    if (reg45_evidence.length > 0) voiceSources.push(e45VoiceRate);
    if (voiceSources.length > 0) {
      const avg = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avg >= 90) m += 3; else if (avg >= 70) m += 2; else if (avg >= 50) m += 1; else if (avg < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 8: Action resolution & learning (±3)
  {
    let m = 0;
    const actionSources: number[] = [];
    if (reg44_actions.length > 0) actionSources.push(a44CompRate);
    if (reg46_reviews.length > 0) actionSources.push(r46ActCompRate);
    if (actionSources.length > 0) {
      const avg = Math.round(actionSources.reduce((s, v) => s + v, 0) / actionSources.length);
      if (avg >= 90) m += 3; else if (avg >= 70) m += 2; else if (avg >= 50) m += 1; else if (avg < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  score = Math.max(0, Math.min(100, score));

  let reg4445_rating: Reg4445Rating;
  if (score >= 80) reg4445_rating = "outstanding";
  else if (score >= 65) reg4445_rating = "good";
  else if (score >= 45) reg4445_rating = "adequate";
  else reg4445_rating = "inadequate";

  // ── Narrative ──────────────────────────────────────────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeReg4445EvidenceResult["recommendations"] = [];
  const insights: HomeReg4445EvidenceResult["insights"] = [];
  let rank = 0;

  if (reg44_packs.length > 0 && p44CompRate >= 90 && p44SubmitRate >= 90) {
    strengths.push(`Excellent Reg 44 visit compliance — ${p44CompRate}% visits completed with ${p44SubmitRate}% reports submitted.`);
  }
  if (reg44_visit_reports.length > 0 && r44VoiceRate >= 80) {
    strengths.push(`Strong child voice in Reg 44 reports — ${r44VoiceRate}% include children's views.`);
  }
  if (reg45_evidence.length > 0 && e45StrongRate >= 70 && e45Overdue === 0) {
    strengths.push(`Robust Reg 45 evidence base — ${e45StrongRate}% rated strong with no overdue reviews.`);
  }
  if (annex_a_evidence.length > 0 && aaPresentRate >= 90 && aaGaps === 0) {
    strengths.push(`Annex A evidence is comprehensive — ${aaPresentRate}% present with zero gaps identified.`);
  }

  if (reg44_packs.length === 0 && total_children >= 1) {
    concerns.push("No Reg 44 visit packs — monthly independent visits are a statutory requirement.");
    recommendations.push({ rank: ++rank, recommendation: "Establish a monthly Reg 44 independent visit programme immediately.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (reg44_actions.length > 0 && a44Overdue >= 5) {
    concerns.push(`${a44Overdue} Reg 44 actions are overdue — regulatory actions are not being resolved.`);
    recommendations.push({ rank: ++rank, recommendation: "Clear overdue Reg 44 actions urgently and implement tracking system.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (reg45_evidence.length === 0 && total_children >= 1) {
    concerns.push("No Reg 45 quality evidence — the quality of care is not being formally evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Build a Reg 45 evidence portfolio covering all quality areas.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 45" });
  }
  if (annex_a_evidence.length > 0 && aaGaps >= 5) {
    concerns.push(`${aaGaps} Annex A evidence gaps identified — inspection readiness is compromised.`);
  }

  if (reg4445_rating === "outstanding") {
    insights.push({ text: `Regulatory evidence is outstanding (${score}%). Reg 44 visits, Reg 45 quality evidence, and Annex A readiness all demonstrate excellent compliance.`, severity: "positive" });
  }
  if (reg4445_rating === "inadequate") {
    insights.push({ text: `Regulatory evidence is inadequate (${score}%). Critical gaps in Reg 44/45 compliance — this presents serious regulatory risk.`, severity: "critical" });
  }

  let headline: string;
  if (reg4445_rating === "outstanding") headline = "Regulatory evidence is outstanding — Reg 44 visits, quality evidence, and Annex A readiness all demonstrate excellent practice.";
  else if (reg4445_rating === "good") headline = "Good regulatory evidence with effective compliance, some areas for improvement.";
  else if (reg4445_rating === "adequate") headline = "Adequate regulatory evidence but gaps in visit compliance, evidence quality, or action tracking need attention.";
  else headline = "Significant regulatory evidence gaps — Reg 44/45/46 compliance requires urgent improvement.";

  return {
    reg4445_rating, reg4445_score: score, headline,
    reg44_visits: reg44_visits_sum, reg44_reports: reg44_reports_sum,
    reg44_actions: reg44_actions_sum, reg45: reg45_sum, reg46: reg46_sum, annex_a: annex_a_sum,
    strengths, concerns, recommendations, insights,
  };
}
