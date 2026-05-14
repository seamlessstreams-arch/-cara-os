"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, ChevronRight, AlertTriangle, Brain, Clock, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_consents: 22, active_count: 16, expired_count: 3, withdrawn_count: 1, refused_count: 1, consent_documented_rate: 90.9, child_informed_rate: 81.8, capacity_assessed_rate: 86.4, unique_children: 5 };

const DEMO_RECORDS: { child: string; medication: string; type: string; status: string }[] = [
  { child: "Child A", medication: "Melatonin", type: "Parental", status: "Active" },
  { child: "Child B", medication: "Ritalin", type: "LA Consent", status: "Active" },
  { child: "Child C", medication: "Paracetamol", type: "OTC", status: "Active" },
  { child: "Child D", medication: "Fluoxetine", type: "Gillick", status: "Expired" },
  { child: "Child A", medication: "Ibuprofen", type: "Homely", status: "Active" },
  { child: "Child E", medication: "Sertraline", type: "LA Consent", status: "Refused" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "controlled", severity: "critical", message: "Controlled drug Ritalin for Child B has no documented consent." },
  { type: "expired", severity: "high", message: "3 medication consents have expired — renew before administering." },
  { type: "not_informed", severity: "high", message: "4 consents have not informed the child." },
];

const ARIA_INSIGHTS = [
  "22 consents. 5 children. Active: 16. Expired: 3. Refused: 1. Documented: 90.9%. Informed: 81.8%.",
  "Priority: 1 controlled no consent. 3 expired. 4 not informed. Strengthen consent process.",
  "Positive: Good documentation. GP consulted. Storage confirmed. Regular reviews scheduled.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Active": { label: "Active", color: "text-green-700 bg-green-50 border-green-200" },
  "Expired": { label: "Expired", color: "text-red-700 bg-red-50 border-red-200" },
  "Refused": { label: "Refused", color: "text-red-700 bg-red-50 border-red-200" },
};

export function MedicationConsentCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Pill className="h-4 w-4 text-brand" />Medication Consent</CardTitle>
          <Link href="/medication-consent" className="text-xs text-brand hover:underline flex items-center gap-1">Consent <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.active_count}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
          <div className={cn("text-center rounded-lg p-2", m.expired_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.expired_count === 0 ? "text-green-600" : "text-red-600")}>{m.expired_count}</p><p className="text-[10px] text-muted-foreground">Expired</p></div>
          <div className={cn("text-center rounded-lg p-2", m.consent_documented_rate >= 95 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.consent_documented_rate >= 95 ? "text-green-600" : "text-amber-600")}>{m.consent_documented_rate}%</p><p className="text-[10px] text-muted-foreground">Doc&apos;d</p></div>
          <div className={cn("text-center rounded-lg p-2", m.refused_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.refused_count === 0 ? "text-green-600" : "text-red-600")}>{m.refused_count}</p><p className="text-[10px] text-muted-foreground">Refused</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Consents</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Active"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><FileCheck className="h-3 w-3 text-brand shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.medication} · {r.type}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Consent Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Consent Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
