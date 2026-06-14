"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, Clock, AlertOctagon, CheckCircle2, Circle, Hourglass,
  User, MessageSquareWarning, ArrowUpRight,
} from "lucide-react";
import { useComplaintsClock } from "@/hooks/use-complaints-clock";
import type { ComplaintClock, ClockUrgency, StageClock } from "@/lib/engines/complaints-clock-engine";

const URGENCY_META: Record<ClockUrgency, { label: string; dot: string; badge: string; rag: string; border: string }> = {
  breached: { label: "Past deadline", dot: "bg-red-500", badge: "bg-red-100 text-red-800 border-red-200", rag: "cs-rag-red", border: "border-l-red-500" },
  due_soon: { label: "Due soon", dot: "bg-amber-400", badge: "bg-amber-100 text-amber-800 border-amber-200", rag: "cs-rag-amber", border: "border-l-amber-400" },
  on_track: { label: "On track", dot: "bg-[var(--cs-teal)]", badge: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)] border-[var(--cs-teal-soft)]", rag: "cs-rag-green", border: "border-l-[var(--cs-teal)]" },
  resolved: { label: "Resolved", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200", rag: "cs-rag-slate", border: "border-l-slate-300" },
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

function StageChip({ label, clock }: { label: string; clock: StageClock }) {
  let text: string, cls: string;
  if (clock.done) {
    text = clock.status === "met" ? `${label} on time` : `${label} late`;
    cls = clock.status === "met" ? "bg-green-50 text-green-700 border-green-200 cs-rag-green" : "bg-amber-50 text-amber-700 border-amber-200 cs-rag-amber";
  } else if (clock.status === "overdue") {
    text = `${label} ${Math.abs(clock.due_in_days)}d overdue`;
    cls = "bg-red-50 text-red-700 border-red-200 cs-rag-red";
  } else if (clock.status === "due_soon") {
    text = `${label} due ${clock.due_in_days === 0 ? "today" : `in ${clock.due_in_days}d`}`;
    cls = "bg-amber-50 text-amber-700 border-amber-200 cs-rag-amber";
  } else {
    text = `${label} due in ${clock.due_in_days}d`;
    cls = "bg-slate-50 text-slate-600 border-slate-200 cs-rag-slate";
  }
  const Icon = clock.done ? CheckCircle2 : clock.status === "overdue" ? AlertOctagon : Hourglass;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" /> {text}
    </span>
  );
}

function ComplaintCard({ c }: { c: ComplaintClock }) {
  const u = URGENCY_META[c.urgency];
  return (
    <Card className={cn("border-l-4 break-inside-avoid", u.border)}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[var(--cs-navy)]">{c.reference}</span>
              {c.category && <span className="rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{c.category}</span>}
              {c.stage && <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-gentle)]">{c.stage.replace(/_/g, " ")}</span>}
            </div>
            <p className="mt-1 text-sm leading-snug text-[var(--cs-text)]">{c.summary}</p>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", u.badge, u.rag)}>{u.label}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--cs-text-muted)]">
          <span className="inline-flex items-center gap-1"><MessageSquareWarning className="h-3 w-3" />{c.complainant}</span>
          {c.child_name && <span className="inline-flex items-center gap-1 text-indigo-600">{c.child_name}</span>}
          {c.assigned_to && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{c.assigned_to}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <StageChip label="Acknowledgement" clock={c.acknowledgement} />
          <StageChip label="Response" clock={c.response} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComplaintsClockPage() {
  const { data, isLoading, isFetching, refetch } = useComplaintsClock();
  const s = data?.summary;

  return (
    <PageShell
      title="Complaints Clock"
      subtitle="Live countdown to every complaint's statutory acknowledgement and response deadline — so a timescale is never missed (CHR 2015 Reg 39)."
      caraContext={{ pageTitle: "Complaints Clock", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Complaints Clock" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && s && (
          <>
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Clock className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Statutory complaints timescales</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{data.headline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={s.open} label="Open" tone="bg-[var(--cs-bg)] border-[var(--cs-border)] text-[var(--cs-navy)]" Icon={Circle} />
                  <Stat value={s.breached} label="Past deadline" tone="bg-red-50 border-red-200 text-red-800" Icon={AlertOctagon} />
                  <Stat value={s.due_soon} label="Due within 3 days" tone="bg-amber-50 border-amber-200 text-amber-800" Icon={Hourglass} />
                  <Stat value={`${s.response_compliance_rate}%`} label="Responded on time" tone="bg-green-50 border-green-200 text-green-800" Icon={CheckCircle2} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2.5">
              {data.complaints.length === 0 ? (
                <div className="rounded-xl border border-[var(--cs-border)] bg-white px-4 py-10 text-center text-sm text-slate-500">No complaints recorded.</div>
              ) : (
                data.complaints.map((c) => <ComplaintCard key={c.id} c={c} />)
              )}
            </div>

            <p className="text-center text-[11px] text-slate-400">
              Deadlines are taken from each complaint&rsquo;s recorded acknowledgement and response due dates. See the full record in{" "}
              <Link href="/complaints" className="font-semibold text-[var(--cs-teal-strong)] hover:underline">Complaints<ArrowUpRight className="inline h-3 w-3" /></Link>.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
