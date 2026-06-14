"use client";

// CARA — Dashboard "Your plan today" card: a glance at the manager's timed
// running order, surfaced where they start the day. Deep-links to /plan-my-day.
// Read-only summary — the full page owns the detail.

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { CalendarClock, ArrowRight, Coffee, Sunrise, ShieldAlert } from "lucide-react";
import { usePlanMyDay } from "@/hooks/use-plan-my-day";
import type { ScheduleBlock } from "@/lib/engines/day-schedule";

const DOT: Record<ScheduleBlock["kind"], string> = {
  anchor: "bg-[var(--cs-teal)]",
  task: "bg-[var(--cs-navy)]",
  break: "bg-[var(--cs-text-gentle)]",
  routine: "bg-[var(--cs-cara-gold)]",
};

function PlanTodayInner() {
  const { data, isLoading } = usePlanMyDay();
  const plan = data?.data;
  // The schedule is already floored at "now" by the API; show the next few.
  const next = (plan?.schedule ?? []).slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-[var(--cs-teal)]" />
          Your plan today
          {plan && plan.counts.concerns > 0 && (
            <span className="rounded-full bg-[var(--cs-risk-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--cs-risk)]">
              {plan.counts.concerns} to review
            </span>
          )}
        </CardTitle>
        <Link href="/plan-my-day" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">
          Open plan <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">Building your plan…</p>
        ) : !plan || next.length === 0 ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">Your day is clear — no scheduled blocks remaining.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-[var(--cs-text-muted)]">{plan.headline}</p>
            <div className="space-y-0.5">
              {next.map((b, i) => {
                const Icon = b.kind === "break" ? Coffee : b.kind === "routine" ? Sunrise : null;
                return (
                  <div key={`${b.start}_${i}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                    <span className="w-[88px] shrink-0 text-xs font-semibold tabular-nums text-[var(--cs-text-gentle)]">{b.start}–{b.end}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[b.kind]}`} />
                    <span className="flex-1 truncate text-sm text-[var(--cs-navy)]">{b.title}</span>
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-gentle)]" />}
                  </div>
                );
              })}
            </div>
            {plan.carry_over.length > 0 && (
              <Link href="/plan-my-day" className="mt-2 inline-flex items-center gap-1 px-2 text-xs font-medium text-[var(--cs-teal)] hover:underline">
                +{plan.carry_over.length} more if time allows
              </Link>
            )}
            {plan.counts.concerns > 0 && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[var(--cs-risk-bg)] px-3 py-2">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-risk)]" />
                <p className="text-xs text-[var(--cs-text-secondary)]">{plan.counts.concerns} incident{plan.counts.concerns === 1 ? "" : "s"} awaiting your oversight — scheduled first.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanTodayCard() {
  return (
    <CardErrorBoundary>
      <PlanTodayInner />
    </CardErrorBoundary>
  );
}
