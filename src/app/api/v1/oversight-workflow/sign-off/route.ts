// ══════════════════════════════════════════════════════════════════════════════
// CARA — Workflow Sign-off API
//
// POST → attempt final management sign-off of a reviewed workflow.
//
// Security:
//   • Guarded by SIGN_OFF_TASKS (managers / RI / team leaders only).
//   • The SignOffRole used for the engine's fine-grained authorisation gate is
//     ALWAYS derived from the AUTHENTICATED role — the request body cannot
//     escalate it.
//   • If the original `input` is supplied, the OversightResult is RE-GENERATED
//     server-side (authoritative) so a client cannot downgrade riskLevel to slip
//     a high-risk workflow past the role gate.
//
// Returns 200 when signed, 422 when sign-off is blocked (with the blocker list).
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS, type AppRole } from "@/lib/permissions";
import {
  generateManagementOversight,
  generateWorkflowSignOff,
  buildSignOffNote,
} from "@/lib/oversight/management-oversight-engine";
import { markOversightCompleted } from "@/lib/ethical-intelligence/capture-service";
import type {
  OversightInput,
  OversightResult,
  SignOffRole,
  WorkflowSignOffInput,
} from "@/lib/oversight/types";

export const dynamic = "force-dynamic";

/** Map an application role to the engine's sign-off role hierarchy. */
export function appRoleToSignOffRole(role: AppRole): SignOffRole {
  switch (role) {
    case "super_admin":
      return "senior_leadership";
    case "responsible_individual":
      return "responsible_individual";
    case "registered_manager":
    case "admin": // legacy alias → registered_manager
      return "registered_manager";
    case "deputy_manager":
      return "deputy_manager";
    case "team_leader":
      return "team_leader";
    case "therapist":
      return "senior_support_worker";
    default:
      // care workers, bank staff, auditors, partners, etc.
      return "support_worker";
  }
}

interface SignOffBody extends Partial<WorkflowSignOffInput> {
  /** Optional original input — when present the result is regenerated authoritatively. */
  input?: OversightInput;
  /** When present, a successful sign-off is recorded against this source record. */
  recordId?: string;
  recordType?: string;
  /** When present, a successful sign-off stamps the linked Ethical Intelligence
   *  cycle (managementOversightCompleted → true). */
  ethicalEventId?: string;
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.SIGN_OFF_TASKS);
  if (auth instanceof NextResponse) return auth;

  let body: SignOffBody;
  try {
    body = (await req.json()) as SignOffBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Authoritative result: regenerate from input when provided, else trust the
  // supplied result (kept for flexibility; the role gate below is still derived
  // from the authenticated role, so it cannot be escalated by the client).
  let oversightResult: OversightResult | undefined;
  if (body.input && typeof body.input === "object") {
    oversightResult = generateManagementOversight(body.input);
  } else {
    oversightResult = body.oversightResult;
  }
  if (!oversightResult) {
    return NextResponse.json(
      { error: "Either an `input` (to regenerate) or a prior `oversightResult` is required" },
      { status: 400 },
    );
  }
  if (typeof body.finalProfessionalOversight !== "string") {
    return NextResponse.json({ error: "finalProfessionalOversight is required" }, { status: 400 });
  }

  const signOffInput: WorkflowSignOffInput = {
    oversightResult,
    // Authenticated role wins — never trust body.signOffRole.
    signOffRole: appRoleToSignOffRole(auth.role),
    finalProfessionalOversight: body.finalProfessionalOversight,
    childAddressedOversight: body.childAddressedOversight,
    confirmActionsAssigned: !!body.confirmActionsAssigned,
    confirmTimescalesRecorded: !!body.confirmTimescalesRecorded,
    confirmRisksEscalated: !!body.confirmRisksEscalated,
    confirmChildFacingSafeOrSuppressed: !!body.confirmChildFacingSafeOrSuppressed,
    oversightChildModeRequested: body.oversightChildModeRequested,
    contradictionsUnresolved: body.contradictionsUnresolved,
    overrideReason: body.overrideReason,
    signedOffByUserId: auth.userId, // never trust body
  };

  try {
    const result = generateWorkflowSignOff(signOffInput);

    // On a successful sign-off, record the manager's decision against the source
    // record so the oversight loop closes (the record drops off the "needs
    // oversight" queue). Only the human's own decision is persisted — no AI, no
    // external notification. Mutates only the in-memory store.
    let persistedToRecord = false;
    if (result.signed && body.recordId && body.recordType === "incident") {
      const note = buildSignOffNote(body.finalProfessionalOversight, signOffInput.signOffRole);
      const updated = db.incidents.addOversight(body.recordId, note, auth.userId);
      persistedToRecord = !!updated;
    }

    // Ethical Intelligence spine: a signed workflow stamps the linked learning
    // event's cycle — management oversight is now COMPLETED, evidenced by this
    // very sign-off. (Integration stage, one of the cycle's closure questions.)
    let ethicalCycleStamped = false;
    if (result.signed && body.ethicalEventId) {
      const stamped = markOversightCompleted(body.ethicalEventId, auth.userId);
      ethicalCycleStamped = stamped.ok;
    }

    // Always 200: a blocked-but-evaluated sign-off is a valid result (signed:false
    // + blockers), not a transport error. Genuine failures use 400/403/500.
    return NextResponse.json({ data: { ...result, persistedToRecord, ethicalCycleStamped } });
  } catch (error) {
    console.error("[api] server error:", error);
    return NextResponse.json({ error: "Failed to process workflow sign-off" }, { status: 500 });
  }
}
