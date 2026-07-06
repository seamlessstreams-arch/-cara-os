// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA AUDIT API (§21)
// GET → the Ask CARA audit trail + usage summary by mode/intent (management only).
//       Text is hashed at write time; no raw sensitive content is returned.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";

const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);

export async function GET(req: NextRequest) {
  if (!MANAGEMENT.has((req.headers.get("x-user-role") || "").toLowerCase())) {
    return NextResponse.json({ error: "Management access required" }, { status: 403 });
  }
  const store = getStore();
  const events = [...store.askCaraAuditEvents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

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
