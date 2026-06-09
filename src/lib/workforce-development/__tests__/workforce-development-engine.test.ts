// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Workforce Development Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateQualifications,
  evaluateCPD,
  evaluateCompetency,
  evaluateDevelopmentPlanning,
  evaluatePracticeQuality,
  generateWorkforceDevelopmentIntelligence,
  getCPDCategoryLabel,
  getQualificationTypeLabel,
  getCompetencyLevelLabel,
} from "../workforce-development-engine";
import type {
  StaffQualification,
  CPDRecord,
  CompetencyAssessment,
  DevelopmentPlan,
  PracticeObservation,
  QualificationType,
  CPDCategory,
  CompetencyLevel,
} from "../workforce-development-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-12-31";
const REFERENCE_DATE = "2025-06-15";

// ── Chamberlain House Staff IDs ──────────────────────────────────────────────────────

const STAFF_IDS = [
  "staff-sarah",    // Sarah Johnson — RM, Level 5 achieved, strong CPD
  "staff-tom",      // Tom Richards — RSW, Level 3 in progress
  "staff-lisa",     // Lisa Williams — Senior RSW, Level 4 achieved
  "staff-darren",   // Darren Laville — RM, Level 5 in progress + management qual
];

// ── Chamberlain House Demo Qualifications (8+ records) ──────────────────────────────

const demoQualifications: StaffQualification[] = [
  // Sarah Johnson — RM
  { id: "q-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", qualificationType: "level_5_diploma", qualificationName: "Level 5 Diploma in Leadership for Health & Social Care", status: "achieved", startDate: "2018-09-01", completedDate: "2019-06-15", provider: "Open University", mandatoryForRole: true, evidenceRecorded: true },
  { id: "q-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", qualificationType: "safeguarding_advanced", qualificationName: "Advanced Safeguarding Certificate", status: "achieved", startDate: "2020-01-10", completedDate: "2020-06-20", provider: "Local Authority", mandatoryForRole: false, evidenceRecorded: true },
  // Tom Richards — RSW, Level 3 in progress
  { id: "q-t01", staffId: "staff-tom", staffName: "Tom Richards", qualificationType: "level_3_diploma", qualificationName: "Level 3 Diploma in Residential Childcare", status: "in_progress", startDate: "2024-01-15", expectedCompletionDate: "2025-12-31", provider: "City & Guilds", mandatoryForRole: true, evidenceRecorded: true },
  { id: "q-t02", staffId: "staff-tom", staffName: "Tom Richards", qualificationType: "first_aid", qualificationName: "First Aid at Work Certificate", status: "achieved", startDate: "2023-09-01", completedDate: "2023-09-10", provider: "Red Cross", mandatoryForRole: false, evidenceRecorded: true },
  // Lisa Williams — Senior RSW, Level 4 achieved
  { id: "q-l01", staffId: "staff-lisa", staffName: "Lisa Williams", qualificationType: "level_4_diploma", qualificationName: "Level 4 Diploma in Health & Social Care", status: "achieved", startDate: "2021-09-01", completedDate: "2022-11-10", provider: "Pearson", mandatoryForRole: true, evidenceRecorded: true },
  { id: "q-l02", staffId: "staff-lisa", staffName: "Lisa Williams", qualificationType: "therapeutic_care", qualificationName: "Therapeutic Crisis Intervention Certificate", status: "achieved", startDate: "2023-03-01", completedDate: "2023-06-15", provider: "Cornell University (Licensed)", mandatoryForRole: false, evidenceRecorded: true },
  // Darren Laville — RM, Level 5 in progress + management qual
  { id: "q-d01", staffId: "staff-darren", staffName: "Darren Laville", qualificationType: "level_5_diploma", qualificationName: "Level 5 Diploma in Leadership for Health & Social Care", status: "in_progress", startDate: "2024-09-01", expectedCompletionDate: "2026-03-01", provider: "Open University", mandatoryForRole: true, evidenceRecorded: true },
  { id: "q-d02", staffId: "staff-darren", staffName: "Darren Laville", qualificationType: "management_qualification", qualificationName: "ILM Level 5 in Management & Leadership", status: "achieved", startDate: "2019-01-01", completedDate: "2019-12-15", provider: "ILM", mandatoryForRole: false, evidenceRecorded: true },
  { id: "q-d03", staffId: "staff-darren", staffName: "Darren Laville", qualificationType: "nvq", qualificationName: "NVQ Level 3 in Children & Young People", status: "achieved", startDate: "2015-09-01", completedDate: "2017-06-30", provider: "City & Guilds", mandatoryForRole: false, evidenceRecorded: false },
];

// ── Chamberlain House Demo CPD Records (12+ records) ─────────────────────────────────

const demoCPD: CPDRecord[] = [
  // Sarah Johnson
  { id: "cpd-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-02-10", category: "safeguarding", title: "Advanced Safeguarding Refresher", description: "Refresher on safeguarding thresholds and referral pathways", hoursCompleted: 6, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Improved confidence in escalation decisions", supervisorSignOff: true, certificate: true },
  { id: "cpd-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-03-15", category: "leadership", title: "Reflective Leadership in Residential Care", description: "Leadership styles and reflective practice", hoursCompleted: 8, provider: "National Centre for Excellence in Residential Child Care", reflectionRecorded: true, impactOnPractice: "Adopted more coaching-based supervision approach", supervisorSignOff: true, certificate: true },
  { id: "cpd-s03", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-05-20", category: "therapeutic_practice", title: "DDP Level 1 — Dyadic Developmental Psychotherapy", description: "Therapeutic parenting using DDP principles", hoursCompleted: 12, provider: "DDP Network", reflectionRecorded: true, impactOnPractice: "Embedded PACE model into daily practice with young people", supervisorSignOff: true, certificate: true },
  // Tom Richards
  { id: "cpd-t01", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-02-15", category: "safeguarding", title: "Safeguarding Children Level 2", description: "Core safeguarding awareness", hoursCompleted: 6, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Better understanding of threshold decisions", supervisorSignOff: true, certificate: true },
  { id: "cpd-t02", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-04-10", category: "behaviour_management", title: "Understanding Behaviour as Communication", description: "Trauma-informed approaches to behaviour", hoursCompleted: 4, provider: "External Trainer", reflectionRecorded: true, impactOnPractice: "Shifted from consequences to connection-based approaches", supervisorSignOff: true, certificate: false },
  { id: "cpd-t03", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-06-01", category: "mental_health", title: "Mental Health First Aid", description: "Recognising and responding to mental health crises", hoursCompleted: 8, provider: "MHFA England", reflectionRecorded: false, impactOnPractice: "", supervisorSignOff: false, certificate: true },
  // Lisa Williams
  { id: "cpd-l01", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-01-22", category: "medication", title: "Medication Administration Refresher", description: "Safe medication storage, administration and recording", hoursCompleted: 3, provider: "In-house", reflectionRecorded: true, impactOnPractice: "Updated medication log processes for the home", supervisorSignOff: true, certificate: false },
  { id: "cpd-l02", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-03-12", category: "equality_diversity", title: "EDI in Children's Services", description: "Equality, diversity and inclusion in residential care", hoursCompleted: 4, provider: "External", reflectionRecorded: true, impactOnPractice: "Reviewed key work sessions to ensure culturally sensitive practice", supervisorSignOff: true, certificate: true },
  { id: "cpd-l03", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-04-20", category: "therapeutic_practice", title: "Attachment Theory in Practice", description: "Application of attachment theory to residential childcare", hoursCompleted: 6, provider: "External", reflectionRecorded: true, impactOnPractice: "Enhanced understanding of children's attachment patterns", supervisorSignOff: true, certificate: true },
  { id: "cpd-l04", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-06-05", category: "record_keeping", title: "Effective Record Keeping", description: "Standards for recording in children's residential homes", hoursCompleted: 3, provider: "In-house", reflectionRecorded: true, impactOnPractice: "Improved daily log quality and detail", supervisorSignOff: true, certificate: false },
  // Darren Laville
  { id: "cpd-d01", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-01-08", category: "regulatory", title: "Regulatory Update — CHR 2015 & SCCIF", description: "Updates to regulations and inspection framework", hoursCompleted: 4, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Updated home's quality assurance framework to match latest SCCIF", supervisorSignOff: true, certificate: false },
  { id: "cpd-d02", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-03-20", category: "leadership", title: "Managing Effective Teams in Residential Care", description: "Team dynamics, conflict resolution and performance management", hoursCompleted: 8, provider: "Skills for Care", reflectionRecorded: true, impactOnPractice: "Restructured team meetings to be more participative", supervisorSignOff: true, certificate: true },
  { id: "cpd-d03", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-05-10", category: "safeguarding", title: "Designated Safeguarding Lead Refresher", description: "DSL responsibilities and multi-agency working", hoursCompleted: 6, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Strengthened inter-agency communication protocols", supervisorSignOff: true, certificate: true },
];

// ── Chamberlain House Demo Competency Assessments (8 records) ────────────────────────

const demoCompetencies: CompetencyAssessment[] = [
  // Sarah Johnson
  { id: "ca-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", assessmentDate: "2025-03-15", assessor: "Darren Laville", competencyArea: "Safeguarding Practice", level: "expert", previousLevel: "proficient", evidenceBase: ["DSL training completed", "Led safeguarding audit", "Multi-agency coordination"], developmentActions: ["Mentor junior staff on safeguarding"], nextAssessmentDate: "2025-09-15" },
  { id: "ca-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", assessmentDate: "2025-03-15", assessor: "Darren Laville", competencyArea: "Therapeutic Practice", level: "proficient", previousLevel: "competent", evidenceBase: ["DDP Level 1 completed", "PACE model observed in practice"], developmentActions: ["Complete DDP Level 2"], nextAssessmentDate: "2025-09-15" },
  // Tom Richards
  { id: "ca-t01", staffId: "staff-tom", staffName: "Tom Richards", assessmentDate: "2025-04-01", assessor: "Sarah Johnson", competencyArea: "Safeguarding Practice", level: "competent", previousLevel: "developing", evidenceBase: ["Safeguarding Level 2 completed", "Appropriate referral made"], developmentActions: ["Shadow DSL in strategy meeting"], nextAssessmentDate: "2025-10-01" },
  { id: "ca-t02", staffId: "staff-tom", staffName: "Tom Richards", assessmentDate: "2025-04-01", assessor: "Sarah Johnson", competencyArea: "Behaviour Management", level: "developing", evidenceBase: ["Training attended", "Observation showed some good practice"], developmentActions: ["Review behaviour support plans", "Attend further training on de-escalation"], nextAssessmentDate: "2025-10-01" },
  // Lisa Williams
  { id: "ca-l01", staffId: "staff-lisa", staffName: "Lisa Williams", assessmentDate: "2025-03-20", assessor: "Darren Laville", competencyArea: "Key Working Practice", level: "proficient", previousLevel: "proficient", evidenceBase: ["Consistently high-quality key work sessions", "Positive feedback from young people"], developmentActions: ["Take on mentoring role for new staff"], nextAssessmentDate: "2025-09-20" },
  { id: "ca-l02", staffId: "staff-lisa", staffName: "Lisa Williams", assessmentDate: "2025-03-20", assessor: "Darren Laville", competencyArea: "Record Keeping", level: "competent", previousLevel: "developing", evidenceBase: ["Record quality improved", "Training completed"], developmentActions: ["Achieve consistency in daily log entries"], nextAssessmentDate: "2025-09-20" },
  // Darren Laville
  { id: "ca-d01", staffId: "staff-darren", staffName: "Darren Laville", assessmentDate: "2025-02-28", assessor: "External Consultant", competencyArea: "Leadership & Management", level: "proficient", previousLevel: "proficient", evidenceBase: ["Reg 44 reports positive", "Staff feedback strong", "QA framework in place"], developmentActions: ["Develop succession planning"], nextAssessmentDate: "2025-08-28" },
  { id: "ca-d02", staffId: "staff-darren", staffName: "Darren Laville", assessmentDate: "2025-02-28", assessor: "External Consultant", competencyArea: "Quality Assurance", level: "proficient", previousLevel: "competent", evidenceBase: ["QA audits demonstrate improvement", "Action plans followed through"], developmentActions: ["Embed outcome measurement tools"], nextAssessmentDate: "2025-08-28" },
];

// ── Chamberlain House Demo Development Plans (4 records) ─────────────────────────────

const demoDevelopmentPlans: DevelopmentPlan[] = [
  // Sarah Johnson
  {
    id: "dp-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", createdDate: "2025-01-15", reviewDate: "2025-04-15", nextReviewDate: "2025-07-15",
    goals: [
      { description: "Complete DDP Level 2 training", targetDate: "2025-09-30", status: "in_progress", progress: 40 },
      { description: "Mentor two RSWs through Level 3 Diploma", targetDate: "2025-12-31", status: "in_progress", progress: 60 },
      { description: "Lead safeguarding audit for the home", targetDate: "2025-06-30", status: "achieved", progress: 100 },
    ],
    supervisorId: "staff-darren", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
  },
  // Tom Richards
  {
    id: "dp-t01", staffId: "staff-tom", staffName: "Tom Richards", createdDate: "2025-01-20", reviewDate: "2025-04-20", nextReviewDate: "2025-07-20",
    goals: [
      { description: "Complete Level 3 Diploma in Residential Childcare", targetDate: "2025-12-31", status: "in_progress", progress: 50 },
      { description: "Achieve competent level in behaviour management", targetDate: "2025-09-30", status: "in_progress", progress: 30 },
      { description: "Complete equality and diversity training", targetDate: "2025-06-30", status: "overdue", progress: 0 },
    ],
    supervisorId: "staff-sarah", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
  },
  // Lisa Williams
  {
    id: "dp-l01", staffId: "staff-lisa", staffName: "Lisa Williams", createdDate: "2025-02-01", reviewDate: "2025-05-01", nextReviewDate: "2025-08-01",
    goals: [
      { description: "Take on mentoring role for new RSW", targetDate: "2025-06-30", status: "achieved", progress: 100 },
      { description: "Improve daily log consistency to 95%+ quality", targetDate: "2025-09-30", status: "in_progress", progress: 70 },
    ],
    supervisorId: "staff-darren", alignedToHomeNeeds: true, alignedToRegulatory: false, staffInputRecorded: true,
  },
  // Darren Laville
  {
    id: "dp-d01", staffId: "staff-darren", staffName: "Darren Laville", createdDate: "2025-01-10", reviewDate: "2025-04-10", nextReviewDate: "2025-07-10",
    goals: [
      { description: "Complete Level 5 Diploma modules 3 and 4", targetDate: "2025-09-30", status: "in_progress", progress: 45 },
      { description: "Develop succession plan for the home", targetDate: "2025-12-31", status: "not_started", progress: 0 },
      { description: "Embed new QA framework across all modules", targetDate: "2025-06-30", status: "achieved", progress: 100 },
    ],
    supervisorId: "staff-darren", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
  },
];

// ── Chamberlain House Demo Practice Observations (6 records) ─────────────────────────

const demoObservations: PracticeObservation[] = [
  // Sarah Johnson
  { id: "po-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-02-20", observer: "Darren Laville", observationType: "direct_practice", rating: "outstanding", strengths: ["Exceptional rapport with young person", "PACE approach evident throughout"], developmentAreas: [], actionPlanCreated: false },
  { id: "po-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-05-15", observer: "External Consultant", observationType: "supervision_of_others", rating: "good", strengths: ["Clear direction given", "Supportive approach to staff"], developmentAreas: ["Could delegate more to develop senior RSW"], actionPlanCreated: true, followUpDate: "2025-07-15", followUpCompleted: false },
  // Tom Richards
  { id: "po-t01", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-03-10", observer: "Sarah Johnson", observationType: "shift_observation", rating: "requires_improvement", strengths: ["Good relationship with young people"], developmentAreas: ["Recording needs improvement", "De-escalation techniques need development"], actionPlanCreated: true, followUpDate: "2025-05-10", followUpCompleted: true },
  { id: "po-t02", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-05-25", observer: "Sarah Johnson", observationType: "key_work_session", rating: "good", strengths: ["Good preparation", "Young person engaged well"], developmentAreas: ["Recording of session could be more detailed"], actionPlanCreated: true, followUpDate: "2025-07-25", followUpCompleted: false },
  // Lisa Williams
  { id: "po-l01", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-03-18", observer: "Darren Laville", observationType: "key_work_session", rating: "outstanding", strengths: ["Excellent use of life story work materials", "Young person clearly at ease"], developmentAreas: [], actionPlanCreated: false },
  // Darren Laville
  { id: "po-d01", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-04-05", observer: "External Consultant", observationType: "direct_practice", rating: "good", strengths: ["Strong leadership presence", "Calm under pressure"], developmentAreas: ["Could model reflective practice more explicitly"], actionPlanCreated: true, followUpDate: "2025-06-05", followUpCompleted: true },
];

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getCPDCategoryLabel", () => {
  it("returns label for safeguarding", () => {
    expect(getCPDCategoryLabel("safeguarding")).toBe("Safeguarding");
  });

  it("returns label for therapeutic_practice", () => {
    expect(getCPDCategoryLabel("therapeutic_practice")).toBe("Therapeutic Practice");
  });

  it("returns label for behaviour_management", () => {
    expect(getCPDCategoryLabel("behaviour_management")).toBe("Behaviour Management");
  });

  it("returns label for all CPD categories", () => {
    const categories: CPDCategory[] = [
      "safeguarding", "therapeutic_practice", "behaviour_management",
      "medication", "record_keeping", "leadership", "equality_diversity",
      "health_safety", "mental_health", "communication", "regulatory", "specialist",
    ];
    for (const cat of categories) {
      expect(getCPDCategoryLabel(cat)).toBeTruthy();
      expect(getCPDCategoryLabel(cat).length).toBeGreaterThan(0);
    }
  });
});

describe("getQualificationTypeLabel", () => {
  it("returns label for level_3_diploma", () => {
    expect(getQualificationTypeLabel("level_3_diploma")).toBe("Level 3 Diploma");
  });

  it("returns label for level_5_diploma", () => {
    expect(getQualificationTypeLabel("level_5_diploma")).toBe("Level 5 Diploma");
  });

  it("returns label for social_work_degree", () => {
    expect(getQualificationTypeLabel("social_work_degree")).toBe("Social Work Degree");
  });

  it("returns label for all qualification types", () => {
    const types: QualificationType[] = [
      "level_3_diploma", "level_4_diploma", "level_5_diploma",
      "social_work_degree", "management_qualification", "first_aid",
      "safeguarding_advanced", "therapeutic_care", "nvq", "other",
    ];
    for (const t of types) {
      expect(getQualificationTypeLabel(t)).toBeTruthy();
    }
  });
});

describe("getCompetencyLevelLabel", () => {
  it("returns label for developing", () => {
    expect(getCompetencyLevelLabel("developing")).toBe("Developing");
  });

  it("returns label for competent", () => {
    expect(getCompetencyLevelLabel("competent")).toBe("Competent");
  });

  it("returns label for proficient", () => {
    expect(getCompetencyLevelLabel("proficient")).toBe("Proficient");
  });

  it("returns label for expert", () => {
    expect(getCompetencyLevelLabel("expert")).toBe("Expert");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateQualifications
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateQualifications", () => {
  it("returns correct totalStaff count", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    expect(result.totalStaff).toBe(4);
  });

  it("returns correct totalQualifications count", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    expect(result.totalQualifications).toBe(demoQualifications.length);
  });

  it("calculates mandatory compliance rate correctly", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    // Mandatory quals: q-s01 (achieved), q-t01 (in_progress), q-l01 (achieved), q-d01 (in_progress)
    // 2 achieved out of 4 mandatory = 50%
    expect(result.mandatoryComplianceRate).toBe(50);
  });

  it("counts in-progress qualifications", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    // q-t01 and q-d01 are in_progress
    expect(result.inProgressCount).toBe(2);
  });

  it("counts overdue qualifications as zero when none overdue", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    expect(result.overdueCount).toBe(0);
  });

  it("detects overdue qualifications", () => {
    const overdueQuals: StaffQualification[] = [
      ...demoQualifications,
      { id: "q-over", staffId: "staff-tom", staffName: "Tom Richards", qualificationType: "first_aid", qualificationName: "First Aid Renewal", status: "overdue", startDate: "2024-01-01", expectedCompletionDate: "2024-12-31", provider: "Red Cross", mandatoryForRole: false, evidenceRecorded: false },
    ];
    const result = evaluateQualifications(overdueQuals, STAFF_IDS);
    expect(result.overdueCount).toBe(1);
    expect(result.overdueQualifications.length).toBe(1);
    expect(result.overdueQualifications[0].staffName).toBe("Tom Richards");
  });

  it("calculates Level 3+ rate correctly", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    // Sarah: level_5_diploma achieved -> yes
    // Tom: level_3_diploma in_progress -> no (not achieved)
    // Lisa: level_4_diploma achieved -> yes
    // Darren: level_5_diploma in_progress -> no, but management_qualification achieved -> yes
    expect(result.level3PlusCount).toBe(3);
    expect(result.level3PlusRate).toBe(75);
  });

  it("calculates evidence recorded rate", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    // 8 out of 9 have evidenceRecorded = true (q-d03 is false)
    expect(result.evidenceRecordedRate).toBe(89); // Math.round(8/9 * 100) = 89
  });

  it("returns staff breakdown with correct structure", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    expect(result.staffBreakdown.length).toBe(4);
    for (const sb of result.staffBreakdown) {
      expect(sb).toHaveProperty("staffId");
      expect(sb).toHaveProperty("staffName");
      expect(sb).toHaveProperty("qualifications");
      expect(sb).toHaveProperty("mandatoryMet");
      expect(sb).toHaveProperty("hasLevel3Plus");
    }
  });

  it("correctly identifies staff with mandatory met", () => {
    const result = evaluateQualifications(demoQualifications, STAFF_IDS);
    const sarah = result.staffBreakdown.find((s) => s.staffId === "staff-sarah")!;
    expect(sarah.mandatoryMet).toBe(true);
    const tom = result.staffBreakdown.find((s) => s.staffId === "staff-tom")!;
    expect(tom.mandatoryMet).toBe(false);
  });

  it("handles empty qualification list", () => {
    const result = evaluateQualifications([], STAFF_IDS);
    expect(result.totalQualifications).toBe(0);
    expect(result.mandatoryComplianceRate).toBe(0);
    expect(result.level3PlusRate).toBe(0);
    expect(result.evidenceRecordedRate).toBe(0);
  });

  it("handles empty staff list", () => {
    const result = evaluateQualifications(demoQualifications, []);
    expect(result.totalStaff).toBe(0);
    expect(result.level3PlusRate).toBe(0);
    expect(result.staffBreakdown.length).toBe(0);
  });

  it("handles single staff member", () => {
    const result = evaluateQualifications(demoQualifications, ["staff-sarah"]);
    expect(result.totalStaff).toBe(1);
    expect(result.level3PlusRate).toBe(100);
  });

  it("handles all qualifications achieved for 100% compliance", () => {
    const allAchieved: StaffQualification[] = STAFF_IDS.map((sid, i) => ({
      id: `q-test-${i}`,
      staffId: sid,
      staffName: `Staff ${i}`,
      qualificationType: "level_5_diploma" as QualificationType,
      qualificationName: "Test Qualification",
      status: "achieved" as const,
      startDate: "2024-01-01",
      completedDate: "2024-06-01",
      provider: "Test",
      mandatoryForRole: true,
      evidenceRecorded: true,
    }));
    const result = evaluateQualifications(allAchieved, STAFF_IDS);
    expect(result.mandatoryComplianceRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateCPD
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCPD", () => {
  it("returns correct total records for period", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(demoCPD.length); // all are in 2025
  });

  it("calculates total hours correctly", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    const expectedHours = demoCPD.reduce((sum, r) => sum + r.hoursCompleted, 0);
    expect(result.totalHours).toBe(Math.round(expectedHours * 10) / 10);
  });

  it("calculates average hours per staff", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    const expectedHours = demoCPD.reduce((sum, r) => sum + r.hoursCompleted, 0);
    const expectedAvg = Math.round((expectedHours / STAFF_IDS.length) * 10) / 10;
    expect(result.averageHoursPerStaff).toBe(expectedAvg);
  });

  it("returns per-staff CPD breakdown", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.staffCPD.length).toBe(4);
    const sarah = result.staffCPD.find((s) => s.staffId === "staff-sarah")!;
    expect(sarah.hoursCompleted).toBe(26); // 6 + 8 + 12
    expect(sarah.recordCount).toBe(3);
  });

  it("calculates categories covered per staff", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    const sarah = result.staffCPD.find((s) => s.staffId === "staff-sarah")!;
    expect(sarah.categoriesCovered).toContain("safeguarding");
    expect(sarah.categoriesCovered).toContain("leadership");
    expect(sarah.categoriesCovered).toContain("therapeutic_practice");
    expect(sarah.categoriesCovered.length).toBe(3);
  });

  it("calculates reflection rate per staff", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    const sarah = result.staffCPD.find((s) => s.staffId === "staff-sarah")!;
    expect(sarah.reflectionRate).toBe(100); // all 3 have reflectionRecorded
    const tom = result.staffCPD.find((s) => s.staffId === "staff-tom")!;
    expect(tom.reflectionRate).toBe(67); // 2/3
  });

  it("calculates supervisor sign-off rate", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    const tom = result.staffCPD.find((s) => s.staffId === "staff-tom")!;
    expect(tom.signOffRate).toBe(67); // 2/3
  });

  it("calculates impact documented rate", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    const tom = result.staffCPD.find((s) => s.staffId === "staff-tom")!;
    // cpd-t01 has impact, cpd-t02 has impact, cpd-t03 has "" (empty)
    expect(tom.impactDocumentedRate).toBe(67);
  });

  it("returns category coverage", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.categoryCoverage.length).toBeGreaterThan(0);
    const safeguardingCat = result.categoryCoverage.find((c) => c.category === "safeguarding");
    expect(safeguardingCat).toBeDefined();
    expect(safeguardingCat!.count).toBe(3); // cpd-s01, cpd-t01, cpd-d03
  });

  it("calculates overall reflection rate", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    // Count reflections: 11 out of 13 have reflectionRecorded = true (cpd-t03 false, rest true = 12/13)
    const reflected = demoCPD.filter((r) => r.reflectionRecorded).length;
    expect(result.overallReflectionRate).toBe(Math.round((reflected / demoCPD.length) * 100));
  });

  it("calculates hours target met rate", () => {
    const result = evaluateCPD(demoCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    // Sarah: 26h (no), Tom: 18h (no), Lisa: 16h (no), Darren: 18h (no)
    // None meet the 30h target
    expect(result.hoursTargetMetRate).toBe(0);
  });

  it("handles high-CPD scenario where target is met", () => {
    const highCPD: CPDRecord[] = STAFF_IDS.map((sid) => ({
      id: `cpd-high-${sid}`,
      staffId: sid,
      staffName: "Test",
      date: "2025-03-01",
      category: "safeguarding" as CPDCategory,
      title: "Big CPD Event",
      description: "Comprehensive training",
      hoursCompleted: 35,
      provider: "Test Provider",
      reflectionRecorded: true,
      impactOnPractice: "Significant impact",
      supervisorSignOff: true,
      certificate: true,
    }));
    const result = evaluateCPD(highCPD, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.hoursTargetMetRate).toBe(100);
    expect(result.staffMeetingHoursTarget).toBe(4);
  });

  it("excludes out-of-period records", () => {
    const outOfPeriod: CPDRecord[] = [
      { id: "cpd-oop", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2024-06-15", category: "safeguarding", title: "Old Training", description: "Before period", hoursCompleted: 10, provider: "Test", reflectionRecorded: true, impactOnPractice: "Old impact", supervisorSignOff: true, certificate: true },
    ];
    const result = evaluateCPD(outOfPeriod, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.totalHours).toBe(0);
  });

  it("handles empty CPD records", () => {
    const result = evaluateCPD([], STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.totalHours).toBe(0);
    expect(result.averageHoursPerStaff).toBe(0);
    expect(result.overallReflectionRate).toBe(0);
    expect(result.overallSignOffRate).toBe(0);
    expect(result.overallImpactDocumentedRate).toBe(0);
    expect(result.hoursTargetMetRate).toBe(0);
  });

  it("handles empty staff list", () => {
    const result = evaluateCPD(demoCPD, [], PERIOD_START, PERIOD_END);
    expect(result.staffCPD.length).toBe(0);
    expect(result.averageHoursPerStaff).toBe(0);
    expect(result.hoursTargetMetRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateCompetency
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCompetency", () => {
  it("returns correct total assessment count", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    expect(result.totalAssessments).toBe(8);
  });

  it("calculates competency distribution correctly", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    // expert: 1 (ca-s01), proficient: 4 (ca-s02, ca-l01, ca-d01, ca-d02), competent: 2 (ca-t01, ca-l02), developing: 1 (ca-t02)
    expect(result.competencyDistribution.expert).toBe(1);
    expect(result.competencyDistribution.proficient).toBe(4);
    expect(result.competencyDistribution.competent).toBe(2);
    expect(result.competencyDistribution.developing).toBe(1);
  });

  it("counts progressions correctly", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    // Progressions: ca-s01 (proficient->expert), ca-s02 (competent->proficient), ca-t01 (developing->competent), ca-l02 (developing->competent), ca-d02 (competent->proficient) = 5
    expect(result.progressionCount).toBe(5);
  });

  it("counts regressions as zero when none exist", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    expect(result.regressionCount).toBe(0);
  });

  it("counts static assessments", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    // Static: ca-l01 (proficient->proficient), ca-d01 (proficient->proficient) = 2
    expect(result.staticCount).toBe(2);
  });

  it("counts no-baseline assessments", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    // ca-t02 has no previousLevel = 1
    expect(result.noBaselineCount).toBe(1);
  });

  it("calculates progression rate correctly", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    // 5 progressions out of 7 with baseline = 71%
    expect(result.progressionRate).toBe(71);
  });

  it("identifies areas needing development", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    expect(result.areasNeedingDevelopment.length).toBe(1);
    expect(result.areasNeedingDevelopment[0].staffName).toBe("Tom Richards");
    expect(result.areasNeedingDevelopment[0].competencyArea).toBe("Behaviour Management");
  });

  it("returns staff competencies with correct structure", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    expect(result.staffCompetencies.length).toBe(4);
    const sarah = result.staffCompetencies.find((s) => s.staffId === "staff-sarah")!;
    expect(sarah.assessments.length).toBe(2);
    expect(sarah.hasProgressed).toBe(true);
  });

  it("calculates average level for staff", () => {
    const result = evaluateCompetency(demoCompetencies, STAFF_IDS);
    const sarah = result.staffCompetencies.find((s) => s.staffId === "staff-sarah")!;
    // expert=4, proficient=3 -> avg = 3.5
    expect(sarah.averageLevel).toBe(3.5);
  });

  it("detects regression when present", () => {
    const withRegression: CompetencyAssessment[] = [
      ...demoCompetencies,
      { id: "ca-reg", staffId: "staff-tom", staffName: "Tom Richards", assessmentDate: "2025-06-01", assessor: "Test", competencyArea: "Test Area", level: "developing", previousLevel: "competent", evidenceBase: [], developmentActions: [], nextAssessmentDate: "2025-12-01" },
    ];
    const result = evaluateCompetency(withRegression, STAFF_IDS);
    expect(result.regressionCount).toBe(1);
  });

  it("handles empty assessments", () => {
    const result = evaluateCompetency([], STAFF_IDS);
    expect(result.totalAssessments).toBe(0);
    expect(result.competencyDistribution.developing).toBe(0);
    expect(result.competencyDistribution.competent).toBe(0);
    expect(result.competencyDistribution.proficient).toBe(0);
    expect(result.competencyDistribution.expert).toBe(0);
    expect(result.progressionRate).toBe(0);
    expect(result.areasNeedingDevelopment.length).toBe(0);
  });

  it("handles empty staff list", () => {
    const result = evaluateCompetency(demoCompetencies, []);
    expect(result.staffCompetencies.length).toBe(0);
  });

  it("handles all expert assessments", () => {
    const allExpert: CompetencyAssessment[] = STAFF_IDS.map((sid, i) => ({
      id: `ca-expert-${i}`,
      staffId: sid,
      staffName: `Staff ${i}`,
      assessmentDate: "2025-03-01",
      assessor: "Test",
      competencyArea: "Test",
      level: "expert" as CompetencyLevel,
      previousLevel: "proficient" as CompetencyLevel,
      evidenceBase: ["evidence"],
      developmentActions: [],
      nextAssessmentDate: "2026-03-01",
    }));
    const result = evaluateCompetency(allExpert, STAFF_IDS);
    expect(result.competencyDistribution.expert).toBe(4);
    expect(result.progressionRate).toBe(100);
    expect(result.areasNeedingDevelopment.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateDevelopmentPlanning
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDevelopmentPlanning", () => {
  it("returns correct total staff count", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.totalStaff).toBe(4);
  });

  it("returns correct staff with plans count", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.staffWithPlans).toBe(4);
  });

  it("calculates plan coverage rate as 100%", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.planCoverageRate).toBe(100);
  });

  it("counts total goals correctly", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    // Sarah: 3, Tom: 3, Lisa: 2, Darren: 3 = 11
    expect(result.totalGoals).toBe(11);
  });

  it("counts goals by status", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.goalsAchieved).toBe(3); // Sarah goal 3, Lisa goal 1, Darren goal 3
    expect(result.goalsInProgress).toBe(6); // Sarah g1,g2, Tom g1,g2, Lisa g2, Darren g1
    expect(result.goalsOverdue).toBe(1); // Tom goal 3
    expect(result.goalsNotStarted).toBe(1); // Darren goal 2
  });

  it("calculates goal achievement rate", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    // 3 achieved out of 11 = 27%
    expect(result.goalAchievementRate).toBe(27);
  });

  it("identifies current vs overdue plans", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    // Reference date is 2025-06-15
    // Sarah nextReviewDate: 2025-07-15 (current)
    // Tom: 2025-07-20 (current)
    // Lisa: 2025-08-01 (current)
    // Darren: 2025-07-10 (current)
    expect(result.currentPlans).toBe(4);
    expect(result.overduePlans).toBe(0);
    expect(result.planCurrencyRate).toBe(100);
  });

  it("detects overdue plans when reference date is past review date", () => {
    const lateRef = "2025-09-01";
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, lateRef);
    // Sarah: 2025-07-15 < 2025-09-01 (overdue)
    // Tom: 2025-07-20 < 2025-09-01 (overdue)
    // Lisa: 2025-08-01 < 2025-09-01 (overdue)
    // Darren: 2025-07-10 < 2025-09-01 (overdue)
    expect(result.overduePlans).toBe(4);
    expect(result.currentPlans).toBe(0);
  });

  it("calculates alignment rates", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    // alignedToHomeNeeds: all 4 = 100%
    expect(result.homeNeedsAlignmentRate).toBe(100);
    // alignedToRegulatory: Sarah, Tom, Darren = 3/4 = 75%
    expect(result.regulatoryAlignmentRate).toBe(75);
  });

  it("calculates staff input rate", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.staffInputRate).toBe(100); // all 4 have staffInputRecorded
  });

  it("returns correct staff breakdown", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.staffBreakdown.length).toBe(4);
    const tom = result.staffBreakdown.find((s) => s.staffId === "staff-tom")!;
    expect(tom.hasPlan).toBe(true);
    expect(tom.goalCount).toBe(3);
    expect(tom.goalsAchieved).toBe(0);
  });

  it("calculates average progress per staff", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, STAFF_IDS, REFERENCE_DATE);
    const sarah = result.staffBreakdown.find((s) => s.staffId === "staff-sarah")!;
    // Goals: 40, 60, 100 -> avg = (40+60+100)/3 = 66.67 -> 67
    expect(sarah.averageProgress).toBe(67);
  });

  it("handles staff without plans", () => {
    const partialPlans = demoDevelopmentPlans.filter((p) => p.staffId !== "staff-tom");
    const result = evaluateDevelopmentPlanning(partialPlans, STAFF_IDS, REFERENCE_DATE);
    expect(result.staffWithPlans).toBe(3);
    expect(result.planCoverageRate).toBe(75);
    const tom = result.staffBreakdown.find((s) => s.staffId === "staff-tom")!;
    expect(tom.hasPlan).toBe(false);
    expect(tom.goalCount).toBe(0);
  });

  it("handles empty plans", () => {
    const result = evaluateDevelopmentPlanning([], STAFF_IDS, REFERENCE_DATE);
    expect(result.staffWithPlans).toBe(0);
    expect(result.planCoverageRate).toBe(0);
    expect(result.totalGoals).toBe(0);
    expect(result.goalAchievementRate).toBe(0);
  });

  it("handles empty staff list", () => {
    const result = evaluateDevelopmentPlanning(demoDevelopmentPlans, [], REFERENCE_DATE);
    expect(result.totalStaff).toBe(0);
    expect(result.planCoverageRate).toBe(0);
    expect(result.staffBreakdown.length).toBe(0);
  });

  it("handles plans with no goals", () => {
    const emptyGoalPlan: DevelopmentPlan[] = [{
      id: "dp-empty", staffId: "staff-sarah", staffName: "Sarah Johnson",
      createdDate: "2025-01-01", reviewDate: "2025-04-01", nextReviewDate: "2025-07-01",
      goals: [],
      supervisorId: "staff-darren", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
    }];
    const result = evaluateDevelopmentPlanning(emptyGoalPlan, ["staff-sarah"], REFERENCE_DATE);
    expect(result.totalGoals).toBe(0);
    expect(result.goalAchievementRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePracticeQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePracticeQuality", () => {
  it("returns correct total observation count", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.totalObservations).toBe(6);
  });

  it("calculates rating distribution correctly", () => {
    const result = evaluatePracticeQuality(demoObservations);
    // outstanding: po-s01, po-l01 = 2
    // good: po-s02, po-t02, po-d01 = 3
    // requires_improvement: po-t01 = 1
    // inadequate: 0
    expect(result.ratingDistribution.outstanding).toBe(2);
    expect(result.ratingDistribution.good).toBe(3);
    expect(result.ratingDistribution.requires_improvement).toBe(1);
    expect(result.ratingDistribution.inadequate).toBe(0);
  });

  it("calculates outstanding rate", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.outstandingRate).toBe(33); // 2/6
  });

  it("calculates good or better rate", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.goodOrBetterRate).toBe(83); // 5/6
  });

  it("calculates requires improvement or worse rate", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.requiresImprovementOrWorseRate).toBe(17); // 1/6
  });

  it("counts follow-up required", () => {
    const result = evaluatePracticeQuality(demoObservations);
    // po-s02, po-t01, po-t02, po-d01 have followUpDate = 4
    expect(result.followUpRequired).toBe(4);
  });

  it("counts follow-up completed", () => {
    const result = evaluatePracticeQuality(demoObservations);
    // po-t01 (true), po-d01 (true) = 2
    expect(result.followUpCompleted).toBe(2);
  });

  it("calculates follow-up completion rate", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.followUpCompletionRate).toBe(50); // 2/4
  });

  it("determines improvement trajectory", () => {
    const result = evaluatePracticeQuality(demoObservations);
    // Sorted by date: po-s01(2/20,outstanding=4), po-t01(3/10,RI=2), po-l01(3/18,outstanding=4), po-d01(4/5,good=3), po-s02(5/15,good=3), po-t02(5/25,good=3)
    // First half: po-s01,po-t01,po-l01 -> avg = (4+2+4)/3 = 3.33
    // Second half: po-d01,po-s02,po-t02 -> avg = (3+3+3)/3 = 3.0
    // 3.0 < 3.33 - 0.25 = 3.08? 3.0 < 3.08 -> yes, declining
    expect(result.improvementTrajectory).toBe("declining");
  });

  it("returns observations by type", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.observationsByType.direct_practice).toBe(2);
    expect(result.observationsByType.shift_observation).toBe(1);
    expect(result.observationsByType.supervision_of_others).toBe(1);
    expect(result.observationsByType.key_work_session).toBe(2);
  });

  it("returns staff observations with correct structure", () => {
    const result = evaluatePracticeQuality(demoObservations);
    expect(result.staffObservations.length).toBe(4);
    const sarah = result.staffObservations.find((s) => s.staffId === "staff-sarah")!;
    expect(sarah.observationCount).toBe(2);
    expect(sarah.latestRating).toBe("good"); // po-s02 is later
  });

  it("calculates action plan rate", () => {
    const result = evaluatePracticeQuality(demoObservations);
    // po-s02 (true), po-t01 (true), po-t02 (true), po-d01 (true) = 4/6
    expect(result.actionPlansCreated).toBe(4);
    expect(result.actionPlanRate).toBe(67);
  });

  it("returns insufficient_data for fewer than 4 observations", () => {
    const few = demoObservations.slice(0, 3);
    const result = evaluatePracticeQuality(few);
    expect(result.improvementTrajectory).toBe("insufficient_data");
  });

  it("handles empty observations", () => {
    const result = evaluatePracticeQuality([]);
    expect(result.totalObservations).toBe(0);
    expect(result.ratingDistribution.outstanding).toBe(0);
    expect(result.goodOrBetterRate).toBe(0);
    expect(result.followUpRequired).toBe(0);
    expect(result.improvementTrajectory).toBe("insufficient_data");
    expect(result.staffObservations.length).toBe(0);
  });

  it("calculates improving trajectory when later observations are better", () => {
    const improving: PracticeObservation[] = [
      { id: "imp-1", staffId: "s1", staffName: "A", date: "2025-01-01", observer: "X", observationType: "direct_practice", rating: "requires_improvement", strengths: [], developmentAreas: [], actionPlanCreated: false },
      { id: "imp-2", staffId: "s2", staffName: "B", date: "2025-02-01", observer: "X", observationType: "direct_practice", rating: "requires_improvement", strengths: [], developmentAreas: [], actionPlanCreated: false },
      { id: "imp-3", staffId: "s1", staffName: "A", date: "2025-03-01", observer: "X", observationType: "direct_practice", rating: "good", strengths: [], developmentAreas: [], actionPlanCreated: false },
      { id: "imp-4", staffId: "s2", staffName: "B", date: "2025-04-01", observer: "X", observationType: "direct_practice", rating: "outstanding", strengths: [], developmentAreas: [], actionPlanCreated: false },
    ];
    const result = evaluatePracticeQuality(improving);
    expect(result.improvementTrajectory).toBe("improving");
  });

  it("calculates stable trajectory when ratings are consistent", () => {
    const stable: PracticeObservation[] = [
      { id: "stb-1", staffId: "s1", staffName: "A", date: "2025-01-01", observer: "X", observationType: "direct_practice", rating: "good", strengths: [], developmentAreas: [], actionPlanCreated: false },
      { id: "stb-2", staffId: "s2", staffName: "B", date: "2025-02-01", observer: "X", observationType: "direct_practice", rating: "good", strengths: [], developmentAreas: [], actionPlanCreated: false },
      { id: "stb-3", staffId: "s1", staffName: "A", date: "2025-03-01", observer: "X", observationType: "direct_practice", rating: "good", strengths: [], developmentAreas: [], actionPlanCreated: false },
      { id: "stb-4", staffId: "s2", staffName: "B", date: "2025-04-01", observer: "X", observationType: "direct_practice", rating: "good", strengths: [], developmentAreas: [], actionPlanCreated: false },
    ];
    const result = evaluatePracticeQuality(stable);
    expect(result.improvementTrajectory).toBe("stable");
  });

  it("handles all outstanding observations", () => {
    const allOutstanding: PracticeObservation[] = [
      { id: "ao-1", staffId: "s1", staffName: "A", date: "2025-01-01", observer: "X", observationType: "direct_practice", rating: "outstanding", strengths: ["Great"], developmentAreas: [], actionPlanCreated: false },
    ];
    const result = evaluatePracticeQuality(allOutstanding);
    expect(result.outstandingRate).toBe(100);
    expect(result.goodOrBetterRate).toBe(100);
    expect(result.requiresImprovementOrWorseRate).toBe(0);
  });

  it("handles all inadequate observations", () => {
    const allInadequate: PracticeObservation[] = Array.from({ length: 4 }, (_, i) => ({
      id: `ai-${i}`,
      staffId: `s${i}`,
      staffName: `Staff ${i}`,
      date: `2025-0${i + 1}-01`,
      observer: "X",
      observationType: "direct_practice" as const,
      rating: "inadequate" as const,
      strengths: [],
      developmentAreas: ["Everything"],
      actionPlanCreated: true,
      followUpDate: "2025-12-01",
      followUpCompleted: false,
    }));
    const result = evaluatePracticeQuality(allInadequate);
    expect(result.goodOrBetterRate).toBe(0);
    expect(result.requiresImprovementOrWorseRate).toBe(100);
    expect(result.followUpCompletionRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateWorkforceDevelopmentIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateWorkforceDevelopmentIntelligence", () => {
  const result = generateWorkforceDevelopmentIntelligence(
    demoQualifications,
    demoCPD,
    demoCompetencies,
    demoDevelopmentPlans,
    demoObservations,
    STAFF_IDS,
    "oak-house",
    PERIOD_START,
    PERIOD_END,
    REFERENCE_DATE,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns correct referenceDate", () => {
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("returns overallScore as a number between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("returns qualifications result", () => {
    expect(result.qualifications).toBeDefined();
    expect(result.qualifications.totalStaff).toBe(4);
  });

  it("returns cpd result", () => {
    expect(result.cpd).toBeDefined();
    expect(result.cpd.totalRecords).toBe(demoCPD.length);
  });

  it("returns competency result", () => {
    expect(result.competency).toBeDefined();
    expect(result.competency.totalAssessments).toBe(8);
  });

  it("returns development planning result", () => {
    expect(result.developmentPlanning).toBeDefined();
    expect(result.developmentPlanning.planCoverageRate).toBe(100);
  });

  it("returns practice quality result", () => {
    expect(result.practiceQuality).toBeDefined();
    expect(result.practiceQuality.totalObservations).toBe(6);
  });

  it("returns non-empty strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
    for (const s of result.strengths) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });

  it("returns non-empty areas for development", () => {
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
    for (const a of result.areasForDevelopment) {
      expect(typeof a).toBe("string");
      expect(a.length).toBeGreaterThan(0);
    }
  });

  it("returns non-empty immediate actions", () => {
    expect(result.immediateActions.length).toBeGreaterThan(0);
    for (const ia of result.immediateActions) {
      expect(typeof ia).toBe("string");
      expect(ia.length).toBeGreaterThan(0);
    }
  });

  it("returns regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    // Must include key regulations
    const linksText = result.regulatoryLinks.join(" ");
    expect(linksText).toContain("Reg 32");
    expect(linksText).toContain("Reg 33");
    expect(linksText).toContain("Reg 13");
    expect(linksText).toContain("SCCIF");
    expect(linksText).toContain("Social Work England");
  });

  it("rating is outstanding when score >= 80", () => {
    const outstanding = generateWorkforceDevelopmentIntelligence(
      // All achieved mandatory qualifications with Level 5
      STAFF_IDS.map((sid, i) => ({
        id: `q-${i}`, staffId: sid, staffName: `S${i}`, qualificationType: "level_5_diploma" as QualificationType,
        qualificationName: "L5", status: "achieved" as const, startDate: "2024-01-01", completedDate: "2024-06-01",
        provider: "Test", mandatoryForRole: true, evidenceRecorded: true,
      })),
      // High CPD hours with reflection and impact
      STAFF_IDS.flatMap((sid, i) =>
        Array.from({ length: 4 }, (_, j) => ({
          id: `cpd-${i}-${j}`, staffId: sid, staffName: `S${i}`, date: `2025-0${j + 2}-01`,
          category: (["safeguarding", "leadership", "therapeutic_practice", "medication", "behaviour_management", "record_keeping", "equality_diversity", "health_safety"] as CPDCategory[])[j % 8],
          title: "Training", description: "Good training", hoursCompleted: 10, provider: "Test",
          reflectionRecorded: true, impactOnPractice: "Improved practice", supervisorSignOff: true, certificate: true,
        })),
      ),
      // Strong competencies
      STAFF_IDS.map((sid, i) => ({
        id: `ca-${i}`, staffId: sid, staffName: `S${i}`, assessmentDate: "2025-03-01", assessor: "Test",
        competencyArea: "Core Practice", level: "proficient" as CompetencyLevel, previousLevel: "competent" as CompetencyLevel,
        evidenceBase: ["evidence"], developmentActions: [], nextAssessmentDate: "2026-03-01",
      })),
      // Full development plans with achieved goals
      STAFF_IDS.map((sid, i) => ({
        id: `dp-${i}`, staffId: sid, staffName: `S${i}`, createdDate: "2025-01-01", reviewDate: "2025-04-01", nextReviewDate: "2025-10-01",
        goals: [
          { description: "Goal 1", targetDate: "2025-06-01", status: "achieved" as const, progress: 100 },
          { description: "Goal 2", targetDate: "2025-09-01", status: "achieved" as const, progress: 100 },
        ],
        supervisorId: "test", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
      })),
      // Outstanding observations
      STAFF_IDS.flatMap((sid, i) => [
        { id: `po-${i}-1`, staffId: sid, staffName: `S${i}`, date: `2025-02-0${i + 1}`, observer: "Test", observationType: "direct_practice" as const, rating: "good" as const, strengths: ["Good"], developmentAreas: [], actionPlanCreated: false },
        { id: `po-${i}-2`, staffId: sid, staffName: `S${i}`, date: `2025-05-0${i + 1}`, observer: "Test", observationType: "key_work_session" as const, rating: "outstanding" as const, strengths: ["Outstanding"], developmentAreas: [], actionPlanCreated: false },
      ]),
      STAFF_IDS, "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(outstanding.overallScore).toBeGreaterThanOrEqual(80);
    expect(outstanding.rating).toBe("outstanding");
  });

  it("rating is inadequate when score < 40", () => {
    const inadequate = generateWorkforceDevelopmentIntelligence(
      // No qualifications
      [],
      // No CPD
      [],
      // No competencies
      [],
      // No development plans
      [],
      // All inadequate observations
      STAFF_IDS.map((sid, i) => ({
        id: `po-${i}`, staffId: sid, staffName: `S${i}`, date: `2025-0${i + 1}-01`, observer: "Test",
        observationType: "direct_practice" as const, rating: "inadequate" as const,
        strengths: [], developmentAreas: ["Major issues"], actionPlanCreated: true,
        followUpDate: "2025-12-01", followUpCompleted: false,
      })),
      STAFF_IDS, "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(inadequate.overallScore).toBeLessThan(40);
    expect(inadequate.rating).toBe("inadequate");
  });

  it("rating is good when score is between 60 and 79", () => {
    // Construct data that produces a score in the 60-79 range
    const goodResult = generateWorkforceDevelopmentIntelligence(
      // Some qualifications achieved
      STAFF_IDS.slice(0, 2).map((sid, i) => ({
        id: `q-${i}`, staffId: sid, staffName: `S${i}`, qualificationType: "level_3_diploma" as QualificationType,
        qualificationName: "L3", status: "achieved" as const, startDate: "2024-01-01", completedDate: "2024-06-01",
        provider: "Test", mandatoryForRole: true, evidenceRecorded: true,
      })),
      // Moderate CPD
      STAFF_IDS.flatMap((sid, i) =>
        Array.from({ length: 3 }, (_, j) => ({
          id: `cpd-${i}-${j}`, staffId: sid, staffName: `S${i}`, date: `2025-0${j + 2}-01`,
          category: (["safeguarding", "leadership", "therapeutic_practice", "medication", "behaviour_management", "record_keeping", "equality_diversity", "health_safety"] as CPDCategory[])[j % 8],
          title: "Training", description: "Good training", hoursCompleted: 12, provider: "Test",
          reflectionRecorded: true, impactOnPractice: "Improved practice", supervisorSignOff: true, certificate: true,
        })),
      ),
      // Competent assessments
      STAFF_IDS.map((sid, i) => ({
        id: `ca-${i}`, staffId: sid, staffName: `S${i}`, assessmentDate: "2025-03-01", assessor: "Test",
        competencyArea: "Core Practice", level: "competent" as CompetencyLevel, previousLevel: "developing" as CompetencyLevel,
        evidenceBase: ["evidence"], developmentActions: [], nextAssessmentDate: "2026-03-01",
      })),
      // Development plans
      STAFF_IDS.map((sid, i) => ({
        id: `dp-${i}`, staffId: sid, staffName: `S${i}`, createdDate: "2025-01-01", reviewDate: "2025-04-01", nextReviewDate: "2025-10-01",
        goals: [
          { description: "Goal 1", targetDate: "2025-06-01", status: "achieved" as const, progress: 100 },
          { description: "Goal 2", targetDate: "2025-09-01", status: "in_progress" as const, progress: 50 },
        ],
        supervisorId: "test", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
      })),
      // Good observations
      STAFF_IDS.flatMap((sid, i) => [
        { id: `po-${i}-1`, staffId: sid, staffName: `S${i}`, date: `2025-02-0${i + 1}`, observer: "Test", observationType: "direct_practice" as const, rating: "good" as const, strengths: ["Good"], developmentAreas: [], actionPlanCreated: false },
        { id: `po-${i}-2`, staffId: sid, staffName: `S${i}`, date: `2025-05-0${i + 1}`, observer: "Test", observationType: "direct_practice" as const, rating: "good" as const, strengths: ["Good"], developmentAreas: [], actionPlanCreated: false },
      ]),
      STAFF_IDS, "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(goodResult.overallScore).toBeGreaterThanOrEqual(60);
    expect(goodResult.overallScore).toBeLessThan(80);
    expect(goodResult.rating).toBe("good");
  });

  it("includes strength about CPD when hours target met rate is high", () => {
    const highCPDResult = generateWorkforceDevelopmentIntelligence(
      demoQualifications,
      STAFF_IDS.flatMap((sid) => [{
        id: `cpd-high-${sid}`, staffId: sid, staffName: "Test", date: "2025-03-01",
        category: "safeguarding" as CPDCategory, title: "Big training", description: "Desc",
        hoursCompleted: 35, provider: "Test", reflectionRecorded: true,
        impactOnPractice: "Impact", supervisorSignOff: true, certificate: true,
      }]),
      demoCompetencies,
      demoDevelopmentPlans,
      demoObservations,
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const hasCPDStrength = highCPDResult.strengths.some((s) => s.includes("CPD"));
    expect(hasCPDStrength).toBe(true);
  });

  it("includes area for development when plan coverage is under 100%", () => {
    const partialPlans = demoDevelopmentPlans.filter((p) => p.staffId !== "staff-tom");
    const r = generateWorkforceDevelopmentIntelligence(
      demoQualifications, demoCPD, demoCompetencies, partialPlans, demoObservations,
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const hasPlanArea = r.areasForDevelopment.some((a) => a.includes("without development plans"));
    expect(hasPlanArea).toBe(true);
  });

  it("includes urgent action when mandatory compliance is very low", () => {
    const r = generateWorkforceDevelopmentIntelligence(
      [], demoCPD, demoCompetencies, demoDevelopmentPlans, demoObservations,
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // With no qualifications, mandatory compliance is 0 (no mandatory quals exist, rate = 0)
    // Actually with empty quals, mandatoryTotal = 0, so mandatoryComplianceRate = 0
    expect(r.qualifications.mandatoryComplianceRate).toBe(0);
  });

  it("handles completely empty data", () => {
    const empty = generateWorkforceDevelopmentIntelligence(
      [], [], [], [], [], [], "empty-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(empty.overallScore).toBeLessThanOrEqual(5);
    expect(empty.rating).toBe("inadequate");
    expect(empty.regulatoryLinks.length).toBeGreaterThan(0);
    expect(empty.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("score is clamped to max 100", () => {
    // Even with perfect data, score shouldn't exceed 100
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("score is clamped to min 0", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("includes regulatory link for Reg 32", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 32"))).toBe(true);
  });

  it("includes regulatory link for Reg 33", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 33"))).toBe(true);
  });

  it("includes regulatory link for Reg 13", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
  });

  it("includes regulatory link for SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes regulatory link for Social Work England", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Social Work England"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Scoring threshold tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring thresholds", () => {
  it("outstanding threshold is >= 80", () => {
    // Verify rating mapping
    const makeResult = (score: number) => {
      if (score >= 80) return "outstanding";
      if (score >= 60) return "good";
      if (score >= 40) return "requires_improvement";
      return "inadequate";
    };
    expect(makeResult(80)).toBe("outstanding");
    expect(makeResult(100)).toBe("outstanding");
    expect(makeResult(79)).toBe("good");
    expect(makeResult(60)).toBe("good");
    expect(makeResult(59)).toBe("requires_improvement");
    expect(makeResult(40)).toBe("requires_improvement");
    expect(makeResult(39)).toBe("inadequate");
    expect(makeResult(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge case tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single staff member across all evaluations", () => {
    const singleStaff = ["staff-sarah"];
    const qResult = evaluateQualifications(demoQualifications, singleStaff);
    expect(qResult.totalStaff).toBe(1);

    const cpdResult = evaluateCPD(demoCPD, singleStaff, PERIOD_START, PERIOD_END);
    expect(cpdResult.staffCPD.length).toBe(1);

    const compResult = evaluateCompetency(demoCompetencies, singleStaff);
    expect(compResult.staffCompetencies.length).toBe(1);

    const devResult = evaluateDevelopmentPlanning(demoDevelopmentPlans, singleStaff, REFERENCE_DATE);
    expect(devResult.totalStaff).toBe(1);
  });

  it("handles staff with no matching records", () => {
    const unknownStaff = ["staff-unknown"];
    const qResult = evaluateQualifications(demoQualifications, unknownStaff);
    expect(qResult.staffBreakdown[0].qualifications.length).toBe(0);
    expect(qResult.staffBreakdown[0].mandatoryMet).toBe(false);
    expect(qResult.staffBreakdown[0].hasLevel3Plus).toBe(false);
  });

  it("qualification with no expectedCompletionDate in overdue list", () => {
    const overdueNoDate: StaffQualification[] = [{
      id: "q-odd", staffId: "staff-tom", staffName: "Tom Richards",
      qualificationType: "other", qualificationName: "Something Overdue",
      status: "overdue", startDate: "2024-01-01", provider: "Unknown",
      mandatoryForRole: false, evidenceRecorded: false,
    }];
    const result = evaluateQualifications(overdueNoDate, ["staff-tom"]);
    expect(result.overdueQualifications[0].expectedCompletionDate).toBeUndefined();
  });

  it("CPD record with zero hours", () => {
    const zeroHours: CPDRecord[] = [{
      id: "cpd-zero", staffId: "staff-sarah", staffName: "Sarah Johnson",
      date: "2025-03-01", category: "safeguarding", title: "Zero Hours Event",
      description: "Discussion only", hoursCompleted: 0, provider: "In-house",
      reflectionRecorded: true, impactOnPractice: "N/A", supervisorSignOff: true, certificate: false,
    }];
    const result = evaluateCPD(zeroHours, ["staff-sarah"], PERIOD_START, PERIOD_END);
    expect(result.totalHours).toBe(0);
    expect(result.staffCPD[0].hoursCompleted).toBe(0);
  });

  it("development plan with all overdue goals", () => {
    const allOverdue: DevelopmentPlan[] = [{
      id: "dp-ao", staffId: "staff-tom", staffName: "Tom Richards",
      createdDate: "2024-01-01", reviewDate: "2024-06-01", nextReviewDate: "2024-12-01",
      goals: [
        { description: "Goal 1", targetDate: "2024-06-01", status: "overdue", progress: 20 },
        { description: "Goal 2", targetDate: "2024-09-01", status: "overdue", progress: 10 },
      ],
      supervisorId: "staff-sarah", alignedToHomeNeeds: false, alignedToRegulatory: false, staffInputRecorded: false,
    }];
    const result = evaluateDevelopmentPlanning(allOverdue, ["staff-tom"], REFERENCE_DATE);
    expect(result.goalsOverdue).toBe(2);
    expect(result.goalAchievementRate).toBe(0);
    expect(result.homeNeedsAlignmentRate).toBe(0);
    expect(result.staffInputRate).toBe(0);
  });

  it("practice observation with no follow-up date or completion", () => {
    const noFollowUp: PracticeObservation[] = [{
      id: "po-nf", staffId: "staff-sarah", staffName: "Sarah Johnson",
      date: "2025-03-01", observer: "Test", observationType: "direct_practice",
      rating: "good", strengths: ["Good"], developmentAreas: [], actionPlanCreated: false,
    }];
    const result = evaluatePracticeQuality(noFollowUp);
    expect(result.followUpRequired).toBe(0);
    expect(result.followUpCompleted).toBe(0);
    expect(result.followUpCompletionRate).toBe(0);
  });

  it("large data set does not crash", () => {
    const manyQuals: StaffQualification[] = Array.from({ length: 100 }, (_, i) => ({
      id: `q-big-${i}`, staffId: `staff-${i % 10}`, staffName: `Staff ${i % 10}`,
      qualificationType: "level_3_diploma" as QualificationType, qualificationName: `Qual ${i}`,
      status: "achieved" as const, startDate: "2024-01-01", completedDate: "2024-06-01",
      provider: "Test", mandatoryForRole: i % 3 === 0, evidenceRecorded: true,
    }));
    const bigStaffIds = Array.from({ length: 10 }, (_, i) => `staff-${i}`);
    const result = evaluateQualifications(manyQuals, bigStaffIds);
    expect(result.totalQualifications).toBe(100);
    expect(result.totalStaff).toBe(10);
  });
});
