// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NIGHT CARE QUALITY INTELLIGENCE ENGINE
// Monitors the quality and safety of overnight care provision. Analyzes night
// check compliance, night log quality, handover completeness, sleep support
// provision, and night-time anxiety support for children.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (care standard), Reg 25 (premises safety).
// SCCIF: safety and wellbeing.
// Store keys: nightChecks, nightLogs, nightStaffHandovers,
//             sleepAssessmentRecords, nightAnxietySupportRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface NightCheckInput {
  id: string;
  child_id: string;
  check_date: string;
  check_time: string;
  staff_id: string;
  child_present: boolean;
  child_sleeping: boolean;
  child_settled: boolean;
  notes: string;
  within_schedule: boolean;
  created_at: string;
}

export interface NightLogInput {
  id: string;
  log_date: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  incidents_recorded: number;
  children_checked_count: number;
  concerns_flagged: number;
  handover_notes: string;
  quality_rating: number; // 1-5
  completed: boolean;
  created_at: string;
}

export interface NightStaffHandoverInput {
  id: string;
  handover_date: string;
  outgoing_staff_id: string;
  incoming_staff_id: string;
  all_children_accounted: boolean;
  key_events_documented: boolean;
  medication_updates: boolean;
  concerns_raised: boolean;
  quality_rating: number; // 1-5
  completed: boolean;
  created_at: string;
}

export interface SleepAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  sleep_pattern_documented: boolean;
  sleep_difficulties_identified: boolean;
  support_plan_in_place: boolean;
  reviewed: boolean;
  next_review_date: string;
  created_at: string;
}

export interface NightAnxietySupportInput {
  id: string;
  child_id: string;
  date: string;
  anxiety_trigger_identified: boolean;
  support_provided: boolean;
  de_escalation_used: boolean;
  child_settled_after: boolean;
  duration_minutes: number;
  staff_id: string;
  created_at: string;
}

export interface NightCareQualityInput {
  today: string;
  total_children: number;
  night_checks: NightCheckInput[];
  night_logs: NightLogInput[];
  night_staff_handovers: NightStaffHandoverInput[];
  sleep_assessments: SleepAssessmentInput[];
  night_anxiety_support: NightAnxietySupportInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NightCareRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NightCareInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface NightCareRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface NightCareQualityResult {
  night_care_rating: NightCareRating;
  night_care_score: number;
  headline: string;
  total_night_checks: number;
  night_check_compliance_rate: number;
  night_log_completion_rate: number;
  handover_completion_rate: number;
  handover_quality_avg: number;
  sleep_assessment_coverage: number;
  anxiety_support_response_rate: number;
  check_timeliness_rate: number;
  incident_documentation_rate: number;
  child_wellbeing_check_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: NightCareRecommendation[];
  insights: NightCareInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): NightCareRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: NightCareRating,
  score: number,
  headline: string,
): NightCareQualityResult {
  return {
    night_care_rating: rating,
    night_care_score: score,
    headline,
    total_night_checks: 0,
    night_check_compliance_rate: 0,
    night_log_completion_rate: 0,
    handover_completion_rate: 0,
    handover_quality_avg: 0,
    sleep_assessment_coverage: 0,
    anxiety_support_response_rate: 0,
    check_timeliness_rate: 0,
    incident_documentation_rate: 0,
    child_wellbeing_check_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeNightCareQuality(
  input: NightCareQualityInput,
): NightCareQualityResult {
  const {
    total_children,
    night_checks,
    night_logs,
    night_staff_handovers,
    sleep_assessments,
    night_anxiety_support,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──
  const allEmpty =
    night_checks.length === 0 &&
    night_logs.length === 0 &&
    night_staff_handovers.length === 0 &&
    sleep_assessments.length === 0 &&
    night_anxiety_support.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess night care quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ──
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No night care data recorded despite children in placement — night care practices require urgent attention.",
      ),
      concerns: [
        "No night check, night log, handover, sleep assessment, or anxiety support records exist despite children being in placement — night care quality cannot be evidenced.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured night check recording, night logs, and handover documentation to evidence the quality and safety of overnight care provision.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — The care standard",
        },
        {
          rank: 2,
          recommendation:
            "Develop sleep assessments for all children and ensure night anxiety support is documented to demonstrate individualised overnight care.",
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 25 — Premises safety, SCCIF safety and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of night care records means Ofsted cannot verify that children are safe, checked, and supported overnight. This represents a fundamental gap in care standard evidence under Reg 12 and premises safety under Reg 25.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Night check metrics ---
  const totalNightChecks = night_checks.length;

  // Night check compliance: checks completed vs expected
  // Expected = total_children * number of unique check dates (proxy for expected checks)
  const uniqueCheckDates = new Set(night_checks.map((c) => c.check_date)).size;
  const expectedChecks = total_children > 0 && uniqueCheckDates > 0
    ? total_children * uniqueCheckDates
    : totalNightChecks > 0 ? totalNightChecks : 1;
  const nightCheckComplianceRate = pct(totalNightChecks, expectedChecks);

  // Check timeliness: pct of checks done within expected window
  const timelyChecks = night_checks.filter((c) => c.within_schedule).length;
  const checkTimelinessRate = pct(timelyChecks, totalNightChecks);

  // Child wellbeing check rate: pct of checks that note child wellbeing (child_settled or notes present)
  const wellbeingChecks = night_checks.filter(
    (c) => c.child_settled || (c.notes && c.notes.trim().length > 0),
  ).length;
  const childWellbeingCheckRate = pct(wellbeingChecks, totalNightChecks);

  // --- Night log metrics ---
  const totalNightLogs = night_logs.length;
  const completedLogs = night_logs.filter((l) => l.completed).length;
  // Completion rate: completed logs vs total logs recorded
  const nightLogCompletionRate = pct(completedLogs, totalNightLogs);

  // Incident documentation rate: logs with incidents_recorded > 0 that are completed
  const logsWithIncidents = night_logs.filter((l) => l.incidents_recorded > 0);
  const logsWithIncidentsCompleted = logsWithIncidents.filter((l) => l.completed).length;
  const incidentDocumentationRate = pct(logsWithIncidentsCompleted, logsWithIncidents.length);

  // --- Handover metrics ---
  const totalHandovers = night_staff_handovers.length;
  const completedHandovers = night_staff_handovers.filter((h) => h.completed).length;
  const handoverCompletionRate = pct(completedHandovers, totalHandovers);

  const handoverQualitySum = night_staff_handovers.reduce(
    (sum, h) => sum + h.quality_rating,
    0,
  );
  const handoverQualityAvg =
    totalHandovers > 0
      ? Math.round((handoverQualitySum / totalHandovers) * 100) / 100
      : 0;

  // --- Sleep assessment metrics ---
  const totalSleepAssessments = sleep_assessments.length;
  const uniqueChildrenWithAssessments = new Set(
    sleep_assessments.map((s) => s.child_id),
  ).size;
  const sleepAssessmentCoverage = pct(uniqueChildrenWithAssessments, total_children);

  // --- Night anxiety support metrics ---
  const totalAnxietyEpisodes = night_anxiety_support.length;
  const supportedEpisodes = night_anxiety_support.filter(
    (a) => a.support_provided,
  ).length;
  const anxietySupportResponseRate = pct(supportedEpisodes, totalAnxietyEpisodes);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus: nightCheckComplianceRate (>=100: +4, >=90: +2) ---
  if (nightCheckComplianceRate >= 100) score += 4;
  else if (nightCheckComplianceRate >= 90) score += 2;

  // --- Bonus: nightLogCompletionRate (>=100: +3, >=90: +1) ---
  if (nightLogCompletionRate >= 100) score += 3;
  else if (nightLogCompletionRate >= 90) score += 1;

  // --- Bonus: handoverCompletionRate (>=100: +3, >=80: +1) ---
  if (handoverCompletionRate >= 100) score += 3;
  else if (handoverCompletionRate >= 80) score += 1;

  // --- Bonus: handoverQualityAvg (>=4.0: +3, >=3.0: +1) ---
  if (handoverQualityAvg >= 4.0) score += 3;
  else if (handoverQualityAvg >= 3.0) score += 1;

  // --- Bonus: sleepAssessmentCoverage (>=100: +3, >=80: +1) ---
  if (sleepAssessmentCoverage >= 100) score += 3;
  else if (sleepAssessmentCoverage >= 80) score += 1;

  // --- Bonus: anxietySupportResponseRate (>=100: +3, >=80: +1) ---
  if (anxietySupportResponseRate >= 100) score += 3;
  else if (anxietySupportResponseRate >= 80) score += 1;

  // --- Bonus: checkTimelinessRate (>=95: +3, >=80: +1) ---
  if (checkTimelinessRate >= 95) score += 3;
  else if (checkTimelinessRate >= 80) score += 1;

  // --- Bonus: incidentDocumentationRate (>=100: +3, >=80: +1) ---
  if (incidentDocumentationRate >= 100) score += 3;
  else if (incidentDocumentationRate >= 80) score += 1;

  // --- Bonus: childWellbeingCheckRate (>=90: +3, >=70: +1) ---
  if (childWellbeingCheckRate >= 90) score += 3;
  else if (childWellbeingCheckRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // nightCheckComplianceRate < 50 → -5
  if (nightCheckComplianceRate < 50) score -= 5;

  // nightLogCompletionRate < 50 → -5
  if (nightLogCompletionRate < 50 && totalNightLogs > 0) score -= 5;

  // handoverCompletionRate < 50 → -5
  if (handoverCompletionRate < 50 && totalHandovers > 0) score -= 5;

  // sleepAssessmentCoverage < 50 → -3
  if (sleepAssessmentCoverage < 50 && total_children > 0) score -= 3;

  score = clamp(score, 0, 100);

  const night_care_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (nightCheckComplianceRate >= 100 && totalNightChecks > 0) {
    strengths.push(
      "Night check compliance is at 100% — every expected night check has been completed, demonstrating thorough overnight monitoring.",
    );
  } else if (nightCheckComplianceRate >= 90 && totalNightChecks > 0) {
    strengths.push(
      `Night check compliance at ${nightCheckComplianceRate}% — strong commitment to regular overnight monitoring of children.`,
    );
  }

  if (nightLogCompletionRate >= 100 && totalNightLogs > 0) {
    strengths.push(
      "All night logs are completed — comprehensive documentation of overnight care provision.",
    );
  } else if (nightLogCompletionRate >= 90 && totalNightLogs > 0) {
    strengths.push(
      `${nightLogCompletionRate}% of night logs completed — strong overnight recording practices.`,
    );
  }

  if (handoverCompletionRate >= 100 && totalHandovers > 0) {
    strengths.push(
      "Every night-to-morning handover is completed — seamless continuity of care between shifts.",
    );
  } else if (handoverCompletionRate >= 80 && totalHandovers > 0) {
    strengths.push(
      `${handoverCompletionRate}% handover completion rate — good continuity of care documentation between night and day shifts.`,
    );
  }

  if (handoverQualityAvg >= 4.0 && totalHandovers > 0) {
    strengths.push(
      `Handover quality averages ${handoverQualityAvg}/5 — detailed and informative shift handovers supporting consistent care.`,
    );
  }

  if (sleepAssessmentCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has a sleep assessment — individualised sleep support is in place for all children.",
    );
  } else if (sleepAssessmentCoverage >= 80 && total_children > 0) {
    strengths.push(
      `Sleep assessment coverage at ${sleepAssessmentCoverage}% — strong focus on understanding and supporting children's sleep needs.`,
    );
  }

  if (anxietySupportResponseRate >= 100 && totalAnxietyEpisodes > 0) {
    strengths.push(
      "Every night anxiety episode has documented support — children experiencing anxiety overnight are consistently supported.",
    );
  } else if (anxietySupportResponseRate >= 80 && totalAnxietyEpisodes > 0) {
    strengths.push(
      `${anxietySupportResponseRate}% anxiety support response rate — strong commitment to supporting children who experience night-time anxiety.`,
    );
  }

  if (checkTimelinessRate >= 95 && totalNightChecks > 0) {
    strengths.push(
      "Night checks are consistently on schedule — children are monitored at the expected intervals throughout the night.",
    );
  } else if (checkTimelinessRate >= 80 && totalNightChecks > 0) {
    strengths.push(
      `${checkTimelinessRate}% of night checks completed within schedule — good adherence to overnight monitoring timings.`,
    );
  }

  if (incidentDocumentationRate >= 100 && logsWithIncidents.length > 0) {
    strengths.push(
      "All night incidents are properly documented — comprehensive incident recording during overnight shifts.",
    );
  }

  if (childWellbeingCheckRate >= 90 && totalNightChecks > 0) {
    strengths.push(
      `${childWellbeingCheckRate}% of night checks note child wellbeing — staff go beyond presence checks to assess how children are actually doing.`,
    );
  }

  const settledAfterSupport = night_anxiety_support.filter(
    (a) => a.child_settled_after,
  ).length;
  const settledRate = pct(settledAfterSupport, totalAnxietyEpisodes);
  if (settledRate >= 90 && totalAnxietyEpisodes > 0) {
    strengths.push(
      `${settledRate}% of children settled after anxiety support — effective night-time de-escalation and comfort practices.`,
    );
  }

  const deEscalationUsed = night_anxiety_support.filter(
    (a) => a.de_escalation_used,
  ).length;
  const deEscalationRate = pct(deEscalationUsed, totalAnxietyEpisodes);
  if (deEscalationRate >= 90 && totalAnxietyEpisodes > 0) {
    strengths.push(
      `De-escalation techniques used in ${deEscalationRate}% of night anxiety episodes — staff are skilled in calming anxious children overnight.`,
    );
  }

  const assessmentsWithSupportPlans = sleep_assessments.filter(
    (s) => s.support_plan_in_place,
  ).length;
  const supportPlanRate = pct(assessmentsWithSupportPlans, totalSleepAssessments);
  if (supportPlanRate >= 90 && totalSleepAssessments > 0) {
    strengths.push(
      `${supportPlanRate}% of sleep assessments have support plans in place — individualised sleep support is well-evidenced.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (nightCheckComplianceRate < 50) {
    concerns.push(
      `Night check compliance at only ${nightCheckComplianceRate}% — the majority of expected overnight checks are not being completed, leaving children unmonitored for extended periods.`,
    );
  } else if (nightCheckComplianceRate < 80 && nightCheckComplianceRate >= 50) {
    concerns.push(
      `Night check compliance at ${nightCheckComplianceRate}% — some expected overnight checks are being missed, creating gaps in children's overnight monitoring.`,
    );
  }

  if (nightLogCompletionRate < 50 && totalNightLogs > 0) {
    concerns.push(
      `Only ${nightLogCompletionRate}% of night logs completed — the majority of overnight shifts are not fully documented, preventing effective oversight of night care.`,
    );
  } else if (nightLogCompletionRate < 80 && nightLogCompletionRate >= 50 && totalNightLogs > 0) {
    concerns.push(
      `Night log completion at ${nightLogCompletionRate}% — some overnight shifts lack complete documentation.`,
    );
  }

  if (totalNightLogs === 0 && total_children > 0) {
    concerns.push(
      "No night logs recorded despite children in placement — overnight care provision is entirely undocumented.",
    );
  }

  if (handoverCompletionRate < 50 && totalHandovers > 0) {
    concerns.push(
      `Only ${handoverCompletionRate}% of handovers completed — critical information may be lost between night and day shifts, risking continuity of care.`,
    );
  } else if (handoverCompletionRate < 80 && handoverCompletionRate >= 50 && totalHandovers > 0) {
    concerns.push(
      `Handover completion at ${handoverCompletionRate}% — some shift transitions lack proper documentation, risking information gaps.`,
    );
  }

  if (totalHandovers === 0 && total_children > 0) {
    concerns.push(
      "No night-to-morning handover records exist — there is no evidence of structured information sharing between shifts.",
    );
  }

  if (handoverQualityAvg < 3.0 && totalHandovers > 0) {
    concerns.push(
      `Handover quality averages only ${handoverQualityAvg}/5 — handovers may lack the detail needed to ensure safe continuity of care.`,
    );
  }

  if (sleepAssessmentCoverage < 50 && total_children > 0) {
    concerns.push(
      `Sleep assessment coverage at only ${sleepAssessmentCoverage}% — the majority of children do not have documented sleep assessments, meaning their individual sleep needs are not formally identified.`,
    );
  } else if (sleepAssessmentCoverage < 80 && sleepAssessmentCoverage >= 50 && total_children > 0) {
    concerns.push(
      `Sleep assessment coverage at ${sleepAssessmentCoverage}% — some children still lack formal sleep assessments.`,
    );
  }

  if (sleepAssessmentCoverage === 0 && total_children > 0) {
    concerns.push(
      "No sleep assessments recorded for any child — individualised sleep support cannot be evidenced.",
    );
  }

  if (anxietySupportResponseRate < 50 && totalAnxietyEpisodes > 0) {
    concerns.push(
      `Only ${anxietySupportResponseRate}% of night anxiety episodes have documented support — children experiencing overnight anxiety may not be receiving adequate care.`,
    );
  } else if (anxietySupportResponseRate < 80 && anxietySupportResponseRate >= 50 && totalAnxietyEpisodes > 0) {
    concerns.push(
      `Anxiety support response rate at ${anxietySupportResponseRate}% — not all children experiencing night-time anxiety receive documented support.`,
    );
  }

  if (checkTimelinessRate < 50 && totalNightChecks > 0) {
    concerns.push(
      `Only ${checkTimelinessRate}% of night checks done within schedule — the majority of checks are late or irregular, undermining the purpose of overnight monitoring.`,
    );
  } else if (checkTimelinessRate < 80 && checkTimelinessRate >= 50 && totalNightChecks > 0) {
    concerns.push(
      `Check timeliness at ${checkTimelinessRate}% — some night checks are not being completed within the expected window.`,
    );
  }

  if (incidentDocumentationRate < 50 && logsWithIncidents.length > 0) {
    concerns.push(
      `Only ${incidentDocumentationRate}% of night incidents properly documented — significant gaps in overnight incident recording.`,
    );
  } else if (incidentDocumentationRate < 80 && incidentDocumentationRate >= 50 && logsWithIncidents.length > 0) {
    concerns.push(
      `Incident documentation rate at ${incidentDocumentationRate}% — some night incidents lack complete documentation.`,
    );
  }

  if (childWellbeingCheckRate < 50 && totalNightChecks > 0) {
    concerns.push(
      `Only ${childWellbeingCheckRate}% of night checks note child wellbeing — checks may be presence-only without assessing how children are actually doing.`,
    );
  } else if (childWellbeingCheckRate < 70 && childWellbeingCheckRate >= 50 && totalNightChecks > 0) {
    concerns.push(
      `Child wellbeing noted in ${childWellbeingCheckRate}% of night checks — more checks should include observations about children's state and comfort.`,
    );
  }

  if (settledRate < 50 && totalAnxietyEpisodes > 0) {
    concerns.push(
      `Only ${settledRate}% of children settled after anxiety support — current overnight de-escalation approaches may not be effective for all children.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: NightCareRecommendation[] = [];
  let rank = 0;

  if (nightCheckComplianceRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently increase night check compliance — all expected overnight checks must be completed to ensure children are safe and monitored throughout the night. Consider reviewing staffing levels and check schedules.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (nightLogCompletionRate < 50 && totalNightLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all night logs as a mandatory requirement — incomplete overnight documentation means the home cannot evidence the quality and safety of night care provision.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (totalNightLogs === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement night log recording immediately — every overnight shift must be documented to evidence the care provided and any events that occurred.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (handoverCompletionRate < 50 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all night-to-morning handovers are completed — incomplete handovers risk critical information being lost between shifts, directly impacting children's safety and care continuity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (totalHandovers === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured night-to-morning handover process — documented handovers are essential for continuity of care and ensuring all staff are aware of overnight events.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (sleepAssessmentCoverage === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete sleep assessments for all children — each child's sleep patterns, difficulties, and support needs must be individually documented and reviewed.",
      urgency: "immediate",
      regulatory_ref: "SCCIF safety and wellbeing",
    });
  } else if (sleepAssessmentCoverage < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend sleep assessment coverage to all children — the majority currently lack formal sleep assessments, meaning their individual sleep support needs are unknown.",
      urgency: "immediate",
      regulatory_ref: "SCCIF safety and wellbeing",
    });
  }

  if (checkTimelinessRate < 50 && totalNightChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve night check scheduling — checks must be completed within expected windows to ensure children are monitored at regular, predictable intervals.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety",
    });
  }

  if (anxietySupportResponseRate < 50 && totalAnxietyEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all night anxiety episodes receive documented support — children experiencing overnight anxiety must be actively supported and the response recorded.",
      urgency: "soon",
      regulatory_ref: "SCCIF safety and wellbeing",
    });
  }

  if (incidentDocumentationRate < 50 && logsWithIncidents.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve night incident documentation — all incidents occurring overnight must be properly logged within completed night logs to support safeguarding and review.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (handoverQualityAvg < 3.0 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve handover quality by ensuring key events, medication updates, and concerns are consistently documented — higher-quality handovers directly improve continuity of care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (childWellbeingCheckRate < 50 && totalNightChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Encourage staff to record child wellbeing observations during night checks — checks should go beyond confirming presence to note how children are settling and sleeping.",
      urgency: "soon",
      regulatory_ref: "SCCIF safety and wellbeing",
    });
  }

  if (nightCheckComplianceRate >= 50 && nightCheckComplianceRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase night check compliance to at least 90% — consistent overnight monitoring is essential for children's safety and wellbeing.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (nightLogCompletionRate >= 50 && nightLogCompletionRate < 80 && totalNightLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase night log completion rate towards 100% — every overnight shift should have a fully completed log.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (sleepAssessmentCoverage >= 50 && sleepAssessmentCoverage < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend sleep assessment coverage to all children — aim for 100% coverage to ensure every child's sleep needs are individually understood and supported.",
      urgency: "planned",
      regulatory_ref: "SCCIF safety and wellbeing",
    });
  }

  if (handoverCompletionRate >= 50 && handoverCompletionRate < 80 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase handover completion towards 100% — every shift transition should be formally documented to ensure continuity of care.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — The care standard",
    });
  }

  if (checkTimelinessRate >= 50 && checkTimelinessRate < 80 && totalNightChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve night check timeliness — aim for at least 95% of checks within the expected schedule window.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety",
    });
  }

  if (childWellbeingCheckRate >= 50 && childWellbeingCheckRate < 70 && totalNightChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of night checks that include child wellbeing observations — aim for at least 90% to demonstrate holistic overnight monitoring.",
      urgency: "planned",
      regulatory_ref: "SCCIF safety and wellbeing",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: NightCareInsight[] = [];

  // -- Critical insights --

  if (nightCheckComplianceRate < 50) {
    insights.push({
      text: `Night check compliance at only ${nightCheckComplianceRate}%. Ofsted expects regular overnight monitoring of all children under Reg 12. A compliance rate below 50% represents a significant safeguarding gap — children may be unsupervised for prolonged periods overnight.`,
      severity: "critical",
    });
  }

  if (nightLogCompletionRate < 50 && totalNightLogs > 0) {
    insights.push({
      text: `Only ${nightLogCompletionRate}% of night logs completed. Without comprehensive night logs, the home cannot evidence the quality of overnight care or demonstrate that children were safe throughout the night. This is a Reg 12 compliance risk.`,
      severity: "critical",
    });
  }

  if (totalNightLogs === 0 && total_children > 0) {
    insights.push({
      text: "No night logs exist despite children being in placement. Ofsted will view this as a fundamental failure to document overnight care provision, directly impacting Reg 12 compliance.",
      severity: "critical",
    });
  }

  if (handoverCompletionRate < 50 && totalHandovers > 0) {
    insights.push({
      text: `Only ${handoverCompletionRate}% of handovers completed. Incomplete handovers mean critical overnight information may not reach day staff — medication changes, incidents, and concerns could be lost between shifts.`,
      severity: "critical",
    });
  }

  if (sleepAssessmentCoverage === 0 && total_children > 0) {
    insights.push({
      text: "No children have sleep assessments. Ofsted expects individualised care planning that addresses sleep needs — this absence means night staff cannot tailor their support to each child's sleep difficulties or patterns.",
      severity: "critical",
    });
  }

  if (sleepAssessmentCoverage < 50 && sleepAssessmentCoverage > 0 && total_children > 0) {
    insights.push({
      text: `Sleep assessment coverage at only ${sleepAssessmentCoverage}%. The majority of children lack formal sleep assessments, meaning night staff may not understand their individual sleep needs or how to support them effectively.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (nightCheckComplianceRate >= 50 && nightCheckComplianceRate < 80) {
    insights.push({
      text: `Night check compliance at ${nightCheckComplianceRate}% — improving but gaps remain. Each missed check is a period where a child's safety and wellbeing is unmonitored.`,
      severity: "warning",
    });
  }

  if (nightLogCompletionRate >= 50 && nightLogCompletionRate < 80 && totalNightLogs > 0) {
    insights.push({
      text: `Night log completion at ${nightLogCompletionRate}% — some overnight shifts lack full documentation, making it difficult to evidence the quality of care provided.`,
      severity: "warning",
    });
  }

  if (handoverCompletionRate >= 50 && handoverCompletionRate < 80 && totalHandovers > 0) {
    insights.push({
      text: `Handover completion at ${handoverCompletionRate}% — while most transitions are documented, some shift changes occur without formal information sharing.`,
      severity: "warning",
    });
  }

  if (handoverQualityAvg >= 3.0 && handoverQualityAvg < 4.0 && totalHandovers > 0) {
    insights.push({
      text: `Handover quality averaging ${handoverQualityAvg}/5 — competent but could be more detailed. High-quality handovers should cover all children, medication, incidents, mood, and sleep patterns.`,
      severity: "warning",
    });
  }

  if (sleepAssessmentCoverage >= 50 && sleepAssessmentCoverage < 80 && total_children > 0) {
    insights.push({
      text: `Sleep assessment coverage at ${sleepAssessmentCoverage}% — improving but some children still lack formal assessments of their sleep needs.`,
      severity: "warning",
    });
  }

  if (anxietySupportResponseRate >= 50 && anxietySupportResponseRate < 80 && totalAnxietyEpisodes > 0) {
    insights.push({
      text: `Anxiety support response rate at ${anxietySupportResponseRate}% — not all children experiencing night anxiety receive documented support, which may leave some feeling unsupported during vulnerable moments.`,
      severity: "warning",
    });
  }

  if (anxietySupportResponseRate < 50 && totalAnxietyEpisodes > 0) {
    insights.push({
      text: `Only ${anxietySupportResponseRate}% of night anxiety episodes have documented support. Children who are anxious overnight and do not receive recorded support may feel abandoned or unsafe — this undermines the home's duty of care.`,
      severity: "warning",
    });
  }

  if (checkTimelinessRate >= 50 && checkTimelinessRate < 80 && totalNightChecks > 0) {
    insights.push({
      text: `Check timeliness at ${checkTimelinessRate}% — some night checks are completed outside the expected window, which may mean children go unchecked for longer than intended.`,
      severity: "warning",
    });
  }

  if (checkTimelinessRate < 50 && totalNightChecks > 0) {
    insights.push({
      text: `Only ${checkTimelinessRate}% of night checks done within schedule. Irregular check timing undermines the purpose of overnight monitoring and may indicate staffing or procedural issues.`,
      severity: "warning",
    });
  }

  if (childWellbeingCheckRate >= 50 && childWellbeingCheckRate < 70 && totalNightChecks > 0) {
    insights.push({
      text: `Child wellbeing noted in ${childWellbeingCheckRate}% of night checks — many checks confirm presence without assessing how the child is actually doing. Richer observations help build a picture of children's overnight experience.`,
      severity: "warning",
    });
  }

  if (incidentDocumentationRate >= 50 && incidentDocumentationRate < 80 && logsWithIncidents.length > 0) {
    insights.push({
      text: `Incident documentation rate at ${incidentDocumentationRate}% — some night incidents are recorded in logs that are not fully completed, which may mean the full picture is lost.`,
      severity: "warning",
    });
  }

  if (settledRate >= 50 && settledRate < 80 && totalAnxietyEpisodes > 0) {
    insights.push({
      text: `${settledRate}% of children settle after anxiety support — some children remain unsettled, suggesting current strategies may need review for individual children.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (night_care_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding overnight care quality — children are regularly monitored, night logs and handovers are comprehensive, sleep needs are individually assessed, and anxiety support is consistently provided. This is strong evidence for Reg 12 care standards and SCCIF safety and wellbeing.",
      severity: "positive",
    });
  }

  if (nightCheckComplianceRate >= 100 && checkTimelinessRate >= 95 && totalNightChecks > 0) {
    insights.push({
      text: "Full night check compliance with 95%+ timeliness — children are consistently monitored at the right intervals throughout the night, demonstrating excellent overnight safeguarding practice.",
      severity: "positive",
    });
  }

  if (handoverCompletionRate >= 100 && handoverQualityAvg >= 4.0 && totalHandovers > 0) {
    insights.push({
      text: `Every handover completed with ${handoverQualityAvg}/5 average quality — exemplary continuity of care between night and day shifts. Ofsted will view this positively under Reg 12.`,
      severity: "positive",
    });
  }

  if (sleepAssessmentCoverage >= 100 && supportPlanRate >= 90 && total_children > 0) {
    insights.push({
      text: "All children have sleep assessments with support plans in place — the home demonstrates truly individualised overnight care that responds to each child's unique sleep needs.",
      severity: "positive",
    });
  }

  if (anxietySupportResponseRate >= 100 && settledRate >= 90 && totalAnxietyEpisodes > 0) {
    insights.push({
      text: `Every anxiety episode supported with ${settledRate}% of children settling afterward — night staff are highly effective at recognising and responding to children's overnight anxiety, creating a sense of safety.`,
      severity: "positive",
    });
  }

  if (childWellbeingCheckRate >= 90 && totalNightChecks > 0) {
    insights.push({
      text: `${childWellbeingCheckRate}% of night checks include wellbeing observations — staff are not just checking presence but genuinely assessing how children are doing overnight, building a rich picture of each child's experience.`,
      severity: "positive",
    });
  }

  if (nightLogCompletionRate >= 100 && incidentDocumentationRate >= 100 && totalNightLogs > 0) {
    insights.push({
      text: "All night logs completed with 100% incident documentation — the home maintains a comprehensive overnight record that Ofsted can use to verify the quality and safety of night care under Reg 12.",
      severity: "positive",
    });
  }

  if (deEscalationRate >= 90 && settledRate >= 90 && totalAnxietyEpisodes > 0) {
    insights.push({
      text: `De-escalation used in ${deEscalationRate}% of anxiety episodes with ${settledRate}% of children settling — night staff demonstrate skilled, compassionate responses to children in distress.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (night_care_rating === "outstanding") {
    headline =
      "Outstanding night care quality — children are monitored, supported, and cared for through comprehensive overnight practices.";
  } else if (night_care_rating === "good") {
    headline = `Good night care quality — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (night_care_rating === "adequate") {
    headline = `Adequate night care quality — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure consistent overnight safety and support.`;
  } else {
    headline = `Night care quality is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are safe and supported overnight.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    night_care_rating,
    night_care_score: score,
    headline,
    total_night_checks: totalNightChecks,
    night_check_compliance_rate: nightCheckComplianceRate,
    night_log_completion_rate: nightLogCompletionRate,
    handover_completion_rate: handoverCompletionRate,
    handover_quality_avg: handoverQualityAvg,
    sleep_assessment_coverage: sleepAssessmentCoverage,
    anxiety_support_response_rate: anxietySupportResponseRate,
    check_timeliness_rate: checkTimelinessRate,
    incident_documentation_rate: incidentDocumentationRate,
    child_wellbeing_check_rate: childWellbeingCheckRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
