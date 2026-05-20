/* ──────────────────────────────────────────────────────────────
   Supervision Intelligence Engine

   Pure deterministic engine — no AI, no external calls.
   Evaluates staff supervision across four dimensions:

     1. Supervision Quality      (0–25)
     2. Supervision Compliance   (0–25)
     3. Supervision Policy       (0–25)
     4. Staff Supervision Readiness (0–25)

   Regulatory alignment:
     - CHR 2015 Reg 33  — Employment of staff (supervision requirement)
     - Skills for Care   — Effective supervision framework
     - Ofsted SCCIF      — Staff receive regular, high-quality supervision
     - CHR 2015 Guide Ch.8 — Staff support, development and supervision
     - Working Together 2023 — Supervision requirements
     - Munro Review      — Reflective supervision
     - NMS 19/20         — Staffing and learning & development

   No side-effects. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Type Unions ──────────────────────────────────────────────────────────────

export type SupervisionType =
  | "formal_one_to_one"
  | "reflective_practice"
  | "group_supervision"
  | "management_oversight"
  | "clinical_supervision"
  | "ad_hoc"
  | "probationary"
  | "annual_appraisal";

export type ContentCoverage =
  | "comprehensive"
  | "adequate"
  | "partial"
  | "minimal"
  | "not_recorded";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface SupervisionSession {
  id: string;
  staffId: string;
  staffName: string;
  sessionDate: string;
  supervisionType: SupervisionType;
  contentCoverage: ContentCoverage;
  reflectivePracticeIncluded: boolean;
  safeguardingDiscussed: boolean;
  wellbeingChecked: boolean;
  actionsFromPrevious: boolean;
  documentedProperly: boolean;
  withinTimescale: boolean;
}

export interface SupervisionPolicy {
  id: string;
  supervisionSchedule: boolean;
  reflectivePracticeRequirement: boolean;
  safeguardingAgenda: boolean;
  wellbeingFramework: boolean;
  newStarterProtocol: boolean;
  documentationStandards: boolean;
  regularReview: boolean;
}

export interface StaffSupervisionTraining {
  id: string;
  staffId: string;
  staffName: string;
  supervisorySkills: boolean;
  reflectivePractice: boolean;
  safeguardingKnowledge: boolean;
  wellbeingSupport: boolean;
  documentationCompetency: boolean;
  feedbackDelivery: boolean;
}

// ── Output Interfaces ────────────────────────────────────────────────────────

export interface SupervisionQualityResult {
  overallScore: number;
  contentRate: number;
  reflectiveRate: number;
  safeguardingRate: number;
  wellbeingRate: number;
  contentWeight: number;
  reflectiveWeight: number;
  safeguardingWeight: number;
  wellbeingWeight: number;
}

export interface SupervisionComplianceResult {
  overallScore: number;
  documentedRate: number;
  withinTimescaleRate: number;
  actionsReviewedRate: number;
  typeDiversityRatio: number;
  documentedWeight: number;
  withinTimescaleWeight: number;
  actionsReviewedWeight: number;
  typeDiversityWeight: number;
}

export interface SupervisionPolicyResult {
  overallScore: number;
  supervisionSchedule: boolean;
  reflectivePracticeRequirement: boolean;
  safeguardingAgenda: boolean;
  wellbeingFramework: boolean;
  newStarterProtocol: boolean;
  documentationStandards: boolean;
  regularReview: boolean;
}

export interface StaffReadinessResult {
  overallScore: number;
  supervisorySkillsRate: number;
  reflectivePracticeRate: number;
  safeguardingKnowledgeRate: number;
  wellbeingSupportRate: number;
  documentationCompetencyRate: number;
  feedbackDeliveryRate: number;
}

export interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  sessionCount: number;
  overallScore: number;
  frequencyScore: number;
  contentScore: number;
  reflectiveScore: number;
  diversityScore: number;
}

export interface SupervisionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  supervisionQuality: SupervisionQualityResult;
  supervisionCompliance: SupervisionComplianceResult;
  supervisionPolicy: SupervisionPolicyResult;
  staffReadiness: StaffReadinessResult;
  staffProfiles: StaffSupervisionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Label Maps ───────────────────────────────────────────────────────────────

const supervisionTypeLabels: Record<SupervisionType, string> = {
  formal_one_to_one: "Formal 1:1 Supervision",
  reflective_practice: "Reflective Practice",
  group_supervision: "Group Supervision",
  management_oversight: "Management Oversight",
  clinical_supervision: "Clinical Supervision",
  ad_hoc: "Ad-Hoc Supervision",
  probationary: "Probationary Supervision",
  annual_appraisal: "Annual Appraisal",
};

const contentCoverageLabels: Record<ContentCoverage, string> = {
  comprehensive: "Comprehensive",
  adequate: "Adequate",
  partial: "Partial",
  minimal: "Minimal",
  not_recorded: "Not Recorded",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSupervisionTypeLabel(t: SupervisionType): string {
  return supervisionTypeLabels[t];
}

export function getContentCoverageLabel(c: ContentCoverage): string {
  return contentCoverageLabels[c];
}

export function getRatingLabel(r: Rating): string {
  return ratingLabels[r];
}

// ── Evaluator 1: Supervision Quality (0–25) ─────────────────────────────────

export function evaluateSupervisionQuality(
  sessions: SupervisionSession[],
): SupervisionQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      contentRate: 0,
      reflectiveRate: 0,
      safeguardingRate: 0,
      wellbeingRate: 0,
      contentWeight: 0,
      reflectiveWeight: 0,
      safeguardingWeight: 0,
      wellbeingWeight: 0,
    };
  }

  const total = sessions.length;

  const contentCount = sessions.filter(
    (s) => s.contentCoverage === "comprehensive" || s.contentCoverage === "adequate",
  ).length;
  const contentRate = pct(contentCount, total);

  const reflectiveCount = sessions.filter((s) => s.reflectivePracticeIncluded).length;
  const reflectiveRate = pct(reflectiveCount, total);

  const safeguardingCount = sessions.filter((s) => s.safeguardingDiscussed).length;
  const safeguardingRate = pct(safeguardingCount, total);

  const wellbeingCount = sessions.filter((s) => s.wellbeingChecked).length;
  const wellbeingRate = pct(wellbeingCount, total);

  // Weights: content 7, reflective 6, safeguarding 6, wellbeing 6 = 25
  const contentWeight = Math.round((contentRate / 100) * 7 * 10) / 10;
  const reflectiveWeight = Math.round((reflectiveRate / 100) * 6 * 10) / 10;
  const safeguardingWeight = Math.round((safeguardingRate / 100) * 6 * 10) / 10;
  const wellbeingWeight = Math.round((wellbeingRate / 100) * 6 * 10) / 10;

  const overallScore = Math.round(
    (contentWeight + reflectiveWeight + safeguardingWeight + wellbeingWeight) * 10,
  ) / 10;

  return {
    overallScore,
    contentRate,
    reflectiveRate,
    safeguardingRate,
    wellbeingRate,
    contentWeight,
    reflectiveWeight,
    safeguardingWeight,
    wellbeingWeight,
  };
}

// ── Evaluator 2: Supervision Compliance (0–25) ──────────────────────────────

export function evaluateSupervisionCompliance(
  sessions: SupervisionSession[],
): SupervisionComplianceResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      withinTimescaleRate: 0,
      actionsReviewedRate: 0,
      typeDiversityRatio: 0,
      documentedWeight: 0,
      withinTimescaleWeight: 0,
      actionsReviewedWeight: 0,
      typeDiversityWeight: 0,
    };
  }

  const total = sessions.length;

  const documentedCount = sessions.filter((s) => s.documentedProperly).length;
  const documentedRate = pct(documentedCount, total);

  const timescaleCount = sessions.filter((s) => s.withinTimescale).length;
  const withinTimescaleRate = pct(timescaleCount, total);

  const actionsCount = sessions.filter((s) => s.actionsFromPrevious).length;
  const actionsReviewedRate = pct(actionsCount, total);

  const uniqueTypes = new Set(sessions.map((s) => s.supervisionType)).size;
  const typeDiversityRatio = Math.round((uniqueTypes / 8) * 100) / 100;

  // Weights: documented 8, timescale 7, actions 5, diversity 5 = 25
  const documentedWeight = Math.round((documentedRate / 100) * 8 * 10) / 10;
  const withinTimescaleWeight = Math.round((withinTimescaleRate / 100) * 7 * 10) / 10;
  const actionsReviewedWeight = Math.round((actionsReviewedRate / 100) * 5 * 10) / 10;
  const typeDiversityWeight = Math.round(typeDiversityRatio * 5 * 10) / 10;

  const overallScore = Math.round(
    (documentedWeight + withinTimescaleWeight + actionsReviewedWeight + typeDiversityWeight) * 10,
  ) / 10;

  return {
    overallScore,
    documentedRate,
    withinTimescaleRate,
    actionsReviewedRate,
    typeDiversityRatio,
    documentedWeight,
    withinTimescaleWeight,
    actionsReviewedWeight,
    typeDiversityWeight,
  };
}

// ── Evaluator 3: Supervision Policy (0–25) ──────────────────────────────────

export function evaluateSupervisionPolicy(
  policy: SupervisionPolicy | null,
): SupervisionPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      supervisionSchedule: false,
      reflectivePracticeRequirement: false,
      safeguardingAgenda: false,
      wellbeingFramework: false,
      newStarterProtocol: false,
      documentationStandards: false,
      regularReview: false,
    };
  }

  // Weights: schedule 4, reflective 4, safeguarding 4, wellbeing 4, newStarter 3, documentation 3, review 3 = 25
  let score = 0;
  if (policy.supervisionSchedule) score += 4;
  if (policy.reflectivePracticeRequirement) score += 4;
  if (policy.safeguardingAgenda) score += 4;
  if (policy.wellbeingFramework) score += 4;
  if (policy.newStarterProtocol) score += 3;
  if (policy.documentationStandards) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: score,
    supervisionSchedule: policy.supervisionSchedule,
    reflectivePracticeRequirement: policy.reflectivePracticeRequirement,
    safeguardingAgenda: policy.safeguardingAgenda,
    wellbeingFramework: policy.wellbeingFramework,
    newStarterProtocol: policy.newStarterProtocol,
    documentationStandards: policy.documentationStandards,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Supervision Readiness (0–25) ─────────────────────────

export function evaluateStaffSupervisionReadiness(
  training: StaffSupervisionTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      supervisorySkillsRate: 0,
      reflectivePracticeRate: 0,
      safeguardingKnowledgeRate: 0,
      wellbeingSupportRate: 0,
      documentationCompetencyRate: 0,
      feedbackDeliveryRate: 0,
    };
  }

  const total = training.length;

  const supervisorySkillsRate = pct(training.filter((t) => t.supervisorySkills).length, total);
  const reflectivePracticeRate = pct(training.filter((t) => t.reflectivePractice).length, total);
  const safeguardingKnowledgeRate = pct(training.filter((t) => t.safeguardingKnowledge).length, total);
  const wellbeingSupportRate = pct(training.filter((t) => t.wellbeingSupport).length, total);
  const documentationCompetencyRate = pct(training.filter((t) => t.documentationCompetency).length, total);
  const feedbackDeliveryRate = pct(training.filter((t) => t.feedbackDelivery).length, total);

  // Weights: supervisory 6, reflective 5, safeguarding 5, wellbeing 4, documentation 3, feedback 2 = 25
  const score =
    Math.round((supervisorySkillsRate / 100) * 6 * 10) / 10 +
    Math.round((reflectivePracticeRate / 100) * 5 * 10) / 10 +
    Math.round((safeguardingKnowledgeRate / 100) * 5 * 10) / 10 +
    Math.round((wellbeingSupportRate / 100) * 4 * 10) / 10 +
    Math.round((documentationCompetencyRate / 100) * 3 * 10) / 10 +
    Math.round((feedbackDeliveryRate / 100) * 2 * 10) / 10;

  return {
    overallScore: Math.round(score * 10) / 10,
    supervisorySkillsRate,
    reflectivePracticeRate,
    safeguardingKnowledgeRate,
    wellbeingSupportRate,
    documentationCompetencyRate,
    feedbackDeliveryRate,
  };
}

// ── Staff Supervision Profiles (0–10 per staff) ─────────────────────────────

export function buildStaffSupervisionProfiles(
  sessions: SupervisionSession[],
): StaffSupervisionProfile[] {
  const grouped = new Map<string, SupervisionSession[]>();

  for (const s of sessions) {
    const existing = grouped.get(s.staffId) ?? [];
    existing.push(s);
    grouped.set(s.staffId, existing);
  }

  const profiles: StaffSupervisionProfile[] = [];

  for (const [staffId, staffSessions] of grouped) {
    const staffName = staffSessions[0].staffName;
    const sessionCount = staffSessions.length;

    // freq: >=10 sessions -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (sessionCount >= 10) frequencyScore = 2;
    else if (sessionCount >= 5) frequencyScore = 1;

    // contentRate: >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    const contentCount = staffSessions.filter(
      (s) => s.contentCoverage === "comprehensive" || s.contentCoverage === "adequate",
    ).length;
    const contentRate = pct(contentCount, sessionCount);
    let contentScore = 0;
    if (contentRate >= 80) contentScore = 3;
    else if (contentRate >= 60) contentScore = 2;
    else if (contentRate >= 40) contentScore = 1;

    // reflectiveRate: same thresholds
    const reflectiveCount = staffSessions.filter((s) => s.reflectivePracticeIncluded).length;
    const reflectiveRate = pct(reflectiveCount, sessionCount);
    let reflectiveScore = 0;
    if (reflectiveRate >= 80) reflectiveScore = 3;
    else if (reflectiveRate >= 60) reflectiveScore = 2;
    else if (reflectiveRate >= 40) reflectiveScore = 1;

    // diversity: unique types >=4 -> 2, >=2 -> 1, else 0
    const uniqueTypes = new Set(staffSessions.map((s) => s.supervisionType)).size;
    let diversityScore = 0;
    if (uniqueTypes >= 4) diversityScore = 2;
    else if (uniqueTypes >= 2) diversityScore = 1;

    // Cap at 10
    const overallScore = Math.min(
      frequencyScore + contentScore + reflectiveScore + diversityScore,
      10,
    );

    profiles.push({
      staffId,
      staffName,
      sessionCount,
      overallScore,
      frequencyScore,
      contentScore,
      reflectiveScore,
      diversityScore,
    });
  }

  return profiles;
}

// ── Master Generator ─────────────────────────────────────────────────────────

export function generateSupervisionIntelligence(
  sessions: SupervisionSession[],
  policy: SupervisionPolicy | null,
  training: StaffSupervisionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SupervisionIntelligence {
  const supervisionQuality = evaluateSupervisionQuality(sessions);
  const supervisionCompliance = evaluateSupervisionCompliance(sessions);
  const supervisionPolicy = evaluateSupervisionPolicy(policy);
  const staffReadiness = evaluateStaffSupervisionReadiness(training);

  const rawScore =
    supervisionQuality.overallScore +
    supervisionCompliance.overallScore +
    supervisionPolicy.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(Math.round(rawScore * 10) / 10, 100);
  const rating = getRating(overallScore);

  const staffProfiles = buildStaffSupervisionProfiles(sessions);

  // ── Strengths (evaluator score >= 20) ──
  const strengths: string[] = [];

  if (supervisionQuality.overallScore >= 20) {
    strengths.push(
      "Supervision sessions demonstrate high quality with strong content coverage, reflective practice, safeguarding discussion, and wellbeing checks",
    );
  }
  if (supervisionCompliance.overallScore >= 20) {
    strengths.push(
      "Supervision compliance is strong with sessions documented properly, delivered within timescales, and previous actions consistently reviewed",
    );
  }
  if (supervisionPolicy.overallScore >= 20) {
    strengths.push(
      "The supervision policy framework is comprehensive, covering scheduling, reflective practice, safeguarding, and wellbeing requirements",
    );
  }
  if (staffReadiness.overallScore >= 20) {
    strengths.push(
      "Staff are well-prepared to deliver and receive supervision, with strong supervisory skills, reflective practice, and safeguarding knowledge",
    );
  }

  // ── Areas for Improvement (evaluator score < 15) ──
  const areasForImprovement: string[] = [];

  if (supervisionQuality.overallScore < 15 && sessions.length > 0) {
    areasForImprovement.push(
      "Supervision session quality needs improvement — content coverage, reflective practice, or safeguarding discussion rates are below expected standards",
    );
  }
  if (supervisionCompliance.overallScore < 15 && sessions.length > 0) {
    areasForImprovement.push(
      "Supervision compliance requires attention — documentation, timescale adherence, or action review rates need to improve",
    );
  }
  if (supervisionPolicy.overallScore < 15 && supervisionPolicy.overallScore > 0) {
    areasForImprovement.push(
      "The supervision policy has gaps — review and strengthen scheduling, reflective practice, safeguarding, or wellbeing components",
    );
  }
  if (staffReadiness.overallScore < 15 && training.length > 0) {
    areasForImprovement.push(
      "Staff supervision readiness needs development — invest in supervisory skills training, reflective practice, and safeguarding knowledge",
    );
  }

  // ── Actions ──
  const actions: string[] = [];

  // URGENT: policy = 0 or staff training = 0
  if (supervisionPolicy.overallScore === 0) {
    actions.push(
      "URGENT: No supervision policy in place — develop and implement a comprehensive supervision policy immediately to meet CHR 2015 Reg 33 requirements",
    );
  }
  if (staffReadiness.overallScore === 0) {
    actions.push(
      "URGENT: No staff supervision training recorded — implement a supervisory skills training programme as a matter of priority",
    );
  }

  // Conditional: rates < 50
  if (supervisionQuality.contentRate < 50 && sessions.length > 0) {
    actions.push(
      "Content coverage in supervision sessions is below 50% — introduce structured supervision agendas to ensure comprehensive coverage",
    );
  }
  if (supervisionQuality.reflectiveRate < 50 && sessions.length > 0) {
    actions.push(
      "Reflective practice is included in fewer than half of sessions — provide training in reflective supervision techniques aligned to Munro Review recommendations",
    );
  }
  if (supervisionQuality.safeguardingRate < 50 && sessions.length > 0) {
    actions.push(
      "Safeguarding is discussed in fewer than half of sessions — make safeguarding a mandatory standing agenda item in all supervision sessions",
    );
  }
  if (supervisionQuality.wellbeingRate < 50 && sessions.length > 0) {
    actions.push(
      "Staff wellbeing is checked in fewer than half of sessions — embed wellbeing checks as a core component of every supervision session",
    );
  }
  if (supervisionCompliance.documentedRate < 50 && sessions.length > 0) {
    actions.push(
      "Documentation rate is below 50% — implement supervision recording templates and set clear expectations for timely completion",
    );
  }
  if (supervisionCompliance.withinTimescaleRate < 50 && sessions.length > 0) {
    actions.push(
      "Fewer than half of sessions are delivered within required timescales — review scheduling arrangements and ensure supervision is prioritised",
    );
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 33 — Employment of staff, ensuring appropriate supervision arrangements",
    "Skills for Care — Effective supervision framework for adult social care",
    "Ofsted SCCIF — Staff receive regular, high-quality supervision",
    "CHR 2015 Guide Ch.8 — Staff support, development and supervision",
    "Working Together 2023 — Supervision requirements for safeguarding practitioners",
    "Munro Review — Reflective supervision as essential to effective child protection",
    "NMS 19/20 — Staffing of children's homes, learning and development",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    supervisionQuality,
    supervisionCompliance,
    supervisionPolicy,
    staffReadiness,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
