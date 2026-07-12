"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TODAY BAND (Command Centre primary surface, part 2)
// Completes the cockpit under the hero: WHO is on now, WHAT is next, and the
// whole-home pulse — then every child as a one-tap chip with a live status dot.
// Same Ask-CARA dark-glass language as the hero. Deterministic data only:
// shifts + children arrive from the dashboard aggregate the page already
// fetched; the calendar and (manager-only) priority-briefing come from their
// existing engines. Nothing invented.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import type { Shift } from "@/types";
import { useCalendarFeed } from "@/hooks/use-calendar";
import { useManagerPriorityBriefing } from "@/hooks/use-manager-priority-briefing";
import { useSystemHealth } from "@/hooks/use-system-health";
import { getStaffName } from "@/lib/seed-data";
import { todayStr } from "@/lib/utils";
import {
  Users, CalendarDays, Radar, ArrowRight, CircleDot, Clock,
} from "lucide-react";

export interface TodayBandChild {
  id: string;
  name: string;
}

// ── Small pieces ───────────────────────────────────────────────────────────────

function ColumnHeader({ icon: Icon, label, href, linkLabel }: { icon: React.ElementType; label: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <Link href={href} className="flex items-center gap-0.5 text-[11.5px] font-semibold text-teal-300 hover:text-teal-200">
        {linkLabel} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-[12.5px] text-slate-500">{children}</p>;
}

// ── On now (today's shifts) ───────────────────────────────────────────────────

function OnNow({ shifts }: { shifts: Shift[] }) {
  const today = todayStr();
  const todays = shifts
    .filter((s) => s.date === today && s.status !== "cancelled" && s.status !== "no_show")
    .sort((a, b) => (a.status === "in_progress" ? -1 : 0) - (b.status === "in_progress" ? -1 : 0) || a.start_time.localeCompare(b.start_time));
  const shown = todays.slice(0, 5);

  return (
    <div>
      <ColumnHeader icon={Users} label="On today" href="/rota" linkLabel="Rota" />
      {shown.length === 0 ? (
        <EmptyLine>No shifts recorded for today — check the rota.</EmptyLine>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((s) => {
            const live = s.status === "in_progress";
            return (
              <li key={s.id} className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                <span className={live ? "relative flex h-2 w-2" : "flex h-2 w-2"}>
                  {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-slate-600"}`} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-200">{getStaffName(s.staff_id)}</span>
                <span className="shrink-0 text-[11.5px] tabular-nums text-slate-500">
                  {s.start_time}–{s.end_time}
                </span>
              </li>
            );
          })}
          {todays.length > shown.length && (
            <li className="px-3 pt-0.5 text-[11.5px] text-slate-500">+{todays.length - shown.length} more on the rota</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Up next (today's calendar) ─────────────────────────────────────────────────

function UpNext() {
  const today = todayStr();
  const feed = useCalendarFeed({ from: today, to: today });
  const items = (feed.data?.items ?? [])
    .filter((i) => i.status !== "cancelled")
    .sort((a, b) => Number(a.all_day) - Number(b.all_day) || a.start.localeCompare(b.start))
    .slice(0, 5);

  return (
    <div>
      <ColumnHeader icon={CalendarDays} label="Up next today" href="/calendar" linkLabel="Calendar" />
      {feed.isLoading ? (
        <div className="space-y-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-[38px] animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : items.length === 0 ? (
        <EmptyLine>Nothing scheduled for the rest of today.</EmptyLine>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.id}>
              <Link
                href={i.href || "/calendar"}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">
                  {i.title}
                  {i.child_name && <span className="text-slate-500"> · {i.child_name}</span>}
                </span>
                <span className="shrink-0 text-[11.5px] tabular-nums text-slate-500">
                  {i.all_day ? "All day" : i.start.slice(11, 16)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Across the home (manager pulse from the 115-engine priority briefing) ──────

const PULSE_TONE: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-rose-400", label: "Critical" },
  elevated: { dot: "bg-amber-300", label: "Elevated" },
  watch: { dot: "bg-amber-200", label: "Watch" },
  stable: { dot: "bg-emerald-400", label: "Stable" },
};

function HomePulse() {
  const briefing = useManagerPriorityBriefing();
  const b = briefing.data;

  return (
    <div>
      <ColumnHeader icon={Radar} label="Across the home" href="/priority-briefing" linkLabel="Briefing" />
      {briefing.isLoading ? (
        <div className="space-y-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-[38px] animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : !b ? (
        <EmptyLine>Priority briefing unavailable right now.</EmptyLine>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${(PULSE_TONE[b.overall_status] ?? PULSE_TONE.stable).dot}`} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-200">
              {(PULSE_TONE[b.overall_status] ?? PULSE_TONE.stable).label} · {b.total_critical} critical · {b.total_high} high
            </span>
          </div>
          <p className="line-clamp-2 px-1 text-[12.5px] leading-snug text-slate-400">{b.headline}</p>
          {b.domains_at_risk.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1 pt-0.5">
              {b.domains_at_risk.slice(0, 4).map((dom) => (
                <span key={dom} className="rounded-full bg-rose-400/10 px-2 py-0.5 text-[10.5px] font-semibold text-rose-200">
                  {dom}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Children strip (every child, one tap, live status dot) ────────────────────

function ChildrenStrip({ childrenList }: { childrenList: TodayBandChild[] }) {
  const { data } = useSystemHealth(); // cache shared with the hero — no extra load
  const issues = data?.data?.issues ?? [];
  const severityFor = (id: string): "critical" | "attention" | "steady" => {
    const mine = issues.filter((i) => i.childId === id);
    if (mine.some((i) => i.severity === "critical" || i.severity === "high")) return "critical";
    if (mine.length > 0) return "attention";
    return "steady";
  };
  const DOT: Record<string, string> = {
    critical: "bg-rose-400",
    attention: "bg-amber-300",
    steady: "bg-emerald-400",
  };

  if (childrenList.length === 0) return null;
  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        <CircleDot className="h-3.5 w-3.5" /> Your children
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const sev = severityFor(c.id);
          return (
            <Link
              key={c.id}
              href={`/young-people/${c.id}`}
              className="group flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-300/30 to-indigo-400/30 text-[12px] font-bold text-white">
                {c.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-[13px] font-medium text-slate-200 group-hover:text-white">{c.name}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${DOT[sev]}`} aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── The band ───────────────────────────────────────────────────────────────────

export function TodayBand({
  shifts,
  childrenList,
  showPulse,
}: {
  shifts: Shift[];
  childrenList: TodayBandChild[];
  showPulse: boolean;
}) {
  return (
    <section
      aria-label="Today"
      className="animate-fade-in overflow-hidden rounded-[24px] border border-white/[0.08] p-5 text-white shadow-[0_30px_80px_-30px_rgba(3,6,15,0.9)] sm:p-6"
      style={{
        background:
          "radial-gradient(110% 80% at 0% -10%, rgba(45,212,191,0.10) 0%, transparent 45%)," +
          "linear-gradient(180deg, #0b1020 0%, #0c1226 60%, #0e1730 100%)",
      }}
    >
      <div className={`grid gap-5 ${showPulse ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <OnNow shifts={shifts} />
        <UpNext />
        {showPulse && <HomePulse />}
      </div>
      <ChildrenStrip childrenList={childrenList} />
    </section>
  );
}
