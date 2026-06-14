// ══════════════════════════════════════════════════════════════════════════════
// Cara — EDUCATION ENGAGEMENT INTELLIGENCE
//
// Pure deterministic engine analysing education engagement:
//   - Attendance tracking (actual vs expected)
//   - Persistent absence detection (below 90%)
//   - Exclusion risk assessment
//   - PEP (Personal Education Plan) compliance
//   - School stability (moves, provision changes)
//   - Achievement/progress indicators
//   - Engagement quality beyond just attendance
//
// Regulatory alignment:
//   - CHR 2015 Reg 8 (Education)
//   - DfE Virtual School Head guidance
//   - SCCIF Education Quality standards
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EducationWeek {
  weekStart: string;              // ISO date (Monday)
  sessionsExpected: number;       // typically 10 (AM + PM for 5 days)
  sessionsAttended: number;
  sessionsAuthorisedAbsence: number;
  sessionsUnauthorisedAbsence: number;
  lateArrivals: number;
  exclusionDays: number;
  exclusionType?: "fixed_term" | "permanent" | "internal";
  engagementRating?: number;      // 1-5 (teacher assessed)
  homeworkCompleted?: boolean;
  positiveNotes?: number;         // praise, achievements
  negativeNotes?: number;         // behavioural concerns
}

export interface EducationInput {
  childId: string;
  childName: string;
  age: number;
  currentProvision: "mainstream_school" | "specialist_school" | "pru" | "alt_provision" | "home_education" | "eotas" | "neet" | "post_16";
  provisionName: string;
  senStatus?: "none" | "sen_support" | "ehcp";
  hasEHCP: boolean;
  pepUpToDate: boolean;
  pepLastReviewDate?: string;
  pepNextDueDate?: string;
  schoolMoves: number;            // in last 12 months
  weeks: EducationWeek[];         // last 12 weeks of data
  currentExclusions: number;      // total fixed-term days this academic year
  previousExclusions: number;     // last academic year
  atRiskOfPermanentExclusion: boolean;
  virtualSchoolInvolved: boolean;
  designatedTeacherEngaged: boolean;
  pupilPremiumPlusAllocated: boolean;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface EducationAssessment {
  childId: string;
  childName: string;
  assessedAt: string;
  overallScore: number;           // 0-100
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  attendanceScore: number;        // 0-100
  engagementScore: number;        // 0-100
  stabilityScore: number;         // 0-100
  complianceScore: number;        // 0-100 (PEP, VS, DT etc.)
  currentAttendance: number;      // % over the period
  attendanceCategory: "above_national" | "national_average" | "below_average" | "persistent_absence" | "severe_absence";
  attendanceTrend: "improving" | "stable" | "declining";
  exclusionRisk: "low" | "moderate" | "high" | "critical";
  concerns: EducationConcern[];
  strengths: EducationStrength[];
  recommendations: string[];
  regulatoryFlags: EducationRegulatoryFlag[];
  summary: string;
}

export interface EducationConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: "attendance" | "exclusion" | "engagement" | "provision" | "compliance" | "stability";
  description: string;
}

export interface EducationStrength {
  category: string;
  description: string;
}

export interface EducationRegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const NATIONAL_AVERAGE_ATTENDANCE = 94; // DfE persistent absence threshold is 90%
const PERSISTENT_ABSENCE_THRESHOLD = 90;
const SEVERE_ABSENCE_THRESHOLD = 50;

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseEducationEngagement(input: EducationInput): EducationAssessment {
  const { childId, childName, weeks } = input;
  const assessedAt = new Date().toISOString();

  // ── Calculate attendance ───────────────────────────────────────────────────
  const totalExpected = weeks.reduce((s, w) => s + w.sessionsExpected, 0);
  const totalAttended = weeks.reduce((s, w) => s + w.sessionsAttended, 0);
  const currentAttendance = totalExpected > 0 ? Math.round((totalAttended / totalExpected) * 100) : 0;

  // ── Attendance category ───────────────────────────────────────────────────
  let attendanceCategory: EducationAssessment["attendanceCategory"];
  if (currentAttendance >= 96) attendanceCategory = "above_national";
  else if (currentAttendance >= NATIONAL_AVERAGE_ATTENDANCE) attendanceCategory = "national_average";
  else if (currentAttendance >= PERSISTENT_ABSENCE_THRESHOLD) attendanceCategory = "below_average";
  else if (currentAttendance >= SEVERE_ABSENCE_THRESHOLD) attendanceCategory = "persistent_absence";
  else attendanceCategory = "severe_absence";

  // ── Attendance trend ──────────────────────────────────────────────────────
  const attendanceTrend = calculateAttendanceTrend(weeks);

  // ── Scores ────────────────────────────────────────────────────────────────
  const attendanceScore = calculateAttendanceScore(currentAttendance, attendanceTrend);
  const engagementScore = calculateEngagementScore(weeks, input);
  const stabilityScore = calculateStabilityScore(input);
  const complianceScore = calculateComplianceScore(input);

  // ── Exclusion risk ────────────────────────────────────────────────────────
  const exclusionRisk = assessExclusionRisk(input);

  // ── Overall score ─────────────────────────────────────────────────────────
  const overallScore = Math.round(
    (attendanceScore * 0.35) + (engagementScore * 0.25) + (stabilityScore * 0.20) + (complianceScore * 0.20)
  );

  let overallRating: EducationAssessment["overallRating"];
  if (overallScore >= 85) overallRating = "excellent";
  else if (overallScore >= 70) overallRating = "good";
  else if (overallScore >= 55) overallRating = "adequate";
  else if (overallScore >= 40) overallRating = "requires_improvement";
  else overallRating = "inadequate";

  // ── Concerns ──────────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, currentAttendance, attendanceTrend, exclusionRisk);

  // ── Strengths ─────────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, currentAttendance, weeks);

  // ── Regulatory flags ──────────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, currentAttendance);

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations = generateRecommendations(concerns, input, currentAttendance, exclusionRisk);

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallScore, overallRating, currentAttendance, attendanceCategory, concerns);

  return {
    childId,
    childName,
    assessedAt,
    overallScore,
    overallRating,
    attendanceScore,
    engagementScore,
    stabilityScore,
    complianceScore,
    currentAttendance,
    attendanceCategory,
    attendanceTrend,
    exclusionRisk,
    concerns,
    strengths,
    recommendations,
    regulatoryFlags,
    summary,
  };
}

// ── Attendance Trend ────────────────────────────────────────────────────────

function calculateAttendanceTrend(weeks: EducationWeek[]): EducationAssessment["attendanceTrend"] {
  if (weeks.length < 6) return "stable";

  const midpoint = Math.floor(weeks.length / 2);
  const firstHalf = weeks.slice(0, midpoint);
  const secondHalf = weeks.slice(midpoint);

  const firstRate = firstHalf.reduce((s, w) => s + (w.sessionsExpected > 0 ? w.sessionsAttended / w.sessionsExpected : 0), 0) / firstHalf.length;
  const secondRate = secondHalf.reduce((s, w) => s + (w.sessionsExpected > 0 ? w.sessionsAttended / w.sessionsExpected : 0), 0) / secondHalf.length;

  if (secondRate > firstRate + 0.05) return "improving";
  if (secondRate < firstRate - 0.05) return "declining";
  return "stable";
}

// ── Score Calculations ──────────────────────────────────────────────────────

function calculateAttendanceScore(attendance: number, trend: string): number {
  let score = attendance; // Start with raw attendance %
  if (trend === "improving") score += 5;
  if (trend === "declining") score -= 5;
  return Math.max(0, Math.min(100, score));
}

function calculateEngagementScore(weeks: EducationWeek[], input: EducationInput): number {
  const ratedWeeks = weeks.filter(w => w.engagementRating != null);
  if (ratedWeeks.length === 0) {
    // Estimate from attendance and behaviour
    let score = 50; // baseline
    const avgAttendance = weeks.reduce((s, w) => s + (w.sessionsExpected > 0 ? w.sessionsAttended / w.sessionsExpected : 0), 0) / Math.max(1, weeks.length);
    score += (avgAttendance - 0.5) * 60; // ±30 based on attendance

    const totalPositive = weeks.reduce((s, w) => s + (w.positiveNotes ?? 0), 0);
    const totalNegative = weeks.reduce((s, w) => s + (w.negativeNotes ?? 0), 0);
    if (totalPositive > totalNegative * 2) score += 15;
    else if (totalNegative > totalPositive * 2) score -= 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  const avgEngagement = ratedWeeks.reduce((s, w) => s + (w.engagementRating ?? 3), 0) / ratedWeeks.length;
  return Math.round((avgEngagement / 5) * 100);
}

function calculateStabilityScore(input: EducationInput): number {
  let score = 100;

  // School moves penalty
  if (input.schoolMoves >= 3) score -= 40;
  else if (input.schoolMoves === 2) score -= 25;
  else if (input.schoolMoves === 1) score -= 10;

  // NEET = severe instability
  if (input.currentProvision === "neet") score -= 30;
  if (input.currentProvision === "eotas") score -= 15;

  // Permanent exclusion risk
  if (input.atRiskOfPermanentExclusion) score -= 20;

  return Math.max(0, score);
}

function calculateComplianceScore(input: EducationInput): number {
  let score = 0;
  let maxScore = 0;

  // PEP up to date (most important)
  maxScore += 30;
  if (input.pepUpToDate) score += 30;
  else if (input.pepLastReviewDate) score += 10; // has been reviewed, just overdue

  // Virtual School involvement
  maxScore += 20;
  if (input.virtualSchoolInvolved) score += 20;

  // Designated teacher engagement
  maxScore += 20;
  if (input.designatedTeacherEngaged) score += 20;

  // Pupil Premium Plus allocation
  maxScore += 15;
  if (input.pupilPremiumPlusAllocated) score += 15;

  // EHCP in place if needed
  maxScore += 15;
  if (input.hasEHCP || input.senStatus === "none") score += 15;
  else if (input.senStatus === "sen_support") score += 8; // has some support

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
}

// ── Exclusion Risk ──────────────────────────────────────────────────────────

function assessExclusionRisk(input: EducationInput): EducationAssessment["exclusionRisk"] {
  if (input.atRiskOfPermanentExclusion) return "critical";

  const totalExclusions = input.currentExclusions;
  const recentExclusions = input.weeks.reduce((s, w) => s + w.exclusionDays, 0);

  if (totalExclusions >= 10 || recentExclusions >= 5) return "high";
  if (totalExclusions >= 5 || recentExclusions >= 2) return "moderate";
  if (totalExclusions >= 1) return "moderate";
  return "low";
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: EducationInput,
  attendance: number,
  trend: string,
  exclusionRisk: string,
): EducationConcern[] {
  const concerns: EducationConcern[] = [];

  // Attendance concerns
  if (attendance < SEVERE_ABSENCE_THRESHOLD) {
    concerns.push({ severity: "critical", category: "attendance", description: `Severe absence: attendance at ${attendance}% (below 50%). Child is missing most of their education.` });
  } else if (attendance < PERSISTENT_ABSENCE_THRESHOLD) {
    concerns.push({ severity: "significant", category: "attendance", description: `Persistent absence: attendance at ${attendance}% (below 90%). DfE persistent absence threshold breached.` });
  } else if (attendance < NATIONAL_AVERAGE_ATTENDANCE && trend === "declining") {
    concerns.push({ severity: "moderate", category: "attendance", description: `Attendance (${attendance}%) below national average and declining.` });
  }

  // Declining trend
  if (trend === "declining" && attendance >= PERSISTENT_ABSENCE_THRESHOLD) {
    concerns.push({ severity: "moderate", category: "attendance", description: "Attendance trend is declining — early intervention recommended." });
  }

  // Exclusion concerns
  if (exclusionRisk === "critical") {
    concerns.push({ severity: "critical", category: "exclusion", description: "At risk of permanent exclusion. Urgent multi-agency response required." });
  } else if (exclusionRisk === "high") {
    concerns.push({ severity: "significant", category: "exclusion", description: `${input.currentExclusions} exclusion days this year. Risk of permanent exclusion escalating.` });
  } else if (exclusionRisk === "moderate") {
    concerns.push({ severity: "moderate", category: "exclusion", description: `Fixed-term exclusion(s) recorded. Review behaviour support and school relationship.` });
  }

  // NEET
  if (input.currentProvision === "neet") {
    concerns.push({ severity: "critical", category: "provision", description: "Child is NEET (Not in Education, Employment or Training). Statutory duty to secure provision." });
  }

  // PEP compliance
  if (!input.pepUpToDate) {
    concerns.push({ severity: "significant", category: "compliance", description: "PEP is overdue for review. Virtual School Head should be notified." });
  }

  // Multiple school moves
  if (input.schoolMoves >= 3) {
    concerns.push({ severity: "significant", category: "stability", description: `${input.schoolMoves} school changes in 12 months — severe education instability.` });
  } else if (input.schoolMoves >= 2) {
    concerns.push({ severity: "moderate", category: "stability", description: `${input.schoolMoves} school changes in 12 months — education continuity disrupted.` });
  }

  // No VS involvement when should be
  if (!input.virtualSchoolInvolved && (attendance < 90 || exclusionRisk !== "low")) {
    concerns.push({ severity: "moderate", category: "compliance", description: "Virtual School Head not yet involved despite education concerns." });
  }

  // Late arrivals pattern
  const totalLates = input.weeks.reduce((s, w) => s + w.lateArrivals, 0);
  if (totalLates >= 8) {
    concerns.push({ severity: "moderate", category: "attendance", description: `${totalLates} late arrivals in ${input.weeks.length} weeks — review morning routine support.` });
  }

  return concerns.sort((a, b) => {
    const order = { critical: 0, significant: 1, moderate: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: EducationInput,
  attendance: number,
  weeks: EducationWeek[],
): EducationStrength[] {
  const strengths: EducationStrength[] = [];

  if (attendance >= 96) {
    strengths.push({ category: "Attendance", description: `Excellent attendance at ${attendance}% — above national average` });
  } else if (attendance >= NATIONAL_AVERAGE_ATTENDANCE) {
    strengths.push({ category: "Attendance", description: `Good attendance at ${attendance}% — at or above national average` });
  }

  if (input.pepUpToDate) {
    strengths.push({ category: "Compliance", description: "PEP is up to date and reviewed" });
  }

  if (input.designatedTeacherEngaged && input.virtualSchoolInvolved) {
    strengths.push({ category: "Support", description: "Strong multi-agency education support in place (DT + VS)" });
  }

  if (input.currentExclusions === 0 && input.previousExclusions === 0) {
    strengths.push({ category: "Behaviour", description: "No exclusions — positive school relationship" });
  }

  const totalPositive = weeks.reduce((s, w) => s + (w.positiveNotes ?? 0), 0);
  if (totalPositive >= 5) {
    strengths.push({ category: "Achievement", description: `${totalPositive} positive notes from school — celebrating success` });
  }

  if (input.pupilPremiumPlusAllocated) {
    strengths.push({ category: "Resourcing", description: "Pupil Premium Plus being used to support education" });
  }

  if (input.currentProvision === "mainstream_school" && input.schoolMoves === 0) {
    strengths.push({ category: "Stability", description: "Stable mainstream school placement maintained" });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(input: EducationInput, attendance: number): EducationRegulatoryFlag[] {
  const flags: EducationRegulatoryFlag[] = [];

  // Reg 8(1): Promote education
  flags.push({
    regulation: "CHR 2015 Reg 8(1)",
    area: "Education promotion",
    status: attendance >= 90 && input.currentProvision !== "neet" ? "met" :
            attendance >= 75 ? "partially_met" : "not_met",
    detail: input.currentProvision === "neet"
      ? "Child is NEET — duty to promote education not being met"
      : `Attendance at ${attendance}% — ${attendance >= 90 ? "promoted effectively" : "requires improvement"}`,
  });

  // Reg 8(2)(a): PEP
  flags.push({
    regulation: "CHR 2015 Reg 8(2)(a)",
    area: "Personal Education Plan",
    status: input.pepUpToDate ? "met" : input.pepLastReviewDate ? "partially_met" : "not_met",
    detail: input.pepUpToDate
      ? "PEP up to date and reviewed"
      : "PEP overdue — must be reviewed termly as minimum",
  });

  // SCCIF: Educational progress
  const engagementRatings = input.weeks.filter(w => w.engagementRating != null);
  const avgEngagement = engagementRatings.length > 0
    ? engagementRatings.reduce((s, w) => s + (w.engagementRating ?? 0), 0) / engagementRatings.length
    : 0;

  flags.push({
    regulation: "SCCIF",
    area: "Educational progress & achievement",
    status: avgEngagement >= 3.5 || (attendance >= 90 && input.currentExclusions === 0) ? "met" :
            attendance >= 75 ? "partially_met" : "not_met",
    detail: avgEngagement > 0
      ? `Average engagement rating: ${avgEngagement.toFixed(1)}/5`
      : `Based on attendance (${attendance}%) and exclusion data`,
  });

  // DfE: Virtual School Head involvement
  if (attendance < 90 || input.currentExclusions > 0 || input.currentProvision === "neet") {
    flags.push({
      regulation: "DfE VSH Guidance",
      area: "Virtual School Head involvement",
      status: input.virtualSchoolInvolved ? "met" : "not_met",
      detail: input.virtualSchoolInvolved
        ? "Virtual School Head engaged and supporting"
        : "Virtual School Head should be informed given current concerns",
    });
  }

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function generateRecommendations(
  concerns: EducationConcern[],
  input: EducationInput,
  attendance: number,
  exclusionRisk: string,
): string[] {
  const recs: string[] = [];

  if (input.currentProvision === "neet") {
    recs.push("URGENT: Secure educational provision. Contact Virtual School Head and placing authority immediately.");
  }

  if (exclusionRisk === "critical" || exclusionRisk === "high") {
    recs.push("Convene urgent education planning meeting with school, Virtual School Head, and social worker.");
  }

  if (!input.pepUpToDate) {
    recs.push("Schedule PEP review within 2 weeks — involve designated teacher, carer, and Virtual School Head.");
  }

  if (attendance < PERSISTENT_ABSENCE_THRESHOLD) {
    recs.push("Implement attendance improvement plan. Explore barriers with young person. Consider morning routine support.");
  }

  if (!input.virtualSchoolInvolved && (attendance < 90 || exclusionRisk !== "low")) {
    recs.push("Contact Virtual School Head to request involvement and guidance.");
  }

  if (!input.designatedTeacherEngaged) {
    recs.push("Establish regular communication with the designated teacher at school.");
  }

  if (input.schoolMoves >= 2) {
    recs.push("Prioritise education stability. Any further placement considerations must include school continuity.");
  }

  const totalLates = input.weeks.reduce((s, w) => s + w.lateArrivals, 0);
  if (totalLates >= 8) {
    recs.push("Review morning routine — ensure child is supported to arrive at school on time consistently.");
  }

  if (!input.pupilPremiumPlusAllocated && input.currentProvision !== "neet") {
    recs.push("Ensure Pupil Premium Plus is allocated and being used effectively to support learning.");
  }

  return [...new Set(recs)].slice(0, 5);
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  score: number,
  rating: string,
  attendance: number,
  category: string,
  concerns: EducationConcern[],
): string {
  const parts: string[] = [];

  parts.push(`Education engagement for ${childName}: ${score}% (${rating.replace(/_/g, " ")}).`);
  parts.push(`Attendance: ${attendance}% (${category.replace(/_/g, " ")}).`);

  const critical = concerns.filter(c => c.severity === "critical");
  if (critical.length > 0) {
    parts.push(`${critical.length} critical concern(s) requiring urgent action.`);
  }

  return parts.join(" ");
}
