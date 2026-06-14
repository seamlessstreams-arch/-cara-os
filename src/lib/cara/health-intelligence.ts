// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Health (Physical)
//
// Pure deterministic analysis of physical health for LAC in residential care.
// Tracks:
//   - Statutory health assessments (IHA/RHA currency)
//   - Immunisation status
//   - Dental checks (6-monthly)
//   - Optical checks (annual)
//   - GP registration
//   - Health action plan progress
//   - Medication management
//   - Substance misuse
//   - Health appointments attendance
//
// Regulatory alignment:
//   - CHR 2015 Reg 6(2)(b) — Physical health
//   - Promoting Health of Looked After Children (DfE/DH 2015)
//   - SCCIF — Health outcomes
//   - Children Act 1989 Sch 2 — Health care plans
//   - IHA within 20 working days of becoming LAC
//   - RHA 6-monthly (under 5) or annually (5+)
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type AssessmentType = "initial" | "review";

export interface HealthAssessment {
  date: string;
  type: AssessmentType;
  completedOnTime: boolean;
  actionPlanCreated: boolean;
}

export interface Immunisation {
  name: string;
  due: boolean;
  overdue: boolean;
  dateGiven?: string;
}

export interface HealthAppointment {
  date: string;
  type: "gp" | "dental" | "optical" | "specialist" | "camhs" | "sexual_health" | "other";
  attended: boolean;
  reason?: string;
}

export interface Medication {
  name: string;
  prescribed: boolean;
  administeredCorrectly: boolean;
  consentInPlace: boolean;
  reviewDue: boolean;
}

export interface HealthInput {
  childId: string;
  childName: string;
  age: number;

  // Statutory assessments
  healthAssessments: HealthAssessment[];
  lastAssessmentDate?: string;
  nextAssessmentDue?: string;
  assessmentOverdue: boolean;

  // Registrations
  gpRegistered: boolean;
  dentistRegistered: boolean;
  opticiansRegistered: boolean;

  // Checks
  dentalCheckLast6Months: boolean;
  opticalCheckLast12Months: boolean;
  lastDentalDate?: string;
  lastOpticalDate?: string;

  // Immunisations
  immunisations: Immunisation[];
  immunisationsUpToDate: boolean;

  // Appointments (last 6 months)
  appointments: HealthAppointment[];

  // Medication
  medications: Medication[];

  // Health action plan
  healthActionPlanInPlace: boolean;
  healthActionPlanReviewed: boolean;
  actionsTotal: number;
  actionsCompleted: number;

  // Lifestyle
  substanceMisuseIdentified: boolean;
  substanceMisuseSupport: boolean;
  healthyEatingSupported: boolean;
  physicalActivityRegular: boolean;
  sleepRoutineGood: boolean;

  // Support
  staffHealthTrained: boolean;
  childUnderstandsHealth: boolean;
  consentFormsComplete: boolean;
  healthPassportUpToDate: boolean;
}

// ── Output Types ───────────────────────────────────────────────────────────

export interface HealthAssessmentResult {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  assessmentScore: number;
  registrationScore: number;
  appointmentScore: number;
  lifestyleScore: number;

  // Key metrics
  assessmentStatus: "current" | "due_soon" | "overdue";
  immunisationRate: number;
  appointmentAttendanceRate: number;
  medicationCompliance: boolean;
  healthActionProgress: number; // percentage

  concerns: HealthConcern[];
  strengths: HealthStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface HealthConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface HealthStrength {
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

export function analyseHealth(input: HealthInput): HealthAssessmentResult {
  const { childName } = input;

  // ── Key metrics ─────────────────────────────────────────────────
  const assessmentStatus = getAssessmentStatus(input);

  const immunisationRate = input.immunisations.length > 0
    ? Math.round((input.immunisations.filter(i => !i.due && !i.overdue).length / input.immunisations.length) * 100) / 100
    : 1; // no data = assume up to date

  const totalAppts = input.appointments.length;
  const attendedAppts = input.appointments.filter(a => a.attended).length;
  const appointmentAttendanceRate = totalAppts > 0
    ? Math.round((attendedAppts / totalAppts) * 100) / 100
    : 1;

  const medicationCompliance = input.medications.length === 0 ||
    input.medications.every(m => m.administeredCorrectly && m.consentInPlace);

  const healthActionProgress = input.actionsTotal > 0
    ? Math.round((input.actionsCompleted / input.actionsTotal) * 100)
    : 100;

  // ── Scores ─────────────────────────────────────────────────────
  const assessmentScore = scoreAssessments(input, immunisationRate);
  const registrationScore = scoreRegistrations(input);
  const appointmentScore = scoreAppointments(input, appointmentAttendanceRate);
  const lifestyleScore = scoreLifestyle(input);

  // ── Overall ────────────────────────────────────────────────────
  const overallScore = Math.round(
    assessmentScore * 0.30 +
    registrationScore * 0.25 +
    appointmentScore * 0.25 +
    lifestyleScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ───────────────────────────────────────────────────
  const concerns = identifyConcerns(input, assessmentStatus, immunisationRate, appointmentAttendanceRate, medicationCompliance);

  // ── Strengths ──────────────────────────────────────────────────
  const strengths = identifyStrengths(input, assessmentStatus, immunisationRate, appointmentAttendanceRate);

  // ── Regulatory ─────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, assessmentStatus, immunisationRate);

  // ── Recommendations ────────────────────────────────────────────
  const recommendations = buildRecommendations(input, assessmentStatus, immunisationRate, appointmentAttendanceRate);

  // ── Summary ────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, assessmentStatus, immunisationRate);

  return {
    childName,
    overallScore,
    overallRating,
    assessmentScore,
    registrationScore,
    appointmentScore,
    lifestyleScore,
    assessmentStatus,
    immunisationRate,
    appointmentAttendanceRate,
    medicationCompliance,
    healthActionProgress,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Assessment Status ───────────────────────────────────────────────────────

function getAssessmentStatus(input: HealthInput): "current" | "due_soon" | "overdue" {
  if (input.assessmentOverdue) return "overdue";
  // If we have a next due date and it's within 30 days, it's due soon
  // But since we don't do date math here beyond what's given, rely on the flag
  if (input.healthAssessments.length === 0) return "overdue";
  return "current";
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreAssessments(input: HealthInput, immunisationRate: number): number {
  let score = 0;

  // Health assessment status
  if (!input.assessmentOverdue && input.healthAssessments.length > 0) score += 30;
  else if (input.assessmentOverdue) score += 0;
  else score += 15; // no assessments but not flagged overdue

  // Assessments completed on time
  const onTimeRate = input.healthAssessments.length > 0
    ? input.healthAssessments.filter(a => a.completedOnTime).length / input.healthAssessments.length
    : 0;
  score += Math.round(onTimeRate * 20);

  // Action plan
  if (input.healthActionPlanInPlace) score += 10;
  if (input.healthActionPlanReviewed) score += 10;

  // Immunisations
  score += Math.round(immunisationRate * 20);

  // Health passport
  if (input.healthPassportUpToDate) score += 10;

  return Math.min(100, score);
}

function scoreRegistrations(input: HealthInput): number {
  let score = 0;

  if (input.gpRegistered) score += 30;
  if (input.dentistRegistered) score += 25;
  if (input.opticiansRegistered) score += 20;
  if (input.dentalCheckLast6Months) score += 15;
  if (input.opticalCheckLast12Months) score += 10;

  return Math.min(100, score);
}

function scoreAppointments(input: HealthInput, attendanceRate: number): number {
  let score = 0;

  // Attendance rate
  score += Math.round(attendanceRate * 50);

  // Medication management
  if (input.medications.length === 0) {
    score += 25; // no meds = no concerns
  } else {
    const compliant = input.medications.filter(m => m.administeredCorrectly && m.consentInPlace).length;
    score += Math.round((compliant / input.medications.length) * 25);
  }

  // Consent forms
  if (input.consentFormsComplete) score += 15;

  // Staff trained
  if (input.staffHealthTrained) score += 10;

  return Math.min(100, score);
}

function scoreLifestyle(input: HealthInput): number {
  let score = 0;

  if (input.healthyEatingSupported) score += 20;
  if (input.physicalActivityRegular) score += 20;
  if (input.sleepRoutineGood) score += 20;
  if (input.childUnderstandsHealth) score += 15;

  // Substance misuse
  if (!input.substanceMisuseIdentified) {
    score += 25; // no issues
  } else if (input.substanceMisuseSupport) {
    score += 15; // issues but support in place
  } else {
    score += 0; // issues and no support
  }

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: HealthInput,
  status: string,
  immunisationRate: number,
  attendanceRate: number,
  medicationCompliance: boolean,
): HealthConcern[] {
  const concerns: HealthConcern[] = [];

  // Overdue health assessment
  if (status === "overdue") {
    concerns.push({
      severity: "critical",
      category: "assessment",
      description: "Health assessment overdue — statutory requirement",
    });
  }

  // GP not registered
  if (!input.gpRegistered) {
    concerns.push({
      severity: "critical",
      category: "registration",
      description: "Not registered with GP — immediate action needed",
    });
  }

  // Immunisations
  if (immunisationRate < 1) {
    const overdue = input.immunisations.filter(i => i.overdue).length;
    if (overdue > 0) {
      concerns.push({
        severity: "significant",
        category: "immunisation",
        description: `${overdue} overdue immunisation(s) — arrange with GP`,
      });
    } else {
      concerns.push({
        severity: "moderate",
        category: "immunisation",
        description: "Immunisations not fully up to date",
      });
    }
  }

  // Dental not done
  if (!input.dentalCheckLast6Months) {
    concerns.push({
      severity: input.dentistRegistered ? "moderate" : "significant",
      category: "dental",
      description: input.dentistRegistered
        ? "Dental check overdue (6-monthly requirement)"
        : "Not registered with dentist and dental check overdue",
    });
  }

  // Optical not done
  if (!input.opticalCheckLast12Months) {
    concerns.push({
      severity: "moderate",
      category: "optical",
      description: "Optical check overdue (annual requirement)",
    });
  }

  // Poor appointment attendance
  if (input.appointments.length > 0 && attendanceRate < 0.7) {
    concerns.push({
      severity: "significant",
      category: "appointments",
      description: `Health appointment attendance ${Math.round(attendanceRate * 100)}% — explore barriers`,
    });
  }

  // Medication issues
  if (!medicationCompliance) {
    const issues = input.medications.filter(m => !m.administeredCorrectly || !m.consentInPlace);
    concerns.push({
      severity: "significant",
      category: "medication",
      description: `${issues.length} medication(s) with compliance issues — review immediately`,
    });
  }

  // Medication review due
  const reviewDue = input.medications.filter(m => m.reviewDue);
  if (reviewDue.length > 0) {
    concerns.push({
      severity: "moderate",
      category: "medication_review",
      description: `${reviewDue.length} medication(s) due for review`,
    });
  }

  // Substance misuse without support
  if (input.substanceMisuseIdentified && !input.substanceMisuseSupport) {
    concerns.push({
      severity: "significant",
      category: "substance_misuse",
      description: "Substance misuse identified without support in place",
    });
  }

  // No health action plan
  if (!input.healthActionPlanInPlace) {
    concerns.push({
      severity: "moderate",
      category: "action_plan",
      description: "Health action plan not in place",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: HealthInput,
  status: string,
  immunisationRate: number,
  attendanceRate: number,
): HealthStrength[] {
  const strengths: HealthStrength[] = [];

  if (status === "current") {
    strengths.push({ category: "assessment", description: "Health assessment current — statutory requirements met" });
  }

  if (immunisationRate >= 1) {
    strengths.push({ category: "immunisation", description: "All immunisations up to date" });
  }

  if (input.gpRegistered && input.dentistRegistered && input.opticiansRegistered) {
    strengths.push({ category: "registration", description: "Registered with GP, dentist, and optician" });
  }

  if (attendanceRate >= 0.9 && input.appointments.length > 0) {
    strengths.push({ category: "appointments", description: "Excellent health appointment attendance" });
  }

  if (input.dentalCheckLast6Months && input.opticalCheckLast12Months) {
    strengths.push({ category: "checks", description: "Dental and optical checks current" });
  }

  if (input.healthyEatingSupported && input.physicalActivityRegular && input.sleepRoutineGood) {
    strengths.push({ category: "lifestyle", description: "Healthy lifestyle supported — diet, exercise, and sleep" });
  }

  if (input.healthPassportUpToDate) {
    strengths.push({ category: "records", description: "Health passport up to date — continuity of care supported" });
  }

  if (input.medications.length > 0 && input.medications.every(m => m.administeredCorrectly && m.consentInPlace)) {
    strengths.push({ category: "medication", description: "All medications managed correctly with consent" });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: HealthInput,
  status: string,
  immunisationRate: number,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 6(2)(b) — Physical health
  const reg6Met = status === "current" &&
    input.gpRegistered &&
    input.dentalCheckLast6Months &&
    input.healthActionPlanInPlace;
  flags.push({
    regulation: "CHR 2015 Reg 6(2)(b)",
    area: "Physical Health",
    status: reg6Met ? "met"
      : (status === "current" || input.gpRegistered) ? "partially_met"
      : "not_met",
    detail: reg6Met
      ? "Physical health actively promoted and monitored"
      : "Physical health monitoring needs improvement",
  });

  // Promoting Health of LAC
  const promotingMet = status === "current" &&
    immunisationRate >= 1 &&
    input.dentalCheckLast6Months &&
    input.opticalCheckLast12Months;
  flags.push({
    regulation: "Promoting Health of LAC",
    area: "Health Checks",
    status: promotingMet ? "met"
      : (status === "current" || input.dentalCheckLast6Months) ? "partially_met"
      : "not_met",
    detail: promotingMet
      ? "All statutory health checks completed on schedule"
      : "Some health checks outstanding",
  });

  // SCCIF Health
  const sccifMet = status === "current" &&
    input.gpRegistered &&
    input.healthyEatingSupported &&
    input.physicalActivityRegular;
  flags.push({
    regulation: "SCCIF",
    area: "Health Outcomes",
    status: sccifMet ? "met"
      : input.gpRegistered ? "partially_met"
      : "not_met",
    detail: sccifMet
      ? "Health outcomes positive — child's health actively promoted"
      : "Health outcomes require improvement",
  });

  // Medication (if applicable)
  if (input.medications.length > 0) {
    const medsMet = input.medications.every(m => m.administeredCorrectly && m.consentInPlace && !m.reviewDue);
    flags.push({
      regulation: "CHR 2015 Reg 23",
      area: "Medication",
      status: medsMet ? "met"
        : input.medications.every(m => m.consentInPlace) ? "partially_met"
        : "not_met",
      detail: medsMet
        ? "Medication managed safely with appropriate consent"
        : "Medication management needs attention",
    });
  }

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: HealthInput,
  status: string,
  immunisationRate: number,
  attendanceRate: number,
): string[] {
  const recs: string[] = [];

  if (status === "overdue") {
    recs.push("URGENT: Arrange health assessment — statutory requirement overdue");
  }

  if (!input.gpRegistered) {
    recs.push("URGENT: Register with GP immediately");
  }

  if (!input.dentistRegistered) {
    recs.push("Register with dental practice");
  }

  if (!input.dentalCheckLast6Months) {
    recs.push("Book dental check — 6-monthly requirement");
  }

  if (!input.opticalCheckLast12Months) {
    recs.push("Book eye test — annual requirement");
  }

  if (immunisationRate < 1) {
    recs.push("Arrange catch-up immunisations with GP");
  }

  if (input.appointments.length > 0 && attendanceRate < 0.7) {
    recs.push("Explore barriers to health appointment attendance");
  }

  const reviewDue = input.medications.filter(m => m.reviewDue);
  if (reviewDue.length > 0) {
    recs.push(`Arrange medication review for ${reviewDue.length} medication(s)`);
  }

  if (input.medications.some(m => !m.consentInPlace)) {
    recs.push("Obtain medication consent — required for all prescribed medications");
  }

  if (input.substanceMisuseIdentified && !input.substanceMisuseSupport) {
    recs.push("Arrange substance misuse support — specialist referral needed");
  }

  if (!input.healthActionPlanInPlace) {
    recs.push("Create health action plan from latest health assessment");
  } else if (!input.healthActionPlanReviewed) {
    recs.push("Review and update health action plan");
  }

  if (!input.healthPassportUpToDate) {
    recs.push("Update health passport — ensures continuity if placement changes");
  }

  if (!input.staffHealthTrained) {
    recs.push("Ensure staff have health promotion training");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  status: string,
  immunisationRate: number,
): string {
  const assessDesc = status === "current" ? "assessment current"
    : status === "overdue" ? "assessment OVERDUE"
    : "assessment due soon";
  const immunDesc = immunisationRate >= 1 ? "immunisations up to date" : "immunisations incomplete";
  return `${childName}: Health rated ${rating.replace(/_/g, " ")}. ${assessDesc}, ${immunDesc}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
