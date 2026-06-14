// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Education
//
// Pure deterministic analysis of educational engagement and progress for LAC.
// Tracks:
//   - Attendance (overall %, authorised/unauthorised absences)
//   - Attainment & progress (grades, target progress)
//   - PEP (Personal Education Plan) currency and quality
//   - Exclusions (fixed-term, permanent, internal)
//   - Educational provision (SEND support, PP+ usage)
//   - Designated Teacher engagement
//   - Virtual School involvement
//
// Regulatory alignment:
//   - CHR 2015 Reg 8 — Education
//   - CHR 2015 Reg 5 — Quality & purpose of care
//   - SCCIF — Education outcomes
//   - Children Act 1989 s22(3A) — Duty to promote educational achievement
//   - Promoting the Education of LAC (DfE 2018)
//   - Virtual School Head guidance
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type AttendanceBand = "excellent" | "good" | "concern" | "persistent_absence" | "severe_absence";
export type ExclusionType = "fixed_term" | "permanent" | "internal";
export type PEPQuality = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface AttendanceRecord {
  weekStarting: string;
  possibleSessions: number;
  attendedSessions: number;
  authorisedAbsences: number;
  unauthorisedAbsences: number;
  lates: number;
}

export interface ExclusionRecord {
  date: string;
  type: ExclusionType;
  days: number;
  reason: string;
  reintegrationPlan: boolean;
}

export interface PEPRecord {
  date: string;
  quality: PEPQuality;
  targetsSet: number;
  targetsMet: number;
  pupilPremiumPlusAllocated: number;
  pupilPremiumPlusSpent: number;
  childContributed: boolean;
  carerContributed: boolean;
  virtualSchoolAttended: boolean;
}

export interface EducationInput {
  childId: string;
  childName: string;
  age: number;
  yearGroup: number;

  // School info
  schoolName: string;
  schoolType: "mainstream" | "special" | "pru" | "alternative_provision" | "eotas" | "neet";
  inEducation: boolean;

  // Attendance (last term / 12 weeks)
  attendanceRecords: AttendanceRecord[];
  attendanceTrend: "improving" | "stable" | "declining";

  // Exclusions (last 12 months)
  exclusions: ExclusionRecord[];

  // PEP
  pepRecords: PEPRecord[]; // last 3 termly PEPs
  pepDue: boolean; // is next PEP overdue?

  // Attainment
  onTrackForTargets: boolean;
  progressRating: "above_expected" | "expected" | "below_expected" | "significantly_below";
  sendSupport: boolean;
  ehcpInPlace: boolean;

  // Support provisions
  designatedTeacherEngaged: boolean;
  virtualSchoolInvolved: boolean;
  tutoring: boolean;
  mentoring: boolean;
  ppPlusEffectivelyUsed: boolean;

  // Engagement
  childEnjoysSChool: boolean;
  homeworkSupported: boolean;
  aspirationsDiscussed: boolean;
  careerGuidanceAccessed: boolean; // 14+

  // Transition planning (if Year 11+)
  postSixteenPlanInPlace: boolean;
}

// ── Output Types ───────────────────────────────────────────────────────────

export interface EducationAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  attendanceScore: number;
  progressScore: number;
  pepScore: number;
  supportScore: number;

  // Key metrics
  attendancePercentage: number;
  attendanceBand: AttendanceBand;
  totalExclusions: number;
  exclusionDays: number;
  latestPEPQuality: PEPQuality | "none";
  pepTargetsMet: number;
  pepTargetsSet: number;

  concerns: EducationConcern[];
  strengths: EducationStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface EducationConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface EducationStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseEducation(input: EducationInput): EducationAssessment {
  const { childName } = input;

  // ── Attendance ─────────────────────────────────────────────────
  const attendancePercentage = calculateAttendance(input.attendanceRecords);
  const attendanceBand = getAttendanceBand(attendancePercentage);

  // ── Exclusions ─────────────────────────────────────────────────
  const totalExclusions = input.exclusions.length;
  const exclusionDays = input.exclusions.reduce((s, e) => s + e.days, 0);

  // ── PEP ────────────────────────────────────────────────────────
  const latestPEP = input.pepRecords.length > 0
    ? input.pepRecords[input.pepRecords.length - 1]
    : undefined;
  const latestPEPQuality: PEPQuality | "none" = latestPEP?.quality ?? "none";
  const pepTargetsMet = latestPEP?.targetsMet ?? 0;
  const pepTargetsSet = latestPEP?.targetsSet ?? 0;

  // ── Scores ─────────────────────────────────────────────────────
  const attendanceScore = scoreAttendance(attendancePercentage, input);
  const progressScore = scoreProgress(input);
  const pepScore = scorePEP(input, latestPEP);
  const supportScore = scoreSupport(input);

  // ── Overall ────────────────────────────────────────────────────
  const overallScore = Math.round(
    attendanceScore * 0.30 +
    progressScore * 0.25 +
    pepScore * 0.25 +
    supportScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ───────────────────────────────────────────────────
  const concerns = identifyConcerns(input, attendancePercentage, attendanceBand, totalExclusions, latestPEP);

  // ── Strengths ──────────────────────────────────────────────────
  const strengths = identifyStrengths(input, attendanceBand, latestPEP);

  // ── Regulatory ─────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, attendanceBand, latestPEP);

  // ── Recommendations ────────────────────────────────────────────
  const recommendations = buildRecommendations(input, attendancePercentage, attendanceBand, totalExclusions, latestPEP);

  // ── Summary ────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, attendancePercentage, attendanceBand, input.progressRating);

  return {
    childName,
    overallScore,
    overallRating,
    attendanceScore,
    progressScore,
    pepScore,
    supportScore,
    attendancePercentage,
    attendanceBand,
    totalExclusions,
    exclusionDays,
    latestPEPQuality,
    pepTargetsMet,
    pepTargetsSet,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Attendance Calculation ──────────────────────────────────────────────────

function calculateAttendance(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  const totalPossible = records.reduce((s, r) => s + r.possibleSessions, 0);
  const totalAttended = records.reduce((s, r) => s + r.attendedSessions, 0);
  if (totalPossible === 0) return 0;
  return Math.round((totalAttended / totalPossible) * 1000) / 10; // e.g. 94.5
}

function getAttendanceBand(pct: number): AttendanceBand {
  if (pct >= 97) return "excellent";
  if (pct >= 95) return "good";
  if (pct >= 90) return "concern";
  if (pct >= 50) return "persistent_absence";
  return "severe_absence";
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreAttendance(pct: number, input: EducationInput): number {
  if (!input.inEducation) return 0; // NEET is critical

  let score = 0;

  // Attendance band mapping
  if (pct >= 97) score += 60;
  else if (pct >= 95) score += 50;
  else if (pct >= 90) score += 35;
  else if (pct >= 80) score += 20;
  else score += 5;

  // Trend
  if (input.attendanceTrend === "improving") score += 15;
  else if (input.attendanceTrend === "stable" && pct >= 95) score += 15;
  else if (input.attendanceTrend === "stable") score += 10;
  else score += 0; // declining

  // Exclusions penalty
  const exclDays = input.exclusions.reduce((s, e) => s + e.days, 0);
  if (exclDays > 10) score -= 20;
  else if (exclDays > 5) score -= 10;
  else if (exclDays > 0) score -= 5;

  // Lates penalty
  const totalLates = input.attendanceRecords.reduce((s, r) => s + r.lates, 0);
  if (totalLates > 10) score -= 10;
  else if (totalLates > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function scoreProgress(input: EducationInput): number {
  if (!input.inEducation) return 0;

  let score = 0;

  // Progress rating
  switch (input.progressRating) {
    case "above_expected": score += 50; break;
    case "expected": score += 40; break;
    case "below_expected": score += 20; break;
    case "significantly_below": score += 5; break;
  }

  // On track
  if (input.onTrackForTargets) score += 25;

  // SEND support in place when needed
  if (input.ehcpInPlace) score += 15;
  else if (input.sendSupport) score += 10;
  else score += 15; // no SEND need = fine

  // Enjoyment / engagement
  if (input.childEnjoysSChool) score += 10;

  return Math.min(100, score);
}

function scorePEP(input: EducationInput, latestPEP: PEPRecord | undefined): number {
  if (!input.inEducation) return 0;

  let score = 0;

  if (!latestPEP) {
    // No PEP at all
    return input.pepDue ? 0 : 20;
  }

  // Quality
  switch (latestPEP.quality) {
    case "outstanding": score += 35; break;
    case "good": score += 30; break;
    case "requires_improvement": score += 15; break;
    case "inadequate": score += 5; break;
  }

  // Targets met ratio
  const targetRatio = latestPEP.targetsSet > 0
    ? latestPEP.targetsMet / latestPEP.targetsSet
    : 0;
  score += Math.round(targetRatio * 25);

  // Participation
  if (latestPEP.childContributed) score += 10;
  if (latestPEP.carerContributed) score += 10;
  if (latestPEP.virtualSchoolAttended) score += 10;

  // PP+ usage
  if (latestPEP.pupilPremiumPlusAllocated > 0) {
    const spentRatio = latestPEP.pupilPremiumPlusSpent / latestPEP.pupilPremiumPlusAllocated;
    if (spentRatio >= 0.5) score += 10;
  } else {
    score += 5; // not allocated yet
  }

  // Overdue penalty
  if (input.pepDue) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function scoreSupport(input: EducationInput): number {
  if (!input.inEducation) return 10; // some support even if NEET

  let score = 0;

  if (input.designatedTeacherEngaged) score += 20;
  if (input.virtualSchoolInvolved) score += 15;
  if (input.homeworkSupported) score += 15;
  if (input.aspirationsDiscussed) score += 15;
  if (input.ppPlusEffectivelyUsed) score += 15;

  // Age-appropriate
  if (input.age >= 14 && input.careerGuidanceAccessed) score += 10;
  else if (input.age < 14) score += 10; // not applicable yet

  if (input.tutoring || input.mentoring) score += 10;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: EducationInput,
  attendancePct: number,
  band: AttendanceBand,
  exclusionCount: number,
  latestPEP: PEPRecord | undefined,
): EducationConcern[] {
  const concerns: EducationConcern[] = [];

  // NEET
  if (!input.inEducation) {
    concerns.push({
      severity: "critical",
      category: "provision",
      description: "Child not in education — immediate action to secure provision",
    });
  }

  // Severe absence
  if (band === "severe_absence") {
    concerns.push({
      severity: "critical",
      category: "attendance",
      description: `Attendance severely low (${attendancePct}%) — multi-agency response needed`,
    });
  } else if (band === "persistent_absence") {
    concerns.push({
      severity: "significant",
      category: "attendance",
      description: `Persistent absence (${attendancePct}%) — attendance strategy needed`,
    });
  } else if (band === "concern") {
    concerns.push({
      severity: "moderate",
      category: "attendance",
      description: `Attendance below good (${attendancePct}%) — monitor and support`,
    });
  }

  // Declining attendance
  if (input.attendanceTrend === "declining" && band !== "severe_absence") {
    concerns.push({
      severity: "moderate",
      category: "attendance_trend",
      description: "Attendance trend declining — early intervention needed",
    });
  }

  // Exclusions
  if (input.exclusions.some(e => e.type === "permanent")) {
    concerns.push({
      severity: "critical",
      category: "exclusion",
      description: "Permanent exclusion — alternative provision must be secured",
    });
  } else if (exclusionCount >= 3) {
    concerns.push({
      severity: "significant",
      category: "exclusion",
      description: `${exclusionCount} exclusions this year — review behaviour support`,
    });
  } else if (exclusionCount > 0) {
    concerns.push({
      severity: "moderate",
      category: "exclusion",
      description: `${exclusionCount} exclusion(s) — monitor and ensure reintegration support`,
    });
  }

  // Progress
  if (input.progressRating === "significantly_below") {
    concerns.push({
      severity: "significant",
      category: "progress",
      description: "Progress significantly below expected — review support package",
    });
  } else if (input.progressRating === "below_expected") {
    concerns.push({
      severity: "moderate",
      category: "progress",
      description: "Progress below expected — consider additional interventions",
    });
  }

  // PEP overdue
  if (input.pepDue) {
    concerns.push({
      severity: "significant",
      category: "pep",
      description: "PEP overdue — statutory requirement for termly review",
    });
  }

  // PEP quality poor
  if (latestPEP && latestPEP.quality === "inadequate") {
    concerns.push({
      severity: "significant",
      category: "pep_quality",
      description: "PEP quality inadequate — does not meet child's needs",
    });
  }

  // Designated teacher not engaged
  if (input.inEducation && !input.designatedTeacherEngaged) {
    concerns.push({
      severity: "moderate",
      category: "support",
      description: "Designated Teacher not actively engaged — statutory role",
    });
  }

  // Post-16 plan missing
  if (input.age >= 15 && input.yearGroup >= 11 && !input.postSixteenPlanInPlace) {
    concerns.push({
      severity: "moderate",
      category: "transition",
      description: "Post-16 education/training plan not yet in place",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: EducationInput,
  band: AttendanceBand,
  latestPEP: PEPRecord | undefined,
): EducationStrength[] {
  const strengths: EducationStrength[] = [];

  if (band === "excellent") {
    strengths.push({ category: "attendance", description: "Excellent attendance — strong engagement with school" });
  } else if (band === "good") {
    strengths.push({ category: "attendance", description: "Good attendance record" });
  }

  if (input.progressRating === "above_expected") {
    strengths.push({ category: "progress", description: "Making above expected progress — thriving academically" });
  } else if (input.progressRating === "expected" && input.onTrackForTargets) {
    strengths.push({ category: "progress", description: "On track and meeting targets" });
  }

  if (latestPEP && (latestPEP.quality === "outstanding" || latestPEP.quality === "good")) {
    strengths.push({ category: "pep", description: `PEP quality ${latestPEP.quality} — clear targets and support` });
  }

  if (latestPEP && latestPEP.targetsSet > 0 && latestPEP.targetsMet === latestPEP.targetsSet) {
    strengths.push({ category: "targets", description: "All PEP targets met" });
  }

  if (input.childEnjoysSChool) {
    strengths.push({ category: "engagement", description: "Child enjoys school and feels positive about learning" });
  }

  if (input.designatedTeacherEngaged && input.virtualSchoolInvolved) {
    strengths.push({ category: "support", description: "Strong network — DT and Virtual School actively engaged" });
  }

  if (input.exclusions.length === 0) {
    strengths.push({ category: "behaviour", description: "No exclusions — positive behaviour in school" });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: EducationInput,
  band: AttendanceBand,
  latestPEP: PEPRecord | undefined,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 8 — Education
  const reg8Met = input.inEducation &&
    (band === "excellent" || band === "good") &&
    input.designatedTeacherEngaged;
  flags.push({
    regulation: "CHR 2015 Reg 8",
    area: "Education",
    status: reg8Met ? "met"
      : input.inEducation ? "partially_met"
      : "not_met",
    detail: reg8Met
      ? "Education provision good with strong attendance and DT engagement"
      : input.inEducation
        ? "In education but attendance or support needs improvement"
        : "Child not in education — statutory duty not met",
  });

  // PEP statutory requirement
  const pepMet = !input.pepDue && latestPEP &&
    (latestPEP.quality === "outstanding" || latestPEP.quality === "good");
  flags.push({
    regulation: "Promoting Education of LAC",
    area: "PEP Quality",
    status: pepMet ? "met"
      : (!input.pepDue && latestPEP) ? "partially_met"
      : "not_met",
    detail: pepMet
      ? "PEP current and of good quality"
      : input.pepDue
        ? "PEP overdue — statutory requirement for termly review"
        : "PEP quality needs improvement",
  });

  // Virtual School engagement
  flags.push({
    regulation: "Children Act 1989 s22(3A)",
    area: "Educational Achievement",
    status: input.virtualSchoolInvolved && input.ppPlusEffectivelyUsed ? "met"
      : input.virtualSchoolInvolved ? "partially_met"
      : "not_met",
    detail: input.virtualSchoolInvolved
      ? "Virtual School engaged and PP+ effectively deployed"
      : "Virtual School not sufficiently involved",
  });

  // SCCIF Education outcomes
  const sccifEd = input.inEducation &&
    (band === "excellent" || band === "good") &&
    (input.progressRating === "above_expected" || input.progressRating === "expected");
  flags.push({
    regulation: "SCCIF",
    area: "Education Outcomes",
    status: sccifEd ? "met"
      : input.inEducation && input.progressRating !== "significantly_below" ? "partially_met"
      : "not_met",
    detail: sccifEd
      ? "Educational outcomes positive — attendance and progress good"
      : "Educational outcomes require improvement",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: EducationInput,
  attendancePct: number,
  band: AttendanceBand,
  exclusionCount: number,
  latestPEP: PEPRecord | undefined,
): string[] {
  const recs: string[] = [];

  if (!input.inEducation) {
    recs.push("URGENT: Secure education provision — statutory duty under s22(3A) Children Act 1989");
  }

  if (band === "severe_absence" || band === "persistent_absence") {
    recs.push("Implement attendance recovery plan with school and Virtual School Head");
  } else if (band === "concern") {
    recs.push("Monitor attendance closely — early signs of disengagement");
  }

  if (input.attendanceTrend === "declining") {
    recs.push("Investigate reasons for declining attendance — liaise with Designated Teacher");
  }

  if (exclusionCount >= 3) {
    recs.push("Review behaviour support plan — multiple exclusions indicate unmet need");
  }
  if (input.exclusions.some(e => !e.reintegrationPlan)) {
    recs.push("Ensure reintegration plan in place for all exclusions");
  }

  if (input.pepDue) {
    recs.push("Arrange PEP meeting urgently — statutory termly requirement");
  }
  if (latestPEP && latestPEP.quality === "inadequate") {
    recs.push("Work with Virtual School to improve PEP quality and target-setting");
  }

  if (input.progressRating === "significantly_below" || input.progressRating === "below_expected") {
    recs.push("Review interventions — consider additional tutoring or mentoring");
  }

  if (!input.designatedTeacherEngaged) {
    recs.push("Engage Designated Teacher — statutory role for LAC in school");
  }

  if (!input.virtualSchoolInvolved) {
    recs.push("Request Virtual School involvement — statutory duty to promote education");
  }

  if (input.age >= 14 && !input.careerGuidanceAccessed) {
    recs.push("Arrange independent careers guidance — statutory entitlement");
  }

  if (input.age >= 15 && input.yearGroup >= 11 && !input.postSixteenPlanInPlace) {
    recs.push("Develop post-16 plan — ensure smooth transition");
  }

  if (!input.homeworkSupported) {
    recs.push("Ensure homework environment and support is available");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  attendancePct: number,
  band: AttendanceBand,
  progress: string,
): string {
  const attendDesc = band === "excellent" || band === "good"
    ? `attendance ${attendancePct}%`
    : `attendance ${attendancePct}% (${band.replace(/_/g, " ")})`;
  const progressDesc = progress.replace(/_/g, " ");
  return `${childName}: Education rated ${rating.replace(/_/g, " ")}. ${attendDesc}, progress ${progressDesc}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
