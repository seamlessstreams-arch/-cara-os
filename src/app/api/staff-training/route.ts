// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Staff Training & CPD Compliance Intelligence API Route
//
// GET  → returns Chamberlain House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateStaffTrainingIntelligence } from "@/lib/staff-training/staff-training-engine";
import type { StaffMember, TrainingRecord, ChildNeed } from "@/lib/staff-training/staff-training-engine";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  staff: StaffMember[];
  records: TrainingRecord[];
  childNeeds: ChildNeed[];
} {
  const staff: StaffMember[] = [
    { id: "staff-sarah", name: "Sarah Johnson", role: "registered_manager", startDate: "2020-03-01", qualificationLevel: "level_5_diploma", qualificationDate: "2019-06-15", isPlaced: true },
    { id: "staff-tom", name: "Tom Richards", role: "rsw", startDate: "2022-01-15", qualificationLevel: "level_3_diploma", qualificationDate: "2023-08-20", isPlaced: true },
    { id: "staff-lisa", name: "Lisa Williams", role: "senior_rsw", startDate: "2021-06-01", qualificationLevel: "level_3_diploma", qualificationDate: "2022-11-10", isPlaced: true },
    { id: "staff-darren", name: "Darren Laville", role: "registered_manager", startDate: "2018-01-10", qualificationLevel: "level_5_diploma", qualificationDate: "2017-09-01", isPlaced: true },
  ];

  const records: TrainingRecord[] = [
    // Sarah — fully compliant, strong specialist training
    { id: "tr-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "safeguarding", courseName: "Advanced Safeguarding (Level 3)", completedDate: "2025-02-10", expiryDate: "2026-02-10", hoursCompleted: 12, provider: "Local Authority" },
    { id: "tr-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "first_aid", courseName: "Paediatric First Aid", completedDate: "2024-06-15", expiryDate: "2027-06-15", hoursCompleted: 12, provider: "St John Ambulance" },
    { id: "tr-s03", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-20", expiryDate: "2026-03-20", hoursCompleted: 6, provider: "PRICE Training" },
    { id: "tr-s04", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-15", hoursCompleted: 2, provider: "In-house" },
    { id: "tr-s05", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-20", hoursCompleted: 3, provider: "In-house" },
    { id: "tr-s06", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-01", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-s07", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-25", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-s08", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "equality_diversity", courseName: "EDI in Children's Services", completedDate: "2025-03-10", hoursCompleted: 3, provider: "External" },
    { id: "tr-s09", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "attachment_trauma", courseName: "Attachment Theory & Trauma-Informed Care", completedDate: "2025-04-05", hoursCompleted: 6, provider: "External" },
    { id: "tr-s10", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "therapeutic_parenting", courseName: "PACE Model in Practice", completedDate: "2025-05-12", hoursCompleted: 6, provider: "External" },
    { id: "tr-s11", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "csea", courseName: "CSE/A Recognition & Response", completedDate: "2025-03-15", hoursCompleted: 4, provider: "Local Authority" },
    { id: "tr-s12", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "self_harm_suicide", courseName: "Self-Harm Awareness", completedDate: "2025-06-01", hoursCompleted: 3, provider: "External" },

    // Tom — good, missing EDI, fewer specialist courses
    { id: "tr-t01", staffId: "staff-tom", staffName: "Tom Richards", category: "safeguarding", courseName: "Safeguarding Children (Level 2)", completedDate: "2025-02-15", expiryDate: "2026-02-15", hoursCompleted: 6, provider: "Local Authority" },
    { id: "tr-t02", staffId: "staff-tom", staffName: "Tom Richards", category: "first_aid", courseName: "First Aid at Work", completedDate: "2023-09-10", expiryDate: "2026-09-10", hoursCompleted: 12, provider: "Red Cross" },
    { id: "tr-t03", staffId: "staff-tom", staffName: "Tom Richards", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-22", expiryDate: "2026-03-22", hoursCompleted: 6, provider: "PRICE Training" },
    { id: "tr-t04", staffId: "staff-tom", staffName: "Tom Richards", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-16", hoursCompleted: 2, provider: "In-house" },
    { id: "tr-t05", staffId: "staff-tom", staffName: "Tom Richards", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-20", hoursCompleted: 3, provider: "In-house" },
    { id: "tr-t06", staffId: "staff-tom", staffName: "Tom Richards", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-05", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-t07", staffId: "staff-tom", staffName: "Tom Richards", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-28", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-t08", staffId: "staff-tom", staffName: "Tom Richards", category: "attachment_trauma", courseName: "Attachment & Trauma Basics", completedDate: "2025-04-10", hoursCompleted: 4, provider: "External" },
    { id: "tr-t09", staffId: "staff-tom", staffName: "Tom Richards", category: "online_safety", courseName: "Online Safety for Care Staff", completedDate: "2025-05-20", hoursCompleted: 3, provider: "E-learning" },

    // Lisa — fully compliant, strong specialist training
    { id: "tr-l01", staffId: "staff-lisa", staffName: "Lisa Williams", category: "safeguarding", courseName: "Safeguarding Children (Level 3)", completedDate: "2025-02-12", expiryDate: "2026-02-12", hoursCompleted: 12, provider: "Local Authority" },
    { id: "tr-l02", staffId: "staff-lisa", staffName: "Lisa Williams", category: "first_aid", courseName: "Paediatric First Aid", completedDate: "2024-08-20", expiryDate: "2027-08-20", hoursCompleted: 12, provider: "St John Ambulance" },
    { id: "tr-l03", staffId: "staff-lisa", staffName: "Lisa Williams", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-25", expiryDate: "2026-03-25", hoursCompleted: 6, provider: "PRICE Training" },
    { id: "tr-l04", staffId: "staff-lisa", staffName: "Lisa Williams", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-18", hoursCompleted: 2, provider: "In-house" },
    { id: "tr-l05", staffId: "staff-lisa", staffName: "Lisa Williams", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-22", hoursCompleted: 3, provider: "In-house" },
    { id: "tr-l06", staffId: "staff-lisa", staffName: "Lisa Williams", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-08", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-l07", staffId: "staff-lisa", staffName: "Lisa Williams", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-30", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-l08", staffId: "staff-lisa", staffName: "Lisa Williams", category: "equality_diversity", courseName: "EDI in Children's Services", completedDate: "2025-03-12", hoursCompleted: 3, provider: "External" },
    { id: "tr-l09", staffId: "staff-lisa", staffName: "Lisa Williams", category: "attachment_trauma", courseName: "Attachment Theory & Trauma-Informed Care", completedDate: "2025-04-08", hoursCompleted: 6, provider: "External" },
    { id: "tr-l10", staffId: "staff-lisa", staffName: "Lisa Williams", category: "therapeutic_parenting", courseName: "PACE Model in Practice", completedDate: "2025-05-15", hoursCompleted: 6, provider: "External" },
    { id: "tr-l11", staffId: "staff-lisa", staffName: "Lisa Williams", category: "mental_health_awareness", courseName: "Mental Health First Aid", completedDate: "2025-04-20", hoursCompleted: 8, provider: "MHFA England" },
    { id: "tr-l12", staffId: "staff-lisa", staffName: "Lisa Williams", category: "self_harm_suicide", courseName: "Self-Harm Prevention", completedDate: "2025-06-05", hoursCompleted: 3, provider: "External" },

    // Darren — fully compliant, manager-level specialist training
    { id: "tr-d01", staffId: "staff-darren", staffName: "Darren Laville", category: "safeguarding", courseName: "Designated Safeguarding Lead", completedDate: "2025-01-08", expiryDate: "2026-01-08", hoursCompleted: 12, provider: "Local Authority" },
    { id: "tr-d02", staffId: "staff-darren", staffName: "Darren Laville", category: "first_aid", courseName: "First Aid at Work", completedDate: "2023-11-15", expiryDate: "2025-07-15", hoursCompleted: 12, provider: "Red Cross" },
    { id: "tr-d03", staffId: "staff-darren", staffName: "Darren Laville", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-18", expiryDate: "2026-03-18", hoursCompleted: 6, provider: "PRICE Training" },
    { id: "tr-d04", staffId: "staff-darren", staffName: "Darren Laville", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-10", hoursCompleted: 2, provider: "In-house" },
    { id: "tr-d05", staffId: "staff-darren", staffName: "Darren Laville", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-18", hoursCompleted: 3, provider: "In-house" },
    { id: "tr-d06", staffId: "staff-darren", staffName: "Darren Laville", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-03", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-d07", staffId: "staff-darren", staffName: "Darren Laville", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-22", hoursCompleted: 2, provider: "E-learning" },
    { id: "tr-d08", staffId: "staff-darren", staffName: "Darren Laville", category: "equality_diversity", courseName: "EDI for Managers", completedDate: "2025-03-08", hoursCompleted: 4, provider: "External" },
    { id: "tr-d09", staffId: "staff-darren", staffName: "Darren Laville", category: "therapeutic_parenting", courseName: "DDP Principles for Managers", completedDate: "2025-05-10", hoursCompleted: 6, provider: "External" },
    { id: "tr-d10", staffId: "staff-darren", staffName: "Darren Laville", category: "csea", courseName: "CSE/A Strategic Response", completedDate: "2025-03-20", hoursCompleted: 4, provider: "Local Authority" },
  ];

  const childNeeds: ChildNeed[] = [
    { childId: "child-alex", childName: "Alex", need: "attachment_difficulties", requiredTraining: "attachment_trauma" },
    { childId: "child-alex", childName: "Alex", need: "self_harm_risk", requiredTraining: "self_harm_suicide" },
    { childId: "child-jordan", childName: "Jordan", need: "mental_health", requiredTraining: "mental_health_awareness" },
    { childId: "child-morgan", childName: "Morgan", need: "online_safety_risk", requiredTraining: "online_safety" },
    { childId: "child-morgan", childName: "Morgan", need: "csea_risk", requiredTraining: "csea" },
  ];

  return { staff, records, childNeeds };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { staff, records, childNeeds } = getDemoData();
    const result = generateStaffTrainingIntelligence(
      staff, records, childNeeds,
      "oak-house",
      "2025-01-01",
      "2025-12-31",
      new Date().toISOString().split("T")[0], // today as reference date
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate staff training intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { staff, records, childNeeds, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!staff || !records || !childNeeds || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: staff, records, childNeeds, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(staff) || !Array.isArray(records) || !Array.isArray(childNeeds)) {
      return NextResponse.json(
        { error: "staff, records, and childNeeds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateStaffTrainingIntelligence(
      staff, records, childNeeds,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process staff training data", details: String(error) },
      { status: 500 },
    );
  }
}
