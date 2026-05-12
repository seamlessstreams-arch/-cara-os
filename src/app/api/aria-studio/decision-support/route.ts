// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria-studio/decision-support — Decision support records
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createDecisionSupport, listDecisionSupport } from "@/lib/aria-studio/decision-support.service";

function hId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? undefined;
    const records = await listDecisionSupport(hId(), childId);
    return NextResponse.json({ data: records });
  } catch (err) {
    console.error("[aria-studio/decision-support] GET error:", err);
    return NextResponse.json({ error: "Failed to list decision support records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await createDecisionSupport({
      home_id: hId(),
      decision_context: body.decision_context,
      child_id: body.child_id ?? null,
      staff_id: body.staff_id ?? null,
      known_facts: body.known_facts ?? [],
      unknowns: body.unknowns ?? [],
      risks: body.risks ?? [],
      options: body.options ?? [],
      pros_cons: body.pros_cons ?? [],
      child_impact: body.child_impact ?? null,
      staff_impact: body.staff_impact ?? null,
      compliance_impact: body.compliance_impact ?? null,
      recommended_next_steps: body.recommended_next_steps ?? [],
      evidence_needed: body.evidence_needed ?? [],
      decision_made_by: null,
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err) {
    console.error("[aria-studio/decision-support] POST error:", err);
    return NextResponse.json({ error: "Failed to create decision support record" }, { status: 500 });
  }
}
