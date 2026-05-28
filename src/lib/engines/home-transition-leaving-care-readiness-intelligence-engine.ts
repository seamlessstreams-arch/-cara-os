// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSITION & LEAVING CARE READINESS INTELLIGENCE ENGINE
// Monitors how well the home prepares young people for transitions and
// independence — pathway planning, leaving care preparation, transition
// support, independence pathways, and aftercare planning.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (Promoting independence), Reg 7 (Welfare of children).
// Children (Leaving Care) Act 2000.
// SCCIF: "Experiences and progress of children — preparation for adulthood".
// Store keys: transitionPlanningRecords, pathwayPlans, leavingCarePackages,
//             independencePathways, afterCareRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TransitionPlanningInput {
  id: string;
  child_id: string;
  plan_date: string;
  transition_type: "placement_move" | "independence" | "education" | "step_down";
  goals_set: boolean;
  child_voice_captured: boolean;
  multi_agency_involved: boolean;
  key_worker_assigned: boolean;
  reviewed: boolean;
  next_review_date: string;
  active: boolean;
  created_at: string;
}

export interface PathwayPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  accommodation_plan: boolean;
  education_employment_plan: boolean;
  financial_plan: boolean;
  health_plan: boolean;
  support_network_identified: boolean;
  personal_advisor_assigned: boolean;
  last_reviewed: string;
  current: boolean;
  created_at: string;
}

export interface LeavingCarePackageInput {
  id: string;
  child_id: string;
  package_date: string;
  housing_arranged: boolean;
  financial_support_confirmed: boolean;
  education_training_plan: boolean;
  health_passport_provided: boolean;
  emotional_support_plan: boolean;
  life_skills_assessed: boolean;
  documentation_complete: boolean;
  created_at: string;
}

export interface IndependencePathwayInput {
  id: string;
  child_id: string;
  assessment_date: string;
  cooking_skills_assessed: boolean;
  budgeting_skills_assessed: boolean;
  self_care_assessed: boolean;
  travel_skills_assessed: boolean;
  social_skills_assessed: boolean;
  overall_readiness_score: number;
  created_at: string;
}

export interface AfterCareRecordInput {
  id: string;
  child_id: string;
  contact_date: string;
  contact_type: "visit" | "phone" | "digital";
  wellbeing_checked: boolean;
  support_needs_identified: boolean;
  support_provided: boolean;
  next_contact_date: string;
  created_at: string;
}

export interface TransitionLeavingCareReadinessInput {
  today: string;
  total_children: number;
  transition_planning_records: TransitionPlanningInput[];
  pathway_plans: PathwayPlanInput[];
  leaving_care_packages: LeavingCarePackageInput[];
  independence_pathways: IndependencePathwayInput[];
  aftercare_records: AfterCareRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TransitionReadinessRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TransitionReadinessInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface TransitionReadinessRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface TransitionLeavingCareReadinessResult {
  readiness_rating: TransitionReadinessRating;
  readiness_score: number;
  headline: string;
  total_transition_plans: number;
  transition_plan_coverage_rate: number;
  pathway_plan_currency_rate: number;
  leaving_care_completion_rate: number;
  independence_assessment_rate: number;
  aftercare_contact_rate: number;
  child_voice_in_transition_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: TransitionReadinessRecommendation[];
  insights: TransitionReadinessInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): TransitionReadinessRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: TransitionReadinessRating,
  score: number,
  headline: string,
): TransitionLeavingCareReadinessResult {
  return {
    readiness_rating: rating,
    readiness_score: score,
    headline,
    total_transition_plans: 0,
    transition_plan_coverage_rate: 0,
    pathway_plan_currency_rate: 0,
    leaving_care_completion_rate: 0,
    independence_assessment_rate: 0,
    aftercare_contact_rate: 0,
    child_voice_in_transition_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeTransitionLeavingCareReadiness(
  input: TransitionLeavingCareReadinessInput,
): TransitionLeavingCareReadinessResult {
  const {
    today,
    total_children,
    transition_planning_records,
    pathway_plans,
    leaving_care_packages,
    independence_pathways,
    aftercare_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    transition_planning_records.length === 0 &&
    pathway_plans.length === 0 &&
    leaving_care_packages.length === 0 &&
    independence_pathways.length === 0 &&
    aftercare_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess transition and leaving care readiness.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No transition or leaving care data recorded despite children on placement — transition readiness requires urgent attention.",
      ),
      concerns: [
        "No transition planning records, pathway plans, leaving care packages, independence pathways, or aftercare records exist despite children being on placement — the home cannot evidence that children are being prepared for transitions or independence.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish transition planning practices including pathway plans for all eligible young people, independence skills assessments, and leaving care preparation in line with CHR 2015 Reg 12 and the Children (Leaving Care) Act 2000.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every young person aged 16+ has a current pathway plan that addresses accommodation, education/employment, financial planning, health, and support networks, with a named personal adviser.",
          urgency: "immediate",
          regulatory_ref: "Children (Leaving Care) Act 2000",
        },
      ],
      insights: [
        {
          text: "The complete absence of transition and leaving care records means Ofsted cannot verify that the home is preparing young people for adulthood and independence. This is a fundamental failure under Reg 12 and the Children (Leaving Care) Act 2000.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Transition planning metrics ---
  const totalTransitionPlans = transition_planning_records.length;
  const activePlans = transition_planning_records.filter((t) => t.active);

  // Unique children with at least one active transition plan
  const childrenWithTransitionPlan = new Set(
    activePlans.map((t) => t.child_id),
  ).size;
  const transitionPlanCoverageRate = pct(childrenWithTransitionPlan, total_children);

  // Child voice captured in transition plans
  const plansWithChildVoice = transition_planning_records.filter(
    (t) => t.child_voice_captured,
  ).length;
  const childVoiceInTransitionRate = pct(plansWithChildVoice, totalTransitionPlans);

  // Multi-agency involvement
  const plansWithMultiAgency = transition_planning_records.filter(
    (t) => t.multi_agency_involved,
  ).length;
  const multiAgencyInvolvementRate = pct(plansWithMultiAgency, totalTransitionPlans);

  // Key worker allocation
  const plansWithKeyWorker = transition_planning_records.filter(
    (t) => t.key_worker_assigned,
  ).length;
  const keyWorkerAllocationRate = pct(plansWithKeyWorker, totalTransitionPlans);

  // Review timeliness: plans with next_review_date not overdue
  const plansWithReviewDate = transition_planning_records.filter(
    (t) => t.next_review_date && t.next_review_date.length > 0,
  ).length;
  const overduePlans = transition_planning_records.filter(
    (t) => t.next_review_date && t.next_review_date < today,
  ).length;
  const reviewTimelinessRate = plansWithReviewDate > 0
    ? pct(plansWithReviewDate - overduePlans, plansWithReviewDate)
    : 0;

  // Plans with goals set
  const plansWithGoals = transition_planning_records.filter(
    (t) => t.goals_set,
  ).length;
  const goalsSetRate = pct(plansWithGoals, totalTransitionPlans);

  // Plans reviewed
  const plansReviewed = transition_planning_records.filter(
    (t) => t.reviewed,
  ).length;
  const plansReviewedRate = pct(plansReviewed, totalTransitionPlans);

  // --- Pathway plan metrics ---
  const totalPathwayPlans = pathway_plans.length;
  const currentPathwayPlans = pathway_plans.filter((p) => p.current);

  // Unique children with current pathway plan
  const childrenWithPathwayPlan = new Set(
    currentPathwayPlans.map((p) => p.child_id),
  ).size;

  // Pathway plan currency: last_reviewed within 180 days
  const oneEightyDaysAgo = new Date(today);
  oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
  const oneEightyDaysAgoStr = oneEightyDaysAgo.toISOString().slice(0, 10);

  const recentlyReviewedPathways = pathway_plans.filter(
    (p) => p.current && p.last_reviewed >= oneEightyDaysAgoStr,
  ).length;
  const pathwayPlanCurrencyRate = pct(recentlyReviewedPathways, currentPathwayPlans.length);

  // Pathway plan completeness: has all core elements
  const completePathwayPlans = pathway_plans.filter(
    (p) =>
      p.current &&
      p.accommodation_plan &&
      p.education_employment_plan &&
      p.financial_plan &&
      p.health_plan &&
      p.support_network_identified,
  ).length;
  const pathwayCompletenessRate = pct(completePathwayPlans, currentPathwayPlans.length);

  // Personal adviser assigned
  const pathwaysWithAdvisor = pathway_plans.filter(
    (p) => p.current && p.personal_advisor_assigned,
  ).length;
  const personalAdvisorRate = pct(pathwaysWithAdvisor, currentPathwayPlans.length);

  // --- Leaving care package metrics ---
  const totalLeavingCarePackages = leaving_care_packages.length;

  // Leaving care package completion: all elements complete
  const completeLeavingCarePackages = leaving_care_packages.filter(
    (l) =>
      l.housing_arranged &&
      l.financial_support_confirmed &&
      l.education_training_plan &&
      l.health_passport_provided &&
      l.emotional_support_plan &&
      l.life_skills_assessed &&
      l.documentation_complete,
  ).length;
  const leavingCareCompletionRate = pct(completeLeavingCarePackages, totalLeavingCarePackages);

  // Individual element rates
  const housingArrangedRate = pct(
    leaving_care_packages.filter((l) => l.housing_arranged).length,
    totalLeavingCarePackages,
  );
  const financialSupportRate = pct(
    leaving_care_packages.filter((l) => l.financial_support_confirmed).length,
    totalLeavingCarePackages,
  );
  const healthPassportProvidedRate = pct(
    leaving_care_packages.filter((l) => l.health_passport_provided).length,
    totalLeavingCarePackages,
  );

  // --- Independence pathway metrics ---
  const totalIndependencePathways = independence_pathways.length;

  // Unique children with independence assessment
  const childrenWithIndependenceAssessment = new Set(
    independence_pathways.map((i) => i.child_id),
  ).size;
  const independenceAssessmentRate = pct(childrenWithIndependenceAssessment, total_children);

  // Comprehensive assessment: all skills assessed
  const comprehensiveAssessments = independence_pathways.filter(
    (i) =>
      i.cooking_skills_assessed &&
      i.budgeting_skills_assessed &&
      i.self_care_assessed &&
      i.travel_skills_assessed &&
      i.social_skills_assessed,
  ).length;
  const comprehensiveAssessmentRate = pct(comprehensiveAssessments, totalIndependencePathways);

  // Average readiness score
  const totalReadinessScore = independence_pathways.reduce(
    (sum, i) => sum + (i.overall_readiness_score ?? 0),
    0,
  );
  const avgReadinessScore = totalIndependencePathways > 0
    ? Math.round(totalReadinessScore / totalIndependencePathways)
    : 0;

  // --- Aftercare metrics ---
  const totalAftercareRecords = aftercare_records.length;

  // Unique children with aftercare contact
  const childrenWithAftercare = new Set(
    aftercare_records.map((a) => a.child_id),
  ).size;
  const aftercareContactRate = pct(childrenWithAftercare, total_children);

  // Wellbeing checked
  const aftercareWellbeingChecked = aftercare_records.filter(
    (a) => a.wellbeing_checked,
  ).length;
  const aftercareWellbeingRate = pct(aftercareWellbeingChecked, totalAftercareRecords);

  // Support provided when needs identified
  const aftercareNeedsIdentified = aftercare_records.filter(
    (a) => a.support_needs_identified,
  ).length;
  const aftercareSupportProvided = aftercare_records.filter(
    (a) => a.support_needs_identified && a.support_provided,
  ).length;
  const aftercareSupportRate = pct(aftercareSupportProvided, aftercareNeedsIdentified);

  // Overdue aftercare contacts
  const overdueAftercareContacts = aftercare_records.filter(
    (a) => a.next_contact_date && a.next_contact_date < today,
  ).length;

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // Bonuses sum to exactly 28: 4+4+3+3+3+3+3+2+3 = 28

  let score = 52;

  // --- Bonus 1: transitionPlanCoverageRate (>=90: +4, >=70: +2) ---
  if (transitionPlanCoverageRate >= 90) score += 4;
  else if (transitionPlanCoverageRate >= 70) score += 2;

  // --- Bonus 2: pathwayPlanCurrencyRate (>=90: +4, >=70: +2) ---
  if (pathwayPlanCurrencyRate >= 90) score += 4;
  else if (pathwayPlanCurrencyRate >= 70) score += 2;

  // --- Bonus 3: leavingCareCompletionRate (>=90: +3, >=70: +1) ---
  if (leavingCareCompletionRate >= 90) score += 3;
  else if (leavingCareCompletionRate >= 70) score += 1;

  // --- Bonus 4: independenceAssessmentRate (>=90: +3, >=70: +1) ---
  if (independenceAssessmentRate >= 90) score += 3;
  else if (independenceAssessmentRate >= 70) score += 1;

  // --- Bonus 5: aftercareContactRate (>=90: +3, >=70: +1) ---
  if (aftercareContactRate >= 90) score += 3;
  else if (aftercareContactRate >= 70) score += 1;

  // --- Bonus 6: childVoiceInTransitionRate (>=90: +3, >=70: +1) ---
  if (childVoiceInTransitionRate >= 90) score += 3;
  else if (childVoiceInTransitionRate >= 70) score += 1;

  // --- Bonus 7: multiAgencyInvolvementRate (>=90: +3, >=70: +1) ---
  if (multiAgencyInvolvementRate >= 90) score += 3;
  else if (multiAgencyInvolvementRate >= 70) score += 1;

  // --- Bonus 8: keyWorkerAllocationRate (>=100: +2, >=80: +1) ---
  if (keyWorkerAllocationRate >= 100) score += 2;
  else if (keyWorkerAllocationRate >= 80) score += 1;

  // --- Bonus 9: reviewTimelinessRate (>=90: +3, >=70: +1) ---
  if (reviewTimelinessRate >= 90) score += 3;
  else if (reviewTimelinessRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // transitionPlanCoverageRate < 50 → -5
  if (transitionPlanCoverageRate < 50 && total_children > 0) score -= 5;

  // pathwayPlanCurrencyRate < 50 → -5
  if (pathwayPlanCurrencyRate < 50 && currentPathwayPlans.length > 0) score -= 5;

  // leavingCareCompletionRate < 50 → -4
  if (leavingCareCompletionRate < 50 && totalLeavingCarePackages > 0) score -= 4;

  // independenceAssessmentRate < 50 → -4
  if (independenceAssessmentRate < 50 && total_children > 0) score -= 4;

  score = clamp(score, 0, 100);

  const readiness_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (transitionPlanCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has an active transition plan — the home demonstrates full commitment to preparing children for transitions with individualised planning.",
    );
  } else if (transitionPlanCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${transitionPlanCoverageRate}% of children have an active transition plan — strong coverage of transition planning across the home.`,
    );
  }

  if (pathwayPlanCurrencyRate >= 100 && currentPathwayPlans.length > 0) {
    strengths.push(
      "All pathway plans have been reviewed within the last 6 months — the home maintains current, relevant pathway planning for young people.",
    );
  } else if (pathwayPlanCurrencyRate >= 80 && currentPathwayPlans.length > 0) {
    strengths.push(
      `${pathwayPlanCurrencyRate}% of pathway plans are current — strong pathway plan review practice ensuring plans remain relevant.`,
    );
  }

  if (leavingCareCompletionRate >= 100 && totalLeavingCarePackages > 0) {
    strengths.push(
      "All leaving care packages are fully complete — young people have comprehensive preparation across housing, finance, education, health, and emotional support.",
    );
  } else if (leavingCareCompletionRate >= 80 && totalLeavingCarePackages > 0) {
    strengths.push(
      `${leavingCareCompletionRate}% of leaving care packages are complete — strong leaving care preparation ensuring young people are well-supported.`,
    );
  }

  if (independenceAssessmentRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has had an independence skills assessment — the home proactively evaluates readiness for independent living.",
    );
  } else if (independenceAssessmentRate >= 80 && total_children > 0) {
    strengths.push(
      `${independenceAssessmentRate}% of children have had an independence skills assessment — good coverage of independence readiness evaluation.`,
    );
  }

  if (aftercareContactRate >= 100 && total_children > 0) {
    strengths.push(
      "All children have aftercare contact records — the home maintains strong staying-close support for young people who have moved on.",
    );
  } else if (aftercareContactRate >= 80 && total_children > 0) {
    strengths.push(
      `${aftercareContactRate}% of children have aftercare contact records — good aftercare coverage demonstrating ongoing support.`,
    );
  }

  if (childVoiceInTransitionRate >= 100 && totalTransitionPlans > 0) {
    strengths.push(
      "Child voice is captured in every transition plan — young people are meaningfully involved in decisions about their futures.",
    );
  } else if (childVoiceInTransitionRate >= 80 && totalTransitionPlans > 0) {
    strengths.push(
      `${childVoiceInTransitionRate}% of transition plans capture child voice — strong practice in ensuring young people shape their own transition planning.`,
    );
  }

  if (multiAgencyInvolvementRate >= 100 && totalTransitionPlans > 0) {
    strengths.push(
      "Multi-agency involvement in every transition plan — the home collaborates effectively with external professionals to support transitions.",
    );
  } else if (multiAgencyInvolvementRate >= 80 && totalTransitionPlans > 0) {
    strengths.push(
      `${multiAgencyInvolvementRate}% of transition plans involve multi-agency working — good partnership practice supporting holistic transition planning.`,
    );
  }

  if (keyWorkerAllocationRate >= 100 && totalTransitionPlans > 0) {
    strengths.push(
      "Every transition plan has a key worker assigned — children have a named person supporting them through their transition.",
    );
  } else if (keyWorkerAllocationRate >= 80 && totalTransitionPlans > 0) {
    strengths.push(
      `${keyWorkerAllocationRate}% of transition plans have a key worker assigned — most children have a named person guiding their transition.`,
    );
  }

  if (reviewTimelinessRate >= 90 && plansWithReviewDate > 0) {
    strengths.push(
      `${reviewTimelinessRate}% of transition plan reviews are on schedule — the home proactively maintains review timelines.`,
    );
  }

  if (pathwayCompletenessRate >= 90 && currentPathwayPlans.length > 0) {
    strengths.push(
      `${pathwayCompletenessRate}% of pathway plans address all core areas (accommodation, education, finance, health, support) — comprehensive pathway planning practice.`,
    );
  }

  if (personalAdvisorRate >= 100 && currentPathwayPlans.length > 0) {
    strengths.push(
      "All young people with pathway plans have a personal adviser assigned — statutory requirement under the Children (Leaving Care) Act 2000 is fully met.",
    );
  }

  if (comprehensiveAssessmentRate >= 90 && totalIndependencePathways > 0) {
    strengths.push(
      `${comprehensiveAssessmentRate}% of independence assessments cover all skill domains — thorough evaluation of readiness across cooking, budgeting, self-care, travel, and social skills.`,
    );
  }

  if (aftercareSupportRate >= 90 && aftercareNeedsIdentified > 0) {
    strengths.push(
      `${aftercareSupportRate}% of identified aftercare support needs have been met — the home responds effectively to the ongoing needs of care leavers.`,
    );
  }

  if (aftercareWellbeingRate >= 90 && totalAftercareRecords > 0) {
    strengths.push(
      `${aftercareWellbeingRate}% of aftercare contacts include a wellbeing check — the home prioritises emotional and physical wellbeing in staying-close work.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (transitionPlanCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${transitionPlanCoverageRate}% of children have an active transition plan — the majority of children lack any formal transition planning, representing a significant failure in preparing children for change.`,
    );
  } else if (transitionPlanCoverageRate < 80 && transitionPlanCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Transition plan coverage at ${transitionPlanCoverageRate}% — not all children have formal transition planning in place.`,
    );
  }

  if (pathwayPlanCurrencyRate < 50 && currentPathwayPlans.length > 0) {
    concerns.push(
      `Only ${pathwayPlanCurrencyRate}% of pathway plans are current — the majority of pathway plans have not been reviewed within the last 6 months, meaning plans may no longer reflect young people's needs.`,
    );
  } else if (pathwayPlanCurrencyRate < 80 && pathwayPlanCurrencyRate >= 50 && currentPathwayPlans.length > 0) {
    concerns.push(
      `Pathway plan currency at ${pathwayPlanCurrencyRate}% — some pathway plans have not been recently reviewed and may be outdated.`,
    );
  }

  if (leavingCareCompletionRate < 50 && totalLeavingCarePackages > 0) {
    concerns.push(
      `Only ${leavingCareCompletionRate}% of leaving care packages are complete — the majority of young people do not have all essential leaving care elements in place.`,
    );
  } else if (leavingCareCompletionRate < 80 && leavingCareCompletionRate >= 50 && totalLeavingCarePackages > 0) {
    concerns.push(
      `Leaving care completion rate at ${leavingCareCompletionRate}% — some leaving care packages are missing essential elements.`,
    );
  }

  if (independenceAssessmentRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${independenceAssessmentRate}% of children have had an independence skills assessment — the majority of children's readiness for independent living has not been evaluated.`,
    );
  } else if (independenceAssessmentRate < 80 && independenceAssessmentRate >= 50 && total_children > 0) {
    concerns.push(
      `Independence assessment coverage at ${independenceAssessmentRate}% — not all children have had their independence skills assessed.`,
    );
  }

  if (childVoiceInTransitionRate < 50 && totalTransitionPlans > 0) {
    concerns.push(
      `Only ${childVoiceInTransitionRate}% of transition plans capture child voice — the majority of transition plans are being developed without meaningful input from the young person.`,
    );
  } else if (childVoiceInTransitionRate < 80 && childVoiceInTransitionRate >= 50 && totalTransitionPlans > 0) {
    concerns.push(
      `Child voice captured in ${childVoiceInTransitionRate}% of transition plans — not all young people are meaningfully involved in their transition planning.`,
    );
  }

  if (multiAgencyInvolvementRate < 50 && totalTransitionPlans > 0) {
    concerns.push(
      `Only ${multiAgencyInvolvementRate}% of transition plans involve multi-agency working — transitions are being planned without adequate professional collaboration.`,
    );
  } else if (multiAgencyInvolvementRate < 80 && multiAgencyInvolvementRate >= 50 && totalTransitionPlans > 0) {
    concerns.push(
      `Multi-agency involvement at ${multiAgencyInvolvementRate}% — some transition plans lack input from external professionals.`,
    );
  }

  if (keyWorkerAllocationRate < 80 && totalTransitionPlans > 0) {
    concerns.push(
      `Only ${keyWorkerAllocationRate}% of transition plans have a key worker assigned — some children are navigating transitions without a named person to support them.`,
    );
  }

  if (aftercareContactRate < 50 && total_children > 0 && totalAftercareRecords > 0) {
    concerns.push(
      `Only ${aftercareContactRate}% of children have aftercare contact records — staying-close support is not being provided consistently.`,
    );
  }

  if (overduePlans > 0) {
    concerns.push(
      `${overduePlans} transition plan review${overduePlans !== 1 ? "s" : ""} overdue — young people's transition plans may not reflect their current circumstances.`,
    );
  }

  if (overdueAftercareContacts > 0) {
    concerns.push(
      `${overdueAftercareContacts} aftercare contact${overdueAftercareContacts !== 1 ? "s" : ""} overdue — care leavers may not be receiving timely staying-close support.`,
    );
  }

  if (totalPathwayPlans === 0 && total_children > 0) {
    concerns.push(
      "No pathway plans exist for any young person — the home cannot demonstrate compliance with the Children (Leaving Care) Act 2000 for eligible young people.",
    );
  }

  if (personalAdvisorRate < 80 && currentPathwayPlans.length > 0) {
    concerns.push(
      `Only ${personalAdvisorRate}% of young people with pathway plans have a personal adviser — this is a statutory requirement under the Children (Leaving Care) Act 2000.`,
    );
  }

  if (housingArrangedRate < 50 && totalLeavingCarePackages > 0) {
    concerns.push(
      `Only ${housingArrangedRate}% of leaving care packages have housing arranged — young people risk leaving care without secure accommodation.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: TransitionReadinessRecommendation[] = [];
  let rank = 0;

  if (transitionPlanCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently develop transition plans for all children — every young person should have an individualised plan addressing their transition needs with clear goals, key worker support, and multi-agency involvement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  if (totalPathwayPlans === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create pathway plans for all eligible young people aged 16+ — these must address accommodation, education/employment, financial planning, health, and support networks, with a named personal adviser.",
      urgency: "immediate",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });
  }

  if (childVoiceInTransitionRate < 50 && totalTransitionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every young person's voice is captured in their transition plan — young people must be at the centre of decisions about their future, not passive recipients of plans made for them.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Welfare of children",
    });
  }

  if (leavingCareCompletionRate < 50 && totalLeavingCarePackages > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding leaving care package elements — young people must have housing, financial support, education/training plans, health passports, emotional support plans, and life skills assessments in place before leaving care.",
      urgency: "immediate",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });
  }

  if (independenceAssessmentRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Carry out independence skills assessments for all children — these should cover cooking, budgeting, self-care, travel, and social skills to identify areas where young people need support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  if (personalAdvisorRate < 80 && currentPathwayPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assign a personal adviser to every young person with a pathway plan — this is a statutory requirement and ensures young people have a named professional supporting their transition to adulthood.",
      urgency: "immediate",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });
  }

  if (pathwayPlanCurrencyRate < 50 && currentPathwayPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all pathway plans to bring them up to date — plans that have not been reviewed within the last 6 months may no longer reflect young people's current needs and circumstances.",
      urgency: "soon",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });
  }

  if (multiAgencyInvolvementRate < 50 && totalTransitionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase multi-agency involvement in transition planning — effective transitions require input from education, health, social work, and other relevant professionals.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  if (transitionPlanCoverageRate >= 50 && transitionPlanCoverageRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase transition plan coverage to at least 80% — prioritise developing plans for children who do not yet have one.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  if (independenceAssessmentRate >= 50 && independenceAssessmentRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend independence skills assessments to all children — currently some children have not had their readiness for independent living evaluated.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  if (overduePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Reschedule ${overduePlans} overdue transition plan review${overduePlans !== 1 ? "s" : ""} — overdue reviews mean transition plans may not reflect young people's current circumstances.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  if (leavingCareCompletionRate >= 50 && leavingCareCompletionRate < 80 && totalLeavingCarePackages > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work towards completing all leaving care packages — ensure each package addresses housing, finance, education, health, emotional support, and life skills.",
      urgency: "planned",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });
  }

  if (pathwayPlanCurrencyRate >= 50 && pathwayPlanCurrencyRate < 80 && currentPathwayPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular pathway plan review cycle (at least 6-monthly) to maintain currency — young people's needs change and plans must keep pace.",
      urgency: "planned",
      regulatory_ref: "Children (Leaving Care) Act 2000",
    });
  }

  if (childVoiceInTransitionRate >= 50 && childVoiceInTransitionRate < 80 && totalTransitionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child participation in transition planning — aim for every young person to have a meaningful say in their transition plan.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Welfare of children",
    });
  }

  if (multiAgencyInvolvementRate >= 50 && multiAgencyInvolvementRate < 80 && totalTransitionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve multi-agency engagement in transition planning — seek input from education, health, and social work professionals for all transition plans.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Promoting independence",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: TransitionReadinessInsight[] = [];

  // -- Critical insights --

  if (transitionPlanCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${transitionPlanCoverageRate}% of children have a transition plan. Ofsted will view the absence of transition planning for the majority of children as a failure to prepare them for changes in their lives, a core expectation under Reg 12.`,
      severity: "critical",
    });
  }

  if (totalPathwayPlans === 0 && total_children > 0) {
    insights.push({
      text: "No pathway plans exist for any young person. For eligible young people aged 16+, this represents a failure to meet the statutory requirements of the Children (Leaving Care) Act 2000. Ofsted will expect to see pathway plans addressing all domains of preparation for adulthood.",
      severity: "critical",
    });
  }

  if (childVoiceInTransitionRate < 50 && totalTransitionPlans > 0) {
    insights.push({
      text: `Child voice is captured in only ${childVoiceInTransitionRate}% of transition plans. Transition planning without meaningful young person participation fails the fundamental principle that children should be active agents in decisions about their own lives.`,
      severity: "critical",
    });
  }

  if (leavingCareCompletionRate < 50 && totalLeavingCarePackages > 0) {
    insights.push({
      text: `Only ${leavingCareCompletionRate}% of leaving care packages are complete. Young people leaving care without comprehensive support across housing, finance, education, health, and emotional wellbeing face significantly poorer outcomes.`,
      severity: "critical",
    });
  }

  if (independenceAssessmentRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${independenceAssessmentRate}% of children have had independence skills assessed. Without understanding children's current capabilities in cooking, budgeting, self-care, travel, and social skills, the home cannot provide targeted support for building independence.`,
      severity: "critical",
    });
  }

  if (personalAdvisorRate < 50 && currentPathwayPlans.length > 0) {
    insights.push({
      text: `Only ${personalAdvisorRate}% of young people with pathway plans have a personal adviser. This statutory requirement ensures young people have consistent professional support through their transition — its absence is a compliance failure.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (transitionPlanCoverageRate >= 50 && transitionPlanCoverageRate < 80 && total_children > 0) {
    insights.push({
      text: `Transition plan coverage at ${transitionPlanCoverageRate}% — improving but not yet meeting the expected standard. Ofsted will want to see evidence that all children have appropriate transition planning.`,
      severity: "warning",
    });
  }

  if (pathwayPlanCurrencyRate >= 50 && pathwayPlanCurrencyRate < 80 && currentPathwayPlans.length > 0) {
    insights.push({
      text: `${pathwayPlanCurrencyRate}% of pathway plans are current — some plans are becoming outdated, which means decisions may be based on stale information about young people's needs.`,
      severity: "warning",
    });
  }

  if (leavingCareCompletionRate >= 50 && leavingCareCompletionRate < 80 && totalLeavingCarePackages > 0) {
    insights.push({
      text: `Leaving care completion at ${leavingCareCompletionRate}% — some young people's leaving care packages are missing key elements, which could leave them under-prepared for independence.`,
      severity: "warning",
    });
  }

  if (multiAgencyInvolvementRate >= 50 && multiAgencyInvolvementRate < 80 && totalTransitionPlans > 0) {
    insights.push({
      text: `Multi-agency involvement at ${multiAgencyInvolvementRate}% — some transitions are being planned without input from all relevant professionals, limiting the quality of holistic support.`,
      severity: "warning",
    });
  }

  if (overduePlans > 0 && overduePlans <= 3) {
    insights.push({
      text: `${overduePlans} transition plan review${overduePlans !== 1 ? "s are" : " is"} overdue — prompt rescheduling is needed to ensure plans remain current and relevant.`,
      severity: "warning",
    });
  }

  if (overduePlans > 3) {
    insights.push({
      text: `${overduePlans} transition plan reviews are overdue — this volume of overdue reviews suggests a systemic issue with review scheduling and transition plan maintenance.`,
      severity: "warning",
    });
  }

  if (independenceAssessmentRate >= 50 && independenceAssessmentRate < 80 && total_children > 0) {
    insights.push({
      text: `Independence assessment coverage at ${independenceAssessmentRate}% — not all children have had their readiness for independent living evaluated, limiting the home's ability to provide targeted support.`,
      severity: "warning",
    });
  }

  if (housingArrangedRate < 70 && totalLeavingCarePackages > 0) {
    insights.push({
      text: `Only ${housingArrangedRate}% of leaving care packages have housing arranged — secure accommodation is the foundation of a successful care-leaving transition and must be prioritised.`,
      severity: "warning",
    });
  }

  if (aftercareSupportRate < 70 && aftercareNeedsIdentified > 0) {
    insights.push({
      text: `Only ${aftercareSupportRate}% of identified aftercare support needs have been met — care leavers with unmet needs are at increased risk of poor outcomes.`,
      severity: "warning",
    });
  }

  if (overdueAftercareContacts > 0) {
    insights.push({
      text: `${overdueAftercareContacts} aftercare contact${overdueAftercareContacts !== 1 ? "s are" : " is"} overdue — consistent staying-close contact is essential for supporting care leavers through their transition.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (readiness_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding transition and leaving care readiness — young people are comprehensively prepared for independence with robust pathway planning, strong child voice, multi-agency collaboration, and effective aftercare support. This is strong evidence for Reg 12 compliance.",
      severity: "positive",
    });
  }

  if (transitionPlanCoverageRate >= 100 && childVoiceInTransitionRate >= 100 && total_children > 0) {
    insights.push({
      text: "Full transition plan coverage with child voice captured in every plan — the home exemplifies child-centred transition planning where young people are active participants in shaping their own futures.",
      severity: "positive",
    });
  }

  if (leavingCareCompletionRate >= 100 && totalLeavingCarePackages > 0) {
    insights.push({
      text: "All leaving care packages are fully complete — young people are comprehensively prepared across housing, finance, education, health, and emotional support, maximising their chances of successful independence.",
      severity: "positive",
    });
  }

  if (pathwayPlanCurrencyRate >= 100 && currentPathwayPlans.length > 0) {
    insights.push({
      text: "All pathway plans are current and recently reviewed — the home ensures pathway plans remain a living document that evolves with each young person's changing needs.",
      severity: "positive",
    });
  }

  if (comprehensiveAssessmentRate >= 100 && totalIndependencePathways > 0) {
    insights.push({
      text: "All independence assessments cover every skill domain — the home takes a thorough approach to evaluating readiness across cooking, budgeting, self-care, travel, and social skills.",
      severity: "positive",
    });
  }

  if (multiAgencyInvolvementRate >= 100 && totalTransitionPlans > 0) {
    insights.push({
      text: "Multi-agency involvement in every transition plan — the home works collaboratively with external professionals to ensure holistic, well-coordinated transitions for every young person.",
      severity: "positive",
    });
  }

  if (aftercareSupportRate >= 90 && aftercareNeedsIdentified > 0) {
    insights.push({
      text: `${aftercareSupportRate}% of identified aftercare needs have been met — the home demonstrates excellent follow-through in supporting care leavers, ensuring their needs do not go unaddressed.`,
      severity: "positive",
    });
  }

  if (personalAdvisorRate >= 100 && currentPathwayPlans.length > 0) {
    insights.push({
      text: "Every young person with a pathway plan has a personal adviser — the home fully meets the statutory requirement ensuring consistent professional guidance through the transition to adulthood.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (readiness_rating === "outstanding") {
    headline =
      "Outstanding transition and leaving care readiness — young people are comprehensively prepared for independence with robust planning, strong child voice, and effective multi-agency support.";
  } else if (readiness_rating === "good") {
    headline = `Good transition and leaving care readiness — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (readiness_rating === "adequate") {
    headline = `Adequate transition and leaving care readiness — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure young people are properly prepared for transitions and independence.`;
  } else {
    headline = `Transition and leaving care readiness is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure young people are prepared for adulthood.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    readiness_rating,
    readiness_score: score,
    headline,
    total_transition_plans: totalTransitionPlans,
    transition_plan_coverage_rate: transitionPlanCoverageRate,
    pathway_plan_currency_rate: pathwayPlanCurrencyRate,
    leaving_care_completion_rate: leavingCareCompletionRate,
    independence_assessment_rate: independenceAssessmentRate,
    aftercare_contact_rate: aftercareContactRate,
    child_voice_in_transition_rate: childVoiceInTransitionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
