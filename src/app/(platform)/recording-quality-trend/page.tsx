"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY TREND (detail page)
// Weekly trajectory of recording quality and each dimension over time.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Brain, Loader2, Info, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecordingQualityTrend } from "@/hooks/use-recording-quality-trend";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800", low: "border-blue-200 bg-blue-50 text-blue-800",
};
const TREND_META: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  improving: { icon: <TrendingUp className="h-4 w-4" />, cls: "text-green-600", label: "improving" },
  declining: { icon: <TrendingDown className="h-4 w-4" />, cls: "text-red-600", label: "declining" },
  stable: { icon: <Minus className="h-4 w-4" />, cls: "text-gray-500", label: "stable" },
  insufficient_data: { icon: <Minus className="h-4 w-4" />, cls: "text-gray-400", label: "insufficient data" },
};
const DIM_LABELS: Record<string, string> = {
  completeness: "Completeness", clarity: "Clarity", professionalLanguage: "Professional", factuality: "Factual", childCentredness: "Child's voice", riskRelevance: "Risk",
};
function barColor(v: number) { return v >= 85 ? "bg-green-400" : v >= 70 ? "bg-blue-400" : v >= 50 ? "bg-amber-400" : "bg-red-400"; }

export default function RecordingQualityTrendPage() {
  const { data, isLoading } = useRecordingQualityTrend();
  const intel = data?.data;

  return (
    <PageShell
      title="Recording Quality Trend"
      subtitle="Is recording quality — and the child's voice — improving over time? The trajectory that tells you whether coaching is landing"
      icon={<LineChart className="h-5 w-5" />}
      showQuickCreate={false}
      ariaContext={{ pageTitle: "Recording Quality Trend", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Recording quality scored week by week, so you can see the direction of travel — not just today's snapshot.
              The child's voice is tracked separately because it is the dimension that most often needs a sustained push.
              An improving line is real evidence for inspection that the home learns and improves (Reg 13).
            </p>
          </div>

          {/* Headline trends */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OverviewStat label="Current quality" value={`${intel.overview.current_avg}/100`} trend={intel.overview.overall_trend} change={intel.overview.overall_change} />
            <OverviewStat label="Child's voice" value={`${intel.overview.childvoice_current}/100`} trend={intel.overview.childvoice_trend} change={intel.overview.childvoice_change} />
            <OverviewStat label="Weeks with data" value={`${intel.overview.populated_weeks}/${intel.overview.weeks_covered}`} />
            <OverviewStat label="Overall direction" value={(TREND_META[intel.overview.overall_trend] ?? TREND_META.stable).label} />
          </div>

          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed flex items-start gap-2", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{a.message}</div>
          ))}

          {/* Weekly chart */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly recording quality</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {intel.series.map((p, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${p.label}: ${p.count ? `${p.avg_overall}/100 (${p.count} records)` : "no records"}`}>
                    <span className="text-[9px] tabular-nums text-[var(--cs-text-muted)] mb-0.5">{p.count ? p.avg_overall : ""}</span>
                    <div className={cn("w-full rounded-t", p.count ? barColor(p.avg_overall) : "bg-gray-100")} style={{ height: `${p.count ? Math.max(4, p.avg_overall) : 3}%` }} />
                    <span className="text-[8px] text-[var(--cs-text-gentle)] mt-1 rotate-0 truncate w-full text-center">{p.week_start.slice(5)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per-week dimension table */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Dimensions by week</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-[var(--cs-text-muted)] text-left">
                    <th className="py-1 pr-2">Week</th>
                    <th className="py-1 px-1 text-right">Recs</th>
                    {Object.values(DIM_LABELS).map((l) => <th key={l} className="py-1 px-1 text-right">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {intel.series.filter((p) => p.count > 0).map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1 pr-2 whitespace-nowrap">{p.week_start.slice(5)}</td>
                      <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{p.count}</td>
                      {Object.keys(DIM_LABELS).map((dim) => {
                        const v = (p.dimension_averages as any)[dim] as number;
                        return <td key={dim} className={cn("py-1 px-1 text-right tabular-nums", v >= 70 ? "text-[var(--cs-text-secondary)]" : "text-amber-700 font-medium")}>{v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function OverviewStat({ label, value, trend, change }: { label: string; value: string | number; trend?: string; change?: number }) {
  const meta = trend ? (TREND_META[trend] ?? null) : null;
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className="text-xl font-bold tabular-nums text-[var(--cs-navy)] capitalize">{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
      {meta && (
        <p className={cn("text-[10px] mt-0.5 flex items-center gap-0.5", meta.cls)}>{meta.icon}{meta.label}{change !== undefined && change !== 0 ? ` ${change > 0 ? "+" : ""}${change}` : ""}</p>
      )}
    </div>
  );
}
