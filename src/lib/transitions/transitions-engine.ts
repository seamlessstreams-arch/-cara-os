// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Transitions Intelligence Engine
//
// Deterministic engine for evaluating the quality and compliance of
// transitions in children's homes — admissions, discharges, placement
// changes, step-down/step-up moves, family reunification, independent
// living preparation, and emergency moves.
//
// Aligned to:
//   - CHR 2015 Reg 5 — Engaging with the wider system
//   - CHR 2015 Reg 14 — Care planning (placement plan)
//   - SCCIF — Placement stability and matching decisions
//   - Children Act 1989 — Welfare of the child
//   - Care Planning Regulations 2010
//   - Leaving Care Act 2000
//   - DfE Guide to Children's Homes Regulations
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TransitionCategory =
  | "admission_transition"
  | "discharge_planning"
  | "placement_move"
  | "step_down"
  | "step_up"
  | "family_reunification"
  | "independent_living"
  | "emergency_move";

export type TransitionOutcome =
  | "completed"
  | "partially_completed"
  | "not_completed"
  | "deferred"
  | "emergency_override";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface TransitionRecord {
  id: string;
  childId: string;
  childName: string;
  transitionDate: string;
  category: TransitionCategory;
  transitionPlanInPlace: boolean;
  childPrepared: boolean;
  receivingServiceBriefed: boolean;
  handoverComplete: boolean;
  documentationComplete: boolean;
  timelyProcess: boolean;
}

export interface TransitionPolicy {
  id: string;
  transitionPolicy: boolean;
  placementStabilityGuidance: boolean;
  handoverProtocol: boolean;
  childPreparationFramework: boolean;
  familyInvolvementPolicy: boolean;
  emergencyMoveProtocol: boolean;
  reviewSchedule: boolean;
}

export interface StaffTransitionTraining {
  id: string;
  staffId: string;
  staffName: string;
  transitionPlanning: boolean;
  childPreparation: boolean;
  handoverSkills: boolean;
  familyEngagement: boolean;
  multiAgencyWorking: boolean;
  emotionalSupport: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface TransitionQualityResult {
  overallScore: number;
  rating: Rating;
  totalTransitions: number;
  transitionPlanRate: number;
  childPreparedRate: number;
  receivingBriefedRate: number;
  handoverRate: number;
}

export interface TransitionComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRate: number;
  handoverRate: number;
  categoryDiversityRatio: number;
}

export interface TransitionPolicyResult {
  overallScore: number;
  rating: Rating;
  transitionPolicy: boolean;
  placementStabilityGuidance: boolean;
  handoverProtocol: boolean;
  childPreparationFramework: boolean;
  familyInvolvementPolicy: boolean;
  emergencyMoveProtocol: boolean;
  reviewSchedule: boolean;
}

export interface StaffTransitionReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  transitionPlanningRate: number;
  childPreparationRate: number;
  handoverSkillsRate: number;
  familyEngagementRate: number;
  multiAgencyWorkingRate: number;
  emotionalSupportRate: number;
}

export interface ChildTransitionProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  transitionPlanRate: number;
  childPreparedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface TransitionsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  transitionQuality: TransitionQualityResult;
  transitionCompliance: TransitionComplianceResult;
  transitionPolicy: TransitionPolicyResult;
  staffReadiness: StaffTransitionReadinessResult;
  childProfiles: ChildTransitionProfile[];
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

export function getTransitionCategoryLabel(cat: TransitionCategory): string {
  const labels: Record<TransitionCategory, string> = {
    admission_transition: "Admission Transition",
    discharge_planning: "Discharge Planning",
    placement_move: "Placement Move",
    step_down: "Step Down",
    step_up: "Step Up",
    family_reunification: "Family Reunification",
    independent_living: "Independent Living",
    emergency_move: "Emergency Move",
  };
  return labels[cat] ?? cat;
}

export function getTransitionOutcomeLabel(outcome: TransitionOutcome): string {
  const labels: Record<TransitionOutcome, string> = {
    completed: "Completed",
    partially_completed: "Partially Completed",
    not_completed: "Not Completed",
    deferred: "Deferred",
    emergency_override: "Emergency Override",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: TransitionCategory[] = [
  "admission_transition", "discharge_planning", "placement_move",
  "step_down", "step_up", "family_reunification",
  "independent_living", "emergency_move",
];

// ── Evaluator 1: Transition Quality (0-25) ────────────────────────────────

export function evaluateTransitionQuality(records: TransitionRecord[]): TransitionQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalTransitions: 0, transitionPlanRate: 0, childPreparedRate: 0, receivingBriefedRate: 0, handoverRate: 0 };
  }

  const transitionPlanRate = pct(records.filter((r) => r.transitionPlanInPlace).length, total);
  const childPreparedRate = pct(records.filter((r) => r.childPrepared).length, total);
  const receivingBriefedRate = pct(records.filter((r) => r.receivingServiceBriefed).length, total);
  const handoverRate = pct(records.filter((r) => r.handoverComplete).length, total);

  // Weighted: transitionPlanRate 7 + childPreparedRate 6 + receivingBriefedRate 6 + handoverRate 6 = 25
  const raw = (transitionPlanRate / 100) * 7 + (childPreparedRate / 100) * 6 + (receivingBriefedRate / 100) * 6 + (handoverRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalTransitions: total, transitionPlanRate, childPreparedRate, receivingBriefedRate, handoverRate };
}

// ── Evaluator 2: Transition Compliance (0-25) ─────────────────────────────

export function evaluateTransitionCompliance(records: TransitionRecord[]): TransitionComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: 0, timelyRate: 0, handoverRate: 0, categoryDiversityRatio: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRate = pct(records.filter((r) => r.timelyProcess).length, total);
  const handoverRate = pct(records.filter((r) => r.handoverComplete).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRate 7 + handoverRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate / 100) * 8 + (timelyRate / 100) * 7 + (handoverRate / 100) * 5 + (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRate, handoverRate, categoryDiversityRatio };
}

// ── Evaluator 3: Transition Policy (0-25) ─────────────────────────────────

export function evaluateTransitionPolicy(policy: TransitionPolicy | null): TransitionPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", transitionPolicy: false, placementStabilityGuidance: false, handoverProtocol: false, childPreparationFramework: false, familyInvolvementPolicy: false, emergencyMoveProtocol: false, reviewSchedule: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.transitionPolicy) score += 4;
  if (policy.placementStabilityGuidance) score += 4;
  if (policy.handoverProtocol) score += 4;
  if (policy.childPreparationFramework) score += 4;
  if (policy.familyInvolvementPolicy) score += 3;
  if (policy.emergencyMoveProtocol) score += 3;
  if (policy.reviewSchedule) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    transitionPolicy: policy.transitionPolicy,
    placementStabilityGuidance: policy.placementStabilityGuidance,
    handoverProtocol: policy.handoverProtocol,
    childPreparationFramework: policy.childPreparationFramework,
    familyInvolvementPolicy: policy.familyInvolvementPolicy,
    emergencyMoveProtocol: policy.emergencyMoveProtocol,
    reviewSchedule: policy.reviewSchedule,
  };
}

// ── Evaluator 4: Staff Transition Readiness (0-25) ────────────────────────

export function evaluateStaffTransitionReadiness(staff: StaffTransitionTraining[]): StaffTransitionReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, transitionPlanningRate: 0, childPreparationRate: 0, handoverSkillsRate: 0, familyEngagementRate: 0, multiAgencyWorkingRate: 0, emotionalSupportRate: 0 };
  }

  const transitionPlanningRate = pct(staff.filter((s) => s.transitionPlanning).length, count);
  const childPreparationRate = pct(staff.filter((s) => s.childPreparation).length, count);
  const handoverSkillsRate = pct(staff.filter((s) => s.handoverSkills).length, count);
  const familyEngagementRate = pct(staff.filter((s) => s.familyEngagement).length, count);
  const multiAgencyWorkingRate = pct(staff.filter((s) => s.multiAgencyWorking).length, count);
  const emotionalSupportRate = pct(staff.filter((s) => s.emotionalSupport).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (transitionPlanningRate / 100) * 6 +
    (childPreparationRate / 100) * 5 +
    (handoverSkillsRate / 100) * 5 +
    (familyEngagementRate / 100) * 4 +
    (multiAgencyWorkingRate / 100) * 3 +
    (emotionalSupportRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, transitionPlanningRate, childPreparationRate, handoverSkillsRate, familyEngagementRate, multiAgencyWorkingRate, emotionalSupportRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildTransitionProfiles(records: TransitionRecord[]): ChildTransitionProfile[] {
  const grouped = new Map<string, TransitionRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildTransitionProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const transitionPlanRate = pct(recs.filter((r) => r.transitionPlanInPlace).length, totalRecords);
    const childPreparedRate = pct(recs.filter((r) => r.childPrepared).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 transitionPlanRate [>=80->3, >=60->2, >=40->1] + rate2 childPreparedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (transitionPlanRate >= 80) score += 3;
    else if (transitionPlanRate >= 60) score += 2;
    else if (transitionPlanRate >= 40) score += 1;

    if (childPreparedRate >= 80) score += 3;
    else if (childPreparedRate >= 60) score += 2;
    else if (childPreparedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      transitionPlanRate,
      childPreparedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateTransitionsIntelligence(
  records: TransitionRecord[],
  policy: TransitionPolicy | null,
  staff: StaffTransitionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TransitionsIntelligence {
  const transitionQuality = evaluateTransitionQuality(records);
  const transitionCompliance = evaluateTransitionCompliance(records);
  const transitionPolicy = evaluateTransitionPolicy(policy);
  const staffReadiness = evaluateStaffTransitionReadiness(staff);
  const childProfiles = buildChildTransitionProfiles(records);

  const overallScore = Math.min(
    100,
    transitionQuality.overallScore + transitionCompliance.overallScore + transitionPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (transitionQuality.transitionPlanRate >= 80) strengths.push("Transition plans are consistently in place before moves");
  if (transitionQuality.childPreparedRate >= 80) strengths.push("Children are well prepared ahead of transitions");
  if (transitionQuality.receivingBriefedRate >= 80) strengths.push("Receiving services are routinely briefed before transitions");
  if (transitionQuality.handoverRate >= 80) strengths.push("Handovers are thorough and well managed");
  if (transitionCompliance.documentationRate >= 80) strengths.push("Transition documentation is comprehensive and complete");
  if (transitionCompliance.timelyRate >= 80) strengths.push("Transitions are completed within required timescales");
  if (staffReadiness.transitionPlanningRate >= 80) strengths.push("Staff are well trained in transition planning");
  if (staffReadiness.childPreparationRate >= 80) strengths.push("Strong child preparation skills across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (transitionQuality.transitionPlanRate < 60) areasForImprovement.push("Transition plans are not consistently in place before moves");
  if (transitionQuality.childPreparedRate < 60) areasForImprovement.push("Children are not being adequately prepared for transitions");
  if (transitionQuality.receivingBriefedRate < 60) areasForImprovement.push("Receiving services are not consistently briefed before transitions");
  if (transitionQuality.handoverRate < 60) areasForImprovement.push("Handover processes need improvement");
  if (transitionCompliance.documentationRate < 60) areasForImprovement.push("Transition documentation is incomplete or inconsistent");
  if (transitionCompliance.timelyRate < 60) areasForImprovement.push("Transitions are taking too long to complete");
  if (staffReadiness.transitionPlanningRate < 60) areasForImprovement.push("Staff transition planning skills require development");
  if (staffReadiness.childPreparationRate < 60) areasForImprovement.push("Staff child preparation training needs improvement");

  // Actions
  const actions: string[] = [];
  if (transitionPolicy.overallScore === 0) actions.push("URGENT: Establish a formal transitions policy — CHR 2015 Reg 5 and Reg 14 require documented transition and care planning processes");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide transition planning and handover training to all staff — effective transitions depend on skilled practitioners");
  if (transitionQuality.childPreparedRate < 50) actions.push("Implement systematic child preparation for all transitions — children must be supported through placement changes");
  if (transitionQuality.receivingBriefedRate < 50) actions.push("Ensure receiving services are briefed before every transition — SCCIF requires effective multi-agency coordination");
  if (transitionCompliance.documentationRate < 50) actions.push("Improve transition documentation — placement plans and handover records must be comprehensive (Reg 14)");
  if (transitionCompliance.timelyRate < 50) actions.push("Review transition timescales — moves should be planned and executed within agreed timeframes");
  if (transitionQuality.transitionPlanRate < 50) actions.push("Develop transition plans for all placement moves to support continuity of care");
  if (staffReadiness.familyEngagementRate < 50) actions.push("Train staff in family engagement during transitions — families should be involved throughout the process");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 5 — Engaging with the wider system to benefit children",
    "CHR 2015 Reg 14 — Care planning standard (placement plans)",
    "SCCIF — Placement stability and transition quality",
    "Children Act 1989 — Welfare of the child during transitions",
    "Care Planning Regulations 2010 — Placement plan requirements",
    "Leaving Care Act 2000 — Pathway planning for care leavers",
    "DfE Guide to Children's Homes Regulations: Transitions and stability",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    transitionQuality,
    transitionCompliance,
    transitionPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
