"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — OPERATIONS CONTROL CENTRE (Phase 2 · Operational Control)
// The single surface for the previously-headless Phase-2 engines: the unified
// alerts + escalations spine (one severity-ranked feed over the fragmented
// sources) and the recurring compliance-check status. Read-only projections —
// every figure traces to a record.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import {
  useOperationalSpine,
  useRecurringChecks,
  type SpineItem,
} from "@/hooks/use-operational-control";
import {
  AlertTriangle, ArrowRight, ShieldCheck, CircleAlert, Bell, ListChecks,
  CalendarClock, CheckCircle2, Circle, Radar,
} from "lucide-react";

const SEV_TONE: Record<SpineItem["severity"], { stripe: string; chip: string; pill: string }> = {
  critical: { stripe: "bg-rose-400", chip: "bg-rose-400/15 text-rose-300", pill: "bg-rose-400/15 text-rose-200" },
  high: { stripe: "bg-orange-300", chip: "bg-orange-300/15 text-orange-200", pill: "bg-orange-300/15 text-orange-100" },
  medium: { stripe: "bg-amber-300", chip: "bg-amber-300/15 text-amber-200", pill: "bg-amber-300/15 text-amber-100" },
  low: { stripe: "bg-slate-400", chip: "bg-white/[0.06] text-slate-300", pill: "bg-white/[0.06] text-slate-300" },
};

function DarkPanel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="animate-fade-in overflow-hidden rounded-[22px] border border-white/[0.08] p-5 text-white shadow-[0_30px_80px_-30px_rgba(3,6,15,0.9)] sm:p-6"
      style={{ background: "linear-gradient(180deg,#0b1020 0%,#0c1226 60%,#0e1730 100%)" }}
    >
      {children}
    </section>
  );
}

function SpineFeed({ view }: { view: "alerts" | "escalations" }) {
  const { data, isLoading } = useOperationalSpine(view);
  const items = data?.items ?? [];
  const failed = (data?.sources ?? []).filter((s) => !s.ok);

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-[62px] animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-4 text-sm text-emerald-100">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
          {view === "alerts" ? "No live operational alerts right now." : "Nothing escalating right now."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => {
            const t = SEV_TONE[it.severity];
            return (
              <Link key={it.id} href={it.href} className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]">
                <span className={`absolute inset-y-0 left-0 w-[4px] ${t.stripe}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-white">{it.title}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-slate-400">
                    {it.detail ? `${it.detail} · ` : ""}{it.source.replace(/_/g, " ")}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${t.pill}`}>{it.severity}</span>
                <ArrowRight className="h-[18px] w-[18px] shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
      {failed.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-amber-300/80">
          <CircleAlert className="h-3.5 w-3.5" /> {failed.length} source(s) temporarily unavailable: {failed.map((s) => s.source).join(", ")}.
        </p>
      )}
    </div>
  );
}

const CHECK_ICON = { done: CheckCircle2, pending: CalendarClock, not_created: Circle } as const;
const CHECK_TONE = { done: "text-emerald-300", pending: "text-amber-300", not_created: "text-slate-500" } as const;

function RecurringChecks() {
  const { data, isLoading } = useRecurringChecks();
  const checks = data?.checks ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <ListChecks className="h-3.5 w-3.5" /> Recurring compliance checks
        </div>
        {data && (
          <span className="text-[12px] text-slate-400">
            <b className="text-emerald-300 tabular-nums">{data.summary.done}</b> done ·{" "}
            <b className="text-amber-300 tabular-nums">{data.summary.pending}</b> pending ·{" "}
            <b className="text-slate-300 tabular-nums">{data.summary.not_created}</b> outstanding
          </span>
        )}
      </div>
      {!data?.materialiser_enabled && (
        <p className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-slate-400">
          The materialiser is off — checks show as outstanding until an operator enables scheduled creation (<code className="text-slate-300">CARA_RECURRING_CHECKS</code>).
        </p>
      )}
      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[52px] animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {checks.map((c) => {
            const Icon = CHECK_ICON[c.status];
            return (
              <div key={c.template_id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${CHECK_TONE[c.status]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-200">{c.name}</span>
                  <span className="text-[11px] text-slate-500">{c.cadence} · due {c.due_date}{c.regulatory_ref ? ` · ${c.regulatory_ref}` : ""}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OperationalControlPage() {
  const [tab, setTab] = useState<"alerts" | "escalations">("alerts");

  return (
    <PageShell title="Operations Control Centre" subtitle="Live alerts, escalations and recurring checks — one place">
      <div className="space-y-5 pb-8">
        <DarkPanel>
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setTab("alerts")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${tab === "alerts" ? "bg-white/[0.10] text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Bell className="h-3.5 w-3.5" /> Alerts
            </button>
            <button
              onClick={() => setTab("escalations")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${tab === "escalations" ? "bg-white/[0.10] text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Radar className="h-3.5 w-3.5" /> Escalations
            </button>
          </div>
          <SpineFeed view={tab} />
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
            <AlertTriangle className="h-3.5 w-3.5" /> One feed over the previously-fragmented sources — deterministic, every item deep-links to its record.
          </p>
        </DarkPanel>

        <DarkPanel>
          <RecurringChecks />
        </DarkPanel>
      </div>
    </PageShell>
  );
}
