// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Management Oversight Queue  (Milestone 14)
//
// GET    ?home_id=… → live oversight queue (pending suggestions + amendment
//                     reviews + recently returned items, sorted by severity)
// POST   { record_id, action: "acknowledge" } → acknowledge an amendment
//
// Permission: cara.view_audit_logs for read; cara.approve_outputs for
// acknowledging amendments (since acknowledgement closes a manager-review
// loop on a committed safeguarding-sensitive record).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { loadOversightQueue } from "@/lib/cara/management-oversight";
import { acknowledgeAmendment } from "@/lib/cara/cara-committed-amendments";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view oversight queue",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadOversightQueue(homeId) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
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

  const existing = db.caraCommittedRecords.findById(recordId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
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
  await appendCaraAudit({
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
