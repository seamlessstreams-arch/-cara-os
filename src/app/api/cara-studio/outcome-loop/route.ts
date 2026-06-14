import { NextRequest, NextResponse } from "next/server";
import { getArtifactOutcome, getOutcomeLoopSummary } from "@/lib/cara-studio/outcome-loop.service";

export async function GET(req: NextRequest) {
  try {
    const artifactId = req.nextUrl.searchParams.get("artifactId");
    const childId = req.nextUrl.searchParams.get("childId") ?? undefined;

    if (artifactId) {
      const outcome = await getArtifactOutcome(artifactId);
      if (!outcome) {
        return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
      }
      return NextResponse.json(outcome);
    }

    const summary = await getOutcomeLoopSummary(childId);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[api/cara-studio/outcome-loop] Error:", err);
    return NextResponse.json({ error: "Failed to get outcome loop data" }, { status: 500 });
  }
}
