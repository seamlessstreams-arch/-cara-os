import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    status,
    classification,
    suggested_module,
    suggested_child_id,
    suggested_form_type,
    suggested_tags,
    confidence_score,
    reviewed_by,
    reviewed_at,
    placed_at,
    placement_ref_type,
    placement_ref_id,
    aria_notes,
  } = body;

  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch.status = status;
  if (classification !== undefined) patch.classification = classification;
  if (suggested_module !== undefined) patch.suggested_module = suggested_module;
  if (suggested_child_id !== undefined) patch.suggested_child_id = suggested_child_id;
  if (suggested_form_type !== undefined) patch.suggested_form_type = suggested_form_type;
  if (suggested_tags !== undefined) patch.suggested_tags = suggested_tags;
  if (confidence_score !== undefined) patch.confidence_score = confidence_score;
  if (reviewed_by !== undefined) patch.reviewed_by = reviewed_by;
  if (reviewed_at !== undefined) patch.reviewed_at = reviewed_at;
  if (placed_at !== undefined) patch.placed_at = placed_at;
  if (placement_ref_type !== undefined) patch.placement_ref_type = placement_ref_type;
  if (placement_ref_id !== undefined) patch.placement_ref_id = placement_ref_id;
  if (aria_notes !== undefined) patch.aria_notes = aria_notes;

  const updated = intelligenceDb.docJobs.patch(id, patch as Parameters<typeof intelligenceDb.docJobs.patch>[1]);

  if (!updated) {
    return NextResponse.json({ error: "Document job not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
