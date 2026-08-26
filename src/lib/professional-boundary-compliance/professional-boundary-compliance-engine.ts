import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL BOUNDARY COMPLIANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well staff in a children's
// residential home maintain professional boundaries, appropriate relationships,
// and ethical conduct with looked-after children.
//
// Regulatory basis:
//   - CHR 2015 Regulation 12 — The protection of children
//   - CHR 2015 Regulation 13 — Leadership and management
//   - SCCIF — Safety of children
//   - NMS 19 — Behaviour management
//   - Children Act 1989 — Welfare and safeguarding
//   - Working Together to Safeguard Children 2023
//   - Ofsted ILACS — Impact of leaders on practice
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type BoundaryArea =
  | "physical_contact"
  | "gift_giving"
  | "social_media"
  | "personal_disclosure"
  | "favouritism"
  | "dual_relationships"
  | "confidentiality"
  | "professional_language";

export type ComplianceLevel =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ──────────────────────────────────────────────────

const BOUNDARY_AREA_LABELS: Record<BoundaryArea, string> = {
  physical_contact: "Physical Contact",
  gift_giving: "Gift Giving",
  social_media: "Social Media",
  personal_disclosure: "Personal Disclosure",
  favouritism: "Favouritism",
  dual_relationships: "Dual Relationships",
  confidentiality: "Confidentiality",
  professional_language: "Professional Language",
};

const COMPLIANCE_LEVEL_LABELS: Record<ComplianceLevel, string> = {
  fully_compliant: "Fully Compliant",
  mostly_compliant: "Mostly Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getBoundaryAreaLabel(area: BoundaryArea): string {
  return BOUNDARY_AREA_LABELS[area];
}

export function getComplianceLevelLabel(level: ComplianceLevel): string {
  return COMPLIANCE_LEVEL_LABELS[level];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface BoundaryAudit {
  id: string;
  staffId: string;
  staffName: string;
  auditDate: string; // ISO date
  boundaryArea: BoundaryArea;
  complianceLevel: ComplianceLevel;
  supervisorVerified: boolean;
  documentedAppropriately: boolean;
  childFeedbackSought: boolean;
  correctiveActionTaken: boolean;
  reflectivePracticeCompleted: boolean;
  riskAssessed: boolean;
}

export interface BoundaryPolicy {
  id: string;
  boundaryFramework: boolean;
  socialMediaPolicy: boolean;
  giftGivingGuidance: boolean;
  physicalContactPolicy: boolean;
  whistleblowingProcedure: boolean;
  confidentialityProtocol: boolean;
  regularReview: boolean;
}

export interface StaffBoundaryTraining {
  id: string;
  staffId: string;
  staffName: string;
  professionalBoundaries: boolean;
  safeguardingAwareness: boolean;
  ethicalConduct: boolean;
  socialMediaSafety: boolean;
  reportingProcedures: boolean;
  reflectivePractice: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface BoundaryComplianceResult {
  totalAudits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  complianceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supervisorVerifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  correctiveActionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reflectivePracticeRate: number | null;
  areaBreakdown: Record<BoundaryArea, number>;
  complianceLevelBreakdown: Record<ComplianceLevel, number>;
  score: number; // 0-25
}

export interface ChildSafeguardingResult {
  totalAudits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  childFeedbackSoughtRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  nonComplianceRate: number | null;
  score: number; // 0-25
}

export interface BoundaryPolicyResult {
  boundaryFramework: boolean;
  socialMediaPolicy: boolean;
  giftGivingGuidance: boolean;
  physicalContactPolicy: boolean;
  whistleblowingProcedure: boolean;
  confidentialityProtocol: boolean;
  regularReview: boolean;
  score: number; // 0-25
}

export interface StaffBoundaryReadinessResult {
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  professionalBoundariesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ethicalConductRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  socialMediaSafetyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reportingProceduresRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reflectivePracticeRate: number | null;
  score: number; // 0-25
}

export interface StaffBoundaryProfile {
  staffId: string;
  staffName: string;
  totalAudits: number;
  complianceRate: number;
  documentedRate: number;
  supervisorVerifiedRate: number;
  boundaryScore: number; // 0-10
}

export interface ProfessionalBoundaryComplianceIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  boundaryCompliance: BoundaryComplianceResult;
  childSafeguarding: ChildSafeguardingResult;
  boundaryPolicy: BoundaryPolicyResult;
  staffBoundaryReadiness: StaffBoundaryReadinessResult;

  staffProfiles: StaffBoundaryProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Function 1: Evaluate Boundary Compliance (0-25) ─────────────────
// ABSENCE pattern: empty audits = 25 (no boundary issues is good)

export function evaluateBoundaryCompliance(
  audits: BoundaryAudit[],
): BoundaryComplianceResult {
  const totalAudits = audits.length;

  // Initialise breakdowns
  const areaBreakdown: Record<BoundaryArea, number> = {
    physical_contact: 0,
    gift_giving: 0,
    social_media: 0,
    personal_disclosure: 0,
    favouritism: 0,
    dual_relationships: 0,
    confidentiality: 0,
    professional_language: 0,
  };

  const complianceLevelBreakdown: Record<ComplianceLevel, number> = {
    fully_compliant: 0,
    mostly_compliant: 0,
    partially_compliant: 0,
    non_compliant: 0,
  };

  // Empty = 25 (ABSENCE pattern — no boundary issues is good)
  if (totalAudits === 0) {
    return {
      totalAudits: 0,
      complianceRate: null,
      supervisorVerifiedRate: null,
      documentedRate: null,
      correctiveActionRate: null,
      reflectivePracticeRate: null,
      areaBreakdown,
      complianceLevelBreakdown,
      score: 25,
    };
  }

  // Populate breakdowns
  for (const audit of audits) {
    areaBreakdown[audit.boundaryArea]++;
    complianceLevelBreakdown[audit.complianceLevel]++;
  }

  // Compliance rate: fully_compliant + mostly_compliant
  const compliantCount =
    complianceLevelBreakdown.fully_compliant + complianceLevelBreakdown.mostly_compliant;
  const complianceRate = rate(compliantCount, totalAudits);

  // Supervisor verified rate
  const supervisorVerifiedCount = audits.filter((a) => a.supervisorVerified).length;
  const supervisorVerifiedRate = rate(supervisorVerifiedCount, totalAudits);

  // Documented rate
  const documentedCount = audits.filter((a) => a.documentedAppropriately).length;
  const documentedRate = rate(documentedCount, totalAudits);

  // Corrective action rate
  const correctiveActionCount = audits.filter((a) => a.correctiveActionTaken).length;
  const correctiveActionRate = rate(correctiveActionCount, totalAudits);

  // Reflective practice rate
  const reflectivePracticeCount = audits.filter((a) => a.reflectivePracticeCompleted).length;
  const reflectivePracticeRate = rate(reflectivePracticeCount, totalAudits);

  // Score (out of 25)
  // Weighted: compliance rate (0-8), supervisor verified rate (0-6), documented rate (0-6), combined corrective+reflective (0-5)
  let score = 0;
  score += (complianceRate! / 100) * 8;
  score += (supervisorVerifiedRate! / 100) * 6;
  score += ((documentedRate ?? 0) / 100) * 6;
  const combinedCorrRefl = (correctiveActionRate! + reflectivePracticeRate!) / 2;
  score += (combinedCorrRefl / 100) * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalAudits,
    complianceRate,
    supervisorVerifiedRate,
    documentedRate,
    correctiveActionRate,
    reflectivePracticeRate,
    areaBreakdown,
    complianceLevelBreakdown,
    score,
  };
}

// ── Core Function 2: Evaluate Child Safeguarding (0-25) ──────────────────
// ABSENCE pattern: empty audits = 25 (no boundary issues is good)

export function evaluateChildSafeguarding(
  audits: BoundaryAudit[],
): ChildSafeguardingResult {
  const totalAudits = audits.length;

  // Empty = 25 (ABSENCE pattern)
  if (totalAudits === 0) {
    return {
      totalAudits: 0,
      childFeedbackSoughtRate: null,
      riskAssessedRate: null,
      nonComplianceRate: null,
      score: 25,
    };
  }

  // Child feedback sought rate
  const childFeedbackCount = audits.filter((a) => a.childFeedbackSought).length;
  const childFeedbackSoughtRate = rate(childFeedbackCount, totalAudits);

  // Risk assessed rate
  const riskAssessedCount = audits.filter((a) => a.riskAssessed).length;
  const riskAssessedRate = rate(riskAssessedCount, totalAudits);

  // Non-compliance rate
  const nonCompliantCount = audits.filter((a) => a.complianceLevel === "non_compliant").length;
  const nonComplianceRate = rate(nonCompliantCount, totalAudits);

  // Score (out of 25)
  // Weighted: child feedback sought rate (0-9), risk assessed rate (0-8), non-compliance rate inverted (0-8)
  let score = 0;
  score += (childFeedbackSoughtRate! / 100) * 9;
  score += (riskAssessedRate! / 100) * 8;
  score += 8 * ((100 - nonComplianceRate!) / 100);

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalAudits,
    childFeedbackSoughtRate,
    riskAssessedRate,
    nonComplianceRate,
    score,
  };
}

// ── Core Function 3: Evaluate Boundary Policy (0-25) ─────────────────────
// null = 0 (no policy = no score)

export function evaluateBoundaryPolicy(
  policy: BoundaryPolicy | null,
): BoundaryPolicyResult {
  if (!policy) {
    return {
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.boundaryFramework) score += 4;
  if (policy.socialMediaPolicy) score += 4;
  if (policy.giftGivingGuidance) score += 4;
  if (policy.physicalContactPolicy) score += 4;
  if (policy.whistleblowingProcedure) score += 3;
  if (policy.confidentialityProtocol) score += 3;
  if (policy.regularReview) score += 3;

  score = clamp(score, 0, 25);

  return {
    boundaryFramework: policy.boundaryFramework,
    socialMediaPolicy: policy.socialMediaPolicy,
    giftGivingGuidance: policy.giftGivingGuidance,
    physicalContactPolicy: policy.physicalContactPolicy,
    whistleblowingProcedure: policy.whistleblowingProcedure,
    confidentialityProtocol: policy.confidentialityProtocol,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Core Function 4: Evaluate Staff Boundary Readiness (0-25) ────────────
// empty = 0 (no training records = no evidence of readiness)

export function evaluateStaffBoundaryReadiness(
  training: StaffBoundaryTraining[],
): StaffBoundaryReadinessResult {
  const totalStaff = training.length;

  // Empty = 0
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      professionalBoundariesRate: null,
      safeguardingAwarenessRate: null,
      ethicalConductRate: null,
      socialMediaSafetyRate: null,
      reportingProceduresRate: null,
      reflectivePracticeRate: null,
      score: 0,
    };
  }

  // Calculate rates for each skill
  const professionalBoundariesCount = training.filter((t) => t.professionalBoundaries).length;
  const professionalBoundariesRate = rate(professionalBoundariesCount, totalStaff);

  const safeguardingAwarenessCount = training.filter((t) => t.safeguardingAwareness).length;
  const safeguardingAwarenessRate = rate(safeguardingAwarenessCount, totalStaff);

  const ethicalConductCount = training.filter((t) => t.ethicalConduct).length;
  const ethicalConductRate = rate(ethicalConductCount, totalStaff);

  const socialMediaSafetyCount = training.filter((t) => t.socialMediaSafety).length;
  const socialMediaSafetyRate = rate(socialMediaSafetyCount, totalStaff);

  const reportingProceduresCount = training.filter((t) => t.reportingProcedures).length;
  const reportingProceduresRate = rate(reportingProceduresCount, totalStaff);

  const reflectivePracticeCount = training.filter((t) => t.reflectivePractice).length;
  const reflectivePracticeRate = rate(reflectivePracticeCount, totalStaff);

  // Score (out of 25): 6 skills weighted 6+5+5+4+3+2 = 25
  let score = 0;
  score += (professionalBoundariesRate! / 100) * 6;
  score += (safeguardingAwarenessRate! / 100) * 5;
  score += (ethicalConductRate! / 100) * 5;
  score += (socialMediaSafetyRate! / 100) * 4;
  score += (reportingProceduresRate! / 100) * 3;
  score += ((reflectivePracticeRate ?? 0) / 100) * 2;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalStaff,
    professionalBoundariesRate,
    safeguardingAwarenessRate,
    ethicalConductRate,
    socialMediaSafetyRate,
    reportingProceduresRate,
    reflectivePracticeRate,
    score,
  };
}

// ── Build Staff Boundary Profiles ──────────────────────────────────────────

export function buildStaffBoundaryProfiles(
  audits: BoundaryAudit[],
): StaffBoundaryProfile[] {
  // Group audits by staffId
  const staffMap = new Map<string, { staffId: string; staffName: string; audits: BoundaryAudit[] }>();

  for (const audit of audits) {
    const existing = staffMap.get(audit.staffId);
    if (existing) {
      existing.audits.push(audit);
    } else {
      staffMap.set(audit.staffId, {
        staffId: audit.staffId,
        staffName: audit.staffName,
        audits: [audit],
      });
    }
  }

  return Array.from(staffMap.values()).map((entry) => {
    const totalAudits = entry.audits.length;

    // Compliance rate (fully_compliant + mostly_compliant)
    const compliantCount = entry.audits.filter(
      (a) => a.complianceLevel === "fully_compliant" || a.complianceLevel === "mostly_compliant",
    ).length;
    const complianceRate = rate(compliantCount, totalAudits)!;

    // Documented rate
    const documentedCount = entry.audits.filter((a) => a.documentedAppropriately).length;
    const documentedRate = rate(documentedCount, totalAudits)!;

    // Supervisor verified rate
    const supervisorVerifiedCount = entry.audits.filter((a) => a.supervisorVerified).length;
    const supervisorVerifiedRate = rate(supervisorVerifiedCount, totalAudits)!;

    // Per-staff score 0-10: compliance rate (0-4 based on tiers), documented (0-3), supervisorVerified (0-3)
    let boundaryScore = 0;

    // Compliance rate tiers (0-4)
    if (meets(complianceRate, 90)) boundaryScore += 4;
    else if (meets(complianceRate, 75)) boundaryScore += 3;
    else if (meets(complianceRate, 50)) boundaryScore += 2;
    else if (above(complianceRate, 0)) boundaryScore += 1;

    // Documented (0-3)
    if (meets(documentedRate, 90)) boundaryScore += 3;
    else if (meets(documentedRate, 70)) boundaryScore += 2;
    else if (meets(documentedRate, 50)) boundaryScore += 1;

    // Supervisor verified (0-3)
    if (meets(supervisorVerifiedRate, 90)) boundaryScore += 3;
    else if (meets(supervisorVerifiedRate, 70)) boundaryScore += 2;
    else if (meets(supervisorVerifiedRate, 50)) boundaryScore += 1;

    boundaryScore = clamp(boundaryScore, 0, 10);

    return {
      staffId: entry.staffId,
      staffName: entry.staffName,
      totalAudits,
      complianceRate,
      documentedRate,
      supervisorVerifiedRate,
      boundaryScore,
    };
  });
}

// ── Generate Professional Boundary Compliance Intelligence ─────────────────

export function generateProfessionalBoundaryComplianceIntelligence(
  audits: BoundaryAudit[],
  policy: BoundaryPolicy | null,
  training: StaffBoundaryTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ProfessionalBoundaryComplianceIntelligence {
  const assessedAt = new Date().toISOString();

  // Evaluate each layer
  const boundaryCompliance = evaluateBoundaryCompliance(audits);
  const childSafeguarding = evaluateChildSafeguarding(audits);
  const boundaryPolicy = evaluateBoundaryPolicy(policy);
  const staffBoundaryReadiness = evaluateStaffBoundaryReadiness(training);

  // Build staff profiles
  const staffProfiles = buildStaffBoundaryProfiles(audits);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      boundaryCompliance.score +
      childSafeguarding.score +
      boundaryPolicy.score +
      staffBoundaryReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(boundaryCompliance, childSafeguarding, audits);
  const areasForImprovement = aggregateAreasForImprovement(boundaryCompliance, childSafeguarding, audits);
  const actions = generateActions(audits, policy, training, boundaryCompliance, childSafeguarding);
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    boundaryCompliance,
    childSafeguarding,
    boundaryPolicy,
    staffBoundaryReadiness,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  compliance: BoundaryComplianceResult,
  _safeguarding: ChildSafeguardingResult,
  _audits: BoundaryAudit[],
): string[] {
  const strengths: string[] = [];

  if (meets(compliance.complianceRate, 80)) {
    strengths.push("Strong professional boundary compliance at " + compliance.complianceRate + "% — staff consistently maintain appropriate boundaries");
  }

  if (meets(compliance.supervisorVerifiedRate, 80)) {
    strengths.push("Effective supervision oversight with " + compliance.supervisorVerifiedRate + "% of boundary audits verified by supervisors");
  }

  if (meets(compliance.documentedRate, 80)) {
    strengths.push("Thorough boundary documentation at " + compliance.documentedRate + "% — clear audit trail maintained");
  }

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  compliance: BoundaryComplianceResult,
  safeguarding: ChildSafeguardingResult,
  audits: BoundaryAudit[],
): string[] {
  const areas: string[] = [];

  if (audits.length > 0 && below(compliance.complianceRate, 60)) {
    areas.push("Professional boundary compliance at " + compliance.complianceRate + "% — below acceptable threshold, staff require additional guidance and monitoring");
  }

  if (audits.length > 0 && below(safeguarding.childFeedbackSoughtRate, 60)) {
    areas.push("Child feedback sought in only " + safeguarding.childFeedbackSoughtRate + "% of boundary audits — children's voices must be central to safeguarding practice");
  }

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  audits: BoundaryAudit[],
  policy: BoundaryPolicy | null,
  training: StaffBoundaryTraining[],
  _compliance: BoundaryComplianceResult,
  _safeguarding: ChildSafeguardingResult,
): string[] {
  const actions: string[] = [];

  if (audits.length === 0) {
    actions.push("Implement regular professional boundary audits to monitor staff compliance and safeguarding practice");
  }

  if (!policy) {
    actions.push("URGENT: No professional boundary policy in place — develop and implement a comprehensive boundary framework immediately");
  }

  if (training.length === 0) {
    actions.push("URGENT: No staff boundary training records — establish mandatory professional boundary training programme");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 12 — The protection of children",
    "CHR 2015 Regulation 13 — Leadership and management",
    "SCCIF — Safety of children",
    "NMS 19 — Behaviour management",
    "Children Act 1989 — Welfare and safeguarding",
    "Working Together to Safeguard Children 2023",
    "Ofsted ILACS — Impact of leaders on practice",
  ];
}
