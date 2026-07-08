import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getWeeklyIntelligenceObject } from "@/lib/cpie/get-weekly-intelligence-object";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cpie/weekly-intelligence?child_id=<id>&week_ending=<YYYY-MM-DD>
 *
 * The CPIE Weekly Intelligence Object: the deterministic, structured pre-report
 * object for a child's week. Weekly/monthly summaries and Reg 44 evidence pulls
 * consume THIS — a narrator only ever phrases what it already holds. Pure
 * projection over the Digital Twin + a 7-day window; reads only; no LLM.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? searchParams.get("childId");
    const weekEnding = searchParams.get("week_ending") ?? searchParams.get("weekEnding") ?? undefined;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    if (!childId) {
      return NextResponse.json({ error: "child_id is required" }, { status: 400 });
    }
    if (weekEnding && !/^\d{4}-\d{2}-\d{2}$/.test(weekEnding)) {
      return NextResponse.json({ error: "week_ending must be YYYY-MM-DD" }, { status: 400 });
    }

    const wio = getWeeklyIntelligenceObject(childId, weekEnding);
    if (!wio) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    return NextResponse.json({
      data: wio,
      meta: { engine: "cpie-weekly-intelligence", version: wio.engineVersion, generatedAt: wio.generatedAt, week: { start: wio.weekStart, end: wio.weekEnding } },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
