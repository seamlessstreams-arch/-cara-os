"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { engineHref } from "@/config/intelligence-links";
import {
  AlertOctagon, AlertTriangle, Eye, CheckCircle2, Loader2, ShieldAlert,
  ThumbsUp, Activity, RefreshCw, FileQuestion, ChevronRight,
} from "lucide-react";
import { useManagerPriorityBriefing } from "@/hooks/use-manager-priority-briefing";
import type {
  PriorityBriefingResult, PrioritySignal, SignalSeverity, OverallStatus, DomainRollup,
} from "@/lib/engines/manager-priority-briefing-engine";

/* ── visual helpers ──────────────────────────────────────────────────────────── */

const SEVERITY_META: Record<SignalSeverity, { label: string; badge: string; border: string; Icon: typeof AlertTriangle }> = {
  critical: { label: "Critical", badge: "bg-red-100 text-red-800 border-red-200", border: "border-l-red-500", Icon: AlertOctagon },
  high: { label: "High", badge: "bg-orange-100 text-orange-800 border-orange-200", border: "border-l-orange-500", Icon: ShieldAlert },
  warning: { label: "Warning", badge: "bg-amber-100 text-amber-800 border-amber-200", border: "border-l-amber-400", Icon: AlertTriangle },
  watch: { label: "Watch", badge: "bg-slate-100 text-slate-700 border-slate-200", border: "border-l-slate-300", Icon: Eye },
};

const STATUS_META: Record<OverallStatus, { label: string; tone: string; Icon: typeof Activity }> = {
  critical: { label: "Critical — act now", tone: "bg-red-50 text-red-800 ring-red-200", Icon: AlertOctagon },
  elevated: { label: "Elevated", tone: "bg-orange-50 text-orange-800 ring-orange-200", Icon: ShieldAlert },
  watch: { label: "Watch", tone: "bg-amber-50 text-amber-800 ring-amber-200", Icon: Eye },
  stable: { label: "Stable", tone: "bg-green-50 text-green-800 ring-green-200", Icon: CheckCircle2 },
};

const DOMAIN_LABEL: Record<string, string> = {
  protection: "Protection",
  experiences: "Experiences & Wellbeing",
  leadership: "Leadership & Management",
  workforce: "Workforce",
};

const domainStatusDot = (s: DomainRollup["status"]) =>
  s === "red" ? "bg-red-500" : s === "amber" ? "bg-amber-400" : "bg-green-500";

function StatCell({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-white px-3 py-2">
      <span className={cn("text-2xl font-bold tabular-nums", tone)}>{n}</span>
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────────── */

export default function PriorityBriefingPage() {
  const { data, isLoading, isFetching, refetch } = useManagerPriorityBriefing();

  if (isLoading) {
    return (
      <PageShell title="Priority Briefing" subtitle="Sweeping the intelligence engines…">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const b: PriorityBriefingResult | undefined = data;
  const status = b?.overall_status ?? "stable";
  const sm = STATUS_META[status];

  return (
    <PageShell
      title="Priority Briefing"
      subtitle={`${b?.generated_for ?? ""} · what needs your attention across ${b?.engines_responded ?? 0} of ${b?.engines_queried ?? 0} intelligence engines`}
      caraContext={{ pageTitle: "Manager Priority Briefing", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Priority Briefing" />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Hero status */}
        <div className={cn("rounded-xl ring-1 p-5", sm.tone)}>
          <div className="flex items-start gap-3">
            <sm.Icon className="h-7 w-7 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold uppercase tracking-wide">{sm.label}</div>
              <p className="mt-0.5 text-base font-medium">{b?.headline}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <StatCell n={b?.total_critical ?? 0} label="Critical" tone="text-red-600" />
            <StatCell n={b?.total_high ?? 0} label="High" tone="text-orange-600" />
            <StatCell n={b?.total_warning ?? 0} label="Warning" tone="text-amber-600" />
            <StatCell n={b?.total_watch ?? 0} label="Watch" tone="text-slate-600" />
            <StatCell n={b?.domains_at_risk?.length ?? 0} label="Domains at risk" tone="text-slate-700" />
            <StatCell n={b?.total_recording_gaps ?? 0} label="Recording gaps" tone="text-violet-600" />
          </div>
        </div>

        {/* Domain roll-up */}
        {b && b.domain_rollup.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Domain roll-up</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {b.domain_rollup.map((d) => (
                <div key={d.domain} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs">
                  <span className={cn("h-2 w-2 rounded-full", domainStatusDot(d.status))} />
                  <span className="font-medium text-slate-700">{DOMAIN_LABEL[d.domain] ?? d.domain}</span>
                  <span className="text-slate-400">
                    {d.critical_count > 0 && <span className="text-red-600">{d.critical_count}C </span>}
                    {d.high_count > 0 && <span className="text-orange-600">{d.high_count}H </span>}
                    {d.warning_count > 0 && <span className="text-amber-600">{d.warning_count}W</span>}
                    {d.critical_count + d.high_count + d.warning_count === 0 && <span>{d.total_signals}</span>}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Priority feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Priority signals {b ? `(${b.priority_signals.length}${b.total_signals > b.priority_signals.length ? ` of ${b.total_signals}` : ""})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {b && b.priority_signals.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-sm text-green-800">
                <CheckCircle2 className="h-5 w-5" /> No attention signals right now — routine monitoring only.
              </div>
            )}
            {b?.priority_signals.map((s: PrioritySignal) => {
              const meta = SEVERITY_META[s.severity];
              return (
                <Link
                  key={s.rank}
                  href={engineHref(s.source_key, s.domain)}
                  className={cn("group flex items-start gap-3 rounded-lg border border-l-4 bg-white px-3 py-2.5 transition-colors hover:bg-slate-50", meta.border)}
                >
                  <meta.Icon className={cn("mt-0.5 h-4 w-4 shrink-0",
                    s.severity === "critical" ? "text-red-500" : s.severity === "high" ? "text-orange-500" : s.severity === "warning" ? "text-amber-500" : "text-slate-400")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">{s.message}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", meta.badge)}>{meta.label}</Badge>
                      <span className="font-medium text-slate-600 group-hover:text-indigo-600 group-hover:underline">{s.source_engine}</span>
                      <span>·</span>
                      <span>{DOMAIN_LABEL[s.domain] ?? s.domain}</span>
                      <span>·</span>
                      <span className="italic">{s.origin}</span>
                      {s.regulatory_ref && <><span>·</span><span className="text-slate-600">{s.regulatory_ref}</span></>}
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recording gaps — engines with no data to assess (a "fill this in" list, not active concerns) */}
        {b && b.recording_gaps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <FileQuestion className="h-4 w-4" /> Recording gaps
                <span className="font-normal text-slate-400">— {b.total_recording_gaps} engine{b.total_recording_gaps === 1 ? "" : "s"} have no data to assess yet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {b.recording_gaps.map((g, i) => (
                <Link
                  key={i}
                  href={engineHref(g.engine_key, g.domain)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-violet-100 bg-violet-50/60 px-2 py-1 text-[11px] text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-100"
                  title={`${g.message} — go to record`}
                >
                  <span className="font-medium text-slate-700">{g.label}</span>
                  <span className="text-violet-300">·</span>
                  <span>{DOMAIN_LABEL[g.domain] ?? g.domain}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Positives */}
        {b && b.positives.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <ThumbsUp className="h-4 w-4" /> Working well
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {b.positives.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span>{p}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
