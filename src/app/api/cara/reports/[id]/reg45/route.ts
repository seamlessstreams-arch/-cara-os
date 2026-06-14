// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]/reg45
//
// POST  — Link a completed report's sections to Regulation 45 evidence
//         categories. Returns the created evidence items for the monthly
//         Reg 45 report.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { linkReportToReg45 } from "@/lib/cara/reports/reg45-linking";

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

    const createdBy = body.createdBy as string | undefined;
    if (!createdBy) {
      return NextResponse.json(
        { ok: false, error: "createdBy is required" },
        { status: 400 },
      );
    }

    const qualityStandards = Array.isArray(body.qualityStandards)
      ? (body.qualityStandards as string[])
      : undefined;

    const items = await linkReportToReg45(
      reportId,
      createdBy,
      qualityStandards,
    );

    return NextResponse.json({ ok: true, data: items });
  } catch (err) {
    console.error("[api/cara/reports/[id]/reg45] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
