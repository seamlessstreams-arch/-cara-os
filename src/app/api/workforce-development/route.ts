// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Workforce Development Intelligence API Route
//
// GET  → returns Chamberlain House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateWorkforceDevelopmentIntelligence } from "@/lib/workforce-development/workforce-development-engine";
import type {
  StaffQualification,
  CPDRecord,
  CompetencyAssessment,
  DevelopmentPlan,
  PracticeObservation,
} from "@/lib/workforce-development/workforce-development-engine";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  qualifications: StaffQualification[];
  cpd: CPDRecord[];
  competencies: CompetencyAssessment[];
  plans: DevelopmentPlan[];
  observations: PracticeObservation[];
  staffIds: string[];
} {
  const staffIds = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];

  const qualifications: StaffQualification[] = [
    { id: "q-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", qualificationType: "level_5_diploma", qualificationName: "Level 5 Diploma in Leadership for Health & Social Care", status: "achieved", startDate: "2018-09-01", completedDate: "2019-06-15", provider: "Open University", mandatoryForRole: true, evidenceRecorded: true },
    { id: "q-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", qualificationType: "safeguarding_advanced", qualificationName: "Advanced Safeguarding Certificate", status: "achieved", startDate: "2020-01-10", completedDate: "2020-06-20", provider: "Local Authority", mandatoryForRole: false, evidenceRecorded: true },
    { id: "q-t01", staffId: "staff-tom", staffName: "Tom Richards", qualificationType: "level_3_diploma", qualificationName: "Level 3 Diploma in Residential Childcare", status: "in_progress", startDate: "2024-01-15", expectedCompletionDate: "2025-12-31", provider: "City & Guilds", mandatoryForRole: true, evidenceRecorded: true },
    { id: "q-t02", staffId: "staff-tom", staffName: "Tom Richards", qualificationType: "first_aid", qualificationName: "First Aid at Work Certificate", status: "achieved", startDate: "2023-09-01", completedDate: "2023-09-10", provider: "Red Cross", mandatoryForRole: false, evidenceRecorded: true },
    { id: "q-l01", staffId: "staff-lisa", staffName: "Lisa Williams", qualificationType: "level_4_diploma", qualificationName: "Level 4 Diploma in Health & Social Care", status: "achieved", startDate: "2021-09-01", completedDate: "2022-11-10", provider: "Pearson", mandatoryForRole: true, evidenceRecorded: true },
    { id: "q-l02", staffId: "staff-lisa", staffName: "Lisa Williams", qualificationType: "therapeutic_care", qualificationName: "Therapeutic Crisis Intervention Certificate", status: "achieved", startDate: "2023-03-01", completedDate: "2023-06-15", provider: "Cornell University (Licensed)", mandatoryForRole: false, evidenceRecorded: true },
    { id: "q-d01", staffId: "staff-darren", staffName: "Darren Laville", qualificationType: "level_5_diploma", qualificationName: "Level 5 Diploma in Leadership for Health & Social Care", status: "in_progress", startDate: "2024-09-01", expectedCompletionDate: "2026-03-01", provider: "Open University", mandatoryForRole: true, evidenceRecorded: true },
    { id: "q-d02", staffId: "staff-darren", staffName: "Darren Laville", qualificationType: "management_qualification", qualificationName: "ILM Level 5 in Management & Leadership", status: "achieved", startDate: "2019-01-01", completedDate: "2019-12-15", provider: "ILM", mandatoryForRole: false, evidenceRecorded: true },
  ];

  const cpd: CPDRecord[] = [
    { id: "cpd-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-02-10", category: "safeguarding", title: "Advanced Safeguarding Refresher", description: "Refresher on safeguarding thresholds and referral pathways", hoursCompleted: 6, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Improved confidence in escalation decisions", supervisorSignOff: true, certificate: true },
    { id: "cpd-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-03-15", category: "leadership", title: "Reflective Leadership in Residential Care", description: "Leadership styles and reflective practice", hoursCompleted: 8, provider: "National Centre for Excellence in Residential Child Care", reflectionRecorded: true, impactOnPractice: "Adopted more coaching-based supervision approach", supervisorSignOff: true, certificate: true },
    { id: "cpd-s03", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-05-20", category: "therapeutic_practice", title: "DDP Level 1", description: "Therapeutic parenting using DDP principles", hoursCompleted: 12, provider: "DDP Network", reflectionRecorded: true, impactOnPractice: "Embedded PACE model into daily practice", supervisorSignOff: true, certificate: true },
    { id: "cpd-t01", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-02-15", category: "safeguarding", title: "Safeguarding Children Level 2", description: "Core safeguarding awareness", hoursCompleted: 6, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Better understanding of threshold decisions", supervisorSignOff: true, certificate: true },
    { id: "cpd-t02", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-04-10", category: "behaviour_management", title: "Understanding Behaviour as Communication", description: "Trauma-informed approaches to behaviour", hoursCompleted: 4, provider: "External Trainer", reflectionRecorded: true, impactOnPractice: "Shifted to connection-based approaches", supervisorSignOff: true, certificate: false },
    { id: "cpd-t03", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-06-01", category: "mental_health", title: "Mental Health First Aid", description: "Recognising and responding to mental health crises", hoursCompleted: 8, provider: "MHFA England", reflectionRecorded: false, impactOnPractice: "", supervisorSignOff: false, certificate: true },
    { id: "cpd-l01", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-01-22", category: "medication", title: "Medication Administration Refresher", description: "Safe medication administration and recording", hoursCompleted: 3, provider: "In-house", reflectionRecorded: true, impactOnPractice: "Updated medication log processes", supervisorSignOff: true, certificate: false },
    { id: "cpd-l02", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-03-12", category: "equality_diversity", title: "EDI in Children's Services", description: "Equality, diversity and inclusion", hoursCompleted: 4, provider: "External", reflectionRecorded: true, impactOnPractice: "Reviewed key work for culturally sensitive practice", supervisorSignOff: true, certificate: true },
    { id: "cpd-l03", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-04-20", category: "therapeutic_practice", title: "Attachment Theory in Practice", description: "Application of attachment theory", hoursCompleted: 6, provider: "External", reflectionRecorded: true, impactOnPractice: "Enhanced understanding of attachment patterns", supervisorSignOff: true, certificate: true },
    { id: "cpd-l04", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-06-05", category: "record_keeping", title: "Effective Record Keeping", description: "Standards for recording", hoursCompleted: 3, provider: "In-house", reflectionRecorded: true, impactOnPractice: "Improved daily log quality", supervisorSignOff: true, certificate: false },
    { id: "cpd-d01", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-01-08", category: "regulatory", title: "Regulatory Update — CHR 2015 & SCCIF", description: "Updates to regulations and inspection framework", hoursCompleted: 4, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Updated quality assurance framework", supervisorSignOff: true, certificate: false },
    { id: "cpd-d02", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-03-20", category: "leadership", title: "Managing Effective Teams", description: "Team dynamics and performance management", hoursCompleted: 8, provider: "Skills for Care", reflectionRecorded: true, impactOnPractice: "Restructured team meetings", supervisorSignOff: true, certificate: true },
    { id: "cpd-d03", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-05-10", category: "safeguarding", title: "DSL Refresher", description: "DSL responsibilities and multi-agency working", hoursCompleted: 6, provider: "Local Authority", reflectionRecorded: true, impactOnPractice: "Strengthened inter-agency protocols", supervisorSignOff: true, certificate: true },
  ];

  const competencies: CompetencyAssessment[] = [
    { id: "ca-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", assessmentDate: "2025-03-15", assessor: "Darren Laville", competencyArea: "Safeguarding Practice", level: "expert", previousLevel: "proficient", evidenceBase: ["DSL training completed", "Led safeguarding audit", "Multi-agency coordination"], developmentActions: ["Mentor junior staff on safeguarding"], nextAssessmentDate: "2025-09-15" },
    { id: "ca-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", assessmentDate: "2025-03-15", assessor: "Darren Laville", competencyArea: "Therapeutic Practice", level: "proficient", previousLevel: "competent", evidenceBase: ["DDP Level 1 completed", "PACE model observed in practice"], developmentActions: ["Complete DDP Level 2"], nextAssessmentDate: "2025-09-15" },
    { id: "ca-t01", staffId: "staff-tom", staffName: "Tom Richards", assessmentDate: "2025-04-01", assessor: "Sarah Johnson", competencyArea: "Safeguarding Practice", level: "competent", previousLevel: "developing", evidenceBase: ["Safeguarding Level 2 completed", "Appropriate referral made"], developmentActions: ["Shadow DSL in strategy meeting"], nextAssessmentDate: "2025-10-01" },
    { id: "ca-t02", staffId: "staff-tom", staffName: "Tom Richards", assessmentDate: "2025-04-01", assessor: "Sarah Johnson", competencyArea: "Behaviour Management", level: "developing", evidenceBase: ["Training attended", "Some good practice observed"], developmentActions: ["Review behaviour support plans", "Attend de-escalation training"], nextAssessmentDate: "2025-10-01" },
    { id: "ca-l01", staffId: "staff-lisa", staffName: "Lisa Williams", assessmentDate: "2025-03-20", assessor: "Darren Laville", competencyArea: "Key Working Practice", level: "proficient", previousLevel: "proficient", evidenceBase: ["Consistently high-quality key work sessions", "Positive young people feedback"], developmentActions: ["Take on mentoring role"], nextAssessmentDate: "2025-09-20" },
    { id: "ca-l02", staffId: "staff-lisa", staffName: "Lisa Williams", assessmentDate: "2025-03-20", assessor: "Darren Laville", competencyArea: "Record Keeping", level: "competent", previousLevel: "developing", evidenceBase: ["Record quality improved", "Training completed"], developmentActions: ["Achieve consistency in daily logs"], nextAssessmentDate: "2025-09-20" },
    { id: "ca-d01", staffId: "staff-darren", staffName: "Darren Laville", assessmentDate: "2025-02-28", assessor: "External Consultant", competencyArea: "Leadership & Management", level: "proficient", previousLevel: "proficient", evidenceBase: ["Reg 44 reports positive", "Staff feedback strong", "QA framework in place"], developmentActions: ["Develop succession planning"], nextAssessmentDate: "2025-08-28" },
    { id: "ca-d02", staffId: "staff-darren", staffName: "Darren Laville", assessmentDate: "2025-02-28", assessor: "External Consultant", competencyArea: "Quality Assurance", level: "proficient", previousLevel: "competent", evidenceBase: ["QA audits demonstrate improvement", "Action plans followed through"], developmentActions: ["Embed outcome measurement tools"], nextAssessmentDate: "2025-08-28" },
  ];

  const plans: DevelopmentPlan[] = [
    {
      id: "dp-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", createdDate: "2025-01-15", reviewDate: "2025-04-15", nextReviewDate: "2025-07-15",
      goals: [
        { description: "Complete DDP Level 2 training", targetDate: "2025-09-30", status: "in_progress", progress: 40 },
        { description: "Mentor two RSWs through Level 3 Diploma", targetDate: "2025-12-31", status: "in_progress", progress: 60 },
        { description: "Lead safeguarding audit for the home", targetDate: "2025-06-30", status: "achieved", progress: 100 },
      ],
      supervisorId: "staff-darren", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
    },
    {
      id: "dp-t01", staffId: "staff-tom", staffName: "Tom Richards", createdDate: "2025-01-20", reviewDate: "2025-04-20", nextReviewDate: "2025-07-20",
      goals: [
        { description: "Complete Level 3 Diploma", targetDate: "2025-12-31", status: "in_progress", progress: 50 },
        { description: "Achieve competent level in behaviour management", targetDate: "2025-09-30", status: "in_progress", progress: 30 },
        { description: "Complete equality and diversity training", targetDate: "2025-06-30", status: "overdue", progress: 0 },
      ],
      supervisorId: "staff-sarah", alignedToHomeNeeds: true, alignedToRegulatory: true, staffInputRecorded: true,
    },
    {
      id: "dp-l01", staffId: "staff-lisa", staffName: "Lisa Williams", createdDate: "2025-02-01", reviewDate: "2025-05-01", nextReviewDate: "2025-08-01",
      goals: [
        { description: "Take on mentoring role for new RSW", targetDate: "2025-06-30", status: "achieved", progress: 100 },
        { description: "Improve daily log consistency to 95%+ quality", targetDate: "2025-09-30", status: "in_progress", progress: 70 },
      ],
      supervisorId: "staff-darren", alignedToHomeNeeds: true, alignedToRegulatory: false, staffInputRecorded: true,
    },
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

  const observations: PracticeObservation[] = [
    { id: "po-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-02-20", observer: "Darren Laville", observationType: "direct_practice", rating: "outstanding", strengths: ["Exceptional rapport with young person", "PACE approach evident throughout"], developmentAreas: [], actionPlanCreated: false },
    { id: "po-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2025-05-15", observer: "External Consultant", observationType: "supervision_of_others", rating: "good", strengths: ["Clear direction given", "Supportive approach"], developmentAreas: ["Could delegate more to senior RSW"], actionPlanCreated: true, followUpDate: "2025-07-15", followUpCompleted: false },
    { id: "po-t01", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-03-10", observer: "Sarah Johnson", observationType: "shift_observation", rating: "requires_improvement", strengths: ["Good relationship with young people"], developmentAreas: ["Recording needs improvement", "De-escalation techniques"], actionPlanCreated: true, followUpDate: "2025-05-10", followUpCompleted: true },
    { id: "po-t02", staffId: "staff-tom", staffName: "Tom Richards", date: "2025-05-25", observer: "Sarah Johnson", observationType: "key_work_session", rating: "good", strengths: ["Good preparation", "Young person engaged well"], developmentAreas: ["Recording could be more detailed"], actionPlanCreated: true, followUpDate: "2025-07-25", followUpCompleted: false },
    { id: "po-l01", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2025-03-18", observer: "Darren Laville", observationType: "key_work_session", rating: "outstanding", strengths: ["Excellent use of life story work materials", "Young person clearly at ease"], developmentAreas: [], actionPlanCreated: false },
    { id: "po-d01", staffId: "staff-darren", staffName: "Darren Laville", date: "2025-04-05", observer: "External Consultant", observationType: "direct_practice", rating: "good", strengths: ["Strong leadership presence", "Calm under pressure"], developmentAreas: ["Could model reflective practice more explicitly"], actionPlanCreated: true, followUpDate: "2025-06-05", followUpCompleted: true },
  ];

  return { qualifications, cpd, competencies, plans, observations, staffIds };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { qualifications, cpd, competencies, plans, observations, staffIds } = getDemoData();
    const result = generateWorkforceDevelopmentIntelligence(
      qualifications,
      cpd,
      competencies,
      plans,
      observations,
      staffIds,
      "oak-house",
      "2025-01-01",
      "2025-12-31",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate workforce development intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      qualifications,
      cpd,
      competencies,
      plans,
      observations,
      staffIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    if (
      !qualifications ||
      !cpd ||
      !competencies ||
      !plans ||
      !observations ||
      !staffIds ||
      !homeId ||
      !periodStart ||
      !periodEnd ||
      !referenceDate
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: qualifications, cpd, competencies, plans, observations, staffIds, homeId, periodStart, periodEnd, referenceDate",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(qualifications) ||
      !Array.isArray(cpd) ||
      !Array.isArray(competencies) ||
      !Array.isArray(plans) ||
      !Array.isArray(observations) ||
      !Array.isArray(staffIds)
    ) {
      return NextResponse.json(
        { error: "qualifications, cpd, competencies, plans, observations, and staffIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateWorkforceDevelopmentIntelligence(
      qualifications,
      cpd,
      competencies,
      plans,
      observations,
      staffIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process workforce development data", details: String(error) },
      { status: 500 },
    );
  }
}
