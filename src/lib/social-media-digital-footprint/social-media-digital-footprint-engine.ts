// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA & DIGITAL FOOTPRINT INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a home manages children's
// digital footprint, social media safety, image consent, online reputation
// protection, and staff awareness of digital safeguarding.
//
// Critical for protecting looked-after children whose images and locations
// must not be shared without consent.
//
// Regulatory basis:
//   - Data Protection Act 2018 (UK GDPR) — Lawful processing of children's data
//   - KCSIE 2024 — Online safety and digital safeguarding
//   - CHR 2015, Reg 12 — Safeguarding: protecting children online
//   - SCCIF — How well children are helped and protected
//   - UNCRC Article 16 — Right to privacy
//   - Children Act 1989 — Welfare of the child
//   - Online Safety Act 2023 — Duties regarding online safety
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type ConsentType =
  | "photo"
  | "video"
  | "social_media"
  | "website"
  | "newsletter"
  | "press"
  | "other";

export type ConsentStatus =
  | "granted"
  | "refused"
  | "withdrawn"
  | "not_requested"
  | "pending";

export type RiskCategory =
  | "identity_exposure"
  | "location_disclosure"
  | "cyberbullying"
  | "grooming"
  | "inappropriate_content"
  | "data_breach"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ImageConsentRecord {
  id: string;
  childId: string;
  childName: string;
  consentType: ConsentType;
  consentStatus: ConsentStatus;
  reviewDate: string; // ISO date
  parentCarerConsulted: boolean;
  childConsulted: boolean;
  expiryDate: string; // ISO date
}

export interface DigitalSafetyIncident {
  id: string;
  childId: string;
  childName: string;
  incidentDate: string; // ISO date
  riskCategory: RiskCategory;
  severity: IncidentSeverity;
  reportedTimely: boolean;
  actionTaken: boolean;
  lessonLearned: boolean;
  preventionMeasures: boolean;
}

export interface DigitalSafetyPolicy {
  id: string;
  policyReviewDate: string; // ISO date
  policyCurrent: boolean;
  imageConsentProcess: boolean;
  socialMediaGuidance: boolean;
  digitalFootprintProtection: boolean;
  cyberbullyingProtocol: boolean;
  dataProtectionCompliant: boolean;
  staffSocialMediaPolicy: boolean;
}

export interface StaffDigitalTraining {
  id: string;
  staffId: string;
  staffName: string;
  digitalSafeguarding: boolean;
  imageConsentProcess: boolean;
  socialMediaRisks: boolean;
  cyberbullyingResponse: boolean;
  dataProtection: boolean;
  onlineGroomingAwareness: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ConsentManagementResult {
  totalConsents: number;
  activeDecisionCount: number;
  activeDecisionRate: number;
  childConsultedCount: number;
  childConsultedRate: number;
  parentConsultedCount: number;
  parentConsultedRate: number;
  reviewCurrentCount: number;
  reviewCurrentRate: number;
  statusBreakdown: Record<ConsentStatus, number>;
  typeBreakdown: Record<ConsentType, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface DigitalIncidentResponseResult {
  totalIncidents: number;
  timelyReportingCount: number;
  timelyReportingRate: number;
  actionTakenCount: number;
  actionTakenRate: number;
  lessonLearnedCount: number;
  lessonLearnedRate: number;
  preventionMeasuresCount: number;
  preventionMeasuresRate: number;
  severityBreakdown: Record<IncidentSeverity, number>;
  categoryBreakdown: Record<RiskCategory, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface DigitalPolicyResult {
  totalPolicies: number;
  policyCurrent: boolean;
  imageConsentProcess: boolean;
  socialMediaGuidance: boolean;
  digitalFootprintProtection: boolean;
  cyberbullyingProtocol: boolean;
  dataProtectionCompliant: boolean;
  staffSocialMediaPolicy: boolean;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffDigitalReadinessResult {
  totalStaff: number;
  digitalSafeguardingCount: number;
  digitalSafeguardingRate: number;
  imageConsentProcessCount: number;
  imageConsentProcessRate: number;
  socialMediaRisksCount: number;
  socialMediaRisksRate: number;
  cyberbullyingResponseCount: number;
  cyberbullyingResponseRate: number;
  dataProtectionCount: number;
  dataProtectionRate: number;
  onlineGroomingAwarenessCount: number;
  onlineGroomingAwarenessRate: number;
  overallTrainedCount: number;
  overallTrainedRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildDigitalProfile {
  childId: string;
  childName: string;
  totalConsents: number;
  activeConsents: number;
  refusedConsents: number;
  pendingConsents: number;
  childConsulted: boolean;
  totalIncidents: number;
  highCriticalIncidents: number;
  digitalSafetyScore: number; // 0-10
}

export interface SocialMediaDigitalFootprintIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  consentManagement: ConsentManagementResult;
  digitalIncidentResponse: DigitalIncidentResponseResult;
  digitalPolicy: DigitalPolicyResult;
  staffDigitalReadiness: StaffDigitalReadinessResult;

  childProfiles: ChildDigitalProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Function 1: Evaluate Consent Management (0-25) ─────────────────

export function evaluateConsentManagement(
  consents: ImageConsentRecord[],
): ConsentManagementResult {
  const totalConsents = consents.length;

  // Empty = 0 (no consent records = no evidence of consent management)
  if (totalConsents === 0) {
    return {
      totalConsents: 0,
      activeDecisionCount: 0,
      activeDecisionRate: 0,
      childConsultedCount: 0,
      childConsultedRate: 0,
      parentConsultedCount: 0,
      parentConsultedRate: 0,
      reviewCurrentCount: 0,
      reviewCurrentRate: 0,
      statusBreakdown: {
        granted: 0, refused: 0, withdrawn: 0, not_requested: 0, pending: 0,
      },
      typeBreakdown: {
        photo: 0, video: 0, social_media: 0, website: 0,
        newsletter: 0, press: 0, other: 0,
      },
      score: 0,
      strengths: [],
      concerns: ["No image consent records maintained — Data Protection Act 2018 requires documented consent for children's images"],
    };
  }

  // Active decisions: granted or refused (i.e. a decision has been made)
  const activeDecisionCount = consents.filter(
    (c) => c.consentStatus === "granted" || c.consentStatus === "refused",
  ).length;
  const activeDecisionRate = pct(activeDecisionCount, totalConsents);

  // Child consulted
  const childConsultedCount = consents.filter((c) => c.childConsulted).length;
  const childConsultedRate = pct(childConsultedCount, totalConsents);

  // Parent/carer consulted
  const parentConsultedCount = consents.filter((c) => c.parentCarerConsulted).length;
  const parentConsultedRate = pct(parentConsultedCount, totalConsents);

  // Review currency: review date within last 12 months from today
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const reviewCutoff = twelveMonthsAgo.toISOString().slice(0, 10);
  const reviewCurrentCount = consents.filter(
    (c) => c.reviewDate >= reviewCutoff,
  ).length;
  const reviewCurrentRate = pct(reviewCurrentCount, totalConsents);

  // Status breakdown
  const statusBreakdown: Record<ConsentStatus, number> = {
    granted: 0, refused: 0, withdrawn: 0, not_requested: 0, pending: 0,
  };
  for (const c of consents) {
    statusBreakdown[c.consentStatus]++;
  }

  // Type breakdown
  const typeBreakdown: Record<ConsentType, number> = {
    photo: 0, video: 0, social_media: 0, website: 0,
    newsletter: 0, press: 0, other: 0,
  };
  for (const c of consents) {
    typeBreakdown[c.consentType]++;
  }

  // Score (out of 25)
  let score = 0;
  // Active decision rate: max 7
  score += (activeDecisionRate / 100) * 7;
  // Child consulted rate: max 6
  score += (childConsultedRate / 100) * 6;
  // Parent consulted rate: max 6
  score += (parentConsultedRate / 100) * 6;
  // Review currency rate: max 6
  score += (reviewCurrentRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (activeDecisionRate >= 90) {
    strengths.push("Excellent consent decision rate: " + activeDecisionRate + "% of image consents have an active decision");
  } else if (activeDecisionRate < 70) {
    concerns.push("Only " + activeDecisionRate + "% of consents have an active decision — " + (totalConsents - activeDecisionCount) + " consent(s) still pending or not requested");
  }

  if (childConsultedRate >= 90) {
    strengths.push("Children consulted in " + childConsultedRate + "% of consent decisions — strong participation per UNCRC Article 16");
  } else if (childConsultedRate < 70) {
    concerns.push("Children consulted in only " + childConsultedRate + "% of consent decisions — their views must be sought per UNCRC Article 16");
  }

  if (parentConsultedRate >= 90) {
    strengths.push("Parents/carers consulted in " + parentConsultedRate + "% of consent decisions");
  } else if (parentConsultedRate < 70) {
    concerns.push("Parents/carers consulted in only " + parentConsultedRate + "% of consent decisions — parental involvement is essential");
  }

  if (reviewCurrentRate >= 90) {
    strengths.push("Consent reviews current: " + reviewCurrentRate + "% reviewed within the last 12 months");
  } else if (reviewCurrentRate < 70) {
    concerns.push("Only " + reviewCurrentRate + "% of consent records reviewed within 12 months — consents may be outdated");
  }

  if (statusBreakdown.not_requested > 0) {
    concerns.push(statusBreakdown.not_requested + " consent(s) not yet requested — all children must have documented image consent");
  }

  return {
    totalConsents,
    activeDecisionCount,
    activeDecisionRate,
    childConsultedCount,
    childConsultedRate,
    parentConsultedCount,
    parentConsultedRate,
    reviewCurrentCount,
    reviewCurrentRate,
    statusBreakdown,
    typeBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Digital Incident Response (0-25) ──────────

export function evaluateDigitalIncidentResponse(
  incidents: DigitalSafetyIncident[],
): DigitalIncidentResponseResult {
  const totalIncidents = incidents.length;

  // Empty = 25 (no incidents = excellent)
  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      timelyReportingCount: 0,
      timelyReportingRate: 0,
      actionTakenCount: 0,
      actionTakenRate: 0,
      lessonLearnedCount: 0,
      lessonLearnedRate: 0,
      preventionMeasuresCount: 0,
      preventionMeasuresRate: 0,
      severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      categoryBreakdown: {
        identity_exposure: 0, location_disclosure: 0, cyberbullying: 0,
        grooming: 0, inappropriate_content: 0, data_breach: 0, other: 0,
      },
      score: 25,
      strengths: ["No digital safety incidents recorded in period — effective digital safeguarding"],
      concerns: [],
    };
  }

  // Timely reporting
  const timelyReportingCount = incidents.filter((i) => i.reportedTimely).length;
  const timelyReportingRate = pct(timelyReportingCount, totalIncidents);

  // Action taken
  const actionTakenCount = incidents.filter((i) => i.actionTaken).length;
  const actionTakenRate = pct(actionTakenCount, totalIncidents);

  // Lessons learned
  const lessonLearnedCount = incidents.filter((i) => i.lessonLearned).length;
  const lessonLearnedRate = pct(lessonLearnedCount, totalIncidents);

  // Prevention measures
  const preventionMeasuresCount = incidents.filter((i) => i.preventionMeasures).length;
  const preventionMeasuresRate = pct(preventionMeasuresCount, totalIncidents);

  // Severity breakdown
  const severityBreakdown: Record<IncidentSeverity, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };
  for (const i of incidents) {
    severityBreakdown[i.severity]++;
  }

  // Category breakdown
  const categoryBreakdown: Record<RiskCategory, number> = {
    identity_exposure: 0, location_disclosure: 0, cyberbullying: 0,
    grooming: 0, inappropriate_content: 0, data_breach: 0, other: 0,
  };
  for (const i of incidents) {
    categoryBreakdown[i.riskCategory]++;
  }

  // Score (out of 25)
  let score = 0;
  // Timely reporting rate: max 7
  score += (timelyReportingRate / 100) * 7;
  // Action taken rate: max 6
  score += (actionTakenRate / 100) * 6;
  // Lessons learned rate: max 6
  score += (lessonLearnedRate / 100) * 6;
  // Prevention measures rate: max 6
  score += (preventionMeasuresRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (timelyReportingRate >= 90) {
    strengths.push("Excellent timely reporting: " + timelyReportingRate + "% of digital incidents reported promptly");
  } else if (timelyReportingRate < 70) {
    concerns.push("Timely reporting at " + timelyReportingRate + "% — delayed reporting increases risk to children");
  }

  if (actionTakenRate >= 90) {
    strengths.push("Action taken in " + actionTakenRate + "% of digital incidents — strong response culture");
  } else if (actionTakenRate < 70) {
    concerns.push("Action taken in only " + actionTakenRate + "% of incidents — some digital safety concerns left unaddressed");
  }

  if (lessonLearnedRate >= 80) {
    strengths.push("Lessons learned documented in " + lessonLearnedRate + "% of incidents — promoting continuous improvement");
  } else if (lessonLearnedRate < 50) {
    concerns.push("Lessons learned documented in only " + lessonLearnedRate + "% of incidents — missed opportunity for improvement");
  }

  if (preventionMeasuresRate >= 80) {
    strengths.push("Prevention measures implemented in " + preventionMeasuresRate + "% of incidents");
  } else if (preventionMeasuresRate < 50) {
    concerns.push("Prevention measures in only " + preventionMeasuresRate + "% of incidents — risk of recurrence");
  }

  if (severityBreakdown.critical > 0) {
    concerns.push(severityBreakdown.critical + " critical digital safety incident(s) — requires immediate safeguarding review");
  }

  if (categoryBreakdown.grooming > 0) {
    concerns.push(categoryBreakdown.grooming + " online grooming incident(s) detected — KCSIE 2024 requires immediate multi-agency response");
  }

  return {
    totalIncidents,
    timelyReportingCount,
    timelyReportingRate,
    actionTakenCount,
    actionTakenRate,
    lessonLearnedCount,
    lessonLearnedRate,
    preventionMeasuresCount,
    preventionMeasuresRate,
    severityBreakdown,
    categoryBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Digital Policy (0-25) ─────────────────────

export function evaluateDigitalPolicy(
  policies: DigitalSafetyPolicy[],
): DigitalPolicyResult {
  const totalPolicies = policies.length;

  // Empty = 0 (no policies = no evidence of digital safety framework)
  if (totalPolicies === 0) {
    return {
      totalPolicies: 0,
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
      score: 0,
      strengths: [],
      concerns: ["No digital safety policies documented — Online Safety Act 2023 requires documented online safety measures"],
    };
  }

  // Use the most recent policy (latest review date)
  const sorted = [...policies].sort((a, b) => b.policyReviewDate.localeCompare(a.policyReviewDate));
  const policy = sorted[0];

  const policyCurrent = policy.policyCurrent;
  const imageConsentProcess = policy.imageConsentProcess;
  const socialMediaGuidance = policy.socialMediaGuidance;
  const digitalFootprintProtection = policy.digitalFootprintProtection;
  const cyberbullyingProtocol = policy.cyberbullyingProtocol;
  const dataProtectionCompliant = policy.dataProtectionCompliant;
  const staffSocialMediaPolicy = policy.staffSocialMediaPolicy;

  // Score (out of 25) — boolean scoring
  let score = 0;
  if (policyCurrent) score += 5;
  if (imageConsentProcess) score += 4;
  if (socialMediaGuidance) score += 4;
  if (digitalFootprintProtection) score += 4;
  if (cyberbullyingProtocol) score += 3;
  if (dataProtectionCompliant) score += 3;
  if (staffSocialMediaPolicy) score += 2;

  score = clamp(score, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (policyCurrent) {
    strengths.push("Digital safety policy is current and up to date");
  } else {
    concerns.push("Digital safety policy is not current — must be reviewed and updated");
  }

  if (imageConsentProcess) {
    strengths.push("Image consent process documented and in place");
  } else {
    concerns.push("No image consent process — Data Protection Act 2018 requires documented consent procedures");
  }

  if (socialMediaGuidance) {
    strengths.push("Social media guidance provided to children and staff");
  } else {
    concerns.push("No social media guidance — children and staff need clear guidance on safe social media use");
  }

  if (digitalFootprintProtection) {
    strengths.push("Digital footprint protection measures in place");
  } else {
    concerns.push("No digital footprint protection — looked-after children's online identities must be safeguarded");
  }

  if (cyberbullyingProtocol) {
    strengths.push("Cyberbullying protocol established");
  } else {
    concerns.push("No cyberbullying protocol — response procedures required per KCSIE 2024");
  }

  if (dataProtectionCompliant) {
    strengths.push("Data protection compliance confirmed");
  } else {
    concerns.push("Data protection compliance not confirmed — UK GDPR requirements must be met");
  }

  if (staffSocialMediaPolicy) {
    strengths.push("Staff social media policy in place — professional boundaries maintained");
  } else {
    concerns.push("No staff social media policy — risk of inappropriate staff-child online contact");
  }

  return {
    totalPolicies,
    policyCurrent,
    imageConsentProcess,
    socialMediaGuidance,
    digitalFootprintProtection,
    cyberbullyingProtocol,
    dataProtectionCompliant,
    staffSocialMediaPolicy,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Staff Digital Readiness (0-25) ────────────

export function evaluateStaffDigitalReadiness(
  training: StaffDigitalTraining[],
): StaffDigitalReadinessResult {
  const totalStaff = training.length;

  // Empty = 0 (no training records = no evidence of readiness)
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      digitalSafeguardingCount: 0,
      digitalSafeguardingRate: 0,
      imageConsentProcessCount: 0,
      imageConsentProcessRate: 0,
      socialMediaRisksCount: 0,
      socialMediaRisksRate: 0,
      cyberbullyingResponseCount: 0,
      cyberbullyingResponseRate: 0,
      dataProtectionCount: 0,
      dataProtectionRate: 0,
      onlineGroomingAwarenessCount: 0,
      onlineGroomingAwarenessRate: 0,
      overallTrainedCount: 0,
      overallTrainedRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff digital training records — staff readiness for digital safeguarding cannot be assessed"],
    };
  }

  // Digital safeguarding: max 6
  const digitalSafeguardingCount = training.filter((t) => t.digitalSafeguarding).length;
  const digitalSafeguardingRate = pct(digitalSafeguardingCount, totalStaff);

  // Image consent process: max 5
  const imageConsentProcessCount = training.filter((t) => t.imageConsentProcess).length;
  const imageConsentProcessRate = pct(imageConsentProcessCount, totalStaff);

  // Social media risks: max 4
  const socialMediaRisksCount = training.filter((t) => t.socialMediaRisks).length;
  const socialMediaRisksRate = pct(socialMediaRisksCount, totalStaff);

  // Cyberbullying response: max 4
  const cyberbullyingResponseCount = training.filter((t) => t.cyberbullyingResponse).length;
  const cyberbullyingResponseRate = pct(cyberbullyingResponseCount, totalStaff);

  // Data protection: max 3
  const dataProtectionCount = training.filter((t) => t.dataProtection).length;
  const dataProtectionRate = pct(dataProtectionCount, totalStaff);

  // Online grooming awareness: max 3
  const onlineGroomingAwarenessCount = training.filter((t) => t.onlineGroomingAwareness).length;
  const onlineGroomingAwarenessRate = pct(onlineGroomingAwarenessCount, totalStaff);

  // Overall trained (all 6 competencies)
  const overallTrainedCount = training.filter(
    (t) =>
      t.digitalSafeguarding &&
      t.imageConsentProcess &&
      t.socialMediaRisks &&
      t.cyberbullyingResponse &&
      t.dataProtection &&
      t.onlineGroomingAwareness,
  ).length;
  const overallTrainedRate = pct(overallTrainedCount, totalStaff);

  // Score (out of 25)
  let score = 0;
  // Digital safeguarding: max 6
  score += (digitalSafeguardingRate / 100) * 6;
  // Image consent process: max 5
  score += (imageConsentProcessRate / 100) * 5;
  // Social media risks: max 4
  score += (socialMediaRisksRate / 100) * 4;
  // Cyberbullying response: max 4
  score += (cyberbullyingResponseRate / 100) * 4;
  // Data protection: max 3
  score += (dataProtectionRate / 100) * 3;
  // Online grooming awareness: max 3
  score += (onlineGroomingAwarenessRate / 100) * 3;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (digitalSafeguardingRate >= 90) {
    strengths.push("Excellent digital safeguarding training: " + digitalSafeguardingRate + "% of staff trained");
  } else if (digitalSafeguardingRate < 70) {
    concerns.push("Digital safeguarding training at " + digitalSafeguardingRate + "% — staff may not recognise online risks");
  }

  if (imageConsentProcessRate >= 90) {
    strengths.push("Image consent process training at " + imageConsentProcessRate + "% — staff understand consent requirements");
  } else if (imageConsentProcessRate < 70) {
    concerns.push("Image consent process training at " + imageConsentProcessRate + "% — risk of non-compliant image sharing");
  }

  if (socialMediaRisksRate >= 90) {
    strengths.push("Social media risk awareness at " + socialMediaRisksRate + "% — staff can identify online dangers");
  } else if (socialMediaRisksRate < 70) {
    concerns.push("Social media risk training at " + socialMediaRisksRate + "% — gaps in identifying online dangers");
  }

  if (cyberbullyingResponseRate >= 90) {
    strengths.push("Cyberbullying response training at " + cyberbullyingResponseRate + "% — staff prepared to intervene");
  } else if (cyberbullyingResponseRate < 70) {
    concerns.push("Cyberbullying response training at " + cyberbullyingResponseRate + "% — staff may not respond effectively");
  }

  if (onlineGroomingAwarenessRate >= 90) {
    strengths.push("Online grooming awareness at " + onlineGroomingAwarenessRate + "% — critical safeguarding knowledge in place");
  } else if (onlineGroomingAwarenessRate < 70) {
    concerns.push("Online grooming awareness at " + onlineGroomingAwarenessRate + "% — staff may miss grooming indicators");
  }

  if (overallTrainedRate === 100) {
    strengths.push("100% of staff fully trained across all digital safeguarding competencies");
  } else if (overallTrainedRate < 50) {
    concerns.push("Only " + overallTrainedRate + "% of staff have complete digital training — significant training gap");
  }

  return {
    totalStaff,
    digitalSafeguardingCount,
    digitalSafeguardingRate,
    imageConsentProcessCount,
    imageConsentProcessRate,
    socialMediaRisksCount,
    socialMediaRisksRate,
    cyberbullyingResponseCount,
    cyberbullyingResponseRate,
    dataProtectionCount,
    dataProtectionRate,
    onlineGroomingAwarenessCount,
    onlineGroomingAwarenessRate,
    overallTrainedCount,
    overallTrainedRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Digital Profiles ────────────────────────────────────────

export function buildChildDigitalProfiles(
  consents: ImageConsentRecord[],
  incidents: DigitalSafetyIncident[],
): ChildDigitalProfile[] {
  // Collect all unique children from consents and incidents
  const childMap = new Map<string, { childId: string; childName: string }>();

  for (const consent of consents) {
    if (!childMap.has(consent.childId)) {
      childMap.set(consent.childId, { childId: consent.childId, childName: consent.childName });
    }
  }
  for (const incident of incidents) {
    if (!childMap.has(incident.childId)) {
      childMap.set(incident.childId, { childId: incident.childId, childName: incident.childName });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const childConsents = consents.filter((c) => c.childId === child.childId);
    const childIncidents = incidents.filter((i) => i.childId === child.childId);

    const totalConsents = childConsents.length;
    const activeConsents = childConsents.filter(
      (c) => c.consentStatus === "granted",
    ).length;
    const refusedConsents = childConsents.filter(
      (c) => c.consentStatus === "refused" || c.consentStatus === "withdrawn",
    ).length;
    const pendingConsents = childConsents.filter(
      (c) => c.consentStatus === "pending" || c.consentStatus === "not_requested",
    ).length;
    const childConsulted = childConsents.some((c) => c.childConsulted);

    const totalIncidents = childIncidents.length;
    const highCriticalIncidents = childIncidents.filter(
      (i) => i.severity === "high" || i.severity === "critical",
    ).length;

    // Digital safety score 0-10
    let digitalSafetyScore = 10;
    // Deduct for incidents
    digitalSafetyScore -= Math.min(3, totalIncidents);
    // Deduct for high/critical incidents
    digitalSafetyScore -= Math.min(3, highCriticalIncidents * 2);
    // Deduct if child not consulted on consent
    if (!childConsulted && totalConsents > 0) digitalSafetyScore -= 1;
    // Deduct for pending consents
    if (pendingConsents > 0) digitalSafetyScore -= 1;
    // Deduct if no consents at all
    if (totalConsents === 0) digitalSafetyScore -= 2;

    digitalSafetyScore = clamp(digitalSafetyScore, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalConsents,
      activeConsents,
      refusedConsents,
      pendingConsents,
      childConsulted,
      totalIncidents,
      highCriticalIncidents,
      digitalSafetyScore,
    };
  });
}

// ── Generate Social Media Digital Footprint Intelligence ────────────────

export function generateSocialMediaDigitalFootprintIntelligence(
  consents: ImageConsentRecord[],
  incidents: DigitalSafetyIncident[],
  policies: DigitalSafetyPolicy[],
  training: StaffDigitalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SocialMediaDigitalFootprintIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter incidents to period
  const periodIncidents = incidents.filter(
    (i) => withinPeriod(i.incidentDate, periodStart, periodEnd),
  );

  // Evaluate each layer
  const consentManagement = evaluateConsentManagement(consents);
  const digitalIncidentResponse = evaluateDigitalIncidentResponse(periodIncidents);
  const digitalPolicy = evaluateDigitalPolicy(policies);
  const staffDigitalReadiness = evaluateStaffDigitalReadiness(training);

  // Build child profiles
  const childProfiles = buildChildDigitalProfiles(consents, periodIncidents);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      consentManagement.score +
      digitalIncidentResponse.score +
      digitalPolicy.score +
      staffDigitalReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    consentManagement, digitalIncidentResponse, digitalPolicy, staffDigitalReadiness, overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    consentManagement, digitalIncidentResponse, digitalPolicy, staffDigitalReadiness, overallScore,
  );
  const actions = generateActions(
    consentManagement, digitalIncidentResponse, digitalPolicy, staffDigitalReadiness, childProfiles, periodIncidents,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    consentManagement,
    digitalIncidentResponse,
    digitalPolicy,
    staffDigitalReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  consent: ConsentManagementResult,
  incident: DigitalIncidentResponseResult,
  policy: DigitalPolicyResult,
  staff: StaffDigitalReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall digital footprint protection rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall digital footprint protection rated Good (" + overallScore + "/100)");
  }

  // Pick top strengths from each area (max 2 per area)
  strengths.push(...consent.strengths.slice(0, 2));
  strengths.push(...incident.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  consent: ConsentManagementResult,
  incident: DigitalIncidentResponseResult,
  policy: DigitalPolicyResult,
  staff: StaffDigitalReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall digital footprint protection rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall digital footprint protection Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...consent.concerns);
  areas.push(...incident.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  consent: ConsentManagementResult,
  incident: DigitalIncidentResponseResult,
  policy: DigitalPolicyResult,
  staff: StaffDigitalReadinessResult,
  childProfiles: ChildDigitalProfile[],
  incidents: DigitalSafetyIncident[],
): string[] {
  const actions: string[] = [];

  // Critical incidents
  if (incident.severityBreakdown.critical > 0) {
    actions.push("URGENT: " + incident.severityBreakdown.critical + " critical digital safety incident(s) — convene safeguarding review within 24 hours");
  }

  // Grooming incidents
  if (incident.categoryBreakdown.grooming > 0) {
    actions.push("URGENT: " + incident.categoryBreakdown.grooming + " online grooming incident(s) — immediate multi-agency referral required per KCSIE 2024");
  }

  // Children at risk (low digital safety score)
  const atRiskChildren = childProfiles.filter((p) => p.digitalSafetyScore <= 4);
  if (atRiskChildren.length > 0) {
    actions.push("URGENT: " + atRiskChildren.length + " child(ren) with low digital safety scores — arrange individual digital safety planning");
  }

  // No policies
  if (policy.totalPolicies === 0) {
    actions.push("URGENT: No digital safety policies — develop and implement policies immediately");
  }

  // Missing consent records
  if (consent.totalConsents === 0) {
    actions.push("URGENT: No image consent records — establish consent management system immediately");
  }

  // Policy not current
  if (!policy.policyCurrent && policy.totalPolicies > 0) {
    actions.push("HIGH: Digital safety policy not current — schedule review and update");
  }

  // Low staff training
  if (staff.overallTrainedRate < 50 && staff.totalStaff > 0) {
    actions.push("HIGH: Only " + staff.overallTrainedRate + "% of staff fully trained in digital safeguarding — schedule comprehensive training programme");
  }

  // Low consent decision rate
  if (consent.activeDecisionRate < 70 && consent.totalConsents > 0) {
    actions.push("HIGH: Only " + consent.activeDecisionRate + "% of consents have an active decision — review and complete outstanding consent requests");
  }

  // Low timely reporting
  if (incident.timelyReportingRate < 70 && incident.totalIncidents > 0) {
    actions.push("MEDIUM: Timely reporting at " + incident.timelyReportingRate + "% — review incident reporting procedures");
  }

  // Identity exposure or data breach
  if (incident.categoryBreakdown.identity_exposure > 0) {
    actions.push("HIGH: " + incident.categoryBreakdown.identity_exposure + " identity exposure incident(s) — review digital footprint protection measures");
  }

  if (incident.categoryBreakdown.data_breach > 0) {
    actions.push("URGENT: " + incident.categoryBreakdown.data_breach + " data breach incident(s) — notify ICO if required under UK GDPR");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Digital safeguarding systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "Data Protection Act 2018 (UK GDPR) — Lawful processing of children's personal data and images",
    "KCSIE 2024 — Online safety and digital safeguarding guidance",
    "CHR 2015, Reg 12 — Safeguarding: protecting children from online harm",
    "SCCIF — How well children are helped and protected (digital safety)",
    "UNCRC Article 16 — Right to privacy including digital privacy",
    "Children Act 1989 — Welfare of the child in digital contexts",
    "Online Safety Act 2023 — Duties regarding children's online safety",
  ];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

const consentTypeLabels: Record<ConsentType, string> = {
  photo: "Photo",
  video: "Video",
  social_media: "Social Media",
  website: "Website",
  newsletter: "Newsletter",
  press: "Press",
  other: "Other",
};

export function getConsentTypeLabel(type: ConsentType): string {
  return consentTypeLabels[type];
}

const consentStatusLabels: Record<ConsentStatus, string> = {
  granted: "Granted",
  refused: "Refused",
  withdrawn: "Withdrawn",
  not_requested: "Not Requested",
  pending: "Pending",
};

export function getConsentStatusLabel(status: ConsentStatus): string {
  return consentStatusLabels[status];
}

const riskCategoryLabels: Record<RiskCategory, string> = {
  identity_exposure: "Identity Exposure",
  location_disclosure: "Location Disclosure",
  cyberbullying: "Cyberbullying",
  grooming: "Grooming",
  inappropriate_content: "Inappropriate Content",
  data_breach: "Data Breach",
  other: "Other",
};

export function getRiskCategoryLabel(category: RiskCategory): string {
  return riskCategoryLabels[category];
}

const severityLabels: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function getSeverityLabel(severity: IncidentSeverity): string {
  return severityLabels[severity];
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}
