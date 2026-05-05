// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/suggestions/oversight-draft
//
// POST  — generate a management oversight draft for an incident
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  checkAriaAccess,
  type AriaActor,
  type AriaRole,
} from "@/lib/aria/aria-permissions";
import {
  generateManagementOversightDraft,
  writeAuditEntry,
} from "@/lib/aria/aria-suggestions";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actorUserId = typeof body.actorUserId === "string" ? body.actorUserId : "";
  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }

  const actorRole = typeof body.actorRole === "string" ? body.actorRole : "none";
  const actor: AriaActor = {
    userId: actorUserId,
    role: actorRole as AriaRole,
    organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
    homeId: typeof body.homeId === "string" ? body.homeId : undefined,
  };

  const access = checkAriaAccess(actor, { permission: "aria.generate_drafts" });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const description = typeof body.description === "string" ? body.description : "";
  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  try {
    const draft = await generateManagementOversightDraft({
      incidentId: typeof body.incidentId === "string" ? body.incidentId : "",
      incidentType: typeof body.incidentType === "string" ? body.incidentType : "incident",
      severity: typeof body.severity === "string" ? body.severity : "medium",
      description,
      immediateAction: typeof body.immediateAction === "string" ? body.immediateAction : undefined,
      childId: typeof body.childId === "string" ? body.childId : undefined,
      staffId: typeof body.staffId === "string" ? body.staffId : undefined,
      homeId: typeof body.homeId === "string" ? body.homeId : undefined,
      organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
    });

    await writeAuditEntry({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "draft_generated",
      metadata: { incidentId: body.incidentId, incidentType: body.incidentType, severity: body.severity },
    });

    return NextResponse.json({ data: draft }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate oversight draft", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
