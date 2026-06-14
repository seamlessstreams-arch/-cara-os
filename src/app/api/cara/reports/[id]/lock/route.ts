// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]/lock
//
// POST  — Lock an approved report so no further edits are permitted.
//         Delegates to the approval workflow lockReport function.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { lockReport } from "@/lib/cara/reports/approval-workflow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const lockedBy = body.lockedBy as string | undefined;
    if (!lockedBy) {
      return NextResponse.json(
        { ok: false, error: "lockedBy is required" },
        { status: 400 },
      );
    }

    const updated = await lockReport(reportId, lockedBy);

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[api/cara/reports/[id]/lock] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
