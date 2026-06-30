import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { LiversAnalysis } from "@/types/extended";
import { canPerformLiversAction, resolveLiversRole } from "@/lib/livers-access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = intelligenceDb.liversAnalyses.findById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Partial<LiversAnalysis> & { user_role?: string };
  const role = await resolveLiversRole(req, body.user_role);
  const { user_role: _userRole, ...patchData } = body;

  const requestedAction =
    body.status === "approved"
      ? "analysis:approve"
      : body.status === "reviewed"
      ? "analysis:review"
      : body.quality_check_notes || body.reviewed_by
      ? "analysis:audit_comment"
      : "analysis:create";

  if (!canPerformLiversAction(role, requestedAction)) {
    return NextResponse.json({ error: "Forbidden for your role" }, { status: 403 });
  }

  const updated = intelligenceDb.liversAnalyses.patch(id, patchData);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
