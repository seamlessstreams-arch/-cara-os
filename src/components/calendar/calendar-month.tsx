"use client";

// CARA — CALENDAR month grid

import React, { useMemo } from "react";
import type { CalendarItem } from "@/lib/calendar/calendar-types";
import { EventChip } from "./calendar-bits";

export interface MonthGridProps {
  /** First day of the visible month (local). */
  monthStart: Date;
  itemsByDay: Map<string, CalendarItem[]>;
  todayKey: string;
  onSelectItem: (item: CalendarItem) => void;
  onSelectDay: (dateKey: string) => void;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthGrid({ monthStart, itemsByDay, todayKey, onSelectItem, onSelectDay }: MonthGridProps) {
  const cells = useMemo(() => {
    const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - offset);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push(d);
    }
    return out;
  }, [monthStart]);

  const thisMonth = monthStart.getMonth();

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)]">
      <div className="grid grid-cols-7 border-b border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = dayKey(d);
          const items = itemsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isOtherMonth = d.getMonth() !== thisMonth;
          const shown = items.slice(0, 4);
          const overflow = items.length - shown.length;
          return (
            <div
              key={key + i}
              className={`min-h-[104px] border-b border-r border-[var(--cs-border-subtle)] p-1.5 ${
                isOtherMonth ? "bg-[var(--cs-surface)]/40" : "bg-[var(--cs-surface-elevated)]"
              } ${i % 7 === 6 ? "border-r-0" : ""}`}
            >
              <button
                onClick={() => onSelectDay(key)}
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isToday
                    ? "bg-[var(--cs-teal)] text-white"
                    : isOtherMonth
                      ? "text-[var(--cs-text-gentle)]"
                      : "text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]"
                }`}
              >
                {d.getDate()}
              </button>
              <div className="space-y-0.5">
                {shown.map((it) => (
                  <EventChip key={it.id} item={it} onClick={() => onSelectItem(it)} />
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => onSelectDay(key)}
                    className="px-1.5 text-[11px] font-medium text-[var(--cs-teal)] hover:underline"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
