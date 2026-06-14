// ══════════════════════════════════════════════════════════════════════════════
// API — POST /api/cara/reports/[id]/file
// Files a locked report into the Cara filing cabinet.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { fileLockedReport } from "@/lib/cara/reports/report-filing";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Report ID is required" },
      { status: 400 },
    );
  }

  try {
    const result = await fileLockedReport(id);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: "Failed to file report. Ensure the report is locked before filing." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      filingPath: result.filingPath,
      documentId: result.documentId,
    });
  } catch (err) {
    console.error("[api/cara/reports/file] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
