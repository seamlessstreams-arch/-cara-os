"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, LayoutDashboard, AlertOctagon, AlertTriangle, ArrowRight,
  UserCheck, Fingerprint, ClipboardList, CalendarClock, MessageSquare, GraduationCap,
  LifeBuoy, ClipboardCheck, ListChecks, Clock,
} from "lucide-react";
import { useWorkforceCommand } from "@/hooks/use-workforce-command";
import type { CardStatus } from "@/lib/engines/workforce-command-engine";

const CARD_ICON: Record<string, typeof UserCheck> = {
  recruitment: UserCheck, safer_recruitment: Fingerprint, onboarding: ClipboardList, probation: CalendarClock,
  supervision: MessageSquare, training: GraduationCap, retention: LifeBuoy, ofsted: ClipboardCheck, tasks: ListChecks,
};
const STATUS_META: Record<CardStatus, { ring: string; text: string; chip: string }> = {
  good: { ring: "bg-green-100 text-green-700", text: "text-green-700", chip: "border-green-200" },
  watch: { ring: "bg-amber-100 text-amber-700", text: "text-amber-700", chip: "border-amber-200" },
  alert: { ring: "bg-red-100 text-red-700", text: "text-red-700", chip: "border-red-300" },
  info: { ring: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]", text: "text-[var(--cs-text-muted)]", chip: "border-[var(--cs-border)]" },
};

export default function WorkforceCommandPage() {
  const { data, isLoading, isFetching, refetch } = useWorkforceCommand();

  return (
    <PageShell
      title="Workforce Command"
      subtitle="Your whole workforce on one screen — recruitment, safer recruitment, onboarding, probation, supervision, training, retention support and Ofsted evidence, with what needs you most up top."
      caraContext={{ pageTitle: "Workforce Command", sourceType: "general" }}
      actions={
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh</button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && (
          <>
            {/* headline + attention */}
            <Card className={cn("border-l-4", data.summary.alerts > 0 ? "border-l-red-500" : data.attention.length > 0 ? "border-l-amber-400" : "border-l-green-500")}>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><LayoutDashboard className="h-4 w-4 text-[var(--cs-teal-strong)]" /> What needs your attention</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                {data.attention.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {data.attention.map((a) => (
                      <Link key={a.key} href={a.href} className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-opacity hover:opacity-80", a.severity === "alert" ? "border-red-200 bg-red-50/60" : "border-amber-200 bg-amber-50/50")}>
                        <span className="flex min-w-0 items-center gap-2">
                          {a.severity === "alert" ? <AlertOctagon className="h-4 w-4 shrink-0 text-red-600" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />}
                          <span className="min-w-0"><span className="font-semibold text-[var(--cs-navy)]">{a.label}</span> <span className="text-[var(--cs-text-muted)]">— {a.detail}</span></span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--cs-text-gentle)]" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* card grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.cards.map((c) => {
                const Icon = CARD_ICON[c.key] ?? LayoutDashboard;
                const m = STATUS_META[c.status];
                return (
                  <Link key={c.key} href={c.href} className="group rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)] transition-transform hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", m.ring)}><Icon className="h-5 w-5" /></span>
                      <ArrowRight className="h-4 w-4 text-[var(--cs-text-gentle)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className={cn("mt-3 text-2xl font-extrabold tabular-nums leading-none", m.text)}>{c.value}</div>
                    <div className="mt-1 text-sm font-bold text-[var(--cs-navy)]">{c.label}</div>
                    <div className="mt-0.5 text-xs text-[var(--cs-text-muted)]">{c.sub}</div>
                  </Link>
                );
              })}
            </div>

            {/* recent activity */}
            {data.recent_activity.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><Clock className="h-3.5 w-3.5" /> Recent activity</p>
                  <div className="space-y-1">
                    {data.recent_activity.map((a, i) => (
                      <Link key={i} href={a.href} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--cs-bg)]">
                        <span className="min-w-0 truncate text-[var(--cs-text)]">{a.label}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-[var(--cs-text-muted)]">{a.when}</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
