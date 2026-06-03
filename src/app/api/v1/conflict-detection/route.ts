// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONFLICT DETECTION API ROUTE
// GET /api/v1/conflict-detection
//
// The complement to duplicate detection and the last automation safeguard:
// projects the store into the canonical event stream (plus the missing/leave
// intervals the projection summarises away) and surfaces records that DISAGREE —
// a care log written during a missing episode, an injury recorded then denied,
// the same event graded differently, a staff member working while on leave.
// Conflicts are flagged for human reconciliation and NEVER auto-resolved.
// Pure read-only; no external calls, no mutations.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { mapStoreToConflictInput } from "@/lib/conflict-detection/conflict-input-mapper";
import { computeConflictDetection } from "@/lib/conflict-detection/conflict-detection-engine";

export async function GET() {
  const input = mapStoreToConflictInput(getStore() as any);
  const result = computeConflictDetection({
    ...input,
    today: new Date().toISOString().slice(0, 10),
  });
  return NextResponse.json({ data: result });
}
