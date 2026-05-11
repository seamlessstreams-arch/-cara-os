import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { runQualityCheck } from "@/lib/aria/aria-studio-quality";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";

// POST /api/v1/aria-studio/quality-check
// Runs a quality check on an artifact by ID
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const artifactId = body.artifact_id as string;
  if (!artifactId) {
    return NextResponse.json({ error: "artifact_id is required" }, { status: 400 });
  }

  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.approve_outputs",
    homeId: artifact.home_id,
    childId: artifact.child_id,
    intent: `quality_check ${artifact.id}`,
  });
  if (!guard.ok) return guard.response;

  const check = runQualityCheck(artifact);
  const refreshed = db.ariaArtifacts.findById(artifactId);

  return NextResponse.json({
    data: {
      artifact: refreshed,
      qualityCheck: check,
    },
  });
}
