// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA GOVERNANCE API (§24)
// GET → the governance cockpit summary (management only): usage by intent,
//       deterministic-only compliance, prohibited attempts, declarations pending
//       review, external-AI calls avoided.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildGovernanceSummary } from "@/lib/ask-cara/governance-summary";

export const dynamic = "force-dynamic";

const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);

export async function GET(req: NextRequest) {
  if (!MANAGEMENT.has((req.headers.get("x-user-role") || "").toLowerCase())) {
    return NextResponse.json({ error: "Management access required" }, { status: 403 });
  }
  const store = getStore();
  const summary = buildGovernanceSummary(store.askCaraAuditEvents ?? [], store.externalAiDeclarations ?? []);
  return NextResponse.json({ data: summary });
}
