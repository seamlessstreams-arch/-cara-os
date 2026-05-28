// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMOTIONAL SAFETY CLIMATE INTELLIGENCE ENGINE
// Cross-domain composite engine measuring the emotional safety culture of the
// home through analysis of post-incident debriefs, staff debriefs, restraint
// practices, sanction/reward balance, and positive achievements.
// Assesses whether children and staff feel emotionally safe and supported.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (Behaviour management), Reg 13 (Safeguarding),
// Reg 45 (Quality of care). SCCR 2015.
// SCCIF: "Experiences and progress of children", "Helped and protected",
// "How well children and young people are helped and protected".
// Store keys: postIncidentChildDebriefs, staffDebriefRecords, restraints,
//             sanctionRewards, positiveAchievements
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RestraintInput {
  id: string;
  child_id: string;
  date: string;
  duration: number; // minutes
  restraint_type: string;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  review_status: string; // "reviewed" | "pending"
  de_escalation_attempts: string[];
  injuries: { person: string; description: string }[];
  body_map_completed: boolean;
  created_at: string;
}

export interface SanctionRewardInput {
  id: string;
  child_id: string;
  date: string;
  direction: string; // "reward" | "sanction"
  reward_type: string | null;
  sanction_type: string | null;
  proportionate: boolean;
  child_response: string;
  created_at: string;
}

export interface PostIncidentDebriefInput {
  id: string;
  child_id: string;
  incident_id: string;
  debrief_date: string;
  child_voice_captured: boolean;
  child_feelings_explored: boolean;
  learning_identified: boolean;
  follow_up_actions: string | null;
  quality_rating: number; // 1-5
  created_at: string;
}

export interface StaffDebriefInput {
  id: string;
  staff_id: string;
  incident_id: string | null;
  debrief_date: string;
  emotional_impact_explored: boolean;
  support_offered: boolean;
  learning_identified: boolean;
  created_at: string;
}

export interface PositiveAchievementInput {
  id: string;
  child_id: string;
  date: string;
  category: string; // "academic" | "social" | "emotional" | "physical" | "creative" | "independence"
  description: string;
  celebrated: boolean;
  shared_with_network: boolean;
  created_at: string;
}

export interface EmotionalSafetyClimateInput {
  today: string;
  total_children: number;
  total_staff: number;
  restraints: RestraintInput[];
  sanction_rewards: SanctionRewardInput[];
  post_incident_debriefs: PostIncidentDebriefInput[];
  staff_debriefs: StaffDebriefInput[];
  positive_achievements: PositiveAchievementInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EmotionalSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EmotionalSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EmotionalSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EmotionalSafetyClimateResult {
  safety_rating: EmotionalSafetyRating;
  safety_score: number;
  headline: string;
  total_restraints: number;
  average_restraint_duration: number;
  restraint_review_rate: number;
  child_debrief_rate: number;
  staff_debrief_rate: number;
  reward_to_sanction_ratio: number;
  positive_achievement_count: number;
  achievement_celebration_rate: number;
  de_escalation_attempt_rate: number;
  body_map_completion_rate: number;
  post_incident_quality_avg: number;
  injury_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: EmotionalSafetyRecommendation[];
  insights: EmotionalSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EmotionalSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: EmotionalSafetyRating,
  score: number,
  headline: string,
): EmotionalSafetyClimateResult {
  return {
    safety_rating: rating,
    safety_score: score,
    headline,
    total_restraints: 0,
    average_restraint_duration: 0,
    restraint_review_rate: 0,
    child_debrief_rate: 0,
    staff_debrief_rate: 0,
    reward_to_sanction_ratio: 0,
    positive_achievement_count: 0,
    achievement_celebration_rate: 0,
    de_escalation_attempt_rate: 0,
    body_map_completion_rate: 0,
    post_incident_quality_avg: 0,
    injury_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeEmotionalSafetyClimate(
  input: EmotionalSafetyClimateInput,
): EmotionalSafetyClimateResult {
  const {
    total_children,
    total_staff,
    restraints,
    sanction_rewards,
    post_incident_debriefs,
    staff_debriefs,
    positive_achievements,
  } = input;

  // ── Special case: all empty + 0 children + 0 staff → insufficient_data ──
  const allEmpty =
    restraints.length === 0 &&
    sanction_rewards.length === 0 &&
    post_incident_debriefs.length === 0 &&
    staff_debriefs.length === 0 &&
    positive_achievements.length === 0;

  if (allEmpty && total_children === 0 && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children or staff on placement — insufficient data to assess emotional safety climate.",
    );
  }

  // ── Special case: all empty + (children > 0 || staff > 0) → inadequate ──
  if (allEmpty && (total_children > 0 || total_staff > 0)) {
    return {
      ...emptyResult(
        "inadequate",
        18,
        "No emotional safety data recorded despite active placement — recording practices require urgent attention.",
      ),
      concerns: [
        "No restraint, sanction/reward, debrief, or achievement records exist despite children or staff being on placement — emotional safety culture cannot be evidenced.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of post-incident debriefs, staff debriefs, sanctions/rewards, and positive achievements to evidence the home's emotional safety culture.",
          urgency: "immediate",
          regulatory_ref: "Reg 45 — Quality of care, SCCR 2015",
        },
        {
          rank: 2,
          recommendation:
            "Develop a positive achievement recognition framework so children's progress is captured and celebrated.",
          urgency: "soon",
          regulatory_ref: "Reg 12 — Behaviour management",
        },
      ],
      insights: [
        {
          text: "The complete absence of emotional safety records means Ofsted cannot verify that children feel safe, heard, and supported. This represents a fundamental gap in quality of care evidence.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Restraint metrics ---
  const totalRestraints = restraints.length;

  const avgRestraintDuration =
    totalRestraints > 0
      ? Math.round(
          restraints.reduce((sum, r) => sum + r.duration, 0) / totalRestraints,
        )
      : 0;

  const reviewedRestraints = restraints.filter(
    (r) => r.review_status === "reviewed",
  ).length;
  const restraintReviewRate = pct(reviewedRestraints, totalRestraints);

  const childDebriefedRestraints = restraints.filter(
    (r) => r.child_debriefed,
  ).length;
  const childDebriefRate = pct(childDebriefedRestraints, totalRestraints);

  const staffDebriefedRestraints = restraints.filter(
    (r) => r.staff_debriefed,
  ).length;
  const staffDebriefRate = pct(staffDebriefedRestraints, totalRestraints);

  const restraintsWithDeEscalation = restraints.filter(
    (r) => r.de_escalation_attempts.length > 0,
  ).length;
  const deEscalationRate = pct(restraintsWithDeEscalation, totalRestraints);

  const bodyMapCompleted = restraints.filter(
    (r) => r.body_map_completed,
  ).length;
  const bodyMapRate = pct(bodyMapCompleted, totalRestraints);

  const restraintsWithInjuries = restraints.filter(
    (r) => r.injuries.length > 0,
  ).length;
  const injuryRate = pct(restraintsWithInjuries, totalRestraints);

  // --- Sanction/reward metrics ---
  const rewards = sanction_rewards.filter((s) => s.direction === "reward");
  const sanctions = sanction_rewards.filter((s) => s.direction === "sanction");
  const rewardCount = rewards.length;
  const sanctionCount = sanctions.length;

  // Ratio: rewards per sanction. If no sanctions, treat as perfect (use rewardCount or 0 if both empty)
  const rewardToSanctionRatio =
    sanctionCount > 0
      ? Math.round((rewardCount / sanctionCount) * 100) / 100
      : rewardCount > 0
        ? rewardCount
        : 0;

  // --- Post-incident debrief metrics ---
  const totalPostIncidentDebriefs = post_incident_debriefs.length;

  const qualitySum = post_incident_debriefs.reduce(
    (sum, d) => sum + d.quality_rating,
    0,
  );
  const postIncidentQualityAvg =
    totalPostIncidentDebriefs > 0
      ? Math.round((qualitySum / totalPostIncidentDebriefs) * 100) / 100
      : 0;

  const debriefVoiceCaptured = post_incident_debriefs.filter(
    (d) => d.child_voice_captured,
  ).length;
  const debriefFeelingsExplored = post_incident_debriefs.filter(
    (d) => d.child_feelings_explored,
  ).length;
  const debriefLearningIdentified = post_incident_debriefs.filter(
    (d) => d.learning_identified,
  ).length;
  const debriefWithFollowUp = post_incident_debriefs.filter(
    (d) => d.follow_up_actions !== null && d.follow_up_actions.trim() !== "",
  ).length;

  // --- Staff debrief metrics ---
  const totalStaffDebriefs = staff_debriefs.length;
  const staffEmotionalImpactExplored = staff_debriefs.filter(
    (d) => d.emotional_impact_explored,
  ).length;
  const staffSupportOffered = staff_debriefs.filter(
    (d) => d.support_offered,
  ).length;
  const staffLearningIdentified = staff_debriefs.filter(
    (d) => d.learning_identified,
  ).length;

  const staffSupportRate = pct(staffSupportOffered, totalStaffDebriefs);
  const staffEmotionalExplorationRate = pct(
    staffEmotionalImpactExplored,
    totalStaffDebriefs,
  );

  // --- Positive achievement metrics ---
  const positiveAchievementCount = positive_achievements.length;
  const celebratedAchievements = positive_achievements.filter(
    (a) => a.celebrated,
  ).length;
  const achievementCelebrationRate = pct(
    celebratedAchievements,
    positiveAchievementCount,
  );
  const sharedAchievements = positive_achievements.filter(
    (a) => a.shared_with_network,
  ).length;
  const achievementCategories = new Set(
    positive_achievements.map((a) => a.category),
  ).size;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus: child debrief rate (after restraints) ---
  // childDebriefRate >= 100 → +4, >= 80 → +2
  if (childDebriefRate >= 100) score += 4;
  else if (childDebriefRate >= 80) score += 2;

  // --- Bonus: staff debrief rate (after restraints) ---
  // staffDebriefRate >= 100 → +3, >= 80 → +1
  if (staffDebriefRate >= 100) score += 3;
  else if (staffDebriefRate >= 80) score += 1;

  // --- Bonus: reward-to-sanction ratio ---
  // >= 4.0 → +4, >= 2.0 → +2
  if (rewardToSanctionRatio >= 4.0) score += 4;
  else if (rewardToSanctionRatio >= 2.0) score += 2;

  // --- Bonus: de-escalation attempt rate ---
  // >= 100 → +3, >= 90 → +1
  if (deEscalationRate >= 100) score += 3;
  else if (deEscalationRate >= 90) score += 1;

  // --- Bonus: body map completion rate ---
  // >= 100 → +3, >= 80 → +1
  if (bodyMapRate >= 100) score += 3;
  else if (bodyMapRate >= 80) score += 1;

  // --- Bonus: restraint review rate ---
  // >= 100 → +3, >= 80 → +1
  if (restraintReviewRate >= 100) score += 3;
  else if (restraintReviewRate >= 80) score += 1;

  // --- Bonus: achievement celebration rate ---
  // >= 90 → +3, >= 70 → +1
  if (achievementCelebrationRate >= 90) score += 3;
  else if (achievementCelebrationRate >= 70) score += 1;

  // --- Bonus: post-incident quality average ---
  // >= 4.0 → +3, >= 3.0 → +1
  if (postIncidentQualityAvg >= 4.0) score += 3;
  else if (postIncidentQualityAvg >= 3.0) score += 1;

  // --- Bonus: no injuries ---
  if (totalRestraints > 0 && injuryRate === 0) score += 2;
  // Also award if no restraints at all (no opportunity for injury)
  if (totalRestraints === 0 && (total_children > 0 || total_staff > 0))
    score += 2;

  // ── Penalties ─────────────────────────────────────────────────────────

  // childDebriefRate < 50 → -5
  if (childDebriefRate < 50 && totalRestraints > 0) score -= 5;

  // rewardToSanctionRatio < 1.0 → -5
  if (rewardToSanctionRatio < 1.0 && sanctionCount > 0) score -= 5;

  // bodyMapRate < 50 → -5
  if (bodyMapRate < 50 && totalRestraints > 0) score -= 5;

  // restraintReviewRate < 50 → -3
  if (restraintReviewRate < 50 && totalRestraints > 0) score -= 3;

  score = clamp(score, 0, 100);

  const safety_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (childDebriefRate >= 100 && totalRestraints > 0) {
    strengths.push(
      "Every child is debriefed after restraint — children's voices are consistently heard following physical interventions.",
    );
  } else if (childDebriefRate >= 80 && totalRestraints > 0) {
    strengths.push(
      `${childDebriefRate}% child debrief rate after restraints — strong commitment to hearing children's experiences post-intervention.`,
    );
  }

  if (staffDebriefRate >= 100 && totalRestraints > 0) {
    strengths.push(
      "All staff are debriefed after restraint — reflective practice is embedded in the team culture.",
    );
  } else if (staffDebriefRate >= 80 && totalRestraints > 0) {
    strengths.push(
      `${staffDebriefRate}% staff debrief rate after restraints — staff are supported to reflect and learn from physical interventions.`,
    );
  }

  if (rewardToSanctionRatio >= 4.0 && sanctionCount > 0) {
    strengths.push(
      `Reward-to-sanction ratio of ${rewardToSanctionRatio}:1 — the home operates a strongly positive behaviour culture where children's good choices are recognised and celebrated.`,
    );
  } else if (rewardToSanctionRatio >= 2.0 && sanctionCount > 0) {
    strengths.push(
      `Reward-to-sanction ratio of ${rewardToSanctionRatio}:1 — rewards outweigh sanctions, supporting a positive behaviour management approach.`,
    );
  }

  if (rewardCount > 0 && sanctionCount === 0) {
    strengths.push(
      `${rewardCount} reward${rewardCount !== 1 ? "s" : ""} recorded with zero sanctions — exemplary positive reinforcement culture.`,
    );
  }

  if (deEscalationRate >= 100 && totalRestraints > 0) {
    strengths.push(
      "De-escalation attempted before every restraint — staff consistently try alternatives before physical intervention.",
    );
  } else if (deEscalationRate >= 90 && totalRestraints > 0) {
    strengths.push(
      `De-escalation attempted in ${deEscalationRate}% of restraints — strong commitment to least restrictive practice.`,
    );
  }

  if (bodyMapRate >= 100 && totalRestraints > 0) {
    strengths.push(
      "Body maps completed for every restraint — thorough safeguarding documentation.",
    );
  }

  if (restraintReviewRate >= 100 && totalRestraints > 0) {
    strengths.push(
      "Every restraint reviewed by management — robust oversight of physical interventions.",
    );
  }

  if (achievementCelebrationRate >= 90 && positiveAchievementCount > 0) {
    strengths.push(
      `${achievementCelebrationRate}% of positive achievements celebrated — children's successes are recognised and valued.`,
    );
  }

  if (postIncidentQualityAvg >= 4.0 && totalPostIncidentDebriefs > 0) {
    strengths.push(
      `Post-incident debrief quality averages ${postIncidentQualityAvg}/5 — high-quality reflective practice after incidents.`,
    );
  }

  if (totalRestraints > 0 && injuryRate === 0) {
    strengths.push(
      "Zero injuries recorded during restraints — safe physical intervention practice.",
    );
  }

  if (totalRestraints === 0 && total_children > 0) {
    strengths.push(
      "No restraints recorded — the home manages behaviour without physical intervention.",
    );
  }

  if (staffSupportRate >= 90 && totalStaffDebriefs > 0) {
    strengths.push(
      `Support offered in ${staffSupportRate}% of staff debriefs — the home actively cares for staff emotional wellbeing.`,
    );
  }

  if (achievementCategories >= 4 && positiveAchievementCount > 0) {
    strengths.push(
      `Achievements span ${achievementCategories} categories — the home recognises children's progress across multiple domains.`,
    );
  }

  if (
    pct(sharedAchievements, positiveAchievementCount) >= 70 &&
    positiveAchievementCount > 0
  ) {
    strengths.push(
      "Achievements are regularly shared with children's networks — building a connected celebration of progress.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (childDebriefRate < 50 && totalRestraints > 0) {
    concerns.push(
      `Only ${childDebriefRate}% of children debriefed after restraint — the majority of children are not being heard following physical intervention, undermining emotional safety.`,
    );
  } else if (childDebriefRate < 80 && childDebriefRate >= 50 && totalRestraints > 0) {
    concerns.push(
      `Child debrief rate at ${childDebriefRate}% — not all children are heard after restraint, which may leave some feeling unheard or unsafe.`,
    );
  }

  if (staffDebriefRate < 50 && totalRestraints > 0) {
    concerns.push(
      `Only ${staffDebriefRate}% of staff debriefed after restraint — staff may be carrying unprocessed emotional impact from physical interventions.`,
    );
  }

  if (rewardToSanctionRatio < 1.0 && sanctionCount > 0) {
    concerns.push(
      `Reward-to-sanction ratio of ${rewardToSanctionRatio}:1 — sanctions outweigh rewards, indicating a punitive rather than positive behaviour culture.`,
    );
  }

  if (rewardCount === 0 && sanctionCount > 0) {
    concerns.push(
      "No rewards recorded alongside active sanctions — the home operates a sanctions-only approach with no positive reinforcement.",
    );
  }

  if (bodyMapRate < 50 && totalRestraints > 0) {
    concerns.push(
      `Body map completion at only ${bodyMapRate}% — significant safeguarding documentation gap following physical interventions.`,
    );
  } else if (bodyMapRate < 80 && bodyMapRate >= 50 && totalRestraints > 0) {
    concerns.push(
      `Body map completion at ${bodyMapRate}% — some restraints lack essential safeguarding documentation.`,
    );
  }

  if (restraintReviewRate < 50 && totalRestraints > 0) {
    concerns.push(
      `Only ${restraintReviewRate}% of restraints reviewed — management oversight of physical interventions is insufficient.`,
    );
  }

  if (deEscalationRate < 80 && totalRestraints > 0) {
    concerns.push(
      `De-escalation attempted in only ${deEscalationRate}% of restraints — staff may be resorting to physical intervention without adequate attempts to de-escalate.`,
    );
  }

  if (injuryRate > 0 && totalRestraints > 0) {
    concerns.push(
      `Injuries recorded in ${injuryRate}% of restraints (${restraintsWithInjuries} incident${restraintsWithInjuries !== 1 ? "s" : ""}) — physical intervention techniques may need urgent review.`,
    );
  }

  if (postIncidentQualityAvg < 3.0 && totalPostIncidentDebriefs > 0) {
    concerns.push(
      `Post-incident debrief quality averages only ${postIncidentQualityAvg}/5 — debriefs are not adequately exploring children's experiences after incidents.`,
    );
  }

  if (positiveAchievementCount === 0 && total_children > 0) {
    concerns.push(
      "No positive achievements recorded — children's successes and progress are not being captured or celebrated.",
    );
  }

  if (achievementCelebrationRate < 50 && positiveAchievementCount > 0) {
    concerns.push(
      `Only ${achievementCelebrationRate}% of achievements celebrated — many positive moments pass without recognition, undermining children's self-esteem.`,
    );
  }

  if (staffSupportRate < 50 && totalStaffDebriefs > 0) {
    concerns.push(
      `Support offered in only ${staffSupportRate}% of staff debriefs — staff emotional wellbeing is not being adequately addressed.`,
    );
  }

  if (
    totalPostIncidentDebriefs === 0 &&
    totalRestraints > 0
  ) {
    concerns.push(
      "No post-incident debriefs recorded despite restraints occurring — children's post-incident experiences are not being explored.",
    );
  }

  if (
    totalStaffDebriefs === 0 &&
    totalRestraints > 0
  ) {
    concerns.push(
      "No staff debriefs recorded despite restraints occurring — staff are not being supported to process the emotional impact of physical interventions.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: EmotionalSafetyRecommendation[] = [];
  let rank = 0;

  if (childDebriefRate < 50 && totalRestraints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement post-restraint debriefs for all children — every child must be offered a debrief following physical intervention to ensure their voice is heard and emotional safety is restored.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Behaviour management",
    });
  }

  if (bodyMapRate < 50 && totalRestraints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete body maps after every restraint as a mandatory safeguarding requirement — current completion rate is a significant safeguarding gap.",
      urgency: "immediate",
      regulatory_ref: "Reg 13 — Safeguarding",
    });
  }

  if (rewardToSanctionRatio < 1.0 && sanctionCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Rebalance the sanction/reward approach — implement a structured positive reinforcement framework to ensure rewards significantly outweigh sanctions and children experience a positive behaviour culture.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Behaviour management",
    });
  }

  if (restraintReviewRate < 50 && totalRestraints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure management review of all restraints is completed — current oversight gap means patterns and practice issues may go unidentified.",
      urgency: "immediate",
      regulatory_ref: "Reg 45 — Quality of care",
    });
  }

  if (
    totalPostIncidentDebriefs === 0 &&
    totalRestraints > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a post-incident debrief process for children following all incidents — Ofsted expects evidence that children's experiences are explored and learning is captured.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Behaviour management, SCCR 2015",
    });
  }

  if (
    totalStaffDebriefs === 0 &&
    totalRestraints > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement staff debriefs following all restraints and critical incidents — staff must be supported to process the emotional impact and identify learning.",
      urgency: "immediate",
      regulatory_ref: "Reg 45 — Quality of care, SCCR 2015",
    });
  }

  if (staffDebriefRate < 50 && staffDebriefRate > 0 && totalRestraints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase staff debrief completion after restraints — staff who are not debriefed may experience secondary trauma and reduced capacity to care for children safely.",
      urgency: "soon",
      regulatory_ref: "Reg 45 — Quality of care",
    });
  }

  if (deEscalationRate < 80 && totalRestraints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review de-escalation training and practice — all staff should attempt documented de-escalation before any physical intervention to demonstrate least restrictive practice.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Behaviour management",
    });
  }

  if (injuryRate > 0 && totalRestraints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review restraint techniques and training following recorded injuries — conduct a root cause analysis and consider refresher training for all staff involved in physical interventions.",
      urgency: "soon",
      regulatory_ref: "Reg 13 — Safeguarding",
    });
  }

  if (postIncidentQualityAvg < 3.0 && totalPostIncidentDebriefs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve post-incident debrief quality — ensure debriefs explore children's feelings, capture their voice, identify learning, and plan follow-up actions.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Behaviour management, SCCR 2015",
    });
  }

  if (positiveAchievementCount === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording and celebrating children's positive achievements across all domains — academic, social, emotional, physical, creative, and independence.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Behaviour management",
    });
  }

  if (achievementCelebrationRate < 50 && positiveAchievementCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Actively celebrate all recorded achievements — recognition is essential to building children's self-esteem, confidence, and sense of emotional safety.",
      urgency: "soon",
      regulatory_ref: "Reg 45 — Quality of care",
    });
  }

  if (
    childDebriefRate >= 50 &&
    childDebriefRate < 80 &&
    totalRestraints > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child debrief rate to at least 80% — aim for every child to be offered and supported through a post-restraint debrief.",
      urgency: "planned",
      regulatory_ref: "Reg 12 — Behaviour management",
    });
  }

  if (
    bodyMapRate >= 50 &&
    bodyMapRate < 80 &&
    totalRestraints > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve body map completion to at least 80% — consistent documentation is essential for safeguarding and demonstrating safe restraint practice.",
      urgency: "planned",
      regulatory_ref: "Reg 13 — Safeguarding",
    });
  }

  if (
    achievementCelebrationRate >= 50 &&
    achievementCelebrationRate < 70 &&
    positiveAchievementCount > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the rate of celebrating achievements — aim for at least 90% celebration rate to ensure children consistently feel their progress is valued.",
      urgency: "planned",
      regulatory_ref: "Reg 45 — Quality of care",
    });
  }

  if (
    pct(sharedAchievements, positiveAchievementCount) < 50 &&
    positiveAchievementCount > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Share more achievements with children's wider networks (families, social workers, schools) — this builds connections and reinforces children's sense of belonging.",
      urgency: "planned",
      regulatory_ref: "Reg 45 — Quality of care, SCCR 2015",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: EmotionalSafetyInsight[] = [];

  // -- Critical insights --

  if (childDebriefRate < 50 && totalRestraints > 0) {
    insights.push({
      text: `Only ${childDebriefRate}% of children are debriefed after restraint. Ofsted will view this as a failure to safeguard children's emotional wellbeing under Reg 12 and Reg 13. Children who are restrained without a subsequent debrief may feel unheard, frightened, or re-traumatised.`,
      severity: "critical",
    });
  }

  if (bodyMapRate < 50 && totalRestraints > 0) {
    insights.push({
      text: `Body maps completed in only ${bodyMapRate}% of restraints. This is a safeguarding failure — without body maps, injuries may go unrecorded and allegations cannot be properly investigated. Reg 13 compliance is at risk.`,
      severity: "critical",
    });
  }

  if (rewardToSanctionRatio < 1.0 && sanctionCount > 0) {
    insights.push({
      text: `The reward-to-sanction ratio of ${rewardToSanctionRatio}:1 indicates a punitive culture. Research consistently shows that positive reinforcement is more effective than sanctions in supporting children's behavioural development. Ofsted expects a positive behaviour culture under Reg 12.`,
      severity: "critical",
    });
  }

  if (rewardCount === 0 && sanctionCount > 0) {
    insights.push({
      text: "The home operates a sanctions-only model with no positive reinforcement recorded. This fundamentally undermines emotional safety — children need to experience praise, celebration, and recognition alongside any consequences.",
      severity: "critical",
    });
  }

  if (restraintReviewRate < 50 && totalRestraints > 0) {
    insights.push({
      text: `Only ${restraintReviewRate}% of restraints reviewed by management. Without systematic review, the home cannot identify patterns, prevent unnecessary restraints, or demonstrate quality oversight under Reg 45.`,
      severity: "critical",
    });
  }

  if (injuryRate >= 30 && totalRestraints > 0) {
    insights.push({
      text: `Injuries in ${injuryRate}% of restraints signals a serious concern about the safety of restraint techniques. This requires immediate investigation and may trigger Ofsted notification under Reg 40.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    childDebriefRate >= 50 &&
    childDebriefRate < 80 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: `Child debrief rate at ${childDebriefRate}% — improving but some children still miss post-restraint debriefs. Each missed debrief is a missed opportunity to repair trust and restore emotional safety.`,
      severity: "warning",
    });
  }

  if (
    staffDebriefRate >= 50 &&
    staffDebriefRate < 80 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: `Staff debrief rate at ${staffDebriefRate}% — some staff are not supported to process restraint experiences, which may contribute to burnout and secondary trauma.`,
      severity: "warning",
    });
  }

  if (staffDebriefRate < 50 && totalRestraints > 0) {
    insights.push({
      text: `Only ${staffDebriefRate}% of staff debriefed after restraint — staff who carry unprocessed experiences are at greater risk of emotional dysregulation, which directly impacts the emotional safety climate for children.`,
      severity: "warning",
    });
  }

  if (
    rewardToSanctionRatio >= 1.0 &&
    rewardToSanctionRatio < 2.0 &&
    sanctionCount > 0
  ) {
    insights.push({
      text: `Reward-to-sanction ratio of ${rewardToSanctionRatio}:1 — while rewards are not outweighed by sanctions, best practice aims for at least 4:1 to create a genuinely positive behaviour culture.`,
      severity: "warning",
    });
  }

  if (
    deEscalationRate >= 80 &&
    deEscalationRate < 100 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: `De-escalation attempted in ${deEscalationRate}% of restraints — while generally strong, the aim should be 100% to demonstrate consistent commitment to least restrictive practice.`,
      severity: "warning",
    });
  }

  if (deEscalationRate < 80 && totalRestraints > 0) {
    insights.push({
      text: `De-escalation attempted in only ${deEscalationRate}% of restraints — staff may be moving to physical intervention too quickly, undermining children's emotional safety and trust.`,
      severity: "warning",
    });
  }

  if (
    postIncidentQualityAvg >= 3.0 &&
    postIncidentQualityAvg < 4.0 &&
    totalPostIncidentDebriefs > 0
  ) {
    insights.push({
      text: `Post-incident debrief quality averaging ${postIncidentQualityAvg}/5 — competent but not yet consistently capturing the depth of child voice and learning needed for outstanding practice.`,
      severity: "warning",
    });
  }

  if (
    achievementCelebrationRate >= 50 &&
    achievementCelebrationRate < 70 &&
    positiveAchievementCount > 0
  ) {
    insights.push({
      text: `${achievementCelebrationRate}% of achievements celebrated — many positive moments are recorded but not actively celebrated, which limits their impact on children's self-esteem.`,
      severity: "warning",
    });
  }

  if (
    injuryRate > 0 &&
    injuryRate < 30 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: `Injuries recorded in ${injuryRate}% of restraints — while not at critical levels, every injury warrants review of technique and consideration of alternative approaches.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (safety_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates an outstanding emotional safety climate — children and staff experience a culture of support, positive reinforcement, reflective practice, and genuine celebration of achievement. This is strong evidence for Reg 45 quality of care.",
      severity: "positive",
    });
  }

  if (
    childDebriefRate >= 100 &&
    staffDebriefRate >= 100 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: "Both children and staff are debriefed after every restraint — this dual-focus approach ensures emotional safety for everyone involved and demonstrates genuine commitment to restorative practice.",
      severity: "positive",
    });
  }

  if (rewardToSanctionRatio >= 4.0 && sanctionCount > 0) {
    insights.push({
      text: `A ${rewardToSanctionRatio}:1 reward-to-sanction ratio demonstrates a genuinely positive behaviour culture. Ofsted will view this as strong evidence of child-centred practice under Reg 12.`,
      severity: "positive",
    });
  }

  if (rewardCount > 0 && sanctionCount === 0) {
    insights.push({
      text: "The home operates a rewards-only approach with zero sanctions — this reflects an outstanding positive behaviour culture where children are motivated through recognition and celebration.",
      severity: "positive",
    });
  }

  if (
    deEscalationRate >= 100 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: "De-escalation attempted before every restraint — the home consistently demonstrates commitment to least restrictive practice, which is a key indicator of emotional safety.",
      severity: "positive",
    });
  }

  if (
    bodyMapRate >= 100 &&
    restraintReviewRate >= 100 &&
    totalRestraints > 0
  ) {
    insights.push({
      text: "Body maps and management reviews completed for every restraint — exemplary safeguarding documentation and oversight that Ofsted will view positively under Reg 13 and Reg 45.",
      severity: "positive",
    });
  }

  if (
    achievementCelebrationRate >= 90 &&
    achievementCategories >= 4 &&
    positiveAchievementCount > 0
  ) {
    insights.push({
      text: `Achievements celebrated across ${achievementCategories} domains with ${achievementCelebrationRate}% celebration rate — the home recognises and values children's whole-person development.`,
      severity: "positive",
    });
  }

  if (
    postIncidentQualityAvg >= 4.0 &&
    totalPostIncidentDebriefs > 0 &&
    pct(debriefVoiceCaptured, totalPostIncidentDebriefs) >= 90
  ) {
    insights.push({
      text: `High-quality post-incident debriefs (${postIncidentQualityAvg}/5 average) with child voice captured in ${pct(debriefVoiceCaptured, totalPostIncidentDebriefs)}% — children's experiences are at the centre of the home's incident response.`,
      severity: "positive",
    });
  }

  if (
    staffSupportRate >= 90 &&
    staffEmotionalExplorationRate >= 90 &&
    totalStaffDebriefs > 0
  ) {
    insights.push({
      text: "Staff debriefs consistently explore emotional impact and offer support — this investment in staff wellbeing directly strengthens the emotional safety climate for children.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (safety_rating === "outstanding") {
    headline =
      "Outstanding emotional safety climate — children and staff are supported through reflective practice, positive reinforcement, and celebration of achievement.";
  } else if (safety_rating === "good") {
    headline = `Good emotional safety climate — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (safety_rating === "adequate") {
    headline = `Adequate emotional safety climate — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children and staff feel consistently safe and supported.`;
  } else {
    headline = `Emotional safety climate is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children and staff experience emotional safety.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    safety_rating,
    safety_score: score,
    headline,
    total_restraints: totalRestraints,
    average_restraint_duration: avgRestraintDuration,
    restraint_review_rate: restraintReviewRate,
    child_debrief_rate: childDebriefRate,
    staff_debrief_rate: staffDebriefRate,
    reward_to_sanction_ratio: rewardToSanctionRatio,
    positive_achievement_count: positiveAchievementCount,
    achievement_celebration_rate: achievementCelebrationRate,
    de_escalation_attempt_rate: deEscalationRate,
    body_map_completion_rate: bodyMapRate,
    post_incident_quality_avg: postIncidentQualityAvg,
    injury_rate: injuryRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
