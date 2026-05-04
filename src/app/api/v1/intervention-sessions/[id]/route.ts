import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { InterventionSession } from "@/types/extended";
import { canPerformLiversAction, resolveLiversRole } from "@/lib/livers-access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = intelligenceDb.interventionSessions.findById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as Partial<InterventionSession> & { user_role?: string };
  const role = resolveLiversRole(req, body.user_role);
  const { user_role: _userRole, ...patchData } = body;

  if (!canPerformLiversAction(role, "session:patch")) {
    return NextResponse.json({ error: "Forbidden for your role" }, { status: 403 });
  }

  const updated = intelligenceDb.interventionSessions.patch(id, patchData);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
