// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME OFSTED READINESS COMPOSITE ENGINE
// Aggregates scores from all intelligence engines into a single readiness view.
// Maps to the four Ofsted ILACS judgement areas + overall effectiveness.
// Pure deterministic engine. CHR 2015 Schedule 7 / Reg 44-46.
// ══════════════════════════════════════════════════════════════════════════════

export interface EngineScoreInput {
  engine_name: string;
  score: number;       // 0–100
  rating: string;      // "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data"
  domain: string;      // which ILACS area it maps to
}

export interface HomeOfstedReadinessInput {
  today: string;
  engine_scores: EngineScoreInput[];
  total_children: number;
  total_staff: number;
}

export type OfstedGrade = "outstanding" | "good" | "requires_improvement" | "inadequate" | "insufficient_data";

export interface JudgementArea {
  name: string;
  grade: OfstedGrade;
  average_score: number;
  engine_count: number;
  weakest_engine: string | null;
  weakest_score: number;
  strongest_engine: string | null;
  strongest_score: number;
}

export interface HomeOfstedReadinessResult {
  overall_grade: OfstedGrade;
  overall_score: number;
  headline: string;
  judgement_areas: JudgementArea[];
  total_engines: number;
  engines_outstanding: number;
  engines_good: number;
  engines_adequate: number;
  engines_inadequate: number;
  engines_no_data: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

const DOMAIN_MAP: Record<string, string> = {
  // Overall experiences and progress of children
  "health-wellbeing": "experiences", "health-monitoring": "experiences", "mental-health": "experiences",
  "sleep-quality": "experiences", "nutrition-catering": "experiences", "education-engagement": "experiences",
  "education-achievement": "experiences", "therapeutic-progress": "experiences", "therapeutic-climate": "experiences",
  "enrichment-achievement": "experiences", "activity-enrichment": "experiences", "community-access": "experiences",
  "wellbeing": "experiences", "outcomes-progress": "experiences", "independence": "experiences",
  "independence-life-skills": "experiences", "peer-dynamics": "experiences", "placement-stability": "experiences",
  "placement-stability-depth": "experiences", "living-environment": "experiences", "cultural-identity": "experiences",
  "life-story-identity": "experiences", "placement-journey": "experiences", "child-voice": "experiences",
  "childrens-rights-participation": "experiences", "participation": "experiences", "family-engagement": "experiences",
  "communication-contact": "experiences", "transition-planning": "experiences", "financial-wellbeing": "experiences",
  "specialized-health-plans": "experiences", "night-care-safety": "experiences", "key-working": "experiences",
  "keyworker": "experiences", "digital-safety": "experiences",

  // How well children are helped and protected
  "safeguarding": "protection", "safeguarding-depth": "protection", "safeguarding-prevention": "protection",
  "exploitation-screening": "protection", "missing-episodes": "protection", "incident-safety": "protection",
  "behaviour": "protection", "bsp-effectiveness": "protection", "restrictive-practice": "protection",
  "risk-assessment": "protection", "risk-landscape": "protection", "strategic-risk": "protection",
  "notifiable-events": "protection", "emergency-preparedness": "protection", "fire-safety": "protection",
  "building-ops-safety": "protection", "premises-safety": "protection", "medication-governance": "protection",
  "medication-management": "protection", "complaints": "protection", "on-call-governance": "protection",
  "night-safety": "protection", "staff-safety": "protection",

  // The effectiveness of leaders and managers
  "regulatory-compliance": "leadership", "policy-compliance": "leadership", "quality-assurance": "leadership",
  "reg44": "leadership", "reg4445-evidence": "leadership", "data-governance": "leadership",
  "document-governance": "leadership", "recording-quality": "leadership", "organizational-learning": "leadership",
  "meeting-governance": "leadership", "multi-agency": "leadership", "delegated-authority": "leadership",
  "expense-governance": "leadership", "visitor": "leadership", "leave-absence": "leadership",
  "lac-review": "leadership", "chronology": "leadership",

  // Workforce: how well staff are supported
  "workforce-planning": "workforce", "staff-lifecycle": "workforce", "staff-development": "workforce",
  "staff-wellbeing": "workforce", "supervision": "workforce", "competency-landscape": "workforce",
  "safer-recruitment": "workforce", "shift-pattern": "workforce", "handover-continuity": "workforce",
  "facilities-compliance": "workforce", "daily-log": "workforce", "admission": "workforce",
};

const AREA_LABELS: Record<string, string> = {
  experiences: "Overall experiences and progress of children",
  protection: "How well children are helped and protected",
  leadership: "The effectiveness of leaders and managers",
  workforce: "Impact of leaders on social work practice with children",
};

function scoreToGrade(score: number): OfstedGrade {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "requires_improvement";
  return "inadequate";
}

function formatEngineName(name: string): string {
  return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function computeHomeOfstedReadiness(input: HomeOfstedReadinessInput): HomeOfstedReadinessResult {
  const { engine_scores } = input;

  const scorable = engine_scores.filter(e => e.rating !== "insufficient_data");

  if (scorable.length === 0) {
    return {
      overall_grade: "insufficient_data", overall_score: 0,
      headline: "No intelligence engine data available for Ofsted readiness assessment.",
      judgement_areas: [], total_engines: 0,
      engines_outstanding: 0, engines_good: 0, engines_adequate: 0,
      engines_inadequate: 0, engines_no_data: engine_scores.length,
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Count ratings ────────────────────────────────────────────────────────
  const outstanding = scorable.filter(e => e.rating === "outstanding").length;
  const good = scorable.filter(e => e.rating === "good").length;
  const adequate = scorable.filter(e => e.rating === "adequate").length;
  const inadequate = scorable.filter(e => e.rating === "inadequate").length;
  const noData = engine_scores.filter(e => e.rating === "insufficient_data").length;

  // ── Judgement areas ──────────────────────────────────────────────────────
  const areaKeys = ["experiences", "protection", "leadership", "workforce"];
  const judgement_areas: JudgementArea[] = areaKeys.map(areaKey => {
    const areaEngines = scorable.filter(e => {
      const mapped = DOMAIN_MAP[e.engine_name] ?? e.domain;
      return mapped === areaKey;
    });
    if (areaEngines.length === 0) {
      return {
        name: AREA_LABELS[areaKey], grade: "insufficient_data" as OfstedGrade,
        average_score: 0, engine_count: 0,
        weakest_engine: null, weakest_score: 0,
        strongest_engine: null, strongest_score: 0,
      };
    }
    const avg = Math.round(areaEngines.reduce((s, e) => s + e.score, 0) / areaEngines.length);
    const sorted = [...areaEngines].sort((a, b) => a.score - b.score);
    return {
      name: AREA_LABELS[areaKey],
      grade: scoreToGrade(avg),
      average_score: avg,
      engine_count: areaEngines.length,
      weakest_engine: formatEngineName(sorted[0].engine_name),
      weakest_score: sorted[0].score,
      strongest_engine: formatEngineName(sorted[sorted.length - 1].engine_name),
      strongest_score: sorted[sorted.length - 1].score,
    };
  });

  // ── Overall score ────────────────────────────────────────────────────────
  const overall_score = Math.round(scorable.reduce((s, e) => s + e.score, 0) / scorable.length);

  // Ofsted overall: limited by weakest judgement area (key principle)
  const gradedAreas = judgement_areas.filter(a => a.grade !== "insufficient_data");
  const gradeOrder: OfstedGrade[] = ["inadequate", "requires_improvement", "good", "outstanding"];
  const lowestAreaGrade = gradedAreas.length > 0
    ? gradeOrder[Math.min(...gradedAreas.map(a => gradeOrder.indexOf(a.grade)))]
    : scoreToGrade(overall_score);

  // Overall can't be higher than the weakest area, but can be pulled up slightly by very strong others
  let overall_grade: OfstedGrade;
  if (lowestAreaGrade === "inadequate") {
    overall_grade = "inadequate";
  } else if (lowestAreaGrade === "requires_improvement") {
    overall_grade = overall_score >= 75 ? "good" : "requires_improvement";
  } else {
    overall_grade = scoreToGrade(overall_score);
  }

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (outstanding >= 10) strengths.push(`${outstanding} engines rated outstanding — demonstrates sustained excellence across multiple domains.`);
  else if (outstanding >= 5) strengths.push(`${outstanding} engines rated outstanding — strong practice evident in key areas.`);
  if (inadequate === 0 && scorable.length >= 10) strengths.push("No engines rated inadequate — baseline quality is maintained across all assessed domains.");
  gradedAreas.filter(a => a.grade === "outstanding").forEach(a => strengths.push(`${a.name}: Outstanding (${a.average_score}%) — exemplary practice across ${a.engine_count} assessed domains.`));
  if (overall_score >= 80) strengths.push("Overall readiness score exceeds 80% — the home would present strongly in an Ofsted inspection.");

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (inadequate >= 5) concerns.push(`${inadequate} engines rated inadequate — multiple areas of practice fall below acceptable standards.`);
  else if (inadequate >= 1) concerns.push(`${inadequate} engine(s) rated inadequate — any inadequate area is a significant risk in inspection.`);
  gradedAreas.filter(a => a.grade === "inadequate").forEach(a => concerns.push(`${a.name}: Inadequate (${a.average_score}%) — this judgement area requires urgent improvement.`));
  gradedAreas.filter(a => a.grade === "requires_improvement").forEach(a => concerns.push(`${a.name}: Requires Improvement (${a.average_score}%) — weaknesses in ${a.weakest_engine} (${a.weakest_score}%) need addressing.`));
  if (noData >= 10) concerns.push(`${noData} engines have insufficient data — gaps in evidence base undermine inspection readiness.`);

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  const inadequateEngines = scorable.filter(e => e.rating === "inadequate").sort((a, b) => a.score - b.score);
  inadequateEngines.slice(0, 3).forEach(e => {
    recommendations.push({ rank: ++rank, recommendation: `Urgently improve ${formatEngineName(e.engine_name)} (${e.score}%) — inadequate rating is a serious inspection risk.`, urgency: "immediate", regulatory_ref: null });
  });
  gradedAreas.filter(a => a.grade === "requires_improvement").forEach(a => {
    if (a.weakest_engine) recommendations.push({ rank: ++rank, recommendation: `Strengthen ${a.weakest_engine} (${a.weakest_score}%) to lift the ${a.name.toLowerCase()} judgement area.`, urgency: "soon", regulatory_ref: null });
  });
  if (noData >= 5) recommendations.push({ rank: ++rank, recommendation: `Address ${noData} engines with insufficient data to build a complete evidence base.`, urgency: "planned", regulatory_ref: "Schedule 7" });

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (overall_grade === "outstanding") insights.push({ text: "The home's intelligence data suggests outstanding overall effectiveness — a strong position for inspection.", severity: "positive" });
  if (overall_grade === "inadequate") insights.push({ text: "Multiple critical weaknesses indicate the home would likely receive an inadequate judgement — immediate action required.", severity: "critical" });
  if (overall_grade === "good" && outstanding > good) insights.push({ text: "More engines are outstanding than good — the home is on the cusp of an outstanding overall judgement.", severity: "positive" });
  if (gradedAreas.some(a => a.grade === "inadequate") && gradedAreas.some(a => a.grade === "outstanding")) {
    insights.push({ text: "Significant inconsistency between judgement areas — outstanding practice in some areas but inadequate in others suggests uneven leadership focus.", severity: "warning" });
  }
  const protArea = judgement_areas.find(a => a.name.includes("protected"));
  if (protArea && protArea.grade === "inadequate") insights.push({ text: "Children's protection is rated inadequate — this is the single most critical finding and would drive the overall judgement.", severity: "critical" });

  // ── Headline ─────────────────────────────────────────────────────────────
  let headline = "";
  if (overall_grade === "outstanding") headline = `Outstanding readiness across ${scorable.length} engines — ${outstanding} rated outstanding, strong evidence base.`;
  else if (overall_grade === "good") headline = `Good readiness with ${outstanding} outstanding engines — ${adequate + inadequate > 0 ? `${adequate + inadequate} area(s) to strengthen` : "consistent quality"}.`;
  else if (overall_grade === "requires_improvement") headline = `Requires improvement — ${inadequate} inadequate and ${adequate} adequate engines need focused attention.`;
  else headline = `Inadequate readiness — ${inadequate} engines rated inadequate, urgent whole-home improvement plan needed.`;

  return {
    overall_grade, overall_score, headline,
    judgement_areas, total_engines: scorable.length,
    engines_outstanding: outstanding, engines_good: good,
    engines_adequate: adequate, engines_inadequate: inadequate,
    engines_no_data: noData,
    strengths, concerns, recommendations, insights,
  };
}
