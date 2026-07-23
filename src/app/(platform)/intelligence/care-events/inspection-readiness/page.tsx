"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inspection Readiness Dashboard  (Milestone 22)
//
// Live readiness score with the categories blocking the home from being
// inspection-ready right now. All numbers come from the live store.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { useInspectionReadiness } from "@/hooks/use-inspection-readiness";
import type { ReadinessSeverity } from "@/lib/care-events/inspection-readiness";

const HOME_ID = "home_oak";

const SEVERITY_META: Record<ReadinessSeverity, { label: string; tone: string; icon: React.ReactNode }> = {
  ready:             { label: "Inspection-ready",  tone: "bg-emerald-100 text-emerald-800", icon: <ShieldCheck className="h-4 w-4" /> },
  minor_gaps:        { label: "Minor gaps",         tone: "bg-amber-100 text-amber-800",     icon: <AlertTriangle className="h-4 w-4" /> },
  significant_gaps:  { label: "Significant gaps",   tone: "bg-orange-100 text-orange-800",   icon: <AlertTriangle className="h-4 w-4" /> },
  at_risk:           { label: "At risk",            tone: "bg-rose-100 text-rose-800",       icon: <AlertTriangle className="h-4 w-4" /> },
  not_measured:      { label: "Not yet measured",    tone: "bg-slate-100 text-slate-700",     icon: <HelpCircle className="h-4 w-4" /> },
};

export default function InspectionReadinessPage() {
  const { data, isLoading, refetch, isFetching } = useInspectionReadiness(HOME_ID);
  const report = data?.data;

  return (
    <PageShell
      title="Inspection Readiness"
      subtitle="Live readiness score across routing, amendments, manager review, evidence and recent record currency."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading || !report ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : (
        <>
          <Card className="bg-slate-50">
            <CardContent className="flex items-center justify-between gap-4 py-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={SEVERITY_META[report.severity].tone}>
                    <span className="mr-1">{SEVERITY_META[report.severity].icon}</span>
                    {SEVERITY_META[report.severity].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {report.blocking_categories.length} blocking categor{report.blocking_categories.length === 1 ? "y" : "ies"}
                  </span>
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-semibold">{report.overall_score ?? "—"}</span>
                  <span className="pb-2 text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={report.overall_score ?? 0} className="mt-3 h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {report.categories.map((c) => (
              <Card key={c.key} className={c.blocking ? "border-amber-300" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">{c.label}</CardTitle>
                    {c.blocking ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Blocking
                      </Badge>
                    ) : c.score === null ? (
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">
                        <HelpCircle className="mr-1 h-3 w-3" />
                        Not measured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        OK
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-xs">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-semibold">{c.score ?? "—"}</span>
                    <span className="pb-0.5 text-muted-foreground">/ 100</span>
                  </div>
                  <Progress value={c.score ?? 0} className="h-1.5" />
                  <p className="text-muted-foreground">{c.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
