"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, ChevronRight, AlertTriangle, Brain,
  Clock, Search, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_assessments: 12,
  very_high_risk_count: 1,
  high_risk_count: 2,
  trigger_plan_rate: 75.0,
  return_interview_rate: 83.3,
  exploitation_risk_count: 1,
  unique_children: 4,
  average_previous_episodes: 2.5,
};

const DEMO_RECORDS: { child: string; risk: string; type: string; status: string }[] = [
  { child: "Child A", risk: "Very High", type: "Post-Incident", status: "Active" },
  { child: "Child B", risk: "High", type: "Periodic", status: "Active" },
  { child: "Child C", risk: "Medium", type: "Initial", status: "Review" },
  { child: "Child A", risk: "High", type: "Trigger Plan", status: "Updated" },
  { child: "Child D", risk: "Low", type: "Periodic", status: "Active" },
  { child: "Child B", risk: "Medium", type: "Return Int.", status: "N/A" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "exploitation", severity: "critical", message: "Exploitation risk identified — escalate to safeguarding lead." },
  { type: "no_trigger", severity: "critical", message: "1 very high risk child has no trigger plan — create immediately." },
  { type: "return", severity: "high", message: "1 post-incident review has no return interview — arrange within 72 hours." },
];

const ARIA_INSIGHTS = [
  "12 assessments. Very high: 1. High: 2. Trigger plans: 75%. Return interviews: 83.3%. 4 children.",
  "Priority: 1 exploitation risk. 1 missing trigger plan. 1 missing return interview. Address immediately.",
  "Positive: Regular assessments. Peer mapping improving. Safe places identified. Continue multi-agency work.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Active": { label: "Active", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Review": { label: "Review", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Updated": { label: "Updated", color: "text-green-700 bg-green-50 border-green-200" },
  "N/A": { label: "N/A", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function MissingPersonRiskCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            Missing Person Risk
          </CardTitle>
          <Link href="/missing-person-risk" className="text-xs text-brand hover:underline flex items-center gap-1">
            Risks <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.very_high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.very_high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.very_high_risk_count}</p>
            <p className="text-[10px] text-muted-foreground">V.High</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-amber-600")}>{m.high_risk_count}</p>
            <p className="text-[10px] text-muted-foreground">High</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.trigger_plan_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.trigger_plan_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.trigger_plan_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Triggers</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.exploitation_risk_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.exploitation_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.exploitation_risk_count}</p>
            <p className="text-[10px] text-muted-foreground">Exploit</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Active"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Search className="h-3 w-3 text-orange-500 shrink-0" />
                    <span className="font-medium">{r.child}</span>
                    <span className="text-muted-foreground truncate">{r.risk} · {r.type}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Missing Risk Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Missing Risk Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
