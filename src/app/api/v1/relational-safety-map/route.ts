// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONAL SAFETY MAP
// GET /api/v1/relational-safety-map
//
// Maps each child's documented trusted relationships with staff.
// Synthesises: key worker assignment (formal), key work session frequency
// (actual engagement), PACE trusted adult list (child-identified safety),
// and incident patterns (relationship stress indicators).
//
// "Children should have warm, consistent relationships with at least one
//  safe adult." — DDP principle; RI inspection focus.
//
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/relational-safety-map.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildRelationalSafetyMap } from "@/lib/relational-safety-map/relational-safety-map-engine";

export async function GET() {
  return NextResponse.json({ data: buildRelationalSafetyMap(getStore()) });
}
