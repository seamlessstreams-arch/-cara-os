"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, ListChecks, AlertOctagon, Clock, CheckCircle2, Circle,
  CalendarClock, User, ArrowUpRight, Filter,
} from "lucide-react";
import { useActionsRegister } from "@/hooks/use-actions-register";
import type { RegisteredAction, ActionUrgency } from "@/lib/engines/actions-register-engine";

const URGENCY_META: Record<ActionUrgency, { label: string; dot: string; badge: string; rag: string }> = {
  overdue: { label: "Overdue", dot: "bg-red-500", badge: "bg-red-100 text-red-800 border-red-200", rag: "cs-rag-red" },
  due_soon: { label: "Due soon", dot: "bg-amber-400", badge: "bg-amber-100 text-amber-800 border-amber-200", rag: "cs-rag-amber" },
  scheduled: { label: "Scheduled", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200", rag: "cs-rag-slate" },
  no_date: { label: "No date", dot: "bg-slate-300", badge: "bg-slate-100 text-slate-500 border-slate-200", rag: "cs-rag-slate" },
  done: { label: "Done", dot: "bg-green-500", badge: "bg-green-100 text-green-800 border-green-200", rag: "cs-rag-green" },
};

function Stat({ value, label, tone, Icon }: { value: number | string; label: string; tone: string; Icon: typeof Clock }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", tone)}>
      <Icon className="h-5 w-5 shrink-0 opacity-80" />
      <div>
        <div className="text-xl font-extrabold tabular-nums leading-none">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      </div>
    </div>
  );
}

function ActionRow({ a }: { a: RegisteredAction }) {
  const u = URGENCY_META[a.urgency];
  const dueLabel = a.days_to_due == null ? null
    : a.days_to_due < 0 ? `${Math.abs(a.days_to_due)}d overdue`
    : a.days_to_due === 0 ? "due today"
    : `due in ${a.days_to_due}d`;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--cs-border)] bg-white px-4 py-3 shadow-[var(--cs-shadow-card)]">
      <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", u.dot, u.rag)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-[var(--cs-text)]">{a.text}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--cs-text-muted)]">
          <Link href={a.source_href ?? "#"} className="inline-flex items-center gap-1 font-semibold text-[var(--cs-teal-strong)] hover:underline">
            {a.source} <ArrowUpRight className="h-3 w-3" />
          </Link>
          <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{a.owner || "Unassigned"}</span>
          {a.child_name && <span className="inline-flex items-center gap-1 text-indigo-600">{a.child_name}</span>}
          {dueLabel && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />{dueLabel}</span>}
        </div>
      </div>
      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", u.badge, u.rag)}>
        {u.label}
      </span>
    </div>
  );
}

export default function ActionsRegisterPage() {
  const { data, isLoading, isFetching, refetch } = useActionsRegister();
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = data?.actions ?? [];
    if (sourceFilter) list = list.filter((a) => a.source_key === sourceFilter);
    if (overdueOnly) list = list.filter((a) => a.urgency === "overdue");
    return list;
  }, [data, sourceFilter, overdueOnly]);

  const s = data?.summary;

  return (
    <PageShell
      title="Actions Register"
      subtitle="Every agreed action, in one place — from reviews, supervisions, meetings, Reg 44 visits, audits and oversight. What did we agree, and is it done?"
      ariaContext={{ pageTitle: "Actions Register", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Actions Register" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-5xl space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        )}

        {!isLoading && data && s && (
          <>
            {/* Summary */}
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]">
                  <ListChecks className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Agreed actions across the home
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={s.open} label="Open" tone="bg-[var(--cs-bg)] border-[var(--cs-border)] text-[var(--cs-navy)]" Icon={Circle} />
                  <Stat value={s.overdue} label="Overdue" tone="bg-red-50 border-red-200 text-red-800" Icon={AlertOctagon} />
                  <Stat value={s.due_soon} label="Due this week" tone="bg-amber-50 border-amber-200 text-amber-800" Icon={Clock} />
                  <Stat value={`${s.completion_rate}%`} label="Completed" tone="bg-green-50 border-green-200 text-green-800" Icon={CheckCircle2} />
                </div>
              </CardContent>
            </Card>

            {/* Owner rollup (who's carrying the load) */}
            {data.by_owner.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Open actions by owner</p>
                  <div className="flex flex-wrap gap-2">
                    {data.by_owner.map((o) => (
                      <span key={o.owner} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border)] bg-white px-3 py-1 text-xs">
                        <span className="font-semibold text-[var(--cs-navy)]">{o.owner}</span>
                        <span className="tabular-nums text-[var(--cs-text-muted)]">{o.open}</span>
                        {o.overdue > 0 && <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">{o.overdue} overdue</span>}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <button
                onClick={() => setSourceFilter(null)}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium", !sourceFilter ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-slate-600 hover:bg-slate-50")}
              >
                All sources
              </button>
              {data.by_source.map((src) => (
                <button
                  key={src.source_key}
                  onClick={() => setSourceFilter(src.source_key === sourceFilter ? null : src.source_key)}
                  className={cn("rounded-full border px-3 py-1 text-xs font-medium", sourceFilter === src.source_key ? "border-[var(--cs-teal)] bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : "border-[var(--cs-border)] bg-white text-slate-600 hover:bg-slate-50")}
                >
                  {src.source} <span className="tabular-nums opacity-60">{src.open}</span>
                </button>
              ))}
              <button
                onClick={() => setOverdueOnly((v) => !v)}
                className={cn("ml-auto rounded-full border px-3 py-1 text-xs font-semibold", overdueOnly ? "border-red-300 bg-red-50 text-red-700" : "border-[var(--cs-border)] bg-white text-slate-600 hover:bg-slate-50")}
              >
                Overdue only
              </button>
            </div>

            {/* Action list */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-[var(--cs-border)] bg-white px-4 py-10 text-center text-sm text-slate-500">
                  {data.actions.length === 0 ? "No open actions — everything agreed is complete." : "No actions match this filter."}
                </div>
              ) : (
                filtered.map((a) => <ActionRow key={a.id} a={a} />)
              )}
            </div>

            <p className="text-center text-[11px] text-slate-400">
              Actions are harvested live from each source&rsquo;s own records; completion status comes from the source, never inferred.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
