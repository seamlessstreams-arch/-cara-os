// ══════════════════════════════════════════════════════════════════════════════
// NIGHT SUPERVISION QUALITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// home manages overnight supervision, safety checks, and waking/sleeping
// night arrangements.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Health and safety of children
//   - CHR 2015, Reg 34 — Staffing of children's homes
//   - SCCIF — Safety of children
//   - NMS 12 — Night supervision
//   - Fire Safety Order 2005
//   - Children Act 1989
//   - Working Together 2023
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type NightCheckType =
  | "welfare_check"
  | "bed_check"
  | "room_check"
  | "perimeter_check"
  | "medication_check"
  | "fire_safety"
  | "emergency_response"
  | "handover";

export type CheckOutcome =
  | "satisfactory"
  | "concern_noted"
  | "intervention_needed"
  | "child_awake"
  | "not_completed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ──────────────────────────────────────────────────

const nightCheckTypeLabels: Record<NightCheckType, string> = {
  welfare_check: "Welfare Check",
  bed_check: "Bed Check",
  room_check: "Room Check",
  perimeter_check: "Perimeter Check",
  medication_check: "Medication Check",
  fire_safety: "Fire Safety",
  emergency_response: "Emergency Response",
  handover: "Handover",
};

const checkOutcomeLabels: Record<CheckOutcome, string> = {
  satisfactory: "Satisfactory",
  concern_noted: "Concern Noted",
  intervention_needed: "Intervention Needed",
  child_awake: "Child Awake",
  not_completed: "Not Completed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getNightCheckTypeLabel(type: NightCheckType): string {
  return nightCheckTypeLabels[type];
}

export function getCheckOutcomeLabel(outcome: CheckOutcome): string {
  return checkOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface NightCheck {
  id: string;
  staffId: string;
  staffName: string;
  checkDate: string; // ISO date
  nightCheckType: NightCheckType;
  checkOutcome: CheckOutcome;
  childrenAccountedFor: boolean;
  documentedImmediately: boolean;
  environmentSafe: boolean;
  responseTimeAdequate: boolean;
  handoverCompleted: boolean;
  incidentsReported: boolean;
}

export interface NightPolicy {
  id: string;
  nightStaffingPolicy: boolean;
  checkFrequencyStandard: boolean;
  wakingNightCriteria: boolean;
  sleepingNightProtocol: boolean;
  emergencyResponsePlan: boolean;
  handoverProcedure: boolean;
  regularReview: boolean;
}

export interface StaffNightTraining {
  id: string;
  staffId: string;
  staffName: string;
  nightSupervisionSkills: boolean;
  safeguardingAtNight: boolean;
  emergencyFirstAid: boolean;
  fireEvacuation: boolean;
  childProtocol: boolean;
  documentationSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface CheckQualityResult {
  totalChecks: number;
  satisfactoryCount: number;
  satisfactoryRate: number;
  childrenAccountedForCount: number;
  childrenAccountedForRate: number;
  documentedCount: number;
  documentedRate: number;
  environmentSafeCount: number;
  environmentSafeRate: number;
  score: number; // 0-25
}

export interface NightComplianceResult {
  totalChecks: number;
  responseTimeAdequateCount: number;
  responseTimeAdequateRate: number;
  handoverCount: number;
  handoverRate: number;
  incidentReportCount: number;
  incidentReportRate: number;
  uniqueCheckTypes: number;
  checkTypeDiversity: number;
  score: number; // 0-25
}

export interface NightPolicyResult {
  nightStaffingPolicy: boolean;
  checkFrequencyStandard: boolean;
  wakingNightCriteria: boolean;
  sleepingNightProtocol: boolean;
  emergencyResponsePlan: boolean;
  handoverProcedure: boolean;
  regularReview: boolean;
  score: number; // 0-25
}

export interface StaffNightReadinessResult {
  totalStaff: number;
  nightSupervisionSkillsCount: number;
  nightSupervisionSkillsRate: number;
  safeguardingAtNightCount: number;
  safeguardingAtNightRate: number;
  emergencyFirstAidCount: number;
  emergencyFirstAidRate: number;
  fireEvacuationCount: number;
  fireEvacuationRate: number;
  childProtocolCount: number;
  childProtocolRate: number;
  documentationSkillsCount: number;
  documentationSkillsRate: number;
  score: number; // 0-25
}

export interface StaffNightProfile {
  staffId: string;
  staffName: string;
  totalChecks: number;
  satisfactoryRate: number;
  documentedRate: number;
  uniqueCheckTypes: number;
  score: number; // 0-10
}

export interface NightSupervisionQualityIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  checkQuality: CheckQualityResult;
  nightCompliance: NightComplianceResult;
  nightPolicy: NightPolicyResult;
  staffNightReadiness: StaffNightReadinessResult;

  staffNightProfiles: StaffNightProfile[];

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Function 1: Evaluate Check Quality (0-25) ────────────────────────

export function evaluateCheckQuality(checks: NightCheck[]): CheckQualityResult {
  const totalChecks = checks.length;

  // PRESENCE pattern: empty → 0
  if (totalChecks === 0) {
    return {
      totalChecks: 0,
      satisfactoryCount: 0,
      satisfactoryRate: 0,
      childrenAccountedForCount: 0,
      childrenAccountedForRate: 0,
      documentedCount: 0,
      documentedRate: 0,
      environmentSafeCount: 0,
      environmentSafeRate: 0,
      score: 0,
    };
  }

  const satisfactoryCount = checks.filter((c) => c.checkOutcome === "satisfactory").length;
  const satisfactoryRate = pct(satisfactoryCount, totalChecks);

  const childrenAccountedForCount = checks.filter((c) => c.childrenAccountedFor).length;
  const childrenAccountedForRate = pct(childrenAccountedForCount, totalChecks);

  const documentedCount = checks.filter((c) => c.documentedImmediately).length;
  const documentedRate = pct(documentedCount, totalChecks);

  const environmentSafeCount = checks.filter((c) => c.environmentSafe).length;
  const environmentSafeRate = pct(environmentSafeCount, totalChecks);

  // Sub-scores: satisfactoryRate (0-7), childrenAccountedFor (0-6), documented (0-6), environmentSafe (0-6) = 25
  let score = 0;
  score += Math.round((satisfactoryRate / 100) * 7 * 10) / 10;
  score += Math.round((childrenAccountedForRate / 100) * 6 * 10) / 10;
  score += Math.round((documentedRate / 100) * 6 * 10) / 10;
  score += Math.round((environmentSafeRate / 100) * 6 * 10) / 10;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalChecks,
    satisfactoryCount,
    satisfactoryRate,
    childrenAccountedForCount,
    childrenAccountedForRate,
    documentedCount,
    documentedRate,
    environmentSafeCount,
    environmentSafeRate,
    score,
  };
}

// ── Core Function 2: Evaluate Night Compliance (0-25) ─────────────────────

export function evaluateNightCompliance(checks: NightCheck[]): NightComplianceResult {
  const totalChecks = checks.length;

  // PRESENCE pattern: empty → 0
  if (totalChecks === 0) {
    return {
      totalChecks: 0,
      responseTimeAdequateCount: 0,
      responseTimeAdequateRate: 0,
      handoverCount: 0,
      handoverRate: 0,
      incidentReportCount: 0,
      incidentReportRate: 0,
      uniqueCheckTypes: 0,
      checkTypeDiversity: 0,
      score: 0,
    };
  }

  const responseTimeAdequateCount = checks.filter((c) => c.responseTimeAdequate).length;
  const responseTimeAdequateRate = pct(responseTimeAdequateCount, totalChecks);

  const handoverCount = checks.filter((c) => c.handoverCompleted).length;
  const handoverRate = pct(handoverCount, totalChecks);

  const incidentReportCount = checks.filter((c) => c.incidentsReported).length;
  const incidentReportRate = pct(incidentReportCount, totalChecks);

  const uniqueTypes = new Set(checks.map((c) => c.nightCheckType));
  const uniqueCheckTypes = uniqueTypes.size;
  const checkTypeDiversity = Math.round((uniqueCheckTypes / 8) * 100);

  // Sub-scores: responseTimeRate (0-8), handoverRate (0-7), incidentReportRate (0-5), checkTypeDiversity (0-5) = 25
  let score = 0;
  score += Math.round((responseTimeAdequateRate / 100) * 8 * 10) / 10;
  score += Math.round((handoverRate / 100) * 7 * 10) / 10;
  score += Math.round((incidentReportRate / 100) * 5 * 10) / 10;
  score += Math.round((checkTypeDiversity / 100) * 5 * 10) / 10;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalChecks,
    responseTimeAdequateCount,
    responseTimeAdequateRate,
    handoverCount,
    handoverRate,
    incidentReportCount,
    incidentReportRate,
    uniqueCheckTypes,
    checkTypeDiversity,
    score,
  };
}

// ── Core Function 3: Evaluate Night Policy (0-25) ─────────────────────────

export function evaluateNightPolicy(policy: NightPolicy | null): NightPolicyResult {
  // null → 0
  if (!policy) {
    return {
      nightStaffingPolicy: false,
      checkFrequencyStandard: false,
      wakingNightCriteria: false,
      sleepingNightProtocol: false,
      emergencyResponsePlan: false,
      handoverProcedure: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.nightStaffingPolicy) score += 4;
  if (policy.checkFrequencyStandard) score += 4;
  if (policy.wakingNightCriteria) score += 4;
  if (policy.sleepingNightProtocol) score += 4;
  if (policy.emergencyResponsePlan) score += 3;
  if (policy.handoverProcedure) score += 3;
  if (policy.regularReview) score += 3;

  score = clamp(score, 0, 25);

  return {
    nightStaffingPolicy: policy.nightStaffingPolicy,
    checkFrequencyStandard: policy.checkFrequencyStandard,
    wakingNightCriteria: policy.wakingNightCriteria,
    sleepingNightProtocol: policy.sleepingNightProtocol,
    emergencyResponsePlan: policy.emergencyResponsePlan,
    handoverProcedure: policy.handoverProcedure,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Core Function 4: Evaluate Staff Night Readiness (0-25) ────────────────

export function evaluateStaffNightReadiness(
  training: StaffNightTraining[],
): StaffNightReadinessResult {
  const totalStaff = training.length;

  // PRESENCE pattern: empty → 0
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      nightSupervisionSkillsCount: 0,
      nightSupervisionSkillsRate: 0,
      safeguardingAtNightCount: 0,
      safeguardingAtNightRate: 0,
      emergencyFirstAidCount: 0,
      emergencyFirstAidRate: 0,
      fireEvacuationCount: 0,
      fireEvacuationRate: 0,
      childProtocolCount: 0,
      childProtocolRate: 0,
      documentationSkillsCount: 0,
      documentationSkillsRate: 0,
      score: 0,
    };
  }

  const nightSupervisionSkillsCount = training.filter((t) => t.nightSupervisionSkills).length;
  const nightSupervisionSkillsRate = pct(nightSupervisionSkillsCount, totalStaff);

  const safeguardingAtNightCount = training.filter((t) => t.safeguardingAtNight).length;
  const safeguardingAtNightRate = pct(safeguardingAtNightCount, totalStaff);

  const emergencyFirstAidCount = training.filter((t) => t.emergencyFirstAid).length;
  const emergencyFirstAidRate = pct(emergencyFirstAidCount, totalStaff);

  const fireEvacuationCount = training.filter((t) => t.fireEvacuation).length;
  const fireEvacuationRate = pct(fireEvacuationCount, totalStaff);

  const childProtocolCount = training.filter((t) => t.childProtocol).length;
  const childProtocolRate = pct(childProtocolCount, totalStaff);

  const documentationSkillsCount = training.filter((t) => t.documentationSkills).length;
  const documentationSkillsRate = pct(documentationSkillsCount, totalStaff);

  // 6 skills weighted: 6+5+5+4+3+2 = 25
  // Each: rate = pct(trained, total), partialScore = round(rate/100 * weight)
  let score = 0;
  score += Math.round((nightSupervisionSkillsRate / 100) * 6);
  score += Math.round((safeguardingAtNightRate / 100) * 5);
  score += Math.round((emergencyFirstAidRate / 100) * 5);
  score += Math.round((fireEvacuationRate / 100) * 4);
  score += Math.round((childProtocolRate / 100) * 3);
  score += Math.round((documentationSkillsRate / 100) * 2);

  score = clamp(score, 0, 25);

  return {
    totalStaff,
    nightSupervisionSkillsCount,
    nightSupervisionSkillsRate,
    safeguardingAtNightCount,
    safeguardingAtNightRate,
    emergencyFirstAidCount,
    emergencyFirstAidRate,
    fireEvacuationCount,
    fireEvacuationRate,
    childProtocolCount,
    childProtocolRate,
    documentationSkillsCount,
    documentationSkillsRate,
    score,
  };
}

// ── Build Staff Night Profiles ────────────────────────────────────────────

export function buildStaffNightProfiles(checks: NightCheck[]): StaffNightProfile[] {
  if (checks.length === 0) return [];

  const staffMap = new Map<
    string,
    { staffId: string; staffName: string; checks: NightCheck[] }
  >();

  for (const check of checks) {
    const existing = staffMap.get(check.staffId);
    if (existing) {
      existing.checks.push(check);
    } else {
      staffMap.set(check.staffId, {
        staffId: check.staffId,
        staffName: check.staffName,
        checks: [check],
      });
    }
  }

  return Array.from(staffMap.values()).map((staff) => {
    const totalChecks = staff.checks.length;

    const satisfactoryCount = staff.checks.filter(
      (c) => c.checkOutcome === "satisfactory",
    ).length;
    const satisfactoryRate = pct(satisfactoryCount, totalChecks);

    const documentedCount = staff.checks.filter(
      (c) => c.documentedImmediately,
    ).length;
    const documentedRate = pct(documentedCount, totalChecks);

    const uniqueTypes = new Set(staff.checks.map((c) => c.nightCheckType));
    const uniqueCheckTypes = uniqueTypes.size;

    // Score 0-10
    let score = 0;

    // Frequency (0-2): >=10 → 2, >=5 → 1
    if (totalChecks >= 10) score += 2;
    else if (totalChecks >= 5) score += 1;

    // Satisfactory rate (0-3): >=80 → 3, >=60 → 2, >=40 → 1
    if (satisfactoryRate >= 80) score += 3;
    else if (satisfactoryRate >= 60) score += 2;
    else if (satisfactoryRate >= 40) score += 1;

    // Documented rate (0-3): >=80 → 3, >=60 → 2, >=40 → 1
    if (documentedRate >= 80) score += 3;
    else if (documentedRate >= 60) score += 2;
    else if (documentedRate >= 40) score += 1;

    // Type diversity (0-2): >=4 types → 2, >=2 types → 1
    if (uniqueCheckTypes >= 4) score += 2;
    else if (uniqueCheckTypes >= 2) score += 1;

    score = clamp(score, 0, 10);

    return {
      staffId: staff.staffId,
      staffName: staff.staffName,
      totalChecks,
      satisfactoryRate,
      documentedRate,
      uniqueCheckTypes,
      score,
    };
  });
}

// ── Generate Night Supervision Quality Intelligence ───────────────────────

export function generateNightSupervisionQualityIntelligence(
  checks: NightCheck[],
  policy: NightPolicy | null,
  training: StaffNightTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): NightSupervisionQualityIntelligence {
  const assessedAt = periodEnd;

  // Evaluate each layer
  const checkQuality = evaluateCheckQuality(checks);
  const nightCompliance = evaluateNightCompliance(checks);
  const nightPolicy = evaluateNightPolicy(policy);
  const staffNightReadiness = evaluateStaffNightReadiness(training);

  // Build staff profiles
  const staffNightProfiles = buildStaffNightProfiles(checks);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      checkQuality.score +
        nightCompliance.score +
        nightPolicy.score +
        staffNightReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = buildStrengths(checkQuality, nightCompliance, nightPolicy);
  const areasForImprovement = buildAreasForImprovement(
    checkQuality,
    nightCompliance,
    nightPolicy,
    staffNightReadiness,
  );
  const actions = buildActions(
    checks,
    policy,
    training,
    nightCompliance,
  );
  const regulatoryLinks = buildRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    checkQuality,
    nightCompliance,
    nightPolicy,
    staffNightReadiness,
    staffNightProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Strengths ─────────────────────────────────────────────────────────────

function buildStrengths(
  checkQuality: CheckQualityResult,
  nightCompliance: NightComplianceResult,
  _nightPolicy: NightPolicyResult,
): string[] {
  const strengths: string[] = [];

  if (checkQuality.satisfactoryRate >= 80) {
    strengths.push(
      "Strong night check quality with " +
        checkQuality.satisfactoryRate +
        "% satisfactory outcomes",
    );
  }

  if (checkQuality.childrenAccountedForRate >= 80) {
    strengths.push(
      "Children consistently accounted for during night checks (" +
        checkQuality.childrenAccountedForRate +
        "%)",
    );
  }

  if (nightCompliance.handoverRate >= 80) {
    strengths.push(
      "Excellent night shift handover completion at " +
        nightCompliance.handoverRate +
        "%",
    );
  }

  if (checkQuality.documentedRate >= 80) {
    strengths.push(
      "Good documentation practice with " +
        checkQuality.documentedRate +
        "% documented immediately",
    );
  }

  return strengths;
}

// ── Areas for Improvement ─────────────────────────────────────────────────

function buildAreasForImprovement(
  checkQuality: CheckQualityResult,
  nightCompliance: NightComplianceResult,
  nightPolicy: NightPolicyResult,
  staffNightReadiness: StaffNightReadinessResult,
): string[] {
  const areas: string[] = [];

  if (checkQuality.satisfactoryRate < 80 && checkQuality.totalChecks > 0) {
    areas.push(
      "Satisfactory check rate at " +
        checkQuality.satisfactoryRate +
        "% — below 80% target",
    );
  }

  if (nightCompliance.responseTimeAdequateRate < 80 && nightCompliance.totalChecks > 0) {
    areas.push(
      "Response time adequacy at " +
        nightCompliance.responseTimeAdequateRate +
        "% — needs improvement",
    );
  }

  if (nightPolicy.score < 20) {
    areas.push(
      "Night policy coverage incomplete — score " +
        nightPolicy.score +
        "/25",
    );
  }

  if (staffNightReadiness.score < 20 && staffNightReadiness.totalStaff > 0) {
    areas.push(
      "Staff night readiness below expected standard — score " +
        staffNightReadiness.score +
        "/25",
    );
  }

  return areas;
}

// ── Actions ───────────────────────────────────────────────────────────────

function buildActions(
  checks: NightCheck[],
  policy: NightPolicy | null,
  training: StaffNightTraining[],
  nightCompliance: NightComplianceResult,
): string[] {
  const actions: string[] = [];

  if (checks.length === 0) {
    actions.push(
      "No night check records found — implement a night check recording system immediately",
    );
  }

  if (!policy) {
    actions.push(
      "URGENT: No night supervision policy in place — develop and implement a comprehensive night supervision policy",
    );
  }

  if (training.length === 0) {
    actions.push(
      "URGENT: No staff night training records found — arrange night supervision training for all staff immediately",
    );
  }

  if (
    nightCompliance.responseTimeAdequateRate < 80 &&
    nightCompliance.totalChecks > 0
  ) {
    actions.push(
      "Improve response time adequacy — currently at " +
        nightCompliance.responseTimeAdequateRate +
        "%, target 80%",
    );
  }

  if (
    nightCompliance.incidentReportRate < 80 &&
    nightCompliance.totalChecks > 0
  ) {
    actions.push(
      "Strengthen incident reporting during night checks — currently at " +
        nightCompliance.incidentReportRate +
        "%, target 80%",
    );
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function buildRegulatoryLinks(): string[] {
  return [
    "CHR 2015, Reg 12 — Health and safety of children",
    "CHR 2015, Reg 34 — Staffing of children's homes",
    "SCCIF — Safety of children",
    "NMS 12 — Night supervision",
    "Fire Safety Order 2005",
    "Children Act 1989",
    "Working Together 2023",
  ];
}
