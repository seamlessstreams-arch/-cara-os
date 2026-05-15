"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accessibility, ChevronRight, AlertTriangle, Brain, Clock, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 8, not_accessible_count: 1, adjustments_needed_count: 2, completed_count: 3, deferred_count: 1, wheelchair_rate: 50.0, ramp_rate: 37.5, grab_rails_rate: 75.0, visual_aids_rate: 50.0, hearing_loop_rate: 25.0, signage_rate: 62.5, lighting_rate: 87.5, emergency_egress_rate: 75.0, unique_assessors: 3 };

const DEMO_RECORDS: { assessor: string; area: string; level: string; status: string }[] = [
  { assessor: "D. Laville", area: "Entrance", level: "Fully Access.", status: "Completed" },
  { assessor: "J. Hughes", area: "Upper Floors", level: "Not Access.", status: "Identified" },
  { assessor: "D. Laville", area: "Bathroom", level: "Adjustments", status: "In Progress" },
  { assessor: "L. Jones", area: "Kitchen", level: "Partially", status: "Completed" },
  { assessor: "J. Hughes", area: "Bedroom", level: "Adjustments", status: "Deferred" },
  { assessor: "D. Laville", area: "Outdoor", level: "Fully Access.", status: "Completed" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "not_accessible_entrance", severity: "critical", message: "Upper floors not accessible — urgent reasonable adjustments required under Equality Act." },
  { type: "adjustments_deferred", severity: "high", message: "1 area needing adjustments has been deferred — review urgency." },
  { type: "lighting_gap", severity: "medium", message: "1 area with inadequate lighting — safety concern for visually impaired." },
];

const ARIA_INSIGHTS = [
  "8 assessments across 3 assessors. Not accessible: 1. Adjustments needed: 2. Completed: 3.",
  "Priority: 1 area not accessible. Emergency egress 75.0%. Hearing loop 25.0%.",
  "Accessibility is a right, not a luxury. Are reasonable adjustments timely? Is every child able to access every part of their home safely?",
];

const LEVEL_BADGES: Record<string, { label: string; color: string }> = {
  "Fully Access.": { label: "Full", color: "text-green-700 bg-green-50 border-green-200" },
  "Partially": { label: "Partial", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Adjustments": { label: "Adjust.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Not Access.": { label: "No Access", color: "text-red-700 bg-red-50 border-red-200" },
};

export function HomeAccessibilityAssessmentCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-teal-200">
      <CardHeader className="pb-3 bg-teal-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Accessibility className="h-4 w-4 text-teal-600" /><span className="text-teal-900">Accessibility</span></CardTitle>
          <Link href="/home-accessibility-assessment" className="text-xs text-teal-600 hover:underline flex items-center gap-1">Assessments <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.not_accessible_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_accessible_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_accessible_count}</p><p className="text-[10px] text-muted-foreground">No Access</p></div>
          <div className={cn("text-center rounded-lg p-2", m.adjustments_needed_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.adjustments_needed_count === 0 ? "text-green-600" : "text-amber-600")}>{m.adjustments_needed_count}</p><p className="text-[10px] text-muted-foreground">Adjustments</p></div>
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.completed_count}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
          <div className="text-center rounded-lg p-2 bg-teal-50"><p className="text-lg font-bold tabular-nums text-teal-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = LEVEL_BADGES[r.level] ?? LEVEL_BADGES["Partially"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><DoorOpen className="h-3 w-3 text-teal-500 shrink-0" /><span className="font-medium">{r.assessor}</span><span className="text-muted-foreground truncate">{r.area} · {r.status}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Accessibility Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-teal-700"><Brain className="h-3 w-3" />ARIA Accessibility Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-teal-200 bg-teal-50 text-teal-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
