// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ASSESSMENT INTELLIGENCE API ROUTE
// GET /api/v1/risk-assessment-intelligence
// Returns risk levels, trends, mitigation effectiveness, child voice rates,
// domain analysis, and Cara risk intelligence.
// Reg 12 — risk assessments, Reg 34 — missing children risk, Reg 11 — voice.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRiskAssessmentIntelligence,
  type ChildInput,
  type RiskAssessmentInput,
  type MitigationInput,
  type RiskLevel,
  type RiskTrend,
  type RiskStatus,
  type MitigationEffectiveness,
} from "@/lib/engines/risk-assessment-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map children ────────────────────────────────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name || yp.first_name,
  }));

  // ── Map risk assessments ────────────────────────────────────────────────────
  const assessments: RiskAssessmentInput[] = store.riskAssessments.map((a) => {
    const mitigations: MitigationInput[] = (a.mitigations ?? []).map((m) => ({
      strategy: m.strategy,
      responsible: m.responsible,
      effectiveness: (m.effectiveness ?? "not_assessed") as MitigationEffectiveness,
    }));

    return {
      id: a.id,
      child_id: a.child_id,
      domain: a.domain,
      current_level: a.current_level as RiskLevel,
      previous_level: a.previous_level as RiskLevel,
      trend: a.trend as RiskTrend,
      status: (a.status ?? "current") as RiskStatus,
      assessed_date: a.assessed_date,
      review_date: a.review_date,
      mitigations,
      has_child_views: Boolean(a.child_views),
      has_contingency_plan: Boolean(a.contingency_plan),
      linked_incidents_count: (a.linked_incidents ?? []).length,
    };
  });

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeRiskAssessmentIntelligence({ children, assessments });

  return NextResponse.json({ data: result });
}
