// ==============================================================================
// DENTAL HEALTH MONITORING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating dental health provision for
// looked-after children in residential care. Covers appointment attendance,
// oral hygiene support, treatment compliance, and staff awareness.
//
// Regulatory basis:
//   - CHR 2015, Reg 10 — Health and wellbeing
//   - SCCIF — How well children are helped and protected
//   - UNCRC Article 24 — Right to the highest standard of health
//   - NMS 3 — Health and wellbeing
//   - Statutory Guidance on Promoting the Health of Looked After Children
//   - Children Act 1989 — Welfare of the child
//
// No AI. No external calls. Pure input → output.
// ==============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export type AppointmentType =
  | "routine_checkup"
  | "treatment"
  | "emergency"
  | "orthodontic"
  | "hygienist"
  | "specialist_referral";

export type AppointmentOutcome =
  | "attended"
  | "cancelled_rearranged"
  | "did_not_attend"
  | "refused"
  | "pending";

export type OralHygieneRating =
  | "excellent"
  | "good"
  | "fair"
  | "poor";

export type TreatmentStatus =
  | "completed"
  | "in_progress"
  | "awaiting"
  | "declined"
  | "not_needed";

export type BrushingFrequency =
  | "twice_daily"
  | "once_daily"
  | "irregular"
  | "refuses";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface DentalAppointment {
  id: string;
  childId: string;
  childName: string;
  appointmentDate: string;
  appointmentType: AppointmentType;
  dentistName: string;
  outcome: AppointmentOutcome;
  treatmentNeeded: boolean;
  treatmentStatus: TreatmentStatus;
  nextAppointmentBooked: boolean;
  consentObtained: boolean;
}

export interface OralHygieneRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  brushingFrequency: BrushingFrequency;
  mouthwashUsed: boolean;
  dietaryAdviceGiven: boolean;
  overallRating: OralHygieneRating;
}

export interface DentalTreatmentPlan {
  id: string;
  childId: string;
  childName: string;
  treatmentDescription: string;
  startDate: string;
  expectedCompletionDate: string;
  status: TreatmentStatus;
  appointmentsRequired: number;
  appointmentsCompleted: number;
  parentConsent: boolean;
  socialWorkerNotified: boolean;
}

export interface StaffDentalTraining {
  id: string;
  staffId: string;
  staffName: string;
  dentalHealthAwareness: boolean;
  oralHygieneSupport: boolean;
  appointmentManagement: boolean;
  consentProcessTrained: boolean;
  emergencyDentalKnowledge: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AppointmentComplianceResult {
  overallScore: number;
  totalAppointments: number;
  attendanceRate: number;
  nextAppointmentBookedRate: number;
  consentRate: number;
  routineCount: number;
  emergencyCount: number;
  routineToEmergencyRatio: string;
}

export interface OralHygieneSupportResult {
  overallScore: number;
  totalRecords: number;
  excellentGoodRate: number;
  twiceDailyBrushingRate: number;
  dietaryAdviceRate: number;
  mouthwashUsageRate: number;
}

export interface TreatmentComplianceResult {
  overallScore: number;
  totalPlans: number;
  completionRate: number;
  parentConsentRate: number;
  socialWorkerNotifiedRate: number;
  activeTreatmentProgressRate: number;
}

export interface StaffDentalReadinessResult {
  overallScore: number;
  totalStaff: number;
  dentalHealthAwarenessRate: number;
  oralHygieneSupportRate: number;
  appointmentManagementRate: number;
  consentProcessTrainedRate: number;
  emergencyDentalKnowledgeRate: number;
}

export interface ChildDentalSummary {
  childId: string;
  childName: string;
  appointmentCount: number;
  attendanceRate: number;
  latestHygieneRating: OralHygieneRating | null;
  activeTreatments: number;
  overallScore: number;
}

export interface DentalHealthMonitoringIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  appointmentCompliance: AppointmentComplianceResult;
  oralHygieneSupport: OralHygieneSupportResult;
  treatmentCompliance: TreatmentComplianceResult;
  staffDentalReadiness: StaffDentalReadinessResult;
  childDentalSummaries: ChildDentalSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ────────────────────────────────────────────────────────

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  routine_checkup: "Routine Checkup",
  treatment: "Treatment",
  emergency: "Emergency",
  orthodontic: "Orthodontic",
  hygienist: "Hygienist",
  specialist_referral: "Specialist Referral",
};

const APPOINTMENT_OUTCOME_LABELS: Record<AppointmentOutcome, string> = {
  attended: "Attended",
  cancelled_rearranged: "Cancelled / Rearranged",
  did_not_attend: "Did Not Attend",
  refused: "Refused",
  pending: "Pending",
};

const ORAL_HYGIENE_RATING_LABELS: Record<OralHygieneRating, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  awaiting: "Awaiting",
  declined: "Declined",
  not_needed: "Not Needed",
};

const BRUSHING_FREQUENCY_LABELS: Record<BrushingFrequency, string> = {
  twice_daily: "Twice Daily",
  once_daily: "Once Daily",
  irregular: "Irregular",
  refuses: "Refuses",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getAppointmentTypeLabel(v: AppointmentType): string { return APPOINTMENT_TYPE_LABELS[v]; }
export function getAppointmentOutcomeLabel(v: AppointmentOutcome): string { return APPOINTMENT_OUTCOME_LABELS[v]; }
export function getOralHygieneRatingLabel(v: OralHygieneRating): string { return ORAL_HYGIENE_RATING_LABELS[v]; }
export function getTreatmentStatusLabel(v: TreatmentStatus): string { return TREATMENT_STATUS_LABELS[v]; }
export function getBrushingFrequencyLabel(v: BrushingFrequency): string { return BRUSHING_FREQUENCY_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Evaluators ─────────────────────────────────────────────────────────────

/**
 * Evaluates appointment compliance.
 * Empty appointments = 0 (no records = non-compliant).
 */
export function evaluateAppointmentCompliance(
  appointments: DentalAppointment[],
): AppointmentComplianceResult {
  if (appointments.length === 0) {
    return {
      overallScore: 0,
      totalAppointments: 0,
      attendanceRate: 0,
      nextAppointmentBookedRate: 0,
      consentRate: 0,
      routineCount: 0,
      emergencyCount: 0,
      routineToEmergencyRatio: "0:0",
    };
  }

  let attended = 0;
  let nextBooked = 0;
  let consentObtained = 0;
  let routineCount = 0;
  let emergencyCount = 0;

  for (const a of appointments) {
    if (a.outcome === "attended") attended++;
    if (a.nextAppointmentBooked) nextBooked++;
    if (a.consentObtained) consentObtained++;
    if (a.appointmentType === "routine_checkup") routineCount++;
    if (a.appointmentType === "emergency") emergencyCount++;
  }

  const attendanceRate = pct(attended, appointments.length);
  const nextAppointmentBookedRate = pct(nextBooked, appointments.length);
  const consentRate = pct(consentObtained, appointments.length);

  // Ratio formatting
  const routineToEmergencyRatio = `${routineCount}:${emergencyCount}`;

  // Scoring: attendance (0-8), next booked (0-7), consent (0-5),
  // routine vs emergency balance (0-5) — higher routine ratio is better
  let score = 0;
  score += Math.round((attendanceRate / 100) * 8);
  score += Math.round((nextAppointmentBookedRate / 100) * 7);
  score += Math.round((consentRate / 100) * 5);

  // Routine to emergency ratio scoring
  const totalRoutineEmergency = routineCount + emergencyCount;
  if (totalRoutineEmergency > 0) {
    const routineRatio = pct(routineCount, totalRoutineEmergency);
    score += Math.round((routineRatio / 100) * 5);
  } else {
    // All appointments are other types (treatment, orthodontic, etc.)
    // Give partial credit
    score += 3;
  }

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAppointments: appointments.length,
    attendanceRate,
    nextAppointmentBookedRate,
    consentRate,
    routineCount,
    emergencyCount,
    routineToEmergencyRatio,
  };
}

/**
 * Evaluates oral hygiene support.
 * Empty records = 0 (no records = non-compliant).
 */
export function evaluateOralHygieneSupport(
  records: OralHygieneRecord[],
): OralHygieneSupportResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      excellentGoodRate: 0,
      twiceDailyBrushingRate: 0,
      dietaryAdviceRate: 0,
      mouthwashUsageRate: 0,
    };
  }

  let excellentGood = 0;
  let twiceDaily = 0;
  let dietaryAdvice = 0;
  let mouthwash = 0;

  for (const r of records) {
    if (r.overallRating === "excellent" || r.overallRating === "good") excellentGood++;
    if (r.brushingFrequency === "twice_daily") twiceDaily++;
    if (r.dietaryAdviceGiven) dietaryAdvice++;
    if (r.mouthwashUsed) mouthwash++;
  }

  const excellentGoodRate = pct(excellentGood, records.length);
  const twiceDailyBrushingRate = pct(twiceDaily, records.length);
  const dietaryAdviceRate = pct(dietaryAdvice, records.length);
  const mouthwashUsageRate = pct(mouthwash, records.length);

  // Scoring: excellent/good rate (0-8), twice daily brushing (0-7),
  // dietary advice (0-5), mouthwash (0-5)
  let score = 0;
  score += Math.round((excellentGoodRate / 100) * 8);
  score += Math.round((twiceDailyBrushingRate / 100) * 7);
  score += Math.round((dietaryAdviceRate / 100) * 5);
  score += Math.round((mouthwashUsageRate / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    excellentGoodRate,
    twiceDailyBrushingRate,
    dietaryAdviceRate,
    mouthwashUsageRate,
  };
}

/**
 * Evaluates treatment compliance.
 * Empty plans = 0 (no records = non-compliant).
 */
export function evaluateTreatmentCompliance(
  plans: DentalTreatmentPlan[],
): TreatmentComplianceResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      completionRate: 0,
      parentConsentRate: 0,
      socialWorkerNotifiedRate: 0,
      activeTreatmentProgressRate: 0,
    };
  }

  // Completion rate: total completed appointments vs total required across all plans
  let totalRequired = 0;
  let totalCompleted = 0;
  let parentConsent = 0;
  let swNotified = 0;

  // Active treatment progress: for in_progress plans, measure appointments completed vs required
  const activePlans = plans.filter((p) => p.status === "in_progress");
  let activeProgressSum = 0;

  for (const p of plans) {
    totalRequired += p.appointmentsRequired;
    totalCompleted += p.appointmentsCompleted;
    if (p.parentConsent) parentConsent++;
    if (p.socialWorkerNotified) swNotified++;
  }

  for (const p of activePlans) {
    if (p.appointmentsRequired > 0) {
      activeProgressSum += pct(p.appointmentsCompleted, p.appointmentsRequired);
    }
  }

  const completionRate = pct(totalCompleted, totalRequired);
  const parentConsentRate = pct(parentConsent, plans.length);
  const socialWorkerNotifiedRate = pct(swNotified, plans.length);
  const activeTreatmentProgressRate = activePlans.length > 0
    ? Math.round(activeProgressSum / activePlans.length)
    : 0;

  // Scoring: completion (0-8), parent consent (0-7), SW notified (0-5),
  // active progress (0-5)
  let score = 0;
  score += Math.round((completionRate / 100) * 8);
  score += Math.round((parentConsentRate / 100) * 7);
  score += Math.round((socialWorkerNotifiedRate / 100) * 5);
  score += Math.round((activeTreatmentProgressRate / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalPlans: plans.length,
    completionRate,
    parentConsentRate,
    socialWorkerNotifiedRate,
    activeTreatmentProgressRate,
  };
}

/**
 * Evaluates staff dental readiness.
 * Empty training = 0 (no trained staff = non-compliant).
 */
export function evaluateStaffDentalReadiness(
  training: StaffDentalTraining[],
): StaffDentalReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      dentalHealthAwarenessRate: 0,
      oralHygieneSupportRate: 0,
      appointmentManagementRate: 0,
      consentProcessTrainedRate: 0,
      emergencyDentalKnowledgeRate: 0,
    };
  }

  let awareness = 0;
  let hygieneSupport = 0;
  let appointmentMgmt = 0;
  let consentProcess = 0;
  let emergencyKnowledge = 0;

  for (const t of training) {
    if (t.dentalHealthAwareness) awareness++;
    if (t.oralHygieneSupport) hygieneSupport++;
    if (t.appointmentManagement) appointmentMgmt++;
    if (t.consentProcessTrained) consentProcess++;
    if (t.emergencyDentalKnowledge) emergencyKnowledge++;
  }

  const dentalHealthAwarenessRate = pct(awareness, training.length);
  const oralHygieneSupportRate = pct(hygieneSupport, training.length);
  const appointmentManagementRate = pct(appointmentMgmt, training.length);
  const consentProcessTrainedRate = pct(consentProcess, training.length);
  const emergencyDentalKnowledgeRate = pct(emergencyKnowledge, training.length);

  // Scoring: awareness (0-6), hygiene support (0-6), appointment management (0-5),
  // consent process (0-4), emergency dental (0-4)
  let score = 0;
  score += Math.round((dentalHealthAwarenessRate / 100) * 6);
  score += Math.round((oralHygieneSupportRate / 100) * 6);
  score += Math.round((appointmentManagementRate / 100) * 5);
  score += Math.round((consentProcessTrainedRate / 100) * 4);
  score += Math.round((emergencyDentalKnowledgeRate / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    dentalHealthAwarenessRate,
    oralHygieneSupportRate,
    appointmentManagementRate,
    consentProcessTrainedRate,
    emergencyDentalKnowledgeRate,
  };
}

// ── Child Summaries ───────────────────────────────────────────────────────

export function buildChildDentalSummaries(
  appointments: DentalAppointment[],
  hygieneRecords: OralHygieneRecord[],
  treatmentPlans: DentalTreatmentPlan[],
): ChildDentalSummary[] {
  // Collect unique children from all sources
  const childMap = new Map<string, { childId: string; childName: string }>();
  for (const a of appointments) {
    if (!childMap.has(a.childId)) childMap.set(a.childId, { childId: a.childId, childName: a.childName });
  }
  for (const r of hygieneRecords) {
    if (!childMap.has(r.childId)) childMap.set(r.childId, { childId: r.childId, childName: r.childName });
  }
  for (const p of treatmentPlans) {
    if (!childMap.has(p.childId)) childMap.set(p.childId, { childId: p.childId, childName: p.childName });
  }

  return Array.from(childMap.values()).map((child) => {
    const childAppts = appointments.filter((a) => a.childId === child.childId);
    const childRecords = hygieneRecords.filter((r) => r.childId === child.childId);
    const childPlans = treatmentPlans.filter((p) => p.childId === child.childId);

    const attended = childAppts.filter((a) => a.outcome === "attended").length;
    const attendanceRate = pct(attended, childAppts.length);

    // Latest hygiene record by date
    const sortedRecords = [...childRecords].sort(
      (a, b) => b.recordDate.localeCompare(a.recordDate),
    );
    const latestHygieneRating = sortedRecords.length > 0 ? sortedRecords[0].overallRating : null;

    const activeTreatments = childPlans.filter(
      (p) => p.status === "in_progress" || p.status === "awaiting",
    ).length;

    // Score 0-10
    let score = 0;

    // Attendance (0-3)
    if (childAppts.length > 0) {
      if (attendanceRate === 100) score += 3;
      else if (attendanceRate >= 75) score += 2;
      else if (attendanceRate >= 50) score += 1;
    }

    // Hygiene rating (0-3)
    if (latestHygieneRating === "excellent") score += 3;
    else if (latestHygieneRating === "good") score += 2;
    else if (latestHygieneRating === "fair") score += 1;

    // Next appointment booked (0-2)
    const latestAppt = [...childAppts].sort(
      (a, b) => b.appointmentDate.localeCompare(a.appointmentDate),
    );
    if (latestAppt.length > 0 && latestAppt[0].nextAppointmentBooked) score += 2;

    // Treatment progress (0-2)
    const inProgressPlans = childPlans.filter((p) => p.status === "in_progress");
    if (inProgressPlans.length > 0) {
      const allOnTrack = inProgressPlans.every(
        (p) => p.appointmentsRequired > 0 && pct(p.appointmentsCompleted, p.appointmentsRequired) >= 25,
      );
      if (allOnTrack) score += 2;
      else score += 1;
    } else if (childPlans.length === 0 || childPlans.every((p) => p.status === "completed" || p.status === "not_needed")) {
      score += 2;
    }

    return {
      childId: child.childId,
      childName: child.childName,
      appointmentCount: childAppts.length,
      attendanceRate,
      latestHygieneRating,
      activeTreatments,
      overallScore: Math.min(10, score),
    };
  });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateDentalHealthMonitoringIntelligence(
  appointments: DentalAppointment[],
  hygieneRecords: OralHygieneRecord[],
  treatmentPlans: DentalTreatmentPlan[],
  staffTraining: StaffDentalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): DentalHealthMonitoringIntelligence {
  const appointmentCompliance = evaluateAppointmentCompliance(appointments);
  const oralHygieneSupport = evaluateOralHygieneSupport(hygieneRecords);
  const treatmentCompliance = evaluateTreatmentCompliance(treatmentPlans);
  const staffDentalReadiness = evaluateStaffDentalReadiness(staffTraining);

  const rawScore =
    appointmentCompliance.overallScore +
    oralHygieneSupport.overallScore +
    treatmentCompliance.overallScore +
    staffDentalReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childDentalSummaries = buildChildDentalSummaries(appointments, hygieneRecords, treatmentPlans);

  // ── Strengths ──
  const strengths: string[] = [];
  if (appointments.length > 0 && appointmentCompliance.attendanceRate === 100)
    strengths.push("100% dental appointment attendance across all children");
  if (appointments.length > 0 && appointmentCompliance.nextAppointmentBookedRate === 100)
    strengths.push("All children have their next dental appointment booked");
  if (appointments.length > 0 && appointmentCompliance.consentRate === 100)
    strengths.push("Consent obtained for all dental appointments");
  if (hygieneRecords.length > 0 && oralHygieneSupport.excellentGoodRate === 100)
    strengths.push("All oral hygiene assessments rated excellent or good");
  if (hygieneRecords.length > 0 && oralHygieneSupport.twiceDailyBrushingRate === 100)
    strengths.push("All children brushing twice daily as recommended");
  if (hygieneRecords.length > 0 && oralHygieneSupport.dietaryAdviceRate === 100)
    strengths.push("Dietary advice provided consistently across all hygiene records");
  if (treatmentPlans.length > 0 && treatmentCompliance.parentConsentRate === 100)
    strengths.push("Parent/carer consent obtained for all treatment plans");
  if (treatmentPlans.length > 0 && treatmentCompliance.socialWorkerNotifiedRate === 100)
    strengths.push("Social workers notified for all active treatment plans");
  if (staffTraining.length > 0 && staffDentalReadiness.dentalHealthAwarenessRate === 100)
    strengths.push("All staff have dental health awareness training");
  if (staffTraining.length > 0 && staffDentalReadiness.emergencyDentalKnowledgeRate === 100)
    strengths.push("All staff trained in emergency dental procedures");
  if (appointments.length > 0 && appointmentCompliance.emergencyCount === 0)
    strengths.push("No emergency dental appointments — effective preventive care");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (appointments.length === 0)
    areasForImprovement.push("URGENT: No dental appointment records — all children must have regular dental checkups");
  if (appointments.length > 0 && appointmentCompliance.attendanceRate < 100)
    areasForImprovement.push("Dental appointment attendance at " + appointmentCompliance.attendanceRate + "% — should be 100%");
  if (appointments.length > 0 && appointmentCompliance.nextAppointmentBookedRate < 100)
    areasForImprovement.push("Only " + appointmentCompliance.nextAppointmentBookedRate + "% of children have next appointment booked");
  if (appointments.length > 0 && appointmentCompliance.consentRate < 100)
    areasForImprovement.push("Consent obtained for only " + appointmentCompliance.consentRate + "% of appointments");
  if (hygieneRecords.length === 0)
    areasForImprovement.push("URGENT: No oral hygiene records — regular monitoring of children's dental hygiene is required");
  if (hygieneRecords.length > 0 && oralHygieneSupport.excellentGoodRate < 75)
    areasForImprovement.push("Only " + oralHygieneSupport.excellentGoodRate + "% of hygiene assessments rated excellent or good");
  if (hygieneRecords.length > 0 && oralHygieneSupport.twiceDailyBrushingRate < 100)
    areasForImprovement.push("Twice daily brushing rate at " + oralHygieneSupport.twiceDailyBrushingRate + "% — all children should brush twice daily");
  if (treatmentPlans.length > 0 && treatmentCompliance.parentConsentRate < 100)
    areasForImprovement.push("Parent consent missing for some treatment plans — " + treatmentCompliance.parentConsentRate + "% obtained");
  if (staffTraining.length === 0)
    areasForImprovement.push("URGENT: No staff dental training records — all staff require dental health awareness training");
  if (staffTraining.length > 0 && staffDentalReadiness.dentalHealthAwarenessRate < 100)
    areasForImprovement.push("Dental health awareness training at " + staffDentalReadiness.dentalHealthAwarenessRate + "% — all staff should be trained");
  if (staffTraining.length > 0 && staffDentalReadiness.oralHygieneSupportRate < 100)
    areasForImprovement.push("Oral hygiene support training at " + staffDentalReadiness.oralHygieneSupportRate + "% — all staff should be trained");

  // ── Actions ──
  const actions: string[] = [];

  // URGENT actions for empty data
  if (appointments.length === 0)
    actions.push("URGENT: Schedule dental checkups for all children immediately — statutory requirement under CHR 2015, Reg 10");
  if (hygieneRecords.length === 0)
    actions.push("URGENT: Implement daily oral hygiene monitoring and recording for all children");
  if (staffTraining.length === 0)
    actions.push("URGENT: Arrange dental health awareness training for all staff");

  // Attendance issues
  const dnaAppointments = appointments.filter((a) => a.outcome === "did_not_attend");
  if (dnaAppointments.length > 0)
    actions.push("URGENT: " + dnaAppointments.length + " missed dental appointment(s) — rebook immediately and investigate barriers to attendance");
  const refusedAppointments = appointments.filter((a) => a.outcome === "refused");
  if (refusedAppointments.length > 0)
    actions.push("Address " + refusedAppointments.length + " refused dental appointment(s) — explore child's concerns and provide support");

  // Consent
  if (appointments.length > 0 && appointmentCompliance.consentRate < 100)
    actions.push("Obtain consent for all outstanding dental appointments — " + (100 - appointmentCompliance.consentRate) + "% without consent");

  // Treatment
  if (treatmentPlans.length > 0 && treatmentCompliance.socialWorkerNotifiedRate < 100)
    actions.push("Notify social workers for all active treatment plans — " + (100 - treatmentCompliance.socialWorkerNotifiedRate) + "% not yet notified");
  const declinedPlans = treatmentPlans.filter((p) => p.status === "declined");
  if (declinedPlans.length > 0)
    actions.push("Review " + declinedPlans.length + " declined treatment plan(s) — ensure child's voice is heard and best interests considered");

  // Hygiene
  const poorHygiene = hygieneRecords.filter((r) => r.overallRating === "poor");
  if (poorHygiene.length > 0)
    actions.push("URGENT: " + poorHygiene.length + " poor oral hygiene assessment(s) — implement targeted support plans");
  if (hygieneRecords.length > 0 && oralHygieneSupport.dietaryAdviceRate < 80)
    actions.push("Increase dietary advice provision — currently at " + oralHygieneSupport.dietaryAdviceRate + "%, target 100%");

  // Staff
  if (staffTraining.length > 0 && staffDentalReadiness.emergencyDentalKnowledgeRate < 100)
    actions.push("Complete emergency dental knowledge training for all staff — " + (100 - staffDentalReadiness.emergencyDentalKnowledgeRate) + "% untrained");

  // Emergency appointments
  if (appointmentCompliance.emergencyCount > 0)
    actions.push("Review " + appointmentCompliance.emergencyCount + " emergency dental appointment(s) — assess whether preventive care could reduce emergency presentations");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 10 — Health and wellbeing: ensuring children's dental health needs are met",
    "SCCIF — How well children are helped and protected: dental health provision and monitoring",
    "UNCRC Article 24 — Right to the highest standard of health including dental care",
    "NMS 3 — Health and wellbeing: dental registration and regular appointments",
    "Statutory Guidance on Promoting the Health of Looked After Children — dental health assessments",
    "Children Act 1989 — Duty to safeguard and promote the welfare of the child including dental health",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    appointmentCompliance,
    oralHygieneSupport,
    treatmentCompliance,
    staffDentalReadiness,
    childDentalSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
