"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DUPLICATE DETECTION (detail page)
// Likely duplicate events surfaced so the same incident, log or medication record
// is never captured twice. Capture once, link intelligently, never duplicate.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyCheck, Brain, Loader2, Info, Link2, Layers, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDuplicateDetection } from "@/hooks/use-duplicate-detection";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function DuplicateDetectionPage() {
  const { data, isLoading } = useDuplicateDetection();
  const intel = data?.data;
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const d of intel?.duplicates ?? []) set.add(d.event_type);
    return ["all", ...[...set].sort()];
  }, [intel]);

  const duplicates = useMemo(() => {
    const all = intel?.duplicates ?? [];
    if (typeFilter === "all") return all;
    return all.filter((d) => d.event_type === typeFilter);
  }, [intel, typeFilter]);

  return (
    <PageShell
      title="Duplicate Detection"
      subtitle="Likely duplicate events surfaced so the same record is never captured twice — link to the original instead"
      icon={<CopyCheck className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Duplicate Detection", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Every event in the home projects into one canonical stream. This view scans that stream for likely
              <strong> duplicate records</strong> — the same kind of event, about the same child, logged within
              <strong> 48 hours</strong> with near-identical wording. Routine recurring records (such as daily logs) are
              held to a much higher similarity bar so normal repeated logging is never mistaken for a duplicate. Where a
              likely duplicate is found, the fix is simple: <strong>link to the existing event instead of creating a
              second copy</strong> — capture once, surface everywhere, never duplicate.
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-3 gap-3">
            <OverviewStat label="Events scanned" value={intel.overview.total_events} />
            <OverviewStat label="Suspected duplicates" value={intel.overview.suspected_duplicates} tone={intel.overview.suspected_duplicates > 0 ? "amber" : "green"} />
            <OverviewStat label="Clusters" value={intel.overview.clusters} tone={intel.overview.clusters > 0 ? "red" : "green"} />
          </div>

          {/* Insights + alerts */}
          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed flex items-start gap-2", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}>
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{a.message}</span>
            </div>
          ))}

          {/* Clusters */}
          {(intel.clusters ?? []).length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-brand" /> Duplicate clusters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {intel.clusters.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge className="text-[9px] bg-[var(--cs-bg)] text-[var(--cs-text-secondary)] border">{c.event_type.replace(/_/g, " ")}</Badge>
                      <span className="truncate text-[var(--cs-text-secondary)]">{c.child_name}</span>
                    </div>
                    <Badge className={cn("text-[9px] shrink-0", c.size >= 3 ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200")}>{c.size} records</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suspected pairs */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {types.map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={cn("rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                    typeFilter === t ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]")}>
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {duplicates.length === 0 ? (
              <p className="text-sm text-[var(--cs-text-muted)]">
                {intel.overview.suspected_duplicates === 0
                  ? "No likely duplicates detected — the record is clean."
                  : "No duplicates match this filter."}
              </p>
            ) : (
              duplicates.map((d, i) => (
                <div key={i} className="rounded-lg border p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge className="text-[9px] bg-[var(--cs-bg)] text-[var(--cs-text-secondary)] border">{d.event_type.replace(/_/g, " ")}</Badge>
                      <span className="truncate font-medium text-[var(--cs-text-secondary)]">{d.child_name}</span>
                    </div>
                    <Badge className="text-[9px] shrink-0 bg-amber-100 text-amber-700 border-amber-200">{Math.round(d.similarity * 100)}% match</Badge>
                  </div>
                  <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">{d.reason}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--cs-text-muted)]">
                    <span>Original: <code className="text-[var(--cs-text-secondary)]">{d.primary_event_id}</code></span>
                    <span>Duplicate: <code className="text-[var(--cs-text-secondary)]">{d.duplicate_event_id}</code></span>
                  </div>
                  <p className="text-[11px] text-brand flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> {d.suggested_action}
                  </p>
                </div>
              ))
            )}
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
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
