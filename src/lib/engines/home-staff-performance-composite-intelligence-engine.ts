// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF PERFORMANCE COMPOSITE INTELLIGENCE ENGINE
// Home-level: correlates appraisal quality, supervision regularity, training
// compliance, safeguarding discussion, action follow-through, and wellbeing &
// development to produce an overall staff performance composite score.
// CHR 2015 Reg 33 (employment of staff), Reg 32 (fitness of staff),
// Reg 34 (CPD). SCCIF: "Well-led and managed", "Quality of care".
// NMS 19.2, 19.3, 19.4.
// Pure deterministic engine — no imports, no LLM, no external deps.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AppraisalInput {
  id: string;
  staff_id: string;
  date: string;
  status: string;                    // "completed" | "scheduled" | "overdue"
  overall_rating: string;            // "outstanding" | "good" | "requires_improvement" | "inadequate"
  average_competency_score: number;  // average of all competency scores (1-5)
  objectives_set: number;
  objectives_met: number;
  has_development_plan: boolean;
}

export interface SupervisionInput {
  id: string;
  staff_id: string;
  date: string;
  status: string;                    // "completed" | "scheduled" | "cancelled" | "overdue"
  safeguarding_discussed: boolean;
  actions_agreed: number;
  actions_completed: number;
  wellbeing_check: boolean;
}

export interface TrainingInput {
  id: string;
  staff_id: string;
  category: string;
  status: string;                    // "completed" | "expired" | "booked" | "not_started"
  is_mandatory: boolean;
  is_expired: boolean;               // expiry_date < today
  days_until_expiry: number;         // negative if expired
}

export interface StaffPerformanceCompositeInput {
  today: string;
  total_staff: number;
  appraisals: AppraisalInput[];
  supervisions: SupervisionInput[];
  training: TrainingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffPerformanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PerformanceInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PerformanceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffPerformanceCompositeResult {
  performance_rating: StaffPerformanceRating;
  performance_score: number;
  headline: string;
  total_appraisals: number;
  appraisal_completion_rate: number;
  average_competency_score: number;
  total_supervisions: number;
  supervision_completion_rate: number;
  safeguarding_discussion_rate: number;
  action_completion_rate: number;
  wellbeing_check_rate: number;
  total_training: number;
  training_compliance_rate: number;
  expired_mandatory_count: number;
  objective_achievement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PerformanceRecommendation[];
  insights: PerformanceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffPerformanceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffPerformanceComposite(
  input: StaffPerformanceCompositeInput,
): StaffPerformanceCompositeResult {
  const { total_staff, appraisals, supervisions, training } = input;

  // ── Insufficient data: no staff ──────────────────────────────────────
  if (total_staff === 0) {
    return {
      performance_rating: "insufficient_data",
      performance_score: 0,
      headline: "Insufficient data — no staff recorded to assess performance composite.",
      total_appraisals: 0,
      appraisal_completion_rate: 0,
      average_competency_score: 0,
      total_supervisions: 0,
      supervision_completion_rate: 0,
      safeguarding_discussion_rate: 0,
      action_completion_rate: 0,
      wellbeing_check_rate: 0,
      total_training: 0,
      training_compliance_rate: 0,
      expired_mandatory_count: 0,
      objective_achievement_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        { rank: 1, recommendation: "Record staff performance data to enable composite analysis.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" },
      ],
      insights: [
        { text: "No staff data available. Cannot assess staff performance composite.", severity: "warning" },
      ],
    };
  }

  // ── Special case: all arrays empty but staff exist ────────────────────
  if (appraisals.length === 0 && supervisions.length === 0 && training.length === 0) {
    return {
      performance_rating: "inadequate",
      performance_score: 20,
      headline: "Staff performance is inadequate — no appraisals, supervisions, or training records exist despite active staff.",
      total_appraisals: 0,
      appraisal_completion_rate: 0,
      average_competency_score: 0,
      total_supervisions: 0,
      supervision_completion_rate: 0,
      safeguarding_discussion_rate: 0,
      action_completion_rate: 0,
      wellbeing_check_rate: 0,
      total_training: 0,
      training_compliance_rate: 0,
      expired_mandatory_count: 0,
      objective_achievement_rate: 0,
      strengths: [],
      concerns: ["No staff development framework in place — no appraisals, supervisions, or training records exist."],
      recommendations: [
        { rank: 1, recommendation: "Establish a staff development framework including appraisals, supervisions, and training as required by Reg 33.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" },
        { rank: 2, recommendation: "Implement a mandatory training programme for all staff to meet Reg 32 fitness requirements.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" },
        { rank: 3, recommendation: "Set up regular supervision cycles with safeguarding and wellbeing as standing agenda items per NMS 19.2.", urgency: "immediate", regulatory_ref: "NMS 19.2" },
      ],
      insights: [
        { text: "No staff development framework exists. This is a major regulatory concern under CHR 2015 Reg 33 and would be flagged as inadequate at inspection.", severity: "critical" },
      ],
    };
  }

  // ── Compute metrics ──────────────────────────────────────────────────

  // Appraisal metrics
  const totalAppraisals = appraisals.length;
  const completedAppraisals = appraisals.filter(a => a.status === "completed");
  const appraisalCompletionRate = pct(completedAppraisals.length, totalAppraisals);

  const competencyScores = completedAppraisals
    .map(a => a.average_competency_score)
    .filter(s => s > 0);
  const averageCompetencyScore = competencyScores.length > 0
    ? Math.round((competencyScores.reduce((sum, s) => sum + s, 0) / competencyScores.length) * 10) / 10
    : 0;

  const devPlanCount = completedAppraisals.filter(a => a.has_development_plan).length;
  const devPlanRate = pct(devPlanCount, completedAppraisals.length);

  // Supervision metrics
  const totalSupervisions = supervisions.length;
  const completedSupervisions = supervisions.filter(s => s.status === "completed");
  const nonScheduledSupervisions = supervisions.filter(s => s.status !== "scheduled");
  const supervisionCompletionRate = pct(completedSupervisions.length, nonScheduledSupervisions.length);

  const safeguardingDiscussed = completedSupervisions.filter(s => s.safeguarding_discussed).length;
  const safeguardingDiscussionRate = pct(safeguardingDiscussed, completedSupervisions.length);

  const totalActionsAgreed = supervisions.reduce((sum, s) => sum + s.actions_agreed, 0);
  const totalActionsCompleted = supervisions.reduce((sum, s) => sum + s.actions_completed, 0);
  const actionCompletionRate = pct(totalActionsCompleted, totalActionsAgreed);

  const wellbeingChecks = completedSupervisions.filter(s => s.wellbeing_check).length;
  const wellbeingCheckRate = pct(wellbeingChecks, completedSupervisions.length);

  // Training metrics
  const totalTraining = training.length;
  const completedTraining = training.filter(t => t.status === "completed");
  const mandatoryTraining = training.filter(t => t.is_mandatory);
  const expiredMandatory = mandatoryTraining.filter(t => t.is_expired);
  const expiredMandatoryCount = expiredMandatory.length;
  const trainingComplianceRate = pct(completedTraining.length, totalTraining);

  // Objective metrics
  const totalObjSet = appraisals.reduce((sum, a) => sum + a.objectives_set, 0);
  const totalObjMet = appraisals.reduce((sum, a) => sum + a.objectives_met, 0);
  const objectiveAchievementRate = pct(totalObjMet, totalObjSet);

  // ── Scoring (base 52, 6 modifiers) ───────────────────────────────────
  let score = 52;

  // Mod 1: Appraisal quality (completed rate + avg competency ≥3.5 + has_development_plan)
  if (totalAppraisals === 0) {
    score -= 3;
  } else {
    const appraisalExcellent =
      appraisalCompletionRate >= 90 &&
      averageCompetencyScore >= 3.5 &&
      devPlanRate >= 90;
    const appraisalGood =
      appraisalCompletionRate >= 70 &&
      averageCompetencyScore >= 3.0;

    if (appraisalExcellent) {
      score += 6;
    } else if (appraisalGood) {
      score += 3;
    } else {
      score -= 5;
    }

    if (appraisalCompletionRate < 50) {
      score -= 3;
    }
  }

  // Mod 2: Supervision regularity (completed rate excluding scheduled)
  if (totalSupervisions === 0) {
    score -= 1;
  } else {
    if (supervisionCompletionRate >= 95) {
      score += 5;
    } else if (supervisionCompletionRate >= 80) {
      score += 2;
    } else if (supervisionCompletionRate >= 60) {
      score += 0;
    } else {
      score -= 5;
    }
  }

  // Mod 3: Safeguarding discussion (in completed supervisions)
  if (completedSupervisions.length === 0) {
    score -= 1;
  } else {
    if (safeguardingDiscussionRate >= 95) {
      score += 5;
    } else if (safeguardingDiscussionRate >= 80) {
      score += 2;
    } else if (safeguardingDiscussionRate >= 60) {
      score += 0;
    } else {
      score -= 4;
    }
  }

  // Mod 4: Training compliance (no expired mandatory + completion rate)
  if (totalTraining === 0) {
    score -= 1;
  } else {
    if (expiredMandatoryCount === 0 && trainingComplianceRate >= 90) {
      score += 5;
    } else if (expiredMandatoryCount <= 2) {
      score += 2;
    } else if (expiredMandatoryCount > 5) {
      score -= 4;
    } else {
      score += 0;
    }
  }

  // Mod 5: Action follow-through (actions_completed / actions_agreed)
  if (totalActionsAgreed === 0) {
    score -= 1;
  } else {
    if (actionCompletionRate >= 90) {
      score += 4;
    } else if (actionCompletionRate >= 70) {
      score += 2;
    } else if (actionCompletionRate >= 50) {
      score += 0;
    } else {
      score -= 4;
    }
  }

  // Mod 6: Wellbeing & development (wellbeing_check rate + objective achievement rate)
  const hasWellbeingData = completedSupervisions.length > 0;
  const hasObjData = totalObjSet > 0;
  if (!hasWellbeingData && !hasObjData) {
    score -= 2;
  } else {
    const wbMet = hasWellbeingData ? wellbeingCheckRate : 0;
    const objMet = hasObjData ? objectiveAchievementRate : 0;
    const dataPoints = (hasWellbeingData ? 1 : 0) + (hasObjData ? 1 : 0);
    const combinedRate = Math.round((wbMet + objMet) / dataPoints);

    if (combinedRate >= 80) {
      score += 5;
    } else if (combinedRate >= 60) {
      score += 2;
    } else if (combinedRate >= 40) {
      score += 0;
    } else {
      score -= 3;
    }
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (appraisalCompletionRate >= 90 && totalAppraisals > 0) {
    strengths.push(`Appraisal completion rate at ${appraisalCompletionRate}% — strong staff review cycle.`);
  }
  if (averageCompetencyScore >= 4.0 && competencyScores.length > 0) {
    strengths.push(`Average competency score of ${averageCompetencyScore} out of 5 — staff demonstrate high capability.`);
  }
  if (supervisionCompletionRate >= 95 && nonScheduledSupervisions.length > 0) {
    strengths.push(`Supervision completion rate at ${supervisionCompletionRate}% — consistent management oversight.`);
  }
  if (safeguardingDiscussionRate >= 95 && completedSupervisions.length > 0) {
    strengths.push(`Safeguarding discussed in ${safeguardingDiscussionRate}% of supervisions — embedded safeguarding culture.`);
  }
  if (actionCompletionRate >= 90 && totalActionsAgreed > 0) {
    strengths.push(`Action follow-through at ${actionCompletionRate}% — agreed actions are consistently completed.`);
  }
  if (expiredMandatoryCount === 0 && mandatoryTraining.length > 0) {
    strengths.push("No expired mandatory training — all staff are compliant with training requirements.");
  }
  if (trainingComplianceRate >= 90 && totalTraining > 0) {
    strengths.push(`Training compliance at ${trainingComplianceRate}% — staff development programme is effective.`);
  }
  if (wellbeingCheckRate >= 90 && completedSupervisions.length > 0) {
    strengths.push(`Wellbeing checks in ${wellbeingCheckRate}% of supervisions — staff welfare is prioritised.`);
  }
  if (objectiveAchievementRate >= 90 && totalObjSet > 0) {
    strengths.push(`Objective achievement at ${objectiveAchievementRate}% — staff are meeting development goals.`);
  }
  if (devPlanRate >= 90 && completedAppraisals.length > 0) {
    strengths.push(`${devPlanRate}% of completed appraisals include development plans — proactive CPD culture.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (appraisalCompletionRate < 50 && totalAppraisals > 0) {
    concerns.push(`Appraisal completion at only ${appraisalCompletionRate}% — staff review process is failing.`);
  }
  if (supervisionCompletionRate < 60 && nonScheduledSupervisions.length > 0) {
    concerns.push(`Supervision completion at ${supervisionCompletionRate}% — management oversight is inadequate.`);
  }
  if (safeguardingDiscussionRate < 60 && completedSupervisions.length > 0) {
    concerns.push(`Safeguarding discussed in only ${safeguardingDiscussionRate}% of supervisions — safeguarding is not embedded.`);
  }
  if (expiredMandatoryCount > 5) {
    concerns.push(`${expiredMandatoryCount} mandatory training records have expired — significant compliance breach.`);
  } else if (expiredMandatoryCount > 0) {
    concerns.push(`${expiredMandatoryCount} mandatory training record${expiredMandatoryCount > 1 ? "s have" : " has"} expired — renewal required.`);
  }
  if (actionCompletionRate < 50 && totalActionsAgreed > 0) {
    concerns.push(`Action follow-through at only ${actionCompletionRate}% — agreed supervision actions are not being completed.`);
  }
  if (wellbeingCheckRate < 40 && completedSupervisions.length > 0) {
    concerns.push(`Wellbeing checks in only ${wellbeingCheckRate}% of supervisions — staff welfare monitoring is insufficient.`);
  }
  if (objectiveAchievementRate < 40 && totalObjSet > 0) {
    concerns.push(`Objective achievement at ${objectiveAchievementRate}% — staff are not meeting development targets.`);
  }
  if (averageCompetencyScore < 2.5 && competencyScores.length > 0) {
    concerns.push(`Average competency score of ${averageCompetencyScore} — staff capability is below expected standard.`);
  }
  if (totalAppraisals === 0 && total_staff > 0) {
    concerns.push("No appraisal records exist — staff performance is not being formally reviewed.");
  }
  if (totalSupervisions === 0 && total_staff > 0) {
    concerns.push("No supervision records exist — management oversight of staff is absent.");
  }
  if (totalTraining === 0 && total_staff > 0) {
    concerns.push("No training records exist — staff training compliance cannot be evidenced.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: PerformanceRecommendation[] = [];
  let rank = 1;

  if (expiredMandatoryCount > 0) {
    recommendations.push({ rank: rank++, recommendation: `Arrange immediate renewal for ${expiredMandatoryCount} expired mandatory training record${expiredMandatoryCount > 1 ? "s" : ""} to restore compliance.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (appraisalCompletionRate < 50 && totalAppraisals > 0) {
    recommendations.push({ rank: rank++, recommendation: `Urgently improve appraisal completion from ${appraisalCompletionRate}% — Reg 33 requires regular performance review.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (totalAppraisals === 0 && total_staff > 0) {
    recommendations.push({ rank: rank++, recommendation: "Implement an appraisal programme for all staff as required by Reg 33.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (supervisionCompletionRate < 60 && nonScheduledSupervisions.length > 0) {
    recommendations.push({ rank: rank++, recommendation: `Improve supervision completion from ${supervisionCompletionRate}% — regular supervision is a Reg 33 requirement.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (totalSupervisions === 0 && total_staff > 0) {
    recommendations.push({ rank: rank++, recommendation: "Establish a regular supervision cycle for all staff per NMS 19.2.", urgency: "immediate", regulatory_ref: "NMS 19.2" });
  }
  if (safeguardingDiscussionRate < 60 && completedSupervisions.length > 0) {
    recommendations.push({ rank: rank++, recommendation: `Ensure safeguarding is a standing agenda item in supervision — currently discussed in only ${safeguardingDiscussionRate}% of sessions.`, urgency: "soon", regulatory_ref: "NMS 19.3" });
  }
  if (actionCompletionRate < 50 && totalActionsAgreed > 0) {
    recommendations.push({ rank: rank++, recommendation: `Improve action follow-through from ${actionCompletionRate}% — track and review agreed actions in each supervision.`, urgency: "soon", regulatory_ref: "NMS 19.4" });
  }
  if (totalTraining === 0 && total_staff > 0) {
    recommendations.push({ rank: rank++, recommendation: "Implement a mandatory training programme for all staff per Reg 32.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (wellbeingCheckRate < 40 && completedSupervisions.length > 0) {
    recommendations.push({ rank: rank++, recommendation: `Include wellbeing checks in all supervisions — currently only ${wellbeingCheckRate}% include a wellbeing discussion.`, urgency: "soon", regulatory_ref: "SCCIF Well-led" });
  }
  if (objectiveAchievementRate < 40 && totalObjSet > 0) {
    recommendations.push({ rank: rank++, recommendation: `Review and support staff in meeting development objectives — currently at ${objectiveAchievementRate}% achievement.`, urgency: "planned", regulatory_ref: "CHR 2015 Reg 34" });
  }
  if (averageCompetencyScore < 3.0 && competencyScores.length > 0) {
    recommendations.push({ rank: rank++, recommendation: `Address competency gaps — average score is ${averageCompetencyScore} and needs targeted development.`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (devPlanRate < 50 && completedAppraisals.length > 0) {
    recommendations.push({ rank: rank++, recommendation: `Ensure all appraisals include a development plan — currently only ${devPlanRate}% do.`, urgency: "planned", regulatory_ref: "CHR 2015 Reg 34" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: PerformanceInsight[] = [];

  // Outstanding territory check
  const allRatingsGoodOrAbove = completedAppraisals.length > 0 &&
    completedAppraisals.every(a => a.overall_rating === "outstanding" || a.overall_rating === "good");
  if (allRatingsGoodOrAbove && supervisionCompletionRate === 100 && expiredMandatoryCount === 0 && completedAppraisals.length > 0 && nonScheduledSupervisions.length > 0 && mandatoryTraining.length > 0) {
    insights.push({ text: "All appraisals rated good or outstanding, supervision compliance at 100%, and no expired training — staff performance is in outstanding territory.", severity: "positive" });
  }

  if (rating === "outstanding") {
    insights.push({ text: "Staff performance composite is outstanding — appraisal quality, supervision compliance, training, and wellbeing indicators all performing strongly.", severity: "positive" });
  }
  if (rating === "inadequate") {
    insights.push({ text: "Staff performance is inadequate — multiple areas of the staff development framework are failing and regulatory compliance is at risk.", severity: "critical" });
  }

  if (expiredMandatoryCount >= 5) {
    insights.push({ text: `${expiredMandatoryCount} mandatory training records have expired. This is a significant compliance risk under Reg 32 that Ofsted will identify during inspection.`, severity: "critical" });
  } else if (expiredMandatoryCount > 0) {
    insights.push({ text: `${expiredMandatoryCount} mandatory training record${expiredMandatoryCount > 1 ? "s have" : " has"} expired — prioritise renewal to maintain Reg 32 compliance.`, severity: "warning" });
  }

  if (safeguardingDiscussionRate < 60 && completedSupervisions.length > 0) {
    insights.push({ text: `Safeguarding discussed in only ${safeguardingDiscussionRate}% of supervisions. This gap in safeguarding oversight could be flagged during Ofsted inspection under SCCIF quality of care.`, severity: "critical" });
  }

  if (supervisionCompletionRate >= 95 && actionCompletionRate < 50 && totalActionsAgreed > 0 && nonScheduledSupervisions.length > 0) {
    insights.push({ text: "Supervision sessions are regular but action follow-through is poor — the value of supervision is undermined when agreed actions are not completed.", severity: "warning" });
  }

  if (appraisalCompletionRate >= 90 && averageCompetencyScore >= 3.5 && devPlanRate >= 90 && totalAppraisals > 0) {
    insights.push({ text: "Appraisal programme is strong — high completion, good competency scores, and development plans in place. Evidence of effective staff performance management.", severity: "positive" });
  }

  if (wellbeingCheckRate >= 90 && completedSupervisions.length > 0 && objectiveAchievementRate >= 80 && totalObjSet > 0) {
    insights.push({ text: "Wellbeing and development indicators are strong — staff feel supported and are meeting their objectives.", severity: "positive" });
  }

  if (wellbeingCheckRate < 40 && completedSupervisions.length > 0 && objectiveAchievementRate < 40 && totalObjSet > 0) {
    insights.push({ text: "Both wellbeing checks and objective achievement are poor — staff may be unsupported and disengaged from their development.", severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding staff performance — ${appraisalCompletionRate}% appraisal completion, ${supervisionCompletionRate}% supervision compliance, and ${expiredMandatoryCount === 0 ? "no" : expiredMandatoryCount} expired training.`;
  } else if (rating === "good") {
    const issues: string[] = [];
    if (expiredMandatoryCount > 0) issues.push(`${expiredMandatoryCount} expired training`);
    if (actionCompletionRate < 70 && totalActionsAgreed > 0) issues.push(`${actionCompletionRate}% action follow-through`);
    if (safeguardingDiscussionRate < 80 && completedSupervisions.length > 0) issues.push(`${safeguardingDiscussionRate}% safeguarding discussion`);
    headline = issues.length > 0
      ? `Good staff performance — attention needed on ${issues.join(", ")}.`
      : "Good staff performance — appraisals, supervisions, and training are well-managed.";
  } else if (rating === "adequate") {
    headline = "Adequate staff performance — gaps in appraisals, supervision, or training compliance require focused improvement.";
  } else {
    headline = "Staff performance is inadequate — significant regulatory concerns across appraisal, supervision, and training compliance.";
  }

  return {
    performance_rating: rating,
    performance_score: score,
    headline,
    total_appraisals: totalAppraisals,
    appraisal_completion_rate: appraisalCompletionRate,
    average_competency_score: averageCompetencyScore,
    total_supervisions: totalSupervisions,
    supervision_completion_rate: supervisionCompletionRate,
    safeguarding_discussion_rate: safeguardingDiscussionRate,
    action_completion_rate: actionCompletionRate,
    wellbeing_check_rate: wellbeingCheckRate,
    total_training: totalTraining,
    training_compliance_rate: trainingComplianceRate,
    expired_mandatory_count: expiredMandatoryCount,
    objective_achievement_rate: objectiveAchievementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
