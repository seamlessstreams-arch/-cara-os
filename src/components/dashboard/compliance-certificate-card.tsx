"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ChevronRight, AlertTriangle, Brain, Clock, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_certificates: 8, expired_count: 1, expiring_soon_count: 2, remedial_required_count: 1, overdue_renewal_count: 1, valid_rate: 62.5, digital_copy_rate: 75.0, ofsted_notified_rate: 50.0, remedial_completed_rate: 0.0, unique_issuing_bodies: 5 };

const DEMO_RECORDS: { type: string; body: string; status: string; urgency: string }[] = [
  { type: "Gas Safety", body: "Gas Safe Reg.", status: "Valid", urgency: "Routine" },
  { type: "Electrical", body: "NICEIC", status: "Expiring Soon", urgency: "Upcoming" },
  { type: "Fire Alarm", body: "Fire Service", status: "Valid", urgency: "Routine" },
  { type: "PAT Testing", body: "PAT Co.", status: "Expired", urgency: "Critical" },
  { type: "Legionella", body: "Water Hygiene", status: "Expiring Soon", urgency: "Urgent" },
  { type: "Insurance PL", body: "Insurance Prov.", status: "Valid", urgency: "Routine" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "safety_critical_expired", severity: "critical", message: "PAT testing certificate has expired — immediate renewal required for children's safety." },
  { type: "remedial_not_completed", severity: "high", message: "1 certificate has remedial actions required but not completed." },
  { type: "expiring_soon", severity: "high", message: "2 certificates expiring soon — renewal action needed." },
];

const ARIA_INSIGHTS = [
  "8 certificates across 5 issuing bodies. Expired: 1. Expiring soon: 2. Remedial pending: 1.",
  "Priority: 1 expired safety certificate. Valid rate 62.5%. Digital copies stored 75.0%.",
  "Compliance certificates protect children. Is every safety certificate current? Are remedial actions completed?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Valid": { label: "Valid", color: "text-green-700 bg-green-50 border-green-200" },
  "Expiring Soon": { label: "Expiring", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Expired": { label: "Expired", color: "text-red-700 bg-red-50 border-red-200" },
  "Renewal": { label: "Renewal", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "N/A": { label: "N/A", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function ComplianceCertificateCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-cyan-200">
      <CardHeader className="pb-3 bg-cyan-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-600" /><span className="text-cyan-900">Compliance Certs</span></CardTitle>
          <Link href="/compliance-certificate" className="text-xs text-cyan-600 hover:underline flex items-center gap-1">Certificates <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.expired_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.expired_count === 0 ? "text-green-600" : "text-red-600")}>{m.expired_count}</p><p className="text-[10px] text-muted-foreground">Expired</p></div>
          <div className={cn("text-center rounded-lg p-2", m.expiring_soon_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.expiring_soon_count === 0 ? "text-green-600" : "text-amber-600")}>{m.expiring_soon_count}</p><p className="text-[10px] text-muted-foreground">Expiring</p></div>
          <div className={cn("text-center rounded-lg p-2", m.remedial_required_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.remedial_required_count === 0 ? "text-green-600" : "text-amber-600")}>{m.remedial_required_count}</p><p className="text-[10px] text-muted-foreground">Remedial</p></div>
          <div className="text-center rounded-lg p-2 bg-cyan-50"><p className="text-lg font-bold tabular-nums text-cyan-600">{m.total_certificates}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Certificate Status</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["N/A"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><FileCheck className="h-3 w-3 text-cyan-500 shrink-0" /><span className="font-medium">{r.type}</span><span className="text-muted-foreground truncate">{r.body} · {r.urgency}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Compliance Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-cyan-700"><Brain className="h-3 w-3" />ARIA Compliance Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-cyan-200 bg-cyan-50 text-cyan-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
