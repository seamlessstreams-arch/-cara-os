"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY (detail page)
// Per-record quality scores across six Ofsted-relevant dimensions, weakest first,
// each with concrete improvement suggestions for supervision and QA.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenLine, Brain, Loader2, Info, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecordingQuality } from "@/hooks/use-recording-quality";

const BAND_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  strong: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" },
  good: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  needs_improvement: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-[var(--cs-warning-soft)]" },
  poor: { bg: "bg-red-100", text: "text-red-700", ring: "ring-[var(--cs-risk-soft)]" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800", low: "border-blue-200 bg-blue-50 text-blue-800",
};
const DIM_LABELS: Record<string, string> = {
  completeness: "Completeness", clarity: "Clarity", professionalLanguage: "Professional language",
  factuality: "Factuality", childCentredness: "Child's voice", riskRelevance: "Risk relevance",
};
function dimColor(v: number) { return v >= 85 ? "text-green-600" : v >= 70 ? "text-blue-600" : v >= 50 ? "text-amber-600" : "text-red-600"; }

export default function RecordingQualityPage() {
  const { data, isLoading } = useRecordingQuality();
  const intel = data?.data;
  const [filter, setFilter] = useState<string>("all");

  const records = useMemo(() => {
    const all = intel?.records ?? [];
    if (filter === "all") return all;
    if (filter === "below") return all.filter((r) => r.overall < 70);
    return all.filter((r) => r.band === filter);
  }, [intel, filter]);

  return (
    <PageShell
      title="Recording Quality"
      subtitle="How well the home's records are written — scored across the six dimensions inspectors look for, with specific suggestions to improve each one"
      icon={<PenLine className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Recording Quality", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Every narrative record (daily logs, incidents, key-working) is scored on <strong>completeness, clarity,
              professional language, factuality, the child's voice and risk relevance</strong> using transparent text
              checks — no black box. Each record gets concrete suggestions to improve it. Strong recording is a real
              asset at inspection; this turns it into something you can coach in supervision. Reg 36 (records), Reg 13.
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <OverviewStat label="Records scored" value={intel.overview.records_scored} />
            <OverviewStat label="Average score" value={`${intel.overview.avg_overall}/100`} tone={intel.overview.avg_overall >= 80 ? "green" : intel.overview.avg_overall >= 65 ? "neutral" : "amber"} />
            <OverviewStat label="Below 70" value={intel.overview.below_threshold} tone={intel.overview.below_threshold > 0 ? "amber" : "green"} />
            <OverviewStat label="Weakest dimension" value={intel.overview.weakest_dimension ? (DIM_LABELS[intel.overview.weakest_dimension] ?? intel.overview.weakest_dimension) : "—"} />
          </div>

          {/* Dimension averages */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand" /> Home-wide dimension averages</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {(Object.entries(intel.overview.dimension_averages) as [string, number][]).map(([dim, v]) => (
                  <div key={dim} className="flex items-center gap-2 text-xs">
                    <span className={cn("w-40 truncate", dim === intel.overview.weakest_dimension ? "font-semibold text-amber-700" : "text-[var(--cs-text-secondary)]")}>{DIM_LABELS[dim] ?? dim}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", v >= 85 ? "bg-green-400" : v >= 70 ? "bg-blue-400" : v >= 50 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${v}%` }} /></div>
                    <span className={cn("w-8 text-right tabular-nums font-medium", dimColor(v))}>{v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights + alerts */}
          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed flex items-start gap-2", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{a.message}</div>
          ))}

          {/* Filters + per-record */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "below", "poor", "needs_improvement", "good", "strong"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("rounded-full px-2.5 py-1 text-[11px] border transition-colors capitalize",
                  filter === f ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]")}>
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {records.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No records match this filter.</p>}
            {records.slice(0, 80).map((r) => {
              const band = BAND_STYLES[r.band] ?? BAND_STYLES.needs_improvement;
              return (
                <Card key={r.id} className={cn("overflow-hidden ring-1", band.ring)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm">
                        {r.type.replace(/_/g, " ")}{r.child_name ? ` · ${r.child_name}` : ""}
                        {r.date && <span className="text-[10px] font-normal text-[var(--cs-text-muted)] ml-2">{r.date.slice(0, 10)}</span>}
                      </CardTitle>
                      <div className="text-right shrink-0">
                        <Badge className={cn("text-[11px] capitalize", band.bg, band.text)}>{r.overall}/100 · {r.band.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                      {(Object.entries(DIM_LABELS) as [keyof typeof DIM_LABELS, string][]).map(([dim, label]) => {
                        const v = (r.score as any)[dim] as number;
                        return (
                          <div key={dim} className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--cs-text-muted)]">{label}</span>
                            <span className={cn("tabular-nums font-medium", dimColor(v))}>{v}</span>
                          </div>
                        );
                      })}
                    </div>
                    {r.score.caraSuggestions.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {r.score.caraSuggestions.map((s, i) => (
                          <p key={i} className="text-[11px] text-[var(--cs-text-secondary)] flex gap-1.5"><span className="text-purple-500">→</span>{s}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function OverviewStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "red" | "amber" | "green" | "gray" }) {
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-xl font-bold tabular-nums truncate", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
