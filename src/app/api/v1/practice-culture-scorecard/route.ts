// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE CULTURE SCORECARD
// GET /api/v1/practice-culture-scorecard
//
// Synthesises five practice-quality intelligence dimensions into a single
// management health picture. Each dimension is scored 0–100 and RAG-rated.
//
// Dimensions:
//   1. Recording Quality      — Writing Assistant engagement (WAUD acceptance)
//   2. Child Voice Presence   — Voice markers in records
//   3. Therapeutic Language   — Absence of criminalising/moralising patterns
//   4. Strengths Documentation — Presence of achievement/connection language
//   5. Framework Engagement   — Active KB practice frameworks
//
// All computed directly from the store. No internal API calls.
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/practice-culture-scorecard.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildPracticeCultureScorecard } from "@/lib/practice-culture-scorecard/practice-culture-engine";

export async function GET() {
  return NextResponse.json({ data: buildPracticeCultureScorecard(getStore()) });
}
