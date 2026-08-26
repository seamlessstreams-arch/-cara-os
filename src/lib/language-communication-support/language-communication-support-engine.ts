import { above, below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// LANGUAGE, COMMUNICATION & SUPPORT INTELLIGENCE ENGINE
//
// Pure deterministic engine for assessing how well a children's residential
// home supports children with language, communication, and speech needs.
// Covers interpreter access, augmentative communication aids, SEND
// communication plans, environment accessibility, and staff awareness.
//
// Regulatory basis:
//   - CHR 2015, Reg 10 — Health and well-being: meeting individual needs
//   - SCCIF — Overall experiences and progress of children
//   - NMS 4 — Safeguarding: ensuring children can communicate concerns
//   - SEND Code of Practice 2015 — Communication support for SEND children
//   - Equality Act 2010 — Reasonable adjustments for communication needs
//   - UNCRC Article 12 — Right to express views and be heard
//   - UNCRC Article 13 — Right to freedom of expression
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type CommunicationNeed =
  | "speech_delay"
  | "english_additional_language"
  | "hearing_impairment"
  | "autism_spectrum"
  | "selective_mutism"
  | "learning_disability"
  | "visual_impairment"
  | "none";

export type SupportType =
  | "speech_therapy"
  | "interpreter"
  | "augmentative_device"
  | "visual_aids"
  | "sign_language"
  | "easy_read"
  | "social_stories"
  | "communication_passport";

export type SupportQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor";

export type ReviewStatus =
  | "current"
  | "overdue"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface ChildCommunicationProfile {
  id: string;
  childId: string;
  childName: string;
  communicationNeed: CommunicationNeed;
  communicationPlanExists: boolean;
  planReviewStatus: ReviewStatus;
  preferredCommunicationMethod: string;
  interpreterRequired: boolean;
  interpreterAvailable: boolean;
  augmentativeDeviceNeeded: boolean;
  augmentativeDeviceProvided: boolean;
}

export interface CommunicationSupportSession {
  id: string;
  childId: string;
  childName: string;
  date: string;
  supportType: SupportType;
  quality: SupportQuality;
  childEngaged: boolean;
  childProgressNoted: boolean;
  facilitatedBy: string;
  duration: number;
}

export interface CommunicationAudit {
  id: string;
  auditDate: string;
  auditedBy: string;
  easyReadMaterialsAvailable: boolean;
  visualAidsPresent: boolean;
  signageAccessible: boolean;
  staffCommunicationAwareness: boolean;
  childViewsSoughtAccessibly: boolean;
}

export interface StaffCommunicationTraining {
  id: string;
  staffId: string;
  staffName: string;
  communicationNeedsAwareness: boolean;
  signLanguageBasics: boolean;
  augmentativeDeviceTrained: boolean;
  easyReadTrained: boolean;
  autismCommunication: boolean;
  interpreterWorkingTrained: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface NeedsAssessmentResult {
  overallScore: number;
  totalProfiles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  communicationPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  planCurrentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  interpreterAvailableRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deviceProvidedRate: number | null;
}

export interface SupportProvisionResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityGoodPlusRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childEngagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  progressNotedRate: number | null;
  averageSessionsPerChild: number | null;
}

export interface EnvironmentAccessibilityResult {
  overallScore: number;
  totalAudits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  easyReadRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  visualAidsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  signageAccessibleRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewsAccessibleRate: number | null;
}

export interface StaffCompetenceResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  awarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  signLanguageRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  augmentativeDeviceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  easyReadRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  autismCommunicationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  interpreterWorkingRate: number | null;
}

export interface ChildCommunicationProfileResult {
  childId: string;
  childName: string;
  communicationNeed: CommunicationNeed;
  hasPlan: boolean;
  planCurrent: boolean;
  interpreterMet: boolean;
  deviceMet: boolean;
  sessionsInPeriod: number;
  overallScore: number;
}

export interface LanguageCommunicationSupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  needsAssessment: NeedsAssessmentResult;
  supportProvision: SupportProvisionResult;
  environmentAccessibility: EnvironmentAccessibilityResult;
  staffCompetence: StaffCompetenceResult;
  childProfiles: ChildCommunicationProfileResult[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps & Getters -----------------------------------------------------

const COMMUNICATION_NEED_LABELS: Record<CommunicationNeed, string> = {
  speech_delay: "Speech Delay",
  english_additional_language: "English as Additional Language",
  hearing_impairment: "Hearing Impairment",
  autism_spectrum: "Autism Spectrum",
  selective_mutism: "Selective Mutism",
  learning_disability: "Learning Disability",
  visual_impairment: "Visual Impairment",
  none: "None",
};

const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  speech_therapy: "Speech Therapy",
  interpreter: "Interpreter",
  augmentative_device: "Augmentative Device",
  visual_aids: "Visual Aids",
  sign_language: "Sign Language",
  easy_read: "Easy Read",
  social_stories: "Social Stories",
  communication_passport: "Communication Passport",
};

const SUPPORT_QUALITY_LABELS: Record<SupportQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  current: "Current",
  overdue: "Overdue",
  not_applicable: "Not Applicable",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getCommunicationNeedLabel(v: CommunicationNeed): string { return COMMUNICATION_NEED_LABELS[v]; }
export function getSupportTypeLabel(v: SupportType): string { return SUPPORT_TYPE_LABELS[v]; }
export function getSupportQualityLabel(v: SupportQuality): string { return SUPPORT_QUALITY_LABELS[v]; }
export function getReviewStatusLabel(v: ReviewStatus): string { return REVIEW_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates needs assessment and planning for communication needs.
 * Empty = 0 (no profiles documented = non-compliant).
 * Plans exist (0-7), review current (0-6), interpreter available (0-6), device provided (0-6)
 */
export function evaluateNeedsAssessment(
  profiles: ChildCommunicationProfile[],
): NeedsAssessmentResult {
  if (profiles.length === 0) {
    return {
      overallScore: 0,
      totalProfiles: 0,
      communicationPlanRate: null,
      planCurrentRate: null,
      interpreterAvailableRate: null,
      deviceProvidedRate: null,
    };
  }

  const withNeeds = profiles.filter((p) => p.communicationNeed !== "none");

  let plansExist = 0;
  let planCurrent = 0;
  let interpreterRequired = 0;
  let interpreterAvailable = 0;
  let deviceNeeded = 0;
  let deviceProvided = 0;

  for (const p of profiles) {
    if (p.communicationPlanExists) plansExist++;
    if (p.planReviewStatus === "current") planCurrent++;
    if (p.interpreterRequired) {
      interpreterRequired++;
      if (p.interpreterAvailable) interpreterAvailable++;
    }
    if (p.augmentativeDeviceNeeded) {
      deviceNeeded++;
      if (p.augmentativeDeviceProvided) deviceProvided++;
    }
  }

  const planDenominator = withNeeds.length > 0 ? withNeeds.length : profiles.length;
  const communicationPlanRate = rate(plansExist, planDenominator);
  const reviewablePlans = profiles.filter((p) => p.planReviewStatus !== "not_applicable").length;
  const planCurrentRate = rate(planCurrent, reviewablePlans);
  const interpreterAvailableRate = rate(interpreterAvailable, interpreterRequired);
  const deviceProvidedRate = rate(deviceProvided, deviceNeeded);

  // Scoring: plans exist (0-7), review current (0-6), interpreter available (0-6), device provided (0-6)
  let score = 0;
  score += Math.round(((communicationPlanRate ?? 0) / 100) * 7);
  score += Math.round(((planCurrentRate ?? 0) / 100) * 6);
  score += Math.round(((interpreterAvailableRate ?? 0) / 100) * 6);
  score += Math.round(((deviceProvidedRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalProfiles: profiles.length,
    communicationPlanRate,
    planCurrentRate,
    interpreterAvailableRate,
    deviceProvidedRate,
  };
}

/**
 * Evaluates quality and consistency of communication support sessions.
 * Empty = 0 (no sessions documented = non-compliant).
 * Session quality good+ (0-7), child engaged (0-6), progress noted (0-6), session regularity (0-6)
 */
export function evaluateSupportProvision(
  sessions: CommunicationSupportSession[],
  profileCount: number,
): SupportProvisionResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      qualityGoodPlusRate: null,
      childEngagedRate: null,
      progressNotedRate: null,
      averageSessionsPerChild: 0,
    };
  }

  let qualityGoodPlus = 0;
  let childEngaged = 0;
  let progressNoted = 0;

  for (const s of sessions) {
    if (s.quality === "excellent" || s.quality === "good") qualityGoodPlus++;
    if (s.childEngaged) childEngaged++;
    if (s.childProgressNoted) progressNoted++;
  }

  const qualityGoodPlusRate = rate(qualityGoodPlus, sessions.length);
  const childEngagedRate = rate(childEngaged, sessions.length);
  const progressNotedRate = rate(progressNoted, sessions.length);
  const averageSessionsPerChild = profileCount > 0
    ? Math.round((sessions.length / profileCount) * 10) / 10
    : null;

  // Scoring: quality good+ (0-7), child engaged (0-6), progress noted (0-6), session regularity (0-6)
  let score = 0;
  score += Math.round((qualityGoodPlusRate! / 100) * 7);
  score += Math.round((childEngagedRate! / 100) * 6);
  score += Math.round((progressNotedRate! / 100) * 6);

  // Session regularity: based on average sessions per child with needs
  if ((averageSessionsPerChild ?? 0) >= 4) score += 6;
  else if ((averageSessionsPerChild ?? 0) >= 2) score += 4;
  else if ((averageSessionsPerChild ?? 0) >= 1) score += 2;
  else if (sessions.length > 0) score += 1;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    qualityGoodPlusRate,
    childEngagedRate,
    progressNotedRate,
    averageSessionsPerChild,
  };
}

/**
 * Evaluates the accessibility of the physical environment for communication.
 * Empty = 0 (no audits = non-compliant).
 * Easy read (0-7), visual aids (0-6), signage (0-6), child views sought accessibly (0-6)
 */
export function evaluateEnvironmentAccessibility(
  audits: CommunicationAudit[],
): EnvironmentAccessibilityResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      easyReadRate: null,
      visualAidsRate: null,
      signageAccessibleRate: null,
      childViewsAccessibleRate: null,
    };
  }

  let easyRead = 0;
  let visualAids = 0;
  let signage = 0;
  let childViews = 0;

  for (const a of audits) {
    if (a.easyReadMaterialsAvailable) easyRead++;
    if (a.visualAidsPresent) visualAids++;
    if (a.signageAccessible) signage++;
    if (a.childViewsSoughtAccessibly) childViews++;
  }

  const easyReadRate = rate(easyRead, audits.length);
  const visualAidsRate = rate(visualAids, audits.length);
  const signageAccessibleRate = rate(signage, audits.length);
  const childViewsAccessibleRate = rate(childViews, audits.length);

  // Scoring: easy read (0-7), visual aids (0-6), signage (0-6), child views (0-6)
  let score = 0;
  score += Math.round((easyReadRate! / 100) * 7);
  score += Math.round((visualAidsRate! / 100) * 6);
  score += Math.round((signageAccessibleRate! / 100) * 6);
  score += Math.round((childViewsAccessibleRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAudits: audits.length,
    easyReadRate,
    visualAidsRate,
    signageAccessibleRate,
    childViewsAccessibleRate,
  };
}

/**
 * Evaluates staff competence in communication support.
 * Empty = 0 (no training records = non-compliant).
 * Awareness (0-6), sign language (0-5), augmentative device (0-5), easy read (0-4), autism (0-3), interpreter (0-2)
 */
export function evaluateStaffCompetence(
  training: StaffCommunicationTraining[],
): StaffCompetenceResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      awarenessRate: null,
      signLanguageRate: null,
      augmentativeDeviceRate: null,
      easyReadRate: null,
      autismCommunicationRate: null,
      interpreterWorkingRate: null,
    };
  }

  let awareness = 0;
  let signLanguage = 0;
  let augmentativeDevice = 0;
  let easyRead = 0;
  let autismCommunication = 0;
  let interpreterWorking = 0;

  for (const t of training) {
    if (t.communicationNeedsAwareness) awareness++;
    if (t.signLanguageBasics) signLanguage++;
    if (t.augmentativeDeviceTrained) augmentativeDevice++;
    if (t.easyReadTrained) easyRead++;
    if (t.autismCommunication) autismCommunication++;
    if (t.interpreterWorkingTrained) interpreterWorking++;
  }

  const awarenessRate = rate(awareness, training.length);
  const signLanguageRate = rate(signLanguage, training.length);
  const augmentativeDeviceRate = rate(augmentativeDevice, training.length);
  const easyReadRate = rate(easyRead, training.length);
  const autismCommunicationRate = rate(autismCommunication, training.length);
  const interpreterWorkingRate = rate(interpreterWorking, training.length);

  // Scoring: awareness (0-6), sign language (0-5), augmentative device (0-5), easy read (0-4), autism (0-3), interpreter (0-2)
  let score = 0;
  score += Math.round((awarenessRate! / 100) * 6);
  score += Math.round(((signLanguageRate ?? 0) / 100) * 5);
  score += Math.round(((augmentativeDeviceRate ?? 0) / 100) * 5);
  score += Math.round(((easyReadRate ?? 0) / 100) * 4);
  score += Math.round(((autismCommunicationRate ?? 0) / 100) * 3);
  score += Math.round(((interpreterWorkingRate ?? 0) / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    awarenessRate,
    signLanguageRate,
    augmentativeDeviceRate,
    easyReadRate,
    autismCommunicationRate,
    interpreterWorkingRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildCommunicationProfiles(
  profiles: ChildCommunicationProfile[],
  sessions: CommunicationSupportSession[],
): ChildCommunicationProfileResult[] {
  if (profiles.length === 0) return [];

  return profiles.map((p) => {
    const childSessions = sessions.filter((s) => s.childId === p.childId);
    const hasPlan = p.communicationPlanExists;
    const planCurrent = p.planReviewStatus === "current";
    const interpreterMet = !p.interpreterRequired || p.interpreterAvailable;
    const deviceMet = !p.augmentativeDeviceNeeded || p.augmentativeDeviceProvided;

    // Score 0-10
    let score = 0;

    // Plan exists (0-3)
    if (p.communicationNeed === "none") {
      score += 3; // No need = fully met
    } else {
      if (hasPlan) score += 2;
      if (planCurrent) score += 1;
    }

    // Interpreter & device needs met (0-2)
    if (interpreterMet) score += 1;
    if (deviceMet) score += 1;

    // Session engagement (0-3)
    if (childSessions.length > 0) {
      const engaged = childSessions.filter((s) => s.childEngaged).length;
      score += Math.round((rate(engaged, childSessions.length)! / 100) * 2);
      const progress = childSessions.filter((s) => s.childProgressNoted).length;
      if (meets(rate(progress, childSessions.length), 50)) score += 1;
    } else if (p.communicationNeed === "none") {
      score += 3; // No sessions needed
    }

    // Session quality (0-2)
    if (childSessions.length > 0) {
      const goodPlus = childSessions.filter((s) => s.quality === "excellent" || s.quality === "good").length;
      score += Math.round((rate(goodPlus, childSessions.length)! / 100) * 2);
    }

    return {
      childId: p.childId,
      childName: p.childName,
      communicationNeed: p.communicationNeed,
      hasPlan,
      planCurrent,
      interpreterMet,
      deviceMet,
      sessionsInPeriod: childSessions.length,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateLanguageCommunicationSupportIntelligence(
  profiles: ChildCommunicationProfile[],
  sessions: CommunicationSupportSession[],
  audits: CommunicationAudit[],
  training: StaffCommunicationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): LanguageCommunicationSupportIntelligence {
  const withNeeds = profiles.filter((p) => p.communicationNeed !== "none");

  const needsAssessment = evaluateNeedsAssessment(profiles);
  const supportProvision = evaluateSupportProvision(sessions, withNeeds.length);
  const environmentAccessibility = evaluateEnvironmentAccessibility(audits);
  const staffCompetence = evaluateStaffCompetence(training);

  const rawScore =
    needsAssessment.overallScore +
    supportProvision.overallScore +
    environmentAccessibility.overallScore +
    staffCompetence.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildCommunicationProfiles(profiles, sessions);

  // -- Strengths --
  const strengths: string[] = [];
  if (withNeeds.length > 0 && needsAssessment.communicationPlanRate === 100)
    strengths.push("Communication plans in place for all children with identified needs");
  if (withNeeds.length > 0 && needsAssessment.planCurrentRate === 100)
    strengths.push("All communication plans are current and up to date");
  if (profiles.some((p) => p.interpreterRequired) && needsAssessment.interpreterAvailableRate === 100)
    strengths.push("Interpreter access provided for all children who require it");
  if (profiles.some((p) => p.augmentativeDeviceNeeded) && needsAssessment.deviceProvidedRate === 100)
    strengths.push("Augmentative communication devices provided for all children who need them");
  if (sessions.length > 0 && meets(supportProvision.qualityGoodPlusRate, 85))
    strengths.push("High quality communication support — " + supportProvision.qualityGoodPlusRate + "% of sessions rated good or excellent");
  if (sessions.length > 0 && meets(supportProvision.childEngagedRate, 90))
    strengths.push("Strong child engagement — " + supportProvision.childEngagedRate + "% of sessions show active participation");
  if (sessions.length > 0 && meets(supportProvision.progressNotedRate, 80))
    strengths.push("Progress noted in " + supportProvision.progressNotedRate + "% of support sessions");
  if (audits.length > 0 && environmentAccessibility.easyReadRate === 100)
    strengths.push("Easy read materials consistently available across the home");
  if (audits.length > 0 && environmentAccessibility.childViewsAccessibleRate === 100)
    strengths.push("Children's views consistently sought through accessible methods");
  if (training.length > 0 && staffCompetence.awarenessRate === 100)
    strengths.push("All staff trained in communication needs awareness");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (profiles.length === 0)
    areasForImprovement.push("No communication profiles documented — all children should have communication needs assessed");
  if (withNeeds.length > 0 && below(needsAssessment.communicationPlanRate, 100))
    areasForImprovement.push("Communication plans missing for " + (100 - needsAssessment.communicationPlanRate!) + "% of children with identified needs");
  if (withNeeds.length > 0 && below(needsAssessment.planCurrentRate, 100) && above(needsAssessment.planCurrentRate, 0))
    areasForImprovement.push("Only " + needsAssessment.planCurrentRate + "% of communication plans are current — reviews overdue");
  if (profiles.some((p) => p.interpreterRequired) && below(needsAssessment.interpreterAvailableRate, 100))
    areasForImprovement.push("Interpreter access not met for all children who require it — " + needsAssessment.interpreterAvailableRate + "% availability");
  if (profiles.some((p) => p.augmentativeDeviceNeeded) && below(needsAssessment.deviceProvidedRate, 100))
    areasForImprovement.push("Augmentative devices not provided for all children who need them — " + needsAssessment.deviceProvidedRate + "% provided");
  if (sessions.length > 0 && below(supportProvision.qualityGoodPlusRate, 60))
    areasForImprovement.push("Support session quality below expectations — only " + supportProvision.qualityGoodPlusRate + "% rated good or excellent");
  if (sessions.length > 0 && below(supportProvision.childEngagedRate, 70))
    areasForImprovement.push("Low child engagement in support sessions — only " + supportProvision.childEngagedRate + "% engaged");
  if (sessions.length === 0 && withNeeds.length > 0)
    areasForImprovement.push("No communication support sessions recorded despite children with identified needs");
  if (audits.length === 0)
    areasForImprovement.push("No communication environment audits completed — schedule regular accessibility checks");
  if (audits.length > 0 && below(environmentAccessibility.easyReadRate, 100))
    areasForImprovement.push("Easy read materials not consistently available — found in " + environmentAccessibility.easyReadRate + "% of audits");
  if (training.length === 0)
    areasForImprovement.push("No staff communication training records — all staff require communication awareness training");
  if (training.length > 0 && below(staffCompetence.awarenessRate, 80))
    areasForImprovement.push("Only " + staffCompetence.awarenessRate + "% of staff have communication needs awareness training");

  // -- Actions --
  const actions: string[] = [];
  const interpreterUnmet = profiles.filter((p) => p.interpreterRequired && !p.interpreterAvailable);
  if (interpreterUnmet.length > 0)
    actions.push("URGENT: " + interpreterUnmet.length + " child(ren) require interpreter access that is not currently available — arrange immediately");
  const deviceUnmet = profiles.filter((p) => p.augmentativeDeviceNeeded && !p.augmentativeDeviceProvided);
  if (deviceUnmet.length > 0)
    actions.push("URGENT: " + deviceUnmet.length + " child(ren) need augmentative communication devices not yet provided — procure without delay");
  const overduePlans = profiles.filter((p) => p.planReviewStatus === "overdue");
  if (overduePlans.length > 0)
    actions.push("URGENT: " + overduePlans.length + " communication plan(s) overdue for review — schedule reviews immediately");
  const needsWithoutPlans = withNeeds.filter((p) => !p.communicationPlanExists);
  if (needsWithoutPlans.length > 0)
    actions.push("URGENT: " + needsWithoutPlans.length + " child(ren) with identified communication needs have no communication plan — create plans as statutory requirement");
  if (profiles.length === 0)
    actions.push("Assess communication needs for every child and create individual communication profiles");
  if (sessions.length === 0 && withNeeds.length > 0)
    actions.push("Arrange communication support sessions for children with identified needs");
  if (audits.length === 0)
    actions.push("Schedule communication environment accessibility audits — recommended quarterly");
  if (training.length === 0)
    actions.push("Arrange communication awareness training for all staff — statutory requirement under Equality Act 2010");
  if (training.length > 0 && below(staffCompetence.autismCommunicationRate, 75))
    actions.push("Arrange autism communication training — only " + staffCompetence.autismCommunicationRate + "% of staff trained");
  if (training.length > 0 && below(staffCompetence.signLanguageRate, 50))
    actions.push("Arrange basic sign language training — only " + staffCompetence.signLanguageRate + "% of staff trained");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 10 — Health and well-being: duty to meet individual communication needs",
    "SCCIF — Overall experiences: children able to communicate needs and be understood",
    "NMS 4 — Safeguarding: ensuring children can communicate concerns effectively",
    "SEND Code of Practice 2015 — Communication support and reasonable adjustments for SEND children",
    "Equality Act 2010 — Reasonable adjustments for children with communication disabilities",
    "UNCRC Article 12 — Right to express views freely and be heard in all matters",
    "UNCRC Article 13 — Right to freedom of expression through any medium of choice",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    needsAssessment,
    supportProvision,
    environmentAccessibility,
    staffCompetence,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
