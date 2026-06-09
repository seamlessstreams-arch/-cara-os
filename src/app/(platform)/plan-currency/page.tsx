"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, CalendarCheck, AlertOctagon, Clock, CheckCircle2, FileWarning,
} from "lucide-react";
import { usePlanCurrency } from "@/hooks/use-plan-currency";
import type { CellStatus, PlanCurrencyResult } from "@/lib/engines/plan-currency-engine";

const CELL_META: Record<CellStatus, { bg: string; text: string; rag: string; label: string }> = {
  overdue: { bg: "bg-red-100", text: "text-red-800", rag: "cs-rag-red", label: "Overdue" },
  due_soon: { bg: "bg-amber-100", text: "text-amber-800", rag: "cs-rag-amber", label: "Due soon" },
  current: { bg: "bg-green-100", text: "text-green-800", rag: "cs-rag-green", label: "In date" },
  no_date: { bg: "bg-slate-100", text: "text-slate-500", rag: "cs-rag-slate", label: "No date" },
  none: { bg: "bg-transparent", text: "text-slate-300", rag: "", label: "—" },
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

function Cell({ status, days }: { status: CellStatus; days: number | null }) {
  const m = CELL_META[status];
  let content: React.ReactNode = "—";
  if (status === "current") content = "✓";
  else if (status === "no_date") content = "?";
  else if (status === "overdue") content = `${Math.abs(days ?? 0)}d`;
  else if (status === "due_soon") content = `${days ?? 0}d`;
  return (
    <td className="px-1.5 py-1 text-center">
      <span className={cn("inline-flex min-w-[2.4rem] items-center justify-center rounded-md px-2 py-1 text-xs font-bold tabular-nums", m.bg, m.text, m.rag)} title={m.label}>
        {content}
      </span>
    </td>
  );
}

function Matrix({ data }: { data: PlanCurrencyResult }) {
  const cols = data.matrix; // one per child
  const lookup = (childId: string, typeKey: string) =>
    cols.find((m) => m.child_id === childId)?.cells.find((c) => c.plan_type_key === typeKey);
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--cs-border)] bg-white shadow-[var(--cs-shadow-card)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--cs-border)]">
            <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Plan / assessment</th>
            {cols.map((c) => (
              <th key={c.child_id} className="px-1.5 py-2.5 text-center text-xs font-bold text-[var(--cs-navy)]">{c.child_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.plan_types.map((pt) => (
            <tr key={pt.key} className="border-b border-[var(--cs-border)]/50 last:border-0">
              <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-xs font-medium text-[var(--cs-text)]">{pt.label}</td>
              {cols.map((c) => {
                const cell = lookup(c.child_id, pt.key);
                return <Cell key={c.child_id} status={cell?.status ?? "none"} days={cell?.days_to_review ?? null} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlanCurrencyPage() {
  const { data, isLoading, isFetching, refetch } = usePlanCurrency();
  const s = data?.summary;

  return (
    <PageShell
      title="Plan Currency Register"
      subtitle="Are the children's plans in date? Every statutory plan & assessment, RAG-rated by review date across every child — one screen, no silos (CHR 2015 Reg 6 / Quality Standards)."
      ariaContext={{ pageTitle: "Plan Currency Register", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Plan Currency Register" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && s && (
          <>
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><CalendarCheck className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Plan review currency</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={`${s.currency_rate}%`} label="In date" tone="bg-green-50 border-green-200 text-green-800" Icon={CheckCircle2} />
                  <Stat value={s.overdue} label="Overdue" tone="bg-red-50 border-red-200 text-red-800" Icon={AlertOctagon} />
                  <Stat value={s.due_soon} label="Due within 30d" tone="bg-amber-50 border-amber-200 text-amber-800" Icon={Clock} />
                  <Stat value={s.no_date} label="No review date" tone="bg-[var(--cs-bg)] border-[var(--cs-border)] text-[var(--cs-navy)]" Icon={FileWarning} />
                </div>
              </CardContent>
            </Card>

            {/* Overdue list — the actionable part */}
            {data.overdue.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="py-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700"><AlertOctagon className="h-4 w-4" /> Overdue for review — action now</p>
                  <div className="space-y-1.5">
                    {data.overdue.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm">
                        <span className="min-w-0"><span className="font-semibold text-[var(--cs-navy)]">{p.plan_type}</span> <span className="text-[var(--cs-text-muted)]">· {p.child_name}</span></span>
                        <span className="shrink-0 font-bold tabular-nums text-red-700">{Math.abs(p.days_to_review ?? 0)}d overdue</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* The RAG matrix */}
            <Matrix data={data} />

            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[var(--cs-text-muted)]">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-100 cs-rag-green" /> in date (✓)</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 cs-rag-amber" /> due ≤30d</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-100 cs-rag-red" /> overdue</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-100 cs-rag-slate" /> no date (?)</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-slate-200" /> no plan of this type (—)</span>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
