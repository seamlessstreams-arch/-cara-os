// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Key-Working Intelligence Engine
//
// Deterministic engine for evaluating key-working quality in children's homes
// — session quality, compliance, policy governance, and staff training in
// therapeutic key-working relationships.
//
// Aligned to:
//   - CHR 2015 Reg 10 — Duty of the registered person
//   - CHR 2015 Reg 14 — Care planning standard
//   - SCCIF — Quality of care judgement
//   - Quality Standards 2015 — Standard 3 (aspirations, views, wishes)
//   - DfE Guide to CRH — Keywork as therapeutic relationship
//   - UNCRC Article 12 — Right to be heard
//   - Children Act 1989 — Welfare of the child
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type KeyWorkingCategory =
  | "formal_keywork"
  | "informal_check_in"
  | "direct_work"
  | "life_story_work"
  | "goal_review"
  | "crisis_support"
  | "preparation_session"
  | "celebration_session";

export type KeyWorkingOutcome =
  | "completed"
  | "partially_completed"
  | "child_declined"
  | "postponed"
  | "cancelled";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface KeyWorkingRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: KeyWorkingCategory;
  outcome: KeyWorkingOutcome;
  // Quality flags (4)
  childEngaged: boolean;              // quality rate 1, weight 7
  childViewRecorded: boolean;         // quality rate 2, weight 6
  goalsAddressed: boolean;            // quality rate 3, weight 6
  moodImproved: boolean;              // quality rate 4, weight 6
  // Compliance flags (2 — other 2 are computed)
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface KeyWorkingPolicy {
  keyWorkingPolicy: boolean;              // 4
  sessionFrequencyGuidance: boolean;      // 4
  childParticipationFramework: boolean;   // 4
  carePlanLinkagePolicy: boolean;         // 4
  supervisionOfKeywork: boolean;          // 3
  keyworkerAllocationPolicy: boolean;     // 3
  recordKeepingStandard: boolean;         // 3
}

export interface StaffKeyWorkingTraining {
  staffId: string;
  relationshipBuilding: boolean;    // 6
  therapeuticApproaches: boolean;   // 5
  childVoiceCapture: boolean;       // 5
  carePlanKnowledge: boolean;       // 4
  recordKeeping: boolean;           // 3
  crisisSupport: boolean;           // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface KeyWorkingQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  childEngagedRate: number;
  childViewRecordedRate: number;
  goalsAddressedRate: number;
  moodImprovedRate: number;
}

export interface KeyWorkingComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRecordingRate: number;
  childViewRecordedRate: number;
  categoryDiversityRatio: number;
}

export interface KeyWorkingPolicyResult {
  overallScore: number;
  rating: Rating;
  keyWorkingPolicy: boolean;
  sessionFrequencyGuidance: boolean;
  childParticipationFramework: boolean;
  carePlanLinkagePolicy: boolean;
  supervisionOfKeywork: boolean;
  keyworkerAllocationPolicy: boolean;
  recordKeepingStandard: boolean;
}

export interface StaffKeyWorkingReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  relationshipBuildingRate: number;
  therapeuticApproachesRate: number;
  childVoiceCaptureRate: number;
  carePlanKnowledgeRate: number;
  recordKeepingRate: number;
  crisisSupportRate: number;
}

export interface ChildKeyWorkingProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  childEngagedRate: number;
  childViewRecordedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface KeyWorkingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  keyWorkingQuality: KeyWorkingQualityResult;
  keyWorkingCompliance: KeyWorkingComplianceResult;
  keyWorkingPolicy: KeyWorkingPolicyResult;
  staffReadiness: StaffKeyWorkingReadinessResult;
  childProfiles: ChildKeyWorkingProfile[];
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

export function getKeyWorkingCategoryLabel(cat: KeyWorkingCategory): string {
  const labels: Record<KeyWorkingCategory, string> = {
    formal_keywork: "Formal Keywork",
    informal_check_in: "Informal Check-in",
    direct_work: "Direct Work",
    life_story_work: "Life Story Work",
    goal_review: "Goal Review",
    crisis_support: "Crisis Support",
    preparation_session: "Preparation Session",
    celebration_session: "Celebration Session",
  };
  return labels[cat] ?? cat;
}

export function getKeyWorkingOutcomeLabel(o: KeyWorkingOutcome): string {
  const labels: Record<KeyWorkingOutcome, string> = {
    completed: "Completed",
    partially_completed: "Partially Completed",
    child_declined: "Child Declined",
    postponed: "Postponed",
    cancelled: "Cancelled",
  };
  return labels[o] ?? o;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: KeyWorkingCategory[] = [
  "formal_keywork", "informal_check_in", "direct_work", "life_story_work",
  "goal_review", "crisis_support", "preparation_session", "celebration_session",
];

// ── Evaluator 1: Key-Working Quality (0-25) ───────────────────────────────

export function evaluateKeyWorkingQuality(records: KeyWorkingRecord[]): KeyWorkingQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, childEngagedRate: 0, childViewRecordedRate: 0, goalsAddressedRate: 0, moodImprovedRate: 0 };
  }

  const childEngagedRate = pct(records.filter((r) => r.childEngaged).length, total);
  const childViewRecordedRate = pct(records.filter((r) => r.childViewRecorded).length, total);
  const goalsAddressedRate = pct(records.filter((r) => r.goalsAddressed).length, total);
  const moodImprovedRate = pct(records.filter((r) => r.moodImproved).length, total);

  // Weighted: childEngagedRate 7 + childViewRecordedRate 6 + goalsAddressedRate 6 + moodImprovedRate 6 = 25
  const raw = (childEngagedRate / 100) * 7 + (childViewRecordedRate / 100) * 6 + (goalsAddressedRate / 100) * 6 + (moodImprovedRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, childEngagedRate, childViewRecordedRate, goalsAddressedRate, moodImprovedRate };
}

// ── Evaluator 2: Key-Working Compliance (0-25) ────────────────────────────

export function evaluateKeyWorkingCompliance(records: KeyWorkingRecord[]): KeyWorkingComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: 0, timelyRecordingRate: 0, childViewRecordedRate: 0, categoryDiversityRatio: 0 };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const childViewRecordedRate = pct(records.filter((r) => r.childViewRecorded).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + childViewRecordedRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate / 100) * 8 + (timelyRecordingRate / 100) * 7 + (childViewRecordedRate / 100) * 5 + (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, childViewRecordedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ───────────────────────────────

export function evaluateKeyWorkingPolicy(policy: KeyWorkingPolicy | null): KeyWorkingPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", keyWorkingPolicy: false, sessionFrequencyGuidance: false, childParticipationFramework: false, carePlanLinkagePolicy: false, supervisionOfKeywork: false, keyworkerAllocationPolicy: false, recordKeepingStandard: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.keyWorkingPolicy) score += 4;
  if (policy.sessionFrequencyGuidance) score += 4;
  if (policy.childParticipationFramework) score += 4;
  if (policy.carePlanLinkagePolicy) score += 4;
  if (policy.supervisionOfKeywork) score += 3;
  if (policy.keyworkerAllocationPolicy) score += 3;
  if (policy.recordKeepingStandard) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    keyWorkingPolicy: policy.keyWorkingPolicy,
    sessionFrequencyGuidance: policy.sessionFrequencyGuidance,
    childParticipationFramework: policy.childParticipationFramework,
    carePlanLinkagePolicy: policy.carePlanLinkagePolicy,
    supervisionOfKeywork: policy.supervisionOfKeywork,
    keyworkerAllocationPolicy: policy.keyworkerAllocationPolicy,
    recordKeepingStandard: policy.recordKeepingStandard,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ───────────────────────────────────

export function evaluateStaffKeyWorkingReadiness(staff: StaffKeyWorkingTraining[]): StaffKeyWorkingReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, relationshipBuildingRate: 0, therapeuticApproachesRate: 0, childVoiceCaptureRate: 0, carePlanKnowledgeRate: 0, recordKeepingRate: 0, crisisSupportRate: 0 };
  }

  const relationshipBuildingRate = pct(staff.filter((s) => s.relationshipBuilding).length, count);
  const therapeuticApproachesRate = pct(staff.filter((s) => s.therapeuticApproaches).length, count);
  const childVoiceCaptureRate = pct(staff.filter((s) => s.childVoiceCapture).length, count);
  const carePlanKnowledgeRate = pct(staff.filter((s) => s.carePlanKnowledge).length, count);
  const recordKeepingRate = pct(staff.filter((s) => s.recordKeeping).length, count);
  const crisisSupportRate = pct(staff.filter((s) => s.crisisSupport).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (relationshipBuildingRate / 100) * 6 +
    (therapeuticApproachesRate / 100) * 5 +
    (childVoiceCaptureRate / 100) * 5 +
    (carePlanKnowledgeRate / 100) * 4 +
    (recordKeepingRate / 100) * 3 +
    (crisisSupportRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, relationshipBuildingRate, therapeuticApproachesRate, childVoiceCaptureRate, carePlanKnowledgeRate, recordKeepingRate, crisisSupportRate };
}

// ── Child Profiles (0-10) ─────────────────────────────────────────────────

export function buildChildKeyWorkingProfiles(records: KeyWorkingRecord[]): ChildKeyWorkingProfile[] {
  const grouped = new Map<string, KeyWorkingRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildKeyWorkingProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const childEngagedRate = pct(recs.filter((r) => r.childEngaged).length, totalRecords);
    const childViewRecordedRate = pct(recs.filter((r) => r.childViewRecorded).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 childEngagedRate [>=80->3, >=60->2, >=40->1] + rate2 childViewRecordedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (childEngagedRate >= 80) score += 3;
    else if (childEngagedRate >= 60) score += 2;
    else if (childEngagedRate >= 40) score += 1;

    if (childViewRecordedRate >= 80) score += 3;
    else if (childViewRecordedRate >= 60) score += 2;
    else if (childViewRecordedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      childEngagedRate,
      childViewRecordedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ─────────────────────────────────────────

export function generateKeyWorkingIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: KeyWorkingRecord[];
  policy: KeyWorkingPolicy | null;
  staff: StaffKeyWorkingTraining[];
}): KeyWorkingIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const keyWorkingQuality = evaluateKeyWorkingQuality(records);
  const keyWorkingCompliance = evaluateKeyWorkingCompliance(records);
  const keyWorkingPolicy = evaluateKeyWorkingPolicy(policy);
  const staffReadiness = evaluateStaffKeyWorkingReadiness(staff);
  const childProfiles = buildChildKeyWorkingProfiles(records);

  const overallScore = Math.min(
    100,
    keyWorkingQuality.overallScore + keyWorkingCompliance.overallScore + keyWorkingPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (keyWorkingQuality.childEngagedRate >= 80) strengths.push("Children are consistently engaged during key-working sessions");
  if (keyWorkingQuality.childViewRecordedRate >= 80) strengths.push("The child's voice is routinely captured and recorded");
  if (keyWorkingQuality.goalsAddressedRate >= 80) strengths.push("Care plan goals are systematically addressed in sessions");
  if (keyWorkingQuality.moodImprovedRate >= 80) strengths.push("Key-working sessions consistently improve children's mood and wellbeing");
  if (keyWorkingCompliance.documentationRate >= 80) strengths.push("Key-working documentation is thorough and complete");
  if (keyWorkingCompliance.timelyRecordingRate >= 80) strengths.push("Session records are completed within required timescales");
  if (staffReadiness.relationshipBuildingRate >= 80) strengths.push("Staff demonstrate strong relationship-building skills");
  if (staffReadiness.therapeuticApproachesRate >= 80) strengths.push("Staff are well trained in therapeutic approaches");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (keyWorkingQuality.childEngagedRate < 60) areasForImprovement.push("Child engagement during key-working sessions needs improvement");
  if (keyWorkingQuality.childViewRecordedRate < 60) areasForImprovement.push("The child's voice is not being consistently captured");
  if (keyWorkingQuality.goalsAddressedRate < 60) areasForImprovement.push("Care plan goals are not systematically addressed in sessions");
  if (keyWorkingQuality.moodImprovedRate < 60) areasForImprovement.push("Key-working sessions are not consistently improving children's mood");
  if (keyWorkingCompliance.documentationRate < 60) areasForImprovement.push("Key-working documentation is incomplete or inconsistent");
  if (keyWorkingCompliance.timelyRecordingRate < 60) areasForImprovement.push("Session records are not being completed promptly");
  if (staffReadiness.relationshipBuildingRate < 60) areasForImprovement.push("Staff relationship-building skills need development");
  if (staffReadiness.therapeuticApproachesRate < 60) areasForImprovement.push("Staff need more training in therapeutic approaches");

  // Actions
  const actions: string[] = [];
  if (keyWorkingPolicy.overallScore === 0) actions.push("URGENT: Establish a key-working policy — CHR 2015 Reg 14 requires documented care planning standards including key-working arrangements");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide key-working and therapeutic relationship training to all staff — effective key-working depends on skilled practitioners");
  if (keyWorkingQuality.childEngagedRate < 50) actions.push("Review session approaches to improve child engagement — UNCRC Article 12 requires meaningful participation");
  if (keyWorkingQuality.childViewRecordedRate < 50) actions.push("Ensure the child's voice is recorded in every session — Quality Standards 2015 Standard 3");
  if (keyWorkingCompliance.documentationRate < 50) actions.push("Improve key-working documentation — all sessions must be fully recorded");
  if (keyWorkingCompliance.timelyRecordingRate < 50) actions.push("Review recording timescales — session records should be completed within 24 hours");
  if (keyWorkingQuality.goalsAddressedRate < 50) actions.push("Ensure care plan goals are addressed in key-working sessions — CHR 2015 Reg 14");
  if (staffReadiness.childVoiceCaptureRate < 50) actions.push("Train staff in capturing the child's voice — children must feel heard in their key-working relationship");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — Duty of the registered person",
    "CHR 2015 Reg 14 — Care planning standard",
    "SCCIF — Quality of care judgement",
    "Quality Standards 2015 — Standard 3 (aspirations, views, wishes)",
    "DfE Guide to CRH — Keywork as therapeutic relationship",
    "UNCRC Article 12 — Right to be heard",
    "Children Act 1989 — Welfare of the child",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    keyWorkingQuality,
    keyWorkingCompliance,
    keyWorkingPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
