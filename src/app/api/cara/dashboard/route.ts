// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/dashboard
//
// GET   — Fetch a summary of Cara reporting metrics for a home. Returns
//         counts of reports, pending reviews, high-risk flags, outstanding
//         actions, evidence gaps, and Reg 45 evidence items.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "@/types/cara-reports";

// ── Demo Dashboard ───────────────────────────────────────────────────────────

function getDemoDashboard(): DashboardSummary {
  return {
    reportsThisWeek: 3,
    reportsPendingReview: 1,
    highRiskFlags: 0,
    childrenNeedingOversight: 2,
    reg45ItemsThisMonth: 8,
    outstandingActions: 4,
    evidenceGaps: 3,
    weakRecords: 1,
  };
}

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId");
    if (!homeId) {
      return NextResponse.json(
        { ok: false, error: "homeId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();

    if (!sb) {
      return NextResponse.json({ ok: true, data: getDemoDashboard() });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();

    // Run all count queries in parallel
    const [
      reportsThisWeekResult,
      pendingReviewResult,
      highRiskResult,
      childrenNeedingOversightResult,
      reg45Result,
      outstandingActionsResult,
      evidenceGapsResult,
      weakRecordsResult,
    ] = await Promise.all([
      // Reports created this week
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_reports") as any)
        .select("id", { count: "exact", head: true })
        .eq("home_id", homeId)
        .gte("created_at", sevenDaysAgo),

      // Reports pending review
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_reports") as any)
        .select("id", { count: "exact", head: true })
        .eq("home_id", homeId)
        .eq("status", "pending_review"),

      // High-risk reports needing approval
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_reports") as any)
        .select("id", { count: "exact", head: true })
        .eq("home_id", homeId)
        .eq("risk_tier", "high")
        .in("status", ["draft", "pending_review"]),

      // Distinct children with reports in draft or pending_review status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_reports") as any)
        .select("child_id")
        .eq("home_id", homeId)
        .in("status", ["draft", "pending_review"]),

      // Reg 45 evidence items this month
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("regulation45_evidence_items") as any)
        .select("id", { count: "exact", head: true })
        .eq("home_id", homeId)
        .gte("created_at", startOfMonth),

      // Outstanding actions (suggested or accepted, not completed/dismissed)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_report_actions") as any)
        .select("id", { count: "exact", head: true })
        .in("status", ["suggested", "accepted", "in_progress"]),

      // Evidence gaps (sections with not_enough_evidence)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_report_sections") as any)
        .select("id", { count: "exact", head: true })
        .eq("evidence_status", "not_enough_evidence"),

      // Weak records (sections with low confidence and partial evidence)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("child_report_sections") as any)
        .select("id", { count: "exact", head: true })
        .eq("evidence_status", "partial_evidence")
        .lt("confidence_score", 40),
    ]);

    // Count distinct children needing oversight
    const childrenSet = new Set<string>();
    if (childrenNeedingOversightResult.data) {
      for (const row of childrenNeedingOversightResult.data) {
        if (row.child_id) childrenSet.add(row.child_id);
      }
    }

    const summary: DashboardSummary = {
      reportsThisWeek: reportsThisWeekResult.count ?? 0,
      reportsPendingReview: pendingReviewResult.count ?? 0,
      highRiskFlags: highRiskResult.count ?? 0,
      childrenNeedingOversight: childrenSet.size,
      reg45ItemsThisMonth: reg45Result.count ?? 0,
      outstandingActions: outstandingActionsResult.count ?? 0,
      evidenceGaps: evidenceGapsResult.count ?? 0,
      weakRecords: weakRecordsResult.count ?? 0,
    };

    return NextResponse.json({ ok: true, data: summary });
  } catch (err) {
    console.error("[api/cara/dashboard] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
