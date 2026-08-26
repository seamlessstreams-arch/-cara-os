import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Complaints Intelligence Engine
//
// Deterministic engine for evaluating complaints management quality in
// children's homes — complaint handling quality, investigation compliance,
// policy governance, and staff training readiness.
//
// Aligned to:
//   - CHR 2015 Reg 39 — Complaints and representations
//   - CHR 2015 Reg 40(2)(q) — Complaints records
//   - Children Act 1989 — Representations procedure
//   - SCCIF — Children know how to complain
//   - Ofsted Guide to CHR — Complaints handling
//   - UNCRC Article 12 — Right to be heard
//   - Quality Standards 2015 — Standard 1 (child-focused)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ComplaintCategory =
  | "care_quality"
  | "staff_conduct"
  | "food_nutrition"
  | "environmental"
  | "privacy_dignity"
  | "family_contact"
  | "health_medication"
  | "safeguarding_concern";

export type ComplaintOutcome =
  | "resolved_upheld"
  | "resolved_not_upheld"
  | "resolved_partially"
  | "withdrawn"
  | "ongoing";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface ComplaintRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: ComplaintCategory;
  outcome: ComplaintOutcome;
  // Quality flags (4)
  acknowledgedWithinTarget: boolean;   // quality rate 1, weight 7
  investigationThorough: boolean;      // quality rate 2, weight 6
  childViewCaptured: boolean;          // quality rate 3, weight 6
  outcomeExplainedToChild: boolean;    // quality rate 4, weight 6
  // Compliance flags (2 — other 2 are computed)
  documentationComplete: boolean;
  timelyResolution: boolean;
}

export interface ComplaintPolicy {
  complaintsPolicy: boolean;              // 4
  investigationProcedure: boolean;        // 4
  childComplaintsGuide: boolean;          // 4
  independentAdvocacyAccess: boolean;     // 4
  escalationFramework: boolean;           // 3
  lessonLearnedProcess: boolean;          // 3
  ofstedNotificationProtocol: boolean;    // 3
}

export interface StaffComplaintTraining {
  staffId: string;
  complaintHandling: boolean;        // 6
  childAdvocacy: boolean;            // 5
  investigationSkills: boolean;      // 5
  recordKeeping: boolean;            // 4
  conflictResolution: boolean;       // 3
  regulatoryKnowledge: boolean;      // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ComplaintQualityResult {
  overallScore: number;
  rating: Rating;
  totalComplaints: number;
  /** null when the population is empty — nothing measured, not 0%. */
  acknowledgedWithinTargetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  investigationThoroughRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewCapturedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  outcomeExplainedRate: number | null;
}

export interface ComplaintComplianceResult {
  overallScore: number;
  rating: Rating;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyResolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewCapturedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface ComplaintPolicyResult {
  overallScore: number;
  rating: Rating;
  complaintsPolicy: boolean;
  investigationProcedure: boolean;
  childComplaintsGuide: boolean;
  independentAdvocacyAccess: boolean;
  escalationFramework: boolean;
  lessonLearnedProcess: boolean;
  ofstedNotificationProtocol: boolean;
}

export interface StaffComplaintReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  complaintHandlingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childAdvocacyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  investigationSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictResolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  regulatoryKnowledgeRate: number | null;
}

export interface ChildComplaintProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  acknowledgedWithinTargetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewCapturedRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface ComplaintsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  complaintQuality: ComplaintQualityResult;
  complaintCompliance: ComplaintComplianceResult;
  complaintPolicy: ComplaintPolicyResult;
  staffReadiness: StaffComplaintReadinessResult;
  childProfiles: ChildComplaintProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

export function getComplaintCategoryLabel(cat: ComplaintCategory): string {
  const labels: Record<ComplaintCategory, string> = {
    care_quality: "Care Quality",
    staff_conduct: "Staff Conduct",
    food_nutrition: "Food & Nutrition",
    environmental: "Environmental",
    privacy_dignity: "Privacy & Dignity",
    family_contact: "Family Contact",
    health_medication: "Health & Medication",
    safeguarding_concern: "Safeguarding Concern",
  };
  return labels[cat] ?? cat;
}

export function getComplaintOutcomeLabel(o: ComplaintOutcome): string {
  const labels: Record<ComplaintOutcome, string> = {
    resolved_upheld: "Resolved (Upheld)",
    resolved_not_upheld: "Resolved (Not Upheld)",
    resolved_partially: "Resolved (Partially)",
    withdrawn: "Withdrawn",
    ongoing: "Ongoing",
  };
  return labels[o] ?? o;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: ComplaintCategory[] = [
  "care_quality", "staff_conduct", "food_nutrition", "environmental",
  "privacy_dignity", "family_contact", "health_medication", "safeguarding_concern",
];

// ── Evaluator 1: Complaint Quality (0-25) ─────────────────────────────────

export function evaluateComplaintQuality(records: ComplaintRecord[]): ComplaintQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalComplaints: 0, acknowledgedWithinTargetRate: null, investigationThoroughRate: null, childViewCapturedRate: null, outcomeExplainedRate: null };
  }

  const acknowledgedWithinTargetRate = rate(records.filter((r) => r.acknowledgedWithinTarget).length, total);
  const investigationThoroughRate = rate(records.filter((r) => r.investigationThorough).length, total);
  const childViewCapturedRate = rate(records.filter((r) => r.childViewCaptured).length, total);
  const outcomeExplainedRate = rate(records.filter((r) => r.outcomeExplainedToChild).length, total);

  // Weighted: acknowledgedWithinTargetRate 7 + investigationThoroughRate 6 + childViewCapturedRate 6 + outcomeExplainedRate 6 = 25
  const raw = ((acknowledgedWithinTargetRate ?? 0) / 100) * 7 + ((investigationThoroughRate ?? 0) / 100) * 6 + ((childViewCapturedRate ?? 0) / 100) * 6 + ((outcomeExplainedRate ?? 0) / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalComplaints: total, acknowledgedWithinTargetRate, investigationThoroughRate, childViewCapturedRate, outcomeExplainedRate };
}

// ── Evaluator 2: Complaint Compliance (0-25) ──────────────────────────────

export function evaluateComplaintCompliance(records: ComplaintRecord[]): ComplaintComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: null, timelyResolutionRate: null, childViewCapturedRate: null, categoryDiversityRatio: 0 };
  }

  const documentationRate = rate(records.filter((r) => r.documentationComplete).length, total);
  const timelyResolutionRate = rate(records.filter((r) => r.timelyResolution).length, total);
  const childViewCapturedRate = rate(records.filter((r) => r.childViewCaptured).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = rate(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyResolutionRate 7 + childViewCapturedRate 5 + categoryDiversityRatio 5 = 25
  const raw = ((documentationRate ?? 0) / 100) * 8 + ((timelyResolutionRate ?? 0) / 100) * 7 + ((childViewCapturedRate ?? 0) / 100) * 5 + ((categoryDiversityRatio ?? 0) / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyResolutionRate, childViewCapturedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateComplaintPolicy(policy: ComplaintPolicy | null): ComplaintPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", complaintsPolicy: false, investigationProcedure: false, childComplaintsGuide: false, independentAdvocacyAccess: false, escalationFramework: false, lessonLearnedProcess: false, ofstedNotificationProtocol: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.complaintsPolicy) score += 4;
  if (policy.investigationProcedure) score += 4;
  if (policy.childComplaintsGuide) score += 4;
  if (policy.independentAdvocacyAccess) score += 4;
  if (policy.escalationFramework) score += 3;
  if (policy.lessonLearnedProcess) score += 3;
  if (policy.ofstedNotificationProtocol) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    complaintsPolicy: policy.complaintsPolicy,
    investigationProcedure: policy.investigationProcedure,
    childComplaintsGuide: policy.childComplaintsGuide,
    independentAdvocacyAccess: policy.independentAdvocacyAccess,
    escalationFramework: policy.escalationFramework,
    lessonLearnedProcess: policy.lessonLearnedProcess,
    ofstedNotificationProtocol: policy.ofstedNotificationProtocol,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffComplaintReadiness(staff: StaffComplaintTraining[]): StaffComplaintReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, complaintHandlingRate: null, childAdvocacyRate: null, investigationSkillsRate: null, recordKeepingRate: null, conflictResolutionRate: null, regulatoryKnowledgeRate: null };
  }

  const complaintHandlingRate = rate(staff.filter((s) => s.complaintHandling).length, count);
  const childAdvocacyRate = rate(staff.filter((s) => s.childAdvocacy).length, count);
  const investigationSkillsRate = rate(staff.filter((s) => s.investigationSkills).length, count);
  const recordKeepingRate = rate(staff.filter((s) => s.recordKeeping).length, count);
  const conflictResolutionRate = rate(staff.filter((s) => s.conflictResolution).length, count);
  const regulatoryKnowledgeRate = rate(staff.filter((s) => s.regulatoryKnowledge).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    ((complaintHandlingRate ?? 0) / 100) * 6 +
    ((childAdvocacyRate ?? 0) / 100) * 5 +
    ((investigationSkillsRate ?? 0) / 100) * 5 +
    ((recordKeepingRate ?? 0) / 100) * 4 +
    ((conflictResolutionRate ?? 0) / 100) * 3 +
    ((regulatoryKnowledgeRate ?? 0) / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, complaintHandlingRate, childAdvocacyRate, investigationSkillsRate, recordKeepingRate, conflictResolutionRate, regulatoryKnowledgeRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildComplaintProfiles(records: ComplaintRecord[]): ChildComplaintProfile[] {
  const grouped = new Map<string, ComplaintRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildComplaintProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const acknowledgedWithinTargetRate = rate(recs.filter((r) => r.acknowledgedWithinTarget).length, totalRecords);
    const childViewCapturedRate = rate(recs.filter((r) => r.childViewCaptured).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 acknowledgedWithinTargetRate [>=80->3, >=60->2, >=40->1] + rate2 childViewCapturedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (meets(acknowledgedWithinTargetRate, 80)) score += 3;
    else if (meets(acknowledgedWithinTargetRate, 60)) score += 2;
    else if (meets(acknowledgedWithinTargetRate, 40)) score += 1;

    if (meets(childViewCapturedRate, 80)) score += 3;
    else if (meets(childViewCapturedRate, 60)) score += 2;
    else if (meets(childViewCapturedRate, 40)) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      acknowledgedWithinTargetRate,
      childViewCapturedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateComplaintsIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: ComplaintRecord[];
  policy: ComplaintPolicy | null;
  staff: StaffComplaintTraining[];
}): ComplaintsIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const complaintQuality = evaluateComplaintQuality(records);
  const complaintCompliance = evaluateComplaintCompliance(records);
  const complaintPolicy = evaluateComplaintPolicy(policy);
  const staffReadiness = evaluateStaffComplaintReadiness(staff);
  const childProfiles = buildChildComplaintProfiles(records);

  const overallScore = Math.min(
    100,
    complaintQuality.overallScore + complaintCompliance.overallScore + complaintPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (meets(complaintQuality.acknowledgedWithinTargetRate, 80)) strengths.push("Complaints are consistently acknowledged within the target timeframe");
  if (meets(complaintQuality.investigationThoroughRate, 80)) strengths.push("Investigations are thorough and well-conducted");
  if (meets(complaintQuality.childViewCapturedRate, 80)) strengths.push("Children's views are consistently captured during the complaints process");
  if (meets(complaintQuality.outcomeExplainedRate, 80)) strengths.push("Outcomes are routinely explained to children in an age-appropriate manner");
  if (meets(complaintCompliance.documentationRate, 80)) strengths.push("Complaints documentation is thorough and complete");
  if (meets(complaintCompliance.timelyResolutionRate, 80)) strengths.push("Complaints are resolved within required timescales");
  if (meets(staffReadiness.complaintHandlingRate, 80)) strengths.push("Staff are well trained in complaint handling procedures");
  if (meets(staffReadiness.childAdvocacyRate, 80)) strengths.push("Staff demonstrate strong child advocacy skills");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (below(complaintQuality.acknowledgedWithinTargetRate, 60)) areasForImprovement.push("Complaints are not being acknowledged within the target timeframe");
  if (below(complaintQuality.investigationThoroughRate, 60)) areasForImprovement.push("Investigation thoroughness needs improvement");
  if (below(complaintQuality.childViewCapturedRate, 60)) areasForImprovement.push("Children's views are not being consistently captured during complaints");
  if (below(complaintQuality.outcomeExplainedRate, 60)) areasForImprovement.push("Outcomes are not being explained to children effectively");
  if (below(complaintCompliance.documentationRate, 60)) areasForImprovement.push("Complaints documentation is incomplete or inconsistent");
  if (below(complaintCompliance.timelyResolutionRate, 60)) areasForImprovement.push("Complaints are not being resolved within required timescales");
  if (below(staffReadiness.complaintHandlingRate, 60)) areasForImprovement.push("Staff need more training in complaint handling procedures");
  if (below(staffReadiness.childAdvocacyRate, 60)) areasForImprovement.push("Staff child advocacy skills need development");

  // Actions
  const actions: string[] = [];
  if (complaintPolicy.overallScore === 0) actions.push("URGENT: Establish a complaints policy — CHR 2015 Reg 39 requires documented procedures for handling complaints and representations");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide complaint handling and child advocacy training to all staff — effective complaints management depends on skilled practitioners");
  if (below(complaintQuality.acknowledgedWithinTargetRate, 50)) actions.push("Ensure all complaints are acknowledged within the target timeframe — CHR 2015 Reg 39 requires timely acknowledgement");
  if (below(complaintQuality.investigationThoroughRate, 50)) actions.push("Improve investigation thoroughness — all complaints must be properly investigated and documented");
  if (below(complaintCompliance.documentationRate, 50)) actions.push("Improve complaints documentation — CHR 2015 Reg 40(2)(q) requires complete records");
  if (below(complaintCompliance.timelyResolutionRate, 50)) actions.push("Review resolution timescales — complaints should be resolved promptly");
  if (below(complaintQuality.childViewCapturedRate, 50)) actions.push("Ensure children's views are captured in every complaint — UNCRC Article 12 upholds the right to be heard");
  if (below(staffReadiness.childAdvocacyRate, 50)) actions.push("Train staff in child advocacy — children must be supported to express their views");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 39 — Complaints and representations",
    "CHR 2015 Reg 40(2)(q) — Complaints records",
    "Children Act 1989 — Representations procedure",
    "SCCIF — Children know how to complain",
    "Ofsted Guide to CHR — Complaints handling",
    "UNCRC Article 12 — Right to be heard",
    "Quality Standards 2015 — Standard 1 (child-focused)",
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
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
