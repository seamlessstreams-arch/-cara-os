// ══════════════════════════════════════════════════════════════════════════════
// API: /api/staff-deployment — Staff Deployment Intelligence
//
// GET  — returns Chamberlain House demo deployment intelligence
// POST — accepts custom data with validation
//
// CHR 2015 Reg 32 — Organisation of children's home (sufficient staff)
// CHR 2015 Reg 33 — Employment of staff
// Schedule 1 Standard 25 — Sufficient staff with right skills & experience
// SCCIF — Leadership and Management
// Working Together 2023
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateStaffDeploymentIntelligence } from "@/lib/staff-deployment";
import type {
  StaffMember,
  ShiftRota,
  AgencyUsage,
  ConsistencyRecord,
  StaffingIncident,
} from "@/lib/staff-deployment";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET() {
  const now = new Date().toISOString();
  const periodStart = "2026-01-01T00:00:00Z";
  const periodEnd = now;

  const { staffMembers, rotas, agencyUsages, consistencyRecords, incidents, rotaPublishedDates } = getOakHouseDemoData();

  const result = generateStaffDeploymentIntelligence(
    staffMembers, rotas, agencyUsages, consistencyRecords, incidents, rotaPublishedDates,
    "home-oak", periodStart, periodEnd, now,
  );

  return NextResponse.json(result);
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    staffMembers,
    rotas,
    agencyUsages,
    consistencyRecords,
    incidents,
    rotaPublishedDates,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body;

  if (!staffMembers || !Array.isArray(staffMembers)) {
    return NextResponse.json({ error: "staffMembers (array) is required" }, { status: 400 });
  }
  if (!rotas || !Array.isArray(rotas)) {
    return NextResponse.json({ error: "rotas (array) is required" }, { status: 400 });
  }
  if (!homeId || typeof homeId !== "string") {
    return NextResponse.json({ error: "homeId (string) is required" }, { status: 400 });
  }
  if (!periodStart || typeof periodStart !== "string") {
    return NextResponse.json({ error: "periodStart (ISO string) is required" }, { status: 400 });
  }
  if (!periodEnd || typeof periodEnd !== "string") {
    return NextResponse.json({ error: "periodEnd (ISO string) is required" }, { status: 400 });
  }

  const result = generateStaffDeploymentIntelligence(
    staffMembers as StaffMember[],
    rotas as ShiftRota[],
    (agencyUsages as AgencyUsage[]) ?? [],
    (consistencyRecords as ConsistencyRecord[]) ?? [],
    (incidents as StaffingIncident[]) ?? [],
    (rotaPublishedDates as { weekStarting: string; publishedDate: string }[]) ?? [],
    homeId as string,
    periodStart as string,
    periodEnd as string,
    (referenceDate as string) ?? new Date().toISOString(),
  );

  return NextResponse.json(result);
}

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────

function getOakHouseDemoData() {
  const staffMembers: StaffMember[] = [
    { id: "staff-sarah", name: "Sarah Johnson", role: "registered_manager", contractType: "permanent", startDate: "2022-01-10T00:00:00Z", keyChildren: ["child-alex", "child-jordan"] },
    { id: "staff-tom", name: "Tom Richards", role: "rsw", contractType: "permanent", startDate: "2023-03-15T00:00:00Z", keyChildren: ["child-morgan"] },
    { id: "staff-lisa", name: "Lisa Williams", role: "senior_rsw", contractType: "permanent", startDate: "2023-06-01T00:00:00Z", keyChildren: ["child-alex"] },
    { id: "staff-darren", name: "Darren Laville", role: "registered_manager", contractType: "permanent", startDate: "2021-09-01T00:00:00Z", keyChildren: ["child-jordan", "child-morgan"] },
    { id: "staff-bank-1", name: "Emma Wilson", role: "bank", contractType: "bank", startDate: "2024-01-15T00:00:00Z", keyChildren: [] },
    { id: "staff-agency-1", name: "James Carter", role: "agency", contractType: "agency", startDate: "2026-02-01T00:00:00Z", keyChildren: [] },
  ];

  const rotas: ShiftRota[] = [
    // January — well staffed
    { date: "2026-01-05T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-05T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-lisa", "staff-darren"], actualStaff: ["staff-lisa", "staff-darren"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-05T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-tom"], actualStaff: ["staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-12T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-12T00:00:00Z", shiftType: "long_day", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-19T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 2 },
    { date: "2026-01-19T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 2 },
    { date: "2026-01-19T00:00:00Z", shiftType: "sleep_in", plannedStaff: ["staff-lisa"], actualStaff: ["staff-lisa"], status: "filled", childrenPresent: 2 },
    // February — one agency cover
    { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-agency-1"], status: "agency_cover", childrenPresent: 3 },
    { date: "2026-02-02T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-02-09T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-tom"], actualStaff: ["staff-darren", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-02-09T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-sarah"], actualStaff: ["staff-sarah"], status: "filled", childrenPresent: 3 },
    { date: "2026-02-16T00:00:00Z", shiftType: "long_day", plannedStaff: ["staff-lisa", "staff-tom"], actualStaff: ["staff-lisa", "staff-tom"], status: "filled", childrenPresent: 2 },
    { date: "2026-02-16T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren"], actualStaff: ["staff-darren"], status: "filled", childrenPresent: 2 },
    // March — one bank cover, one unfilled
    { date: "2026-03-02T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-bank-1"], status: "bank_cover", childrenPresent: 3 },
    { date: "2026-03-02T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-03-09T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-tom"], actualStaff: ["staff-tom"], status: "unfilled", childrenPresent: 3 },
    { date: "2026-03-09T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-lisa"], actualStaff: ["staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-03-16T00:00:00Z", shiftType: "afternoon", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 2 },
    { date: "2026-03-16T00:00:00Z", shiftType: "sleep_in", plannedStaff: ["staff-darren"], actualStaff: ["staff-darren"], status: "filled", childrenPresent: 2 },
    // April — overtime shift
    { date: "2026-04-06T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-lisa"], actualStaff: ["staff-sarah", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-04-06T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-tom"], actualStaff: ["staff-darren", "staff-tom"], status: "overtime", childrenPresent: 3 },
    { date: "2026-04-13T00:00:00Z", shiftType: "long_day", plannedStaff: ["staff-lisa", "staff-darren"], actualStaff: ["staff-lisa", "staff-darren"], status: "filled", childrenPresent: 3 },
    { date: "2026-04-13T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-tom"], actualStaff: ["staff-tom"], status: "filled", childrenPresent: 3 },
    // May — filled
    { date: "2026-05-04T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-05-04T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-05-11T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 2 },
    { date: "2026-05-11T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 2 },
  ];

  const agencyUsages: AgencyUsage[] = [
    { date: "2026-02-02T00:00:00Z", agencyStaffId: "staff-agency-1", reason: "sickness_cover", briefingCompleted: true, childrenKnown: false },
  ];

  const consistencyRecords: ConsistencyRecord[] = [
    { childId: "child-alex", primaryKeyWorker: "Sarah Johnson", secondaryKeyWorker: "Lisa Williams", staffContactCount: 45, uniqueStaffCount: 4, period: "2026-Q1-Q2" },
    { childId: "child-jordan", primaryKeyWorker: "Sarah Johnson", secondaryKeyWorker: "Darren Laville", staffContactCount: 40, uniqueStaffCount: 5, period: "2026-Q1-Q2" },
    { childId: "child-morgan", primaryKeyWorker: "Tom Richards", secondaryKeyWorker: "Darren Laville", staffContactCount: 38, uniqueStaffCount: 5, period: "2026-Q1-Q2" },
  ];

  const incidents: StaffingIncident[] = [
    { date: "2026-03-09T00:00:00Z", type: "understaffed", impact: "One RSW short on morning shift, remaining staff managed safely", resolution: "Bank staff called in for afternoon cover" },
  ];

  const rotaPublishedDates = [
    { weekStarting: "2026-01-05T00:00:00Z", publishedDate: "2025-12-27T00:00:00Z" },
    { weekStarting: "2026-01-12T00:00:00Z", publishedDate: "2026-01-04T00:00:00Z" },
    { weekStarting: "2026-01-19T00:00:00Z", publishedDate: "2026-01-11T00:00:00Z" },
    { weekStarting: "2026-02-02T00:00:00Z", publishedDate: "2026-01-25T00:00:00Z" },
    { weekStarting: "2026-02-09T00:00:00Z", publishedDate: "2026-02-01T00:00:00Z" },
    { weekStarting: "2026-02-16T00:00:00Z", publishedDate: "2026-02-08T00:00:00Z" },
    { weekStarting: "2026-03-02T00:00:00Z", publishedDate: "2026-02-22T00:00:00Z" },
    { weekStarting: "2026-03-09T00:00:00Z", publishedDate: "2026-03-01T00:00:00Z" },
    { weekStarting: "2026-03-16T00:00:00Z", publishedDate: "2026-03-08T00:00:00Z" },
    { weekStarting: "2026-04-06T00:00:00Z", publishedDate: "2026-03-29T00:00:00Z" },
    { weekStarting: "2026-04-13T00:00:00Z", publishedDate: "2026-04-05T00:00:00Z" },
    { weekStarting: "2026-05-04T00:00:00Z", publishedDate: "2026-04-26T00:00:00Z" },
    { weekStarting: "2026-05-11T00:00:00Z", publishedDate: "2026-05-03T00:00:00Z" },
  ];

  return { staffMembers, rotas, agencyUsages, consistencyRecords, incidents, rotaPublishedDates };
}
