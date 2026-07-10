// ══════════════════════════════════════════════════════════════════════════════
// CARA — POST-INCIDENT REPAIR CYCLE INTELLIGENCE
// GET /api/v1/repair-cycle-intelligence
//
// Tracks whether the therapeutic repair cycle completes after every incident.
//
// The cycle (DDP / rupture-repair principle):
//   1. Incident occurs
//   2. Child-facing debrief happens (within 72h ideally)
//   3. Child perspective captured in debrief
//   4. Lessons learned documented on incident
//   5. Changes needed/follow-up actions recorded
//   6. Staff wellbeing support offered
//
// "When rupture happens in any relationship, the opportunity for repair is
//  therapeutic. The repair teaches the child: relationships survive difficulty."
// — Dan Hughes (DDP)
//
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/repair-cycle-intelligence.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildRepairCycleIntelligence } from "@/lib/repair-cycle-intelligence/repair-cycle-engine";

export async function GET() {
  return NextResponse.json({ data: buildRepairCycleIntelligence(getStore()) });
}
