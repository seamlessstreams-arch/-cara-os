"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, ChevronRight, AlertTriangle, Brain, Clock, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 8, high_risk_count: 0, intolerable_count: 0, non_compliant_count: 1, temperature_compliance_rate: 87.5, flushing_compliance_rate: 75.0, water_treatment_rate: 87.5, legionella_test_rate: 75.0, remedial_action_count: 1, unique_assessors: 2 };

const DEMO_RECORDS: { assessor: string; system: string; risk: string; compliance: string }[] = [
  { assessor: "D. Laville", system: "Hot Water", risk: "Low", compliance: "Compliant" },
  { assessor: "J. Hughes", system: "Cold Water", risk: "Low", compliance: "Compliant" },
  { assessor: "D. Laville", system: "Shower", risk: "Medium", compliance: "Minor Non-Comp." },
  { assessor: "J. Hughes", system: "Dead Leg", risk: "Significant", compliance: "Compliant" },
  { assessor: "D. Laville", system: "Hot Water", risk: "Low", compliance: "Compliant" },
  { assessor: "J. Hughes", system: "Cooling Tower", risk: "Low", compliance: "Compliant" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "temperature_non_compliant", severity: "medium", message: "1 water system with temperature non-compliance — adjust immediately." },
  { type: "flushing_non_compliant", severity: "medium", message: "2 systems with flushing regime non-compliance." },
  { type: "test_gap", severity: "medium", message: "2 systems without legionella test completed." },
];

const ARIA_INSIGHTS = [
  "8 assessments across 2 assessors. High risk: 0. Intolerable: 0. Non-compliant: 1.",
  "Priority: Temperature compliance 87.5%. Flushing compliance 75.0%. Tests completed 75.0%.",
  "Legionella is a serious health risk. Is the flushing regime genuinely followed? Are dead legs identified and managed per ACOP L8?",
];

const RISK_BADGES: Record<string, { label: string; color: string }> = {
  "Low": { label: "Low", color: "text-green-700 bg-green-50 border-green-200" },
  "Medium": { label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Significant": { label: "Signif.", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "High": { label: "High", color: "text-red-700 bg-red-50 border-red-200" },
  "Intolerable": { label: "Intoler.", color: "text-red-900 bg-red-100 border-red-300" },
};

export function HomeLegionellaRiskAssessmentCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-sky-200">
      <CardHeader className="pb-3 bg-sky-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Droplets className="h-4 w-4 text-sky-600" /><span className="text-sky-900">Legionella Risk</span></CardTitle>
          <Link href="/home-legionella-risk-assessment" className="text-xs text-sky-600 hover:underline flex items-center gap-1">Assessments <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.intolerable_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.intolerable_count === 0 ? "text-green-600" : "text-red-600")}>{m.intolerable_count}</p><p className="text-[10px] text-muted-foreground">Intolerable</p></div>
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.high_risk_count}</p><p className="text-[10px] text-muted-foreground">High</p></div>
          <div className={cn("text-center rounded-lg p-2", m.non_compliant_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.non_compliant_count === 0 ? "text-green-600" : "text-amber-600")}>{m.non_compliant_count}</p><p className="text-[10px] text-muted-foreground">Non-Comp.</p></div>
          <div className="text-center rounded-lg p-2 bg-sky-50"><p className="text-lg font-bold tabular-nums text-sky-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RISK_BADGES[r.risk] ?? RISK_BADGES["Low"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Thermometer className="h-3 w-3 text-sky-500 shrink-0" /><span className="font-medium">{r.assessor}</span><span className="text-muted-foreground truncate">{r.system} · {r.compliance}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Legionella Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-sky-700"><Brain className="h-3 w-3" />ARIA Legionella Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-sky-200 bg-sky-50 text-sky-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
