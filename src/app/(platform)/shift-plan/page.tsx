"use client";

// CARA — Shift Plan: a Cara-generated plan for an upcoming shift.
// Who's on, the running order, what must get done, the medication picture and
// per-child watch-points — deterministic, with an optional Cara narrative.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { useShiftPlan } from "@/hooks/use-shift-plan";
import { Sun, Moon, Clock, Users, Pill, ShieldAlert, CheckCircle2, Sparkles, AlertTriangle, Eye } from "lucide-react";
import type { ShiftPlanMustDo } from "@/lib/engines/shift-plan-engine";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function defaultPeriod(): "day" | "night" {
  const h = new Date().getHours();
  return h >= 20 || h < 8 ? "night" : "day";
}

const SEV_BAR: Record<ShiftPlanMustDo["severity"], string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  medium: "border-l-[var(--cs-teal)]",
};
const STAFFING_STYLE: Record<"ok" | "high" | "critical", string> = {
  ok: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
  high: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
};

export default function ShiftPlanPage() {
  const [date, setDate] = useState(todayKey());
  const [period, setPeriod] = useState<"day" | "night">(defaultPeriod());
  const { data: resp, isLoading, error } = useShiftPlan(date, period);
  const plan = resp?.data;

  const periodBtn = useMemo(
    () => (p: "day" | "night", Icon: React.ElementType, label: string) => (
      <button
        onClick={() => setPeriod(p)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          period === p ? "bg-[var(--cs-navy)] text-white" : "text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"
        }`}
      >
        <Icon className="h-3.5 w-3.5" /> {label}
      </button>
    ),
    [period],
  );

  return (
    <PageShell
      title="Shift Plan"
      subtitle={plan ? `${plan.period_label} · ${plan.window_label} · ${plan.headline}` : "A Cara-generated plan for the shift ahead."}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-2.5 py-1.5 text-xs text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]" />
          <div className="flex items-center gap-1 rounded-lg border border-[var(--cs-border)] p-0.5">
            {periodBtn("day", Sun, "Day")}
            {periodBtn("night", Moon, "Night")}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not build the shift plan: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Building the plan…</CardContent></Card>}

        {plan && (
          <>
            {/* Staffing banner */}
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${STAFFING_STYLE[plan.staffing.severity]}`}>
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{plan.staffing.line}</p>
                  {plan.on_shift.length > 0 && (
                    <p className="text-xs opacity-80">On shift: {plan.on_shift.map((s) => s.staff_name).join(", ")}</p>
                  )}
                </div>
              </div>
              {plan.staffing.alerts.length > 0 && (
                <div className="flex flex-col gap-1">
                  {plan.staffing.alerts.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 text-xs font-medium"><AlertTriangle className="h-3 w-3" /> {a}</span>
                  ))}
                </div>
              )}
            </div>

            {/* AI narrative */}
            {plan.ai_narrative && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                  <CardTitle className="text-sm">Cara&apos;s plan for the shift</CardTitle>
                </CardHeader>
                <CardContent><p className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-secondary)]">{plan.ai_narrative}</p></CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Running order */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[var(--cs-teal)]" /> Running order</CardTitle>
                </CardHeader>
                <CardContent>
                  {plan.running_order.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Nothing booked in this shift window.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {plan.running_order.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                          <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-[var(--cs-text-gentle)]">{r.time}</span>
                          <span className="flex-1 truncate text-sm text-[var(--cs-navy)]">{r.title}</span>
                          {r.child_name && <span className="shrink-0 text-xs text-[var(--cs-text-muted)]">{r.child_name}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><Pill className="h-4 w-4 text-[var(--cs-teal)]" /> Medication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--cs-text-secondary)]">{plan.medications.summary}</p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="rounded-full bg-[var(--cs-surface)] px-2.5 py-1 font-medium text-[var(--cs-text-muted)]">{plan.medications.regular_count} regular</span>
                    {plan.medications.prn_count > 0 && <span className="rounded-full bg-[var(--cs-surface)] px-2.5 py-1 font-medium text-[var(--cs-text-muted)]">{plan.medications.prn_count} PRN</span>}
                  </div>
                  <Link href="/medication" className="mt-3 inline-block text-xs font-semibold text-[var(--cs-teal)] hover:underline">Open MAR →</Link>
                </CardContent>
              </Card>
            </div>

            {/* Must do */}
            <CardErrorBoundary>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[var(--cs-navy)]" /> To complete this shift</CardTitle>
                </CardHeader>
                <CardContent>
                  {plan.must_do.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Nothing outstanding for this shift.</p>
                  ) : (
                    <div className="space-y-2">
                      {plan.must_do.map((m) => (
                        <div key={m.id} className={`rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3 border-l-4 ${SEV_BAR[m.severity]}`}>
                          <p className="text-sm font-semibold text-[var(--cs-navy)]">{m.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{m.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardErrorBoundary>

            {/* Young people to watch */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4 text-[var(--cs-navy)]" /> Young people — watch points</CardTitle>
                {plan.settled_count > 0 && <span className="text-xs text-[var(--cs-text-muted)]">{plan.settled_count} settled</span>}
              </CardHeader>
              <CardContent>
                {plan.young_people.length === 0 ? (
                  <p className="py-2 text-sm text-[var(--cs-text-muted)]">No active concerns flagged. Maintain normal observations and recording.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {plan.young_people.map((w) => (
                      <div key={w.child_name} className="rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3">
                        <p className="text-sm font-semibold text-[var(--cs-navy)]">{w.child_name}</p>
                        <ul className="mt-1 space-y-1">
                          {w.flags.map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--cs-text-secondary)]"><ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-[var(--cs-warning)]" /> {f}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {plan.positives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {plan.positives.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cs-success-bg)] px-3 py-1 text-xs font-medium text-[var(--cs-success)]">
                    <CheckCircle2 className="h-3 w-3" /> {p}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-[var(--cs-text-gentle)]">
              Cara generates this plan from the rota, calendar, medications, tasks and recent records. It supports the team&apos;s judgement — staff remain responsible for decisions, recording and safeguarding actions.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
