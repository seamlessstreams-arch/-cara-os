"use client";

// CARA — Staffing Cover: the forward, anti-rota-blindness view.
// Day-by-day, day/night cover vs the home policy — under, over (with/without a
// reason), no-waking-night and phantom (scheduled-but-off) gaps, worst-first.

import React, { useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { PrintButton } from "@/components/common/print-button";
import { useStaffingCover } from "@/hooks/use-staffing-cover";
import { CalendarRange, AlertTriangle, CheckCircle2, Sun, Moon, Users } from "lucide-react";
import type { CoverSeverity, CoverStatus, PeriodCover } from "@/lib/rota/staffing-cover-engine";

const SEV_BAR: Record<CoverSeverity, string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  attention: "border-l-[var(--cs-teal)]",
  ok: "border-l-[var(--cs-border)]",
};
const STATUS_CHIP: Record<CoverStatus, string> = {
  under: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  no_waking_night: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  over_unexplained: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal)]",
  over_explained: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
  met: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
};
const STATUS_LABEL: Record<CoverStatus, string> = {
  under: "Under-covered",
  no_waking_night: "No waking night",
  over_unexplained: "Extra — explain",
  over_explained: "Extra (logged)",
  met: "Met",
};

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function PeriodRow({ p, showDate }: { p: PeriodCover; showDate?: boolean }) {
  const Icon = p.period === "night" ? Moon : Sun;
  return (
    <div className={`rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-2.5 border-l-4 ${SEV_BAR[p.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" />
          <div>
            {showDate && <p className="text-xs font-semibold text-[var(--cs-navy)]">{fmtDate(p.date)} · {p.period}</p>}
            <p className="text-xs text-[var(--cs-text-secondary)]">{p.message}</p>
            {p.phantom > 0 && <p className="mt-0.5 text-[11px] text-[var(--cs-warning)]">Scheduled but off: {p.phantom_names.join(", ")}</p>}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[p.status]}`}>{STATUS_LABEL[p.status]}</span>
      </div>
    </div>
  );
}

export default function StaffingCoverPage() {
  const { data: resp, isLoading, error } = useStaffingCover();
  const o = resp?.data;

  const byDate = useMemo(() => {
    const m = new Map<string, PeriodCover[]>();
    for (const p of o?.periods ?? []) {
      const arr = m.get(p.date) ?? [];
      arr.push(p);
      m.set(p.date, arr);
    }
    return [...m.entries()];
  }, [o]);

  return (
    <PageShell
      title="Staffing Cover"
      subtitle={o ? `${o.range.from} → ${o.range.to} · ${o.headline}` : "Forward cover vs the home's minimum and norm — defeating rota blindness."}
      showQuickCreate={false}
      actions={o ? <PrintButton title="Staffing Cover" subtitle={o.headline} targetId="staffing-cover-print" /> : undefined}
    >
      <div className="space-y-6">
        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load cover: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Building the cover picture…</CardContent></Card>}

        {o && (
          <div id="staffing-cover-print" className="space-y-6">
            {/* Policy + summary */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--cs-surface)] px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
              <Users className="h-4 w-4 text-[var(--cs-teal)]" />
              <span>Policy — day min <b>{o.policy.min_day}</b> (norm {o.policy.expected_day}) · night min <b>{o.policy.min_night}</b> (norm {o.policy.expected_night}) · waking night {o.policy.waking_night_required ? "required" : "not required"}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Under-covered", value: o.summary.days_under, bad: o.summary.days_under > 0 },
                { label: "No waking night", value: o.summary.nights_no_waking, bad: o.summary.nights_no_waking > 0 },
                { label: "Extra to explain", value: o.summary.over_unexplained, bad: o.summary.over_unexplained > 0 },
                { label: "Scheduled-but-off", value: o.summary.phantom_days, bad: o.summary.phantom_days > 0 },
                { label: "Unfilled shifts", value: o.summary.open_shift_periods, bad: o.summary.open_shift_periods > 0 },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{c.label}</p>
                  <p className={`mt-0.5 text-2xl font-extrabold tracking-tight ${c.bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-navy)]"}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Needs attention (worst-first) */}
            <CardErrorBoundary>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--cs-warning)]" />
                  <CardTitle className="text-sm">Needs attention</CardTitle>
                </CardHeader>
                <CardContent>
                  {o.attention.length === 0 ? (
                    <p className="flex items-center gap-2 py-1 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="h-4 w-4 text-[var(--cs-success)]" /> Cover is complete across the fortnight — minimums met, waking-night in place, no unexplained extra.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {o.attention.map((p) => <PeriodRow key={`${p.date}-${p.period}`} p={p} showDate />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardErrorBoundary>

            {/* Day-by-day */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CalendarRange className="h-4 w-4 text-[var(--cs-teal)]" />
                <CardTitle className="text-sm">Day by day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byDate.map(([date, periods]) => (
                    <div key={date}>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{fmtDate(date)}</p>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {periods.map((p) => <PeriodRow key={p.period} p={p} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <p className="flex items-start gap-2 text-xs text-[var(--cs-text-gentle)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Cover counts only available staff — anyone on approved leave or off sick is removed, and unfilled shifts don&apos;t count, so hidden gaps surface. {o.projected_count > 0 ? `Includes ${o.projected_count} shift(s) projected from staff patterns where none is published yet. ` : ""}Extra cover above the norm asks for a reason rather than raising an alarm. It supports professional judgement — staffing decisions remain yours.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
