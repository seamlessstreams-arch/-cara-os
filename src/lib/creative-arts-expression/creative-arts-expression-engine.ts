// Creative Arts Expression Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type ArtForm =
  | "visual_art"
  | "music"
  | "drama"
  | "dance"
  | "creative_writing"
  | "photography"
  | "craft_design"
  | "digital_media";

export type ExpressionLevel =
  | "highly_expressive"
  | "expressive"
  | "moderate"
  | "limited"
  | "disengaged";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const ART_FORM_LABELS: Record<ArtForm, string> = {
  visual_art: "Visual Art",
  music: "Music",
  drama: "Drama",
  dance: "Dance",
  creative_writing: "Creative Writing",
  photography: "Photography",
  craft_design: "Craft & Design",
  digital_media: "Digital Media",
};

const EXPRESSION_LEVEL_LABELS: Record<ExpressionLevel, string> = {
  highly_expressive: "Highly Expressive",
  expressive: "Expressive",
  moderate: "Moderate",
  limited: "Limited",
  disengaged: "Disengaged",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getArtFormLabel(v: ArtForm): string { return ART_FORM_LABELS[v]; }
export function getExpressionLevelLabel(v: ExpressionLevel): string { return EXPRESSION_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface ArtsSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  artForm: ArtForm;
  expressionLevel: ExpressionLevel;
  creativityDemonstrated: boolean;
  confidenceGrown: boolean;
  therapeuticBenefit: boolean;
  documentedInPlan: boolean;
  staffFacilitated: boolean;
  feedbackGiven: boolean;
}

export interface CreativeArtsPolicy {
  id: string;
  artsEducationStrategy: boolean;
  therapeuticArtsFramework: boolean;
  resourceProvisionPlan: boolean;
  externalPartnerships: boolean;
  exhibitionAndShowcasePolicy: boolean;
  inclusiveAccessGuidance: boolean;
  regularReview: boolean;
}

export interface StaffCreativeArtsTraining {
  id: string;
  staffId: string;
  staffName: string;
  artsFacilitation: boolean;
  therapeuticArtsAwareness: boolean;
  creativeConfidenceBuilding: boolean;
  inclusivePractice: boolean;
  culturalArtsForms: boolean;
  safeguardingInArts: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface ArtsQualityResult {
  overallScore: number;
  totalSessions: number;
  expressionRate: number;
  creativityRate: number;
  confidenceRate: number;
  therapeuticRate: number;
}

export interface ArtsComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffFacilitatedRate: number;
  feedbackRate: number;
  artFormDiversityRatio: number;
}

export interface ArtsPolicyResult {
  overallScore: number;
  artsEducationStrategy: boolean;
  therapeuticArtsFramework: boolean;
  resourceProvisionPlan: boolean;
  externalPartnerships: boolean;
  exhibitionAndShowcasePolicy: boolean;
  inclusiveAccessGuidance: boolean;
  regularReview: boolean;
}

export interface StaffCreativeArtsReadinessResult {
  overallScore: number;
  totalStaff: number;
  artsFacilitationRate: number;
  therapeuticArtsAwarenessRate: number;
  creativeConfidenceBuildingRate: number;
  inclusivePracticeRate: number;
  culturalArtsFormsRate: number;
  safeguardingInArtsRate: number;
}

export interface ChildCreativeArtsProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  expressionRate: number;
  creativityRate: number;
  overallScore: number;
}

export interface CreativeArtsExpressionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  artsQuality: ArtsQualityResult;
  artsCompliance: ArtsComplianceResult;
  artsPolicy: ArtsPolicyResult;
  staffCreativeArtsReadiness: StaffCreativeArtsReadinessResult;
  childProfiles: ChildCreativeArtsProfile[];
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

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateArtsQuality(sessions: ArtsSession[]): ArtsQualityResult {
  if (sessions.length === 0) {
    return { overallScore: 0, totalSessions: 0, expressionRate: 0, creativityRate: 0, confidenceRate: 0, therapeuticRate: 0 };
  }

  const total = sessions.length;
  const expressiveCount = sessions.filter((s) => s.expressionLevel === "highly_expressive" || s.expressionLevel === "expressive").length;
  const creativityCount = sessions.filter((s) => s.creativityDemonstrated).length;
  const confidenceCount = sessions.filter((s) => s.confidenceGrown).length;
  const therapeuticCount = sessions.filter((s) => s.therapeuticBenefit).length;

  const expressionRate = pct(expressiveCount, total);
  const creativityRate = pct(creativityCount, total);
  const confidenceRate = pct(confidenceCount, total);
  const therapeuticRate = pct(therapeuticCount, total);

  const exScore = Math.round((expressionRate / 100) * 7);
  const crScore = Math.round((creativityRate / 100) * 6);
  const coScore = Math.round((confidenceRate / 100) * 6);
  const thScore = Math.round((therapeuticRate / 100) * 6);

  const overallScore = Math.min(25, exScore + crScore + coScore + thScore);

  return { overallScore, totalSessions: total, expressionRate, creativityRate, confidenceRate, therapeuticRate };
}

export function evaluateArtsCompliance(sessions: ArtsSession[]): ArtsComplianceResult {
  if (sessions.length === 0) {
    return { overallScore: 0, documentedRate: 0, staffFacilitatedRate: 0, feedbackRate: 0, artFormDiversityRatio: 0 };
  }

  const total = sessions.length;
  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const staffCount = sessions.filter((s) => s.staffFacilitated).length;
  const feedbackCount = sessions.filter((s) => s.feedbackGiven).length;
  const uniqueForms = new Set(sessions.map((s) => s.artForm)).size;
  const diversityRatio = pct(uniqueForms, 8);

  const documentedRate = pct(documentedCount, total);
  const staffFacilitatedRate = pct(staffCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const sfScore = Math.round((staffFacilitatedRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + sfScore + fbScore + divScore);

  return { overallScore, documentedRate, staffFacilitatedRate, feedbackRate, artFormDiversityRatio: diversityRatio };
}

export function evaluateArtsPolicy(policy: CreativeArtsPolicy | null): ArtsPolicyResult {
  if (!policy) {
    return { overallScore: 0, artsEducationStrategy: false, therapeuticArtsFramework: false, resourceProvisionPlan: false, externalPartnerships: false, exhibitionAndShowcasePolicy: false, inclusiveAccessGuidance: false, regularReview: false };
  }

  let score = 0;
  if (policy.artsEducationStrategy) score += 4;
  if (policy.therapeuticArtsFramework) score += 4;
  if (policy.resourceProvisionPlan) score += 4;
  if (policy.externalPartnerships) score += 4;
  if (policy.exhibitionAndShowcasePolicy) score += 3;
  if (policy.inclusiveAccessGuidance) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    artsEducationStrategy: policy.artsEducationStrategy, therapeuticArtsFramework: policy.therapeuticArtsFramework,
    resourceProvisionPlan: policy.resourceProvisionPlan, externalPartnerships: policy.externalPartnerships,
    exhibitionAndShowcasePolicy: policy.exhibitionAndShowcasePolicy, inclusiveAccessGuidance: policy.inclusiveAccessGuidance,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffCreativeArtsReadiness(training: StaffCreativeArtsTraining[]): StaffCreativeArtsReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, artsFacilitationRate: 0, therapeuticArtsAwarenessRate: 0, creativeConfidenceBuildingRate: 0, inclusivePracticeRate: 0, culturalArtsFormsRate: 0, safeguardingInArtsRate: 0 };
  }

  const total = training.length;
  const afRate = pct(training.filter((t) => t.artsFacilitation).length, total);
  const taRate = pct(training.filter((t) => t.therapeuticArtsAwareness).length, total);
  const ccRate = pct(training.filter((t) => t.creativeConfidenceBuilding).length, total);
  const ipRate = pct(training.filter((t) => t.inclusivePractice).length, total);
  const caRate = pct(training.filter((t) => t.culturalArtsForms).length, total);
  const saRate = pct(training.filter((t) => t.safeguardingInArts).length, total);

  const s1 = Math.round((afRate / 100) * 6);
  const s2 = Math.round((taRate / 100) * 5);
  const s3 = Math.round((ccRate / 100) * 5);
  const s4 = Math.round((ipRate / 100) * 4);
  const s5 = Math.round((caRate / 100) * 3);
  const s6 = Math.round((saRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, artsFacilitationRate: afRate, therapeuticArtsAwarenessRate: taRate, creativeConfidenceBuildingRate: ccRate, inclusivePracticeRate: ipRate, culturalArtsFormsRate: caRate, safeguardingInArtsRate: saRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildCreativeArtsProfiles(sessions: ArtsSession[]): ChildCreativeArtsProfile[] {
  if (sessions.length === 0) return [];

  const grouped = new Map<string, ArtsSession[]>();
  for (const s of sessions) {
    if (!grouped.has(s.childId)) grouped.set(s.childId, []);
    grouped.get(s.childId)!.push(s);
  }

  const profiles: ChildCreativeArtsProfile[] = [];

  for (const [childId, acts] of grouped) {
    const childName = acts[0].childName;
    const total = acts.length;
    const expressiveCount = acts.filter((s) => s.expressionLevel === "highly_expressive" || s.expressionLevel === "expressive").length;
    const creativityCount = acts.filter((s) => s.creativityDemonstrated).length;

    const expressionRate = pct(expressiveCount, total);
    const creativityRate = pct(creativityCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let exScore = 0;
    if (expressionRate >= 80) exScore = 3;
    else if (expressionRate >= 60) exScore = 2;
    else if (expressionRate >= 40) exScore = 1;

    let crScore = 0;
    if (creativityRate >= 80) crScore = 3;
    else if (creativityRate >= 60) crScore = 2;
    else if (creativityRate >= 40) crScore = 1;

    const uniqueForms = new Set(acts.map((s) => s.artForm)).size;
    let divScore = 0;
    if (uniqueForms >= 4) divScore = 2;
    else if (uniqueForms >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + exScore + crScore + divScore);

    profiles.push({ childId, childName, totalSessions: total, expressionRate, creativityRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateCreativeArtsExpressionIntelligence(
  sessions: ArtsSession[],
  policy: CreativeArtsPolicy | null,
  training: StaffCreativeArtsTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CreativeArtsExpressionIntelligence {
  const artsQuality = evaluateArtsQuality(sessions);
  const artsCompliance = evaluateArtsCompliance(sessions);
  const artsPolicy = evaluateArtsPolicy(policy);
  const staffCreativeArtsReadiness = evaluateStaffCreativeArtsReadiness(training);

  const overallScore = Math.min(100, artsQuality.overallScore + artsCompliance.overallScore + artsPolicy.overallScore + staffCreativeArtsReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildCreativeArtsProfiles(sessions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (artsQuality.expressionRate >= 80) strengths.push("Children are highly expressive and engaged in creative arts activities");
  if (artsQuality.creativityRate >= 80) strengths.push("Strong creativity demonstrated across arts sessions");
  if (artsQuality.confidenceRate >= 80) strengths.push("Creative arts activities are effectively building children's confidence");
  if (artsCompliance.documentedRate >= 80) strengths.push("Creative arts activities are well documented in care plans");

  if (sessions.length > 0 && artsQuality.expressionRate < 60) areasForImprovement.push("Creative expression levels need improvement — diversify art forms and approaches");
  if (sessions.length > 0 && artsQuality.therapeuticRate < 60) areasForImprovement.push("Therapeutic benefit from creative arts is below expected levels — embed therapeutic arts practice");
  if (sessions.length > 0 && artsQuality.creativityRate < 60) areasForImprovement.push("Creativity development needs strengthening across the cohort");
  if (sessions.length > 0 && artsCompliance.staffFacilitatedRate < 60) areasForImprovement.push("Staff facilitation of creative arts activities needs improvement");

  if (sessions.length === 0) actions.push("No creative arts sessions recorded — begin tracking arts engagement and expression");
  if (!policy) actions.push("URGENT: No creative arts policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff creative arts training recorded — arrange training for all staff");
  if (sessions.length > 0 && artsQuality.confidenceRate < 60) actions.push("Focus on confidence-building through creative arts — tailor sessions to individual strengths");
  if (sessions.length > 0 && artsCompliance.feedbackRate < 60) actions.push("Improve feedback processes for creative arts sessions");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health and well-being standard (creative expression)",
    "CHR 2015 Regulation 9 — Quality of care standard (enrichment activities)",
    "SCCIF — Experiences and progress of children (creative development)",
    "NMS 10 — Enjoying and achieving (creative arts)",
    "Children Act 1989 — Welfare of the child (development)",
    "UNCRC Article 31 — Right to leisure, play, and cultural activities",
    "Arts Council England — Quality Principles for young people",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    artsQuality, artsCompliance, artsPolicy, staffCreativeArtsReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
