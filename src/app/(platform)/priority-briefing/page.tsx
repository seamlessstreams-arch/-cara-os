"use client";

import { useQuery } from "@tanstack/react-query";
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
import type {
  PriorityBriefingResult, PrioritySignal, SignalSeverity, OverallStatus, DomainRollup,
} from "@/lib/engines/manager-priority-briefing-engine";

/* ── Data hook (inlined from the former use-manager-priority-briefing hook) ──── */

function useManagerPriorityBriefing() {
  return useQuery<PriorityBriefingResult>({
    queryKey: ["manager-priority-briefing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/manager-priority-briefing");
      if (!res.ok) throw new Error("Failed to fetch manager priority briefing");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}

/* ── visual helpers ──────────────────────────────────────────────────────────── */

// Cara Calm: severity = meaning via --cs-* tokens. `bar` = the 3px left severity bar; `text` = icon colour.
const SEVERITY_META: Record<SignalSeverity, { label: string; badge: string; bar: string; text: string; Icon: typeof AlertTriangle }> = {
  critical: { label: "Critical", badge: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)] border-[var(--cs-risk-soft)]", bar: "bg-[var(--cs-risk)]", text: "text-[var(--cs-risk)]", Icon: AlertOctagon },
  high: { label: "High", badge: "bg-[var(--cs-avisaar-coral-bg)] text-[var(--cs-avisaar-coral)] border-[var(--cs-avisaar-coral-soft)]", bar: "bg-[var(--cs-avisaar-coral)]", text: "text-[var(--cs-avisaar-coral)]", Icon: ShieldAlert },
  warning: { label: "Warning", badge: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)] border-[var(--cs-warning-soft)]", bar: "bg-[var(--cs-warning)]", text: "text-[var(--cs-warning)]", Icon: AlertTriangle },
  watch: { label: "Watch", badge: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)] border-[var(--cs-teal-soft)]", bar: "bg-[var(--cs-teal)]", text: "text-[var(--cs-teal-strong)]", Icon: Eye },
};

const STATUS_META: Record<OverallStatus, { label: string; tone: string; Icon: typeof Activity }> = {
  critical: { label: "Critical — act now", tone: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)] ring-[var(--cs-risk-soft)]", Icon: AlertOctagon },
  elevated: { label: "Elevated", tone: "bg-[var(--cs-avisaar-coral-bg)] text-[var(--cs-avisaar-coral)] ring-[var(--cs-avisaar-coral-soft)]", Icon: ShieldAlert },
  watch: { label: "Watch", tone: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)] ring-[var(--cs-warning-soft)]", Icon: Eye },
  stable: { label: "Stable", tone: "bg-[var(--cs-success-bg)] text-[var(--cs-success)] ring-[var(--cs-success-soft)]", Icon: CheckCircle2 },
};

const DOMAIN_LABEL: Record<string, string> = {
  protection: "Protection",
  experiences: "Experiences & Wellbeing",
  leadership: "Leadership & Management",
  workforce: "Workforce",
};

const domainStatusDot = (s: DomainRollup["status"]) =>
  s === "red" ? "bg-[var(--cs-risk)]" : s === "amber" ? "bg-[var(--cs-warning)]" : "bg-[var(--cs-success)]";

function StatCell({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-white px-3 py-2">
      <span className={cn("text-2xl font-bold tabular-nums", tone)}>{n}</span>
      <span className="text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">{label}</span>
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
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-bg)]"
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
            <StatCell n={b?.total_critical ?? 0} label="Critical" tone="text-[var(--cs-risk)]" />
            <StatCell n={b?.total_high ?? 0} label="High" tone="text-[var(--cs-avisaar-coral)]" />
            <StatCell n={b?.total_warning ?? 0} label="Warning" tone="text-[var(--cs-warning)]" />
            <StatCell n={b?.total_watch ?? 0} label="Watch" tone="text-[var(--cs-teal-strong)]" />
            <StatCell n={b?.domains_at_risk?.length ?? 0} label="Domains at risk" tone="text-[var(--cs-text-secondary)]" />
            <StatCell n={b?.total_recording_gaps ?? 0} label="Recording gaps" tone="text-[var(--cs-oversight)]" />
          </div>
        </div>

        {/* Domain roll-up */}
        {b && b.domain_rollup.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--cs-text)]">Domain roll-up</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {b.domain_rollup.map((d) => (
                <div key={d.domain} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs">
                  <span className={cn("h-2 w-2 rounded-full", domainStatusDot(d.status))} />
                  <span className="font-medium text-[var(--cs-text)]">{DOMAIN_LABEL[d.domain] ?? d.domain}</span>
                  <span className="text-[var(--cs-text-gentle)]">
                    {d.critical_count > 0 && <span className="text-[var(--cs-risk)]">{d.critical_count}C </span>}
                    {d.high_count > 0 && <span className="text-[var(--cs-avisaar-coral)]">{d.high_count}H </span>}
                    {d.warning_count > 0 && <span className="text-[var(--cs-warning)]">{d.warning_count}W</span>}
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
            <CardTitle className="text-sm font-semibold text-[var(--cs-text)]">
              Priority signals {b ? `(${b.priority_signals.length}${b.total_signals > b.priority_signals.length ? ` of ${b.total_signals}` : ""})` : ""}
            </CardTitle>
          </CardHeader>
          {/* Cara Calm flat list: one container, hairline dividers, 3px severity bar + ONE badge per row */}
          <CardContent className="p-0">
            {b && b.priority_signals.length === 0 && (
              <div className="m-4 flex items-center gap-2 rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)] px-4 py-6 text-sm text-[var(--cs-success)]">
                <CheckCircle2 className="h-5 w-5" /> No attention signals right now — routine monitoring only.
              </div>
            )}
            {b?.priority_signals.map((s: PrioritySignal) => {
              const meta = SEVERITY_META[s.severity];
              return (
                <Link
                  key={s.rank}
                  href={engineHref(s.source_key, s.domain)}
                  className="group flex items-stretch border-b border-[var(--cs-border)] bg-white transition-colors last:border-0 hover:bg-[var(--cs-bg)]"
                >
                  <span className={cn("w-[3px] shrink-0", meta.bar)} />
                  <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-2.5">
                    <meta.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.text)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--cs-text)]">{s.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--cs-text-muted)]">
                        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", meta.badge)}>{meta.label}</Badge>
                        <span className="font-medium text-[var(--cs-text-secondary)] group-hover:text-[var(--cs-teal-strong)] group-hover:underline">{s.source_engine}</span>
                        <span>·</span>
                        <span>{DOMAIN_LABEL[s.domain] ?? s.domain}</span>
                        <span>·</span>
                        <span className="italic">{s.origin}</span>
                        {s.regulatory_ref && <><span>·</span><span className="text-[var(--cs-text-secondary)]">{s.regulatory_ref}</span></>}
                      </div>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-gentle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--cs-teal-strong)]" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recording gaps — engines with no data to assess (a "fill this in" list, not active concerns) */}
        {b && b.recording_gaps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-oversight)]">
                <FileQuestion className="h-4 w-4" /> Recording gaps
                <span className="font-normal text-[var(--cs-text-gentle)]">— {b.total_recording_gaps} engine{b.total_recording_gaps === 1 ? "" : "s"} have no data to assess yet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {b.recording_gaps.map((g, i) => (
                <Link
                  key={i}
                  href={engineHref(g.engine_key, g.domain)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--cs-oversight-soft)] bg-[var(--cs-oversight-bg)] px-2 py-1 text-[11px] text-[var(--cs-text-secondary)] transition-colors hover:border-[var(--cs-oversight)] hover:bg-[var(--cs-oversight-soft)]"
                  title={`${g.message} — go to record`}
                >
                  <span className="font-medium text-[var(--cs-text)]">{g.label}</span>
                  <span className="text-[var(--cs-oversight-soft)]">·</span>
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
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-success)]">
                <ThumbsUp className="h-4 w-4" /> Working well
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {b.positives.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text)]">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-success)]" />
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
