import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json() as {
    title?: string;
    description?: string;
    evidence?: string;
    category?: string;
    is_active?: boolean;
    reviewed_by?: string;
  };

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.evidence !== undefined) patch.evidence = body.evidence;
  if (body.category !== undefined) patch.category = body.category;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  if (body.reviewed_by !== undefined) {
    patch.reviewed_by = body.reviewed_by;
    patch.reviewed_at = new Date().toISOString();
  }

  const updated = intelligenceDb.practiceBank.patch(id, patch);

  if (!updated) {
    return NextResponse.json({ error: "Practice bank entry not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
