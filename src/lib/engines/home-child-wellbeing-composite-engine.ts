// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CHILD WELLBEING COMPOSITE ENGINE
// Correlates health, mental health, behaviour, sleep, nutrition, therapeutic
// progress, education, and social connectedness across ALL children.
// Pure deterministic engine. CHR 2015 Reg 7/10/33/34.
// ══════════════════════════════════════════════════════════════════════════════

import { meets } from "@/lib/metrics/rate";

export interface ChildWellbeingSnapshot {
  child_id: string;
  // Health domain
  health_appointments_attended: number; health_appointments_total: number;
  immunisations_current: boolean; dental_current: boolean; optician_current: boolean;
  // Mental health domain
  mental_health_referral_active: boolean; therapeutic_sessions_attended: number;
  therapeutic_sessions_offered: number; sdq_score: number | null; // 0-40, lower is better
  // Behaviour domain
  positive_behaviour_count: number; concerning_behaviour_count: number;
  restraint_count: number; sanctions_count: number;
  // Sleep domain
  avg_sleep_hours: number; sleep_disruptions_7d: number;
  // Nutrition domain
  meals_eaten_rate: number | null; // 0-100; null = no meals recorded
  dietary_needs_met: boolean;
  // Education
  attendance_rate: number; // 0-100
  exclusion_days: number;
  // Social connectedness
  friends_count: number; isolation_risk: string; // "none"|"mild"|"moderate"|"high"
  family_contact_frequency: string; // "weekly"|"fortnightly"|"monthly"|"infrequent"|"none"
}

export interface HomeChildWellbeingCompositeInput {
  today: string;
  child_snapshots: ChildWellbeingSnapshot[];
  total_children: number;
}

export type WellbeingCompositeRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface DomainScore { name: string; average: number; children_at_risk: number; }

export interface ChildWellbeingSummary {
  child_id: string; overall_score: number; domains_at_risk: string[];
}

export interface HomeChildWellbeingCompositeResult {
  wellbeing_rating: WellbeingCompositeRating; wellbeing_score: number; headline: string;
  domain_scores: DomainScore[];
  children_flourishing: number; children_stable: number; children_struggling: number; children_crisis: number;
  child_summaries: ChildWellbeingSummary[];
  strengths: string[]; concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }

function scoreChild(c: ChildWellbeingSnapshot): { score: number; risks: string[] } {
  let score = 0;
  let max = 0;
  const risks: string[] = [];

  // Health (0-20)
  max += 20;
  const healthRate = pct(c.health_appointments_attended, c.health_appointments_total);
  let healthScore = 0;
  if (c.health_appointments_total > 0) {
    healthScore += healthRate >= 90 ? 8 : healthRate >= 70 ? 5 : healthRate >= 50 ? 3 : 0;
  } else {
    healthScore += 4; // neutral if no appointments
  }
  if (c.immunisations_current) healthScore += 4; else risks.push("health");
  if (c.dental_current) healthScore += 4; else { if (healthScore < 8) risks.push("health"); }
  if (c.optician_current) healthScore += 4; else { if (healthScore < 8) risks.push("health"); }
  score += healthScore;

  // Mental health (0-20)
  max += 20;
  let mhScore = 0;
  if (c.sdq_score !== null) {
    if (c.sdq_score <= 13) mhScore += 8;
    else if (c.sdq_score <= 16) mhScore += 5;
    else if (c.sdq_score <= 19) mhScore += 2;
    else { mhScore += 0; risks.push("mental_health"); }
  } else {
    mhScore += 4; // neutral
  }
  if (c.therapeutic_sessions_offered > 0) {
    const attendRate = pct(c.therapeutic_sessions_attended, c.therapeutic_sessions_offered);
    if (attendRate >= 80) mhScore += 8;
    else if (attendRate >= 60) mhScore += 5;
    else if (attendRate >= 40) mhScore += 2;
    else { mhScore += 0; risks.push("mental_health"); }
  } else if (!c.mental_health_referral_active) {
    mhScore += 6; // neutral — no referral needed
  } else {
    mhScore += 2; // referral active but no sessions offered
    risks.push("mental_health");
  }
  if (mhScore <= 4) mhScore += 4; // floor
  score += Math.min(mhScore, 20);

  // Behaviour (0-20)
  max += 20;
  let behScore = 10; // start neutral
  const totalBeh = c.positive_behaviour_count + c.concerning_behaviour_count;
  if (totalBeh > 0) {
    const posRate = pct(c.positive_behaviour_count, totalBeh);
    if (posRate >= 80) behScore += 6;
    else if (posRate >= 60) behScore += 3;
    else if (posRate < 40) { behScore -= 4; risks.push("behaviour"); }
  }
  if (c.restraint_count === 0) behScore += 4;
  else if (c.restraint_count <= 2) behScore += 1;
  else { behScore -= 3; risks.push("behaviour"); }
  score += Math.max(0, Math.min(behScore, 20));

  // Sleep (0-15)
  max += 15;
  let sleepScore = 0;
  if (c.avg_sleep_hours >= 8) sleepScore += 10;
  else if (c.avg_sleep_hours >= 7) sleepScore += 7;
  else if (c.avg_sleep_hours >= 6) sleepScore += 4;
  else { sleepScore += 1; risks.push("sleep"); }
  if (c.sleep_disruptions_7d === 0) sleepScore += 5;
  else if (c.sleep_disruptions_7d <= 2) sleepScore += 3;
  else if (c.sleep_disruptions_7d >= 5) { sleepScore += 0; risks.push("sleep"); }
  else sleepScore += 1;
  score += Math.min(sleepScore, 15);

  // Nutrition (0-10, or 0-4 when no meals are recorded — the meal component is
  // dropped from the denominator rather than scored on a fabricated rate)
  const mealsMeasured = typeof c.meals_eaten_rate === "number";
  const nutMax = mealsMeasured ? 10 : 4;
  max += nutMax;
  let nutScore = 0;
  if (mealsMeasured) {
    if (meets(c.meals_eaten_rate, 90)) nutScore += 6;
    else if (meets(c.meals_eaten_rate, 70)) nutScore += 4;
    else if (meets(c.meals_eaten_rate, 50)) nutScore += 2;
    else { nutScore += 0; risks.push("nutrition"); }
  }
  if (c.dietary_needs_met) nutScore += 4;
  else risks.push("nutrition");
  score += Math.min(nutScore, nutMax);

  // Education (0-10)
  max += 10;
  let eduScore = 0;
  if (c.attendance_rate >= 95) eduScore += 6;
  else if (c.attendance_rate >= 90) eduScore += 4;
  else if (c.attendance_rate >= 80) eduScore += 2;
  else { eduScore += 0; risks.push("education"); }
  if (c.exclusion_days === 0) eduScore += 4;
  else if (c.exclusion_days <= 2) eduScore += 2;
  else { eduScore += 0; risks.push("education"); }
  score += Math.min(eduScore, 10);

  // Social (0-5)
  max += 5;
  let socScore = 0;
  if (c.isolation_risk === "none") socScore += 3;
  else if (c.isolation_risk === "mild") socScore += 2;
  else if (c.isolation_risk === "moderate") socScore += 1;
  else { socScore += 0; risks.push("social"); }
  if (c.family_contact_frequency === "weekly") socScore += 2;
  else if (c.family_contact_frequency === "fortnightly") socScore += 1;
  else if (c.family_contact_frequency === "none") { risks.push("social"); }
  score += Math.min(socScore, 5);

  return { score: pct(score, max), risks: [...new Set(risks)] };
}

export function computeHomeChildWellbeingComposite(input: HomeChildWellbeingCompositeInput): HomeChildWellbeingCompositeResult {
  const { child_snapshots, total_children } = input;

  if (child_snapshots.length === 0) {
    return {
      wellbeing_rating: "insufficient_data", wellbeing_score: 0,
      headline: "No child wellbeing data available for composite analysis.",
      domain_scores: [], children_flourishing: 0, children_stable: 0,
      children_struggling: 0, children_crisis: 0, child_summaries: [],
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Score each child ─────────────────────────────────────────────────────
  const scored = child_snapshots.map(c => {
    const { score, risks } = scoreChild(c);
    return { child_id: c.child_id, overall_score: score, domains_at_risk: risks };
  });

  const flourishing = scored.filter(s => s.overall_score >= 80).length;
  const stable = scored.filter(s => s.overall_score >= 60 && s.overall_score < 80).length;
  const struggling = scored.filter(s => s.overall_score >= 40 && s.overall_score < 60).length;
  const crisis = scored.filter(s => s.overall_score < 40).length;

  // ── Domain scores ────────────────────────────────────────────────────────
  const domainNames = ["health", "mental_health", "behaviour", "sleep", "nutrition", "education", "social"];
  const domain_scores: DomainScore[] = domainNames.map(name => ({
    name,
    average: Math.round(scored.reduce((s, c) => s + c.overall_score, 0) / scored.length),
    children_at_risk: scored.filter(c => c.domains_at_risk.includes(name)).length,
  }));

  // ── Overall score ────────────────────────────────────────────────────────
  const wellbeing_score = Math.round(scored.reduce((s, c) => s + c.overall_score, 0) / scored.length);
  const wellbeing_rating: WellbeingCompositeRating = wellbeing_score >= 80 ? "outstanding" : wellbeing_score >= 65 ? "good" : wellbeing_score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (flourishing >= scored.length * 0.7) strengths.push(`${flourishing} of ${scored.length} children are flourishing (score ≥80%) — excellent whole-home wellbeing.`);
  if (crisis === 0) strengths.push("No children in crisis — all children have baseline wellbeing met.");
  const lowRiskDomains = domain_scores.filter(d => d.children_at_risk === 0);
  if (lowRiskDomains.length >= 4) strengths.push(`No children at risk across ${lowRiskDomains.length} of 7 domains — broad wellbeing strengths.`);
  if (flourishing > 0 && struggling === 0 && crisis === 0) strengths.push("Every child is either flourishing or stable — consistent care quality across the group.");

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (crisis >= 2) concerns.push(`${crisis} children are in crisis (score <40%) — urgent multi-disciplinary intervention needed.`);
  else if (crisis === 1) concerns.push("1 child is in crisis (score <40%) — requires immediate wellbeing review.");
  const highRiskDomains = domain_scores.filter(d => d.children_at_risk >= Math.ceil(scored.length * 0.5));
  highRiskDomains.forEach(d => concerns.push(`${d.children_at_risk} of ${scored.length} children at risk in ${d.name.replace("_", " ")} — systemic issue.`));
  if (struggling + crisis > scored.length * 0.5) concerns.push(`Over half of children are struggling or in crisis — whole-home wellbeing strategy needed.`);

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  const crisisChildren = scored.filter(s => s.overall_score < 40);
  crisisChildren.forEach(c => {
    recommendations.push({ rank: ++rank, recommendation: `Urgent wellbeing review for child ${c.child_id} (${c.overall_score}%) — risks in ${c.domains_at_risk.join(", ")}.`, urgency: "immediate", regulatory_ref: "Reg 34" });
  });
  highRiskDomains.forEach(d => {
    recommendations.push({ rank: ++rank, recommendation: `Address systemic ${d.name.replace("_", " ")} concerns affecting ${d.children_at_risk} children.`, urgency: "soon", regulatory_ref: "Reg 10" });
  });
  if (scored.length > 0 && wellbeing_score < 65) {
    recommendations.push({ rank: ++rank, recommendation: "Implement whole-home wellbeing improvement plan targeting the weakest domains.", urgency: "planned", regulatory_ref: "Reg 7" });
  }

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (wellbeing_rating === "outstanding") insights.push({ text: "Composite child wellbeing is outstanding — holistic care is effectively meeting children's needs across all domains.", severity: "positive" });
  if (wellbeing_rating === "inadequate") insights.push({ text: "Composite wellbeing is inadequate — multiple children have unmet needs across health, education, and social domains.", severity: "critical" });
  if (crisis >= 1 && flourishing >= 1) insights.push({ text: "Wide variation between children suggests inconsistent care — some children flourish while others are in crisis.", severity: "warning" });
  const mhAtRisk = domain_scores.find(d => d.name === "mental_health")?.children_at_risk ?? 0;
  const behAtRisk = domain_scores.find(d => d.name === "behaviour")?.children_at_risk ?? 0;
  if (mhAtRisk >= 2 && behAtRisk >= 2) insights.push({ text: "Mental health and behaviour risks co-occur in multiple children — consider therapeutic community approach.", severity: "warning" });

  // ── Headline ─────────────────────────────────────────────────────────────
  let headline = "";
  if (wellbeing_rating === "outstanding") headline = `Outstanding composite wellbeing — ${flourishing} of ${scored.length} children flourishing across all domains.`;
  else if (wellbeing_rating === "good") headline = `Good composite wellbeing — most children stable or flourishing, ${struggling + crisis > 0 ? `${struggling + crisis} need(s) attention` : "no children at risk"}.`;
  else if (wellbeing_rating === "adequate") headline = `Adequate composite wellbeing — some children struggling, focused support needed across ${highRiskDomains.length} domain(s).`;
  else headline = `Composite wellbeing is inadequate — ${crisis} child(ren) in crisis, urgent whole-home intervention required.`;

  return {
    wellbeing_rating, wellbeing_score, headline,
    domain_scores, children_flourishing: flourishing, children_stable: stable,
    children_struggling: struggling, children_crisis: crisis,
    child_summaries: scored, strengths, concerns, recommendations, insights,
  };
}
