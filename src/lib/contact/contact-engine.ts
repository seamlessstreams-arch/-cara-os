/* ──────────────────────────────────────────────────────────────
   Contact Intelligence Engine

   Pure deterministic engine for evaluating how well a children's
   residential home manages contact between looked-after children
   and their birth families, significant others, and professionals.

   Tracks scheduling, quality, compliance, policy, and staff
   readiness across all contact types.

   Regulatory basis:
     - CHR 2015 Reg 7 — Children's wishes and feelings (contact preferences)
     - CHR 2015 Reg 14 — Care planning (contact arrangements in care plan)
     - CHR 2015 Reg 5 — Quality and purpose of care (maintaining relationships)
     - SCCIF — Relationships with family, contact quality
     - Children Act 1989 s.34 — Contact with children in care
     - Care Planning Regulations 2010 — Contact plans
     - UN Convention on the Rights of the Child Article 9 — Right to maintain contact

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactCategory =
  | "family_visit"
  | "phone_call"
  | "video_call"
  | "supervised_contact"
  | "unsupervised_contact"
  | "letterbox_contact"
  | "professional_meeting"
  | "sibling_contact";

export type ContactOutcome =
  | "completed"
  | "partially_completed"
  | "not_completed"
  | "cancelled"
  | "rescheduled";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const contactCategoryLabels: Record<ContactCategory, string> = {
  family_visit: "Family Visit",
  phone_call: "Phone Call",
  video_call: "Video Call",
  supervised_contact: "Supervised Contact",
  unsupervised_contact: "Unsupervised Contact",
  letterbox_contact: "Letterbox Contact",
  professional_meeting: "Professional Meeting",
  sibling_contact: "Sibling Contact",
};

const contactOutcomeLabels: Record<ContactOutcome, string> = {
  completed: "Completed",
  partially_completed: "Partially Completed",
  not_completed: "Not Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getCategoryLabel(category: ContactCategory): string {
  return contactCategoryLabels[category];
}

export function getOutcomeLabel(outcome: ContactOutcome): string {
  return contactOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── All Categories (for diversity calculation) ─────────────────────────────

const ALL_CATEGORIES: ContactCategory[] = [
  "family_visit",
  "phone_call",
  "video_call",
  "supervised_contact",
  "unsupervised_contact",
  "letterbox_contact",
  "professional_meeting",
  "sibling_contact",
];

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ContactRecord {
  id: string;
  childId: string;
  childName: string;
  contactDate: string;
  category: ContactCategory;
  childPrepared: boolean;
  contactPlanFollowed: boolean;
  childViewCaptured: boolean;
  safetyMeasuresInPlace: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface ContactPolicy {
  id: string;
  contactPolicy: boolean;
  supervisedContactGuidelines: boolean;
  riskAssessmentProtocol: boolean;
  childParticipationFramework: boolean;
  familyEngagementStrategy: boolean;
  emergencyContactProcedure: boolean;
  reviewSchedule: boolean;
}

export interface StaffContactTraining {
  id: string;
  staffId: string;
  staffName: string;
  contactSupervision: boolean;
  safeguardingAwareness: boolean;
  childCommunication: boolean;
  familyMediation: boolean;
  riskManagement: boolean;
  recordKeeping: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContactQualityResult {
  totalRecords: number;
  childPreparedRate: number;
  contactPlanFollowedRate: number;
  childViewCapturedRate: number;
  safetyMeasuresRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ContactComplianceResult {
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  completedOutcomeRate: number;
  categoryDiversityRate: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ContactPolicyResult {
  contactPolicy: boolean;
  supervisedContactGuidelines: boolean;
  riskAssessmentProtocol: boolean;
  childParticipationFramework: boolean;
  familyEngagementStrategy: boolean;
  emergencyContactProcedure: boolean;
  reviewSchedule: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffContactReadinessResult {
  totalStaff: number;
  contactSupervisionRate: number;
  safeguardingAwarenessRate: number;
  childCommunicationRate: number;
  familyMediationRate: number;
  riskManagementRate: number;
  recordKeepingRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildContactProfile {
  childId: string;
  childName: string;
  totalContacts: number;
  childPreparedRate: number;
  childViewCapturedRate: number;
  uniqueCategories: number;
  contactScore: number;
}

export interface ContactIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  contactQuality: ContactQualityResult;
  contactCompliance: ContactComplianceResult;
  contactPolicy: ContactPolicyResult;
  staffReadiness: StaffContactReadinessResult;
  childProfiles: ChildContactProfile[];
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

// ── Evaluator 1: Contact Quality (0-25) ──────────────────────────────────

export function evaluateContactQuality(
  records: ContactRecord[],
): ContactQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      childPreparedRate: 0,
      contactPlanFollowedRate: 0,
      childViewCapturedRate: 0,
      safetyMeasuresRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No contact records found — contact quality cannot be assessed"],
    };
  }

  const preparedCount = records.filter((r) => r.childPrepared).length;
  const childPreparedRate = pct(preparedCount, totalRecords);

  const planFollowedCount = records.filter((r) => r.contactPlanFollowed).length;
  const contactPlanFollowedRate = pct(planFollowedCount, totalRecords);

  const viewCapturedCount = records.filter((r) => r.childViewCaptured).length;
  const childViewCapturedRate = pct(viewCapturedCount, totalRecords);

  const safetyCount = records.filter((r) => r.safetyMeasuresInPlace).length;
  const safetyMeasuresRate = pct(safetyCount, totalRecords);

  // Weights: childPreparedRate 7 + contactPlanFollowedRate 6 + childViewCapturedRate 6 + safetyMeasuresRate 6 = 25
  let score = 0;
  score += (childPreparedRate / 100) * 7;
  score += (contactPlanFollowedRate / 100) * 6;
  score += (childViewCapturedRate / 100) * 6;
  score += (safetyMeasuresRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (childPreparedRate >= 80) {
    strengths.push("Strong child preparation: " + childPreparedRate + "% of children prepared before contact");
  } else if (childPreparedRate < 50) {
    concerns.push("Child preparation rate at " + childPreparedRate + "% — children not consistently prepared for contact");
  }

  if (contactPlanFollowedRate >= 80) {
    strengths.push("Excellent contact plan adherence: " + contactPlanFollowedRate + "% of sessions followed the contact plan");
  } else if (contactPlanFollowedRate < 50) {
    concerns.push("Contact plan adherence at " + contactPlanFollowedRate + "% — plans not consistently followed");
  }

  if (childViewCapturedRate >= 80) {
    strengths.push("Good child voice capture: " + childViewCapturedRate + "% of contacts recorded child's views");
  } else if (childViewCapturedRate < 50) {
    concerns.push("Child view capture rate at " + childViewCapturedRate + "% — child's voice not consistently recorded");
  }

  if (safetyMeasuresRate >= 80) {
    strengths.push("Strong safety compliance: " + safetyMeasuresRate + "% of contacts had safety measures in place");
  } else if (safetyMeasuresRate < 50) {
    concerns.push("Safety measures rate at " + safetyMeasuresRate + "% — safety arrangements not consistently in place");
  }

  return {
    totalRecords,
    childPreparedRate,
    contactPlanFollowedRate,
    childViewCapturedRate,
    safetyMeasuresRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Contact Compliance (0-25) ───────────────────────────────

export function evaluateContactCompliance(
  records: ContactRecord[],
): ContactComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      documentationCompleteRate: 0,
      timelyRecordingRate: 0,
      completedOutcomeRate: 0,
      categoryDiversityRate: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No contact records found — compliance cannot be assessed"],
    };
  }

  const docCompleteCount = records.filter((r) => r.documentationComplete).length;
  const documentationCompleteRate = pct(docCompleteCount, totalRecords);

  const timelyCount = records.filter((r) => r.timelyRecording).length;
  const timelyRecordingRate = pct(timelyCount, totalRecords);

  // completedOutcomeRate: percentage of records with both quality indicators true
  const completedCount = records.filter((r) => r.childPrepared && r.contactPlanFollowed).length;
  const completedOutcomeRate = pct(completedCount, totalRecords);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRate = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weights: documentationCompleteRate 8 + timelyRecordingRate 7 + completedOutcomeRate 5 + categoryDiversityRate 5 = 25
  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (completedOutcomeRate / 100) * 5;
  score += (categoryDiversityRate / 100) * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentationCompleteRate >= 90) {
    strengths.push("Excellent documentation: " + documentationCompleteRate + "% of contact records fully documented");
  } else if (documentationCompleteRate < 50) {
    concerns.push("Documentation rate at " + documentationCompleteRate + "% — contact records incomplete");
  }

  if (timelyRecordingRate >= 90) {
    strengths.push("Timely recording: " + timelyRecordingRate + "% of contacts recorded promptly");
  } else if (timelyRecordingRate < 50) {
    concerns.push("Timely recording rate at " + timelyRecordingRate + "% — records not completed promptly");
  }

  if (completedOutcomeRate >= 80) {
    strengths.push("High completion quality: " + completedOutcomeRate + "% of contacts fully completed with preparation and plan adherence");
  } else if (completedOutcomeRate < 50) {
    concerns.push("Completion quality at " + completedOutcomeRate + "% — contacts not consistently meeting quality standards");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive contact coverage: " + uniqueCategories + " of " + ALL_CATEGORIES.length + " contact types represented");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " contact type(s) recorded — limited variety of contact arrangements");
  }

  return {
    totalRecords,
    documentationCompleteRate,
    timelyRecordingRate,
    completedOutcomeRate,
    categoryDiversityRate,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Contact Policy (0-25) ───────────────────────────────────

export function evaluateContactPolicy(
  policy: ContactPolicy | null,
): ContactPolicyResult {
  if (policy === null) {
    return {
      contactPolicy: false,
      supervisedContactGuidelines: false,
      riskAssessmentProtocol: false,
      childParticipationFramework: false,
      familyEngagementStrategy: false,
      emergencyContactProcedure: false,
      reviewSchedule: false,
      score: 0,
      strengths: [],
      concerns: ["No contact policy in place — URGENT: develop comprehensive contact policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.contactPolicy) score += 4;
  if (policy.supervisedContactGuidelines) score += 4;
  if (policy.riskAssessmentProtocol) score += 4;
  if (policy.childParticipationFramework) score += 4;
  if (policy.familyEngagementStrategy) score += 3;
  if (policy.emergencyContactProcedure) score += 3;
  if (policy.reviewSchedule) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.contactPolicy,
    policy.supervisedContactGuidelines,
    policy.riskAssessmentProtocol,
    policy.childParticipationFramework,
    policy.familyEngagementStrategy,
    policy.emergencyContactProcedure,
    policy.reviewSchedule,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete contact policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 contact policy components in place");
  }

  if (!policy.contactPolicy) {
    concerns.push("No contact policy — staff may be unclear about contact arrangements and expectations");
  }
  if (!policy.supervisedContactGuidelines) {
    concerns.push("No supervised contact guidelines — supervision standards may be inconsistent");
  }
  if (!policy.riskAssessmentProtocol) {
    concerns.push("No risk assessment protocol — contact risks may not be properly identified");
  }
  if (!policy.childParticipationFramework) {
    concerns.push("No child participation framework — children may not be involved in contact decisions");
  }
  if (!policy.familyEngagementStrategy) {
    concerns.push("No family engagement strategy — families may not be effectively supported");
  }
  if (!policy.emergencyContactProcedure) {
    concerns.push("No emergency contact procedure — unclear response for contact emergencies");
  }
  if (!policy.reviewSchedule) {
    concerns.push("No review schedule — contact arrangements may become outdated");
  }

  return {
    contactPolicy: policy.contactPolicy,
    supervisedContactGuidelines: policy.supervisedContactGuidelines,
    riskAssessmentProtocol: policy.riskAssessmentProtocol,
    childParticipationFramework: policy.childParticipationFramework,
    familyEngagementStrategy: policy.familyEngagementStrategy,
    emergencyContactProcedure: policy.emergencyContactProcedure,
    reviewSchedule: policy.reviewSchedule,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Contact Readiness (0-25) ─────────────────────────

export function evaluateStaffContactReadiness(
  staff: StaffContactTraining[],
): StaffContactReadinessResult {
  const totalStaff = staff.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      contactSupervisionRate: 0,
      safeguardingAwarenessRate: 0,
      childCommunicationRate: 0,
      familyMediationRate: 0,
      riskManagementRate: 0,
      recordKeepingRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule contact training for all staff"],
    };
  }

  const supervisionCount = staff.filter((s) => s.contactSupervision).length;
  const contactSupervisionRate = pct(supervisionCount, totalStaff);

  const safeguardingCount = staff.filter((s) => s.safeguardingAwareness).length;
  const safeguardingAwarenessRate = pct(safeguardingCount, totalStaff);

  const communicationCount = staff.filter((s) => s.childCommunication).length;
  const childCommunicationRate = pct(communicationCount, totalStaff);

  const mediationCount = staff.filter((s) => s.familyMediation).length;
  const familyMediationRate = pct(mediationCount, totalStaff);

  const riskCount = staff.filter((s) => s.riskManagement).length;
  const riskManagementRate = pct(riskCount, totalStaff);

  const recordCount = staff.filter((s) => s.recordKeeping).length;
  const recordKeepingRate = pct(recordCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (contactSupervisionRate / 100) * 6;
  score += (safeguardingAwarenessRate / 100) * 5;
  score += (childCommunicationRate / 100) * 5;
  score += (familyMediationRate / 100) * 4;
  score += (riskManagementRate / 100) * 3;
  score += (recordKeepingRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (contactSupervisionRate >= 80) {
    strengths.push("Strong contact supervision skills: " + contactSupervisionRate + "% of staff");
  } else if (contactSupervisionRate < 50) {
    concerns.push("Contact supervision skills at " + contactSupervisionRate + "% — foundational training needed");
  }

  if (safeguardingAwarenessRate >= 80) {
    strengths.push("Good safeguarding awareness: " + safeguardingAwarenessRate + "% of staff");
  } else if (safeguardingAwarenessRate < 50) {
    concerns.push("Safeguarding awareness at " + safeguardingAwarenessRate + "% — critical training gap");
  }

  if (childCommunicationRate >= 80) {
    strengths.push("Strong child communication skills: " + childCommunicationRate + "% of staff");
  } else if (childCommunicationRate < 50) {
    concerns.push("Child communication skills at " + childCommunicationRate + "% — staff may struggle to engage children during contact");
  }

  if (familyMediationRate >= 80) {
    strengths.push("Good family mediation competence: " + familyMediationRate + "% of staff");
  } else if (familyMediationRate < 50) {
    concerns.push("Family mediation skills at " + familyMediationRate + "% — staff may not manage family dynamics effectively");
  }

  if (riskManagementRate >= 80) {
    strengths.push("Strong risk management skills: " + riskManagementRate + "% of staff");
  } else if (riskManagementRate < 50) {
    concerns.push("Risk management skills at " + riskManagementRate + "% — contact risks may not be managed appropriately");
  }

  if (recordKeepingRate >= 80) {
    strengths.push("Good record keeping: " + recordKeepingRate + "% of staff competent in contact recording");
  } else if (recordKeepingRate < 50) {
    concerns.push("Record keeping skills at " + recordKeepingRate + "% — contact records may be incomplete");
  }

  return {
    totalStaff,
    contactSupervisionRate,
    safeguardingAwarenessRate,
    childCommunicationRate,
    familyMediationRate,
    riskManagementRate,
    recordKeepingRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Contact Profiles ─────────────────────────────────────────

export function buildChildContactProfiles(
  records: ContactRecord[],
): ChildContactProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: ContactRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalContacts = child.records.length;

    const preparedCount = child.records.filter((r) => r.childPrepared).length;
    const childPreparedRate = pct(preparedCount, totalContacts);

    const viewCount = child.records.filter((r) => r.childViewCaptured).length;
    const childViewCapturedRate = pct(viewCount, totalContacts);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 contacts -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalContacts >= 10) frequencyScore = 2;
    else if (totalContacts >= 5) frequencyScore = 1;

    // rate1 (childPreparedRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (childPreparedRate >= 80) rate1Score = 3;
    else if (childPreparedRate >= 60) rate1Score = 2;
    else if (childPreparedRate >= 40) rate1Score = 1;

    // rate2 (childViewCapturedRate): same thresholds
    let rate2Score = 0;
    if (childViewCapturedRate >= 80) rate2Score = 3;
    else if (childViewCapturedRate >= 60) rate2Score = 2;
    else if (childViewCapturedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const contactScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalContacts,
      childPreparedRate,
      childViewCapturedRate,
      uniqueCategories,
      contactScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateContactIntelligence(
  records: ContactRecord[],
  policy: ContactPolicy | null,
  staff: StaffContactTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ContactIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => r.contactDate >= periodStart && r.contactDate <= periodEnd,
  );

  // Evaluate each layer
  const contactQuality = evaluateContactQuality(periodRecords);
  const contactCompliance = evaluateContactCompliance(periodRecords);
  const contactPolicy = evaluateContactPolicy(policy);
  const staffReadiness = evaluateStaffContactReadiness(staff);

  // Build child profiles
  const childProfiles = buildChildContactProfiles(periodRecords);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      contactQuality.score +
      contactCompliance.score +
      contactPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    contactQuality, contactCompliance, contactPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    contactQuality, contactCompliance, contactPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    contactQuality, contactCompliance, contactPolicy, staffReadiness, childProfiles,
  );

  // Regulatory links
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    contactQuality,
    contactCompliance,
    contactPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ──────────────────────────────────────────────────

function aggregateStrengths(
  quality: ContactQualityResult,
  compliance: ContactComplianceResult,
  policy: ContactPolicyResult,
  staff: StaffContactReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall contact management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall contact management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Contact quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Contact compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Contact policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff contact readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: ContactQualityResult,
  compliance: ContactComplianceResult,
  policy: ContactPolicyResult,
  staff: StaffContactReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall contact management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall contact management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Contact quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Contact compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Contact policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff contact readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: ContactQualityResult,
  compliance: ContactComplianceResult,
  policy: ContactPolicyResult,
  staff: StaffContactReadinessResult,
  childProfiles: ChildContactProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No contact policy in place — develop and implement comprehensive contact policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff contact training records — schedule contact training for all staff immediately");
  }

  // Conditional on rates < 50
  if (quality.totalRecords > 0 && quality.childPreparedRate < 50) {
    actions.push("HIGH: Child preparation rate at " + quality.childPreparedRate + "% — embed preparation routines before all contact sessions");
  }

  if (quality.totalRecords > 0 && quality.childViewCapturedRate < 50) {
    actions.push("HIGH: Child view capture rate at " + quality.childViewCapturedRate + "% — ensure children's wishes are recorded for every contact");
  }

  if (compliance.totalRecords > 0 && compliance.documentationCompleteRate < 50) {
    actions.push("HIGH: Documentation rate at " + compliance.documentationCompleteRate + "% — strengthen contact recording practices");
  }

  if (compliance.totalRecords > 0 && compliance.timelyRecordingRate < 50) {
    actions.push("HIGH: Timely recording rate at " + compliance.timelyRecordingRate + "% — ensure records completed within 24 hours of contact");
  }

  if (quality.totalRecords > 0 && quality.contactPlanFollowedRate < 50) {
    actions.push("MEDIUM: Contact plan adherence at " + quality.contactPlanFollowedRate + "% — review contact plans with staff");
  }

  if (quality.totalRecords > 0 && quality.safetyMeasuresRate < 50) {
    actions.push("MEDIUM: Safety measures rate at " + quality.safetyMeasuresRate + "% — review and reinforce safety protocols");
  }

  if (staff.totalStaff > 0 && staff.contactSupervisionRate < 50) {
    actions.push("MEDIUM: Staff supervision skills at " + staff.contactSupervisionRate + "% — schedule refresher training on contact supervision");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.contactScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low contact scores — review individual contact arrangements");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Contact systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 7 — Children's wishes and feelings (contact preferences)",
    "CHR 2015 Regulation 14 — Care planning (contact arrangements in care plan)",
    "CHR 2015 Regulation 5 — Quality and purpose of care (maintaining relationships)",
    "SCCIF — Relationships with family, contact quality",
    "Children Act 1989 s.34 — Contact with children in care",
    "Care Planning Regulations 2010 — Contact plans",
    "UN Convention on the Rights of the Child Article 9 — Right to maintain contact",
  ];
}
