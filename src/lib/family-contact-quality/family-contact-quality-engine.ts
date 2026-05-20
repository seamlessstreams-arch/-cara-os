// Family Contact Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type Unions ───────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face_visit"
  | "video_call"
  | "phone_call"
  | "letter_email"
  | "supervised_contact"
  | "unsupervised_contact"
  | "family_activity"
  | "sibling_contact";

export type ContactOutcome =
  | "very_positive"
  | "positive"
  | "neutral"
  | "difficult"
  | "distressing";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ────────────────────────────────────────────────────────────

const contactTypeLabels: Record<ContactType, string> = {
  face_to_face_visit: "Face-to-Face Visit",
  video_call: "Video Call",
  phone_call: "Phone Call",
  letter_email: "Letter / Email",
  supervised_contact: "Supervised Contact",
  unsupervised_contact: "Unsupervised Contact",
  family_activity: "Family Activity",
  sibling_contact: "Sibling Contact",
};

const contactOutcomeLabels: Record<ContactOutcome, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  difficult: "Difficult",
  distressing: "Distressing",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getContactTypeLabel(type: ContactType): string {
  return contactTypeLabels[type];
}

export function getContactOutcomeLabel(outcome: ContactOutcome): string {
  return contactOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

export function getContactTypeLabels(): Record<ContactType, string> {
  return { ...contactTypeLabels };
}

export function getContactOutcomeLabels(): Record<ContactOutcome, string> {
  return { ...contactOutcomeLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Input Interfaces ──────────────────────────────────────────────────────

export interface FamilyContact {
  id: string;
  childId: string;
  childName: string;
  contactDate: string;
  contactType: ContactType;
  contactOutcome: ContactOutcome;
  childPrepared: boolean;
  childConsulted: boolean;
  supportProvided: boolean;
  documentedInPlan: boolean;
  staffSupervised: boolean;
  feedbackRecorded: boolean;
}

export interface FamilyContactPolicy {
  id: string;
  contactPromotionStrategy: boolean;
  safeguardingProtocol: boolean;
  supervisedContactProcedure: boolean;
  letteringAndPhonePolicy: boolean;
  siblingContactFramework: boolean;
  familyEngagementPlan: boolean;
  regularReview: boolean;
}

export interface StaffFamilyContactTraining {
  id: string;
  staffId: string;
  staffName: string;
  familyDynamicsAwareness: boolean;
  contactSupervision: boolean;
  safeguardingInContact: boolean;
  childPreparationSkills: boolean;
  conflictManagement: boolean;
  recordKeeping: boolean;
}

// ── Result Interfaces ─────────────────────────────────────────────────────

export interface FamilyContactQualityResult {
  overallScore: number;
  totalContacts: number;
  positiveOutcomeRate: number;
  childPreparedRate: number;
  childConsultedRate: number;
  supportRate: number;
}

export interface FamilyContactComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupervisedRate: number;
  feedbackRate: number;
  contactTypeDiversityRatio: number;
}

export interface FamilyContactPolicyResult {
  overallScore: number;
  contactPromotionStrategy: boolean;
  safeguardingProtocol: boolean;
  supervisedContactProcedure: boolean;
  letteringAndPhonePolicy: boolean;
  siblingContactFramework: boolean;
  familyEngagementPlan: boolean;
  regularReview: boolean;
}

export interface StaffFamilyContactReadinessResult {
  overallScore: number;
  totalStaff: number;
  familyDynamicsAwarenessRate: number;
  contactSupervisionRate: number;
  safeguardingInContactRate: number;
  childPreparationSkillsRate: number;
  conflictManagementRate: number;
  recordKeepingRate: number;
}

export interface ChildFamilyContactProfile {
  childId: string;
  childName: string;
  totalContacts: number;
  positiveOutcomeRate: number;
  preparedRate: number;
  overallScore: number;
}

export interface FamilyContactQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  familyContactQuality: FamilyContactQualityResult;
  familyContactCompliance: FamilyContactComplianceResult;
  familyContactPolicy: FamilyContactPolicyResult;
  staffFamilyContactReadiness: StaffFamilyContactReadinessResult;
  childProfiles: ChildFamilyContactProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

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

// ── Evaluator 1: Family Contact Quality (0–25) ───────────────────────────

export function evaluateFamilyContactQuality(
  contacts: FamilyContact[],
): FamilyContactQualityResult {
  const total = contacts.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalContacts: 0,
      positiveOutcomeRate: 0,
      childPreparedRate: 0,
      childConsultedRate: 0,
      supportRate: 0,
    };
  }

  const positiveCount = contacts.filter(
    (c) => c.contactOutcome === "very_positive" || c.contactOutcome === "positive",
  ).length;
  const preparedCount = contacts.filter((c) => c.childPrepared).length;
  const consultedCount = contacts.filter((c) => c.childConsulted).length;
  const supportCount = contacts.filter((c) => c.supportProvided).length;

  const positiveOutcomeRate = pct(positiveCount, total);
  const childPreparedRate = pct(preparedCount, total);
  const childConsultedRate = pct(consultedCount, total);
  const supportRate = pct(supportCount, total);

  const score = Math.min(
    25,
    Math.round((positiveOutcomeRate / 100) * 7) +
      Math.round((childPreparedRate / 100) * 6) +
      Math.round((childConsultedRate / 100) * 6) +
      Math.round((supportRate / 100) * 6),
  );

  return {
    overallScore: score,
    totalContacts: total,
    positiveOutcomeRate,
    childPreparedRate,
    childConsultedRate,
    supportRate,
  };
}

// ── Evaluator 2: Family Contact Compliance (0–25) ────────────────────────

export function evaluateFamilyContactCompliance(
  contacts: FamilyContact[],
): FamilyContactComplianceResult {
  const total = contacts.length;

  if (total === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      staffSupervisedRate: 0,
      feedbackRate: 0,
      contactTypeDiversityRatio: 0,
    };
  }

  const documentedCount = contacts.filter((c) => c.documentedInPlan).length;
  const supervisedCount = contacts.filter((c) => c.staffSupervised).length;
  const feedbackCount = contacts.filter((c) => c.feedbackRecorded).length;

  const documentedRate = pct(documentedCount, total);
  const staffSupervisedRate = pct(supervisedCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const uniqueTypes = new Set(contacts.map((c) => c.contactType)).size;
  const contactTypeDiversityRatio = pct(uniqueTypes, 8);

  const score = Math.min(
    25,
    Math.round((documentedRate / 100) * 8) +
      Math.round((staffSupervisedRate / 100) * 7) +
      Math.round((feedbackRate / 100) * 5) +
      Math.round((contactTypeDiversityRatio / 100) * 5),
  );

  return {
    overallScore: score,
    documentedRate,
    staffSupervisedRate,
    feedbackRate,
    contactTypeDiversityRatio,
  };
}

// ── Evaluator 3: Family Contact Policy (0–25) ────────────────────────────

export function evaluateFamilyContactPolicy(
  policy: FamilyContactPolicy | null,
): FamilyContactPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    };
  }

  const score = Math.min(
    25,
    (policy.contactPromotionStrategy ? 4 : 0) +
      (policy.safeguardingProtocol ? 4 : 0) +
      (policy.supervisedContactProcedure ? 4 : 0) +
      (policy.letteringAndPhonePolicy ? 4 : 0) +
      (policy.siblingContactFramework ? 3 : 0) +
      (policy.familyEngagementPlan ? 3 : 0) +
      (policy.regularReview ? 3 : 0),
  );

  return {
    overallScore: score,
    contactPromotionStrategy: policy.contactPromotionStrategy,
    safeguardingProtocol: policy.safeguardingProtocol,
    supervisedContactProcedure: policy.supervisedContactProcedure,
    letteringAndPhonePolicy: policy.letteringAndPhonePolicy,
    siblingContactFramework: policy.siblingContactFramework,
    familyEngagementPlan: policy.familyEngagementPlan,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Family Contact Readiness (0–25) ───────────────────

export function evaluateStaffFamilyContactReadiness(
  training: StaffFamilyContactTraining[],
): StaffFamilyContactReadinessResult {
  const total = training.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      familyDynamicsAwarenessRate: 0,
      contactSupervisionRate: 0,
      safeguardingInContactRate: 0,
      childPreparationSkillsRate: 0,
      conflictManagementRate: 0,
      recordKeepingRate: 0,
    };
  }

  const familyDynamicsAwarenessRate = pct(
    training.filter((t) => t.familyDynamicsAwareness).length,
    total,
  );
  const contactSupervisionRate = pct(
    training.filter((t) => t.contactSupervision).length,
    total,
  );
  const safeguardingInContactRate = pct(
    training.filter((t) => t.safeguardingInContact).length,
    total,
  );
  const childPreparationSkillsRate = pct(
    training.filter((t) => t.childPreparationSkills).length,
    total,
  );
  const conflictManagementRate = pct(
    training.filter((t) => t.conflictManagement).length,
    total,
  );
  const recordKeepingRate = pct(
    training.filter((t) => t.recordKeeping).length,
    total,
  );

  const score = Math.min(
    25,
    Math.round((familyDynamicsAwarenessRate / 100) * 6) +
      Math.round((contactSupervisionRate / 100) * 5) +
      Math.round((safeguardingInContactRate / 100) * 5) +
      Math.round((childPreparationSkillsRate / 100) * 4) +
      Math.round((conflictManagementRate / 100) * 3) +
      Math.round((recordKeepingRate / 100) * 2),
  );

  return {
    overallScore: score,
    totalStaff: total,
    familyDynamicsAwarenessRate,
    contactSupervisionRate,
    safeguardingInContactRate,
    childPreparationSkillsRate,
    conflictManagementRate,
    recordKeepingRate,
  };
}

// ── Child Profiles ────────────────────────────────────────────────────────

export function buildChildFamilyContactProfiles(
  contacts: FamilyContact[],
): ChildFamilyContactProfile[] {
  const grouped = new Map<string, FamilyContact[]>();

  for (const c of contacts) {
    const existing = grouped.get(c.childId) ?? [];
    existing.push(c);
    grouped.set(c.childId, existing);
  }

  const profiles: ChildFamilyContactProfile[] = [];

  for (const [childId, childContacts] of grouped) {
    const childName = childContacts[0].childName;
    const totalContacts = childContacts.length;

    const positiveCount = childContacts.filter(
      (c) => c.contactOutcome === "very_positive" || c.contactOutcome === "positive",
    ).length;
    const positiveOutcomeRate = pct(positiveCount, totalContacts);

    const preparedCount = childContacts.filter((c) => c.childPrepared).length;
    const preparedRate = pct(preparedCount, totalContacts);

    const uniqueTypes = new Set(childContacts.map((c) => c.contactType)).size;

    // Score 0–10
    let score = 0;

    // Frequency
    if (totalContacts >= 10) score += 2;
    else if (totalContacts >= 5) score += 1;

    // Positive outcome
    if (positiveOutcomeRate >= 80) score += 3;
    else if (positiveOutcomeRate >= 60) score += 2;
    else if (positiveOutcomeRate >= 40) score += 1;

    // Prepared
    if (preparedRate >= 80) score += 3;
    else if (preparedRate >= 60) score += 2;
    else if (preparedRate >= 40) score += 1;

    // Diversity
    if (uniqueTypes >= 4) score += 2;
    else if (uniqueTypes >= 2) score += 1;

    score = Math.min(10, score);

    profiles.push({
      childId,
      childName,
      totalContacts,
      positiveOutcomeRate,
      preparedRate,
      overallScore: score,
    });
  }

  return profiles;
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateFamilyContactQualityIntelligence(
  contacts: FamilyContact[],
  policy: FamilyContactPolicy | null,
  training: StaffFamilyContactTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): FamilyContactQualityIntelligence {
  const familyContactQuality = evaluateFamilyContactQuality(contacts);
  const familyContactCompliance = evaluateFamilyContactCompliance(contacts);
  const familyContactPolicy = evaluateFamilyContactPolicy(policy);
  const staffFamilyContactReadiness = evaluateStaffFamilyContactReadiness(training);

  const rawScore =
    familyContactQuality.overallScore +
    familyContactCompliance.overallScore +
    familyContactPolicy.overallScore +
    staffFamilyContactReadiness.overallScore;

  const overallScore = Math.min(100, rawScore);
  const rating = getRating(overallScore);
  const childProfiles = buildChildFamilyContactProfiles(contacts);

  // Strengths
  const strengths: string[] = [];
  if (familyContactQuality.positiveOutcomeRate >= 80) {
    strengths.push("High rate of positive contact outcomes — children benefiting from family relationships");
  }
  if (familyContactQuality.childPreparedRate >= 80) {
    strengths.push("Children are consistently prepared for family contact — promoting emotional readiness");
  }
  if (familyContactQuality.childConsultedRate >= 80) {
    strengths.push("Strong child consultation practice — children's views are actively sought about contact");
  }
  if (familyContactCompliance.documentedRate >= 80) {
    strengths.push("Contact arrangements are well documented in care plans");
  }
  if (familyContactCompliance.staffSupervisedRate >= 80) {
    strengths.push("Staff supervision of contact is consistently maintained");
  }
  if (familyContactCompliance.feedbackRate >= 80) {
    strengths.push("Feedback is routinely recorded following contact sessions");
  }
  if (familyContactPolicy.overallScore >= 20) {
    strengths.push("Comprehensive family contact policy framework in place");
  }
  if (staffFamilyContactReadiness.overallScore >= 20) {
    strengths.push("Staff team demonstrates strong readiness to support family contact");
  }

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (familyContactQuality.positiveOutcomeRate < 60) {
    areasForImprovement.push("Positive contact outcome rate is below 60% — review contact planning and support arrangements");
  }
  if (familyContactQuality.childPreparedRate < 60) {
    areasForImprovement.push("Child preparation rate needs improvement — ensure children are prepared before contact");
  }
  if (familyContactQuality.childConsultedRate < 60) {
    areasForImprovement.push("Child consultation rate is low — ensure children's views shape contact arrangements");
  }
  if (familyContactCompliance.documentedRate < 60) {
    areasForImprovement.push("Documentation of contact in care plans needs improvement");
  }
  if (familyContactCompliance.staffSupervisedRate < 60) {
    areasForImprovement.push("Staff supervision during contact needs to be more consistent");
  }
  if (familyContactCompliance.feedbackRate < 60) {
    areasForImprovement.push("Feedback recording after contact sessions needs improvement");
  }
  if (familyContactPolicy.overallScore < 15) {
    areasForImprovement.push("Family contact policy framework has significant gaps — review and update");
  }
  if (staffFamilyContactReadiness.overallScore < 15) {
    areasForImprovement.push("Staff training in family contact areas requires improvement");
  }

  // Actions
  const actions: string[] = [];
  if (contacts.length === 0) {
    actions.push("URGENT: No family contact records found — review whether contact is being facilitated and recorded");
  }
  if (policy === null) {
    actions.push("URGENT: No family contact policy in place — develop and implement policy immediately");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff training records for family contact — arrange training programme");
  }
  if (familyContactQuality.supportRate < 60) {
    actions.push("HIGH: Increase support provision during family contact — review individual support needs");
  }
  if (familyContactCompliance.contactTypeDiversityRatio < 50) {
    actions.push("MEDIUM: Diversify contact types — consider video calls, family activities, and sibling contact");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 7 — Contact with family and friends",
    "CHR 2015 Regulation 14 — Arrangement for contact",
    "SCCIF — Experiences and progress of children (family contact)",
    "NMS 10 — Contact with family and friends",
    "Children Act 1989 Section 34 — Contact with children in care",
    "UNCRC Article 9 — Right to maintain contact with parents",
    "Care Planning Regulations 2010 — Contact arrangements",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    familyContactQuality,
    familyContactCompliance,
    familyContactPolicy,
    staffFamilyContactReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
