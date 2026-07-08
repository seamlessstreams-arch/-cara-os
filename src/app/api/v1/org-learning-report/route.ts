// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING REPORT API
// GET ?period=quarter|month  → a leadership synthesis across the whole Practice
// Intelligence signal set for the period (repeated themes, emerging risks,
// unresolved learning, strengths, child-voice themes, improvement evidence).
//
// CHR 2015 Reg 45 · Quality Standards (leadership & management). The engine is
// pure; this route reads store snapshots + computes ethical cycle status.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { buildOrgLearningReport } from "@/lib/org-learning-report/report-engine";
import { buildOrgLearningInputFromStore } from "@/lib/org-learning-report/build-input";
import type { ReportPeriod } from "@/lib/org-learning-report/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);
    const { searchParams } = new URL(req.url);
    const period: ReportPeriod = searchParams.get("period") === "month" ? "month" : "quarter";

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    // The store→input mapping lives in @/lib/org-learning-report/build-input so
    // Ask CARA and this API share ONE organisational-learning read.
    const input = buildOrgLearningInputFromStore(store, asOf, period);

    return NextResponse.json({ data: buildOrgLearningReport(input) });
  } catch (error: unknown) {
    console.error("[api] org-learning-report error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
