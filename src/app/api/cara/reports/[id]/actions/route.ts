// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]/actions
//
// GET   — Generate suggested follow-up actions for a report.
// POST  — Accept or reject a suggested action by actionId.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateSuggestedActions } from "@/lib/cara/challenge/challenge-mode";
import { createServerClient } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/read-json";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await params;

    const actions = await generateSuggestedActions(reportId);

    return NextResponse.json({ ok: true, data: actions });
  } catch (err) {
    console.error("[api/cara/reports/[id]/actions] GET error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: _reportId } = await params;

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

    const actionId = body.actionId as string | undefined;
    const decision = body.decision as string | undefined;

    if (!actionId) {
      return NextResponse.json(
        { ok: false, error: "actionId is required" },
        { status: 400 },
      );
    }

    if (decision !== "accept" && decision !== "reject") {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid decision: "${decision}". Must be "accept" or "reject".`,
        },
        { status: 400 },
      );
    }

    const newStatus = decision === "accept" ? "accepted" : "dismissed";
    const now = new Date().toISOString();

    const sb = createServerClient();

    if (!sb) {
      // Demo mode — return a synthetic updated action
      return NextResponse.json({
        ok: true,
        data: {
          id: actionId,
          status: newStatus,
          updated_at: now,
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    if (decision === "reject" && body.rejectionReason) {
      updatePayload.action_description =
        `[Dismissed: ${body.rejectionReason}]`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("child_report_actions") as any)
      .update(updatePayload)
      .eq("id", actionId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "Action not found or update failed" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[api/cara/reports/[id]/actions] POST error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
