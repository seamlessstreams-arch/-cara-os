import { NextRequest, NextResponse } from "next/server";
import { generateArtifact } from "@/lib/cara/cara-studio-service";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import type { CaraGenerationRequest } from "@/types/cara-studio";
import { readJsonBody } from "@/lib/http/read-json";

// POST /api/v1/cara-studio/generate
// Generates a new Cara Studio artifact using the configured AI provider.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.artifact_type) {
    return NextResponse.json({ error: "artifact_type is required" }, { status: 400 });
  }
  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body.requested_by) {
    return NextResponse.json({ error: "requested_by is required" }, { status: 400 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId: (body.home_id as string) ?? "home_oak",
    childId: (body.child_id as string) ?? null,
    intent: `generate ${body.artifact_type}`,
  });
  if (!guard.ok) return guard.response;

  const request: CaraGenerationRequest = {
    artifact_type: body.artifact_type as CaraGenerationRequest["artifact_type"],
    title: String(body.title),
    child_id: (body.child_id as string) ?? null,
    home_id: (body.home_id as string) ?? "home_oak",
    staff_id: (body.staff_id as string) ?? null,
    incident_id: (body.incident_id as string) ?? null,
    linked_record_id: (body.linked_record_id as string) ?? null,
    linked_record_type: (body.linked_record_type as string) ?? null,
    framework: (body.framework as CaraGenerationRequest["framework"]) ?? "none",
    tone: (body.tone as CaraGenerationRequest["tone"]) ?? "professional",
    creative_mode: (body.creative_mode as CaraGenerationRequest["creative_mode"]) ?? "balanced",
    source_ids: (body.source_ids as string[]) ?? [],
    additional_context: (body.additional_context as string) ?? "",
    requested_by: String(body.requested_by),
    date_range_from: (body.date_range_from as string) ?? null,
    date_range_to: (body.date_range_to as string) ?? null,
  };

  const result = await generateArtifact(request);

  return NextResponse.json(
    {
      data: result.artifact,
      meta: {
        sources_used: result.sources_used.length,
        gaps_detected: result.gaps_detected.length,
        model_used: result.model_used,
        is_stub: result.is_stub,
      },
    },
    { status: 201 }
  );
}
