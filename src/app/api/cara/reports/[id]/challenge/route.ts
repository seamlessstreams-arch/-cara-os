// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]/challenge
//
// GET   — Run challenge mode against a draft report. Returns an array of
//         ChallengeItem objects highlighting evidence gaps, weak sections,
//         safeguarding concerns, and other quality issues.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { runChallengeMode } from "@/lib/cara/challenge/challenge-mode";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await params;

    const challenges = await runChallengeMode(reportId);

    return NextResponse.json({ ok: true, data: challenges });
  } catch (err) {
    console.error("[api/cara/reports/[id]/challenge] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
