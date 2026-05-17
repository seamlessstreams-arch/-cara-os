// ══════════════════════════════════════════════════════════════════════════════
// API: /api/workforce — Workforce & rota intelligence
//
// GET  — returns metrics, compliance, shift coverage
// POST — analyse shift safety or check individual compliance
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeShiftSafety,
  evaluateWorkforceCompliance,
  calculateWorkforceMetrics,
} from "@/lib/workforce";
import type { StaffMember, Shift, ChildOnShift, ShiftRequirement } from "@/lib/workforce";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_STAFF: StaffMember[] = [
  {
    id: "staff-rm-01", name: "Sarah Johnson", role: "registered_manager", homeId: "home-001",
    startDate: "2020-03-01T00:00:00Z", contractedHours: 40, isAgency: false,
    dbsCheckDate: "2025-08-15T00:00:00Z", dbsClearanceLevel: "enhanced_barred", dbsOnUpdateService: true,
    qualificationLevel: 5, qualificationStatus: "achieved",
    mandatoryTraining: [
      { courseName: "Fire Safety", category: "mandatory", completedDate: "2026-02-01T00:00:00Z", expiryDate: "2027-02-01T00:00:00Z", status: "current" },
      { courseName: "Health & Safety", category: "mandatory", completedDate: "2026-01-15T00:00:00Z", expiryDate: "2027-01-15T00:00:00Z", status: "current" },
      { courseName: "Food Hygiene", category: "mandatory", completedDate: "2025-11-01T00:00:00Z", expiryDate: "2026-11-01T00:00:00Z", status: "current" },
    ],
    supervisionDue: "2026-06-01T00:00:00Z", lastSupervision: "2026-04-25T00:00:00Z",
    firstAidCurrent: true, safeguardingTrainingDate: "2026-03-01T00:00:00Z",
    restraintTrainingDate: "2026-02-15T00:00:00Z", medicationTrainingDate: "2026-01-10T00:00:00Z",
  },
  {
    id: "staff-sw-01", name: "Emma Thompson", role: "senior_support_worker", homeId: "home-001",
    startDate: "2021-09-01T00:00:00Z", contractedHours: 37.5, isAgency: false,
    dbsCheckDate: "2025-05-01T00:00:00Z", dbsClearanceLevel: "enhanced_barred", dbsOnUpdateService: true,
    qualificationLevel: 3, qualificationStatus: "achieved",
    mandatoryTraining: [
      { courseName: "Fire Safety", category: "mandatory", completedDate: "2026-01-10T00:00:00Z", expiryDate: "2027-01-10T00:00:00Z", status: "current" },
      { courseName: "Health & Safety", category: "mandatory", completedDate: "2025-12-01T00:00:00Z", expiryDate: "2026-12-01T00:00:00Z", status: "current" },
    ],
    supervisionDue: "2026-05-30T00:00:00Z", lastSupervision: "2026-04-18T00:00:00Z",
    firstAidCurrent: true, safeguardingTrainingDate: "2026-01-20T00:00:00Z",
    restraintTrainingDate: "2026-03-10T00:00:00Z", medicationTrainingDate: "2025-11-15T00:00:00Z",
  },
  {
    id: "staff-sw-02", name: "Mike Davis", role: "support_worker", homeId: "home-001",
    startDate: "2023-06-01T00:00:00Z", contractedHours: 37.5, isAgency: false,
    dbsCheckDate: "2025-04-01T00:00:00Z", dbsClearanceLevel: "enhanced_barred", dbsOnUpdateService: false,
    qualificationLevel: 3, qualificationStatus: "achieved",
    mandatoryTraining: [
      { courseName: "Fire Safety", category: "mandatory", completedDate: "2025-06-01T00:00:00Z", expiryDate: "2026-06-01T00:00:00Z", status: "current" },
      { courseName: "Health & Safety", category: "mandatory", completedDate: "2025-03-01T00:00:00Z", expiryDate: "2026-03-01T00:00:00Z", status: "overdue" },
    ],
    supervisionDue: "2026-05-20T00:00:00Z", lastSupervision: "2026-04-10T00:00:00Z",
    firstAidCurrent: true, safeguardingTrainingDate: "2025-09-01T00:00:00Z",
    restraintTrainingDate: "2026-01-15T00:00:00Z", medicationTrainingDate: "2025-10-01T00:00:00Z",
  },
  {
    id: "staff-sw-03", name: "Lisa Brown", role: "support_worker", homeId: "home-001",
    startDate: "2024-11-01T00:00:00Z", contractedHours: 37.5, isAgency: false,
    dbsCheckDate: "2024-10-15T00:00:00Z", dbsClearanceLevel: "enhanced_barred", dbsOnUpdateService: true,
    qualificationLevel: 2, qualificationStatus: "enrolled", qualificationDeadline: "2026-11-01T00:00:00Z",
    mandatoryTraining: [
      { courseName: "Fire Safety", category: "mandatory", completedDate: "2025-11-15T00:00:00Z", expiryDate: "2026-11-15T00:00:00Z", status: "current" },
      { courseName: "Health & Safety", category: "mandatory", completedDate: "2025-11-15T00:00:00Z", expiryDate: "2026-11-15T00:00:00Z", status: "current" },
    ],
    supervisionDue: "2026-05-25T00:00:00Z", lastSupervision: "2026-04-12T00:00:00Z",
    firstAidCurrent: false, safeguardingTrainingDate: "2025-11-20T00:00:00Z",
    restraintTrainingDate: "2025-12-01T00:00:00Z", medicationTrainingDate: "2025-11-20T00:00:00Z",
  },
  {
    id: "staff-ag-01", name: "Agency Worker A", role: "agency_staff", homeId: "home-001",
    startDate: "2026-05-01T00:00:00Z", contractedHours: 0, isAgency: true,
    dbsCheckDate: "2025-12-01T00:00:00Z", dbsClearanceLevel: "enhanced_barred", dbsOnUpdateService: false,
    qualificationLevel: 3, qualificationStatus: "achieved",
    mandatoryTraining: [],
    supervisionDue: "2026-06-01T00:00:00Z",
    firstAidCurrent: false, safeguardingTrainingDate: "2025-10-01T00:00:00Z",
    restraintTrainingDate: "2025-09-01T00:00:00Z",
  },
];

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-001";

  const metrics = calculateWorkforceMetrics(DEMO_STAFF, [], homeId);
  const compliance = evaluateWorkforceCompliance(DEMO_STAFF, homeId);

  return NextResponse.json({
    metrics,
    compliance,
    staffCount: DEMO_STAFF.filter(s => s.homeId === homeId).length,
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "shift_safety") {
    const { shiftType, homeId, children } = body;

    const todayShifts: Shift[] = DEMO_STAFF
      .filter(s => s.homeId === (homeId ?? "home-001"))
      .slice(0, body.staffCount ?? 2)
      .map((s, i) => ({
        id: `shift-${i}`,
        date: new Date().toISOString().split("T")[0],
        shiftType: shiftType ?? "day",
        startTime: "07:00",
        endTime: "15:00",
        staffId: s.id,
        staffName: s.name,
        staffRole: s.role,
        homeId: s.homeId,
        isAgency: s.isAgency,
        isSleepIn: false,
        hoursWorked: 8,
      }));

    const childrenOnShift: ChildOnShift[] = (children ?? [
      { childId: "c1", childName: "Child A", riskLevel: "medium", requiresOneToOne: false, medicalNeedsOnShift: false },
      { childId: "c2", childName: "Child B", riskLevel: "low", requiresOneToOne: false, medicalNeedsOnShift: false },
      { childId: "c3", childName: "Child C", riskLevel: "high", requiresOneToOne: false, medicalNeedsOnShift: true },
    ]) as ChildOnShift[];

    const requirement: ShiftRequirement = {
      homeId: homeId ?? "home-001",
      shiftType: shiftType ?? "day",
      minimumStaff: 2,
      minimumSenior: 1,
      childrenExpected: childrenOnShift.length,
      highRiskChildren: childrenOnShift.filter(c => c.riskLevel === "high" || c.riskLevel === "very_high").length,
      oneToOneRequired: childrenOnShift.filter(c => c.requiresOneToOne).length,
      sleepInRequired: shiftType === "night",
    };

    const result = analyzeShiftSafety(todayShifts, childrenOnShift, requirement);
    return NextResponse.json({ shiftSafety: result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
