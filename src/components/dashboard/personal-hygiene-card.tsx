"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShowerHead, ChevronRight, AlertTriangle, Brain,
  Clock, Heart, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_assessments: 16,
  independence_rate: 43.8,
  dignity_maintained_rate: 93.8,
  child_comfortable_rate: 87.5,
  products_available_rate: 81.3,
  needs_improvement_count: 2,
  unique_children: 4,
  routine_established_rate: 62.5,
};

const DEMO_RECORDS: { child: string; area: string; level: string; progress: string }[] = [
  { child: "Child A", area: "Bathing", level: "Independent", progress: "Good" },
  { child: "Child B", area: "Dental", level: "Prompting", progress: "Developing" },
  { child: "Child C", area: "Hair Care", level: "Guidance", progress: "Good" },
  { child: "Child A", area: "Clothing", level: "Independent", progress: "Excellent" },
  { child: "Child D", area: "Hand Washing", level: "Assistance", progress: "Needs Imp" },
  { child: "Child B", area: "Skin Care", level: "Prompting", progress: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "dignity", severity: "critical", message: "Dignity not maintained — review practice immediately." },
  { type: "comfort", severity: "high", message: "2 assessments show child not comfortable — review approach." },
  { type: "cultural", severity: "medium", message: "3 assessments not culturally sensitive — review training." },
];

const ARIA_INSIGHTS = [
  "16 assessments. Independent: 43.8%. Dignity: 93.8%. Comfortable: 87.5%. Products: 81.3%. 4 children.",
  "Priority: 1 dignity concern. 2 comfort issues. 2 needs improvement. Address cultural sensitivity.",
  "Positive: Good independence progress. Routines establishing. Dignity mostly maintained. Improve products.",
];

const PROGRESS_BADGES: Record<string, { label: string; color: string }> = {
  "Excellent": { label: "Excellent", color: "text-green-700 bg-green-50 border-green-200" },
  "Good": { label: "Good", color: "text-green-700 bg-green-50 border-green-200" },
  "Developing": { label: "Developing", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Needs Imp": { label: "Needs Imp", color: "text-amber-700 bg-amber-50 border-amber-200" },
};

export function PersonalHygieneCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShowerHead className="h-4 w-4 text-brand" />
            Personal Hygiene
          </CardTitle>
          <Link href="/personal-hygiene" className="text-xs text-brand hover:underline flex items-center gap-1">
            Hygiene <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.independence_rate >= 60 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.independence_rate >= 60 ? "text-green-600" : "text-amber-600")}>{m.independence_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Independent</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.dignity_maintained_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.dignity_maintained_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.dignity_maintained_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Dignity</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.child_comfortable_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.child_comfortable_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.child_comfortable_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Comfortable</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.needs_improvement_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.needs_improvement_count === 0 ? "text-green-600" : "text-amber-600")}>{m.needs_improvement_count}</p>
            <p className="text-[10px] text-muted-foreground">Improve</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = PROGRESS_BADGES[r.progress] ?? PROGRESS_BADGES["Good"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Smile className="h-3 w-3 text-pink-500 shrink-0" />
                    <span className="font-medium">{r.child}</span>
                    <span className="text-muted-foreground truncate">{r.area} · {r.level}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Hygiene Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Hygiene Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
