/* ──────────────────────────────────────────────────────────────
   Sanctions Intelligence Engine

   Pure deterministic engine for evaluating how well a children's
   residential home manages sanctions and consequences — tracking
   fairness, proportionality, documentation quality, child views,
   and regulatory compliance.

   Regulatory basis:
     - CHR 2015, Reg 19 — Behaviour management (sanctions must be
       proportionate, recorded, and understood by children)
     - Children Act 1989, s.22 — Duty to safeguard and promote
       welfare (sanctions must not harm)
     - UNCRC Article 12 — Child's right to be heard (child views
       must be recorded for every sanction)
     - UNCRC Article 37 — Freedom from cruel or degrading treatment
     - Ofsted SCCIF — Social Care Common Inspection Framework:
       behaviour management approaches, proportionality, child voice
     - CHR 2015, Reg 45 — Records (sanctions must be documented)
     - CHR 2015, Reg 44 — Independent person: reviewing sanctions

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type SanctionType =
  | "loss_of_privilege"
  | "additional_chore"
  | "earlier_bedtime"
  | "restricted_screen_time"
  | "grounding"
  | "verbal_warning"
  | "written_warning"
  | "restorative_task";

export type SanctionOutcome =
  | "accepted_by_child"
  | "disputed_by_child"
  | "partially_accepted"
  | "escalated"
  | "not_recorded";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ───────────────────────────────────────────────────

const sanctionTypeLabels: Record<SanctionType, string> = {
  loss_of_privilege: "Loss of Privilege",
  additional_chore: "Additional Chore",
  earlier_bedtime: "Earlier Bedtime",
  restricted_screen_time: "Restricted Screen Time",
  grounding: "Grounding",
  verbal_warning: "Verbal Warning",
  written_warning: "Written Warning",
  restorative_task: "Restorative Task",
};

export function getSanctionTypeLabel(type: SanctionType): string {
  return sanctionTypeLabels[type] ?? type;
}

const sanctionOutcomeLabels: Record<SanctionOutcome, string> = {
  accepted_by_child: "Accepted by Child",
  disputed_by_child: "Disputed by Child",
  partially_accepted: "Partially Accepted",
  escalated: "Escalated",
  not_recorded: "Not Recorded",
};

export function getSanctionOutcomeLabel(outcome: SanctionOutcome): string {
  return sanctionOutcomeLabels[outcome] ?? outcome;
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] ?? rating;
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SanctionRecord {
  id: string;
  childId: string;
  childName: string;
  sanctionDate: string;
  sanctionType: SanctionType;
  outcome: SanctionOutcome;
  proportionateToIncident: boolean;
  childViewsRecorded: boolean;
  parentNotified: boolean;
  documentedProperly: boolean;
  staffApplied: boolean;
  reviewScheduled: boolean;
}

export interface SanctionPolicy {
  id: string;
  behaviourManagementPolicy: boolean;
  sanctionsGuidance: boolean;
  prohibitedSanctionsList: boolean;
  childParticipationProcess: boolean;
  complaintsMechanism: boolean;
  restorativeApproach: boolean;
  regularReview: boolean;
}

export interface StaffSanctionTraining {
  id: string;
  staffId: string;
  staffName: string;
  behaviourManagement: boolean;
  proportionalityAssessment: boolean;
  restorativeApproach: boolean;
  childRightsAwareness: boolean;
  documentationSkills: boolean;
  deEscalationFirst: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SanctionQualityEvaluation {
  totalRecords: number;
  proportionateRate: number;
  childViewsRate: number;
  acceptanceRate: number;
  documentedRate: number;
  overallScore: number;
}

export interface SanctionComplianceEvaluation {
  totalRecords: number;
  parentNotifiedRate: number;
  staffAppliedRate: number;
  reviewScheduledRate: number;
  typeDiversityRatio: number;
  overallScore: number;
}

export interface SanctionPolicyEvaluation {
  behaviourManagementPolicy: boolean;
  sanctionsGuidance: boolean;
  prohibitedSanctionsList: boolean;
  childParticipationProcess: boolean;
  complaintsMechanism: boolean;
  restorativeApproach: boolean;
  regularReview: boolean;
  overallScore: number;
}

export interface StaffSanctionReadinessEvaluation {
  totalStaff: number;
  behaviourManagementRate: number;
  proportionalityAssessmentRate: number;
  restorativeApproachRate: number;
  childRightsAwarenessRate: number;
  documentationSkillsRate: number;
  deEscalationFirstRate: number;
  overallScore: number;
}

export interface ChildSanctionProfile {
  childId: string;
  childName: string;
  totalSanctions: number;
  sanctionTypes: string[];
  proportionateRate: number;
  childViewsRate: number;
  escalatedCount: number;
  sanctionScore: number;
}

export interface SanctionsIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sanctionQuality: SanctionQualityEvaluation;
  sanctionCompliance: SanctionComplianceEvaluation;
  sanctionPolicy: SanctionPolicyEvaluation;
  staffSanctionReadiness: StaffSanctionReadinessEvaluation;
  childSanctionProfiles: ChildSanctionProfile[];
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── 1. Evaluate Sanction Quality (0-25) ────────────────────────────────────

export function evaluateSanctionQuality(
  records: SanctionRecord[],
): SanctionQualityEvaluation {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      proportionateRate: 0,
      childViewsRate: 0,
      acceptanceRate: 0,
      documentedRate: 0,
      overallScore: 0,
    };
  }

  const total = records.length;

  const proportionate = records.filter((r) => r.proportionateToIncident).length;
  const proportionateRate = pct(proportionate, total);

  const childViews = records.filter((r) => r.childViewsRecorded).length;
  const childViewsRate = pct(childViews, total);

  const accepted = records.filter((r) => r.outcome === "accepted_by_child").length;
  const acceptanceRate = pct(accepted, total);

  const documented = records.filter((r) => r.documentedProperly).length;
  const documentedRate = pct(documented, total);

  // Weights: proportionateRate 7 + childViewsRate 6 + acceptanceRate 6 + documentedRate 6 = 25
  const s1 = Math.round((proportionateRate / 100) * 7);
  const s2 = Math.round((childViewsRate / 100) * 6);
  const s3 = Math.round((acceptanceRate / 100) * 6);
  const s4 = Math.round((documentedRate / 100) * 6);

  const overallScore = clamp(s1 + s2 + s3 + s4, 0, 25);

  return {
    totalRecords: total,
    proportionateRate,
    childViewsRate,
    acceptanceRate,
    documentedRate,
    overallScore,
  };
}

// ── 2. Evaluate Sanction Compliance (0-25) ─────────────────────────────────

export function evaluateSanctionCompliance(
  records: SanctionRecord[],
): SanctionComplianceEvaluation {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      parentNotifiedRate: 0,
      staffAppliedRate: 0,
      reviewScheduledRate: 0,
      typeDiversityRatio: 0,
      overallScore: 0,
    };
  }

  const total = records.length;

  const parentNotified = records.filter((r) => r.parentNotified).length;
  const parentNotifiedRate = pct(parentNotified, total);

  const staffApplied = records.filter((r) => r.staffApplied).length;
  const staffAppliedRate = pct(staffApplied, total);

  const reviewScheduled = records.filter((r) => r.reviewScheduled).length;
  const reviewScheduledRate = pct(reviewScheduled, total);

  // Type diversity: unique sanction types / 8 (total possible types)
  const uniqueTypes = new Set(records.map((r) => r.sanctionType)).size;
  const typeDiversityRatio = Math.round((uniqueTypes / 8) * 100);

  // Weights: parentNotifiedRate 8 + staffAppliedRate 7 + reviewScheduledRate 5 + typeDiversityRatio 5 = 25
  const s1 = Math.round((parentNotifiedRate / 100) * 8);
  const s2 = Math.round((staffAppliedRate / 100) * 7);
  const s3 = Math.round((reviewScheduledRate / 100) * 5);
  const s4 = Math.round((typeDiversityRatio / 100) * 5);

  const overallScore = clamp(s1 + s2 + s3 + s4, 0, 25);

  return {
    totalRecords: total,
    parentNotifiedRate,
    staffAppliedRate,
    reviewScheduledRate,
    typeDiversityRatio,
    overallScore,
  };
}

// ── 3. Evaluate Sanction Policy (0-25) ─────────────────────────────────────

export function evaluateSanctionPolicy(
  policy: SanctionPolicy | null,
): SanctionPolicyEvaluation {
  if (!policy) {
    return {
      behaviourManagementPolicy: false,
      sanctionsGuidance: false,
      prohibitedSanctionsList: false,
      childParticipationProcess: false,
      complaintsMechanism: false,
      restorativeApproach: false,
      regularReview: false,
      overallScore: 0,
    };
  }

  // Weights: 4+4+4+4+3+3+3 = 25
  let overallScore = 0;
  if (policy.behaviourManagementPolicy) overallScore += 4;
  if (policy.sanctionsGuidance) overallScore += 4;
  if (policy.prohibitedSanctionsList) overallScore += 4;
  if (policy.childParticipationProcess) overallScore += 4;
  if (policy.complaintsMechanism) overallScore += 3;
  if (policy.restorativeApproach) overallScore += 3;
  if (policy.regularReview) overallScore += 3;

  return {
    behaviourManagementPolicy: policy.behaviourManagementPolicy,
    sanctionsGuidance: policy.sanctionsGuidance,
    prohibitedSanctionsList: policy.prohibitedSanctionsList,
    childParticipationProcess: policy.childParticipationProcess,
    complaintsMechanism: policy.complaintsMechanism,
    restorativeApproach: policy.restorativeApproach,
    regularReview: policy.regularReview,
    overallScore,
  };
}

// ── 4. Evaluate Staff Sanction Readiness (0-25) ────────────────────────────

export function evaluateStaffSanctionReadiness(
  training: StaffSanctionTraining[],
): StaffSanctionReadinessEvaluation {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      behaviourManagementRate: 0,
      proportionalityAssessmentRate: 0,
      restorativeApproachRate: 0,
      childRightsAwarenessRate: 0,
      documentationSkillsRate: 0,
      deEscalationFirstRate: 0,
      overallScore: 0,
    };
  }

  const total = training.length;

  const behaviourManagement = training.filter((t) => t.behaviourManagement).length;
  const behaviourManagementRate = pct(behaviourManagement, total);

  const proportionalityAssessment = training.filter((t) => t.proportionalityAssessment).length;
  const proportionalityAssessmentRate = pct(proportionalityAssessment, total);

  const restorativeApproach = training.filter((t) => t.restorativeApproach).length;
  const restorativeApproachRate = pct(restorativeApproach, total);

  const childRightsAwareness = training.filter((t) => t.childRightsAwareness).length;
  const childRightsAwarenessRate = pct(childRightsAwareness, total);

  const documentationSkills = training.filter((t) => t.documentationSkills).length;
  const documentationSkillsRate = pct(documentationSkills, total);

  const deEscalationFirst = training.filter((t) => t.deEscalationFirst).length;
  const deEscalationFirstRate = pct(deEscalationFirst, total);

  // Weights: behaviourManagement=6 + proportionalityAssessment=5 + restorativeApproach=5
  //          + childRightsAwareness=4 + documentationSkills=3 + deEscalationFirst=2 = 25
  const s1 = Math.round((behaviourManagementRate / 100) * 6);
  const s2 = Math.round((proportionalityAssessmentRate / 100) * 5);
  const s3 = Math.round((restorativeApproachRate / 100) * 5);
  const s4 = Math.round((childRightsAwarenessRate / 100) * 4);
  const s5 = Math.round((documentationSkillsRate / 100) * 3);
  const s6 = Math.round((deEscalationFirstRate / 100) * 2);

  const overallScore = clamp(s1 + s2 + s3 + s4 + s5 + s6, 0, 25);

  return {
    totalStaff: total,
    behaviourManagementRate,
    proportionalityAssessmentRate,
    restorativeApproachRate,
    childRightsAwarenessRate,
    documentationSkillsRate,
    deEscalationFirstRate,
    overallScore,
  };
}

// ── 5. Build Child Sanction Profiles ───────────────────────────────────────

export function buildChildSanctionProfiles(
  records: SanctionRecord[],
): ChildSanctionProfile[] {
  const childMap = new Map<string, SanctionRecord[]>();
  for (const r of records) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  const profiles: ChildSanctionProfile[] = [];

  for (const [childId, childRecords] of childMap) {
    const total = childRecords.length;
    const childName = childRecords[0].childName;

    const sanctionTypes = Array.from(new Set(childRecords.map((r) => r.sanctionType)));

    const proportionate = childRecords.filter((r) => r.proportionateToIncident).length;
    const proportionateRate = pct(proportionate, total);

    const childViews = childRecords.filter((r) => r.childViewsRecorded).length;
    const childViewsRate = pct(childViews, total);

    const escalatedCount = childRecords.filter((r) => r.outcome === "escalated").length;

    // Score 0-10:
    // freq: fewer sanctions is BETTER. <=2 -> 3, <=5 -> 2, <=8 -> 1, else 0
    let freq = 0;
    if (total <= 2) freq = 3;
    else if (total <= 5) freq = 2;
    else if (total <= 8) freq = 1;

    // rate1 (proportionateRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1 = 0;
    if (proportionateRate >= 80) rate1 = 3;
    else if (proportionateRate >= 60) rate1 = 2;
    else if (proportionateRate >= 40) rate1 = 1;

    // rate2 (childViewsRate): same thresholds
    let rate2 = 0;
    if (childViewsRate >= 80) rate2 = 3;
    else if (childViewsRate >= 60) rate2 = 2;
    else if (childViewsRate >= 40) rate2 = 1;

    // noEscalation: 0 escalated outcomes -> 1, else 0
    const noEscalation = escalatedCount === 0 ? 1 : 0;

    const sanctionScore = clamp(freq + rate1 + rate2 + noEscalation, 0, 10);

    profiles.push({
      childId,
      childName,
      totalSanctions: total,
      sanctionTypes,
      proportionateRate,
      childViewsRate,
      escalatedCount,
      sanctionScore,
    });
  }

  return profiles;
}

// ── 6. Generate Full Sanctions Intelligence ────────────────────────────────

export function generateSanctionsIntelligence(
  records: SanctionRecord[],
  policy: SanctionPolicy | null,
  training: StaffSanctionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SanctionsIntelligence {
  const qualityEval = evaluateSanctionQuality(records);
  const complianceEval = evaluateSanctionCompliance(records);
  const policyEval = evaluateSanctionPolicy(policy);
  const staffEval = evaluateStaffSanctionReadiness(training);
  const childProfiles = buildChildSanctionProfiles(records);

  // ── Overall Score (100 points) ──────────────────────────────────────────
  const overallScore = clamp(
    qualityEval.overallScore +
      complianceEval.overallScore +
      policyEval.overallScore +
      staffEval.overallScore,
    0,
    100,
  );

  const rating = getRating(overallScore);

  // ── Strengths (evaluator.overallScore >= 20) ────────────────────────────
  const strengths: string[] = [];

  if (qualityEval.overallScore >= 20) {
    strengths.push("Sanction quality is strong — proportionality, child views, acceptance and documentation are all at high levels");
  }
  if (complianceEval.overallScore >= 20) {
    strengths.push("Sanctions compliance is excellent — parents notified, staff consistently applying, reviews scheduled, and good type diversity");
  }
  if (policyEval.overallScore >= 20) {
    strengths.push("Sanctions policy framework is comprehensive — behaviour management, guidance, prohibited lists, and child participation well established");
  }
  if (staffEval.overallScore >= 20) {
    strengths.push("Staff sanction readiness is at a high level — behaviour management, proportionality, restorative approaches, and rights awareness well embedded");
  }

  if (qualityEval.proportionateRate === 100 && qualityEval.totalRecords > 0) {
    strengths.push("All sanctions assessed as proportionate to the incident — fair and consistent practice");
  }
  if (qualityEval.childViewsRate === 100 && qualityEval.totalRecords > 0) {
    strengths.push("Child views recorded for every sanction — demonstrating commitment to UNCRC Article 12");
  }
  if (qualityEval.acceptanceRate >= 80 && qualityEval.totalRecords > 0) {
    strengths.push("High acceptance rate among children — sanctions are understood and perceived as fair");
  }
  if (complianceEval.parentNotifiedRate === 100 && complianceEval.totalRecords > 0) {
    strengths.push("Parents/carers notified for all sanctions — excellent partnership working");
  }

  // ── Areas for Improvement (evaluator.overallScore < 15) ─────────────────
  const areasForImprovement: string[] = [];

  if (qualityEval.overallScore < 15) {
    areasForImprovement.push("Sanction quality needs improvement — review proportionality, child views recording, acceptance rates, and documentation");
  }
  if (complianceEval.overallScore < 15) {
    areasForImprovement.push("Sanctions compliance is below expected standards — parent notification, staff application, and review scheduling need attention");
  }
  if (policyEval.overallScore < 15) {
    areasForImprovement.push("Sanctions policy framework has significant gaps — key policies and guidance documents are missing or incomplete");
  }
  if (staffEval.overallScore < 15) {
    areasForImprovement.push("Staff sanction readiness is insufficient — training in behaviour management, proportionality, and restorative approaches required");
  }

  if (qualityEval.childViewsRate < 100 && qualityEval.totalRecords > 0) {
    areasForImprovement.push("Child views not consistently recorded — every sanction must include the child's perspective (UNCRC Article 12)");
  }
  if (qualityEval.proportionateRate < 100 && qualityEval.totalRecords > 0) {
    areasForImprovement.push("Not all sanctions assessed as proportionate — review individual cases and provide staff guidance on proportionality");
  }
  if (qualityEval.documentedRate < 100 && qualityEval.totalRecords > 0) {
    areasForImprovement.push("Documentation gaps identified — all sanctions must be properly recorded per CHR 2015 Reg 45");
  }
  if (complianceEval.parentNotifiedRate < 100 && complianceEval.totalRecords > 0) {
    areasForImprovement.push("Parents/carers not always notified of sanctions — notification is required for transparency and partnership working");
  }
  if (complianceEval.reviewScheduledRate < 100 && complianceEval.totalRecords > 0) {
    areasForImprovement.push("Not all sanctions have reviews scheduled — regular review ensures ongoing proportionality and child welfare");
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  const actions: string[] = [];

  // URGENT when policy=0 or staff=0
  if (policyEval.overallScore === 0) {
    actions.push("URGENT: No sanctions policy in place. Develop and implement a comprehensive behaviour management and sanctions policy immediately (CHR 2015, Reg 19)");
  }
  if (staffEval.overallScore === 0) {
    actions.push("URGENT: No staff have completed sanctions-related training. Arrange behaviour management and proportionality training for all staff immediately");
  }

  // Conditional on rates < 50
  if (qualityEval.proportionateRate < 50 && qualityEval.totalRecords > 0) {
    actions.push("Proportionality rate is critically low — conduct an immediate review of all recent sanctions and provide staff supervision on proportionate responses");
  }
  if (qualityEval.childViewsRate < 50 && qualityEval.totalRecords > 0) {
    actions.push("Child views recording rate is critically low — implement a mandatory child views section in all sanction records and train staff on capturing children's perspectives");
  }
  if (qualityEval.acceptanceRate < 50 && qualityEval.totalRecords > 0) {
    actions.push("Low acceptance rate indicates children may not understand or agree with sanctions — review approach and consider restorative practices");
  }
  if (qualityEval.documentedRate < 50 && qualityEval.totalRecords > 0) {
    actions.push("Documentation rate is critically low — implement immediate audit of sanction recording practices and provide documentation training");
  }
  if (complianceEval.parentNotifiedRate < 50 && complianceEval.totalRecords > 0) {
    actions.push("Parent notification rate is critically low — establish a systematic notification process for all sanctions");
  }
  if (complianceEval.staffAppliedRate < 50 && complianceEval.totalRecords > 0) {
    actions.push("Staff application rate is critically low — review staffing arrangements and ensure sanctions are applied by appropriately trained staff");
  }
  if (complianceEval.reviewScheduledRate < 50 && complianceEval.totalRecords > 0) {
    actions.push("Review scheduling rate is critically low — implement a mandatory review process for all sanctions within 7 days");
  }

  if (actions.length === 0) {
    actions.push("No urgent actions required. Continue monitoring sanctions practice and maintain current standards.");
  }

  // ── Regulatory Links (exactly 7) ────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 19 — Behaviour management: sanctions must be proportionate, understood by children, and not degrading or harmful",
    "Children Act 1989, s.22 — General duty of the local authority to safeguard and promote the welfare of looked after children",
    "UNCRC Article 12 — The right of the child to express views freely in all matters affecting them, including sanctions",
    "UNCRC Article 37 — No child shall be subjected to cruel, inhuman, or degrading treatment or punishment",
    "Ofsted SCCIF — Social Care Common Inspection Framework: behaviour management approaches must be fair, proportionate, and child-centred",
    "CHR 2015, Reg 45 — Records: all sanctions must be documented with date, type, reason, child views, and outcome",
    "CHR 2015, Reg 44 — Independent person: reviewing the use of sanctions and behaviour management approaches",
  ];

  return {
    homeId,
    assessedAt: new Date().toISOString(),
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sanctionQuality: qualityEval,
    sanctionCompliance: complianceEval,
    sanctionPolicy: policyEval,
    staffSanctionReadiness: staffEval,
    childSanctionProfiles: childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
