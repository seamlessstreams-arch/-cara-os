// ==============================================================================
// CORNERSTONE -- HOME THERAPEUTIC WELLBEING IMPACT INTELLIGENCE ENGINE
// Home-level: assesses therapeutic impact on children, wellbeing pulse tracking,
// self-soothing toolkit effectiveness, and grief/loss support provision.
// CHR 2015 Reg 9 (quality of care) / Reg 10 (enjoyment and achievement).
// Ofsted checks that therapeutic approaches are embedded, children's emotional
// wellbeing is monitored, and specialist support is available for grief/loss.
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface TherapeuticImpactInput {
  id: string;
  child_id: string;
  has_key_outcomes: boolean;
  has_evidence_of_progress: boolean;
  model_applications_count: number;
}

export interface WellbeingPulseInput {
  id: string;
  child_id: string;
  date: string;
  overall_score: number; /* 1-10 */
  trend: string; /* "improving"|"stable"|"declining" */
  follow_up_needed: boolean;
  follow_up_actioned: boolean;
}

export interface SelfSoothingInput {
  id: string;
  child_id: string;
  strategies_count: number; /* total strategies across all types */
  child_contributed: boolean;
  recently_reviewed: boolean; /* reviewed in last 90 days */
}

export interface GriefSupportInput {
  id: string;
  child_id: string;
  has_external_support: boolean;
  has_home_support: boolean;
  has_commemoration_activities: boolean;
  key_worker_involved: boolean;
}

export interface TherapeuticWellbeingInput {
  today: string;
  total_children: number;
  therapeutic_impacts: TherapeuticImpactInput[];
  wellbeing_pulses: WellbeingPulseInput[];
  self_soothing: SelfSoothingInput[];
  grief_support: GriefSupportInput[];
}

// -- Output Types -------------------------------------------------------------

export type TherapeuticWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TherapeuticWellbeingResult {
  wellbeing_rating: TherapeuticWellbeingRating;
  wellbeing_score: number;
  headline: string;
  children_with_therapeutic_plans: number;
  average_wellbeing_score: number;
  improving_trend_rate: number;
  self_soothing_coverage_rate: number;
  grief_support_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[];
  insights: { text: string; severity: string }[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function toRating(score: number): TherapeuticWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Main Function ------------------------------------------------------------

export function computeTherapeuticWellbeingImpact(
  input: TherapeuticWellbeingInput,
): TherapeuticWellbeingResult {
  const {
    total_children,
    therapeutic_impacts,
    wellbeing_pulses,
    self_soothing,
    grief_support,
  } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      wellbeing_rating: "insufficient_data",
      wellbeing_score: 0,
      headline:
        "No children in the home -- therapeutic wellbeing impact cannot be assessed.",
      children_with_therapeutic_plans: 0,
      average_wellbeing_score: 0,
      improving_trend_rate: 0,
      self_soothing_coverage_rate: 0,
      grief_support_rate: 0,
      strengths: [],
      concerns: [
        "No children recorded -- therapeutic wellbeing data is unavailable.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Ensure the home's children register is up to date so therapeutic wellbeing monitoring can function.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 9",
        },
      ],
      insights: [
        {
          text: "No data is available to assess therapeutic wellbeing. Under CHR 2015 Reg 9, the quality of care must be monitored and evidenced. Without children recorded, the home cannot demonstrate compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Mod 1: Therapeutic coverage -------------------------------------------
  // Unique children with impacts where has_key_outcomes AND has_evidence_of_progress
  const qualifyingImpactChildren = new Set(
    therapeutic_impacts
      .filter((t) => t.has_key_outcomes && t.has_evidence_of_progress)
      .map((t) => t.child_id),
  );
  const therapeuticCoverageRate = pct(
    qualifyingImpactChildren.size,
    total_children,
  );
  const childrenWithTherapeuticPlans = qualifyingImpactChildren.size;

  let score = 52;

  // Mod 1: Therapeutic coverage
  if (therapeuticCoverageRate >= 80) score += 5;
  else if (therapeuticCoverageRate >= 50) score += 2;
  else if (therapeuticCoverageRate >= 30) score += 0;
  else score -= 5;

  // -- Mod 2: Wellbeing scores -----------------------------------------------
  const avgWellbeing =
    wellbeing_pulses.length > 0
      ? round1(
          wellbeing_pulses.reduce((s, p) => s + p.overall_score, 0) /
            wellbeing_pulses.length,
        )
      : 0;

  if (wellbeing_pulses.length === 0) score += 0;
  else if (avgWellbeing >= 7) score += 6;
  else if (avgWellbeing >= 5) score += 3;
  else if (avgWellbeing >= 3) score += 0;
  else score -= 5;

  // -- Mod 3: Wellbeing trends -----------------------------------------------
  const improvingCount = wellbeing_pulses.filter(
    (p) => p.trend === "improving",
  ).length;
  const improvingRate = pct(improvingCount, wellbeing_pulses.length);

  if (wellbeing_pulses.length === 0) score += 0;
  else if (improvingRate >= 60) score += 5;
  else if (improvingRate >= 35) score += 2;
  else if (improvingRate >= 15) score += 0;
  else score -= 4;

  // -- Mod 4: Self-soothing engagement ---------------------------------------
  const engagedToolkits = self_soothing.filter(
    (s) => s.child_contributed && s.strategies_count >= 5,
  ).length;
  const engagementRate = pct(engagedToolkits, self_soothing.length);

  if (self_soothing.length === 0) score += 0;
  else if (engagementRate >= 80) score += 5;
  else if (engagementRate >= 50) score += 2;
  else if (engagementRate >= 25) score += 0;
  else score -= 5;

  // -- Mod 5: Self-soothing review -------------------------------------------
  const reviewedToolkits = self_soothing.filter(
    (s) => s.recently_reviewed,
  ).length;
  const reviewRate = pct(reviewedToolkits, self_soothing.length);

  if (self_soothing.length === 0) score += 0;
  else if (reviewRate >= 80) score += 4;
  else if (reviewRate >= 50) score += 1;
  else if (reviewRate >= 25) score += 0;
  else score -= 4;

  // -- Mod 6: Grief support quality ------------------------------------------
  const qualifyingGrief = grief_support.filter(
    (g) => g.has_external_support && g.has_home_support && g.key_worker_involved,
  ).length;
  const griefQualityRate = pct(qualifyingGrief, grief_support.length);

  if (grief_support.length === 0) {
    score += 2; // no current need is neutral-positive
  } else if (griefQualityRate >= 80) {
    score += 5;
  } else if (griefQualityRate >= 50) {
    score += 2;
  } else if (griefQualityRate >= 25) {
    score += 0;
  } else {
    score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // -- Derived metrics -------------------------------------------------------
  const selfSoothingCoverageRate = pct(self_soothing.length, total_children);
  const griefSupportRate =
    grief_support.length > 0 ? griefQualityRate : 0;

  // -- Strengths -------------------------------------------------------------
  const strengths: string[] = [];

  if (therapeuticCoverageRate >= 80) {
    strengths.push(
      `${therapeuticCoverageRate}% of children have therapeutic plans with key outcomes and evidence of progress -- therapeutic approaches are well embedded.`,
    );
  }
  if (avgWellbeing >= 7 && wellbeing_pulses.length > 0) {
    strengths.push(
      `Average wellbeing score of ${avgWellbeing}/10 -- children are reporting positive emotional states.`,
    );
  }
  if (improvingRate >= 60 && wellbeing_pulses.length > 0) {
    strengths.push(
      `${improvingRate}% of wellbeing pulses show an improving trend -- therapeutic interventions are making a tangible difference.`,
    );
  }
  if (engagementRate >= 80 && self_soothing.length > 0) {
    strengths.push(
      `${engagementRate}% of self-soothing toolkits have child contribution with 5+ strategies -- children are active participants in their own regulation.`,
    );
  }
  if (reviewRate >= 80 && self_soothing.length > 0) {
    strengths.push(
      `${reviewRate}% of self-soothing toolkits reviewed within 90 days -- strategies remain current and relevant.`,
    );
  }
  if (griefQualityRate >= 80 && grief_support.length > 0) {
    strengths.push(
      `${griefQualityRate}% of grief support records have external support, home support, and key worker involvement -- comprehensive wraparound care for grieving children.`,
    );
  }
  if (grief_support.length === 0) {
    strengths.push(
      "No current grief/loss support needs identified -- all children appear settled in this area.",
    );
  }

  // -- Concerns --------------------------------------------------------------
  const concerns: string[] = [];

  if (therapeuticCoverageRate < 30) {
    concerns.push(
      `Only ${therapeuticCoverageRate}% of children have therapeutic plans with key outcomes and progress evidence -- therapeutic approaches are not embedded.`,
    );
  }
  if (avgWellbeing < 3 && wellbeing_pulses.length > 0) {
    concerns.push(
      `Average wellbeing score is ${avgWellbeing}/10 -- children's emotional states are critically low.`,
    );
  }
  if (avgWellbeing >= 3 && avgWellbeing < 5 && wellbeing_pulses.length > 0) {
    concerns.push(
      `Average wellbeing score of ${avgWellbeing}/10 is below the expected standard for positive emotional health.`,
    );
  }
  if (improvingRate < 15 && wellbeing_pulses.length > 0) {
    concerns.push(
      `Only ${improvingRate}% of wellbeing pulses show improvement -- therapeutic interventions may not be effective.`,
    );
  }
  const decliningPulses = wellbeing_pulses.filter(
    (p) => p.trend === "declining",
  );
  if (decliningPulses.length > 0 && wellbeing_pulses.length > 0) {
    const decliningRate = pct(decliningPulses.length, wellbeing_pulses.length);
    if (decliningRate >= 25) {
      concerns.push(
        `${decliningRate}% of wellbeing pulses show a declining trend -- urgent therapeutic review needed.`,
      );
    }
  }
  if (engagementRate < 25 && self_soothing.length > 0) {
    concerns.push(
      `Only ${engagementRate}% of self-soothing toolkits have meaningful child contribution -- children are not participating in developing their own strategies.`,
    );
  }
  if (reviewRate < 25 && self_soothing.length > 0) {
    concerns.push(
      `Only ${reviewRate}% of self-soothing toolkits have been recently reviewed -- strategies may be outdated and ineffective.`,
    );
  }
  if (griefQualityRate < 25 && grief_support.length > 0) {
    concerns.push(
      `Only ${griefQualityRate}% of grief support records meet quality standards -- children experiencing loss are not receiving adequate wraparound care.`,
    );
  }

  // Follow-up gaps
  const needingFollowUp = wellbeing_pulses.filter((p) => p.follow_up_needed);
  const actionedFollowUp = needingFollowUp.filter(
    (p) => p.follow_up_actioned,
  );
  if (needingFollowUp.length > 0) {
    const followUpRate = pct(actionedFollowUp.length, needingFollowUp.length);
    if (followUpRate < 80) {
      concerns.push(
        `Only ${followUpRate}% of wellbeing follow-ups have been actioned -- flagged concerns are not being addressed.`,
      );
    }
  }

  // -- Recommendations -------------------------------------------------------
  const recs: TherapeuticWellbeingResult["recommendations"] = [];
  let rank = 1;

  if (therapeuticCoverageRate < 50) {
    recs.push({
      rank: rank++,
      recommendation: `Therapeutic coverage is at ${therapeuticCoverageRate}% -- ensure every child has a therapeutic plan with defined key outcomes and measurable progress evidence.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }

  if (avgWellbeing < 5 && wellbeing_pulses.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Average wellbeing score is ${avgWellbeing}/10 -- convene a multi-disciplinary review to address children's emotional needs and consider additional specialist input.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10",
    });
  }

  if (improvingRate < 35 && wellbeing_pulses.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Only ${improvingRate}% of wellbeing trends are improving -- review whether current therapeutic models are appropriate and adjust care plans accordingly.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }

  if (engagementRate < 50 && self_soothing.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Self-soothing engagement is at ${engagementRate}% -- work with each child to co-create their toolkit with at least 5 strategies they have chosen.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10",
    });
  }

  if (reviewRate < 50 && self_soothing.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Only ${reviewRate}% of self-soothing toolkits have been recently reviewed -- schedule 90-day reviews with each child to refresh strategies.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }

  if (griefQualityRate < 50 && grief_support.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Grief support quality is at ${griefQualityRate}% -- ensure every child experiencing grief/loss has external specialist support, home-based support, and key worker involvement.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }

  if (needingFollowUp.length > 0) {
    const followUpRate = pct(actionedFollowUp.length, needingFollowUp.length);
    if (followUpRate < 80) {
      recs.push({
        rank: rank++,
        recommendation: `${needingFollowUp.length - actionedFollowUp.length} wellbeing follow-ups remain unactioned -- prioritise these to demonstrate responsive care.`,
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 9",
      });
    }
  }

  if (self_soothing.length === 0 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "No self-soothing toolkits recorded -- develop personalised toolkits with each child to build emotional regulation skills.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10",
    });
  }

  if (wellbeing_pulses.length === 0 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "No wellbeing pulse data recorded -- implement regular wellbeing check-ins to monitor children's emotional health.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }

  // -- Insights --------------------------------------------------------------
  const insights: TherapeuticWellbeingResult["insights"] = [];

  if (rating === "outstanding") {
    insights.push({
      text: `Exemplary therapeutic wellbeing -- ${therapeuticCoverageRate}% therapeutic coverage, average wellbeing ${avgWellbeing}/10, ${improvingRate}% improving trends. The home demonstrates a deeply embedded therapeutic culture where children's emotional needs are understood, monitored, and responded to with measurable impact. Inspectors will find strong evidence of CHR 2015 Reg 9 and Reg 10 compliance.`,
      severity: "positive",
    });
  }

  if (rating === "good") {
    insights.push({
      text: `Good therapeutic wellbeing practice -- the home is monitoring children's emotional health and therapeutic progress is broadly positive, though some areas would benefit from strengthening to reach outstanding.`,
      severity: "positive",
    });
  }

  if (avgWellbeing < 3 && wellbeing_pulses.length > 0) {
    insights.push({
      text: `Critical wellbeing concern: average score of ${avgWellbeing}/10 indicates children are experiencing significant emotional distress. Under CHR 2015 Reg 9, the registered person must ensure that children receive care which meets their emotional needs. Immediate multi-agency intervention is warranted.`,
      severity: "critical",
    });
  }

  if (
    therapeuticCoverageRate < 30 &&
    therapeutic_impacts.length > 0
  ) {
    insights.push({
      text: `Therapeutic approaches are not embedded across the home. Only ${therapeuticCoverageRate}% of children have plans with outcomes and progress evidence. CHR 2015 Reg 9 requires that children's care plans are informed by a therapeutic understanding of their needs. Inspectors will question whether the home's stated therapeutic model is genuinely applied.`,
      severity: "critical",
    });
  }

  if (griefQualityRate < 25 && grief_support.length > 0) {
    insights.push({
      text: `Grief and loss support is critically inadequate at ${griefQualityRate}%. Children experiencing bereavement or loss need coordinated external and home-based support with key worker involvement. Under CHR 2015 Reg 9, the registered person must ensure specialist support is accessible.`,
      severity: "critical",
    });
  }

  if (engagementRate >= 80 && self_soothing.length > 0) {
    insights.push({
      text: `${engagementRate}% of children are actively contributing to their self-soothing toolkits with robust strategy sets. This demonstrates a child-centred approach to emotional regulation consistent with CHR 2015 Reg 10 -- children are being supported to develop independence and self-management skills.`,
      severity: "positive",
    });
  }

  if (
    improvingRate >= 60 &&
    avgWellbeing >= 7 &&
    wellbeing_pulses.length > 0
  ) {
    insights.push({
      text: `Strong positive trajectory -- ${improvingRate}% improving trends with an average score of ${avgWellbeing}/10 demonstrates that therapeutic interventions are translating into genuine emotional benefit for children.`,
      severity: "positive",
    });
  }

  if (grief_support.length > 0 && griefQualityRate >= 80) {
    insights.push({
      text: `Grief and loss support is comprehensive -- ${griefQualityRate}% of children experiencing loss have external specialist support, home-based support, and key worker involvement. This wraparound approach evidences outstanding care under CHR 2015 Reg 9.`,
      severity: "positive",
    });
  }

  // -- Headline --------------------------------------------------------------
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding therapeutic wellbeing -- ${therapeuticCoverageRate}% therapeutic coverage, average wellbeing ${avgWellbeing}/10, ${improvingRate}% improving trends.`;
  } else if (rating === "good") {
    headline = `Good therapeutic wellbeing -- children's emotional health is monitored with broadly positive outcomes.`;
  } else if (rating === "adequate") {
    headline = `Adequate therapeutic wellbeing -- some therapeutic impact is evident but gaps in coverage and monitoring need attention.`;
  } else if (rating === "inadequate") {
    headline = `Inadequate therapeutic wellbeing -- significant gaps in therapeutic coverage, wellbeing monitoring, or grief support require urgent action.`;
  } else {
    headline =
      "No children in the home -- therapeutic wellbeing impact cannot be assessed.";
  }

  return {
    wellbeing_rating: rating,
    wellbeing_score: score,
    headline,
    children_with_therapeutic_plans: childrenWithTherapeuticPlans,
    average_wellbeing_score: avgWellbeing,
    improving_trend_rate: improvingRate,
    self_soothing_coverage_rate: selfSoothingCoverageRate,
    grief_support_rate: griefSupportRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
