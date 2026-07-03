// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/formulations — Therapeutic formulations
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createFormulation, listFormulations, getFormulationForChild } from "@/lib/cara-studio/formulation.service";

function hId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id");

    if (childId) {
      const formulation = await getFormulationForChild(childId);
      return NextResponse.json({ data: formulation });
    }

    const formulations = await listFormulations(hId());
    return NextResponse.json({ data: formulations });
  } catch (err) {
    console.error("[cara-studio/formulations] GET error:", err);
    return NextResponse.json({ error: "Failed to get formulations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const formulation = await createFormulation({
      home_id: hId(),
      child_id: body.child_id,
      title: body.title ?? "Therapeutic Formulation",
      presenting_behaviour: body.presenting_behaviour ?? null,
      possible_unmet_need: body.possible_unmet_need ?? null,
      trauma_link: body.trauma_link ?? null,
      attachment_considerations: body.attachment_considerations ?? null,
      triggers: body.triggers ?? [],
      protective_factors: body.protective_factors ?? [],
      relational_strengths: body.relational_strengths ?? [],
      staff_response_patterns: body.staff_response_patterns ?? [],
      what_helps: body.what_helps ?? null,
      what_escalates: body.what_escalates ?? null,
      therapeutic_hypothesis: body.therapeutic_hypothesis ?? null,
      recommended_intervention: body.recommended_intervention ?? null,
      review_date: body.review_date ?? null,
      evidence_source_ids: body.evidence_source_ids ?? [],
      created_by: body.created_by ?? "system",
      approved_by: null,
    });

    return NextResponse.json({ data: formulation }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/formulations] POST error:", err);
    return NextResponse.json({ error: "Failed to create formulation" }, { status: 500 });
  }
}
