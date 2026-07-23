// ══════════════════════════════════════════════════════════════════════════════
// Cara — Communication & Accessibility Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses how effectively a children's home ensures all children can
// communicate their needs and access information, especially those with
// SEND, EAL, or communication difficulties.
//
// Maps to: SEND Code of Practice 2015, CHR 2015 Reg 7 (children's guide
// must be accessible), CHR 2015 Reg 11 (duty to ensure child's views are
// sought), Accessible Information Standard 2016, UNCRC Art 13 (freedom of
// expression), Equality Act 2010
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate, rateOf, weightedMeanOf } from "@/lib/metrics/rate";

// ── Types ────────────────────────────────────────────────────────────────────

export type CommunicationNeed =
  | "speech_language"
  | "hearing"
  | "visual"
  | "learning_disability"
  | "autism"
  | "eal"
  | "selective_mutism"
  | "emotional_barrier"
  | "other";

export type SupportType =
  | "speech_therapy"
  | "sign_language"
  | "visual_aids"
  | "easy_read"
  | "pictorial_communication"
  | "translation"
  | "interpreter"
  | "assistive_technology"
  | "social_stories"
  | "makaton";

export type AccessibleFormat =
  | "standard"
  | "easy_read"
  | "large_print"
  | "braille"
  | "audio"
  | "pictorial"
  | "translated"
  | "bsl_video";

export type EngagementLevel =
  | "fully_engaged"
  | "partially_engaged"
  | "minimally_engaged"
  | "not_engaged"
  | "unable_to_assess";

export type DocumentType =
  | "childrens_guide"
  | "complaints_procedure"
  | "house_rules"
  | "key_info"
  | "health_plan"
  | "care_plan";

export type TrainingType =
  | "deaf_awareness"
  | "autism_communication"
  | "makaton"
  | "easy_read_creation"
  | "eal_support"
  | "trauma_informed_communication";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate" | "unmeasured";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface ChildCommunicationProfile {
  childId: string;
  childName: string;
  communicationNeeds: CommunicationNeed[];
  primaryLanguage: string;
  interpreterRequired: boolean;
  currentSupports: SupportType[];
  speechTherapyAccess: boolean;
  lastSLTDate?: string;
  communicationPassport: boolean;
  staffTrainedInNeeds: boolean;
}

export interface CommunicationAssessment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  needsIdentified: CommunicationNeed[];
  supportsRecommended: SupportType[];
  supportsInPlace: SupportType[];
  engagementLevel: EngagementLevel;
  childView?: string;
}

export interface AccessibleDocument {
  id: string;
  homeId: string;
  documentType: DocumentType;
  formatsAvailable: AccessibleFormat[];
  lastUpdated: string;
}

export interface CommunicationTraining {
  staffId: string;
  staffName: string;
  trainingType: TrainingType;
  completionDate: string;
  expiryDate?: string;
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface NeedsAssessmentResult {
  totalChildren: number;
  childrenWithNeeds: number;
  childrenAssessed: number;
  assessmentRate: number | null;
  needsBreakdown: Record<string, number>;
  childrenWithCommunicationPassport: number;
  passportRate: number | null;
  childrenNotAssessed: string[];
  score: number | null;
}

export interface SupportProvisionResult {
  totalRecommendations: number;
  totalInPlace: number;
  supportMatchRate: number | null;
  childrenWithFullSupport: number;
  childrenWithPartialSupport: number;
  childrenWithNoSupport: number;
  speechTherapyAccessRate: number | null;
  interpreterProvisionRate: number | null;
  supportBreakdown: Record<string, number>;
  gaps: string[];
  score: number | null;
}

export interface AccessibleInformationResult {
  totalDocuments: number;
  documentsWithMultipleFormats: number;
  multipleFormatRate: number | null;
  keyDocumentsCovered: number;
  totalKeyDocumentTypes: number;
  // Denominator is the fixed list of statutory key documents, so this stays
  // measurable even when nothing has been recorded — 0 of 6 is a finding.
  keyDocumentCoverageRate: number;
  formatBreakdown: Record<string, number>;
  missingDocumentTypes: string[];
  score: number | null;
}

export interface StaffTrainingResult {
  totalStaff: number;
  staffWithRelevantTraining: number;
  trainingCoverageRate: number | null;
  trainingTypeBreakdown: Record<string, number>;
  expiredTraining: number;
  expiringWithin90Days: number;
  staffChildNeedsCoverage: number | null;
  score: number | null;
}

export interface ChildCommunicationSummary {
  childId: string;
  childName: string;
  communicationNeeds: CommunicationNeed[];
  primaryLanguage: string;
  interpreterRequired: boolean;
  assessed: boolean;
  engagementLevel?: EngagementLevel;
  supportsRecommended: SupportType[];
  supportsInPlace: SupportType[];
  supportMatchRate: number | null;
  hasCommunicationPassport: boolean;
  hasSpeechTherapyAccess: boolean;
  staffTrainedInNeeds: boolean;
  overallScore: number | null;
  concerns: string[];
}

export interface CommunicationAccessibilityIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number | null;
  rating: Rating;
  needsAssessment: NeedsAssessmentResult;
  supportProvision: SupportProvisionResult;
  accessibleInformation: AccessibleInformationResult;
  staffTraining: StaffTrainingResult;
  childSummaries: ChildCommunicationSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  needsAssessment: 25,
  supportProvision: 30,
  accessibleInformation: 25,
  staffTraining: 20,
} as const;

const KEY_DOCUMENT_TYPES: DocumentType[] = [
  "childrens_guide",
  "complaints_procedure",
  "house_rules",
  "key_info",
  "health_plan",
  "care_plan",
];

// ── Core Functions ──────────────────────────────────────────────────────────

export function evaluateNeedsAssessment(
  profiles: ChildCommunicationProfile[],
  assessments: CommunicationAssessment[],
  childIds: string[],
): NeedsAssessmentResult {
  const totalChildren = childIds.length;

  if (totalChildren === 0) {
    return {
      totalChildren: 0,
      childrenWithNeeds: 0,
      childrenAssessed: 0,
      assessmentRate: null,
      needsBreakdown: {},
      childrenWithCommunicationPassport: 0,
      passportRate: null,
      childrenNotAssessed: [],
      score: null,
    };
  }

  // Children with identified communication needs
  const childrenWithNeeds = profiles.filter(
    (p) => p.communicationNeeds.length > 0,
  ).length;

  // Children assessed (have at least one assessment)
  const assessedChildIds = new Set(assessments.map((a) => a.childId));
  const childrenAssessed = childIds.filter((id) => assessedChildIds.has(id)).length;
  const assessmentRate = rate(childrenAssessed, totalChildren);

  // Needs breakdown
  const needsBreakdown: Record<string, number> = {};
  for (const p of profiles) {
    for (const need of p.communicationNeeds) {
      needsBreakdown[need] = (needsBreakdown[need] || 0) + 1;
    }
  }

  // Communication passports
  const childrenWithCommunicationPassport = profiles.filter(
    (p) => p.communicationPassport,
  ).length;
  // Null when no child has a recorded communication need — that may mean no
  // passport is required, or that no needs have been recorded at all.
  const passportRate = rate(childrenWithCommunicationPassport, childrenWithNeeds);

  // Children not assessed
  const childrenNotAssessed = childIds.filter((id) => !assessedChildIds.has(id));

  // Score: assessment coverage (40%) + passport rate (30%) + needs identification depth (30%)
  // Needs identification: if there are children with needs, having them identified is positive
  const needsIdentification =
    childrenWithNeeds > 0
      ? Math.round(Math.min(childrenAssessed / childrenWithNeeds, 1) * 100)
      : assessmentRate; // fallback to assessment rate

  const score = weightedMeanOf([
    { score: assessmentRate, weight: 40 },
    { score: passportRate, weight: 30 },
    { score: needsIdentification, weight: 30 },
  ]);

  return {
    totalChildren,
    childrenWithNeeds,
    childrenAssessed,
    assessmentRate,
    needsBreakdown,
    childrenWithCommunicationPassport,
    passportRate,
    childrenNotAssessed,
    score,
  };
}

export function evaluateSupportProvision(
  profiles: ChildCommunicationProfile[],
  assessments: CommunicationAssessment[],
  childIds: string[],
): SupportProvisionResult {
  if (childIds.length === 0) {
    return {
      totalRecommendations: 0,
      totalInPlace: 0,
      supportMatchRate: null,
      childrenWithFullSupport: 0,
      childrenWithPartialSupport: 0,
      childrenWithNoSupport: 0,
      speechTherapyAccessRate: null,
      interpreterProvisionRate: null,
      supportBreakdown: {},
      gaps: [],
      score: null,
    };
  }

  // Get latest assessment per child
  const latestAssessmentByChild = new Map<string, CommunicationAssessment>();
  for (const a of assessments) {
    const existing = latestAssessmentByChild.get(a.childId);
    if (
      !existing ||
      a.assessmentDate > existing.assessmentDate
    ) {
      latestAssessmentByChild.set(a.childId, a);
    }
  }

  let totalRecommendations = 0;
  let totalInPlace = 0;
  let fullSupport = 0;
  let partialSupport = 0;
  let noSupport = 0;
  const supportBreakdown: Record<string, number> = {};
  const gaps: string[] = [];

  for (const [childId, assessment] of latestAssessmentByChild.entries()) {
    const recommended = assessment.supportsRecommended;
    const inPlace = assessment.supportsInPlace;
    totalRecommendations += recommended.length;
    totalInPlace += inPlace.length;

    for (const s of inPlace) {
      supportBreakdown[s] = (supportBreakdown[s] || 0) + 1;
    }

    if (recommended.length === 0) {
      fullSupport++;
      continue;
    }

    const missing = recommended.filter((r) => !inPlace.includes(r));
    if (missing.length === 0) {
      fullSupport++;
    } else if (missing.length < recommended.length) {
      partialSupport++;
      const profile = profiles.find((p) => p.childId === childId);
      const name = profile?.childName || assessment.childName || childId;
      gaps.push(
        `${name} is missing ${missing.length} recommended support(s): ${missing.map(getSupportTypeLabel).join(", ")}`,
      );
    } else {
      noSupport++;
      const profile = profiles.find((p) => p.childId === childId);
      const name = profile?.childName || assessment.childName || childId;
      gaps.push(
        `${name} has none of the ${recommended.length} recommended support(s) in place`,
      );
    }
  }

  const supportMatchRate = rate(totalInPlace, totalRecommendations);

  // Speech therapy access for children who need it
  const childrenNeedingSLT = profiles.filter((p) =>
    p.communicationNeeds.includes("speech_language"),
  );
  const speechTherapyAccessRate = rateOf(
    childrenNeedingSLT.filter((p) => p.speechTherapyAccess),
    childrenNeedingSLT,
  );

  // Interpreter provision for children who need it
  const childrenNeedingInterpreter = profiles.filter(
    (p) => p.interpreterRequired,
  );
  const interpreterProvisionRate = rateOf(
    childrenNeedingInterpreter.filter(
      (p) =>
        p.currentSupports.includes("interpreter") ||
        p.currentSupports.includes("translation"),
    ),
    childrenNeedingInterpreter,
  );

  // Score: support match (35%) + SLT access (25%) + interpreter (20%) + full support rate (20%)
  const fullSupportRate = rate(fullSupport, latestAssessmentByChild.size);

  const score = weightedMeanOf([
    { score: supportMatchRate, weight: 35 },
    { score: speechTherapyAccessRate, weight: 25 },
    { score: interpreterProvisionRate, weight: 20 },
    { score: fullSupportRate, weight: 20 },
  ]);

  return {
    totalRecommendations,
    totalInPlace,
    supportMatchRate,
    childrenWithFullSupport: fullSupport,
    childrenWithPartialSupport: partialSupport,
    childrenWithNoSupport: noSupport,
    speechTherapyAccessRate,
    interpreterProvisionRate,
    supportBreakdown,
    gaps,
    score,
  };
}

export function evaluateAccessibleInformation(
  documents: AccessibleDocument[],
): AccessibleInformationResult {
  if (documents.length === 0) {
    return {
      totalDocuments: 0,
      documentsWithMultipleFormats: 0,
      multipleFormatRate: null,
      keyDocumentsCovered: 0,
      totalKeyDocumentTypes: KEY_DOCUMENT_TYPES.length,
      keyDocumentCoverageRate: 0,
      formatBreakdown: {},
      missingDocumentTypes: KEY_DOCUMENT_TYPES.map(getDocumentTypeLabel),
      score: 0,
    };
  }

  // Documents with multiple formats (more than just standard)
  const docsWithMultipleFormats = documents.filter(
    (d) =>
      d.formatsAvailable.length > 1 ||
      (d.formatsAvailable.length === 1 &&
        d.formatsAvailable[0] !== "standard"),
  ).length;
  const multipleFormatRate = rate(docsWithMultipleFormats, documents.length);

  // Key document type coverage
  const coveredTypes = new Set(documents.map((d) => d.documentType));
  const keyDocumentsCovered = KEY_DOCUMENT_TYPES.filter((t) =>
    coveredTypes.has(t),
  ).length;
  const keyDocumentCoverageRate = Math.round(
    (keyDocumentsCovered / KEY_DOCUMENT_TYPES.length) * 100,
  );


  // Format breakdown
  const formatBreakdown: Record<string, number> = {};
  for (const d of documents) {
    for (const f of d.formatsAvailable) {
      formatBreakdown[f] = (formatBreakdown[f] || 0) + 1;
    }
  }

  // Missing document types
  const missingDocumentTypes = KEY_DOCUMENT_TYPES.filter(
    (t) => !coveredTypes.has(t),
  ).map(getDocumentTypeLabel);

  // Score: key doc coverage (40%) + multiple formats rate (35%) + format variety (25%)
  // Format variety: how many different accessible formats are available across docs
  const uniqueFormats = new Set<string>();
  for (const d of documents) {
    for (const f of d.formatsAvailable) {
      if (f !== "standard") uniqueFormats.add(f);
    }
  }
  // 7 possible non-standard formats; variety score based on how many are used
  const variety = Math.round(Math.min(uniqueFormats.size / 4, 1) * 100); // 4+ formats = full score

  const score = weightedMeanOf([
    { score: keyDocumentCoverageRate, weight: 40 },
    { score: multipleFormatRate, weight: 35 },
    { score: variety, weight: 25 },
  ]);

  return {
    totalDocuments: documents.length,
    documentsWithMultipleFormats: docsWithMultipleFormats,
    multipleFormatRate,
    keyDocumentsCovered,
    totalKeyDocumentTypes: KEY_DOCUMENT_TYPES.length,
    keyDocumentCoverageRate,
    formatBreakdown,
    missingDocumentTypes,
    score,
  };
}

export function evaluateStaffTraining(
  training: CommunicationTraining[],
  profiles: ChildCommunicationProfile[],
  staffIds: string[],
  referenceDate: string,
): StaffTrainingResult {
  const totalStaff = staffIds.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      staffWithRelevantTraining: 0,
      trainingCoverageRate: null,
      trainingTypeBreakdown: {},
      expiredTraining: 0,
      expiringWithin90Days: 0,
      staffChildNeedsCoverage: null,
      score: null,
    };
  }

  const refDate = new Date(referenceDate);
  const ninetyDaysFromRef = new Date(refDate);
  ninetyDaysFromRef.setDate(ninetyDaysFromRef.getDate() + 90);

  // Staff with at least one relevant, non-expired training
  const staffWithTraining = new Set<string>();
  let expiredCount = 0;
  let expiringCount = 0;
  const trainingTypeBreakdown: Record<string, number> = {};

  for (const t of training) {
    trainingTypeBreakdown[t.trainingType] =
      (trainingTypeBreakdown[t.trainingType] || 0) + 1;

    if (t.expiryDate) {
      const expiry = new Date(t.expiryDate);
      if (expiry < refDate) {
        expiredCount++;
        continue; // Don't count expired training as valid
      }
      if (expiry <= ninetyDaysFromRef) {
        expiringCount++;
      }
    }

    // Training is current (no expiry or not yet expired)
    if (staffIds.includes(t.staffId)) {
      staffWithTraining.add(t.staffId);
    }
  }

  const staffWithRelevantTraining = staffWithTraining.size;
  const trainingCoverageRate = rate(staffWithRelevantTraining, totalStaff);

  // Staff-child needs coverage: do staff have training matching children's needs?
  const neededTrainingTypes = new Set<TrainingType>();
  for (const p of profiles) {
    for (const need of p.communicationNeeds) {
      const matchingTraining = mapNeedToTraining(need);
      for (const tt of matchingTraining) {
        neededTrainingTypes.add(tt);
      }
    }
  }

  const coveredTrainingTypes = new Set<TrainingType>();
  for (const t of training) {
    if (t.expiryDate && new Date(t.expiryDate) < refDate) continue;
    coveredTrainingTypes.add(t.trainingType);
  }

  // Null when no child has a recorded need that maps to a training type — there
  // is nothing for staff training to have to cover.
  const staffChildNeedsCoverage = rate(
    [...neededTrainingTypes].filter((t) => coveredTrainingTypes.has(t)).length,
    neededTrainingTypes.size,
  );

  // Score: coverage rate (40%) + needs matching (35%) + training currency (25%)
  // Training currency: penalise for expired/expiring. Nothing to date when
  // there are no training records at all.
  const totalTrainingRecords = training.length;
  const currency =
    totalTrainingRecords > 0
      ? Math.round(
          Math.max(0, 1 - (expiredCount + expiringCount * 0.5) / totalTrainingRecords) * 100,
        )
      : null;

  const score = weightedMeanOf([
    { score: trainingCoverageRate, weight: 40 },
    { score: staffChildNeedsCoverage, weight: 35 },
    { score: currency, weight: 25 },
  ]);

  return {
    totalStaff,
    staffWithRelevantTraining,
    trainingCoverageRate,
    trainingTypeBreakdown,
    expiredTraining: expiredCount,
    expiringWithin90Days: expiringCount,
    staffChildNeedsCoverage,
    score,
  };
}

// ── Build Child Summaries ──────────────────────────────────────────────────

export function buildChildCommunicationSummaries(
  profiles: ChildCommunicationProfile[],
  assessments: CommunicationAssessment[],
  childIds: string[],
  childNames: Record<string, string>,
): ChildCommunicationSummary[] {
  return childIds.map((childId) => {
    const childName = childNames[childId] || childId;
    const profile = profiles.find((p) => p.childId === childId);
    const childAssessments = assessments
      .filter((a) => a.childId === childId)
      .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
    const latestAssessment = childAssessments.length > 0 ? childAssessments[0] : null;

    const communicationNeeds = profile?.communicationNeeds || [];
    const primaryLanguage = profile?.primaryLanguage || "English";
    const interpreterRequired = profile?.interpreterRequired || false;
    const assessed = latestAssessment !== null;
    const engagementLevel = latestAssessment?.engagementLevel;
    const supportsRecommended = latestAssessment?.supportsRecommended || [];
    const supportsInPlace = latestAssessment?.supportsInPlace || [];

    // Support match rate for this child — null when nothing was recommended
    const supportMatchRate = rateOf(
      supportsRecommended.filter((r) => supportsInPlace.includes(r)),
      supportsRecommended,
    );

    const hasCommunicationPassport = profile?.communicationPassport || false;
    const hasSpeechTherapyAccess = profile?.speechTherapyAccess || false;
    const staffTrainedInNeeds = profile?.staffTrainedInNeeds || false;

    // Concerns
    const concerns: string[] = [];
    if (communicationNeeds.length > 0 && !assessed) {
      concerns.push("Has communication needs but no formal assessment on record");
    }
    if (communicationNeeds.length > 0 && !hasCommunicationPassport) {
      concerns.push("No communication passport in place despite identified needs");
    }
    if (communicationNeeds.includes("speech_language") && !hasSpeechTherapyAccess) {
      concerns.push("Speech and language needs identified but no SLT access");
    }
    if (interpreterRequired && !supportsInPlace.includes("interpreter") && !supportsInPlace.includes("translation")) {
      concerns.push("Interpreter required but interpreter/translation support not in place");
    }
    if (!staffTrainedInNeeds && communicationNeeds.length > 0) {
      concerns.push("Staff not trained in this child's specific communication needs");
    }
    if (below(supportMatchRate, 50)) {
      concerns.push("Fewer than half of recommended supports are in place");
    }
    if (
      engagementLevel === "not_engaged" ||
      engagementLevel === "minimally_engaged"
    ) {
      concerns.push(
        `Child is ${engagementLevel === "not_engaged" ? "not engaged" : "minimally engaged"} — review communication approach`,
      );
    }

    // Overall score for child. Dimensions that do not apply to this child —
    // no recorded needs, nothing recommended, no assessment to read engagement
    // from — drop out rather than being awarded full marks.
    const passportScore = communicationNeeds.length === 0
      ? null
      : hasCommunicationPassport ? 100 : 0;
    const sltScore = !communicationNeeds.includes("speech_language")
      ? null
      : hasSpeechTherapyAccess ? 100 : 0;
    const staffScore = communicationNeeds.length === 0
      ? null
      : staffTrainedInNeeds ? 100 : 0;
    const engagementScore = (() => {
      switch (engagementLevel) {
        case "fully_engaged":
          return 100;
        case "partially_engaged":
          return 70;
        case "minimally_engaged":
          return 30;
        case "not_engaged":
          return 0;
        case "unable_to_assess":
          return 50;
        default:
          return null;
      }
    })();

    const overallScore = weightedMeanOf([
      { score: assessed ? 100 : 0, weight: 20 },
      { score: passportScore, weight: 15 },
      { score: supportMatchRate, weight: 30 },
      { score: sltScore, weight: 15 },
      { score: staffScore, weight: 10 },
      { score: engagementScore, weight: 10 },
    ]);

    return {
      childId,
      childName,
      communicationNeeds,
      primaryLanguage,
      interpreterRequired,
      assessed,
      engagementLevel,
      supportsRecommended,
      supportsInPlace,
      supportMatchRate,
      hasCommunicationPassport,
      hasSpeechTherapyAccess,
      staffTrainedInNeeds,
      overallScore,
      concerns,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateCommunicationAccessibilityIntelligence(
  profiles: ChildCommunicationProfile[],
  assessments: CommunicationAssessment[],
  documents: AccessibleDocument[],
  training: CommunicationTraining[],
  childIds: string[],
  childNames: Record<string, string>,
  staffIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): CommunicationAccessibilityIntelligenceResult {
  const needsResult = evaluateNeedsAssessment(profiles, assessments, childIds);
  const supportResult = evaluateSupportProvision(profiles, assessments, childIds);
  const infoResult = evaluateAccessibleInformation(documents);
  const trainingResult = evaluateStaffTraining(
    training,
    profiles,
    staffIds,
    referenceDate,
  );

  const childSummaries = buildChildCommunicationSummaries(
    profiles,
    assessments,
    childIds,
    childNames,
  );

  // Weighted scoring: needs(25) + support(30) + info(25) + training(20) = 100,
  // renormalised over whichever areas have something to measure.
  const overallScore = weightedMeanOf([
    { score: needsResult.score, weight: WEIGHTS.needsAssessment },
    { score: supportResult.score, weight: WEIGHTS.supportProvision },
    { score: infoResult.score, weight: WEIGHTS.accessibleInformation },
    { score: trainingResult.score, weight: WEIGHTS.staffTraining },
  ]);

  const rating: Rating =
    overallScore === null
      ? "unmeasured"
      : overallScore >= 80
        ? "outstanding"
        : overallScore >= 60
          ? "good"
          : overallScore >= 40
            ? "requires_improvement"
            : "inadequate";

  // Generate insights
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (meets(needsResult.score, 80)) {
    strengths.push(
      "Comprehensive communication needs assessments are in place for all children with identified needs",
    );
  }
  if (meets(supportResult.score, 80)) {
    strengths.push(
      "Excellent provision of communication support with recommended interventions consistently in place",
    );
  }
  if (meets(infoResult.score, 80)) {
    strengths.push(
      "Key documents are available in multiple accessible formats meeting diverse communication needs",
    );
  }
  if (meets(trainingResult.score, 80)) {
    strengths.push(
      "Staff are well-trained in communication approaches relevant to the children in their care",
    );
  }
  if (meets(needsResult.assessmentRate, 100)) {
    strengths.push(
      "All children have had their communication needs formally assessed",
    );
  }
  if (meets(needsResult.passportRate, 100) && needsResult.childrenWithNeeds > 0) {
    strengths.push(
      "All children with communication needs have a communication passport in place",
    );
  }
  if (meets(supportResult.speechTherapyAccessRate, 100) && profiles.some((p) => p.communicationNeeds.includes("speech_language"))) {
    strengths.push(
      "All children with speech and language needs have access to speech and language therapy",
    );
  }
  if (meets(supportResult.interpreterProvisionRate, 100) && profiles.some((p) => p.interpreterRequired)) {
    strengths.push(
      "Interpreter provision is in place for all children requiring it",
    );
  }
  if (meets(trainingResult.staffChildNeedsCoverage, 100) && trainingResult.totalStaff > 0) {
    strengths.push(
      "Staff training covers all communication approaches required for the children currently in placement",
    );
  }

  // Areas for improvement
  if (needsResult.childrenNotAssessed.length > 0) {
    areasForImprovement.push(
      `${needsResult.childrenNotAssessed.length} child(ren) have not had a formal communication needs assessment`,
    );
  }
  if (below(needsResult.passportRate, 100) && needsResult.childrenWithNeeds > 0) {
    const missing =
      needsResult.childrenWithNeeds -
      needsResult.childrenWithCommunicationPassport;
    areasForImprovement.push(
      `${missing} child(ren) with communication needs do not have a communication passport`,
    );
  }
  if (supportResult.gaps.length > 0) {
    areasForImprovement.push(
      `Support gaps identified: ${supportResult.gaps.length} child(ren) are missing recommended communication supports`,
    );
  }
  if (below(supportResult.speechTherapyAccessRate, 100) && profiles.some((p) => p.communicationNeeds.includes("speech_language"))) {
    areasForImprovement.push(
      "Not all children with speech and language needs have access to speech and language therapy",
    );
  }
  if (below(supportResult.interpreterProvisionRate, 100) && profiles.some((p) => p.interpreterRequired)) {
    areasForImprovement.push(
      "Interpreter provision is not in place for all children requiring it",
    );
  }
  if (infoResult.missingDocumentTypes.length > 0) {
    areasForImprovement.push(
      `Key documents not available in accessible formats: ${infoResult.missingDocumentTypes.join(", ")}`,
    );
  }
  if (below(infoResult.multipleFormatRate, 80)) {
    areasForImprovement.push(
      "Most documents are not available in multiple accessible formats",
    );
  }
  if (below(trainingResult.trainingCoverageRate, 80)) {
    areasForImprovement.push(
      `Only ${formatRate(trainingResult.trainingCoverageRate)} of staff have relevant communication training`,
    );
  }
  if (trainingResult.expiredTraining > 0) {
    areasForImprovement.push(
      `${trainingResult.expiredTraining} staff training record(s) have expired and need renewal`,
    );
  }
  if (below(trainingResult.staffChildNeedsCoverage, 100) && trainingResult.totalStaff > 0) {
    areasForImprovement.push(
      "Staff training does not cover all communication approaches required for current children",
    );
  }

  // Actions
  if (needsResult.childrenNotAssessed.length > 0) {
    actions.push(
      "Complete communication needs assessments for all children who have not yet been assessed",
    );
  }
  if (below(needsResult.passportRate, 100) && needsResult.childrenWithNeeds > 0) {
    actions.push(
      "Develop communication passports for all children with identified communication needs",
    );
  }
  if (supportResult.gaps.length > 0) {
    actions.push(
      "Address identified support gaps by arranging recommended communication supports for each child",
    );
  }
  if (below(supportResult.speechTherapyAccessRate, 100) && profiles.some((p) => p.communicationNeeds.includes("speech_language"))) {
    actions.push(
      "Refer children with speech and language needs to SLT services where access is not currently in place",
    );
  }
  if (below(supportResult.interpreterProvisionRate, 100) && profiles.some((p) => p.interpreterRequired)) {
    actions.push(
      "Arrange interpreter or translation services for all children identified as requiring them",
    );
  }
  if (infoResult.missingDocumentTypes.length > 0) {
    actions.push(
      "Produce accessible versions of all key documents including children's guide, complaints procedure, and house rules",
    );
  }
  if (below(infoResult.multipleFormatRate, 80)) {
    actions.push(
      "Create additional accessible formats (easy read, pictorial, translated, audio) for key documents",
    );
  }
  if (below(trainingResult.trainingCoverageRate, 80)) {
    actions.push(
      "Arrange communication training for staff who have not yet completed relevant courses",
    );
  }
  if (trainingResult.expiredTraining > 0) {
    actions.push(
      "Renew expired staff communication training to maintain competency",
    );
  }
  if (below(trainingResult.staffChildNeedsCoverage, 100) && trainingResult.totalStaff > 0) {
    actions.push(
      "Deliver targeted training to ensure staff are equipped for the specific communication needs of children in placement",
    );
  }

  const regulatoryLinks = [
    "SEND Code of Practice 2015 — Duties to identify, assess and make provision for children with SEN or disabilities",
    "CHR 2015 Reg 7 — Children's guide must be produced in a format appropriate to the age and understanding of each child",
    "CHR 2015 Reg 11 — The registered person must ensure that each child's views, wishes and feelings are ascertained and given due weight",
    "Accessible Information Standard 2016 — NHS England standard requiring accessible information for those with disabilities or sensory loss",
    "UNCRC Article 13 — Every child has the right to freedom of expression, including to seek, receive and impart information",
    "Equality Act 2010 — Duty to make reasonable adjustments to ensure disabled persons are not at a substantial disadvantage",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    needsAssessment: needsResult,
    supportProvision: supportResult,
    accessibleInformation: infoResult,
    staffTraining: trainingResult,
    childSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Helper: Map Communication Need to Training Type ────────────────────────

export function mapNeedToTraining(need: CommunicationNeed): TrainingType[] {
  const mapping: Record<CommunicationNeed, TrainingType[]> = {
    speech_language: ["makaton"],
    hearing: ["deaf_awareness"],
    visual: [],
    learning_disability: ["easy_read_creation", "makaton"],
    autism: ["autism_communication"],
    eal: ["eal_support"],
    selective_mutism: ["trauma_informed_communication"],
    emotional_barrier: ["trauma_informed_communication"],
    other: [],
  };
  return mapping[need] || [];
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getCommunicationNeedLabel(need: CommunicationNeed): string {
  const labels: Record<CommunicationNeed, string> = {
    speech_language: "Speech & Language",
    hearing: "Hearing",
    visual: "Visual",
    learning_disability: "Learning Disability",
    autism: "Autism",
    eal: "English as an Additional Language",
    selective_mutism: "Selective Mutism",
    emotional_barrier: "Emotional Barrier",
    other: "Other",
  };
  return labels[need] || need;
}

export function getSupportTypeLabel(support: SupportType): string {
  const labels: Record<SupportType, string> = {
    speech_therapy: "Speech Therapy",
    sign_language: "Sign Language",
    visual_aids: "Visual Aids",
    easy_read: "Easy Read",
    pictorial_communication: "Pictorial Communication",
    translation: "Translation",
    interpreter: "Interpreter",
    assistive_technology: "Assistive Technology",
    social_stories: "Social Stories",
    makaton: "Makaton",
  };
  return labels[support] || support;
}

export function getAccessibleFormatLabel(format: AccessibleFormat): string {
  const labels: Record<AccessibleFormat, string> = {
    standard: "Standard",
    easy_read: "Easy Read",
    large_print: "Large Print",
    braille: "Braille",
    audio: "Audio",
    pictorial: "Pictorial",
    translated: "Translated",
    bsl_video: "BSL Video",
  };
  return labels[format] || format;
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  const labels: Record<EngagementLevel, string> = {
    fully_engaged: "Fully Engaged",
    partially_engaged: "Partially Engaged",
    minimally_engaged: "Minimally Engaged",
    not_engaged: "Not Engaged",
    unable_to_assess: "Unable to Assess",
  };
  return labels[level] || level;
}

export function getDocumentTypeLabel(docType: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    childrens_guide: "Children's Guide",
    complaints_procedure: "Complaints Procedure",
    house_rules: "House Rules",
    key_info: "Key Information",
    health_plan: "Health Plan",
    care_plan: "Care Plan",
  };
  return labels[docType] || docType;
}

export function getTrainingTypeLabel(trainingType: TrainingType): string {
  const labels: Record<TrainingType, string> = {
    deaf_awareness: "Deaf Awareness",
    autism_communication: "Autism Communication",
    makaton: "Makaton",
    easy_read_creation: "Easy Read Creation",
    eal_support: "EAL Support",
    trauma_informed_communication: "Trauma-Informed Communication",
  };
  return labels[trainingType] || trainingType;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
    unmeasured: "Not Yet Measured",
  };
  return labels[rating] || rating;
}
