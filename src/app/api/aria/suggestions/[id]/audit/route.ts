// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/suggestions/[id]/audit
//
// GET   — fetch audit timeline for a suggestion
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  checkAriaAccess,
  type AriaActor,
  type AriaRole,
} from "@/lib/aria/aria-permissions";
import { getAuditTimeline } from "@/lib/aria/aria-suggestions";

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
  const actor: AriaActor = { userId: actorUserId, role: actorRole as AriaRole };

  const access = checkAriaAccess(actor, { permission: "aria.view_audit_logs" });
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
