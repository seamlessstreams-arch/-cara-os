// ══════════════════════════════════════════════════════════════════════════════
// API: /api/shift-intelligence
//
// Shift Pattern & Staff Deployment Intelligence
//
// GET  — Returns deployment intelligence analysis with demo shift data
// POST — Accepts custom shift data and returns tailored analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateDeploymentIntelligence,
  evaluateFatigueRisk,
  getShiftTypeLabel,
  getComplianceRatingLabel,
  getFatigueRiskLabel,
} from "@/lib/shift-intelligence";
import type {
  ShiftRecord,
  StaffProfile,
  HomeShiftRequirements,
} from "@/lib/shift-intelligence";

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_STAFF: StaffProfile[] = [
  {
    id: "staff-sarah",
    name: "Sarah Johnson",
    role: "team_leader",
    contractedHoursPerWeek: 37.5,
    isAgency: false,
    keyWorkerFor: ["child-alex"],
    qualifications: ["Level 5 Diploma", "Therapeutic Crisis Intervention"],
    canWorkAlone: true,
    maxConsecutiveDays: 5,
  },
  {
    id: "staff-mike",
    name: "Mike Chen",
    role: "residential_child_worker",
    contractedHoursPerWeek: 37.5,
    isAgency: false,
    keyWorkerFor: ["child-jordan"],
    qualifications: ["Level 3 Diploma", "First Aid"],
    canWorkAlone: false,
    maxConsecutiveDays: 5,
  },
  {
    id: "staff-lisa",
    name: "Lisa Williams",
    role: "senior_rcw",
    contractedHoursPerWeek: 37.5,
    isAgency: false,
    keyWorkerFor: ["child-morgan"],
    qualifications: ["Level 3 Diploma", "PACE trained"],
    canWorkAlone: true,
    maxConsecutiveDays: 5,
  },
  {
    id: "staff-tom",
    name: "Tom Watson",
    role: "residential_child_worker",
    contractedHoursPerWeek: 37.5,
    isAgency: false,
    keyWorkerFor: [],
    qualifications: ["Level 3 Diploma"],
    canWorkAlone: false,
    maxConsecutiveDays: 5,
  },
  {
    id: "staff-agency-1",
    name: "Agency Worker (J. Patel)",
    role: "agency",
    contractedHoursPerWeek: 0,
    isAgency: true,
    keyWorkerFor: [],
    qualifications: ["Level 3 Diploma"],
    canWorkAlone: false,
    maxConsecutiveDays: 7,
  },
];

const DEMO_CHILDREN = [
  { id: "child-alex", name: "Alex" },
  { id: "child-jordan", name: "Jordan" },
  { id: "child-morgan", name: "Morgan" },
];

const DEMO_REQUIREMENTS: HomeShiftRequirements = {
  homeId: "oak-house",
  registeredCapacity: 4,
  currentOccupancy: 3,
  minimumStaffDay: 2,
  minimumStaffEvening: 2,
  minimumStaffNight: 1,
  requireSeniorOnShift: true,
  maximumAgencyPercentage: 30,
  keyWorkerContactMinDaysPerWeek: 3,
};

function generateDemoShifts(): ShiftRecord[] {
  const shifts: ShiftRecord[] = [];
  const weekStart = "2026-05-18"; // Current week (Sunday)

  // Monday to Friday — realistic rota with minor concerns
  for (let d = 0; d < 5; d++) {
    const dayNum = 18 + d;
    const date = `2026-05-${dayNum < 10 ? "0" + dayNum : dayNum}`;

    // Day shifts (07:00-15:00)
    if (d < 4) {
      // Mon-Thu: Sarah covers days
      shifts.push({
        id: `day-sarah-${d}`,
        staffId: "staff-sarah",
        staffName: "Sarah Johnson",
        role: "team_leader",
        shiftType: "day",
        date,
        startTime: "07:00",
        endTime: "15:00",
        isAgency: false,
        childrenPresent: 3,
      });
    }

    // Second day staff rotates
    if (d < 3) {
      shifts.push({
        id: `day-mike-${d}`,
        staffId: "staff-mike",
        staffName: "Mike Chen",
        role: "residential_child_worker",
        shiftType: "day",
        date,
        startTime: "07:00",
        endTime: "15:00",
        isAgency: false,
        childrenPresent: 3,
      });
    } else {
      // Thu-Fri: Agency covers
      shifts.push({
        id: `day-agency-${d}`,
        staffId: "staff-agency-1",
        staffName: "Agency Worker (J. Patel)",
        role: "agency",
        shiftType: "day",
        date,
        startTime: "07:00",
        endTime: "15:00",
        isAgency: true,
        childrenPresent: 3,
      });
    }

    // Evening shifts (14:00-22:00)
    shifts.push({
      id: `eve-lisa-${d}`,
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      role: "senior_rcw",
      shiftType: "evening",
      date,
      startTime: "14:00",
      endTime: "22:00",
      isAgency: false,
      childrenPresent: 3,
    });

    if (d < 4) {
      shifts.push({
        id: `eve-tom-${d}`,
        staffId: "staff-tom",
        staffName: "Tom Watson",
        role: "residential_child_worker",
        shiftType: "evening",
        date,
        startTime: "14:00",
        endTime: "22:00",
        isAgency: false,
        childrenPresent: 3,
      });
    }
    // Friday evening: only Lisa (understaffed + lone working scenario)

    // Waking night (22:00-07:00)
    shifts.push({
      id: `night-tom-${d}`,
      staffId: "staff-tom",
      staffName: "Tom Watson",
      role: "waking_night_staff",
      shiftType: "waking_night",
      date,
      startTime: "22:00",
      endTime: "07:00",
      isAgency: false,
      childrenPresent: 3,
    });
  }

  return shifts;
}

// ── GET: Demo Analysis ─────────────────────────────────────────────────────

export async function GET() {
  const shifts = generateDemoShifts();
  const result = generateDeploymentIntelligence(
    shifts,
    DEMO_STAFF,
    DEMO_CHILDREN,
    DEMO_REQUIREMENTS,
    "2026-05-18",
    "2026-05-22",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        staff: DEMO_STAFF.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          isAgency: s.isAgency,
          keyWorkerFor: s.keyWorkerFor,
        })),
        children: DEMO_CHILDREN,
        requirements: DEMO_REQUIREMENTS,
        labels: {
          complianceRating: getComplianceRatingLabel(result.complianceRating),
          fatigueRisks: result.fatigueAssessments.map((fa) => ({
            staffName: fa.staffName,
            level: getFatigueRiskLabel(fa.riskLevel),
          })),
        },
      },
    },
  });
}

// ── POST: Custom Analysis ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { shifts, staff, children, requirements, periodStart, periodEnd } = body as {
    shifts?: ShiftRecord[];
    staff?: StaffProfile[];
    children?: { id: string; name: string }[];
    requirements?: HomeShiftRequirements;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
    return NextResponse.json(
      { error: "shifts array is required and must be non-empty" },
      { status: 400 },
    );
  }
  if (!staff || !Array.isArray(staff) || staff.length === 0) {
    return NextResponse.json(
      { error: "staff array is required and must be non-empty" },
      { status: 400 },
    );
  }
  if (!requirements) {
    return NextResponse.json(
      { error: "requirements object is required" },
      { status: 400 },
    );
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const result = generateDeploymentIntelligence(
    shifts,
    staff,
    children ?? [],
    requirements,
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
