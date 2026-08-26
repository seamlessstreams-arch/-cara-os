import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara House Meetings Intelligence Engine  (v2 — standardised)
//
// Deterministic engine for evaluating house meeting quality, compliance,
// governance policies, staff facilitation readiness, and per-child meeting
// participation profiles.
//
// Aligned to:
//   - CHR 2015 Reg 7  — Children's wishes and feelings (collective voice)
//   - CHR 2015 Reg 5  — Quality and purpose of care
//   - SCCIF            — Children's voice in day-to-day running of home
//   - UNCRC Article 12 — Right to be heard
//   - UNCRC Article 15 — Freedom of association / assembly
//   - Children Act 1989 s.22 — Duty to consult child
//   - Quality Standards 2015 — Enjoyment and achievement
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums / Literal Unions ────────────────────────────────────────────────

export type HouseMeetingCategory =
  | "house_meeting"
  | "childrens_council"
  | "menu_planning"
  | "activity_planning"
  | "rules_review"
  | "agenda_setting"
  | "action_review"
  | "special_topic";

export type HouseMeetingOutcome =
  | "fully_completed"
  | "partially_completed"
  | "cancelled"
  | "postponed"
  | "child_led";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record ────────────────────────────────────────────────────────────────

export interface HouseMeetingRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: HouseMeetingCategory;
  outcome: HouseMeetingOutcome;
  // Quality flags
  childContributedToAgenda: boolean;
  minutesRecorded: boolean;
  childAttended: boolean;
  actionsReviewed: boolean;
  // Compliance flags
  documentationComplete: boolean;
  timelyRecording: boolean;
}

// ── Policy (7 booleans) ───────────────────────────────────────────────────

export interface HouseMeetingPolicy {
  houseMeetingPolicy: boolean;
  meetingFrequencyGuidance: boolean;
  childParticipationFramework: boolean;
  minutesAccessibilityPolicy: boolean;
  actionTrackingProcedure: boolean;
  suggestionBoxPolicy: boolean;
  councilGovernanceFramework: boolean;
}

// ── Staff Training (6 skills) ─────────────────────────────────────────────

export interface StaffHouseMeetingTraining {
  staffId: string;
  meetingFacilitation: boolean;
  childParticipation: boolean;
  minutesTaking: boolean;
  actionTracking: boolean;
  conflictResolution: boolean;
  inclusivePractice: boolean;
}

// ── Result interfaces ─────────────────────────────────────────────────────

export interface HouseMeetingQualityResult {
  overallScore: number;
  totalMeetings: number;
  /** null when the population is empty — nothing measured, not 0%. */
  childAgendaContributionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  minutesRecordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childAttendanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionsReviewedRate: number | null;
}

export interface HouseMeetingComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childAttendanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface HouseMeetingPolicyResult {
  overallScore: number;
  houseMeetingPolicy: boolean;
  meetingFrequencyGuidance: boolean;
  childParticipationFramework: boolean;
  minutesAccessibilityPolicy: boolean;
  actionTrackingProcedure: boolean;
  suggestionBoxPolicy: boolean;
  councilGovernanceFramework: boolean;
}

export interface StaffHouseMeetingReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  meetingFacilitationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childParticipationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  minutesTakingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionTrackingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictResolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  inclusivePracticeRate: number | null;
}

export interface ChildHouseMeetingProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  childAgendaContributionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childAttendanceRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface HouseMeetingsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  houseMeetingQuality: HouseMeetingQualityResult;
  houseMeetingCompliance: HouseMeetingComplianceResult;
  houseMeetingPolicy: HouseMeetingPolicyResult;
  staffReadiness: StaffHouseMeetingReadinessResult;
  childProfiles: ChildHouseMeetingProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

export function getHouseMeetingCategoryLabel(cat: HouseMeetingCategory): string {
  const map: Record<HouseMeetingCategory, string> = {
    house_meeting: "House Meeting",
    childrens_council: "Children's Council",
    menu_planning: "Menu Planning",
    activity_planning: "Activity Planning",
    rules_review: "Rules Review",
    agenda_setting: "Agenda Setting",
    action_review: "Action Review",
    special_topic: "Special Topic",
  };
  return map[cat] ?? cat;
}

export function getHouseMeetingOutcomeLabel(o: HouseMeetingOutcome): string {
  const map: Record<HouseMeetingOutcome, string> = {
    fully_completed: "Fully Completed",
    partially_completed: "Partially Completed",
    cancelled: "Cancelled",
    postponed: "Postponed",
    child_led: "Child Led",
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
// childAgendaContributionRate(7) + minutesRecordedRate(6) + childAttendanceRate(6) + actionsReviewedRate(6) = 25

export function evaluateHouseMeetingQuality(records: HouseMeetingRecord[]): HouseMeetingQualityResult {
  const total = records.length;
  const childAgendaContributionRate = rate(records.filter(r => r.childContributedToAgenda).length, total);
  const minutesRecordedRate = rate(records.filter(r => r.minutesRecorded).length, total);
  const childAttendanceRate = rate(records.filter(r => r.childAttended).length, total);
  const actionsReviewedRate = rate(records.filter(r => r.actionsReviewed).length, total);

  const raw =
    ((childAgendaContributionRate ?? 0) / 100) * 7 +
    ((minutesRecordedRate ?? 0) / 100) * 6 +
    ((childAttendanceRate ?? 0) / 100) * 6 +
    ((actionsReviewedRate ?? 0) / 100) * 6;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalMeetings: total, childAgendaContributionRate, minutesRecordedRate, childAttendanceRate, actionsReviewedRate };
}

// ── Evaluator 2: Compliance (0-25) ────────────────────────────────────────
// documentationRate(8) + timelyRecordingRate(7) + childAttendanceRate(5) + categoryDiversityRatio(5) = 25

export function evaluateHouseMeetingCompliance(records: HouseMeetingRecord[]): HouseMeetingComplianceResult {
  const total = records.length;
  const documentationRate = rate(records.filter(r => r.documentationComplete).length, total);
  const timelyRecordingRate = rate(records.filter(r => r.timelyRecording).length, total);
  const childAttendanceRate = rate(records.filter(r => r.childAttended).length, total);

  const ALL_CATEGORIES: HouseMeetingCategory[] = [
    "house_meeting", "childrens_council", "menu_planning", "activity_planning",
    "rules_review", "agenda_setting", "action_review", "special_topic",
  ];
  const usedCategories = new Set(records.map(r => r.category));
  const categoryDiversityRatio = rate(usedCategories.size, ALL_CATEGORIES.length);

  const raw =
    ((documentationRate ?? 0) / 100) * 8 +
    ((timelyRecordingRate ?? 0) / 100) * 7 +
    ((childAttendanceRate ?? 0) / 100) * 5 +
    ((categoryDiversityRatio ?? 0) / 100) * 5;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, documentationRate, timelyRecordingRate, childAttendanceRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy (0-25) ────────────────────────────────────────────
// 7 booleans weighted 4+4+4+4+3+3+3 = 25

export function evaluateHouseMeetingPolicy(policy: HouseMeetingPolicy | null): HouseMeetingPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      houseMeetingPolicy: false,
      meetingFrequencyGuidance: false,
      childParticipationFramework: false,
      minutesAccessibilityPolicy: false,
      actionTrackingProcedure: false,
      suggestionBoxPolicy: false,
      councilGovernanceFramework: false,
    };
  }

  const score =
    (policy.houseMeetingPolicy ? 4 : 0) +
    (policy.meetingFrequencyGuidance ? 4 : 0) +
    (policy.childParticipationFramework ? 4 : 0) +
    (policy.minutesAccessibilityPolicy ? 4 : 0) +
    (policy.actionTrackingProcedure ? 3 : 0) +
    (policy.suggestionBoxPolicy ? 3 : 0) +
    (policy.councilGovernanceFramework ? 3 : 0);

  return {
    overallScore: Math.min(25, score),
    houseMeetingPolicy: policy.houseMeetingPolicy,
    meetingFrequencyGuidance: policy.meetingFrequencyGuidance,
    childParticipationFramework: policy.childParticipationFramework,
    minutesAccessibilityPolicy: policy.minutesAccessibilityPolicy,
    actionTrackingProcedure: policy.actionTrackingProcedure,
    suggestionBoxPolicy: policy.suggestionBoxPolicy,
    councilGovernanceFramework: policy.councilGovernanceFramework,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ───────────────────────────────────
// 6 skills weighted 6+5+5+4+3+2 = 25

export function evaluateStaffHouseMeetingReadiness(staff: StaffHouseMeetingTraining[]): StaffHouseMeetingReadinessResult {
  const total = staff.length;
  const meetingFacilitationRate = rate(staff.filter(s => s.meetingFacilitation).length, total);
  const childParticipationRate = rate(staff.filter(s => s.childParticipation).length, total);
  const minutesTakingRate = rate(staff.filter(s => s.minutesTaking).length, total);
  const actionTrackingRate = rate(staff.filter(s => s.actionTracking).length, total);
  const conflictResolutionRate = rate(staff.filter(s => s.conflictResolution).length, total);
  const inclusivePracticeRate = rate(staff.filter(s => s.inclusivePractice).length, total);

  const raw =
    ((meetingFacilitationRate ?? 0) / 100) * 6 +
    ((childParticipationRate ?? 0) / 100) * 5 +
    ((minutesTakingRate ?? 0) / 100) * 5 +
    ((actionTrackingRate ?? 0) / 100) * 4 +
    ((conflictResolutionRate ?? 0) / 100) * 3 +
    ((inclusivePracticeRate ?? 0) / 100) * 2;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalStaff: total, meetingFacilitationRate, childParticipationRate, minutesTakingRate, actionTrackingRate, conflictResolutionRate, inclusivePracticeRate };
}

// ── Child Meeting Profiles (0-10) ─────────────────────────────────────────

export function buildChildHouseMeetingProfiles(records: HouseMeetingRecord[]): ChildHouseMeetingProfile[] {
  const byChild = new Map<string, HouseMeetingRecord[]>();
  for (const r of records) {
    const arr = byChild.get(r.childId) ?? [];
    arr.push(r);
    byChild.set(r.childId, arr);
  }

  const profiles: ChildHouseMeetingProfile[] = [];

  for (const [childId, recs] of byChild) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;
    const childAgendaContributionRate = rate(recs.filter(r => r.childContributedToAgenda).length, totalRecords);
    const childAttendanceRate = rate(recs.filter(r => r.childAttended).length, totalRecords);
    const categoriesCovered = [...new Set(recs.map(r => r.category))];

    // Scoring: freq + rate1 + rate2 + diversity = 0-10
    let score = 0;
    // Frequency
    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;
    // Rate 1 — childAgendaContributionRate
    if (meets(childAgendaContributionRate, 80)) score += 3;
    else if (meets(childAgendaContributionRate, 60)) score += 2;
    else if (meets(childAgendaContributionRate, 40)) score += 1;
    // Rate 2 — childAttendanceRate
    if (meets(childAttendanceRate, 80)) score += 3;
    else if (meets(childAttendanceRate, 60)) score += 2;
    else if (meets(childAttendanceRate, 40)) score += 1;
    // Category diversity
    if (categoriesCovered.length >= 4) score += 2;
    else if (categoriesCovered.length >= 2) score += 1;

    profiles.push({ childId, childName, totalRecords, childAgendaContributionRate, childAttendanceRate, categoriesCovered, overallScore: Math.min(10, score) });
  }

  return profiles.sort((a, b) => b.overallScore - a.overallScore);
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateHouseMeetingsIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: HouseMeetingRecord[];
  policy: HouseMeetingPolicy | null;
  staff: StaffHouseMeetingTraining[];
}): HouseMeetingsIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const houseMeetingQuality = evaluateHouseMeetingQuality(records);
  const houseMeetingCompliance = evaluateHouseMeetingCompliance(records);
  const houseMeetingPolicy = evaluateHouseMeetingPolicy(policy);
  const staffReadiness = evaluateStaffHouseMeetingReadiness(staff);
  const childProfiles = buildChildHouseMeetingProfiles(records);

  const overallScore = Math.min(100,
    houseMeetingQuality.overallScore +
    houseMeetingCompliance.overallScore +
    houseMeetingPolicy.overallScore +
    staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(houseMeetingQuality.childAgendaContributionRate, 80)) strengths.push("Excellent child contribution to meeting agendas");
  if (meets(houseMeetingQuality.minutesRecordedRate, 90)) strengths.push("Consistent recording of meeting minutes");
  if (meets(houseMeetingQuality.childAttendanceRate, 80)) strengths.push("High child attendance at house meetings");
  if (meets(houseMeetingQuality.actionsReviewedRate, 80)) strengths.push("Actions from meetings consistently reviewed");
  if (meets(houseMeetingCompliance.documentationRate, 90)) strengths.push("Strong meeting documentation practices");
  if (meets(houseMeetingCompliance.categoryDiversityRatio, 75)) strengths.push("Good variety of meeting types used");
  if (meets(houseMeetingPolicy.overallScore, 22)) strengths.push("Comprehensive meeting governance policies in place");
  if (meets(staffReadiness.meetingFacilitationRate, 80)) strengths.push("Staff well-trained in meeting facilitation");
  if (meets(staffReadiness.childParticipationRate, 80)) strengths.push("Staff skilled in promoting child participation");

  // ── Areas for improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];
  if (below(houseMeetingQuality.childAgendaContributionRate, 60)) areasForImprovement.push("Children not sufficiently contributing to meeting agendas");
  if (below(houseMeetingQuality.minutesRecordedRate, 80)) areasForImprovement.push("Meeting minutes not consistently recorded");
  if (below(houseMeetingQuality.childAttendanceRate, 60)) areasForImprovement.push("Low child attendance at house meetings");
  if (below(houseMeetingQuality.actionsReviewedRate, 60)) areasForImprovement.push("Actions from previous meetings not regularly reviewed");
  if (below(houseMeetingCompliance.timelyRecordingRate, 70)) areasForImprovement.push("Meeting records not completed in a timely manner");
  if (below(houseMeetingCompliance.categoryDiversityRatio, 50)) areasForImprovement.push("Limited variety in meeting types — consider expanding");
  if (below(staffReadiness.conflictResolutionRate, 60)) areasForImprovement.push("Staff conflict resolution skills need development");
  if (below(staffReadiness.inclusivePracticeRate, 60)) areasForImprovement.push("Staff inclusive practice training needs attention");

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];
  if (below(houseMeetingQuality.childAttendanceRate, 40)) actions.push("URGENT: Review barriers to child attendance at house meetings");
  if (below(houseMeetingQuality.childAgendaContributionRate, 40)) actions.push("URGENT: Implement strategies to encourage child agenda contributions");
  if (below(houseMeetingCompliance.documentationRate, 60)) actions.push("URGENT: Ensure all house meetings are properly documented");
  if (!policy || houseMeetingPolicy.overallScore < 16) actions.push("Review and update house meeting governance policies");
  if (below(staffReadiness.overallScore, 15)) actions.push("Prioritise staff training in meeting facilitation and participation skills");
  if (below(houseMeetingQuality.actionsReviewedRate, 50)) actions.push("Implement action review as standing agenda item for all meetings");
  if (records.length === 0) actions.push("URGENT: No house meeting records found — establish regular meeting schedule immediately");

  // ── Regulatory links ──────────────────────────────────────────────────
  const regulatoryLinks = [
    "CHR 2015 Reg 7 — Children's wishes and feelings (collective voice)",
    "CHR 2015 Reg 5 — Quality and purpose of care",
    "SCCIF — Children's voice in day-to-day running of home",
    "UNCRC Article 12 — Right to be heard",
    "UNCRC Article 15 — Freedom of association / assembly",
    "Children Act 1989 s.22 — Duty to consult child",
    "Quality Standards 2015 — Enjoyment and achievement",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    houseMeetingQuality, houseMeetingCompliance, houseMeetingPolicy, staffReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
