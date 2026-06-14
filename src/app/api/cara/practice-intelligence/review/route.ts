// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/cara/practice-intelligence/review
//
// Manager review of Cara output — persists decisions + rationale (audit trail):
//   • { entity: "flag",       id, rationale }            → resolve a flag (never deleted)
//   • { entity: "assessment", id, decision, rationale }  → record manager decision
//   • { entity: "threshold",  id, decision, rationale }  → record threshold decision
// Role-gated via cara.approve_outputs (RM / RI / deputy). Rationale is mandatory.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToCaraRole, checkCaraAccess } from "@/lib/cara/cara-permissions";
import { validateReview, buildFlagResolution, buildAssessmentDecision, buildThresholdDecision, type ReviewInput } from "@/lib/cara-practice/cara-review";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  let body: ReviewInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Role gate — only managers/RI/deputy may approve/close Cara output.
  const appRole = getUserRoleFromRequest(req);
  const userId = getUserIdFromRequest(req);
  const caraRole = appRoleToCaraRole(appRole);
  const access = checkCaraAccess({ userId, role: caraRole, staffSelfId: userId }, { permission: "cara.approve_outputs" });
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? "Reviewing Cara output requires manager approval rights." }, { status: 403 });
  }

  const v = validateReview(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const now = new Date().toISOString();

  if (body.entity === "flag") {
    const existing = db.caraPracticeFlags.findById(body.id);
    if (!existing) return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    // Guardrail: flags are resolved, never deleted — high/critical flags remain on record.
    const rec = db.caraPracticeFlags.patch(body.id, buildFlagResolution(userId, body.rationale ?? "", now));
    return NextResponse.json({ data: rec, meta: { action: "resolved", by: userId } });
  }

  if (body.entity === "assessment") {
    const existing = db.caraPracticeAssessments.findById(body.id);
    if (!existing) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    const rec = db.caraPracticeAssessments.patch(body.id, buildAssessmentDecision(userId, body.decision ?? "", body.rationale ?? "", now));
    return NextResponse.json({ data: rec, meta: { action: "reviewed", by: userId } });
  }

  // threshold
  const existing = db.caraThresholdConsultations.findById(body.id);
  if (!existing) return NextResponse.json({ error: "Threshold consultation not found" }, { status: 404 });
  const rec = db.caraThresholdConsultations.patch(body.id, buildThresholdDecision(body.decision ?? "", body.rationale ?? ""));
  return NextResponse.json({ data: rec, meta: { action: "decided", by: userId } });
}
