// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA AUDIT API (§21)
// GET → the Ask CARA audit trail + usage summary by mode/intent (management only).
//       Text is hashed at write time; no raw sensitive content is returned.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { getRequestIdentity } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

// Live roles (session-derived) + legacy demo header roles, so neither mode loses access.
const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "organisation_director", "super_admin", "admin", "org_director", "area_manager", "platform_admin"]);

export async function GET(req: NextRequest) {
  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  if (!MANAGEMENT.has((identity.role || "").toLowerCase())) {
    return NextResponse.json({ error: "Management access required" }, { status: 403 });
  }
  const askCaraAuditEventsList = await dal.askCaraAuditEvents.findAll();
  const events = [...askCaraAuditEventsList].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const byIntent: Record<string, number> = {};
  for (const e of events) byIntent[e.intent] = (byIntent[e.intent] ?? 0) + 1;

  return NextResponse.json({
    data: {
      events: events.slice(0, 200),
      summary: {
        total: events.length,
        deterministicOnly: events.filter((e) => e.deterministicOnly).length,
        prohibitedTriggered: events.filter((e) => e.prohibitedTriggered).length,
        managerReviewRequired: events.filter((e) => e.managerReviewRequired).length,
        externalAiDeclared: events.filter((e) => e.externalAiDeclared).length,
        byIntent,
      },
    },
  });
}
