/* ──────────────────────────────────────────────────────────────
   Complaints & Feedback Intelligence Engine
   Pure deterministic – no AI, no network, no randomness.
   ────────────────────────────────────────────────────────────── */

// ── Literal types ──────────────────────────────────────────────

export type ComplaintCategory =
  | "care_quality"
  | "staff_behaviour"
  | "food_nutrition"
  | "environment_facilities"
  | "privacy_dignity"
  | "communication"
  | "activities_opportunities"
  | "safety_concerns";

export type ComplaintStatus =
  | "resolved_satisfactorily"
  | "resolved_partially"
  | "under_investigation"
  | "escalated"
  | "not_resolved";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input types ────────────────────────────────────────────────

export interface ComplaintRecord {
  id: string;
  childId: string;
  childName: string;
  complaintDate: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  childViewsSought: boolean;
  respondedWithinTimescale: boolean;
  outcomeDocumented: boolean;
  lessonLearnedRecorded: boolean;
  complainantInformed: boolean;
  advocacyOffered: boolean;
}

export interface ComplaintPolicy {
  id: string;
  complaintsProcess: boolean;
  childFriendlyGuide: boolean;
  independentAdvocacyAccess: boolean;
  escalationPathway: boolean;
  feedbackMechanism: boolean;
  regulatoryNotification: boolean;
  regularReview: boolean;
}

export interface StaffComplaintTraining {
  id: string;
  staffId: string;
  staffName: string;
  complaintsHandling: boolean;
  activeListening: boolean;
  conflictResolution: boolean;
  childRightsAwareness: boolean;
  documentationSkills: boolean;
  escalationProcess: boolean;
}

// ── Result types ───────────────────────────────────────────────

export interface ComplaintQualityResult {
  overallScore: number;
  totalComplaints: number;
  resolutionRate: number;
  childViewsRate: number;
  timelyResponseRate: number;
  advocacyRate: number;
  rating: Rating;
}

export interface ComplaintComplianceResult {
  overallScore: number;
  documentedRate: number;
  complainantInformedRate: number;
  lessonLearnedRate: number;
  categoryDiversityRatio: number;
  rating: Rating;
}

export interface ComplaintPolicyResult {
  overallScore: number;
  complaintsProcess: boolean;
  childFriendlyGuide: boolean;
  independentAdvocacyAccess: boolean;
  escalationPathway: boolean;
  feedbackMechanism: boolean;
  regulatoryNotification: boolean;
  regularReview: boolean;
  rating: Rating;
}

export interface StaffComplaintReadinessResult {
  overallScore: number;
  totalStaff: number;
  complaintsHandlingRate: number;
  activeListeningRate: number;
  conflictResolutionRate: number;
  childRightsRate: number;
  documentationRate: number;
  escalationRate: number;
  rating: Rating;
}

export interface ChildComplaintProfile {
  childId: string;
  childName: string;
  totalComplaints: number;
  resolutionRate: number;
  childViewsRate: number;
  categoriesCovered: ComplaintCategory[];
  overallScore: number;
}

export interface ComplaintsFeedbackIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  complaintQuality: ComplaintQualityResult;
  complaintCompliance: ComplaintComplianceResult;
  complaintPolicy: ComplaintPolicyResult;
  staffComplaintReadiness: StaffComplaintReadinessResult;
  childProfiles: ChildComplaintProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────

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

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  care_quality: "Care Quality",
  staff_behaviour: "Staff Behaviour",
  food_nutrition: "Food & Nutrition",
  environment_facilities: "Environment & Facilities",
  privacy_dignity: "Privacy & Dignity",
  communication: "Communication",
  activities_opportunities: "Activities & Opportunities",
  safety_concerns: "Safety Concerns",
};

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  resolved_satisfactorily: "Resolved Satisfactorily",
  resolved_partially: "Resolved Partially",
  under_investigation: "Under Investigation",
  escalated: "Escalated",
  not_resolved: "Not Resolved",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getComplaintCategoryLabel(c: ComplaintCategory): string {
  return CATEGORY_LABELS[c];
}
export function getComplaintStatusLabel(s: ComplaintStatus): string {
  return STATUS_LABELS[s];
}
export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r];
}

// ── Evaluators ─────────────────────────────────────────────────

const TOTAL_CATEGORIES = 8;

/** Quality evaluator — max 25. Weights: resolution 7, childViews 6, timely 6, advocacy 6. */
export function evaluateComplaintQuality(
  records: ComplaintRecord[],
): ComplaintQualityResult {
  const n = records.length;
  if (n === 0)
    return {
      overallScore: 0,
      totalComplaints: 0,
      resolutionRate: 0,
      childViewsRate: 0,
      timelyResponseRate: 0,
      advocacyRate: 0,
      rating: "inadequate",
    };

  const resolved = records.filter(
    (r) =>
      r.status === "resolved_satisfactorily" ||
      r.status === "resolved_partially",
  ).length;
  const childViews = records.filter((r) => r.childViewsSought).length;
  const timely = records.filter((r) => r.respondedWithinTimescale).length;
  const advocacy = records.filter((r) => r.advocacyOffered).length;

  const resolutionRate = pct(resolved, n);
  const childViewsRate = pct(childViews, n);
  const timelyResponseRate = pct(timely, n);
  const advocacyRate = pct(advocacy, n);

  const raw =
    (resolutionRate / 100) * 7 +
    (childViewsRate / 100) * 6 +
    (timelyResponseRate / 100) * 6 +
    (advocacyRate / 100) * 6;

  const overallScore = Math.min(25, Math.round(raw));
  return {
    overallScore,
    totalComplaints: n,
    resolutionRate,
    childViewsRate,
    timelyResponseRate,
    advocacyRate,
    rating: getRating(overallScore * 4),
  };
}

/** Compliance evaluator — max 25. Weights: documented 8, complainantInformed 7, lessonLearned 5, diversity 5. */
export function evaluateComplaintCompliance(
  records: ComplaintRecord[],
): ComplaintComplianceResult {
  const n = records.length;
  if (n === 0)
    return {
      overallScore: 0,
      documentedRate: 0,
      complainantInformedRate: 0,
      lessonLearnedRate: 0,
      categoryDiversityRatio: 0,
      rating: "inadequate",
    };

  const documented = records.filter((r) => r.outcomeDocumented).length;
  const informed = records.filter((r) => r.complainantInformed).length;
  const lessons = records.filter((r) => r.lessonLearnedRecorded).length;
  const uniqueCategories = new Set(records.map((r) => r.category)).size;

  const documentedRate = pct(documented, n);
  const complainantInformedRate = pct(informed, n);
  const lessonLearnedRate = pct(lessons, n);
  const categoryDiversityRatio = pct(uniqueCategories, TOTAL_CATEGORIES);

  const raw =
    (documentedRate / 100) * 8 +
    (complainantInformedRate / 100) * 7 +
    (lessonLearnedRate / 100) * 5 +
    (categoryDiversityRatio / 100) * 5;

  const overallScore = Math.min(25, Math.round(raw));
  return {
    overallScore,
    documentedRate,
    complainantInformedRate,
    lessonLearnedRate,
    categoryDiversityRatio,
    rating: getRating(overallScore * 4),
  };
}

/** Policy evaluator — max 25. 7 booleans: first 4 → 4pts each (16), last 3 → 3pts each (9) = 25. */
export function evaluateComplaintPolicy(
  policy: ComplaintPolicy | null,
): ComplaintPolicyResult {
  if (!policy)
    return {
      overallScore: 0,
      complaintsProcess: false,
      childFriendlyGuide: false,
      independentAdvocacyAccess: false,
      escalationPathway: false,
      feedbackMechanism: false,
      regulatoryNotification: false,
      regularReview: false,
      rating: "inadequate",
    };

  let score = 0;
  if (policy.complaintsProcess) score += 4;
  if (policy.childFriendlyGuide) score += 4;
  if (policy.independentAdvocacyAccess) score += 4;
  if (policy.escalationPathway) score += 4;
  if (policy.feedbackMechanism) score += 3;
  if (policy.regulatoryNotification) score += 3;
  if (policy.regularReview) score += 3;

  const overallScore = Math.min(25, score);
  return {
    overallScore,
    complaintsProcess: policy.complaintsProcess,
    childFriendlyGuide: policy.childFriendlyGuide,
    independentAdvocacyAccess: policy.independentAdvocacyAccess,
    escalationPathway: policy.escalationPathway,
    feedbackMechanism: policy.feedbackMechanism,
    regulatoryNotification: policy.regulatoryNotification,
    regularReview: policy.regularReview,
    rating: getRating(overallScore * 4),
  };
}

/** Staff readiness evaluator — max 25. 6 skills: 6+5+5+4+3+2 = 25. */
export function evaluateStaffComplaintReadiness(
  training: StaffComplaintTraining[],
): StaffComplaintReadinessResult {
  const n = training.length;
  if (n === 0)
    return {
      overallScore: 0,
      totalStaff: 0,
      complaintsHandlingRate: 0,
      activeListeningRate: 0,
      conflictResolutionRate: 0,
      childRightsRate: 0,
      documentationRate: 0,
      escalationRate: 0,
      rating: "inadequate",
    };

  const ch = training.filter((t) => t.complaintsHandling).length;
  const al = training.filter((t) => t.activeListening).length;
  const cr = training.filter((t) => t.conflictResolution).length;
  const cra = training.filter((t) => t.childRightsAwareness).length;
  const ds = training.filter((t) => t.documentationSkills).length;
  const ep = training.filter((t) => t.escalationProcess).length;

  const complaintsHandlingRate = pct(ch, n);
  const activeListeningRate = pct(al, n);
  const conflictResolutionRate = pct(cr, n);
  const childRightsRate = pct(cra, n);
  const documentationRate = pct(ds, n);
  const escalationRate = pct(ep, n);

  const raw =
    (complaintsHandlingRate / 100) * 6 +
    (activeListeningRate / 100) * 5 +
    (conflictResolutionRate / 100) * 5 +
    (childRightsRate / 100) * 4 +
    (documentationRate / 100) * 3 +
    (escalationRate / 100) * 2;

  const overallScore = Math.min(25, Math.round(raw));
  return {
    overallScore,
    totalStaff: n,
    complaintsHandlingRate,
    activeListeningRate,
    conflictResolutionRate,
    childRightsRate,
    documentationRate,
    escalationRate,
    rating: getRating(overallScore * 4),
  };
}

/** Child profiles — max 10 per child. */
export function buildChildComplaintProfiles(
  records: ComplaintRecord[],
): ChildComplaintProfile[] {
  if (records.length === 0) return [];

  const map = new Map<
    string,
    { childName: string; records: ComplaintRecord[] }
  >();
  for (const r of records) {
    let entry = map.get(r.childId);
    if (!entry) {
      entry = { childName: r.childName, records: [] };
      map.set(r.childId, entry);
    }
    entry.records.push(r);
  }

  const profiles: ChildComplaintProfile[] = [];
  for (const [childId, { childName, records: cr }] of map) {
    const n = cr.length;
    const resolved = cr.filter(
      (r) =>
        r.status === "resolved_satisfactorily" ||
        r.status === "resolved_partially",
    ).length;
    const childViews = cr.filter((r) => r.childViewsSought).length;
    const categories = [
      ...new Set(cr.map((r) => r.category)),
    ] as ComplaintCategory[];

    const resolutionRate = pct(resolved, n);
    const childViewsRate = pct(childViews, n);

    // Frequency score — having complaints addressed is positive
    let freq = 0;
    if (n >= 10) freq = 2;
    else if (n >= 5) freq = 1;

    // Rate1: resolution
    let r1 = 0;
    if (resolutionRate >= 80) r1 = 3;
    else if (resolutionRate >= 60) r1 = 2;
    else if (resolutionRate >= 40) r1 = 1;

    // Rate2: child views
    let r2 = 0;
    if (childViewsRate >= 80) r2 = 3;
    else if (childViewsRate >= 60) r2 = 2;
    else if (childViewsRate >= 40) r2 = 1;

    // Diversity
    let div = 0;
    if (categories.length >= 4) div = 2;
    else if (categories.length >= 2) div = 1;

    const overallScore = Math.min(10, freq + r1 + r2 + div);

    profiles.push({
      childId,
      childName,
      totalComplaints: n,
      resolutionRate,
      childViewsRate,
      categoriesCovered: categories,
      overallScore,
    });
  }

  return profiles;
}

// ── Master generator ───────────────────────────────────────────

export function generateComplaintsFeedbackIntelligence(
  records: ComplaintRecord[],
  policy: ComplaintPolicy | null,
  training: StaffComplaintTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ComplaintsFeedbackIntelligence {
  const complaintQuality = evaluateComplaintQuality(records);
  const complaintCompliance = evaluateComplaintCompliance(records);
  const complaintPolicy = evaluateComplaintPolicy(policy);
  const staffComplaintReadiness = evaluateStaffComplaintReadiness(training);
  const childProfiles = buildChildComplaintProfiles(records);

  const overallScore = Math.min(
    100,
    complaintQuality.overallScore +
      complaintCompliance.overallScore +
      complaintPolicy.overallScore +
      staffComplaintReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (complaintQuality.overallScore >= 20)
    strengths.push(
      "Excellent complaints handling with strong resolution rates and child engagement",
    );
  if (complaintCompliance.overallScore >= 20)
    strengths.push(
      "Strong compliance with complaints documentation, notification, and lessons learned",
    );
  if (complaintPolicy.overallScore >= 20)
    strengths.push(
      "Comprehensive complaints and feedback policy framework in place",
    );
  if (staffComplaintReadiness.overallScore >= 20)
    strengths.push(
      "Well-trained staff with strong complaints handling and conflict resolution skills",
    );

  const areasForImprovement: string[] = [];
  if (complaintQuality.overallScore < 15)
    areasForImprovement.push(
      "Complaints handling quality needs improvement — focus on resolution rates and child participation",
    );
  if (complaintCompliance.overallScore < 15)
    areasForImprovement.push(
      "Complaints compliance requires attention — ensure documentation and lesson-learning consistency",
    );
  if (complaintPolicy.overallScore < 15)
    areasForImprovement.push(
      "Complaints policy framework needs strengthening — child-friendly guide and advocacy access required",
    );
  if (staffComplaintReadiness.overallScore < 15)
    areasForImprovement.push(
      "Staff complaints handling training and readiness needs development",
    );

  const actions: string[] = [];
  if (complaintPolicy.overallScore === 0)
    actions.push(
      "URGENT: Develop and implement a complaints and feedback policy immediately",
    );
  if (staffComplaintReadiness.overallScore === 0)
    actions.push(
      "URGENT: Arrange complaints handling training for all staff",
    );
  if (complaintQuality.childViewsRate < 50)
    actions.push(
      "Ensure children's views are actively sought in all complaint investigations",
    );
  if (complaintQuality.advocacyRate < 50)
    actions.push(
      "Increase independent advocacy offer for children making complaints",
    );
  if (complaintCompliance.lessonLearnedRate < 50)
    actions.push(
      "Improve lessons-learned recording to drive service improvement from complaints",
    );
  if (complaintQuality.timelyResponseRate < 50)
    actions.push(
      "Review complaint response timescales — ensure all complaints are addressed promptly",
    );

  const regulatoryLinks: string[] = [
    "Children's Homes (England) Regulations 2015 — Regulation 39 (Complaints and Representations)",
    "Children Act 1989, s26 — Complaints Procedure",
    "DfE Guide to the Children's Homes Regulations and Quality Standards",
    "Ofsted Social Care Common Inspection Framework",
    "UNCRC Article 12 — Right to be Heard",
    "Children's Commissioner — Children's Complaints Guidance",
    "Care Standards Act 2000 — Complaints Regulations",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    complaintQuality,
    complaintCompliance,
    complaintPolicy,
    staffComplaintReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
