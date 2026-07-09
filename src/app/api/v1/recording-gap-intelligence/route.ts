// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING GAP INTELLIGENCE
// GET /api/v1/recording-gap-intelligence
//
// Detects gaps in care recording for each current resident across four
// safeguarding-critical domains:
//
//   1. Daily Log          — gap if no entry in >3 days (critical) / >1 day (warning)
//   2. Key Work Sessions  — gap if no session in >30 days (critical) / >14 days (warning)
//   3. LAC Reviews        — gap if next_review_date overdue OR >180 days since last review
//   4. Welfare Checks     — gap if no check in >7 days (critical) / >3 days (warning)
//
// "Poor and infrequent recording makes it impossible for managers to assure
//  themselves of the quality of care." — Ofsted ILACS Handbook.
//
// All deterministic. No LLM calls. The pure compute lives in
// `@/lib/recording-gap-intelligence/recording-gap-engine`; this route is a thin
// wrapper over `buildRecordingGapIntelligence(getStore())`.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildRecordingGapIntelligence } from "@/lib/recording-gap-intelligence/recording-gap-engine";

export async function GET() {
  return NextResponse.json({ data: buildRecordingGapIntelligence(getStore()) });
}
