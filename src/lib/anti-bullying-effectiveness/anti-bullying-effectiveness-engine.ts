// ══════════════════════════════════════════════════════════════════════════════
// ANTI-BULLYING EFFECTIVENESS INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how effectively a home prevents,
// identifies, and responds to bullying — incident management, prevention
// culture, intervention quality, and staff readiness.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Safeguarding: protecting children from bullying
//   - CHR 2015, Reg 16 — Behaviour management: preventing bullying behaviour
//   - SCCIF — How well children are helped and protected
//   - NMS 3 — Safeguarding: anti-bullying policy and practice
//   - Equality Act 2010 — Protection from discriminatory bullying
//   - KCSIE 2024 — Recognising and responding to peer-on-peer abuse
//   - UNCRC Article 19 — Protection from all forms of violence
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type BullyingType =
  | "physical"
  | "verbal"
  | "social_exclusion"
  | "cyberbullying"
  | "racial"
  | "homophobic"
  | "disability"
  | "sexual"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type ResolutionOutcome =
  | "fully_resolved"
  | "partially_resolved"
  | "ongoing"
  | "escalated"
  | "unresolved";

export type InterventionType =
  | "peer_mediation"
  | "restorative_practice"
  | "individual_support"
  | "group_work"
  | "staff_intervention"
  | "external_referral"
  | "safety_plan"
  | "parental_involvement";

export type ChildRole = "target" | "perpetrator" | "bystander" | "reporter";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface BullyingIncident {
  id: string;
  date: string; // ISO date
  bullyingType: BullyingType;
  severity: IncidentSeverity;
  childrenInvolved: { childId: string; childName: string; role: ChildRole }[];
  location: string;
  reportedBy: string;
  timeToResponse: number; // hours
  interventionType: InterventionType;
  resolutionOutcome: ResolutionOutcome;
  followUpCompleted: boolean;
  impactAssessed: boolean;
  childViewSought: boolean;
  safetyPlanCreated: boolean;
}

export interface AntiBullyingPolicy {
  id: string;
  lastReviewDate: string; // ISO date
  childrenConsulted: boolean;
  staffTrained: boolean;
  parentsInformed: boolean;
  policyAccessible: boolean;
  updatedAnnually: boolean;
  antiDiscriminatory: boolean;
}

export interface ChildBullyingSurvey {
  id: string;
  childId: string;
  childName: string;
  surveyDate: string; // ISO date
  feelsSafe: boolean;
  bulliedRecently: boolean;
  confidenceInStaffResponse: "very_confident" | "confident" | "not_confident" | "no_confidence";
}

export interface StaffAntiBullyingTraining {
  id: string;
  staffId: string;
  staffName: string;
  trainingDate: string; // ISO date
  recognitionSkills: boolean;
  interventionSkills: boolean;
  restorativePracticeTrained: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface IncidentManagementResult {
  totalIncidents: number;
  timelyResponseCount: number;
  timelyResponseRate: number;
  averageResponseHours: number;
  resolutionBreakdown: Record<ResolutionOutcome, number>;
  fullyResolvedRate: number;
  followUpCompletedCount: number;
  followUpCompletedRate: number;
  childViewSoughtCount: number;
  childViewSoughtRate: number;
  impactAssessedCount: number;
  impactAssessedRate: number;
  severityBreakdown: Record<IncidentSeverity, number>;
  typeBreakdown: Record<BullyingType, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface PreventionCultureResult {
  totalSurveys: number;
  feelsSafeCount: number;
  feelsSafeRate: number;
  bulliedRecentlyCount: number;
  bulliedRecentlyRate: number;
  confidenceBreakdown: Record<string, number>;
  highConfidenceRate: number;
  policyCurrentScore: number;
  childrenConsulted: boolean;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface InterventionQualityResult {
  totalIncidents: number;
  safetyPlanCount: number;
  safetyPlanRateHighCritical: number;
  restorativePracticeCount: number;
  restorativePracticeRate: number;
  diverseInterventions: number;
  interventionBreakdown: Record<InterventionType, number>;
  resolutionRate: number;
  externalReferralForCritical: number;
  criticalIncidents: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffReadinessResult {
  totalStaff: number;
  recognitionSkillsCount: number;
  recognitionSkillsRate: number;
  interventionSkillsCount: number;
  interventionSkillsRate: number;
  restorativePracticeCount: number;
  restorativePracticeRate: number;
  overallTrainedCount: number;
  overallTrainedRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildBullyingProfile {
  childId: string;
  childName: string;
  incidentsAsTarget: number;
  incidentsAsPerpetrator: number;
  incidentsAsBystander: number;
  incidentsAsReporter: number;
  totalInvolvement: number;
  feelsSafe: boolean | null;
  bulliedRecently: boolean | null;
  confidenceInStaff: string | null;
  wellbeingScore: number; // 0-10
}

export interface AntiBullyingEffectivenessIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  incidentManagement: IncidentManagementResult;
  preventionCulture: PreventionCultureResult;
  interventionQuality: InterventionQualityResult;
  staffReadiness: StaffReadinessResult;

  childProfiles: ChildBullyingProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Constants ──────────────────────────────────────────────────────────────

const TIMELY_RESPONSE_THRESHOLD_HOURS = 24;

// ── Core Function 1: Evaluate Incident Management (0-25) ─────────────────

export function evaluateIncidentManagement(
  incidents: BullyingIncident[],
): IncidentManagementResult {
  const totalIncidents = incidents.length;

  // Empty = 25 (no incidents = excellent)
  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      timelyResponseCount: 0,
      timelyResponseRate: 0,
      averageResponseHours: 0,
      resolutionBreakdown: {
        fully_resolved: 0, partially_resolved: 0, ongoing: 0,
        escalated: 0, unresolved: 0,
      },
      fullyResolvedRate: 0,
      followUpCompletedCount: 0,
      followUpCompletedRate: 0,
      childViewSoughtCount: 0,
      childViewSoughtRate: 0,
      impactAssessedCount: 0,
      impactAssessedRate: 0,
      severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      typeBreakdown: {
        physical: 0, verbal: 0, social_exclusion: 0, cyberbullying: 0,
        racial: 0, homophobic: 0, disability: 0, sexual: 0, other: 0,
      },
      score: 25,
      strengths: ["No bullying incidents recorded in period — positive home culture"],
      concerns: [],
    };
  }

  // Timely response
  const timelyResponseCount = incidents.filter(
    (i) => i.timeToResponse <= TIMELY_RESPONSE_THRESHOLD_HOURS,
  ).length;
  const timelyResponseRate = pct(timelyResponseCount, totalIncidents);
  const averageResponseHours =
    Math.round(
      (incidents.reduce((sum, i) => sum + i.timeToResponse, 0) / totalIncidents) * 10,
    ) / 10;

  // Resolution breakdown
  const resolutionBreakdown: Record<ResolutionOutcome, number> = {
    fully_resolved: 0, partially_resolved: 0, ongoing: 0,
    escalated: 0, unresolved: 0,
  };
  for (const i of incidents) {
    resolutionBreakdown[i.resolutionOutcome]++;
  }
  const fullyResolvedRate = pct(resolutionBreakdown.fully_resolved, totalIncidents);

  // Follow-up
  const followUpCompletedCount = incidents.filter((i) => i.followUpCompleted).length;
  const followUpCompletedRate = pct(followUpCompletedCount, totalIncidents);

  // Child view
  const childViewSoughtCount = incidents.filter((i) => i.childViewSought).length;
  const childViewSoughtRate = pct(childViewSoughtCount, totalIncidents);

  // Impact assessed
  const impactAssessedCount = incidents.filter((i) => i.impactAssessed).length;
  const impactAssessedRate = pct(impactAssessedCount, totalIncidents);

  // Severity breakdown
  const severityBreakdown: Record<IncidentSeverity, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };
  for (const i of incidents) {
    severityBreakdown[i.severity]++;
  }

  // Type breakdown
  const typeBreakdown: Record<BullyingType, number> = {
    physical: 0, verbal: 0, social_exclusion: 0, cyberbullying: 0,
    racial: 0, homophobic: 0, disability: 0, sexual: 0, other: 0,
  };
  for (const i of incidents) {
    typeBreakdown[i.bullyingType]++;
  }

  // Score (out of 25)
  let score = 0;
  // Timely response: max 7
  score += (timelyResponseRate / 100) * 7;
  // Resolution rate: max 6
  score += (fullyResolvedRate / 100) * 6;
  // Follow-up: max 5
  score += (followUpCompletedRate / 100) * 5;
  // Child view sought: max 4
  score += (childViewSoughtRate / 100) * 4;
  // Impact assessed: max 3
  score += (impactAssessedRate / 100) * 3;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (timelyResponseRate >= 90) {
    strengths.push("Excellent response timeliness: " + timelyResponseRate + "% of incidents responded to within 24 hours");
  } else if (timelyResponseRate < 70) {
    concerns.push("Response timeliness at " + timelyResponseRate + "% — below 70% threshold. Timely intervention is critical for child safety");
  }

  if (fullyResolvedRate >= 80) {
    strengths.push("Strong resolution rate: " + fullyResolvedRate + "% of bullying incidents fully resolved");
  } else if (fullyResolvedRate < 50) {
    concerns.push("Resolution rate at " + fullyResolvedRate + "% — over half of incidents not fully resolved");
  }

  if (followUpCompletedRate >= 90) {
    strengths.push("Consistent follow-up: " + followUpCompletedRate + "% of incidents have completed follow-up");
  } else if (followUpCompletedRate < 70) {
    concerns.push("Follow-up completion at " + followUpCompletedRate + "% — children may not feel supported post-incident");
  }

  if (childViewSoughtRate >= 90) {
    strengths.push("Children's voice prioritised: " + childViewSoughtRate + "% of incidents included child's view");
  } else if (childViewSoughtRate < 70) {
    concerns.push("Child view sought in only " + childViewSoughtRate + "% of incidents — UNCRC Article 12 requires children's participation");
  }

  if (impactAssessedRate >= 90) {
    strengths.push("Impact assessment completed in " + impactAssessedRate + "% of incidents");
  } else if (impactAssessedRate < 70) {
    concerns.push("Impact assessed in only " + impactAssessedRate + "% of incidents — long-term effects may be missed");
  }

  if (severityBreakdown.critical > 0) {
    concerns.push(severityBreakdown.critical + " critical bullying incident(s) recorded — requires immediate safeguarding review");
  }

  return {
    totalIncidents,
    timelyResponseCount,
    timelyResponseRate,
    averageResponseHours,
    resolutionBreakdown,
    fullyResolvedRate,
    followUpCompletedCount,
    followUpCompletedRate,
    childViewSoughtCount,
    childViewSoughtRate,
    impactAssessedCount,
    impactAssessedRate,
    severityBreakdown,
    typeBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Prevention Culture (0-25) ──────────────────

export function evaluatePreventionCulture(
  surveys: ChildBullyingSurvey[],
  policy: AntiBullyingPolicy | null,
): PreventionCultureResult {
  const totalSurveys = surveys.length;

  // Empty = 0 (no surveys = no evidence of prevention culture)
  if (totalSurveys === 0 && !policy) {
    return {
      totalSurveys: 0,
      feelsSafeCount: 0,
      feelsSafeRate: 0,
      bulliedRecentlyCount: 0,
      bulliedRecentlyRate: 0,
      confidenceBreakdown: {
        very_confident: 0, confident: 0, not_confident: 0, no_confidence: 0,
      },
      highConfidenceRate: 0,
      policyCurrentScore: 0,
      childrenConsulted: false,
      score: 0,
      strengths: [],
      concerns: ["No child bullying surveys completed — voice of child not captured regarding bullying"],
    };
  }

  // Feels safe
  const feelsSafeCount = surveys.filter((s) => s.feelsSafe).length;
  const feelsSafeRate = pct(feelsSafeCount, totalSurveys);

  // Bullied recently (inverse scoring)
  const bulliedRecentlyCount = surveys.filter((s) => s.bulliedRecently).length;
  const bulliedRecentlyRate = pct(bulliedRecentlyCount, totalSurveys);

  // Confidence in staff
  const confidenceBreakdown: Record<string, number> = {
    very_confident: 0, confident: 0, not_confident: 0, no_confidence: 0,
  };
  for (const s of surveys) {
    confidenceBreakdown[s.confidenceInStaffResponse]++;
  }
  const highConfidenceCount = confidenceBreakdown.very_confident + confidenceBreakdown.confident;
  const highConfidenceRate = pct(highConfidenceCount, totalSurveys);

  // Policy currency
  let policyCurrentScore = 0;
  const childrenConsulted = policy?.childrenConsulted ?? false;
  if (policy) {
    if (policy.updatedAnnually) policyCurrentScore += 1;
    if (policy.policyAccessible) policyCurrentScore += 1;
    if (policy.antiDiscriminatory) policyCurrentScore += 1;
  }

  // Score (out of 25)
  let score = 0;
  // Feels safe rate: max 8
  score += (feelsSafeRate / 100) * 8;
  // Bullied recently inversely: max 6 (0% bullied = 6, 100% bullied = 0)
  const notBulliedRate = totalSurveys > 0 ? 100 - bulliedRecentlyRate : 0;
  score += (notBulliedRate / 100) * 6;
  // Confidence in staff: max 5
  score += (highConfidenceRate / 100) * 5;
  // Policy currency: max 3
  score += policyCurrentScore;
  // Children consulted: max 3
  if (childrenConsulted) score += 3;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (feelsSafeRate >= 90) {
    strengths.push("Excellent safety perception: " + feelsSafeRate + "% of children report feeling safe from bullying");
  } else if (feelsSafeRate < 70) {
    concerns.push("Only " + feelsSafeRate + "% of children feel safe from bullying — culture of safety needs strengthening");
  }

  if (bulliedRecentlyRate === 0 && totalSurveys > 0) {
    strengths.push("No children report being bullied recently — strong anti-bullying culture");
  } else if (bulliedRecentlyRate > 30) {
    concerns.push(bulliedRecentlyRate + "% of children report being bullied recently — immediate action required");
  }

  if (highConfidenceRate >= 90) {
    strengths.push("High confidence in staff response: " + highConfidenceRate + "% of children trust staff to handle bullying");
  } else if (highConfidenceRate < 60) {
    concerns.push("Only " + highConfidenceRate + "% of children have confidence in staff response to bullying");
  }

  if (policy && policy.updatedAnnually && policy.policyAccessible && policy.antiDiscriminatory) {
    strengths.push("Anti-bullying policy is current, accessible, and anti-discriminatory");
  } else if (!policy) {
    concerns.push("No anti-bullying policy provided — NMS 3 requires documented policy");
  }

  if (childrenConsulted) {
    strengths.push("Children actively consulted in anti-bullying policy development");
  } else {
    concerns.push("Children not consulted in anti-bullying policy — their participation is essential per CHR 2015 Reg 7");
  }

  return {
    totalSurveys,
    feelsSafeCount,
    feelsSafeRate,
    bulliedRecentlyCount,
    bulliedRecentlyRate,
    confidenceBreakdown,
    highConfidenceRate,
    policyCurrentScore,
    childrenConsulted,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Intervention Quality (0-25) ────────────────

export function evaluateInterventionQuality(
  incidents: BullyingIncident[],
): InterventionQualityResult {
  const totalIncidents = incidents.length;

  // Empty = 25 (no incidents = excellent)
  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      safetyPlanCount: 0,
      safetyPlanRateHighCritical: 0,
      restorativePracticeCount: 0,
      restorativePracticeRate: 0,
      diverseInterventions: 0,
      interventionBreakdown: {
        peer_mediation: 0, restorative_practice: 0, individual_support: 0,
        group_work: 0, staff_intervention: 0, external_referral: 0,
        safety_plan: 0, parental_involvement: 0,
      },
      resolutionRate: 0,
      externalReferralForCritical: 0,
      criticalIncidents: 0,
      score: 25,
      strengths: ["No bullying incidents requiring intervention — prevention measures effective"],
      concerns: [],
    };
  }

  // Safety plans for high/critical
  const highCriticalIncidents = incidents.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  );
  const safetyPlanCount = highCriticalIncidents.filter((i) => i.safetyPlanCreated).length;
  const safetyPlanRateHighCritical = pct(safetyPlanCount, highCriticalIncidents.length);

  // Restorative practice
  const restorativePracticeCount = incidents.filter(
    (i) => i.interventionType === "restorative_practice",
  ).length;
  const restorativePracticeRate = pct(restorativePracticeCount, totalIncidents);

  // Diverse interventions
  const interventionBreakdown: Record<InterventionType, number> = {
    peer_mediation: 0, restorative_practice: 0, individual_support: 0,
    group_work: 0, staff_intervention: 0, external_referral: 0,
    safety_plan: 0, parental_involvement: 0,
  };
  for (const i of incidents) {
    interventionBreakdown[i.interventionType]++;
  }
  const diverseInterventions = Object.values(interventionBreakdown).filter((v) => v > 0).length;

  // Resolution rate (fully or partially resolved)
  const resolvedCount = incidents.filter(
    (i) => i.resolutionOutcome === "fully_resolved" || i.resolutionOutcome === "partially_resolved",
  ).length;
  const resolutionRate = pct(resolvedCount, totalIncidents);

  // External referral for critical
  const criticalIncidents = incidents.filter((i) => i.severity === "critical");
  const externalReferralForCritical = criticalIncidents.filter(
    (i) => i.interventionType === "external_referral",
  ).length;

  // Score (out of 25)
  let score = 0;
  // Safety plans for high/critical: max 7
  if (highCriticalIncidents.length > 0) {
    score += (safetyPlanRateHighCritical / 100) * 7;
  } else {
    score += 7; // No high/critical = full marks
  }
  // Restorative practice used: max 6
  score += (restorativePracticeRate / 100) * 6;
  // Diverse interventions: max 5 (8 types possible)
  score += (Math.min(diverseInterventions, 5) / 5) * 5;
  // Resolution: max 4
  score += (resolutionRate / 100) * 4;
  // External referral for critical: max 3
  if (criticalIncidents.length > 0) {
    score += (pct(externalReferralForCritical, criticalIncidents.length) / 100) * 3;
  } else {
    score += 3; // No critical = full marks
  }

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (highCriticalIncidents.length > 0 && safetyPlanRateHighCritical >= 90) {
    strengths.push("Safety plans created for " + safetyPlanRateHighCritical + "% of high/critical incidents");
  } else if (highCriticalIncidents.length > 0 && safetyPlanRateHighCritical < 70) {
    concerns.push("Safety plans created for only " + safetyPlanRateHighCritical + "% of high/critical incidents — all serious cases require safety planning");
  }

  if (restorativePracticeRate >= 40) {
    strengths.push("Good use of restorative practice (" + restorativePracticeRate + "%) supports relationship repair");
  } else if (restorativePracticeRate < 20 && totalIncidents > 0) {
    concerns.push("Restorative practice used in only " + restorativePracticeRate + "% of incidents — consider increasing use");
  }

  if (diverseInterventions >= 4) {
    strengths.push("Diverse intervention approaches used (" + diverseInterventions + " types) — tailored responses to individual needs");
  } else if (diverseInterventions <= 1 && totalIncidents > 0) {
    concerns.push("Only " + diverseInterventions + " intervention type(s) used — limited range may not meet diverse needs");
  }

  if (resolutionRate >= 80) {
    strengths.push("Strong resolution rate: " + resolutionRate + "% of incidents resolved or partially resolved");
  } else if (resolutionRate < 50) {
    concerns.push("Resolution rate at " + resolutionRate + "% — majority of incidents remain unresolved");
  }

  if (criticalIncidents.length > 0 && externalReferralForCritical === 0) {
    concerns.push("Critical incidents present but no external referrals made — multi-agency response may be needed");
  }

  return {
    totalIncidents,
    safetyPlanCount,
    safetyPlanRateHighCritical,
    restorativePracticeCount,
    restorativePracticeRate,
    diverseInterventions,
    interventionBreakdown,
    resolutionRate,
    externalReferralForCritical,
    criticalIncidents: criticalIncidents.length,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Staff Readiness (0-25) ─────────────────────

export function evaluateStaffReadiness(
  training: StaffAntiBullyingTraining[],
): StaffReadinessResult {
  const totalStaff = training.length;

  // Empty = 0 (no training records = no evidence of readiness)
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      recognitionSkillsCount: 0,
      recognitionSkillsRate: 0,
      interventionSkillsCount: 0,
      interventionSkillsRate: 0,
      restorativePracticeCount: 0,
      restorativePracticeRate: 0,
      overallTrainedCount: 0,
      overallTrainedRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff anti-bullying training records — staff readiness cannot be assessed"],
    };
  }

  // Recognition skills
  const recognitionSkillsCount = training.filter((t) => t.recognitionSkills).length;
  const recognitionSkillsRate = pct(recognitionSkillsCount, totalStaff);

  // Intervention skills
  const interventionSkillsCount = training.filter((t) => t.interventionSkills).length;
  const interventionSkillsRate = pct(interventionSkillsCount, totalStaff);

  // Restorative practice
  const restorativePracticeCount = training.filter((t) => t.restorativePracticeTrained).length;
  const restorativePracticeRate = pct(restorativePracticeCount, totalStaff);

  // Overall trained (all three skills)
  const overallTrainedCount = training.filter(
    (t) => t.recognitionSkills && t.interventionSkills && t.restorativePracticeTrained,
  ).length;
  const overallTrainedRate = pct(overallTrainedCount, totalStaff);

  // Score (out of 25)
  let score = 0;
  // Recognition skills: max 7
  score += (recognitionSkillsRate / 100) * 7;
  // Intervention skills: max 7
  score += (interventionSkillsRate / 100) * 7;
  // Restorative practice: max 6
  score += (restorativePracticeRate / 100) * 6;
  // Overall trained rate: max 5
  score += (overallTrainedRate / 100) * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (recognitionSkillsRate >= 90) {
    strengths.push("Excellent bullying recognition skills: " + recognitionSkillsRate + "% of staff trained");
  } else if (recognitionSkillsRate < 70) {
    concerns.push("Recognition skills at " + recognitionSkillsRate + "% — staff may miss signs of bullying");
  }

  if (interventionSkillsRate >= 90) {
    strengths.push("Strong intervention skills: " + interventionSkillsRate + "% of staff trained to intervene effectively");
  } else if (interventionSkillsRate < 70) {
    concerns.push("Intervention skills at " + interventionSkillsRate + "% — staff may not respond effectively to bullying");
  }

  if (restorativePracticeRate >= 80) {
    strengths.push("Good restorative practice training: " + restorativePracticeRate + "% of staff trained");
  } else if (restorativePracticeRate < 50) {
    concerns.push("Only " + restorativePracticeRate + "% of staff trained in restorative practice — limits intervention options");
  }

  if (overallTrainedRate === 100) {
    strengths.push("100% of staff fully trained across all anti-bullying competencies");
  } else if (overallTrainedRate < 50) {
    concerns.push("Only " + overallTrainedRate + "% of staff have complete anti-bullying training — significant training gap");
  }

  return {
    totalStaff,
    recognitionSkillsCount,
    recognitionSkillsRate,
    interventionSkillsCount,
    interventionSkillsRate,
    restorativePracticeCount,
    restorativePracticeRate,
    overallTrainedCount,
    overallTrainedRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Bullying Profiles ────────────────────────────────────────

export function buildChildBullyingProfiles(
  incidents: BullyingIncident[],
  surveys: ChildBullyingSurvey[],
): ChildBullyingProfile[] {
  // Collect all unique children from incidents and surveys
  const childMap = new Map<string, { childId: string; childName: string }>();

  for (const incident of incidents) {
    for (const child of incident.childrenInvolved) {
      if (!childMap.has(child.childId)) {
        childMap.set(child.childId, { childId: child.childId, childName: child.childName });
      }
    }
  }
  for (const survey of surveys) {
    if (!childMap.has(survey.childId)) {
      childMap.set(survey.childId, { childId: survey.childId, childName: survey.childName });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const childIncidents = incidents.filter((i) =>
      i.childrenInvolved.some((c) => c.childId === child.childId),
    );

    let incidentsAsTarget = 0;
    let incidentsAsPerpetrator = 0;
    let incidentsAsBystander = 0;
    let incidentsAsReporter = 0;

    for (const incident of childIncidents) {
      for (const c of incident.childrenInvolved) {
        if (c.childId === child.childId) {
          if (c.role === "target") incidentsAsTarget++;
          else if (c.role === "perpetrator") incidentsAsPerpetrator++;
          else if (c.role === "bystander") incidentsAsBystander++;
          else if (c.role === "reporter") incidentsAsReporter++;
        }
      }
    }

    const totalInvolvement = incidentsAsTarget + incidentsAsPerpetrator + incidentsAsBystander + incidentsAsReporter;

    // Latest survey data
    const childSurveys = surveys
      .filter((s) => s.childId === child.childId)
      .sort((a, b) => b.surveyDate.localeCompare(a.surveyDate));
    const latestSurvey = childSurveys[0] ?? null;

    // Wellbeing score 0-10
    let wellbeingScore = 10;
    // Deduct for being target
    wellbeingScore -= Math.min(4, incidentsAsTarget * 2);
    // Deduct for feeling unsafe
    if (latestSurvey && !latestSurvey.feelsSafe) wellbeingScore -= 2;
    // Deduct for recent bullying
    if (latestSurvey && latestSurvey.bulliedRecently) wellbeingScore -= 2;
    // Deduct for low confidence in staff
    if (latestSurvey && (latestSurvey.confidenceInStaffResponse === "not_confident" || latestSurvey.confidenceInStaffResponse === "no_confidence")) {
      wellbeingScore -= 1;
    }
    // Deduct for being perpetrator (indicates own wellbeing concern)
    wellbeingScore -= Math.min(2, incidentsAsPerpetrator);

    wellbeingScore = clamp(wellbeingScore, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      incidentsAsTarget,
      incidentsAsPerpetrator,
      incidentsAsBystander,
      incidentsAsReporter,
      totalInvolvement,
      feelsSafe: latestSurvey?.feelsSafe ?? null,
      bulliedRecently: latestSurvey?.bulliedRecently ?? null,
      confidenceInStaff: latestSurvey?.confidenceInStaffResponse ?? null,
      wellbeingScore,
    };
  });
}

// ── Generate Anti-Bullying Effectiveness Intelligence ────────────────────

export function generateAntiBullyingEffectivenessIntelligence(
  incidents: BullyingIncident[],
  surveys: ChildBullyingSurvey[],
  policy: AntiBullyingPolicy | null,
  training: StaffAntiBullyingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AntiBullyingEffectivenessIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter incidents to period
  const periodIncidents = incidents.filter(
    (i) => withinPeriod(i.date, periodStart, periodEnd),
  );

  // Evaluate each layer
  const incidentManagement = evaluateIncidentManagement(periodIncidents);
  const preventionCulture = evaluatePreventionCulture(surveys, policy);
  const interventionQuality = evaluateInterventionQuality(periodIncidents);
  const staffReadiness = evaluateStaffReadiness(training);

  // Build child profiles
  const childProfiles = buildChildBullyingProfiles(periodIncidents, surveys);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      incidentManagement.score +
      preventionCulture.score +
      interventionQuality.score +
      staffReadiness.score,
    ),
    0,
    100,
  );

  const rating = getOverallRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    incidentManagement, preventionCulture, interventionQuality, staffReadiness, overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    incidentManagement, preventionCulture, interventionQuality, staffReadiness, overallScore,
  );
  const actions = generateActions(
    incidentManagement, preventionCulture, interventionQuality, staffReadiness, childProfiles, periodIncidents,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    incidentManagement, preventionCulture, interventionQuality, staffReadiness,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    incidentManagement,
    preventionCulture,
    interventionQuality,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Rating ─────────────────────────────────────────────────────────────────

function getOverallRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  incident: IncidentManagementResult,
  prevention: PreventionCultureResult,
  intervention: InterventionQualityResult,
  staff: StaffReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall anti-bullying effectiveness rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall anti-bullying effectiveness rated Good (" + overallScore + "/100)");
  }

  // Pick top strengths from each area (max 2 per area)
  strengths.push(...incident.strengths.slice(0, 2));
  strengths.push(...prevention.strengths.slice(0, 2));
  strengths.push(...intervention.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  incident: IncidentManagementResult,
  prevention: PreventionCultureResult,
  intervention: InterventionQualityResult,
  staff: StaffReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall anti-bullying effectiveness rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall anti-bullying effectiveness Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...incident.concerns);
  areas.push(...prevention.concerns);
  areas.push(...intervention.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  incident: IncidentManagementResult,
  prevention: PreventionCultureResult,
  intervention: InterventionQualityResult,
  staff: StaffReadinessResult,
  childProfiles: ChildBullyingProfile[],
  incidents: BullyingIncident[],
): string[] {
  const actions: string[] = [];

  // Critical incidents
  const criticalCount = incident.severityBreakdown.critical;
  if (criticalCount > 0) {
    actions.push("URGENT: " + criticalCount + " critical bullying incident(s) — convene safeguarding review within 24 hours");
  }

  // Unresolved incidents
  const unresolvedCount = incident.resolutionBreakdown.unresolved;
  if (unresolvedCount > 0) {
    actions.push("URGENT: " + unresolvedCount + " unresolved bullying incident(s) — develop resolution plan immediately");
  }

  // Children at risk (low wellbeing)
  const atRiskChildren = childProfiles.filter((p) => p.wellbeingScore <= 4);
  if (atRiskChildren.length > 0) {
    actions.push("URGENT: " + atRiskChildren.length + " child(ren) with low wellbeing scores — arrange individual support and safety planning");
  }

  // High bullied recently rate
  if (prevention.bulliedRecentlyRate > 30) {
    actions.push("URGENT: " + prevention.bulliedRecentlyRate + "% of children report recent bullying — initiate whole-home anti-bullying intervention");
  }

  // Staff training gaps
  if (staff.overallTrainedRate < 50) {
    actions.push("HIGH: Only " + staff.overallTrainedRate + "% of staff fully trained in anti-bullying — schedule comprehensive training programme");
  }

  // Low feels safe rate
  if (prevention.feelsSafeRate < 70 && prevention.totalSurveys > 0) {
    actions.push("HIGH: Only " + prevention.feelsSafeRate + "% of children feel safe — review environmental and relational safety measures");
  }

  // Low follow-up rate
  if (incident.followUpCompletedRate < 70 && incident.totalIncidents > 0) {
    actions.push("MEDIUM: Follow-up completion at " + incident.followUpCompletedRate + "% — implement follow-up tracking system");
  }

  // Discriminatory bullying check
  const discriminatoryTypes: BullyingType[] = ["racial", "homophobic", "disability"];
  const discriminatoryCount = incidents.filter((i) => discriminatoryTypes.includes(i.bullyingType)).length;
  if (discriminatoryCount > 0) {
    actions.push("URGENT: " + discriminatoryCount + " discriminatory bullying incident(s) — review Equality Act 2010 compliance and update response procedures");
  }

  // No policy
  if (!prevention.childrenConsulted) {
    actions.push("MEDIUM: Children not consulted on anti-bullying policy — arrange consultation within next review cycle");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Anti-bullying systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(
  incident: IncidentManagementResult,
  prevention: PreventionCultureResult,
  intervention: InterventionQualityResult,
  staff: StaffReadinessResult,
): string[] {
  const links: string[] = [
    "CHR 2015, Reg 12 — Safeguarding: protecting children from bullying",
    "CHR 2015, Reg 16 — Behaviour management: preventing bullying behaviour",
    "SCCIF — How well children are helped and protected",
    "NMS 3 — Safeguarding: anti-bullying policy and practice",
    "Equality Act 2010 — Protection from discriminatory bullying",
    "KCSIE 2024 — Recognising and responding to peer-on-peer abuse",
    "UNCRC Article 19 — Protection from all forms of violence",
  ];

  return links;
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getBullyingTypeLabel(type: BullyingType): string {
  const labels: Record<BullyingType, string> = {
    physical: "Physical",
    verbal: "Verbal",
    social_exclusion: "Social Exclusion",
    cyberbullying: "Cyberbullying",
    racial: "Racial",
    homophobic: "Homophobic",
    disability: "Disability",
    sexual: "Sexual",
    other: "Other",
  };
  return labels[type];
}

export function getSeverityLabel(severity: IncidentSeverity): string {
  const labels: Record<IncidentSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[severity];
}

export function getResolutionLabel(outcome: ResolutionOutcome): string {
  const labels: Record<ResolutionOutcome, string> = {
    fully_resolved: "Fully Resolved",
    partially_resolved: "Partially Resolved",
    ongoing: "Ongoing",
    escalated: "Escalated",
    unresolved: "Unresolved",
  };
  return labels[outcome];
}

export function getInterventionLabel(type: InterventionType): string {
  const labels: Record<InterventionType, string> = {
    peer_mediation: "Peer Mediation",
    restorative_practice: "Restorative Practice",
    individual_support: "Individual Support",
    group_work: "Group Work",
    staff_intervention: "Staff Intervention",
    external_referral: "External Referral",
    safety_plan: "Safety Plan",
    parental_involvement: "Parental Involvement",
  };
  return labels[type];
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating];
}
