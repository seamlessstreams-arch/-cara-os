"use client";

// CARA — Dashboard "This week" card: the next 7 days from the unified calendar.
// Surfaces planned meetings AND projected dated records where managers land,
// deep-linking into /calendar. Read-only summary — the calendar owns editing.

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { CalendarDays, ArrowRight } from "lucide-react";
import { SOURCE_COLOR, formatTime } from "@/components/calendar/calendar-bits";
import { type CalendarItem, type CalendarFeed } from "@/lib/calendar/calendar-types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function keyOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dayLabel(dateKey: string, todayKey: string, tomorrowKey: string): string {
  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function Row({ item }: { item: CalendarItem }) {
  return (
    <Link
      href={item.editable ? `/calendar?event=${item.source_id}` : item.href}
      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--cs-surface)]"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: SOURCE_COLOR[item.source] }} />
      <span className="w-12 shrink-0 text-xs tabular-nums text-[var(--cs-text-gentle)]">
        {item.all_day ? "All day" : formatTime(item.start)}
      </span>
      <span className="flex-1 truncate text-sm text-[var(--cs-navy)]">{item.title}</span>
      {item.child_name && <span className="hidden shrink-0 text-xs text-[var(--cs-text-muted)] sm:inline">{item.child_name}</span>}
    </Link>
  );
}

function UpcomingWeekCardInner() {
  const today = useMemo(() => new Date(), []);
  const todayKey = keyOf(today);
  const tomorrowKey = keyOf(new Date(today.getTime() + 864e5));
  const toKey = keyOf(new Date(today.getTime() + 7 * 864e5));

  // Shifts excluded — high volume; this is a planning glance, not a rota.
  async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
    return json.data as T;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-feed", todayKey, toKey, "calendar,task,appointment,supervision,lac_review,family_time,interview,training,key_working"],
    queryFn: () => {
      const params = new URLSearchParams({ from: todayKey, to: toKey });
      const sources = ["calendar", "task", "appointment", "supervision", "lac_review", "family_time", "interview", "training", "key_working"];
      if (sources && sources.length) params.set("sources", sources.join(","));
      return jfetch<CalendarFeed>(`/api/v1/calendar?${params.toString()}`);
    },
  });

  const upcoming = (data?.items ?? []).filter((i) => i.date >= todayKey);
  const grouped = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of upcoming.slice(0, 8)) {
      const arr = m.get(it.date) ?? [];
      arr.push(it);
      m.set(it.date, arr);
    }
    return [...m.entries()];
  }, [upcoming]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-[var(--cs-teal)]" />
          This week
          {upcoming.length > 0 && (
            <span className="rounded-full bg-[var(--cs-surface)] px-2 py-0.5 text-xs font-medium text-[var(--cs-text-muted)]">
              {upcoming.length}
            </span>
          )}
        </CardTitle>
        <Link href="/calendar" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">
          Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">Loading…</p>
        ) : grouped.length === 0 ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">Nothing scheduled in the next 7 days.</p>
        ) : (
          <div className="space-y-3">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <p className="mb-0.5 px-2 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">
                  {dayLabel(day, todayKey, tomorrowKey)}
                </p>
                <div className="space-y-0.5">
                  {items.map((it) => <Row key={it.id} item={it} />)}
                </div>
              </div>
            ))}
            {upcoming.length > 8 && (
              <Link href="/calendar" className="block px-2 text-xs font-medium text-[var(--cs-teal)] hover:underline">
                +{upcoming.length - 8} more this week
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingWeekCard() {
  return (
    <CardErrorBoundary>
      <UpcomingWeekCardInner />
    </CardErrorBoundary>
  );
}
