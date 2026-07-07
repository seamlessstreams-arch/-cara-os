"use client";

// CARA — CALENDAR page: month + agenda views over the unified feed

import React, { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List, ExternalLink, Send, Download, X, Ban } from "lucide-react";
import Link from "next/link";
import { useCalendarFeed, useEventDetail, useSendInvite, useCancelCalendarEvent } from "@/hooks/use-calendar";
import { EventEditor } from "@/components/calendar/event-editor";
import { MonthGrid } from "@/components/calendar/calendar-month";
import { SourceFilter, SourceDot, formatTime, formatDayLabel } from "@/components/calendar/calendar-bits";
import { ALL_CALENDAR_SOURCES, CALENDAR_SOURCE_LABELS, type CalendarItem, type CalendarSource } from "@/lib/calendar/calendar-types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function keyOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** 42-day Monday-first grid window for a month, as inclusive YYYY-MM-DD bounds. */
function gridRange(monthStart: Date) {
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const from = new Date(first);
  from.setDate(first.getDate() - offset);
  const to = new Date(from);
  to.setDate(from.getDate() + 41);
  return { from: keyOf(from), to: keyOf(to) };
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const todayKey = keyOf(today);
  const [monthStart, setMonthStart] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<"month" | "agenda">("month");
  const [active, setActive] = useState<Set<CalendarSource>>(
    // Shifts off by default — high volume, opt-in.
    new Set(ALL_CALENDAR_SOURCES.filter((s) => s !== "shift")),
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  const range = useMemo(() => gridRange(monthStart), [monthStart]);
  const sources = useMemo(() => [...active], [active]);
  const feed = useCalendarFeed({ from: range.from, to: range.to, sources });

  // Deep-link: /calendar?event=ID opens that editable event
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ev = params.get("event");
    if (ev) {
      setEditingId(ev);
      setEditorOpen(true);
    }
  }, []);

  const items = feed.data?.items ?? [];
  const itemsByDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const arr = m.get(it.date) ?? [];
      arr.push(it);
      m.set(it.date, arr);
    }
    return m;
  }, [items]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(ALL_CALENDAR_SOURCES.map((s) => [s, 0])) as Record<CalendarSource, number>;
    for (const it of items) c[it.source] += 1;
    return c;
  }, [items]);

  const monthLabel = monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const shiftMonth = (delta: number) => setMonthStart((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const toggleSource = (s: CalendarSource) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const editingEvent = useEventDetail(editorOpen ? editingId : null);

  const dayItems = selectedDay ? itemsByDay.get(selectedDay) ?? [] : [];

  return (
    <PageShell
      darkBody
      title="Calendar"
      subtitle="Plan meetings and appointments — and see every dated record in one place, captured once."
      showQuickCreate={false}
      actions={
        <button
          onClick={() => { setEditingId(null); setEditorOpen(true); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New event
        </button>
      }
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className="rounded-lg border border-[var(--cs-border)] p-1.5 text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="min-w-[160px] text-center text-sm font-bold text-[var(--cs-navy)]">{monthLabel}</h2>
            <button onClick={() => shiftMonth(1)} className="rounded-lg border border-[var(--cs-border)] p-1.5 text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setMonthStart(new Date(today.getFullYear(), today.getMonth(), 1))} className="ml-1 rounded-lg border border-[var(--cs-border)] px-3 py-1.5 text-xs font-semibold text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
              Today
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--cs-border)] p-0.5">
            <button onClick={() => setView("month")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${view === "month" ? "bg-[var(--cs-surface)] text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]"}`}>
              <CalendarDays className="h-3.5 w-3.5" /> Month
            </button>
            <button onClick={() => setView("agenda")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${view === "agenda" ? "bg-[var(--cs-surface)] text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]"}`}>
              <List className="h-3.5 w-3.5" /> Agenda
            </button>
          </div>
        </div>

        <SourceFilter active={active} counts={counts} onToggle={toggleSource} />

        {feed.isError && (
          <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load the calendar: {(feed.error as Error).message}</CardContent></Card>
        )}

        {/* Views */}
        {view === "month" ? (
          <MonthGrid
            monthStart={monthStart}
            itemsByDay={itemsByDay}
            todayKey={todayKey}
            onSelectItem={(it) => (it.editable ? (setEditingId(it.source_id), setEditorOpen(true)) : setSelectedItem(it))}
            onSelectDay={(d) => setSelectedDay(d)}
          />
        ) : (
          <AgendaView items={items} onSelect={(it) => (it.editable ? (setEditingId(it.source_id), setEditorOpen(true)) : setSelectedItem(it))} />
        )}
      </div>

      {/* Day panel */}
      {selectedDay && (
        <SidePanel title={formatDayLabel(selectedDay)} onClose={() => setSelectedDay(null)}>
          {dayItems.length === 0 ? (
            <p className="text-sm text-[var(--cs-text-muted)]">Nothing scheduled.</p>
          ) : (
            <div className="space-y-1.5">
              {dayItems.map((it) => (
                <ItemRow key={it.id} item={it} onClick={() => { setSelectedDay(null); it.editable ? (setEditingId(it.source_id), setEditorOpen(true)) : setSelectedItem(it); }} />
              ))}
            </div>
          )}
          <button onClick={() => { setSelectedDay(null); setEditingId(null); setEditorOpen(true); }} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-teal)]">
            <Plus className="h-3.5 w-3.5" /> Add to this day
          </button>
        </SidePanel>
      )}

      {/* Projected-item detail (read-only, with deep-link) */}
      {selectedItem && (
        <SidePanel title={selectedItem.title} onClose={() => setSelectedItem(null)}>
          <div className="space-y-2 text-sm">
            <DetailRow label="When" value={selectedItem.all_day ? formatDayLabel(selectedItem.date) : `${formatDayLabel(selectedItem.date)} · ${formatTime(selectedItem.start)}`} />
            <DetailRow label="Type" value={CALENDAR_SOURCE_LABELS[selectedItem.source]} />
            {selectedItem.child_name && <DetailRow label="Young person" value={selectedItem.child_name} />}
            {selectedItem.staff_name && <DetailRow label="Staff" value={selectedItem.staff_name} />}
            {selectedItem.location && <DetailRow label="Location" value={selectedItem.location} />}
            {selectedItem.status && <DetailRow label="Status" value={selectedItem.status} />}
          </div>
          <div className="mt-3 rounded-lg bg-[var(--cs-surface)] px-3 py-2 text-xs text-[var(--cs-text-muted)]">
            This is a live view of a {CALENDAR_SOURCE_LABELS[selectedItem.source].toLowerCase()} record — edit it in its own module.
          </div>
          <Link href={selectedItem.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-teal)]">
            Open in {CALENDAR_SOURCE_LABELS[selectedItem.source]} <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </SidePanel>
      )}

      <EventEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingId(null); }}
        defaultDate={selectedDay ?? todayKey}
        editing={editingId ? editingEvent.data?.event ?? null : null}
        onSaved={() => {}}
      />

      {/* Invite/cancel actions live in the editor's footer via the detail event */}
      {editingId && editorOpen && editingEvent.data?.event && (
        <EventActions eventId={editingId} />
      )}
    </PageShell>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AgendaView({ items, onSelect }: { items: CalendarItem[]; onSelect: (it: CalendarItem) => void }) {
  const groups = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const arr = m.get(it.date) ?? [];
      arr.push(it);
      m.set(it.date, arr);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [items]);

  if (items.length === 0) {
    return <Card><CardContent className="py-10 text-center text-sm text-[var(--cs-text-muted)]">Nothing scheduled in this range.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {groups.map(([day, dayItems]) => (
        <div key={day}>
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{formatDayLabel(day)}</h3>
          <div className="space-y-1.5">
            {dayItems.map((it) => <ItemRow key={it.id} item={it} onClick={() => onSelect(it)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemRow({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-left transition-shadow hover:shadow-[var(--cs-shadow-soft)]">
      <SourceDot source={item.source} />
      <span className="w-12 shrink-0 text-xs tabular-nums text-[var(--cs-text-gentle)]">{item.all_day ? "All day" : formatTime(item.start)}</span>
      <span className="flex-1 truncate text-sm text-[var(--cs-navy)]">{item.title}</span>
      {item.child_name && <span className="hidden shrink-0 text-xs text-[var(--cs-text-muted)] sm:inline">{item.child_name}</span>}
      {item.editable && <span className="shrink-0 rounded-full bg-[var(--cs-teal-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--cs-teal)]">Editable</span>}
    </button>
  );
}

function SidePanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-[var(--cs-surface-elevated)] shadow-[var(--cs-shadow-card)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-5 py-3">
          <h2 className="truncate pr-2 text-sm font-bold text-[var(--cs-navy)]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p><span className="text-[var(--cs-text-muted)]">{label}:</span> <span className="font-medium capitalize text-[var(--cs-navy)]">{value}</span></p>
  );
}

/** Invite/cancel actions for an open editable event (rendered as a floating bar). */
function EventActions({ eventId }: { eventId: string }) {
  const invite = useSendInvite();
  const cancel = useCancelCalendarEvent();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 shadow-[var(--cs-shadow-card)]">
      <a href={`/api/v1/calendar/${eventId}/invite`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]">
        <Download className="h-3.5 w-3.5" /> Download .ics
      </a>
      <button
        onClick={() => invite.mutate(eventId, { onSuccess: (d) => { setMsg(`Notified ${d.notified_staff} staff`); if (d.mailto) window.location.href = d.mailto; } })}
        disabled={invite.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-teal)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" /> {invite.isPending ? "Preparing…" : "Send invite"}
      </button>
      <button
        onClick={() => cancel.mutate(eventId, { onSuccess: () => setMsg("Event cancelled") })}
        disabled={cancel.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--cs-warning)] hover:bg-[var(--cs-warning-bg)] disabled:opacity-50"
      >
        <Ban className="h-3.5 w-3.5" /> Cancel event
      </button>
      {msg && <span className="text-[11px] text-[var(--cs-text-muted)]">{msg}</span>}
    </div>
  );
}
