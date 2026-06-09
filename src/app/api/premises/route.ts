// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Premises & Physical Environment Intelligence API Route
//
// GET  → returns Chamberlain House demo premises intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generatePremisesIntelligence } from "@/lib/premises/premises-engine";
import type {
  PremisesCheck,
  MaintenanceRequest,
  FireDrillRecord,
  EnvironmentalRisk,
} from "@/lib/premises/premises-engine";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  checks: PremisesCheck[];
  maintenance: MaintenanceRequest[];
  fireDrills: FireDrillRecord[];
  environmentalRisks: EnvironmentalRisk[];
} {
  const checks: PremisesCheck[] = [
    { id: "chk-01", homeId: "oak-house", category: "fire_safety", checkName: "Fire Alarm Weekly Test", lastCompletedDate: "2025-06-10", nextDueDate: "2025-06-17", frequencyDays: 7, status: "passed", completedBy: "Sarah Johnson", outcome: "satisfactory" },
    { id: "chk-02", homeId: "oak-house", category: "fire_safety", checkName: "Fire Risk Assessment", lastCompletedDate: "2025-03-15", nextDueDate: "2025-09-15", frequencyDays: 180, status: "not_due", completedBy: "External Assessor", outcome: "satisfactory" },
    { id: "chk-03", homeId: "oak-house", category: "water_temperature", checkName: "Hot Water Temperature Check", lastCompletedDate: "2025-06-12", nextDueDate: "2025-06-19", frequencyDays: 7, status: "passed", completedBy: "Tom Richards", outcome: "satisfactory" },
    { id: "chk-04", homeId: "oak-house", category: "gas_safety", checkName: "Annual Gas Safety Certificate", lastCompletedDate: "2024-08-20", nextDueDate: "2025-08-20", frequencyDays: 365, status: "not_due", completedBy: "Registered Gas Engineer", outcome: "satisfactory" },
    { id: "chk-05", homeId: "oak-house", category: "electrical_safety", checkName: "Electrical Installation Condition Report", lastCompletedDate: "2023-12-01", nextDueDate: "2025-06-01", frequencyDays: 365, status: "overdue", completedBy: "Registered Electrician", outcome: "satisfactory", notes: "Due for renewal" },
    { id: "chk-06", homeId: "oak-house", category: "pat_testing", checkName: "Portable Appliance Testing", lastCompletedDate: "2025-01-15", nextDueDate: "2026-01-15", frequencyDays: 365, status: "not_due", completedBy: "In-house", outcome: "satisfactory" },
    { id: "chk-07", homeId: "oak-house", category: "legionella", checkName: "Legionella Risk Assessment", lastCompletedDate: "2025-02-01", nextDueDate: "2027-02-01", frequencyDays: 730, status: "not_due", completedBy: "Water Hygiene Ltd", outcome: "satisfactory" },
    { id: "chk-08", homeId: "oak-house", category: "ligature_assessment", checkName: "Ligature Point Assessment", lastCompletedDate: "2025-05-01", nextDueDate: "2025-08-01", frequencyDays: 90, status: "not_due", completedBy: "Lisa Williams", outcome: "action_required", notes: "Bathroom window cord needs replacing" },
    { id: "chk-09", homeId: "oak-house", category: "first_aid_supplies", checkName: "First Aid Kit Check", lastCompletedDate: "2025-06-01", nextDueDate: "2025-07-01", frequencyDays: 30, status: "due_soon", completedBy: "Tom Richards", outcome: "satisfactory" },
    { id: "chk-10", homeId: "oak-house", category: "building_maintenance", checkName: "Monthly Building Inspection", lastCompletedDate: "2025-06-05", nextDueDate: "2025-07-05", frequencyDays: 30, status: "not_due", completedBy: "Darren Laville", outcome: "satisfactory" },
    { id: "chk-11", homeId: "oak-house", category: "garden_outdoor", checkName: "Garden Safety Check", lastCompletedDate: "2025-06-08", nextDueDate: "2025-06-22", frequencyDays: 14, status: "passed", completedBy: "Tom Richards", outcome: "satisfactory" },
    { id: "chk-12", homeId: "oak-house", category: "decoration_homeliness", checkName: "Decoration & Homeliness Audit", lastCompletedDate: "2025-04-01", nextDueDate: "2025-07-01", frequencyDays: 90, status: "due_soon", completedBy: "Sarah Johnson", outcome: "satisfactory" },
    { id: "chk-13", homeId: "oak-house", category: "cctv", checkName: "CCTV Operational Check", lastCompletedDate: "2025-06-01", nextDueDate: "2025-07-01", frequencyDays: 30, status: "not_due", completedBy: "In-house", outcome: "satisfactory" },
    { id: "chk-14", homeId: "oak-house", category: "alarm_system", checkName: "Intruder Alarm Test", lastCompletedDate: "2025-05-15", nextDueDate: "2025-06-10", frequencyDays: 30, status: "failed", completedBy: "Alarm Co", outcome: "unsatisfactory", notes: "Zone 3 sensor fault" },
  ];

  const maintenance: MaintenanceRequest[] = [
    { id: "maint-01", homeId: "oak-house", category: "building_maintenance", description: "Kitchen tap leaking", reportedDate: "2025-05-20", reportedBy: "Tom Richards", urgency: "medium", status: "completed", completedDate: "2025-05-25", completedBy: "Plumber" },
    { id: "maint-02", homeId: "oak-house", category: "building_maintenance", description: "Bathroom extractor fan broken", reportedDate: "2025-06-01", reportedBy: "Lisa Williams", urgency: "medium", status: "completed", completedDate: "2025-06-10", completedBy: "Electrician" },
    { id: "maint-03", homeId: "oak-house", category: "garden_outdoor", description: "Fence panel blown down — garden not secure", reportedDate: "2025-06-10", reportedBy: "Darren Laville", urgency: "high", status: "scheduled" },
    { id: "maint-04", homeId: "oak-house", category: "decoration_homeliness", description: "Morgan's bedroom needs repainting after damage", reportedDate: "2025-05-15", reportedBy: "Sarah Johnson", urgency: "low", status: "completed", completedDate: "2025-06-05", completedBy: "In-house" },
    { id: "maint-05", homeId: "oak-house", category: "alarm_system", description: "Zone 3 intruder alarm sensor fault", reportedDate: "2025-06-10", reportedBy: "Sarah Johnson", urgency: "critical", status: "in_progress" },
  ];

  const fireDrills: FireDrillRecord[] = [
    { id: "fd-01", homeId: "oak-house", date: "2025-01-20", timeOfDay: "day", evacuationTimeMinutes: 2.5, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Sarah Johnson" },
    { id: "fd-02", homeId: "oak-house", date: "2025-03-15", timeOfDay: "evening", evacuationTimeMinutes: 3.0, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: ["Jordan initially went to wrong assembly point"], actionsTaken: ["Reviewed fire evacuation procedure with Jordan"], conductedBy: "Darren Laville" },
    { id: "fd-03", homeId: "oak-house", date: "2025-05-10", timeOfDay: "day", evacuationTimeMinutes: 2.0, allChildrenAccountedFor: true, allStaffParticipated: false, childrenPresent: 2, staffPresent: 1, issuesIdentified: ["Staff lone working during drill"], actionsTaken: ["Reviewed lone working evacuation procedure"], conductedBy: "Lisa Williams" },
    { id: "fd-04", homeId: "oak-house", date: "2025-06-08", timeOfDay: "night", evacuationTimeMinutes: 4.5, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 1, issuesIdentified: ["Alex needed additional reassurance"], actionsTaken: ["Added night drill preparation to Alex's care plan"], conductedBy: "Tom Richards" },
  ];

  const environmentalRisks: EnvironmentalRisk[] = [
    { id: "risk-01", homeId: "oak-house", riskArea: "Kitchen", riskDescription: "Sharp knives accessible in unlocked drawer", riskLevel: "high", identifiedDate: "2025-01-10", mitigationInPlace: true, mitigationDescription: "Magnetic knife rack installed at height, drawer lock fitted", reviewDate: "2025-07-10", status: "mitigated" },
    { id: "risk-02", homeId: "oak-house", riskArea: "Bathroom (upstairs)", riskDescription: "Ligature point — window cord", riskLevel: "high", identifiedDate: "2025-05-01", mitigationInPlace: false, reviewDate: "2025-06-01", status: "open" },
    { id: "risk-03", homeId: "oak-house", riskArea: "Garden", riskDescription: "Shed contains garden tools accessible to children", riskLevel: "medium", identifiedDate: "2025-02-15", mitigationInPlace: true, mitigationDescription: "Padlock fitted to shed", reviewDate: "2025-08-15", status: "mitigated" },
    { id: "risk-04", homeId: "oak-house", riskArea: "Front entrance", riskDescription: "CCTV blind spot near side gate", riskLevel: "medium", identifiedDate: "2025-03-01", mitigationInPlace: true, mitigationDescription: "Additional camera installed", reviewDate: "2025-09-01", status: "closed" },
    { id: "risk-05", homeId: "oak-house", riskArea: "Medication storage", riskDescription: "Medication cabinet lock intermittently sticking", riskLevel: "critical", identifiedDate: "2025-06-05", mitigationInPlace: false, reviewDate: "2025-06-12", status: "open" },
  ];

  return { checks, maintenance, fireDrills, environmentalRisks };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { checks, maintenance, fireDrills, environmentalRisks } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const result = generatePremisesIntelligence(
      checks, maintenance, fireDrills, environmentalRisks,
      "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate premises intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { checks, maintenance, fireDrills, environmentalRisks, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!checks || !maintenance || !fireDrills || !environmentalRisks || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: checks, maintenance, fireDrills, environmentalRisks, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(checks) || !Array.isArray(maintenance) || !Array.isArray(fireDrills) || !Array.isArray(environmentalRisks)) {
      return NextResponse.json(
        { error: "checks, maintenance, fireDrills, and environmentalRisks must be arrays" },
        { status: 400 },
      );
    }

    const result = generatePremisesIntelligence(
      checks, maintenance, fireDrills, environmentalRisks,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process premises data", details: String(error) },
      { status: 500 },
    );
  }
}
