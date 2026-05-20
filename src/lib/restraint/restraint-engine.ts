/* ──────────────────────────────────────────────────────────────
   Restraint Intelligence Engine

   Pure deterministic engine for evaluating how well a children's
   residential home manages physical restraint — tracking incidents,
   compliance with recording and notification requirements, policy
   frameworks, and staff training in approved techniques.

   Regulatory basis:
     - CHR 2015 Reg 20 — Restraint and deprivation of liberty
     - CHR 2015 Reg 19 — Behaviour management (positive relationships)
     - CHR 2015 Reg 35 — Behaviour management record
     - CHR 2015 Reg 40(4)(a) — Notification to Ofsted
     - Children Act 1989 s.22 — Duty to safeguard
     - SCCIF — Safety: use of restraint, children are safe
     - Reducing the Need for Restraint and Restrictive Intervention (DfE 2019)

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type RestraintType =
  | "physical_hold"
  | "guided_away"
  | "seated_hold"
  | "standing_hold"
  | "supine_hold"
  | "prone_hold"
  | "mechanical"
  | "environmental_restriction";

export type RestraintOutcome =
  | "de_escalation_successful"
  | "restraint_applied"
  | "self_resolved"
  | "external_support"
  | "not_recorded";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const restraintTypeLabels: Record<RestraintType, string> = {
  physical_hold: "Physical Hold",
  guided_away: "Guided Away",
  seated_hold: "Seated Hold",
  standing_hold: "Standing Hold",
  supine_hold: "Supine Hold",
  prone_hold: "Prone Hold",
  mechanical: "Mechanical",
  environmental_restriction: "Environmental Restriction",
};

const restraintOutcomeLabels: Record<RestraintOutcome, string> = {
  de_escalation_successful: "De-escalation Successful",
  restraint_applied: "Restraint Applied",
  self_resolved: "Self Resolved",
  external_support: "External Support",
  not_recorded: "Not Recorded",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRestraintTypeLabel(type: RestraintType): string {
  return restraintTypeLabels[type];
}

export function getRestraintOutcomeLabel(outcome: RestraintOutcome): string {
  return restraintOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface RestraintIncident {
  id: string;
  childId: string;
  childName: string;
  incidentDate: string;
  restraintType: RestraintType;
  outcome: RestraintOutcome;
  deEscalationAttempted: boolean;
  proportionateResponse: boolean;
  injuryOccurred: boolean;
  bodyMapCompleted: boolean;
  parentNotified: boolean;
  ofstedNotified: boolean;
  debriefCompleted: boolean;
  childViewsRecorded: boolean;
}

export interface RestraintPolicy {
  id: string;
  restraintReductionStrategy: boolean;
  approvedTechniquesOnly: boolean;
  deEscalationFirstPolicy: boolean;
  incidentReportingProtocol: boolean;
  bodyMapProtocol: boolean;
  notificationProcedure: boolean;
  regularReview: boolean;
}

export interface StaffRestraintTraining {
  id: string;
  staffId: string;
  staffName: string;
  approvedTechniquesCertified: boolean;
  deEscalationSkills: boolean;
  proportionalityUnderstanding: boolean;
  incidentReporting: boolean;
  childRightsAwareness: boolean;
  postIncidentSupport: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RestraintQualityResult {
  totalIncidents: number;
  deEscalationRate: number;
  proportionateRate: number;
  noInjuryRate: number;
  childViewsRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface RestraintComplianceResult {
  totalIncidents: number;
  bodyMapRate: number;
  parentNotifiedRate: number;
  ofstedNotifiedRate: number;
  debriefRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface RestraintPolicyResult {
  restraintReductionStrategy: boolean;
  approvedTechniquesOnly: boolean;
  deEscalationFirstPolicy: boolean;
  incidentReportingProtocol: boolean;
  bodyMapProtocol: boolean;
  notificationProcedure: boolean;
  regularReview: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffRestraintReadinessResult {
  totalStaff: number;
  approvedTechniquesCertifiedRate: number;
  deEscalationSkillsRate: number;
  proportionalityUnderstandingRate: number;
  incidentReportingRate: number;
  childRightsAwarenessRate: number;
  postIncidentSupportRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildRestraintProfile {
  childId: string;
  childName: string;
  totalIncidents: number;
  deEscalationRate: number;
  proportionateRate: number;
  injuryCount: number;
  restraintScore: number;
}

export interface RestraintIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  restraintQuality: RestraintQualityResult;
  restraintCompliance: RestraintComplianceResult;
  restraintPolicy: RestraintPolicyResult;
  staffReadiness: StaffRestraintReadinessResult;
  childProfiles: ChildRestraintProfile[];
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

// ── Evaluator 1: Restraint Quality (0-25) ────────────────────────────────

export function evaluateRestraintQuality(
  incidents: RestraintIncident[],
): RestraintQualityResult {
  const totalIncidents = incidents.length;

  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      deEscalationRate: 0,
      proportionateRate: 0,
      noInjuryRate: 0,
      childViewsRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No restraint incidents recorded — quality cannot be assessed"],
    };
  }

  const deEscalationCount = incidents.filter((i) => i.deEscalationAttempted).length;
  const deEscalationRate = pct(deEscalationCount, totalIncidents);

  const proportionateCount = incidents.filter((i) => i.proportionateResponse).length;
  const proportionateRate = pct(proportionateCount, totalIncidents);

  const noInjuryCount = incidents.filter((i) => !i.injuryOccurred).length;
  const noInjuryRate = pct(noInjuryCount, totalIncidents);

  const childViewsCount = incidents.filter((i) => i.childViewsRecorded).length;
  const childViewsRate = pct(childViewsCount, totalIncidents);

  // Weights: deEscalationRate 7 + proportionateRate 6 + noInjuryRate 6 + childViewsRate 6 = 25
  let score = 0;
  score += (deEscalationRate / 100) * 7;
  score += (proportionateRate / 100) * 6;
  score += (noInjuryRate / 100) * 6;
  score += (childViewsRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (deEscalationRate >= 80) {
    strengths.push("Strong de-escalation practice: " + deEscalationRate + "% of incidents had de-escalation attempted first");
  } else if (deEscalationRate < 50) {
    concerns.push("De-escalation rate at " + deEscalationRate + "% — de-escalation must be attempted before any restraint");
  }

  if (proportionateRate >= 80) {
    strengths.push("Proportionate response rate: " + proportionateRate + "% of restraints judged proportionate");
  } else if (proportionateRate < 50) {
    concerns.push("Proportionate response rate at " + proportionateRate + "% — restraints may be disproportionate");
  }

  if (noInjuryRate >= 90) {
    strengths.push("Low injury rate: " + noInjuryRate + "% of incidents without injury");
  } else if (noInjuryRate < 70) {
    concerns.push("Injury rate concerning: only " + noInjuryRate + "% of incidents without injury");
  }

  if (childViewsRate >= 80) {
    strengths.push("Child views well recorded: " + childViewsRate + "% of incidents include child's perspective");
  } else if (childViewsRate < 50) {
    concerns.push("Child views rate at " + childViewsRate + "% — children's perspectives not consistently recorded");
  }

  return {
    totalIncidents,
    deEscalationRate,
    proportionateRate,
    noInjuryRate,
    childViewsRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Restraint Compliance (0-25) ─────────────────────────────

export function evaluateRestraintCompliance(
  incidents: RestraintIncident[],
): RestraintComplianceResult {
  const totalIncidents = incidents.length;

  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      bodyMapRate: 0,
      parentNotifiedRate: 0,
      ofstedNotifiedRate: 0,
      debriefRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No restraint incidents recorded — compliance cannot be assessed"],
    };
  }

  const bodyMapCount = incidents.filter((i) => i.bodyMapCompleted).length;
  const bodyMapRate = pct(bodyMapCount, totalIncidents);

  const parentNotifiedCount = incidents.filter((i) => i.parentNotified).length;
  const parentNotifiedRate = pct(parentNotifiedCount, totalIncidents);

  const ofstedNotifiedCount = incidents.filter((i) => i.ofstedNotified).length;
  const ofstedNotifiedRate = pct(ofstedNotifiedCount, totalIncidents);

  const debriefCount = incidents.filter((i) => i.debriefCompleted).length;
  const debriefRate = pct(debriefCount, totalIncidents);

  // Weights: bodyMapRate 8 + parentNotifiedRate 7 + ofstedNotifiedRate 5 + debriefRate 5 = 25
  let score = 0;
  score += (bodyMapRate / 100) * 8;
  score += (parentNotifiedRate / 100) * 7;
  score += (ofstedNotifiedRate / 100) * 5;
  score += (debriefRate / 100) * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (bodyMapRate >= 90) {
    strengths.push("Excellent body map completion: " + bodyMapRate + "% of incidents have body maps");
  } else if (bodyMapRate < 50) {
    concerns.push("Body map completion at " + bodyMapRate + "% — body maps must be completed for all restraints");
  }

  if (parentNotifiedRate >= 90) {
    strengths.push("Strong parent notification: " + parentNotifiedRate + "% of incidents notified to parents/carers");
  } else if (parentNotifiedRate < 50) {
    concerns.push("Parent notification rate at " + parentNotifiedRate + "% — parents/carers not consistently informed");
  }

  if (ofstedNotifiedRate >= 80) {
    strengths.push("Ofsted notification compliance: " + ofstedNotifiedRate + "% of incidents notified to Ofsted");
  } else if (ofstedNotifiedRate < 50) {
    concerns.push("Ofsted notification rate at " + ofstedNotifiedRate + "% — regulatory notifications may be missed");
  }

  if (debriefRate >= 80) {
    strengths.push("Good debrief practice: " + debriefRate + "% of incidents followed by debrief");
  } else if (debriefRate < 50) {
    concerns.push("Debrief rate at " + debriefRate + "% — post-incident debriefs not consistently completed");
  }

  return {
    totalIncidents,
    bodyMapRate,
    parentNotifiedRate,
    ofstedNotifiedRate,
    debriefRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Restraint Policy (0-25) ─────────────────────────────────

export function evaluateRestraintPolicy(
  policy: RestraintPolicy | null,
): RestraintPolicyResult {
  if (policy === null) {
    return {
      restraintReductionStrategy: false,
      approvedTechniquesOnly: false,
      deEscalationFirstPolicy: false,
      incidentReportingProtocol: false,
      bodyMapProtocol: false,
      notificationProcedure: false,
      regularReview: false,
      score: 0,
      strengths: [],
      concerns: ["No restraint policy in place — URGENT: develop comprehensive restraint reduction policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.restraintReductionStrategy) score += 4;
  if (policy.approvedTechniquesOnly) score += 4;
  if (policy.deEscalationFirstPolicy) score += 4;
  if (policy.incidentReportingProtocol) score += 4;
  if (policy.bodyMapProtocol) score += 3;
  if (policy.notificationProcedure) score += 3;
  if (policy.regularReview) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.restraintReductionStrategy,
    policy.approvedTechniquesOnly,
    policy.deEscalationFirstPolicy,
    policy.incidentReportingProtocol,
    policy.bodyMapProtocol,
    policy.notificationProcedure,
    policy.regularReview,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete restraint policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 restraint policy components in place");
  }

  if (!policy.restraintReductionStrategy) {
    concerns.push("No restraint reduction strategy — home must demonstrate commitment to reducing restraint");
  }
  if (!policy.approvedTechniquesOnly) {
    concerns.push("Approved techniques not mandated — only BILD/Team Teach approved techniques should be used");
  }
  if (!policy.deEscalationFirstPolicy) {
    concerns.push("No de-escalation first policy — de-escalation must always be attempted before restraint");
  }
  if (!policy.incidentReportingProtocol) {
    concerns.push("No incident reporting protocol — all restraints must be fully recorded");
  }
  if (!policy.bodyMapProtocol) {
    concerns.push("No body map protocol — body maps must be completed following every restraint");
  }
  if (!policy.notificationProcedure) {
    concerns.push("No notification procedure — parents, social workers, and Ofsted must be notified");
  }
  if (!policy.regularReview) {
    concerns.push("No regular review process — restraint practices must be regularly reviewed and audited");
  }

  return {
    restraintReductionStrategy: policy.restraintReductionStrategy,
    approvedTechniquesOnly: policy.approvedTechniquesOnly,
    deEscalationFirstPolicy: policy.deEscalationFirstPolicy,
    incidentReportingProtocol: policy.incidentReportingProtocol,
    bodyMapProtocol: policy.bodyMapProtocol,
    notificationProcedure: policy.notificationProcedure,
    regularReview: policy.regularReview,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Restraint Readiness (0-25) ────────────────────────

export function evaluateStaffRestraintReadiness(
  training: StaffRestraintTraining[],
): StaffRestraintReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      approvedTechniquesCertifiedRate: 0,
      deEscalationSkillsRate: 0,
      proportionalityUnderstandingRate: 0,
      incidentReportingRate: 0,
      childRightsAwarenessRate: 0,
      postIncidentSupportRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule restraint training for all staff immediately"],
    };
  }

  const certifiedCount = training.filter((t) => t.approvedTechniquesCertified).length;
  const approvedTechniquesCertifiedRate = pct(certifiedCount, totalStaff);

  const deEscCount = training.filter((t) => t.deEscalationSkills).length;
  const deEscalationSkillsRate = pct(deEscCount, totalStaff);

  const propCount = training.filter((t) => t.proportionalityUnderstanding).length;
  const proportionalityUnderstandingRate = pct(propCount, totalStaff);

  const reportCount = training.filter((t) => t.incidentReporting).length;
  const incidentReportingRate = pct(reportCount, totalStaff);

  const rightsCount = training.filter((t) => t.childRightsAwareness).length;
  const childRightsAwarenessRate = pct(rightsCount, totalStaff);

  const supportCount = training.filter((t) => t.postIncidentSupport).length;
  const postIncidentSupportRate = pct(supportCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (approvedTechniquesCertifiedRate / 100) * 6;
  score += (deEscalationSkillsRate / 100) * 5;
  score += (proportionalityUnderstandingRate / 100) * 5;
  score += (incidentReportingRate / 100) * 4;
  score += (childRightsAwarenessRate / 100) * 3;
  score += (postIncidentSupportRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (approvedTechniquesCertifiedRate >= 80) {
    strengths.push("Strong approved techniques certification: " + approvedTechniquesCertifiedRate + "% of staff certified");
  } else if (approvedTechniquesCertifiedRate < 50) {
    concerns.push("Approved techniques certification at " + approvedTechniquesCertifiedRate + "% — all staff must be certified");
  }

  if (deEscalationSkillsRate >= 80) {
    strengths.push("Good de-escalation skills: " + deEscalationSkillsRate + "% of staff trained");
  } else if (deEscalationSkillsRate < 50) {
    concerns.push("De-escalation skills at " + deEscalationSkillsRate + "% — staff need de-escalation training");
  }

  if (proportionalityUnderstandingRate >= 80) {
    strengths.push("Proportionality well understood: " + proportionalityUnderstandingRate + "% of staff demonstrate understanding");
  } else if (proportionalityUnderstandingRate < 50) {
    concerns.push("Proportionality understanding at " + proportionalityUnderstandingRate + "% — training on proportionate response needed");
  }

  if (incidentReportingRate >= 80) {
    strengths.push("Incident reporting competency strong: " + incidentReportingRate + "% of staff trained");
  } else if (incidentReportingRate < 50) {
    concerns.push("Incident reporting competency at " + incidentReportingRate + "% — staff may not record incidents correctly");
  }

  if (childRightsAwarenessRate >= 80) {
    strengths.push("Child rights awareness strong: " + childRightsAwarenessRate + "% of staff aware");
  } else if (childRightsAwarenessRate < 50) {
    concerns.push("Child rights awareness at " + childRightsAwarenessRate + "% — children's rights training needed");
  }

  if (postIncidentSupportRate >= 80) {
    strengths.push("Post-incident support skills strong: " + postIncidentSupportRate + "% of staff trained");
  } else if (postIncidentSupportRate < 50) {
    concerns.push("Post-incident support skills at " + postIncidentSupportRate + "% — staff need training in post-incident care");
  }

  return {
    totalStaff,
    approvedTechniquesCertifiedRate,
    deEscalationSkillsRate,
    proportionalityUnderstandingRate,
    incidentReportingRate,
    childRightsAwarenessRate,
    postIncidentSupportRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Restraint Profiles ──────────────────────────────────────

export function buildChildRestraintProfiles(
  incidents: RestraintIncident[],
): ChildRestraintProfile[] {
  if (incidents.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; incidents: RestraintIncident[] }>();

  for (const inc of incidents) {
    if (!childMap.has(inc.childId)) {
      childMap.set(inc.childId, { childId: inc.childId, childName: inc.childName, incidents: [] });
    }
    childMap.get(inc.childId)!.incidents.push(inc);
  }

  return Array.from(childMap.values()).map((child) => {
    const total = child.incidents.length;

    const deEscCount = child.incidents.filter((i) => i.deEscalationAttempted).length;
    const deEscalationRate = pct(deEscCount, total);

    const propCount = child.incidents.filter((i) => i.proportionateResponse).length;
    const proportionateRate = pct(propCount, total);

    const injuryCount = child.incidents.filter((i) => i.injuryOccurred).length;

    // freq: fewer incidents is BETTER for restraint
    // <=1 incidents -> 3, <=3 -> 2, <=5 -> 1, else 0
    let freqScore = 0;
    if (total <= 1) freqScore = 3;
    else if (total <= 3) freqScore = 2;
    else if (total <= 5) freqScore = 1;

    // rate1 (deEscalationRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (deEscalationRate >= 80) rate1Score = 3;
    else if (deEscalationRate >= 60) rate1Score = 2;
    else if (deEscalationRate >= 40) rate1Score = 1;

    // rate2 (proportionateRate): same thresholds
    let rate2Score = 0;
    if (proportionateRate >= 80) rate2Score = 3;
    else if (proportionateRate >= 60) rate2Score = 2;
    else if (proportionateRate >= 40) rate2Score = 1;

    // noInjury: 0 injuries -> 1, else 0
    const noInjuryBonus = injuryCount === 0 ? 1 : 0;

    const restraintScore = Math.min(10, freqScore + rate1Score + rate2Score + noInjuryBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalIncidents: total,
      deEscalationRate,
      proportionateRate,
      injuryCount,
      restraintScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateRestraintIntelligence(
  incidents: RestraintIncident[],
  policy: RestraintPolicy | null,
  training: StaffRestraintTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RestraintIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter incidents to period
  const periodIncidents = incidents.filter(
    (i) => i.incidentDate >= periodStart && i.incidentDate <= periodEnd,
  );

  // Evaluate each layer
  const restraintQuality = evaluateRestraintQuality(periodIncidents);
  const restraintCompliance = evaluateRestraintCompliance(periodIncidents);
  const restraintPolicy = evaluateRestraintPolicy(policy);
  const staffReadiness = evaluateStaffRestraintReadiness(training);

  // Build child profiles
  const childProfiles = buildChildRestraintProfiles(periodIncidents);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      restraintQuality.score +
      restraintCompliance.score +
      restraintPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    restraintQuality, restraintCompliance, restraintPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    restraintQuality, restraintCompliance, restraintPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    restraintQuality, restraintCompliance, restraintPolicy, staffReadiness, periodIncidents,
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
    restraintQuality,
    restraintCompliance,
    restraintPolicy,
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
  quality: RestraintQualityResult,
  compliance: RestraintComplianceResult,
  policy: RestraintPolicyResult,
  staff: StaffRestraintReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall restraint management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall restraint management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Restraint quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Restraint compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Restraint policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff restraint readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: RestraintQualityResult,
  compliance: RestraintComplianceResult,
  policy: RestraintPolicyResult,
  staff: StaffRestraintReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall restraint management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall restraint management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Restraint quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Restraint compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Restraint policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff restraint readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: RestraintQualityResult,
  compliance: RestraintComplianceResult,
  policy: RestraintPolicyResult,
  staff: StaffRestraintReadinessResult,
  incidents: RestraintIncident[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No restraint policy in place — develop and implement comprehensive restraint reduction policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff restraint training records — schedule approved techniques training for all staff immediately");
  }

  // URGENT when injuries occurred
  const injuryIncidents = incidents.filter((i) => i.injuryOccurred);
  if (injuryIncidents.length > 0) {
    actions.push("URGENT: " + injuryIncidents.length + " restraint incident(s) resulted in injury — conduct immediate review of techniques and proportionality");
  }

  // Conditional on rates < 50
  if (quality.totalIncidents > 0 && quality.deEscalationRate < 50) {
    actions.push("HIGH: De-escalation rate at " + quality.deEscalationRate + "% — ensure de-escalation is always attempted before restraint");
  }

  if (quality.totalIncidents > 0 && quality.proportionateRate < 50) {
    actions.push("HIGH: Proportionate response rate at " + quality.proportionateRate + "% — review staff understanding of proportionality");
  }

  if (compliance.totalIncidents > 0 && compliance.bodyMapRate < 50) {
    actions.push("HIGH: Body map completion rate at " + compliance.bodyMapRate + "% — ensure body maps are completed after every restraint");
  }

  if (compliance.totalIncidents > 0 && compliance.parentNotifiedRate < 50) {
    actions.push("HIGH: Parent notification rate at " + compliance.parentNotifiedRate + "% — strengthen parent/carer notification processes");
  }

  if (quality.totalIncidents > 0 && quality.childViewsRate < 50) {
    actions.push("MEDIUM: Child views recording rate at " + quality.childViewsRate + "% — ensure children's perspectives are always sought and recorded");
  }

  if (compliance.totalIncidents > 0 && compliance.debriefRate < 50) {
    actions.push("MEDIUM: Debrief completion rate at " + compliance.debriefRate + "% — implement mandatory post-incident debrief protocol");
  }

  if (staff.totalStaff > 0 && staff.approvedTechniquesCertifiedRate < 50) {
    actions.push("MEDIUM: Staff certification rate at " + staff.approvedTechniquesCertifiedRate + "% — schedule refresher training on approved techniques");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Restraint management systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 20 — Restraint and deprivation of liberty",
    "CHR 2015 Regulation 19 — Behaviour management (positive relationships)",
    "CHR 2015 Regulation 35 — Behaviour management record keeping",
    "CHR 2015 Regulation 40(4)(a) — Notification of serious events to Ofsted",
    "Children Act 1989 s.22 — Duty to safeguard and promote welfare",
    "Reducing the Need for Restraint and Restrictive Intervention (DfE 2019)",
    "BILD Code of Practice for Minimising Restrictive Practices",
  ];
}
