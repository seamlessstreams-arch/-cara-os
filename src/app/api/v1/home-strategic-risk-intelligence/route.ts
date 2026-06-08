import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeStrategicRisk,
  type DailyRiskBriefingInput, type RiskRegisterEntryInput, type StrategicRiskInput,
  type RiskManagementPlanInput, type RiskAppetiteInput,
} from "@/lib/engines/home-strategic-risk-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const daily_risk_briefings: DailyRiskBriefingInput[] = (store.dailyRiskBriefings as any[]).map((b: any) => ({
    id: b.id, date: (b.date ?? "").toString().slice(0, 10),
    shift_type: b.shift_type ?? "day",
    child_risks_count: b.child_risks?.length ?? 0,
    home_alerts_count: b.home_alerts?.length ?? 0,
    staff_on_shift_count: b.staff_on_shift?.length ?? 0,
  }));

  const risk_register_entries: RiskRegisterEntryInput[] = (store.riskRegisterEntries as any[]).map((r: any) => ({
    id: r.id, risk_level: r.risk_level ?? "medium",
    status: r.status ?? "active",
    mitigations_count: r.mitigations?.length ?? 0,
    review_date: (r.review_date ?? "").toString().slice(0, 10),
    last_reviewed: (r.last_reviewed ?? "").toString().slice(0, 10),
  }));

  const strategic_risks: StrategicRiskInput[] = (store.strategicRiskRecords as any[]).map((s: any) => ({
    id: s.id, category: s.category ?? "operational",
    current_likelihood: s.current_likelihood ?? 0,
    current_impact: s.current_impact ?? 0,
    residual_risk_score: s.residual_risk_score ?? 0,
    target_risk_score: s.target_risk_score ?? 0,
    controls_count: s.current_controls?.length ?? 0,
    additional_controls_needed: s.additional_controls_required?.length ?? 0,
    last_reviewed: (s.last_reviewed ?? "").toString().slice(0, 10),
    next_review_date: (s.next_review_date ?? "").toString().slice(0, 10),
    board_level: !!(s.board_level),
    trend: s.trend ?? "stable",
  }));

  const risk_management_plans: RiskManagementPlanInput[] = (store.riskManagementPlanRecords as any[]).map((p: any) => ({
    id: p.id, child_id: p.child_id ?? "",
    risk_category: p.risk_category ?? "other",
    current_risk_level: p.current_risk_level ?? "medium",
    strategies_count: p.management_strategies?.length ?? 0,
    triggers_count: p.triggers?.length ?? 0,
    protective_factors_count: p.protective_factors?.length ?? 0,
    review_date: (p.review_date ?? "").toString().slice(0, 10),
    last_reviewed: (p.last_reviewed ?? "").toString().slice(0, 10),
    status: p.status ?? "active",
    child_views_present: !!(p.child_views && String(p.child_views).trim().length > 0),
  }));

  const risk_appetite_domains: RiskAppetiteInput[] = (store.riskAppetiteDomains as any[]).map((d: any) => ({
    id: d.id, name: d.name ?? "",
    appetite_level: d.appetite_level ?? "cautious",
    red_lines_count: d.red_lines?.length ?? 0,
    examples_count: d.examples?.length ?? 0,
  }));

  const result = computeHomeStrategicRisk({
    today, daily_risk_briefings, risk_register_entries, strategic_risks,
    risk_management_plans, risk_appetite_domains,
    total_children: store.youngPeople?.length ?? 0,
    total_staff: store.staff?.length ?? 0,
  });

  return NextResponse.json({ data: result });
}
