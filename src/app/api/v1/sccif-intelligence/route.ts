// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SCCIF SELF-EVALUATION INTELLIGENCE API ROUTE
// GET /api/v1/sccif-intelligence
// Returns self-evaluation coverage, strength ratios, action tracking,
// evidence gaps, and inspection readiness score across SCCIF judgment areas.
// Regulatory: Social Care Common Inspection Framework (Ofsted), Reg 45.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSCCIFIntelligence,
  type SelfEvaluationAreaInput,
  type SelfEvaluationActionInput,
} from "@/lib/engines/sccif-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map self-evaluation areas from store ────────────────────────────────────
  const areas: SelfEvaluationAreaInput[] = store.selfEvaluationAreas.map((record) => {
    const actions: SelfEvaluationActionInput[] = (record.actions ?? []).map((a) => ({
      action: a.action,
      owner: a.owner,
      target_date: a.target_date,
      status: a.status === "completed" ? "completed" :
              a.status === "in_progress" ? "in_progress" : "open",
    }));

    return {
      id: record.id,
      area: record.area,
      self_grade: record.self_grade,
      strengths: record.strengths ?? [],
      evidence: record.evidence ?? [],
      areas_for_development: record.areas_for_development ?? [],
      actions,
    };
  });

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeSCCIFIntelligence({ areas });

  return NextResponse.json({ data: result });
}
