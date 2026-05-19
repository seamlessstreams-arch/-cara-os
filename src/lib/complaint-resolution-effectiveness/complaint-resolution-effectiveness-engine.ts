// ==============================================================================
// Cornerstone -- Complaint Resolution Effectiveness Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls, no randomness, no
// Date.now(). Evaluates how well a children's residential home handles
// complaints from children, families, and professionals -- tracking resolution
// quality, timeliness, and learning.
//
// Regulatory basis:
//   - CHR 2015 Regulation 39 -- Complaints procedure
//   - CHR 2015 Regulation 40 -- Notification of significant events
//   - SCCIF -- Leadership and management
//   - NMS 14 -- Complaints
//   - Children Act 1989 -- Representations and complaints
//   - Ofsted complaints procedure
//   - Children's Commissioner -- Advocacy
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type ComplaintSource =
  | "child"
  | "parent_carer"
  | "professional"
  | "advocate"
  | "staff"
  | "visitor"
  | "anonymous"
  | "regulator";

export type ResolutionOutcome =
  | "fully_resolved"
  | "partially_resolved"
  | "unresolved"
  | "escalated"
  | "withdrawn";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps & Getters -----------------------------------------------------

const complaintSourceLabels: Record<ComplaintSource, string> = {
  child: "Child",
  parent_carer: "Parent/Carer",
  professional: "Professional",
  advocate: "Advocate",
  staff: "Staff",
  visitor: "Visitor",
  anonymous: "Anonymous",
  regulator: "Regulator",
};

export function getComplaintSourceLabel(source: ComplaintSource): string {
  return complaintSourceLabels[source] || source;
}

const resolutionOutcomeLabels: Record<ResolutionOutcome, string> = {
  fully_resolved: "Fully Resolved",
  partially_resolved: "Partially Resolved",
  unresolved: "Unresolved",
  escalated: "Escalated",
  withdrawn: "Withdrawn",
};

export function getResolutionOutcomeLabel(outcome: ResolutionOutcome): string {
  return resolutionOutcomeLabels[outcome] || outcome;
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] || rating;
}

// -- Input Interfaces ---------------------------------------------------------

export interface ComplaintRecord {
  id: string;
  childId: string;
  childName: string;
  complaintDate: string;
  complaintSource: ComplaintSource;
  resolutionOutcome: ResolutionOutcome;
  resolvedWithinTimescale: boolean;
  childInformed: boolean;
  lessonsLearned: boolean;
  actionsTaken: boolean;
  documentedInRecord: boolean;
  complainantSatisfied: boolean;
}

export interface ComplaintPolicy {
  id: string;
  complaintsProcedure: boolean;
  timescaleStandards: boolean;
  childFriendlyProcess: boolean;
  independentAdvocacy: boolean;
  escalationPathway: boolean;
  learningFromComplaints: boolean;
  regularReview: boolean;
}

export interface StaffComplaintTraining {
  id: string;
  staffId: string;
  staffName: string;
  complaintHandling: boolean;
  childFocusedResolution: boolean;
  conflictResolution: boolean;
  documentationSkills: boolean;
  advocacyAwareness: boolean;
  regulatoryRequirements: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface ResolutionQualityResult {
  overallScore: number; // 0-25
  resolutionRate: number; // %
  childInformedRate: number; // %
  lessonsLearnedRate: number; // %
  actionsTakenRate: number; // %
}

export interface ComplaintComplianceResult {
  overallScore: number; // 0-25
  resolvedWithinTimescaleRate: number; // %
  documentedRate: number; // %
  complainantSatisfiedRate: number; // %
  sourceDiversity: number; // 0-1 fraction
}

export interface ComplaintPolicyResult {
  overallScore: number; // 0-25
  complaintsProcedure: boolean;
  timescaleStandards: boolean;
  childFriendlyProcess: boolean;
  independentAdvocacy: boolean;
  escalationPathway: boolean;
  learningFromComplaints: boolean;
  regularReview: boolean;
}

export interface StaffComplaintReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  complaintHandlingRate: number; // %
  childFocusedResolutionRate: number; // %
  conflictResolutionRate: number; // %
  documentationSkillsRate: number; // %
  advocacyAwarenessRate: number; // %
  regulatoryRequirementsRate: number; // %
}

export interface ChildComplaintProfile {
  childId: string;
  childName: string;
  complaintCount: number;
  resolutionRate: number; // %
  childInformedRate: number; // %
  sourceDiversity: number; // unique sources count
  overallScore: number; // 0-10
}

export interface ComplaintResolutionEffectivenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  resolutionQuality: ResolutionQualityResult;
  complaintCompliance: ComplaintComplianceResult;
  complaintPolicy: ComplaintPolicyResult;
  staffComplaintReadiness: StaffComplaintReadinessResult;
  childProfiles: ChildComplaintProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluate resolution quality (0-25).
 *
 * PRESENCE pattern: empty records -> 0.
 * Sub-scores:
 *   resolutionRate (fully_resolved + partially_resolved) -> 0-7
 *   childInformedRate -> 0-6
 *   lessonsLearnedRate -> 0-6
 *   actionsTakenRate -> 0-6
 */
export function evaluateResolutionQuality(
  records: ComplaintRecord[],
): ResolutionQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      resolutionRate: 0,
      childInformedRate: 0,
      lessonsLearnedRate: 0,
      actionsTakenRate: 0,
    };
  }

  const total = records.length;

  const resolved = records.filter(
    (r) =>
      r.resolutionOutcome === "fully_resolved" ||
      r.resolutionOutcome === "partially_resolved",
  );
  const childInformed = records.filter((r) => r.childInformed);
  const lessonsLearned = records.filter((r) => r.lessonsLearned);
  const actionsTaken = records.filter((r) => r.actionsTaken);

  const resolutionRate = pct(resolved.length, total);
  const childInformedRate = pct(childInformed.length, total);
  const lessonsLearnedRate = pct(lessonsLearned.length, total);
  const actionsTakenRate = pct(actionsTaken.length, total);

  // Sub-scores
  const resolutionScore = Math.round((resolutionRate / 100) * 7);
  const childInformedScore = Math.round((childInformedRate / 100) * 6);
  const lessonsLearnedScore = Math.round((lessonsLearnedRate / 100) * 6);
  const actionsTakenScore = Math.round((actionsTakenRate / 100) * 6);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      resolutionScore + childInformedScore + lessonsLearnedScore + actionsTakenScore,
    ),
  );

  return {
    overallScore,
    resolutionRate,
    childInformedRate,
    lessonsLearnedRate,
    actionsTakenRate,
  };
}

/**
 * Evaluate complaint compliance (0-25).
 *
 * PRESENCE pattern: empty records -> 0.
 * Sub-scores:
 *   resolvedWithinTimescaleRate -> 0-8
 *   documentedRate -> 0-7
 *   complainantSatisfiedRate -> 0-5
 *   sourceDiversity (unique sources / 8) -> 0-5
 */
export function evaluateComplaintCompliance(
  records: ComplaintRecord[],
): ComplaintComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      resolvedWithinTimescaleRate: 0,
      documentedRate: 0,
      complainantSatisfiedRate: 0,
      sourceDiversity: 0,
    };
  }

  const total = records.length;

  const resolvedInTime = records.filter((r) => r.resolvedWithinTimescale);
  const documented = records.filter((r) => r.documentedInRecord);
  const satisfied = records.filter((r) => r.complainantSatisfied);

  const uniqueSources = new Set(records.map((r) => r.complaintSource));
  const sourceDiversityFraction = uniqueSources.size / 8;

  const resolvedWithinTimescaleRate = pct(resolvedInTime.length, total);
  const documentedRate = pct(documented.length, total);
  const complainantSatisfiedRate = pct(satisfied.length, total);

  // Sub-scores
  const timescaleScore = Math.round((resolvedWithinTimescaleRate / 100) * 8);
  const documentedScore = Math.round((documentedRate / 100) * 7);
  const satisfiedScore = Math.round((complainantSatisfiedRate / 100) * 5);
  const diversityScore = Math.round(Math.min(1, sourceDiversityFraction) * 5);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      timescaleScore + documentedScore + satisfiedScore + diversityScore,
    ),
  );

  return {
    overallScore,
    resolvedWithinTimescaleRate,
    documentedRate,
    complainantSatisfiedRate,
    sourceDiversity: sourceDiversityFraction,
  };
}

/**
 * Evaluate complaint policy (0-25).
 *
 * Accepts null -> 0.
 * 7 booleans weighted: 4+4+4+4+3+3+3 = 25.
 */
export function evaluateComplaintPolicy(
  policy: ComplaintPolicy | null,
): ComplaintPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      complaintsProcedure: false,
      timescaleStandards: false,
      childFriendlyProcess: false,
      independentAdvocacy: false,
      escalationPathway: false,
      learningFromComplaints: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.complaintsProcedure) score += 4;
  if (policy.timescaleStandards) score += 4;
  if (policy.childFriendlyProcess) score += 4;
  if (policy.independentAdvocacy) score += 4;
  if (policy.escalationPathway) score += 3;
  if (policy.learningFromComplaints) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    complaintsProcedure: policy.complaintsProcedure,
    timescaleStandards: policy.timescaleStandards,
    childFriendlyProcess: policy.childFriendlyProcess,
    independentAdvocacy: policy.independentAdvocacy,
    escalationPathway: policy.escalationPathway,
    learningFromComplaints: policy.learningFromComplaints,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluate staff complaint readiness (0-25).
 *
 * PRESENCE pattern: empty training -> 0.
 * 6 skills weighted: 6+5+5+4+3+2 = 25.
 * Each skill rate = pct(trained, total), partial score = round(rate/100 * weight).
 */
export function evaluateStaffComplaintReadiness(
  training: StaffComplaintTraining[],
): StaffComplaintReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      complaintHandlingRate: 0,
      childFocusedResolutionRate: 0,
      conflictResolutionRate: 0,
      documentationSkillsRate: 0,
      advocacyAwarenessRate: 0,
      regulatoryRequirementsRate: 0,
    };
  }

  const total = training.length;

  const complaintHandlingCount = training.filter((t) => t.complaintHandling).length;
  const childFocusedCount = training.filter((t) => t.childFocusedResolution).length;
  const conflictCount = training.filter((t) => t.conflictResolution).length;
  const documentationCount = training.filter((t) => t.documentationSkills).length;
  const advocacyCount = training.filter((t) => t.advocacyAwareness).length;
  const regulatoryCount = training.filter((t) => t.regulatoryRequirements).length;

  const complaintHandlingRate = pct(complaintHandlingCount, total);
  const childFocusedResolutionRate = pct(childFocusedCount, total);
  const conflictResolutionRate = pct(conflictCount, total);
  const documentationSkillsRate = pct(documentationCount, total);
  const advocacyAwarenessRate = pct(advocacyCount, total);
  const regulatoryRequirementsRate = pct(regulatoryCount, total);

  // Weighted sub-scores: 6+5+5+4+3+2 = 25
  const s1 = Math.round((complaintHandlingRate / 100) * 6);
  const s2 = Math.round((childFocusedResolutionRate / 100) * 5);
  const s3 = Math.round((conflictResolutionRate / 100) * 5);
  const s4 = Math.round((documentationSkillsRate / 100) * 4);
  const s5 = Math.round((advocacyAwarenessRate / 100) * 3);
  const s6 = Math.round((regulatoryRequirementsRate / 100) * 2);

  const overallScore = Math.min(25, Math.max(0, s1 + s2 + s3 + s4 + s5 + s6));

  return {
    overallScore,
    totalStaff: total,
    complaintHandlingRate,
    childFocusedResolutionRate,
    conflictResolutionRate,
    documentationSkillsRate,
    advocacyAwarenessRate,
    regulatoryRequirementsRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

/**
 * Build per-child complaint profiles.
 *
 * Group by childId, per-child score 0-10 based on:
 *   frequency (0-2): >=10 -> 2, >=5 -> 1, else 0
 *   resolutionRate (0-3): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
 *   childInformedRate (0-3): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
 *   diversity (0-2): unique sources >=4 -> 2, >=2 -> 1, else 0
 */
export function buildChildComplaintProfiles(
  records: ComplaintRecord[],
): ChildComplaintProfile[] {
  const grouped = new Map<string, ComplaintRecord[]>();

  for (const record of records) {
    const existing = grouped.get(record.childId) || [];
    existing.push(record);
    grouped.set(record.childId, existing);
  }

  const profiles: ChildComplaintProfile[] = [];

  for (const [childId, childRecords] of grouped) {
    const childName = childRecords[0].childName;
    const count = childRecords.length;

    const resolved = childRecords.filter(
      (r) =>
        r.resolutionOutcome === "fully_resolved" ||
        r.resolutionOutcome === "partially_resolved",
    );
    const informed = childRecords.filter((r) => r.childInformed);
    const uniqueSources = new Set(childRecords.map((r) => r.complaintSource));

    const resolutionRate = pct(resolved.length, count);
    const childInformedRate = pct(informed.length, count);
    const sourceDiversity = uniqueSources.size;

    // Score components
    let frequencyScore = 0;
    if (count >= 10) frequencyScore = 2;
    else if (count >= 5) frequencyScore = 1;

    let resolutionScore = 0;
    if (resolutionRate >= 80) resolutionScore = 3;
    else if (resolutionRate >= 60) resolutionScore = 2;
    else if (resolutionRate >= 40) resolutionScore = 1;

    let informedScore = 0;
    if (childInformedRate >= 80) informedScore = 3;
    else if (childInformedRate >= 60) informedScore = 2;
    else if (childInformedRate >= 40) informedScore = 1;

    let diversityScore = 0;
    if (sourceDiversity >= 4) diversityScore = 2;
    else if (sourceDiversity >= 2) diversityScore = 1;

    const overallScore = Math.min(
      10,
      Math.max(0, frequencyScore + resolutionScore + informedScore + diversityScore),
    );

    profiles.push({
      childId,
      childName,
      complaintCount: count,
      resolutionRate,
      childInformedRate,
      sourceDiversity,
      overallScore,
    });
  }

  return profiles;
}

// -- Orchestrator -------------------------------------------------------------

export function generateComplaintResolutionEffectivenessIntelligence(
  records: ComplaintRecord[],
  policy: ComplaintPolicy | null,
  training: StaffComplaintTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ComplaintResolutionEffectivenessIntelligence {
  const resolutionQuality = evaluateResolutionQuality(records);
  const complaintCompliance = evaluateComplaintCompliance(records);
  const complaintPolicyResult = evaluateComplaintPolicy(policy);
  const staffComplaintReadiness = evaluateStaffComplaintReadiness(training);

  const childProfiles = buildChildComplaintProfiles(records);

  // Overall score: sum of 4 evaluators (each 0-25), capped at 100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      resolutionQuality.overallScore +
        complaintCompliance.overallScore +
        complaintPolicyResult.overallScore +
        staffComplaintReadiness.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // -- Strengths (when rate >= 80) --
  const strengths: string[] = [];

  if (records.length > 0 && resolutionQuality.resolutionRate >= 80) {
    strengths.push(
      "Strong complaint resolution rate demonstrates effective handling of concerns raised",
    );
  }
  if (records.length > 0 && resolutionQuality.childInformedRate >= 80) {
    strengths.push(
      "Children consistently informed of complaint outcomes, supporting their right to be heard",
    );
  }
  if (records.length > 0 && resolutionQuality.lessonsLearnedRate >= 80) {
    strengths.push(
      "Good learning from complaints culture with lessons identified and applied",
    );
  }
  if (records.length > 0 && complaintCompliance.documentedRate >= 80) {
    strengths.push(
      "Excellent documentation of complaints ensures accountability and transparency",
    );
  }

  // -- Areas for improvement --
  const areasForImprovement: string[] = [];

  if (records.length > 0 && resolutionQuality.resolutionRate < 80) {
    areasForImprovement.push(
      `Resolution rate at ${resolutionQuality.resolutionRate}% -- target is 80% or above`,
    );
  }
  if (records.length > 0 && resolutionQuality.childInformedRate < 80) {
    areasForImprovement.push(
      `Only ${resolutionQuality.childInformedRate}% of children informed of complaint outcomes`,
    );
  }
  if (records.length > 0 && complaintCompliance.resolvedWithinTimescaleRate < 80) {
    areasForImprovement.push(
      `Only ${complaintCompliance.resolvedWithinTimescaleRate}% of complaints resolved within timescales`,
    );
  }
  if (records.length > 0 && complaintCompliance.complainantSatisfiedRate < 80) {
    areasForImprovement.push(
      `Complainant satisfaction at ${complaintCompliance.complainantSatisfiedRate}% -- needs attention`,
    );
  }

  // -- Actions --
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push(
      "No complaint records found -- ensure complaints process is accessible and records are maintained",
    );
  }
  if (!policy) {
    actions.push(
      "URGENT: Develop and implement a comprehensive complaints policy covering all regulatory requirements",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: Provide complaint handling training to all staff to ensure effective resolution of concerns",
    );
  }
  if (
    records.length > 0 &&
    complaintCompliance.resolvedWithinTimescaleRate < 80
  ) {
    actions.push(
      "Improve resolution timescales by implementing tracking systems and escalation triggers",
    );
  }
  if (
    records.length > 0 &&
    complaintCompliance.complainantSatisfiedRate < 80
  ) {
    actions.push(
      "Address complainant satisfaction through improved communication and follow-up during resolution",
    );
  }

  // -- Regulatory links --
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 39 -- Complaints procedure for children's homes",
    "CHR 2015 Regulation 40 -- Notification of significant events including complaints",
    "SCCIF -- Leadership and management: handling complaints effectively",
    "NMS 14 -- Complaints: children and others can make complaints and these are addressed properly",
    "Children Act 1989 -- Representations and complaints procedures for looked-after children",
    "Ofsted complaints procedure -- Guidance on handling complaints about children's homes",
    "Children's Commissioner -- Advocacy services ensuring children's voices are heard in complaints",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    resolutionQuality,
    complaintCompliance,
    complaintPolicy: complaintPolicyResult,
    staffComplaintReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
