"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, LifeBuoy, HeartHandshake, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useRetentionRisk } from "@/hooks/use-retention-risk";
import type { RetentionBand } from "@/lib/engines/retention-risk-engine";

const BAND_META: Record<RetentionBand, { label: string; chip: string; bar: string; tone: string }> = {
  priority: { label: "Priority support", chip: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", tone: "border-l-red-500" },
  support: { label: "Offer support", chip: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-500", tone: "border-l-amber-500" },
  watch: { label: "Keep an eye", chip: "bg-blue-100 text-blue-800 border-blue-200", bar: "bg-blue-400", tone: "border-l-blue-400" },
  settled: { label: "Settled", chip: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-500", tone: "border-l-green-400" },
};
const SEV_DOT: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-slate-400" };

function Disclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/50 px-4 py-3">
      <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-teal-strong)]" />
      <p className="text-sm text-[var(--cs-text-secondary)]">
        These are <span className="font-semibold text-[var(--cs-navy)]">non-clinical support indicators</span> to help you offer timely support and protect retention —
        not a diagnosis, a mental-health assessment, or a judgement about the person. Use them to start a supportive conversation, never to label.
      </p>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", tone)}>
      <div className="text-xl font-extrabold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

export default function RetentionSupportPage() {
  const { data, isLoading, isFetching, refetch } = useRetentionRisk();

  return (
    <PageShell
      title="Retention & Support Indicators"
      subtitle="A non-clinical view of where your team may need support — so you can offer it early and keep good people. Fans in supervision, wellbeing, training, incidents, overtime and more."
      caraContext={{ pageTitle: "Retention & Support Indicators", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"><RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh</button>
          <PrintButton title="Retention & Support Indicators" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && (
          <>
            <Disclaimer />

            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><LifeBuoy className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Where the team may need support</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={data.summary.priority} label="Priority support" tone="bg-red-50 border-red-200 text-red-800" />
                  <Stat value={data.summary.support} label="Offer support" tone="bg-amber-50 border-amber-200 text-amber-800" />
                  <Stat value={data.summary.watch} label="Keep an eye" tone="bg-blue-50 border-blue-200 text-blue-800" />
                  <Stat value={data.summary.settled} label="Settled" tone="bg-green-50 border-green-200 text-green-800" />
                </div>
                {data.top_drivers.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Most common drivers</p>
                    <div className="flex flex-wrap gap-2">
                      {data.top_drivers.map((d) => (
                        <span key={d.key} className="rounded-full border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-1 text-xs font-semibold text-[var(--cs-navy)]">{d.label} <span className="text-[var(--cs-text-muted)]">×{d.count}</span></span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {data.by_staff.map((s) => {
                const m = BAND_META[s.band];
                return (
                  <Card key={s.staff_id} className={cn("border-l-4", m.tone)}>
                    <CardContent className="py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="min-w-0 flex-1 font-bold text-[var(--cs-navy)]">{s.staff_name}{s.role ? <span className="ml-2 text-xs font-normal text-[var(--cs-text-muted)]">{String(s.role).replace(/_/g, " ")}</span> : null}</span>
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", m.chip)}>{m.label}</span>
                      </div>

                      {s.indicators.length > 0 ? (
                        <>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {s.indicators.map((ind, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border)] bg-white px-2.5 py-1 text-xs text-[var(--cs-text)]" title={ind.note}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", SEV_DOT[ind.severity])} /> {ind.label}
                              </span>
                            ))}
                          </div>
                          {s.suggested_support.length > 0 && (
                            <div className="mt-3 rounded-xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/40 px-3 py-2">
                              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]"><LifeBuoy className="h-3 w-3" /> Ways to support</p>
                              <ul className="space-y-0.5">{s.suggested_support.map((x, i) => <li key={i} className="text-sm text-[var(--cs-text-secondary)]">• {x}</li>)}</ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--cs-text-muted)]"><CheckCircle2 className="h-4 w-4 text-[var(--cs-teal)]" /> No support indicators — settled and well-supported.</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">{data.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
