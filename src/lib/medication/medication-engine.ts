/* ──────────────────────────────────────────────────────────────
   Medication Intelligence Engine

   Pure deterministic engine for evaluating medication management
   in a children's residential home — administration accuracy,
   storage compliance, consent, error tracking, and staff
   competency.

   Regulatory basis:
     - CHR 2015 Reg 23 — Health and wellbeing (medication)
     - Misuse of Drugs Act 1971 — Controlled drug governance
     - CQC Guidance — Managing medicines in care homes
     - NICE CG76 — Medicines adherence
     - SCCIF — Health & wellbeing judgement
     - Regulation 12 (HSCA 2008) — Safe medication handling
     - NMS 3 — Health and wellbeing standard

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type MedicationType =
  | "regular_oral"
  | "prn_as_needed"
  | "controlled_drug"
  | "topical"
  | "inhaler"
  | "injectable"
  | "liquid"
  | "patch";

export type AdministrationOutcome =
  | "administered_correctly"
  | "refused_by_child"
  | "missed_dose"
  | "error_occurred"
  | "not_recorded";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const medicationTypeLabels: Record<MedicationType, string> = {
  regular_oral: "Regular Oral",
  prn_as_needed: "PRN (As Needed)",
  controlled_drug: "Controlled Drug",
  topical: "Topical",
  inhaler: "Inhaler",
  injectable: "Injectable",
  liquid: "Liquid",
  patch: "Patch",
};

const administrationOutcomeLabels: Record<AdministrationOutcome, string> = {
  administered_correctly: "Administered Correctly",
  refused_by_child: "Refused by Child",
  missed_dose: "Missed Dose",
  error_occurred: "Error Occurred",
  not_recorded: "Not Recorded",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMedicationTypeLabel(type: MedicationType): string {
  return medicationTypeLabels[type];
}

export function getAdministrationOutcomeLabel(outcome: AdministrationOutcome): string {
  return administrationOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MedicationAdministration {
  id: string;
  childId: string;
  childName: string;
  administrationDate: string;
  medicationType: MedicationType;
  outcome: AdministrationOutcome;
  consentObtained: boolean;
  twoStaffWitnessed: boolean;
  documentedCorrectly: boolean;
  sideEffectsMonitored: boolean;
  storageCompliant: boolean;
  marChartUpdated: boolean;
}

export interface MedicationPolicy {
  id: string;
  medicationManagementPolicy: boolean;
  controlledDrugsProcedure: boolean;
  administrationProtocol: boolean;
  storageAndDisposalPolicy: boolean;
  errorReportingProcess: boolean;
  consentFramework: boolean;
  regularReview: boolean;
}

export interface StaffMedicationTraining {
  id: string;
  staffId: string;
  staffName: string;
  medicationAdministration: boolean;
  controlledDrugsHandling: boolean;
  errorRecognition: boolean;
  sideEffectsAwareness: boolean;
  storageRequirements: boolean;
  consentAndCapacity: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MedicationQualityResult {
  totalAdministrations: number;
  correctAdminRate: number;
  consentRate: number;
  witnessedRate: number;
  sideEffectsRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface MedicationComplianceResult {
  totalAdministrations: number;
  documentedRate: number;
  storageRate: number;
  marChartRate: number;
  typeDiversityRatio: number;
  uniqueTypes: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface MedicationPolicyResult {
  medicationManagementPolicy: boolean;
  controlledDrugsProcedure: boolean;
  administrationProtocol: boolean;
  storageAndDisposalPolicy: boolean;
  errorReportingProcess: boolean;
  consentFramework: boolean;
  regularReview: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffMedicationReadinessResult {
  totalStaff: number;
  medicationAdministrationRate: number;
  controlledDrugsHandlingRate: number;
  errorRecognitionRate: number;
  sideEffectsAwarenessRate: number;
  storageRequirementsRate: number;
  consentAndCapacityRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildMedicationProfile {
  childId: string;
  childName: string;
  totalAdministrations: number;
  correctAdminRate: number;
  consentRate: number;
  uniqueMedTypes: number;
  medicationScore: number;
}

export interface MedicationIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  medicationQuality: MedicationQualityResult;
  medicationCompliance: MedicationComplianceResult;
  medicationPolicy: MedicationPolicyResult;
  staffReadiness: StaffMedicationReadinessResult;
  childProfiles: ChildMedicationProfile[];
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

// ── Evaluator 1: Medication Quality (0-25) ───────────────────────────────

export function evaluateMedicationQuality(
  administrations: MedicationAdministration[],
): MedicationQualityResult {
  const totalAdministrations = administrations.length;

  if (totalAdministrations === 0) {
    return {
      totalAdministrations: 0,
      correctAdminRate: 0,
      consentRate: 0,
      witnessedRate: 0,
      sideEffectsRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No medication administrations recorded — quality cannot be assessed"],
    };
  }

  const correctCount = administrations.filter(
    (a) => a.outcome === "administered_correctly",
  ).length;
  const correctAdminRate = pct(correctCount, totalAdministrations);

  const consentCount = administrations.filter((a) => a.consentObtained).length;
  const consentRate = pct(consentCount, totalAdministrations);

  const witnessedCount = administrations.filter((a) => a.twoStaffWitnessed).length;
  const witnessedRate = pct(witnessedCount, totalAdministrations);

  const sideEffectsCount = administrations.filter((a) => a.sideEffectsMonitored).length;
  const sideEffectsRate = pct(sideEffectsCount, totalAdministrations);

  // Weights: correctAdminRate 7 + consentRate 6 + witnessedRate 6 + sideEffectsRate 6 = 25
  let score = 0;
  score += (correctAdminRate / 100) * 7;
  score += (consentRate / 100) * 6;
  score += (witnessedRate / 100) * 6;
  score += (sideEffectsRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (correctAdminRate >= 80) {
    strengths.push("Strong administration accuracy: " + correctAdminRate + "% of doses administered correctly");
  } else if (correctAdminRate < 50) {
    concerns.push("Administration accuracy at " + correctAdminRate + "% — significant medication errors or missed doses");
  }

  if (consentRate >= 80) {
    strengths.push("Excellent consent compliance: " + consentRate + "% of administrations with consent recorded");
  } else if (consentRate < 50) {
    concerns.push("Consent rate at " + consentRate + "% — consent not consistently obtained before administration");
  }

  if (witnessedRate >= 80) {
    strengths.push("Strong dual-witness practice: " + witnessedRate + "% of administrations witnessed by two staff");
  } else if (witnessedRate < 50) {
    concerns.push("Witnessed rate at " + witnessedRate + "% — dual-witness requirement not met for many administrations");
  }

  if (sideEffectsRate >= 80) {
    strengths.push("Good side-effects monitoring: " + sideEffectsRate + "% of administrations with monitoring recorded");
  } else if (sideEffectsRate < 50) {
    concerns.push("Side-effects monitoring at " + sideEffectsRate + "% — children may not be monitored after medication");
  }

  return {
    totalAdministrations,
    correctAdminRate,
    consentRate,
    witnessedRate,
    sideEffectsRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Medication Compliance (0-25) ────────────────────────────

export function evaluateMedicationCompliance(
  administrations: MedicationAdministration[],
): MedicationComplianceResult {
  const totalAdministrations = administrations.length;

  if (totalAdministrations === 0) {
    return {
      totalAdministrations: 0,
      documentedRate: 0,
      storageRate: 0,
      marChartRate: 0,
      typeDiversityRatio: 0,
      uniqueTypes: 0,
      score: 0,
      strengths: [],
      concerns: ["No medication administrations recorded — compliance cannot be assessed"],
    };
  }

  const documentedCount = administrations.filter((a) => a.documentedCorrectly).length;
  const documentedRate = pct(documentedCount, totalAdministrations);

  const storageCount = administrations.filter((a) => a.storageCompliant).length;
  const storageRate = pct(storageCount, totalAdministrations);

  const marChartCount = administrations.filter((a) => a.marChartUpdated).length;
  const marChartRate = pct(marChartCount, totalAdministrations);

  const uniqueTypesSet = new Set(administrations.map((a) => a.medicationType));
  const uniqueTypes = uniqueTypesSet.size;
  const typeDiversityRatio = Math.round((uniqueTypes / 8) * 100) / 100;

  // Weights: documentedRate 8 + storageRate 7 + marChartRate 5 + typeDiversityRatio 5 = 25
  let score = 0;
  score += (documentedRate / 100) * 8;
  score += (storageRate / 100) * 7;
  score += (marChartRate / 100) * 5;
  score += typeDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentedRate >= 90) {
    strengths.push("Thorough documentation: " + documentedRate + "% of administrations correctly documented");
  } else if (documentedRate < 50) {
    concerns.push("Documentation rate at " + documentedRate + "% — administration records incomplete");
  }

  if (storageRate >= 90) {
    strengths.push("Excellent storage compliance: " + storageRate + "% of medications stored correctly");
  } else if (storageRate < 50) {
    concerns.push("Storage compliance at " + storageRate + "% — medications may not be stored safely");
  }

  if (marChartRate >= 90) {
    strengths.push("MAR chart completion strong: " + marChartRate + "% of charts updated correctly");
  } else if (marChartRate < 50) {
    concerns.push("MAR chart rate at " + marChartRate + "% — significant gaps in MAR chart recording");
  }

  if (uniqueTypes >= 6) {
    strengths.push("Comprehensive medication type coverage: " + uniqueTypes + " of 8 types managed");
  } else if (uniqueTypes <= 2) {
    concerns.push("Only " + uniqueTypes + " medication type(s) recorded — limited medication diversity");
  }

  return {
    totalAdministrations,
    documentedRate,
    storageRate,
    marChartRate,
    typeDiversityRatio,
    uniqueTypes,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Medication Policy (0-25) ────────────────────────────────

export function evaluateMedicationPolicy(
  policy: MedicationPolicy | null,
): MedicationPolicyResult {
  if (policy === null) {
    return {
      medicationManagementPolicy: false,
      controlledDrugsProcedure: false,
      administrationProtocol: false,
      storageAndDisposalPolicy: false,
      errorReportingProcess: false,
      consentFramework: false,
      regularReview: false,
      score: 0,
      strengths: [],
      concerns: ["No medication policy in place — URGENT: develop comprehensive medication management policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.medicationManagementPolicy) score += 4;
  if (policy.controlledDrugsProcedure) score += 4;
  if (policy.administrationProtocol) score += 4;
  if (policy.storageAndDisposalPolicy) score += 4;
  if (policy.errorReportingProcess) score += 3;
  if (policy.consentFramework) score += 3;
  if (policy.regularReview) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.medicationManagementPolicy,
    policy.controlledDrugsProcedure,
    policy.administrationProtocol,
    policy.storageAndDisposalPolicy,
    policy.errorReportingProcess,
    policy.consentFramework,
    policy.regularReview,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete medication policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 medication policy components in place");
  }

  if (!policy.medicationManagementPolicy) {
    concerns.push("No medication management policy — staff may lack clear guidance on medication procedures");
  }
  if (!policy.controlledDrugsProcedure) {
    concerns.push("No controlled drugs procedure — controlled drug governance at risk");
  }
  if (!policy.administrationProtocol) {
    concerns.push("No administration protocol — inconsistent medication administration may result");
  }
  if (!policy.storageAndDisposalPolicy) {
    concerns.push("No storage and disposal policy — medications may not be stored or disposed of safely");
  }
  if (!policy.errorReportingProcess) {
    concerns.push("No error reporting process — medication errors may go unrecorded and unaddressed");
  }
  if (!policy.consentFramework) {
    concerns.push("No consent framework — consent for medication may not be properly managed");
  }
  if (!policy.regularReview) {
    concerns.push("No regular review process — medication policies may become outdated");
  }

  return {
    medicationManagementPolicy: policy.medicationManagementPolicy,
    controlledDrugsProcedure: policy.controlledDrugsProcedure,
    administrationProtocol: policy.administrationProtocol,
    storageAndDisposalPolicy: policy.storageAndDisposalPolicy,
    errorReportingProcess: policy.errorReportingProcess,
    consentFramework: policy.consentFramework,
    regularReview: policy.regularReview,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Medication Readiness (0-25) ───────────────────────

export function evaluateStaffMedicationReadiness(
  training: StaffMedicationTraining[],
): StaffMedicationReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      medicationAdministrationRate: 0,
      controlledDrugsHandlingRate: 0,
      errorRecognitionRate: 0,
      sideEffectsAwarenessRate: 0,
      storageRequirementsRate: 0,
      consentAndCapacityRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule medication training for all staff"],
    };
  }

  const adminCount = training.filter((t) => t.medicationAdministration).length;
  const medicationAdministrationRate = pct(adminCount, totalStaff);

  const cdCount = training.filter((t) => t.controlledDrugsHandling).length;
  const controlledDrugsHandlingRate = pct(cdCount, totalStaff);

  const errorCount = training.filter((t) => t.errorRecognition).length;
  const errorRecognitionRate = pct(errorCount, totalStaff);

  const sideEffectsCount = training.filter((t) => t.sideEffectsAwareness).length;
  const sideEffectsAwarenessRate = pct(sideEffectsCount, totalStaff);

  const storageCount = training.filter((t) => t.storageRequirements).length;
  const storageRequirementsRate = pct(storageCount, totalStaff);

  const consentCount = training.filter((t) => t.consentAndCapacity).length;
  const consentAndCapacityRate = pct(consentCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (medicationAdministrationRate / 100) * 6;
  score += (controlledDrugsHandlingRate / 100) * 5;
  score += (errorRecognitionRate / 100) * 5;
  score += (sideEffectsAwarenessRate / 100) * 4;
  score += (storageRequirementsRate / 100) * 3;
  score += (consentAndCapacityRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (medicationAdministrationRate >= 80) {
    strengths.push("Strong medication administration training: " + medicationAdministrationRate + "% of staff");
  } else if (medicationAdministrationRate < 50) {
    concerns.push("Medication administration training at " + medicationAdministrationRate + "% — foundational training needed");
  }

  if (controlledDrugsHandlingRate >= 80) {
    strengths.push("Good controlled drugs handling competency: " + controlledDrugsHandlingRate + "%");
  } else if (controlledDrugsHandlingRate < 50) {
    concerns.push("Controlled drugs handling at " + controlledDrugsHandlingRate + "% — staff may not handle controlled drugs safely");
  }

  if (errorRecognitionRate >= 80) {
    strengths.push("Strong error recognition skills: " + errorRecognitionRate + "% of staff trained");
  } else if (errorRecognitionRate < 50) {
    concerns.push("Error recognition at " + errorRecognitionRate + "% — medication errors may go undetected");
  }

  if (sideEffectsAwarenessRate >= 80) {
    strengths.push("Good side-effects awareness: " + sideEffectsAwarenessRate + "% of staff knowledgeable");
  } else if (sideEffectsAwarenessRate < 50) {
    concerns.push("Side-effects awareness at " + sideEffectsAwarenessRate + "% — staff may not recognise adverse reactions");
  }

  if (storageRequirementsRate >= 80) {
    strengths.push("Storage requirements well understood: " + storageRequirementsRate + "% of staff trained");
  } else if (storageRequirementsRate < 50) {
    concerns.push("Storage requirements knowledge at " + storageRequirementsRate + "% — medications may not be stored correctly");
  }

  if (consentAndCapacityRate >= 80) {
    strengths.push("Consent and capacity skills strong: " + consentAndCapacityRate + "% of staff competent");
  } else if (consentAndCapacityRate < 50) {
    concerns.push("Consent and capacity skills at " + consentAndCapacityRate + "% — consent processes may be inadequate");
  }

  return {
    totalStaff,
    medicationAdministrationRate,
    controlledDrugsHandlingRate,
    errorRecognitionRate,
    sideEffectsAwarenessRate,
    storageRequirementsRate,
    consentAndCapacityRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Medication Profiles ──────────────────────────────────────

export function buildChildMedicationProfiles(
  administrations: MedicationAdministration[],
): ChildMedicationProfile[] {
  if (administrations.length === 0) return [];

  const childMap = new Map<
    string,
    { childId: string; childName: string; administrations: MedicationAdministration[] }
  >();

  for (const a of administrations) {
    if (!childMap.has(a.childId)) {
      childMap.set(a.childId, { childId: a.childId, childName: a.childName, administrations: [] });
    }
    childMap.get(a.childId)!.administrations.push(a);
  }

  return Array.from(childMap.values()).map((child) => {
    const total = child.administrations.length;

    const correctCount = child.administrations.filter(
      (a) => a.outcome === "administered_correctly",
    ).length;
    const correctAdminRate = pct(correctCount, total);

    const consentCount = child.administrations.filter((a) => a.consentObtained).length;
    const consentRate = pct(consentCount, total);

    const uniqueTypesSet = new Set(child.administrations.map((a) => a.medicationType));
    const uniqueMedTypes = uniqueTypesSet.size;

    // freq: >=10 administrations -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (total >= 10) frequencyScore = 2;
    else if (total >= 5) frequencyScore = 1;

    // rate1 (correctAdminRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (correctAdminRate >= 80) rate1Score = 3;
    else if (correctAdminRate >= 60) rate1Score = 2;
    else if (correctAdminRate >= 40) rate1Score = 1;

    // rate2 (consentRate): same thresholds
    let rate2Score = 0;
    if (consentRate >= 80) rate2Score = 3;
    else if (consentRate >= 60) rate2Score = 2;
    else if (consentRate >= 40) rate2Score = 1;

    // diversity (unique med types): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueMedTypes >= 4) diversityBonus = 2;
    else if (uniqueMedTypes >= 2) diversityBonus = 1;

    const medicationScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalAdministrations: total,
      correctAdminRate,
      consentRate,
      uniqueMedTypes,
      medicationScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateMedicationIntelligence(
  administrations: MedicationAdministration[],
  policy: MedicationPolicy | null,
  training: StaffMedicationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MedicationIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter administrations to period
  const periodAdministrations = administrations.filter(
    (a) => a.administrationDate >= periodStart && a.administrationDate <= periodEnd,
  );

  // Evaluate each layer
  const medicationQuality = evaluateMedicationQuality(periodAdministrations);
  const medicationCompliance = evaluateMedicationCompliance(periodAdministrations);
  const medicationPolicy = evaluateMedicationPolicy(policy);
  const staffReadiness = evaluateStaffMedicationReadiness(training);

  // Build child profiles
  const childProfiles = buildChildMedicationProfiles(periodAdministrations);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      medicationQuality.score +
      medicationCompliance.score +
      medicationPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    medicationQuality, medicationCompliance, medicationPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    medicationQuality, medicationCompliance, medicationPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    medicationQuality, medicationCompliance, medicationPolicy, staffReadiness, periodAdministrations, childProfiles,
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
    medicationQuality,
    medicationCompliance,
    medicationPolicy,
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
  quality: MedicationQualityResult,
  compliance: MedicationComplianceResult,
  policy: MedicationPolicyResult,
  staff: StaffMedicationReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall medication management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall medication management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Medication administration quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Medication compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Medication policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff medication readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: MedicationQualityResult,
  compliance: MedicationComplianceResult,
  policy: MedicationPolicyResult,
  staff: StaffMedicationReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall medication management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall medication management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Medication administration quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Medication compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Medication policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff medication readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: MedicationQualityResult,
  compliance: MedicationComplianceResult,
  policy: MedicationPolicyResult,
  staff: StaffMedicationReadinessResult,
  administrations: MedicationAdministration[],
  childProfiles: ChildMedicationProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No medication policy in place — develop and implement comprehensive medication management policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff medication training records — schedule medication competency training for all staff immediately");
  }

  // URGENT when errors occurred
  const errorAdmins = administrations.filter((a) => a.outcome === "error_occurred");
  if (errorAdmins.length > 0) {
    actions.push("URGENT: " + errorAdmins.length + " medication error(s) recorded — investigate each error, implement corrective actions, and review administration procedures");
  }

  // Conditional on rates < 50
  if (quality.totalAdministrations > 0 && quality.correctAdminRate < 50) {
    actions.push("HIGH: Administration accuracy at " + quality.correctAdminRate + "% — review medication administration procedures and retrain staff");
  }

  if (quality.totalAdministrations > 0 && quality.consentRate < 50) {
    actions.push("HIGH: Consent rate at " + quality.consentRate + "% — ensure consent is obtained and documented before every administration");
  }

  if (compliance.totalAdministrations > 0 && compliance.documentedRate < 50) {
    actions.push("HIGH: Documentation rate at " + compliance.documentedRate + "% — improve medication recording practices");
  }

  if (compliance.totalAdministrations > 0 && compliance.storageRate < 50) {
    actions.push("HIGH: Storage compliance at " + compliance.storageRate + "% — audit all medication storage immediately");
  }

  if (quality.totalAdministrations > 0 && quality.witnessedRate < 50) {
    actions.push("MEDIUM: Witnessed rate at " + quality.witnessedRate + "% — reinforce dual-witness requirement for medication administration");
  }

  if (compliance.totalAdministrations > 0 && compliance.marChartRate < 50) {
    actions.push("MEDIUM: MAR chart completion at " + compliance.marChartRate + "% — ensure MAR charts are updated after every administration");
  }

  if (staff.totalStaff > 0 && staff.medicationAdministrationRate < 50) {
    actions.push("MEDIUM: Staff medication training at " + staff.medicationAdministrationRate + "% — schedule refresher training for all staff");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.medicationScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low medication scores — review individual medication management plans");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Medication management systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 23 — Health and wellbeing (medication management)",
    "Misuse of Drugs Act 1971 — Controlled drug governance and safe handling",
    "CQC Guidance — Managing medicines in care homes",
    "NICE CG76 — Medicines adherence and safe administration",
    "SCCIF — Health and wellbeing judgement (medication)",
    "Regulation 12 (HSCA 2008) — Safe care and treatment (medication)",
    "NMS 3 — Health and wellbeing standard (medication management)",
  ];
}
