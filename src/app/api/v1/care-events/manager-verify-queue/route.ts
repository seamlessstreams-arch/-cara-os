// ══════════════════════════════════════════════════════════════════════════════
// API — Manager Verify Queue  (Milestone 29)
//
// GET  ?home_id= → ManagerVerifyQueue
// POST { action: "verify"|"return", home_id, care_event_ids[],
//        manager_signature, manager_notes?, return_reason? } → BulkActionResult
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadManagerVerifyQueue } from "@/lib/care-events/manager-verify-queue";
import {
  verifyCareEventsBulk,
  returnCareEventsBulk,
} from "@/lib/care-events/manager-bulk-actions";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view manager verify queue",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadManagerVerifyQueue(homeId) });
}

interface BulkBody {
  action: "verify" | "return";
  home_id?: string;
  care_event_ids: string[];
  manager_signature?: boolean;
  manager_notes?: string | null;
  return_reason?: string;
}

export async function POST(req: NextRequest) {
  let body: BulkBody;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as BulkBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const homeId = body.home_id ?? DEFAULT_HOME_ID;
  const ids = Array.isArray(body.care_event_ids) ? body.care_event_ids : [];
  if (!body.action || (body.action !== "verify" && body.action !== "return")) {
    return NextResponse.json({ error: "action must be 'verify' or 'return'" }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "care_event_ids must be a non-empty array" }, { status: 400 });
  }

  const permission = body.action === "verify"
    ? "cara.approve_outputs"
    : "cara.reject_outputs";

  const guard = requireCaraStudioPermission(req, body as unknown as Record<string, unknown>, {
    permission,
    homeId,
    intent: `bulk ${body.action} care events`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  if (body.action === "verify" && !body.manager_signature) {
    return NextResponse.json(
      { error: "manager_signature is required to verify" },
      { status: 422 },
    );
  }
  if (body.action === "return" && !body.return_reason?.trim()) {
    return NextResponse.json(
      { error: "return_reason is required to return" },
      { status: 422 },
    );
  }

  const actorId = guard.actor.userId;
  const result = body.action === "verify"
    ? verifyCareEventsBulk(homeId, ids, actorId, { manager_notes: body.manager_notes ?? null })
    : returnCareEventsBulk(homeId, ids, actorId, {
        return_reason: body.return_reason!,
        manager_notes: body.manager_notes ?? null,
      });

  return NextResponse.json({ data: result });
}
