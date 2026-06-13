"use client";

// CARA — Per-child calendar tab on the young-person profile.
// Everything scheduled for ONE child over the next 90 days — appointments,
// family time, key-working, LAC reviews, linked meetings and child-linked task
// deadlines — projected live from the unified feed (captured once). "Add event"
// opens the calendar editor pre-linked to this child.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, ArrowRight } from "lucide-react";
import { useCalendarFeed } from "@/hooks/use-calendar";
import { EventEditor } from "@/components/calendar/event-editor";
import { SOURCE_COLOR, formatTime } from "@/components/calendar/calendar-bits";
import { CALENDAR_SOURCE_LABELS, type CalendarItem } from "@/lib/calendar/calendar-types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function keyOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dayLabel(dateKey: string, todayKey: string, tomorrowKey: string): string {
  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function Row({ item }: { item: CalendarItem }) {
  return (
    <Link
      href={item.editable ? `/calendar?event=${item.source_id}` : item.href}
      className="flex items-center gap-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-3 py-2 transition-shadow hover:shadow-[var(--cs-shadow-soft)]"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: SOURCE_COLOR[item.source] }} />
      <span className="w-14 shrink-0 text-xs tabular-nums text-[var(--cs-text-gentle)]">
        {item.all_day ? "All day" : formatTime(item.start)}
      </span>
      <span className="flex-1 truncate text-sm text-[var(--cs-navy)]">{item.title}</span>
      <span className="hidden shrink-0 text-[11px] text-[var(--cs-text-muted)] sm:inline">{CALENDAR_SOURCE_LABELS[item.source]}</span>
    </Link>
  );
}

export function ChildCalendarTab({ childId, childName }: { childId: string; childName: string }) {
  const today = useMemo(() => new Date(), []);
  const todayKey = keyOf(today);
  const tomorrowKey = keyOf(new Date(today.getTime() + 864e5));
  const toKey = keyOf(new Date(today.getTime() + 90 * 864e5));
  const [editorOpen, setEditorOpen] = useState(false);

  const { data, isLoading } = useCalendarFeed({ from: todayKey, to: toKey });
  const items = (data?.items ?? []).filter((i) => i.child_id === childId && i.date >= todayKey);

  const grouped = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const arr = m.get(it.date) ?? [];
      arr.push(it);
      m.set(it.date, arr);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" />
          <p className="max-w-xl text-sm text-[var(--cs-text-secondary)]">
            Everything scheduled for {childName} over the next 90 days — appointments, family time,
            key-working, reviews and linked meetings, in one place. Read-only items open in their own
            module; meetings open in the calendar editor.
          </p>
        </div>
        <button
          onClick={() => setEditorOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Add event
        </button>
      </div>

      {isLoading ? (
        <p className="py-6 text-sm text-[var(--cs-text-muted)]">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--cs-text-muted)]">Nothing scheduled for {childName} in the next 90 days.</p>
          <button onClick={() => setEditorOpen(true)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-teal)]">
            <Plus className="h-3.5 w-3.5" /> Plan something
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, dayItems]) => (
            <div key={day}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">
                {dayLabel(day, todayKey, tomorrowKey)}
              </p>
              <div className="space-y-1.5">
                {dayItems.map((it) => <Row key={it.id} item={it} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/calendar" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-teal)] hover:underline">
        Open full calendar <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      <EventEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        defaultDate={todayKey}
        defaultChildId={childId}
      />
    </div>
  );
}
