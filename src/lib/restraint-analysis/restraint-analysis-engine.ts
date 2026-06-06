// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Restraint Analysis Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses physical intervention/restraint practice including:
//   • Proportionality & necessity assessment
//   • Duration monitoring & reduction trends
//   • De-escalation effectiveness (attempts before restraint)
//   • Post-incident support (child debrief, medical checks, recording)
//
// Regulatory framework:
//   CHR 2015 Reg 35 — behaviour management (restraint as last resort)
//   CHR 2015 Reg 19 — positive relationships
//   UNCRC Article 37 — freedom from degrading treatment
//   Reg 40(4)(a)(iii) — notification of restraint to Ofsted
//   SCCIF — quality of care, experiences & progress
//   Reducing Restrictive Intervention Standards (RRN)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type RestraintType =
  | "physical_intervention"
  | "guided_away"
  | "held"
  | "seated_support"
  | "standing_support"
  | "ground_based"
  | "other";

export type RestraintReason =
  | "risk_to_self"
  | "risk_to_others"
  | "risk_to_property"
  | "absconding"
  | "other";

export type DeEscalationTechnique =
  | "verbal_reassurance"
  | "distraction"
  | "change_of_environment"
  | "time_away"
  | "active_listening"
  | "choices_offered"
  | "planned_ignoring"
  | "humour"
  | "other";

export type PostIncidentAction =
  | "child_debrief"
  | "medical_check"
  | "parent_notified"
  | "social_worker_notified"
  | "ofsted_notified"
  | "body_map_completed"
  | "written_record"
  | "manager_review"
  | "staff_debrief";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface RestraintRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  restraintType: RestraintType;
  reason: RestraintReason;
  staffInvolved: string[];
  deEscalationAttempted: boolean;
  deEscalationTechniques: DeEscalationTechnique[];
  postIncidentActions: PostIncidentAction[];
  childInjured: boolean;
  staffInjured: boolean;
  childViews?: string;
  childViewsRecorded: boolean;
  proportionalityAssessed: boolean;
  approvedTechniqueUsed: boolean;
  managerNotifiedImmediately: boolean;
}

export interface RestraintReduction {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  planInPlace: boolean;
  planReviewDate?: string;
  targetReduction: string;
  currentStrategies: string[];
  triggerAwarenessDocumented: boolean;
  alternativeStrategiesIdentified: number;
  sensoryProfileCompleted: boolean;
}

export interface RestraintTraining {
  id: string;
  homeId: string;
  staffId: string;
  staffName: string;
  trainingType: string; // e.g. "PROACT-SCIPr", "Team-Teach", "PRICE"
  completedDate: string;
  expiryDate: string;
  refresherDue: boolean;
}

export interface ChildRestraintProfile {
  childId: string;
  childName: string;
  totalRestraints: number;
  averageDurationMinutes: number;
  deEscalationAttemptedRate: number;
  childViewsRecordedRate: number;
  postIncidentCompletionRate: number;
  injuryRate: number;
  reductionPlanInPlace: boolean;
  mostCommonReason: string;
  mostCommonType: string;
  overallScore: number; // 0–10
}

// ── Result Types ────────────────────────────────────────────────────────────

export interface ProportionalityResult {
  totalRestraints: number;
  proportionalityAssessedRate: number;
  approvedTechniqueRate: number;
  averageDurationMinutes: number;
  longDurationCount: number; // >10 minutes
  injuryToChildRate: number;
  injuryToStaffRate: number;
  managerNotifiedRate: number;
  overallScore: number; // 0–30
}

export interface DeEscalationResult {
  totalRestraints: number;
  deEscalationAttemptedRate: number;
  averageTechniquesPerIncident: number;
  techniquesUsed: Record<string, number>;
  overallScore: number; // 0–25
}

export interface PostIncidentResult {
  totalRestraints: number;
  childDebriefRate: number;
  medicalCheckRate: number;
  bodyMapRate: number;
  writtenRecordRate: number;
  parentNotifiedRate: number;
  socialWorkerNotifiedRate: number;
  ofstedNotifiedRate: number;
  managerReviewRate: number;
  childViewsRecordedRate: number;
  overallScore: number; // 0–25
}

export interface ReductionResult {
  childrenWithRestraints: number;
  reductionPlansInPlace: number;
  reductionPlanRate: number;
  triggerAwarenessRate: number;
  alternativeStrategiesAverage: number;
  sensoryProfileRate: number;
  staffTrainingCompliance: number;
  overallScore: number; // 0–20
}

export interface RestraintAnalysisIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  proportionality: ProportionalityResult;
  deEscalation: DeEscalationResult;
  postIncident: PostIncidentResult;
  reduction: ReductionResult;
  childProfiles: ChildRestraintProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function isInPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getRestraintTypeLabel(t: RestraintType): string {
  const labels: Record<RestraintType, string> = {
    physical_intervention: "Physical Intervention",
    guided_away: "Guided Away",
    held: "Held",
    seated_support: "Seated Support",
    standing_support: "Standing Support",
    ground_based: "Ground-Based",
    other: "Other",
  };
  return labels[t] || t;
}

export function getRestraintReasonLabel(r: RestraintReason): string {
  const labels: Record<RestraintReason, string> = {
    risk_to_self: "Risk to Self",
    risk_to_others: "Risk to Others",
    risk_to_property: "Risk to Property",
    absconding: "Absconding",
    other: "Other",
  };
  return labels[r] || r;
}

export function getDeEscalationLabel(t: DeEscalationTechnique): string {
  const labels: Record<DeEscalationTechnique, string> = {
    verbal_reassurance: "Verbal Reassurance",
    distraction: "Distraction",
    change_of_environment: "Change of Environment",
    time_away: "Time Away",
    active_listening: "Active Listening",
    choices_offered: "Choices Offered",
    planned_ignoring: "Planned Ignoring",
    humour: "Humour",
    other: "Other",
  };
  return labels[t] || t;
}

export function getPostIncidentActionLabel(a: PostIncidentAction): string {
  const labels: Record<PostIncidentAction, string> = {
    child_debrief: "Child Debrief",
    medical_check: "Medical Check",
    parent_notified: "Parent Notified",
    social_worker_notified: "Social Worker Notified",
    ofsted_notified: "Ofsted Notified",
    body_map_completed: "Body Map Completed",
    written_record: "Written Record",
    manager_review: "Manager Review",
    staff_debrief: "Staff Debrief",
  };
  return labels[a] || a;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate proportionality — was the restraint necessary, proportionate,
 * using approved techniques, and for the shortest time necessary?
 * Score: 0–30
 */
export function evaluateProportionality(
  records: RestraintRecord[],
  periodStart: string,
  periodEnd: string,
): ProportionalityResult {
  const period = records.filter((r) => isInPeriod(r.date, periodStart, periodEnd));

  if (period.length === 0) {
    return {
      totalRestraints: 0, proportionalityAssessedRate: 0,
      approvedTechniqueRate: 0, averageDurationMinutes: 0,
      longDurationCount: 0, injuryToChildRate: 0, injuryToStaffRate: 0,
      managerNotifiedRate: 0, overallScore: 30, // No restraints is excellent
    };
  }

  const assessedCount = period.filter((r) => r.proportionalityAssessed).length;
  const assessedRate = pct(assessedCount, period.length);

  const approvedCount = period.filter((r) => r.approvedTechniqueUsed).length;
  const approvedRate = pct(approvedCount, period.length);

  const totalDuration = period.reduce((sum, r) => sum + r.durationMinutes, 0);
  const avgDuration = Math.round((totalDuration / period.length) * 10) / 10;

  const longCount = period.filter((r) => r.durationMinutes > 10).length;

  const childInjury = period.filter((r) => r.childInjured).length;
  const childInjuryRate = pct(childInjury, period.length);

  const staffInjury = period.filter((r) => r.staffInjured).length;
  const staffInjuryRate = pct(staffInjury, period.length);

  const managerNotified = period.filter((r) => r.managerNotifiedImmediately).length;
  const managerRate = pct(managerNotified, period.length);

  // Scoring — 30 points max
  let score = 0;
  score += (assessedRate / 100) * 8;     // Proportionality assessed: 8 pts
  score += (approvedRate / 100) * 8;     // Approved technique: 8 pts
  score += (managerRate / 100) * 4;      // Manager notification: 4 pts

  // Duration bonus: lower is better (up to 5 pts)
  if (avgDuration <= 3) score += 5;
  else if (avgDuration <= 5) score += 4;
  else if (avgDuration <= 10) score += 2;

  // No injuries bonus: up to 5 pts
  if (childInjuryRate === 0) score += 3;
  if (staffInjuryRate === 0) score += 2;

  return {
    totalRestraints: period.length,
    proportionalityAssessedRate: assessedRate,
    approvedTechniqueRate: approvedRate,
    averageDurationMinutes: avgDuration,
    longDurationCount: longCount,
    injuryToChildRate: childInjuryRate,
    injuryToStaffRate: staffInjuryRate,
    managerNotifiedRate: managerRate,
    overallScore: Math.round(clamp(score, 0, 30) * 10) / 10,
  };
}

/**
 * Evaluate de-escalation practice — was de-escalation attempted before
 * resorting to physical intervention? How many techniques were tried?
 * Score: 0–25
 */
export function evaluateDeEscalation(
  records: RestraintRecord[],
  periodStart: string,
  periodEnd: string,
): DeEscalationResult {
  const period = records.filter((r) => isInPeriod(r.date, periodStart, periodEnd));

  if (period.length === 0) {
    return {
      totalRestraints: 0, deEscalationAttemptedRate: 0,
      averageTechniquesPerIncident: 0, techniquesUsed: {}, overallScore: 25,
    };
  }

  const attemptedCount = period.filter((r) => r.deEscalationAttempted).length;
  const attemptedRate = pct(attemptedCount, period.length);

  const totalTechniques = period.reduce((sum, r) => sum + r.deEscalationTechniques.length, 0);
  const avgTechniques = Math.round((totalTechniques / period.length) * 10) / 10;

  // Count techniques
  const techniques: Record<string, number> = {};
  for (const r of period) {
    for (const t of r.deEscalationTechniques) {
      techniques[t] = (techniques[t] || 0) + 1;
    }
  }

  // Scoring — 25 points max
  let score = 0;
  score += (attemptedRate / 100) * 15; // De-escalation attempted: 15 pts

  // Variety of techniques: up to 5 pts
  const uniqueTechniques = Object.keys(techniques).length;
  score += Math.min(uniqueTechniques, 5);

  // Avg techniques per incident: up to 5 pts
  if (avgTechniques >= 3) score += 5;
  else if (avgTechniques >= 2) score += 3;
  else if (avgTechniques >= 1) score += 1;

  return {
    totalRestraints: period.length,
    deEscalationAttemptedRate: attemptedRate,
    averageTechniquesPerIncident: avgTechniques,
    techniquesUsed: techniques,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate post-incident support — after restraint, was there proper
 * follow-up: child debrief, medical check, body map, notifications, record?
 * Score: 0–25
 */
export function evaluatePostIncident(
  records: RestraintRecord[],
  periodStart: string,
  periodEnd: string,
): PostIncidentResult {
  const period = records.filter((r) => isInPeriod(r.date, periodStart, periodEnd));

  if (period.length === 0) {
    return {
      totalRestraints: 0, childDebriefRate: 0, medicalCheckRate: 0,
      bodyMapRate: 0, writtenRecordRate: 0, parentNotifiedRate: 0,
      socialWorkerNotifiedRate: 0, ofstedNotifiedRate: 0,
      managerReviewRate: 0, childViewsRecordedRate: 0, overallScore: 25,
    };
  }

  const has = (action: PostIncidentAction) =>
    pct(period.filter((r) => r.postIncidentActions.includes(action)).length, period.length);

  const childDebrief = has("child_debrief");
  const medicalCheck = has("medical_check");
  const bodyMap = has("body_map_completed");
  const writtenRecord = has("written_record");
  const parentNotified = has("parent_notified");
  const swNotified = has("social_worker_notified");
  const ofstedNotified = has("ofsted_notified");
  const managerReview = has("manager_review");
  const childViews = pct(period.filter((r) => r.childViewsRecorded).length, period.length);

  // Scoring — 25 points max
  let score = 0;
  score += (childDebrief / 100) * 5;    // Child debrief: 5 pts
  score += (childViews / 100) * 4;      // Child views recorded: 4 pts
  score += (writtenRecord / 100) * 4;   // Written record: 4 pts
  score += (bodyMap / 100) * 3;         // Body map: 3 pts
  score += (medicalCheck / 100) * 3;    // Medical check: 3 pts
  score += (managerReview / 100) * 3;   // Manager review: 3 pts
  score += (ofstedNotified / 100) * 3;  // Ofsted notification: 3 pts

  return {
    totalRestraints: period.length,
    childDebriefRate: childDebrief,
    medicalCheckRate: medicalCheck,
    bodyMapRate: bodyMap,
    writtenRecordRate: writtenRecord,
    parentNotifiedRate: parentNotified,
    socialWorkerNotifiedRate: swNotified,
    ofstedNotifiedRate: ofstedNotified,
    managerReviewRate: managerReview,
    childViewsRecordedRate: childViews,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate restraint reduction efforts — do children have reduction plans,
 * trigger awareness, alternative strategies, and is training current?
 * Score: 0–20
 */
export function evaluateReduction(
  records: RestraintRecord[],
  reductions: RestraintReduction[],
  training: RestraintTraining[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): ReductionResult {
  const period = records.filter((r) => isInPeriod(r.date, periodStart, periodEnd));

  // Find unique children with restraints in period
  const childrenWithRestraints = new Set(period.map((r) => r.childId));

  if (childrenWithRestraints.size === 0) {
    // Check training compliance even without restraints
    const validTraining = training.filter((t) => t.expiryDate >= referenceDate).length;
    const trainingRate = pct(validTraining, training.length);
    return {
      childrenWithRestraints: 0, reductionPlansInPlace: 0,
      reductionPlanRate: 0, triggerAwarenessRate: 0,
      alternativeStrategiesAverage: 0, sensoryProfileRate: 0,
      staffTrainingCompliance: trainingRate,
      overallScore: training.length > 0 ? Math.round((trainingRate / 100) * 20 * 10) / 10 : 20,
    };
  }

  // Check reduction plans for children with restraints
  const plansForChildren = reductions.filter((r) => childrenWithRestraints.has(r.childId));
  const withPlan = plansForChildren.filter((r) => r.planInPlace).length;
  const planRate = pct(withPlan, childrenWithRestraints.size);

  const triggerAware = plansForChildren.filter((r) => r.triggerAwarenessDocumented).length;
  const triggerRate = pct(triggerAware, plansForChildren.length);

  const totalAlternatives = plansForChildren.reduce(
    (sum, r) => sum + r.alternativeStrategiesIdentified, 0,
  );
  const avgAlternatives = plansForChildren.length > 0
    ? Math.round((totalAlternatives / plansForChildren.length) * 10) / 10
    : 0;

  const sensory = plansForChildren.filter((r) => r.sensoryProfileCompleted).length;
  const sensoryRate = pct(sensory, plansForChildren.length);

  // Training compliance
  const validTraining = training.filter((t) => t.expiryDate >= referenceDate).length;
  const trainingCompliance = pct(validTraining, training.length);

  // Scoring — 20 points max
  let score = 0;
  score += (planRate / 100) * 6;             // Reduction plans: 6 pts
  score += (triggerRate / 100) * 4;          // Trigger awareness: 4 pts
  score += (trainingCompliance / 100) * 5;   // Training: 5 pts
  score += (sensoryRate / 100) * 2;          // Sensory profiles: 2 pts

  // Alternative strategies: up to 3 pts
  if (avgAlternatives >= 5) score += 3;
  else if (avgAlternatives >= 3) score += 2;
  else if (avgAlternatives >= 1) score += 1;

  return {
    childrenWithRestraints: childrenWithRestraints.size,
    reductionPlansInPlace: withPlan,
    reductionPlanRate: planRate,
    triggerAwarenessRate: triggerRate,
    alternativeStrategiesAverage: avgAlternatives,
    sensoryProfileRate: sensoryRate,
    staffTrainingCompliance: trainingCompliance,
    overallScore: Math.round(clamp(score, 0, 20) * 10) / 10,
  };
}

/**
 * Build per-child restraint profiles.
 */
export function buildChildRestraintProfiles(
  records: RestraintRecord[],
  reductions: RestraintReduction[],
  periodStart: string,
  periodEnd: string,
): ChildRestraintProfile[] {
  const period = records.filter((r) => isInPeriod(r.date, periodStart, periodEnd));
  const byChild = new Map<string, RestraintRecord[]>();

  for (const r of period) {
    const list = byChild.get(r.childId) || [];
    list.push(r);
    byChild.set(r.childId, list);
  }

  const profiles: ChildRestraintProfile[] = [];

  for (const [childId, childRecords] of byChild) {
    const total = childRecords.length;
    const totalDuration = childRecords.reduce((s, r) => s + r.durationMinutes, 0);
    const avgDuration = Math.round((totalDuration / total) * 10) / 10;

    const deEscAttempted = childRecords.filter((r) => r.deEscalationAttempted).length;
    const viewsRecorded = childRecords.filter((r) => r.childViewsRecorded).length;

    // Post-incident: check key actions
    const REQUIRED_ACTIONS: PostIncidentAction[] = [
      "child_debrief", "written_record", "body_map_completed", "manager_review",
    ];
    let postTotal = 0;
    let postCompleted = 0;
    for (const r of childRecords) {
      for (const action of REQUIRED_ACTIONS) {
        postTotal++;
        if (r.postIncidentActions.includes(action)) postCompleted++;
      }
    }

    const injuries = childRecords.filter((r) => r.childInjured).length;
    const reduction = reductions.find((r) => r.childId === childId);

    // Most common reason
    const reasons: Record<string, number> = {};
    for (const r of childRecords) {
      reasons[r.reason] = (reasons[r.reason] || 0) + 1;
    }
    const mostCommonReason = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    // Most common type
    const types: Record<string, number> = {};
    for (const r of childRecords) {
      types[r.restraintType] = (types[r.restraintType] || 0) + 1;
    }
    const mostCommonType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    // Score out of 10
    let score = 5; // Start at midpoint
    if (pct(deEscAttempted, total) >= 90) score += 1;
    if (pct(viewsRecorded, total) >= 80) score += 1;
    if (pct(postCompleted, postTotal) >= 80) score += 1;
    if (injuries === 0) score += 1;
    if (reduction?.planInPlace) score += 1;
    // Penalties
    if (total > 5) score -= 1;
    if (avgDuration > 10) score -= 1;
    if (pct(deEscAttempted, total) < 50) score -= 1;

    profiles.push({
      childId,
      childName: childRecords[0].childName,
      totalRestraints: total,
      averageDurationMinutes: avgDuration,
      deEscalationAttemptedRate: pct(deEscAttempted, total),
      childViewsRecordedRate: pct(viewsRecorded, total),
      postIncidentCompletionRate: pct(postCompleted, postTotal),
      injuryRate: pct(injuries, total),
      reductionPlanInPlace: reduction?.planInPlace || false,
      mostCommonReason,
      mostCommonType,
      overallScore: clamp(Math.round(score * 10) / 10, 0, 10),
    });
  }

  return profiles.sort((a, b) => a.overallScore - b.overallScore);
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateRestraintAnalysisIntelligence(
  records: RestraintRecord[],
  reductions: RestraintReduction[],
  training: RestraintTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): RestraintAnalysisIntelligence {
  const proportionality = evaluateProportionality(records, periodStart, periodEnd);
  const deEscalation = evaluateDeEscalation(records, periodStart, periodEnd);
  const postIncident = evaluatePostIncident(records, periodStart, periodEnd);
  const reduction = evaluateReduction(records, reductions, training, periodStart, periodEnd, referenceDate);
  const childProfiles = buildChildRestraintProfiles(records, reductions, periodStart, periodEnd);

  const overallScore = Math.round(
    (proportionality.overallScore + deEscalation.overallScore +
      postIncident.overallScore + reduction.overallScore) * 10,
  ) / 10;
  const rating = ratingFromScore(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];
  if (proportionality.totalRestraints === 0) {
    strengths.push("No restraints used in the period — a positive indicator of de-escalation practice");
  } else {
    if (proportionality.proportionalityAssessedRate >= 90) {
      strengths.push("Proportionality is consistently assessed for all restraints");
    }
    if (proportionality.approvedTechniqueRate >= 95) {
      strengths.push("Approved restraint techniques are consistently used");
    }
    if (proportionality.averageDurationMinutes <= 3) {
      strengths.push("Restraint durations are very short, reflecting effective, proportionate interventions");
    }
    if (proportionality.injuryToChildRate === 0 && proportionality.totalRestraints > 0) {
      strengths.push("No children injured during restraints — techniques are being applied safely");
    }
    if (deEscalation.deEscalationAttemptedRate >= 95) {
      strengths.push("De-escalation is attempted before every restraint, evidencing restraint as a genuine last resort");
    }
    if (deEscalation.averageTechniquesPerIncident >= 3) {
      strengths.push("Multiple de-escalation techniques are tried before resorting to physical intervention");
    }
    if (postIncident.childDebriefRate >= 90) {
      strengths.push("Children are consistently debriefed after restraints, supporting emotional recovery");
    }
    if (postIncident.childViewsRecordedRate >= 85) {
      strengths.push("Children's views about restraints are routinely recorded, respecting their voice");
    }
    if (reduction.reductionPlanRate >= 90 && reduction.childrenWithRestraints > 0) {
      strengths.push("All children who experience restraint have reduction plans in place");
    }
    if (reduction.staffTrainingCompliance >= 95) {
      strengths.push("Staff training in physical intervention is current and compliant");
    }
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (proportionality.totalRestraints > 0) {
    if (proportionality.proportionalityAssessedRate < 80) {
      areasForImprovement.push("Proportionality assessment is not consistently completed for all restraints");
    }
    if (proportionality.longDurationCount > 0) {
      areasForImprovement.push(`${proportionality.longDurationCount} restraint(s) exceeded 10 minutes — review necessity of prolonged interventions`);
    }
    if (proportionality.injuryToChildRate > 0) {
      areasForImprovement.push("Children have sustained injuries during restraints — review technique application");
    }
    if (deEscalation.deEscalationAttemptedRate < 80) {
      areasForImprovement.push("De-escalation is not consistently attempted before physical intervention");
    }
    if (postIncident.childDebriefRate < 70) {
      areasForImprovement.push("Children are not consistently debriefed after restraints");
    }
    if (postIncident.bodyMapRate < 80) {
      areasForImprovement.push("Body maps are not consistently completed after restraints");
    }
    if (postIncident.childViewsRecordedRate < 70) {
      areasForImprovement.push("Children's views about restraint are not consistently recorded");
    }
    if (reduction.reductionPlanRate < 80 && reduction.childrenWithRestraints > 0) {
      areasForImprovement.push("Not all children who experience restraint have reduction plans in place");
    }
    if (reduction.staffTrainingCompliance < 80) {
      areasForImprovement.push("Staff physical intervention training compliance is below acceptable threshold");
    }
  }

  // ── Actions ──
  const actions: string[] = [];
  if (proportionality.injuryToChildRate > 0) {
    actions.push("URGENT: Review all restraints where children sustained injuries and implement corrective action");
  }
  if (proportionality.totalRestraints > 0 && proportionality.approvedTechniqueRate < 100) {
    actions.push("URGENT: Ensure all staff use only approved restraint techniques — review incidents where unapproved methods were used");
  }
  if (deEscalation.deEscalationAttemptedRate < 80 && proportionality.totalRestraints > 0) {
    actions.push("HIGH: Provide refresher training on de-escalation as a mandatory first response");
  }
  if (postIncident.childDebriefRate < 70 && proportionality.totalRestraints > 0) {
    actions.push("HIGH: Implement mandatory child debrief within 24 hours of every restraint");
  }
  if (reduction.reductionPlanRate < 80 && reduction.childrenWithRestraints > 0) {
    actions.push("HIGH: Create restraint reduction plans for all children who experience restraint");
  }
  if (reduction.staffTrainingCompliance < 80) {
    actions.push("MEDIUM: Schedule training refreshers for staff with expired physical intervention certification");
  }
  if (postIncident.bodyMapRate < 80 && proportionality.totalRestraints > 0) {
    actions.push("MEDIUM: Ensure body maps are completed after every restraint as standard practice");
  }
  if (postIncident.childViewsRecordedRate < 70 && proportionality.totalRestraints > 0) {
    actions.push("LOW: Develop child-friendly tools to support young people expressing their views after restraint");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 35 — behaviour management, restraint only as a last resort and for shortest time",
    "CHR 2015 Reg 19 — positive relationships and behaviour support strategies",
    "CHR 2015 Reg 40(4)(a)(iii) — notification of restraint incidents to Ofsted",
    "SCCIF — quality of care, use of physical intervention as key inspection focus",
    "UNCRC Article 37 — protection from degrading treatment, right to humane handling",
    "Reducing Restrictive Intervention Standards — NHS/DfE framework for minimising restraint",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    proportionality,
    deEscalation,
    postIncident,
    reduction,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
