"use client";

// CARA — CALENDAR shared pieces: source styling, time formatting, chips, filters

import React from "react";
import type { CalendarItem, CalendarSource } from "@/lib/calendar/calendar-types";
import { CALENDAR_SOURCE_LABELS, ALL_CALENDAR_SOURCES } from "@/lib/calendar/calendar-types";

/** Calm, distinct dot colour per source. */
export const SOURCE_COLOR: Record<CalendarSource, string> = {
  calendar: "#119488",
  task: "#c89b3c",
  appointment: "#3b82a0",
  supervision: "#7c6cc4",
  lac_review: "#c2683f",
  family_time: "#d08a4f",
  interview: "#5a8a6b",
  training: "#b58a2e",
  key_working: "#4a8ca0",
  shift: "#9a9488",
};

export function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "";
  return `${m[1]}:${m[2]}`;
}

export function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function SourceDot({ source }: { source: CalendarSource }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: SOURCE_COLOR[source] }}
      aria-hidden
    />
  );
}

/** Compact event chip for the month grid. */
export function EventChip({ item, onClick }: { item: CalendarItem; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={item.title}
      className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] leading-tight transition-colors hover:bg-[var(--cs-surface)]"
    >
      <SourceDot source={item.source} />
      {!item.all_day && <span className="shrink-0 tabular-nums text-[var(--cs-text-gentle)]">{formatTime(item.start)}</span>}
      <span className="truncate text-[var(--cs-text-secondary)]">{item.title}</span>
    </button>
  );
}

/** Source filter chips with live counts. */
export function SourceFilter({
  active,
  counts,
  onToggle,
}: {
  active: Set<CalendarSource>;
  counts: Record<CalendarSource, number>;
  onToggle: (s: CalendarSource) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_CALENDAR_SOURCES.map((s) => {
        const on = active.has(s);
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              on
                ? "border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] text-[var(--cs-navy)]"
                : "border-transparent bg-[var(--cs-surface)] text-[var(--cs-text-gentle)] opacity-60"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: on ? SOURCE_COLOR[s] : "var(--cs-text-gentle)" }}
            />
            {CALENDAR_SOURCE_LABELS[s]}
            {counts[s] ? <span className="text-[var(--cs-text-gentle)]">{counts[s]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
