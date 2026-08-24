// ==============================================================================
// CARA -- HOME SAFEGUARDING PREVENTION INTELLIGENCE ENGINE
// Home-level: bullying incidents, hate incidents, Prevent duty compliance,
// court attendance support, and safeguarding prevention culture.
// CHR 2015 Reg 12: "Protection of children from harm and abuse."
// CHR 2015 Reg 13: "Child protection procedures."
// ==============================================================================

// -- Input types --------------------------------------------------------------

export interface BullyingInput {
  id: string;
  child_id: string;
  date: string;
  school_notified: boolean;
  police_notified: boolean;
  restorative_attempted: boolean;
  support_provided_count: number;
  status: "open" | "investigating" | "resolved" | "monitoring";
  follow_up_date: string;
}

export interface HateIncidentInput {
  id: string;
  date: string;
  reported_to_police: boolean;
  reported_to_ofsted: boolean;
  reported_to_la: boolean;
  prevention_measures_count: number;
  status: "open" | "investigating" | "resolved" | "closed";
  follow_up_date: string;
}

export interface PreventScreeningInput {
  id: string;
  child_id: string;
  recorded_date: string;
  screening_outcome: string;
  child_voice_consulted: boolean;
  review_date: string;
  online_flags_count: number;
}

export interface PreventRecordInput {
  id: string;
  child_id_present: boolean;
  date: string;
  risk_level: string;
  status: string;
  training_completed: boolean;
  multi_agency_count: number;
}

export interface CourtAttendanceInput {
  id: string;
  child_id: string;
  recorded_date: string;
  risk_assessment_done: boolean;
  pre_hearing_prep_count: number;
  post_hearing_support_count: number;
  special_measures_count: number;
  child_voice_provided: boolean;
}

export interface HomeSafeguardingPreventionInput {
  today: string;
  bullying_incidents: BullyingInput[];
  hate_incidents: HateIncidentInput[];
  prevent_screenings: PreventScreeningInput[];
  prevent_records: PreventRecordInput[];
  court_attendance_records: CourtAttendanceInput[];
  total_children: number;
}

// -- Output types -------------------------------------------------------------

export type SafeguardingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HomeSafeguardingPreventionResult {
  safeguarding_rating: SafeguardingRating;
  safeguarding_score: number;
  headline: string;
  bullying: {
    total_incidents_90d: number;
    resolved_count: number;
    open_count: number;
    /** null when the population is empty — nothing measured, not 0%. */
    restorative_rate: number | null;
    /** null when the population is empty — nothing measured, not 0%. */
    school_notification_rate: number | null;
  };
  hate_incidents: {
    total_incidents_90d: number;
    /** null when the population is empty — nothing measured, not 0%. */
    reporting_compliance_rate: number | null;
    prevention_measures_total: number;
  };
  prevent: {
    total_screenings: number;
    child_coverage: number;
    /** null when the population is empty — nothing measured, not 0%. */
    training_compliance_rate: number | null;
    high_risk_count: number;
  };
  court: {
    total_records: number;
    /** null when the population is empty — nothing measured, not 0%. */
    risk_assessment_rate: number | null;
    /** null when the population is empty — nothing measured, not 0%. */
    prep_rate: number | null;
    /** null when the population is empty — nothing measured, not 0%. */
    support_rate: number | null;
  };
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// -- Engine -------------------------------------------------------------------

export function computeHomeSafeguardingPrevention(
  input: HomeSafeguardingPreventionInput,
): HomeSafeguardingPreventionResult {
  const {
    today, bullying_incidents, hate_incidents, prevent_screenings,
    prevent_records, court_attendance_records, total_children,
  } = input;

  // -- Insufficient data guard ------------------------------------------------
  if (
    total_children === 0 &&
    bullying_incidents.length === 0 &&
    hate_incidents.length === 0 &&
    prevent_screenings.length === 0 &&
    prevent_records.length === 0 &&
    court_attendance_records.length === 0
  ) {
    return {
      safeguarding_rating: "insufficient_data",
      safeguarding_score: 0,
      headline: "No safeguarding prevention data available for analysis.",
      bullying: { total_incidents_90d: 0, resolved_count: 0, open_count: 0, restorative_rate: null, school_notification_rate: null },
      hate_incidents: { total_incidents_90d: 0, reporting_compliance_rate: null, prevention_measures_total: 0 },
      prevent: { total_screenings: 0, child_coverage: 0, training_compliance_rate: null, high_risk_count: 0 },
      court: { total_records: 0, risk_assessment_rate: null, prep_rate: null, support_rate: null },
      strengths: [],
      concerns: ["No safeguarding prevention data -- protection of children cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // -- Bullying (90d) ---------------------------------------------------------
  const bullying90d = bullying_incidents.filter(b => {
    const d = daysBetween(b.date, today);
    return d >= 0 && d <= 90;
  });

  const bullyingResolved = bullying90d.filter(b => b.status === "resolved").length;
  const bullyingOpen = bullying90d.filter(b => b.status === "open" || b.status === "investigating").length;
  const bullyingResolutionRate = pct(bullyingResolved, bullying90d.length);
  const bullyingRestorativeCount = bullying90d.filter(b => b.restorative_attempted).length;
  const bullyingRestorativeRate = pct(bullyingRestorativeCount, bullying90d.length);
  const bullyingSchoolNotified = bullying90d.filter(b => b.school_notified).length;
  const bullyingSchoolRate = pct(bullyingSchoolNotified, bullying90d.length);

  // -- Hate Incidents (90d) ---------------------------------------------------
  const hate90d = hate_incidents.filter(h => {
    const d = daysBetween(h.date, today);
    return d >= 0 && d <= 90;
  });

  const hateProperlyReported = hate90d.filter(
    h => h.reported_to_police && h.reported_to_ofsted && h.reported_to_la,
  ).length;
  const hateReportingRate = pct(hateProperlyReported, hate90d.length);
  const preventionMeasuresTotal = hate90d.reduce((s, h) => s + h.prevention_measures_count, 0);

  // -- Prevent Screenings -----------------------------------------------------
  const uniqueScreenedChildren = new Set(prevent_screenings.map(p => p.child_id));
  const preventChildCoverage = pct(uniqueScreenedChildren.size, total_children);

  // -- Prevent Records --------------------------------------------------------
  const preventTrainedCount = prevent_records.filter(p => p.training_completed).length;
  const preventTrainingRate = pct(preventTrainedCount, prevent_records.length);
  const highRiskCount = prevent_records.filter(p => p.risk_level === "high").length;

  // -- Court Attendance -------------------------------------------------------
  const courtRiskAssessed = court_attendance_records.filter(c => c.risk_assessment_done).length;
  const courtRiskRate = pct(courtRiskAssessed, court_attendance_records.length);
  const courtPrepared = court_attendance_records.filter(
    c => c.risk_assessment_done && c.pre_hearing_prep_count > 0,
  ).length;
  const courtPrepRate = pct(courtPrepared, court_attendance_records.length);
  const courtWithSupport = court_attendance_records.filter(
    c => c.post_hearing_support_count > 0,
  ).length;
  const courtSupportRate = pct(courtWithSupport, court_attendance_records.length);

  // -- Scoring ----------------------------------------------------------------
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Bullying incident management (+/-5)
  if (bullying90d.length === 0) {
    score += 2; // positive indicator - no bullying
  } else {
    if (bullyingResolutionRate === 100) score += 5;
    else if (bullyingResolutionRate >= 80) score += 3;
    else if (bullyingResolutionRate >= 50) score += 0;
    else score -= 5;
  }

  // mod2: Hate incident reporting compliance (+/-4)
  if (hate90d.length === 0) {
    score += 2; // no hate incidents
  } else {
    if (hateReportingRate === 100) score += 4;
    else if (hateReportingRate >= 80) score += 2;
    else if (hateReportingRate >= 50) score += 0;
    else score -= 4;
  }

  // mod3: Prevent duty screening coverage (+/-4)
  if (total_children === 0) {
    score += 0;
  } else {
    if (preventChildCoverage >= 90) score += 4;
    else if (preventChildCoverage >= 70) score += 2;
    else if (preventChildCoverage >= 50) score += 0;
    else score -= 4;
  }

  // mod4: Prevent training compliance (+/-3)
  if (prevent_records.length === 0) {
    score += 0;
  } else {
    if (preventTrainingRate >= 90) score += 3;
    else if (preventTrainingRate >= 70) score += 1;
    else if (preventTrainingRate >= 50) score += 0;
    else score -= 3;
  }

  // mod5: Court attendance preparation (+/-3)
  if (court_attendance_records.length === 0) {
    score += 1; // neutral positive
  } else {
    const courtFullyPrepRate = pct(courtPrepared, court_attendance_records.length);
    if (courtFullyPrepRate >= 90) score += 3;
    else if (courtFullyPrepRate >= 70) score += 1;
    else if (courtFullyPrepRate >= 50) score += 0;
    else score -= 3;
  }

  // mod6: Restorative practice (+/-3)
  if (bullying90d.length === 0) {
    score += 1; // no incidents
  } else {
    if (bullyingRestorativeRate >= 80) score += 3;
    else if (bullyingRestorativeRate >= 60) score += 1;
    else if (bullyingRestorativeRate >= 40) score += 0;
    else score -= 3;
  }

  // mod7: Support provision (+/-3)
  const supportIncidents = [
    ...bullying90d.map(b => b.support_provided_count > 0),
    ...hate90d.map(h => h.prevention_measures_count > 0),
  ];
  if (supportIncidents.length === 0) {
    score += 1; // no incidents
  } else {
    const supportRate = pct(supportIncidents.filter(Boolean).length, supportIncidents.length);
    if (supportRate >= 90) score += 3;
    else if (supportRate >= 70) score += 1;
    else if (supportRate >= 50) score += 0;
    else score -= 3;
  }

  // mod8: Child voice in safeguarding (+/-3)
  const voiceRecords = [
    ...prevent_screenings.map(p => p.child_voice_consulted),
    ...court_attendance_records.map(c => c.child_voice_provided),
  ];
  if (voiceRecords.length === 0) {
    score += 0;
  } else {
    const voiceRate = pct(voiceRecords.filter(Boolean).length, voiceRecords.length);
    if (voiceRate >= 90) score += 3;
    else if (voiceRate >= 70) score += 1;
    else if (voiceRate >= 50) score += 0;
    else score -= 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // -- Rating -----------------------------------------------------------------
  let safeguarding_rating: SafeguardingRating;
  if (score >= 80) safeguarding_rating = "outstanding";
  else if (score >= 65) safeguarding_rating = "good";
  else if (score >= 45) safeguarding_rating = "adequate";
  else safeguarding_rating = "inadequate";

  // -- Strengths / Concerns / Recommendations / Insights ----------------------
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (bullyingResolutionRate === 100 && bullying90d.length > 0) {
    strengths.push("100% bullying incident resolution rate -- excellent safeguarding response.");
  }
  if (bullying90d.length === 0 && total_children > 0) {
    strengths.push("No bullying incidents recorded in 90 days -- positive safeguarding culture.");
  }
  if (hateReportingRate === 100 && hate90d.length > 0) {
    strengths.push("100% hate incident reporting compliance -- all statutory bodies notified.");
  }
  if (hate90d.length === 0 && total_children > 0) {
    strengths.push("No hate incidents recorded in 90 days -- inclusive environment maintained.");
  }
  if (preventChildCoverage >= 90 && total_children > 0) {
    strengths.push(`${preventChildCoverage}% Prevent screening coverage -- comprehensive radicalisation vigilance.`);
  }
  if (preventTrainingRate >= 90 && prevent_records.length > 0) {
    strengths.push(`${preventTrainingRate}% Prevent training compliance -- staff well-prepared.`);
  }
  if (courtPrepRate >= 90 && court_attendance_records.length > 0) {
    strengths.push(`${courtPrepRate}% court attendance preparation rate -- children properly supported.`);
  }
  if (bullyingRestorativeRate >= 80 && bullying90d.length > 0) {
    strengths.push(`${bullyingRestorativeRate}% restorative practice rate -- trauma-informed bullying response.`);
  }

  // Concerns
  if (bullyingOpen > 0) {
    concerns.push(`${bullyingOpen} bullying incident${bullyingOpen > 1 ? "s" : ""} remain unresolved -- children may still be at risk.`);
  }
  if (hateReportingRate < 100 && hate90d.length > 0) {
    const incomplete = hate90d.length - hateProperlyReported;
    concerns.push(`${incomplete} hate incident${incomplete > 1 ? "s" : ""} have incomplete statutory reporting.`);
  }
  if (preventChildCoverage < 50 && total_children > 0) {
    concerns.push(`Only ${preventChildCoverage}% of children have Prevent screenings -- significant coverage gap.`);
  }
  if (preventTrainingRate < 50 && prevent_records.length > 0) {
    concerns.push(`Only ${preventTrainingRate}% Prevent training compliance -- staff may lack critical knowledge.`);
  }
  if (highRiskCount > 0) {
    concerns.push(`${highRiskCount} high-risk Prevent record${highRiskCount > 1 ? "s" : ""} requiring active monitoring.`);
  }
  if (courtPrepRate < 50 && court_attendance_records.length > 0) {
    concerns.push(`Only ${courtPrepRate}% of court attendances have proper preparation -- children may be unsupported.`);
  }

  // Recommendations
  if (preventChildCoverage < 70 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete mandatory Prevent screening for all children -- Reg 12 requires vigilance against radicalisation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (hateReportingRate < 80 && hate90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all hate incidents are reported to police, Ofsted, and local authority as required by statutory guidance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13",
    });
  }
  if (bullyingResolutionRate < 80 && bullying90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Prioritise resolution of outstanding bullying incidents -- unresolved cases risk escalation and harm.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (preventTrainingRate < 70 && prevent_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all staff complete Prevent training -- this is a statutory duty under the Counter-Terrorism and Security Act 2015.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (courtPrepRate < 70 && court_attendance_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve court attendance preparation including risk assessments and pre-hearing support for all children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (bullyingRestorativeRate < 60 && bullying90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Increase use of restorative approaches for bullying incidents to promote healing and understanding.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  // Cara Insights
  if (
    bullyingResolutionRate === 100 && bullying90d.length > 0 &&
    hateReportingRate === 100 && hate90d.length > 0 &&
    preventChildCoverage >= 90 && preventTrainingRate >= 90
  ) {
    insights.push({
      text: "Safeguarding prevention governance is exemplary across all domains. Bullying resolution, hate incident reporting, Prevent compliance, and training all exceed thresholds. Ofsted will recognise this as outstanding protection.",
      severity: "positive",
    });
  }
  if (bullyingResolutionRate < 50 && bullying90d.length >= 3) {
    insights.push({
      text: `Cara detects pattern of unresolved bullying incidents -- risk of institutional harm. ${bullyingOpen} cases remain open with resolution rate of only ${bullyingResolutionRate}%.`,
      severity: "critical",
    });
  }
  if (hateReportingRate < 50 && hate90d.length >= 2) {
    insights.push({
      text: `Hate incident reporting compliance is critically low at ${hateReportingRate}%. Failure to notify statutory bodies breaches regulatory requirements and exposes the home to enforcement action.`,
      severity: "critical",
    });
  }
  if (preventChildCoverage >= 90 && preventTrainingRate >= 90 && highRiskCount === 0) {
    insights.push({
      text: "Prevent duty compliance is comprehensive with high screening coverage and training rates. No high-risk cases detected -- proportionate approach is working effectively.",
      severity: "positive",
    });
  }
  if (highRiskCount >= 2) {
    insights.push({
      text: `${highRiskCount} high-risk Prevent records identified. Multi-agency collaboration and Channel programme engagement should be verified as active and proportionate.`,
      severity: "warning",
    });
  }

  // -- Headline ---------------------------------------------------------------
  let headline: string;
  if (safeguarding_rating === "outstanding") {
    headline = "Exemplary safeguarding prevention -- proactive protection culture across all areas.";
  } else if (safeguarding_rating === "good") {
    headline = "Strong safeguarding prevention -- children well-protected with effective systems.";
  } else if (safeguarding_rating === "adequate") {
    headline = "Safeguarding prevention meets minimum standards but needs strengthening.";
  } else if (safeguarding_rating === "inadequate") {
    headline = "Critical safeguarding prevention gaps -- immediate action required.";
  } else {
    headline = "No safeguarding prevention data available for analysis.";
  }

  return {
    safeguarding_rating,
    safeguarding_score: score,
    headline,
    bullying: {
      total_incidents_90d: bullying90d.length,
      resolved_count: bullyingResolved,
      open_count: bullyingOpen,
      restorative_rate: bullyingRestorativeRate,
      school_notification_rate: bullyingSchoolRate,
    },
    hate_incidents: {
      total_incidents_90d: hate90d.length,
      reporting_compliance_rate: hateReportingRate,
      prevention_measures_total: preventionMeasuresTotal,
    },
    prevent: {
      total_screenings: prevent_screenings.length,
      child_coverage: preventChildCoverage,
      training_compliance_rate: preventTrainingRate,
      high_risk_count: highRiskCount,
    },
    court: {
      total_records: court_attendance_records.length,
      risk_assessment_rate: courtRiskRate,
      prep_rate: courtPrepRate,
      support_rate: courtSupportRate,
    },
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
