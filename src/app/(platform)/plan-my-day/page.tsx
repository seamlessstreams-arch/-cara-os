"use client";

// CARA — Plan My Day: a manager's intelligent running order for the day.
// Fixed commitments (from the calendar) + ranked priorities drawn from concerns,
// overdue tasks, supervisions, training expiry and key-working — deterministic,
// with an optional Cara narrative on top.

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { usePlanMyDay } from "@/hooks/use-plan-my-day";
import {
  Clock, ArrowRight, Sparkles, ShieldAlert, Users, ClipboardList, CheckSquare, HeartHandshake, Stethoscope, CheckCircle2, CalendarClock,
} from "lucide-react";
import type { PlanActionItem, PlanCategory, PlanSeverity } from "@/lib/engines/manager-plan-my-day-engine";

const SEV_BAR: Record<PlanSeverity, string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  medium: "border-l-[var(--cs-teal)]",
  low: "border-l-[var(--cs-border)]",
};
const SEV_CHIP: Record<PlanSeverity, string> = {
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  high: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  medium: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal)]",
  low: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
};
const CAT_ICON: Record<PlanCategory, React.ElementType> = {
  safeguarding: ShieldAlert,
  staff: Users,
  records: ClipboardList,
  tasks: CheckSquare,
  keywork: HeartHandshake,
  health: Stethoscope,
};
const CAT_LABEL: Record<PlanCategory, string> = {
  safeguarding: "Safeguarding",
  staff: "Staff",
  records: "Records",
  tasks: "Tasks",
  keywork: "Key-working",
  health: "Health",
};

function ActionRow({ item }: { item: PlanActionItem }) {
  const Icon = CAT_ICON[item.category];
  return (
    <Link
      href={item.href}
      className={`block rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3 border-l-4 ${SEV_BAR[item.severity]} transition-shadow hover:shadow-[var(--cs-shadow-soft)]`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEV_CHIP[item.severity]}`}>{item.severity}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--cs-text-gentle)]">{CAT_LABEL[item.category]}</span>
            <span className="text-sm font-semibold text-[var(--cs-navy)]">{item.title}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{item.detail}</p>
        </div>
        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--cs-text-gentle)]" />
      </div>
    </Link>
  );
}

export default function PlanMyDayPage() {
  const { data: resp, isLoading, error } = usePlanMyDay();
  const plan = resp?.data;

  return (
    <PageShell
      title="Plan My Day"
      subtitle={plan ? `${plan.date} · ${plan.headline}` : "Your running order for the day — concerns, commitments and what needs you."}
      showQuickCreate={false}
    >
      <div className="space-y-6">
        {error && (
          <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not build your plan: {(error as Error).message}</CardContent></Card>
        )}
        {isLoading && (
          <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Building your plan…</CardContent></Card>
        )}

        {plan && (
          <>
            {/* Counts */}
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Fixed today", value: plan.counts.fixed },
                { label: "Priorities", value: plan.counts.priorities },
                { label: "Concerns", value: plan.counts.concerns },
                { label: "Overdue tasks", value: plan.counts.overdue_tasks },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[var(--cs-surface)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{s.label}</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)]">{s.value}</p>
                </div>
              ))}
            </div>

            {/* AI narrative (optional) */}
            {plan.ai_narrative && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                  <CardTitle className="text-sm">Cara&apos;s read on today</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-secondary)]">{plan.ai_narrative}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Fixed commitments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[var(--cs-teal)]" /> Your day</CardTitle>
                  <Link href="/calendar" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">Calendar <ArrowRight className="h-3 w-3" /></Link>
                </CardHeader>
                <CardContent>
                  {plan.fixed.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">No fixed commitments today — your time is your own to allocate to the priorities.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {plan.fixed.map((f) => (
                        <Link key={f.id} href={f.href} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--cs-surface)]">
                          <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-[var(--cs-text-gentle)]">{f.all_day ? "All day" : f.time}</span>
                          <span className="flex-1 truncate text-sm text-[var(--cs-navy)]">{f.title}</span>
                          {f.subtitle && <span className="hidden shrink-0 text-xs text-[var(--cs-text-muted)] sm:inline">{f.subtitle}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* On track */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[var(--cs-success)]" /> On track</CardTitle>
                </CardHeader>
                <CardContent>
                  {plan.positives.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Plenty on today — work the priorities on the right.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {plan.positives.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--cs-success)]" /> {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Priorities */}
            <CardErrorBoundary>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4 text-[var(--cs-navy)]" /> Priorities — what needs you</CardTitle>
                </CardHeader>
                <CardContent>
                  {plan.priorities.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Nothing pressing right now. Use the time for key-working, observations and getting ahead.</p>
                  ) : (
                    <div className="space-y-2">
                      {plan.priorities.map((p) => <ActionRow key={p.id} item={p} />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardErrorBoundary>

            {/* Watch */}
            {plan.watch.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Keep an eye on</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.watch.map((p) => <ActionRow key={p.id} item={p} />)}
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-[var(--cs-text-gentle)]">
              Cara assembles this from your calendar, open concerns, tasks, supervisions, training and key-working. It supports your judgement — you decide what to action and when.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
