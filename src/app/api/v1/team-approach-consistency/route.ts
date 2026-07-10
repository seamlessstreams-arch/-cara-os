// ══════════════════════════════════════════════════════════════════════════════
// CARA — TEAM APPROACH CONSISTENCY INTELLIGENCE
// GET /api/v1/team-approach-consistency
//
// Analyses how consistently different staff members approach the same child.
// Detects divergence in practice approach across the team — a key indicator
// of whether children experience a coherent, predictable care environment.
//
// "Children in residential care need a consistent therapeutic environment.
//  Inconsistency in staff approach is itself a risk factor — it recreates the
//  unpredictability that caused harm in the first place."
//  — Good Care Guide; 21 Skills for Residential Workers
//
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/team-approach-consistency.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildTeamApproachConsistency } from "@/lib/team-approach-consistency/team-approach-engine";

export async function GET() {
  return NextResponse.json({ data: buildTeamApproachConsistency(getStore()) });
}
