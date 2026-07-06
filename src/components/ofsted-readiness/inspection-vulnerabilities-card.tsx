"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inspection Vulnerabilities card (readiness ↔ §26)
// Surfaces the live Continuous Health Check findings on the Ofsted Readiness Map,
// grouped by the SCCIF judgement area each one threatens. Reuses the §26 hook +
// the pure SCCIF mapper — no new engine.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useSystemHealth } from "@/hooks/use-system-health";
import { mapHealthToVulnerabilities, groupVulnerabilitiesByArea, type InspectionVulnerability } from "@/lib/ofsted-readiness/vulnerability-alerts";

const SEV_CLASS: Record<string, string> = {
  critical: "border-red-300 bg-red-50 text-red-800",
  high: "border-rose-200 bg-rose-50 text-rose-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

function AlertRow({ v }: { v: InspectionVulnerability }) {
  return (
    <div className={`rounded border px-3 py-2 text-xs ${SEV_CLASS[v.severity] ?? SEV_CLASS.low}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{v.label}</span>
        <span className="shrink-0 rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase">{v.severity}</span>
      </div>
      <p className="mt-0.5 text-[11px] opacity-80">{v.recommendedAction}</p>
    </div>
  );
}

export function InspectionVulnerabilitiesCard() {
  const { data, isLoading } = useSystemHealth();
  const vulns = mapHealthToVulnerabilities(data?.data);
  const groups = groupVulnerabilitiesByArea(vulns);
  const critical = vulns.filter((v) => v.severity === "critical").length;

  return (
    <Card className={critical > 0 ? "border-red-200" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldAlert className={`h-4 w-4 ${critical > 0 ? "text-red-500" : "text-amber-500"}`} />
          Inspection vulnerabilities — live gaps an inspector would probe
          {vulns.length > 0 && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{vulns.length}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning records…</div>
        ) : vulns.length === 0 ? (
          <p className="py-2 text-xs text-emerald-700">No integrity gaps detected right now — no restraint repair gaps, missing oversight, missing return interviews or overdue reviews. Keep the wider picture under review.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.area}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {g.label} {g.criticalCount > 0 && <span className="text-red-600">· {g.criticalCount} critical</span>}
                </p>
                <div className="space-y-1.5">
                  {g.alerts.slice(0, 6).map((v) => <AlertRow key={v.id} v={v} />)}
                  {g.alerts.length > 6 && <p className="text-[11px] text-slate-400">+{g.alerts.length - 6} more in this area</p>}
                </div>
              </div>
            ))}
            <p className="border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
              These are live findings from the Continuous Health Check, mapped to the judgement area each threatens. They are gaps to close before inspection — not a prediction of any grade.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
