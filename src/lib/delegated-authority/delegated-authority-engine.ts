/* ──────────────────────────────────────────────────────────────
   Delegated Authority Intelligence Engine

   Pure deterministic engine for evaluating how well a children's
   residential home manages delegated authority — day-to-day decisions
   that carers can make on behalf of parents/local authority for
   looked-after children.

   Regulatory basis:
     - CHR 2015 Reg 5 — Quality and purpose of care (normalcy)
     - CHR 2015 Reg 14 — Care planning (placement plan)
     - Children Act 1989 s.33(3)(b) — Parental responsibility sharing
     - IRO Handbook — Delegated authority
     - DfE Guidance: Delegated authority for looked-after children
     - SCCIF — Children enjoy normalised childhood experiences
     - NMS 1 — Statement of purpose and children's guide

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthorityCategory =
  | "education_decisions"
  | "health_appointments"
  | "social_activities"
  | "overnight_stays"
  | "haircuts_appearance"
  | "travel_permissions"
  | "religious_observance"
  | "emergency_medical";

export type DecisionOutcome =
  | "approved_timely"
  | "approved_delayed"
  | "referred_up"
  | "denied"
  | "not_assessed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const authorityCategoryLabels: Record<AuthorityCategory, string> = {
  education_decisions: "Education Decisions",
  health_appointments: "Health Appointments",
  social_activities: "Social Activities",
  overnight_stays: "Overnight Stays",
  haircuts_appearance: "Haircuts & Appearance",
  travel_permissions: "Travel Permissions",
  religious_observance: "Religious Observance",
  emergency_medical: "Emergency Medical",
};

const decisionOutcomeLabels: Record<DecisionOutcome, string> = {
  approved_timely: "Approved (Timely)",
  approved_delayed: "Approved (Delayed)",
  referred_up: "Referred Up",
  denied: "Denied",
  not_assessed: "Not Assessed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getAuthorityCategoryLabel(category: AuthorityCategory): string {
  return authorityCategoryLabels[category];
}

export function getDecisionOutcomeLabel(outcome: DecisionOutcome): string {
  return decisionOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface AuthorityDecision {
  id: string;
  childId: string;
  childName: string;
  decisionDate: string;
  category: AuthorityCategory;
  outcome: DecisionOutcome;
  childConsulted: boolean;
  decisionDocumented: boolean;
  parentNotified: boolean;
  withinDelegatedScope: boolean;
  staffMadeDecision: boolean;
  outcomeRecorded: boolean;
}

export interface AuthorityPolicy {
  id: string;
  delegatedAuthorityMatrix: boolean;
  clearDecisionFramework: boolean;
  staffEmpowermentGuidance: boolean;
  escalationProtocol: boolean;
  parentalNotificationProcess: boolean;
  childParticipationFramework: boolean;
  regularReview: boolean;
}

export interface StaffAuthorityTraining {
  id: string;
  staffId: string;
  staffName: string;
  delegatedAuthorityUnderstanding: boolean;
  decisionMakingConfidence: boolean;
  scopeRecognition: boolean;
  documentationCompetency: boolean;
  escalationAwareness: boolean;
  childConsultationSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AuthorityQualityResult {
  totalDecisions: number;
  timelyApprovalRate: number;
  childConsultedRate: number;
  documentedRate: number;
  outcomeRecordedRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface AuthorityComplianceResult {
  totalDecisions: number;
  parentNotifiedRate: number;
  withinScopeRate: number;
  staffDecisionRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface AuthorityPolicyResult {
  delegatedAuthorityMatrix: boolean;
  clearDecisionFramework: boolean;
  staffEmpowermentGuidance: boolean;
  escalationProtocol: boolean;
  parentalNotificationProcess: boolean;
  childParticipationFramework: boolean;
  regularReview: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffAuthorityReadinessResult {
  totalStaff: number;
  delegatedAuthorityUnderstandingRate: number;
  decisionMakingConfidenceRate: number;
  scopeRecognitionRate: number;
  documentationCompetencyRate: number;
  escalationAwarenessRate: number;
  childConsultationSkillsRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildAuthorityProfile {
  childId: string;
  childName: string;
  totalDecisions: number;
  timelyApprovalRate: number;
  childConsultedRate: number;
  uniqueCategories: number;
  authorityScore: number;
}

export interface DelegatedAuthorityIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  authorityQuality: AuthorityQualityResult;
  authorityCompliance: AuthorityComplianceResult;
  authorityPolicy: AuthorityPolicyResult;
  staffReadiness: StaffAuthorityReadinessResult;
  childProfiles: ChildAuthorityProfile[];
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

// ── Evaluator 1: Authority Quality (0-25) ─────────────────────────────────

export function evaluateAuthorityQuality(
  decisions: AuthorityDecision[],
): AuthorityQualityResult {
  const totalDecisions = decisions.length;

  if (totalDecisions === 0) {
    return {
      totalDecisions: 0,
      timelyApprovalRate: 0,
      childConsultedRate: 0,
      documentedRate: 0,
      outcomeRecordedRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No authority decisions recorded — decision quality cannot be assessed"],
    };
  }

  const timelyCount = decisions.filter((d) => d.outcome === "approved_timely").length;
  const timelyApprovalRate = pct(timelyCount, totalDecisions);

  const consultedCount = decisions.filter((d) => d.childConsulted).length;
  const childConsultedRate = pct(consultedCount, totalDecisions);

  const documentedCount = decisions.filter((d) => d.decisionDocumented).length;
  const documentedRate = pct(documentedCount, totalDecisions);

  const outcomeCount = decisions.filter((d) => d.outcomeRecorded).length;
  const outcomeRecordedRate = pct(outcomeCount, totalDecisions);

  // Weights: timelyApprovalRate 7 + childConsultedRate 6 + documentedRate 6 + outcomeRecordedRate 6 = 25
  let score = 0;
  score += (timelyApprovalRate / 100) * 7;
  score += (childConsultedRate / 100) * 6;
  score += (documentedRate / 100) * 6;
  score += (outcomeRecordedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (timelyApprovalRate >= 80) {
    strengths.push("Strong timely decision-making: " + timelyApprovalRate + "% of decisions approved promptly");
  } else if (timelyApprovalRate < 50) {
    concerns.push("Timely approval rate at " + timelyApprovalRate + "% — decisions may be delayed unnecessarily");
  }

  if (childConsultedRate >= 80) {
    strengths.push("Excellent child consultation: " + childConsultedRate + "% of decisions involved the child");
  } else if (childConsultedRate < 50) {
    concerns.push("Child consultation rate at " + childConsultedRate + "% — children not consistently involved in decisions");
  }

  if (documentedRate >= 90) {
    strengths.push("Thorough documentation: " + documentedRate + "% of decisions fully documented");
  } else if (documentedRate < 60) {
    concerns.push("Documentation rate at " + documentedRate + "% — decision records incomplete");
  }

  if (outcomeRecordedRate >= 80) {
    strengths.push("Good outcome tracking: " + outcomeRecordedRate + "% of decisions have recorded outcomes");
  } else if (outcomeRecordedRate < 50) {
    concerns.push("Outcome recording at " + outcomeRecordedRate + "% — decision outcomes not tracked consistently");
  }

  return {
    totalDecisions,
    timelyApprovalRate,
    childConsultedRate,
    documentedRate,
    outcomeRecordedRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Authority Compliance (0-25) ──────────────────────────────

export function evaluateAuthorityCompliance(
  decisions: AuthorityDecision[],
): AuthorityComplianceResult {
  const totalDecisions = decisions.length;

  if (totalDecisions === 0) {
    return {
      totalDecisions: 0,
      parentNotifiedRate: 0,
      withinScopeRate: 0,
      staffDecisionRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No authority decisions recorded — compliance cannot be assessed"],
    };
  }

  const parentNotifiedCount = decisions.filter((d) => d.parentNotified).length;
  const parentNotifiedRate = pct(parentNotifiedCount, totalDecisions);

  const withinScopeCount = decisions.filter((d) => d.withinDelegatedScope).length;
  const withinScopeRate = pct(withinScopeCount, totalDecisions);

  const staffDecisionCount = decisions.filter((d) => d.staffMadeDecision).length;
  const staffDecisionRate = pct(staffDecisionCount, totalDecisions);

  const uniqueCategoriesSet = new Set(decisions.map((d) => d.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weights: parentNotifiedRate 8 + withinScopeRate 7 + staffDecisionRate 5 + categoryDiversityRatio 5 = 25
  let score = 0;
  score += (parentNotifiedRate / 100) * 8;
  score += (withinScopeRate / 100) * 7;
  score += (staffDecisionRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (parentNotifiedRate >= 90) {
    strengths.push("Excellent parental notification: " + parentNotifiedRate + "% of decisions communicated to parents/LA");
  } else if (parentNotifiedRate < 50) {
    concerns.push("Parent notification rate at " + parentNotifiedRate + "% — parents/LA not consistently informed");
  }

  if (withinScopeRate >= 90) {
    strengths.push("Strong scope adherence: " + withinScopeRate + "% of decisions within delegated authority");
  } else if (withinScopeRate < 70) {
    concerns.push("Within-scope rate at " + withinScopeRate + "% — some decisions may exceed delegated authority");
  }

  if (staffDecisionRate >= 80) {
    strengths.push("Staff empowerment evident: " + staffDecisionRate + "% of decisions made by staff");
  } else if (staffDecisionRate < 50) {
    concerns.push("Staff decision rate at " + staffDecisionRate + "% — staff may lack confidence in decision-making");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive authority coverage: " + uniqueCategories + " of 8 categories represented");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " decision category(ies) covered — limited scope of delegated authority");
  }

  return {
    totalDecisions,
    parentNotifiedRate,
    withinScopeRate,
    staffDecisionRate,
    categoryDiversityRatio,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Authority Policy (0-25) ──────────────────────────────────

export function evaluateAuthorityPolicy(
  policy: AuthorityPolicy | null,
): AuthorityPolicyResult {
  if (policy === null) {
    return {
      delegatedAuthorityMatrix: false,
      clearDecisionFramework: false,
      staffEmpowermentGuidance: false,
      escalationProtocol: false,
      parentalNotificationProcess: false,
      childParticipationFramework: false,
      regularReview: false,
      score: 0,
      strengths: [],
      concerns: ["No delegated authority policy in place — URGENT: develop comprehensive policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.delegatedAuthorityMatrix) score += 4;
  if (policy.clearDecisionFramework) score += 4;
  if (policy.staffEmpowermentGuidance) score += 4;
  if (policy.escalationProtocol) score += 4;
  if (policy.parentalNotificationProcess) score += 3;
  if (policy.childParticipationFramework) score += 3;
  if (policy.regularReview) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.delegatedAuthorityMatrix,
    policy.clearDecisionFramework,
    policy.staffEmpowermentGuidance,
    policy.escalationProtocol,
    policy.parentalNotificationProcess,
    policy.childParticipationFramework,
    policy.regularReview,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete delegated authority policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 delegated authority policy components in place");
  }

  if (!policy.delegatedAuthorityMatrix) {
    concerns.push("No delegated authority matrix — staff may be unclear about scope of authority");
  }
  if (!policy.clearDecisionFramework) {
    concerns.push("No clear decision framework — inconsistent decision-making may result");
  }
  if (!policy.staffEmpowermentGuidance) {
    concerns.push("No staff empowerment guidance — staff may not feel confident making decisions");
  }
  if (!policy.escalationProtocol) {
    concerns.push("No escalation protocol — unclear when to refer decisions upward");
  }
  if (!policy.parentalNotificationProcess) {
    concerns.push("No parental notification process — parents/LA may not be kept informed");
  }
  if (!policy.childParticipationFramework) {
    concerns.push("No child participation framework — children may not be involved in decisions about them");
  }
  if (!policy.regularReview) {
    concerns.push("No regular review process — delegated authority arrangements may become outdated");
  }

  return {
    delegatedAuthorityMatrix: policy.delegatedAuthorityMatrix,
    clearDecisionFramework: policy.clearDecisionFramework,
    staffEmpowermentGuidance: policy.staffEmpowermentGuidance,
    escalationProtocol: policy.escalationProtocol,
    parentalNotificationProcess: policy.parentalNotificationProcess,
    childParticipationFramework: policy.childParticipationFramework,
    regularReview: policy.regularReview,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Authority Readiness (0-25) ─────────────────────────

export function evaluateStaffAuthorityReadiness(
  training: StaffAuthorityTraining[],
): StaffAuthorityReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      delegatedAuthorityUnderstandingRate: 0,
      decisionMakingConfidenceRate: 0,
      scopeRecognitionRate: 0,
      documentationCompetencyRate: 0,
      escalationAwarenessRate: 0,
      childConsultationSkillsRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule delegated authority training for all staff"],
    };
  }

  const understandingCount = training.filter((t) => t.delegatedAuthorityUnderstanding).length;
  const delegatedAuthorityUnderstandingRate = pct(understandingCount, totalStaff);

  const confidenceCount = training.filter((t) => t.decisionMakingConfidence).length;
  const decisionMakingConfidenceRate = pct(confidenceCount, totalStaff);

  const scopeCount = training.filter((t) => t.scopeRecognition).length;
  const scopeRecognitionRate = pct(scopeCount, totalStaff);

  const docCount = training.filter((t) => t.documentationCompetency).length;
  const documentationCompetencyRate = pct(docCount, totalStaff);

  const escalationCount = training.filter((t) => t.escalationAwareness).length;
  const escalationAwarenessRate = pct(escalationCount, totalStaff);

  const consultationCount = training.filter((t) => t.childConsultationSkills).length;
  const childConsultationSkillsRate = pct(consultationCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (delegatedAuthorityUnderstandingRate / 100) * 6;
  score += (decisionMakingConfidenceRate / 100) * 5;
  score += (scopeRecognitionRate / 100) * 5;
  score += (documentationCompetencyRate / 100) * 4;
  score += (escalationAwarenessRate / 100) * 3;
  score += (childConsultationSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (delegatedAuthorityUnderstandingRate >= 80) {
    strengths.push("Strong understanding of delegated authority: " + delegatedAuthorityUnderstandingRate + "% of staff");
  } else if (delegatedAuthorityUnderstandingRate < 50) {
    concerns.push("Delegated authority understanding at " + delegatedAuthorityUnderstandingRate + "% — foundational training needed");
  }

  if (decisionMakingConfidenceRate >= 80) {
    strengths.push("Staff confident in decision-making: " + decisionMakingConfidenceRate + "%");
  } else if (decisionMakingConfidenceRate < 50) {
    concerns.push("Decision-making confidence at " + decisionMakingConfidenceRate + "% — staff may hesitate on day-to-day decisions");
  }

  if (scopeRecognitionRate >= 80) {
    strengths.push("Good scope recognition: " + scopeRecognitionRate + "% of staff understand authority boundaries");
  } else if (scopeRecognitionRate < 50) {
    concerns.push("Scope recognition at " + scopeRecognitionRate + "% — staff unclear about what they can decide");
  }

  if (documentationCompetencyRate >= 80) {
    strengths.push("Strong documentation skills: " + documentationCompetencyRate + "% of staff competent in recording decisions");
  } else if (documentationCompetencyRate < 50) {
    concerns.push("Documentation competency at " + documentationCompetencyRate + "% — decision records may be incomplete");
  }

  if (escalationAwarenessRate >= 80) {
    strengths.push("Good escalation awareness: " + escalationAwarenessRate + "% of staff know when to refer up");
  } else if (escalationAwarenessRate < 50) {
    concerns.push("Escalation awareness at " + escalationAwarenessRate + "% — staff may not refer appropriately");
  }

  if (childConsultationSkillsRate >= 80) {
    strengths.push("Child consultation skills strong: " + childConsultationSkillsRate + "% of staff skilled in consulting children");
  } else if (childConsultationSkillsRate < 50) {
    concerns.push("Child consultation skills at " + childConsultationSkillsRate + "% — children may not be adequately involved");
  }

  return {
    totalStaff,
    delegatedAuthorityUnderstandingRate,
    decisionMakingConfidenceRate,
    scopeRecognitionRate,
    documentationCompetencyRate,
    escalationAwarenessRate,
    childConsultationSkillsRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Authority Profiles ────────────────────────────────────────

export function buildChildAuthorityProfiles(
  decisions: AuthorityDecision[],
): ChildAuthorityProfile[] {
  if (decisions.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; decisions: AuthorityDecision[] }>();

  for (const d of decisions) {
    if (!childMap.has(d.childId)) {
      childMap.set(d.childId, { childId: d.childId, childName: d.childName, decisions: [] });
    }
    childMap.get(d.childId)!.decisions.push(d);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalDecisions = child.decisions.length;

    const timelyCount = child.decisions.filter((d) => d.outcome === "approved_timely").length;
    const timelyApprovalRate = pct(timelyCount, totalDecisions);

    const consultedCount = child.decisions.filter((d) => d.childConsulted).length;
    const childConsultedRate = pct(consultedCount, totalDecisions);

    const uniqueCategoriesSet = new Set(child.decisions.map((d) => d.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 decisions -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalDecisions >= 10) frequencyScore = 2;
    else if (totalDecisions >= 5) frequencyScore = 1;

    // rate1 (timelyApprovalRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (timelyApprovalRate >= 80) rate1Score = 3;
    else if (timelyApprovalRate >= 60) rate1Score = 2;
    else if (timelyApprovalRate >= 40) rate1Score = 1;

    // rate2 (childConsultedRate): same thresholds
    let rate2Score = 0;
    if (childConsultedRate >= 80) rate2Score = 3;
    else if (childConsultedRate >= 60) rate2Score = 2;
    else if (childConsultedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const authorityScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalDecisions,
      timelyApprovalRate,
      childConsultedRate,
      uniqueCategories,
      authorityScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateDelegatedAuthorityIntelligence(
  decisions: AuthorityDecision[],
  policy: AuthorityPolicy | null,
  training: StaffAuthorityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): DelegatedAuthorityIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter decisions to period
  const periodDecisions = decisions.filter(
    (d) => d.decisionDate >= periodStart && d.decisionDate <= periodEnd,
  );

  // Evaluate each layer
  const authorityQuality = evaluateAuthorityQuality(periodDecisions);
  const authorityCompliance = evaluateAuthorityCompliance(periodDecisions);
  const authorityPolicy = evaluateAuthorityPolicy(policy);
  const staffReadiness = evaluateStaffAuthorityReadiness(training);

  // Build child profiles
  const childProfiles = buildChildAuthorityProfiles(periodDecisions);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      authorityQuality.score +
      authorityCompliance.score +
      authorityPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    authorityQuality, authorityCompliance, authorityPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    authorityQuality, authorityCompliance, authorityPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    authorityQuality, authorityCompliance, authorityPolicy, staffReadiness, childProfiles,
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
    authorityQuality,
    authorityCompliance,
    authorityPolicy,
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
  quality: AuthorityQualityResult,
  compliance: AuthorityComplianceResult,
  policy: AuthorityPolicyResult,
  staff: StaffAuthorityReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall delegated authority management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall delegated authority management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Authority decision quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Authority compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Authority policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff authority readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: AuthorityQualityResult,
  compliance: AuthorityComplianceResult,
  policy: AuthorityPolicyResult,
  staff: StaffAuthorityReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall delegated authority management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall delegated authority management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Authority decision quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Authority compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Authority policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff authority readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: AuthorityQualityResult,
  compliance: AuthorityComplianceResult,
  policy: AuthorityPolicyResult,
  staff: StaffAuthorityReadinessResult,
  childProfiles: ChildAuthorityProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No delegated authority policy in place — develop and implement comprehensive policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff authority training records — schedule delegated authority training for all staff immediately");
  }

  // Conditional on rates < 50
  if (quality.totalDecisions > 0 && quality.timelyApprovalRate < 50) {
    actions.push("HIGH: Timely approval rate at " + quality.timelyApprovalRate + "% — review decision-making processes to reduce delays");
  }

  if (quality.totalDecisions > 0 && quality.childConsultedRate < 50) {
    actions.push("HIGH: Child consultation rate at " + quality.childConsultedRate + "% — embed child participation in all decision-making");
  }

  if (compliance.totalDecisions > 0 && compliance.parentNotifiedRate < 50) {
    actions.push("HIGH: Parent notification rate at " + compliance.parentNotifiedRate + "% — strengthen communication with parents/LA");
  }

  if (compliance.totalDecisions > 0 && compliance.withinScopeRate < 50) {
    actions.push("HIGH: Within-scope rate at " + compliance.withinScopeRate + "% — review delegated authority boundaries with staff");
  }

  if (quality.totalDecisions > 0 && quality.documentedRate < 50) {
    actions.push("MEDIUM: Documentation rate at " + quality.documentedRate + "% — improve decision recording practices");
  }

  if (quality.totalDecisions > 0 && quality.outcomeRecordedRate < 50) {
    actions.push("MEDIUM: Outcome recording at " + quality.outcomeRecordedRate + "% — ensure all decisions have recorded outcomes");
  }

  if (staff.totalStaff > 0 && staff.delegatedAuthorityUnderstandingRate < 50) {
    actions.push("MEDIUM: Staff understanding at " + staff.delegatedAuthorityUnderstandingRate + "% — schedule refresher training on delegated authority");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.authorityScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low authority scores — review individual delegated authority arrangements");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Delegated authority systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 5 — Quality and purpose of care (normalcy principle)",
    "CHR 2015 Regulation 14 — Care planning (placement plan)",
    "Children Act 1989 s.33(3)(b) — Parental responsibility sharing",
    "IRO Handbook — Independent reviewing officer and delegated authority",
    "DfE Guidance — Delegated authority for looked-after children",
    "SCCIF — Children enjoy normalised childhood experiences",
    "NMS 1 — Statement of purpose and children's guide",
  ];
}
