// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INDEPENDENCE SKILLS READINESS INTELLIGENCE ENGINE
// Home-level: aggregates independence skills records, pathway plans, and young
// people data to assess how well the home is preparing children for
// independence — critical for Ofsted's assessment of leaving care preparation
// and life skills development.
// CHR 2015 Reg 12: "Promoting independence and life skills."
// SCCIF: "Children are well prepared for adulthood."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface IndependenceSkillInput {
  id: string;
  name: string;
  category: string; // "cooking" | "budgeting" | "laundry" | "travel" | "health" | "communication" | "housing"
  proficiency: string; // "not_started" | "emerging" | "developing" | "competent" | "independent"
  has_evidence: boolean;
  has_next_step: boolean;
  has_target_date: boolean;
  target_date: string | null;
  last_assessed: string | null;
}

export interface IndependenceRecordInput {
  id: string;
  child_id: string;
  review_date: string; // ISO date
  reviewer: string;
  overall_readiness: number; // 0-100
  skills: IndependenceSkillInput[];
  strengths_count: number;
  areas_for_development_count: number;
  has_child_view: boolean;
  has_pathway_notes: boolean;
  created_at: string;
}

export interface PathwayPlanInput {
  id: string;
  child_id: string;
  status: string; // "active" | "draft" | "completed" | "overdue"
  last_reviewed: string | null;
  has_goals: boolean;
  goals_count: number;
  goals_on_track: number;
  has_child_voice: boolean;
  has_accommodation_plan: boolean;
  has_financial_plan: boolean;
  has_health_plan: boolean;
  has_education_employment_plan: boolean;
  created_at: string;
}

export interface IndependenceSkillsReadinessInput {
  today: string;
  total_children: number;
  records: IndependenceRecordInput[];
  pathway_plans: PathwayPlanInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type IndependenceReadinessRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface IndependenceSkillsReadinessResult {
  readiness_rating: IndependenceReadinessRating;
  readiness_score: number; // 0-100
  headline: string;
  total_records: number;
  children_assessed: number; // unique child_ids with records
  average_readiness: number; // avg overall_readiness across records
  child_view_rate: number; // % of records with child view
  evidence_rate: number; // % of skills with evidence
  next_step_rate: number; // % of skills with next_step
  skill_progression_rate: number; // % of skills at developing or above
  pathway_plan_rate: number; // % of children with active pathway plan
  pathway_child_voice_rate: number; // % of pathway plans with child voice
  review_currency_rate: number; // % of records reviewed within 90 days
  category_coverage: number; // avg distinct categories per child
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

const PROFICIENCY_VALUES: Record<string, number> = {
  not_started: 0,
  emerging: 1,
  developing: 2,
  competent: 3,
  independent: 4,
};

function proficiencyValue(p: string): number {
  return PROFICIENCY_VALUES[p] ?? 0;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.abs(Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)));
}

function ratingFromScore(score: number): IndependenceReadinessRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeIndependenceSkillsReadiness(
  input: IndependenceSkillsReadinessInput,
): IndependenceSkillsReadinessResult {
  const { today, total_children, records, pathway_plans } = input;

  // ── Special case: no data, no children → insufficient_data ────────────
  if (total_children === 0 && records.length === 0 && pathway_plans.length === 0) {
    return {
      readiness_rating: "insufficient_data",
      readiness_score: 0,
      headline: "No children registered — unable to assess independence skills readiness.",
      total_records: 0,
      children_assessed: 0,
      average_readiness: 0,
      child_view_rate: 0,
      evidence_rate: 0,
      next_step_rate: 0,
      skill_progression_rate: 0,
      pathway_plan_rate: 0,
      pathway_child_voice_rate: 0,
      review_currency_rate: 0,
      category_coverage: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Special case: children present but no records and no plans ─────────
  if (records.length === 0 && pathway_plans.length === 0 && total_children > 0) {
    return {
      readiness_rating: "inadequate",
      readiness_score: 18,
      headline: "No independence skills assessments or pathway plans exist — children are not being prepared for independence.",
      total_records: 0,
      children_assessed: 0,
      average_readiness: 0,
      child_view_rate: 0,
      evidence_rate: 0,
      next_step_rate: 0,
      skill_progression_rate: 0,
      pathway_plan_rate: 0,
      pathway_child_voice_rate: 0,
      review_currency_rate: 0,
      category_coverage: 0,
      strengths: [],
      concerns: [
        "No independence skills records exist for any child — Ofsted will identify this as a significant gap in leaving care preparation.",
        "No pathway plans are in place — the Children (Leaving Care) Act 2000 requires pathway plans for all eligible young people.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation: "Immediately begin independence skills assessments for all children to establish baseline readiness levels.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12",
        },
        {
          rank: 2,
          recommendation: "Create pathway plans for all eligible young people as required by the Children (Leaving Care) Act 2000.",
          urgency: "immediate",
          regulatory_ref: "Children (Leaving Care) Act 2000",
        },
      ],
      insights: [
        {
          text: "No independence assessment data exists. Ofsted inspectors will view this as a fundamental failure to prepare children for adulthood — this is likely to result in an inadequate rating for this area.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Core metrics ──────────────────────────────────────────────────────

  // Total records
  const total_records = records.length;

  // Children assessed (unique child_ids)
  const assessedChildIds = new Set(records.map((r) => r.child_id));
  const children_assessed = assessedChildIds.size;

  // Average readiness
  const sumReadiness = records.reduce((acc, r) => acc + r.overall_readiness, 0);
  const average_readiness = total_records > 0 ? Math.round(sumReadiness / total_records) : 0;

  // Child view rate
  const recordsWithChildView = records.filter((r) => r.has_child_view).length;
  const child_view_rate = pct(recordsWithChildView, total_records);

  // All skills across all records
  const allSkills = records.flatMap((r) => r.skills);
  const totalSkills = allSkills.length;

  // Evidence rate
  const skillsWithEvidence = allSkills.filter((s) => s.has_evidence).length;
  const evidence_rate = pct(skillsWithEvidence, totalSkills);

  // Next step rate
  const skillsWithNextStep = allSkills.filter((s) => s.has_next_step).length;
  const next_step_rate = pct(skillsWithNextStep, totalSkills);

  // Skill progression rate (% at developing or above, i.e. proficiency >= 2)
  const skillsProgressing = allSkills.filter(
    (s) => proficiencyValue(s.proficiency) >= 2,
  ).length;
  const skill_progression_rate = pct(skillsProgressing, totalSkills);

  // Pathway plan rate (% of children with active pathway plan)
  const activePlans = pathway_plans.filter((p) => p.status === "active");
  const childrenWithActivePlan = new Set(activePlans.map((p) => p.child_id)).size;
  const pathway_plan_rate = pct(childrenWithActivePlan, total_children);

  // Pathway child voice rate (% of pathway plans with child voice)
  const plansWithChildVoice = pathway_plans.filter((p) => p.has_child_voice).length;
  const pathway_child_voice_rate = pct(plansWithChildVoice, pathway_plans.length);

  // Review currency rate (% of records reviewed within 90 days of today)
  const currentRecords = records.filter(
    (r) => daysBetween(r.review_date, today) <= 90,
  ).length;
  const review_currency_rate = pct(currentRecords, total_records);

  // Category coverage (avg distinct categories per child)
  const categoriesByChild = new Map<string, Set<string>>();
  for (const record of records) {
    for (const skill of record.skills) {
      if (!categoriesByChild.has(record.child_id)) {
        categoriesByChild.set(record.child_id, new Set());
      }
      categoriesByChild.get(record.child_id)!.add(skill.category);
    }
  }
  let totalCategories = 0;
  for (const cats of categoriesByChild.values()) {
    totalCategories += cats.size;
  }
  const childrenWithSkills = categoriesByChild.size;
  const category_coverage = childrenWithSkills > 0
    ? Math.round(totalCategories / childrenWithSkills)
    : 0;

  // ── Score calculation ─────────────────────────────────────────────────

  let score = 52; // base

  // Bonus: average_readiness
  if (average_readiness >= 70) score += 4;
  else if (average_readiness >= 50) score += 2;

  // Bonus: child_view_rate
  if (child_view_rate >= 90) score += 4;
  else if (child_view_rate >= 70) score += 2;

  // Bonus: evidence_rate
  if (evidence_rate >= 90) score += 4;
  else if (evidence_rate >= 75) score += 2;

  // Bonus: next_step_rate
  if (next_step_rate >= 90) score += 3;
  else if (next_step_rate >= 75) score += 1;

  // Bonus: skill_progression_rate
  if (skill_progression_rate >= 70) score += 4;
  else if (skill_progression_rate >= 50) score += 2;

  // Bonus: pathway_plan_rate
  if (pathway_plan_rate >= 100) score += 4;
  else if (pathway_plan_rate >= 80) score += 2;

  // Bonus: review_currency_rate
  if (review_currency_rate >= 90) score += 3;
  else if (review_currency_rate >= 70) score += 1;

  // Bonus: category_coverage
  if (category_coverage >= 5) score += 2;
  else if (category_coverage >= 3) score += 1;

  // Penalty: child_view_rate < 30%
  if (child_view_rate < 30) score -= 5;

  // Penalty: evidence_rate < 40%
  if (evidence_rate < 40) score -= 5;

  // Penalty: average_readiness < 30
  if (average_readiness < 30) score -= 5;

  // Penalty: review_currency_rate < 50%
  if (review_currency_rate < 50) score -= 3;

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  const readiness_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (average_readiness >= 70)
    strengths.push(
      `Average independence readiness is ${average_readiness}% — children are demonstrating strong preparation for adulthood.`,
    );

  if (child_view_rate >= 90)
    strengths.push(
      `${child_view_rate}% of independence records include the child's own views — excellent practice under Reg 12.`,
    );

  if (evidence_rate >= 90)
    strengths.push(
      `${evidence_rate}% of skills have supporting evidence recorded — robust documentation of independence development.`,
    );

  if (skill_progression_rate >= 70)
    strengths.push(
      `${skill_progression_rate}% of skills are at developing level or above — children are making meaningful progress.`,
    );

  if (pathway_plan_rate >= 100)
    strengths.push(
      "All children have active pathway plans — comprehensive leaving care coverage in line with the Children (Leaving Care) Act 2000.",
    );
  else if (pathway_plan_rate >= 80)
    strengths.push(
      `${pathway_plan_rate}% of children have active pathway plans — strong coverage for leaving care preparation.`,
    );

  if (review_currency_rate >= 90)
    strengths.push(
      `${review_currency_rate}% of independence records have been reviewed within 90 days — assessments are current and actively maintained.`,
    );

  if (next_step_rate >= 90)
    strengths.push(
      `${next_step_rate}% of skills have next steps defined — clear progression planning is in place.`,
    );

  if (category_coverage >= 5)
    strengths.push(
      `Children are assessed across an average of ${category_coverage} skill categories — broad coverage of independence domains.`,
    );

  if (pathway_child_voice_rate >= 90)
    strengths.push(
      `${pathway_child_voice_rate}% of pathway plans include the child's voice — strong participation in planning.`,
    );

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (child_view_rate < 30)
    concerns.push(
      `Only ${child_view_rate}% of independence records include the child's views — Reg 12 requires that children's wishes and feelings are sought and recorded.`,
    );

  if (evidence_rate < 40)
    concerns.push(
      `Only ${evidence_rate}% of skills have evidence recorded — assessments lack the documentation needed for Ofsted scrutiny.`,
    );

  if (average_readiness < 30)
    concerns.push(
      `Average independence readiness is only ${average_readiness}% — children are significantly underprepared for independence.`,
    );

  if (review_currency_rate < 50)
    concerns.push(
      `Only ${review_currency_rate}% of records have been reviewed in the last 90 days — assessments are going stale.`,
    );

  if (pathway_plan_rate < 50)
    concerns.push(
      `Only ${pathway_plan_rate}% of children have active pathway plans — the Children (Leaving Care) Act 2000 requires plans for all eligible young people.`,
    );

  if (skill_progression_rate < 30 && totalSkills > 0)
    concerns.push(
      `Only ${skill_progression_rate}% of skills are at developing level or above — most children are stuck at early stages.`,
    );

  if (next_step_rate < 40 && totalSkills > 0)
    concerns.push(
      `Only ${next_step_rate}% of skills have next steps defined — progression planning is inadequate.`,
    );

  if (pathway_child_voice_rate < 40 && pathway_plans.length > 0)
    concerns.push(
      `Only ${pathway_child_voice_rate}% of pathway plans include the child's voice — Reg 5 requires children to participate in their own planning.`,
    );

  if (category_coverage < 3 && childrenWithSkills > 0)
    concerns.push(
      `Children are assessed across only ${category_coverage} skill categories on average — independence assessment is too narrow.`,
    );

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[] = [];
  let rank = 1;

  if (child_view_rate < 70)
    recommendations.push({
      rank: rank++,
      recommendation: `Increase child participation in independence assessments — currently ${child_view_rate}% include the child's views.`,
      urgency: child_view_rate < 30 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });

  if (evidence_rate < 75)
    recommendations.push({
      rank: rank++,
      recommendation: `Ensure all skills assessments include supporting evidence — currently ${evidence_rate}% documented.`,
      urgency: evidence_rate < 40 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });

  if (pathway_plan_rate < 80)
    recommendations.push({
      rank: rank++,
      recommendation: `Create active pathway plans for all eligible children — currently ${pathway_plan_rate}% covered.`,
      urgency: pathway_plan_rate < 50 ? "immediate" : "soon",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });

  if (review_currency_rate < 70)
    recommendations.push({
      rank: rank++,
      recommendation: `Review overdue independence assessments — ${100 - review_currency_rate}% of records are more than 90 days old.`,
      urgency: review_currency_rate < 50 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });

  if (skill_progression_rate < 50 && totalSkills > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Focus on moving children beyond emerging skill levels through structured teaching and practice opportunities.",
      urgency: skill_progression_rate < 30 ? "immediate" : "soon",
    });

  if (next_step_rate < 75 && totalSkills > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Define next steps for all skills — only ${next_step_rate}% currently have progression plans.`,
      urgency: "planned",
    });

  if (category_coverage < 5 && childrenWithSkills > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Broaden independence skills assessment to cover more categories — currently averaging ${category_coverage} per child.`,
      urgency: "planned",
    });

  if (average_readiness < 50 && total_records > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Address low overall readiness scores — average is ${average_readiness}%, indicating children need more intensive independence support.`,
      urgency: average_readiness < 30 ? "immediate" : "soon",
    });

  if (pathway_child_voice_rate < 70 && pathway_plans.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Ensure pathway plans capture the child's voice — currently ${pathway_child_voice_rate}% include child participation.`,
      urgency: pathway_child_voice_rate < 40 ? "immediate" : "planned",
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  if (child_view_rate < 30)
    insights.push({
      text: `Only ${child_view_rate}% of independence records include the child's own views. Ofsted inspectors will identify this as a failure to comply with Reg 12 — children must be active participants in their independence planning.`,
      severity: "critical",
    });

  if (evidence_rate < 40)
    insights.push({
      text: `Only ${evidence_rate}% of skills have evidence recorded. Without documented evidence, independence assessments lack credibility and cannot demonstrate progress to Ofsted.`,
      severity: "critical",
    });

  if (average_readiness < 30)
    insights.push({
      text: `Average readiness is ${average_readiness}%. Children are significantly underprepared for independence — Ofsted will view this as a systemic failure in the home's approach to life skills development under Reg 12.`,
      severity: "critical",
    });

  if (pathway_plan_rate < 50)
    insights.push({
      text: `Only ${pathway_plan_rate}% of children have active pathway plans. The Children (Leaving Care) Act 2000 requires pathway plans for all eligible young people — this gap puts the home at regulatory risk.`,
      severity: "critical",
    });

  if (review_currency_rate < 50)
    insights.push({
      text: `${100 - review_currency_rate}% of independence records are more than 90 days old. Stale assessments cannot accurately reflect children's current skills and may mislead care planning.`,
      severity: "warning",
    });

  if (skill_progression_rate < 50 && totalSkills > 0)
    insights.push({
      text: `Only ${skill_progression_rate}% of skills are at developing level or above. This suggests independence teaching is not translating into meaningful skill acquisition.`,
      severity: "warning",
    });

  if (next_step_rate < 50 && totalSkills > 0)
    insights.push({
      text: `Only ${next_step_rate}% of skills have next steps defined. Without clear progression plans, skills development risks stalling.`,
      severity: "warning",
    });

  if (average_readiness >= 70)
    insights.push({
      text: `Average readiness of ${average_readiness}% demonstrates that independence skills development is a genuine strength of this home — children are being effectively prepared for adulthood.`,
      severity: "positive",
    });

  if (child_view_rate >= 90)
    insights.push({
      text: `${child_view_rate}% of assessments include the child's voice — this exemplary practice ensures children feel ownership of their independence journey, as required by Reg 12.`,
      severity: "positive",
    });

  if (evidence_rate >= 90 && skill_progression_rate >= 70)
    insights.push({
      text: "Strong evidence documentation combined with high skill progression demonstrates a well-structured, accountable approach to independence development.",
      severity: "positive",
    });

  if (pathway_plan_rate >= 100 && pathway_child_voice_rate >= 90)
    insights.push({
      text: "All children have active pathway plans with strong child voice — this comprehensive approach to leaving care preparation will be positively noted by Ofsted.",
      severity: "positive",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (readiness_rating === "outstanding") {
    headline = `Excellent independence skills readiness: ${average_readiness}% average readiness, ${children_assessed} of ${total_children} children assessed with strong evidence and progression.`;
  } else if (readiness_rating === "good") {
    headline = `Good independence preparation with ${average_readiness}% average readiness and ${children_assessed} children assessed — some areas for further development.`;
  } else if (readiness_rating === "adequate") {
    headline = `Independence skills preparation in place but ${concerns.length > 0 ? concerns.length + " concern(s) identified" : "needs strengthening"} — focused improvement needed.`;
  } else {
    headline = `Independence skills readiness requires urgent attention — ${concerns.length} concern(s) identified across assessment and planning.`;
  }

  return {
    readiness_rating,
    readiness_score: score,
    headline,
    total_records,
    children_assessed,
    average_readiness,
    child_view_rate,
    evidence_rate,
    next_step_rate,
    skill_progression_rate,
    pathway_plan_rate,
    pathway_child_voice_rate,
    review_currency_rate,
    category_coverage,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
