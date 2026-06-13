"use client";

// CARA — Child chronology tab (auto-built).
// The chronology assembles itself from everything recorded for this child —
// incidents, daily logs, key-working, family time, LAC reviews, health
// appointments, education, missing episodes, risk assessments and manual
// chronology notes — projected live (capture once, surface everywhere). No
// manual upkeep: record anywhere and it appears here.

import React, { useMemo } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Sparkles } from "lucide-react";
import { useChildChronology, type ChronologyItem } from "@/hooks/use-child-chronology";
import { getStaffName } from "@/lib/seed-data";

const SOURCE_LABEL: Record<ChronologyItem["source_type"], string> = {
  care_event: "Care Event",
  incident: "Incident",
  missing_episode: "Missing",
  behaviour_log: "Behaviour",
  key_working: "Key Working",
  daily_log: "Daily Log",
  risk_assessment: "Risk",
  chronology_entry: "Note",
  family_time: "Family Time",
  lac_review: "LAC Review",
  appointment: "Appointment",
  education: "Education",
};

const BAR: Record<ChronologyItem["severity"], string> = {
  critical: "border-l-red-500",
  significant: "border-l-amber-400",
  routine: "border-l-slate-200",
};

function fmtDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function monthKey(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function ChildChronologyTab({ childId, childName }: { childId: string; childName: string }) {
  const { data, isLoading } = useChildChronology({ childId, limit: 80 });
  const items = data?.data ?? [];
  const stats = data?.stats;

  const groups = useMemo(() => {
    const m = new Map<string, ChronologyItem[]>();
    for (const it of items) {
      const k = monthKey(it.date);
      const arr = m.get(k) ?? [];
      arr.push(it);
      m.set(k, arr);
    }
    return [...m.entries()];
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" />
          <p className="max-w-2xl text-sm text-slate-600">
            Auto-built from everything recorded for {childName} — incidents, daily logs, key-working,
            family time, LAC reviews, health appointments, education, missing episodes and risk
            assessments. Record anywhere and it appears here; no manual upkeep.
          </p>
        </div>
        <Link
          href={`/young-people/${childId}/chronology`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Full chronology <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {stats && stats.total > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{stats.total} events</span>
          {stats.critical > 0 && <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">{stats.critical} critical</span>}
          {stats.significant > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">{stats.significant} significant</span>}
        </div>
      )}

      {isLoading ? (
        <p className="py-6 text-sm text-slate-500">Loading chronology…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center">
          <Activity className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Nothing recorded for {childName} yet. As you log incidents, sessions, contact and more, they will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([month, monthItems]) => (
            <div key={month}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{month}</h3>
              <div className="space-y-2">
                {monthItems.map((it) => (
                  <div key={it.id} className={`rounded-2xl border border-slate-100 bg-white p-4 border-l-4 ${BAR[it.severity]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {SOURCE_LABEL[it.source_type]}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{it.title}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{it.summary}</p>
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                        {fmtDate(it.date)}{it.time ? ` · ${it.time}` : ""}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{it.staff_id ? `by ${getStaffName(it.staff_id)}` : ""}</span>
                      {it.links[0] && (
                        <Link href={it.links[0].href} className="text-[11px] font-medium text-[var(--cs-teal)] hover:underline">
                          {it.links[0].label} →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
