"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useActionCentre } from "@/hooks/use-action-centre";
import type { ActionItem } from "@/lib/action-centre/action-centre-engine";
import { cn } from "@/lib/utils";
import { ListChecks, Loader2, Clock, AlertTriangle, CheckCircle2, CircleDot, User, CalendarClock } from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In progress", cls: "bg-blue-50 text-blue-700" },
  done: { label: "Done", cls: "bg-emerald-50 text-emerald-700" },
  blocked: { label: "Blocked", cls: "bg-red-50 text-red-700" },
};

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--cs-border,#e2e8f0)] bg-white px-4 py-3 text-center">
      <div className={cn("text-2xl font-bold", accent ?? "text-[var(--cs-navy,#1e293b)]")}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">{label}</div>
    </div>
  );
}

function Row({ item }: { item: ActionItem }) {
  const st = STATUS_META[item.status] ?? STATUS_META.open;
  return (
    <div className={cn("rounded-lg border bg-white p-3", item.overdue ? "border-l-4 border-l-red-400" : item.priority === "high" && "border-l-4 border-l-amber-400")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {item.kind === "action" ? <CircleDot className="h-4 w-4 shrink-0 text-[var(--cs-cara-gold,#b45309)]" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
          <span className="text-sm font-medium text-[var(--cs-navy,#1e293b)]">{item.description}</span>
          {item.child && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{item.child}</span>}
        </div>
        <div className="flex items-center gap-2">
          {item.overdue && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700"><Clock className="h-3 w-3" /> Overdue</span>}
          {item.kind === "action" && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", st.cls)}>{st.label}</span>}
        </div>
      </div>
      {item.detail && <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">{item.detail}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--cs-text-muted,#64748b)]">
        <span className="rounded-full bg-[var(--cs-cara-gold-bg,#fffbeb)] px-2 py-0.5 font-medium text-[var(--cs-cara-gold,#b45309)]">{item.source}</span>
        {item.owner && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {item.owner}</span>}
        {item.dueDate && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {item.dueDate}</span>}
      </div>
    </div>
  );
}

export default function ActionCentrePage() {
  const { data, isLoading } = useActionCentre();
  const [source, setSource] = useState<string>("all");

  const filtered = useMemo(() => (data ? (source === "all" ? data.items : data.items.filter((i) => i.source === source)) : []), [data, source]);

  return (
    <PageShell title="Action Centre" subtitle="Every action and attention item from across Cara, in one place — so nothing is lost">
      <div className="space-y-6 animate-fade-in">
        {isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Gathering actions…</div>}

        {data && (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Action Centre</h2>
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Total" value={data.total} />
                  <Stat label="Overdue" value={data.overdueCount} accent={data.overdueCount > 0 ? "text-red-600" : undefined} />
                  <Stat label="High priority" value={data.highCount} accent={data.highCount > 0 ? "text-amber-600" : undefined} />
                  <Stat label="Open actions" value={data.openActions} />
                </div>
              </CardContent>
            </Card>

            {/* Source filter */}
            {data.total > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setSource("all")} className={cn("rounded-full border px-3 py-1 text-xs font-medium", source === "all" ? "border-[var(--cs-cara-gold,#b45309)] bg-amber-50 text-[var(--cs-cara-gold,#b45309)]" : "border-[var(--cs-border,#e2e8f0)] bg-white text-[var(--cs-text-secondary)]")}>All ({data.total})</button>
                {data.bySource.map((s) => (
                  <button key={s.source} onClick={() => setSource(s.source)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", source === s.source ? "border-[var(--cs-cara-gold,#b45309)] bg-amber-50 text-[var(--cs-cara-gold,#b45309)]" : "border-[var(--cs-border,#e2e8f0)] bg-white text-[var(--cs-text-secondary)]")}>{s.source} ({s.count})</button>
                ))}
              </div>
            )}

            {data.total === 0 ? (
              <Card><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" /><p className="text-sm text-[var(--cs-text-secondary,#475569)]">Nothing needs action right now — every workflow is up to date.</p></CardContent></Card>
            ) : (
              <div className="space-y-2">{filtered.map((i) => <Row key={i.id} item={i} />)}</div>
            )}

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              The Action Centre reads actions and flags the modules already hold — it never duplicates them. It informs
              practice and oversight; people decide and act.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
