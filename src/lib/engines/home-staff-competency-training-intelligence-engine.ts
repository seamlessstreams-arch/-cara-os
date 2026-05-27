// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF COMPETENCY & TRAINING INTELLIGENCE ENGINE
// Home-level: assesses staff training compliance, competency levels, CPD
// engagement, and handbook awareness to produce an overall competency score.
// CHR 2015 Reg 32 (fitness of workers) / Reg 33 (employment of staff).
// SCCIF: "Leadership and management" — Ofsted checks staff are trained,
// competent, and up-to-date.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CompetencyInput {
  id: string;
  staff_id: string;
  level: string;           // "not_assessed"|"developing"|"competent"|"proficient"|"expert"
  assessed: boolean;
}

export interface TrainingMatrixInput {
  id: string;
  staff_id: string;
  total_courses: number;
  valid_count: number;
  expiring_count: number;
  expired_count: number;
  overall_compliance: string; // "compliant"|"at_risk"|"non_compliant"
}

export interface CpdInput {
  id: string;
  staff_id: string;
  status: string;          // "completed"|"in_progress"|"planned"|"overdue"
  cpd_hours: number;
  certificate_obtained: boolean;
}

export interface HandbookInput {
  id: string;
  total_staff_required: number;
  acknowledged_count: number;
}

export interface StaffCompetencyTrainingInput {
  today: string;           // YYYY-MM-DD injectable
  total_staff: number;
  competencies: CompetencyInput[];
  training_matrix: TrainingMatrixInput[];
  cpd_records: CpdInput[];
  handbook_records: HandbookInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffCompetencyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffCompetencyResult {
  competency_rating: StaffCompetencyRating;
  competency_score: number;
  headline: string;
  staff_assessed_rate: number;
  training_compliance_rate: number;
  cpd_engagement_rate: number;
  handbook_acknowledgement_rate: number;
  competent_or_above_rate: number;
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function toRating(score: number): StaffCompetencyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffCompetencyTraining(
  input: StaffCompetencyTrainingInput,
): StaffCompetencyResult {
  const { total_staff, competencies, training_matrix, cpd_records, handbook_records } = input;

  // ── Insufficient data: no staff ───────────────────────────────────────
  if (total_staff === 0) {
    return {
      competency_rating: "insufficient_data",
      competency_score: 0,
      headline: "Insufficient data — no staff recorded to assess competency and training.",
      staff_assessed_rate: 0,
      training_compliance_rate: 0,
      cpd_engagement_rate: 0,
      handbook_acknowledgement_rate: 0,
      competent_or_above_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        { rank: 1, recommendation: "Record staff competency and training data to enable compliance analysis.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" },
      ],
      insights: [
        { text: "No staff data available. Cannot assess competency or training compliance.", severity: "warning" },
      ],
    };
  }

  // ── Metric 1: Assessment coverage ─────────────────────────────────────
  const totalCompetencies = competencies.length;
  const assessedCount = competencies.filter(c => c.assessed).length;
  const staffAssessedRate = totalCompetencies > 0
    ? pct(assessedCount, totalCompetencies)
    : 0;

  // ── Metric 2: Competent or above rate ─────────────────────────────────
  const assessedCompetencies = competencies.filter(c => c.assessed);
  const competentOrAboveCount = assessedCompetencies.filter(c =>
    c.level === "competent" || c.level === "proficient" || c.level === "expert"
  ).length;
  const competentOrAboveRate = assessedCompetencies.length > 0
    ? pct(competentOrAboveCount, assessedCompetencies.length)
    : 0;

  // ── Metric 3: Training compliance ─────────────────────────────────────
  const totalMatrixRows = training_matrix.length;
  const compliantRows = training_matrix.filter(t => t.overall_compliance === "compliant").length;
  const atRiskRows = training_matrix.filter(t => t.overall_compliance === "at_risk").length;
  const nonCompliantRows = training_matrix.filter(t => t.overall_compliance === "non_compliant").length;
  const trainingComplianceRate = totalMatrixRows > 0
    ? pct(compliantRows, totalMatrixRows)
    : 0;

  const totalExpiredCourses = training_matrix.reduce((sum, t) => sum + t.expired_count, 0);
  const totalExpiringCourses = training_matrix.reduce((sum, t) => sum + t.expiring_count, 0);

  // ── Metric 4: CPD engagement ──────────────────────────────────────────
  const totalCpd = cpd_records.length;
  const completedCpd = cpd_records.filter(c => c.status === "completed").length;
  const overdueCpd = cpd_records.filter(c => c.status === "overdue").length;
  const inProgressCpd = cpd_records.filter(c => c.status === "in_progress").length;
  const cpdEngagementRate = totalCpd > 0
    ? pct(completedCpd, totalCpd)
    : 0;

  const totalCpdHours = cpd_records.reduce((sum, c) => sum + c.cpd_hours, 0);
  const avgCpdHoursPerStaff = totalCpdHours / total_staff;

  const certificateCount = cpd_records.filter(c => c.certificate_obtained).length;

  // ── Metric 5: Handbook acknowledgement ────────────────────────────────
  const handbookRates = handbook_records
    .filter(h => h.total_staff_required > 0)
    .map(h => h.acknowledged_count / h.total_staff_required);
  const avgHandbookRate = handbookRates.length > 0
    ? Math.round((handbookRates.reduce((s, v) => s + v, 0) / handbookRates.length) * 100)
    : 0;

  // ── Scoring (base 52, 6 mods) ────────────────────────────────────────
  let score = 52;

  // Mod 1: Assessment coverage
  if (staffAssessedRate >= 90) score += 5;
  else if (staffAssessedRate >= 70) score += 2;
  else if (staffAssessedRate >= 50) score += 0;
  else score -= 5;

  // Mod 2: Competency level
  if (competentOrAboveRate >= 85) score += 6;
  else if (competentOrAboveRate >= 65) score += 3;
  else if (competentOrAboveRate >= 45) score += 0;
  else score -= 5;

  // Mod 3: Training compliance
  if (trainingComplianceRate >= 90) score += 5;
  else if (trainingComplianceRate >= 70) score += 2;
  else if (trainingComplianceRate >= 50) score += 0;
  else score -= 5;

  // Mod 4: CPD engagement
  if (cpdEngagementRate >= 80) score += 5;
  else if (cpdEngagementRate >= 50) score += 2;
  else if (cpdEngagementRate >= 30) score += 0;
  else score -= 4;

  // Mod 5: CPD hours per staff
  if (avgCpdHoursPerStaff >= 20) score += 4;
  else if (avgCpdHoursPerStaff >= 10) score += 1;
  else if (avgCpdHoursPerStaff >= 5) score += 0;
  else score -= 4;

  // Mod 6: Handbook acknowledgement
  if (avgHandbookRate >= 90) score += 5;
  else if (avgHandbookRate >= 70) score += 2;
  else if (avgHandbookRate >= 50) score += 0;
  else score -= 5;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (staffAssessedRate >= 90 && totalCompetencies > 0) {
    strengths.push(`${staffAssessedRate}% of competency assessments completed — strong assessment coverage across the team.`);
  }
  if (competentOrAboveRate >= 85 && assessedCompetencies.length > 0) {
    strengths.push(`${competentOrAboveRate}% of assessed staff are competent or above — workforce demonstrates strong capability.`);
  }
  if (trainingComplianceRate >= 90 && totalMatrixRows > 0) {
    strengths.push(`Training compliance at ${trainingComplianceRate}% — staff are up-to-date with mandatory training requirements.`);
  }
  if (cpdEngagementRate >= 80 && totalCpd > 0) {
    strengths.push(`CPD engagement rate is ${cpdEngagementRate}% — staff are actively pursuing professional development.`);
  }
  if (avgCpdHoursPerStaff >= 20) {
    strengths.push(`Average CPD hours per staff is ${Math.round(avgCpdHoursPerStaff)} — exceeds expected threshold for continuous learning.`);
  }
  if (avgHandbookRate >= 90 && handbook_records.length > 0) {
    strengths.push(`Handbook acknowledgement at ${avgHandbookRate}% — staff are aware of key policies and procedures.`);
  }
  if (totalExpiredCourses === 0 && totalMatrixRows > 0) {
    strengths.push("No expired training courses across the staff team.");
  }
  if (certificateCount > 0 && certificateCount === completedCpd) {
    strengths.push("All completed CPD activities have certificates obtained — strong evidence of professional learning.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (staffAssessedRate < 50 && totalCompetencies > 0) {
    concerns.push(`Only ${staffAssessedRate}% of competency assessments completed — Reg 32 requires staff fitness to be evidenced.`);
  }
  if (competentOrAboveRate < 45 && assessedCompetencies.length > 0) {
    concerns.push(`Only ${competentOrAboveRate}% of assessed staff are competent or above — significant skills gap identified.`);
  }
  if (nonCompliantRows > 0) {
    concerns.push(`${nonCompliantRows} staff member${nonCompliantRows > 1 ? "s are" : " is"} non-compliant with training requirements.`);
  }
  if (totalExpiredCourses > 0) {
    concerns.push(`${totalExpiredCourses} expired training course${totalExpiredCourses > 1 ? "s" : ""} across the team — immediate renewal required.`);
  }
  if (totalExpiringCourses > 0) {
    concerns.push(`${totalExpiringCourses} training course${totalExpiringCourses > 1 ? "s" : ""} expiring soon — proactive booking needed.`);
  }
  if (overdueCpd > 0) {
    concerns.push(`${overdueCpd} CPD record${overdueCpd > 1 ? "s are" : " is"} overdue — staff are falling behind on professional development.`);
  }
  if (avgCpdHoursPerStaff < 5) {
    concerns.push(`Average CPD hours per staff is only ${Math.round(avgCpdHoursPerStaff * 10) / 10} — well below expected levels.`);
  }
  if (avgHandbookRate < 50 && handbook_records.length > 0) {
    concerns.push(`Handbook acknowledgement is only ${avgHandbookRate}% — staff may not be aware of key policies and procedures.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (totalExpiredCourses > 0) {
    recs.push({ rank: rank++, recommendation: `Arrange immediate renewal for ${totalExpiredCourses} expired training course${totalExpiredCourses > 1 ? "s" : ""} to restore compliance.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (nonCompliantRows > 0) {
    recs.push({ rank: rank++, recommendation: `Address training non-compliance for ${nonCompliantRows} staff member${nonCompliantRows > 1 ? "s" : ""} — ensure all mandatory training is current.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (staffAssessedRate < 70 && totalCompetencies > 0) {
    recs.push({ rank: rank++, recommendation: `Complete outstanding competency assessments — currently at ${staffAssessedRate}%. Reg 32 requires evidence of staff fitness.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (overdueCpd > 0) {
    recs.push({ rank: rank++, recommendation: `Follow up on ${overdueCpd} overdue CPD record${overdueCpd > 1 ? "s" : ""} to maintain professional development standards.`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (competentOrAboveRate < 65 && assessedCompetencies.length > 0) {
    recs.push({ rank: rank++, recommendation: `Implement targeted development plans for staff assessed below competent level. ${100 - competentOrAboveRate}% of assessed staff need upskilling.`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (avgHandbookRate < 70 && handbook_records.length > 0) {
    recs.push({ rank: rank++, recommendation: `Improve handbook acknowledgement rate from ${avgHandbookRate}% — ensure all staff read and sign key policies.`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (totalExpiringCourses > 0) {
    recs.push({ rank: rank++, recommendation: `Book renewal training for ${totalExpiringCourses} course${totalExpiringCourses > 1 ? "s" : ""} expiring soon to prevent compliance gaps.`, urgency: "planned", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (avgCpdHoursPerStaff < 10 && avgCpdHoursPerStaff >= 5) {
    recs.push({ rank: rank++, recommendation: `Increase CPD engagement — average hours per staff is ${Math.round(avgCpdHoursPerStaff)}. Consider structured CPD programmes.`, urgency: "planned", regulatory_ref: "CHR 2015 Reg 33" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (totalExpiredCourses >= 3) {
    insights.push({ text: `${totalExpiredCourses} training courses have expired across the team. This represents a significant compliance risk that Ofsted will flag during inspection.`, severity: "critical" });
  } else if (totalExpiredCourses > 0) {
    insights.push({ text: `${totalExpiredCourses} expired training course${totalExpiredCourses > 1 ? "s" : ""} identified — prioritise renewal to maintain Reg 32 compliance.`, severity: "warning" });
  }

  if (nonCompliantRows >= 3) {
    insights.push({ text: `${nonCompliantRows} staff members are non-compliant with training. A systemic gap in training governance is apparent.`, severity: "critical" });
  } else if (nonCompliantRows > 0) {
    insights.push({ text: `${nonCompliantRows} staff member${nonCompliantRows > 1 ? "s are" : " is"} non-compliant with training requirements — address before inspection.`, severity: "warning" });
  }

  if (staffAssessedRate >= 90 && competentOrAboveRate >= 85 && trainingComplianceRate >= 90 && avgHandbookRate >= 90) {
    insights.push({ text: `Strong competency and training position: ${staffAssessedRate}% assessed, ${competentOrAboveRate}% competent or above, ${trainingComplianceRate}% training compliant, ${avgHandbookRate}% handbook acknowledgement. Well-placed for inspection.`, severity: "positive" });
  }

  if (overdueCpd >= 3) {
    insights.push({ text: `${overdueCpd} CPD records are overdue. This pattern suggests CPD governance needs strengthening.`, severity: "critical" });
  } else if (overdueCpd > 0) {
    insights.push({ text: `${overdueCpd} CPD record${overdueCpd > 1 ? "s are" : " is"} overdue — follow up promptly to maintain development standards.`, severity: "warning" });
  }

  if (avgCpdHoursPerStaff >= 20 && cpdEngagementRate >= 80) {
    insights.push({ text: `CPD programme is strong — averaging ${Math.round(avgCpdHoursPerStaff)} hours per staff with ${cpdEngagementRate}% completion rate. Evidence of commitment to professional development.`, severity: "positive" });
  }

  if (competentOrAboveRate < 45 && assessedCompetencies.length > 0) {
    insights.push({ text: `Fewer than half of assessed staff are competent or above. Reg 32 requires staff to be fit to perform their duties — this is a critical gap.`, severity: "critical" });
  }

  if (atRiskRows > 0 && nonCompliantRows === 0) {
    insights.push({ text: `${atRiskRows} staff member${atRiskRows > 1 ? "s are" : " is"} at risk of training non-compliance — proactive intervention can prevent gaps.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Staff competency and training is outstanding — assessments, training compliance, CPD, and handbook awareness all performing strongly.";
  } else if (rating === "good") {
    const issues: string[] = [];
    if (totalExpiredCourses > 0) issues.push(`${totalExpiredCourses} expired training`);
    if (nonCompliantRows > 0) issues.push(`${nonCompliantRows} non-compliant staff`);
    if (overdueCpd > 0) issues.push(`${overdueCpd} overdue CPD`);
    headline = issues.length > 0
      ? `Good overall competency and training — attention needed on ${issues.join(", ")}.`
      : "Good staff competency and training — compliance is maintained across key areas.";
  } else if (rating === "adequate") {
    headline = "Adequate competency and training — gaps in assessments, training, or CPD require focused attention.";
  } else {
    headline = "Staff competency and training is inadequate — multiple statutory requirements under Reg 32/33 are unmet.";
  }

  return {
    competency_rating: rating,
    competency_score: score,
    headline,
    staff_assessed_rate: staffAssessedRate,
    training_compliance_rate: trainingComplianceRate,
    cpd_engagement_rate: cpdEngagementRate,
    handbook_acknowledgement_rate: avgHandbookRate,
    competent_or_above_rate: competentOrAboveRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
