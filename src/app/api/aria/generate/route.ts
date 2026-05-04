// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/generate
//
// POST  /api/aria/generate         — invoke an Aria command (write/rewrite/
//                                    summarise/extract). Persists a draft
//                                    output and writes the audit event.
// PATCH /api/aria/generate         — manager decision on an output
//                                    (approve/reject/request_changes/commit/
//                                    withdraw). Audit-logged.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  invokeAriaCommand,
  applyApprovalDecision,
  ARIA_COMMANDS,
  type AriaApprovalDecision,
} from "@/lib/aria/aria-service";
import type { AriaCommandId } from "@/lib/aria/aria-types";
import type { AriaActor, AriaPermission, AriaRole } from "@/lib/aria/aria-permissions";

const VALID_DECISIONS: AriaApprovalDecision[] = [
  "approve",
  "reject",
  "request_changes",
  "commit",
  "withdraw",
];

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

export async function POST(req: NextRequest) {
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

  const commandId = body.commandId as AriaCommandId | undefined;
  if (!commandId || !ARIA_COMMANDS[commandId]) {
    return NextResponse.json(
      {
        error: `commandId is required and must be one of: ${Object.keys(ARIA_COMMANDS).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const inputText = typeof body.inputText === "string" ? body.inputText : undefined;
  if (!inputText || inputText.trim().length === 0) {
    return NextResponse.json({ error: "inputText is required" }, { status: 400 });
  }

  const outcome = await invokeAriaCommand({
    actor,
    commandId,
    organisationId: actor.organisationId,
    homeId: actor.homeId,
    childId: typeof body.childId === "string" ? body.childId : undefined,
    staffId: typeof body.staffId === "string" ? body.staffId : undefined,
    sourceModule: typeof body.sourceModule === "string" ? body.sourceModule : undefined,
    sourceRecordType:
      typeof body.sourceRecordType === "string" ? body.sourceRecordType : undefined,
    sourceRecordId: typeof body.sourceRecordId === "string" ? body.sourceRecordId : undefined,
    inputText,
    inputMetadata:
      body.inputMetadata && typeof body.inputMetadata === "object"
        ? (body.inputMetadata as Record<string, unknown>)
        : undefined,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      {
        error: outcome.errorReason ?? "Aria invocation failed",
        providerConfigured: outcome.providerConfig.configured,
      },
      { status: outcome.status },
    );
  }

  return NextResponse.json({
    data: outcome.result,
    providerConfigured: outcome.providerConfig.configured,
    providerId: outcome.providerConfig.providerId,
  });
}

export async function PATCH(req: NextRequest) {
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

  const outputId = body.outputId as string | undefined;
  if (!outputId) {
    return NextResponse.json({ error: "outputId is required" }, { status: 400 });
  }
  const decision = body.decision as AriaApprovalDecision | undefined;
  if (!decision || !VALID_DECISIONS.includes(decision)) {
    return NextResponse.json(
      { error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const requiredPermission: AriaPermission =
    decision === "approve"
      ? "aria.approve_outputs"
      : decision === "reject"
        ? "aria.reject_outputs"
        : decision === "commit"
          ? "aria.commit_to_records"
          : "aria.use";

  const outcome = await applyApprovalDecision({
    actor,
    requiredPermission,
    outputId,
    decision,
    decisionText: typeof body.decisionText === "string" ? body.decisionText : undefined,
    editedText: typeof body.editedText === "string" ? body.editedText : undefined,
    committedRecordType:
      typeof body.committedRecordType === "string" ? body.committedRecordType : undefined,
    committedRecordId:
      typeof body.committedRecordId === "string" ? body.committedRecordId : undefined,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.errorReason ?? "Decision failed" },
      { status: outcome.status },
    );
  }
  return NextResponse.json({ data: { ok: true, decision } });
}
