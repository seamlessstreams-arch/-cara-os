import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { getYPName } from "@/lib/seed-data";
import { buildEmotionalSafetyAnalysis } from "@/lib/emotional-safety/emotional-safety-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/emotional-safety?child_id=<id>
 *
 * Emotional Safety Analysis — a pure projection over the child's behaviour log,
 * incidents, key-work mood and PACE profile. Surfaces what triggers
 * dysregulation, what helps them regulate, escalation patterns and recovery
 * signals. Reads only; never writes. Deterministic (no LLM).
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

    const [behaviourLogList, childPaceProfilesList, incidentsList, keyWorkingSessionsList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.childPaceProfiles.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
    ]);
    const pace = (childPaceProfilesList ?? []).find((p) => p.childId === childId);

    const analysis = buildEmotionalSafetyAnalysis({
      childId,
      childName: getYPName(childId),
      now: new Date().toISOString(),
      behaviourLog: behaviourLogList ?? [],
      incidents: incidentsList ?? [],
      keyWorkingSessions: keyWorkingSessionsList ?? [],
      knownTriggers: pace?.knownTriggers ?? [],
      calmingApproaches: pace?.calmingApproaches ?? [],
    });

    return NextResponse.json({
      data: analysis,
      meta: {
        generatedAt: analysis.generatedAt,
        engine: "emotional-safety",
        version: "1.0.0",
      },
    });
  } catch (error: unknown) {
    console.error("[api] unhandled route error:", error);
    const message = "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
