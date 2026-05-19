// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Management Oversight Queue  (Milestone 14)
//
// GET    ?home_id=… → live oversight queue (pending suggestions + amendment
//                     reviews + recently returned items, sorted by severity)
// POST   { record_id, action: "acknowledge" } → acknowledge an amendment
//
// Permission: aria.view_audit_logs for read; aria.approve_outputs for
// acknowledging amendments (since acknowledgement closes a manager-review
// loop on a committed safeguarding-sensitive record).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";
import { loadOversightQueue } from "@/lib/aria/management-oversight";
import { acknowledgeAmendment } from "@/lib/aria/aria-committed-amendments";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view oversight queue",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadOversightQueue(homeId) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recordId = typeof body.record_id === "string" ? body.record_id : null;
  const action = typeof body.action === "string" ? body.action : null;
  if (!recordId || action !== "acknowledge") {
    return NextResponse.json(
      { error: "record_id and action='acknowledge' are required" },
      { status: 400 },
    );
  }

  const existing = db.ariaCommittedRecords.findById(recordId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.approve_outputs",
    homeId: existing.home_id,
    childId: existing.child_id,
    intent: `acknowledge amendment:${existing.record_type}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const result = acknowledgeAmendment(recordId, guard.actor.userId);
  if ("code" in result) {
    if (result.code === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.code === "not_review_required") {
      return NextResponse.json(
        { error: "This record does not require manager review" },
        { status: 409 },
      );
    }
    if (result.code === "already_acknowledged") {
      return NextResponse.json({ data: result.record });
    }
  }

  const acknowledged = result as Exclude<typeof result, { code: string }>;
  await appendAriaAudit({
    homeId: existing.home_id,
    actorId: guard.actor.userId,
    actionType: "artifact_approved",
    artifactId: acknowledged.id,
    summary: `Acknowledged amendment v${acknowledged.version} on ${existing.record_type}`,
    after: {
      acknowledged_by: acknowledged.amendment_acknowledged_by,
      acknowledged_at: acknowledged.amendment_acknowledged_at,
    },
  });

  return NextResponse.json({ data: acknowledged });
}
