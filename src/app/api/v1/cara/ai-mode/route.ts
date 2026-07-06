// ══════════════════════════════════════════════════════════════════════════════
// CARA — AI MODE API (prompt 3 §21/§25)
// GET → how CARA is configured to source generative support (management only):
//       the mode, active provider, whether external AI is enabled, whether a
//       local model is configured/reachable. Makes the deterministic-first,
//       external-disabled-by-default posture observable + auditable.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { describeAiMode } from "@/lib/cara/ai-gateway/providers/provider-registry";

export const dynamic = "force-dynamic";

const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);

export async function GET(req: NextRequest) {
  if (!MANAGEMENT.has((req.headers.get("x-user-role") || "").toLowerCase())) {
    return NextResponse.json({ error: "Management access required" }, { status: 403 });
  }
  try {
    const data = await describeAiMode();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[cara/ai-mode] failed", err);
    return NextResponse.json({ error: "Failed to resolve AI mode" }, { status: 500 });
  }
}
