// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRENGTHS-BASED RECORDING INDEX
// GET /api/v1/strengths-recording-index
//
// Positive complement to the Care Language Audit: measures how often records
// celebrate what children CAN do, ARE achieving, and HOW they connect —
// rather than only documenting problems and deficits.
//
// Strengths-based recording is a practice skill as much as a language choice.
// Grounded in the 21 Skills for Residential Childcare framework and the
// PACE Model (celebrating small victories builds connection).
//
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/strengths-recording-index.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildStrengthsRecordingIndex } from "@/lib/strengths-recording-index/strengths-recording-engine";

export async function GET() {
  return NextResponse.json({ data: buildStrengthsRecordingIndex(getStore()) });
}
