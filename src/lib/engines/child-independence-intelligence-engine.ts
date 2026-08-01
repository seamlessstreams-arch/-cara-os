// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD INDEPENDENCE & LIFE SKILLS INTELLIGENCE ENGINE
//
// Per-child independence analysis: life skills proficiency, pathway plan
// compliance, transition readiness, support network, aspiration tracking,
// and leaving care preparation.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: Children (Leaving Care) Act 2000, Children and Social Work
// Act 2017 (local offer for care leavers), CHR 2015 Reg 5, 14.
// SCCIF: "Outcomes for children" — preparation for adulthood.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type SkillProficiency = "not_started" | "emerging" | "developing" | "competent" | "independent";

export interface SkillInput {
  id: string;
  name: string;
  category: string;          // cooking, budgeting, laundry, travel, health, communication, housing
  proficiency: SkillProficiency;
  last_assessed: string;
  next_step: string;
}

export interface IndependenceSkillsRecordInput {
  id: string;
  review_date: string;
  overall_readiness: number;   // 0-100
  skills: SkillInput[];
  strengths: string[];
  areas_for_development: string[];
  child_view: string;
  pathway_notes: string;
}

export type PathwayStatus = "pre_pathway_15plus" | "active_16_18" | "active_18_21" | "active_21_25" | "closed";

export type LivingSkillLevel = "not_yet" | "emerging" | "developing" | "established";

export interface PathwayPlanInput {
  id: string;
  status: PathwayStatus;
  plan_version: string;
  last_review_date: string;
  next_review_date: string;
  personal_advisor: string;
  accommodation: string;
  education_employment_training: string;
  health_needs: string[];
  financial_support: string[];
  support_network: string[];
  aspirations: string[];
  risks: string[];
  independent_living_skills: Record<string, LivingSkillLevel>;
}

export interface ChildIndependenceInput {
  today: string;
  child_id: string;
  child_name: string;
  child_age: number;
  independence_records: IndependenceSkillsRecordInput[];
  pathway_plan: PathwayPlanInput | null;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ReadinessStatus = "well_prepared" | "on_track" | "developing" | "behind" | "at_risk" | "insufficient_data";

export interface SkillSummary {
  category: string;
  proficiency: SkillProficiency;
  last_assessed: string | null;
  next_step: string;
}

export interface SkillsOverview {
  total_skills: number;
  independent_count: number;
  competent_count: number;
  developing_count: number;
  emerging_count: number;
  not_started_count: number;
  readiness_score: number | null;       // 0-100
  skills_by_category: SkillSummary[];
  strengths: string[];
  development_areas: string[];
}

export interface PathwayCompliance {
  has_plan: boolean;
  plan_current: boolean;           // reviewed within 6 months
  plan_status: PathwayStatus | null;
  last_review_date: string | null;
  next_review_date: string | null;
  review_overdue: boolean;
  personal_advisor_assigned: boolean;
  accommodation_identified: boolean;
  eet_plan: string | null;         // education/employment/training status
  support_network_size: number;
  aspirations: string[];
  risks: string[];
}

export type RecommendationUrgency = "immediate" | "soon" | "planned";

export interface IndependenceRecommendation {
  rank: number;
  recommendation: string;
  urgency: RecommendationUrgency;
  domain: string;
  regulatory_ref: string;
}

export interface IndependenceInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildIndependenceResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  child_age: number;
  readiness_status: ReadinessStatus;
  readiness_score: number | null;          // 0-100
  headline: string;
  skills_overview: SkillsOverview;
  pathway_compliance: PathwayCompliance;
  child_voice: string | null;
  strengths: string[];
  concerns: string[];
  recommendations: IndependenceRecommendation[];
  insights: IndependenceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const PROF_SCORES: Record<SkillProficiency, number> = {
  not_started: 0,
  emerging: 25,
  developing: 50,
  competent: 75,
  independent: 100,
};

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildIndependenceIntelligence(
  input: ChildIndependenceInput,
): ChildIndependenceResult {
  const { today, child_id, child_name, child_age, independence_records, pathway_plan } = input;

  // Use most recent skills record
  const sortedRecords = [...independence_records].sort(
    (a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime(),
  );
  const latest = sortedRecords[0] ?? null;
  const skills = latest?.skills ?? [];

  // ── Skills Overview ──────────────────────────────────────────────────
  const independentCount = skills.filter((s) => s.proficiency === "independent").length;
  const competentCount = skills.filter((s) => s.proficiency === "competent").length;
  const developingCount = skills.filter((s) => s.proficiency === "developing").length;
  const emergingCount = skills.filter((s) => s.proficiency === "emerging").length;
  const notStartedCount = skills.filter((s) => s.proficiency === "not_started").length;

  const skillScores = skills.map((s) => PROF_SCORES[s.proficiency] ?? 0);
  const readinessScore = skills.length > 0
    ? Math.round(skillScores.reduce((a, b) => a + b, 0) / skills.length)
    : null;

  const skillsByCategory: SkillSummary[] = skills.map((s) => ({
    category: s.category,
    proficiency: s.proficiency,
    last_assessed: s.last_assessed?.slice(0, 10) ?? null,
    next_step: s.next_step,
  }));

  const skills_overview: SkillsOverview = {
    total_skills: skills.length,
    independent_count: independentCount,
    competent_count: competentCount,
    developing_count: developingCount,
    emerging_count: emergingCount,
    not_started_count: notStartedCount,
    readiness_score: readinessScore,
    skills_by_category: skillsByCategory,
    strengths: latest?.strengths ?? [],
    development_areas: latest?.areas_for_development ?? [],
  };

  // ── Pathway Compliance ───────────────────────────────────────────────
  const pp = pathway_plan;
  const ppReviewDate = pp?.last_review_date?.slice(0, 10) ?? null;
  const ppNextReviewDate = pp?.next_review_date?.slice(0, 10) ?? null;
  const reviewOverdue = ppNextReviewDate ? daysAgo(today, ppNextReviewDate) > 0 : ppReviewDate ? daysAgo(today, ppReviewDate) > 180 : false;
  const ppCurrent = pp ? !reviewOverdue : false;
  const paAssigned = pp ? pp.personal_advisor.length > 0 : false;
  const accomIdentified = pp ? pp.accommodation.length > 0 && !pp.accommodation.toLowerCase().includes("not yet") : false;

  const pathway_compliance: PathwayCompliance = {
    has_plan: !!pp,
    plan_current: ppCurrent,
    plan_status: pp?.status ?? null,
    last_review_date: ppReviewDate,
    next_review_date: ppNextReviewDate,
    review_overdue: reviewOverdue,
    personal_advisor_assigned: paAssigned,
    accommodation_identified: accomIdentified,
    eet_plan: pp?.education_employment_training ?? null,
    support_network_size: pp?.support_network.length ?? 0,
    aspirations: pp?.aspirations ?? [],
    risks: pp?.risks ?? [],
  };

  // ── Composite Score (0-100) ──────────────────────────────────────────
  let score = 0;

  // Skills readiness (max 50 points)
  if (skills.length > 0) {
    score += Math.round((readinessScore ?? 0) * 0.5); // Scale 0-100 to 0-50
  }

  // Pathway plan (max 30 points)
  if (pp) {
    score += 5; // Has a plan
    if (ppCurrent) score += 5;
    else score -= 3;
    if (paAssigned) score += 5;
    if (accomIdentified) score += 5;
    if (pp.support_network.length >= 3) score += 5;
    else if (pp.support_network.length >= 1) score += 2;
    if (pp.aspirations.length >= 2) score += 3;
    if (pp.education_employment_training && pp.education_employment_training.length > 0 && !pp.education_employment_training.toLowerCase().includes("disengaged")) score += 2;
  } else if (child_age >= 16) {
    score -= 10; // No plan when should have one
  }

  // Review freshness (max 10 points)
  if (latest) {
    const reviewAge = daysAgo(today, latest.review_date);
    if (reviewAge <= 30) score += 10;
    else if (reviewAge <= 60) score += 7;
    else if (reviewAge <= 90) score += 4;
    else if (reviewAge <= 180) score += 1;
    // Older than 180d: no points
  }

  // Child voice included (max 5 points)
  if (latest?.child_view && latest.child_view.length > 0) score += 5;

  score = clamp(Math.round(score), 0, 100);

  // ── Readiness Status ─────────────────────────────────────────────────
  const readiness_status: ReadinessStatus =
    skills.length === 0 && !pp ? "insufficient_data" :
    score >= 75 ? "well_prepared" :
    score >= 60 ? "on_track" :
    score >= 45 ? "developing" :
    score >= 30 ? "behind" :
    "at_risk";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`${child_name}'s independence readiness is ${readiness_status.replace(/_/g, " ")}`);
  if (skills.length > 0) {
    parts.push(`${independentCount + competentCount}/${skills.length} skills at competent or above`);
  }
  if (pp && reviewOverdue) parts.push("pathway plan review overdue");
  if (child_age >= 16 && !pp) parts.push("no pathway plan in place");
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (independentCount >= 2) {
    const indNames = skills.filter((s) => s.proficiency === "independent").map((s) => s.name).join(", ");
    strengths.push(`${child_name} is fully independent in ${independentCount} skill area${independentCount !== 1 ? "s" : ""}: ${indNames}.`);
  }

  if ((readinessScore ?? 0) >= 70) {
    strengths.push(`Overall readiness score of ${readinessScore}% — ${child_name} is making strong progress toward independent living.`);
  }

  if (pp && ppCurrent && paAssigned && accomIdentified) {
    strengths.push("Pathway plan is current with PA assigned and accommodation identified — comprehensive leaving care preparation evidenced.");
  }

  if (pp && pp.support_network.length >= 4) {
    strengths.push(`Strong support network of ${pp.support_network.length} identified contacts — providing a safety net for transition.`);
  }

  if (latest?.child_view && latest.child_view.length > 0) {
    strengths.push("Child's voice is captured in independence planning — evidencing participation in own pathway.");
  }

  if (pp && pp.aspirations.length >= 2) {
    strengths.push(`Clear aspirations identified: ${pp.aspirations.join(", ")}. Goals give ${child_name} direction and motivation.`);
  }

  if (competentCount + independentCount >= skills.length * 0.7 && skills.length >= 3) {
    strengths.push("Majority of life skills at competent or independent level — transition readiness is strong.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (child_age >= 16 && !pp) {
    concerns.push(`${child_name} is ${child_age} with no pathway plan in place — all young people aged 16+ must have an up-to-date pathway plan (Children (Leaving Care) Act 2000).`);
  }

  if (pp && reviewOverdue) {
    concerns.push(`Pathway plan review is overdue (last: ${ppReviewDate ?? "unknown"}) — reviews must occur at least every 6 months.`);
  }

  if (pp && !paAssigned) {
    concerns.push("No personal advisor assigned — every eligible child must have a dedicated PA for leaving care support.");
  }

  if (child_age >= 17 && !accomIdentified && pp) {
    concerns.push("Accommodation not yet identified for a 17-year-old — accommodation planning must be in place well before 18th birthday.");
  }

  if (notStartedCount >= 2 && child_age >= 16) {
    const notStartedNames = skills.filter((s) => s.proficiency === "not_started").map((s) => s.name).join(", ");
    concerns.push(`${notStartedCount} life skills not yet started: ${notStartedNames}. These gaps need addressing before transition.`);
  }

  if (emergingCount + notStartedCount >= skills.length * 0.5 && skills.length >= 3 && child_age >= 17) {
    concerns.push("Majority of life skills are at emerging or not started level at age 17 — accelerated support needed to build readiness before transition.");
  }

  if (latest && daysAgo(today, latest.review_date) > 90) {
    concerns.push(`Independence skills assessment is over 90 days old (last: ${latest.review_date.slice(0, 10)}) — regular reviews ensure skills progression is tracked and supported.`);
  }

  if (pp && pp.support_network.length <= 1) {
    concerns.push("Very limited support network identified — young people leaving care need multiple sources of support for a successful transition.");
  }

  if (pp && pp.education_employment_training && pp.education_employment_training.toLowerCase().includes("disengaged")) {
    concerns.push(`${child_name} is currently disengaged from education, employment, or training — NEET status must be addressed in pathway plan.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: IndependenceRecommendation[] = [];
  let rank = 0;

  if (child_age >= 16 && !pp) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Develop a pathway plan for ${child_name} urgently. Assign a personal advisor and begin transition assessment — this is a statutory requirement for all 16+ looked after children.`,
      urgency: "immediate",
      domain: "pathway_plan",
      regulatory_ref: "Leaving Care Act 2000",
    });
  }

  if (pp && reviewOverdue) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Schedule pathway plan review meeting. Involve the young person, PA, social worker, and key worker. Reviews must occur at least every 6 months.",
      urgency: "immediate",
      domain: "pathway_plan",
      regulatory_ref: "Leaving Care Act 2000",
    });
  }

  if (pp && !paAssigned) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Allocate a personal advisor. Every eligible care leaver is entitled to PA support from age 16 until at least 25.",
      urgency: "immediate",
      domain: "leaving_care",
      regulatory_ref: "CSWA 2017",
    });
  }

  if (child_age >= 17 && !accomIdentified && pp) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Urgently progress accommodation planning. Explore supported lodgings, semi-independent, or foyer options. Submit Setting Up Home Allowance application.",
      urgency: "soon",
      domain: "accommodation",
      regulatory_ref: "Leaving Care Act 2000",
    });
  }

  if (notStartedCount >= 2 && child_age >= 16) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Begin targeted work on not-started skills. Create a structured programme with the young person to address gaps — skills development must be practical, not classroom-based.`,
      urgency: "soon",
      domain: "skills",
      regulatory_ref: "Reg 5",
    });
  }

  if (pp && pp.education_employment_training && pp.education_employment_training.toLowerCase().includes("disengaged")) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Re-engage ${child_name} with education, employment, or training. Explore vocational options, apprenticeships, or supported EET programmes. NEET status is a risk factor for poor outcomes.`,
      urgency: "soon",
      domain: "eet",
      regulatory_ref: "Leaving Care Act 2000",
    });
  }

  if (latest && daysAgo(today, latest.review_date) > 90) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Schedule independence skills review. Assess progress, update proficiency levels, and adjust targets with the young person.",
      urgency: "planned",
      domain: "skills",
      regulatory_ref: "Reg 5",
    });
  }

  if (pp && pp.support_network.length <= 1) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Work with the young person to identify and build a broader support network. Consider mentoring services, peer support, community connections, and family reconnection where safe.",
      urgency: "planned",
      domain: "support_network",
      regulatory_ref: "CSWA 2017",
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: IndependenceInsight[] = [];

  if (readiness_status === "at_risk") {
    insights.push({
      severity: "critical",
      text: `${child_name}'s independence readiness is at risk. Significant gaps in life skills, pathway planning, or support network require urgent intervention. Ofsted inspectors will examine whether the home is actively preparing children for adulthood — Reg 5 and the Leaving Care Act set clear expectations.`,
    });
  }

  if (child_age >= 17 && notStartedCount + emergingCount >= skills.length * 0.5 && skills.length >= 3) {
    insights.push({
      severity: "critical",
      text: `${child_name} is ${child_age} with ${notStartedCount + emergingCount} of ${skills.length} skills at emerging or below. With potential transition approaching, this gap creates a significant risk of poor outcomes. Intensive, structured skills development is needed immediately.`,
    });
  }

  if (pp && reviewOverdue && !accomIdentified) {
    insights.push({
      severity: "warning",
      text: `Pathway plan review overdue AND accommodation not identified. ${child_name} needs clarity on their future living situation — uncertainty about housing is a major source of anxiety for care leavers.`,
    });
  }

  if (pp && pp.risks.length >= 2) {
    insights.push({
      severity: "warning",
      text: `${pp.risks.length} transition risks identified in pathway plan: ${pp.risks.join(", ")}. Ensure mitigation strategies are documented and actively monitored.`,
    });
  }

  if (readiness_status === "well_prepared") {
    insights.push({
      severity: "positive",
      text: `${child_name} is well prepared for independence. Strong skills base, current pathway plan, and clear aspirations demonstrate excellent preparation for adulthood. This is exactly what Ofsted looks for under "preparation for independence and adulthood."`,
    });
  }

  if (readiness_status === "on_track" || readiness_status === "well_prepared") {
    insights.push({
      severity: "positive",
      text: `${child_name}'s independence trajectory is ${readiness_status.replace(/_/g, " ")} with a readiness score of ${score}%. Continued consistent support will build confidence and capability for a successful transition.`,
    });
  }

  if (latest?.child_view && latest.child_view.length > 0 && pp && pp.aspirations.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${child_name}'s voice is captured in independence planning with clear aspirations. Young person-centred preparation is a hallmark of good practice and positive Ofsted outcomes.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    child_age,
    readiness_status,
    readiness_score: score,
    headline,
    skills_overview,
    pathway_compliance,
    child_voice: latest?.child_view ?? null,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
