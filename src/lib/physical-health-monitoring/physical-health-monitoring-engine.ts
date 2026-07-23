// ══════════════════════════════════════════════════════════════════════════════
// Cara — Physical Health Monitoring Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Maps to: CHR 2015 Reg 10 (health and wellbeing), SCCIF experiences &
// progress (health outcomes), NICE guidelines, Promoting the Health of
// Looked After Children (DfE/DoH 2015), UNCRC Article 24 (right to health)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type HealthAppointmentType =
  | "gp_registration"
  | "gp_consultation"
  | "dental_check"
  | "optician"
  | "immunisation"
  | "initial_health_assessment"
  | "review_health_assessment"
  | "specialist_referral"
  | "hospital_outpatient"
  | "hospital_inpatient"
  | "sexual_health"
  | "substance_misuse"
  | "physiotherapy"
  | "other";

export type AppointmentStatus =
  | "attended"
  | "missed"
  | "cancelled_by_service"
  | "cancelled_by_home"
  | "rescheduled"
  | "child_refused"
  | "pending";

export type HealthNeedCategory =
  | "chronic_condition"
  | "acute_illness"
  | "developmental"
  | "sexual_health"
  | "substance_misuse"
  | "dental"
  | "vision"
  | "hearing"
  | "nutrition"
  | "allergy"
  | "mental_health_physical"
  | "other";

export type ConsentStatus =
  | "gillick_competent"
  | "parental_consent"
  | "social_worker_consent"
  | "consent_refused"
  | "not_applicable";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface HealthAppointment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  appointmentDate: string;
  appointmentType: HealthAppointmentType;
  provider: string;
  status: AppointmentStatus;
  accompaniedBy?: string;
  consentStatus: ConsentStatus;
  outcome?: string;
  followUpRequired: boolean;
  followUpBooked?: boolean;
  healthActionPlanUpdated: boolean;
}

export interface HealthAssessment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  assessmentType: "initial" | "review";
  assessmentDate: string;
  assessor: string;
  dueDate: string;
  completedOnTime: boolean;
  healthNeedsIdentified: string[];
  actionPlanCreated: boolean;
  childParticipated: boolean;
  sharedWithCarers: boolean;
  nextDueDate: string;
}

export interface HealthNeed {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  category: HealthNeedCategory;
  description: string;
  identifiedDate: string;
  managementPlan: boolean;
  managementPlanReviewDate?: string;
  currentlyManaged: boolean;
  medicationRequired: boolean;
  specialistInvolved: boolean;
  specialistName?: string;
  lastReviewDate?: string;
  status: "active" | "resolved" | "monitoring";
}

export interface HealthPromotion {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  date: string;
  topic: "healthy_eating" | "exercise" | "sleep_hygiene" | "sexual_health" | "substance_awareness" | "dental_hygiene" | "mental_health_awareness" | "personal_hygiene" | "first_aid";
  deliveredBy: string;
  format: "one_to_one" | "group" | "activity_based" | "resource_based";
  childEngagement: number; // 1-10
  followUpPlanned: boolean;
}

export interface ImmunisationRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  immunisationType: string;
  dueDate: string;
  administeredDate?: string;
  status: "up_to_date" | "overdue" | "declined" | "contraindicated" | "pending";
  consentObtained: boolean;
}

// ── Result Types ─────────────────────────────────────────────────────────────
// Every rate below is null when its population is empty: nothing recorded is
// "not yet measured", never full marks and never a failure.

export interface AppointmentResult {
  totalAppointments: number;
  attendanceRate: number | null;
  missedRate: number | null;
  childRefusedRate: number | null;
  followUpBookedRate: number | null;
  healthPlanUpdatedRate: number | null;
  typeBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  overallScore: number | null;
}

export interface AssessmentResult {
  totalAssessments: number;
  initialCompleted: number;
  reviewCompleted: number;
  completedOnTimeRate: number | null;
  actionPlanRate: number | null;
  childParticipationRate: number | null;
  sharedWithCarersRate: number | null;
  childrenWithCurrentAssessment: number;
  assessmentCoverageRate: number | null;
  overallScore: number | null;
}

export interface HealthNeedsResult {
  totalNeeds: number;
  activeNeeds: number;
  managementPlanRate: number | null;
  currentlyManagedRate: number | null;
  specialistInvolvedRate: number | null;
  categoryBreakdown: Record<string, number>;
  overallScore: number | null;
}

export interface HealthPromotionResult {
  totalActivities: number;
  childrenEngaged: number;
  averageEngagement: number | null;
  topicCoverage: number | null;
  topicBreakdown: Record<string, number>;
  overallScore: number | null;
}

export interface ImmunisationResult {
  totalRecords: number;
  upToDateRate: number | null;
  overdueCount: number;
  declinedCount: number;
  overallScore: number | null;
}

export interface ChildHealthProfile {
  childId: string;
  childName: string;
  gpRegistered: boolean;
  dentalCheckCurrent: boolean;
  opticiansCheckCurrent: boolean;
  healthAssessmentCurrent: boolean;
  immunisationsUpToDate: boolean;
  activeHealthNeeds: number;
  managedHealthNeeds: number;
  appointmentAttendance: number | null;
  healthPromotionEngagement: number | null;
  overallHealthScore: number | null;
  concerns: string[];
  positives: string[];
}

export interface PhysicalHealthMonitoringIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number | null;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate" | "unmeasured";
  appointments: AppointmentResult;
  assessments: AssessmentResult;
  healthNeeds: HealthNeedsResult;
  healthPromotion: HealthPromotionResult;
  immunisations: ImmunisationResult;
  childProfiles: ChildHealthProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

import { below, meets, weightedMeanOf } from "@/lib/metrics/rate";

// ── Constants ────────────────────────────────────────────────────────────────

const TOTAL_HEALTH_PROMOTION_TOPICS = 9;
const ASSESSMENT_CURRENCY_MONTHS = 12;

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateAppointments(
  appointments: HealthAppointment[],
): AppointmentResult {
  if (appointments.length === 0) {
    return {
      totalAppointments: 0, attendanceRate: null, missedRate: null, childRefusedRate: null,
      followUpBookedRate: null, healthPlanUpdatedRate: null, typeBreakdown: {},
      statusBreakdown: {}, overallScore: null,
    };
  }

  const total = appointments.length;
  const attended = appointments.filter(a => a.status === "attended").length;
  const missed = appointments.filter(a => a.status === "missed").length;
  const childRefused = appointments.filter(a => a.status === "child_refused").length;
  const attendanceRate = Math.round((attended / total) * 1000) / 10;
  const missedRate = Math.round((missed / total) * 1000) / 10;
  const childRefusedRate = Math.round((childRefused / total) * 1000) / 10;

  // Null rather than 100: no appointment needed a follow-up, so there is
  // nothing to have booked.
  const needingFollowUp = appointments.filter(a => a.followUpRequired);
  const followUpBookedRate = needingFollowUp.length > 0
    ? Math.round((needingFollowUp.filter(a => a.followUpBooked).length / needingFollowUp.length) * 1000) / 10
    : null;

  const attendedAppts = appointments.filter(a => a.status === "attended");
  const healthPlanUpdatedRate = attendedAppts.length > 0
    ? Math.round((attendedAppts.filter(a => a.healthActionPlanUpdated).length / attendedAppts.length) * 1000) / 10
    : null;

  const typeBreakdown: Record<string, number> = {};
  for (const a of appointments) {
    typeBreakdown[a.appointmentType] = (typeBreakdown[a.appointmentType] || 0) + 1;
  }

  const statusBreakdown: Record<string, number> = {};
  for (const a of appointments) {
    statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
  }

  // Scoring: attendance(40) + follow-up(30) + plan updated(30) = 100
  const overallScore = weightedMeanOf([
    { score: Math.min(attendanceRate, 100), weight: 40 },
    { score: followUpBookedRate === null ? null : Math.min(followUpBookedRate, 100), weight: 30 },
    { score: healthPlanUpdatedRate === null ? null : Math.min(healthPlanUpdatedRate, 100), weight: 30 },
  ]);

  return {
    totalAppointments: total, attendanceRate, missedRate, childRefusedRate,
    followUpBookedRate, healthPlanUpdatedRate, typeBreakdown, statusBreakdown,
    overallScore,
  };
}

export function evaluateAssessments(
  assessments: HealthAssessment[],
  childIds: string[],
  referenceDate: string,
): AssessmentResult {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0, initialCompleted: 0, reviewCompleted: 0,
      completedOnTimeRate: null, actionPlanRate: null, childParticipationRate: null,
      sharedWithCarersRate: null, childrenWithCurrentAssessment: 0,
      assessmentCoverageRate: null, overallScore: null,
    };
  }

  const refDate = new Date(referenceDate);
  const total = assessments.length;
  const initialCompleted = assessments.filter(a => a.assessmentType === "initial").length;
  const reviewCompleted = assessments.filter(a => a.assessmentType === "review").length;
  const completedOnTimeRate = Math.round((assessments.filter(a => a.completedOnTime).length / total) * 1000) / 10;
  const actionPlanRate = Math.round((assessments.filter(a => a.actionPlanCreated).length / total) * 1000) / 10;
  const childParticipationRate = Math.round((assessments.filter(a => a.childParticipated).length / total) * 1000) / 10;
  const sharedWithCarersRate = Math.round((assessments.filter(a => a.sharedWithCarers).length / total) * 1000) / 10;

  // Currency: latest assessment per child within 12 months
  const latestByChild = new Map<string, HealthAssessment>();
  for (const a of assessments) {
    const existing = latestByChild.get(a.childId);
    if (!existing || a.assessmentDate > existing.assessmentDate) {
      latestByChild.set(a.childId, a);
    }
  }

  let currentCount = 0;
  for (const [, a] of latestByChild) {
    const assessDate = new Date(a.assessmentDate);
    const monthsDiff = (refDate.getFullYear() - assessDate.getFullYear()) * 12 +
      (refDate.getMonth() - assessDate.getMonth());
    if (monthsDiff <= ASSESSMENT_CURRENCY_MONTHS) currentCount++;
  }

  const childrenWithCurrentAssessment = currentCount;
  const assessmentCoverageRate = childIds.length > 0
    ? Math.round((childrenWithCurrentAssessment / childIds.length) * 1000) / 10
    : null;

  // Scoring: coverage(30) + timeliness(25) + action plan(20) + child participation(15) + shared(10)
  const overallScore = weightedMeanOf([
    { score: assessmentCoverageRate === null ? null : Math.min(assessmentCoverageRate, 100), weight: 30 },
    { score: Math.min(completedOnTimeRate, 100), weight: 25 },
    { score: Math.min(actionPlanRate, 100), weight: 20 },
    { score: Math.min(childParticipationRate, 100), weight: 15 },
    { score: Math.min(sharedWithCarersRate, 100), weight: 10 },
  ]);

  return {
    totalAssessments: total, initialCompleted, reviewCompleted,
    completedOnTimeRate, actionPlanRate, childParticipationRate,
    sharedWithCarersRate, childrenWithCurrentAssessment,
    assessmentCoverageRate, overallScore,
  };
}

export function evaluateHealthNeeds(
  needs: HealthNeed[],
): HealthNeedsResult {
  if (needs.length === 0) {
    return {
      totalNeeds: 0, activeNeeds: 0, managementPlanRate: null,
      currentlyManagedRate: null, specialistInvolvedRate: null,
      categoryBreakdown: {}, overallScore: null,
    };
  }

  const total = needs.length;
  const active = needs.filter(n => n.status === "active");
  const activeNeeds = active.length;
  // Null rather than 100: no need is currently active, so there is nothing to
  // have a plan for.
  const managementPlanRate = activeNeeds > 0
    ? Math.round((active.filter(n => n.managementPlan).length / activeNeeds) * 1000) / 10
    : null;
  const currentlyManagedRate = activeNeeds > 0
    ? Math.round((active.filter(n => n.currentlyManaged).length / activeNeeds) * 1000) / 10
    : null;
  const needingSpecialist = needs.filter(n => n.specialistInvolved);
  const specialistInvolvedRate = total > 0
    ? Math.round((needingSpecialist.length / total) * 1000) / 10
    : null;

  const categoryBreakdown: Record<string, number> = {};
  for (const n of needs) {
    categoryBreakdown[n.category] = (categoryBreakdown[n.category] || 0) + 1;
  }

  // Scoring: management plan(40) + currently managed(40) + specialist access(20) = 100
  const overallScore = weightedMeanOf([
    { score: managementPlanRate === null ? null : Math.min(managementPlanRate, 100), weight: 40 },
    { score: currentlyManagedRate === null ? null : Math.min(currentlyManagedRate, 100), weight: 40 },
    // reward having specialists involved
    { score: specialistInvolvedRate === null ? null : Math.min(specialistInvolvedRate * 2, 100), weight: 20 },
  ]);

  return {
    totalNeeds: total, activeNeeds, managementPlanRate,
    currentlyManagedRate, specialistInvolvedRate,
    categoryBreakdown, overallScore,
  };
}

export function evaluateHealthPromotion(
  activities: HealthPromotion[],
  childIds: string[],
): HealthPromotionResult {
  if (activities.length === 0) {
    return {
      totalActivities: 0, childrenEngaged: 0, averageEngagement: null,
      topicCoverage: null, topicBreakdown: {}, overallScore: null,
    };
  }

  const total = activities.length;
  const childrenEngaged = new Set(activities.map(a => a.childId)).size;
  const averageEngagement = Math.round((activities.reduce((s, a) => s + a.childEngagement, 0) / total) * 10) / 10;

  const uniqueTopics = new Set(activities.map(a => a.topic)).size;
  const topicCoverage = Math.round((uniqueTopics / TOTAL_HEALTH_PROMOTION_TOPICS) * 1000) / 10;

  const topicBreakdown: Record<string, number> = {};
  for (const a of activities) {
    topicBreakdown[a.topic] = (topicBreakdown[a.topic] || 0) + 1;
  }

  // Scoring: coverage of children(30) + engagement(30) + topic diversity(40) = 100
  const childCoverage = childIds.length > 0
    ? Math.min((childrenEngaged / childIds.length) * 100, 100)
    : null;
  const overallScore = weightedMeanOf([
    { score: childCoverage, weight: 30 },
    { score: averageEngagement * 10, weight: 30 },
    { score: Math.min(topicCoverage, 100), weight: 40 },
  ]);

  return {
    totalActivities: total, childrenEngaged, averageEngagement,
    topicCoverage, topicBreakdown, overallScore,
  };
}

export function evaluateImmunisations(
  records: ImmunisationRecord[],
  childIds: string[],
): ImmunisationResult {
  if (records.length === 0) {
    return {
      totalRecords: 0, upToDateRate: null, overdueCount: 0,
      declinedCount: 0, overallScore: null,
    };
  }

  const total = records.length;
  const upToDate = records.filter(r => r.status === "up_to_date").length;
  const upToDateRate = Math.round((upToDate / total) * 1000) / 10;
  const overdueCount = records.filter(r => r.status === "overdue").length;
  const declinedCount = records.filter(r => r.status === "declined").length;

  // Score: up to date rate
  const overallScore = Math.round(Math.min(upToDateRate, 100));

  return {
    totalRecords: total, upToDateRate, overdueCount,
    declinedCount, overallScore,
  };
}

export function buildChildHealthProfiles(
  appointments: HealthAppointment[],
  assessments: HealthAssessment[],
  needs: HealthNeed[],
  promotion: HealthPromotion[],
  immunisations: ImmunisationRecord[],
  childIds: string[],
  referenceDate: string,
): ChildHealthProfile[] {
  const refDate = new Date(referenceDate);

  return childIds.map(childId => {
    const childAppts = appointments.filter(a => a.childId === childId);
    const childAssessments = assessments.filter(a => a.childId === childId);
    const childNeeds = needs.filter(n => n.childId === childId);
    const childPromotion = promotion.filter(p => p.childId === childId);
    const childImmunisations = immunisations.filter(i => i.childId === childId);

    // GP registered: has a gp_registration or gp_consultation appointment
    const gpRegistered = childAppts.some(a =>
      a.appointmentType === "gp_registration" || a.appointmentType === "gp_consultation",
    );

    // Dental check current: attended dental in last 6 months
    const dentalAppts = childAppts.filter(a =>
      a.appointmentType === "dental_check" && a.status === "attended",
    );
    const latestDental = dentalAppts.sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))[0];
    const dentalCheckCurrent = latestDental
      ? ((refDate.getFullYear() - new Date(latestDental.appointmentDate).getFullYear()) * 12 +
         (refDate.getMonth() - new Date(latestDental.appointmentDate).getMonth())) <= 6
      : false;

    // Optician check current: attended in last 12 months
    const opticianAppts = childAppts.filter(a =>
      a.appointmentType === "optician" && a.status === "attended",
    );
    const latestOptician = opticianAppts.sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))[0];
    const opticiansCheckCurrent = latestOptician
      ? ((refDate.getFullYear() - new Date(latestOptician.appointmentDate).getFullYear()) * 12 +
         (refDate.getMonth() - new Date(latestOptician.appointmentDate).getMonth())) <= 12
      : false;

    // Health assessment current
    const latestAssessment = childAssessments.sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0];
    const healthAssessmentCurrent = latestAssessment
      ? ((refDate.getFullYear() - new Date(latestAssessment.assessmentDate).getFullYear()) * 12 +
         (refDate.getMonth() - new Date(latestAssessment.assessmentDate).getMonth())) <= ASSESSMENT_CURRENCY_MONTHS
      : false;

    // Immunisations
    const immunisationsUpToDate = childImmunisations.length > 0
      ? childImmunisations.every(i => i.status === "up_to_date" || i.status === "contraindicated")
      : false;

    // Health needs
    const activeHealthNeeds = childNeeds.filter(n => n.status === "active").length;
    const managedHealthNeeds = childNeeds.filter(n => n.status === "active" && n.currentlyManaged).length;

    // Appointment attendance
    const attendedCount = childAppts.filter(a => a.status === "attended").length;
    const appointmentAttendance = childAppts.length > 0
      ? Math.round((attendedCount / childAppts.length) * 1000) / 10
      : null;

    // Health promotion engagement
    const healthPromotionEngagement = childPromotion.length > 0
      ? Math.round((childPromotion.reduce((s, p) => s + p.childEngagement, 0) / childPromotion.length) * 10) / 10
      : null;

    // Overall health score
    const scores: number[] = [];
    if (gpRegistered) scores.push(10); else scores.push(0);
    if (dentalCheckCurrent) scores.push(10); else scores.push(0);
    if (opticiansCheckCurrent) scores.push(10); else scores.push(0);
    if (healthAssessmentCurrent) scores.push(10); else scores.push(0);
    if (immunisationsUpToDate) scores.push(10); else scores.push(0);
    if (appointmentAttendance !== null) scores.push(appointmentAttendance / 10); // 0-10
    if (healthPromotionEngagement !== null) scores.push(healthPromotionEngagement); // 0-10
    if (activeHealthNeeds > 0) {
      scores.push(managedHealthNeeds === activeHealthNeeds ? 10 : (managedHealthNeeds / activeHealthNeeds) * 10);
    }
    const overallHealthScore = scores.length > 0
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      : null;

    // Concerns and positives
    const concerns: string[] = [];
    const positives: string[] = [];

    if (!gpRegistered) concerns.push("Not registered with GP");
    if (!dentalCheckCurrent) concerns.push("Dental check not current");
    if (!opticiansCheckCurrent) concerns.push("Optician check not current");
    if (!healthAssessmentCurrent) concerns.push("Health assessment not current");
    if (!immunisationsUpToDate && childImmunisations.length > 0) concerns.push("Immunisations not up to date");
    if (below(appointmentAttendance, 70)) concerns.push("Low appointment attendance rate");
    if (activeHealthNeeds > managedHealthNeeds) concerns.push("Unmanaged health needs present");

    if (gpRegistered) positives.push("Registered with GP");
    if (dentalCheckCurrent) positives.push("Dental check current");
    if (healthAssessmentCurrent) positives.push("Health assessment current");
    if (immunisationsUpToDate) positives.push("Immunisations up to date");
    if (meets(appointmentAttendance, 90)) positives.push("Excellent appointment attendance");
    if (activeHealthNeeds > 0 && managedHealthNeeds === activeHealthNeeds) positives.push("All health needs actively managed");

    const childName = childAppts[0]?.childName
      || childAssessments[0]?.childName
      || childNeeds[0]?.childName
      || childPromotion[0]?.childName
      || childImmunisations[0]?.childName
      || childId;

    return {
      childId, childName, gpRegistered, dentalCheckCurrent,
      opticiansCheckCurrent, healthAssessmentCurrent, immunisationsUpToDate,
      activeHealthNeeds, managedHealthNeeds, appointmentAttendance,
      healthPromotionEngagement, overallHealthScore, concerns, positives,
    };
  });
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generatePhysicalHealthIntelligence(
  appointments: HealthAppointment[],
  assessments: HealthAssessment[],
  healthNeeds: HealthNeed[],
  healthPromotion: HealthPromotion[],
  immunisations: ImmunisationRecord[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PhysicalHealthMonitoringIntelligence {
  const apptResult = evaluateAppointments(appointments);
  const assessResult = evaluateAssessments(assessments, childIds, referenceDate);
  const needsResult = evaluateHealthNeeds(healthNeeds);
  const promoResult = evaluateHealthPromotion(healthPromotion, childIds);
  const immunResult = evaluateImmunisations(immunisations, childIds);
  const childProfiles = buildChildHealthProfiles(
    appointments, assessments, healthNeeds, healthPromotion, immunisations,
    childIds, referenceDate,
  );

  // Weighted scoring: appointments(20) + assessments(25) + needs(20) + promotion(15) + immunisations(20)
  const overallScore = weightedMeanOf([
    { score: apptResult.overallScore, weight: 20 },
    { score: assessResult.overallScore, weight: 25 },
    { score: needsResult.overallScore, weight: 20 },
    { score: promoResult.overallScore, weight: 15 },
    { score: immunResult.overallScore, weight: 20 },
  ]);

  const rating = overallScore === null ? "unmeasured" as const
    : overallScore >= 80 ? "outstanding" as const
    : overallScore >= 60 ? "good" as const
    : overallScore >= 40 ? "requires_improvement" as const
    : "inadequate" as const;

  // Strengths
  const strengths: string[] = [];
  if (meets(apptResult.attendanceRate, 90)) strengths.push("Excellent health appointment attendance demonstrates proactive health advocacy");
  if (meets(assessResult.assessmentCoverageRate, 100)) strengths.push("All children have current health assessments — statutory requirements fully met");
  if (meets(assessResult.childParticipationRate, 80)) strengths.push("Children actively participate in their health assessments");
  if (meets(needsResult.currentlyManagedRate, 90)) strengths.push("All identified health needs are actively managed with appropriate plans");
  if (meets(immunResult.upToDateRate, 90)) strengths.push("Immunisation programme is well-maintained with high coverage");
  if (meets(promoResult.topicCoverage, 60)) strengths.push("Good diversity of health promotion activities covering multiple topics");
  if (childProfiles.length > 0 && childProfiles.every(p => p.gpRegistered)) strengths.push("All children registered with a GP");

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (below(apptResult.attendanceRate, 80)) areasForImprovement.push("Appointment attendance below expected level — review barriers and advocacy approach");
  if (apptResult.childRefusedRate !== null && apptResult.childRefusedRate > 10) areasForImprovement.push("Significant rate of child refusal for health appointments — explore underlying concerns");
  if (below(assessResult.assessmentCoverageRate, 100)) areasForImprovement.push("Not all children have current health assessments — statutory gap");
  if (below(assessResult.completedOnTimeRate, 80)) areasForImprovement.push("Health assessments not consistently completed on time");
  if (below(needsResult.managementPlanRate, 80)) areasForImprovement.push("Not all active health needs have management plans in place");
  if (immunResult.overdueCount > 0) areasForImprovement.push("Overdue immunisations require immediate action to protect children's health");
  if (below(promoResult.topicCoverage, 40)) areasForImprovement.push("Limited range of health promotion topics — broaden programme");
  if (childProfiles.some(p => !p.dentalCheckCurrent)) areasForImprovement.push("Some children's dental checks are not current");

  // Actions
  const actions: string[] = [];
  if (below(assessResult.assessmentCoverageRate, 100)) actions.push("Commission outstanding health assessments for all children without current assessment");
  if (apptResult.missedRate !== null && apptResult.missedRate > 10) actions.push("Implement appointment tracking system with reminders and transport planning");
  if (below(needsResult.managementPlanRate, 100)) actions.push("Create health management plans for all identified health needs");
  if (immunResult.overdueCount > 0) actions.push("Contact GP to schedule overdue immunisations as priority");
  if (childProfiles.some(p => !p.gpRegistered)) actions.push("Register all children with a local GP within 5 working days");
  if (childProfiles.some(p => !p.dentalCheckCurrent)) actions.push("Book dental appointments for children with overdue checks");

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — Health and wellbeing standard (promoting physical health)",
    "Promoting the Health of Looked After Children (DfE/DoH 2015)",
    "SCCIF — Experiences and progress of children (health outcomes)",
    "NICE Guidelines — Health assessments for looked after children",
    "UNCRC Article 24 — Right to the highest attainable standard of health",
    "Initial Health Assessment within 20 working days of placement (statutory requirement)",
    "Review Health Assessment at least annually (6-monthly for under 5s)",
  ];

  return {
    homeId, periodStart, periodEnd, referenceDate,
    overallScore, rating,
    appointments: apptResult,
    assessments: assessResult,
    healthNeeds: needsResult,
    healthPromotion: promoResult,
    immunisations: immunResult,
    childProfiles,
    strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

// ── Label Functions ──────────────────────────────────────────────────────────

export function getAppointmentTypeLabel(type: HealthAppointmentType): string {
  const labels: Record<HealthAppointmentType, string> = {
    gp_registration: "GP Registration",
    gp_consultation: "GP Consultation",
    dental_check: "Dental Check",
    optician: "Optician",
    immunisation: "Immunisation",
    initial_health_assessment: "Initial Health Assessment",
    review_health_assessment: "Review Health Assessment",
    specialist_referral: "Specialist Referral",
    hospital_outpatient: "Hospital Outpatient",
    hospital_inpatient: "Hospital Inpatient",
    sexual_health: "Sexual Health",
    substance_misuse: "Substance Misuse",
    physiotherapy: "Physiotherapy",
    other: "Other",
  };
  return labels[type] || type;
}

export function getHealthNeedCategoryLabel(category: HealthNeedCategory): string {
  const labels: Record<HealthNeedCategory, string> = {
    chronic_condition: "Chronic Condition",
    acute_illness: "Acute Illness",
    developmental: "Developmental",
    sexual_health: "Sexual Health",
    substance_misuse: "Substance Misuse",
    dental: "Dental",
    vision: "Vision",
    hearing: "Hearing",
    nutrition: "Nutrition",
    allergy: "Allergy",
    mental_health_physical: "Mental Health (Physical)",
    other: "Other",
  };
  return labels[category] || category;
}

export function getHealthPromotionTopicLabel(topic: HealthPromotion["topic"]): string {
  const labels: Record<HealthPromotion["topic"], string> = {
    healthy_eating: "Healthy Eating",
    exercise: "Exercise",
    sleep_hygiene: "Sleep Hygiene",
    sexual_health: "Sexual Health",
    substance_awareness: "Substance Awareness",
    dental_hygiene: "Dental Hygiene",
    mental_health_awareness: "Mental Health Awareness",
    personal_hygiene: "Personal Hygiene",
    first_aid: "First Aid",
  };
  return labels[topic] || topic;
}
