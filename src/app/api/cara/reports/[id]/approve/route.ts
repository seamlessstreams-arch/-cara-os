// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]/approve
//
// POST  — Approve or reject a report. Accepts a decision body with
//         "approve" or "reject", delegates to the approval workflow service,
//         and returns the updated report.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  approveReport,
  rejectReport,
} from "@/lib/cara/reports/approval-workflow";
import { readJsonBody } from "@/lib/http/read-json";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await params;

    let body: Record<string, unknown>;
    try {
      const __parsed = await readJsonBody(req);
      if (!__parsed.ok) return __parsed.response;
      body = __parsed.data;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const decision = body.decision as string | undefined;

    if (decision === "approve") {
      const approvedBy = body.approvedBy as string | undefined;
      if (!approvedBy) {
        return NextResponse.json(
          { ok: false, error: "approvedBy is required when approving" },
          { status: 400 },
        );
      }

      const reviewNote = body.reviewNote as string | undefined;
      const updated = await approveReport(reportId, approvedBy, reviewNote);

      return NextResponse.json({ ok: true, data: updated });
    }

    if (decision === "reject") {
      const rejectedBy = body.rejectedBy as string | undefined;
      const reason = body.reason as string | undefined;

      if (!rejectedBy) {
        return NextResponse.json(
          { ok: false, error: "rejectedBy is required when rejecting" },
          { status: 400 },
        );
      }
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json(
          { ok: false, error: "reason is required when rejecting a report" },
          { status: 400 },
        );
      }

      const updated = await rejectReport(reportId, rejectedBy, reason);

      return NextResponse.json({ ok: true, data: updated });
    }

    return NextResponse.json(
      {
        ok: false,
        error: `Invalid decision: "${decision}". Must be "approve" or "reject".`,
      },
      { status: 400 },
    );
  } catch (err) {
    console.error("[api/cara/reports/[id]/approve] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
