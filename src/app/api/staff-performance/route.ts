// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Staff Performance Intelligence API Route
//
// GET  → returns Chamberlain House demo staff performance intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateStaffPerformanceIntelligence } from "@/lib/staff-performance/staff-performance-engine";
import type {
  StaffMember,
  QualificationRecord,
  PerformanceReview,
  PDPGoal,
  CompetencyAssessment,
} from "@/lib/staff-performance/staff-performance-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const staff: StaffMember[] = [
    {
      id: "staff-darren", name: "Darren Laville", role: "Registered Manager",
      startDate: "2022-01-10", isActive: true,
      requiredQualifications: ["level_5_diploma", "first_aid", "safeguarding", "restraint", "medication", "fire_safety", "management"],
      managerId: undefined,
    },
    {
      id: "staff-sarah", name: "Sarah Johnson", role: "Senior RSW",
      startDate: "2022-06-01", isActive: true,
      requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "medication", "fire_safety"],
      managerId: "staff-darren",
    },
    {
      id: "staff-tom", name: "Tom Richards", role: "RSW",
      startDate: "2023-03-15", isActive: true,
      requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "fire_safety"],
      managerId: "staff-sarah",
    },
    {
      id: "staff-lisa", name: "Lisa Williams", role: "Senior RSW",
      startDate: "2022-09-01", isActive: true,
      requiredQualifications: ["level_3_diploma", "first_aid", "safeguarding", "restraint", "medication", "fire_safety"],
      managerId: "staff-darren",
    },
  ];

  const qualifications: QualificationRecord[] = [
    // Darren — RM qualifications
    { id: "q-d1", staffId: "staff-darren", type: "level_5_diploma", status: "achieved", achievedDate: "2021-09-01", provider: "Open University" },
    { id: "q-d2", staffId: "staff-darren", type: "first_aid", status: "achieved", achievedDate: "2025-01-10", expiryDate: "2026-01-10", renewalDue: "2025-12-10", provider: "St John Ambulance" },
    { id: "q-d3", staffId: "staff-darren", type: "safeguarding", status: "achieved", achievedDate: "2025-02-15", expiryDate: "2027-02-15", renewalDue: "2027-01-15", provider: "NSPCC" },
    { id: "q-d4", staffId: "staff-darren", type: "restraint", status: "achieved", achievedDate: "2024-11-01", expiryDate: "2025-11-01", renewalDue: "2025-10-01", provider: "PROACT-SCIPr" },
    { id: "q-d5", staffId: "staff-darren", type: "medication", status: "achieved", achievedDate: "2024-06-01", expiryDate: "2026-06-01", provider: "In-house" },
    { id: "q-d6", staffId: "staff-darren", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01", provider: "Local FRS" },
    { id: "q-d7", staffId: "staff-darren", type: "management", status: "achieved", achievedDate: "2023-04-01", provider: "ILM" },

    // Sarah — Senior RSW
    { id: "q-s1", staffId: "staff-sarah", type: "level_3_diploma", status: "achieved", achievedDate: "2020-07-01", provider: "CACHE" },
    { id: "q-s2", staffId: "staff-sarah", type: "first_aid", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15", provider: "St John Ambulance" },
    { id: "q-s3", staffId: "staff-sarah", type: "safeguarding", status: "achieved", achievedDate: "2025-02-20", expiryDate: "2027-02-20", renewalDue: "2027-01-20", provider: "NSPCC" },
    { id: "q-s4", staffId: "staff-sarah", type: "restraint", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15", provider: "PROACT-SCIPr" },
    { id: "q-s5", staffId: "staff-sarah", type: "medication", status: "achieved", achievedDate: "2024-08-01", expiryDate: "2026-08-01", provider: "In-house" },
    { id: "q-s6", staffId: "staff-sarah", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01", provider: "Local FRS" },

    // Tom — RSW
    { id: "q-t1", staffId: "staff-tom", type: "level_3_diploma", status: "in_progress", provider: "CACHE" },
    { id: "q-t2", staffId: "staff-tom", type: "first_aid", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15", provider: "St John Ambulance" },
    { id: "q-t3", staffId: "staff-tom", type: "safeguarding", status: "achieved", achievedDate: "2025-02-25", expiryDate: "2027-02-25", renewalDue: "2027-01-25", provider: "NSPCC" },
    { id: "q-t4", staffId: "staff-tom", type: "restraint", status: "achieved", achievedDate: "2025-01-15", expiryDate: "2026-01-15", renewalDue: "2025-12-15", provider: "PROACT-SCIPr" },
    { id: "q-t5", staffId: "staff-tom", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01", provider: "Local FRS" },

    // Lisa — Senior RSW
    { id: "q-l1", staffId: "staff-lisa", type: "level_3_diploma", status: "achieved", achievedDate: "2019-06-01", provider: "CACHE" },
    { id: "q-l2", staffId: "staff-lisa", type: "first_aid", status: "achieved", achievedDate: "2025-01-20", expiryDate: "2026-01-20", renewalDue: "2025-12-20", provider: "St John Ambulance" },
    { id: "q-l3", staffId: "staff-lisa", type: "safeguarding", status: "achieved", achievedDate: "2025-02-22", expiryDate: "2027-02-22", renewalDue: "2027-01-22", provider: "NSPCC" },
    { id: "q-l4", staffId: "staff-lisa", type: "restraint", status: "achieved", achievedDate: "2025-02-01", expiryDate: "2026-02-01", renewalDue: "2026-01-01", provider: "PROACT-SCIPr" },
    { id: "q-l5", staffId: "staff-lisa", type: "medication", status: "achieved", achievedDate: "2024-09-01", expiryDate: "2026-09-01", provider: "In-house" },
    { id: "q-l6", staffId: "staff-lisa", type: "fire_safety", status: "achieved", achievedDate: "2025-03-01", expiryDate: "2026-03-01", provider: "Local FRS" },
  ];

  const reviews: PerformanceReview[] = [
    {
      id: "rev-d1", staffId: "staff-darren", reviewDate: "2025-03-15", reviewerId: "ext-ri",
      rating: "exceptional", status: "completed_on_time",
      objectivesSet: 5, objectivesMet: 5, developmentAreasIdentified: 2,
      staffViewsRecorded: true, actionPlanCreated: true,
    },
    {
      id: "rev-s1", staffId: "staff-sarah", reviewDate: "2025-03-20", reviewerId: "staff-darren",
      rating: "effective", status: "completed_on_time",
      objectivesSet: 4, objectivesMet: 3, developmentAreasIdentified: 2,
      staffViewsRecorded: true, actionPlanCreated: true,
    },
    {
      id: "rev-t1", staffId: "staff-tom", reviewDate: "2025-04-01", reviewerId: "staff-sarah",
      rating: "developing", status: "completed_on_time",
      objectivesSet: 4, objectivesMet: 2, developmentAreasIdentified: 3,
      staffViewsRecorded: true, actionPlanCreated: true,
    },
    {
      id: "rev-l1", staffId: "staff-lisa", reviewDate: "2025-03-25", reviewerId: "staff-darren",
      rating: "effective", status: "completed_on_time",
      objectivesSet: 4, objectivesMet: 4, developmentAreasIdentified: 1,
      staffViewsRecorded: true, actionPlanCreated: true,
    },
  ];

  const pdpGoals: PDPGoal[] = [
    // Darren
    { id: "pdp-d1", staffId: "staff-darren", description: "Complete Level 7 Strategic Leadership module", status: "in_progress", targetDate: "2025-09-01", linkedToTraining: true },
    { id: "pdp-d2", staffId: "staff-darren", description: "Achieve Ofsted Outstanding at next inspection", status: "in_progress", targetDate: "2025-12-31", linkedToTraining: false },
    { id: "pdp-d3", staffId: "staff-darren", description: "Implement therapeutic care model across home", status: "achieved", targetDate: "2025-06-01", completedDate: "2025-05-15", linkedToTraining: true },

    // Sarah
    { id: "pdp-s1", staffId: "staff-sarah", description: "Begin Level 4 Diploma", status: "in_progress", targetDate: "2025-09-01", linkedToTraining: true },
    { id: "pdp-s2", staffId: "staff-sarah", description: "Complete trauma-informed practice training", status: "achieved", targetDate: "2025-04-01", completedDate: "2025-03-28", linkedToTraining: true },
    { id: "pdp-s3", staffId: "staff-sarah", description: "Mentor new RSW staff through induction", status: "achieved", targetDate: "2025-06-30", completedDate: "2025-06-15", linkedToTraining: false },

    // Tom
    { id: "pdp-t1", staffId: "staff-tom", description: "Complete Level 3 Diploma within 2 years", status: "in_progress", targetDate: "2025-09-15", linkedToTraining: true },
    { id: "pdp-t2", staffId: "staff-tom", description: "Develop confidence in lone working scenarios", status: "in_progress", targetDate: "2025-08-01", linkedToTraining: false },
    { id: "pdp-t3", staffId: "staff-tom", description: "Achieve competent rating in record keeping", status: "achieved", targetDate: "2025-05-01", completedDate: "2025-04-20", linkedToTraining: true },

    // Lisa
    { id: "pdp-l1", staffId: "staff-lisa", description: "Complete mental health first aid certification", status: "achieved", targetDate: "2025-03-01", completedDate: "2025-02-20", linkedToTraining: true },
    { id: "pdp-l2", staffId: "staff-lisa", description: "Lead monthly reflective practice sessions", status: "achieved", targetDate: "2025-06-30", completedDate: "2025-06-10", linkedToTraining: false },
    { id: "pdp-l3", staffId: "staff-lisa", description: "Support development of house therapeutic model", status: "in_progress", targetDate: "2025-09-01", linkedToTraining: true },
  ];

  const competencyAssessments: CompetencyAssessment[] = [
    // Darren — comprehensive assessments
    { id: "ca-d1", staffId: "staff-darren", area: "safeguarding", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "competent" },
    { id: "ca-d2", staffId: "staff-darren", area: "behaviour_management", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "competent" },
    { id: "ca-d3", staffId: "staff-darren", area: "therapeutic_care", level: "competent", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "developing" },
    { id: "ca-d4", staffId: "staff-darren", area: "record_keeping", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d5", staffId: "staff-darren", area: "communication", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d6", staffId: "staff-darren", area: "regulatory_knowledge", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d7", staffId: "staff-darren", area: "risk_management", level: "competent", assessedDate: "2025-03-15", assessedBy: "ext-ri" },
    { id: "ca-d8", staffId: "staff-darren", area: "child_centred_practice", level: "expert", assessedDate: "2025-03-15", assessedBy: "ext-ri", previousLevel: "competent" },

    // Sarah
    { id: "ca-s1", staffId: "staff-sarah", area: "safeguarding", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren", previousLevel: "developing" },
    { id: "ca-s2", staffId: "staff-sarah", area: "behaviour_management", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren" },
    { id: "ca-s3", staffId: "staff-sarah", area: "therapeutic_care", level: "developing", assessedDate: "2025-03-20", assessedBy: "staff-darren", previousLevel: "emerging" },
    { id: "ca-s4", staffId: "staff-sarah", area: "record_keeping", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren", previousLevel: "developing" },
    { id: "ca-s5", staffId: "staff-sarah", area: "communication", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren" },
    { id: "ca-s6", staffId: "staff-sarah", area: "child_centred_practice", level: "competent", assessedDate: "2025-03-20", assessedBy: "staff-darren" },

    // Tom
    { id: "ca-t1", staffId: "staff-tom", area: "safeguarding", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "emerging" },
    { id: "ca-t2", staffId: "staff-tom", area: "behaviour_management", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "emerging" },
    { id: "ca-t3", staffId: "staff-tom", area: "record_keeping", level: "competent", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "developing" },
    { id: "ca-t4", staffId: "staff-tom", area: "communication", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah" },
    { id: "ca-t5", staffId: "staff-tom", area: "child_centred_practice", level: "developing", assessedDate: "2025-04-01", assessedBy: "staff-sarah", previousLevel: "emerging" },
    { id: "ca-t6", staffId: "staff-tom", area: "teamwork", level: "competent", assessedDate: "2025-04-01", assessedBy: "staff-sarah" },

    // Lisa
    { id: "ca-l1", staffId: "staff-lisa", area: "safeguarding", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren", previousLevel: "competent" },
    { id: "ca-l2", staffId: "staff-lisa", area: "therapeutic_care", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren", previousLevel: "developing" },
    { id: "ca-l3", staffId: "staff-lisa", area: "behaviour_management", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
    { id: "ca-l4", staffId: "staff-lisa", area: "record_keeping", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
    { id: "ca-l5", staffId: "staff-lisa", area: "communication", level: "expert", assessedDate: "2025-03-25", assessedBy: "staff-darren", previousLevel: "competent" },
    { id: "ca-l6", staffId: "staff-lisa", area: "child_centred_practice", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
    { id: "ca-l7", staffId: "staff-lisa", area: "professional_development", level: "competent", assessedDate: "2025-03-25", assessedBy: "staff-darren" },
  ];

  return { staff, qualifications, reviews, pdpGoals, competencyAssessments };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { staff, qualifications, reviews, pdpGoals, competencyAssessments } = getDemoData();
    const result = generateStaffPerformanceIntelligence(
      staff, qualifications, reviews, pdpGoals, competencyAssessments,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate staff performance intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { staff, qualifications, reviews, pdpGoals, competencyAssessments, homeId, periodStart, periodEnd } = body;

    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(staff) || !Array.isArray(qualifications) || !Array.isArray(reviews) || !Array.isArray(pdpGoals) || !Array.isArray(competencyAssessments)) {
      return NextResponse.json(
        { error: "staff, qualifications, reviews, pdpGoals, and competencyAssessments must be arrays" },
        { status: 400 },
      );
    }

    const result = generateStaffPerformanceIntelligence(
      staff, qualifications, reviews, pdpGoals, competencyAssessments,
      homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process staff performance data", details: String(error) },
      { status: 500 },
    );
  }
}
