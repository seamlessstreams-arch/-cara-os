// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF DEVELOPMENT INTELLIGENCE ENGINE
// Home-level: synthesises supervision compliance, mandatory training,
// qualifications, induction progress, and wellbeing scores to produce
// an overall staff development health score.
// CHR 2015 Reg 32, 33. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SupervisionInput {
  id: string;
  staff_id: string;
  supervisor_id: string;
  type: string;                           // "formal" | "informal" | "probation_review"
  scheduled_date: string;                 // YYYY-MM-DD
  actual_date: string | null;
  status: "completed" | "scheduled" | "cancelled" | "overdue";
  duration_minutes: number | null;
  wellbeing_score: number | null;         // 1-10
  staff_signature: boolean;
  supervisor_signature: boolean;
  actions_count: number;
  next_date: string | null;
}

export interface TrainingRecordInput {
  id: string;
  staff_id: string;
  course_name: string;
  category: string;
  completed_date: string | null;
  expiry_date: string | null;
  status: "compliant" | "expiring_soon" | "expired" | "not_started" | "booked";
  is_mandatory: boolean;
}

export interface QualificationInput {
  id: string;
  staff_id: string;
  qualification_name: string;
  status: "completed" | "in_progress" | "not_started" | "expired";
  is_mandatory: boolean;
  expiry_date: string | null;
  completed_at: string | null;
}

export interface InductionInput {
  id: string;
  staff_id: string;
  overall_status: "completed" | "in_progress" | "not_started" | "overdue";
  target_completion_date: string;
  total_items: number;
  completed_items: number;
  probation_passed: boolean;
}

export interface StaffMemberInput {
  id: string;
  name: string;
  role: string;
}

export interface HomeStaffDevelopmentInput {
  today: string;                          // YYYY-MM-DD injectable
  staff: StaffMemberInput[];
  supervisions: SupervisionInput[];
  training_records: TrainingRecordInput[];
  qualifications: QualificationInput[];
  inductions: InductionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffDevelopmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SupervisionProfile {
  total_completed_6m: number;
  total_scheduled: number;
  overdue_count: number;
  completion_rate_6m: number;             // % of scheduled supervisions completed in 6m
  avg_wellbeing_score: number | null;     // 1-10
  low_wellbeing_staff: string[];          // staff names with score < 5
  dual_signature_rate: number;            // % with both signatures
  avg_duration_minutes: number | null;
  staff_without_recent_supervision: string[]; // no supervision in 8 weeks
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface TrainingProfile {
  total_records: number;
  mandatory_total: number;
  mandatory_compliant: number;
  mandatory_compliance_rate: number;      // 0-100
  expired_count: number;
  expiring_soon_count: number;
  not_started_count: number;
  expired_courses: string[];              // course names
  expiring_courses: string[];
  category_coverage: { category: string; compliant: number; total: number }[];
}

export interface QualificationProfile {
  total_qualifications: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  mandatory_completion_rate: number;      // 0-100 (completed / mandatory total)
  expiring_qualifications: string[];
  staff_without_mandatory: string[];      // staff names with mandatory quals not started
}

export interface InductionProfile {
  total_inductions: number;
  completed_count: number;
  in_progress_count: number;
  overdue_count: number;
  avg_completion_rate: number;            // avg % of items completed across in-progress
  probation_pass_rate: number;            // % of completed inductions with probation passed
}

export interface StaffDevelopmentInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface StaffDevelopmentRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeStaffDevelopmentResult {
  staff_development_rating: StaffDevelopmentRating;
  staff_development_score: number;
  headline: string;
  supervision: SupervisionProfile;
  training: TrainingProfile;
  qualifications: QualificationProfile;
  inductions: InductionProfile;
  strengths: string[];
  concerns: string[];
  recommendations: StaffDevelopmentRecommendation[];
  insights: StaffDevelopmentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffDevelopmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeStaffDevelopment(
  input: HomeStaffDevelopmentInput,
): HomeStaffDevelopmentResult {
  const { today, staff, supervisions, training_records, qualifications, inductions } = input;

  const totalData = supervisions.length + training_records.length + qualifications.length + inductions.length;

  if (totalData < 3) {
    return {
      staff_development_rating: "insufficient_data",
      staff_development_score: 0,
      headline: "Insufficient staff development data to produce an assessment.",
      supervision: emptySup(),
      training: emptyTraining(),
      qualifications: emptyQual(),
      inductions: emptyInduction(),
      strengths: [],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Begin recording staff development data to enable compliance analysis.", urgency: "immediate", regulatory_ref: "Reg 32-33" }],
      insights: [{ text: "Not enough data to assess staff development compliance. Ensure supervision, training, and qualification records are being maintained.", severity: "warning" }],
    };
  }

  // ── Supervision Profile ─────────────────────────────────────────────────
  const sup6m = supervisions.filter(s => {
    const d = daysBetween(s.scheduled_date, today);
    return d >= 0 && d <= 180;
  });
  const completedSups = sup6m.filter(s => s.status === "completed");
  const scheduledSups = supervisions.filter(s => s.status === "scheduled");
  const overdueSups = supervisions.filter(s => {
    if (s.status === "overdue") return true;
    if (s.status === "scheduled" && s.scheduled_date < today) return true;
    return false;
  });

  const supCompletionRate = sup6m.length > 0
    ? Math.round((completedSups.length / sup6m.length) * 100)
    : 0;

  const wellbeingScores = completedSups
    .filter(s => s.wellbeing_score !== null)
    .map(s => s.wellbeing_score!);
  const avgWellbeing = wellbeingScores.length > 0
    ? Math.round((wellbeingScores.reduce((s, v) => s + v, 0) / wellbeingScores.length) * 10) / 10
    : null;

  const lowWellbeingStaff = completedSups
    .filter(s => s.wellbeing_score !== null && s.wellbeing_score < 5)
    .map(s => {
      const staffMember = staff.find(st => st.id === s.staff_id);
      return staffMember?.name ?? s.staff_id;
    });

  const dualSignedSups = completedSups.filter(s => s.staff_signature && s.supervisor_signature);
  const dualSignRate = completedSups.length > 0
    ? Math.round((dualSignedSups.length / completedSups.length) * 100)
    : 0;

  const durations = completedSups.filter(s => s.duration_minutes !== null).map(s => s.duration_minutes!);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
    : null;

  // Staff without recent supervision (8 weeks = 56 days)
  const staffWithoutRecent: string[] = [];
  for (const member of staff) {
    const memberSups = supervisions
      .filter(s => s.staff_id === member.id && s.status === "completed" && s.actual_date !== null);
    if (memberSups.length === 0) {
      staffWithoutRecent.push(member.name);
    } else {
      const latest = memberSups.sort((a, b) => (b.actual_date ?? "").localeCompare(a.actual_date ?? ""))[0];
      if (latest.actual_date && daysBetween(latest.actual_date, today) > 56) {
        staffWithoutRecent.push(member.name);
      }
    }
  }

  // Supervision trend: compare first half vs second half completion in 6m
  let supTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (sup6m.length >= 4) {
    const sorted = [...sup6m].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const rateFirst = firstHalf.filter(s => s.status === "completed").length / firstHalf.length;
    const rateSecond = secondHalf.filter(s => s.status === "completed").length / secondHalf.length;
    if (rateSecond > rateFirst + 0.15) supTrend = "improving";
    else if (rateSecond < rateFirst - 0.15) supTrend = "declining";
    else supTrend = "stable";
  }

  const supervisionProfile: SupervisionProfile = {
    total_completed_6m: completedSups.length,
    total_scheduled: scheduledSups.length,
    overdue_count: overdueSups.length,
    completion_rate_6m: supCompletionRate,
    avg_wellbeing_score: avgWellbeing,
    low_wellbeing_staff: [...new Set(lowWellbeingStaff)],
    dual_signature_rate: dualSignRate,
    avg_duration_minutes: avgDuration,
    staff_without_recent_supervision: staffWithoutRecent,
    trend: supTrend,
  };

  // ── Training Profile ────────────────────────────────────────────────────
  const mandatoryTraining = training_records.filter(t => t.is_mandatory);
  const mandatoryCompliant = mandatoryTraining.filter(t => t.status === "compliant");
  const mandatoryComplianceRate = mandatoryTraining.length > 0
    ? Math.round((mandatoryCompliant.length / mandatoryTraining.length) * 100)
    : 100;

  const expired = training_records.filter(t => t.status === "expired");
  const expiringSoon = training_records.filter(t => t.status === "expiring_soon");
  const notStarted = training_records.filter(t => t.status === "not_started");

  // Category coverage
  const catMap = new Map<string, { compliant: number; total: number }>();
  training_records.forEach(t => {
    const existing = catMap.get(t.category) ?? { compliant: 0, total: 0 };
    existing.total++;
    if (t.status === "compliant") existing.compliant++;
    catMap.set(t.category, existing);
  });
  const categoryCoverage = [...catMap.entries()]
    .map(([category, counts]) => ({ category, ...counts }))
    .sort((a, b) => (a.compliant / a.total) - (b.compliant / b.total));

  const trainingProfile: TrainingProfile = {
    total_records: training_records.length,
    mandatory_total: mandatoryTraining.length,
    mandatory_compliant: mandatoryCompliant.length,
    mandatory_compliance_rate: mandatoryComplianceRate,
    expired_count: expired.length,
    expiring_soon_count: expiringSoon.length,
    not_started_count: notStarted.length,
    expired_courses: expired.map(t => t.course_name),
    expiring_courses: expiringSoon.map(t => t.course_name),
    category_coverage: categoryCoverage,
  };

  // ── Qualification Profile ───────────────────────────────────────────────
  const completedQuals = qualifications.filter(q => q.status === "completed");
  const inProgressQuals = qualifications.filter(q => q.status === "in_progress");
  const notStartedQuals = qualifications.filter(q => q.status === "not_started");

  const mandatoryQuals = qualifications.filter(q => q.is_mandatory);
  const mandatoryCompleteQuals = mandatoryQuals.filter(q => q.status === "completed");
  const mandatoryQualRate = mandatoryQuals.length > 0
    ? Math.round((mandatoryCompleteQuals.length / mandatoryQuals.length) * 100)
    : 100;

  const expiringQuals = qualifications
    .filter(q => q.expiry_date && daysBetween(today, q.expiry_date) >= 0 && daysBetween(today, q.expiry_date) <= 90)
    .map(q => q.qualification_name);

  // Staff with mandatory quals not started
  const staffMandatoryNotStarted: string[] = [];
  const mandatoryNotStartedQuals = qualifications.filter(q => q.is_mandatory && q.status === "not_started");
  for (const q of mandatoryNotStartedQuals) {
    const member = staff.find(s => s.id === q.staff_id);
    if (member) staffMandatoryNotStarted.push(member.name);
  }

  const qualProfile: QualificationProfile = {
    total_qualifications: qualifications.length,
    completed_count: completedQuals.length,
    in_progress_count: inProgressQuals.length,
    not_started_count: notStartedQuals.length,
    mandatory_completion_rate: mandatoryQualRate,
    expiring_qualifications: expiringQuals,
    staff_without_mandatory: [...new Set(staffMandatoryNotStarted)],
  };

  // ── Induction Profile ───────────────────────────────────────────────────
  const completedInductions = inductions.filter(i => i.overall_status === "completed");
  const inProgressInductions = inductions.filter(i => i.overall_status === "in_progress");
  const overdueInductions = inductions.filter(i => {
    if (i.overall_status === "overdue") return true;
    if (i.overall_status === "in_progress" && i.target_completion_date < today) return true;
    return false;
  });

  const inProgressRates = inProgressInductions
    .filter(i => i.total_items > 0)
    .map(i => (i.completed_items / i.total_items) * 100);
  const avgCompletionRate = inProgressRates.length > 0
    ? Math.round(inProgressRates.reduce((s, v) => s + v, 0) / inProgressRates.length)
    : 0;

  const probationPassed = completedInductions.filter(i => i.probation_passed).length;
  const probationPassRate = completedInductions.length > 0
    ? Math.round((probationPassed / completedInductions.length) * 100)
    : 0;

  const inductionProfile: InductionProfile = {
    total_inductions: inductions.length,
    completed_count: completedInductions.length,
    in_progress_count: inProgressInductions.length,
    overdue_count: overdueInductions.length,
    avg_completion_rate: avgCompletionRate,
    probation_pass_rate: probationPassRate,
  };

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 50;

  // Supervision (±20)
  if (supervisions.length > 0) {
    if (supCompletionRate >= 90) score += 8;
    else if (supCompletionRate >= 70) score += 3;
    else if (supCompletionRate < 50) score -= 8;
    else score -= 3;

    if (overdueSups.length === 0) score += 4;
    else if (overdueSups.length >= 3) score -= 6;
    else score -= 3;

    if (staffWithoutRecent.length === 0) score += 4;
    else if (staffWithoutRecent.length >= 3) score -= 6;
    else score -= 3;

    if (dualSignRate === 100) score += 3;
    else if (dualSignRate < 80) score -= 3;

    if (supTrend === "improving") score += 2;
    else if (supTrend === "declining") score -= 3;
  }

  // Training (±20)
  if (training_records.length > 0) {
    if (mandatoryComplianceRate === 100) score += 10;
    else if (mandatoryComplianceRate >= 80) score += 5;
    else if (mandatoryComplianceRate < 60) score -= 10;
    else score -= 3;

    if (expired.length === 0) score += 5;
    else if (expired.length >= 3) score -= 8;
    else score -= 4;

    if (notStarted.length > 0) score -= 3;
  }

  // Qualifications (±15)
  if (qualifications.length > 0) {
    if (mandatoryQualRate >= 80) score += 5;
    else if (mandatoryQualRate >= 50) score += 2;
    else score -= 5;

    if (notStartedQuals.length === 0) score += 3;
    else if (staffMandatoryNotStarted.length > 0) score -= 5;

    if (inProgressQuals.length > 0) score += 2;  // active development
  }

  // Inductions (±10)
  if (inductions.length > 0) {
    if (overdueInductions.length === 0) score += 4;
    else score -= 4;

    if (probationPassRate === 100 && completedInductions.length > 0) score += 3;
    else if (probationPassRate < 80 && completedInductions.length > 0) score -= 3;
  }

  // Wellbeing bonus/penalty
  if (avgWellbeing !== null) {
    if (avgWellbeing >= 7) score += 3;
    else if (avgWellbeing < 5) score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (supCompletionRate >= 90 && completedSups.length > 0) strengths.push(`Supervision completion rate is ${supCompletionRate}% — demonstrating robust oversight.`);
  if (dualSignRate === 100 && completedSups.length > 0) strengths.push("100% dual-signature compliance across all completed supervisions.");
  if (staffWithoutRecent.length === 0 && staff.length > 0 && completedSups.length > 0) strengths.push("All staff have received supervision within the last 8 weeks.");
  if (mandatoryComplianceRate === 100 && mandatoryTraining.length > 0) strengths.push(`All ${mandatoryTraining.length} mandatory training records are compliant.`);
  if (expired.length === 0 && training_records.length > 0) strengths.push("No expired training across the staff team.");
  if (avgWellbeing !== null && avgWellbeing >= 7) strengths.push(`Staff wellbeing average is ${avgWellbeing}/10 — team morale is strong.`);
  if (inProgressQuals.length > 0) strengths.push(`${inProgressQuals.length} qualification${inProgressQuals.length > 1 ? "s" : ""} actively in progress — evidence of ongoing professional development.`);
  if (probationPassRate === 100 && completedInductions.length > 0) strengths.push("100% probation pass rate for completed inductions.");
  if (overdueInductions.length === 0 && inductions.length > 0) strengths.push("All inductions are on track or completed.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (overdueSups.length > 0) concerns.push(`${overdueSups.length} supervision${overdueSups.length > 1 ? "s" : ""} overdue — non-compliance with Reg 33 supervision frequency.`);
  if (staffWithoutRecent.length > 0) concerns.push(`${staffWithoutRecent.length} staff member${staffWithoutRecent.length > 1 ? "s have" : " has"} not received supervision in 8+ weeks: ${staffWithoutRecent.join(", ")}.`);
  if (lowWellbeingStaff.length > 0) concerns.push(`Low wellbeing score${lowWellbeingStaff.length > 1 ? "s" : ""} recorded for: ${[...new Set(lowWellbeingStaff)].join(", ")} — follow-up support needed.`);
  if (expired.length > 0) concerns.push(`${expired.length} training record${expired.length > 1 ? "s" : ""} expired: ${expired.map(t => t.course_name).join(", ")}.`);
  if (expiringSoon.length > 0) concerns.push(`${expiringSoon.length} training record${expiringSoon.length > 1 ? "s" : ""} expiring soon: ${expiringSoon.map(t => t.course_name).join(", ")}.`);
  if (mandatoryComplianceRate < 80 && mandatoryTraining.length > 0) concerns.push(`Mandatory training compliance is only ${mandatoryComplianceRate}% — significant gap in statutory training requirements.`);
  if (staffMandatoryNotStarted.length > 0) concerns.push(`${staffMandatoryNotStarted.length} staff member${staffMandatoryNotStarted.length > 1 ? "s have" : " has"} not started mandatory qualifications: ${[...new Set(staffMandatoryNotStarted)].join(", ")}.`);
  if (overdueInductions.length > 0) concerns.push(`${overdueInductions.length} induction${overdueInductions.length > 1 ? "s" : ""} overdue — new staff may not be fully equipped.`);
  if (dualSignRate < 80 && completedSups.length > 0) concerns.push(`Dual-signature rate is only ${dualSignRate}% — supervision records may not be robust.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: StaffDevelopmentRecommendation[] = [];
  let rank = 1;

  if (overdueSups.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueSups.length} overdue supervision${overdueSups.length > 1 ? "s" : ""} immediately to restore Reg 33 compliance.`, urgency: "immediate", regulatory_ref: "Reg 33" });
  }
  if (expired.length > 0) {
    recs.push({ rank: rank++, recommendation: `Arrange ${expired.length} expired training renewal${expired.length > 1 ? "s" : ""}: ${expired.map(t => t.course_name).join(", ")}.`, urgency: "immediate", regulatory_ref: "Reg 32" });
  }
  if (staffMandatoryNotStarted.length > 0) {
    recs.push({ rank: rank++, recommendation: `Enrol ${[...new Set(staffMandatoryNotStarted)].join(", ")} onto mandatory qualifications.`, urgency: "soon", regulatory_ref: "Reg 32" });
  }
  if (overdueInductions.length > 0) {
    recs.push({ rank: rank++, recommendation: `Review and progress ${overdueInductions.length} overdue induction${overdueInductions.length > 1 ? "s" : ""}.`, urgency: "soon", regulatory_ref: "Reg 33" });
  }
  if (lowWellbeingStaff.length > 0) {
    recs.push({ rank: rank++, recommendation: `Arrange wellbeing check-ins for staff with low wellbeing scores: ${[...new Set(lowWellbeingStaff)].join(", ")}.`, urgency: "soon", regulatory_ref: "Reg 33" });
  }
  if (expiringSoon.length > 0) {
    recs.push({ rank: rank++, recommendation: `Book renewal training for ${expiringSoon.length} course${expiringSoon.length > 1 ? "s" : ""} expiring soon.`, urgency: "planned", regulatory_ref: "Reg 32" });
  }
  if (staffWithoutRecent.length > 0 && overdueSups.length === 0) {
    recs.push({ rank: rank++, recommendation: `Schedule supervisions for staff without recent sessions: ${staffWithoutRecent.join(", ")}.`, urgency: "planned", regulatory_ref: "Reg 33" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: StaffDevelopmentInsight[] = [];

  if (expired.length >= 3) {
    insights.push({ text: `${expired.length} training records have expired across the team. This represents a significant compliance risk that Ofsted will flag during inspection.`, severity: "critical" });
  } else if (expired.length > 0) {
    insights.push({ text: `${expired.length} expired training record${expired.length > 1 ? "s" : ""} — prioritise renewal to maintain regulatory compliance.`, severity: "warning" });
  }

  if (overdueSups.length >= 3) {
    insights.push({ text: `${overdueSups.length} supervisions are overdue. Reg 33 requires regular, recorded supervision — this pattern suggests a systemic gap.`, severity: "critical" });
  } else if (overdueSups.length > 0) {
    insights.push({ text: `${overdueSups.length} supervision${overdueSups.length > 1 ? "s" : ""} overdue — address promptly to maintain compliance.`, severity: "warning" });
  }

  if (avgWellbeing !== null && avgWellbeing >= 7 && mandatoryComplianceRate >= 90 && overdueSups.length === 0) {
    insights.push({ text: `Strong staff development position: supervision on track, training ${mandatoryComplianceRate}% compliant, wellbeing averaging ${avgWellbeing}/10. Well-placed for inspection.`, severity: "positive" });
  }

  if (supTrend === "improving") {
    insights.push({ text: "Supervision completion trend is improving — evidence of strengthening management oversight.", severity: "positive" });
  } else if (supTrend === "declining") {
    insights.push({ text: "Supervision completion is declining — investigate whether capacity or scheduling issues are contributing.", severity: "warning" });
  }

  if (inProgressQuals.length >= 3) {
    insights.push({ text: `${inProgressQuals.length} qualifications actively in progress — strong commitment to continuous professional development across the team.`, severity: "positive" });
  }

  if (staffMandatoryNotStarted.length >= 2) {
    insights.push({ text: `${staffMandatoryNotStarted.length} staff members have not started mandatory qualifications. Reg 32 requires all staff to hold appropriate qualifications.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Staff development is outstanding — supervision, training, and qualifications all performing strongly.";
  } else if (rating === "good") {
    const issues: string[] = [];
    if (expired.length > 0) issues.push(`${expired.length} expired training`);
    if (overdueSups.length > 0) issues.push(`${overdueSups.length} overdue supervision${overdueSups.length > 1 ? "s" : ""}`);
    headline = issues.length > 0
      ? `Good staff development overall — attention needed on ${issues.join(", ")}.`
      : "Good staff development — supervision and training compliance is maintained.";
  } else if (rating === "adequate") {
    headline = "Adequate staff development — gaps in training and/or supervision require attention.";
  } else {
    headline = "Staff development is inadequate — multiple statutory requirements for training and supervision are unmet.";
  }

  return {
    staff_development_rating: rating,
    staff_development_score: score,
    headline,
    supervision: supervisionProfile,
    training: trainingProfile,
    qualifications: qualProfile,
    inductions: inductionProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptySup(): SupervisionProfile {
  return { total_completed_6m: 0, total_scheduled: 0, overdue_count: 0, completion_rate_6m: 0, avg_wellbeing_score: null, low_wellbeing_staff: [], dual_signature_rate: 0, avg_duration_minutes: null, staff_without_recent_supervision: [], trend: "insufficient_data" };
}

function emptyTraining(): TrainingProfile {
  return { total_records: 0, mandatory_total: 0, mandatory_compliant: 0, mandatory_compliance_rate: 0, expired_count: 0, expiring_soon_count: 0, not_started_count: 0, expired_courses: [], expiring_courses: [], category_coverage: [] };
}

function emptyQual(): QualificationProfile {
  return { total_qualifications: 0, completed_count: 0, in_progress_count: 0, not_started_count: 0, mandatory_completion_rate: 0, expiring_qualifications: [], staff_without_mandatory: [] };
}

function emptyInduction(): InductionProfile {
  return { total_inductions: 0, completed_count: 0, in_progress_count: 0, overdue_count: 0, avg_completion_rate: 0, probation_pass_rate: 0 };
}
