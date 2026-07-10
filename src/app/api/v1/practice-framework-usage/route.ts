// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FRAMEWORK USAGE INTELLIGENCE
// GET /api/v1/practice-framework-usage
//
// Aggregates KB-framework engagement signals from five platform engines:
// Writing Assistant, Reflective Supervision, Incident Mode, PACE Profiles,
// and Practice Observations. Shows which frameworks the team is genuinely
// working with and where supervision attention is needed.
//
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/practice-framework-usage.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildPracticeFrameworkUsage } from "@/lib/practice-framework-usage/framework-usage-engine";

export async function GET() {
  return NextResponse.json({ data: buildPracticeFrameworkUsage(getStore()) });
}
