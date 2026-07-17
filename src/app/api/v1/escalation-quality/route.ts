// ══════════════════════════════════════════════════════════════════════════════
// CARA — ESCALATION QUALITY (2.2.11 / doctrine 1.10)
//
// GET /api/v1/escalation-quality → decision-timeliness reads + findings
//
// Cara auditing Cara's home: are escalation decisions made inside their
// windows, is anything aging while nobody decides, is the urgency mix healthy.
// Pure projection over the existing escalation-decision records. Read only.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { assessEscalationQuality } from "@/lib/risk-escalation/escalation-quality-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const result = assessEscalationQuality(getStore().escalationDecisions ?? [], new Date());
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
