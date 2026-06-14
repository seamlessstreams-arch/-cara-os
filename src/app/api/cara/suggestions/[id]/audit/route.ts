// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/suggestions/[id]/audit
//
// GET   — fetch audit timeline for a suggestion
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  checkCaraAccess,
  type CaraActor,
  type CaraRole,
} from "@/lib/cara/cara-permissions";
import { getAuditTimeline } from "@/lib/cara/cara-suggestions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: suggestionId } = await params;
  const { searchParams } = req.nextUrl;

  const actorUserId = searchParams.get("actorUserId");
  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId query param is required" }, { status: 400 });
  }

  const actorRole = searchParams.get("actorRole") ?? "none";
  const actor: CaraActor = { userId: actorUserId, role: actorRole as CaraRole };

  const access = checkCaraAccess(actor, { permission: "cara.view_audit_logs" });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  try {
    const timeline = await getAuditTimeline(suggestionId);
    return NextResponse.json({ data: timeline });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch audit timeline", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
