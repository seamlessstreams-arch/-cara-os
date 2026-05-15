"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ChevronRight, AlertTriangle, Brain, Clock, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 8, clinical_count: 2, crisis_count: 1, declining_count: 1, improving_count: 3, child_self_reported_rate: 62.5, discussed_with_child_rate: 50.0, informed_care_plan_rate: 75.0, referral_made_rate: 37.5, unique_children: 4 };

const DEMO_RECORDS: { child: string; measure: string; band: string; trend: string }[] = [
  { child: "Child A", measure: "SDQ Total", band: "Normal", trend: "Improving" },
  { child: "Child B", measure: "RCADS Anxiety", band: "Clinical", trend: "Declining" },
  { child: "Child C", measure: "SDQ Emotional", band: "Crisis", trend: "Stable" },
  { child: "Child A", measure: "Wellbeing Scale", band: "Normal", trend: "Improving" },
  { child: "Child D", measure: "RCADS Depress.", band: "Borderline", trend: "Improving" },
  { child: "Child B", measure: "Self Report", band: "High Clinical", trend: "Fluctuating" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "crisis_no_referral", severity: "critical", message: "Child C is in crisis band with no referral made — urgent clinical intervention required." },
  { type: "clinical_declining", severity: "high", message: "1 child has clinical-level scores with a declining trend." },
  { type: "child_views_not_discussed", severity: "high", message: "4 assessments have results not discussed with the child." },
];

const ARIA_INSIGHTS = [
  "8 assessments across 4 children. Clinical: 2. Crisis: 1. Declining: 1. Improving: 3.",
  "Priority: 1 crisis with no referral. Child self-reported 62.5%. Discussed with child 50.0%.",
  "Emotional wellbeing is the foundation. Are scores improving? Is the child's voice heard in their own assessment?",
];

const BAND_BADGES: Record<string, { label: string; color: string }> = {
  "Normal": { label: "Normal", color: "text-green-700 bg-green-50 border-green-200" },
  "Borderline": { label: "Border.", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Clinical": { label: "Clinical", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "High Clinical": { label: "High Cln.", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Crisis": { label: "Crisis", color: "text-red-700 bg-red-50 border-red-200" },
};

export function EmotionalWellbeingOutcomeCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-pink-200">
      <CardHeader className="pb-3 bg-pink-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-pink-600" /><span className="text-pink-900">Emotional Wellbeing</span></CardTitle>
          <Link href="/emotional-wellbeing-outcome" className="text-xs text-pink-600 hover:underline flex items-center gap-1">Outcomes <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.crisis_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.crisis_count === 0 ? "text-green-600" : "text-red-600")}>{m.crisis_count}</p><p className="text-[10px] text-muted-foreground">Crisis</p></div>
          <div className={cn("text-center rounded-lg p-2", m.clinical_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.clinical_count === 0 ? "text-green-600" : "text-amber-600")}>{m.clinical_count}</p><p className="text-[10px] text-muted-foreground">Clinical</p></div>
          <div className={cn("text-center rounded-lg p-2", m.declining_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.declining_count === 0 ? "text-green-600" : "text-amber-600")}>{m.declining_count}</p><p className="text-[10px] text-muted-foreground">Declining</p></div>
          <div className="text-center rounded-lg p-2 bg-pink-50"><p className="text-lg font-bold tabular-nums text-pink-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = BAND_BADGES[r.band] ?? BAND_BADGES["Normal"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><HeartPulse className="h-3 w-3 text-pink-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.measure} · {r.trend}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Wellbeing Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-pink-700"><Brain className="h-3 w-3" />ARIA Wellbeing Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-pink-200 bg-pink-50 text-pink-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
