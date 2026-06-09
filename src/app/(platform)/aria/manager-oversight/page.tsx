"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, Eye, AlertOctagon, AlertTriangle, Info, CheckCircle2,
  FileCheck, TrendingUp, Sparkles, ArrowRight, Undo2,
} from "lucide-react";
import { useAriaOversight, useOversightAction } from "@/hooks/use-aria-oversight";
import type { AlertPriority } from "@/lib/aria-incident/manager-oversight-engine";

const PRIORITY_META: Record<AlertPriority, { chip: string; border: string }> = {
  urgent: { chip: "bg-red-100 text-red-800 border-red-200", border: "border-l-red-500" },
  high: { chip: "bg-amber-100 text-amber-800 border-amber-200", border: "border-l-amber-500" },
  medium: { chip: "bg-blue-100 text-blue-800 border-blue-200", border: "border-l-blue-400" },
  low: { chip: "bg-slate-100 text-slate-700 border-slate-200", border: "border-l-slate-300" },
};
const SEV_ICON = { attention: AlertOctagon, watch: AlertTriangle, info: Info } as const;

export default function AriaManagerOversightPage() {
  const { data, isLoading, isFetching, refetch } = useAriaOversight();
  const act = useOversightAction();

  return (
    <PageShell
      title="ARIA Manager Oversight"
      subtitle="Incident-session oversight in one place — what's missing, which AI-assisted records await your approval, and the patterns ARIA has noticed. Alerts clear when the practice happens."
      ariaContext={{ pageTitle: "ARIA Manager Oversight", sourceType: "incident" }}
      actions={
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
        </button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-4 pb-10">
        {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {data && (
          <>
            {/* summary */}
            <Card className={cn("border-l-4", data.summary.urgent > 0 ? "border-l-red-500" : data.summary.open_alerts > 0 ? "border-l-amber-400" : "border-l-green-500")}>
              <CardContent className="py-4">
                <p className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Eye className="h-4 w-4 text-[var(--cs-teal-strong)]" /> {data.summary.headline}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="text-red-700">{data.summary.urgent} urgent</span>
                  <span className="text-amber-700">{data.summary.open_alerts} open alerts</span>
                  <span className="text-[var(--cs-teal-strong)]">{data.summary.reviews_awaiting} awaiting approval</span>
                  <span className="text-[var(--cs-text-muted)]">{data.summary.patterns} patterns</span>
                </div>
              </CardContent>
            </Card>

            {/* awaiting approval */}
            {data.awaiting_review.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><FileCheck className="h-3.5 w-3.5" /> AI-assisted records awaiting your approval</p>
                  <div className="space-y-2">
                    {data.awaiting_review.map((r) => (
                      <details key={r.id} className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 font-semibold text-[var(--cs-navy)]">{r.child_name} · {String(r.record_type).replace(/_/g, " ")} <span className="font-normal text-[var(--cs-text-muted)]">by {r.staff_name} · {String(r.accepted_at ?? r.created_at).slice(0, 10)}</span></span>
                          <span className="shrink-0 text-xs font-medium text-[var(--cs-teal-strong)]">Open ▾</span>
                        </summary>
                        <div className="mt-3 space-y-2 border-t border-[var(--cs-border)] pt-3">
                          {r.ai_quality_flags.length > 0 && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-bold">Quality flags at acceptance:</span> {r.ai_quality_flags.join("; ")}</p>
                          )}
                          <details className="rounded-lg bg-[var(--cs-bg)] px-3 py-2"><summary className="cursor-pointer text-[11px] font-bold text-[var(--cs-text-muted)]">Original staff notes (preserved)</summary><pre className="mt-1.5 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text-secondary)]">{r.raw_text}</pre></details>
                          {r.ai_suggested_text && <details className="rounded-lg bg-[var(--cs-bg)] px-3 py-2"><summary className="cursor-pointer text-[11px] font-bold text-[var(--cs-text-muted)]">ARIA suggestion (preserved)</summary><pre className="mt-1.5 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text-secondary)]">{r.ai_suggested_text}</pre></details>}
                          <div className="rounded-lg border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/30 px-3 py-2"><p className="text-[11px] font-bold text-[var(--cs-teal-strong)]">Final accepted record</p><pre className="mt-1.5 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text)]">{r.final_accepted_text}</pre></div>
                          <button onClick={() => act.mutate({ action: "mark_reviewed", review_id: r.id })} disabled={act.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-teal-strong)] px-3.5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
                            {act.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark reviewed &amp; approved
                          </button>
                        </div>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* alerts */}
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><AlertTriangle className="h-3.5 w-3.5" /> Alerts</p>
                {data.alerts.length === 0 && <p className="py-3 text-center text-sm text-[var(--cs-text-muted)]">No alerts — practice is keeping pace with incidents.</p>}
                <div className="space-y-2">
                  {data.alerts.map((a) => {
                    const m = PRIORITY_META[a.priority];
                    const open = a.status === "open";
                    return (
                      <div key={a.key} className={cn("rounded-xl border border-l-4 border-[var(--cs-border)] bg-white px-3 py-2.5", m.border, !open && "opacity-55")}>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", m.chip)}>{a.priority}</span>
                          <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--cs-navy)]">{a.title}{a.child_name ? <span className="font-normal text-[var(--cs-text-muted)]"> · {a.child_name}</span> : null}</span>
                          {!open && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{a.status}</span>}
                        </div>
                        <p className="mt-1 text-xs text-[var(--cs-text-secondary)]">{a.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {a.incident_session_id && <Link href="/aria/incident-mode" className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] bg-[var(--cs-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cs-navy)] hover:bg-white">Open Incident Mode <ArrowRight className="h-3 w-3" /></Link>}
                          {open ? (
                            <>
                              <button onClick={() => act.mutate({ action: "set_alert_status", key: a.key, status: "resolved" })} className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100">Resolve</button>
                              <button onClick={() => act.mutate({ action: "set_alert_status", key: a.key, status: "dismissed" })} className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--cs-text-muted)] hover:bg-[var(--cs-bg)]">Dismiss</button>
                            </>
                          ) : (
                            <button onClick={() => act.mutate({ action: "set_alert_status", key: a.key, status: "open" })} className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--cs-text-muted)] hover:bg-[var(--cs-bg)]"><Undo2 className="h-3 w-3" /> Reopen</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* patterns */}
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><TrendingUp className="h-3.5 w-3.5" /> Patterns ARIA has noticed</p>
                {data.patterns.length === 0 && <p className="py-3 text-center text-sm text-[var(--cs-text-muted)]">No patterns in the last 30 days.</p>}
                <div className="space-y-2">
                  {data.patterns.map((p) => {
                    const Icon = SEV_ICON[p.severity];
                    return (
                      <div key={p.key} className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
                          <Icon className={cn("h-4 w-4", p.severity === "attention" ? "text-red-600" : p.severity === "watch" ? "text-amber-600" : "text-[var(--cs-text-muted)]")} />
                          {p.title}{p.child_name ? <span className="font-normal text-[var(--cs-text-muted)]"> · {p.child_name}</span> : null}
                        </p>
                        <p className="mt-1 text-xs text-[var(--cs-text-secondary)]">{p.insight}</p>
                        <p className="mt-1 text-[11px] font-medium text-[var(--cs-teal-strong)]">Suggestion: {p.suggestion}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* cross-links + disclaimer */}
            <div className="flex flex-wrap gap-2">
              <Link href="/aria/review" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]">Aria suggestion review queue <ArrowRight className="h-3 w-3" /></Link>
              <Link href="/intelligence/aria/oversight-queue" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]">Whole-system oversight queue <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--cs-aria-gold)]/40 bg-[var(--cs-aria-gold-bg)]/50 px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-aria-gold)]" />
              <p className="text-xs font-medium leading-relaxed text-[var(--cs-navy)]">{data.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
