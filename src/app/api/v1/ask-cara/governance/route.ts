// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA GOVERNANCE API (§24)
// GET → the governance cockpit summary (management only): usage by intent,
//       deterministic-only compliance, prohibited attempts, declarations pending
//       review, external-AI calls avoided.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { buildGovernanceSummary } from "@/lib/ask-cara/governance-summary";
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
  const [askCaraAuditEventsList, externalAiDeclarationsList] = await Promise.all([dal.askCaraAuditEvents.findAll(), dal.externalAiDeclarations.findAll()]);
  const summary = buildGovernanceSummary(askCaraAuditEventsList ?? [], externalAiDeclarationsList ?? []);
  return NextResponse.json({ data: summary });
}
