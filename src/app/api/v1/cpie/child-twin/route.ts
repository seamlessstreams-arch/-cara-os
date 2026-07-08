import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getChildTwin } from "@/lib/cpie/get-child-twin";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cpie/child-twin?child_id=<id>
 *
 * The CPIE chokepoint over HTTP: the Digital Twin — CARA's living,
 * deterministic understanding of a child. Every module (Ask CARA, weekly
 * summaries, reg 44, care planning, supervision, dashboards) reads THIS
 * instead of interpreting raw records independently. Pure projection;
 * reads only; no LLM.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? searchParams.get("childId");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    if (!childId) {
      return NextResponse.json({ error: "child_id is required" }, { status: 400 });
    }

    const twin = getChildTwin(childId);
    if (!twin) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    return NextResponse.json({
      data: twin,
      meta: { engine: "cpie-child-twin", version: twin.engineVersion, generatedAt: twin.generatedAt },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
