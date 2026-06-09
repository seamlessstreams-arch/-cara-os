"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, Users, ClipboardList, CalendarClock, Pill, Moon, AlertTriangle,
  AlertOctagon, CheckCircle2, UserCheck, Clock,
} from "lucide-react";
import { useShiftBriefing } from "@/hooks/use-shift-briefing";
import type { ShiftBriefingResult, AttentionItem } from "@/lib/engines/shift-briefing-engine";

function StatChip({ value, label, Icon, tone }: { value: number | string; label: string; Icon: typeof Users; tone: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2", tone)}>
      <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
      <div className="leading-none">
        <div className="text-lg font-extrabold tabular-nums">{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({ Icon, title, count }: { Icon: typeof Users; title: string; count?: number }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[var(--cs-teal-strong)]" />
      <h2 className="text-sm font-bold text-[var(--cs-navy)]">{title}</h2>
      {count != null && <span className="rounded-full bg-[var(--cs-teal-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--cs-teal-strong)]">{count}</span>}
    </div>
  );
}

const ATT_TONE: Record<AttentionItem["severity"], string> = {
  critical: "border-l-red-500 bg-red-50/60",
  high: "border-l-amber-500 bg-amber-50/60",
  medium: "border-l-slate-400 bg-slate-50/60",
};

function Attention({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="border-2 border-red-200">
      <CardContent className="py-4">
        <SectionHeader Icon={AlertTriangle} title="Needs attention this shift" count={items.length} />
        <div className="space-y-1.5">
          {items.map((a, i) => (
            <div key={i} className={cn("flex items-start justify-between gap-3 rounded-lg border-l-4 px-3 py-2", ATT_TONE[a.severity])}>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--cs-navy)]">{a.label}{a.child_name ? <span className="font-normal text-[var(--cs-text-muted)]"> · {a.child_name}</span> : null}</div>
                <div className="text-xs text-[var(--cs-text-secondary)]">{a.detail}</div>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                a.severity === "critical" ? "bg-red-100 text-red-700" : a.severity === "high" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600")}>{a.severity}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OnDuty({ data }: { data: ShiftBriefingResult }) {
  const { now, upcoming, gap_warning } = data.on_duty;
  return (
    <Card>
      <CardContent className="py-4">
        <SectionHeader Icon={Users} title="On duty" count={now.length + upcoming.length} />
        {gap_warning && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> {gap_warning}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {now.map((m) => (
            <div key={m.staff_id} className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50/50 px-3 py-2">
              <UserCheck className="h-4 w-4 shrink-0 text-green-600" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--cs-navy)]">{m.staff_name}</div>
                <div className="text-[11px] text-[var(--cs-text-muted)]">{m.shift_label}{m.is_open_shift ? " · open shift" : ""}</div>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">ON NOW</span>
            </div>
          ))}
          {upcoming.map((m) => (
            <div key={m.staff_id} className="flex items-center gap-2.5 rounded-lg border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
              <Clock className="h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--cs-navy)]">{m.staff_name}</div>
                <div className="text-[11px] text-[var(--cs-text-muted)]">{m.shift_label}</div>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">LATER</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DueThisShift({ data }: { data: ShiftBriefingResult }) {
  const { tasks, reviews } = data;
  const hasAny = tasks.count > 0 || reviews.count > 0;
  return (
    <Card>
      <CardContent className="py-4">
        <SectionHeader Icon={CalendarClock} title="Due this shift" count={tasks.count + reviews.count} />
        {!hasAny && <p className="text-sm text-[var(--cs-text-muted)]">Nothing due today — no outstanding tasks or plan reviews.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {(tasks.count > 0) && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><ClipboardList className="h-3.5 w-3.5" /> Tasks</div>
              <div className="space-y-1.5">
                {tasks.overdue.map((t) => (
                  <div key={t.id} className="rounded-lg border-l-4 border-l-red-500 bg-red-50/50 px-3 py-1.5">
                    <div className="text-sm font-medium text-[var(--cs-navy)]">{t.title}</div>
                    <div className="text-[11px] text-red-700">{t.days_overdue}d overdue{t.assigned_name ? ` · ${t.assigned_name}` : ""}{t.child_name ? ` · ${t.child_name}` : ""}</div>
                  </div>
                ))}
                {tasks.due_today.map((t) => (
                  <div key={t.id} className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50/40 px-3 py-1.5">
                    <div className="text-sm font-medium text-[var(--cs-navy)]">{t.title}</div>
                    <div className="text-[11px] text-amber-700">Due today{t.assigned_name ? ` · ${t.assigned_name}` : ""}{t.child_name ? ` · ${t.child_name}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(reviews.count > 0) && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><CalendarClock className="h-3.5 w-3.5" /> Plan reviews</div>
              <div className="space-y-1.5">
                {reviews.overdue.map((r) => (
                  <div key={r.id} className="rounded-lg border-l-4 border-l-red-500 bg-red-50/50 px-3 py-1.5">
                    <div className="text-sm font-medium text-[var(--cs-navy)]">{r.plan_type}{r.child_name ? <span className="font-normal text-[var(--cs-text-muted)]"> · {r.child_name}</span> : null}</div>
                    <div className="text-[11px] text-red-700">{Math.abs(r.days_to_review)}d overdue</div>
                  </div>
                ))}
                {reviews.due_soon.map((r) => (
                  <div key={r.id} className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50/40 px-3 py-1.5">
                    <div className="text-sm font-medium text-[var(--cs-navy)]">{r.plan_type}{r.child_name ? <span className="font-normal text-[var(--cs-text-muted)]"> · {r.child_name}</span> : null}</div>
                    <div className="text-[11px] text-amber-700">Due in {r.days_to_review}d</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Medications({ data }: { data: ShiftBriefingResult }) {
  const { items, regular_count, prn_count } = data.medications;
  if (items.length === 0) return null;
  return (
    <Card>
      <CardContent className="py-4">
        <SectionHeader Icon={Pill} title="Active medications" count={items.length} />
        <p className="mb-2 text-[11px] text-[var(--cs-text-muted)]">{regular_count} regular · {prn_count} PRN (as required). Administer per MAR and record each dose.</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-lg border border-[var(--cs-border)] px-3 py-1.5">
              <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold", m.prn ? "bg-purple-100 text-purple-700" : "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]")}>{m.prn ? "PRN" : "REG"}</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--cs-navy)]">{m.name} <span className="text-[var(--cs-text-muted)]">{m.dosage}</span></div>
                <div className="truncate text-[11px] text-[var(--cs-text-muted)]">{m.child_name} · {m.frequency}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Overnight({ data }: { data: ShiftBriefingResult }) {
  const { incidents, recent_log } = data.events;
  if (incidents.length === 0 && recent_log.length === 0) return null;
  return (
    <Card>
      <CardContent className="py-4">
        <SectionHeader Icon={Moon} title="Overnight & recent" count={incidents.length + recent_log.length} />
        {incidents.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {incidents.map((e) => (
              <div key={e.id} className={cn("rounded-lg border-l-4 px-3 py-2", e.status?.toLowerCase() === "open" ? "border-l-red-500 bg-red-50/50" : "border-l-slate-300 bg-slate-50/50")}>
                <div className="flex items-center gap-2">
                  <AlertOctagon className={cn("h-3.5 w-3.5 shrink-0", e.status?.toLowerCase() === "open" ? "text-red-600" : "text-slate-400")} />
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{(e.category ?? "Incident").replace(/_/g, " ")}</span>
                  {e.child_name && <span className="text-[11px] text-[var(--cs-text-muted)]">· {e.child_name}</span>}
                  <span className="ml-auto text-[10px] font-medium text-[var(--cs-text-muted)]">{e.date}{e.time ? ` ${e.time}` : ""}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-[var(--cs-text-secondary)]">{e.summary}</p>
                {e.status?.toLowerCase() === "open" && <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">OPEN{e.severity ? ` · ${String(e.severity).toUpperCase()}` : ""}</span>}
              </div>
            ))}
          </div>
        )}
        {recent_log.length > 0 && (
          <div className="space-y-1">
            {recent_log.map((e) => (
              <div key={e.id} className="flex items-start gap-2 rounded-lg px-2 py-1 text-xs">
                {e.is_significant ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" /> : <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--cs-text-gentle)]" />}
                <div className="min-w-0">
                  <span className="font-medium text-[var(--cs-navy)]">{e.child_name ?? "Home"}</span>
                  <span className="text-[var(--cs-text-muted)]"> · {(e.category ?? "note").replace(/_/g, " ")} · {e.date}{e.time ? ` ${e.time}` : ""}</span>
                  <p className="line-clamp-1 text-[var(--cs-text-secondary)]">{e.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ShiftBriefingPage() {
  const { data, isLoading, isFetching, refetch } = useShiftBriefing();

  return (
    <PageShell
      title="Shift Briefing"
      subtitle="What must happen this shift — an auto-generated operational snapshot for staff coming on duty. Who's on, tasks and plan reviews due, active medications, and overnight events. Complements the written Handover and the Priority Briefing."
      ariaContext={{ pageTitle: "Shift Briefing", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Shift Briefing" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-4">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && (
          <>
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[var(--cs-navy)]">{data.now_label ?? data.date}</div>
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  <StatChip value={data.summary.on_duty} label="On duty now" Icon={Users} tone="bg-green-50 border-green-200 text-green-800" />
                  <StatChip value={data.summary.tasks_due} label="Tasks due" Icon={ClipboardList} tone="bg-amber-50 border-amber-200 text-amber-800" />
                  <StatChip value={data.summary.reviews_due} label="Reviews due" Icon={CalendarClock} tone="bg-[var(--cs-teal-bg)] border-[var(--cs-teal)] text-[var(--cs-teal-strong)]" />
                  <StatChip value={data.summary.open_incidents} label="Open incidents" Icon={AlertOctagon} tone="bg-red-50 border-red-200 text-red-800" />
                  <StatChip value={data.summary.meds_active} label="Active meds" Icon={Pill} tone="bg-[var(--cs-bg)] border-[var(--cs-border)] text-[var(--cs-navy)]" />
                </div>
              </CardContent>
            </Card>

            <Attention items={data.attention} />
            <OnDuty data={data} />
            <DueThisShift data={data} />
            <Medications data={data} />
            <Overnight data={data} />
          </>
        )}
      </div>
    </PageShell>
  );
}
