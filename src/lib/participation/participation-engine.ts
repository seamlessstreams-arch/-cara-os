// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Participation Intelligence Engine  (v2 — standardised)
//
// Deterministic engine for evaluating children's participation quality,
// compliance, advocacy/voice policies, staff readiness, and per-child
// participation profiles.
//
// Aligned to:
//   - CHR 2015 Reg 7  — Children's wishes and feelings
//   - CHR 2015 Reg 16 — Statement of purpose (child-centred)
//   - UNCRC Article 12 — Right to be heard
//   - SCCIF — Overall experiences: voice of the child
//   - Children Act 1989 s.22 — Ascertain wishes/feelings
//   - Advocacy Services and Representations Procedure Regs 2004
//   - Quality Standards 2015 — Standard 3 (aspirations, views, wishes)
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums / Literal Unions ────────────────────────────────────────────────

export type ParticipationCategory =
  | "care_plan_voice"
  | "advocacy_access"
  | "complaints_awareness"
  | "house_meeting_input"
  | "review_participation"
  | "daily_decisions"
  | "feedback_mechanism"
  | "rights_education";

export type ParticipationOutcome =
  | "views_acted_upon"
  | "views_recorded"
  | "views_partially_acted"
  | "child_declined"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record ────────────────────────────────────────────────────────────────

export interface ParticipationRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: ParticipationCategory;
  outcome: ParticipationOutcome;
  // Quality flags
  childViewRecorded: boolean;
  viewsActedUpon: boolean;
  advocacyOffered: boolean;
  feedbackProvided: boolean;
  // Compliance flags
  documentationComplete: boolean;
  timelyRecording: boolean;
}

// ── Policy (7 booleans) ───────────────────────────────────────────────────

export interface ParticipationPolicy {
  participationPolicy: boolean;
  advocacyAccessPolicy: boolean;
  complaintsAwarenessFramework: boolean;
  childVoiceInCarePlanning: boolean;
  feedbackMechanismPolicy: boolean;
  rightsEducationPolicy: boolean;
  independentVisitorScheme: boolean;
}

// ── Staff Training (6 skills) ─────────────────────────────────────────────

export interface StaffParticipationTraining {
  staffId: string;
  childVoiceCapture: boolean;
  advocacyKnowledge: boolean;
  participationFacilitation: boolean;
  complaintsAwareness: boolean;
  rightsBasedPractice: boolean;
  feedbackResponsiveness: boolean;
}

// ── Result interfaces ─────────────────────────────────────────────────────

export interface ParticipationQualityResult {
  overallScore: number;
  totalRecords: number;
  childViewRecordedRate: number;
  viewsActedUponRate: number;
  advocacyOfferedRate: number;
  feedbackProvidedRate: number;
}

export interface ParticipationComplianceResult {
  overallScore: number;
  documentationRate: number;
  timelyRecordingRate: number;
  viewsActedUponRate: number;
  categoryDiversityRatio: number;
}

export interface ParticipationPolicyResult {
  overallScore: number;
  participationPolicy: boolean;
  advocacyAccessPolicy: boolean;
  complaintsAwarenessFramework: boolean;
  childVoiceInCarePlanning: boolean;
  feedbackMechanismPolicy: boolean;
  rightsEducationPolicy: boolean;
  independentVisitorScheme: boolean;
}

export interface StaffParticipationReadinessResult {
  overallScore: number;
  totalStaff: number;
  childVoiceCaptureRate: number;
  advocacyKnowledgeRate: number;
  participationFacilitationRate: number;
  complaintsAwarenessRate: number;
  rightsBasedPracticeRate: number;
  feedbackResponsivenessRate: number;
}

export interface ChildParticipationProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  childViewRecordedRate: number;
  viewsActedUponRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface ParticipationIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  participationQuality: ParticipationQualityResult;
  participationCompliance: ParticipationComplianceResult;
  participationPolicy: ParticipationPolicyResult;
  staffReadiness: StaffParticipationReadinessResult;
  childProfiles: ChildParticipationProfile[];
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

export function getParticipationCategoryLabel(cat: ParticipationCategory): string {
  const map: Record<ParticipationCategory, string> = {
    care_plan_voice: "Care Plan Voice",
    advocacy_access: "Advocacy Access",
    complaints_awareness: "Complaints Awareness",
    house_meeting_input: "House Meeting Input",
    review_participation: "Review Participation",
    daily_decisions: "Daily Decisions",
    feedback_mechanism: "Feedback Mechanism",
    rights_education: "Rights Education",
  };
  return map[cat] ?? cat;
}

export function getParticipationOutcomeLabel(o: ParticipationOutcome): string {
  const map: Record<ParticipationOutcome, string> = {
    views_acted_upon: "Views Acted Upon",
    views_recorded: "Views Recorded",
    views_partially_acted: "Partially Acted Upon",
    child_declined: "Child Declined",
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
// childViewRecordedRate(7) + viewsActedUponRate(6) + advocacyOfferedRate(6) + feedbackProvidedRate(6) = 25

export function evaluateParticipationQuality(records: ParticipationRecord[]): ParticipationQualityResult {
  const total = records.length;
  const childViewRecordedRate = pct(records.filter(r => r.childViewRecorded).length, total);
  const viewsActedUponRate = pct(records.filter(r => r.viewsActedUpon).length, total);
  const advocacyOfferedRate = pct(records.filter(r => r.advocacyOffered).length, total);
  const feedbackProvidedRate = pct(records.filter(r => r.feedbackProvided).length, total);

  const raw =
    (childViewRecordedRate / 100) * 7 +
    (viewsActedUponRate / 100) * 6 +
    (advocacyOfferedRate / 100) * 6 +
    (feedbackProvidedRate / 100) * 6;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalRecords: total, childViewRecordedRate, viewsActedUponRate, advocacyOfferedRate, feedbackProvidedRate };
}

// ── Evaluator 2: Compliance (0-25) ────────────────────────────────────────
// documentationRate(8) + timelyRecordingRate(7) + viewsActedUponRate(5) + categoryDiversityRatio(5) = 25

export function evaluateParticipationCompliance(records: ParticipationRecord[]): ParticipationComplianceResult {
  const total = records.length;
  const documentationRate = pct(records.filter(r => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter(r => r.timelyRecording).length, total);
  const viewsActedUponRate = pct(records.filter(r => r.viewsActedUpon).length, total);

  const ALL_CATEGORIES: ParticipationCategory[] = [
    "care_plan_voice", "advocacy_access", "complaints_awareness", "house_meeting_input",
    "review_participation", "daily_decisions", "feedback_mechanism", "rights_education",
  ];
  const usedCategories = new Set(records.map(r => r.category));
  const categoryDiversityRatio = pct(usedCategories.size, ALL_CATEGORIES.length);

  const raw =
    (documentationRate / 100) * 8 +
    (timelyRecordingRate / 100) * 7 +
    (viewsActedUponRate / 100) * 5 +
    (categoryDiversityRatio / 100) * 5;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, documentationRate, timelyRecordingRate, viewsActedUponRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy (0-25) ────────────────────────────────────────────
// 7 booleans weighted 4+4+4+4+3+3+3 = 25

export function evaluateParticipationPolicy(policy: ParticipationPolicy | null): ParticipationPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      participationPolicy: false,
      advocacyAccessPolicy: false,
      complaintsAwarenessFramework: false,
      childVoiceInCarePlanning: false,
      feedbackMechanismPolicy: false,
      rightsEducationPolicy: false,
      independentVisitorScheme: false,
    };
  }

  const score =
    (policy.participationPolicy ? 4 : 0) +
    (policy.advocacyAccessPolicy ? 4 : 0) +
    (policy.complaintsAwarenessFramework ? 4 : 0) +
    (policy.childVoiceInCarePlanning ? 4 : 0) +
    (policy.feedbackMechanismPolicy ? 3 : 0) +
    (policy.rightsEducationPolicy ? 3 : 0) +
    (policy.independentVisitorScheme ? 3 : 0);

  return {
    overallScore: Math.min(25, score),
    participationPolicy: policy.participationPolicy,
    advocacyAccessPolicy: policy.advocacyAccessPolicy,
    complaintsAwarenessFramework: policy.complaintsAwarenessFramework,
    childVoiceInCarePlanning: policy.childVoiceInCarePlanning,
    feedbackMechanismPolicy: policy.feedbackMechanismPolicy,
    rightsEducationPolicy: policy.rightsEducationPolicy,
    independentVisitorScheme: policy.independentVisitorScheme,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ───────────────────────────────────
// 6 skills weighted 6+5+5+4+3+2 = 25

export function evaluateStaffParticipationReadiness(staff: StaffParticipationTraining[]): StaffParticipationReadinessResult {
  const total = staff.length;
  const childVoiceCaptureRate = pct(staff.filter(s => s.childVoiceCapture).length, total);
  const advocacyKnowledgeRate = pct(staff.filter(s => s.advocacyKnowledge).length, total);
  const participationFacilitationRate = pct(staff.filter(s => s.participationFacilitation).length, total);
  const complaintsAwarenessRate = pct(staff.filter(s => s.complaintsAwareness).length, total);
  const rightsBasedPracticeRate = pct(staff.filter(s => s.rightsBasedPractice).length, total);
  const feedbackResponsivenessRate = pct(staff.filter(s => s.feedbackResponsiveness).length, total);

  const raw =
    (childVoiceCaptureRate / 100) * 6 +
    (advocacyKnowledgeRate / 100) * 5 +
    (participationFacilitationRate / 100) * 5 +
    (complaintsAwarenessRate / 100) * 4 +
    (rightsBasedPracticeRate / 100) * 3 +
    (feedbackResponsivenessRate / 100) * 2;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalStaff: total, childVoiceCaptureRate, advocacyKnowledgeRate, participationFacilitationRate, complaintsAwarenessRate, rightsBasedPracticeRate, feedbackResponsivenessRate };
}

// ── Child Participation Profiles (0-10) ───────────────────────────────────

export function buildChildParticipationProfiles(records: ParticipationRecord[]): ChildParticipationProfile[] {
  const byChild = new Map<string, ParticipationRecord[]>();
  for (const r of records) {
    const arr = byChild.get(r.childId) ?? [];
    arr.push(r);
    byChild.set(r.childId, arr);
  }

  const profiles: ChildParticipationProfile[] = [];

  for (const [childId, recs] of byChild) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;
    const childViewRecordedRate = pct(recs.filter(r => r.childViewRecorded).length, totalRecords);
    const viewsActedUponRate = pct(recs.filter(r => r.viewsActedUpon).length, totalRecords);
    const categoriesCovered = [...new Set(recs.map(r => r.category))];

    let score = 0;
    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;
    if (childViewRecordedRate >= 80) score += 3;
    else if (childViewRecordedRate >= 60) score += 2;
    else if (childViewRecordedRate >= 40) score += 1;
    if (viewsActedUponRate >= 80) score += 3;
    else if (viewsActedUponRate >= 60) score += 2;
    else if (viewsActedUponRate >= 40) score += 1;
    if (categoriesCovered.length >= 4) score += 2;
    else if (categoriesCovered.length >= 2) score += 1;

    profiles.push({ childId, childName, totalRecords, childViewRecordedRate, viewsActedUponRate, categoriesCovered, overallScore: Math.min(10, score) });
  }

  return profiles.sort((a, b) => b.overallScore - a.overallScore);
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateParticipationIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: ParticipationRecord[];
  policy: ParticipationPolicy | null;
  staff: StaffParticipationTraining[];
}): ParticipationIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const participationQuality = evaluateParticipationQuality(records);
  const participationCompliance = evaluateParticipationCompliance(records);
  const participationPolicy = evaluateParticipationPolicy(policy);
  const staffReadiness = evaluateStaffParticipationReadiness(staff);
  const childProfiles = buildChildParticipationProfiles(records);

  const overallScore = Math.min(100,
    participationQuality.overallScore +
    participationCompliance.overallScore +
    participationPolicy.overallScore +
    staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (participationQuality.childViewRecordedRate >= 80) strengths.push("Excellent child voice capture in participation records");
  if (participationQuality.viewsActedUponRate >= 80) strengths.push("Children's views consistently acted upon");
  if (participationQuality.advocacyOfferedRate >= 90) strengths.push("Advocacy consistently offered to all children");
  if (participationQuality.feedbackProvidedRate >= 80) strengths.push("Strong feedback provision to children");
  if (participationCompliance.documentationRate >= 90) strengths.push("Excellent participation documentation practices");
  if (participationCompliance.categoryDiversityRatio >= 75) strengths.push("Good variety of participation methods used");
  if (participationPolicy.overallScore >= 22) strengths.push("Comprehensive participation and advocacy policies in place");
  if (staffReadiness.childVoiceCaptureRate >= 80) strengths.push("Staff well-trained in child voice capture");
  if (staffReadiness.advocacyKnowledgeRate >= 80) strengths.push("Staff knowledgeable about advocacy services");

  const areasForImprovement: string[] = [];
  if (participationQuality.childViewRecordedRate < 60) areasForImprovement.push("Children's views not consistently recorded");
  if (participationQuality.viewsActedUponRate < 60) areasForImprovement.push("Low rate of acting on children's expressed views");
  if (participationQuality.advocacyOfferedRate < 60) areasForImprovement.push("Advocacy not consistently offered to children");
  if (participationCompliance.timelyRecordingRate < 70) areasForImprovement.push("Participation records not completed in a timely manner");
  if (participationCompliance.categoryDiversityRatio < 50) areasForImprovement.push("Limited variety in participation methods");
  if (staffReadiness.rightsBasedPracticeRate < 60) areasForImprovement.push("Staff rights-based practice training needs attention");
  if (staffReadiness.complaintsAwarenessRate < 60) areasForImprovement.push("Staff complaints awareness needs development");

  const actions: string[] = [];
  if (participationQuality.childViewRecordedRate < 40) actions.push("URGENT: Implement systematic child voice recording in all decisions");
  if (participationQuality.advocacyOfferedRate < 40) actions.push("URGENT: Ensure independent advocacy is offered to every child");
  if (participationCompliance.documentationRate < 60) actions.push("URGENT: Ensure all participation activities are properly documented");
  if (!policy || participationPolicy.overallScore < 16) actions.push("Review and update participation and advocacy policies");
  if (staffReadiness.overallScore < 15) actions.push("Prioritise staff training in child voice and participation skills");
  if (participationQuality.viewsActedUponRate < 50) actions.push("Review barriers to acting on children's expressed views");
  if (records.length === 0) actions.push("URGENT: No participation records found — establish child voice mechanisms immediately");

  const regulatoryLinks = [
    "CHR 2015 Reg 7 — Children's wishes and feelings",
    "CHR 2015 Reg 16 — Statement of purpose (child-centred)",
    "UNCRC Article 12 — Right to be heard",
    "SCCIF — Overall experiences: voice of the child",
    "Children Act 1989 s.22 — Ascertain wishes/feelings",
    "Advocacy Services and Representations Procedure Regs 2004",
    "Quality Standards 2015 — Standard 3 (aspirations, views, wishes)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    participationQuality, participationCompliance, participationPolicy, staffReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
