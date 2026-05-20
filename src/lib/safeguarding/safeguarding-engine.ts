// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Safeguarding Intelligence Engine  (v2 — standardised)
//
// Deterministic engine for evaluating safeguarding quality, compliance,
// policy frameworks, staff readiness, and per-child safeguarding profiles.
//
// Aligned to:
//   - Children Act 1989 / 2004
//   - Working Together to Safeguard Children 2023
//   - CHR 2015 Reg 34 — Safeguarding of children
//   - CHR 2015 Reg 40 — Notifiable events
//   - SCCIF — Safety: safeguarding children
//   - KCSIE 2024 — Keeping Children Safe in Education
//   - Quality Standards 2015 — Standard 5 (keeping safe)
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums / Literal Unions ────────────────────────────────────────────────

export type SafeguardingCategory =
  | "concern_raised"
  | "referral_made"
  | "strategy_meeting"
  | "risk_assessment"
  | "chronology_update"
  | "multi_agency_contact"
  | "child_protection_review"
  | "preventive_action";

export type SafeguardingOutcome =
  | "action_taken"
  | "referral_accepted"
  | "no_further_action"
  | "ongoing_monitoring"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record ────────────────────────────────────────────────────────────────

export interface SafeguardingRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: SafeguardingCategory;
  outcome: SafeguardingOutcome;
  // Quality flags
  timelyResponse: boolean;
  childViewCaptured: boolean;
  multiAgencyEngaged: boolean;
  riskAssessmentUpdated: boolean;
  // Compliance flags
  documentationComplete: boolean;
  timelyRecording: boolean;
}

// ── Policy (7 booleans) ───────────────────────────────────────────────────

export interface SafeguardingPolicy {
  safeguardingPolicy: boolean;
  whistleblowingPolicy: boolean;
  childProtectionProcedure: boolean;
  escortionPolicy: boolean;
  onlineSafetyPolicy: boolean;
  allegationsAgainstStaffPolicy: boolean;
  preventDutyPolicy: boolean;
}

// ── Staff Training (6 skills) ─────────────────────────────────────────────

export interface StaffSafeguardingTraining {
  staffId: string;
  safeguardingLevel3: boolean;
  childProtectionAwareness: boolean;
  preventDutyTraining: boolean;
  onlineSafetyTraining: boolean;
  concernRecordingSkills: boolean;
  multiAgencyWorkingKnowledge: boolean;
}

// ── Result interfaces ─────────────────────────────────────────────────────

export interface SafeguardingQualityResult {
  overallScore: number;
  totalRecords: number;
  timelyResponseRate: number;
  childViewCapturedRate: number;
  multiAgencyEngagedRate: number;
  riskAssessmentUpdatedRate: number;
}

export interface SafeguardingComplianceResult {
  overallScore: number;
  documentationRate: number;
  timelyRecordingRate: number;
  childViewCapturedRate: number;
  categoryDiversityRatio: number;
}

export interface SafeguardingPolicyResult {
  overallScore: number;
  safeguardingPolicy: boolean;
  whistleblowingPolicy: boolean;
  childProtectionProcedure: boolean;
  escortionPolicy: boolean;
  onlineSafetyPolicy: boolean;
  allegationsAgainstStaffPolicy: boolean;
  preventDutyPolicy: boolean;
}

export interface StaffSafeguardingReadinessResult {
  overallScore: number;
  totalStaff: number;
  safeguardingLevel3Rate: number;
  childProtectionAwarenessRate: number;
  preventDutyTrainingRate: number;
  onlineSafetyTrainingRate: number;
  concernRecordingSkillsRate: number;
  multiAgencyWorkingKnowledgeRate: number;
}

export interface ChildSafeguardingProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  timelyResponseRate: number;
  childViewCapturedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface SafeguardingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  safeguardingQuality: SafeguardingQualityResult;
  safeguardingCompliance: SafeguardingComplianceResult;
  safeguardingPolicy: SafeguardingPolicyResult;
  staffReadiness: StaffSafeguardingReadinessResult;
  childProfiles: ChildSafeguardingProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

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

export function getSafeguardingCategoryLabel(cat: SafeguardingCategory): string {
  const map: Record<SafeguardingCategory, string> = {
    concern_raised: "Concern Raised",
    referral_made: "Referral Made",
    strategy_meeting: "Strategy Meeting",
    risk_assessment: "Risk Assessment",
    chronology_update: "Chronology Update",
    multi_agency_contact: "Multi-Agency Contact",
    child_protection_review: "Child Protection Review",
    preventive_action: "Preventive Action",
  };
  return map[cat] ?? cat;
}

export function getSafeguardingOutcomeLabel(o: SafeguardingOutcome): string {
  const map: Record<SafeguardingOutcome, string> = {
    action_taken: "Action Taken",
    referral_accepted: "Referral Accepted",
    no_further_action: "No Further Action",
    ongoing_monitoring: "Ongoing Monitoring",
    not_applicable: "Not Applicable",
  };
  return map[o] ?? o;
}

export function getRatingLabel(r: Rating): string {
  const map: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return map[r] ?? r;
}

// ── Evaluator 1: Quality (0-25) ───────────────────────────────────────────
// timelyResponseRate(7) + childViewCapturedRate(6) + multiAgencyEngagedRate(6) + riskAssessmentUpdatedRate(6) = 25

export function evaluateSafeguardingQuality(records: SafeguardingRecord[]): SafeguardingQualityResult {
  const total = records.length;
  const timelyResponseRate = pct(records.filter(r => r.timelyResponse).length, total);
  const childViewCapturedRate = pct(records.filter(r => r.childViewCaptured).length, total);
  const multiAgencyEngagedRate = pct(records.filter(r => r.multiAgencyEngaged).length, total);
  const riskAssessmentUpdatedRate = pct(records.filter(r => r.riskAssessmentUpdated).length, total);

  const raw =
    (timelyResponseRate / 100) * 7 +
    (childViewCapturedRate / 100) * 6 +
    (multiAgencyEngagedRate / 100) * 6 +
    (riskAssessmentUpdatedRate / 100) * 6;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalRecords: total, timelyResponseRate, childViewCapturedRate, multiAgencyEngagedRate, riskAssessmentUpdatedRate };
}

// ── Evaluator 2: Compliance (0-25) ────────────────────────────────────────
// documentationRate(8) + timelyRecordingRate(7) + childViewCapturedRate(5) + categoryDiversityRatio(5) = 25

export function evaluateSafeguardingCompliance(records: SafeguardingRecord[]): SafeguardingComplianceResult {
  const total = records.length;
  const documentationRate = pct(records.filter(r => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter(r => r.timelyRecording).length, total);
  const childViewCapturedRate = pct(records.filter(r => r.childViewCaptured).length, total);

  const ALL_CATEGORIES: SafeguardingCategory[] = [
    "concern_raised", "referral_made", "strategy_meeting", "risk_assessment",
    "chronology_update", "multi_agency_contact", "child_protection_review", "preventive_action",
  ];
  const usedCategories = new Set(records.map(r => r.category));
  const categoryDiversityRatio = pct(usedCategories.size, ALL_CATEGORIES.length);

  const raw =
    (documentationRate / 100) * 8 +
    (timelyRecordingRate / 100) * 7 +
    (childViewCapturedRate / 100) * 5 +
    (categoryDiversityRatio / 100) * 5;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, documentationRate, timelyRecordingRate, childViewCapturedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy (0-25) ────────────────────────────────────────────
// 7 booleans weighted 4+4+4+4+3+3+3 = 25

export function evaluateSafeguardingPolicy(policy: SafeguardingPolicy | null): SafeguardingPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      safeguardingPolicy: false,
      whistleblowingPolicy: false,
      childProtectionProcedure: false,
      escortionPolicy: false,
      onlineSafetyPolicy: false,
      allegationsAgainstStaffPolicy: false,
      preventDutyPolicy: false,
    };
  }

  const score =
    (policy.safeguardingPolicy ? 4 : 0) +
    (policy.whistleblowingPolicy ? 4 : 0) +
    (policy.childProtectionProcedure ? 4 : 0) +
    (policy.escortionPolicy ? 4 : 0) +
    (policy.onlineSafetyPolicy ? 3 : 0) +
    (policy.allegationsAgainstStaffPolicy ? 3 : 0) +
    (policy.preventDutyPolicy ? 3 : 0);

  return {
    overallScore: Math.min(25, score),
    safeguardingPolicy: policy.safeguardingPolicy,
    whistleblowingPolicy: policy.whistleblowingPolicy,
    childProtectionProcedure: policy.childProtectionProcedure,
    escortionPolicy: policy.escortionPolicy,
    onlineSafetyPolicy: policy.onlineSafetyPolicy,
    allegationsAgainstStaffPolicy: policy.allegationsAgainstStaffPolicy,
    preventDutyPolicy: policy.preventDutyPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ───────────────────────────────────
// 6 skills weighted 6+5+5+4+3+2 = 25

export function evaluateStaffSafeguardingReadiness(staff: StaffSafeguardingTraining[]): StaffSafeguardingReadinessResult {
  const total = staff.length;
  const safeguardingLevel3Rate = pct(staff.filter(s => s.safeguardingLevel3).length, total);
  const childProtectionAwarenessRate = pct(staff.filter(s => s.childProtectionAwareness).length, total);
  const preventDutyTrainingRate = pct(staff.filter(s => s.preventDutyTraining).length, total);
  const onlineSafetyTrainingRate = pct(staff.filter(s => s.onlineSafetyTraining).length, total);
  const concernRecordingSkillsRate = pct(staff.filter(s => s.concernRecordingSkills).length, total);
  const multiAgencyWorkingKnowledgeRate = pct(staff.filter(s => s.multiAgencyWorkingKnowledge).length, total);

  const raw =
    (safeguardingLevel3Rate / 100) * 6 +
    (childProtectionAwarenessRate / 100) * 5 +
    (preventDutyTrainingRate / 100) * 5 +
    (onlineSafetyTrainingRate / 100) * 4 +
    (concernRecordingSkillsRate / 100) * 3 +
    (multiAgencyWorkingKnowledgeRate / 100) * 2;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalStaff: total, safeguardingLevel3Rate, childProtectionAwarenessRate, preventDutyTrainingRate, onlineSafetyTrainingRate, concernRecordingSkillsRate, multiAgencyWorkingKnowledgeRate };
}

// ── Child Safeguarding Profiles (0-10) ───────────────────────────────────

export function buildChildSafeguardingProfiles(records: SafeguardingRecord[]): ChildSafeguardingProfile[] {
  const byChild = new Map<string, SafeguardingRecord[]>();
  for (const r of records) {
    const arr = byChild.get(r.childId) ?? [];
    arr.push(r);
    byChild.set(r.childId, arr);
  }

  const profiles: ChildSafeguardingProfile[] = [];

  for (const [childId, recs] of byChild) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;
    const timelyResponseRate = pct(recs.filter(r => r.timelyResponse).length, totalRecords);
    const childViewCapturedRate = pct(recs.filter(r => r.childViewCaptured).length, totalRecords);
    const categoriesCovered = [...new Set(recs.map(r => r.category))];

    let score = 0;
    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;
    if (timelyResponseRate >= 80) score += 3;
    else if (timelyResponseRate >= 60) score += 2;
    else if (timelyResponseRate >= 40) score += 1;
    if (childViewCapturedRate >= 80) score += 3;
    else if (childViewCapturedRate >= 60) score += 2;
    else if (childViewCapturedRate >= 40) score += 1;
    if (categoriesCovered.length >= 4) score += 2;
    else if (categoriesCovered.length >= 2) score += 1;

    profiles.push({ childId, childName, totalRecords, timelyResponseRate, childViewCapturedRate, categoriesCovered, overallScore: Math.min(10, score) });
  }

  return profiles.sort((a, b) => b.overallScore - a.overallScore);
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateSafeguardingIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: SafeguardingRecord[];
  policy: SafeguardingPolicy | null;
  staff: StaffSafeguardingTraining[];
}): SafeguardingIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const safeguardingQuality = evaluateSafeguardingQuality(records);
  const safeguardingCompliance = evaluateSafeguardingCompliance(records);
  const safeguardingPolicy = evaluateSafeguardingPolicy(policy);
  const staffReadiness = evaluateStaffSafeguardingReadiness(staff);
  const childProfiles = buildChildSafeguardingProfiles(records);

  const overallScore = Math.min(100,
    safeguardingQuality.overallScore +
    safeguardingCompliance.overallScore +
    safeguardingPolicy.overallScore +
    staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (safeguardingQuality.timelyResponseRate >= 80) strengths.push("Excellent timely response to safeguarding concerns");
  if (safeguardingQuality.childViewCapturedRate >= 80) strengths.push("Children's views consistently captured in safeguarding processes");
  if (safeguardingQuality.multiAgencyEngagedRate >= 90) strengths.push("Strong multi-agency engagement in safeguarding matters");
  if (safeguardingQuality.riskAssessmentUpdatedRate >= 80) strengths.push("Risk assessments consistently updated following concerns");
  if (safeguardingCompliance.documentationRate >= 90) strengths.push("Excellent safeguarding documentation practices");
  if (safeguardingCompliance.categoryDiversityRatio >= 75) strengths.push("Good breadth of safeguarding activity categories recorded");
  if (safeguardingPolicy.overallScore >= 22) strengths.push("Comprehensive safeguarding policies and procedures in place");
  if (staffReadiness.safeguardingLevel3Rate >= 80) strengths.push("Staff well-trained to safeguarding Level 3");
  if (staffReadiness.childProtectionAwarenessRate >= 80) strengths.push("Staff demonstrate strong child protection awareness");

  const areasForImprovement: string[] = [];
  if (safeguardingQuality.timelyResponseRate < 60) areasForImprovement.push("Safeguarding responses not consistently timely");
  if (safeguardingQuality.childViewCapturedRate < 60) areasForImprovement.push("Children's views not consistently captured in safeguarding");
  if (safeguardingQuality.multiAgencyEngagedRate < 60) areasForImprovement.push("Multi-agency engagement needs strengthening");
  if (safeguardingCompliance.timelyRecordingRate < 70) areasForImprovement.push("Safeguarding records not completed in a timely manner");
  if (safeguardingCompliance.categoryDiversityRatio < 50) areasForImprovement.push("Limited range of safeguarding activities recorded");
  if (staffReadiness.preventDutyTrainingRate < 60) areasForImprovement.push("Prevent duty training needs attention");
  if (staffReadiness.onlineSafetyTrainingRate < 60) areasForImprovement.push("Online safety training coverage needs improvement");

  const actions: string[] = [];
  if (safeguardingQuality.timelyResponseRate < 40) actions.push("URGENT: Implement systematic timely response protocol for all safeguarding concerns");
  if (safeguardingQuality.childViewCapturedRate < 40) actions.push("URGENT: Ensure children's views are captured in every safeguarding process");
  if (safeguardingCompliance.documentationRate < 60) actions.push("URGENT: Ensure all safeguarding activities are properly documented");
  if (!policy || safeguardingPolicy.overallScore < 16) actions.push("Review and update safeguarding policies and procedures");
  if (staffReadiness.overallScore < 15) actions.push("Prioritise staff safeguarding training programme");
  if (safeguardingQuality.riskAssessmentUpdatedRate < 50) actions.push("Review risk assessment update process following concerns");
  if (records.length === 0) actions.push("URGENT: No safeguarding records found — ensure robust concern recording mechanisms are in place");

  const regulatoryLinks = [
    "Children Act 1989 / 2004 — Safeguarding duties",
    "Working Together to Safeguard Children 2023",
    "CHR 2015 Reg 34 — Safeguarding of children",
    "CHR 2015 Reg 40 — Notifiable events",
    "SCCIF — Safety: safeguarding children",
    "KCSIE 2024 — Keeping Children Safe in Education",
    "Quality Standards 2015 — Standard 5 (keeping safe)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    safeguardingQuality, safeguardingCompliance, safeguardingPolicy, staffReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
