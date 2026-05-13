"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR SUPPORT PLANS INTELLIGENCE CARD
// Dashboard card for BSP tracking, strategy effectiveness, and reviews.
// CHR 2015 Reg 19/20/6. SCCIF: Overall Experiences — Behaviour support.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, ChevronRight, AlertTriangle, Brain,
  Target, TrendingUp, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_plans: 8,
  active_plans: 5,
  expired_plans: 1,
  draft_plans: 2,
  children_with_bsp: 5,
  highly_effective_count: 2,
  not_effective_count: 1,
  child_involvement_rate: 62.5,
  staff_briefed_rate: 75.0,
  psychologist_input_rate: 37.5,
};

const DEMO_PLANS: { child: string; status: string; effectiveness: string; incidents: number }[] = [
  { child: "Child A", status: "Active", effectiveness: "Effective", incidents: 2 },
  { child: "Child B", status: "Active", effectiveness: "Highly Effective", incidents: 0 },
  { child: "Child C", status: "Active", effectiveness: "Not Effective", incidents: 8 },
  { child: "Child D", status: "Active", effectiveness: "Partially Effective", incidents: 4 },
  { child: "Child E", status: "Draft", effectiveness: "Not Yet Evaluated", incidents: 0 },
  { child: "Child A", status: "Expired", effectiveness: "Effective", incidents: 1 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "bsp_not_effective", severity: "critical", message: "Child C's behaviour support plan rated not effective (8 incidents) — urgent review with specialist input needed." },
  { type: "staff_not_briefed", severity: "high", message: "Staff not briefed on Child D's active behaviour support plan — brief all staff immediately." },
  { type: "child_not_involved", severity: "medium", message: "Child E not involved in creating their behaviour support plan — Reg 7 requires participation." },
];

const ARIA_INSIGHTS = [
  "8 BSPs across 5 children. 5 active, 1 expired, 2 draft. 2 highly effective, 1 not effective. Child involvement: 62.5%. Staff briefed: 75%. Psychologist input: 37.5%.",
  "Priority: Child C's BSP is failing — 8 incidents since last review. Needs urgent specialist review. Increase psychologist input from 37.5%. Ensure all staff briefed on all active plans (currently 75%).",
  "Positive: Child B's BSP highly effective with zero incidents. Child A showing improvement. Increase child involvement rate to 100% — children who co-create their plans show better outcomes. Draft plans for Child E need finalising.",
];

const EFF_BADGES: Record<string, { label: string; color: string }> = {
  "Highly Effective": { label: "Excellent", color: "text-green-700 bg-green-50 border-green-200" },
  Effective: { label: "Effective", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Partially Effective": { label: "Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Not Effective": { label: "Ineffective", color: "text-red-700 bg-red-50 border-red-200" },
  "Not Yet Evaluated": { label: "Pending", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function BehaviourSupportPlansCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand" />
            Behaviour Support Plans
          </CardTitle>
          <Link href="/behaviour-support-plans" className="text-xs text-brand hover:underline flex items-center gap-1">
            BSPs <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.active_plans}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.highly_effective_count}</p>
            <p className="text-[10px] text-muted-foreground">Effective</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.not_effective_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.not_effective_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_effective_count}</p>
            <p className="text-[10px] text-muted-foreground">Failing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.staff_briefed_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.staff_briefed_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.staff_briefed_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Briefed</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Support Plans</p>
          <div className="space-y-1">
            {DEMO_PLANS.map((bp, i) => {
              const badge = EFF_BADGES[bp.effectiveness] ?? EFF_BADGES["Not Yet Evaluated"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{bp.child}</span>
                    <span className="text-muted-foreground truncate">{bp.status} · {bp.incidents} incidents</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />BSP Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA BSP Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
