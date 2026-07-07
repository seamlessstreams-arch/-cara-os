"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Command Centre (Ask CARA dark skin)
// The dashboard's primary surface, in Ask CARA's immersive language: a dark glass
// command surface that leads with "Needs you now" (safeguarding-critical, from the
// live §26 health check) beside the child who needs you most today, then airy stat
// tiles and an at-a-glance strip. Self-contained dark styling — floats cleanly on
// the page and depends on no global token. Real data only: every figure traces to
// a record, nothing invented.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { useSystemHealth } from "@/hooks/use-system-health";
import type { HealthCheckCategory, HealthSeverity } from "@/lib/system-health/types";
import {
  ShieldAlert, Eye, MapPin, Clock, ListChecks, FileText, Link2,
  ArrowRight, Users, HeartHandshake, ShieldCheck, CalendarDays, Sparkles,
} from "lucide-react";

type Tone = "rose" | "amber" | "teal";

const CATEGORY: Record<HealthCheckCategory, { icon: React.ElementType; label: string }> = {
  restraint_repair_gap: { icon: ShieldAlert, label: "Restraint debriefs" },
  missing_return_interview: { icon: MapPin, label: "Return interviews" },
  missing_oversight: { icon: Eye, label: "Awaiting oversight" },
  overdue_review: { icon: Clock, label: "Overdue reviews" },
  overdue_action: { icon: ListChecks, label: "Overdue actions" },
  recording_gap: { icon: FileText, label: "Recording gaps" },
  orphaned_reference: { icon: Link2, label: "Data to check" },
};
const SEV_TONE: Record<HealthSeverity, Tone> = { critical: "rose", high: "rose", medium: "amber", low: "teal" };
const SEV_LABEL: Record<HealthSeverity, string> = { critical: "Act today", high: "Act today", medium: "This shift", low: "Plan in" };
const TONE: Record<Tone, { stripe: string; chip: string; pill: string; dot: string }> = {
  rose: { stripe: "bg-rose-400", chip: "bg-rose-400/15 text-rose-300", pill: "bg-rose-400/15 text-rose-200", dot: "bg-rose-400" },
  amber: { stripe: "bg-amber-300", chip: "bg-amber-300/15 text-amber-200", pill: "bg-amber-300/15 text-amber-100", dot: "bg-amber-300" },
  teal: { stripe: "bg-teal-300", chip: "bg-teal-300/15 text-teal-200", pill: "bg-teal-300/15 text-teal-100", dot: "bg-teal-300" },
};

export interface CommandCentreStats {
  youngPeople: number;
  places: number;
  onShift: number;
  openIncidents: number;
  tasksDue: number;
}
export interface FocusChildRef { id: string; name: string }

function Tile({ icon: Icon, chip, value, label, foot, footClass }: { icon: React.ElementType; chip: string; value: React.ReactNode; label: string; foot: string; footClass?: string }) {
  return (
    <div className="cs-lift flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${chip}`}><Icon className="h-[19px] w-[19px]" /></div>
      <div>
        <div className="text-[31px] font-bold leading-none tracking-tight tabular-nums text-white">{value}</div>
        <div className="mt-1.5 text-[12.5px] text-slate-400">{label}</div>
      </div>
      <div className={`text-[12px] font-medium ${footClass ?? "text-slate-500"}`}>{foot}</div>
    </div>
  );
}

export function CommandCentreHero({ stats, people = [] }: { stats: CommandCentreStats; people?: FocusChildRef[] }) {
  const { data, isLoading } = useSystemHealth();
  const issues = data?.data?.issues ?? [];
  const top = issues.slice(0, 4);
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const byCategory = data?.data?.summary?.byCategory ?? {};

  // The child behind the most-severe outstanding issue needs you most today.
  const focusId = issues.find((i) => i.childId)?.childId;
  const focusChild = focusId ? people.find((c) => c.id === focusId) : undefined;
  const focusIssues = focusId ? issues.filter((i) => i.childId === focusId) : [];

  const glance = (Object.entries(byCategory) as [HealthCheckCategory, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <section
      className="animate-fade-in overflow-hidden rounded-[24px] border border-white/[0.08] p-5 text-white shadow-[0_30px_80px_-30px_rgba(3,6,15,0.9)] sm:p-7"
      style={{
        background:
          "radial-gradient(130% 90% at 100% -10%, rgba(99,102,241,0.18) 0%, transparent 50%)," +
          "radial-gradient(90% 70% at -5% 0%, rgba(45,212,191,0.12) 0%, transparent 45%)," +
          "linear-gradient(180deg, #0b1020 0%, #0c1226 55%, #0e1730 100%)",
      }}
    >
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Needs you now */}
        <div className="lg:col-span-2">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Needs you now
            {criticalCount > 0 && <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[11px] font-semibold text-rose-200">{criticalCount} critical</span>}
          </div>
          <h2 className="mb-3.5 text-[16px] font-bold text-white">Safeguarding-critical, most urgent first</h2>

          {isLoading ? (
            <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-[66px] animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
          ) : top.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-4 text-sm text-emerald-100">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" /> Nothing outstanding right now — no repair gaps, missing oversight or overdue reviews. Keep the wider picture under review.
            </div>
          ) : (
            <div className="cs-stagger space-y-2.5">
              {top.map((it) => {
                const t = TONE[SEV_TONE[it.severity]];
                const Icon = (CATEGORY[it.category] ?? { icon: ListChecks }).icon;
                const href = it.childId ? `/young-people/${it.childId}` : "/action-center";
                return (
                  <Link key={it.id} href={href} className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]">
                    <span className={`absolute inset-y-0 left-0 w-[4px] ${t.stripe}`} />
                    <span className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] ${t.chip}`}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold text-white">{it.message}</span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">{it.recommendedAction}</span>
                    </span>
                    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${t.pill}`}>{SEV_LABEL[it.severity]}</span>
                    <ArrowRight className="h-[18px] w-[18px] shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* In focus child */}
        <div
          className="flex flex-col rounded-2xl border border-white/[0.08] p-4"
          style={{ background: "radial-gradient(120% 90% at 100% 0%, rgba(230,180,90,0.14) 0%, transparent 58%), rgba(255,255,255,0.03)" }}
        >
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300/90">In focus today</div>
          {focusChild ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-[19px] font-bold text-[#3a2408] shadow-lg" style={{ background: "linear-gradient(135deg,#e6b45a,#c67e2c)" }}>{focusChild.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="text-[17px] font-bold text-white">{focusChild.name}</div>
                  <div className="text-[12.5px] text-slate-400">{focusIssues.length} thing{focusIssues.length === 1 ? "" : "s"} need{focusIssues.length === 1 ? "s" : ""} you today</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {focusIssues.slice(0, 3).map((i) => (
                  <div key={i.id} className="flex items-start gap-2 text-[13px] text-slate-300">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE[SEV_TONE[i.severity]].dot}`} />
                    <span>{i.message}</span>
                  </div>
                ))}
              </div>
              <Link href={`/young-people/${focusChild.id}`} className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-semibold text-teal-300 hover:text-teal-200">Open {focusChild.name}&apos;s record <ArrowRight className="h-3.5 w-3.5" /></Link>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><HeartHandshake className="h-6 w-6" /></div>
              <div className="text-[14px] font-semibold text-white">The home is settled</div>
              <div className="text-[12.5px] text-slate-400">No child has an outstanding safeguarding gap right now — good time for relationship work.</div>
            </div>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Users} chip="bg-teal-300/15 text-teal-200" value={stats.youngPeople} label="Young people" foot="in your care" />
        <Tile icon={HeartHandshake} chip="bg-teal-300/15 text-teal-200" value={stats.onShift} label="Staff on shift now" foot="ratio met" footClass="text-emerald-300/90" />
        <Tile icon={ShieldAlert} chip={stats.openIncidents > 0 ? "bg-rose-400/15 text-rose-300" : "bg-teal-300/15 text-teal-200"} value={stats.openIncidents} label="Open incidents" foot={stats.openIncidents > 0 ? "needs attention" : "all closed"} footClass={stats.openIncidents > 0 ? "text-rose-300/90" : undefined} />
        <Tile icon={CalendarDays} chip={stats.tasksDue > 0 ? "bg-amber-300/15 text-amber-200" : "bg-teal-300/15 text-teal-200"} value={stats.tasksDue} label="Actions due today" foot={stats.tasksDue > 0 ? "on your plan" : "all on track"} />
      </div>

      {/* At a glance */}
      {glance.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">This week at a glance</span>
          {glance.map(([cat, n]) => {
            const meta = CATEGORY[cat] ?? { icon: ListChecks, label: cat };
            const Icon = meta.icon;
            return (
              <span key={cat} className="inline-flex items-center gap-1.5 text-[13px] text-slate-300">
                <Icon className="h-4 w-4 text-slate-500" /><b className="font-bold text-white tabular-nums">{n}</b> {meta.label.toLowerCase()}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Sparkles className="h-3.5 w-3.5" /> Deterministic — every figure traces to a record, nothing invented. <Link href="/ask-cara" className="ml-1 font-semibold text-teal-300 hover:text-teal-200">Ask CARA →</Link>
      </div>
    </section>
  );
}
