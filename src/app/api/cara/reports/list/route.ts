// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/list
//
// GET   — List reports for a home with optional filters for childId, status,
//         reportType, and a configurable limit. Returns an array of
//         ChildReport objects ordered by created_at descending.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type {
  ChildReport,
  ReportStatus,
  ReportType,
} from "@/types/cara-reports";

// ── Demo Reports ─────────────────────────────────────────────────────────────

function getDemoReports(): ChildReport[] {
  const now = new Date().toISOString();

  return [
    {
      id: "demo-report-1",
      organisation_id: "demo-org",
      home_id: "demo-home",
      child_id: "demo-child-1",
      report_type: "weekly_child_report",
      audience: "internal_manager",
      title: "Jayden Mitchell — Weekly Child Report",
      status: "draft",
      version: 1,
      parent_report_id: null,
      date_range_start: "2026-05-05",
      date_range_end: "2026-05-11",
      overall_summary:
        "Jayden has had a broadly positive week with engagement in routines and activities.",
      overall_confidence_score: 72,
      risk_tier: "low",
      child_voice_included: true,
      evidence_gap_count: 2,
      agent_run_id: null,
      requested_by: "demo-user",
      generated_at: now,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      locked_by: null,
      locked_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-report-2",
      organisation_id: "demo-org",
      home_id: "demo-home",
      child_id: "demo-child-2",
      report_type: "weekly_child_report",
      audience: "internal_manager",
      title: "Mia Thompson — Weekly Child Report",
      status: "pending_review",
      version: 1,
      parent_report_id: null,
      date_range_start: "2026-05-05",
      date_range_end: "2026-05-11",
      overall_summary:
        "Mia has had a mixed week. Good engagement with education but some difficulties at home.",
      overall_confidence_score: 65,
      risk_tier: "medium",
      child_voice_included: false,
      evidence_gap_count: 4,
      agent_run_id: null,
      requested_by: "demo-user",
      generated_at: now,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      locked_by: null,
      locked_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-report-3",
      organisation_id: "demo-org",
      home_id: "demo-home",
      child_id: "demo-child-1",
      report_type: "monthly_progress_summary",
      audience: "social_worker",
      title: "Jayden Mitchell — Monthly Progress Summary",
      status: "approved",
      version: 1,
      parent_report_id: null,
      date_range_start: "2026-04-01",
      date_range_end: "2026-04-30",
      overall_summary:
        "Jayden has made steady progress across all areas during April.",
      overall_confidence_score: 80,
      risk_tier: "low",
      child_voice_included: true,
      evidence_gap_count: 1,
      agent_run_id: null,
      requested_by: "demo-user",
      generated_at: now,
      reviewed_by: "demo-manager",
      reviewed_at: now,
      review_notes: "Well-evidenced report.",
      approved_by: "demo-manager",
      approved_at: now,
      rejection_reason: null,
      locked_by: null,
      locked_at: null,
      created_at: now,
      updated_at: now,
    },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const homeId = searchParams.get("homeId");

    if (!homeId) {
      return NextResponse.json(
        { ok: false, error: "homeId query parameter is required" },
        { status: 400 },
      );
    }

    const childId = searchParams.get("childId");
    const status = searchParams.get("status") as ReportStatus | null;
    const reportType = searchParams.get("reportType") as ReportType | null;
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? Math.min(Math.max(parseInt(limitStr, 10) || 20, 1), 100) : 20;

    const sb = createServerClient();

    if (!sb) {
      let demoReports = getDemoReports();

      // Apply filters to demo data
      if (childId) {
        demoReports = demoReports.filter((r) => r.child_id === childId);
      }
      if (status) {
        demoReports = demoReports.filter((r) => r.status === status);
      }
      if (reportType) {
        demoReports = demoReports.filter((r) => r.report_type === reportType);
      }

      return NextResponse.json({
        ok: true,
        data: demoReports.slice(0, limit),
      });
    }

    // Build query with filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb.from("child_reports") as any)
      .select("*")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (childId) {
      query = query.eq("child_id", childId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (reportType) {
      query = query.eq("report_type", reportType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/cara/reports/list] Query error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch reports" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: (data ?? []) as ChildReport[],
    });
  } catch (err) {
    console.error("[api/cara/reports/list] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
