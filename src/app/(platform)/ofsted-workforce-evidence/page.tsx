"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, ClipboardCheck, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { useOfstedWorkforceEvidence } from "@/hooks/use-ofsted-workforce-evidence";
import type { EvidenceStatus } from "@/lib/engines/ofsted-workforce-evidence-engine";

const STATUS_META: Record<EvidenceStatus, { label: string; chip: string; bar: string; rag: string; border: string }> = {
  green: { label: "Strong", chip: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-500", rag: "cs-rag-green", border: "border-l-green-500" },
  amber: { label: "In place · gaps", chip: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-500", rag: "cs-rag-amber", border: "border-l-amber-500" },
  red: { label: "Needs attention", chip: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", rag: "cs-rag-red", border: "border-l-red-500" },
  no_data: { label: "Not yet evidenced", chip: "bg-slate-100 text-slate-600 border-slate-200", bar: "bg-slate-300", rag: "cs-rag-slate", border: "border-l-slate-300" },
};

const RATING_META: Record<string, { label: string; tone: string }> = {
  strong: { label: "Strong", tone: "bg-green-50 border-green-300 text-green-800" },
  secure: { label: "Secure", tone: "bg-[var(--cs-teal-bg)] border-[var(--cs-teal-soft)] text-[var(--cs-teal-strong)]" },
  developing: { label: "Developing", tone: "bg-amber-50 border-amber-300 text-amber-800" },
  insufficient_data: { label: "Insufficient data", tone: "bg-slate-50 border-slate-300 text-slate-700" },
};

export default function OfstedWorkforceEvidencePage() {
  const { data, isLoading, isFetching, refetch } = useOfstedWorkforceEvidence();
  const rating = data ? RATING_META[data.overall.rating] : null;

  return (
    <PageShell
      title="Ofsted Workforce Evidence"
      subtitle="The workforce evidence an inspector looks for — safer recruitment, induction, supervision, training, probation, leadership, staff voice, reflective practice, learning culture, stability and actions — organised, RAG-rated and ready to print or export."
      caraContext={{ pageTitle: "Ofsted Workforce Evidence", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"><RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh</button>
          <PrintButton title="Ofsted Workforce Evidence" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && rating && (
          <>
            <Card>
              <CardContent className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><ClipboardCheck className="h-4 w-4 text-[var(--cs-teal-strong)]" /> {data.home_name} — workforce evidence</div>
                    <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.overall.headline}</p>
                    <p className="mt-1 text-[11px] text-[var(--cs-text-muted)]">Generated {data.generated_on}</p>
                  </div>
                  <div className={cn("rounded-2xl border px-5 py-3 text-center", rating.tone)}>
                    <div className="text-lg font-extrabold leading-none">{rating.label}</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">Overall</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
                  <span className="text-green-700">{data.overall.green} strong</span>
                  <span className="text-amber-700">{data.overall.amber} with gaps</span>
                  <span className="text-red-700">{data.overall.red} need attention</span>
                  {data.overall.no_data > 0 && <span className="text-slate-500">{data.overall.no_data} not yet evidenced</span>}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {data.domains.map((d) => {
                const m = STATUS_META[d.status];
                return (
                  <Card key={d.key} className={cn("border-l-4", m.border)}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[var(--cs-navy)]">{d.label}</h3>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", m.chip)}>{m.label}</span>
                      </div>
                      {d.rate !== null && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--cs-border)]/40"><div className={cn("h-full rounded-full", m.bar, m.rag)} style={{ width: `${d.rate}%` }} /></div>
                          <span className="text-xs font-bold tabular-nums text-[var(--cs-text-muted)]">{d.rate}%</span>
                        </div>
                      )}
                      <p className="mt-1.5 text-xs text-[var(--cs-text-secondary)]">{d.summary}</p>
                      {d.evidence.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {d.evidence.map((e, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--cs-teal)]" /> {e}</li>)}
                        </ul>
                      )}
                      {d.gaps.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {d.gaps.map((g, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {g}</li>)}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-4 py-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-text-muted)]" />
              <p className="text-sm text-[var(--cs-text-secondary)]">{data.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
