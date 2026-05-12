// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria-studio/generate — Generate an ARIA Studio artifact
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateArtifact } from "@/lib/aria-studio/generation.service";
import { getUserIdFromRequest, getUserRoleFromRequest } from "@/lib/auth-guard";
import { ARIA_STUDIO_ARTIFACT_TYPES } from "@/types/aria-studio";
import type { AriaStudioGenerateRequest } from "@/types/aria-studio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = getUserIdFromRequest(req);
    const role = getUserRoleFromRequest(req);
    const homeId = process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";

    const artifactType = body.artifact_type;
    if (!artifactType || !ARIA_STUDIO_ARTIFACT_TYPES.includes(artifactType)) {
      return NextResponse.json(
        { error: `Invalid artifact_type. Must be one of: ${ARIA_STUDIO_ARTIFACT_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const request: AriaStudioGenerateRequest = {
      artifact_type: artifactType,
      child_id: body.child_id,
      home_id: body.home_id ?? homeId,
      staff_id: body.staff_id,
      incident_id: body.incident_id,
      framework: body.framework,
      tone: body.tone,
      creative_mode: body.creative_mode,
      source_ids: body.source_ids,
      date_range: body.date_range,
      additional_context: body.additional_context,
    };

    const result = await generateArtifact(request, { userId, role, homeId });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[aria-studio/generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate artifact", detail: String(err) },
      { status: 500 },
    );
  }
}
