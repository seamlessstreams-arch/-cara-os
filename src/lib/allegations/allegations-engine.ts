import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Allegations Intelligence Engine
//
// Deterministic engine for evaluating allegations management quality in
// children's homes — safeguarding response, LADO referrals, investigation
// compliance, and staff training in handling allegations.
//
// Aligned to:
//   - CHR 2015 Reg 37 — Complaints and representations
//   - CHR 2015 Reg 38 — Allegation procedures
//   - CHR 2015 Reg 40 — Notification of serious events
//   - Working Together 2023 Ch 2 — Managing allegations
//   - Keeping Children Safe in Education 2024 Part 4
//   - SCCIF — Leadership and management (responding to allegations)
//   - Safeguarding Vulnerable Groups Act 2006 — DBS referral duty
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type AllegationCategory =
  | "physical_abuse"
  | "emotional_abuse"
  | "sexual_abuse"
  | "neglect"
  | "inappropriate_restraint"
  | "professional_boundary"
  | "failure_to_safeguard"
  | "whistleblowing_concern";

export type AllegationOutcome =
  | "substantiated"
  | "unsubstantiated"
  | "unfounded"
  | "malicious"
  | "ongoing";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface AllegationRecord {
  id: string;
  childId: string;
  childName: string;
  reportDate: string;
  category: AllegationCategory;
  ladoReferralMade: boolean;
  ofstedNotified: boolean;
  childSupportOffered: boolean;
  staffSupportProvided: boolean;
  documentationComplete: boolean;
  timelyInvestigation: boolean;
}

export interface AllegationPolicy {
  id: string;
  allegationsPolicy: boolean;
  ladoReferralProtocol: boolean;
  ofstedNotificationProcedure: boolean;
  dbsReferralGuidance: boolean;
  childProtectionFramework: boolean;
  whistleblowingPolicy: boolean;
  reviewSchedule: boolean;
}

export interface StaffAllegationTraining {
  id: string;
  staffId: string;
  staffName: string;
  safeguardingKnowledge: boolean;
  allegationProcedures: boolean;
  ladoProcess: boolean;
  investigationSkills: boolean;
  childProtection: boolean;
  recordKeeping: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AllegationQualityResult {
  overallScore: number;
  rating: Rating;
  totalAllegations: number;
  /** null when the population is empty — nothing measured, not 0%. */
  ladoReferralRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ofstedNotifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffSupportRate: number | null;
}

export interface AllegationComplianceResult {
  overallScore: number;
  rating: Rating;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyInvestigationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface AllegationPolicyResult {
  overallScore: number;
  rating: Rating;
  allegationsPolicy: boolean;
  ladoReferralProtocol: boolean;
  ofstedNotificationProcedure: boolean;
  dbsReferralGuidance: boolean;
  childProtectionFramework: boolean;
  whistleblowingPolicy: boolean;
  reviewSchedule: boolean;
}

export interface StaffAllegationReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingKnowledgeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  allegationProceduresRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ladoProcessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  investigationSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childProtectionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
}

export interface ChildAllegationProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  ladoReferralRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childSupportRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface AllegationsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  allegationQuality: AllegationQualityResult;
  allegationCompliance: AllegationComplianceResult;
  allegationPolicy: AllegationPolicyResult;
  staffReadiness: StaffAllegationReadinessResult;
  childProfiles: ChildAllegationProfile[];
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

export function getAllegationCategoryLabel(cat: AllegationCategory): string {
  const labels: Record<AllegationCategory, string> = {
    physical_abuse: "Physical Abuse",
    emotional_abuse: "Emotional Abuse",
    sexual_abuse: "Sexual Abuse",
    neglect: "Neglect",
    inappropriate_restraint: "Inappropriate Restraint",
    professional_boundary: "Professional Boundary",
    failure_to_safeguard: "Failure to Safeguard",
    whistleblowing_concern: "Whistleblowing Concern",
  };
  return labels[cat] ?? cat;
}

export function getAllegationOutcomeLabel(outcome: AllegationOutcome): string {
  const labels: Record<AllegationOutcome, string> = {
    substantiated: "Substantiated",
    unsubstantiated: "Unsubstantiated",
    unfounded: "Unfounded",
    malicious: "Malicious",
    ongoing: "Ongoing",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: AllegationCategory[] = [
  "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
  "inappropriate_restraint", "professional_boundary", "failure_to_safeguard",
  "whistleblowing_concern",
];

// ── Evaluator 1: Allegation Quality (0-25) ─────────────────────────────────

export function evaluateAllegationQuality(records: AllegationRecord[]): AllegationQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalAllegations: 0, ladoReferralRate: null, ofstedNotifiedRate: null, childSupportRate: null, staffSupportRate: null };
  }

  const ladoReferralRate = rate(records.filter((r) => r.ladoReferralMade).length, total);
  const ofstedNotifiedRate = rate(records.filter((r) => r.ofstedNotified).length, total);
  const childSupportRate = rate(records.filter((r) => r.childSupportOffered).length, total);
  const staffSupportRate = rate(records.filter((r) => r.staffSupportProvided).length, total);

  // Weighted: ladoReferralRate 7 + ofstedNotifiedRate 6 + childSupportRate 6 + staffSupportRate 6 = 25
  const raw = ((ladoReferralRate ?? 0) / 100) * 7 + ((ofstedNotifiedRate ?? 0) / 100) * 6 + ((childSupportRate ?? 0) / 100) * 6 + ((staffSupportRate ?? 0) / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalAllegations: total, ladoReferralRate, ofstedNotifiedRate, childSupportRate, staffSupportRate };
}

// ── Evaluator 2: Allegation Compliance (0-25) ──────────────────────────────

export function evaluateAllegationCompliance(records: AllegationRecord[]): AllegationComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: null, timelyInvestigationRate: null, childSupportRate: null, categoryDiversityRatio: 0 };
  }

  const documentationRate = rate(records.filter((r) => r.documentationComplete).length, total);
  const timelyInvestigationRate = rate(records.filter((r) => r.timelyInvestigation).length, total);
  const childSupportRate = rate(records.filter((r) => r.childSupportOffered).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = rate(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyInvestigationRate 7 + childSupportRate 5 + categoryDiversityRatio 5 = 25
  const raw = ((documentationRate ?? 0) / 100) * 8 + ((timelyInvestigationRate ?? 0) / 100) * 7 + ((childSupportRate ?? 0) / 100) * 5 + ((categoryDiversityRatio ?? 0) / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyInvestigationRate, childSupportRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateAllegationPolicy(policy: AllegationPolicy | null): AllegationPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", allegationsPolicy: false, ladoReferralProtocol: false, ofstedNotificationProcedure: false, dbsReferralGuidance: false, childProtectionFramework: false, whistleblowingPolicy: false, reviewSchedule: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.allegationsPolicy) score += 4;
  if (policy.ladoReferralProtocol) score += 4;
  if (policy.ofstedNotificationProcedure) score += 4;
  if (policy.dbsReferralGuidance) score += 4;
  if (policy.childProtectionFramework) score += 3;
  if (policy.whistleblowingPolicy) score += 3;
  if (policy.reviewSchedule) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    allegationsPolicy: policy.allegationsPolicy,
    ladoReferralProtocol: policy.ladoReferralProtocol,
    ofstedNotificationProcedure: policy.ofstedNotificationProcedure,
    dbsReferralGuidance: policy.dbsReferralGuidance,
    childProtectionFramework: policy.childProtectionFramework,
    whistleblowingPolicy: policy.whistleblowingPolicy,
    reviewSchedule: policy.reviewSchedule,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffAllegationReadiness(staff: StaffAllegationTraining[]): StaffAllegationReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, safeguardingKnowledgeRate: null, allegationProceduresRate: null, ladoProcessRate: null, investigationSkillsRate: null, childProtectionRate: null, recordKeepingRate: null };
  }

  const safeguardingKnowledgeRate = rate(staff.filter((s) => s.safeguardingKnowledge).length, count);
  const allegationProceduresRate = rate(staff.filter((s) => s.allegationProcedures).length, count);
  const ladoProcessRate = rate(staff.filter((s) => s.ladoProcess).length, count);
  const investigationSkillsRate = rate(staff.filter((s) => s.investigationSkills).length, count);
  const childProtectionRate = rate(staff.filter((s) => s.childProtection).length, count);
  const recordKeepingRate = rate(staff.filter((s) => s.recordKeeping).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    ((safeguardingKnowledgeRate ?? 0) / 100) * 6 +
    ((allegationProceduresRate ?? 0) / 100) * 5 +
    ((ladoProcessRate ?? 0) / 100) * 5 +
    ((investigationSkillsRate ?? 0) / 100) * 4 +
    ((childProtectionRate ?? 0) / 100) * 3 +
    ((recordKeepingRate ?? 0) / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, safeguardingKnowledgeRate, allegationProceduresRate, ladoProcessRate, investigationSkillsRate, childProtectionRate, recordKeepingRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildAllegationProfiles(records: AllegationRecord[]): ChildAllegationProfile[] {
  const grouped = new Map<string, AllegationRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildAllegationProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const ladoReferralRate = rate(recs.filter((r) => r.ladoReferralMade).length, totalRecords);
    const childSupportRate = rate(recs.filter((r) => r.childSupportOffered).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10→2, >=5→1] + rate1 ladoReferralRate [>=80→3, >=60→2, >=40→1] + rate2 childSupportRate [same] + diversity [>=4→2, >=2→1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (meets(ladoReferralRate, 80)) score += 3;
    else if (meets(ladoReferralRate, 60)) score += 2;
    else if (meets(ladoReferralRate, 40)) score += 1;

    if (meets(childSupportRate, 80)) score += 3;
    else if (meets(childSupportRate, 60)) score += 2;
    else if (meets(childSupportRate, 40)) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      ladoReferralRate,
      childSupportRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateAllegationsIntelligence(
  records: AllegationRecord[],
  policy: AllegationPolicy | null,
  staff: StaffAllegationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AllegationsIntelligence {
  const allegationQuality = evaluateAllegationQuality(records);
  const allegationCompliance = evaluateAllegationCompliance(records);
  const allegationPolicy = evaluateAllegationPolicy(policy);
  const staffReadiness = evaluateStaffAllegationReadiness(staff);
  const childProfiles = buildChildAllegationProfiles(records);

  const overallScore = Math.min(
    100,
    allegationQuality.overallScore + allegationCompliance.overallScore + allegationPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (meets(allegationQuality.ladoReferralRate, 80)) strengths.push("LADO referrals are consistently made where required");
  if (meets(allegationQuality.ofstedNotifiedRate, 80)) strengths.push("Ofsted notifications are routinely completed");
  if (meets(allegationQuality.childSupportRate, 80)) strengths.push("Children involved in allegations are consistently offered support");
  if (meets(allegationQuality.staffSupportRate, 80)) strengths.push("Staff subject to allegations receive appropriate support");
  if (meets(allegationCompliance.documentationRate, 80)) strengths.push("Allegations documentation is thorough and complete");
  if (meets(allegationCompliance.timelyInvestigationRate, 80)) strengths.push("Investigations are completed within required timescales");
  if (meets(staffReadiness.safeguardingKnowledgeRate, 80)) strengths.push("Staff have strong safeguarding knowledge");
  if (meets(staffReadiness.allegationProceduresRate, 80)) strengths.push("Staff are well trained in allegation procedures");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (below(allegationQuality.ladoReferralRate, 60)) areasForImprovement.push("LADO referrals are not consistently made where required");
  if (below(allegationQuality.ofstedNotifiedRate, 60)) areasForImprovement.push("Ofsted notifications are not being made consistently");
  if (below(allegationQuality.childSupportRate, 60)) areasForImprovement.push("Children involved in allegations are not receiving adequate support");
  if (below(allegationQuality.staffSupportRate, 60)) areasForImprovement.push("Staff support during allegations needs improvement");
  if (below(allegationCompliance.documentationRate, 60)) areasForImprovement.push("Allegations documentation is incomplete or inconsistent");
  if (below(allegationCompliance.timelyInvestigationRate, 60)) areasForImprovement.push("Investigations are not being completed promptly");
  if (below(staffReadiness.safeguardingKnowledgeRate, 60)) areasForImprovement.push("Staff safeguarding knowledge needs development");
  if (below(staffReadiness.allegationProceduresRate, 60)) areasForImprovement.push("Staff need more training in allegation procedures");

  // Actions
  const actions: string[] = [];
  if (allegationPolicy.overallScore === 0) actions.push("URGENT: Establish an allegations policy — CHR 2015 Reg 37/38 require documented procedures for handling allegations");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide safeguarding and allegation management training to all staff — proper investigation depends on skilled practitioners");
  if (below(allegationQuality.ladoReferralRate, 50)) actions.push("Ensure all allegations in relevant categories are referred to LADO — Working Together 2023 requires referral within 1 working day");
  if (below(allegationQuality.ofstedNotifiedRate, 50)) actions.push("Implement systematic Ofsted notification for all notifiable events — CHR 2015 Reg 40");
  if (below(allegationCompliance.documentationRate, 50)) actions.push("Improve allegations documentation — all investigations must be fully recorded");
  if (below(allegationCompliance.timelyInvestigationRate, 50)) actions.push("Review investigation timescales — allegations should be investigated promptly");
  if (below(allegationQuality.childSupportRate, 50)) actions.push("Ensure children involved in allegations are offered therapeutic and advocacy support");
  if (below(staffReadiness.ladoProcessRate, 50)) actions.push("Train staff in LADO referral process — timely referrals are essential for safeguarding");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 37 — Complaints and representations",
    "CHR 2015 Reg 38 — Allegation procedures",
    "CHR 2015 Reg 40 — Notification of serious events",
    "Working Together 2023 Ch 2 — Managing allegations",
    "Keeping Children Safe in Education 2024 Part 4",
    "SCCIF — Leadership and management (responding to allegations)",
    "Safeguarding Vulnerable Groups Act 2006 — DBS referral duty",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    allegationQuality,
    allegationCompliance,
    allegationPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
