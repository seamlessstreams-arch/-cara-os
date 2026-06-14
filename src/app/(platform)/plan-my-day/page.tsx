"use client";

// CARA — Plan My Day: a manager's intelligent running order for the day.
// Fixed commitments (from the calendar) + ranked priorities drawn from concerns,
// overdue tasks, supervisions, training expiry and key-working — deterministic,
// with an optional Cara narrative on top.

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/common/print-button";
import { DictationButton } from "@/components/common/dictation-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { usePlanMyDay, usePlanMyDayWithNotes } from "@/hooks/use-plan-my-day";
import {
  Clock, ArrowRight, Sparkles, ShieldAlert, Users, ClipboardList, CheckSquare, HeartHandshake, Stethoscope, CheckCircle2, CalendarClock, Coffee, Sunrise, ListPlus, Wand2, X,
} from "lucide-react";
import type { PlanActionItem, PlanCategory, PlanSeverity } from "@/lib/engines/manager-plan-my-day-engine";
import type { ScheduleBlock } from "@/lib/engines/day-schedule";

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
  added: ListPlus,
};
const CAT_LABEL: Record<PlanCategory, string> = {
  safeguarding: "Safeguarding",
  staff: "Staff",
  records: "Records",
  tasks: "Tasks",
  keywork: "Key-working",
  health: "Health",
  added: "Added today",
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

function ScheduleRow({ block }: { block: ScheduleBlock }) {
  const time = `${block.start}–${block.end}`;
  const TimeCol = <span className="w-[96px] shrink-0 pt-3 text-xs font-semibold tabular-nums text-[var(--cs-text-gentle)]">{time}</span>;

  if (block.kind === "task") {
    const Icon = CAT_ICON[(block.category as PlanCategory)] ?? CheckSquare;
    return (
      <div className="flex gap-3">
        {TimeCol}
        <Link
          href={block.href ?? "#"}
          className={`flex-1 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3 border-l-4 ${SEV_BAR[(block.severity as PlanSeverity)] ?? SEV_BAR.medium} transition-shadow hover:shadow-[var(--cs-shadow-soft)]`}
        >
          <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" /><span className="text-sm font-semibold text-[var(--cs-navy)]">{block.title}</span></div>
          {block.detail && <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{block.detail}</p>}
        </Link>
      </div>
    );
  }

  const Icon = block.kind === "anchor" ? CalendarClock : block.kind === "break" ? Coffee : Sunrise;
  const tone = block.kind === "anchor"
    ? "border-[var(--cs-teal)] bg-[var(--cs-teal-bg)]"
    : "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]";
  const body = (
    <div className={`flex-1 rounded-xl border ${tone} p-3`}>
      <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" /><span className="text-sm font-semibold text-[var(--cs-navy)]">{block.title}</span></div>
      {block.detail && <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{block.detail}</p>}
    </div>
  );
  return (
    <div className="flex gap-3">
      {TimeCol}
      {block.kind === "anchor" && block.href ? <Link href={block.href} className="flex-1">{body}</Link> : body}
    </div>
  );
}

export default function PlanMyDayPage() {
  const { data: resp, isLoading, error } = usePlanMyDay();
  const planner = usePlanMyDayWithNotes();
  const [notes, setNotes] = React.useState("");
  // Once the manager re-plans with their own list, that result takes over.
  const plan = planner.data?.data ?? resp?.data;

  const onPlan = () => { if (notes.trim()) planner.mutate(notes); };
  const onClear = () => { setNotes(""); planner.reset(); };

  return (
    <PageShell
      title="Plan My Day"
      subtitle={plan ? `${plan.date} · ${plan.headline}` : "Your running order for the day — concerns, commitments and what needs you."}
      showQuickCreate={false}
      actions={plan ? <PrintButton title={`Plan My Day — ${plan.date}`} subtitle={plan.headline} targetId="plan-my-day-print" /> : undefined}
    >
      <div className="space-y-6">
        {error && (
          <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not build your plan: {(error as Error).message}</CardContent></Card>
        )}
        {isLoading && (
          <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Building your plan…</CardContent></Card>
        )}

        {/* Brain-dump: paste a list (e.g. from an email) or dictate "what's happening today", then re-plan. */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm"><ListPlus className="h-4 w-4 text-[var(--cs-teal)]" /> Add today&apos;s list</CardTitle>
            <DictationButton
              mode="append"
              size="sm"
              onTranscript={(t) => setNotes((prev) => (prev.trim() ? `${prev.replace(/\s*$/, "")}\n${t}` : t))}
            />
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={"Paste a to-do list (e.g. from an email), or tap the mic and say what's happening today — \"visit at 2pm, call the social worker, staff supervision at 4, order Alex's meds\". Then plan my day."}
              className="resize-y text-sm"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={onPlan} disabled={!notes.trim() || planner.isPending} className="gap-1.5">
                <Wand2 className="h-4 w-4" />
                {planner.isPending ? "Planning…" : "Plan my day"}
              </Button>
              {(notes.trim() || planner.data) && (
                <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-[var(--cs-text-muted)]">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              {planner.data && (plan?.counts.added ?? 0) > 0 && (
                <span className="text-xs font-medium text-[var(--cs-teal)]">
                  Folded {plan!.counts.added} item{plan!.counts.added === 1 ? "" : "s"} into your schedule below.
                </span>
              )}
              {planner.data && (plan?.counts.added ?? 0) === 0 && (
                <span className="text-xs text-[var(--cs-text-muted)]">No items recognised — try one per line.</span>
              )}
            </div>
            {planner.isError && (
              <p className="mt-2 text-xs text-[var(--cs-risk)]">Couldn&apos;t plan that just now — please try again.</p>
            )}
          </CardContent>
        </Card>

        {plan && (
          <div id="plan-my-day-print" className="space-y-6">
            {/* Counts */}
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Fixed today", value: plan.counts.fixed },
                { label: "Priorities", value: plan.counts.priorities },
                { label: "Concerns", value: plan.counts.concerns },
                { label: "Overdue tasks", value: plan.counts.overdue_tasks },
                ...(plan.counts.added > 0 ? [{ label: "Added today", value: plan.counts.added }] : []),
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
                  <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                  <CardTitle className="text-sm">Cara&apos;s read on today</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-secondary)]">{plan.ai_narrative}</p>
                </CardContent>
              </Card>
            )}

            {/* Today's schedule — the timed running order */}
            <CardErrorBoundary>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[var(--cs-teal)]" /> Today&apos;s schedule</CardTitle>
                  <span className="text-xs text-[var(--cs-text-muted)]">{plan.day_window.start}–{plan.day_window.end}</span>
                </CardHeader>
                <CardContent>
                  {plan.schedule.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Nothing to schedule — your day is clear.</p>
                  ) : (
                    <div className="space-y-2">
                      {plan.schedule.map((b, i) => <ScheduleRow key={`${b.start}_${i}`} block={b} />)}
                    </div>
                  )}
                  <p className="mt-3 text-[11px] text-[var(--cs-text-gentle)]">A suggested running order — times are estimates worked around your fixed commitments. Adjust as the day unfolds.</p>
                </CardContent>
              </Card>
            </CardErrorBoundary>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* If time allows (carry-over) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4 text-[var(--cs-navy)]" /> If time allows</CardTitle>
                </CardHeader>
                <CardContent>
                  {plan.carry_over.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Everything fits in the day — nothing carried over.</p>
                  ) : (
                    <div className="space-y-2">
                      {plan.carry_over.map((p) => <ActionRow key={p.id} item={p} />)}
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
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">Plenty on today — work the schedule above.</p>
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
          </div>
        )}
      </div>
    </PageShell>
  );
}
