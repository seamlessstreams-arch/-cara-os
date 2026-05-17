// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Health & Wellbeing — Intelligence Engine
//
// Deterministic engine for tracking health assessments, medication management,
// appointments, immunisations, and dental/optical checks.
//
// Aligned to:
//   - CHR 2015 Reg 10 — The health and wellbeing standard
//   - Promoting Health of Looked After Children (DfE/DoH 2015)
//   - IHA within 20 working days of becoming LAC
//   - RHA annually (6-monthly for under-5s)
//   - SDQ (Strengths & Difficulties Questionnaire) annually
//
// Health requirements for looked-after children:
//   1. Initial Health Assessment (IHA) within 20 working days
//   2. Review Health Assessment (RHA) annually (6-monthly <5 years)
//   3. Dental check every 6 months
//   4. Optical check annually
//   5. Immunisations up to date
//   6. SDQ completed annually
//   7. Medication recorded and administered safely
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type HealthAssessmentType = "iha" | "rha" | "dental" | "optical" | "sdq" | "immunisation_review";

export type MedicationType = "regular" | "prn" | "short_course" | "depot" | "controlled";

export type AppointmentStatus = "scheduled" | "attended" | "dna" | "cancelled" | "rescheduled";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildHealthRecord {
  childId: string;
  childName: string;
  homeId: string;
  dateOfBirth: string;
  gpName: string;
  gpSurgery: string;
  dentist: string;
  optician: string;

  // Assessments
  healthAssessments: HealthAssessment[];
  lacEntryDate: string;           // date became looked-after

  // Medication
  medications: MedicationRecord[];

  // Appointments
  appointments: AppointmentRecord[];

  // Immunisations
  immunisationsUpToDate: boolean;
  immunisationNotes?: string;

  // SDQ
  lastSDQDate?: string;
  lastSDQScore?: number;          // 0-40 total difficulties
  sdqBand?: "normal" | "borderline" | "abnormal";

  // Conditions
  knownConditions: string[];
  allergies: string[];
  dietaryRequirements: string[];
}

export interface HealthAssessment {
  type: HealthAssessmentType;
  date: string;
  assessedBy: string;
  outcome: string;
  actionPlan: string[];
  nextDueDate: string;
}

export interface MedicationRecord {
  id: string;
  name: string;
  type: MedicationType;
  dose: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  sideEffectsMonitored: boolean;
  consentObtained: boolean;
  lastReviewDate?: string;
  nextReviewDate?: string;
}

export interface AppointmentRecord {
  id: string;
  type: string;                   // "GP", "CAMHS", "Dentist", etc.
  date: string;
  provider: string;
  status: AppointmentStatus;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface HealthComplianceResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  ihaCompliant: boolean;
  rhaCompliant: boolean;
  dentalCompliant: boolean;
  opticalCompliant: boolean;
  sdqCompliant: boolean;
  immunisationsCompliant: boolean;
  medicationCompliant: boolean;
  dnaRate: number;                // % DNA of total appointments
  recommendations: string[];
}

export interface HomeHealthMetrics {
  homeId: string;
  childCount: number;
  overallComplianceRate: number;  // %
  ihaComplianceRate: number;
  rhaComplianceRate: number;
  dentalComplianceRate: number;
  opticalComplianceRate: number;
  sdqComplianceRate: number;
  immunisationRate: number;       // %
  averageDNARate: number;
  totalActiveMedications: number;
  medicationsOverdueReview: number;
  upcomingAppointments: { childId: string; childName: string; type: string; date: string }[];
  concerns: { childId: string; childName: string; concern: string }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const IHA_DEADLINE_WORKING_DAYS = 20;
const RHA_INTERVAL_MONTHS = 12;        // annual for 5+
const RHA_INTERVAL_MONTHS_UNDER5 = 6;  // 6-monthly for under-5s
const DENTAL_INTERVAL_MONTHS = 6;
const OPTICAL_INTERVAL_MONTHS = 12;
const SDQ_INTERVAL_MONTHS = 12;
const MEDICATION_REVIEW_MONTHS = 3;    // every 3 months minimum

// ── Core: Evaluate Health Compliance ─────────────────────────────────────

export function evaluateHealthCompliance(
  record: ChildHealthRecord,
  now?: string,
): HealthComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const issues: string[] = [];
  const recommendations: string[] = [];

  const ageYears = Math.floor(
    (currentDate.getTime() - new Date(record.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );

  // IHA (within 20 working days of becoming LAC)
  const iha = record.healthAssessments.find(a => a.type === "iha");
  const ihaCompliant = !!iha;
  if (!ihaCompliant) {
    const daysSinceLAC = Math.floor(
      (currentDate.getTime() - new Date(record.lacEntryDate).getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daysSinceLAC > IHA_DEADLINE_WORKING_DAYS * 1.5) { // approx working days
      issues.push("Initial Health Assessment (IHA) not completed — statutory deadline passed.");
      recommendations.push("URGENT: Arrange IHA with LAC nurse immediately.");
    }
  }

  // RHA (annual or 6-monthly for under-5s)
  const rhaInterval = ageYears < 5 ? RHA_INTERVAL_MONTHS_UNDER5 : RHA_INTERVAL_MONTHS;
  const rhaAssessments = record.healthAssessments.filter(a => a.type === "rha");
  const lastRHA = rhaAssessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const rhaDeadline = new Date(currentDate.getTime() - rhaInterval * 30 * 24 * 60 * 60 * 1000);
  const rhaCompliant = !!(lastRHA && new Date(lastRHA.date) >= rhaDeadline) || !!(iha && !lastRHA && new Date(iha.date) >= rhaDeadline);
  if (!rhaCompliant && ihaCompliant) {
    issues.push(`Review Health Assessment overdue (interval: ${rhaInterval} months).`);
    recommendations.push("Schedule RHA with LAC health team.");
  }

  // Dental (every 6 months)
  const dentalAssessments = record.healthAssessments.filter(a => a.type === "dental");
  const lastDental = dentalAssessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const dentalDeadline = new Date(currentDate.getTime() - DENTAL_INTERVAL_MONTHS * 30 * 24 * 60 * 60 * 1000);
  const dentalCompliant = !!(lastDental && new Date(lastDental.date) >= dentalDeadline);
  if (!dentalCompliant) {
    issues.push("Dental check overdue (6-monthly requirement).");
    recommendations.push("Book dental appointment.");
  }

  // Optical (annual)
  const opticalAssessments = record.healthAssessments.filter(a => a.type === "optical");
  const lastOptical = opticalAssessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const opticalDeadline = new Date(currentDate.getTime() - OPTICAL_INTERVAL_MONTHS * 30 * 24 * 60 * 60 * 1000);
  const opticalCompliant = !!(lastOptical && new Date(lastOptical.date) >= opticalDeadline);
  if (!opticalCompliant) {
    issues.push("Optical check overdue (annual requirement).");
    recommendations.push("Book eye test appointment.");
  }

  // SDQ (annual)
  const sdqCompliant = !!(record.lastSDQDate &&
    new Date(record.lastSDQDate) >= new Date(currentDate.getTime() - SDQ_INTERVAL_MONTHS * 30 * 24 * 60 * 60 * 1000));
  if (!sdqCompliant) {
    issues.push("SDQ not completed within last 12 months.");
    recommendations.push("Complete SDQ with carer and teacher.");
  }

  // SDQ score concern
  if (record.sdqBand === "abnormal" && record.lastSDQScore) {
    recommendations.push(`SDQ total score ${record.lastSDQScore} (abnormal range) — ensure CAMHS referral in place.`);
  }

  // Immunisations
  const immunisationsCompliant = record.immunisationsUpToDate;
  if (!immunisationsCompliant) {
    issues.push("Immunisations not up to date.");
    recommendations.push("Book immunisation catch-up with GP.");
  }

  // Medication compliance
  const activeMeds = record.medications.filter(m => m.active);
  const overdueReview = activeMeds.filter(m => {
    if (!m.nextReviewDate) return true;
    return new Date(m.nextReviewDate) < currentDate;
  });
  const medicationCompliant = overdueReview.length === 0 &&
    activeMeds.every(m => m.consentObtained && m.sideEffectsMonitored);
  if (!medicationCompliant) {
    if (overdueReview.length > 0) {
      issues.push(`${overdueReview.length} medication(s) overdue for review.`);
      recommendations.push("Schedule medication review with prescriber.");
    }
    const noConsent = activeMeds.filter(m => !m.consentObtained);
    if (noConsent.length > 0) {
      issues.push(`Consent not obtained for ${noConsent.length} medication(s).`);
    }
  }

  // DNA rate
  const allAppointments = record.appointments;
  const dnaCount = allAppointments.filter(a => a.status === "dna").length;
  const dnaRate = allAppointments.length > 0
    ? Math.round((dnaCount / allAppointments.length) * 100)
    : 0;
  if (dnaRate > 20) {
    recommendations.push(`High DNA rate (${dnaRate}%) — review barriers to appointment attendance.`);
  }

  const isCompliant = issues.length === 0;

  return {
    childId: record.childId,
    childName: record.childName,
    isCompliant,
    issues,
    ihaCompliant,
    rhaCompliant,
    dentalCompliant,
    opticalCompliant,
    sdqCompliant,
    immunisationsCompliant,
    medicationCompliant,
    dnaRate,
    recommendations,
  };
}

// ── Core: Home Health Metrics ────────────────────────────────────────────

export function calculateHomeHealthMetrics(
  records: ChildHealthRecord[],
  homeId: string,
  now?: string,
): HomeHealthMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const homeRecords = records.filter(r => r.homeId === homeId);

  const results = homeRecords.map(r => evaluateHealthCompliance(r, now));

  // Compliance rates
  const compliantCount = results.filter(r => r.isCompliant).length;
  const overallComplianceRate = homeRecords.length > 0
    ? Math.round((compliantCount / homeRecords.length) * 100)
    : 100;

  const ihaComplianceRate = homeRecords.length > 0
    ? Math.round((results.filter(r => r.ihaCompliant).length / homeRecords.length) * 100)
    : 100;
  const rhaComplianceRate = homeRecords.length > 0
    ? Math.round((results.filter(r => r.rhaCompliant).length / homeRecords.length) * 100)
    : 100;
  const dentalComplianceRate = homeRecords.length > 0
    ? Math.round((results.filter(r => r.dentalCompliant).length / homeRecords.length) * 100)
    : 100;
  const opticalComplianceRate = homeRecords.length > 0
    ? Math.round((results.filter(r => r.opticalCompliant).length / homeRecords.length) * 100)
    : 100;
  const sdqComplianceRate = homeRecords.length > 0
    ? Math.round((results.filter(r => r.sdqCompliant).length / homeRecords.length) * 100)
    : 100;
  const immunisationRate = homeRecords.length > 0
    ? Math.round((results.filter(r => r.immunisationsCompliant).length / homeRecords.length) * 100)
    : 100;

  // DNA rate
  const averageDNARate = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.dnaRate, 0) / results.length)
    : 0;

  // Medications
  const totalActiveMedications = homeRecords.reduce(
    (s, r) => s + r.medications.filter(m => m.active).length, 0,
  );
  const medicationsOverdueReview = homeRecords.reduce((s, r) => {
    return s + r.medications.filter(m =>
      m.active && m.nextReviewDate && new Date(m.nextReviewDate) < currentDate,
    ).length;
  }, 0);

  // Upcoming appointments (next 14 days)
  const fourteenDays = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingAppointments = homeRecords.flatMap(r =>
    r.appointments
      .filter(a => a.status === "scheduled" && new Date(a.date) >= currentDate && new Date(a.date) <= fourteenDays)
      .map(a => ({ childId: r.childId, childName: r.childName, type: a.type, date: a.date })),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Concerns
  const concerns: { childId: string; childName: string; concern: string }[] = [];
  for (const result of results) {
    for (const issue of result.issues) {
      concerns.push({ childId: result.childId, childName: result.childName, concern: issue });
    }
  }

  return {
    homeId,
    childCount: homeRecords.length,
    overallComplianceRate,
    ihaComplianceRate,
    rhaComplianceRate,
    dentalComplianceRate,
    opticalComplianceRate,
    sdqComplianceRate,
    immunisationRate,
    averageDNARate,
    totalActiveMedications,
    medicationsOverdueReview,
    upcomingAppointments,
    concerns,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getAssessmentTypeLabel(type: HealthAssessmentType): string {
  const labels: Record<HealthAssessmentType, string> = {
    iha: "Initial Health Assessment",
    rha: "Review Health Assessment",
    dental: "Dental Check",
    optical: "Optical Check",
    sdq: "Strengths & Difficulties Questionnaire",
    immunisation_review: "Immunisation Review",
  };
  return labels[type];
}

export function getSDQBandLabel(band: "normal" | "borderline" | "abnormal"): string {
  const labels = {
    normal: "Normal (0-13)",
    borderline: "Borderline (14-16)",
    abnormal: "Abnormal (17-40)",
  };
  return labels[band];
}
