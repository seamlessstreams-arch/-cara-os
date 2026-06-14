"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle,
  MessageCircleQuestion, LifeBuoy, Search, Settings2,
} from "lucide-react";
import { useValuesMatch } from "@/hooks/use-values-match";
import type { MatchBand } from "@/lib/engines/values-match-engine";

const BAND_META: Record<MatchBand, { label: string; chip: string; bar: string }> = {
  strong: { label: "Strong alignment", chip: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-500" },
  promising: { label: "Promising", chip: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)] border-[var(--cs-teal-soft)]", bar: "bg-[var(--cs-teal)]" },
  explore: { label: "Explore", chip: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-500" },
  limited: { label: "Limited", chip: "bg-slate-100 text-slate-700 border-slate-200", bar: "bg-slate-400" },
};

function Disclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <p className="text-sm font-medium text-amber-900">
        This is a support tool only. Final recruitment decisions must be made by the organisation using safer recruitment
        practice, professional judgement and human decision-making.
      </p>
    </div>
  );
}

function List({ title, items, Icon, tone }: { title: string; items: string[]; Icon: typeof CheckCircle2; tone: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={cn("mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide", tone)}><Icon className="h-3.5 w-3.5" /> {title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-[var(--cs-text-secondary)]">• {it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ValuesMatchPage() {
  const { data, isLoading, isFetching, refetch } = useValuesMatch();

  return (
    <PageShell
      title="Values-Based Matching"
      subtitle="How each candidate's values, experience and relational practice align with the home's Employer Values Profile — a transparent, explainable support for safer recruitment decisions."
      caraContext={{ pageTitle: "Values-Based Matching", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/employer-values" className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden">
            <Settings2 className="h-3.5 w-3.5" /> Values profile
          </Link>
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Values-Based Matching" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && (
          <>
            <Disclaimer />

            {!data.employer && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Sparkles className="mx-auto h-7 w-7 text-[var(--cs-teal-strong)]" />
                  <p className="mt-2 text-sm font-semibold text-[var(--cs-navy)]">No Employer Values Profile yet.</p>
                  <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">Define what your home stands for to enable values-based matching.</p>
                  <Link href="/employer-values" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cs-navy-soft)]">Create values profile</Link>
                </CardContent>
              </Card>
            )}

            {data.employer && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-4 w-4 text-[var(--cs-teal-strong)]" /> {data.employer.home_name} — core values</div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Relational practice: {data.employer.relational_practice_priority}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.employer.core_values.map((v) => (
                      <span key={v} className="rounded-full border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--cs-teal-strong)]">{v}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.matches.map((m) => {
              const meta = BAND_META[m.band];
              return (
                <Card key={m.candidate_id}>
                  <CardContent className="py-4">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--cs-bg)] tabular-nums">
                          <span className="text-base font-extrabold leading-none text-[var(--cs-navy)]">{m.match_percent}</span>
                          <span className="text-[8px] font-bold uppercase text-[var(--cs-text-muted)]">match</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-bold text-[var(--cs-navy)]">{m.candidate_name}</span>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", meta.chip)}>{meta.label}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
                            {m.preferred_role.replace(/_/g, " ")}
                            {m.current_stage ? <> · stage: {m.current_stage.replace(/_/g, " ")}</> : null}
                            {m.shared_values.length ? <> · shares {m.shared_values.length} value{m.shared_values.length === 1 ? "" : "s"}</> : null}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-[var(--cs-teal-strong)] group-open:hidden">View ▾</span>
                        <span className="hidden shrink-0 text-xs font-medium text-[var(--cs-teal-strong)] group-open:inline">Hide ▴</span>
                      </summary>

                      <div className="mt-4 space-y-4 border-t border-[var(--cs-border)] pt-4">
                        {/* dimensions */}
                        <div className="space-y-2">
                          {m.dimensions.map((d) => (
                            <div key={d.key}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[var(--cs-navy)]">{d.label}</span>
                                <span className="text-[var(--cs-text-muted)] tabular-nums">{Math.round(d.score * 100)}%</span>
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--cs-border)]/40">
                                <div className={cn("h-full rounded-full", d.score >= 0.8 ? "bg-green-500" : d.score >= 0.5 ? "bg-[var(--cs-teal)]" : "bg-amber-500")} style={{ width: `${Math.round(d.score * 100)}%` }} />
                              </div>
                              <p className="mt-0.5 text-[11px] leading-snug text-[var(--cs-text-muted)]">{d.note}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <List title="Strengths" items={m.strengths} Icon={CheckCircle2} tone="text-green-700" />
                          <List title="Concerns to explore" items={m.concerns} Icon={AlertTriangle} tone="text-amber-700" />
                          <List title="Interview prompts" items={m.interview_prompts} Icon={MessageCircleQuestion} tone="text-[var(--cs-navy)]" />
                          <List title="Suggested support if appointed" items={m.suggested_support} Icon={LifeBuoy} tone="text-[var(--cs-teal-strong)]" />
                        </div>
                        <List title="Areas to explore at interview" items={m.areas_to_explore} Icon={Search} tone="text-[var(--cs-text-muted)]" />

                        <p className="rounded-lg bg-[var(--cs-bg)] px-3 py-2 text-[11px] italic text-[var(--cs-text-muted)]">{m.disclaimer}</p>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              );
            })}

            {data.employer && data.matches.length === 0 && (
              <Card><CardContent className="py-8 text-center text-sm text-[var(--cs-text-secondary)]">No candidate values profiles yet.</CardContent></Card>
            )}

            <Disclaimer />
          </>
        )}
      </div>
    </PageShell>
  );
}
