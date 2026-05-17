// ══════════════════════════════════════════════════════════════════════════════
// API: /api/supervision — Staff Supervision Management
//
// Returns supervision compliance, team metrics, wellbeing tracking, and
// action management. Powers the supervision dashboard and staff oversight.
//
// CHR 2015 Reg 33 — Employment of staff (supervision requirement).
// Ofsted SCCIF — "Staff receive regular, high-quality supervision."
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateSupervisionCompliance,
  calculateTeamMetrics,
} from "@/lib/supervision";
import type { StaffSupervisionProfile, SupervisionRecord } from "@/lib/supervision";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const staffId = url.searchParams.get("staffId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, staffId, view);
    }

    return NextResponse.json(getDemoData(homeId, staffId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ────────────────────────────────────────────────��─────────────

async function handleLiveData(sb: any, homeId: string, staffId: string | null, view: string) {
  let query = (sb.from("staff_supervision_profiles") as SB)
    .select("*, supervision_records(*, supervision_actions(*))")
    .eq("home_id", homeId);

  if (staffId) {
    query = query.eq("staff_id", staffId);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const profiles: StaffSupervisionProfile[] = (rows ?? []).map(mapToProfile);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateTeamMetrics(profiles, homeId));
    case "compliance":
      return NextResponse.json({
        results: profiles.map(p => evaluateSupervisionCompliance(p)),
      });
    case "staff":
      if (!staffId || profiles.length === 0) {
        return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
      }
      return NextResponse.json({
        compliance: evaluateSupervisionCompliance(profiles[0]),
        history: profiles[0].supervisionHistory,
      });
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToProfile(row: any): StaffSupervisionProfile {
  return {
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffRole: row.staff_role ?? "",
    homeId: row.home_id,
    startDate: row.start_date,
    isInProbation: row.is_in_probation ?? false,
    supervisorId: row.supervisor_id ?? "",
    supervisorName: row.supervisor_name ?? "",
    supervisionHistory: (row.supervision_records ?? []).map((r: any) => ({
      id: r.id,
      staffId: r.staff_id,
      staffName: r.staff_name ?? row.staff_name,
      staffRole: r.staff_role ?? row.staff_role ?? "",
      supervisorId: r.supervisor_id ?? "",
      supervisorName: r.supervisor_name ?? "",
      homeId: r.home_id ?? row.home_id,
      type: r.type,
      date: r.date,
      durationMinutes: r.duration_minutes ?? 60,
      location: r.location ?? "",
      topicsCovered: r.topics_covered ?? [],
      keyDiscussionPoints: r.key_discussion_points ?? [],
      staffWellbeingRating: r.staff_wellbeing_rating ?? 3,
      reflectivePracticeIncluded: r.reflective_practice_included ?? false,
      safeguardingDiscussed: r.safeguarding_discussed ?? false,
      actions: (r.supervision_actions ?? []).map((a: any) => ({
        id: a.id,
        description: a.description ?? "",
        assignedTo: a.assigned_to ?? "",
        dueDate: a.due_date,
        status: a.status ?? "open",
        completedAt: a.completed_at,
        notes: a.notes,
      })),
      previousActionsReviewed: r.previous_actions_reviewed ?? false,
      staffAgreed: r.staff_agreed ?? false,
      staffAgreedAt: r.staff_agreed_at,
      supervisorSignedAt: r.supervisor_signed_at ?? "",
    })),
    nextScheduledDate: row.next_scheduled_date,
    annualAppraisalDue: row.annual_appraisal_due,
  };
}

// ── Demo Data ─────────────────────────���───────────────────────────────────

function getDemoData(homeId: string, staffId: string | null, view: string) {
  const allProfiles = getDemoProfiles(homeId);
  const profiles = staffId ? allProfiles.filter(p => p.staffId === staffId) : allProfiles;

  switch (view) {
    case "overview":
      return calculateTeamMetrics(allProfiles, homeId);
    case "compliance":
      return { results: profiles.map(p => evaluateSupervisionCompliance(p)) };
    case "staff":
      if (profiles.length === 0) return { error: "Staff profile not found" };
      return {
        compliance: evaluateSupervisionCompliance(profiles[0]),
        history: profiles[0].supervisionHistory.slice(0, 6),
      };
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function generateSessions(staffId: string, staffName: string, count: number, startDaysAgo: number = 0): SupervisionRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(new Date("2026-05-16T12:00:00Z").getTime() - (startDaysAgo + i * 21) * 24 * 60 * 60 * 1000);
    return {
      id: `sv-${staffId}-${i}`,
      staffId,
      staffName,
      staffRole: "Residential Worker",
      supervisorId: "staff-rm-001",
      supervisorName: "Claire Edwards (RM)",
      homeId: "home-oak",
      type: "formal" as const,
      date: date.toISOString(),
      durationMinutes: 60,
      location: "Office",
      topicsCovered: ["caseload_review", "safeguarding", "staff_wellbeing"] as any[],
      keyDiscussionPoints: ["General update", "Child progress discussion"],
      staffWellbeingRating: (4 - Math.floor(i / 4)) as 1 | 2 | 3 | 4 | 5,
      reflectivePracticeIncluded: i % 2 === 0,
      safeguardingDiscussed: true,
      actions: i === 0 ? [{
        id: `act-${staffId}-1`,
        description: "Complete updated training plan",
        assignedTo: staffId,
        dueDate: "2026-06-01T00:00:00Z",
        status: "open" as const,
      }] : [],
      previousActionsReviewed: true,
      staffAgreed: true,
      staffAgreedAt: date.toISOString(),
      supervisorSignedAt: date.toISOString(),
    };
  });
}

function getDemoProfiles(homeId: string): StaffSupervisionProfile[] {
  return [
    {
      staffId: "staff-001",
      staffName: "Sarah Mitchell",
      staffRole: "Senior Residential Worker",
      homeId,
      startDate: "2023-03-01T00:00:00Z",
      isInProbation: false,
      supervisorId: "staff-rm-001",
      supervisorName: "Claire Edwards (RM)",
      supervisionHistory: generateSessions("staff-001", "Sarah Mitchell", 9, 10),
      nextScheduledDate: "2026-05-27T10:00:00Z",
      annualAppraisalDue: "2026-09-01T00:00:00Z",
    },
    {
      staffId: "staff-002",
      staffName: "Tom Richards",
      staffRole: "Residential Worker",
      homeId,
      startDate: "2024-06-01T00:00:00Z",
      isInProbation: false,
      supervisorId: "staff-001",
      supervisorName: "Sarah Mitchell (Senior)",
      supervisionHistory: generateSessions("staff-002", "Tom Richards", 8, 14),
      nextScheduledDate: "2026-05-23T14:00:00Z",
      annualAppraisalDue: "2026-06-01T00:00:00Z",
    },
    {
      staffId: "staff-003",
      staffName: "Lisa Park",
      staffRole: "Residential Worker",
      homeId,
      startDate: "2025-01-15T00:00:00Z",
      isInProbation: false,
      supervisorId: "staff-001",
      supervisorName: "Sarah Mitchell (Senior)",
      supervisionHistory: generateSessions("staff-003", "Lisa Park", 7, 18),
      nextScheduledDate: "2026-05-20T10:00:00Z",
      annualAppraisalDue: "2026-01-15T00:00:00Z", // overdue!
    },
    {
      staffId: "staff-004",
      staffName: "Marcus Johnson",
      staffRole: "Waking Night Worker",
      homeId,
      startDate: "2024-09-01T00:00:00Z",
      isInProbation: false,
      supervisorId: "staff-rm-001",
      supervisorName: "Claire Edwards (RM)",
      supervisionHistory: generateSessions("staff-004", "Marcus Johnson", 6, 45), // overdue!
      nextScheduledDate: undefined,
      annualAppraisalDue: "2026-09-01T00:00:00Z",
    },
    {
      staffId: "staff-005",
      staffName: "Emma Wilson",
      staffRole: "Residential Worker (Probation)",
      homeId,
      startDate: "2026-04-01T00:00:00Z",
      isInProbation: true,
      supervisorId: "staff-001",
      supervisorName: "Sarah Mitchell (Senior)",
      supervisionHistory: [
        ...generateSessions("staff-005", "Emma Wilson", 3, 7).map(s => ({ ...s, type: "probation" as const })),
      ],
      nextScheduledDate: "2026-05-19T10:00:00Z",
      annualAppraisalDue: undefined,
    },
  ];
}
