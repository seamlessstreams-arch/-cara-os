// ══════════════════════════════════════════════════════════════════════════════
// Training & Development API Route
//
// GET  ?homeId=...&mode=dashboard|metrics|staff&staffId=...
// POST { action: "evaluate"|"metrics", ... }
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateStaffTrainingCompliance,
  calculateHomeTrainingMetrics,
  getTrainingCategoryLabel,
  getTrainingStatusLabel,
  MANDATORY_TRAINING,
} from "@/lib/training";
import type { StaffTrainingRecord } from "@/lib/training";

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_STAFF: StaffTrainingRecord[] = [
  {
    staffId: "staff-rm-01",
    staffName: "Darren Laville",
    role: "registered_manager",
    startDate: "2022-03-01T10:00:00Z",
    inductionCompleted: true,
    inductionCompletedDate: "2022-05-01T10:00:00Z",
    canWorkAlone: true,
    trainings: MANDATORY_TRAINING.map(mt => ({
      category: mt.category,
      courseName: mt.name,
      completedDate: "2026-02-15T10:00:00Z",
      expiryDate: mt.refreshPeriodMonths > 0 ? "2027-02-15T10:00:00Z" : undefined,
      status: "current" as const,
      mandatory: true,
    })),
    qualifications: [
      { type: "level_5_diploma" as const, title: "Level 5 Diploma in Leadership for Health & Social Care", status: "in_progress" as const, startDate: "2025-09-01T10:00:00Z", percentComplete: 45 },
      { type: "level_3_diploma" as const, title: "Level 3 Diploma in Residential Childcare", status: "achieved" as const, achievedDate: "2023-06-01T10:00:00Z" },
    ],
    cpdHoursThisYear: 18,
    cpdTarget: 25,
    supervisionUpToDate: true,
  },
  {
    staffId: "staff-sw-01",
    staffName: "Emma Richardson",
    role: "senior_worker",
    startDate: "2023-01-15T10:00:00Z",
    inductionCompleted: true,
    inductionCompletedDate: "2023-03-20T10:00:00Z",
    canWorkAlone: true,
    trainings: MANDATORY_TRAINING.map((mt, i) => ({
      category: mt.category,
      courseName: mt.name,
      completedDate: "2026-01-10T10:00:00Z",
      expiryDate: mt.refreshPeriodMonths > 0
        ? (i === 3 ? "2026-06-01T10:00:00Z" : "2027-01-10T10:00:00Z") // restraint expiring soon
        : undefined,
      status: (i === 3 ? "expiring_soon" : "current") as const,
      mandatory: true,
    })),
    qualifications: [
      { type: "level_3_diploma" as const, title: "Level 3 Diploma in Residential Childcare", status: "achieved" as const, achievedDate: "2024-08-01T10:00:00Z" },
    ],
    cpdHoursThisYear: 12,
    cpdTarget: 20,
    supervisionUpToDate: true,
  },
  {
    staffId: "staff-sw-02",
    staffName: "Marcus Thompson",
    role: "residential_worker",
    startDate: "2023-09-01T10:00:00Z",
    inductionCompleted: true,
    inductionCompletedDate: "2023-11-15T10:00:00Z",
    canWorkAlone: true,
    trainings: MANDATORY_TRAINING.map((mt, i) => ({
      category: mt.category,
      courseName: mt.name,
      completedDate: "2025-11-20T10:00:00Z",
      expiryDate: mt.refreshPeriodMonths > 0
        ? (i === 0 ? "2026-05-20T10:00:00Z" : "2026-11-20T10:00:00Z") // safeguarding expiring soon
        : undefined,
      status: (i === 0 ? "expiring_soon" : "current") as const,
      mandatory: true,
    })),
    qualifications: [
      { type: "level_3_diploma" as const, title: "Level 3 Diploma in Residential Childcare", status: "in_progress" as const, startDate: "2024-09-01T10:00:00Z", percentComplete: 60 },
    ],
    cpdHoursThisYear: 8,
    cpdTarget: 20,
    supervisionUpToDate: true,
  },
  {
    staffId: "staff-sw-03",
    staffName: "Jade Collins",
    role: "residential_worker",
    startDate: "2024-11-01T10:00:00Z",
    inductionCompleted: true,
    inductionCompletedDate: "2025-01-20T10:00:00Z",
    canWorkAlone: true,
    trainings: MANDATORY_TRAINING.map((mt, i) => ({
      category: mt.category,
      courseName: mt.name,
      completedDate: i < 14 ? "2025-12-01T10:00:00Z" : undefined,
      expiryDate: i < 14 && mt.refreshPeriodMonths > 0 ? "2026-12-01T10:00:00Z" : undefined,
      status: (i < 14 ? "current" : (i === 14 ? "in_progress" : "not_started")) as const,
      mandatory: true,
    })),
    qualifications: [
      { type: "level_3_diploma" as const, title: "Level 3 Diploma in Residential Childcare", status: "in_progress" as const, startDate: "2025-01-15T10:00:00Z", percentComplete: 25 },
    ],
    cpdHoursThisYear: 6,
    cpdTarget: 20,
    supervisionUpToDate: true,
  },
  {
    staffId: "staff-sw-04",
    staffName: "Ryan Okafor",
    role: "residential_worker",
    startDate: "2026-03-15T10:00:00Z",
    inductionCompleted: false,
    canWorkAlone: false,
    trainings: MANDATORY_TRAINING.map((mt, i) => ({
      category: mt.category,
      courseName: mt.name,
      completedDate: i < 10 ? "2026-04-01T10:00:00Z" : undefined,
      expiryDate: i < 10 && mt.refreshPeriodMonths > 0 ? "2027-04-01T10:00:00Z" : undefined,
      status: (i < 10 ? "current" : (i < 13 ? "booked" : "not_started")) as const,
      mandatory: true,
      bookedDate: i >= 10 && i < 13 ? "2026-06-01T10:00:00Z" : undefined,
    })),
    qualifications: [],
    cpdHoursThisYear: 4,
    cpdTarget: 20,
    supervisionUpToDate: true,
  },
];

// ── GET Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "home-oak";
  const mode = searchParams.get("mode") ?? "dashboard";
  const staffId = searchParams.get("staffId");

  const now = new Date().toISOString();

  if (mode === "staff" && staffId) {
    const record = DEMO_STAFF.find(s => s.staffId === staffId);
    if (!record) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    const compliance = evaluateStaffTrainingCompliance(record, now);
    return NextResponse.json({
      compliance,
      trainings: record.trainings.map(t => ({
        ...t,
        categoryLabel: getTrainingCategoryLabel(t.category),
        statusLabel: getTrainingStatusLabel(t.status),
      })),
      qualifications: record.qualifications,
      cpdHoursThisYear: record.cpdHoursThisYear,
      cpdTarget: record.cpdTarget,
    });
  }

  if (mode === "metrics") {
    const metrics = calculateHomeTrainingMetrics(DEMO_STAFF, homeId, now);
    return NextResponse.json(metrics);
  }

  // Dashboard mode
  const metrics = calculateHomeTrainingMetrics(DEMO_STAFF, homeId, now);
  const staffResults = DEMO_STAFF.map(r => ({
    staffId: r.staffId,
    staffName: r.staffName,
    role: r.role,
    ...evaluateStaffTrainingCompliance(r, now),
  }));

  return NextResponse.json({
    metrics: {
      staffCount: metrics.staffCount,
      overallComplianceRate: metrics.overallComplianceRate,
      fullyCompliantStaff: metrics.fullyCompliantStaff,
      staffWithExpiredTraining: metrics.staffWithExpiredTraining,
      staffWithExpiringSoon: metrics.staffWithExpiringSoon,
      inductionCompletionRate: metrics.inductionCompletionRate,
      qualificationRate: metrics.qualificationRate,
      averageCpdHours: metrics.averageCpdHours,
      cpdComplianceRate: metrics.cpdComplianceRate,
      restraintTrainingCurrent: metrics.restraintTrainingCurrent,
      safeguardingCurrent: metrics.safeguardingCurrent,
      firstAidCurrent: metrics.firstAidCurrent,
      loneWorkingAuthorised: metrics.loneWorkingAuthorised,
    },
    staff: staffResults.map(r => ({
      staffId: r.staffId,
      staffName: r.staffName,
      role: r.role,
      isCompliant: r.isCompliant,
      overallComplianceRate: r.overallComplianceRate,
      expiredCount: r.expiredCount,
      expiringSoonCount: r.expiringSoonCount,
      inductionComplete: r.inductionComplete,
      qualificationOnTrack: r.qualificationOnTrack,
      issueCount: r.issues.length,
    })),
    upcomingExpiries: metrics.upcomingExpiries.slice(0, 5),
    staffNeedingAttention: metrics.staffNeedingAttention,
    complianceIssues: metrics.complianceIssues,
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "evaluate") {
    const { staffRecord } = body;
    if (!staffRecord) {
      return NextResponse.json({ error: "staffRecord required" }, { status: 400 });
    }
    const result = evaluateStaffTrainingCompliance(staffRecord);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const { staffRecords, homeId } = body;
    if (!staffRecords || !homeId) {
      return NextResponse.json({ error: "staffRecords and homeId required" }, { status: 400 });
    }
    const result = calculateHomeTrainingMetrics(staffRecords, homeId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
