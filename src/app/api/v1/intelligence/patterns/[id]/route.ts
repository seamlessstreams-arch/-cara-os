import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as {
    status?: string;
    acknowledged_by?: string;
    resolved_by?: string;
    resolution_notes?: string;
  };

  const validStatuses = ["active", "acknowledged", "resolved", "dismissed"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "status must be one of: active, acknowledged, resolved, dismissed" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};

  if (body.status) patch.status = body.status;

  if (body.status === "acknowledged" && body.acknowledged_by) {
    patch.acknowledged_by = body.acknowledged_by;
    patch.acknowledged_at = now;
  }

  if ((body.status === "resolved" || body.status === "dismissed") && body.resolved_by) {
    patch.resolved_by = body.resolved_by;
    patch.resolved_at = now;
  }

  const updated = intelligenceDb.patterns.patch(id, patch);

  if (!updated) {
    return NextResponse.json({ error: "Pattern alert not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
