// ═══════════════════════════════════════════════════���══════════════════════════
// API: /api/quality-ecology — Quality Ecology Dashboard Data
//
// Returns lifecycle statistics, compliance metrics, and pending items for the
// current user's homes. Powers the Control Centre quality overview.
// ═════════════════════════════════════════════════���════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { calculateCompliance } from "@/lib/quality-ecology";
import type { ScheduledOccurrence, LifecycleStatus } from "@/lib/quality-ecology";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId");

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId);
    }

    return NextResponse.json(getDemoData(homeId));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string | null) {
  let query = (sb.from("scheduled_occurrences") as SB).select("*");

  if (homeId) {
    query = query.eq("home_id", homeId);
  }

  const { data: occurrences, error } = await query;
  if (error) throw error;

  const compliance = calculateCompliance(occurrences ?? []);

  // Group by status
  const byStatus: Record<string, number> = {};
  for (const occ of occurrences ?? []) {
    byStatus[occ.status] = (byStatus[occ.status] ?? 0) + 1;
  }

  // Pending approval items
  const pendingApproval = (occurrences ?? []).filter(
    (o: any) => o.status === "submitted" || o.status === "checked" || o.status === "resubmitted",
  );

  // Overdue items
  const overdueItems = (occurrences ?? []).filter(
    (o: any) => o.status === "overdue" || o.status === "escalated",
  );

  return NextResponse.json({
    compliance,
    statusBreakdown: byStatus,
    pendingApprovalCount: pendingApproval.length,
    overdueCount: overdueItems.length,
    pendingApproval: pendingApproval.slice(0, 20),
    overdueItems: overdueItems.slice(0, 20),
  });
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function getDemoData(homeId: string | null) {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const demoOccurrences: Partial<ScheduledOccurrence>[] = [
    // Completed on time
    {
      id: "occ-demo-1",
      templateId: "fire-check",
      templateName: "Daily Fire Safety Check",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      dueTime: "09:00",
      status: "approved",
      completedAt: `${today}T08:45:00Z`,
      graceExpiresAt: `${today}T09:30:00Z`,
      completedBy: "staff-jane",
      approvalLevel: 0,
      resubmissionCount: 0,
      escalationLevel: 0,
    },
    {
      id: "occ-demo-2",
      templateId: "medication-round",
      templateName: "Morning Medication Round",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      dueTime: "08:00",
      status: "filed",
      completedAt: `${today}T07:55:00Z`,
      graceExpiresAt: `${today}T08:15:00Z`,
      completedBy: "staff-mike",
      approvalLevel: 1,
      resubmissionCount: 0,
      escalationLevel: 0,
    },
    // Awaiting approval
    {
      id: "occ-demo-3",
      templateId: "key-session",
      templateName: "Keyworker 1:1 Session Record",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      status: "submitted",
      completedAt: `${today}T10:30:00Z`,
      graceExpiresAt: `${today}T17:00:00Z`,
      completedBy: "staff-sarah",
      approvalLevel: 1,
      resubmissionCount: 0,
      escalationLevel: 0,
    },
    {
      id: "occ-demo-4",
      templateId: "risk-assessment",
      templateName: "Monthly Risk Assessment Review",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      status: "checked",
      completedAt: `${today}T11:00:00Z`,
      graceExpiresAt: `${today}T17:00:00Z`,
      completedBy: "staff-jane",
      checkedBy: "staff-lead-1",
      approvalLevel: 2,
      resubmissionCount: 0,
      escalationLevel: 0,
    },
    // Overdue
    {
      id: "occ-demo-5",
      templateId: "daily-log",
      templateName: "End of Day Log",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      dueTime: "22:00",
      status: "overdue",
      graceExpiresAt: `${today}T22:30:00Z`,
      approvalLevel: 0,
      resubmissionCount: 0,
      escalationLevel: 1,
    },
    // Escalated
    {
      id: "occ-demo-6",
      templateId: "welfare-check",
      templateName: "Night Welfare Check",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      dueTime: "02:00",
      status: "escalated",
      graceExpiresAt: `${today}T02:15:00Z`,
      approvalLevel: 0,
      resubmissionCount: 0,
      escalationLevel: 2,
      escalatedTo: "deputy_manager",
    },
    // In progress
    {
      id: "occ-demo-7",
      templateId: "incident-report",
      templateName: "Incident Report",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      status: "in_progress",
      graceExpiresAt: `${today}T14:00:00Z`,
      completedBy: "staff-mike",
      approvalLevel: 2,
      resubmissionCount: 0,
      escalationLevel: 0,
    },
    // Returned for improvement
    {
      id: "occ-demo-8",
      templateId: "placement-plan",
      templateName: "Placement Plan Review",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      status: "returned_for_improvement",
      graceExpiresAt: `${today}T17:00:00Z`,
      completedBy: "staff-sarah",
      returnReason: "Missing child voice section — please add direct quotes from Jordan about their goals.",
      returnedBy: "staff-lead-1",
      approvalLevel: 2,
      resubmissionCount: 1,
      escalationLevel: 0,
    },
    // Missed
    {
      id: "occ-demo-9",
      templateId: "room-check",
      templateName: "Bedroom Safety Check",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      dueTime: "07:00",
      status: "missed",
      graceExpiresAt: `${today}T07:30:00Z`,
      approvalLevel: 0,
      resubmissionCount: 0,
      escalationLevel: 1,
    },
    // Filed (historical)
    {
      id: "occ-demo-10",
      templateId: "supervision",
      templateName: "Staff Supervision Record",
      homeId: homeId ?? "home-oak",
      dueDate: today,
      status: "filed",
      completedAt: `${today}T09:30:00Z`,
      graceExpiresAt: `${today}T17:00:00Z`,
      completedBy: "staff-lead-1",
      approvedBy: "staff-manager-1",
      approvalLevel: 2,
      resubmissionCount: 0,
      escalationLevel: 0,
      qaSampledAt: `${today}T14:00:00Z`,
      qaScore: 4,
    },
  ];

  const compliance = calculateCompliance(demoOccurrences as ScheduledOccurrence[]);

  const byStatus: Record<string, number> = {};
  for (const occ of demoOccurrences) {
    byStatus[occ.status!] = (byStatus[occ.status!] ?? 0) + 1;
  }

  const pendingApproval = demoOccurrences.filter(
    o => o.status === "submitted" || o.status === "checked" || o.status === "resubmitted",
  );

  const overdueItems = demoOccurrences.filter(
    o => o.status === "overdue" || o.status === "escalated" || o.status === "missed",
  );

  return {
    compliance,
    statusBreakdown: byStatus,
    pendingApprovalCount: pendingApproval.length,
    overdueCount: overdueItems.length,
    pendingApproval,
    overdueItems,
    recentActivity: [
      { action: "approved", templateName: "Morning Medication Round", by: "Deputy Manager", at: `${today}T08:20:00Z` },
      { action: "submitted", templateName: "Key Session Record", by: "Sarah (RSW)", at: `${today}T10:30:00Z` },
      { action: "returned", templateName: "Placement Plan Review", by: "Team Leader", at: `${today}T11:15:00Z`, reason: "Missing child voice" },
      { action: "escalated", templateName: "Night Welfare Check", by: "System", at: `${today}T04:15:00Z` },
    ],
  };
}
