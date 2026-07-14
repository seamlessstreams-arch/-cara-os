// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 INTELLIGENCE API ROUTE
// GET /api/v1/reg44-intelligence
// Returns visit compliance, recommendation follow-through, Ofsted reporting
// timeliness, and Cara independent scrutiny intelligence.
// Reg 44 — independent person visits (monthly, report within 5 working days).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeReg44Intelligence,
  type VisitInput,
  type RecommendationInput,
} from "@/lib/engines/reg44-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map Reg 44 visit reports ────────────────────────────────────────────────
  const visits: VisitInput[] = store.reg44VisitReports.map((v) => {
    // Parse children_spoken count from "3/3" format
    const spokenParts = (v.children_spoken ?? "0/0").split("/");
    const childrenSpoken = parseInt(spokenParts[0], 10) || 0;
    const childrenTotal = parseInt(spokenParts[1], 10) || store.youngPeople.length;

    // Parse duration from "4 hours" format
    const durationMatch = (v.duration ?? "").match(/(\d+\.?\d*)/);
    const durationHours = durationMatch ? parseFloat(durationMatch[1]) : 0;

    const recommendations: RecommendationInput[] = (v.recommendations ?? []).map((r) => ({
      id: r.id,
      recommendation: r.recommendation,
      priority: r.priority as RecommendationInput["priority"],
      // r.status has no "rejected" — that branch could never fire (TS2367).
      status: r.status === "completed" ? "completed" :
              r.status === "in_progress" ? "in_progress" : "pending",
      rm_response: r.rm_response ?? null,
      completed_at: r.completed_at ?? null,
    }));

    return {
      id: v.id,
      visit_date: v.visit_date,
      visitor: v.visitor,
      duration_hours: durationHours,
      children_spoken_count: childrenSpoken,
      children_total: childrenTotal,
      staff_spoken: v.staff_spoken ?? 0,
      records_reviewed: v.records_reviewed ?? [],
      overall_judgement: v.overall_judgement ?? "",
      strengths_count: (v.strengths ?? []).length,
      areas_for_development_count: (v.areas_for_development ?? []).length,
      recommendations,
      report_sent_to_ofsted: v.report_sent_to_ofsted ?? false,
      report_sent_date: v.report_sent_date ?? null,
    };
  });

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeReg44Intelligence({ visits });

  return NextResponse.json({ data: result });
}
