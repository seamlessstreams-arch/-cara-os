// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WORKFORCE RESILIENCE COMPOSITE ENGINE
// Correlates staffing stability, supervision quality, training compliance,
// staff wellbeing, and operational resilience across the entire workforce.
// Pure deterministic engine. CHR 2015 Reg 31–34 / Schedule 2.
// ══════════════════════════════════════════════════════════════════════════════

import { meets } from "@/lib/metrics/rate";

export interface StaffResilienceSnapshot {
  staff_id: string;
  supervision_completed: number;
  supervision_due: number;
  mandatory_training_current: boolean;
  qualifications_met: boolean;
  sickness_days_90d: number;
  has_development_plan: boolean;
  practice_observations: number;
  recognition_count: number;
  grievance_active: boolean;
  wellbeing_score: number | null;   // 0–10
  dbs_current: boolean;
  induction_completed: boolean;
}

export interface HomeLevelWorkforce {
  vacancy_count: number;
  vacancy_total_posts: number;
  shifts_covered: number;
  shifts_total: number;
  agency_staff_in_use: number;
  lone_working_incidents: number;
  handover_completion_rate: number | null;  // 0–100; null = no handovers recorded
  exit_interviews_conducted: number;
  exit_interviews_due: number;
}

export interface WorkforceResilienceInput {
  today: string;
  total_staff: number;
  staff_snapshots: StaffResilienceSnapshot[];
  home_level: HomeLevelWorkforce;
}

export type WorkforceResilienceRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface WorkforceDomainScore {
  name: string;
  score: number;      // 0–20
  max: number;        // 20
  staff_at_risk: number;
}

export interface WorkforceResilienceResult {
  resilience_rating: WorkforceResilienceRating;
  resilience_score: number;   // 0–100
  headline: string;
  domain_scores: WorkforceDomainScore[];
  staff_flourishing: number;
  staff_stable: number;
  staff_struggling: number;
  staff_at_risk: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }

function scoreStaff(s: StaffResilienceSnapshot): { score: number; risks: string[] } {
  let score = 0;
  const risks: string[] = [];

  // Supervision (0–25)
  if (s.supervision_due > 0) {
    const rate = pct(s.supervision_completed, s.supervision_due);
    if (rate >= 90) score += 25;
    else if (rate >= 75) score += 18;
    else if (rate >= 50) score += 10;
    else { score += 3; risks.push("supervision"); }
  } else {
    score += 12; // neutral
  }

  // Training & qualifications (0–25)
  let trScore = 0;
  if (s.mandatory_training_current) trScore += 10; else { trScore += 0; risks.push("training"); }
  if (s.qualifications_met) trScore += 8; else risks.push("training");
  if (s.has_development_plan) trScore += 4;
  if (s.practice_observations >= 2) trScore += 3;
  else if (s.practice_observations >= 1) trScore += 1;
  score += Math.min(trScore, 25);

  // Wellbeing (0–25)
  let wbScore = 0;
  if (s.sickness_days_90d <= 3) wbScore += 10;
  else if (s.sickness_days_90d <= 7) wbScore += 6;
  else if (s.sickness_days_90d <= 14) wbScore += 2;
  else { wbScore += 0; risks.push("wellbeing"); }
  if (s.wellbeing_score !== null) {
    if (s.wellbeing_score >= 7) wbScore += 8;
    else if (s.wellbeing_score >= 5) wbScore += 5;
    else if (s.wellbeing_score >= 3) wbScore += 2;
    else { wbScore += 0; risks.push("wellbeing"); }
  } else {
    wbScore += 4; // neutral
  }
  if (s.recognition_count >= 3) wbScore += 5;
  else if (s.recognition_count >= 1) wbScore += 3;
  else wbScore += 1;
  if (s.grievance_active) { wbScore -= 3; risks.push("wellbeing"); }
  score += Math.max(0, Math.min(wbScore, 25));

  // Compliance (0–25)
  let compScore = 0;
  if (s.dbs_current) compScore += 12; else { compScore += 0; risks.push("compliance"); }
  if (s.induction_completed) compScore += 8; else risks.push("compliance");
  if (s.mandatory_training_current && s.dbs_current) compScore += 5;
  score += Math.min(compScore, 25);

  return { score: Math.min(pct(score, 100), 100), risks: [...new Set(risks)] };
}

/* ── main ────────────────────────────────────────────────────────────────── */

export function computeWorkforceResilience(input: WorkforceResilienceInput): WorkforceResilienceResult {
  const { staff_snapshots, home_level, total_staff } = input;

  if (staff_snapshots.length === 0) {
    return {
      resilience_rating: "insufficient_data", resilience_score: 0,
      headline: "No workforce data available for resilience composite analysis.",
      domain_scores: [], staff_flourishing: 0, staff_stable: 0,
      staff_struggling: 0, staff_at_risk: 0,
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Score each staff member ─────────────────────────────────────────────
  const scored = staff_snapshots.map(s => {
    const { score, risks } = scoreStaff(s);
    return { staff_id: s.staff_id, score, risks };
  });

  const flourishing = scored.filter(s => s.score >= 80).length;
  const stable = scored.filter(s => s.score >= 60 && s.score < 80).length;
  const struggling = scored.filter(s => s.score >= 40 && s.score < 60).length;
  const atRisk = scored.filter(s => s.score < 40).length;

  // ── Home-level operational score (0–100) ────────────────────────────────
  let opsScore = 0;
  const shiftCoverage = pct(home_level.shifts_covered, home_level.shifts_total);
  if (shiftCoverage >= 95) opsScore += 25;
  else if (shiftCoverage >= 85) opsScore += 18;
  else if (shiftCoverage >= 70) opsScore += 10;
  else opsScore += 3;

  const vacancyRate = pct(home_level.vacancy_count, home_level.vacancy_total_posts);
  if (vacancyRate <= 5) opsScore += 20;
  else if (vacancyRate <= 15) opsScore += 14;
  else if (vacancyRate <= 25) opsScore += 7;
  else opsScore += 2;

  if (home_level.agency_staff_in_use === 0) opsScore += 15;
  else if (home_level.agency_staff_in_use <= 2) opsScore += 10;
  else if (home_level.agency_staff_in_use <= 4) opsScore += 5;
  else opsScore += 1;

  // With no handovers recorded there is nothing to score, so the 15 points are
  // taken out of the denominator instead of awarded or withheld.
  const handoverMeasured = typeof home_level.handover_completion_rate === "number";
  const opsMax = handoverMeasured ? 100 : 85;
  if (meets(home_level.handover_completion_rate, 95)) opsScore += 15;
  else if (meets(home_level.handover_completion_rate, 80)) opsScore += 10;
  else if (meets(home_level.handover_completion_rate, 60)) opsScore += 5;
  else if (handoverMeasured) opsScore += 1;

  if (home_level.lone_working_incidents === 0) opsScore += 15;
  else if (home_level.lone_working_incidents <= 2) opsScore += 8;
  else opsScore += 2;

  const exitRate = home_level.exit_interviews_due > 0
    ? pct(home_level.exit_interviews_conducted, home_level.exit_interviews_due)
    : 100;
  if (exitRate >= 90) opsScore += 10;
  else if (exitRate >= 70) opsScore += 6;
  else opsScore += 2;

  opsScore = Math.min(Math.round((opsScore / opsMax) * 100), 100);

  // ── Domain scores ───────────────────────────────────────────────────────
  const domainNames = ["supervision", "training", "wellbeing", "compliance"];
  const domain_scores: WorkforceDomainScore[] = [
    ...domainNames.map(name => ({
      name,
      score: Math.round(scored.reduce((s, c) => s + c.score, 0) / scored.length / 5),
      max: 20,
      staff_at_risk: scored.filter(c => c.risks.includes(name)).length,
    })),
    {
      name: "operational_resilience",
      score: Math.round(opsScore / 5),
      max: 20,
      staff_at_risk: 0,
    },
  ];

  // ── Overall score: 60% staff individual + 40% ops ─────────────────────
  const staffAvg = Math.round(scored.reduce((s, c) => s + c.score, 0) / scored.length);
  const resilience_score = Math.round(staffAvg * 0.6 + opsScore * 0.4);
  const resilience_rating: WorkforceResilienceRating =
    resilience_score >= 80 ? "outstanding" :
    resilience_score >= 65 ? "good" :
    resilience_score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (flourishing >= scored.length * 0.7) strengths.push(`${flourishing} of ${scored.length} staff members are flourishing — excellent workforce stability.`);
  if (atRisk === 0 && scored.length >= 3) strengths.push("No staff members at risk — baseline workforce resilience is maintained.");
  if (shiftCoverage >= 95) strengths.push("Shift coverage exceeds 95% — operational continuity is strong.");
  if (home_level.agency_staff_in_use === 0 && total_staff >= 5) strengths.push("No agency staff required — the home operates with a fully permanent workforce.");
  if (vacancyRate <= 5) strengths.push("Vacancy rate below 5% — recruitment pipeline is effective.");
  const noRiskDomains = domain_scores.filter(d => d.staff_at_risk === 0 && d.name !== "operational_resilience");
  if (noRiskDomains.length >= 3) strengths.push(`No staff at risk across ${noRiskDomains.length} of 4 domains — broad workforce health.`);

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (atRisk >= 3) concerns.push(`${atRisk} staff members are at risk (score <40%) — workforce fragility threatens care quality.`);
  else if (atRisk >= 1) concerns.push(`${atRisk} staff member(s) at risk — individual support plans needed.`);
  if (vacancyRate > 20) concerns.push(`Vacancy rate at ${vacancyRate}% — significant recruitment gap undermines stability.`);
  if (home_level.agency_staff_in_use >= 4) concerns.push(`${home_level.agency_staff_in_use} agency staff in use — high reliance on temporary workforce.`);
  if (shiftCoverage < 80) concerns.push(`Shift coverage at ${shiftCoverage}% — operational risk from understaffing.`);
  const highRiskDomains = domain_scores.filter(d => d.staff_at_risk >= Math.ceil(scored.length * 0.5));
  highRiskDomains.forEach(d => concerns.push(`${d.staff_at_risk} of ${scored.length} staff at risk in ${d.name} — systemic workforce issue.`));

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (atRisk >= 2) recommendations.push({ rank: ++rank, recommendation: `Urgent support plans for ${atRisk} at-risk staff — supervision, wellbeing checks, and development reviews needed.`, urgency: "immediate", regulatory_ref: "Reg 33" });
  if (vacancyRate > 20) recommendations.push({ rank: ++rank, recommendation: "Accelerate recruitment strategy to address high vacancy rate.", urgency: "immediate", regulatory_ref: "Reg 31" });
  if (shiftCoverage < 85) recommendations.push({ rank: ++rank, recommendation: `Improve shift coverage from ${shiftCoverage}% — review rota planning and contingency arrangements.`, urgency: "soon", regulatory_ref: "Reg 31" });
  const supervisionRisk = domain_scores.find(d => d.name === "supervision")?.staff_at_risk ?? 0;
  if (supervisionRisk >= 2) recommendations.push({ rank: ++rank, recommendation: `Ensure supervision compliance — ${supervisionRisk} staff members have supervision gaps.`, urgency: "soon", regulatory_ref: "Reg 33" });
  const trainingRisk = domain_scores.find(d => d.name === "training")?.staff_at_risk ?? 0;
  if (trainingRisk >= 2) recommendations.push({ rank: ++rank, recommendation: `Address training compliance for ${trainingRisk} staff — mandatory training must be current.`, urgency: "soon", regulatory_ref: "Sch 2" });
  if (resilience_score < 65) recommendations.push({ rank: ++rank, recommendation: "Develop comprehensive workforce resilience improvement plan.", urgency: "planned", regulatory_ref: "Reg 34" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (resilience_rating === "outstanding") insights.push({ text: "Workforce resilience is outstanding — stable, well-supported staff team with strong operational foundations.", severity: "positive" });
  if (resilience_rating === "inadequate") insights.push({ text: "Workforce resilience is inadequate — staff instability and operational gaps directly threaten quality of care.", severity: "critical" });
  if (atRisk >= 1 && flourishing >= 1) insights.push({ text: "Variation in staff wellbeing — some staff flourish while others struggle. Inconsistent support may indicate management blind spots.", severity: "warning" });
  const wellbeingRisk = domain_scores.find(d => d.name === "wellbeing")?.staff_at_risk ?? 0;
  if (wellbeingRisk >= 3) insights.push({ text: "Widespread staff wellbeing concerns — burnout risk is high and will impact children's care if not addressed.", severity: "critical" });
  if (home_level.agency_staff_in_use >= 3 && vacancyRate > 15) insights.push({ text: "High agency use combined with vacancies suggests a recruitment crisis — children's relational stability is at risk.", severity: "warning" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (resilience_rating === "outstanding") headline = `Outstanding workforce resilience — ${flourishing} of ${scored.length} staff flourishing, ${shiftCoverage}% shift coverage.`;
  else if (resilience_rating === "good") headline = `Good workforce resilience — most staff stable, ${atRisk > 0 ? `${atRisk} need(s) support` : "strong operational capacity"}.`;
  else if (resilience_rating === "adequate") headline = `Adequate workforce resilience — ${struggling + atRisk} staff struggling or at risk, focused investment needed.`;
  else headline = `Workforce resilience inadequate — ${atRisk} staff at risk, urgent stabilisation required.`;

  return {
    resilience_rating, resilience_score, headline,
    domain_scores, staff_flourishing: flourishing, staff_stable: stable,
    staff_struggling: struggling, staff_at_risk: atRisk,
    strengths, concerns, recommendations, insights,
  };
}
