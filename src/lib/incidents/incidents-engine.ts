import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Incidents Intelligence Engine  (v2 — standardised)
//
// Deterministic engine for evaluating incident quality, compliance,
// policy frameworks, staff readiness, and per-child incident profiles.
//
// Aligned to:
//   - CHR 2015 Reg 34 — Safeguarding of children
//   - CHR 2015 Reg 35 — Behaviour management
//   - CHR 2015 Reg 40 — Notification of serious events
//   - NMS 9 — Positive behaviour and relationships
//   - SCCIF — Safety: behaviour management and incident handling
//   - Children Act 1989 s.22 — Duty of care
//   - Quality Standards 2015 — Standard 3 (protection)
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums / Literal Unions ────────────────────────────────────────────────

export type IncidentCategory =
  | "physical_incident"
  | "verbal_incident"
  | "self_harm"
  | "absconding"
  | "substance_misuse"
  | "criminal_behaviour"
  | "bullying"
  | "property_damage";

export type IncidentOutcome =
  | "resolved_safely"
  | "de_escalated"
  | "restraint_used"
  | "external_referral"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record ────────────────────────────────────────────────────────────────

export interface IncidentRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: IncidentCategory;
  outcome: IncidentOutcome;
  deEscalationAttempted: boolean;
  childViewRecorded: boolean;
  debriefConducted: boolean;
  lessonsIdentified: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

// ── Policy (7 booleans) ───────────────────────────────────────────────────

export interface IncidentPolicy {
  incidentManagementPolicy: boolean;
  deEscalationGuidance: boolean;
  restraintPolicy: boolean;
  postIncidentDebriefPolicy: boolean;
  childViewInIncidentPolicy: boolean;
  notificationProcedure: boolean;
  lessonsLearnedFramework: boolean;
}

// ── Staff Training (6 skills) ─────────────────────────────────────────────

export interface StaffIncidentTraining {
  staffId: string;
  deEscalationSkills: boolean;
  incidentRecording: boolean;
  restraintCertification: boolean;
  postIncidentSupport: boolean;
  childProtectionAwareness: boolean;
  conflictResolution: boolean;
}

// ── Result interfaces ─────────────────────────────────────────────────────

export interface IncidentQualityResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationAttemptedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewRecordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  debriefConductedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  lessonsIdentifiedRate: number | null;
}

export interface IncidentComplianceResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationAttemptedRate: number | null;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface IncidentPolicyResult {
  overallScore: number;
  incidentManagementPolicy: boolean;
  deEscalationGuidance: boolean;
  restraintPolicy: boolean;
  postIncidentDebriefPolicy: boolean;
  childViewInIncidentPolicy: boolean;
  notificationProcedure: boolean;
  lessonsLearnedFramework: boolean;
}

export interface StaffIncidentReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  incidentRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  restraintCertificationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  postIncidentSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childProtectionAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictResolutionRate: number | null;
}

export interface ChildIncidentProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationAttemptedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewRecordedRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface IncidentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  incidentQuality: IncidentQualityResult;
  incidentCompliance: IncidentComplianceResult;
  incidentPolicy: IncidentPolicyResult;
  staffReadiness: StaffIncidentReadinessResult;
  childProfiles: ChildIncidentProfile[];
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

export function getIncidentCategoryLabel(category: IncidentCategory): string {
  const map: Record<IncidentCategory, string> = {
    physical_incident: "Physical Incident",
    verbal_incident: "Verbal Incident",
    self_harm: "Self-Harm",
    absconding: "Absconding",
    substance_misuse: "Substance Misuse",
    criminal_behaviour: "Criminal Behaviour",
    bullying: "Bullying",
    property_damage: "Property Damage",
  };
  return map[category] ?? category;
}

export function getIncidentOutcomeLabel(outcome: IncidentOutcome): string {
  const map: Record<IncidentOutcome, string> = {
    resolved_safely: "Resolved Safely",
    de_escalated: "De-Escalated",
    restraint_used: "Restraint Used",
    external_referral: "External Referral",
    not_applicable: "Not Applicable",
  };
  return map[outcome] ?? outcome;
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

// ── All 8 categories constant ─────────────────────────────────────────────

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────
// deEscalationAttemptedRate(7) + childViewRecordedRate(6) + debriefConductedRate(6) + lessonsIdentifiedRate(6) = 25

export function evaluateIncidentQuality(records: IncidentRecord[]): IncidentQualityResult {
  const total = records.length;
  const deEscalationAttemptedRate = rate(records.filter(r => r.deEscalationAttempted).length, total);
  const childViewRecordedRate = rate(records.filter(r => r.childViewRecorded).length, total);
  const debriefConductedRate = rate(records.filter(r => r.debriefConducted).length, total);
  const lessonsIdentifiedRate = rate(records.filter(r => r.lessonsIdentified).length, total);

  let score = 0;
  score += ((deEscalationAttemptedRate ?? 0) / 100) * 7;
  score += ((childViewRecordedRate ?? 0) / 100) * 6;
  score += ((debriefConductedRate ?? 0) / 100) * 6;
  score += ((lessonsIdentifiedRate ?? 0) / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: total, deEscalationAttemptedRate, childViewRecordedRate, debriefConductedRate, lessonsIdentifiedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────
// documentationRate(8) + timelyRecordingRate(7) + deEscalationAttemptedRate(5) + categoryDiversityRatio(5) = 25

export function evaluateIncidentCompliance(records: IncidentRecord[]): IncidentComplianceResult {
  const total = records.length;
  const documentationRate = rate(records.filter(r => r.documentationComplete).length, total);
  const timelyRecordingRate = rate(records.filter(r => r.timelyRecording).length, total);
  const deEscalationAttemptedRate = rate(records.filter(r => r.deEscalationAttempted).length, total);

  const usedCategories = new Set(records.map(r => r.category));
  const uniqueCategories = usedCategories.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += ((documentationRate ?? 0) / 100) * 8;
  score += ((timelyRecordingRate ?? 0) / 100) * 7;
  score += ((deEscalationAttemptedRate ?? 0) / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: total, documentationRate, timelyRecordingRate, deEscalationAttemptedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────
// 7 booleans weighted 4+4+4+4+3+3+3 = 25

export function evaluateIncidentPolicy(policy: IncidentPolicy | null): IncidentPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      incidentManagementPolicy: false,
      deEscalationGuidance: false,
      restraintPolicy: false,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: false,
      notificationProcedure: false,
      lessonsLearnedFramework: false,
    };
  }

  const score =
    (policy.incidentManagementPolicy ? 4 : 0) +
    (policy.deEscalationGuidance ? 4 : 0) +
    (policy.restraintPolicy ? 4 : 0) +
    (policy.postIncidentDebriefPolicy ? 4 : 0) +
    (policy.childViewInIncidentPolicy ? 3 : 0) +
    (policy.notificationProcedure ? 3 : 0) +
    (policy.lessonsLearnedFramework ? 3 : 0);

  return {
    overallScore: Math.min(25, score),
    incidentManagementPolicy: policy.incidentManagementPolicy,
    deEscalationGuidance: policy.deEscalationGuidance,
    restraintPolicy: policy.restraintPolicy,
    postIncidentDebriefPolicy: policy.postIncidentDebriefPolicy,
    childViewInIncidentPolicy: policy.childViewInIncidentPolicy,
    notificationProcedure: policy.notificationProcedure,
    lessonsLearnedFramework: policy.lessonsLearnedFramework,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────
// 6 skills weighted 6+5+5+4+3+2 = 25

export function evaluateStaffIncidentReadiness(staff: StaffIncidentTraining[]): StaffIncidentReadinessResult {
  const total = staff.length;
  const deEscalationSkillsRate = rate(staff.filter(s => s.deEscalationSkills).length, total);
  const incidentRecordingRate = rate(staff.filter(s => s.incidentRecording).length, total);
  const restraintCertificationRate = rate(staff.filter(s => s.restraintCertification).length, total);
  const postIncidentSupportRate = rate(staff.filter(s => s.postIncidentSupport).length, total);
  const childProtectionAwarenessRate = rate(staff.filter(s => s.childProtectionAwareness).length, total);
  const conflictResolutionRate = rate(staff.filter(s => s.conflictResolution).length, total);

  let score = 0;
  score += ((deEscalationSkillsRate ?? 0) / 100) * 6;
  score += ((incidentRecordingRate ?? 0) / 100) * 5;
  score += ((restraintCertificationRate ?? 0) / 100) * 5;
  score += ((postIncidentSupportRate ?? 0) / 100) * 4;
  score += ((childProtectionAwarenessRate ?? 0) / 100) * 3;
  score += ((conflictResolutionRate ?? 0) / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: total, deEscalationSkillsRate, incidentRecordingRate, restraintCertificationRate, postIncidentSupportRate, childProtectionAwarenessRate, conflictResolutionRate };
}

// ── Child Incident Profiles (0-10) ───────────────────────────────────────

export function buildChildIncidentProfiles(records: IncidentRecord[]): ChildIncidentProfile[] {
  const byChild = new Map<string, IncidentRecord[]>();
  for (const r of records) {
    const arr = byChild.get(r.childId) ?? [];
    arr.push(r);
    byChild.set(r.childId, arr);
  }

  const profiles: ChildIncidentProfile[] = [];

  for (const [childId, recs] of byChild) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;
    const deEscalationAttemptedRate = rate(recs.filter(r => r.deEscalationAttempted).length, totalRecords);
    const childViewRecordedRate = rate(recs.filter(r => r.childViewRecorded).length, totalRecords);
    const categoriesCovered = [...new Set(recs.map(r => r.category))];

    let score = 0;
    // Frequency
    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;
    // Rate 1: deEscalationAttemptedRate
    if (meets(deEscalationAttemptedRate, 80)) score += 3;
    else if (meets(deEscalationAttemptedRate, 60)) score += 2;
    else if (meets(deEscalationAttemptedRate, 40)) score += 1;
    // Rate 2: childViewRecordedRate
    if (meets(childViewRecordedRate, 80)) score += 3;
    else if (meets(childViewRecordedRate, 60)) score += 2;
    else if (meets(childViewRecordedRate, 40)) score += 1;
    // Diversity
    if (categoriesCovered.length >= 4) score += 2;
    else if (categoriesCovered.length >= 2) score += 1;

    profiles.push({ childId, childName, totalRecords, deEscalationAttemptedRate, childViewRecordedRate, categoriesCovered, overallScore: Math.min(10, score) });
  }

  return profiles.sort((a, b) => b.overallScore - a.overallScore);
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateIncidentIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: IncidentRecord[];
  policy: IncidentPolicy | null;
  staff: StaffIncidentTraining[];
}): IncidentIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  // Filter records to period
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const filtered = records.filter(r => {
    const d = new Date(r.date);
    return d >= startDate && d <= endDate;
  });

  const incidentQuality = evaluateIncidentQuality(filtered);
  const incidentCompliance = evaluateIncidentCompliance(filtered);
  const incidentPolicy = evaluateIncidentPolicy(policy);
  const staffReadiness = evaluateStaffIncidentReadiness(staff);
  const childProfiles = buildChildIncidentProfiles(filtered);

  const overallScore = Math.min(100,
    incidentQuality.overallScore +
    incidentCompliance.overallScore +
    incidentPolicy.overallScore +
    staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (meets(incidentQuality.deEscalationAttemptedRate, 80)) strengths.push("Excellent de-escalation practices consistently applied");
  if (meets(incidentQuality.childViewRecordedRate, 80)) strengths.push("Children's views consistently recorded in incidents");
  if (meets(incidentQuality.debriefConductedRate, 90)) strengths.push("Strong post-incident debrief culture");
  if (meets(incidentQuality.lessonsIdentifiedRate, 80)) strengths.push("Lessons consistently identified from incidents");
  if (meets(incidentCompliance.documentationRate, 90)) strengths.push("Excellent incident documentation practices");
  if (meets(incidentCompliance.categoryDiversityRatio, 0.75)) strengths.push("Good breadth of incident categories recorded");
  if (meets(incidentPolicy.overallScore, 22)) strengths.push("Comprehensive incident management policies in place");
  if (meets(staffReadiness.deEscalationSkillsRate, 80)) strengths.push("Staff well-trained in de-escalation techniques");
  if (meets(staffReadiness.restraintCertificationRate, 80)) strengths.push("Staff restraint certifications well maintained");

  const areasForImprovement: string[] = [];
  if (below(incidentQuality.deEscalationAttemptedRate, 60)) areasForImprovement.push("De-escalation not consistently attempted before incidents");
  if (below(incidentQuality.childViewRecordedRate, 60)) areasForImprovement.push("Children's views not consistently recorded in incidents");
  if (below(incidentQuality.debriefConductedRate, 60)) areasForImprovement.push("Post-incident debriefs not consistently conducted");
  if (below(incidentCompliance.timelyRecordingRate, 70)) areasForImprovement.push("Incident records not completed in a timely manner");
  if (below(incidentCompliance.categoryDiversityRatio, 0.5)) areasForImprovement.push("Limited range of incident categories recorded");
  if (below(staffReadiness.incidentRecordingRate, 60)) areasForImprovement.push("Staff incident recording skills need improvement");
  if (below(staffReadiness.conflictResolutionRate, 60)) areasForImprovement.push("Conflict resolution training coverage needs improvement");

  const actions: string[] = [];
  if (below(incidentQuality.deEscalationAttemptedRate, 40)) actions.push("URGENT: Implement mandatory de-escalation before any incident response");
  if (below(incidentQuality.childViewRecordedRate, 40)) actions.push("URGENT: Ensure children's views are captured in every incident record");
  if (below(incidentCompliance.documentationRate, 60)) actions.push("URGENT: Ensure all incidents are properly documented");
  if (!policy || incidentPolicy.overallScore < 16) actions.push("Review and update incident management policies and procedures");
  if (below(staffReadiness.overallScore, 15)) actions.push("Prioritise staff incident management training programme");
  if (below(incidentQuality.lessonsIdentifiedRate, 50)) actions.push("Strengthen lessons-learned process following incidents");
  if (filtered.length === 0) actions.push("URGENT: No incident records found — ensure robust incident recording mechanisms are in place");

  const regulatoryLinks = [
    "CHR 2015 Reg 34 — Safeguarding of children",
    "CHR 2015 Reg 35 — Behaviour management",
    "CHR 2015 Reg 40 — Notification of serious events",
    "NMS 9 — Positive behaviour and relationships",
    "SCCIF — Safety: behaviour management and incident handling",
    "Children Act 1989 s.22 — Duty of care",
    "Quality Standards 2015 — Standard 3 (protection)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    incidentQuality, incidentCompliance, incidentPolicy, staffReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
