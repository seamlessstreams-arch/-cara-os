// ══════════════════════════════════════════════════════════════════════════════
// CARA — CUMULATIVE RISK INTELLIGENCE
// GET /api/v1/cumulative-risk-intelligence
//
// Tracks whether multiple risk signals are CONVERGING for each child.
// A single incident is manageable; four escalating signals simultaneously
// is a cumulative harm pattern requiring urgent management attention.
//
// Five risk signals tracked per child:
//   1. Incident frequency trend  (last 30d vs prior 30d)
//   2. Incident severity pattern  (high/critical incidents last 30d)
//   3. Missing episode frequency  (last 30d vs prior 30d)
//   4. Relational isolation       (no key work sessions last 30d)
//   5. Safeguarding-type incidents (police, exploitation, allegation, missing)
//
// Cumulative signal:
//   escalating   — 3+ signals trending worse
//   concerning   — 1–2 signals worse
//   stable       — no escalating signals
//   improving    — prior signals now reducing
//
// All deterministic. No LLM calls. Pure compute lives in the importable builder
// `buildCumulativeRiskIntelligence` — this route is a thin wrapper over it.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildCumulativeRiskIntelligence } from "@/lib/cumulative-risk-intelligence/cumulative-risk-engine";

export async function GET() {
  return NextResponse.json({ data: buildCumulativeRiskIntelligence(getStore()) });
}
