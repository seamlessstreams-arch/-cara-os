"use client";

// CaraPracticeDashboard — manager / RI practice-intelligence overview: gap heatmap,
// practice-drift warnings, protective-factor weaknesses, relationship-depth map,
// threshold watchlist, staff wellbeing (role-restricted) and the culture radar.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ShieldAlert, HeartPulse, Activity, Gauge, Compass, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCaraPracticeDashboard } from "@/hooks/use-cara-practice";
import type { CaraSeverity } from "@/lib/cara-practice/types";

const SEV: Record<CaraSeverity, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className={cn("rounded-lg border p-3 text-center", tone ?? "border-slate-200")}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function CaraPracticeDashboard({ homeId = "home_oak", childId }: { homeId?: string; childId?: string }) {
  const { data, isLoading, isError, error } = useCaraPracticeDashboard(homeId, childId);

  if (isLoading) {
    return (
      <Card className="border-slate-200"><CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </CardContent></Card>
    );
  }
  if (isError) {
    return <Card className="border-red-200"><CardContent className="py-6 text-sm text-red-600">{(error as Error)?.message ?? "Could not load Cara practice dashboard."}</CardContent></Card>;
  }
  const d = data?.data;
  if (!d) return null;

  const domains = Object.entries(d.developmentalGapHeatmap.byDomain).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat label="Open flags" value={d.summary.openFlags} />
        <Stat label="Critical" value={d.summary.criticalFlags} tone={d.summary.criticalFlags > 0 ? "border-red-300 bg-red-50" : undefined} />
        <Stat label="High" value={d.summary.highFlags} tone={d.summary.highFlags > 0 ? "border-orange-300 bg-orange-50" : undefined} />
        <Stat label="Manager queue" value={d.summary.managerReviewQueue} />
        <Stat label="RI queue" value={d.summary.riReviewQueue} />
        <Stat label="Avg quality" value={d.summary.avgPracticeQuality == null ? "—" : `${d.summary.avgPracticeQuality}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Developmental gap heatmap */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-teal-600" /> Developmental gap heatmap</CardTitle></CardHeader>
          <CardContent>
            {domains.length === 0 ? <p className="text-sm text-muted-foreground">No developmental gaps recorded.</p> : (
              <div className="flex flex-wrap gap-2">
                {domains.map(([domain, count]) => (
                  <span key={domain} className={cn("rounded-md border px-2 py-1 text-xs", count >= 3 ? SEV.high : count === 2 ? SEV.medium : SEV.low)}>
                    {domain} · {count}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Threshold watchlist */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-600" /> Threshold watchlist</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.thresholdWatchlist.length === 0 ? <p className="text-sm text-muted-foreground">Nothing on the threshold watchlist.</p> :
              d.thresholdWatchlist.map((w) => (
                <div key={w.id} className={cn("rounded-md border p-2 text-sm", SEV[w.severity])}>
                  <div className="flex items-center gap-2"><span className="font-semibold">{w.title}</span><span className="ml-auto text-[10px] uppercase">{w.kind.replace(/_/g, " ")}</span></div>
                  {(w.strategyDiscussion || w.lado) && (
                    <div className="mt-1 flex gap-1">
                      {w.strategyDiscussion && <Badge variant="outline" className="text-[10px]">Strategy discussion</Badge>}
                      {w.lado && <Badge variant="outline" className="text-[10px]">LADO</Badge>}
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Practice drift */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-amber-600" /> Practice drift warnings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.practiceDriftWarnings.length === 0 ? <p className="text-sm text-muted-foreground">No practice-drift warnings.</p> :
              d.practiceDriftWarnings.map((f) => (
                <div key={f.id} className="rounded-md border border-slate-200 p-2 text-sm">
                  <span className="font-medium">{f.title}</span>
                  {f.evidence && <span className="text-xs text-muted-foreground"> — {f.evidence}</span>}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Protective factor weaknesses */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4 text-indigo-600" /> Protective-factor weaknesses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.protectiveFactorWeaknesses.length === 0 ? <p className="text-sm text-muted-foreground">No overstated protective factors.</p> :
              d.protectiveFactorWeaknesses.map((p, i) => (
                <div key={i} className={cn("rounded-md border p-2 text-sm", SEV[p.severity])}>{p.description}</div>
              ))}
          </CardContent>
        </Card>

        {/* Staff wellbeing */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="h-4 w-4 text-rose-600" /> Staff wellbeing signals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.staffWellbeingSignals.length === 0 ? <p className="text-sm text-muted-foreground">No wellbeing signals visible to your role.</p> :
              d.staffWellbeingSignals.map((s) => (
                <div key={s.id} className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm">
                  <span className="font-medium capitalize">{s.signal_type.replace(/_/g, " ")}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{s.support_recommendation}</p>
                </div>
              ))}
            <p className="text-[11px] text-muted-foreground">Support indicators — never disciplinary evidence.</p>
          </CardContent>
        </Card>

        {/* Culture radar */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Compass className="h-4 w-4 text-purple-600" /> Safeguarding culture radar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.cultureRadar.length === 0 ? <p className="text-sm text-muted-foreground">No culture-drift indicators.</p> :
              d.cultureRadar.map((c) => (
                <div key={c.key} className={cn("rounded-md border p-2 text-sm", SEV[c.level])}>
                  <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /><span className="font-semibold">{c.label}</span></div>
                  <p className="text-xs mt-0.5 opacity-90">{c.detail}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
