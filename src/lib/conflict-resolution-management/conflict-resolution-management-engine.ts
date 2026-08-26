import { below, meets, rate } from "@/lib/metrics/rate";
// Conflict Resolution Management Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type ConflictType =
  | "peer_disagreement"
  | "staff_child_conflict"
  | "bullying_incident"
  | "property_dispute"
  | "boundary_challenge"
  | "group_tension"
  | "verbal_altercation"
  | "physical_altercation";

export type ResolutionOutcome =
  | "fully_resolved"
  | "partially_resolved"
  | "ongoing_management"
  | "escalated"
  | "unresolved";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  peer_disagreement: "Peer Disagreement",
  staff_child_conflict: "Staff–Child Conflict",
  bullying_incident: "Bullying Incident",
  property_dispute: "Property Dispute",
  boundary_challenge: "Boundary Challenge",
  group_tension: "Group Tension",
  verbal_altercation: "Verbal Altercation",
  physical_altercation: "Physical Altercation",
};

const RESOLUTION_OUTCOME_LABELS: Record<ResolutionOutcome, string> = {
  fully_resolved: "Fully Resolved",
  partially_resolved: "Partially Resolved",
  ongoing_management: "Ongoing Management",
  escalated: "Escalated",
  unresolved: "Unresolved",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getConflictTypeLabel(v: ConflictType): string { return CONFLICT_TYPE_LABELS[v]; }
export function getResolutionOutcomeLabel(v: ResolutionOutcome): string { return RESOLUTION_OUTCOME_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface ConflictIncident {
  id: string;
  childId: string;
  childName: string;
  incidentDate: string;
  conflictType: ConflictType;
  resolutionOutcome: ResolutionOutcome;
  deEscalationUsed: boolean;
  childVoiceHeard: boolean;
  restorativePractice: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface ConflictResolutionPolicy {
  id: string;
  behaviourManagementStrategy: boolean;
  deEscalationProtocol: boolean;
  restorativePracticeFramework: boolean;
  antibullyingPolicy: boolean;
  physicalInterventionGuidance: boolean;
  childParticipationInResolution: boolean;
  regularReview: boolean;
}

export interface StaffConflictResolutionTraining {
  id: string;
  staffId: string;
  staffName: string;
  deEscalationTechniques: boolean;
  restorativePractice: boolean;
  conflictMediation: boolean;
  traumaInformedResponse: boolean;
  physicalInterventionCertified: boolean;
  reflectiveDebrief: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface ConflictQualityResult {
  overallScore: number;
  totalIncidents: number;
  /** null when the population is empty — nothing measured, not 0%. */
  resolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childVoiceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  restorativeRate: number | null;
}

export interface ConflictComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffSupportedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictTypeDiversityRatio: number | null;
}

export interface ConflictPolicyResult {
  overallScore: number;
  behaviourManagementStrategy: boolean;
  deEscalationProtocol: boolean;
  restorativePracticeFramework: boolean;
  antibullyingPolicy: boolean;
  physicalInterventionGuidance: boolean;
  childParticipationInResolution: boolean;
  regularReview: boolean;
}

export interface StaffConflictReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationTechniquesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  restorativePracticeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictMediationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  traumaInformedResponseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  physicalInterventionCertifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reflectiveDebriefRate: number | null;
}

export interface ChildConflictProfile {
  childId: string;
  childName: string;
  totalIncidents: number;
  /** null when the population is empty — nothing measured, not 0%. */
  resolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childVoiceRate: number | null;
  overallScore: number;
}

export interface ConflictResolutionManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  conflictQuality: ConflictQualityResult;
  conflictCompliance: ConflictComplianceResult;
  conflictPolicy: ConflictPolicyResult;
  staffConflictReadiness: StaffConflictReadinessResult;
  childProfiles: ChildConflictProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateConflictQuality(incidents: ConflictIncident[]): ConflictQualityResult {
  if (incidents.length === 0) {
    return { overallScore: 0, totalIncidents: 0, resolutionRate: null, deEscalationRate: null, childVoiceRate: null, restorativeRate: null };
  }

  const total = incidents.length;
  const resolvedCount = incidents.filter((i) => i.resolutionOutcome === "fully_resolved" || i.resolutionOutcome === "partially_resolved").length;
  const deEscalationCount = incidents.filter((i) => i.deEscalationUsed).length;
  const childVoiceCount = incidents.filter((i) => i.childVoiceHeard).length;
  const restorativeCount = incidents.filter((i) => i.restorativePractice).length;

  const resolutionRate = rate(resolvedCount, total);
  const deEscalationRate = rate(deEscalationCount, total);
  const childVoiceRate = rate(childVoiceCount, total);
  const restorativeRate = rate(restorativeCount, total);

  const reScore = Math.round(((resolutionRate ?? 0) / 100) * 7);
  const deScore = Math.round(((deEscalationRate ?? 0) / 100) * 6);
  const cvScore = Math.round(((childVoiceRate ?? 0) / 100) * 6);
  const rpScore = Math.round(((restorativeRate ?? 0) / 100) * 6);

  const overallScore = Math.min(25, reScore + deScore + cvScore + rpScore);

  return { overallScore, totalIncidents: total, resolutionRate, deEscalationRate, childVoiceRate, restorativeRate };
}

export function evaluateConflictCompliance(incidents: ConflictIncident[]): ConflictComplianceResult {
  if (incidents.length === 0) {
    return { overallScore: 0, documentedRate: null, staffSupportedRate: null, feedbackRate: null, conflictTypeDiversityRatio: 0 };
  }

  const total = incidents.length;
  const documentedCount = incidents.filter((i) => i.documentedInPlan).length;
  const staffCount = incidents.filter((i) => i.staffSupported).length;
  const feedbackCount = incidents.filter((i) => i.feedbackGiven).length;
  const uniqueTypes = new Set(incidents.map((i) => i.conflictType)).size;
  const diversityRatio = rate(uniqueTypes, 8);

  const documentedRate = rate(documentedCount, total);
  const staffSupportedRate = rate(staffCount, total);
  const feedbackRate = rate(feedbackCount, total);

  const docScore = Math.round(((documentedRate ?? 0) / 100) * 8);
  const sfScore = Math.round(((staffSupportedRate ?? 0) / 100) * 7);
  const fbScore = Math.round(((feedbackRate ?? 0) / 100) * 5);
  const divScore = Math.round((diversityRatio! / 100) * 5);

  const overallScore = Math.min(25, docScore + sfScore + fbScore + divScore);

  return { overallScore, documentedRate, staffSupportedRate, feedbackRate, conflictTypeDiversityRatio: diversityRatio };
}

export function evaluateConflictPolicy(policy: ConflictResolutionPolicy | null): ConflictPolicyResult {
  if (!policy) {
    return { overallScore: 0, behaviourManagementStrategy: false, deEscalationProtocol: false, restorativePracticeFramework: false, antibullyingPolicy: false, physicalInterventionGuidance: false, childParticipationInResolution: false, regularReview: false };
  }

  let score = 0;
  if (policy.behaviourManagementStrategy) score += 4;
  if (policy.deEscalationProtocol) score += 4;
  if (policy.restorativePracticeFramework) score += 4;
  if (policy.antibullyingPolicy) score += 4;
  if (policy.physicalInterventionGuidance) score += 3;
  if (policy.childParticipationInResolution) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    behaviourManagementStrategy: policy.behaviourManagementStrategy, deEscalationProtocol: policy.deEscalationProtocol,
    restorativePracticeFramework: policy.restorativePracticeFramework, antibullyingPolicy: policy.antibullyingPolicy,
    physicalInterventionGuidance: policy.physicalInterventionGuidance, childParticipationInResolution: policy.childParticipationInResolution,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffConflictReadiness(training: StaffConflictResolutionTraining[]): StaffConflictReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, deEscalationTechniquesRate: null, restorativePracticeRate: null, conflictMediationRate: null, traumaInformedResponseRate: null, physicalInterventionCertifiedRate: null, reflectiveDebriefRate: null };
  }

  const total = training.length;
  const deRate = rate(training.filter((t) => t.deEscalationTechniques).length, total);
  const rpRate = rate(training.filter((t) => t.restorativePractice).length, total);
  const cmRate = rate(training.filter((t) => t.conflictMediation).length, total);
  const tiRate = rate(training.filter((t) => t.traumaInformedResponse).length, total);
  const piRate = rate(training.filter((t) => t.physicalInterventionCertified).length, total);
  const rdRate = rate(training.filter((t) => t.reflectiveDebrief).length, total);

  const s1 = Math.round(((deRate ?? 0) / 100) * 6);
  const s2 = Math.round(((rpRate ?? 0) / 100) * 5);
  const s3 = Math.round(((cmRate ?? 0) / 100) * 5);
  const s4 = Math.round(((tiRate ?? 0) / 100) * 4);
  const s5 = Math.round(((piRate ?? 0) / 100) * 3);
  const s6 = Math.round(((rdRate ?? 0) / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, deEscalationTechniquesRate: deRate, restorativePracticeRate: rpRate, conflictMediationRate: cmRate, traumaInformedResponseRate: tiRate, physicalInterventionCertifiedRate: piRate, reflectiveDebriefRate: rdRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildConflictProfiles(incidents: ConflictIncident[]): ChildConflictProfile[] {
  if (incidents.length === 0) return [];

  const grouped = new Map<string, ConflictIncident[]>();
  for (const i of incidents) {
    if (!grouped.has(i.childId)) grouped.set(i.childId, []);
    grouped.get(i.childId)!.push(i);
  }

  const profiles: ChildConflictProfile[] = [];

  for (const [childId, acts] of grouped) {
    const childName = acts[0].childName;
    const total = acts.length;
    const resolvedCount = acts.filter((i) => i.resolutionOutcome === "fully_resolved" || i.resolutionOutcome === "partially_resolved").length;
    const childVoiceCount = acts.filter((i) => i.childVoiceHeard).length;

    const resolutionRate = rate(resolvedCount, total);
    const childVoiceRate = rate(childVoiceCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let reScore = 0;
    if (meets(resolutionRate, 80)) reScore = 3;
    else if (meets(resolutionRate, 60)) reScore = 2;
    else if (meets(resolutionRate, 40)) reScore = 1;

    let cvScore = 0;
    if (meets(childVoiceRate, 80)) cvScore = 3;
    else if (meets(childVoiceRate, 60)) cvScore = 2;
    else if (meets(childVoiceRate, 40)) cvScore = 1;

    const uniqueTypes = new Set(acts.map((i) => i.conflictType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + reScore + cvScore + divScore);

    profiles.push({ childId, childName, totalIncidents: total, resolutionRate, childVoiceRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateConflictResolutionManagementIntelligence(
  incidents: ConflictIncident[],
  policy: ConflictResolutionPolicy | null,
  training: StaffConflictResolutionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ConflictResolutionManagementIntelligence {
  const conflictQuality = evaluateConflictQuality(incidents);
  const conflictCompliance = evaluateConflictCompliance(incidents);
  const conflictPolicy = evaluateConflictPolicy(policy);
  const staffConflictReadiness = evaluateStaffConflictReadiness(training);

  const overallScore = Math.min(100, conflictQuality.overallScore + conflictCompliance.overallScore + conflictPolicy.overallScore + staffConflictReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildConflictProfiles(incidents);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (meets(conflictQuality.resolutionRate, 80)) strengths.push("Conflicts are being effectively resolved through appropriate intervention");
  if (meets(conflictQuality.deEscalationRate, 80)) strengths.push("De-escalation techniques are consistently applied during conflict situations");
  if (meets(conflictQuality.childVoiceRate, 80)) strengths.push("Children's voices are well represented in conflict resolution processes");
  if (meets(conflictCompliance.documentedRate, 80)) strengths.push("Conflict incidents are well documented in care plans");

  if (incidents.length > 0 && below(conflictQuality.resolutionRate, 60)) areasForImprovement.push("Conflict resolution rates need improvement — review de-escalation and mediation approaches");
  if (incidents.length > 0 && below(conflictQuality.restorativeRate, 60)) areasForImprovement.push("Restorative practice is underutilised — embed restorative approaches in daily conflict management");
  if (incidents.length > 0 && below(conflictQuality.childVoiceRate, 60)) areasForImprovement.push("Children's voices in conflict resolution need strengthening");
  if (incidents.length > 0 && below(conflictCompliance.staffSupportedRate, 60)) areasForImprovement.push("Staff support during conflict incidents needs improvement");

  if (incidents.length === 0) actions.push("No conflict incident records found — begin tracking conflict resolution and management");
  if (!policy) actions.push("URGENT: No conflict resolution policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff conflict resolution training recorded — arrange training for all staff");
  if (incidents.length > 0 && below(conflictQuality.deEscalationRate, 60)) actions.push("Improve de-escalation technique usage across conflict situations");
  if (incidents.length > 0 && below(conflictCompliance.feedbackRate, 60)) actions.push("Improve feedback processes following conflict incidents");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 12 — Positive behaviour support",
    "CHR 2015 Regulation 13 — Protection of children",
    "SCCIF — Safety of children (behaviour management)",
    "NMS 3 — Positive behaviour and relationships",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 19 — Protection from violence",
    "Reducing the Need for Restraint and Restrictive Intervention (DfE 2019)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    conflictQuality, conflictCompliance, conflictPolicy, staffConflictReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
