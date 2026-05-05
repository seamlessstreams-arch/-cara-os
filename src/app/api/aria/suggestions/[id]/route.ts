// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/suggestions/[id]
//
// GET   — fetch a single suggestion with linked records
// PATCH — update status (approve / reject / no_action / commit)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  checkAriaAccess,
  type AriaActor,
  type AriaPermission,
  type AriaRole,
} from "@/lib/aria/aria-permissions";
import {
  getSuggestionById,
  approveSuggestion,
  rejectSuggestion,
  markNoAction,
  commitSuggestion,
} from "@/lib/aria/aria-suggestions";

function actorFromBody(body: Record<string, unknown>): AriaActor | null {
  const userId = typeof body.actorUserId === "string" ? body.actorUserId : "";
  const role = typeof body.actorRole === "string" ? (body.actorRole as AriaRole) : "none";
  if (!userId) return null;
  return {
    userId,
    role,
    organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
    homeId: typeof body.homeId === "string" ? body.homeId : undefined,
    staffSelfId: typeof body.staffSelfId === "string" ? body.staffSelfId : undefined,
  };
}

const VALID_ACTIONS = ["approve", "reject", "no_action", "commit"] as const;
type SuggestionAction = (typeof VALID_ACTIONS)[number];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;

  const actorUserId = searchParams.get("actorUserId");
  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId query param is required" }, { status: 400 });
  }

  const actorRole = searchParams.get("actorRole") ?? "none";
  const actor: AriaActor = { userId: actorUserId, role: actorRole as AriaRole };

  const access = checkAriaAccess(actor, { permission: "aria.use" });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  try {
    const suggestion = await getSuggestionById(id, actor);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json({ data: suggestion });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch suggestion", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actor = actorFromBody(body);
  if (!actor) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }

  const action = body.action as SuggestionAction | undefined;
  if (!action || !(VALID_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const permissionMap: Record<SuggestionAction, AriaPermission> = {
    approve: "aria.approve_outputs",
    commit: "aria.commit_to_records",
    reject: "aria.reject_outputs",
    no_action: "aria.approve_outputs",
  };

  const access = checkAriaAccess(actor, { permission: permissionMap[action] });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  if (action === "reject") {
    const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason : "";
    if (!rejectionReason) {
      return NextResponse.json({ error: "rejectionReason is required when action is reject" }, { status: 400 });
    }
  }

  try {
    let updated;

    switch (action) {
      case "approve": {
        const finalText = typeof body.finalText === "string" ? body.finalText : undefined;
        updated = await approveSuggestion(id, actor, finalText);
        break;
      }
      case "reject": {
        updated = await rejectSuggestion(id, actor, body.rejectionReason as string);
        break;
      }
      case "no_action": {
        updated = await markNoAction(id, actor);
        break;
      }
      case "commit": {
        const committedRecordType = typeof body.committedRecordType === "string" ? body.committedRecordType : undefined;
        const committedRecordId = typeof body.committedRecordId === "string" ? body.committedRecordId : undefined;
        updated = await commitSuggestion(id, actor, committedRecordType, committedRecordId);
        break;
      }
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update suggestion", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
