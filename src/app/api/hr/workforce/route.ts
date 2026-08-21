// ══════════════════════════════════════════════════════════════════════════════
// API: /api/hr/workforce — Workforce Intelligence & Training Compliance
//
// Returns workforce metrics, training compliance, supervision status, and
// staffing analytics. Powers the HR/RM dashboard and workforce management UI.
//
// CHR 2015 Reg 32/33, SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateTrainingCompliance,
  evaluateSupervisionCompliance,
  calculateWorkforceMetrics,
  identifyTrainingGaps,
  getMandatoryTraining,
} from "@/lib/hr-files";
import type {
  StaffMember,
  TrainingCategory,
} from "@/lib/hr-files";

import { seedDay } from "@/lib/seed-date";
type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId");
    const staffId = url.searchParams.get("staffId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, staffId, view);
    }

    return NextResponse.json(getDemoData(homeId, staffId, view));
  } catch (_error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(
  sb: any,
  homeId: string | null,
  staffId: string | null,
  view: string,
) {
  let query = (sb.from("staff_profiles") as SB)
    .select("*, staff_training(*), staff_supervisions(*), staff_absences(*)");
  if (homeId) query = query.eq("home_id", homeId);
  if (staffId) query = query.eq("id", staffId);

  const { data: staffRows, error } = await query;
  if (error) throw error;

  const staff: StaffMember[] = (staffRows ?? []).map(mapToStaffMember);
  const now = new Date().toISOString();

  if (view === "training" && staffId) {
    const member = staff[0];
    if (!member) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    const compliance = evaluateTrainingCompliance(member, now);
    return NextResponse.json({ staff: member, training: compliance });
  }

  if (view === "supervision" && staffId) {
    const member = staff[0];
    if (!member) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    const supervision = evaluateSupervisionCompliance(member, now);
    return NextResponse.json({ staff: member, supervision });
  }

  if (view === "gaps") {
    const gaps = identifyTrainingGaps(staff, now);
    return NextResponse.json({ gaps });
  }

  // Overview
  const { data: establishment } = await (sb.from("home_establishments") as SB)
    .select("established_posts")
    .eq("home_id", homeId ?? "home-oak")
    .single();

  const metrics = calculateWorkforceMetrics(
    staff,
    establishment?.established_posts ?? staff.length,
    0,
    now,
  );
  const gaps = identifyTrainingGaps(staff, now);
  const trainingResults = staff.map((s: StaffMember) => ({
    ...evaluateTrainingCompliance(s, now),
  }));
  const supervisionResults = staff.map((s: StaffMember) => ({
    ...evaluateSupervisionCompliance(s, now),
  }));

  return NextResponse.json({
    metrics,
    trainingGaps: gaps.slice(0, 10),
    staffTraining: trainingResults,
    staffSupervision: supervisionResults,
    staff: staff.map((s: StaffMember) => ({ id: s.id, name: s.name, role: s.role })),
  });
}

// ── Mapper ────────────────────────────────────────────────────────────────

function mapToStaffMember(row: any): StaffMember {
  return {
    id: row.id,
    name: row.name ?? row.full_name ?? "Unknown",
    role: row.role,
    homeId: row.home_id,
    startDate: row.start_date,
    contractHours: row.contract_hours ?? 37.5,
    isAgency: row.is_agency ?? false,
    training: (row.staff_training ?? []).map((t: any) => ({
      category: t.category,
      status: t.status,
      completedAt: t.completed_at,
      expiresAt: t.expires_at,
      bookedFor: t.booked_for,
      provider: t.provider,
      certificateRef: t.certificate_ref,
    })),
    supervisions: (row.staff_supervisions ?? []).map((s: any) => ({
      id: s.id,
      type: s.type,
      date: s.date,
      supervisorId: s.supervisor_id,
      supervisorName: s.supervisor_name ?? "Unknown",
      durationMinutes: s.duration_minutes ?? 60,
      topics: s.topics ?? [],
      actionPoints: s.action_points ?? 0,
      actionPointsCompleted: s.action_points_completed ?? 0,
      signedOff: s.signed_off ?? false,
    })),
    absences: (row.staff_absences ?? []).map((a: any) => ({
      type: a.type,
      startDate: a.start_date,
      endDate: a.end_date,
      daysLost: a.days_lost ?? 0,
      returnToWorkCompleted: a.return_to_work_completed,
      fitNoteProvided: a.fit_note_provided,
      reason: a.reason,
    })),
    qualificationLevel: row.qualification_level,
    qualificationTarget: row.qualification_target,
    qualificationDeadline: row.qualification_deadline,
    probation: row.probation_status ? {
      startDate: row.probation_start_date ?? row.start_date,
      expectedEndDate: row.probation_end_date ?? "",
      status: row.probation_status,
      reviews: [],
      extendedUntil: row.probation_extended_until,
      passedDate: row.probation_passed_date,
    } : undefined,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function getDemoData(homeId: string | null, staffId: string | null, view: string) {
  const now = new Date().toISOString();
  const home = homeId ?? "home-oak";

  const allMandatory: TrainingCategory[] = getMandatoryTraining("rsw");

  const demoStaff: StaffMember[] = [
    // Fully compliant
    {
      id: "staff-001",
      name: "Sarah Mitchell",
      role: "rsw",
      homeId: home,
      startDate: `${seedDay(-830)}T00:00:00Z`,
      contractHours: 37.5,
      isAgency: false,
      training: allMandatory.map(cat => ({
        category: cat,
        status: "completed" as const,
        completedAt: `${seedDay(-71)}T10:00:00Z`,
        expiresAt: `${seedDay(294)}T10:00:00Z`,
      })),
      supervisions: [
        { id: "sup-s1-1", type: "formal", date: `${seedDay(-9)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 60, topics: ["workload", "training"], actionPoints: 2, actionPointsCompleted: 1, signedOff: true },
        { id: "sup-s1-2", type: "formal", date: `${seedDay(-37)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 55, topics: ["children's progress", "wellbeing"], actionPoints: 3, actionPointsCompleted: 3, signedOff: true },
        { id: "sup-s1-3", type: "formal", date: `${seedDay(-65)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 50, topics: ["development goals"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [
        { type: "sickness", startDate: seedDay(-90), endDate: seedDay(-88), daysLost: 3, returnToWorkCompleted: true },
      ],
      qualificationLevel: 3,
      qualificationTarget: 3,
    },
    // Training gap - expired restraint
    {
      id: "staff-002",
      name: "James Cooper",
      role: "senior_rsw",
      homeId: home,
      startDate: `${seedDay(-1061)}T00:00:00Z`,
      contractHours: 37.5,
      isAgency: false,
      training: allMandatory.map(cat => ({
        category: cat,
        status: cat === "restraint" ? "completed" as const : "completed" as const,
        completedAt: `${seedDay(-405)}T10:00:00Z`,
        expiresAt: cat === "restraint" ? "2026-04-01T10:00:00Z" : "2027-04-01T10:00:00Z", // restraint expired
      })),
      supervisions: [
        { id: "sup-s2-1", type: "formal", date: `${seedDay(-6)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 60, topics: ["practice standards"], actionPoints: 2, actionPointsCompleted: 0, signedOff: true },
        { id: "sup-s2-2", type: "formal", date: `${seedDay(-34)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 55, topics: ["mentoring"], actionPoints: 1, actionPointsCompleted: 1, signedOff: true },
      ],
      absences: [],
      qualificationLevel: 4,
      qualificationTarget: 4,
    },
    // Supervision overdue
    {
      id: "staff-003",
      name: "Priya Sharma",
      role: "rsw",
      homeId: home,
      startDate: `${seedDay(-486)}T00:00:00Z`,
      contractHours: 30,
      isAgency: false,
      training: allMandatory.map(cat => ({
        category: cat,
        status: "completed" as const,
        completedAt: `${seedDay(-344)}T10:00:00Z`,
        expiresAt: `${seedDay(21)}T10:00:00Z`,
      })),
      supervisions: [
        { id: "sup-s3-1", type: "formal", date: `${seedDay(-57)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 45, topics: ["induction progress"], actionPoints: 4, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [
        { type: "sickness", startDate: seedDay(-52), endDate: seedDay(-31), daysLost: 15, returnToWorkCompleted: true, fitNoteProvided: true },
      ],
      qualificationLevel: 2,
      qualificationTarget: 3,
      qualificationDeadline: `${seedDay(244)}T00:00:00Z`,
    },
    // Agency staff - minimal training
    {
      id: "staff-004",
      name: "Michael Barnes",
      role: "waking_night",
      homeId: home,
      startDate: `${seedDay(-71)}T00:00:00Z`,
      contractHours: 37.5,
      isAgency: true,
      training: [
        { category: "induction", status: "completed", completedAt: `${seedDay(-70)}T10:00:00Z` },
        { category: "safeguarding_basic", status: "completed", completedAt: `${seedDay(-71)}T10:00:00Z`, expiresAt: `${seedDay(294)}T10:00:00Z` },
        { category: "first_aid", status: "completed", completedAt: `${seedDay(-481)}T10:00:00Z`, expiresAt: `${seedDay(614)}T10:00:00Z` },
        { category: "fire_safety", status: "completed", completedAt: `${seedDay(-80)}T10:00:00Z`, expiresAt: `${seedDay(285)}T10:00:00Z` },
      ],
      supervisions: [
        { id: "sup-s4-1", type: "formal", date: `${seedDay(-26)}T10:00:00Z`, supervisorId: "staff-005", supervisorName: "Lisa Chen", durationMinutes: 30, topics: ["orientation", "expectations"], actionPoints: 2, actionPointsCompleted: 1, signedOff: true },
      ],
      absences: [],
      probation: {
        startDate: `${seedDay(-71)}T00:00:00Z`,
        expectedEndDate: `${seedDay(113)}T00:00:00Z`,
        status: "in_progress",
        reviews: [{ date: seedDay(-40), outcome: "On track", reviewedBy: "staff-005" }],
      },
    },
    // Team Leader - fully compliant
    {
      id: "staff-005",
      name: "Lisa Chen",
      role: "team_leader",
      homeId: home,
      startDate: `${seedDay(-1348)}T00:00:00Z`,
      contractHours: 37.5,
      isAgency: false,
      training: [...getMandatoryTraining("team_leader")].map(cat => ({
        category: cat,
        status: "completed" as const,
        completedAt: `${seedDay(-99)}T10:00:00Z`,
        expiresAt: `${seedDay(266)}T10:00:00Z`,
      })),
      supervisions: [
        { id: "sup-s5-1", type: "formal", date: `${seedDay(-3)}T10:00:00Z`, supervisorId: "user-dm-1", supervisorName: "Deputy Manager", durationMinutes: 75, topics: ["team performance", "Reg 44 feedback", "development"], actionPoints: 3, actionPointsCompleted: 1, signedOff: true },
        { id: "sup-s5-2", type: "formal", date: `${seedDay(-31)}T10:00:00Z`, supervisorId: "user-dm-1", supervisorName: "Deputy Manager", durationMinutes: 60, topics: ["staffing", "training plan"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sup-s5-3", type: "formal", date: `${seedDay(-59)}T10:00:00Z`, supervisorId: "user-dm-1", supervisorName: "Deputy Manager", durationMinutes: 60, topics: ["children outcomes"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [],
      qualificationLevel: 5,
      qualificationTarget: 5,
    },
  ];

  // Filter by staffId if individual view
  if (staffId) {
    const member = demoStaff.find(s => s.id === staffId);
    if (!member) return { error: "Staff not found" };

    if (view === "training") {
      return { staff: member, training: evaluateTrainingCompliance(member, now) };
    }
    if (view === "supervision") {
      return { staff: member, supervision: evaluateSupervisionCompliance(member, now) };
    }
    return { staff: member };
  }

  if (view === "gaps") {
    return { gaps: identifyTrainingGaps(demoStaff, now) };
  }

  // Default overview
  const metrics = calculateWorkforceMetrics(demoStaff, 6, 1, now); // 6 posts, 1 leaver
  const gaps = identifyTrainingGaps(demoStaff, now);
  const trainingResults = demoStaff.map(s => evaluateTrainingCompliance(s, now));
  const supervisionResults = demoStaff.map(s => evaluateSupervisionCompliance(s, now));

  return {
    metrics,
    trainingGaps: gaps,
    staffTraining: trainingResults,
    staffSupervision: supervisionResults,
    staff: demoStaff.map(s => ({ id: s.id, name: s.name, role: s.role, isAgency: s.isAgency })),
    teamSummary: {
      totalStaff: demoStaff.length,
      compliantTraining: trainingResults.filter(r => r.overallCompliant).length,
      compliantSupervision: supervisionResults.filter(r => r.isCompliant).length,
      onProbation: demoStaff.filter(s => s.probation?.status === "in_progress").length,
    },
  };
}
